#!/usr/bin/env node

// Purpose: Check the README's goal gates without marking unfinished work complete.
const { spawnSync } = require('node:child_process');
const { mkdtempSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { isAbsolute, join, resolve } = require('node:path');

const TOOLING_FILES = [
  'package.json',
  'tsconfig.json',
  'vitest.config.ts',
  'eslint.config.js',
  'prettier.config.js',
];

const GOALS = [
  {
    id: 'G1',
    name: 'Tooling',
    prerequisites: [],
    files: TOOLING_FILES,
    tests: ['tests/tooling.test.ts'],
  },
  {
    id: 'G2',
    name: 'Configuration and errors',
    prerequisites: ['G1'],
    files: ['src/config.ts', 'src/errors.ts', '.env.example'],
    tests: ['tests/config.test.ts', 'tests/errors.test.ts'],
  },
  {
    id: 'G3',
    name: 'SQLite connections and migrations',
    prerequisites: ['G1'],
    files: ['src/db/connection.ts', 'src/db/migrate.ts', 'migrations/001-create-todos.sql'],
    tests: ['tests/db/connection.test.ts', 'tests/db/migrate.test.ts'],
  },
  {
    id: 'G4',
    name: 'Types and validation',
    prerequisites: ['G1'],
    files: ['src/validation/todo-schemas.ts'],
    tests: ['tests/validation/todo-schemas.test.ts'],
  },
  {
    id: 'G5',
    name: 'Transactional repository',
    prerequisites: ['G3', 'G4'],
    files: ['src/db/todo-repository.ts'],
    tests: ['tests/db/todo-repository.test.ts'],
  },
  {
    id: 'G6',
    name: 'Business rules and lifecycle',
    prerequisites: ['G2', 'G4', 'G5'],
    files: ['src/services/todo-service.ts'],
    tests: ['tests/services/todo-service.test.ts'],
  },
  {
    id: 'G7',
    name: 'JSON API',
    prerequisites: ['G2', 'G6'],
    files: ['src/app.ts', 'src/routes/api-todos.ts', 'tests/helpers/test-app.ts'],
    tests: ['tests/routes/api-todos.test.ts', 'tests/routes/health.test.ts'],
  },
  {
    id: 'G8',
    name: 'HTML forms and HTMX',
    prerequisites: ['G7'],
    files: [
      'src/routes/web-todos.ts',
      'src/views/layout.njk',
      'src/views/index.njk',
      'src/views/partials/todo-form.njk',
      'src/views/partials/todo-list.njk',
      'src/views/partials/todo-row.njk',
      'public/styles.css',
    ],
    tests: ['tests/routes/web-todos.test.ts'],
  },
  {
    id: 'G9',
    name: 'Server startup and shutdown',
    prerequisites: ['G3', 'G7', 'G8'],
    files: ['src/server.ts'],
    tests: ['tests/server.test.ts', 'tests/routes/health.test.ts'],
    manual:
      'Run npm run dev with a disposable database, check /health, and verify shutdown releases its port/resources.',
  },
  {
    id: 'G10',
    name: 'Fresh-checkout and browser acceptance',
    prerequisites: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9'],
    files: ['README.md'],
    tests: [],
    manual:
      'Verify fresh-checkout setup, production/dev startup, HTTP smoke checks, persistence across restart, browser/HTMX and JavaScript-disabled workflows, keyboard/narrow-screen access, screenshots, and tracked-file hygiene (README G10).',
  },
];

function inspectFiles(root, files) {
  const problems = [];
  for (const file of files) {
    try {
      const content = readFileSync(join(root, file), 'utf8');
      if (!content.trim() || /planning placeholder only/i.test(content)) {
        problems.push(`unfinished: ${file}`);
      }
    } catch (error) {
      problems.push(`${error.code === 'ENOENT' ? 'missing' : 'unreadable'}: ${file}`);
    }
  }
  return problems;
}

function runCommand(root, args) {
  return spawnSync('npm', args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, CI: 'true' },
    timeout: 120_000,
    maxBuffer: 4 * 1024 * 1024,
  });
}

function commandFailure(result) {
  if (result.error) return result.error.message;
  if (result.signal) return `terminated by ${result.signal}`;
  const output = `${result.stderr || ''}\n${result.stdout || ''}`.trim();
  return `exit ${result.status}${output ? `: ${output.slice(-1200).replace(/\s+/g, ' ')}` : ''}`;
}

function testReportProblems(root, expectedFiles, report) {
  if (
    report.success !== true ||
    !(report.numPassedTests > 0) ||
    report.numFailedTests !== 0 ||
    report.numPendingTests !== 0 ||
    report.numTodoTests !== 0 ||
    !Array.isArray(report.testResults) ||
    report.testResults.length === 0
  ) {
    return ['test report must show passing tests with no failures, skips, or todos'];
  }

  const problems = [];
  const reportedFiles = new Set();
  for (const file of report.testResults) {
    if (typeof file.name !== 'string') {
      problems.push('test report contains an unnamed file');
      continue;
    }
    const filePath = isAbsolute(file.name) ? file.name : resolve(root, file.name);
    reportedFiles.add(filePath);
    if (
      file.status !== 'passed' ||
      !Array.isArray(file.assertionResults) ||
      file.assertionResults.length === 0 ||
      file.assertionResults.some((test) => test.status !== 'passed')
    ) {
      problems.push(`no fully passing tests: ${file.name}`);
    }
  }
  for (const file of expectedFiles) {
    if (!reportedFiles.has(resolve(root, file))) {
      problems.push(`required test file was not executed: ${file}`);
    }
  }
  return problems;
}

function checkTests(root, files, fullSuite, execute) {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'todo-goals-'));
  const reportPath = join(temporaryDirectory, 'vitest.json');
  try {
    const args = [
      'test',
      '--',
      ...(fullSuite ? [] : files),
      '--reporter=json',
      `--outputFile=${reportPath}`,
      '--passWithNoTests=false',
      '--allowOnly=false',
      '--expect.requireAssertions=true',
    ];
    const result = execute(root, args);
    const problems = [];
    if (result.status !== 0 || result.error || result.signal) {
      problems.push(`npm test: ${commandFailure(result)}`);
    }
    try {
      const report = JSON.parse(readFileSync(reportPath, 'utf8'));
      problems.push(...testReportProblems(root, files, report));
      // JSON-only reporters put test failure details in the report, not stderr.
      for (const file of report.testResults || []) {
        for (const test of file.assertionResults || []) {
          if (test.status === 'failed' && test.failureMessages?.length) {
            const message = test.failureMessages[0].replace(/\s+/g, ' ').slice(0, 400);
            problems.push(`${test.fullName || file.name}: ${message}`);
            break;
          }
        }
      }
    } catch {
      problems.push('npm test did not produce a valid Vitest JSON report');
    }
    return problems;
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function checkGoals({
  root = resolve(__dirname, '..'),
  execute = runCommand,
  nodeVersion = process.versions.node,
} = {}) {
  const toolingProblems = inspectFiles(root, TOOLING_FILES);
  try {
    const requiredVersion = readFileSync(join(root, '.nvmrc'), 'utf8').trim().replace(/^v/, '');
    if (nodeVersion !== requiredVersion) {
      toolingProblems.push(
        `Node ${requiredVersion} required by .nvmrc; running ${nodeVersion} (run nvm use)`,
      );
    }
  } catch {
    toolingProblems.push('missing or unreadable: .nvmrc');
  }

  // Do not execute placeholder tooling: an unconfigured tsc can emit beside src files.
  const gates = [];
  if (toolingProblems.length === 0) {
    for (const script of ['build', 'lint']) {
      const result = execute(root, ['run', script]);
      gates.push({
        command: `npm run ${script}`,
        passed: result.status === 0 && !result.error && !result.signal,
        reason:
          result.status === 0 && !result.error && !result.signal
            ? 'passed'
            : commandFailure(result),
      });
    }
  }

  const results = [];
  const allTests = [...new Set(GOALS.flatMap((goal) => goal.tests))];
  for (const goal of GOALS) {
    const prerequisites = results.filter((result) => goal.prerequisites.includes(result.id));
    const blocked = prerequisites.filter((result) => ['failed', 'blocked'].includes(result.status));
    if (blocked.length > 0) {
      results.push({
        ...goal,
        status: 'blocked',
        reasons: [`unmet prerequisites: ${blocked.map((result) => result.id).join(', ')}`],
      });
      continue;
    }

    const expectedTests = goal.id === 'G10' ? allTests : goal.tests;
    const problems = [
      ...(goal.id === 'G1' ? toolingProblems : []),
      ...inspectFiles(root, [...goal.files, ...expectedTests]),
      ...gates.filter((gate) => !gate.passed).map((gate) => `${gate.command}: ${gate.reason}`),
    ];
    if (problems.length === 0) {
      problems.push(...checkTests(root, expectedTests, goal.id === 'G10', execute));
    }
    if (problems.length > 0) {
      results.push({
        ...goal,
        status: 'failed',
        reasons: [...new Set(problems)],
      });
      continue;
    }

    const pending = prerequisites.filter((result) => result.status === 'needs manual verification');
    const reasons = [
      ...(goal.manual ? [goal.manual] : []),
      ...(pending.length
        ? [`manual prerequisites pending: ${pending.map((result) => result.id).join(', ')}`]
        : []),
    ];
    results.push({
      ...goal,
      status: reasons.length ? 'needs manual verification' : 'verified',
      reasons: reasons.length ? reasons : ['required files, build, lint, and focused tests passed'],
    });
  }
  return {
    gates,
    results,
    verified: results.filter((result) => result.status === 'verified').length,
  };
}

function formatReport(report) {
  const lines = [
    `${report.verified} of ${report.results.length} goals verified by automated gates.`,
    '',
  ];
  for (const gate of report.gates) {
    lines.push(`${gate.command}: ${gate.passed ? 'passed' : `failed (${gate.reason})`}`);
  }
  if (report.gates.length === 0)
    lines.push('Build/lint not run: tooling prerequisites are unfinished or unavailable.');
  lines.push('');
  for (const result of report.results) {
    lines.push(`${result.id} ${result.name}: ${result.status}`);
    for (const reason of result.reasons) lines.push(`  ${reason}`);
  }
  lines.push(
    '',
    'G9 requires live-server verification; G10 also requires fresh-checkout and browser acceptance. See README.',
  );
  return lines.join('\n');
}

if (require.main === module) {
  try {
    const report = checkGoals();
    console.log(formatReport(report));
    process.exitCode = report.results.some((result) =>
      ['failed', 'blocked'].includes(result.status),
    )
      ? 1
      : 0;
  } catch (error) {
    console.error(`Goal checker failed: ${error.message}`);
    process.exitCode = 2;
  }
}

module.exports = { GOALS, checkGoals, formatReport };

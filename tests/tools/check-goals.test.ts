// Purpose: Verify goal accounting without running app commands or touching developer data.
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { GOALS, checkGoals, formatReport } = require('../../tools/check-goals.cjs');

let root: string;
const temporaryDirectories: string[] = [];
const expectedTests: string[] = [
  ...new Set<string>(GOALS.flatMap((goal: { tests: string[] }) => goal.tests)),
];

function writeFile(file: string, content: string) {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), content);
}

function passingReport(files: string[]) {
  return {
    success: true,
    numPassedTests: files.length,
    numFailedTests: 0,
    numPendingTests: 0,
    numTodoTests: 0,
    testResults: files.map((file) => ({
      name: resolve(root, file),
      status: 'passed',
      assertionResults: [{ status: 'passed' }],
    })),
  };
}

function fakeCommand() {
  return vi.fn((_cwd: string, args: string[]) => {
    if (args[0] === 'test') {
      const files = args.slice(2).filter((argument) => !argument.startsWith('--'));
      const reportPath = args
        .find((argument) => argument.startsWith('--outputFile='))!
        .slice('--outputFile='.length);
      writeFileSync(
        reportPath,
        JSON.stringify(passingReport(files.length ? files : expectedTests)),
      );
    }
    return { status: 0, stdout: '', stderr: '' };
  });
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'goal-checker-test-'));
  temporaryDirectories.push(root);
  const files: string[] = [
    ...new Set<string>(
      GOALS.flatMap((goal: { files: string[]; tests: string[] }) => [...goal.files, ...goal.tests]),
    ),
  ];
  for (const file of files) writeFile(file, 'implemented\n');
  writeFile('.nvmrc', `${process.versions.node}\n`);
});

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('goal checks', () => {
  it('checks gates once, verifies eight automatic goals, and leaves manual acceptance pending', () => {
    const execute = fakeCommand();
    const report = checkGoals({ root, execute });

    expect(report.verified).toBe(8);
    expect(
      report.results.slice(0, 8).every((goal: { status: string }) => goal.status === 'verified'),
    ).toBe(true);
    expect(report.results.slice(8).map((goal: { status: string }) => goal.status)).toEqual([
      'needs manual verification',
      'needs manual verification',
    ]);
    expect(
      execute.mock.calls.filter(([, args]) => args[0] === 'run').map(([, args]) => args),
    ).toEqual([
      ['run', 'build'],
      ['run', 'lint'],
    ]);
    expect(execute.mock.calls.filter(([, args]) => args[0] === 'test')).toHaveLength(10);
    expect(execute.mock.calls.at(-1)![1][2]).toBe('--reporter=json');
    expect(execute.mock.calls.every(([cwd]) => cwd === root)).toBe(true);
    expect(
      execute.mock.calls
        .filter(([, args]) => args[0] === 'test')
        .every(
          ([, args]) =>
            args.includes('--expect.requireAssertions=true') &&
            args.includes('--passWithNoTests=false') &&
            args.includes('--allowOnly=false'),
        ),
    ).toBe(true);
    expect(formatReport(report)).toContain('8 of 10 goals verified');
    expect(formatReport(report)).toContain('manual prerequisites pending: G9');
  });

  it('blocks all dependents when tooling is still a placeholder and does not execute it', () => {
    writeFile(
      'tsconfig.json',
      '// Planning placeholder only; compiler settings are not implemented.',
    );
    const execute = fakeCommand();
    const report = checkGoals({ root, execute });

    expect(report.verified).toBe(0);
    expect(report.results[0].reasons).toContain('unfinished: tsconfig.json');
    expect(
      report.results.slice(1).every((goal: { status: string }) => goal.status === 'blocked'),
    ).toBe(true);
    expect(execute).not.toHaveBeenCalled();
  });

  it('requires the pinned Node version before running app tooling', () => {
    const execute = fakeCommand();
    const report = checkGoals({ root, execute, nodeVersion: '0.0.0' });

    expect(report.verified).toBe(0);
    expect(report.results[0].reasons.join(' ')).toContain('running 0.0.0');
    expect(execute).not.toHaveBeenCalled();
  });

  it('reports missing tests without blocking independent goals', () => {
    rmSync(join(root, 'tests/errors.test.ts'));
    const report = checkGoals({ root, execute: fakeCommand() });

    expect(report.results[1].status).toBe('failed');
    expect(report.results[1].reasons).toContain('missing: tests/errors.test.ts');
    expect(report.results[2].status).toBe('verified');
    expect(report.results[3].status).toBe('verified');
    expect(report.results[5].status).toBe('blocked');
  });

  it.each(['build', 'lint'])('fails G1 if the shared %s gate fails', (script) => {
    const execute = fakeCommand();
    execute.mockImplementation((_cwd, args) => ({
      status: args[1] === script ? 1 : 0,
      stdout: 'gate failure',
      stderr: '',
    }));
    const report = checkGoals({ root, execute });

    expect(report.verified).toBe(0);
    expect(report.results[0].reasons.join(' ')).toContain(`npm run ${script}: exit 1`);
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('requires a successful exit even if a passing JSON report was produced', () => {
    const passing = fakeCommand();
    const execute = (_cwd: string, args: string[]) => {
      const result = passing(_cwd, args);
      return args[0] === 'test' ? { ...result, status: 1 } : result;
    };
    const report = checkGoals({ root, execute });

    expect(report.verified).toBe(0);
    expect(report.results[0].reasons.join(' ')).toContain('npm test: exit 1');
  });

  it.each([
    'missing',
    'malformed',
    'zero',
    'excluded',
    'skipped',
    'todo',
    'failed',
    'empty-file',
    'file-failure',
  ])('rejects a %s test report', (kind) => {
    const passing = fakeCommand();
    const execute = (_cwd: string, args: string[]) => {
      const result = passing(_cwd, args);
      if (args[0] !== 'test') return result;
      const reportPath = args
        .find((argument) => argument.startsWith('--outputFile='))!
        .slice('--outputFile='.length);
      if (kind === 'missing') rmSync(reportPath);
      else if (kind === 'malformed') writeFileSync(reportPath, 'not JSON');
      else {
        const report = JSON.parse(readFileSync(reportPath, 'utf8'));
        if (kind === 'zero') report.numPassedTests = 0;
        if (kind === 'excluded') report.testResults[0].name = join(root, 'unrelated.test.ts');
        if (kind === 'skipped') report.testResults[0].assertionResults[0].status = 'skipped';
        if (kind === 'todo') report.numTodoTests = 1;
        if (kind === 'failed') report.numFailedTests = 1;
        if (kind === 'empty-file') report.testResults[0].assertionResults = [];
        if (kind === 'file-failure') report.testResults[0].status = 'failed';
        writeFileSync(reportPath, JSON.stringify(report));
      }
      return result;
    };
    const report = checkGoals({ root, execute });

    expect(report.verified).toBe(0);
    expect(report.results[0].status).toBe('failed');
  });

  it('cleans temporary reports after checks', () => {
    const execute = fakeCommand();
    checkGoals({ root, execute });
    const reports = execute.mock.calls.flatMap(([, args]) =>
      args
        .filter((arg) => arg.startsWith('--outputFile='))
        .map((arg) => arg.slice('--outputFile='.length)),
    );

    expect(reports).toHaveLength(10);
    expect(reports.every((report) => !existsSync(dirname(report)))).toBe(true);
  });

  it('runs the CLI from another working directory, reports zero, and exits unsuccessfully for a scaffold', () => {
    const tools = join(root, 'tools');
    mkdirSync(tools);
    const script = join(tools, 'check-goals.cjs');
    copyFileSync(resolve('tools/check-goals.cjs'), script);
    writeFile('tsconfig.json', '// Planning placeholder only');
    const result = spawnSync(process.execPath, [script], {
      cwd: tmpdir(),
      encoding: 'utf8',
    });

    expect(result.error).toBeUndefined();
    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('0 of 10 goals verified');
    expect(result.stdout).toContain('unfinished: tsconfig.json');
    expect(result.stdout).toContain('G10 Fresh-checkout and browser acceptance: blocked');
  });

  it('runs real Vitest gates and rejects assertion-free tests', () => {
    mkdirSync(join(root, 'tools'));
    const script = join(root, 'tools/check-goals.cjs');
    copyFileSync(resolve('tools/check-goals.cjs'), script);
    symlinkSync(resolve('node_modules'), join(root, 'node_modules'), 'junction');
    writeFile(
      'package.json',
      JSON.stringify({
        private: true,
        scripts: {
          build: 'node -e ""',
          lint: 'node -e ""',
          test: 'vitest run',
        },
      }),
    );
    writeFile('tsconfig.json', '{}');
    writeFile(
      'vitest.config.ts',
      "export default { test: { include: ['tests/tooling.test.ts'] } };\n",
    );
    for (const file of [
      'src/config.ts',
      'src/db/connection.ts',
      'src/validation/todo-schemas.ts',
    ]) {
      writeFile(file, '// Planning placeholder only');
    }
    writeFile('tests/tooling.test.ts', "import { it } from 'vitest';\nit('empty', () => {});\n");

    const empty = spawnSync(process.execPath, [script], {
      cwd: tmpdir(),
      encoding: 'utf8',
      timeout: 15_000,
    });
    expect(empty.error).toBeUndefined();
    expect(empty.stdout).toContain('0 of 10 goals verified');
    expect(empty.stdout).toContain('expected any number of assertion, but got none');

    writeFile(
      'tests/tooling.test.ts',
      "import { expect, it } from 'vitest';\nit('assertion', () => { expect(1 + 1).toBe(2); });\n",
    );
    const passing = spawnSync(process.execPath, [script], {
      cwd: tmpdir(),
      encoding: 'utf8',
      timeout: 15_000,
    });
    expect(passing.error).toBeUndefined();
    expect(passing.stdout).toContain('1 of 10 goals verified');
    expect(passing.stdout).toContain('G1 Tooling: verified');
  }, 35_000);
});

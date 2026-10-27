// Purpose: Verify the project compiler settings accept valid code and enforce strict null checks.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('TypeScript tooling', () => {
  let fixtureDirectory: string;

  beforeEach(() => {
    fixtureDirectory = mkdtempSync(join(tmpdir(), 'todo-tooling-'));
  });

  afterEach(() => {
    rmSync(fixtureDirectory, { recursive: true, force: true });
  });

  function compileFixture(source: string) {
    const configPath = resolve('tsconfig.json');
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    expect(config.error).toBeUndefined();

    const parsedConfig = ts.parseJsonConfigFileContent(config.config, ts.sys, resolve('.'));
    expect(parsedConfig.errors).toEqual([]);

    const fixturePath = join(fixtureDirectory, 'fixture.ts');
    writeFileSync(fixturePath, source);

    const program = ts.createProgram([fixturePath], {
      ...parsedConfig.options,
      // Keep fixture input and generated output outside application source and dist.
      rootDir: fixtureDirectory,
      outDir: join(fixtureDirectory, 'output'),
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    const result = program.emit();

    return { diagnostics: [...diagnostics, ...result.diagnostics], result };
  }

  it('compiles valid TypeScript and emits JavaScript', () => {
    const { diagnostics, result } = compileFixture("const name: string = 'Test task';\n");

    expect(diagnostics).toEqual([]);
    expect(result.emitSkipped).toBe(false);
    expect(readFileSync(join(fixtureDirectory, 'output', 'fixture.js'), 'utf8')).toContain(
      'Test task',
    );
  });

  it('rejects null assigned to a required string', () => {
    const { diagnostics } = compileFixture('const name: string = null;\n');

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe(2322);
    expect(ts.flattenDiagnosticMessageText(diagnostics[0].messageText, '\n')).toBe(
      "Type 'null' is not assignable to type 'string'.",
    );
  });
});

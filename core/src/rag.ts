import { analyze } from "./engine";
import { parseFile } from "./parser";
import { Result, SCHEMA_VERSION } from "./model";

function main(): void {
  const [, , filePath] = process.argv;
  if (!filePath) {
    process.stderr.write("usage: rag <file>\n");
    process.exit(1);
  }

  try {
    const functions = parseFile(filePath);
    const violations = analyze(functions);
    const result: Result = {
      schemaVersion: SCHEMA_VERSION,
      filePath,
      violations,
    };
    process.stdout.write(JSON.stringify(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`failed to analyze file: ${message}\n`);
    process.exit(1);
  }
}

main();

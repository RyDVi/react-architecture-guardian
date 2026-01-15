import { FunctionInfo, Violation } from "./model";
import { noApiInReactComponent } from "./rules/noApiInReactComponent";
import { noJsxInHooks } from "./rules/noJsxInHooks";

export function analyze(functions: FunctionInfo[]): Violation[] {
  const violations: Violation[] = [];

  for (const fn of functions) {
    const apiViolation = noApiInReactComponent(fn);
    if (apiViolation) {
      violations.push(apiViolation);
    }

    const jsxViolation = noJsxInHooks(fn);
    if (jsxViolation) {
      violations.push(jsxViolation);
    }
  }

  violations.sort((a, b) => {
    if (a.location.line !== b.location.line) {
      return a.location.line - b.location.line;
    }
    if (a.location.column !== b.location.column) {
      return a.location.column - b.location.column;
    }
    return a.ruleId.localeCompare(b.ruleId);
  });

  return violations;
}

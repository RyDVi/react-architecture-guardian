import { FunctionInfo, Violation } from "../model";

export function noJsxInHooks(fn: FunctionInfo): Violation | null {
  if (fn.kind !== "react-hook") {
    return null;
  }
  if (fn.jsxReturns.length === 0) {
    return null;
  }

  return {
    ruleId: "no-jsx-in-hooks",
    message: "Hooks must not return JSX",
    severity: "error",
    function: {
      name: fn.name,
      kind: fn.kind,
    },
    location: fn.jsxReturns[0],
  };
}

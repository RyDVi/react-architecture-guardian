import { FunctionInfo, Violation } from "../model";

export function noApiInReactComponent(fn: FunctionInfo): Violation | null {
  if (fn.kind !== "react-component") {
    return null;
  }
  if (fn.apiCalls.length === 0) {
    return null;
  }

  return {
    ruleId: "no-api-in-react-component",
    message: "React component should not call API directly",
    severity: "error",
    function: {
      name: fn.name,
      kind: fn.kind,
    },
    location: fn.apiCalls[0],
  };
}

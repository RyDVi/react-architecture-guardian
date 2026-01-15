export const SCHEMA_VERSION = "1.0.0";

export type Kind = "react-component" | "react-hook" | "utility";

export interface Location {
  line: number;
  column: number;
}

export interface FunctionInfo {
  name: string;
  kind: Kind;
  location: Location;
  apiCalls: Location[];
  jsxReturns: Location[];
}

export interface FunctionRef {
  name: string;
  kind: Kind;
}

export interface Violation {
  ruleId: string;
  message: string;
  severity: "error" | "warning";
  function: FunctionRef;
  location: Location;
}

export interface Result {
  schemaVersion: string;
  filePath: string;
  violations: Violation[];
}

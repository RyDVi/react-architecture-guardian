import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

import { FunctionInfo, Kind, Location } from "./model";

export function parseFile(filePath: string): FunctionInfo[] {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const ext = path.extname(filePath).toLowerCase();
  const scriptKind = getScriptKind(ext);
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );

  const functions: FunctionInfo[] = [];
  collectFunctions(sourceFile, sourceFile, functions);
  return functions;
}

function collectFunctions(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  out: FunctionInfo[]
): void {
  if (ts.isFunctionDeclaration(node) && node.name) {
    out.push(buildFunctionInfo(node.name.text, node.name, node.body, sourceFile));
  }

  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
    const functionNode = getFunctionFromExpression(node.initializer);
    if (functionNode) {
      const body = functionNode.body;
      out.push(buildFunctionInfo(node.name.text, node.name, body, sourceFile));
    }
  }

  ts.forEachChild(node, (child) => collectFunctions(child, sourceFile, out));
}

function getScriptKind(ext: string): ts.ScriptKind {
  switch (ext) {
    case ".tsx":
      return ts.ScriptKind.TSX;
    case ".jsx":
      return ts.ScriptKind.JSX;
    case ".js":
    case ".mjs":
    case ".cjs":
      return ts.ScriptKind.JS;
    case ".ts":
    case ".mts":
    case ".cts":
    default:
      return ts.ScriptKind.TS;
  }
}

function getFunctionFromExpression(expr: ts.Expression): ts.FunctionLikeDeclaration | null {
  if (ts.isParenthesizedExpression(expr)) {
    return getFunctionFromExpression(expr.expression);
  }

  if (ts.isArrowFunction(expr) || ts.isFunctionExpression(expr)) {
    return expr;
  }

  if (ts.isCallExpression(expr)) {
    for (const arg of expr.arguments) {
      if (ts.isExpression(arg)) {
        const nested = getFunctionFromExpression(arg);
        if (nested) {
          return nested;
        }
      }
    }
  }

  return null;
}

function buildFunctionInfo(
  name: string,
  nameNode: ts.Node,
  body: ts.ConciseBody | ts.Block | undefined,
  sourceFile: ts.SourceFile
): FunctionInfo {
  const kind = classifyFunction(name);
  const location = nodeLocation(nameNode, sourceFile);
  const apiCalls = findAPICalls(body, sourceFile);
  const jsxReturns = findJSXReturns(body, sourceFile);

  return {
    name,
    kind,
    location,
    apiCalls,
    jsxReturns,
  };
}

function classifyFunction(name: string): Kind {
  if (isHookName(name)) {
    return "react-hook";
  }
  if (isComponentName(name)) {
    return "react-component";
  }
  return "utility";
}

function isHookName(name: string): boolean {
  if (!name.startsWith("use")) {
    return false;
  }
  if (name.length < 4) {
    return false;
  }
  const ch = name.charCodeAt(3);
  return ch >= 65 && ch <= 90;
}

function isComponentName(name: string): boolean {
  if (name.length === 0) {
    return false;
  }
  const ch = name.charCodeAt(0);
  return ch >= 65 && ch <= 90;
}

function findAPICalls(
  body: ts.ConciseBody | ts.Block | undefined,
  sourceFile: ts.SourceFile
): Location[] {
  if (!body) {
    return [];
  }

  const calls: Location[] = [];
  walk(body, (node) => {
    if (isNestedFunction(node) && node !== body) {
      return false;
    }

    if (ts.isCallExpression(node)) {
      if (calleeIsAPI(node.expression)) {
        calls.push(nodeLocation(node, sourceFile));
      }
    }
    return true;
  });

  return calls;
}

function calleeIsAPI(expr: ts.Expression): boolean {
  if (ts.isIdentifier(expr)) {
    return expr.text === "fetch" || expr.text === "axios";
  }

  if (ts.isPropertyAccessExpression(expr)) {
    return ts.isIdentifier(expr.expression) && expr.expression.text === "axios";
  }

  if (ts.isPropertyAccessChain && ts.isPropertyAccessChain(expr)) {
    return ts.isIdentifier(expr.expression) && expr.expression.text === "axios";
  }

  return false;
}

function findJSXReturns(
  body: ts.ConciseBody | ts.Block | undefined,
  sourceFile: ts.SourceFile
): Location[] {
  if (!body) {
    return [];
  }

  const locations: Location[] = [];

  if (!ts.isBlock(body)) {
    const jsxNode = findFirstJSX(body);
    if (jsxNode) {
      locations.push(nodeLocation(jsxNode, sourceFile));
    }
    return locations;
  }

  walk(body, (node) => {
    if (isNestedFunction(node) && node !== body) {
      return false;
    }
    if (ts.isReturnStatement(node) && node.expression) {
      const jsxNode = findFirstJSX(node.expression);
      if (jsxNode) {
        locations.push(nodeLocation(jsxNode, sourceFile));
      }
    }
    return true;
  });

  return locations;
}

function findFirstJSX(node: ts.Node): ts.Node | null {
  let found: ts.Node | null = null;
  walk(node, (n) => {
    if (isNestedFunction(n) && n !== node) {
      return false;
    }
    if (isJSXNode(n)) {
      found = n;
      return false;
    }
    return true;
  });
  return found;
}

function isJSXNode(node: ts.Node): boolean {
  return (
    ts.isJsxElement(node) ||
    ts.isJsxSelfClosingElement(node) ||
    ts.isJsxFragment(node)
  );
}

function isNestedFunction(node: ts.Node): boolean {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node)
  );
}

function walk(node: ts.Node, visit: (node: ts.Node) => boolean): void {
  if (!visit(node)) {
    return;
  }
  ts.forEachChild(node, (child) => walk(child, visit));
}

function nodeLocation(node: ts.Node, sourceFile: ts.SourceFile): Location {
  const pos = node.getStart(sourceFile, false);
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(pos);
  return {
    line: line + 1,
    column: character,
  };
}

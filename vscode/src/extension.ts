import * as vscode from 'vscode';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import ts from 'typescript';

export function activate(context: vscode.ExtensionContext) {
  const envPath = path.join(context.extensionPath, '..', '.env');
  dotenv.config({ path: envPath });

  const languageSelector = [
    { language: 'typescriptreact' },
    { language: 'typescript' },
    { language: 'javascriptreact' },
    { language: 'javascript' },
  ];

  const diagnosticsCollection =
    vscode.languages.createDiagnosticCollection('react-architecture-guardian');
  context.subscriptions.push(diagnosticsCollection);

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      languageSelector,
      adviceLensProvider
    )
  );

  const adviceCommand = vscode.commands.registerCommand(
    'rag.showAdvice',
    (advice: string) => {
      if (advice) {
        vscode.window.showInformationMessage(advice);
      }
    }
  );

  const disposable = vscode.commands.registerCommand(
    'rag.analyzeFile',
    () => analyzeCurrentFile(context, diagnosticsCollection)
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(adviceCommand);

  const scheduler = new AnalyzeScheduler(context, diagnosticsCollection);
  context.subscriptions.push(scheduler);

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && shouldAnalyzeLanguage(editor.document.languageId)) {
        scheduler.schedule(editor.document);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (shouldAnalyzeLanguage(event.document.languageId)) {
        scheduler.schedule(event.document);
      }
    })
  );
}

function analyzeCurrentFile(
  context: vscode.ExtensionContext,
  diagnosticsCollection: vscode.DiagnosticCollection
) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;
  analyzeDocument(context, document, diagnosticsCollection);
}

function analyzeDocument(
  context: vscode.ExtensionContext,
  document: vscode.TextDocument,
  diagnosticsCollection: vscode.DiagnosticCollection
) {
  if (!shouldAnalyzeLanguage(document.languageId)) {
    return;
  }

  const filePath = document.fileName;

  // Path to Node-based CLI (rag.js)
  // In real usage this should be configurable or bundled
  const ragScript = path.join(context.extensionPath, '..', 'core', 'dist', 'rag.js');
  if (!fs.existsSync(ragScript)) {
    vscode.window.showErrorMessage(
      'React Architecture Guardian error: core build missing. Run "npm run build:core" in the repo root.'
    );
    return;
  }

  execFile(process.execPath, [ragScript, filePath], (error, stdout, stderr) => {
    if (error) {
      vscode.window.showErrorMessage(
        `React Architecture Guardian error: ${stderr || error.message}`
      );
      return;
    }

    try {
      const result = JSON.parse(stdout);
      void showDiagnostics(result, document, diagnosticsCollection);
    } catch (e) {
      vscode.window.showErrorMessage(
        'Failed to parse React Architecture Guardian output'
      );
    }
  });
}

async function showDiagnostics(
  result: any,
  document: vscode.TextDocument,
  diagnosticsCollection: vscode.DiagnosticCollection
) {
  const diagnostics: vscode.Diagnostic[] = [];

  const uri = vscode.Uri.file(result.filePath);

  const functions = parseFunctions(document);
  const analysis = buildFunctionAnalysis(functions, result.violations || []);
  const adviceByFunction = await getAIAdvice(analysis);
  updateCodeLens(document.uri, analysis, adviceByFunction);

  for (const v of result.violations || []) {
    const fn = findFunctionForViolation(analysis, v);
    const advice = fn ? adviceByFunction.get(fn) || '' : '';
    const range = findFunctionNameRange(document, v) ??
      new vscode.Range(
        new vscode.Position(v.location.line - 1, v.location.column),
        new vscode.Position(v.location.line - 1, v.location.column + 1)
      );

    const severity =
      v.severity === 'error'
        ? vscode.DiagnosticSeverity.Error
        : vscode.DiagnosticSeverity.Warning;

    const message = advice
      ? `${v.message} Advice: ${advice}`
      : v.message;

    const diagnostic = new vscode.Diagnostic(
      range,
      message,
      severity
    );

    diagnostics.push(diagnostic);
  }

  diagnosticsCollection.set(uri, diagnostics);
}

async function getAIAdvice(functions: AnalyzedFunction[]): Promise<Map<AnalyzedFunction, string>> {
  const adviceMap = new Map<AnalyzedFunction, string>();
  if (functions.length === 0) {
    return adviceMap;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.proxyapi.ru/openai/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-5.1-codex-mini';

  if (!apiKey) {
    if (!hasWarnedMissingApiKey) {
      vscode.window.showErrorMessage(
        'React Architecture Guardian: OPENAI_API_KEY is not set; AI advice is required.'
      );
      hasWarnedMissingApiKey = true;
    }
    for (const fn of functions) {
      adviceMap.set(fn, 'AI advice unavailable: set OPENAI_API_KEY in .env.');
    }
    return adviceMap;
  }

  const client = createOpenAIClient(apiKey, baseUrl);
  if (!client) {
    if (!hasWarnedOpenAIUnavailable) {
      vscode.window.showErrorMessage(
        'React Architecture Guardian: OpenAI client unavailable; AI advice is required.'
      );
      hasWarnedOpenAIUnavailable = true;
    }
    for (const fn of functions) {
      adviceMap.set(fn, 'AI advice unavailable: install the openai package in vscode/.');
    }
    return adviceMap;
  }

  try {
    const response = await client.responses.create({
      model,
      instructions:
        'You are an assistant that provides short, practical advice for React architecture. ' +
        'Each advice MUST mention at least one relevant software design pattern by name. ' +
        'For good items, praise the architecture and suggest how to keep it strong. ' +
        'For bad items, suggest how to fix it. ' +
        'Return ONLY a JSON array of strings, one per input item, with no extra text.',
      input: JSON.stringify({
        items: functions.map((fn) => ({
          name: fn.name,
          kind: fn.kind,
          status: fn.hasViolations ? 'bad' : 'good',
          ruleIds: fn.ruleIds,
        })),
      }),
    });

    const content = response.output_text;
    const adviceList = content ? JSON.parse(content) : null;

    if (Array.isArray(adviceList)) {
      for (let i = 0; i < functions.length; i++) {
        const advice = typeof adviceList[i] === 'string' ? adviceList[i] : '';
        adviceMap.set(functions[i], advice);
      }
      return adviceMap;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showWarningMessage(
      `React Architecture Guardian: AI advice failed (${message}).`
    );
  }

  for (const fn of functions) {
    adviceMap.set(fn, 'AI advice unavailable: request failed.');
  }
  return adviceMap;
}

function createOpenAIClient(apiKey: string, baseURL: string): any | null {
  try {
    // Use require to avoid hard dependency at extension load time.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const openaiModule = require('openai');
    const OpenAI = openaiModule?.default ?? openaiModule;
    return new OpenAI({ apiKey, baseURL });
  } catch (error) {
    return null;
  }
}

function updateCodeLens(
  uri: vscode.Uri,
  analysis: AnalyzedFunction[],
  adviceByFunction: Map<AnalyzedFunction, string>
) {
  adviceLensProvider.setAnalysis(uri, analysis, adviceByFunction);
}

function findFunctionNameRange(
  document: vscode.TextDocument,
  violation: any
): vscode.Range | null {
  const name = violation?.function?.name;
  if (!name) {
    return null;
  }

  const startLine = Math.max(0, (violation.location?.line ?? 1) - 1);
  const minLine = Math.max(0, startLine - 50);

  for (let line = startLine; line >= minLine; line--) {
    const text = document.lineAt(line).text;
    const index = text.indexOf(name);
    if (index >= 0) {
      return new vscode.Range(
        new vscode.Position(line, index),
        new vscode.Position(line, index + name.length)
      );
    }
  }

  return null;
}

export function deactivate() {}

type ParsedFunction = {
  name: string;
  kind: 'react-component' | 'react-hook' | 'utility';
  nameRange: vscode.Range;
  fullRange: vscode.Range;
};

type AnalyzedFunction = ParsedFunction & {
  hasViolations: boolean;
  ruleIds: string[];
};

class AdviceCodeLensProvider implements vscode.CodeLensProvider {
  private emitter = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this.emitter.event;
  private analyses = new Map<string, { analysis: AnalyzedFunction[]; advice: Map<AnalyzedFunction, string> }>();

  setAnalysis(
    uri: vscode.Uri,
    analysis: AnalyzedFunction[],
    advice: Map<AnalyzedFunction, string>
  ) {
    this.analyses.set(uri.toString(), { analysis, advice });
    this.emitter.fire();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const data = this.analyses.get(document.uri.toString());
    if (!data) {
      return [];
    }

    return data.analysis.map((fn) => {
      const advice = data.advice.get(fn) || '';
      const title = formatCodeLensTitle(fn, advice);
      return new vscode.CodeLens(fn.nameRange, {
        title,
        command: 'rag.showAdvice',
        arguments: [advice],
      });
    });
  }
}

const adviceLensProvider = new AdviceCodeLensProvider();
let hasWarnedOpenAIUnavailable = false;
let hasWarnedMissingApiKey = false;

class AnalyzeScheduler implements vscode.Disposable {
  private timers = new Map<string, NodeJS.Timeout>();
  private delayMs = 400;
  private readonly context: vscode.ExtensionContext;
  private readonly diagnosticsCollection: vscode.DiagnosticCollection;

  constructor(context: vscode.ExtensionContext, diagnosticsCollection: vscode.DiagnosticCollection) {
    this.context = context;
    this.diagnosticsCollection = diagnosticsCollection;
    this.loadDelay();
  }

  schedule(document: vscode.TextDocument) {
    this.loadDelay();
    const key = document.uri.toString();
    const existing = this.timers.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    const timer = setTimeout(() => {
      this.timers.delete(key);
      analyzeDocument(this.context, document, this.diagnosticsCollection);
    }, this.delayMs);
    this.timers.set(key, timer);
  }

  dispose() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  private loadDelay() {
    const config = vscode.workspace.getConfiguration('rag');
    const value = config.get<number>('analyzeDelayMs', 400);
    this.delayMs = Number.isFinite(value) ? Math.max(0, value) : 400;
  }
}

function parseFunctions(document: vscode.TextDocument): ParsedFunction[] {
  const sourceText = document.getText();
  const sourceFile = ts.createSourceFile(
    document.fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(document.languageId)
  );

  const functions: ParsedFunction[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node) && node.name) {
      const nameRange = getRangeFromNode(sourceFile, node.name);
      const fullRange = getRangeFromNode(sourceFile, node);
      functions.push({
        name: node.name.text,
        kind: classifyFunction(node.name.text),
        nameRange,
        fullRange,
      });
    }

    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const functionNode = getFunctionFromExpression(node.initializer);
      if (functionNode) {
        const nameRange = getRangeFromNode(sourceFile, node.name);
        const fullRange = getRangeFromNode(sourceFile, functionNode);
        functions.push({
          name: node.name.text,
          kind: classifyFunction(node.name.text),
          nameRange,
          fullRange,
        });
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return functions;
}

function shouldAnalyzeLanguage(languageId: string): boolean {
  return (
    languageId === 'typescriptreact' ||
    languageId === 'typescript' ||
    languageId === 'javascriptreact' ||
    languageId === 'javascript'
  );
}

function getScriptKind(languageId: string): ts.ScriptKind {
  switch (languageId) {
    case 'typescriptreact':
      return ts.ScriptKind.TSX;
    case 'javascriptreact':
      return ts.ScriptKind.JSX;
    case 'javascript':
      return ts.ScriptKind.JS;
    case 'typescript':
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

function getRangeFromNode(sourceFile: ts.SourceFile, node: ts.Node): vscode.Range {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile, false));
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  return new vscode.Range(
    new vscode.Position(start.line, start.character),
    new vscode.Position(end.line, end.character)
  );
}

function classifyFunction(name: string): ParsedFunction['kind'] {
  if (isHookName(name)) {
    return 'react-hook';
  }
  if (isComponentName(name)) {
    return 'react-component';
  }
  return 'utility';
}

function isHookName(name: string): boolean {
  if (!name.startsWith('use')) {
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

function buildFunctionAnalysis(
  functions: ParsedFunction[],
  violations: any[]
): AnalyzedFunction[] {
  const analysis: AnalyzedFunction[] = functions.map((fn) => ({
    ...fn,
    hasViolations: false,
    ruleIds: [],
  }));

  for (const v of violations) {
    const target = analysis.find((fn) => {
      if (v.function?.name && v.function?.name !== fn.name) {
        return false;
      }
      if (v.function?.kind && v.function?.kind !== fn.kind) {
        return false;
      }
      if (v.location?.line == null || v.location?.column == null) {
        return false;
      }
      const pos = new vscode.Position(v.location.line - 1, v.location.column);
      return fn.fullRange.contains(pos);
    });

    if (target) {
      target.hasViolations = true;
      if (v.ruleId) {
        target.ruleIds.push(v.ruleId);
      }
    }
  }

  return analysis;
}

function findFunctionForViolation(analysis: AnalyzedFunction[], violation: any): AnalyzedFunction | null {
  const byName = analysis.find((fn) => violation.function?.name === fn.name);
  if (byName) {
    return byName;
  }
  if (violation.location?.line == null || violation.location?.column == null) {
    return null;
  }
  const pos = new vscode.Position(violation.location.line - 1, violation.location.column);
  return analysis.find((fn) => fn.fullRange.contains(pos)) || null;
}

function formatCodeLensTitle(fn: AnalyzedFunction, advice: string): string {
  const symbol = fn.hasViolations ? '✗' : '✓';
  const label = fn.hasViolations ? 'Bad' : 'Good';
  const normalized = advice.trim() || 'AI advice unavailable.';
  const title = `${symbol} ${label}: ${normalized}`;
  return title.length > 160 ? `${title.slice(0, 157)}...` : title;
}

function getFallbackAdvice(fn: AnalyzedFunction): string {
  if (!fn.hasViolations) {
    return 'Composition pattern: keep responsibilities separated and compose UI from small components.';
  }
  if (fn.ruleIds.includes('no-api-in-react-component')) {
    return 'Strategy pattern: move API calls into a hook/service and select strategies outside the component.';
  }
  if (fn.ruleIds.includes('no-jsx-in-hooks')) {
    return 'Composition pattern: keep hooks pure and compose UI in components instead of returning JSX.';
  }
  return 'Facade pattern: encapsulate complex dependencies behind a small, stable interface.';
}

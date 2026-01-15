# React Architecture Guardian — VS Code Extension

React Architecture Guardian is a VS Code extension that detects **architectural violations**
in React frontend code and explains them clearly.

This extension is a UI layer only.
All analysis is performed by a deterministic TypeScript-based CLI.

---

## What this extension does

- Runs React Architecture Guardian CLI (`rag`)
- Displays architecture violations as VS Code diagnostics
- Shows clear, human-readable messages
- Optionally provides AI-powered explanations

---

## What this extension does NOT do

- It does NOT analyze code itself
- It does NOT contain architectural logic
- It does NOT use AI for detection
- It does NOT replace ESLint

---

## Supported scope

- React projects
- Functional components
- Custom hooks
- TypeScript / TSX files

---

## How it works

1. You open a `.tsx` file
2. You run **React Architecture Guardian: Analyze File**
3. VS Code calls the `rag` CLI
4. CLI returns deterministic JSON
5. Extension renders diagnostics

---

## Commands

| Command | Description |
|------|------------|
| `React Architecture Guardian: Analyze File` | Analyze current TSX file |

---

## Configuration

```json
{
  "rag.enable": true,
  "rag.ai.enable": true
}
```

---

## AI usage

AI is used ONLY to:
- explain existing violations
- rephrase messages
- suggest refactoring direction

AI is NEVER used to:
- detect violations
- change severity
- invent rules

---

## Requirements

- `rag` CLI available (bundled or configured)
- VS Code 1.85+

---

## Philosophy

> Architecture should be enforced by tools  
> but understood by humans.

---

## License

MIT

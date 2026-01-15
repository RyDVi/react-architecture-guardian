# Dev Setup — React Architecture Guardian

This document describes how to run **React Architecture Guardian** locally
during development.

---

## Requirements

- Node.js **18+**
- VS Code (recommended)

---

## Clone repository

```bash
git clone https://github.com/<your-username>/react-architecture-guardian.git
cd react-architecture-guardian
```

---

## TypeScript core setup

### Install dependencies

```bash
npm install
```

### Build CLI

```bash
npm run build:core
```

### Run analyzer

```bash
node core/dist/rag.js path/to/file.tsx
```

Example:

```bash
node core/dist/rag.js examples/BadComponent.tsx
```

The output is printed as **JSON** to stdout
and strictly follows `JSON_SCHEMA.md`.

---

## Expected output example

```json
{
  "schemaVersion": "1.0.0",
  "filePath": "BadComponent.tsx",
  "violations": [
    {
      "ruleId": "no-api-in-react-component",
      "message": "React component should not call API directly",
      "severity": "error",
      "function": {
        "name": "BadComponent",
        "kind": "react-component"
      },
      "location": {
        "line": 5,
        "column": 2
      }
    }
  ]
}
```

---

## Development workflow

Recommended loop:

1. Edit TypeScript code in `core/src/`
2. Run tests (when they exist)
3. Run `node core/dist/rag.js <file>`
4. Verify JSON output stability

---

## Determinism checklist

Before committing:

- [ ] Same input → same output
- [ ] No randomness
- [ ] No timestamps
- [ ] No file system order dependence
- [ ] No AI usage in core

---

## Next steps

After core is stable:

- Create VS Code extension in `vscode/`
- Wire CLI execution from extension
- Add optional AI explanation layer

---

## Notes

If you are unsure whether a change affects architecture,
stop and discuss before implementing.

# React Architecture Guardian

> **VS Code extension that enforces React architecture — and explains violations in plain language.**

---

## ❓ What is this

**React Architecture Guardian** is a VS Code extension and TypeScript-based analyzer that detects **architectural violations** in React frontend code.

Unlike ESLint and similar tools, it does not stop at reporting an error.
It explains **why the violation is a problem** and **how to think about fixing it**.

Architecture enforcement is **deterministic**.  
AI is used **only for explanation**, never for detection.

---

## 🎯 Scope (MVP)

Supported:
- React
- Functional components
- Custom hooks
- Frontend-only projects

Explicitly NOT supported (by design):
- Class components
- Backend code
- State managers
- UI kits

> **Focus is a feature.**

---

## 🧠 Core principles

1. Architecture decisions are deterministic
2. AI never detects violations
3. AI never changes rule severity
4. TypeScript core is the source of truth
5. VS Code is a thin UI layer

If the same file is analyzed twice, the result must be identical.

---

## 🏗 High-level architecture

```
React (.tsx)
   ↓
TypeScript analyzer (TypeScript compiler API)
   ↓
JSON violations (stable schema)
   ↓
VS Code diagnostics
   ↓
Optional AI explanations (hover)
```

---

## 📐 Architecture layers

- **UI** — React components
- **Hooks** — custom hooks
- **Domain** — business logic
- **Infra** — API, storage, transport

Rules enforce **one-way dependencies**:
- UI → Hooks
- Hooks → Domain
- Domain → Infra

Reverse dependencies are violations.

---

## 🚨 Rules (MVP)

### ❌ no-api-in-react-component
React components must not call APIs directly.

```ts
// ❌ Bad
fetch('/api/orders');
axios.get('/orders');
```

**Why:**  
UI becomes tightly coupled to infrastructure and harder to test.

---

### ❌ no-jsx-in-hooks
Hooks must not return JSX.

```ts
// ❌ Bad
export function useOrders() {
  return <OrderList />;
}
```

**Why:**  
Hooks encapsulate logic, not rendering.

---

### ⚠️ complex-logic-in-ui (heuristic)
Warns when UI components contain complex business logic.

---

## 🖥 VS Code experience

- Inline diagnostics
- Clear error messages
- Hover explanations
- Optional AI-powered explanations
- AI can be fully disabled

---

## 🤖 AI usage

AI is used ONLY to:
- explain existing violations
- rephrase rule messages
- suggest refactoring direction (high-level)

AI is STRICTLY FORBIDDEN from:
- detecting violations
- modifying severity
- inventing rules
- analyzing project-wide architecture

---

## ⚙️ Configuration

```ts
// rag.config.ts
export default {
  layers: {
    ui: ['hooks'],
    hooks: ['domain'],
    domain: ['infra'],
    infra: []
  },

  ai: {
    enabled: true,
    language: 'en'
  }
};
```

---

## 📦 Repository structure

```
react-architecture-guardian/
├─ core/                # TypeScript analyzer (deterministic)
├─ vscode/              # VS Code extension (UI)
├─ ai/                  # AI explanation adapters (optional)
├─ ARCHITECTURE.md
├─ RULES.md
├─ JSON_SCHEMA.md
├─ CODEX_PROMPT_TEMPLATE.md
├─ CONTRIBUTING.md
└─ README.md
```

---

## 🧭 Philosophy

> Architecture should be enforced by tools  
> but understood by humans.

---

## 📄 License

MIT

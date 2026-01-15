# Architecture Rules

This document defines the architectural rules
enforced by React Architecture Guardian.

Rules are evaluated by the TypeScript core.
AI is allowed ONLY to explain them.

---

## Rule: no-api-in-react-component

### Applies to
- React functional components

### Description
React components must not call APIs directly.

### Forbidden patterns
- fetch(...)
- axios.*
- direct HTTP calls
- direct infra access

### Why this rule exists
UI components should focus on rendering.
Direct API calls tightly couple UI to infrastructure
and make testing and reuse difficult.

### Recommended approach
- Move API calls to custom hooks
- Or move them to a service / infra layer

### Severity
error

---

## Rule: no-jsx-in-hooks

### Applies to
- Custom hooks

### Description
Hooks must not return JSX.

### Forbidden patterns
```ts
return <Component />
```

### Why this rule exists
Hooks encapsulate logic, not rendering.
Returning JSX mixes responsibilities.

### Recommended approach
Return data, state, or callbacks only.

### Severity
error

---

## Rule: no-domain-imports-in-ui (planned)

### Applies to
- React components

### Description
UI must not import domain or infra modules directly.

### Severity
warning (MVP), error (future)

---

## Rule: complex-logic-in-ui (heuristic)

### Applies to
- React components

### Description
UI components should not contain complex business logic.

### Detection heuristic
- Multiple nested conditions
- High logical operator count

### Notes
This rule is heuristic-based.
It produces warnings, not errors.

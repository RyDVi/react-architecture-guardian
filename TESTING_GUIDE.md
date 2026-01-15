# Testing Guide — React Architecture Guardian

This document describes how to write and maintain tests
for **React Architecture Guardian**.

Testing is critical because the core promise of the project is
**deterministic architecture analysis**.

---

## Testing principles

All tests MUST follow these rules:

1. Deterministic results only
2. Same input → same output
3. No randomness
4. No time-based logic
5. No filesystem order dependence
6. No AI usage in core tests

If a test violates any of these principles, it must be rewritten.

---

## What must be tested

### 1. Architecture rules

Each rule MUST have:

- at least one **positive test** (violation detected)
- at least one **negative test** (no violation)

Rules are tested in isolation.

---

## Rule test structure

Recommended location:

```
core/src/rules/
  noApiInReactComponent.ts
core/test/
  noApiInReactComponent.test.ts
```

---

## Example: rule test

```ts
import { strict as assert } from "node:assert";
import { noApiInReactComponent } from "../src/rules/noApiInReactComponent";

const fn = {
  name: "TestComponent",
  kind: "react-component",
  location: { line: 1, column: 0 },
  apiCalls: [{ line: 1, column: 0 }],
  jsxReturns: [],
};

const violation = noApiInReactComponent(fn);
assert.ok(violation);
assert.equal(violation.ruleId, "no-api-in-react-component");
```

---

## Parser tests

Parser tests should verify:

- correct function extraction
- correct function kind detection
- stable location reporting

Parser tests MUST NOT:
- depend on file ordering
- depend on OS-specific paths

Prefer inline source strings over fixtures when possible.

---

## Engine tests

Engine tests should verify:

- all rules are executed
- violations are aggregated correctly
- order of violations is stable

Example:

```ts
import { strict as assert } from "node:assert";
import { analyze } from "../src/engine";

const functions = [
  {
    name: "A",
    kind: "react-component",
    location: { line: 1, column: 0 },
    apiCalls: [{ line: 1, column: 0 }],
    jsxReturns: [],
  },
  {
    name: "useHook",
    kind: "react-hook",
    location: { line: 2, column: 0 },
    apiCalls: [],
    jsxReturns: [{ line: 2, column: 2 }],
  },
];

const violations = analyze(functions);
assert.equal(violations.length, 2);
```

---

## JSON output tests

When testing full pipeline:

- validate output against `JSON_SCHEMA.md`
- ensure schemaVersion is correct
- ensure no extra fields are present

---

## What NOT to test

Do NOT test:
- AI explanations
- VS Code UI behavior
- formatting or indentation of JSON

Those belong to other layers.

---

## CI recommendations

In CI:

```bash
node --test
```

Add JSON schema validation step when CLI tests are added.

---

## Final checklist before merging

- [ ] Tests are deterministic
- [ ] Tests cover positive and negative cases
- [ ] No flaky tests
- [ ] No AI usage in core tests

---

## Final note

If a rule is hard to test,
it is probably too complex.

Prefer simple, explicit rules.

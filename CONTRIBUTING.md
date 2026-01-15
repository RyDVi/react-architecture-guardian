# Contributing to React Architecture Guardian

Thank you for your interest in contributing to **React Architecture Guardian**.

This project focuses on deterministic architecture analysis
for React frontend code.

Please read this document carefully before opening an issue or pull request.

---

## Project goals

- Detect architectural violations in React frontend code
- Keep detection fully deterministic
- Use AI only for explanation, never for decision-making
- Provide clear, explainable feedback

This project is NOT:
- a linter replacement
- a formatter
- a style guide
- a code generator

---

## Core principles (non-negotiable)

1. Determinism over intelligence
2. Rules before AI
3. Go core is the source of truth
4. VS Code is UI only
5. Architecture decisions must be explicit

Changes violating these principles will not be accepted.

---

## What you can contribute

### Accepted contributions
- New deterministic architecture rules
- Improvements to existing rules
- Documentation improvements
- Tests
- Performance optimizations

### Not accepted
- AI-based violation detection
- Moving logic from Go core to VS Code
- Probabilistic or heuristic-only rules without discussion
- Replacing Go core with JavaScript

---

## Architecture rules guidelines

- Rules must be pure functions
- Rules must be deterministic
- Rules must return structured violations
- Rules must be testable in isolation

---

## AI-related contributions

AI is allowed ONLY for:
- Explaining existing violations
- Rephrasing rule messages
- Suggesting refactoring direction

AI is FORBIDDEN from:
- Detecting violations
- Changing severity
- Inventing rules
- Inferring architecture

---

## Tests

All rule changes must include tests.

---

## Pull request checklist

- [ ] Deterministic logic only
- [ ] Tests added or updated
- [ ] Documentation updated if needed
- [ ] No AI-based detection
- [ ] No logic moved to VS Code

---

## Final note

React Architecture Guardian is opinionated by design.

If unsure whether a change fits the project,
open a discussion first.

Thank you for contributing.

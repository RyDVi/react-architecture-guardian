# Roadmap — React Architecture Guardian

This document outlines the planned evolution of **React Architecture Guardian**.

The roadmap is intentionally conservative.
Stability, determinism, and clarity have priority over rapid feature growth.

---

## v0.1.0 — Foundation (current)

Goal: Establish a stable, trustworthy core.

### Core
- [x] Deterministic TypeScript analyzer
- [x] AST parsing via TypeScript compiler API (TypeScript / TSX)
- [x] Function classification (component / hook / utility)
- [x] JSON output with stable schema

### Rules
- [x] no-api-in-react-component
- [x] no-jsx-in-hooks
- [ ] complex-logic-in-ui (warning)

### Tooling
- [x] CLI (`rag <file>`)
- [x] JSON schema contract
- [x] Testing guide
- [x] Developer setup documentation

### VS Code
- [x] Extension skeleton
- [x] Diagnostics rendering
- [ ] Auto-run on save (opt-in)

---

## v0.2.0 — Configuration & Stability

Goal: Make the tool usable in real projects.

- [ ] `rag.config.ts`
- [ ] Rule enable / disable
- [ ] Severity overrides (warning ↔ error)
- [ ] Stable violation ordering
- [ ] Snapshot tests for JSON output

---

## v0.3.0 — Rule Expansion

Goal: Cover common React architecture mistakes.

- [ ] no-domain-imports-in-ui
- [ ] no-infra-imports-in-hooks
- [ ] no-stateful-logic-in-ui
- [ ] no-async-effects-in-render

All rules remain:
- deterministic
- local to a file
- explainable without AI

---

## v0.4.0 — VS Code UX

Goal: Improve developer experience without moving logic to UI.

- [ ] Hover explanations
- [ ] Quick links to documentation
- [ ] Rule documentation panel
- [ ] Disable rule from diagnostic (writes config)

---

## v0.5.0 — Optional AI Layer

Goal: Help developers understand violations faster.

AI will:
- explain *why* a violation exists
- suggest refactoring direction

AI will NOT:
- detect violations
- change severity
- introduce new rules

AI can be fully disabled.

---

## v1.0.0 — Stable Release

Goal: Long-term stability.

- [ ] Backward-compatible JSON schema
- [ ] Versioned rules
- [ ] Migration guide
- [ ] Performance benchmarks
- [ ] Real-world case studies

---

## Explicit non-goals

These are intentionally out of scope:

- Style enforcement
- Formatting
- Automatic code rewriting
- Project-wide inference
- Probabilistic analysis

---

## Philosophy reminder

> A smaller, predictable tool
> is better than a powerful but opaque one.

---

## How to contribute to the roadmap

- Open an issue with a concrete proposal
- Explain why it must be deterministic
- Provide minimal examples

Ideas without examples or determinism guarantees
may be declined.

# React Architecture Guardian — Architecture

## Purpose

This project provides a deterministic architecture analysis tool
for React frontend projects.

The goal is NOT to enforce style or formatting,
but to detect architectural violations and explain them clearly.

---

## Core principles

1. Architecture decisions are deterministic
2. AI is used only for explanation, never for detection
3. Core analysis must be language- and parser-agnostic
4. VS Code is a thin UI layer
5. TypeScript core is the source of truth

---

## Supported scope (MVP)

Supported:
- React only
- Functional components only
- Custom hooks only
- Frontend code only

Explicitly NOT supported:
- Class components
- Backend logic
- State managers
- UI kits

---

## High-level flow

React (.tsx)
→ TypeScript analyzer (TypeScript compiler API)
→ JSON violations
→ VS Code diagnostics
→ Optional AI explanation

---

## Architecture layers

- UI — React components
- Hooks — custom hooks
- Domain — business logic
- Infra — API, storage, transport

Architecture is enforced through one-way dependencies:
- UI → Hooks
- Hooks → Domain
- Domain → Infra

Reverse dependencies are violations.

---

## Determinism rule

If the same file is analyzed twice,
the result MUST be identical.

AI must never affect:
- violation existence
- severity
- rule selection

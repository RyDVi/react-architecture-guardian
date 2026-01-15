# React Architecture Guardian — JSON Output Schema

This document defines the stable JSON contract
between the Go analyzer core and the VS Code extension.

This schema is versioned and backward-compatible.
Breaking changes require a major version bump.

AI MUST NOT modify or extend this schema.

---

## Schema version

```json
{
  "schemaVersion": "1.0.0"
}
```

---

## Root object

```json
{
  "schemaVersion": "1.0.0",
  "filePath": "string",
  "violations": []
}
```

---

## Violation object

```json
{
  "ruleId": "string",
  "message": "string",
  "severity": "error | warning",
  "function": {
    "name": "string",
    "kind": "react-component | react-hook | utility"
  },
  "location": {
    "line": 1,
    "column": 0
  }
}
```

---

## Full JSON Schema (Draft 7)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "React Architecture Guardian Output",
  "type": "object",
  "required": ["schemaVersion", "filePath", "violations"],
  "properties": {
    "schemaVersion": {
      "type": "string",
      "enum": ["1.0.0"]
    },
    "filePath": {
      "type": "string"
    },
    "violations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["ruleId", "message", "severity", "function", "location"],
        "properties": {
          "ruleId": { "type": "string" },
          "message": { "type": "string" },
          "severity": {
            "type": "string",
            "enum": ["error", "warning"]
          },
          "function": {
            "type": "object",
            "required": ["name", "kind"],
            "properties": {
              "name": { "type": "string" },
              "kind": {
                "type": "string",
                "enum": [
                  "react-component",
                  "react-hook",
                  "utility"
                ]
              }
            }
          },
          "location": {
            "type": "object",
            "required": ["line", "column"],
            "properties": {
              "line": {
                "type": "integer",
                "minimum": 1
              },
              "column": {
                "type": "integer",
                "minimum": 0
              }
            }
          }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}
```

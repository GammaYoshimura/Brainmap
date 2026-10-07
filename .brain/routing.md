# Routing Principles

Core principles governing context discovery, document navigation, and token efficiency in Brainmap.

## 1. Prime Objective: Smallest Sufficient Context

The primary goal of Brainmap context routing is:
> **Minimize the irrelevant tokens an AI needs to read to solve a task.**

Rather than supplying an entire codebase or large consolidated manuals, the router identifies the minimal sufficient subset of knowledge required for a given objective.

## 2. Tiered Routing Flow

Routing traverses knowledge hierarchically to prevent token explosion:

```text
Global Router (.brain/index.md)
       │
       ▼
Subsystem Router (.brain/subsystems/<subsystem>/index.md)
       │
       ▼
Specialized Knowledge / Contracts / ADRs
       │
       ▼
Target Source Files & Tests
```

### Depth Guideline
Avoid routing chains deeper than 3 hops:
`Global Index -> Subsystem Index -> Specialized Document`

## 3. Context Selection Dimensions

When routing for a task prompt, the router resolves five distinct dimensions:

1. **Relevant Brain Documents**: High-level guidance, architectural constraints, and contracts.
2. **Relevant ADRs**: Past architectural choices directly impacting the area of change.
3. **Relevant Source Files**: The concrete files that need modification or inspection.
4. **Relevant Tests**: Unit, integration, or regression suites that verify the affected functionality.
5. **Relevant Dependencies**: Manifests and external package boundaries involved.

## 4. Deterministic Matching Priority

Relevance is resolved through deterministic heuristics before semantic fallbacks:
1. Exact file path and directory match.
2. Exact symbol, function, or class identifier match.
3. Subsystem tag and boundary match.
4. Keyword and natural-language token relevance scoring.

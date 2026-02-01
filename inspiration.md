# Inspiration Library - Dependency/Call Graph Tools for VisuDEV

Goal: do not reuse code. Reuse ideas, data models, UX patterns, and output formats so we do not have to reinvent the concept.

## 1) Executive summary

- We can borrow proven graph semantics (node/edge types), rule concepts, and visualization patterns.
- Dependency-cruiser and madge define how a module graph and rule violations look.
- Emerge shows a clean, interactive explorer with clustering and metrics overlays.
- Code2flow (and pyan for Python) demonstrate a pragmatic call-graph approach.
- CodeBoarding proves that Mermaid exports are a fast way to document architecture.
- Mercury-graph is not a code analyzer, but its analytics (centrality, communities) are useful for ranking and clustering.

## 2) Scope for VisuDEV

- Blueprint: file/module dependency graph (Routes -> Components -> Imports -> API calls).
- AppFlow: function call graph and UI event to handler mapping.
- Data: DB query nodes and RLS/policy edges.
- Output: interactive graph + export (Mermaid/DOT/JSON).

## 3) Detailed pattern library by tool

### 3.1 dependency-cruiser (JS/TS dependency analysis + rules)

**What it does**

- Scans source code for import/require relationships.
- Produces a dependency graph plus rule violations.

**Graph model to mirror**

- Node: file/module.
- Edge: import dependency.
- Violation: edge or node that breaks a rule (layering, forbidden imports, etc).

**UX patterns to borrow**

- Rule violations list with severity and filter by rule.
- Layer-based view: show allowed and disallowed edges differently.

**Strengths**

- Clear rule model (allow/deny, path-based filters).
- Multiple output formats.

**Limits**

- Static import analysis only; dynamic import coverage is partial.

**VisuDEV mapping**

- Blueprint tab is the direct fit.
- Add a "Rules" subpanel to show violations.

**Minimal spec**

- Input: file graph (imports).
- Output: nodes[], edges[], violations[].
- Violations: ruleId, severity, source, target, message.

---

### 3.2 madge (dependency graph + circular deps)

**What it does**

- Builds a JS/TS dependency graph.
- Detects circular dependencies.

**Graph model to mirror**

- Cycle groups: list of nodes forming cycles.

**UX patterns to borrow**

- Cycle toggle: highlight circular edges/nodes.

**Strengths**

- Fast and simple.

**Limits**

- Less rule system than dependency-cruiser.

**VisuDEV mapping**

- Blueprint: add cycle detection and badges.

**Minimal spec**

- Input: imports.
- Output: cycles[] + node flags.

---

### 3.3 emerge (interactive webapp + metrics)

**What it does**

- Builds a dependency graph and overlays metrics (size, coupling, clusters).

**Graph model to mirror**

- Node metrics: size, complexity, fan-in, fan-out.
- Cluster groups: folder/module boundaries.

**UX patterns to borrow**

- Cluster view: group nodes and allow collapse/expand.
- "Orphans" and "unlinked" filter.
- Search + isolate node + highlight neighbors.

**Strengths**

- Usable graph explorer out of the box.

**Limits**

- Visual complexity can overwhelm large graphs.

**VisuDEV mapping**

- Blueprint: add clustering and metrics overlays.

**Minimal spec**

- Input: nodes, edges, file metrics (loc, churn, deps).
- Output: clusterGroups[], heatmap coloring.

---

### 3.4 dep-tree (3D graph + entropy)

**What it does**

- Visualizes dependency structure and tries to identify "entropy" (high coupling).

**Graph model to mirror**

- Hotspot score per node.

**UX patterns to borrow**

- "Hotspot" filter and highlight.

**Strengths**

- Forces a conversation about complexity.

**Limits**

- 3D is not required; the concept is useful, not the UI.

**VisuDEV mapping**

- Blueprint: add hotspot scores and a "complexity" overlay.

**Minimal spec**

- Metric: fan-in + fan-out + size.
- Output: hotspotScore per node.

---

### 3.5 codegraph (Python static dependency graph)

**What it does**

- AST-based dependency graph for Python without executing code.

**Graph model to mirror**

- Module-level edges, function references where possible.

**UX patterns to borrow**

- Lightweight HTML explorer (for quick inspect).

**Strengths**

- Safe static analysis for Python repos.

**Limits**

- Focused on Python; no JS/TS support.

**VisuDEV mapping**

- Optional for Python backends in AppFlow.

**Minimal spec**

- Input: AST.
- Output: module-level edges.

---

### 3.6 code2flow (call graphs)

**What it does**

- AST-based call graphs for Python, JS, Ruby, PHP.

**Graph model to mirror**

- Function nodes + call edges.

**UX patterns to borrow**

- "Pretty good" call graph as best effort with confidence score.

**Strengths**

- Quick call graph without deep runtime analysis.

**Limits**

- Dynamic calls and runtime dispatch are hard to resolve.

**VisuDEV mapping**

- AppFlow: connect UI event handlers to functions and API calls.

**Minimal spec**

- Input: AST.
- Output: functionNodes[], callEdges[], confidence.

---

### 3.7 pyan (Python call graphs)

**What it does**

- Static Python call graph with Graphviz output.

**Graph model to mirror**

- Function call edges.

**UX patterns to borrow**

- "Debug export" view for quick checks.

**Strengths**

- Works on pure Python projects.

**Limits**

- GPL license risk; use as inspiration only.

**VisuDEV mapping**

- Optional fallback for Python analysis.

**Minimal spec**

- Input: Python AST.
- Output: function edges.

---

### 3.8 CallFlow (profiling oriented call graphs)

**What it does**

- Visualizes call graphs from runtime profiles.

**Graph model to mirror**

- Weighted edges (call counts, time).

**UX patterns to borrow**

- Edge weight as thickness and time overlays.

**Strengths**

- Clear model for performance/trace views.

**Limits**

- Needs runtime data; not a static analyzer.

**VisuDEV mapping**

- Future "Performance Lens".

**Minimal spec**

- Input: runtime call tree.
- Output: weighted graph.

---

### 3.9 Sourcetrail (interactive explorer)

**What it does**

- Shows a graph and allows code navigation side-by-side.

**Graph model to mirror**

- Code index with symbol references.

**UX patterns to borrow**

- Focus node + neighbors.
- Clicking nodes opens code context.

**Strengths**

- Excellent interaction model.

**Limits**

- Discontinued; treat as UX inspiration only.

**VisuDEV mapping**

- Blueprint and AppFlow inspector panel.

---

### 3.10 CodeBoarding (onboarding diagrams)

**What it does**

- Generates high-level architecture diagrams from code.

**Graph model to mirror**

- Abstracted nodes (subsystems, layers) instead of files.

**UX patterns to borrow**

- "Overview" diagram per repo.

**Strengths**

- Makes large codebases approachable.

**Limits**

- Abstraction quality varies.

**VisuDEV mapping**

- Architecture tab or export button.

---

### 3.11 mercury-graph (graph analytics + viz)

**What it does**

- Graph analytics and visualization modules.

**Graph model to mirror**

- Centrality and community detection outputs.

**UX patterns to borrow**

- Cluster highlight and rank list for key nodes.

**Strengths**

- Useful for clustering and ranking.

**Limits**

- Not a code analyzer.

**VisuDEV mapping**

- Blueprint: top N modules by centrality + cluster overlay.

---

## 4) Unified target graph schema (recommended)

### Node (core)

- id
- type: ui-event | function-call | api-call | db-query | module
- label
- filePath
- symbolName
- lineStart, lineEnd
- layer: ui | compute | data | external
- metrics: { loc, fanIn, fanOut, complexity, hotspot }
- tags: []
- repo, commitSha

### Edge (core)

- id
- type: imports | calls | requests | queries | navigates
- sourceId, targetId
- confidence (0-1)
- evidence: { filePath, lineStart, lineEnd, snippet }
- weight (optional)

### Rule violation (optional)

- id
- ruleId
- severity: info | warn | error
- message
- sourceId, targetId
- evidence (same shape as edges)

## 5) Suggested heuristics (first iteration)

### JS/TS imports

- import ... from '...'
- require('...')
- export ... from '...'
- dynamic import('...') -> lower confidence

### API calls

- fetch()
- axios.get/post/...
- graphql tagged templates
- supabase.from(...).select/insert/update

### UI events

- onClick/onSubmit/onChange handlers
- router.push or navigate calls

### DB queries

- supabase SQL or rpc calls
- direct SQL strings (detect SELECT/INSERT/UPDATE keywords)

## 6) UX patterns to implement in VisuDEV

- Graph explorer with focus node + neighbor highlight
- Layer filter (UI / compute / data / external)
- Cycle toggle
- Orphan filter
- Cluster by folder/module
- Rule violations panel
- Export buttons (Mermaid/DOT/JSON)

## 7) Phased adoption plan

### Phase 0 - Blueprint MVP

- Build file/module graph from imports.
- Add search, focus, and basic filters.

### Phase 1 - AppFlow

- Add function call edges and UI-event mapping.
- Connect function calls to API calls.

### Phase 2 - Data

- Add DB query nodes and edges.
- Add policy/persistence layer nodes.

### Phase 3 - Analytics and ranking

- Add centrality and hotspot overlays.
- Add violations and architecture rules.

## 8) Decision checklist for each feature

- Does it reduce time-to-understand for a new dev?
- Does it add actionable signal (not just noise)?
- Can it be computed statically with acceptable accuracy?
- Does it scale to large repos without UI overload?

## 9) Open questions

- MVP language scope: JS/TS only or include Python?
- Do we need Mermaid export in MVP or later?
- Should rule violations be visible in MVP or phase 3?

# Acceptance: execution-view (#72)

## Intent

Render the execution sequence for a selected route as a horizontal pipeline with inspectable step evidence.

## Criteria

- [x] ExecutionView lists routes/use cases and renders the selected pipeline
- [x] Pipeline layout is left-to-right with clear step nodes
- [x] Each step shows relevant evidence (auth, validation, DB access)
- [x] Graph builder produces execution subgraphs from route nodes
- [x] Component and unit tests pass
- [x] npm run checks green

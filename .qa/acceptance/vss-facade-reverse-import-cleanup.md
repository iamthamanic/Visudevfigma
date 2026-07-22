# Feature: Legacy facade reverse-import cleanup

## Happy Path

- [x] Facades import migrated DTOs from slice public entries
- [x] Boundary check allows public entry for reverse; baseline empty of reverse lines
- [x] typecheck/rules green

## Implementation Notes

- `boundary-imports.cjs` skips public slice entry for reverse imports
- api / useVisuDev / supabase-client use barrels; blueprint types exported from index

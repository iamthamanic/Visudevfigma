# Feature: [visudev-gapclose P3-2c] Allow docker-compose.yml in Deno blueprint file filter

## Intent
`isSupportedBlueprintFile` accepts yml/yaml so compose Redis/Postgres facts reach the graph. Enrichment OFF.

## Happy Path
- [ ] browo Re-Scan: infra postgresql + redis nodes
- [ ] Unit test compose file entry produces infra-service facts
- [ ] Leave matrix db=confirmed unchanged

## Implementation Notes
Add yml/yaml to isSupportedBlueprintFile in blueprint-pipeline.service.ts

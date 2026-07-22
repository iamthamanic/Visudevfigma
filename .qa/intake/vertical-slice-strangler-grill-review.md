# Independent Review: Vertical-Slice-Strangler Self-Grill

> **Verdict:** ACCEPT-WITH-CHANGES
> **Verbindliche Folgequelle:** `vertical-slice-strangler-intent-contract.md`

## Kurzbegründung

Der Self-Grill trifft die richtige Grundrichtung: Capability-Ownership, dünne gemeinsame Contracts, getrennte Runtimes und inkrementeller Strangler. Unverändert wäre er aber nicht belastbar genug für Feature-Intake, weil er Naming-Churn als Architekturentscheidung behandelt, A–D fälschlich als automatische Wirkungskette einordnet und Plattform-, Adapter- sowie reale Legacy-Abhängigkeiten aus dem Grenzmodell auslässt.

## Wesentliche Korrekturen

- **AS-1 — CHANGE:** A bleibt Nordstern; A–D sind jedoch vier verbindliche Gates. Unabhängige Test-/Mergebarkeit, Navigierbarkeit und Issue-Disziplin entstehen nicht „gratis“ aus Kolokation.
- **AS-2 — CHANGE:** `src/modules/` bleibt die physische Slice-Root. Ein zweiter Baum `src/slices/` würde `AGENTS.md`, bestehende Imports und den Strangler unnötig belasten, ohne vertikale Ownership zu verbessern.
- **AS-3 — ACCEPT:** Kein Package-Split pro Slice und kein Hybrid-Ausbau bleiben Non-Goals dieses Vorhabens, aber nicht ewige Architekturverbote.
- **Shared Kernel präzisiert:** `shared/` ist kein pauschaler Kernel. Die Self-Grill-Regel hieß „Rule of Three“, erlaubte aber bereits zwei Slices. Verbindlich ist nun Runtime-Grenze oder echte Rule of Three plus Importreinheit.
- **Runtime-Modell korrigiert:** `LocalVisuDevClient` und `SupabaseVisuDevClient` implementieren das Frontend-Interface; nicht Local Engine und Cloud Analyzer selbst. Die Cloud-Implementierung liegt wesentlich unter `src/supabase/functions/visudev-analyzer/`; `src/lib/visudev/analyzer.ts` enthält Frontend-Typen.
- **Fehlende vierte Kategorie ergänzt:** `shell`, zentraler Store, Auth, generische API-Facades und `src/lib/visudev-api/` sind Composition/Plattform/Adapter — weder Produkt-Slice noch Kernel noch Analyzer-Capability.
- **Reale Grenzschuld aufgenommen:** Settings importiert einen Projects-Deep-Path; `src/utils/api.ts`, `src/utils/useVisuDev.ts` und `supabase-client.ts` importieren Modul-Typen rückwärts. Neue Vorkommen werden verboten, bestehende Kanten stranguliert.
- **Blueprint-Grenze gehärtet:** Views sind erst Sub-Slices, wenn Entry-Point, eigener State/Test und Sibling-Isolation real bestehen. Ein Verzeichnisname allein beweist keine Slice-Grenze.
- **Issue-Schnitt korrigiert:** Slice-lokale Arbeit bleibt vertikal in einem Issue. Cross-Boundary-Outcomes erhalten einen Parent und kompatibel mergebare Contract-, Runtime-, Consumer- und Cleanup-Children; reine Layer-Issues bleiben verboten.
- **Migration konkretisiert:** Logs ist der erste kleine Pilot; Blueprint bleibt zuletzt. Jeder Move erhält Baseline, Compatibility-Plan, Boundary-Check und eine überprüfbare Definition of Done.

## Riskante Aussagen des Self-Grills, die nicht übernommen wurden

- „Screen/Route“ als alleiniger Produktslice-Test: übersieht user-sichtbare Panels, Kommandos und Workflows.
- „Jede Analyzer-Fähigkeit liegt in `providers/`“: entspricht der realen Engine-Struktur nicht; Software-Graph-Fähigkeiten liegen auch in Services.
- „Kein Pfeil überspringt den Kernel“: Typverträge sind kein Runtime-Hop. Der echte Pfad läuft über Slice-Service, Frontend-Adapter/Dispatch und Runtime-API.
- feste Startreihenfolge mit Settings: Settings besitzt bereits eine Cross-Slice-Deep-Abhängigkeit und ist kein sicherer erster Pilot.
- gesamtes `shared/` inklusive Demo-Seeds als Kernel: würde den Kernel vorzeitig aufblähen.

## Freigabe

**Feature-Intake: JA.** Alle drei Self-Annahmen sind entschieden, die Ownership- und Importgrenzen sind verbindlich, und Foundation, Pilot, Cross-Boundary-Schnitt sowie Done-Kriterien sind ohne weitere User-Entscheidung definiert. Feature-Intake MUSS den Intent Contract und nicht den Self-Grill als Source of Truth verwenden.

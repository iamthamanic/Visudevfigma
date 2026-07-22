# Grill-Log: Vertical-Slice-Strangler-Umbau (VisuDEV)

> **Modus:** `grill-me` als **Self-Grill**. Der User hat gesagt „grill dich selbst“ — ich beantworte die Grill-Fragen selbst, basierend auf bekannter User-Intention + VisuDEV-Code-Kontext. Kein Code. Nur Entscheidungs-Log.
> **Repo:** `iamthamanic/visudev-app`, App in `Visudevfigma/`
> **Datum:** 2026-07-22
> **Status-Legende:** `FESTGELEGT` (self-entschieden im Sinne der Intention) · `ANNAHME-SELF` (self-entschieden, User könnte widersprechen) · `OFFEN` · `BLOCKIERT`

---

## 0. Code-Grounding (Ist-Zustand, verifiziert)

Damit die Grill-Entscheidungen nicht in der Luft hängen — das ist der reale Baustand:

- **App-Shell / UI-Module:** `src/modules/{appflow, blueprint, data, logs, projects, settings, shell}` — jedes Modul hat bereits `components/ hooks/ pages/ services/ styles/ types.ts index.ts`. → **Struktur ist schon quasi-vertikal**, nur nicht so benannt/diszipliniert.
- **Blueprint-Views (7 + AC):** `Architecture, Atlas, Dependencies, Diagnostics, Evolution, Execution, Infrastructure` + `SecurityMatrix/AccessControl`. Alle unter `src/modules/blueprint/components/`.
- **Shared Kernel (real vorhanden):** `Visudevfigma/shared/` = `blueprint-graph-{types,projections,inference,routes}`, `access-control-{matrix,status,adapter,types}`, `software-graph.types`, `visudev-api.types`, `local-path-security`, `demo-*-seed`. → **Das ist der Graph- + AC-Contract.**
- **Dual Runtime (real vorhanden):**
  - **Local Engine:** `local-engine/` = eigenständiger Node-Server (eigenes `package.json`, `tsx watch`), mit `providers/` (`autoguide-analysis`, `legacy-visudev-analysis`, `legacy-appflow-runner`, `local-preview-runner`, `local-data-introspection`), `routes/ services/ storage/`.
  - **Cloud Analyzer:** `src/lib/visudev/analyzer.ts` + `src/lib/visudev-api/supabase-client.ts`.
  - **Dispatch-Seam:** `src/lib/visudev-api/index.ts` → `createVisuDevClient()` schaltet `local` vs `supabase` (hybrid reserviert, wirft aktuell). **Das ist die Runtime-Grenze.**
- **Gapclose-Erfahrung (real, in `.qa/acceptance/`):** `gapclose-p0-leave-routes`, `gapclose-p0-meteor-mongo`, `gapclose-p*-prisma-tables`, `gapclose-p3-leave-matrix-db`. → Leave-Bridge, Mongo-Adapter, Prisma-Tables sind **Analyzer-Parser-Fähigkeiten**, keine UI-Features.

**Zentrale Beobachtung, die den ganzen Grill trägt:** VisuDEV hat **zwei Sorten „Features"**:

1. **Produkt-/View-Features** (was der User sieht: Atlas, Dependencies, …) — echte vertikale Slices.
2. **Analyzer-Fähigkeiten** (leave-bridge, mongo, prisma) — horizontale Engine-Parser hinter dem Graph-Contract.
   Die User-Aussage „Slices sind die Features" ist für (1) trivial richtig und für (2) eine Falle. Diese Kollision wird in Branch 2 + Kreuzabhängigkeiten aufgelöst.

---

## Branch: 1 — Root / Ziel

### Knoten: Was ist das eine oberste Ziel?

- **Entscheidung:** **Ziel A ist Root:** „Alles, was eine Capability ausmacht, liegt in **einem** Slice-Ordner." B (unabhängig test-/mergebar), C (Navigierbarkeit), D (Agents schneiden Issues als Slice) sind **abgeleitete Konsequenzen** von A, keine gleichrangigen Roots.
- **Abgelehnte Alternativen:**
  - _B als Root_ (Testbarkeit zuerst) → abgelehnt: Testbarkeit ist ein Nebenprodukt guter Kolokation, kein Selbstzweck; führt zu Test-Infrastruktur-Goldplating vor Struktur.
  - _C als Root_ (Navigierbarkeit zuerst) → abgelehnt: Navigierbarkeit ist eine Folge von Kolokation, nicht ihre Ursache.
  - _D als Root_ (Agent-Workflow zuerst) → abgelehnt: Wenn A steht, fällt D automatisch (Issue = Slice-Ordner). D-first optimiert Prozess vor Substanz.
  - _Alle A–D gleichrangig_ → abgelehnt: Der User will „A–D alle", aber ohne Priorität kollidieren sie bei Trade-offs. Ein Root ist nötig, damit ein Review-Agent Konflikte deterministisch auflösen kann.
- **Constraint:** User-Tempo-Wunsch („Idee → schnell erweitern"), Strangler (kein Big-Bang), bestehende quasi-vertikale Modulstruktur.
- **Annahmen:** Kolokation nach Capability ist der Haupt-Hebel für alle vier Ziele. (Gestützt: `src/modules/*` ist schon fast so aufgebaut → geringe Migrationsreibung.)
- **Downstream-Auswirkung:** Ändert sich der Root (z.B. B wird Root), dann priorisiert die Migration Test-Harness-Bau statt Ordner-Kolokation → langsamer erster Nutzen, widerspricht Tempo-Wunsch.
- **Status:** `FESTGELEGT`

### Knoten: A–D „alle gewünscht" vs. eine Priorität — Widerspruch?

- **Entscheidung:** Auflösung als **Rangfolge, nicht Auswahl:** `A (Root) → D (fällt gratis mit A) → B (Slice-lokale Tests) → C (Navigierbarkeit via Konvention)`. Alle vier bleiben Ziele; A gewinnt jeden Trade-off-Konflikt.
- **Abgelehnte Alternativen:** „Alle vier gleich gewichten" (siehe oben, nicht entscheidbar).
- **Constraint:** Es muss eine Tie-Break-Regel für den späteren Review-/Runner-Agenten geben.
- **Annahmen:** User akzeptiert, dass „alle gewünscht" ≠ „alle gleich priorisiert".
- **Downstream-Auswirkung:** Review-Agent nutzt diese Rangfolge als Entscheidungsregel bei Slice-Grenzstreitigkeiten.
- **Status:** `ANNAHME-SELF` (User könnte auf echter Gleichrangigkeit bestehen — dann Tie-Break neu verhandeln)

---

## Branch: 2 — Slice-Definition (die härteste Frage)

### Knoten: Was genau IST ein Slice?

- **Entscheidung:** Ein **Slice = eine vom User erlebbare Capability**, kolokiert als `src/slices/<capability>/` mit allem, was dazu gehört: `pages/ components/ hooks/ state/ services(client-adapter)/ types/ __tests__/ index.ts (Public API)`. Der Slice besitzt **UI → State → Contract-Aufruf**, aber **nicht** die Engine-Implementierung dahinter.
- **Abgelehnte Alternativen:**
  - _Slice = technischer Layer_ (components/, hooks/, services/ global) → abgelehnt: genau der „Layered als Default fühlt sich falsch an"-Schmerz.
  - _Slice = Analyzer-Parser_ (leave-bridge etc. als eigener Top-Level-Slice) → abgelehnt: das sind keine User-Capabilities, sie haben keine eigene Route/keinen eigenen Screen.
  - _Slice = einzelne Blueprint-View auf Top-Level_ → abgelehnt für jetzt: die 7 Views teilen so viel Graph-State, dass 7 Top-Level-Slices den Kernel aufblähen. Sie werden **Sub-Slices unter `blueprint/`** (siehe Feature-Mapping).
- **Constraint:** „Slices sind die Features" (User, verbindlich) + Dual Runtime bleibt getrennt + dünner Shared Kernel.
- **Annahmen:** Eine Capability = eine navigierbare Einheit (Route/Screen/klar abgegrenzte Interaktion).
- **Downstream-Auswirkung:** Bricht diese Definition (z.B. Slice = Layer), kollabiert Ziel A und der ganze Umbau ist sinnlos.
- **Status:** `FESTGELEGT`

### Knoten: Die eine klare Regel für „Slice=Feature vs. Leave-Bridge vs. Mongo-Adapter"

- **Entscheidung — EINE REGEL:**
  > **„Hat es einen eigenen Screen/eine eigene Route/eine eigene User-Interaktion? → Produkt-Slice (`src/slices/*`). Erzeugt/transformiert es nur Graph-Daten hinter dem Contract? → Engine-Capability (`local-engine/src/providers/*` bzw. `shared/`-Normalizer), NIEMALS ein Produkt-Slice."**
- **Konkrete Zuordnung:**
  - `leave-routes` (Leave-Bridge) → **Engine-Capability** (Graph-Kanten-Inferenz), sichtbar über `shared/blueprint-graph-routes.ts`. Kein Slice.
  - `meteor-mongo` / `prisma-tables` → **Engine-Capability** (DB-Introspection-Provider: `local-data-introspection.provider.ts`). Kein Slice.
  - `Atlas`, `Dependencies`, `Diagnostics`, … → **Produkt-Slices** (Sub-Slices unter `blueprint`).
- **Abgelehnte Alternativen:** „Jede Analyzer-Fähigkeit ist auch ein Slice" → abgelehnt: führt zu 30+ Pseudo-Slices ohne UI, zerstört Navigierbarkeit (C) und den dünnen Kernel.
- **Constraint:** Gapclose-Schmerz zeigte: cross-cutting Parser (Leave-Bridge vergessen) betrifft **mehrere** Views gleichzeitig → sie MÜSSEN hinter dem Contract liegen, nicht in einem View-Slice.
- **Annahmen:** Jede Analyzer-Fähigkeit lässt sich als Graph-Beitrag (Nodes/Edges/Attribute) ausdrücken, den mehrere Views konsumieren.
- **Downstream-Auswirkung:** Würde man Leave-Bridge in einen View-Slice legen, könnten andere Views (Security-Matrix, Execution) sie nicht nutzen → erneuter Gapclose-Schmerz. Diese Regel verhindert genau das.
- **Status:** `FESTGELEGT` (dies ist die wichtigste Einzelregel des ganzen Umbaus)

### Knoten: Slice-Granularität — flach oder verschachtelt?

- **Entscheidung:** **Zwei Ebenen erlaubt, max. zwei.** Top-Level = grobe Capability-Domäne (`blueprint`, `projects`, `appflow`, `settings`, `logs`, `data`). Innerhalb `blueprint/` Sub-Slices je View (`atlas/`, `dependencies/`, …). Keine dritte Ebene.
- **Abgelehnte Alternativen:** _Alles flach auf Top-Level_ (7 Views + AppFlow + Projects + … = 15+ Top-Level-Slices) → abgelehnt: Blueprint-Views teilen Graph-State/Toolbar/Selection → künstliche Trennung. _Beliebig tief verschachteln_ → abgelehnt: verliert Navigierbarkeit.
- **Constraint:** Views teilen `useAtlasViewState`, `blueprint-view-config`, Selection-Hooks → Kolokation unter `blueprint/` sinnvoll.
- **Annahmen:** Kein Bedarf an Slice-Deploy als Micro-Frontend (User bestätigt) → physische Nähe ist unschädlich.
- **Downstream-Auswirkung:** Wenn eine View doch standalone deploybar werden müsste, müsste sie auf Top-Level promoted werden (später möglich, Strangler-kompatibel).
- **Status:** `FESTGELEGT`

---

## Branch: 3 — Shared Kernel

### Knoten: Was gehört in den Kernel, was nicht?

- **Entscheidung:** **Dünner Shared Kernel = nur der Contract**, den ≥2 Slices ODER beide Runtimes teilen: `blueprint-graph-types`, `software-graph.types`, `access-control.types` + AC-Matrix-Logik, `visudev-api.types`, `local-path-security`, Graph-Projektionen/Inferenz, Demo-Seeds. **Kein UI, keine View-spezifische Logik, keine Runtime-Implementierung.**
- **Abgelehnte Alternativen:**
  - _Kein Kernel, jeder Slice dupliziert Typen_ → abgelehnt: Graph-Contract-Drift zwischen Views = Chaos.
  - _Fetter Kernel („shared utils")_ → abgelehnt: klassische Shared-Mud-Ball; alles landet dort, Slices werden anämisch.
- **Constraint:** User: „Graph/shared Contract wahrscheinlich behalten (dünner Shared Kernel)". Dual Runtime braucht **einen** gemeinsamen Graph-Contract, sonst divergieren local/cloud.
- **Annahmen:** Der Graph (`software-graph.types` / `blueprint-graph-types`) ist DAS stabile Interlingua zwischen Engine und Views. (Gestützt: real vorhanden, beide Runtimes normalisieren auf dieselben Typen.)
- **Downstream-Auswirkung:** Wächst der Kernel über „Contract" hinaus, verlieren Slices Unabhängigkeit (B) und Merge-Isolation → Ziel A/B brechen.
- **Status:** `FESTGELEGT`

### Knoten: Kernel-Aufnahme-Regel (damit er dünn bleibt)

- **Entscheidung:** **„Rule of Three + Two-Runtime":** Etwas darf erst in den Kernel, wenn (a) ≥2 Slices es unabhängig brauchen **oder** (b) beide Runtimes es teilen müssen. Bis dahin lebt es im Slice. Kernel-PRs brauchen erhöhten Review (Contract-Änderung = Breaking-Risiko für alle).
- **Abgelehnte Alternativen:** „Sofort teilen bei erster Wiederverwendung" → abgelehnt: premature sharing = coupling.
- **Constraint:** Dünn-halten ist explizit gewünscht.
- **Annahmen:** Slice-lokale Duplikation ist billiger als falsche Abstraktion.
- **Downstream-Auswirkung:** Steuert Branch 6 (Agents dürfen Kernel nur mit Contract-Label anfassen).
- **Status:** `FESTGELEGT`

### Aufgelöste Abhängigkeit

- **Branch 2 → Branch 3:** Engine-Capabilities (Leave-Bridge/Mongo/Prisma) schreiben in Graph-Typen → **der Kernel ist der einzige legitime Ort, an dem sich Engine-Capabilities und Produkt-Slices „sehen"**. Contract = Kontaktfläche, sonst kein direkter Import Slice→Engine.

---

## Branch: 4 — Dual Runtime (local-engine + cloud analyzer)

### Knoten: Zusammenlegen oder getrennt lassen?

- **Entscheidung:** **Getrennt lassen** (User verbindlich). `local-engine/` bleibt eigenständiges Package; Cloud-Analyzer bleibt in `src/lib/visudev` + `supabase-client`. Verbindung ausschließlich über `visudev-api`-Client-Interface + Graph-Contract.
- **Abgelehnte Alternativen:** _Runtimes vereinen (ein Analyzer)_ → abgelehnt (User): local-first (Datenschutz, kein Upload) vs. cloud (Skalierung/Sharing) sind verschiedene Betriebsmodelle.
- **Constraint:** Real existierender Dispatch in `visudev-api/index.ts` (local vs supabase, hybrid reserviert).
- **Annahmen:** Beide Runtimes können denselben Graph-Contract erfüllen (tun sie heute schon: beide normalisieren auf `software-graph`/`blueprint-graph`).
- **Downstream-Auswirkung:** Slices dürfen NIE `local-engine` oder `supabase-client` direkt importieren — nur `getVisuDevClient()`. Bricht das, ist Runtime-Austauschbarkeit weg.
- **Status:** `FESTGELEGT`

### Knoten: Ist die Runtime ein Slice, ein Kernel-Teil, oder was?

- **Entscheidung:** Runtime ist eine **dritte Kategorie: „Capability-Provider hinter dem Contract"** — weder Produkt-Slice noch Kernel. `local-engine/` = Runtime-A, cloud analyzer = Runtime-B. Beide implementieren das `VisuDevApiClient`-Interface (Teil des Kernel-Contracts).
- **Abgelehnte Alternativen:** _Engine als Slice behandeln_ → abgelehnt: verletzt Slice-Definition (kein eigener Screen). _Engine in Kernel ziehen_ → abgelehnt: Kernel wäre nicht mehr dünn/UI-frei und Runtime-Impl wäre erzwungen mitgebaut.
- **Constraint:** `visudev-api` ist bereits die saubere Grenze.
- **Annahmen:** Das Client-Interface ist stabil genug, um beide Runtimes zu decken.
- **Downstream-Auswirkung:** Engine-Capabilities (Branch 2) leben in `local-engine/src/providers/*` und/oder als Kernel-Normalizer; der Contract ist ihre einzige Außenkante.
- **Status:** `FESTGELEGT`

### Aufgelöste Abhängigkeit

- **Branch 4 → Branch 2 → Branch 3:** Klare 3-Schichten-Kontaktregel:
  `Produkt-Slice (UI/State)  →  Kernel-Contract (Graph + VisuDevApiClient)  →  Runtime-Provider (local-engine | cloud)`.
  Kein Pfeil überspringt den Kernel. Das ist die vollständige Auflösung von „Slice=Feature vs. Leave-Bridge vs. Mongo-Adapter".

---

## Branch: 5 — Migrationsstrategie (Strangler)

### Knoten: Big-Bang-Rename oder inkrementell?

- **Entscheidung:** **Strangler, inkrementell.** Kein globales Umbenennen. Neue Capabilities entstehen direkt als Slice. Bestehende `src/modules/*` werden **eine nach der anderen** zu `src/slices/*` promoted, wenn sie ohnehin angefasst werden (Boy-Scout).
- **Abgelehnte Alternativen:** _Big-Bang_ (alle Module auf einmal umziehen) → abgelehnt (User + Strangler-Prinzip): riesiger Merge-Konflikt-Block, blockiert Feature-Arbeit.
- **Constraint:** `src/modules/*` ist schon quasi-vertikal → Migration ist billig, aber nicht gratis (Imports, `index.ts` Public API).
- **Annahmen:** Ein temporärer Mischzustand `modules/` + `slices/` ist tolerierbar.
- **Downstream-Auswirkung:** Solange Mischzustand existiert, braucht es eine Lint-Regel/Konvention, die Cross-Slice-Deep-Imports verbietet (nur `index.ts`).
- **Status:** `FESTGELEGT`

### Knoten: Ordner-Name — `modules/` behalten oder `slices/`?

- **Entscheidung:** **Physisch auf `src/slices/` konvergieren** (neuer + migrierter Code), weil der User „Slices sind die Features" begrifflich verankert hat und Konsistenz mit Agent-Issue-Schnitt (Branch 6) hilft.
- **Abgelehnte Alternativen:** _`modules/` behalten, nur Disziplin ändern_ → weniger Churn, aber begriffliche Reibung mit „Slice"-Sprache und Agent-Konventionen.
- **Constraint:** Rename kostet Import-Churn; muss slice-weise (nicht global) passieren.
- **Annahmen:** User will die Slice-Sprache auch im Dateibaum sehen.
- **Downstream-Auswirkung:** Falls User `modules/` behalten will → nur Begriff, sonst identische Regeln. Kein Architektur-Impact, nur Naming.
- **Status:** `ANNAHME-SELF` (reines Naming — User kann `modules/` bevorzugen; Substanz bleibt gleich)

### Knoten: Migrations-Reihenfolge

- **Entscheidung:** Reihenfolge nach **Änderungs-Häufigkeit × Isolierbarkeit**: (1) `settings` + `logs` + `data` (klein, isoliert — Aufwärm-Slices, beweisen das Muster), (2) `projects` (mittel), (3) `appflow`, (4) `blueprint` mit Sub-Slices zuletzt (größter, teilt am meisten State). `shell` bleibt Host/Composition-Root, wird **nicht** zum Slice.
- **Abgelehnte Alternativen:** _Blueprint zuerst_ (größter Wert) → abgelehnt: höchstes Risiko als erster Schritt; erst Muster an kleinem Slice validieren.
- **Constraint:** Strangler will frühe, billige Erfolge zur Muster-Etablierung.
- **Annahmen:** `shell` ist Komposition, keine Capability → korrekt als Host.
- **Downstream-Auswirkung:** Blueprint-Migration ist der Lackmustest für die Sub-Slice-Regel (Branch 2 Granularität).
- **Status:** `FESTGELEGT`

---

## Branch: 6 — Issue-Schnitt (Agents schneiden als Slice = Ziel D)

### Knoten: Wie schneidet ein Agent ein Issue?

- **Entscheidung:** **1 Issue = 1 Slice-Grenze.** Issue-Body deklariert `slice: <pfad>`, `contractChange: yes|no`, `runtimeTouch: none|local|cloud|both`. Ein Issue darf **genau einen** Produkt-Slice ODER **einen** Kernel-Contract ODER **eine** Runtime-Capability betreffen — nie gemischt.
- **Abgelehnte Alternativen:** _Issue nach Layer_ (z.B. „alle Hooks anpassen") → abgelehnt: das ist der alte Layered-Schmerz, quer durch alle Slices.
- **Constraint:** Bestehende `.qa/intake/*-issues.{md,json}` nutzen schon `featureSlug` + `dependsOn` → Format ist etabliert, wird nur um `contractChange`/`runtimeTouch` erweitert.
- **Annahmen:** Die meisten Features sind slice-lokal; Contract-Änderungen sind selten und werden isoliert.
- **Downstream-Auswirkung:** Ein `contractChange: yes`-Issue triggert erhöhten Review (Branch 3 Kernel-Regel) und muss vor den konsumierenden Slice-Issues gemerged werden (`dependsOn`).
- **Status:** `FESTGELEGT`

### Knoten: Cross-Cutting-Issues (der Gapclose-Fall)

- **Entscheidung:** Ein cross-cutting Bedarf (z.B. „Leave-Bridge fehlt") wird **in zwei Issue-Typen zerlegt**: (I) ein Kernel/Runtime-Issue „Contract + Provider liefern Leave-Edges" (`contractChange: yes`, `runtimeTouch: both`), dann (II) N kleine Slice-Issues „View X konsumiert Leave-Edges". Nie ein einziges Mega-Issue.
- **Abgelehnte Alternativen:** _Ein cross-cutting Issue über alle Views_ → abgelehnt: genau der Leave-Bridge-Schmerz aus der Gapclose-Erfahrung (vergessene Konsumenten).
- **Constraint:** Gapclose-Lehre: cross-cutting vergessen = Schmerz → Struktur muss das explizit sichtbar machen.
- **Annahmen:** Der Contract-First-Schnitt macht „welche Views konsumieren das?" explizit (Checkliste im Kernel-Issue).
- **Downstream-Auswirkung:** Wenn (I) ohne die (II)-Konsumenten-Liste gemerged wird → wieder vergessene Views. Deshalb: Kernel-Issue MUSS die Konsumenten-Checkliste enthalten.
- **Status:** `FESTGELEGT`

### Aufgelöste Abhängigkeit

- **Branch 1 (Ziel D) → Branch 6:** Weil A Root ist, ist Issue=Slice die natürliche Schnittkante; D „fällt gratis" — bestätigt.
- **Branch 6 → Branch 3:** `contractChange`-Flag verbindet Issue-Schnitt direkt mit der Kernel-Aufnahme-Regel.

---

## Branch: 7 — Non-Goals (explizit ausgeschlossen)

### Knoten: Was bauen wir bewusst NICHT?

- **Entscheidung / Non-Goals:**
  1. **Kein Micro-Frontend / Slice-Deploy** (User bestätigt) — Slices sind Code-Organisation, kein Deploy-Artefakt.
  2. **Kein Runtime-Merge** — local-engine und cloud analyzer bleiben getrennt.
  3. **Kein Big-Bang-Umbau** — Strangler-only.
  4. **Kein Monorepo-Package-Split pro Slice** (kein `packages/atlas`) — Slices bleiben Ordner im App-Package; nur `local-engine` bleibt separates Package (ist es schon).
  5. **Kein Contract-Bypass** — Slice importiert nie Runtime direkt.
  6. **Kein „shared utils"-Eimer** — Kernel = nur Contract.
  7. **Kein Hybrid-Runtime-Ausbau** in diesem Umbau (bleibt reserved/throws).
- **Abgelehnte Alternativen:** Jeweils das Gegenteil (siehe Branches 2–5).
- **Constraint:** Tempo + Einfachheit; Umbau darf nicht selbst zum Big-Projekt werden.
- **Annahmen:** User will strukturelle Klarheit, nicht Infrastruktur-Goldplating.
- **Downstream-Auswirkung:** Wird ein Non-Goal später Ziel (z.B. Micro-Frontend), ist es ein **neuer** Epic, kein Teil dieses.
- **Status:** `ANNAHME-SELF` (Non-Goals 4 & 7 könnte User anders sehen; Rest ist durch Intention gedeckt)

---

## Branch: 8 — Risiken

### Knoten: Was kann diesen Umbau kippen?

- **Entscheidung / Risiko-Register:**
  | # | Risiko | Wahrsch. | Impact | Mitigation |
  |---|--------|----------|--------|-----------|
  | R1 | **Kernel wächst zum Mud-Ball** | Mittel | Hoch | Rule-of-Three + Two-Runtime (Branch 3); Kernel-PRs Extra-Review |
  | R2 | **Cross-Slice Deep-Imports** unterlaufen Isolation | Hoch | Hoch | Lint-Regel: nur `slice/index.ts` importierbar; CI-Check |
  | R3 | **Mischzustand `modules/`+`slices/`** verwirrt | Mittel | Mittel | Migrations-Reihenfolge (Branch 5); Tracking-Liste welcher Slice migriert |
  | R4 | **Leave-Bridge-Wiederholung** (cross-cutting vergessen) | Mittel | Hoch | Contract-First-Issue mit Konsumenten-Checkliste (Branch 6) |
  | R5 | **Blueprint-Sub-Slices teilen zu viel State** → falsche Grenzen | Mittel | Mittel | Blueprint zuletzt migrieren; State-Sharing zuerst kartieren |
  | R6 | **Runtime-Contract-Drift** (local ≠ cloud) | Niedrig | Hoch | Ein Graph-Contract im Kernel; Contract-Tests gegen beide Clients |
  | R7 | **Umbau frisst Feature-Tempo** | Mittel | Mittel | Strangler + Boy-Scout statt dedizierter Migrations-Sprint |
- **Constraint:** Begrenzte Zeit, laufende Feature-Arbeit.
- **Annahmen:** Lint-/CI-Guardrails sind billig einzuführen und tragen den größten Isolationsnutzen.
- **Downstream-Auswirkung:** Ohne R2-Guardrail zerfällt die ganze Slice-Isolation still über die Zeit.
- **Status:** `FESTGELEGT`

---

## Feature-Liste 1–10 → Slice-Zuordnung

> **Hinweis (`ANNAHME-SELF`):** Die exakte „Liste 1–10 aus früherem Grill" war im Transkript nicht 1:1 rekonstruierbar. Ich verwende die **reale Feature-Oberfläche aus dem Code** (7 Blueprint-Views + AC + AppFlow + Projects) als kanonische 1–10. Falls die frühere Liste abwich, hier korrigieren.

| #   | Feature (Capability)                 | Slice-Typ             | Ziel-Ort                                              | Begründung                                          |
| --- | ------------------------------------ | --------------------- | ----------------------------------------------------- | --------------------------------------------------- |
| 1   | **Atlas** (3D-City)                  | Produkt-Sub-Slice     | `slices/blueprint/atlas/`                             | eigener Screen, teilt Graph-State                   |
| 2   | **Dependencies**                     | Produkt-Sub-Slice     | `slices/blueprint/dependencies/`                      | eigener Screen                                      |
| 3   | **Diagnostics**                      | Produkt-Sub-Slice     | `slices/blueprint/diagnostics/`                       | eigener Screen                                      |
| 4   | **Execution**                        | Produkt-Sub-Slice     | `slices/blueprint/execution/`                         | eigener Screen                                      |
| 5   | **Evolution** (Time-Machine)         | Produkt-Sub-Slice     | `slices/blueprint/evolution/`                         | eigener Screen; nutzt git-summary-Contract          |
| 6   | **Infrastructure**                   | Produkt-Sub-Slice     | `slices/blueprint/infrastructure/`                    | eigener Screen                                      |
| 7   | **Architecture** (Layer-Stack)       | Produkt-Sub-Slice     | `slices/blueprint/architecture/`                      | eigener Screen                                      |
| 8   | **Security / Access-Control-Matrix** | Produkt-Sub-Slice     | `slices/blueprint/security/`                          | eigener Screen; **konsumiert** AC-Contract (Kernel) |
| 9   | **AppFlow**                          | Produkt-Slice (Top)   | `slices/appflow/`                                     | eigene Domäne/Route, eigener Runner-Provider        |
| 10  | **Projects** (Anlage/Auswahl/Quelle) | Produkt-Slice (Top)   | `slices/projects/`                                    | eigene Domäne; Einstieg zu allem                    |
| —   | Settings / Logs / Data               | Produkt-Slices (Top)  | `slices/{settings,logs,data}/`                        | Support-Capabilities, eigene Screens                |
| —   | Shell                                | **kein Slice**        | `src/shell/` (Host)                                   | Komposition/Routing-Root                            |
| —   | Leave-Bridge / Mongo / Prisma        | **Engine-Capability** | `local-engine/src/providers/*` + `shared/`-Normalizer | kein Screen → hinter Contract                       |

---

## Vollständig aufgelöste Kreuzabhängigkeiten (Zusammenfassung)

1. **A–D alle vs. Priorität** → Rangfolge `A>D>B>C`, A ist Tie-Break-Root. (Branch 1)
2. **Slice=Feature vs. Leave-Bridge/Mongo-Adapter** → EINE Regel: Screen/Route → Produkt-Slice; nur Graph-Daten → Engine-Capability hinter Contract. (Branch 2)
3. **Slice ↔ Kernel ↔ Runtime** → 3-Schichten-Kontaktregel, kein Pfeil überspringt den Kernel. (Branch 3+4)
4. **Cross-Cutting-Issue** → Contract-First-Issue + Konsumenten-Checkliste + N Slice-Issues. (Branch 6)
5. **Feature-Liste 1–10** → 7 Views als `blueprint`-Sub-Slices, AppFlow/Projects/Settings/Logs/Data als Top-Slices, Shell als Host, Analyzer-Fähigkeiten als Engine-Capabilities. (Feature-Mapping)

## Offene Punkte für den User (die 3 `ANNAHME-SELF`)

- **AS-1 (Branch 1):** „A–D alle gewünscht" als Rangfolge (nicht Gleichrang) akzeptiert?
- **AS-2 (Branch 5):** Physischer Rename `modules/` → `slices/` gewünscht, oder Begriff `modules/` behalten?
- **AS-3 (Branch 7):** Non-Goals „kein Package-Split pro Slice" + „Hybrid bleibt reserved" ok?

---

## Terminierung

Alle acht Branches bis Blattebene durchlaufen, alle fünf Inter-Branch-Abhängigkeiten explizit aufgelöst, Feature-Liste zugeordnet. Drei Rest-Annahmen offen zur User-Bestätigung markiert (nicht blockierend für den Intent Contract). **Baum vollständig.**

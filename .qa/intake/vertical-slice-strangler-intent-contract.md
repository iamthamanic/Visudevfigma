# Intent Contract: Vertical-Slice-Strangler

> **Status:** VERBINDLICH · bereit für `@feature-intake`
> **Scope:** `Visudevfigma/`
> **Quelle:** `vertical-slice-strangler-grill.md`, korrigiert durch unabhängiges Review
> **Normativ:** „MUSS/MUSS NICHT“ ist verbindlich; „SOLL“ darf nur mit dokumentierter Begründung abweichen.

## 1. Verbindliches Ergebnis

VisuDEV wird ohne Big Bang zu klaren, vertikalen Capability-Slices weiterentwickelt. Eine Produkt-Capability besitzt ihren fachlichen Frontend-Pfad von Interaktion/UI über State und Slice-Service bis zum Runtime-Port sowie ihre Tests. Bestehendes Verhalten, Local- und Cloud-Betrieb und laufende Feature-Arbeit bleiben während der Migration funktionsfähig.

Ein **Feature** ist ein für den User beschreibbares Ergebnis. Es ist nicht zwingend eine eigene Route: Auch ein Panel, Kommando oder zusammenhängender Workflow kann ein Produkt-Slice sein. Reine Parser-, Inferenz-, Adapter- oder Graph-Transformationslogik ohne eigenständiges User-Ergebnis ist eine Runtime-Capability, kein Produkt-Slice.

## 2. Entscheidungen zu den drei `ANNAHME-SELF`

### AS-1 — Rangfolge A–D: CHANGE

A bleibt der architektonische Nordstern, aber A–D sind gemeinsam verbindliche Abnahmekriterien und keine Kette kostenloser Nebenwirkungen:

- **A — Ownership:** Capability-eigene UI, State/Hooks, Services, Typen und Tests liegen beim Slice.
- **B — Isolation:** Der Slice ist mit kompatiblen Schnittstellen unabhängig test- und mergebar.
- **C — Navigierbarkeit:** Ownership, Entry-Point und erlaubte Abhängigkeiten sind aus der festen Struktur erkennbar.
- **D — Intake:** Feature-Intake und Issues benennen User-Ergebnis, primäre Ownership-Grenze und Cross-Boundary-Abhängigkeiten.

Bei Konflikten gilt: beobachtbares Verhalten und Runtime-Kompatibilität erhalten; danach den kleinsten kohärenten User-Outcome wählen, der unabhängig getestet und rückwärtskompatibel gemerged werden kann. Kann eine Grenze nicht A **und** B erfüllen, MUSS sie neu geschnitten werden. C oder D dürfen nicht als „fallen automatisch mit ab“ entfallen.

### AS-2 — `modules/` nach `slices/` umbenennen: CHANGE

`src/modules/` bleibt die physische Slice-Root. Ein Verzeichnis `src/modules/<capability>/` **ist** im Sinne dieses Contracts ein Produkt-Slice.

- Es wird kein paralleles `src/slices/` angelegt.
- Neue Produkt-Capabilities entstehen unter `src/modules/<capability>/`.
- Ein späterer physischer Rename ist ein eigener, rein mechanischer Intake nach Abschluss der Architekturarbeit; er ist nicht Teil dieses Vorhabens.

Damit entsteht kein lang laufender Mischzustand, und die geltenden Regeln in `AGENTS.md` bleiben kompatibel.

### AS-3 — Package-Split und Hybrid als Non-Goals: ACCEPT

Für dieses Vorhaben gelten verbindlich:

- kein Package/Workspace pro Produkt-Slice;
- keine Implementierung des reservierten Hybrid-Modus.

Das sind Scope-Grenzen dieses Vorhabens, keine dauerhaften Architekturverbote. Micro-Frontend- oder Hybrid-Arbeit benötigt später einen eigenen Intent Contract.

## 3. Ownership-Grenzen

### 3.1 Produkt-Slices

Aktuelle Top-Level-Produkt-Slices sind:

- `src/modules/projects/`
- `src/modules/appflow/`
- `src/modules/blueprint/`
- `src/modules/data/`
- `src/modules/logs/`
- `src/modules/settings/`

Ein Produkt-Slice besitzt fachliche UI, State/Hooks, Slice-Service/Port-Mapping, slice-spezifische Typen und Tests. Sein `index.ts` ist der einzige öffentliche Entry-Point. Interna eines Slices werden nicht außerhalb dieses Slices importiert.

### 3.2 Blueprint-Subfeatures

Architecture, Atlas, Dependencies, Diagnostics, Evolution, Execution, Infrastructure und Security/Access Control sind User-Features innerhalb des Blueprint-Slices. Sie werden erst dann als eigenständige **Sub-Slices** behandelt, wenn jedes davon:

1. einen lokalen Entry-Point besitzt,
2. seine View-spezifischen State-/Projektionsregeln und Tests besitzt,
3. keine Interna eines Geschwister-Sub-Slices importiert und
4. nur über eine Blueprint-interne öffentliche Schnittstelle vom Parent komponiert wird.

Bis diese Kriterien erfüllt sind, sind die Verzeichnisse interne Feature-Bereiche, keine behaupteten Isolationsgrenzen. Blueprint-weite Graph-Selection, View-Registry und View-Shell bleiben beim Parent `blueprint`; sie werden nicht in ein einzelnes View-Feature gezogen. Für dieses Vorhaben sind höchstens Domäne plus eine Subfeature-Ebene vorgesehen.

### 3.3 Composition und Plattform

Folgende Bereiche sind weder Produkt-Slice noch Shared Kernel:

- `src/modules/shell/`: Composition Root und Navigation; darf Produkt-Slices ausschließlich über deren `index.ts` komponieren.
- `src/lib/visudev-api/`: Frontend-Port/Adapter und Local-vs-Supabase-Dispatch.
- `src/lib/visudev/store.tsx`, Auth-Contexts und Routing: bestehende Application-/Plattform-Koordination.
- `src/components/`: geteilte, fachlich neutrale UI gemäß `AGENTS.md`.

Der zentrale Store und die generischen Facades `src/utils/api.ts` sowie `src/utils/useVisuDev.ts` sind Legacy-Seams. Sie dürfen während des Stranglers als Kompatibilitätsschicht bestehen, erhalten aber keine neue slice-spezifische Fachlogik. Angefasste Capability-Logik wird schrittweise in den besitzenden Slice gezogen.

### 3.4 Shared Kernel

Das Verzeichnis `shared/` ist nicht automatisch vollständig der Shared Kernel. Kernel-Aufnahme ist eine Allowlist-Entscheidung:

- ein transport-/runtime-neutraler Contract wird von Producer und Consumer über eine Runtime-/Package-Grenze benötigt; **oder**
- eine stabile fachliche Primitive wird von mindestens drei unabhängig besessenen Top-Level-Slices benötigt.

Zusätzlich MUSS Kernel-Code UI-frei, Runtime-Implementierungs-frei und ohne Import aus `src/modules/`, `local-engine/` oder einer Supabase-Implementierung sein.

Graph-/API-DTOs und gemeinsam benötigte reine Graph- bzw. Access-Control-Regeln können diese Kriterien erfüllen. Demo-Seeds/Test-Fixtures, Projektmigration und Local-Path-Security werden durch ihren Speicherort nicht zu Produkt-Kernel: Sie bleiben explizit Fixture-, Migrations- bzw. Infrastruktur-Code. Falsches vorzeitiges Teilen wird gegenüber kleiner lokaler Duplikation vermieden.

### 3.5 Runtime-Capabilities

`local-engine/` und `src/supabase/functions/visudev-analyzer/` bleiben getrennte Runtime-Implementierungen. Leave-Bridge, Mongo-, Prisma- und ähnliche Analyzer-Fähigkeiten leben in der jeweils verantwortlichen Runtime-Struktur; sie werden nicht künstlich in `providers/` gezwungen und nicht als Produkt-Slice bezeichnet.

Die Frontend-Klassen `LocalVisuDevClient` und `SupabaseVisuDevClient` implementieren den `VisuDevApiClient`. Die Analyzer selbst implementieren dieses Frontend-Interface nicht; sie stellen APIs bereit, die von den Adaptern angesprochen werden.

## 4. Verbindliche Abhängigkeitsregeln

Der erlaubte Pfad lautet:

`Produkt-Slice → slice-eigener Service/Port → Frontend-Adapter/Dispatch → Local-API oder Supabase-API`

Gemeinsame DTO-/Graph-Contracts dürfen von Adaptern und Runtimes importiert werden; sie sind eine Compile-Time-Grenze, kein Runtime-Hop.

Zusätzlich gilt:

1. Ein Produkt-Slice importiert keine Runtime-Implementierung, keinen Supabase-Client und kein `local-engine`.
2. Ein Produkt-Slice importiert kein anderes Produkt-Slice. Slice-Komposition geschieht im `shell` über öffentliche `index.ts`-Exports; fachliche Zusammenarbeit läuft über explizite Contracts/Ports.
3. `shell` importiert keine Deep-Paths eines Produkt-Slices.
4. Plattform-, Adapter- und Shared-Code importiert keine slice-internen Typen oder Services.
5. Blueprint-Subfeatures importieren keine Geschwister-Interna; der Blueprint-Parent komponiert ihre Entry-Points.
6. Neue oder geänderte API-Aufrufe liegen im Slice-Service bzw. Adapter, nicht in UI-Komponenten.
7. Ein automatischer Boundary-Check MUSS neue Deep-/Reverse-Imports verhindern.

Bekannte Bestandsausnahmen sind unter anderem der Deep-Import von Settings nach Projects sowie Reverse-Imports aus `src/utils/api.ts`, `src/utils/useVisuDev.ts` und `src/lib/visudev-api/supabase-client.ts` in Modul-Typen. Sie sind Migrationsschuld: keine neuen Vorkommen; bei Berührung MUSS die betroffene Kante reduziert oder als zeitlich begrenzte Kompatibilitätskante mit Cleanup-Issue dokumentiert werden.

## 5. Dual-Runtime-Vertrag

- Beide Frontend-Clients bleiben hinter demselben öffentlichen Dispatch erreichbar.
- Eine geänderte Operation MUSS Contract-Tests für jeden betroffenen Client erhalten.
- Soll ein User-Outcome in Local und Cloud verfügbar sein, werden beide Runtime-Pfade implementiert oder additiv kompatibel vorbereitet.
- Ist eine Fähigkeit absichtlich runtime-spezifisch, MUSS `getCapabilities()` dies korrekt ausweisen und der Slice MUSS die UI danach gaten. Stille oder fälschlich behauptete Parität ist nicht erlaubt.
- Breaking Contract Changes benötigen eine vollständige Consumer-Liste und eine additive Übergangsphase.
- Der reservierte Hybrid-Wert bleibt unverändert und darf weiterhin kontrolliert ablehnen; Hybrid-Verhalten wird nicht ergänzt.

## 6. Strangler-Ablauf

### Phase 0 — Grenze zuerst

Feature-Intake MUSS ein Foundation-Issue für folgende Punkte erzeugen:

- Architekturregeln in der Repo-Guidance präzisieren: `module = product slice`;
- Boundary-Check für neue Cross-Slice-Deep-Imports und Reverse-Imports ergänzen;
- bekannte Ausnahmen als endliche Baseline erfassen, damit der Check Bestandsfehler nicht als Vorwand für neue Schulden nutzt;
- Definition of Done und Issue-Metadaten aus diesem Contract verankern.

### Phase 1 — verbindlicher Pilot

`src/modules/logs/` ist der erste Pilot. Es ist aktuell klein und hat mit `useLogs` aus `src/utils/useVisuDev.ts` eine klar erkennbare Legacy-Kante.

Der Pilot zieht Logs-eigene Hook-/Service-/Typ-Mappings hinter die Logs-Grenze, erhält Route, Props, UI und API-Verhalten und ergänzt slice-lokale Tests. Andere generische Hooks/APIs werden dabei nicht nebenbei umgebaut.

### Phase 2 — inkrementelle Migration

Danach wird genau ein Top-Level-Slice pro Issue-Set migriert. Auswahlregel ohne neue User-Frage:

1. niedrigste Zahl verbotener Inbound-/Outbound-Kanten,
2. danach kleinster sicherer Diff,
3. `blueprint` zuletzt.

Für jeden Slice gilt:

1. beobachtbares Verhalten und bestehende Tests als Baseline festhalten;
2. öffentlichen `index.ts`-Entry-Point bestätigen;
3. Capability-eigene Hooks, Services und Typen hinter die Slice-Grenze ziehen;
4. nötige Kompatibilitäts-Exports additiv einführen;
5. Consumer einzeln umstellen;
6. alten Pfad erst bei null verbleibenden Consumern entfernen;
7. Boundary-, Slice- und betroffene Client-Contract-Tests grün halten.

Neue Features folgen sofort diesem Contract. Bestehende Slices werden issue-weise stranguliert; es gibt weder globales Verschieben noch globales Umbenennen.

## 7. Issue- und Feature-Intake-Contract

Jeder Intake-Eintrag MUSS mindestens deklarieren:

- `featureSlug`
- `userOutcome`
- `ownerKind: product-slice | blueprint-subfeature | platform | shared-contract | runtime-capability`
- `primaryBoundary`
- `contractChange: yes | no`
- `runtimeTouch: none | local | cloud | both`
- `consumers`
- `dependsOn`
- `compatibilityPlan`
- überprüfbare `acceptance`

Ein slice-lokales Feature bleibt **ein vertikales Issue** und darf innerhalb desselben Slices UI, State, Service und Tests gemeinsam ändern. Es wird nicht in globale Layer-Issues wie „alle Hooks“ oder „alle Components“ zerlegt.

Ein User-Outcome über mehrere Ownership-Grenzen wird als ein Parent-Outcome mit boundary-spezifischen Child-Issues geschnitten:

1. additiver Shared-Contract, falls nötig;
2. betroffene Runtime-Capability je Runtime;
3. konsumierender Produkt-Slice je Ownership-Grenze;
4. Cleanup erst nach migrierten Consumern.

Jedes Child-Issue hat genau eine **primäre** Ownership-Grenze und bleibt rückwärtskompatibel mergebar. Notwendiges Wiring und Tests an der öffentlichen Kompositionskante sind erlaubt; Fachlogik eines zweiten Slices ist es nicht. Contract-Issues führen eine vollständige Consumer-Checkliste.

## 8. Definition of Done pro migriertem Slice

Ein Slice ist erst migriert, wenn:

- Capability-Ownership innerhalb eines Top-Level-Moduls eindeutig ist;
- sein öffentlicher Entry-Point minimal und dokumentiert ist;
- UI keine API-/Runtime-Implementierung direkt aufruft;
- slice-lokale State-/Service-/Typ-Logik nicht mehr über eine generische Legacy-Facade neu erweitert wird;
- keine neuen Cross-Slice-Deep- oder Reverse-Imports bestehen;
- lokale Tests das User-Verhalten und Fehlerpfade abdecken;
- betroffene Local-/Cloud-Client-Verträge getestet oder die Runtime-Fähigkeit explizit gegatet ist;
- alte Imports entfernt oder mit konkretem Cleanup-Issue befristet sind;
- `npm run checks` grün ist.

Das gesamte Vorhaben ist abgeschlossen, wenn alle aktiven Top-Level-Produkt-Slices diese Definition erfüllen, der Boundary-Check grün ist und die generischen Legacy-Facades keine slice-spezifischen Reverse-Imports mehr besitzen. `shell`, Runtime-Packages und Shared-Infrastruktur werden dabei nicht fälschlich zu Produkt-Slices gemacht.

## 9. Explizite Non-Goals

- kein `src/modules/`-zu-`src/slices/`-Rename;
- kein Big-Bang-Move;
- keine Micro-Frontends und kein Slice-Deploy;
- kein Package/Workspace pro Produkt-Slice;
- kein Merge von Local Engine und Cloud Analyzer;
- kein Ausbau des Hybrid-Modus;
- kein UI-Redesign und keine fachliche Verhaltensänderung als Teil der Strukturmigration;
- kein neuer State-Manager oder Framework-Wechsel;
- kein pauschales Aufräumen jedes Files unter `shared/`.

Thin-Kernel, kein Runtime-Bypass, Runtime-Parität/Gating und Boundary-Checks sind Constraints, keine Non-Goals.

## 10. Freigabe

`@feature-intake` darf auf Basis dieses Contracts ohne weitere User-Fragen starten. Der Self-Grill ist Begründungsinput; bei Abweichungen ist dieses Dokument die verbindliche Quelle. `@ecc-runner-loop` darf erst mit dem von Feature-Intake erzeugten, dependency-sortierten Issue-Set starten.

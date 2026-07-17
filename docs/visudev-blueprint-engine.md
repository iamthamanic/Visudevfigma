# Konzeptpapier: VisuDEV Blueprint Engine

## 1. Ziel

Die VisuDEV Blueprint Engine soll Code nicht nur visuell darstellen, sondern technische Konzepte erkennen, bewerten und als verständliche Blueprint-Karten anzeigen.

Ziel ist nicht:
„Zeige mir alle Dateien als Diagramm.“

Ziel ist:
„Zeige mir, was mein Code technisch macht, welche Schutzmechanismen vorhanden sind, was fehlt, wo Risiken liegen und warum VisuDEV das behauptet.“

Die Engine soll besonders für Nutzer funktionieren, die Code nicht komplett linear lesen können oder wollen, aber trotzdem verstehen müssen, ob eine Software sauber aufgebaut, sicher und skalierbar ist.

## 2. Grundprinzip

VisuDEV visualisiert nicht direkt den Code.

Die Engine arbeitet in mehreren Stufen:

1. Code einlesen
2. Code-Fakten extrahieren
3. technische Konzepte erkennen
4. Erwartungen/Policies anwenden
5. Abweichungen erkennen
6. Risiken bewerten
7. Evidence sammeln
8. Blueprint-Ansicht rendern

Kurz:

Code → Facts → Concepts → Policies → Findings → Blueprint

## 3. Warum App Flow und Blueprint getrennt werden

App Flow ist eine Software-Sitemap.

App Flow zeigt:

- Screens
- Buttons
- Modals
- Navigation
- UI-Aktionen
- welcher Screen wohin führt
- welche Aktion eine API oder Funktion auslöst

Blueprint ist die technische Röntgenaufnahme.

Blueprint zeigt:

- Runtime
- API Routes
- Auth / AuthZ
- Resource Scope, Tenant-Isolation, Ownership
- Validierung
- Rate Limit
- Datenbankzugriffe (Mechanismen im Inspector, z. B. RLS nur für PostgreSQL)
- Storage
- externe APIs
- Secrets
- RLS
- Audit Logs
- Skalierungsrisiken
- Architekturprobleme

App Flow beantwortet:

„Was sieht und macht der Nutzer?“

Blueprint beantwortet:

„Was passiert technisch dahinter, ist es abgesichert und wo fehlen Dinge?“

## 4. Kernmodule der Blueprint Engine

### 4.1 Fact Engine

Die Fact Engine extrahiert harte, beweisbare Fakten aus dem Code.

Beispiele:

- Datei enthält API Route
- Funktion liest Request Body
- Funktion ruft `safeParse()` auf
- Funktion schreibt in Tabelle `employees`
- Middleware prüft Session
- Route gibt 401 zurück
- Datei importiert Supabase Client
- SQL-Datei enthält `CREATE POLICY`
- Funktion ruft externe URL auf
- Funktion nutzt Environment Variable

Die Fact Engine bewertet noch nicht. Sie sammelt nur Belege.

### 4.2 Concept Engine

Die Concept Engine macht aus mehreren Fakten ein technisches Konzept.

Beispiele:

Mehrere Fakten:

- `request.json()` gefunden
- `EmployeeSchema.safeParse(body)` gefunden
- bei Fehler wird 400 zurückgegeben
- `parsed.data` wird weiterverwendet

Daraus wird:

- Concept: Runtime Validation
- Typ: Schema Validation
- Confidence: 96 %
- Evidence: Datei + Zeilen

Weitere Concepts:

- API Route
- Auth Gate
- Role Check
- Permission Check
- Validation Gate
- Rate Limit
- DB Read
- DB Write
- Storage Access
- External API Call
- Secret Usage
- RLS Policy
- Audit Log
- Cache
- Queue
- Cron Job
- File Upload
- Realtime Channel

### 4.3 Expectation Engine

Die Expectation Engine entscheidet, was an einer Stelle erwartet wird.

Beispiel:

Wenn eine Route externen Input annimmt und in eine Datenbank schreibt, dann wird Runtime Validation erwartet.

Wenn eine Route public ist und Login, Reset, Upload oder Contact ausführt, dann wird Rate Limit erwartet.

Wenn eine Route personenbezogene Daten schreibt, dann werden Auth, Rollenprüfung und Audit Log erwartet.

Wenn ein Listen-Endpunkt große Datenmengen liefern kann, dann wird Pagination oder Limit erwartet.

Das ist der Unterschied zwischen reiner Visualisierung und Diagnose.

### 4.4 Policy Engine

Die Policy Engine enthält versionierbare Regeln.

Beispiele:

- `core-security`
- `web-api`
- `nextjs`
- `supabase`
- `saas-scaling`
- `desktop-app`
- `hr-pii`
- `clean-architecture`
- `team-custom`

Policies können aktualisiert, erweitert oder überschrieben werden.

Wichtig:

Parser und Detector erkennen, was vorhanden ist.
Policies bewerten, was erwartet wird.

### 4.5 Risk Engine

Die Risk Engine bewertet Findings abhängig vom Kontext.

Derselbe Code kann bei 10 internen Nutzern akzeptabel sein, aber bei 100.000 SaaS-Nutzern kritisch.

Projektprofil:

- App-Typ: SaaS, interne App, Desktop-App, Mobile App
- erwartete Nutzerzahl
- Daten-Sensibilität
- Deployment-Art
- Datenbank
- Business-Domain
- öffentliche oder interne Nutzung
- Skalierungsziel

Beispiel:

`GET /employees` ohne Pagination:

- bei 10 internen Nutzern: Hinweis
- bei 100.000 Nutzern: hohes Skalierungsrisiko

### 4.6 Evidence Engine

Jeder Befund braucht Belege.

VisuDEV darf nicht nur sagen:

„Validation fehlt.“

VisuDEV muss sagen:

- welche Route betroffen ist
- welche Daten angenommen werden
- welcher DB Write erkannt wurde
- welcher Codepfad analysiert wurde
- warum keine Validation gefunden wurde
- welche Regel ausgelöst wurde
- wie hoch die Confidence ist

Ohne Evidence wäre das Tool nicht vertrauenswürdig.

## 5. Zustände pro Concept

VisuDEV darf nicht nur Ja/Nein anzeigen.

Jedes Concept bekommt einen Zustand:

- Confirmed
- Partial
- Weak
- Missing
- Unknown
- Contradictory
- Accepted Risk

Beispiel:

Validation Confirmed:
Schema wird auf Request angewendet, Fehlerpfad existiert, validierter Output wird genutzt.

Validation Partial:
Schema existiert, aber wird in dieser Route nicht angewendet.

Validation Weak:
Manuelle if-Prüfung existiert, aber Umfang ist unklar.

Validation Missing:
Route nimmt Input an, schreibt in DB, aber keine Runtime Validation im Pfad gefunden.

Validation Contradictory:
Schema wird geprüft, aber danach wird trotzdem raw body gespeichert.

## 6. Mehrere Dateien und ausgelagerter Code

Die Engine muss über mehrere Dateien hinweg arbeiten.

Beispiel:

Route-Datei:

`POST /employees → createEmployeeController()`

Controller:

`createEmployeeController() → parseEmployeeRequest()`

Validation-Datei:

`parseEmployeeRequest() → EmployeeSchema.parse()`

Service:

`createEmployee() → employeeRepository.insert()`

Repository:

`insert() → supabase.from("employees").insert()`

VisuDEV muss daraus einen Call Graph bauen.

In der Blueprint-Ansicht wird dann nicht falsch behauptet, dass Validation direkt in der Route liegt. Stattdessen:

Route → Controller → Validation Module → Service → Repository → Database

Die entscheidende Frage ist:

Liegt die Validierung vor dem riskanten DB Write?

## 7. Data Flow Analysis

Pattern Matching reicht nicht.

VisuDEV muss Datenflüsse verstehen.

Guter Fall:

Request Body → Validation → parsed.data → DB Insert

Schlechter Fall:

Request Body → Validation
Request Body → DB Insert

Dann ist Validation zwar vorhanden, aber wirkungslos.

Finding:

„Validation vorhanden, aber validierter Output wird nicht für den DB Write genutzt.“

## 8. Sprach- und Framework-Unabhängigkeit

VisuDEV braucht Adapter.

Language Adapter:

- TypeScript / JavaScript
- SQL
- Python
- PHP
- Java
- C#
- Go

Framework Packs:

- Next.js
- Express
- Hono
- Supabase
- Prisma
- Drizzle
- FastAPI
- Django
- Laravel
- Spring
- .NET
- Firebase

Jeder Adapter übersetzt Spracheigenheiten in dasselbe neutrale Modell.

Beispiel:

TypeScript/Supabase:

`supabase.from("employees").insert(data)`

wird zu:

DB Write → Tabelle employees → Operation insert

Python/SQLAlchemy:

`session.add(employee); session.commit()`

wird auch zu:

DB Write → Entity employee → Operation insert/update

Die UI arbeitet nur mit Concepts, nicht mit Programmiersprache.

## 9. Lokaler Modus und GitHub-Modus

### Local Mode

Nutzer wählt Projektordner aus.

VisuDEV:

- scannt Projektstruktur
- analysiert Dateien
- baut Fact Graph
- baut Concept Graph
- baut Blueprint
- beobachtet Dateiänderungen
- analysiert nur geänderte Dateien neu
- aktualisiert betroffene Blueprints live

### GitHub Mode

Nutzer verbindet Repo.

VisuDEV:

- lädt Repo/Branch
- analysiert Code
- speichert Analyse
- prüft neue Commits
- analysiert geänderte Dateien neu
- zeigt Änderungen im Blueprint

Wichtig:

Nicht jedes Mal das ganze Repo komplett neu analysieren.

Benötigt werden:

- file hash
- analysis cache
- dependency graph
- changed files
- affected concepts
- affected routes

## 10. Blueprint-Ansichten

### 10.1 System Overview

Zeigt große Systemteile:

Frontend → API → Database → Storage → External Services

### 10.2 Runtime Map

Zeigt, wo Code läuft:

- Browser
- Mobile App
- Desktop App
- Server
- Edge Function
- Database
- Local Runtime
- External Service

### 10.3 Module Map

Zeigt Fachmodule:

- Employees
- Auth
- Billing
- Orders
- Files
- Notifications

Pro Modul:

- Routes
- Services
- Repositories
- Tables
- externe Abhängigkeiten

### 10.4 Route Blueprint

Zeigt eine konkrete Route oder Aktion:

Request → Auth → Role Check → Validation → Handler → DB Write → Audit → External Hook

### 10.5 Security Matrix (Access Control)

Die Diagnostics-Matrix zeigt **abstrakte Controls**, nicht technologie-spezifische Mechanismen:

| Spalte (Access Control v2)      | Bedeutung                                |
| ------------------------------- | ---------------------------------------- |
| AuthN / AuthZ                   | Authentifizierung / Autorisierung        |
| Scope / Tenant / Ownership      | Resource-, Tenant- und Ownership-Grenzen |
| Validation / Rate Limit / Audit | Eingabeprüfung, Drosselung, Audit        |

**Mechanismen** (z. B. PostgreSQL RLS, MariaDB SECURITY VIEW, Repository-Filter, MongoDB Collection Roles) erscheinen im **Access Control Inspector**, nicht als feste Matrix-Spalten.

Die Legacy-Tabelle `securityMatrix` (Auth | Role | Validation | Rate Limit | DB | Audit) bleibt für Kompatibilität; die frühere **RLS-Spalte ist entfernt**. Fehlt `securityMatrix` im Payload, synthetisiert `normalizeBlueprintData` sie aus `accessControlMatrix` (mit `rls: n/a`).

Route | AuthN | AuthZ | Scope | Tenant | Ownership | Validation | Rate Limit | Audit | Findings

### 10.6 Finding Inspector

Rechte Seitenleiste mit:

- Problem
- Severity
- Rule ID
- Warum erwartet?
- Was wurde gefunden?
- Was fehlt?
- Evidence
- Datei
- Zeilen
- Code-Snippet
- Confidence
- mögliche Lösung

## 11. Findings

Ein Finding besteht aus:

- ID
- betroffene Route/Funktion/Datei
- Kategorie
- Severity
- erwarteter Zustand
- tatsächlicher Zustand
- fehlendes Concept
- Evidence
- Confidence
- Policy Rule
- Kontextbewertung
- Status

Finding-Typen:

- Security Finding
- Scalability Risk
- Data Risk
- Architecture Smell
- Maintainability Hint
- Unknown / Needs Review

## 12. Beispiel-Finding

Route:

`POST /api/employees`

Erkannt:

- Request Body vorhanden
- DB Write in `employees`
- Auth vorhanden
- Role Check vorhanden
- keine Runtime Validation vor DB Write erkannt
- Audit Log nicht erkannt

Policy:

Wenn Route externen Input annimmt und DB schreibt, wird Runtime Validation erwartet.

Finding:

Runtime Validation fehlt vor DB Write.

Severity:

High

Evidence:

- `request.json()` in `routes/employees.ts`
- `insert()` in `repositories/employeesRepository.ts`
- kein Validation Concept im Pfad zwischen Request Input und DB Write

Confidence:

87 %

## 13. UI-Grundstruktur

Linke Sidebar:

- Projects
- App Flow
- Blueprint
- Data
- Findings
- Policies
- Settings

Blueprint-Bereich:

Oben:

- Projekt
- Branch
- Analyse-Status
- letzter Scan
- aktives Policy Pack
- Projektprofil

Links im Blueprint:

- Route Inventory
- Module Tree
- Filter nach Findings
- Filter nach Concept

Mitte:

- visuelle Blueprint-Karte
- Nodes mit Statusfarben
- Kanten mit Datenfluss
- fehlende Gates als rote Lücken

Rechts:

- Inspector
- Evidence
- Code Trace
- Policy-Erklärung
- Confidence

## 14. Visuelle Sprache

Nodes:

- API Route
- Auth Gate
- Role Gate
- Validation Gate
- Rate Limit Gate
- Business Logic
- Database
- Storage
- External Service
- Audit Log
- Unknown Node

Farben:

- Grün: bestätigt
- Gelb: teilweise / prüfen
- Rot: fehlt / kritisch
- Blau: normaler Datenfluss
- Grau: unbekannt
- Lila: externe Systeme oder Framework-Magie

Badges:

- AUTH
- ROLE
- VALIDATION
- RATE LIMIT
- DB WRITE
- DB READ
- PII
- RLS
- AUDIT
- EXTERNAL
- SECRET
- CACHE
- QUEUE
- CRON
- UNKNOWN

## 15. MVP-Scope

Nicht alles auf einmal bauen.

Blueprint Engine v1 sollte nur das können:

1. TypeScript/JavaScript analysieren
2. Next.js/Express/Hono-artige Routes erkennen
3. Supabase-Zugriffe erkennen
4. Zod/Yup/Joi/Valibot grob erkennen
5. Auth-Muster erkennen
6. Role-/Permission-Muster erkennen
7. DB Read/Write erkennen
8. Rate Limit grob erkennen
9. Route-Control-Matrix bauen
10. Missing Controls anzeigen
11. Evidence mit Datei/Zeile speichern
12. Confidence Score anzeigen

Erste Concepts:

- API Route
- Auth Gate
- Role/Permission Gate
- Validation Gate
- Rate Limit
- DB Read
- DB Write
- Storage Access
- External API Call

Erste Policies:

- POST/PUT/PATCH + Request Body + DB Write → Runtime Validation erwartet
- Public Login/Reset/Contact/Upload → Rate Limit erwartet
- PII Write → Auth + Role/Permission + Audit erwartet
- List Endpoint + DB Read → Pagination/Limit empfohlen
- File Upload → Size Limit + MIME Validation erwartet
- External API Call → Timeout + Error Handling erwartet
- Supabase sensitive table → RLS erwartet

## 16. Späterer Scope

Blueprint Engine v2:

- Python/FastAPI/Pydantic
- SQLAlchemy
- Laravel
- Java/Spring
- Prisma/Drizzle tiefer
- SQL/RLS tiefer
- Secrets Detection
- Queue/Cron Detection
- Error Handling
- Caching
- Performance Risks
- PII Detection
- LLM Review Layer
- Team Custom Policies
- Accepted Risk Workflow

## 17. Rolle von KI

KI soll nicht die alleinige Wahrheit sein.

Deterministische Engine zuerst:

- Parser
- AST
- Imports
- Call Graph
- Data Flow
- Patterns
- Policies

KI danach:

- unklare Route Purpose erkennen
- Business-Semantik erklären
- schlechte oder ungewöhnliche Code-Strukturen einordnen
- Finding-Erklärungen formulieren
- Vorschläge für neue Policies machen
- manuelle Guards klassifizieren
- unbekannte Frameworks markieren

Regel:

KI darf Findings unterstützen, aber nicht ohne Evidence erfinden.

## 18. Was noch offen ist

Für die Umsetzung fehlen noch technische Details aus dem aktuellen VisuDEV-Code:

- aktuelle Datenmodelle
- aktuelle Supabase Tabellen
- aktuelle Edge Functions
- aktuelle Analyzer-Struktur
- aktueller AppFlow-Code
- aktueller Blueprint-Code
- ob Tree-sitter oder TypeScript Compiler API genutzt wird
- wie GitHub-Dateien aktuell geladen werden
- wie Evidence aktuell gespeichert wird
- wie Rule Violations aktuell funktionieren

Konzeptionell ist die Richtung aber geklärt.

## 19. Entscheidung

VisuDEV sollte nicht primär als Diagramm-Tool weitergebaut werden.

VisuDEV sollte als Code-Diagnose- und Blueprint-Engine gebaut werden.

Kernversprechen:

„Zeig mir visuell, was mein Code tut, welche Schutzmechanismen vorhanden sind, welche fehlen und warum.“

## 20. Kurzdefinition

VisuDEV Blueprint Engine ist eine evidence-basierte Code-Analyse-Engine, die aus Quellcode technische Konzepte extrahiert, diese gegen versionierbare Policies prüft und daraus visuelle Blueprints, Findings und Risiko-Hinweise erzeugt.

Sie besteht aus:

- Fact Engine
- Concept Engine
- Expectation Engine
- Policy Engine
- Risk Engine
- Evidence Engine
- Blueprint Renderer

Das ist der Kern des Produkts.

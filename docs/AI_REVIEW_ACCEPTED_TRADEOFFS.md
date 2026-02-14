# Akzeptierte Trade-offs (AI-Review: keine Abzüge)

Diese Trade-offs sind bewusst eingegangen und dürfen in der AI-Review **nicht** als Verstöße gewertet werden, sofern der Code sie einhält und ggf. im Code/Kommentar erwähnt.

---

## Logger

- **Umsetzung:** Injizierte Funktion `logError(message, err?)`; Production loggt nur `message` und optional `err.message` (kein Stack, kein ganzes Objekt).
- **Bewertung:** Zählt als Dependency Inversion erfüllt und als ausreichend gegen Silent Fails.
- **Kein Abzug** für Data Leakage allein wegen `err.message`, solange keine PII/Secrets geloggt werden.

---

## Rate Limiting

- **Umsetzung:** Get-then-set (nicht atomar); im Code dokumentiert (z.B. Kommentar „get-then-set is not atomic“ / „Future: atomic increment when available“). Throttling für schreibende/heavy Endpunkte vorhanden. Read-Endpunkte (GET) ohne Throttling sind akzeptiert.
- **Kein Abzug**, solange im Code kommentiert und Throttling für Schreib-Endpunkte aktiv ist; kein Abzug für ungedrosselte GETs.

---

## Scans (Fire-and-forget + SRP)

- **Umsetzung:** Scans starten per setTimeout nach HTTP-Response; im Code/Kommentar erwähnt, dass Lifecycle/Cancellation später per Job-Queue kommen kann. Scans-Routen bündeln AuthZ, Rate-Limit, KV, Timer in einem Handler.
- **Kein Abzug** für Side Effects oder SRP, solange dokumentiert.

---

## Externe APIs (fetch / URL-Building)

- **Umsetzung:** Externe API-Aufrufe (fetch, URL-Building) in Route-Handlern (z.B. integrations.ts, scans.ts) sind erlaubt; optional später in injizierte Clients auslagern.
- **Kein Abzug** für Dependency Inversion nur wegen direktem fetch/URL-Building in diesen Handlern.

---

## Route-Handler (Validierung + Service-Call)

- **Umsetzung:** Param-Validierung + AuthZ + ein Service-Call in einer Handler-Funktion bewusst für Nachvollziehbarkeit; optional zukünftig Param-Middleware.
- **SRP-Abzug nur**, wenn eine Funktion klar **mehrere unabhängige** Verantwortlichkeiten bündelt (nicht schon bei „Validierung + ein Service-Call“).

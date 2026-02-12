# Warum tauchen nach Fixes immer wieder neue Fehler in der AI-Review auf?

## Kurzantwort

**Weder** „der Code war schon immer schlecht und fällt jetzt erst auf“ **noch** „nur der neue Fix ist schlecht“. Es wirken **drei Faktoren** zusammen:

1. **Der Review sieht nur den Diff** (staged + unstaged bzw. Push-Diff), nicht die ganze Codebase.
2. **Der Diff wird bei >100 KB auf ~50 KB Kopf + ~50 KB Schwanz gekürzt** – die Mitte fällt weg; je nach Änderungen sieht die AI bei jedem Lauf **anderes Code-Stück**.
3. **Die AI listet nicht jeden Verstoß in einem Durchlauf** – sie kann in Lauf 1 A+B bemängeln, in Lauf 2 (gleicher/ähnlicher Diff) C+D. Nach Fix von A+B „tauchen“ C+D auf.

Zusätzlich: **Ein Fix vergrößert oft den Diff** (mehr Zeilen = mehr Oberfläche) oder lässt andere Stellen im sichtbaren Diff übrig, die dann beim nächsten Mal bewertet werden.

---

## Wie die AI-Review funktioniert (aus `scripts/ai-code-review.sh`)

| Aspekt | Verhalten |
|--------|-----------|
| **Eingabe** | `git diff` = staged + unstaged. Bei sauberem Working Tree: Diff der zu pushierenden Commits (`@{u}...HEAD` oder `HEAD~1...HEAD`). |
| **Umfang** | Nur dieser Diff wird an Codex geschickt – **nicht** das gesamte Repo. |
| **Kürzung** | Wenn der Diff > 102 400 Bytes: nur **erste ~50 KB** + **letzte ~50 KB**; die **Mitte** wird verworfen. |

Folge: Bei großem Diff sieht die AI bei jedem Lauf nur einen **Ausschnitt** des geänderten Codes. Welcher Ausschnitt das ist, hängt von der genauen Größe und Zusammensetzung des Diffs ab.

---

## Die drei Hauptgründe für „neue“ Fehler nach Fixes

### 1. Diff-Trunkierung (50 KB Kopf + Schwanz)

- Beim ersten Lauf liegen z.B. Datei A im „Kopf“ und Datei B im „Schwanz“; die Mitte (andere Dateien/Zeilen) wird **nie** gesehen.
- Du behebst Punkte in A und B → Diff ändert sich (andere Zeilenanzahl, andere Dateien).
- Beim nächsten Lauf kann etwas, das vorher in der **Mitte** lag, in den **Schwanz** rutschen und wird zum ersten Mal bewertet → „neuer“ Fehler.
- Oder umgekehrt: Vorher sichtbare Teile rutschen in die Mitte und werden nicht mehr bewertet; dafür erscheinen andere.

**Fazit:** Es werden nicht „immer neue Fehler erfunden“, sondern **anderer Code** aus dem gleichen (großen) Diff sichtbar.

### 2. Modell-Verhalten: Nicht alle Verstöße in einem Lauf

- Die Checkliste ist lang (SOLID, Performance, Sicherheit, Robustheit, Wartbarkeit).
- In einem Lauf konzentriert sich die Antwort oft auf **einige** Punkte (z.B. Input Validation + Edge Cases).
- Beim nächsten Lauf (gleicher oder ähnlicher Diff) können **andere** Punkte (z.B. IDOR, Rate Limiting) bemängelt werden, die vorher nicht erwähnt wurden.
- Du hast also nicht „schlechteren“ Code geschrieben, sondern die AI hat beim zweiten Mal **andere** Kriterien angewendet bzw. andere Stellen hervorgehoben.

**Fazit:** Ein Teil der „neuen“ Fehler sind Verstöße, die schon im bisher sichtbaren Diff steckten, aber im ersten Lauf nicht explizit genannt wurden.

### 3. Fixes vergrößern den sichtbaren Diff / lassen andere Stellen übrig

- Du behebst z.B. „Input Validation“ und fügst 30 Zeilen Validierung hinzu → **mehr Zeilen im Diff**.
- Die AI sieht beim nächsten Lauf weiterhin die gleiche Datei (z.B. `visudev-preview/index.tsx`) und prüft die **gesamte** sichtbare Änderung: Jetzt fällt z.B. **IDOR** oder **Rate Limiting** auf, weil die gleiche Route/der gleiche Flow noch im Diff ist.
- Oder: Du entfernst nur einen kleinen Teil; der Rest der Änderung bleibt im Diff und wird beim nächsten Mal unter einem anderen Checklisten-Punkt bemängelt.

**Fazit:** Derselbe geänderte Code wird in aufeinanderfolgenden Läufen unter **verschiedenen** Gesichtspunkten bewertet; das wirkt wie „immer neue Fehler“.

---

## Beleg aus deinen Reviews (9. Feb 2026)

- **11:19** – SilentFails, InputValidation, YAGNI (store, visudev-preview, types).
- **11:30** – **ACCEPT 100%** (sehr kleiner Diff: 13 k input tokens).
- **11:35** – Input Validation, Edge Cases (dev-auto.js Ports).
- **11:39** – SRP, Data Leakage (ai-code-review.sh), Edge Cases (store.tsx).
- **11:44** – YAGNI (push-checked.sh), Edge Cases (dev-auto.js).
- **11:47** – SRP, Input Validation (dev-auto.js).
- **11:52** – Input Validation (visudev-preview).
- **11:55** – IDOR, Rate Limiting, Edge Cases (visudev-preview, dev-auto.js).

Auffällig: Sobald der Diff wieder groß ist (~40 k input tokens), wechseln die bemängelten **Dateien** und **Checklist-Punkte** (mal Scripts, mal Edge Function, mal Store). Das spricht für:

- wechselnde **sichtbare Diff-Ausschnitte** (Trunkierung),
- wechselnde **Schwerpunkte** der AI (nicht alle Verstöße pro Lauf),
- und dass nach einem Fix oft **noch derselbe oder erweiterte Diff** läuft und unter anderen Punkten (IDOR, Rate Limiting, Edge Cases) durchfällt.

---

## Empfohlene Vorgehensweise: Von Anfang an breit

**Ja – am besten von Anfang an breit vorgehen.** Nicht nur den einen genannten Punkt fixen, sondern die **betroffene Datei/Route einmal unter allen relevanten Checklisten-Punkten** durchgehen.

### Konkret bei REJECT

1. **Alle genannten Dateien** aus den Deductions notieren (z.B. `visudev-preview/index.tsx`, `dev-auto.js`).
2. **Pro Datei einen Durchgang** machen und dabei prüfen:
   - **Sicherheit:** IDOR? (User darf diese Ressource?) · Rate Limiting? · Keine sensiblen Daten in Logs?
   - **Input:** Alle externen Eingaben (Body, Query, Env) validiert? (Zod/Whitelist/Format/Länge)
   - **Robustheit:** Keine leeren `catch`, Edge Cases (null, leere Strings, NaN, Port-Bereich)?
   - **Architektur:** SRP/YAGNI nur wenn leicht machbar; sonst für den nächsten Commit notieren.
3. **Erst dann** committen und Review erneut laufen lassen.

So vermeidest du den „Fix A → nächster Lauf bemängelt B“-Kreislauf, weil du B (und C, D) schon im ersten Durchgang mit erledigt hast.

### Optional: Mini-Checkliste pro geänderter API/Route

- [ ] Input Validation (Body/Query/Env)
- [ ] IDOR / Berechtigung
- [ ] Rate Limiting (wenn teure Operation)
- [ ] Error Handling (kein silent catch, sinnvolle Fehlermeldung)
- [ ] Edge Cases (null, leer, ungültige Werte)

---

## Praktische Konsequenzen

1. **Diff klein halten**  
   Kleine, fokussierte Commits → kleiner Diff → weniger Trunkierung, stabilere Reviews.

2. **Große Änderungen aufteilen**  
   Viele Änderungen in einem Commit → großer Diff → nur Kopf + Schwanz sichtbar → scheinbar „neue“ Fehler beim nächsten Mal.

3. **Deductions als Hinweise nutzen**  
   Wenn die AI „IDOR“ oder „Rate Limiting“ nennt, lohnt sich ein **einmaliger** gezielter Blick über die betroffene Datei/Route (nicht nur die geänderte Zeile). So behebst du mehrere potenzielle Punkte in einem Schritt.

4. **Optional: Trunkierung anpassen**  
   In `scripts/ai-code-review.sh` ist `LIMIT_BYTES=51200`. Bei sehr großem Diff könnte man die Grenze erhöhen (mehr Tokens/Zeit) oder den Diff vorher filtern (z.B. nur bestimmte Verzeichnisse), um stabilere Ausschnitte zu haben.

---

## Fazit

- **Liegt nicht daran, dass „der alte Code plötzlich schlecht auffällt“** – die AI sieht den alten Code nur, soweit er im **Diff** vorkommt.
- **Liegt auch nicht nur daran, dass „der Fix schlecht ist“** – oft ist es derselbe oder ein vergrößerter Diff, der unter **anderen** Checklisten-Punkten durchfällt.
- **Liegt an:** (1) Diff-Beschränkung (50 KB Kopf/Schwanz), (2) unterschiedlicher Fokus der AI pro Lauf, (3) Fixes, die den Diff vergrößern oder andere Stellen im sichtbaren Diff in den Fokus rücken.

Strategie: Kleine Diffs, Deductions einmal pro Datei/Feature durchgehen und typische Themen (IDOR, Input Validation, Edge Cases, Rate Limiting) gezielt abarbeiten – dann pendelt sich die Review ein.

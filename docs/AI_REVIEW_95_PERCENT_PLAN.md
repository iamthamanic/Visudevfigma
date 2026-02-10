# Plan: Full-Codebase AI-Review auf >95%

## Ziel

- `CHECK_MODE=full` mit **allen drei Chunks** (src, supabase, scripts) ≥95% Score und Verdict ACCEPT.
- Der Review läuft **immer über committed Code** (`git diff EMPTY_TREE..HEAD`). Uncommittedes wird ignoriert.

## Durchlauf bis 95% (Full-Modus mit Loop)

**`run-checks.sh --until-95`** (Teil des Full-Modus) führt den vollen Check (Frontend, Backend, AI-Review **alle Chunks**) in einer Schleife aus und stoppt erst, wenn alle Chunks ≥95% haben:

```bash
GIT_CMD=/usr/bin/git bash scripts/run-checks.sh --until-95
```

Alternativ der Thin-Wrapper (ruft dasselbe auf):

```bash
GIT_CMD=/usr/bin/git bash scripts/run-checks-until-95.sh
```

- Bei Fehlschlag: zeigt Chunk-Scores und Pfad zum Review, dann **„Fix the issues, commit if needed, then press Enter to retry“**.
- Du fixst (oder lässt fixen), committest, drückst Enter → nächster Lauf.
- Erst wenn der komplette Check durchläuft (inkl. AI-Review alle Chunks ≥95%), beendet sich das Skript mit Exit 0.
- `--until-95` und `--chunk=...` dürfen nicht zusammen verwendet werden (Full-Modus = alle Chunks).

---

## Schritt 1: Sauberen Stand herstellen

1. **Alles committen**, was fertig ist (keine halben Sachen im Working Tree).
2. **Pushen**, damit der Review-Stand klar ist und CI/Team denselben Stand sehen.

```bash
git status
git add <alle relevanten Dateien>
git commit -m "chore: WIP / fix ..."
git push
```

---

## Schritt 2: Chunk für Chunk abarbeiten (nicht technisch, sondern priorisiert)

Der Review läuft **nicht** „nur ein Chunk“ – es werden immer **alle drei Chunks** (src, supabase, scripts) in einem Lauf geprüft.  
**„Chunk für Chunk“** heißt hier: **priorisiert die Fixes pro Chunk nacheinander umsetzen**, dann jeweils **commit + push + Full-Review** und aus dem Report die nächsten Punkte ableiten.

Empfohlene **Reihenfolge nach Wirkung**:

### A) Zuerst: **src**-Chunk (größte Abzüge, klare Fixes)

| Abzug                             | Fix                                                                                                                                                                                                |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IDOR −25                          | **visudev-projects in src angleichen**: Controller + ggf. Service/Repo so wie in `supabase/functions/visudev-projects` (getUserIdOptional, listProjects(userId), Ownership bei get/update/delete). |
| DataLeakage −20                   | Sicherstellen, dass **Integrations-Redaction** im src-Mirror sichtbar ist (Controller-Kommentar + `redactForResponse`); ggf. gleichen Kommentar wie in supabase oben in die Datei.                 |
| Rest (SRP, DI, Rate Limit, Input) | Optional später; erst wenn IDOR/DataLeakage weg sind.                                                                                                                                              |

Nach den Fixes: **commit + push**, dann **Full-Review** ausführen.

### B) Danach: **scripts**-Chunk

| Abzug               | Fix                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ----------------------------------------------------------- | --- | ------------------------------------------------------ |
| SilentFails −15     | In `supabase-checked.sh`: `                                                                                                                                                           |     | true`bei ping/fetch-edge durch **Logging** ersetzen (z. B.` |     | { echo "Warning: ..." >&2; }`), keine stillen Ignores. |
| InputValidation −15 | In `scripts/smoke/analyzer.sh`: **Escaping/Validierung** für `--repo`, `--branch`, `--github-token` vor dem Einbau in den Python-Heredoc (keine rohe Interpolation).                  |
| SideEffects −10     | In `supabase-checked.sh` **dokumentieren**, wann `git push` ausgeführt wird (z. B. Kommentar + ggf. Env-Flag wie `SUPABASE_AUTO_PUSH`), damit es kein „unerwarteter“ Side-Effect ist. |
| EdgeCases −10       | `scripts/dev-auto.js`: Port-Clamp (z. B. max 65535), ggf. `net.listen` in try/catch.                                                                                                  |
| SRP/DI              | Optional; aufwändiger (Skripte aufteilen, Abhängigkeiten injizierbar machen).                                                                                                         |

Nach den Fixes: **commit + push**, dann **Full-Review**.

### C) Zuletzt: **supabase**-Chunk

- Bereits bei ~25%; viele IDOR/GET-projects-Fixes sind drin und können im nächsten Lauf anerkannt werden.
- Verbleibend typisch: **Rate Limiting**, **Input Validation** (Zod/Schema wo fehlt), **SRP/DI** (Monolithen, createClient).
- **Rate Limiting**: Einige teure/sensible Endpoints (z. B. analyzer, screenshots, integrations GitHub-Proxy) mit einfachem Limit belegen.
- **Input Validation**: Blueprint/Data-PUT mit Zod/Schema + Größenlimit absichern.

Nach den Fixes: **commit + push**, dann **Full-Review**.

---

## Schritt 3: Iteration

### Alle Chunks (Final-Check vor Push)

```bash
CHECK_MODE=full GIT_CMD=/usr/bin/git bash scripts/ai-code-review.sh
```

### Einzel-Chunk-Modus (schnellere Iteration)

Nur **einen** Bereich prüfen, um gezielt auf 95% zu kommen – spart Zeit (1× statt 3× Codex-Lauf):

```bash
# Nur src-Chunk
AI_REVIEW_CHUNK=src CHECK_MODE=full GIT_CMD=/usr/bin/git bash scripts/ai-code-review.sh

# Oder über run-checks (läuft Frontend+Backend, dann nur AI-Review für diesen Chunk)
bash scripts/run-checks.sh --chunk=src
```

Gültige Werte: `src`, `supabase`, `scripts`.  
Report erscheint wie gewohnt in `.shimwrapper/reviews/review-*.md`; im Report steht **Mode: full (single chunk: src)**.

1. **Report lesen**: `.shimwrapper/reviews/review-*.md` (neueste Datei).
2. **Pro Chunk**: Alle genannten Deductions durchgehen; zuerst die mit hohen Minuspunkten.
3. **Fixes umsetzen** → **commit** → **push** → zurück zu 1.

Wiederholen, bis **alle drei Chunks** (einzeln oder gemeinsam) Score ≥95% und Verdict ACCEPT haben.

---

## Truncation beachten

- Im Report steht ggf.: _"One or more chunks had diff truncated (head+tail only)"_.
- Dann sieht die AI **nicht** die komplette Datei; Fixes in der **Mitte** großer Dateien können „unsichtbar“ bleiben.
- **Gegenmaßnahmen**:
  - Wichtige Sicherheits-Kommentare (IDOR, Redaction, Rate Limit) **am Dateianfang** platzieren.
  - Oder `CHUNK_LIMIT_BYTES` in `scripts/ai-code-review.sh` erhöhen (Zeile ~102), wenn die Umgebung größere Prompts erlaubt.

---

## Kurz-Checkliste vor jedem Review-Lauf

- [ ] Alles Relevante **committed**
- [ ] **Gepusht** (damit Stand eindeutig ist)
- [ ] Review mit **CHECK_MODE=full** und **GIT_CMD=/usr/bin/git** gestartet
- [ ] Neuestes Review-File unter `.shimwrapper/reviews/` gelesen und nächste Fixes aus den Deductions abgeleitet

Wenn du willst, können wir als Nächstes **konkret den src-Chunk** angehen (visudev-projects Mirror + Integrations-Kommentar).

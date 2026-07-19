/**
 * memory-live-doc viewer — Status / Features / Changes / Decisions / Architecture (+ history).
 * Plain-language first; needs-review explained; architecture date filter.
 */
(function () {
  const state = {
    lang: "de",
    view: "status",
    project: null,
    features: [],
    changes: [],
    decisions: [],
    current: null,
    architecture: null,
    architectureHistory: [],
    selectedArchId: null,
    theme: null,
    selectedChangeId: null,
    mermaidReady: false,
  };

  const ui = {
    de: {
      eyebrow: "Projektgedächtnis",
      lang: "Sprache",
      focus: "Aktueller Fokus",
      recent: "Kürzlich erledigt",
      incomplete: "Unvollständig",
      risks: "Risiken / Lücken",
      product: "Produktstatus",
      empty: "Keine Einträge",
      filterPkg: "Paket",
      filterStatus: "Status",
      all: "Alle",
      impacts: "Auswirkungen",
      user: "Für Nutzerinnen & Nutzer",
      developer: "Für die Entwicklung",
      operational: "Für Betrieb & Deployment",
      evidence: "Belege (technisch)",
      screenshots: "Screenshots",
      back: "Zurück zur Timeline",
      loadError: "Daten konnten nicht geladen werden. Bitte data/*.json prüfen.",
      decisionsEmpty: "Noch keine Entscheidungen erfasst.",
      architecture: "Architektur",
      architectureEmpty: "Kein Architektur-Diagramm im Snapshot.",
      architectureSource: "Mermaid-Quelle",
      architectureRenderError: "Diagramm konnte nicht gerendert werden — Quelle unten.",
      architectureVersion: "Stand / Datum",
      why: "Warum das wichtig ist",
      techSummary: "Technische Kurzfassung",
      plainIntro: "In einfachen Worten",
      reviewHelpTitle: "Was bedeutet „needs-review“?",
      reviewHelpBody:
        "Das ist kein Fehler der App. Es heißt: Dieser Text wurde automatisch aus Code/Commits abgeleitet und sollte von einem Menschen geprüft werden. „accepted“ = freigegeben, „rejected“ = verworfen.",
      reviewNeeds: "Prüfung offen",
      reviewOk: "Geprüft",
      reviewBad: "Verworfen",
    },
    en: {
      eyebrow: "Project memory",
      lang: "Language",
      focus: "Current focus",
      recent: "Recently completed",
      incomplete: "Incomplete",
      risks: "Risks / gaps",
      product: "Product status",
      empty: "No entries",
      filterPkg: "Package",
      filterStatus: "Status",
      all: "All",
      impacts: "Impacts",
      user: "For users",
      developer: "For developers",
      operational: "For ops / deploy",
      evidence: "Evidence (technical)",
      screenshots: "Screenshots",
      back: "Back to timeline",
      loadError: "Could not load data. Check data/*.json.",
      decisionsEmpty: "No decisions recorded yet.",
      architecture: "Architecture",
      architectureEmpty: "No architecture diagram in snapshot.",
      architectureSource: "Mermaid source",
      architectureRenderError: "Could not render diagram — source below.",
      architectureVersion: "Version / date",
      why: "Why it matters",
      techSummary: "Technical summary",
      plainIntro: "In plain language",
      reviewHelpTitle: "What does “needs-review” mean?",
      reviewHelpBody:
        "Not an app bug. It means this text was drafted automatically from code/commits and should be checked by a human. “accepted” = approved, “rejected” = discarded.",
      reviewNeeds: "Needs review",
      reviewOk: "Accepted",
      reviewBad: "Rejected",
    },
  };

  function t(key) {
    return (ui[state.lang] && ui[state.lang][key]) || ui.en[key] || key;
  }

  function bi(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return obj[state.lang] || obj.en || obj.de || "";
  }

  function biList(obj) {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    return obj[state.lang] || obj.en || obj.de || [];
  }

  /** Display dates as MM.DD.YYYY (ISO YYYY-MM-DD stays in data for sorting). */
  function formatDate(value) {
    if (!value) return "";
    const s = String(value).trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[2]}.${m[3]}.${m[1]}`;
    const m2 = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (m2) return s;
    return s;
  }

  function asArray(payload, preferredKeys) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.items)) return payload.items;
    const keys = preferredKeys || ["features", "changes", "decisions", "versions"];
    for (const key of keys) {
      if (Array.isArray(payload[key])) return payload[key];
    }
    return [];
  }

  function reviewPill(status) {
    const s = status || "needs-review";
    const cls = s === "accepted" ? "ok" : s === "rejected" ? "bad" : "warn";
    const label =
      s === "accepted" ? t("reviewOk") : s === "rejected" ? t("reviewBad") : t("reviewNeeds");
    return `<span class="pill ${cls}" title="${escapeAttr(s)}">${escapeHtml(label)}</span>`;
  }

  function reviewHelpCard() {
    return `<article class="card help-card" style="margin-bottom:1rem">
      <h3>${escapeHtml(t("reviewHelpTitle"))}</h3>
      <p class="muted">${escapeHtml(t("reviewHelpBody"))}</p>
    </article>`;
  }

  async function loadJson(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(path + " " + res.status);
    return res.json();
  }

  function applyTheme(theme) {
    state.theme = theme || null;
    const tokens = (theme && theme.tokens) || {};
    const root = document.documentElement;
    const map = {
      bg: "--bg",
      bgElev: "--bg-elev",
      ink: "--ink",
      muted: "--muted",
      line: "--line",
      accent: "--accent",
      accent2: "--accent-2",
      danger: "--danger",
      radius: "--radius",
      tabRadius: "--tab-radius",
      fontDisplay: "--font-display",
      fontBody: "--font-body",
      fontMono: "--font-mono",
      bgGlow1: "--bg-glow-1",
      bgGlow2: "--bg-glow-2",
    };
    Object.keys(map).forEach((k) => {
      if (tokens[k]) root.style.setProperty(map[k], tokens[k]);
    });
    const fontLink = document.getElementById("theme-fonts");
    if (fontLink && theme && theme.fonts && theme.fonts.google) {
      fontLink.href = theme.fonts.google;
    }
  }

  function initMermaid() {
    if (typeof mermaid === "undefined") return;
    const vars =
      (state.theme && state.theme.mermaid && state.theme.mermaid.themeVariables) || {};
    const themeName =
      (state.theme && state.theme.mermaid && state.theme.mermaid.theme) || "dark";
    mermaid.initialize({
      startOnLoad: false,
      theme: themeName,
      themeVariables: vars,
      securityLevel: "strict",
    });
    state.mermaidReady = true;
  }

  async function boot() {
    try {
      const [
        project,
        features,
        changes,
        current,
        decisions,
        architecture,
        archHistory,
        theme,
      ] = await Promise.all([
        loadJson("./data/project.json"),
        loadJson("./data/features.json"),
        loadJson("./data/changes.json"),
        loadJson("./data/current-state.json"),
        loadJson("./data/decisions.json").catch(() => ({ decisions: [] })),
        loadJson("./data/architecture.json").catch(() => ({ mermaid: "" })),
        loadJson("./data/architecture-history.json").catch(() => ({ versions: [] })),
        loadJson("./data/theme.json").catch(() => null),
      ]);
      applyTheme(theme);
      initMermaid();
      state.project = project;
      state.features = asArray(features, ["features", "items"]);
      state.changes = asArray(changes, ["changes", "items"])
        .slice()
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      state.decisions = asArray(decisions, ["decisions", "items"]);
      state.current = current;
      state.architecture = architecture;
      state.architectureHistory = asArray(archHistory, ["versions", "items"]);
      if (!state.architectureHistory.length && architecture && architecture.mermaid) {
        state.architectureHistory = [
          {
            id: "overview-current",
            date: architecture.date || "",
            title: architecture.title || { de: "Aktuell", en: "Current" },
            mermaid: architecture.mermaid,
            is_current: true,
          },
        ];
      }
      state.selectedArchId =
        (state.architectureHistory.find((v) => v.is_current) || state.architectureHistory[0] || {})
          .id || null;
      bind();
      renderChrome();
      showView(state.view);
    } catch (err) {
      document.querySelector("main").innerHTML =
        `<div class="error"><p>${t("loadError")}</p><p class="muted">${String(err)}</p></div>`;
    }
  }

  function bind() {
    document.getElementById("lang-select").addEventListener("change", (e) => {
      state.lang = e.target.value;
      document.documentElement.lang = state.lang;
      renderChrome();
      showView(state.view);
    });
    document.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.selectedChangeId = null;
        showView(btn.getAttribute("data-view"));
      });
    });
  }

  function renderChrome() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-tab]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n-tab"));
    });
    const p = state.project || {};
    document.getElementById("project-title").textContent = bi(p.title) || p.id || "Project";
    document.getElementById("project-summary").textContent = bi(p.summary);
    document.title = bi(p.title) || "Project Memory";
  }

  function showView(name) {
    state.view = name;
    document.querySelectorAll(".tab").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-view") === name);
    });
    document.querySelectorAll(".view").forEach((el) => {
      const on = el.id === "view-" + name;
      el.classList.toggle("is-active", on);
      el.hidden = !on;
    });
    if (name === "status") renderStatus();
    if (name === "features") renderFeatures();
    if (name === "changes") renderChanges();
    if (name === "decisions") renderDecisions();
    if (name === "architecture") renderArchitecture();
  }

  function listBlock(title, items) {
    const rows = (items || [])
      .map((x) => `<li>${escapeHtml(typeof x === "string" ? x : bi(x))}</li>`)
      .join("");
    return `<article class="card"><h3>${escapeHtml(title)}</h3>${
      rows ? `<ul>${rows}</ul>` : `<p class="muted">${t("empty")}</p>`
    }</article>`;
  }

  function renderStatus() {
    const c = state.current || {};
    const focus = biList(c.active_focus || c.focus || c.current_focus);
    const recent = biList(c.recently_completed || c.recent);
    const incomplete = biList(c.incomplete);
    const risks = biList(c.known_gaps || c.risks);
    const product = bi(c.product_status);
    const el = document.getElementById("view-status");
    el.innerHTML = `
      ${reviewHelpCard()}
      ${
        product
          ? `<article class="card" style="margin-bottom:1rem"><h3>${escapeHtml(t("product"))}</h3><p>${escapeHtml(product)}</p>
             <p class="meta">${reviewPill(c.review_status)} ${escapeHtml(formatDate(c.as_of))} · <code>${escapeHtml(
               (c.commit || "").slice(0, 8),
             )}</code></p></article>`
          : ""
      }
      <div class="grid cols-2">
        ${listBlock(t("focus"), focus)}
        ${listBlock(t("recent"), recent)}
        ${listBlock(t("incomplete"), incomplete)}
        ${listBlock(t("risks"), risks)}
      </div>
    `;
  }

  function featureBody(f) {
    const plain = bi(f.plain_language);
    const why = bi(f.why_it_matters);
    const summary = bi(f.summary);
    const impacts = biList(f.user_impact);
    let html = "";
    if (plain) {
      html += `<p><strong>${escapeHtml(t("plainIntro"))}:</strong> ${escapeHtml(plain)}</p>`;
    } else if (summary) {
      html += `<p>${escapeHtml(summary)}</p>`;
    }
    if (why) {
      html += `<p class="meta"><strong>${escapeHtml(t("why"))}:</strong> ${escapeHtml(why)}</p>`;
    }
    if (impacts.length) {
      html += `<ul>${impacts.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
    }
    if (plain && summary) {
      html += `<details><summary>${escapeHtml(t("techSummary"))}</summary><p class="muted">${escapeHtml(
        summary,
      )}</p></details>`;
    }
    return html || `<p class="muted">${t("empty")}</p>`;
  }

  function renderFeatures() {
    const el = document.getElementById("view-features");
    const packages = [...new Set(state.features.flatMap((f) => f.packages || []))].sort();
    const statuses = [...new Set(state.features.map((f) => f.status).filter(Boolean))].sort();
    el.innerHTML = `
      ${reviewHelpCard()}
      <div class="toolbar">
        <label class="filter">${t("filterPkg")}
          <select id="feat-pkg"><option value="">${t("all")}</option>${packages
            .map((p) => `<option value="${escapeAttr(p)}">${escapeHtml(p)}</option>`)
            .join("")}</select>
        </label>
        <label class="filter">${t("filterStatus")}
          <select id="feat-status"><option value="">${t("all")}</option>${statuses
            .map((s) => `<option value="${escapeAttr(s)}">${escapeHtml(s)}</option>`)
            .join("")}</select>
        </label>
      </div>
      <div class="grid cols-2" id="feat-grid"></div>
    `;
    const draw = () => {
      const pkg = document.getElementById("feat-pkg").value;
      const st = document.getElementById("feat-status").value;
      const items = state.features.filter((f) => {
        if (pkg && !(f.packages || []).includes(pkg)) return false;
        if (st && f.status !== st) return false;
        return true;
      });
      document.getElementById("feat-grid").innerHTML =
        items
          .map(
            (f) => `
        <article class="card">
          <h3>${escapeHtml(bi(f.title) || f.id)}</h3>
          <p class="meta">${reviewPill(f.review_status)} <span class="pill">${escapeHtml(f.status || "")}</span>
            ${(f.packages || []).map((p) => `<span class="pill">${escapeHtml(p)}</span>`).join("")}
          </p>
          ${featureBody(f)}
        </article>`,
          )
          .join("") || `<p class="muted">${t("empty")}</p>`;
    };
    document.getElementById("feat-pkg").addEventListener("change", draw);
    document.getElementById("feat-status").addEventListener("change", draw);
    draw();
  }

  function renderChanges() {
    const el = document.getElementById("view-changes");
    if (state.selectedChangeId) {
      const ch = state.changes.find((c) => c.id === state.selectedChangeId);
      if (!ch) {
        state.selectedChangeId = null;
        return renderChanges();
      }
      el.innerHTML = renderChangeDetail(ch);
      el.querySelector("[data-back]")?.addEventListener("click", () => {
        state.selectedChangeId = null;
        renderChanges();
      });
      return;
    }
    el.innerHTML =
      reviewHelpCard() +
      `<ul class="list">${state.changes
        .map((c) => {
          const teaser = bi(c.plain_language) || bi(c.summary);
          return `
      <li><button type="button" class="linkish" data-id="${escapeAttr(c.id)}">
        <strong>${escapeHtml(formatDate(c.date))}</strong> · ${escapeHtml(bi(c.title) || c.id)}
        <div class="meta">${reviewPill(c.review_status)} <span class="pill">${escapeHtml(c.type || "")}</span>
          ${(c.packages || []).map((p) => `<span class="pill">${escapeHtml(p)}</span>`).join("")}
        </div>
        <p class="muted">${escapeHtml(teaser)}</p>
      </button></li>`;
        })
        .join("")}</ul>`;
    el.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.selectedChangeId = btn.getAttribute("data-id");
        renderChanges();
      });
    });
  }

  function renderChangeDetail(ch) {
    const impact = (label, list) => {
      const items = biList(list);
      if (!items.length) return "";
      return `<h3>${label}</h3><ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
    };
    const evidence = (ch.evidence || [])
      .map((e) => {
        const label = e.path || e.url || e.kind;
        const href = e.url || null;
        return href
          ? `<li><a href="${escapeAttr(href)}" target="_blank" rel="noopener">${escapeHtml(label)}</a></li>`
          : `<li>${escapeHtml(label)}</li>`;
      })
      .join("");
    const shots = (ch.screenshots || [])
      .map((s) => {
        const cap = bi(s.caption) || s.id || s.path;
        return `<li>${escapeHtml(cap)} — <em>${escapeHtml(s.status || "missing")}</em></li>`;
      })
      .join("");
    const plain = bi(ch.plain_language);
    const why = bi(ch.why_it_matters);
    return `
      <button type="button" class="tab" data-back>${t("back")}</button>
      <article class="card detail">
        <h2>${escapeHtml(bi(ch.title) || ch.id)}</h2>
        <p class="meta">${escapeHtml(formatDate(ch.date))} · ${reviewPill(ch.review_status)}
          <span class="pill">${escapeHtml(ch.type || "")}</span></p>
        ${
          plain
            ? `<p><strong>${escapeHtml(t("plainIntro"))}:</strong> ${escapeHtml(plain)}</p>`
            : `<p>${escapeHtml(bi(ch.summary))}</p>`
        }
        ${why ? `<p><strong>${escapeHtml(t("why"))}:</strong> ${escapeHtml(why)}</p>` : ""}
        ${
          plain
            ? `<details><summary>${escapeHtml(t("techSummary"))}</summary><p class="muted">${escapeHtml(
                bi(ch.summary),
              )}</p></details>`
            : ""
        }
        <h3>${t("impacts")}</h3>
        ${impact(t("user"), ch.user_impact)}
        ${impact(t("developer"), ch.developer_impact)}
        ${impact(t("operational"), ch.operational_impact)}
        <h3>${t("evidence")}</h3>
        ${evidence ? `<ul>${evidence}</ul>` : `<p class="muted">${t("empty")}</p>`}
        <h3>${t("screenshots")}</h3>
        ${shots ? `<ul>${shots}</ul>` : `<p class="muted">${t("empty")}</p>`}
      </article>`;
  }

  function renderDecisions() {
    const el = document.getElementById("view-decisions");
    const fromChanges = state.changes.filter(
      (c) => c.type === "decision" || c.type === "architecture",
    );
    const decisions = state.decisions.length ? state.decisions : fromChanges;
    if (!decisions.length) {
      el.innerHTML = reviewHelpCard() + `<p class="muted">${t("decisionsEmpty")}</p>`;
      return;
    }
    el.innerHTML =
      reviewHelpCard() +
      `<div class="grid">${decisions
        .map((d) => {
          const body = bi(d.plain_language) || bi(d.summary);
          return `
      <article class="card">
        <h3>${escapeHtml(bi(d.title) || d.id)}</h3>
        <p class="meta">${escapeHtml(formatDate(d.date))} · ${reviewPill(d.review_status)}
          ${d.status ? `<span class="pill">${escapeHtml(d.status)}</span>` : ""}</p>
        <p>${escapeHtml(body)}</p>
      </article>`;
        })
        .join("")}</div>`;
  }

  async function renderArchitecture() {
    const el = document.getElementById("view-architecture");
    const versions = state.architectureHistory || [];
    if (!versions.length) {
      el.innerHTML = `<p class="muted">${t("architectureEmpty")}</p>`;
      return;
    }

    const selected =
      versions.find((v) => v.id === state.selectedArchId) || versions[0];
    state.selectedArchId = selected.id;
    const source = (selected.mermaid || "").trim();
    const title = bi(selected.title) || t("architecture");

    const options = versions
      .map((v) => {
        const label = `${formatDate(v.date) || "?"} — ${bi(v.title) || v.id}${v.is_current ? " ★" : ""}`;
        const sel = v.id === selected.id ? " selected" : "";
        return `<option value="${escapeAttr(v.id)}"${sel}>${escapeHtml(label)}</option>`;
      })
      .join("");

    el.innerHTML = `
      <div class="toolbar">
        <label class="filter">${t("architectureVersion")}
          <select id="arch-version">${options}</select>
        </label>
      </div>
      <article class="card">
        <h3>${escapeHtml(title)}</h3>
        <p class="meta">${escapeHtml(formatDate(selected.date))}
          ${selected.commit ? ` · <code>${escapeHtml(String(selected.commit).slice(0, 8))}</code>` : ""}
          ${bi(selected.summary) ? ` · ${escapeHtml(bi(selected.summary))}` : ""}
        </p>
        <div class="architecture-diagram" id="arch-diagram-host">
          ${
            source
              ? `<pre class="mermaid" id="arch-mermaid">${escapeHtml(source)}</pre>`
              : `<p class="muted">${t("architectureEmpty")}</p>`
          }
        </div>
        ${
          source
            ? `<details class="architecture-source">
          <summary>${escapeHtml(t("architectureSource"))}</summary>
          <pre>${escapeHtml(source)}</pre>
        </details>`
            : ""
        }
      </article>
    `;

    document.getElementById("arch-version").addEventListener("change", (e) => {
      state.selectedArchId = e.target.value;
      renderArchitecture();
    });

    if (!source) return;
    if (!state.mermaidReady || typeof mermaid === "undefined") {
      const host = document.getElementById("arch-diagram-host");
      if (host) host.innerHTML = `<p class="muted">${t("architectureRenderError")}</p>`;
      return;
    }

    try {
      const node = el.querySelector("#arch-mermaid");
      const { svg } = await mermaid.render(
        "arch-svg-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        source,
      );
      if (node) node.outerHTML = svg;
    } catch (err) {
      const box = document.getElementById("arch-diagram-host");
      if (box) {
        box.innerHTML = `<p class="muted">${t("architectureRenderError")}</p><p class="muted">${escapeHtml(
          String(err),
        )}</p>`;
      }
    }
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  boot();
})();

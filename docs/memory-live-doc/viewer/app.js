/**
 * memory-live-doc viewer — loads ./data/*.json, bilingual toggle, Status/Features/Changes/Decisions.
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
    selectedChangeId: null,
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
      user: "Nutzer",
      developer: "Entwicklung",
      operational: "Betrieb",
      evidence: "Evidenz",
      screenshots: "Screenshots",
      back: "Zurück zur Timeline",
      loadError: "Daten konnten nicht geladen werden. Bitte data/*.json prüfen.",
      decisionsEmpty: "Noch keine Entscheidungen erfasst.",
      mermaidHint: "Architektur-Mermaid liegt im Repo unter .project-memory/architecture/.",
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
      user: "User",
      developer: "Developer",
      operational: "Operational",
      evidence: "Evidence",
      screenshots: "Screenshots",
      back: "Back to timeline",
      loadError: "Could not load data. Check data/*.json.",
      decisionsEmpty: "No decisions recorded yet.",
      mermaidHint: "Architecture Mermaid lives in the repo under .project-memory/architecture/.",
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

  function asArray(payload, preferredKeys) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.items)) return payload.items;
    const keys = preferredKeys || ["features", "changes", "decisions"];
    for (const key of keys) {
      if (Array.isArray(payload[key])) return payload[key];
    }
    return [];
  }

  function reviewPill(status) {
    const s = status || "needs-review";
    const cls = s === "accepted" ? "ok" : s === "rejected" ? "bad" : "warn";
    return `<span class="pill ${cls}">${s}</span>`;
  }

  async function loadJson(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(path + " " + res.status);
    return res.json();
  }

  async function boot() {
    try {
      const [project, features, changes, current, decisions] = await Promise.all([
        loadJson("./data/project.json"),
        loadJson("./data/features.json"),
        loadJson("./data/changes.json"),
        loadJson("./data/current-state.json"),
        loadJson("./data/decisions.json").catch(() => ({ decisions: [] })),
      ]);
      state.project = project;
      state.features = asArray(features, ["features", "items"]);
      state.changes = asArray(changes, ["changes", "items"])
        .slice()
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      state.decisions = asArray(decisions, ["decisions", "items"]);
      state.current = current;
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
  }

  function listBlock(title, items) {
    const rows = (items || []).map((x) => `<li>${escapeHtml(typeof x === "string" ? x : bi(x))}</li>`).join("");
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
      ${
        product
          ? `<article class="card" style="margin-bottom:1rem"><h3>${escapeHtml(t("product"))}</h3><p>${escapeHtml(product)}</p>
             <p class="meta">${reviewPill(c.review_status)} ${escapeHtml(c.as_of || "")} · <code>${escapeHtml(c.commit || "").slice(0, 8)}</code></p></article>`
          : ""
      }
      <div class="grid cols-2">
        ${listBlock(t("focus"), focus)}
        ${listBlock(t("recent"), recent)}
        ${listBlock(t("incomplete"), incomplete)}
        ${listBlock(t("risks"), risks)}
      </div>
      <p class="muted" style="margin-top:1rem">${t("mermaidHint")}</p>
    `;
  }

  function renderFeatures() {
    const el = document.getElementById("view-features");
    const packages = [...new Set(state.features.flatMap((f) => f.packages || []))].sort();
    const statuses = [...new Set(state.features.map((f) => f.status).filter(Boolean))].sort();
    el.innerHTML = `
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
      document.getElementById("feat-grid").innerHTML = items
        .map(
          (f) => `
        <article class="card">
          <h3>${escapeHtml(bi(f.title) || f.id)}</h3>
          <p class="meta">${reviewPill(f.review_status)} <span class="pill">${escapeHtml(f.status || "")}</span>
            ${(f.packages || []).map((p) => `<span class="pill">${escapeHtml(p)}</span>`).join("")}
          </p>
          <p>${escapeHtml(bi(f.summary))}</p>
        </article>`
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
    el.innerHTML = `<ul class="list">${state.changes
      .map(
        (c) => `
      <li><button type="button" class="linkish" data-id="${escapeAttr(c.id)}">
        <strong>${escapeHtml(c.date || "")}</strong> · ${escapeHtml(bi(c.title) || c.id)}
        <div class="meta">${reviewPill(c.review_status)} <span class="pill">${escapeHtml(c.type || "")}</span>
          ${(c.packages || []).map((p) => `<span class="pill">${escapeHtml(p)}</span>`).join("")}
        </div>
        <p class="muted">${escapeHtml(bi(c.summary))}</p>
      </button></li>`
      )
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
        if (s.status === "present" && s.path) {
          return `<li><img src="../../assets/${escapeAttr((s.path || "").split("/").slice(-2).join("/"))}" alt="" style="max-width:100%;border-radius:8px" /><br/>${escapeHtml(cap)} (${escapeHtml(s.status)})</li>`;
        }
        return `<li>${escapeHtml(cap)} — <em>${escapeHtml(s.status || "missing")}</em></li>`;
      })
      .join("");
    return `
      <button type="button" class="tab" data-back>${t("back")}</button>
      <article class="card detail">
        <h2>${escapeHtml(bi(ch.title) || ch.id)}</h2>
        <p class="meta">${escapeHtml(ch.date || "")} · ${reviewPill(ch.review_status)}
          <span class="pill">${escapeHtml(ch.type || "")}</span></p>
        <p>${escapeHtml(bi(ch.summary))}</p>
        <h3>${t("impacts")}</h3>
        ${impact(t("user"), ch.user_impact)}
        ${impact(t("developer"), ch.developer_impact)}
        ${impact(t("operational"), ch.operational_impact)}
        <h3>${t("evidence")}</h3>
        ${evidence ? `<ul>${evidence}</ul>` : `<p class="muted">${t("empty")}</p>`}
        <h3>${t("screenshots")}</h3>
        ${shots ? `<ul>${shots}</ul>` : `<p class="muted">${t("empty")}</p>`}
        ${
          ch.git && ch.git.pull_request
            ? `<p><a href="${escapeAttr(ch.git.pull_request)}" target="_blank" rel="noopener">Pull request</a></p>`
            : ""
        }
      </article>`;
  }

  function renderDecisions() {
    const el = document.getElementById("view-decisions");
    const fromChanges = state.changes.filter((c) => c.type === "decision" || c.type === "architecture");
    const decisions = state.decisions.length ? state.decisions : fromChanges;
    if (!decisions.length) {
      el.innerHTML = `<p class="muted">${t("decisionsEmpty")}</p>`;
      return;
    }
    el.innerHTML = `<div class="grid">${decisions
      .map(
        (d) => `
      <article class="card">
        <h3>${escapeHtml(bi(d.title) || d.id)}</h3>
        <p class="meta">${escapeHtml(d.date || "")} · ${reviewPill(d.review_status)}
          ${d.status ? `<span class="pill">${escapeHtml(d.status)}</span>` : ""}</p>
        <p>${escapeHtml(bi(d.summary))}</p>
      </article>`
      )
      .join("")}</div>`;
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

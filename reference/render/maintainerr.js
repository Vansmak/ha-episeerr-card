
var MT_BTN = `background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10);border-radius:999px;color:var(--is-text);font-size:12px;height:32px;padding:0 14px;box-sizing:border-box;cursor:pointer;outline:none;display:inline-flex;align-items:center;justify-content:center;gap:4px;font-weight:600;white-space:nowrap`;
var _ICO_CHECK = `<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
var MT_ACCENTS = {
  blue: ["rgba(0,122,255,0.2)", "rgba(0,122,255,0.5)", "#007aff"],
  red: ["rgba(248,113,113,0.14)", "rgba(248,113,113,0.35)", "#e5484d"],
  green: ["rgba(52,211,153,0.14)", "rgba(52,211,153,0.35)", "#0f9d60"]
};
var _MaintainerrRenderMethods = class {
  // ──────────────────────────────────────────────────────────────────────────
  // Poster row — 4 cards in right panel
  // ──────────────────────────────────────────────────────────────────────────
  _renderMaintainerr() {
    const d = this._maintainerr || {};
    return `
      <div class="sec-card has-gradient" style="${this._sectionStyle()}">
        ${this._sectionOverlayHtml("maintainerr", 25, 75, 0.22)}
        <div class="col-hdr" style="margin-bottom:5px">
          ${this._appIcon("maintainerr", 24)}
          <span class="col-hdr-title">Maintainerr</span>
          <div class="col-hdr-line"></div>
        </div>
        <div class="pg-wrap" style="flex:1;align-items:stretch;position:relative">
          <button class="pg-btn pg-btn-ph" aria-hidden="true" tabindex="-1">&#8249;</button>
          <div class="tl-row">
            ${this._mtOverviewCard(d)}
            ${this._mtRulesCard(d)}
            ${this._mtCollectionsCard(d)}
            ${this._mtCalendarCard(d)}
          </div>
          <button class="pg-btn pg-btn-ph" aria-hidden="true" tabindex="-1">&#8250;</button>
        </div>
      </div>`;
  }
  // ── Poster: Overview ──────────────────────────────────────────────────────
  // The libraries the Overview tab browses. Item counts would cost one content
  // request per library on every poll, so the card stays at names and types.
  _mtOverviewCard(d) {
    const libs = this._maintainerrLibraries || [];
    const _ico = (t) => t === "show" ? `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:0.55"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>` : `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:0.55"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`;
    const totals = this._mtLibTotals || {};
    const rows = libs.slice(0, 5).map((l, i) => {
      const sep = i > 0 ? "border-top:1px solid rgba(255,255,255,0.06);" : "";
      const n = totals[l.id];
      return `<div style="${sep}display:flex;align-items:center;gap:6px;padding:3px 0">
        ${_ico(l.type)}
        <span style="font-size:10px;font-weight:600;color:#fff;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._escHtml(l.title || l.name || "\u2014")}</span>
        ${n != null ? `<span style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.55);flex-shrink:0">${n}</span>` : ""}
      </div>`;
    }).join("") || `<div class="u-xxs-dim">${this._t("mtNoLibraries")}</div>`;
    const sum = Object.values(totals).reduce((s, n) => s + n, 0);
    const badge = sum > 0 ? this._uiBadge(String(sum), "blue", { extra: "flex-shrink:0", white: true }) : "";
    return `<div class="tl-card u-sec-body" data-mt-open="overview">
      <div class="u-bg-icon"><svg viewBox="0 0 24 24" width="130" height="130" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div>
      <div class="u-row-sb">
        <span class="u-media-badge">${this._t("mtOverview")}</span>
        ${badge}
      </div>
      <div class="u-flex-rel">${rows}</div>
    </div>`;
  }
  // ── Poster: Rules ─────────────────────────────────────────────────────────
  _mtRulesCard(d) {
    const rules = d.rules || [];
    const active = rules.filter((r) => r.isActive).length;
    const total = rules.length;
    const colById = new Map((d.collections || []).map((c) => [c.id, c]));
    const rows = rules.slice(0, 4).map((r, i) => {
      const dot = r.isActive ? "rgba(52,211,153,0.85)" : "rgba(255,255,255,0.25)";
      const sep = i > 0 ? "border-top:1px solid rgba(255,255,255,0.06);" : "";
      const lib = r.libraryId != null ? this._mtLibName(r.libraryId) : "";
      const col = colById.get(r.collectionId);
      const queued = col ? col.mediaCount ?? 0 : null;
      const meta = [lib, queued != null ? `${queued} ${this._t("mtQueuedLc")}` : ""].filter(Boolean).join(" \xB7 ");
      return `<div style="${sep}display:flex;align-items:flex-start;gap:6px;padding:3px 0">
        <div style="width:6px;height:6px;border-radius:50%;background:${dot};flex-shrink:0;margin-top:4px"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:10px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._escHtml(r.name || "\u2014")}</div>
          ${meta ? `<div style="font-size:9px;color:rgba(255,255,255,0.45);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._escHtml(meta)}</div>` : ""}
        </div>
      </div>`;
    }).join("") || `<div class="u-xxs-dim">${this._t("mtNoRules")}</div>`;
    const badge = this._uiBadge(`${active}/${total}`, active > 0 ? "green" : "neutral", { extra: "flex-shrink:0", white: true });
    return `<div class="tl-card u-sec-body" data-mt-open="rules">
      <div class="u-bg-icon"><svg viewBox="0 0 24 24" width="130" height="130" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><polyline points="9 13 11 15 15 11"/></svg></div>
      <div class="u-row-sb">
        <span class="u-media-badge">${this._t("mtRules")}</span>
        ${badge}
      </div>
      <div class="u-flex-rel">${rows}</div>
    </div>`;
  }
  // ── Poster: Collections ───────────────────────────────────────────────────
  _mtCollectionsCard(d) {
    const cols = d.collections || [];
    const items = cols.reduce((s, c) => s + (c.mediaCount ?? 0), 0);
    const bytes = cols.reduce((s, c) => s + (c.totalSizeBytes || 0), 0);
    const rows = cols.slice(0, 4).map((c, i) => {
      const sep = i > 0 ? "border-top:1px solid rgba(255,255,255,0.06);" : "";
      const cnt = c.mediaCount ?? 0;
      const lib = c.libraryId != null ? this._mtLibName(c.libraryId) : "";
      const size = c.totalSizeBytes ? this._mtFmtBytes(c.totalSizeBytes, 0) : "";
      const meta = [lib, `${cnt} ${this._t("mtQueuedLc")}`].filter(Boolean).join(" \xB7 ");
      return `<div style="${sep}padding:3px 0">
        <div style="display:flex;align-items:baseline;gap:6px">
          <span style="font-size:10px;font-weight:600;color:#fff;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._escHtml(c.title || c.name || "\u2014")}</span>
          ${size ? `<span style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.6);flex-shrink:0">${size}</span>` : ""}
        </div>
        <div style="font-size:9px;color:rgba(255,255,255,0.45);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._escHtml(meta)}</div>
      </div>`;
    }).join("") || `<div class="u-xxs-dim">${this._t("mtNoCollections")}</div>`;
    const badge = bytes > 0 ? this._uiBadge(this._mtFmtBytes(bytes, 0), "amber", { extra: "flex-shrink:0", white: true, title: `${items} ${this._t("mtQueuedLc")}` }) : items > 0 ? this._uiBadge(String(items), "amber", { extra: "flex-shrink:0", white: true }) : "";
    return `<div class="tl-card u-sec-body" data-mt-open="collections">
      <div class="u-bg-icon"><svg viewBox="0 0 24 24" width="130" height="130" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></svg></div>
      <div class="u-row-sb">
        <span class="u-media-badge">${this._t("mtCollections")}</span>
        ${badge}
      </div>
      <div class="u-flex-rel">${rows}</div>
    </div>`;
  }
  // ── Poster: Calendar ──────────────────────────────────────────────────────
  // The cron schedules this used to show are a Maintainerr setting, not news.
  // What the tab is actually about is which titles disappear next, so the card
  // previews the same deletion queue grouped by day.
  _mtCalendarCard(d) {
    const items = this._mtDelItems;
    const DAY = 864e5;
    const midnight = /* @__PURE__ */ new Date();
    midnight.setHours(0, 0, 0, 0);
    const today = midnight.getTime();
    let rows;
    if (!items) {
      rows = `<div class="u-xxs-dim">${this._t("loading")}</div>`;
    } else {
      const byDay = /* @__PURE__ */ new Map();
      for (const it of items) {
        const key = Math.max(today, new Date(it.due).setHours(0, 0, 0, 0));
        byDay.set(key, (byDay.get(key) || 0) + 1);
      }
      const days = [...byDay.entries()].sort((a, b) => a[0] - b[0]).slice(0, 4);
      rows = days.map(([ms, n], i) => {
        const sep = i > 0 ? "border-top:1px solid rgba(255,255,255,0.06);" : "";
        const inDays = Math.round((ms - today) / DAY);
        const label = inDays === 0 ? this._t("mtToday") : inDays === 1 ? this._t("mtTomorrow") : new Date(ms).toLocaleDateString(void 0, { day: "numeric", month: "short" });
        const clr = inDays <= 1 ? "rgba(255,69,58,0.95)" : "#fff";
        return `<div style="${sep}display:flex;align-items:center;gap:6px;padding:3px 0">
          <span style="font-size:10px;font-weight:600;color:${clr};flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._escHtml(label)}</span>
          <span style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.55);flex-shrink:0">${n}</span>
        </div>`;
      }).join("") || `<div class="u-xxs-dim">${this._t("mtNoActions")}</div>`;
    }
    const badge = items?.length ? this._uiBadge(String(items.length), "blue", { extra: "flex-shrink:0", white: true, title: `${items.length} ${this._t("mtScheduled")}` }) : "";
    return `<div class="tl-card u-sec-body" data-mt-open="calendar">
      <div class="u-bg-icon"><svg viewBox="0 0 24 24" width="130" height="130" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
      <div class="u-row-sb">
        <span class="u-media-badge">${this._t("mtCalendar")}</span>
        ${badge}
      </div>
      <div class="u-flex-rel">${rows}</div>
    </div>`;
  }
  // ── Helpers ───────────────────────────────────────────────────────────────
  // `dec` trims the decimal where space is tight — "123 GB" instead of "123.1 GB"
  _mtFmtBytes(b, dec = 1) {
    if (!b) return "0 B";
    if (b >= 1e12) return (b / 1e12).toFixed(dec) + " TB";
    if (b >= 1e9) return (b / 1e9).toFixed(dec) + " GB";
    if (b >= 1e6) return (b / 1e6).toFixed(dec) + " MB";
    return Math.round(b) + " B";
  }
  _mtCronDesc(c) {
    if (!c || c === "\u2014") return "\u2014";
    const parts = c.split(" ");
    if (parts.length < 5) return c;
    const [min, hr, dom] = parts;
    if (dom !== "*") return c;
    const hrStep = /^(\*|0-23)\/(\d+)$/.exec(hr);
    if (hrStep && min !== "*") return this._t("mtEveryHours").replace("{n}", hrStep[2]);
    const minStep = /^(\*|0-59)\/(\d+)$/.exec(min);
    if (minStep && hr === "*") return this._t("mtEveryMinutes").replace("{n}", minStep[2]);
    if (hr === "*" && min !== "*") return this._t("mtHourly");
    if (hr !== "*" && min !== "*") return `${this._t("mtDaily")} ${hr}:${min.padStart(2, "0")}`;
    return c;
  }
  _mtLibName(libraryId) {
    const libs = this._maintainerrLibraries || [];
    const lib = libs.find((l) => String(l.id) === String(libraryId));
    return lib?.title || lib?.name || `Lib ${libraryId}`;
  }
  // Parse flat rules array with ruleJson strings → grouped sections
  _mtParseRuleSections(flatRules) {
    if (!Array.isArray(flatRules) || !flatRules.length) return [];
    const sectionMap = /* @__PURE__ */ new Map();
    for (const r of flatRules) {
      let parsed;
      try {
        parsed = typeof r.ruleJson === "string" ? JSON.parse(r.ruleJson) : r.ruleJson || {};
      } catch (_) {
        parsed = {};
      }
      const secIdx = parsed.section ?? r.section ?? 0;
      if (!sectionMap.has(secIdx)) sectionMap.set(secIdx, { operator: 0, rules: [] });
      const sec = sectionMap.get(secIdx);
      const cv = parsed.customVal;
      const cvObj = cv && typeof cv === "object";
      sec.rules.push({
        firstVal: parsed.firstVal || ["", ""],
        lastVal: parsed.lastVal || null,
        action: parsed.action ?? 0,
        customVal: cvObj ? cv.value ?? "" : cv ?? "",
        customValType: cvObj ? cv.ruleTypeId ?? 2 : cv != null && cv !== "" ? 2 : null,
        operator: parsed.operator != null ? typeof parsed.operator === "string" ? parseInt(parsed.operator) : parsed.operator : 0
      });
    }
    const sections = [...sectionMap.entries()].sort((a, b) => a[0] - b[0]).map(([, s]) => s);
    for (const sec of sections) {
      if (sec.rules.length > 1) sec.operator = sec.rules[1]?.operator ?? 0;
    }
    return sections;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Modal shell
  // ──────────────────────────────────────────────────────────────────────────
  _mtModalHtml(tab) {
    const _mob = isMobile();
    const hdrPad = _mob ? "12px 12px 10px" : "14px 22px 10px";
    return `<div class="popup-overlay${dayClass(this)}" data-mt-modal>
      <div class="popup-glass tl-wide">
        <div class="is-panel-hdr" style="flex-direction:row;align-items:center;padding:${hdrPad};gap:8px">
          <div id="mt-nav-area" style="min-width:0;flex-shrink:1;overflow:hidden">${this._mtNavHtml(tab)}</div>
          <div id="mt-status" style="flex-shrink:0;display:flex;align-items:center">${this._mtStatusHtml()}</div>
          <div style="flex:1;min-width:8px"></div>
          <div id="mt-hdr-save" style="flex-shrink:0;display:flex">${this._mtHdrSaveHtml()}</div>
          <div id="mt-hdr-btn" style="flex-shrink:0;display:flex">${this._mtHdrBtnHtml()}</div>
        </div>
        <div class="popup-body" id="mt-body" style="padding:${_mob ? "12px 14px 16px" : "14px 22px 20px"};overflow-y:auto">
          <div class="is-loading"><span>${this._t("loading")}</span></div>
        </div>
      </div>
    </div>`;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Rules tab — card layout (like Maintainerr UI)
  // ──────────────────────────────────────────────────────────────────────────
  _mtRulesTabHtml() {
    const m = this._maintainerrModal;
    if (!m) return "";
    const rules = this._maintainerr?.rules || [];
    const search = (m.search || "").toLowerCase();
    const filterLib = m.filterLib || "all";
    const filterStatus = m.filterStatus || "all";
    let filtered = rules;
    if (search) filtered = filtered.filter((r) => (r.name || "").toLowerCase().includes(search));
    if (filterLib !== "all") filtered = filtered.filter((r) => String(r.libraryId) === filterLib);
    if (filterStatus === "active") filtered = filtered.filter((r) => r.isActive);
    if (filterStatus === "inactive") filtered = filtered.filter((r) => !r.isActive);
    const PAGE = m.rulesPerPage || 12;
    const total = filtered.length;
    const pages = Math.ceil(total / PAGE) || 1;
    m.rulesPages = pages;
    const page = Math.min(m.page || 0, pages - 1);
    const slice = filtered.slice(page * PAGE, (page + 1) * PAGE);
    const libs = /* @__PURE__ */ new Map();
    rules.forEach((r) => {
      if (r.libraryId != null) libs.set(String(r.libraryId), this._mtLibName(r.libraryId));
    });
    const libItems = [["all", this._t("mtAllLibs")], ...libs];
    const statusItems = [
      ["all", this._t("mtAllStatus")],
      ["active", this._t("mtActive")],
      ["inactive", this._t("mtInactive")]
    ];
    const view = m.view || "cards";
    const _segIco = this._mtSegIcons;
    const viewSeg = this._mtSegmented("data-mt-view-seg", [
      { v: "cards", label: this._t("mtViewCards"), icon: _segIco.cards },
      { v: "table", label: this._t("mtViewTable"), icon: _segIco.table }
    ], view, { icons: true, animatePrev: !!m._animView });
    const toolbar = `<div style="margin-bottom:${this._mtToolbarGap}px">${this._mtToolbar("mt-search", m.search, [
      { id: "mt-filter-lib", items: libItems, value: filterLib, neutral: "all" },
      { id: "mt-filter-status", items: statusItems, value: filterStatus, neutral: "all" }
    ])}</div>`;
    const _dayR = this._isDay;
    const _metaLbl = `font-size:9px;text-transform:uppercase;letter-spacing:0.05em;color:${_dayR ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)"};margin-bottom:2px`;
    const cards = view === "table" ? "" : slice.map((r) => {
      const statusLabel = r.isActive ? this._t("mtActive") : this._t("mtInactive");
      const statusColor = r.isActive ? _dayR ? "rgba(5,150,105,0.95)" : "rgba(52,211,153,0.85)" : _dayR ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.4)";
      const libName = this._mtLibName(r.libraryId);
      const ruleCount = (r.rules || []).length;
      const busy = m.runningId === r.id;
      const PLAY = `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="display:block"><polygon points="5,3 19,12 5,21"/></svg>`;
      const TRASH = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
      const CHECK = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="20 6 9 17 4 12"/></svg>`;
      const CROSS = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="display:block"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
      const confirming = m.confirmDelete === r.id;
      const confirmOverlay = confirming ? `<div style="position:absolute;inset:0;z-index:5;background:${this._isDay ? "rgba(255,255,255,0.90)" : "rgba(0,0,0,0.78)"};border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px">
            <span style="font-size:12px;font-weight:600;color:var(--is-text);text-align:center;padding:0 12px">${this._t("mtConfirmDelete")}</span>
            <div style="display:flex;gap:10px">
              ${this._mtRoundBtn(`data-mt-del-confirm="${r.id}"`, CHECK, this._t("mtYes"), { tone: "red" })}
              ${this._mtRoundBtn("data-mt-del-cancel", CROSS, this._t("mtNo"), { tone: "blue" })}
            </div>
          </div>` : "";
      const desc = `<div style="flex:1;min-height:0;display:flex;align-items:center;overflow:hidden">
        ${r.description ? `<div style="font-size:11px;color:var(--is-text-muted);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${this._escHtml(r.description)}</div>` : ""}
      </div>`;
      return `<div data-mt-edit="${r.id}" style="position:relative;background:var(--is-btn-bg);border:1px solid var(--is-card-bdr);border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;gap:6px;min-height:160px;cursor:pointer">
        <div style="position:relative">
          <div style="font-size:13px;font-weight:700;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:70px">${this._escHtml(r.name || "\u2014")}</div>
          <div style="position:absolute;top:50%;right:0;transform:translateY(-50%);z-index:2;display:flex;gap:6px">
            ${this._mtRoundBtn(`data-mt-run="${r.id}"`, PLAY, this._t("mtRunRule"), { tone: "green", busy })}
            ${this._mtRoundBtn(`data-mt-delete="${r.id}"`, TRASH, this._t("mtDelete"), { tone: "red" })}
          </div>
        </div>
        ${desc}
        <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:4px 12px;font-size:11px">
          <div><div style="${_metaLbl}">STATUS</div><div style="color:${statusColor};font-weight:600">${statusLabel}</div></div>
          <div style="min-width:0"><div style="${_metaLbl}">LIBRARY</div><div style="color:var(--is-text);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._escHtml(libName)}</div></div>
          <div style="text-align:right"><div style="${_metaLbl}">RULES</div><div style="color:var(--is-text);font-weight:600">${ruleCount}</div></div>
        </div>
        ${confirmOverlay}
      </div>`;
    }).join("");
    const empty = total === 0 ? `<div class="u-empty-dim" style="padding:20px 0">${this._t("mtNoRules")}</div>` : "";
    const body = view === "table" ? this._mtRulesTableHtml(slice) : cards ? `<div id="mt-rules-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;align-content:start">${cards}</div>` : "";
    const paging = this._tlMobPag("mt-page", page, pages, true);
    const footer = `<div id="mt-rules-foot" style="position:relative;display:flex;align-items:center;justify-content:center;min-height:44px;flex-shrink:0">
      ${paging}
      <div style="position:absolute;left:0;top:50%;transform:translateY(-50%)">${viewSeg}</div>
    </div>`;
    return `<div style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden">
      <div style="flex-shrink:0">${toolbar}</div>
      <div id="mt-rules-wrap" style="flex:1;min-height:0;overflow-y:auto">${body || empty}</div>
      ${footer}
    </div>`;
  }
  _mtRulesTableHtml(rules) {
    if (!rules.length) return "";
    const m = this._maintainerrModal;
    const isMob = this._isMob;
    const rows = rules.map((r) => {
      const statusLabel = r.isActive ? this._t("mtActive") : this._t("mtInactive");
      const statusColor = r.isActive ? "rgba(52,211,153,0.85)" : "rgba(255,255,255,0.4)";
      const libName = this._mtLibName(r.libraryId);
      const ruleCount = (r.rules || []).length;
      const busy = m.runningId === r.id;
      const PLAY_S = `<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" style="display:block"><polygon points="5,3 19,12 5,21"/></svg>`;
      const TRASH_S = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
      const actions = `<div style="display:flex;gap:5px;justify-content:flex-end">
        ${this._mtRoundBtn(`data-mt-run="${r.id}"`, PLAY_S, this._t("mtRunRule"), { size: 24, tone: "green", busy })}
        ${this._mtRoundBtn(`data-mt-delete-now="${r.id}"`, TRASH_S, this._t("mtDelete"), { size: 24, tone: "red" })}
      </div>`;
      if (isMob) {
        return `<div data-mt-edit="${r.id}" style="display:flex;align-items:center;gap:8px;padding:8px 4px;border-bottom:1px solid var(--is-divider,rgba(255,255,255,0.07));cursor:pointer">
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._escHtml(r.name || "\u2014")}</div>
            <div style="font-size:10px;color:var(--is-text-muted);margin-top:2px">${this._escHtml(libName)} \xB7 ${ruleCount} \xB7 <span style="color:${statusColor}">${statusLabel}</span></div>
          </div>
          ${actions}
        </div>`;
      }
      return `<tr data-mt-edit="${r.id}" style="cursor:pointer">
        <td><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this._escHtml(r.name || "\u2014")}</div></td>
        <td>${this._escHtml(libName)}</td>
        <td style="text-align:center">${ruleCount}</td>
        <td style="color:${statusColor}">${statusLabel}</td>
        <td style="text-align:right">${actions}</td>
      </tr>`;
    }).join("");
    if (isMob) return `<div>${rows}</div>`;
    const _th = "user-select:none;white-space:nowrap";
    return `<table class="tl-users-table lib-table" style="width:100%;table-layout:fixed">
      <thead><tr>
        <th style="${_th};width:auto">${this._t("mtRuleName")}</th>
        <th style="${_th};width:150px">${this._t("mtLibrary")}</th>
        <th style="${_th};width:70px;text-align:center">${this._t("mtRules")}</th>
        <th style="${_th};width:100px">${this._t("mtStatus")}</th>
        <th style="${_th};width:80px;text-align:right"></th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }
  // Tracearr-style nav pills. Main tabs (lighter blue) on the left; the
  // Collections pill grows a row of darker sub-tabs (Media/Exclusions/Info)
  // with an expand animation when a collection detail is open.
  // ──────────────────────────────────────────────────────────────────────────
  // Overview tab — every item currently queued for deletion, across collections
  // ──────────────────────────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────────────
  // Overview tab — media-server library browser with collection/exclusion actions
  // ──────────────────────────────────────────────────────────────────────────
  // Library items carry no artwork. Radarr/Sonarr cover most of them for free;
  // anything else is resolved lazily through Maintainerr's metadata endpoint
  // (see _mtResolvePosters) and served from _mtPosterCache afterwards.
  _mtPosterFor(item) {
    const pick = (arr) => (arr || []).find((i) => i.coverType === "poster")?.remoteUrl || "";
    const tmdb = item.providerIds?.tmdb?.[0] ?? item.tmdbId ?? null;
    const tvdb = item.providerIds?.tvdb?.[0] ?? item.tvdbId ?? null;
    if (tmdb) {
      for (const lib of [this._radarr, this._radarr2]) {
        const mv = (lib || []).find((m) => String(m.tmdbId) === String(tmdb));
        if (mv) {
          const p = pick(mv.images);
          if (p) return p;
        }
      }
    }
    if (tvdb) {
      for (const lib of [this._sonarr, this._sonarr2]) {
        const sh = (lib || []).find((s) => String(s.tvdbId) === String(tvdb));
        if (sh) {
          const p = pick(sh.images);
          if (p) return p;
        }
      }
    }
    const key = this._mtPosterKey(item);
    return key && this._mtPosterCache?.get(key) || "";
  }
  // Maintainerr stores when an item entered a collection, not when it leaves —
  // the deletion date is addDate + the collection's deleteAfterDays.
  _mtDueMs(addDate, deleteAfterDays) {
    if (!addDate || !deleteAfterDays) return null;
    const added = new Date(addDate).getTime();
    if (!Number.isFinite(added)) return null;
    return added + deleteAfterDays * 864e5;
  }
  // Near-term deletions read better as words ("gone tomorrow") than as a count;
  // anything further out is clearer as the actual date.
  _mtGoneText(days, dueMs, compact) {
    const cs = this._cfg?.localisation === "cs";
    if (compact) return days === 0 ? cs ? "DNES" : "TODAY" : `${days}D`;
    if (days === 0) return cs ? "MIZ\xCD DNES" : "GONE TODAY";
    if (days === 1) return cs ? "MIZ\xCD Z\xCDTRA" : "GONE TOMORROW";
    if (days <= 5) return cs ? `MIZ\xCD ZA ${days} ${days < 5 ? "DNY" : "DN\xCD"}` : `GONE IN ${days} DAYS`;
    const d = new Date(dueMs);
    if (cs) return `MIZ\xCD ${d.toLocaleDateString("cs-CZ", { day: "numeric", month: "long" })}`.toUpperCase();
    const dd = d.getDate();
    const tens = dd % 100;
    const suf = tens >= 11 && tens <= 13 ? "th" : dd % 10 === 1 ? "st" : dd % 10 === 2 ? "nd" : dd % 10 === 3 ? "rd" : "th";
    return `GONE ${d.toLocaleDateString("en-US", { month: "long" })} ${dd}${suf}`.toUpperCase();
  }
  // Red while deletion is imminent, amber once it is more than a work-week out
  // `prefix` names the exact thing being deleted (a season, say) and goes on
  // its own line, so "Season 4 / GONE AUGUST 25TH" reads as one statement.
  _mtDelBadge(dueMs, compact, prefix = "", stretch = false) {
    if (dueMs == null) return "";
    if (this._posterCfg().goneTag === "off") return "";
    const days = Math.max(0, Math.ceil((dueMs - Date.now()) / 864e5));
    const bg = "radial-gradient(circle at 50% 50%, #ff3b30 0%, #ff2d20 38%, #8e1410 100%)";
    const full = prefix ? `${prefix} \u2014 ${this._mtGoneText(days, dueMs, false)}` : this._mtGoneText(days, dueMs, false);
    const base = `font-size:10px;font-weight:800;letter-spacing:0.02em;color:#fff;background:${bg};border:1px solid #ff3b30;border-radius:5px;max-width:100%;box-sizing:border-box;white-space:normal;text-align:center;line-height:1.2;box-shadow:0 2px 8px rgba(0,0,0,0.45)${stretch ? ";flex:1" : ""}`;
    if (prefix && compact) {
      return `<span title="${this._escHtml(full)}" style="${base};padding:3px 6px">${this._escHtml(prefix)} ${this._escHtml(this._mtGoneText(days, dueMs, true))}</span>`;
    }
    if (prefix) {
      return `<span title="${this._escHtml(full)}" style="${base};display:inline-flex;flex-direction:column;align-items:center;gap:2px;padding:3px 6px">
        <span>${this._escHtml(prefix)}</span>
        <span>${this._escHtml(this._mtGoneText(days, dueMs, false))}</span>
      </span>`;
    }
    return `<span title="${this._escHtml(full)}" style="${base};padding:3px 6px">${this._escHtml(this._mtGoneText(days, dueMs, compact))}</span>`;
  }
  _mtExclBadge(compact) {
    const ico = `<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="flex-shrink:0"><circle cx="12" cy="12" r="9"/><line x1="5.6" y1="5.6" x2="18.4" y2="18.4"/></svg>`;
    const txt = compact ? "" : `<span>${this._t("mtExcluded")}</span>`;
    return `<span class="media-type-tag" title="${this._t("mtExcluded")}" style="position:static;display:inline-flex;align-items:center;gap:3px;background:rgba(52,211,153,0.30);color:#fff">${ico}${txt}</span>`;
  }
  // Two-option pill switch. `animatePrev` renders it still showing the old
  // choice so the wire layer can flip it next frame and let the fill slide —
  // a freshly inserted element would jump straight to its end state.
  _mtSegmented(attr, opts, current, { icons = false, animatePrev = false, width = null, accent = null, prev = null, accentAlpha = null } = {}) {
    const varW = opts.some((o) => o.w);
    if (varW) {
      const ws = opts.map((o) => o.w || width || 44);
      const xs = ws.map((_, i) => ws.slice(0, i).reduce((a, b) => a + b, 0));
      const to2 = Math.max(0, opts.findIndex((o) => o.v === current));
      const fromIdx2 = prev != null ? opts.findIndex((o) => o.v === prev) : -1;
      const from2 = animatePrev ? fromIdx2 >= 0 ? fromIdx2 : to2 === 0 ? 1 : 0 : to2;
      const halves2 = opts.map(
        (o, i) => `<span class="mt-seg-half${o.disabled ? " is-disabled" : ""}" ${o.attr || ""} style="${o.w ? `width:${o.w}px` : "width:auto;padding:0 9px"}" title="${this._escHtml(o.label)}">${o.icon || this._escHtml(o.label)}</span>`
      ).join("");
      const vars2 = [
        ...ws.map((w, i) => `--w${i}:${w}px`),
        ...xs.map((x, i) => `--x${i}:${x}px`),
        accent ? `--seg-accent:rgba(${accent},${accentAlpha ?? (this._isDay ? 0.85 : 0.5)});--seg-accent-bdr:rgba(${accent},${this._isDay ? 0.95 : 0.8})` : ""
      ].filter(Boolean).join(";");
      return `<div class="mt-seg mt-seg--var mt-seg--presync${icons ? " mt-seg--icon" : ""}" ${attr} data-seg="${from2}" data-seg-to="${to2}" style="${vars2}">
        <span class="mt-seg-ind"></span>
        ${halves2}
      </div>`;
    }
    const to = Math.max(0, opts.findIndex((o) => o.v === current));
    const fromIdx = prev != null ? opts.findIndex((o) => o.v === prev) : -1;
    const from = animatePrev ? fromIdx >= 0 ? fromIdx : to === 0 ? 1 : 0 : to;
    const halves = opts.map(
      (o) => `<span class="mt-seg-half${o.disabled ? " is-disabled" : ""}" ${o.attr || ""} title="${this._escHtml(o.label)}">${o.icon || this._escHtml(o.label)}</span>`
    ).join("");
    const vars = [
      width ? `--seg-w:${width}px` : "",
      // Same reasoning as _tabFill: the selected half's label is white, so day
      // mode needs a fill solid enough to carry it.
      // accentAlpha lets a caller match the header nav's near-solid fill; the
      // default stays translucent, which is what a peanut on a card wants.
      accent ? `--seg-accent:rgba(${accent},${accentAlpha ?? (this._isDay ? 0.85 : 0.5)});--seg-accent-bdr:rgba(${accent},${this._isDay ? 0.95 : 0.8})` : ""
    ].filter(Boolean).join(";");
    return `<div class="mt-seg${icons ? " mt-seg--icon" : ""}" ${attr} data-seg="${from}" data-seg-to="${to}"${vars ? ` style="${vars}"` : ""}>
      <span class="mt-seg-ind"></span>
      ${halves}
    </div>`;
  }
  // The indicator of a variable-width peanut is a single absolutely positioned
  // pill, so it can only follow the halves if it is told their real geometry.
  // Measuring beats the widths the caller guessed: an icon pair renders wider
  // or narrower than any number written by hand, and then the fill sits off.
  _syncSegVars(scope) {
    (scope || this.shadowRoot)?.querySelectorAll(".mt-seg--var").forEach((seg) => {
      const halves = [...seg.querySelectorAll(".mt-seg-half")];
      if (!halves.length) return;
      const base = halves[0].offsetLeft;
      halves.forEach((h, i) => {
        seg.style.setProperty(`--w${i}`, `${h.offsetWidth}px`);
        seg.style.setProperty(`--x${i}`, `${h.offsetLeft - base}px`);
      });
      if (seg.classList.contains("mt-seg--presync")) {
        void seg.offsetWidth;
        seg.classList.remove("mt-seg--presync");
      }
    });
  }
  // Icons used by the view switches
  get _mtSegIcons() {
    const F = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15" style="display:block"';
    return {
      cards: `<svg ${F}><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></svg>`,
      table: `<svg ${F}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
      // Both keep the calendar frame and differ only in what fills it: one band
      // for a week, a grid of days for a month.
      week: `<svg ${F}><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><rect x="5.5" y="12" width="13" height="3.5" rx="1" fill="currentColor" stroke="none"/></svg>`,
      month: `<svg ${F}><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><g fill="currentColor" stroke="none"><circle cx="7.5" cy="12.5" r="1.15"/><circle cx="12" cy="12.5" r="1.15"/><circle cx="16.5" cy="12.5" r="1.15"/><circle cx="7.5" cy="16.5" r="1.15"/><circle cx="12" cy="16.5" r="1.15"/><circle cx="16.5" cy="16.5" r="1.15"/></g></svg>`,
      // Same glyphs the Library type filter uses, so a film strip means movies
      // and a set means TV wherever the switch appears
      movie: `<svg ${F}><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/></svg>`,
      tv: `<svg ${F}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
      music: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="display:block"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z"/></svg>`
    };
  }
  // ── Toolbar ───────────────────────────────────────────────────────────────
  // One translucent capsule instead of three outlined boxes. The native select
  // stays, but only as an invisible hit target on top of our own trigger — the
  // OS-drawn chevron and font were what made the row look unstyled. Keeping its
  // id means the delegated change handlers need no rewiring.
  // `neutral` is the value that means "not filtering" — on it the trigger goes
  // muted, so the accent is left to say which filters are actually set.
  _mtSelect(id, items, current, neutral = null) {
    const cur = String(current ?? "");
    const found = items.find(([v]) => String(v) === cur);
    const label = found ? found[1] : items[0]?.[1] || "";
    const off = neutral != null && cur === String(neutral);
    const opts = items.map(([v, l]) => `<option value="${this._escHtml(String(v))}"${String(v) === cur ? " selected" : ""}>${this._escHtml(l)}</option>`).join("");
    const chev = `<svg class="mt-tb-chev" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
    return `<span class="mt-tb-sel${off ? " is-off" : ""}">
      <span class="mt-tb-lbl">${this._escHtml(label)}</span>${chev}
      <select id="${id}">${opts}</select>
    </span>`;
  }
  // Matches the reduced body padding poster views use, so the bar sits centred
  // between the header and the grid.
  get _mtToolbarGap() {
    return 8;
  }
  // The toolbar's select reduced to a bare label; forms need the same control
  // wearing field chrome — full width, soft fill, chevron pinned right.
  _mtFieldSelect(id, items, current, extra = "") {
    const cur = String(current ?? "");
    const found = items.find(([v]) => String(v) === cur);
    const label = found ? found[1] : items[0]?.[1] || "";
    const opts = items.map(([v, l]) => `<option value="${this._escHtml(String(v))}"${String(v) === cur ? " selected" : ""}>${this._escHtml(l)}</option>`).join("");
    return this._mtFieldSelectRaw(`id="${id}"`, opts, label, extra);
  }
  // The rule editor's selects carry data-attributes rather than ids and build
  // their options with optgroups, so they hand over ready-made option HTML and
  // the label they want shown. Same capsule either way.
  _mtFieldSelectRaw(attrs, optsHtml, label, extra = "") {
    const chev = `<svg class="mt-tb-chev" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
    return `<span class="mt-field mt-fsel" style="${extra}">
      <span class="mt-fsel-lbl">${this._escHtml(label ?? "")}</span>${chev}
      <select ${attrs}>${optsHtml}</select>
    </span>`;
  }
  // A select entry may hand over ready-made HTML instead of items — the Library's
  // sort is a custom dropdown, because a native select cannot report the same
  // option being picked twice, which is how the direction is toggled.
  _mtToolbar(searchId, searchValue, selects, placeholder, style = "") {
    const ico = `<svg class="mt-tb-ico" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    const ctrls = selects.filter(Boolean).map((s) => s.html ?? this._mtSelect(s.id, s.items, s.value, s.neutral ?? null)).join("");
    const search = searchId ? `${ico}<input id="${searchId}" class="mt-tb-input" type="search" value="${this._escHtml(searchValue || "")}" placeholder="${placeholder ?? this._t("mtSearch")}" autocomplete="off">` : "";
    return `<div class="mt-tb"${style ? ` style="${style}"` : ""}>
      ${search}
      ${ctrls ? `${search ? '<span class="mt-tb-sep"></span>' : ""}${ctrls}` : ""}
    </div>`;
  }
  _mtPosterKey(item) {
    const tmdb = item.providerIds?.tmdb?.[0] ?? item.tmdbId ?? null;
    const tvdb = item.providerIds?.tvdb?.[0] ?? item.tvdbId ?? null;
    const type = item.type === "movie" ? "movie" : "show";
    if (tmdb) return `${type}:tmdb:${tmdb}`;
    if (tvdb) return `${type}:tvdb:${tvdb}`;
    return "";
  }
  // Collections that can hold items from the library being browsed. Matching is
  // by media type, not libraryId — a movie can be moved into any movie
  // collection regardless of which Radarr/library instance it came from.
  _mtCollectionsForLib(libId) {
    const lib = (this._maintainerrLibraries || []).find((l) => String(l.id) === String(libId));
    const want = lib?.type === "show" ? ["show", "season", "episode"] : ["movie"];
    const rules = this._maintainerr?.rules || [];
    return (this._maintainerr?.collections || []).filter((c) => {
      const type = c.type || rules.find((r) => r.collectionId === c.id)?.dataType;
      return want.includes(type);
    });
  }
  // Maintainerr names a collection after its rule, and the same rule duplicated
  // for a second Radarr/Sonarr instance produces two identically named ones.
  // Prefix with the arr server, but only where the ambiguity actually exists.
  _mtColLabel(c, all) {
    const base = c.title || c.name || `#${c.id}`;
    const same = (all || []).filter((x) => (x.title || x.name || `#${x.id}`) === base);
    if (same.length < 2) return base;
    const srv = this._mtArrServerName(c);
    return srv ? `${srv} \u2014 ${base}` : base;
  }
  _mtArrServerName(c) {
    const rule = (this._maintainerr?.rules || []).find((r) => r.collectionId === c.id);
    const rId = c.radarrSettingsId ?? rule?.radarrSettingsId ?? null;
    const sId = c.sonarrSettingsId ?? rule?.sonarrSettingsId ?? null;
    const srv = this._maintainerrArrServers || {};
    const list = rId != null ? srv.radarr || [] : sId != null ? srv.sonarr || [] : [];
    const want = rId != null ? rId : sId;
    if (want == null) return null;
    const hit = list.find((x) => String(x.id) === String(want));
    if (!hit) return null;
    return this._seerrNameForHost(hit, rId != null ? "radarr" : "sonarr") || hit.name || hit.serverName || null;
  }
  _seerrNameForHost(srvEntry, kind) {
    const hosts = this._arrHosts || {};
    if (!Object.keys(hosts).length) return null;
    const raw = srvEntry?.url || srvEntry?.hostname || srvEntry?.host || "";
    let want = "";
    try {
      const u = new URL(/^https?:\/\//.test(raw) ? raw : `http://${raw}`);
      const port = u.port || (srvEntry?.port ? String(srvEntry.port) : u.protocol === "https:" ? "443" : "80");
      want = `${u.hostname.toLowerCase()}:${port}`;
    } catch (_) {
      return null;
    }
    const first = kind === "radarr" ? "radarr" : "sonarr";
    const second = kind === "radarr" ? "radarr2" : "sonarr2";
    const [l1, l2] = this._arrInstLabels(kind);
    if (hosts[first] === want) return l1;
    if (hosts[second] === want) return l2;
    return null;
  }
  // Same rules the detail popup uses for its instance chips: the 4K flag wins,
  // then the Seerr names but only when both are set and short, else generic.
  _arrInstLabels(kind) {
    const MAX = 10;
    const isRadarr = kind === "radarr";
    const s1 = isRadarr ? this._seerrRadarr : this._seerrSonarr;
    const s2 = isRadarr ? this._seerrRadarr2 : this._seerrSonarr2;
    if (s2?.is4k) return ["HD", "4K"];
    const n1 = s1?.name, n2 = s2?.name;
    if (n1 && n2 && n1.length <= MAX && n2.length <= MAX) return [n1, n2];
    return isRadarr ? ["Radarr 1", "Radarr 2"] : ["Sonarr 1", "Sonarr 2"];
  }
  _mtOverviewTabHtml() {
    const m = this._maintainerrModal;
    if (!m) return "";
    const ov = m.overview;
    if (!ov) return `<div class="is-loading"><span>${this._t("loading")}</span></div>`;
    const isMob = this._isMob;
    const { cols, perPage, gap, gridMaxW } = this._mtGridCalc(ov, 90);
    const libs = this._maintainerrLibraries || [];
    const libItems = libs.map((l) => [l.id, l.title]);
    const sortItems = [
      ["title-asc", "Title A\u2013Z"],
      ["title-desc", "Title Z\u2013A"],
      ["airDate-desc", "Newest first"],
      ["airDate-asc", "Oldest first"],
      ["rating-desc", "Highest rated"],
      ["rating-asc", "Lowest rated"],
      ["watchCount-desc", "Most watched"],
      ["watchCount-asc", "Least watched"],
      ["manual-desc", "Manual first"],
      ["excluded-desc", "Excluded first"]
    ];
    const sort = ov.sort || "title-asc";
    const toolbar = `<div style="margin-bottom:${this._mtToolbarGap}px">${this._mtToolbar("mt-ov-search", ov.search || "", [
      { id: "mt-ov-lib", items: libItems, value: ov.libId },
      { id: "mt-ov-sort", items: sortItems, value: sort }
    ])}</div>`;
    if (ov.loading) {
      return `<div style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden"><div style="flex-shrink:0">${toolbar}</div><div style="flex:1;min-height:0;display:flex;align-items:center;justify-content:center"><div class="is-loading"><span>${this._t("loading")}</span></div></div></div>`;
    }
    const searching = !!(ov.search || "").trim();
    const allItems = searching ? ov.searchItems || [] : ov.items || [];
    const total = searching ? allItems.length : ov.totalSize || 0;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(ov.page || 0, totalPages - 1);
    const pageItems = searching ? allItems.slice(safePage * perPage, (safePage + 1) * perPage) : allItems;
    const ADD_ICO = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`;
    const EXCL_ICO = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="display:block"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`;
    const _rnd = (bdr, bg) => `width:34px;height:34px;padding:0;border-radius:50%;border:1px solid ${bdr};background:${bg};color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:0;backdrop-filter:blur(8px)`;
    const del = this._mtDelMap || /* @__PURE__ */ new Map();
    const compact = cols >= 8;
    const posters = pageItems.map((item) => {
      const actions = `<div style="position:absolute;bottom:8px;right:8px;z-index:5;display:flex;flex-direction:column;gap:6px">
        <button data-mt-ov-add="${item.id}" title="${this._t("mtAddRemoveMedia")}" style="${_rnd("rgba(0,122,255,0.50)", "rgba(0,122,255,0.30)")}">${ADD_ICO}</button>
        <button data-mt-ov-excl="${item.id}" title="${this._t("mtExcludeMedia")}" style="${_rnd("rgba(52,211,153,0.50)", "rgba(52,211,153,0.28)")}">${EXCL_ICO}</button>
      </div>`;
      const dm = del.get(String(item.id));
      const prefix = this._mtSeasonLabel(dm?.seasons);
      return this._mtOvPosterCard(item, { compact, dueMs: dm?.due ?? null, actions, prefix });
    }).join("");
    const empty = pageItems.length === 0 ? `<div class="u-empty-dim" style="padding:20px 0">${this._t("mtNoCollections")}</div>` : "";
    const grid = posters ? `<div id="mt-poster-grid" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:${gap}px;overflow:hidden${gridMaxW ? `;max-width:${gridMaxW}px;margin:0 auto` : ""}">${posters}</div>` : empty;
    const pagHtml = this._tlMobPag("mt-ov-page", safePage, totalPages, true);
    const dragHandle = this._mtDragHandleHtml(ov, isMob);
    const pagWrap = pagHtml || dragHandle ? `<div id="mt-pag-wrap" style="flex-shrink:0;position:relative;${dragHandle && !pagHtml ? "height:36px" : ""}">${pagHtml}${dragHandle}</div>` : "";
    return `<div style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;position:relative"><div style="flex-shrink:0">${toolbar}</div><div style="flex:1;min-height:0;overflow:hidden">${grid}</div>` + pagWrap + this._mtOverviewDialogHtml() + `</div>`;
  }
  // Overview posters reuse the library grid's chrome (.mc shell, gradient
  // footer, rating + status badges) so both views read the same. Size and
  // quality-profile tags are dropped — neither is relevant to a deletion queue.
  // One season reads better spelled out; several are compressed to S01-S03,
  // falling back to a list when the numbers are not consecutive.
  _mtSeasonLabel(seasons) {
    const list = [...new Set((seasons || []).filter((n) => n != null))].sort((a, b) => a - b);
    if (!list.length) return "";
    if (list.length === 1) return `${this._t("mtSeason")} ${list[0]}`;
    const pad = (n) => `S${String(n).padStart(2, "0")}`;
    const contiguous = list.every((n, i) => i === 0 || n === list[i - 1] + 1);
    return contiguous ? `${pad(list[0])}-${pad(list[list.length - 1])}` : list.map(pad).join(", ");
  }
  _mtOvPosterCard(item, { compact, dueMs, actions = "", overlay = "", popup = true, type, fallbackPoster = "", excluded = false, prefix = "", topBadge = "" }) {
    const pc = this._posterCfg();
    const kind = type || item.type || "movie";
    const isMovie = kind === "movie";
    const tmdb = item.providerIds?.tmdb?.[0] ?? item.tmdbId ?? null;
    const tvdb = item.providerIds?.tvdb?.[0] ?? item.tvdbId ?? null;
    const arr = isMovie ? (this._radarr || []).find((x) => tmdb && String(x.tmdbId) === String(tmdb)) : (this._sonarr || []).find((x) => tvdb && String(x.tvdbId) === String(tvdb));
    const md = item.mediaData;
    const isSeason = kind === "season" && md?.type === "season" && md?.index != null;
    const seasonPrefix = isSeason ? `${this._t("mtSeason")} ${md.index}` : "";
    const title = this._escHtml(
      (isSeason ? md.parentTitle || md.title : md?.title || item.title || item.name) || "\u2014"
    );
    const poster = (arr ? isMovie ? this._getRadarrPoster(arr) : this._getSonarrPoster(arr) : "") || fallbackPoster || this._mtPosterFor(item);
    const img = this._mcImg(poster, isMovie ? "\u{1F3AC}" : "\u{1F4FA}", item.id);
    const _langs = arr ? this._arrLangCodes(arr, isMovie) : { audioCodes: [], subCodes: [] };
    const ratingHtml = arr ? this._ratingLangBlock({ ...arr, _mediaType: isMovie ? "movie" : "tv" }, _langs) : "";
    const _b = (cls, icon, text) => compact ? `<span class="badge ${cls}">${icon}</span>` : this._badge(cls, icon, text);
    let badgeCls = "", badgeHtml = "", pct = -1;
    if (arr && isMovie) {
      const dlFailed = this._radarrQueueFailed?.has(arr.id);
      const dlActive = this._radarrQueueActive?.has(arr.id);
      if (arr.hasFile && arr.movieFile?.qualityCutoffNotMet) {
        badgeCls = "b-cutoff";
        badgeHtml = _b("b-cutoff", "\u26A1", "Upgrade");
      } else if (arr.hasFile) {
        badgeCls = "b-st-avail";
        badgeHtml = _b("b-st-avail", "\u2713", this._t("badgeAvailable"));
      } else if (dlFailed) {
        badgeCls = "b-missing";
        badgeHtml = _b("b-missing", "\u2717", this._t("badgeFailed"));
      } else if (dlActive) {
        badgeCls = "b-dl";
        badgeHtml = _b("b-dl", "\u2193", this._t("badgeDownloading"));
        pct = this._dlPct(arr.id, "movie");
      } else {
        badgeCls = "b-missing";
        badgeHtml = _b("b-missing", "\u2717", this._t("badgeMissing"));
      }
    } else if (arr) {
      const fc = arr.statistics?.episodeFileCount || 0;
      const tc = arr.statistics?.episodeCount || 0;
      if (fc === 0 && tc > 0) {
        badgeCls = "b-missing";
        badgeHtml = _b("b-missing", "\u2717", this._t("badgeMissing"));
      } else if (fc < tc) {
        badgeCls = "b-partial";
        badgeHtml = compact ? `<span class="badge b-partial">${fc}</span>` : `<span class="badge b-partial">${fc}/<span class="b-txt">${tc}</span></span>`;
        pct = tc > 0 ? Math.round(fc / tc * 100) : -1;
      } else if (fc > 0 && arr.status === "continuing") {
        badgeCls = "b-continuing";
        badgeHtml = _b("b-continuing", "\u25B6", this._t("badgeAvailable"));
      } else if (fc > 0) {
        badgeCls = "b-st-avail";
        badgeHtml = _b("b-st-avail", "\u2713", this._t("badgeAvailable"));
      }
    }
    const showTag = pc.statusDisplay === "tags" || pc.statusDisplay === "both";
    const statusTag = badgeHtml && showTag ? badgeHtml : "";
    const showStripe = pc.statusDisplay === "stripes" || pc.statusDisplay === "both";
    const statusBar = showStripe && badgeCls ? this._statusStripe(this._statusStripeColor(badgeCls), badgeCls === "b-dl", pct) : "";
    const _label = { movie: "Movie", show: "Show", season: "Season", episode: "Episode" }[kind] || kind;
    const _mediaTag = pc.mediaType ? `<span class="media-type-tag" style="position:static">${_label}</span>` : "";
    const _exclTag = excluded || item.maintainerrExclusionId ? this._mtExclBadge(compact) : "";
    const topLeft = _mediaTag || topBadge ? `<div style="position:absolute;top:5px;left:5px;z-index:4;display:flex;flex-direction:column;align-items:flex-start;gap:3px">${_mediaTag}${topBadge}</div>` : "";
    const topRight = statusTag || _exclTag ? `<div style="position:absolute;top:6px;right:6px;z-index:4;display:flex;flex-direction:column;align-items:flex-end;gap:3px">${statusTag}${_exclTag}</div>` : "";
    const gone = this._mtDelBadge(dueMs, compact, prefix || seasonPrefix, true);
    const goneHtml = gone ? `<div style="position:absolute;top:26px;left:6px;right:6px;z-index:4;display:flex;pointer-events:none">${gone}</div>` : "";
    const canPopup = popup && (tmdb || tvdb);
    const popupAttr = canPopup ? ` data-mt-popup="${isMovie ? "movie" : "tv"}"${tmdb ? ` data-tmdbid="${tmdb}"` : ""}${tvdb ? ` data-tvdbid="${tvdb}"` : ""} data-title="${title}"` : "";
    const titleHtml = pc.title ? `<div style="font-size:10px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:22px">${title}</div>` : "";
    return `<div class="mc"${popupAttr}>
      <div style="position:absolute;inset:0;overflow:hidden">${img}</div>
      ${this._mcGrad("rgba(0,0,0,0.7)", `${ratingHtml}${titleHtml}`)}
      ${topLeft}
      ${topRight}
      ${goneHtml}
      ${overlay}
      ${actions}
      ${statusBar}
    </div>`;
  }
  // Add/Remove-media and Exclude-media sheets, mirroring Maintainerr's dialogs
  _mtOverviewDialogHtml() {
    const ov = this._maintainerrModal?.overview;
    const dlg = ov?.dialog;
    if (!dlg) return "";
    const isExcl = dlg.kind === "exclusion";
    const title = isExcl ? this._t("mtExcludeMedia") : this._t("mtAddRemoveMedia");
    const actions = isExcl ? [["0", this._t("mtAddExclusion")], ["1", this._t("mtRemoveExclusion")]] : [["0", this._t("mtAddToCollection")], ["1", this._t("mtRemoveFromCollection")]];
    const cols = this._mtCollectionsForLib(ov.libId);
    const colItems = [
      ...isExcl ? [["", this._t("mtAllCollections")]] : [],
      ...cols.map((c) => [c.id, this._mtColLabel(c, cols)])
    ];
    const busy = !!dlg.busy;
    const _ICO_OK = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="20 6 9 17 4 12"/></svg>`;
    const _ICO_X = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="display:block"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    const _ICO_SWEEP = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
    const _day = this._isDay;
    const panelBg = _day ? "#f4f4f6" : "#26262b";
    const panelTxt = _day ? "#000" : "#fff";
    const LBL_W = 80, ROW_GAP = 10;
    const lbl = `font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:${_day ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)"};flex-shrink:0;width:${LBL_W}px`;
    return `<div data-mt-ov-dlg-backdrop style="position:absolute;inset:0;z-index:20;background:rgba(0,0,0,0.65);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:16px">
      <div style="background:${panelBg};color:${panelTxt};border:1px solid var(--is-card-bdr);border-radius:20px;padding:18px 20px;width:min(460px,100%);box-shadow:0 12px 40px rgba(0,0,0,0.6)">
        <div style="font-size:14px;font-weight:700;color:${panelTxt};margin-bottom:16px">${title}</div>
        <div style="display:flex;align-items:center;gap:${ROW_GAP}px;margin-bottom:10px">
          <span style="${lbl}">${this._t("mtAction")}</span>
          ${this._mtFieldSelect("mt-ov-dlg-action", actions, String(dlg.action ?? "0"), "flex:1;min-width:0")}
        </div>
        <div style="display:flex;align-items:center;gap:${ROW_GAP}px;margin-bottom:16px">
          <span style="${lbl}">${this._t("mtCollection")}</span>
          ${this._mtFieldSelect("mt-ov-dlg-col", colItems, dlg.collectionId ?? "", "flex:1;min-width:0")}
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          ${!isExcl ? `<button data-mt-ov-dlg-removeall style="${this._mtBtnA("red")}" ${busy ? "disabled" : ""}>${_ICO_SWEEP}${this._t("mtRemoveFromAll")}</button>` : ""}
          <div style="flex:1;min-width:8px"></div>
          ${this._mtRoundBtn("data-mt-ov-dlg-cancel", _ICO_X, this._t("mtCancel"), { size: 34, active: false, disabled: busy })}
          ${this._mtRoundBtn("data-mt-ov-dlg-submit", _ICO_OK, this._t("mtSubmit"), { size: 34, tone: "blue", busy })}
        </div>
      </div>
    </div>`;
  }
  _mtNavHtml(activeTab) {
    const m = this._maintainerrModal;
    const _ico = (d, s = 13) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${d}</svg>`;
    const NAV = [
      { id: "overview", label: this._t("mtOverview"), icon: _ico('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>') },
      { id: "rules", label: this._t("mtRules"), icon: _ico('<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><polyline points="9 13 11 15 15 11"/>') },
      { id: "collections", label: this._t("mtCollections"), icon: _ico('<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/>') },
      { id: "calendar", label: this._t("mtCalendar"), icon: _ico('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>') }
    ];
    const _mob = isMobile();
    const items = NAV.map((g) => {
      const active = activeTab === g.id;
      const btn = `<button class="mt-nav-btn${active ? " is-on" : ""}" data-mt-tab="${g.id}" title="${this._escHtml(g.label)}">${g.icon}${!_mob || active ? g.label : ""}</button>`;
      if (g.id !== "collections") return btn;
      const expanded = active && !!m?.colDetail;
      const colSubTabs = ["media", "exclusions", "info"];
      const colSubLabels = { media: this._t("mtMedia"), exclusions: this._t("mtExclusions"), info: this._t("mtInfo") };
      const colSubIcons = {
        media: _ico('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>', 12),
        exclusions: _ico('<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>', 12),
        info: _ico('<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>', 12)
      };
      const activeColTab = m?.colSubTab || "media";
      const subHtml = expanded ? colSubTabs.map((t) => {
        const on = t === activeColTab;
        return `<button class="mt-nav-sub${on ? " is-on" : ""}" data-mt-col-tab="${t}" title="${this._escHtml(colSubLabels[t])}">${colSubIcons[t]}${_mob ? "" : colSubLabels[t]}</button>`;
      }).join("") : "";
      return btn + `<span data-mt-sub class="mt-nav-sub-wrap${expanded ? " is-open" : ""}"><span class="mt-nav-ind"></span>${subHtml}</span>`;
    }).join("");
    return `<div id="mt-nav" class="mt-nav"><span class="mt-nav-ind"></span>${items}</div>`;
  }
  _mtStatusHtml() {
    const m = this._maintainerrModal;
    if (!m?._statusMsg) return "";
    const rgb = m._statusErr ? "248,113,113" : "52,211,153";
    const spin = m._statusSpin ? '<span class="is-spin" style="margin-right:6px;vertical-align:-1px"></span>' : "";
    const mob = this._isMob;
    const bg = mob ? this._isDay ? "#fafafc" : "#14141a" : `rgba(${rgb},0.12)`;
    const extra = mob ? ";box-shadow:0 4px 16px rgba(0,0,0,0.55);padding:5px 14px;position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:1200" : "";
    const p = m._statusProg;
    let bar = "";
    if (p) {
      const pct = p && typeof p === "object" && p.total > 0 ? Math.max(4, Math.round(p.done / p.total * 100)) : null;
      const fill = pct != null ? `<span style="display:block;height:100%;width:${pct}%;background:rgba(${rgb},0.95);border-radius:2px;transition:width 0.4s ease"></span>` : `<span class="mt-prog-sweep" style="display:block;height:100%;width:40%;background:rgba(${rgb},0.95);border-radius:2px"></span>`;
      bar = `<span style="display:block;height:3px;margin-top:4px;border-radius:2px;overflow:hidden;background:rgba(${rgb},0.22)">${fill}</span>`;
    }
    const body = bar ? `<span style="display:block">${spin}${this._escHtml(m._statusMsg)}</span>${bar}` : `${spin}${this._escHtml(m._statusMsg)}`;
    const shape = bar ? "display:inline-block;min-width:190px" : "";
    return `<span style="font-size:11px;font-weight:600;color:rgba(${rgb},0.9);background:${bg};border:1px solid rgba(${rgb},0.45);border-radius:999px;padding:2px 12px;white-space:nowrap;flex-shrink:0;${shape}${extra}">${body}</span>`;
  }
  // Round action button in the same family as the header's back/close controls.
  // Text moves to `title`, so keep these to actions whose icon is unambiguous
  // within their own view.
  _mtRoundBtn(attr, icon, title, { size = 28, tone = "blue", busy = false, active = true, disabled = false } = {}) {
    const off = busy || disabled;
    const day = this._isDay;
    const TONES = {
      blue: ["0,122,255", "0.50", "0.30", "#0060df"],
      green: ["52,211,153", "0.50", "0.28", "#0b7c4c"],
      red: ["248,113,113", "0.50", "0.28", "#d1373c"]
    };
    const [rgb, bdrA, bgA, solid] = TONES[tone] || TONES.blue;
    const sty = active ? day ? `border:1px solid rgba(${rgb},0.65);background:rgba(${rgb},0.18);color:${solid}` : `border:1px solid rgba(${rgb},${bdrA});background:rgba(${rgb},${bgA});color:#fff` : "border:1px solid var(--is-divider);background:var(--is-btn-bg);color:var(--is-text-muted)";
    return `<button ${attr} title="${this._escHtml(title)}"${off ? " disabled" : ""} style="width:${size}px;height:${size}px;padding:0;border-radius:50%;cursor:${off ? "default" : "pointer"};display:flex;align-items:center;justify-content:center;line-height:0;flex-shrink:0;transition:background 0.15s,color 0.15s;backdrop-filter:blur(8px);${disabled && !busy ? "opacity:0.55;" : ""}${sty}">${busy ? '<span class="is-spin"></span>' : icon}</button>`;
  }
  // Primary action for the current view, parked in the modal header next to
  // back/close. In the rule editor it is Save, which stays muted until an edit
  // is made so "there is something to save" reads at a glance.
  _mtHdrSaveHtml() {
    const m = this._maintainerrModal;
    if (!m) return "";
    const S = 30;
    if (m.editor) {
      const CHECK = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="20 6 9 17 4 12"/></svg>`;
      const dirty = !!m.editor._dirty;
      return this._mtRoundBtn("data-mt-save", CHECK, this._t("mtSave"), { size: S, tone: "blue", active: dirty, disabled: !dirty });
    }
    const PLAY2 = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="display:block"><polygon points="3,4 12,12 3,20"/><polygon points="13,4 22,12 13,20"/></svg>`;
    if (m.tab === "rules") {
      const PLUS = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="display:block"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
      return `<div style="display:flex;gap:6px">
        ${this._mtRoundBtn("data-mt-new", PLUS, this._t("mtNewRule"), { size: S, tone: "blue" })}
        ${this._mtRoundBtn("data-mt-run-all", PLAY2, this._t("mtRunRules"), { size: S, tone: "green" })}
      </div>`;
    }
    if (m.tab === "collections" && !m.colDetail) {
      return this._mtRoundBtn("data-mt-handle-all", PLAY2, this._t("mtHandleAll"), { size: S, tone: "green", busy: !!m.handlingAll });
    }
    return "";
  }
  // Top-right button — back arrow inside editor / collection detail, else close.
  // Both share the popup-close chrome.
  _mtHdrBtnHtml() {
    const m = this._maintainerrModal;
    const isBack = !!(m?.editor || m?.colDetail || m?.cal?.dayModal);
    if (isBack) {
      const backIco = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
      return `<button class="popup-close" id="mt-hdr-back" style="position:relative;top:0;right:0;flex-shrink:0;align-self:center">${backIco}</button>`;
    }
    return `<button class="popup-close" id="mt-close" style="position:relative;top:0;right:0;flex-shrink:0;align-self:center">${ICONS.close}</button>`;
  }
  _mtBtnA(kind) {
    const [bg, bdr, tint] = MT_ACCENTS[kind] || MT_ACCENTS.blue;
    const color = this._isDay ? tint : "#fff";
    return `${MT_BTN};background:${bg};border-color:${bdr};color:${color};font-weight:700`;
  }
  _mtGridCalc(cd, toolbarH = 90) {
    const isMob = this._isMob;
    const m = this._maintainerrModal;
    const vH = window.innerHeight;
    const vW = window.innerWidth;
    const bodyPX = isMob ? 20 : 40;
    const gap = 14;
    const MT_COLS_MIN = isMob ? 2 : 3, MT_COLS_MAX = isMob ? 2 : 12;
    const contentW = m?._gridW || Math.min(1100, vW * 0.96) - bodyPX;
    const availH = m?._gridAvailH || vH * 0.88 - 60 - 24 - toolbarH - 48;
    let cols;
    if (cd._mtCols) {
      cols = cd._mtCols;
    } else {
      const saved = parseInt(localStorage.getItem("arr-mt-cols"));
      if (saved >= 3 && saved <= 12) {
        cols = saved;
      } else {
        const minW = isMob ? 70 : 110;
        const maxC = Math.floor((contentW + gap) / (minW + gap));
        cols = Math.max(isMob ? 3 : 4, Math.min(maxC, 8));
      }
      cd._mtCols = cols;
    }
    cols = Math.max(MT_COLS_MIN, Math.min(MT_COLS_MAX, cols));
    const posterW = (contentW - gap * (cols - 1)) / cols;
    const posterH = posterW * 1.5;
    let rowsFit = Math.max(1, Math.floor((availH + gap + 1) / (posterH + gap)));
    let gridMaxW = null;
    if (isMob && rowsFit < 2) {
      const fitH = (availH - gap) / 2;
      const fitW = fitH / 1.5;
      const wanted = cols * fitW + gap * (cols - 1);
      if (fitW > 40 && wanted <= contentW) {
        gridMaxW = Math.floor(wanted);
        rowsFit = 2;
      }
    }
    const perPage = cols * rowsFit;
    return { cols, perPage, gap, gridMaxW };
  }
  _mtDragHandleHtml(cd, isMob) {
    if (isMob) return "";
    const MT_COLS_MIN = 3, MT_COLS_MAX = 12, TRACK_W = 120, INSET = 7;
    const cur = cd._mtCols || 7;
    const thumbPx = Math.round((cur - MT_COLS_MIN) / (MT_COLS_MAX - MT_COLS_MIN) * (TRACK_W - INSET * 2)) + INSET;
    const day = this._isDay;
    const track = day ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.18)";
    const fill = day ? "rgba(0,0,0,0.42)" : "rgba(255,255,255,0.45)";
    const knob = day ? "#ffffff" : "rgba(255,255,255,0.85)";
    const knobBdr = day ? "border:1px solid rgba(0,0,0,0.30);" : "";
    const shadow = day ? "0 1px 3px rgba(0,0,0,0.30)" : "0 1px 4px rgba(0,0,0,0.4)";
    return `<div id="mt-drag-handle" style="position:absolute;right:0;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:6px;padding:6px 0 6px 8px;touch-action:none;user-select:none;cursor:ew-resize">
      <div id="mt-drag-track" style="position:relative;width:${TRACK_W}px;height:3px;background:${track};border-radius:2px;cursor:ew-resize">
        <div style="position:absolute;top:0;left:0;width:${thumbPx}px;height:100%;background:${fill};border-radius:2px;pointer-events:none"></div>
        <div id="mt-drag-thumb" style="position:absolute;top:50%;left:${thumbPx}px;transform:translateY(-50%);width:15px;height:15px;border-radius:50%;background:${knob};${knobBdr}box-shadow:${shadow};pointer-events:none;margin-left:-7px;box-sizing:border-box"></div>
      </div>
    </div>`;
  }
  // ── Collections tab ───────────────────────────────────────────────────────
  _mtCollectionsTabHtml() {
    const m = this._maintainerrModal;
    if (!m) return "";
    if (m.colDetail) {
      const sub = m.colSubTab || "media";
      if (sub === "exclusions") return this._mtCollectionExclusionsHtml();
      if (sub === "info") return this._mtCollectionInfoHtml();
      return this._mtCollectionDetailHtml();
    }
    const cols = this._maintainerr?.collections || [];
    const rules = this._maintainerr?.rules || [];
    const search = (m.colSearch || "").toLowerCase();
    const filterLib = m.colFilterLib || "all";
    const ruleMap = /* @__PURE__ */ new Map();
    rules.forEach((r) => {
      if (r.collection) ruleMap.set(r.collection.id ?? r.id, r);
    });
    const view = m.colView || "cards";
    const _segIcoC = this._mtSegIcons;
    const viewSeg = this._mtSegmented("data-mt-col-view-seg", [
      { v: "cards", label: this._t("mtViewCards"), icon: _segIcoC.cards },
      { v: "table", label: this._t("mtViewTable"), icon: _segIcoC.table }
    ], view, { icons: true, animatePrev: !!m._animColView });
    let filtered = cols;
    if (search) filtered = filtered.filter((c) => (c.title || c.name || "").toLowerCase().includes(search));
    if (filterLib !== "all") {
      filtered = filtered.filter((c) => {
        const rule = this._mtFindRuleForCol(c, rules);
        return rule && String(rule.libraryId) === filterLib;
      });
    }
    const libs = /* @__PURE__ */ new Map();
    cols.forEach((c) => {
      const rule = this._mtFindRuleForCol(c, rules);
      if (rule?.libraryId != null) libs.set(String(rule.libraryId), this._mtLibName(rule.libraryId));
    });
    const libItems = [["all", this._t("mtAllLibs")], ...libs];
    const toolbar = `<div style="margin-bottom:${this._mtToolbarGap}px">${this._mtToolbar("mt-col-search", m.colSearch, [
      { id: "mt-col-filter-lib", items: libItems, value: filterLib, neutral: "all" }
    ])}</div>`;
    const _day = this._isDay;
    const _labelSt = `font-size:9px;text-transform:uppercase;letter-spacing:0.05em;color:${_day ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)"};margin-bottom:2px`;
    const _txt = _day ? "#000" : "#fff";
    const PAGE = m.colPerPage || 12;
    const total = filtered.length;
    const pages = Math.ceil(total / PAGE) || 1;
    m.colPages = pages;
    const page = Math.min(m.colPage || 0, pages - 1);
    const slice = filtered.slice(page * PAGE, (page + 1) * PAGE);
    const cards = view === "table" ? "" : slice.map((c) => {
      const cnt = c.mediaCount ?? (c.media || []).length;
      const delDays = c.deleteAfterDays != null ? `After ${c.deleteAfterDays}d` : "\u2014";
      const name = c.title || c.name || "\u2014";
      const rule = this._mtFindRuleForCol(c, rules);
      const libName = rule ? this._mtLibName(rule.libraryId) : "\u2014";
      const mediaType = rule ? rule.dataType || "movie" : "\u2014";
      const mediaLabel = { movie: "Movie", show: "Show", season: "Seasons", episode: "Episode" }[mediaType] || mediaType;
      const isActive = rule ? rule.isActive : true;
      const statusLabel = isActive ? this._t("mtActive") : this._t("mtInactive");
      const statusColor = isActive ? this._isDay ? "rgba(5,150,105,0.95)" : "rgba(52,211,153,0.85)" : this._isDay ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.4)";
      const posterUrls = (c.media || []).map((mi) => mi.image_path || mi.plexData?.thumb || "").filter(Boolean).slice(0, 4);
      const mosaic = posterUrls.length ? `<div style="position:absolute;inset:0;display:flex;z-index:0;pointer-events:none">
             ${posterUrls.map((u) => `<div style="flex:1;min-width:0;background:url('${u}') center/cover no-repeat"></div>`).join("")}
           </div>
           <div style="position:absolute;inset:0;z-index:1;pointer-events:none;background:${_day ? "linear-gradient(180deg,rgba(255,255,255,0.84) 0%,rgba(255,255,255,0.92) 100%)" : "linear-gradient(180deg,rgba(20,20,24,0.86) 0%,rgba(16,16,20,0.94) 100%)"}"></div>` : "";
      const _sh = posterUrls.length ? _day ? "text-shadow:0 1px 3px rgba(255,255,255,0.95)" : "text-shadow:0 1px 4px rgba(0,0,0,0.5)" : "";
      const bgStyle = "background:var(--is-btn-bg)";
      const totalSize = c.totalSizeBytes || (c.media || []).reduce((s, mi) => s + (mi.plexData?.size || mi.sizeBytes || mi.size || 0), 0);
      const sizeStr = totalSize > 0 ? this._mtFmtBytes(totalSize) : "N/A";
      return `<div class="mt-col-card" data-mt-col-detail="${c.id}" style="${bgStyle};border:1px solid var(--is-card-bdr);border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;gap:6px;cursor:pointer;min-height:160px;position:relative;overflow:hidden;transition:transform .15s">
        ${mosaic}
        <div style="position:relative;z-index:2;font-size:13px;font-weight:700;color:${_txt};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${_sh}">${this._escHtml(name)}</div>
        <div style="position:relative;z-index:2;margin-top:auto;display:grid;grid-template-columns:1fr auto 1fr;gap:4px 12px;font-size:11px;${_sh}">
          <div><div style="${_labelSt}">LIBRARY</div><div style="color:${_txt};font-weight:600">${this._escHtml(libName)}</div></div>
          <div><div style="${_labelSt}">MEDIA TYPE</div><div style="color:${_txt};font-weight:600">${this._escHtml(mediaLabel)}</div></div>
          <div style="text-align:right"><div style="${_labelSt}">ITEMS</div><div style="color:${_txt};font-weight:600">${cnt}</div></div>
          <div><div style="${_labelSt}">SIZE</div><div style="color:${_txt};font-weight:600">${sizeStr}</div></div>
          <div><div style="${_labelSt}">DELETE</div><div style="color:${_txt};font-weight:600">${delDays}</div></div>
          <div style="text-align:right"><div style="${_labelSt}">STATUS</div><div style="color:${statusColor};font-weight:600">${statusLabel}</div></div>
        </div>
      </div>`;
    }).join("");
    const empty = filtered.length === 0 ? `<div class="u-empty-dim" style="padding:20px 0">${this._t("mtNoCollections")}</div>` : "";
    const body = view === "table" ? this._mtCollectionsTableHtml(slice, rules) : cards ? `<div id="mt-rules-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;align-content:start">${cards}</div>` : "";
    const paging = this._tlMobPag("mt-col-page", page, pages, true);
    const footer = `<div id="mt-rules-foot" style="position:relative;display:flex;align-items:center;justify-content:center;min-height:44px;flex-shrink:0">
      ${paging}
      <div style="position:absolute;left:0;top:50%;transform:translateY(-50%)">${viewSeg}</div>
    </div>`;
    return `<div style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden">
      <div style="flex-shrink:0">${toolbar}</div>
      <div id="mt-rules-wrap" style="flex:1;min-height:0;overflow-y:auto">${body || empty}</div>
      ${footer}
    </div>`;
  }
  // Table counterpart of the collection cards
  _mtCollectionsTableHtml(cols, rules) {
    const isMob = this._isMob;
    const rows = cols.map((c) => {
      const rule = this._mtFindRuleForCol(c, rules);
      const name = c.title || c.name || "\u2014";
      const libName = this._mtLibName(rule?.libraryId ?? c.libraryId);
      const type = rule?.dataType || c.type || "movie";
      const mediaLabel = { movie: "Movie", show: "Show", season: "Seasons", episode: "Episode" }[type] || type;
      const cnt = c.mediaCount ?? (c.media || []).length;
      const size = c.totalSizeBytes ? this._mtFmtBytes(c.totalSizeBytes) : "N/A";
      const active = c.isActive !== false;
      const statusColor = active ? "rgba(52,211,153,0.85)" : "rgba(255,255,255,0.4)";
      const statusLabel = active ? this._t("mtActive") : this._t("mtInactive");
      if (isMob) {
        return `<div data-mt-col-detail="${c.id}" style="display:flex;align-items:center;gap:8px;padding:8px 4px;border-bottom:1px solid var(--is-divider,rgba(255,255,255,0.07));cursor:pointer">
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._escHtml(name)}</div>
            <div style="font-size:10px;color:var(--is-text-muted);margin-top:2px">${this._escHtml(libName)} \xB7 ${cnt} \xB7 <span style="color:${statusColor}">${statusLabel}</span></div>
          </div>
        </div>`;
      }
      return `<tr data-mt-col-detail="${c.id}" style="cursor:pointer">
        <td><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this._escHtml(name)}</div></td>
        <td>${this._escHtml(libName)}</td>
        <td>${this._escHtml(mediaLabel)}</td>
        <td style="text-align:center">${cnt}</td>
        <td style="text-align:right">${size}</td>
        <td style="color:${statusColor}">${statusLabel}</td>
      </tr>`;
    }).join("");
    if (isMob) return `<div>${rows}</div>`;
    const _th = "user-select:none;white-space:nowrap";
    return `<table class="tl-users-table lib-table" style="width:100%;table-layout:fixed">
      <thead><tr>
        <th style="${_th};width:auto">${this._t("mtRuleName")}</th>
        <th style="${_th};width:130px">${this._t("mtLibrary")}</th>
        <th style="${_th};width:100px">${this._t("mtMediaType")}</th>
        <th style="${_th};width:70px;text-align:center">${this._t("mtTotalItems")}</th>
        <th style="${_th};width:90px;text-align:right">${this._t("mtSize")}</th>
        <th style="${_th};width:90px">${this._t("mtStatus")}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }
  _mtFindRuleForCol(col, rules) {
    return rules.find((r) => r.collection?.id === col.id || r.id === col.ruleGroupId || r.id === col.ruleGroup?.id) || null;
  }
  _mtCollectionDetailHtml() {
    const m = this._maintainerrModal;
    const cd = m.colDetail;
    if (!cd) return "";
    const items = cd.items || [];
    const search = (cd.search || "").toLowerCase();
    const page = cd.page || 0;
    const sort = cd.sort || "default";
    let filtered = items;
    if (search) filtered = filtered.filter((i) => (i.mediaData?.title || i.title || i.name || "").toLowerCase().includes(search));
    const isMob = this._isMob;
    const { cols, perPage, gap, gridMaxW } = this._mtGridCalc(cd, 90);
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const safePage = Math.min(page, totalPages - 1);
    const pageItems = filtered.slice(safePage * perPage, (safePage + 1) * perPage);
    const sortItems = [
      ["deleteSoonest-asc", "Going first"],
      ["deleteSoonest-desc", "Going last"],
      ["title-asc", "Title A\u2013Z"],
      ["title-desc", "Title Z\u2013A"],
      ["airDate-desc", "Newest first"],
      ["airDate-asc", "Oldest first"],
      ["rating-desc", "Highest rated"],
      ["rating-asc", "Lowest rated"],
      ["watchCount-desc", "Most watched"],
      ["watchCount-asc", "Least watched"]
    ];
    const delDays = cd.deleteAfterDays;
    const mediaType = cd.mediaType || "movie";
    const header = "";
    const toolbar = `<div style="margin-bottom:${this._mtToolbarGap}px">${this._mtToolbar("mt-col-d-search", cd.search || "", [
      { id: "mt-col-d-sort", items: sortItems, value: sort }
    ])}</div>`;
    const _rnd = (bdr, bg) => `width:34px;height:34px;padding:0;border-radius:50%;border:1px solid ${bdr};background:${bg};color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:0;backdrop-filter:blur(8px)`;
    const EXCL_ICO = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="display:block"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`;
    const CHECK_ICO = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="20 6 9 17 4 12"/></svg>`;
    const CROSS_ICO = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="display:block"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    const posters = pageItems.map((item) => {
      const itemId = item.mediaServerId || item.id || "";
      const excluded = cd.excludedIds?.has?.(String(itemId));
      const confirming = cd.confirmExclude === String(itemId);
      let overlay = "", actions = "";
      if (excluded) {
        overlay = `<div style="position:absolute;inset:0;z-index:5;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center">
          ${this._uiBadge(this._t("mtExcluded"), "green", { extra: "padding:4px 14px;font-size:11px" })}
        </div>`;
      } else if (confirming) {
        overlay = `<div style="position:absolute;inset:0;z-index:5;background:rgba(0,0,0,0.75);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px">
          <span style="font-size:11px;font-weight:600;color:#fff">${this._t("mtExcludeQ")}</span>
          <div style="display:flex;gap:10px">
            <button data-mt-exclude-confirm="${itemId}" title="${this._t("mtYes")}" style="${_rnd("rgba(52,211,153,0.55)", "rgba(52,211,153,0.32)")}">${CHECK_ICO}</button>
            <button data-mt-exclude-cancel="${itemId}" title="${this._t("mtNo")}" style="${_rnd("rgba(248,113,113,0.55)", "rgba(248,113,113,0.32)")}">${CROSS_ICO}</button>
          </div>
        </div>`;
      } else {
        actions = `<div style="position:absolute;bottom:8px;right:8px;z-index:5">
          <button data-mt-exclude="${itemId}" title="${this._t("mtExcludeMedia")}" style="${_rnd("rgba(52,211,153,0.50)", "rgba(52,211,153,0.28)")}">${EXCL_ICO}</button>
        </div>`;
      }
      return this._mtOvPosterCard(item, {
        compact: cols >= 8,
        dueMs: this._mtDueMs(item.addDate, delDays),
        type: mediaType,
        fallbackPoster: item.image_path || item.plexData?.thumb || "",
        excluded,
        overlay,
        actions,
        popup: !confirming && !excluded
      });
    }).join("");
    const grid = `<div id="mt-poster-grid" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:${gap}px;overflow:hidden${gridMaxW ? `;max-width:${gridMaxW}px;margin:0 auto` : ""}">${posters}</div>`;
    const pagHtml = this._tlMobPag("mt-col-d-page", safePage, totalPages, true);
    const dragHandle = this._mtDragHandleHtml(cd, isMob);
    const pagWrap = pagHtml || dragHandle ? `<div id="mt-pag-wrap" style="flex-shrink:0;position:relative;${dragHandle && !pagHtml ? "height:36px" : ""}">${pagHtml}${dragHandle}</div>` : "";
    return `<div style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden"><div style="flex-shrink:0">${header}${toolbar}</div><div style="flex:1;min-height:0;overflow:hidden">${grid}</div>` + pagWrap + `</div>`;
  }
  // ── Collection sub-tabs: Exclusions + Info ─────────────────────────────────
  _mtCollectionExclusionsHtml() {
    const m = this._maintainerrModal;
    const cd = m?.colDetail;
    if (!cd) return "";
    const excl = cd.exclusionItems || [];
    const exclSort = cd.exclSort || "excluded-desc";
    const sortItems = [
      ["excluded-desc", "Recently excluded"],
      ["title-asc", "Title A\u2013Z"],
      ["title-desc", "Title Z\u2013A"],
      ["airDate-desc", "Newest first"],
      ["airDate-asc", "Oldest first"],
      ["rating-desc", "Highest rated"],
      ["rating-asc", "Lowest rated"],
      ["watchCount-desc", "Most watched"],
      ["watchCount-asc", "Least watched"]
    ];
    const exclSearch = cd.exclSearch || "";
    const toolbar = `<div style="margin-bottom:${this._mtToolbarGap}px">${this._mtToolbar("mt-col-excl-search", exclSearch, [
      { id: "mt-col-excl-sort", items: sortItems, value: exclSort }
    ])}</div>`;
    const isMob = this._isMob;
    let filteredExcl = excl;
    if (exclSearch) filteredExcl = filteredExcl.filter((i) => (i.title || i.name || "").toLowerCase().includes(exclSearch.toLowerCase()));
    if (!filteredExcl.length) return `${toolbar}<div class="u-empty-dim">${this._t("mtNoExclusions")}</div>`;
    const mediaType = cd.mediaType || "movie";
    const { cols, perPage, gap, gridMaxW } = this._mtGridCalc(cd, 48);
    const exclPage = cd.exclPage || 0;
    const totalPages = Math.max(1, Math.ceil(filteredExcl.length / perPage));
    const safePage = Math.min(exclPage, totalPages - 1);
    const pageItems = filteredExcl.slice(safePage * perPage, (safePage + 1) * perPage);
    const _rnd = (bdr, bg) => `width:34px;height:34px;padding:0;border-radius:50%;border:1px solid ${bdr};background:${bg};color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:0;backdrop-filter:blur(8px)`;
    const UNDO_ICO = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-4"/></svg>`;
    const posters = pageItems.map((item) => {
      const exclId = item.id;
      const actions = `<div style="position:absolute;bottom:8px;right:8px;z-index:5">
        <button data-mt-unexclude="${exclId}" title="${this._t("mtRemoveExclusion")}" style="${_rnd("rgba(248,113,113,0.50)", "rgba(248,113,113,0.28)")}">${UNDO_ICO}</button>
      </div>`;
      return this._mtOvPosterCard(item, {
        compact: cols >= 8,
        dueMs: null,
        type: item.type || mediaType,
        fallbackPoster: item.image_path || "",
        excluded: true,
        actions
      });
    }).join("");
    const grid = `<div id="mt-poster-grid" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:${gap}px;overflow:hidden${gridMaxW ? `;max-width:${gridMaxW}px;margin:0 auto` : ""}">${posters}</div>`;
    const pagHtml = this._tlMobPag("mt-col-excl-page", safePage, totalPages, true);
    const dragHandle = this._mtDragHandleHtml(cd, isMob);
    const pagWrap = pagHtml || dragHandle ? `<div id="mt-pag-wrap" style="flex-shrink:0;position:relative;${dragHandle && !pagHtml ? "height:36px" : ""}">${pagHtml}${dragHandle}</div>` : "";
    return `<div style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden"><div style="flex-shrink:0">${toolbar}</div><div style="flex:1;min-height:0;overflow:hidden">${grid}</div>` + pagWrap + `</div>`;
  }
  _mtCollectionInfoHtml() {
    const m = this._maintainerrModal;
    const cd = m?.colDetail;
    if (!cd) return "";
    const col = (this._maintainerr?.collections || []).find((c) => c.id === cd.id);
    const lg = cd.logs || {};
    const _stat = (label, val) => `<div>
      <div style="font-size:12px;font-weight:700;color:var(--is-text);margin-bottom:3px">${label}</div>
      <div style="font-size:12px;color:var(--is-text-muted)">${val}</div>
    </div>`;
    const added = col?.addDate ? new Date(col.addDate).toLocaleDateString() : "\u2014";
    const dur = col?.lastDurationInSeconds != null ? `${col.lastDurationInSeconds} ${this._t("mtSeconds")}` : "\u2014";
    const stats = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
      ${_stat(this._t("mtDateAdded"), added)}
      ${_stat(this._t("mtHandledItems"), col?.handledMediaAmount ?? 0)}
      ${_stat(this._t("mtLastDuration"), dur)}
    </div>`;
    const sortItems = [["DESC", this._t("mtDescending")], ["ASC", this._t("mtAscending")]];
    const filterItems = [["", this._t("mtAllTypes")], ["0", "Collection"], ["1", "Media"], ["2", "Rules"]];
    const toolbar = `<div style="margin-bottom:10px">${this._mtToolbar("mt-log-search", lg.search || "", [
      { id: "mt-log-sort", items: sortItems, value: lg.sort || "DESC" },
      { id: "mt-log-filter", items: filterItems, value: String(lg.filter ?? ""), neutral: "" }
    ])}</div>`;
    let body;
    if (lg.loading) {
      body = `<div class="is-loading"><span>${this._t("loading")}</span></div>`;
    } else if (!(lg.items || []).length) {
      body = `<div class="u-empty-dim" style="padding:20px 0">${this._t("mtNoLogs")}</div>`;
    } else {
      const TYPE_TONE = { 0: "blue", 1: "amber", 2: "green" };
      const TYPE_LBL = { 0: "COLLECTION", 1: "MEDIA", 2: "RULES" };
      const _badge = (t) => this._uiBadge(TYPE_LBL[t] || "\u2014", TYPE_TONE[t] || "blue", { extra: "letter-spacing:0.03em" });
      const _when = (it) => {
        const ts = new Date(it.timestamp);
        return `${ts.toLocaleDateString()}, ${ts.toLocaleTimeString()}`;
      };
      if (this._isMob) {
        body = `<div class="mt-log-list">${lg.items.map((it) => `
          <div class="mt-log-row">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
              ${_badge(it.type)}
              <span style="font-size:10px;color:var(--is-text-muted);white-space:nowrap">${this._escHtml(_when(it))}</span>
            </div>
            <div style="font-size:11px;color:var(--is-text);line-height:1.35">${this._escHtml(it.message || "")}</div>
          </div>`).join("")}</div>`;
      } else {
        const rows = lg.items.map((it) => `<tr>
          <td style="white-space:nowrap">${this._escHtml(_when(it))}</td>
          <td>${_badge(it.type)}</td>
          <td><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this._escHtml(it.message || "")}</div></td>
        </tr>`).join("");
        const _th = "user-select:none;white-space:nowrap";
        body = `<table class="tl-users-table lib-table" style="width:100%;table-layout:fixed">
          <thead><tr>
            <th style="${_th};width:180px">${this._t("mtDate")}</th>
            <th style="${_th};width:110px">${this._t("mtLabel")}</th>
            <th style="${_th};width:auto">${this._t("mtEvent")}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
      }
    }
    const PAGE = lg.perPage || 25;
    const totalPages = Math.max(1, Math.ceil((lg.total || 0) / PAGE));
    const pag = this._tlMobPag("mt-log-page", lg.page || 0, totalPages, true);
    return `<div style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden">
      <div style="flex-shrink:0">
        ${stats}
        <div style="font-size:13px;font-weight:700;color:var(--is-text);margin-bottom:8px">${this._t("mtLogs")}</div>
        ${toolbar}
      </div>
      <div id="mt-log-wrap" style="flex:1;min-height:0;overflow:hidden">${body}</div>
      ${pag ? `<div id="mt-log-pag" style="flex-shrink:0">${pag}</div>` : ""}
    </div>`;
  }
  // ── Calendar tab ──────────────────────────────────────────────────────────
  // Week grid in the card's own calendar style, showing what each rule will
  // delete and when. Days with more than MT_CAL_MAX entries collapse the
  // remainder behind a round "…" that opens the full list.
  // Week and month views over the same scheduled-deletion data. Week shows the
  // usual poster cards; month only has room for the count and the overflow
  // button, so it drops the posters.
  _mtCalendarTabHtml() {
    const m = this._maintainerrModal;
    if (!m) return "";
    const cal = m.cal || (m.cal = { weekOffset: 0, monthOffset: 0, view: "week", dayModal: null });
    const calMob = window.matchMedia("(max-width:700px)").matches;
    if (calMob && cal.view === "month") cal.view = "week";
    const isMonth = cal.view === "month";
    const MT_CAL_MAX = 5;
    const _ico = this._mtSegIcons;
    const viewSel = calMob ? "" : this._mtSegmented("data-mt-cal-seg", [
      { v: "week", label: this._t("mtWeek"), icon: _ico.week },
      { v: "month", label: this._t("mtMonth"), icon: _ico.month }
    ], cal.view === "month" ? "month" : "week", { icons: true, animatePrev: !!cal._animSeg });
    if (!this._mtDelItems) {
      return `<div class="is-loading"><span>${this._t("loading")}</span></div>`;
    }
    if (cal.dayModal) return this._mtCalDayModalHtml();
    const localDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const todayStr = localDateStr(/* @__PURE__ */ new Date());
    const byDay = {};
    for (const it of this._mtDelItems) {
      const d = new Date(it.due);
      const key = localDateStr(d.getTime() < Date.now() ? /* @__PURE__ */ new Date() : d);
      it._overdue = key === todayStr && localDateStr(d) !== todayStr;
      (byDay[key] || (byDay[key] = [])).push(it);
    }
    const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const DOTS = `<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" style="display:block"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`;
    const _countBadge = (n, block = true) => this._uiBadge(`${n} ${this._t("mtScheduled")}`, "blue", { extra: `display:${block ? "flex" : "inline-flex"};justify-content:center;letter-spacing:0.03em;min-width:0;overflow:hidden;text-overflow:ellipsis` });
    const _dotsBg = this._isDay ? "rgba(0,122,255,0.85)" : "rgba(0,122,255,0.30)";
    const _dotsBdr = this._isDay ? "rgba(0,122,255,0.95)" : "rgba(0,122,255,0.50)";
    const _dotsBtn = (dateStr, n, size = 34) => `<button data-mt-cal-day="${dateStr}" title="${n} ${this._t("mtItems")}" style="width:${size}px;height:${size}px;padding:0;border-radius:50%;border:1px solid ${_dotsBdr};background:${_dotsBg};color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:0;flex-shrink:0;backdrop-filter:blur(8px)">${DOTS}</button>`;
    let gridHtml, rangeLabel;
    if (isMonth) {
      const base = /* @__PURE__ */ new Date();
      base.setDate(1);
      base.setMonth(base.getMonth() + (cal.monthOffset || 0));
      base.setHours(0, 0, 0, 0);
      const month = base.getMonth();
      const first = new Date(base);
      first.setDate(1 - (base.getDay() + 6) % 7);
      const weeks = Math.ceil(((base.getDay() + 6) % 7 + new Date(base.getFullYear(), month + 1, 0).getDate()) / 7);
      const cells = Array.from({ length: weeks * 7 }, (_, i) => {
        const d = new Date(first);
        d.setDate(first.getDate() + i);
        const dateStr = localDateStr(d);
        const items = byDay[dateStr] || [];
        const outside = d.getMonth() !== month;
        const open = items.length ? ` data-mt-cal-day="${dateStr}"` : "";
        return `<div class="cal-day-col${dateStr === todayStr ? " cal-day-today" : ""}" style="${outside ? "opacity:0.35;" : ""}min-height:0">
          <div class="cal-day-hdr" style="padding:5px 4px 4px">
            <span class="cal-day-num${dateStr === todayStr ? " cal-day-num-today" : ""}" style="font-size:13px">${d.getDate()}</span>
          </div>
          <div${open} style="flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:6px;overflow:hidden;${open ? "cursor:pointer" : ""}">
            ${items.length ? _countBadge(items.length, false) : ""}
          </div>
        </div>`;
      }).join("");
      const dayHdr = DAY_NAMES.map((n) => `<div class="cal-day-name" style="text-align:center;padding:2px 0">${n}</div>`).join("");
      gridHtml = `<div style="display:flex;flex-direction:column;gap:6px;flex:1;min-height:0">
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;flex-shrink:0">${dayHdr}</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(${weeks},1fr);gap:6px;flex:1;min-height:0">${cells}</div>
      </div>`;
      rangeLabel = base.toLocaleDateString(void 0, { month: "long", year: "numeric" });
    } else {
      const { start } = this._calWeekRange(cal.weekOffset || 0);
      const cols = DAY_NAMES.map((name, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = localDateStr(d);
        const isToday = dateStr === todayStr;
        const items = (byDay[dateStr] || []).sort((a, b) => a.title.localeCompare(b.title));
        const shown = items.slice(0, MT_CAL_MAX);
        const chips = shown.map((it) => this._mtOvPosterCard(it.raw, {
          compact: true,
          dueMs: null,
          type: it.mediaType,
          fallbackPoster: it.raw?.image_path || "",
          // Overdue titles sit on today's column; say so, or they read as due
          // today and the delay goes unnoticed.
          topBadge: (it._overdue ? `<span class="badge b-missing">${this._escHtml(this._t("mtOverdue"))}</span>` : "") + (it.seasonIndex != null ? `<span class="badge b-ep">S${String(it.seasonIndex).padStart(2, "0")}</span>` : "")
        })).join("");
        const more = items.length > MT_CAL_MAX ? `<div style="display:flex;justify-content:center;padding-top:2px">${_dotsBtn(dateStr, items.length)}</div>` : "";
        return `<div class="cal-day-col${isToday ? " cal-day-today" : ""}${items.length === 0 ? " cal-day-empty" : ""}">
          <div class="cal-day-hdr">
            <span class="cal-day-name">${name}</span>
            <span class="cal-day-num${isToday ? " cal-day-num-today" : ""}">${d.getDate()}</span>
          </div>
          <div class="cal-day-body">${chips}${more}</div>
        </div>`;
      }).join("");
      const endD = new Date(start);
      endD.setDate(start.getDate() + 6);
      gridHtml = `<div class="cal-modal-grid" style="padding:0">${cols}</div>`;
      rangeLabel = `${start.toLocaleDateString(void 0, { day: "numeric", month: "short" })} \u2013 ${endD.toLocaleDateString(void 0, { day: "numeric", month: "short", year: "numeric" })}`;
    }
    const chevL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>`;
    const chevR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>`;
    const chevLL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="16" height="16"><polyline points="18 18 12 12 18 6"/><polyline points="12 18 6 12 12 6"/></svg>`;
    const chevRR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="16" height="16"><polyline points="6 18 12 12 6 6"/><polyline points="12 18 18 12 12 6"/></svg>`;
    const btnSty = "display:inline-flex;align-items:center;gap:4px;padding:5px 10px";
    const atNow = isMonth ? (cal.monthOffset || 0) === 0 : (cal.weekOffset || 0) === 0;
    const footer = `<div style="position:relative;display:flex;align-items:center;justify-content:center;gap:6px;flex-shrink:0;margin-top:10px">
      ${!isMonth ? `<button class="tl-page-btn tl-icon-btn" data-mt-cal-nav="prev-month" style="${btnSty}">${chevLL}</button>` : ""}
      <button class="tl-page-btn tl-icon-btn" data-mt-cal-nav="prev" style="${btnSty}">${chevL}</button>
      <button class="tl-page-btn tl-pill-btn${atNow ? " is-here" : ""}" data-mt-cal-nav="today"${atNow ? " disabled" : ""}>${isMonth ? this._t("mtThisMonth") : this._t("mtThisWeek")}</button>
      <button class="tl-page-btn tl-icon-btn" data-mt-cal-nav="next" style="${btnSty}">${chevR}</button>
      ${!isMonth ? `<button class="tl-page-btn tl-icon-btn" data-mt-cal-nav="next-month" style="${btnSty}">${chevRR}</button>` : ""}
      ${viewSel ? `<div style="position:absolute;left:0;top:50%;transform:translateY(-50%)">${viewSel}</div>` : ""}
    </div>`;
    return `<div style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;position:relative">
      <div style="flex-shrink:0;margin-bottom:8px">
        <span style="font-size:12px;font-weight:700;color:var(--is-text)">${this._escHtml(rangeLabel)}</span>
      </div>
      ${gridHtml}
      ${footer}
    </div>`;
  }
  // Full list for one day. Rendered as an overlay over the calendar rather than
  // a dialog, so going back is a chevron rather than a Close button.
  _mtCalDayModalHtml() {
    const cal = this._maintainerrModal?.cal;
    const dateStr = cal?.dayModal;
    if (!dateStr) return "";
    const localDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const all = (this._mtDelItems || []).filter((it) => localDateStr(new Date(it.due)) === dateStr).sort((a, b) => a.title.localeCompare(b.title));
    const PAGE = 12;
    const totalPages = Math.max(1, Math.ceil(all.length / PAGE));
    cal.dayPages = totalPages;
    const page = Math.min(cal.dayPage || 0, totalPages - 1);
    const items = all.slice(page * PAGE, (page + 1) * PAGE);
    const rows = items.map((it) => `<tr data-mt-cal-item="${this._mtDelItems.indexOf(it)}" style="cursor:pointer">
      <td><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this._escHtml(it.title)}</div></td>
      <td style="white-space:nowrap;color:var(--is-text-muted)">${new Date(it.addDate).toLocaleDateString()}</td>
      <td><span data-mt-cal-col="${it.colId}" style="color:rgba(245,158,11,0.95);cursor:pointer;text-decoration:underline">${this._escHtml(it.colTitle)}</span></td>
      <td style="white-space:nowrap;color:var(--is-text-muted)">${this._escHtml(it.typeLabel)}</td>
    </tr>`).join("");
    const _th = "user-select:none;white-space:nowrap";
    const day = new Date(dateStr).toLocaleDateString(void 0, { day: "numeric", month: "long", year: "numeric" });
    return `<div style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden">
      <div style="flex-shrink:0;margin-bottom:12px">
        <div style="font-size:14px;font-weight:700;color:var(--is-text)">${all.length} ${this._t("mtScheduled")}</div>
        <div style="font-size:11px;color:var(--is-text-muted)">${this._escHtml(day)}</div>
      </div>
      <div style="flex:1;min-height:0;overflow:hidden">
        <table class="tl-users-table lib-table" style="width:100%;table-layout:fixed">
          <thead><tr>
            <th style="${_th};width:auto">${this._t("mtMedia")}</th>
            <th style="${_th};width:110px">${this._t("mtAddedOn")}</th>
            <th style="${_th};width:200px">${this._t("mtCollection")}</th>
            <th style="${_th};width:90px">${this._t("mtType")}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${this._tlMobPag("mt-cal-day-page", page, totalPages, true)}
    </div>`;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Rule editor (inline, replaces body content)
  // ──────────────────────────────────────────────────────────────────────────
  _mtRuleEditorHtml() {
    const m = this._maintainerrModal;
    if (!m) return "";
    const ed = m.editor || {};
    const isNew = !ed.id;
    const consts = this._maintainerrConstants || {};
    const libs = this._maintainerrLibraries || [];
    const arrSrv = this._maintainerrArrServers || {};
    const inpSty = "width:100%";
    const libItems = [["", "\u2014"], ...libs.map((l) => [l.id, l.title || l.name || "\u2014"])];
    const mediaTypes = ["movie", "show", "season", "episode"];
    const mtItems = mediaTypes.map((t) => [t, t.charAt(0).toUpperCase() + t.slice(1)]);
    const arrActionMap = ed.mediaType === "movie" ? { 0: "Unmonitor + Delete", 1: "Delete", 2: "Unmonitor" } : { 0: "Unmonitor + Delete season", 1: "Delete season", 2: "Unmonitor season", 3: "Delete show", 4: "Unmonitor show", 5: "Unmonitor + Delete show" };
    const arrActionItems = Object.entries(arrActionMap);
    const radarrSrvs = arrSrv.radarr || [];
    const sonarrSrvs = arrSrv.sonarr || [];
    const srvList = ed.mediaType === "movie" ? radarrSrvs : sonarrSrvs;
    const arrSrvItems = [["", "\u2014"], ...srvList.map((s) => [s.id, s.name || s.serverName || `Server ${s.id}`])];
    const sections = ed.sections || [];
    const sectionsHtml = sections.map((sec, si) => this._mtEditorSectionHtml(sec, si, consts, ed)).join("");
    const openSec = m.editorSection === void 0 ? "general" : m.editorSection;
    const generalBody = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <label style="font-size:10px;color:var(--is-text-muted);display:block;margin-bottom:3px">${this._t("mtRuleName")}</label>
          <input id="mt-ed-name" type="text" value="${this._escHtml(ed.name || "")}" class="mt-field" style="${inpSty}">
        </div>
        <div>
          <label style="font-size:10px;color:var(--is-text-muted);display:block;margin-bottom:3px">${this._t("mtDescription")}</label>
          <input id="mt-ed-desc" type="text" value="${this._escHtml(ed.description || "")}" class="mt-field" style="${inpSty}">
        </div>
        <div>
          <label style="font-size:10px;color:var(--is-text-muted);display:block;margin-bottom:3px">${this._t("mtLibrary")}</label>
          ${this._mtFieldSelect("mt-ed-lib", libItems, ed.libraryId ?? "", inpSty)}
        </div>
        <div>
          <label style="font-size:10px;color:var(--is-text-muted);display:block;margin-bottom:3px">${this._t("mtMediaType")}</label>
          ${this._mtFieldSelect("mt-ed-media", mtItems, ed.mediaType ?? "", inpSty)}
        </div>
        <div>
          <label style="font-size:10px;color:var(--is-text-muted);display:block;margin-bottom:3px">${this._t("mtArrServer")}</label>
          ${this._mtFieldSelect("mt-ed-arr-srv", arrSrvItems, ed.arrServerId ?? "", inpSty)}
        </div>
        <div>
          <label style="font-size:10px;color:var(--is-text-muted);display:block;margin-bottom:3px">${this._t("mtArrAction")}</label>
          ${this._mtFieldSelect("mt-ed-arr-action", arrActionItems, ed.arrAction ?? "0", inpSty)}
        </div>
        <div>
          <label style="font-size:10px;color:var(--is-text-muted);display:block;margin-bottom:3px">${this._t("mtDeleteAfterDays")}</label>
          <input id="mt-ed-del-days" type="number" min="0" value="${ed.deleteAfterDays ?? 30}" class="mt-field" style="${inpSty}">
        </div>
      </div>`;
    const rulesBody = ed.useRules !== false ? sectionsHtml || `<div class="u-empty-dim">${this._t("mtNoConditions")}</div>` : `<div class="u-empty-dim">${this._t("mtUseRulesOff")}</div>`;
    const addSecBtn = ed.useRules !== false ? `<button data-mt-add-section style="${MT_BTN};height:28px;font-size:11px">+ ${this._t("mtAddSection")}</button>` : "";
    const _cbx = (id, checked, label) => `<label class="mt-chk">
      <input type="checkbox" id="${id}" ${checked ? "checked" : ""}>
      <span class="mt-chk-box">${_ICO_CHECK}</span>
      <span class="mt-chk-lbl">${label}</span>
    </label>`;
    const colSortItems = [
      ["", this._t("mtSortDisabled")],
      ["title.asc", "Title (A-Z)"],
      ["title.desc", "Title (Z-A)"],
      ["airDate.desc", "Release date (newest)"],
      ["airDate.asc", "Release date (oldest)"],
      ["rating.desc", "Rating (highest)"],
      ["rating.asc", "Rating (lowest)"],
      ["watchCount.desc", "Most watched"],
      ["watchCount.asc", "Least watched"],
      ["deleteSoonest.asc", "Delete soonest"],
      ["deleteSoonest.desc", "Delete latest"]
    ];
    const optionsBody = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${_cbx("mt-ed-active", ed.isActive, this._t("mtActive"))}
        ${_cbx("mt-ed-use-rules", ed.useRules !== false, this._t("mtUseRules"))}
        ${_cbx("mt-ed-vis-recommended", ed.visibleOnRecommended, this._t("mtVisRecommended"))}
        ${_cbx("mt-ed-vis-home", ed.visibleOnHome, this._t("mtVisHome"))}
        ${_cbx("mt-ed-force-seerr", ed.forceSeerr, this._t("mtForceSeerr"))}
        ${_cbx("mt-ed-list-exclusions", ed.listExclusions, this._t("mtListExclusions"))}
        ${_cbx("mt-ed-manual-col", ed.manualCollection, this._t("mtCustomCollection"))}
        ${_cbx("mt-ed-tag-arr", ed.tagInArr, this._t("mtTagInArr"))}
        <div>
          <label style="font-size:10px;color:var(--is-text-muted);display:block;margin-bottom:3px">${this._t("mtCustomCollectionName")}</label>
          <input id="mt-ed-manual-col-name" type="text" value="${this._escHtml(ed.manualCollectionName || "")}" placeholder="\u2014" class="mt-field" style="${inpSty}">
        </div>
        <div>
          <label style="font-size:10px;color:var(--is-text-muted);display:block;margin-bottom:3px">${this._t("mtCollectionSort")}</label>
          ${this._mtFieldSelect("mt-ed-col-sort", colSortItems, ed.mediaServerSort || "", inpSty)}
        </div>
        <div>
          <label style="font-size:10px;color:var(--is-text-muted);display:block;margin-bottom:3px">${this._t("mtKeepLogs")}</label>
          <input id="mt-ed-keep-logs" type="number" min="0" value="${ed.keepLogsForMonths ?? 6}" class="mt-field" style="${inpSty}">
        </div>
        <div>
          <label style="font-size:10px;color:var(--is-text-muted);display:block;margin-bottom:3px">${this._t("mtSortTitle")}</label>
          <input id="mt-ed-sort-title" type="text" value="${this._escHtml(ed.sortTitle || "")}" placeholder="e.g. 001 My Coll" class="mt-field" style="${inpSty}">
        </div>
        <div>
          <label style="font-size:10px;color:var(--is-text-muted);display:block;margin-bottom:3px">${this._t("mtTautulliOverride")}</label>
          <input id="mt-ed-tautulli-pct" type="number" min="0" max="100" value="${ed.tautulliWatchedPercentOverride ?? ""}" placeholder="\u2014" class="mt-field" style="${inpSty}">
        </div>
        <div>
          <label style="font-size:10px;color:var(--is-text-muted);display:block;margin-bottom:3px">${this._t("mtCronOverride")}</label>
          <input id="mt-ed-cron" type="text" value="${this._escHtml(ed.ruleHandlerCronSchedule || "")}" placeholder="\u2014" class="mt-field" style="${inpSty}">
        </div>
      </div>`;
    const secs = [
      ["general", this._t("mtSecGeneral"), generalBody],
      ["rules", this._t("mtSecRules"), rulesBody],
      ["options", this._t("mtSecOptions"), optionsBody]
    ];
    const trailing = {
      rules: openSec === "rules" ? addSecBtn : ""
    };
    return `<div style="display:flex;flex-direction:column;gap:10px">
      ${secs.map(
      ([key, label, bodyHtml]) => this._mtEdSectionShell(key, label, bodyHtml, openSec === key, trailing[key] || "")
    ).join("")}
    </div>`;
  }
  // Accordion shell — deliberately transparent. The section bodies already
  // bring their own cards, so a wrapper panel here would be a fourth nested
  // background. Only the chevron gets a surface, as the thing you click, and
  // it turns accent-blue to mark the one open section.
  _mtEdSectionShell(key, label, bodyHtml, open, trailing = "") {
    const chev = open ? `<polyline points="18 15 12 9 6 15"/>` : `<polyline points="6 9 12 15 18 9"/>`;
    const _day = this._isDay;
    const chipSty = open ? _day ? "background:rgba(0,0,0,0.10);border:1px solid rgba(0,0,0,0.22);color:#000" : "background:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.30);color:#fff" : "background:var(--is-btn-bg);border:1px solid var(--is-divider);color:var(--is-text-muted)";
    return `<div>
      <div data-mt-ed-sec="${key}" style="display:flex;align-items:center;gap:10px;padding:4px 2px;cursor:pointer;user-select:none">
        <span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;flex-shrink:0;transition:background 0.15s;${chipSty}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${chev}</svg>
        </span>
        <span style="font-size:13px;font-weight:700;color:${open ? "var(--is-text)" : "var(--is-text-muted)"}">${label}</span>
        <div style="flex:1"></div>
        ${trailing}
      </div>
      ${open ? `<div style="padding-top:8px;padding-left:${isMobile() ? 0 : 44}px">${bodyHtml}</div>` : ""}
    </div>`;
  }
  // Only the configured media server's app is offered — Maintainerr ships constants
  // for Plex, Jellyfin and Emby regardless of which one is actually set up.
  _mtVisibleApps(consts) {
    const apps = Array.isArray(consts.applications) ? consts.applications : [];
    const MEDIA_SERVER_IDS = [0, 6, 7];
    const s = this._maintainerr?.settings || {};
    const type = String(s.mediaServerType ?? s.media_server_type ?? "").toLowerCase();
    let keepId = 0;
    if (type.includes("jellyfin") || s.jellyfin_url || s.jellyfin_api_key) keepId = 6;
    else if (type.includes("emby")) keepId = 7;
    return apps.filter((a) => !MEDIA_SERVER_IDS.includes(a.id) || a.id === keepId);
  }
  _mtEditorSectionHtml(sec, si, consts, ed) {
    const rules = sec.rules || [];
    const operator = sec.operator ?? 0;
    const opLabel = operator === 1 ? "OR" : "AND";
    const ACTION_LABELS = {
      0: "Bigger",
      1: "Smaller",
      2: "Equals",
      3: "Not equals",
      4: "Contains",
      5: "Before",
      6: "After",
      7: "In last (days)",
      8: "In next (days)",
      9: "Contains partial",
      10: "Not contains",
      11: "Not contains partial",
      12: "Contains every",
      13: "Does not contain every",
      14: "Is empty",
      15: "Is not empty",
      16: "In last (hours)",
      17: "In next (hours)",
      18: "Between",
      19: "Not between"
    };
    const apps = this._mtVisibleApps(consts);
    const _sel = "width:100%";
    const _lbl = "font-size:10px;font-weight:600;color:var(--is-text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.04em";
    const _buildCombinedOpts = (selApp, selProp, placeholder = "Select\u2026") => {
      let opts = `<option value="">${placeholder}</option>`;
      for (const a of apps) {
        const props = a.props || [];
        if (!props.length) continue;
        opts += `<optgroup label="${this._escHtml(a.name)}">`;
        for (const p of props) {
          const val = `${a.id}-${p.id}`;
          const sel = selApp !== "" && String(a.id) === String(selApp) && String(p.id) === String(selProp) ? " selected" : "";
          opts += `<option value="${val}"${sel}>${this._escHtml(a.name)} - ${this._escHtml(p.humanName || p.name)}</option>`;
        }
        opts += `</optgroup>`;
      }
      return opts;
    };
    const _propLabel = (selApp, selProp) => {
      if (selApp === "" || selApp == null) return "";
      const a = apps.find((x) => String(x.id) === String(selApp));
      const p = (a?.props || []).find((x) => String(x.id) === String(selProp));
      return a && p ? `${a.name} - ${p.humanName || p.name}` : "";
    };
    const CUSTOM_TYPES = [[0, "Number"], [1, "Date"], [2, "Text"], [3, "Boolean"]];
    const _buildSecondOpts = (selApp, selProp, cvType) => {
      const custom = CUSTOM_TYPES.map(
        ([id, label]) => `<option value="custom-${id}"${cvType === id ? " selected" : ""}>${label}</option>`
      ).join("");
      const appOpts = _buildCombinedOpts(
        cvType != null ? "" : selApp,
        cvType != null ? "" : selProp,
        "Select Second Value\u2026"
      );
      const head = appOpts.slice(0, appOpts.indexOf("</option>") + 9);
      const rest = appOpts.slice(head.length);
      return `${head}<optgroup label="Custom values">${custom}</optgroup>${rest}`;
    };
    const rulesHtml = rules.map((r, ri) => {
      const firstApp = r.firstVal?.[0] ?? "";
      const firstProp = r.firstVal?.[1] ?? "";
      const action = r.action ?? "";
      const lastVal = r.lastVal;
      const customVal = r.customVal;
      const ruleOp = r.operator ?? 0;
      const selectedApp = apps.find((a) => a.id == firstApp);
      const selectedProp = (selectedApp?.props || []).find((p) => p.id == firstProp);
      const possibilities = selectedProp?.type?.possibilities || Object.keys(ACTION_LABELS).map(Number);
      const actionOpts = `<option value="">Select Action\u2026</option>` + possibilities.map(
        (aId) => `<option value="${aId}"${action !== "" && aId == action ? " selected" : ""}>${ACTION_LABELS[aId] || `Action ${aId}`}</option>`
      ).join("");
      const hasLastVal = Array.isArray(lastVal) && lastVal.length === 2 && (lastVal[0] !== "" || lastVal[1] !== "");
      const lastApp = hasLastVal ? lastVal[0] : "";
      const lastProp = hasLastVal ? lastVal[1] : "";
      const cvType = hasLastVal ? null : r.customValType ?? null;
      const customDisplay = typeof customVal === "object" && customVal !== null ? customVal.value ?? "" : customVal ?? "";
      const cvStr = String(customDisplay);
      let customField;
      if (cvType === 3) {
        const isTrue = cvStr === "" ? true : cvStr === "true" || cvStr === "1";
        customField = this._mtFieldSelectRaw(
          `data-mt-val="${si}-${ri}"`,
          `<option value="1"${isTrue ? " selected" : ""}>True</option><option value="0"${!isTrue ? " selected" : ""}>False</option>`,
          isTrue ? "True" : "False",
          _sel
        );
      } else if (cvType === 0) {
        customField = `<input data-mt-val="${si}-${ri}" type="number" value="${this._escHtml(cvStr)}" placeholder="0" class="mt-field" style="${_sel}">`;
      } else if (cvType === 1) {
        customField = `<input data-mt-val="${si}-${ri}" type="date" value="${this._escHtml(cvStr)}" class="mt-field" style="${_sel}">`;
      } else {
        customField = `<input data-mt-val="${si}-${ri}" type="text" value="${this._escHtml(cvStr)}" placeholder="\u2014" class="mt-field" style="${_sel}"${cvType == null ? " disabled" : ""}>`;
      }
      const opHtml = ri > 0 ? `<div style="display:flex;align-items:center;gap:8px;padding:6px 0">
            <span style="font-size:10px;color:var(--is-text-muted)">Operator</span>
            <span style="font-size:11px;font-weight:700;color:var(--is-text);background:rgba(255,255,255,0.07);border:1px solid var(--is-card-bdr);border-radius:999px;padding:3px 12px;cursor:pointer" data-mt-toggle-op="${si}-${ri}">${ruleOp === 1 ? "OR" : "AND"}</span>
          </div>` : "";
      return `${opHtml}
      <div style="background:rgba(255,255,255,0.03);border:1px solid var(--is-card-bdr);border-radius:12px;padding:12px 14px;margin-bottom:6px" data-mt-rule-idx="${si}-${ri}">
        <div style="display:flex;align-items:center;margin-bottom:10px">
          <span style="font-size:12px;font-weight:700;color:rgba(245,158,11,0.95)">Rule #${ri + 1}</span>
          <div style="flex:1"></div>
          <button data-mt-del-rule="${si}-${ri}" style="${this._mtBtnA("red")};height:24px;font-size:11px">${this._t("mtDelete")}</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <div style="${_lbl}">First Value</div>
            ${this._mtFieldSelectRaw(`data-mt-firstval="${si}-${ri}"`, _buildCombinedOpts(firstApp, firstProp, "Select First Value\u2026"), _propLabel(firstApp, firstProp) || "Select First Value\u2026", _sel)}
          </div>
          <div>
            <div style="${_lbl}">Action</div>
            ${this._mtFieldSelectRaw(`data-mt-action="${si}-${ri}"`, actionOpts, action !== "" ? ACTION_LABELS[action] || `Action ${action}` : "Select Action\u2026", _sel)}
          </div>
          <div>
            <div style="${_lbl}">Second Value</div>
            ${this._mtFieldSelectRaw(`data-mt-secondval="${si}-${ri}"`, _buildSecondOpts(lastApp, lastProp, cvType), cvType != null ? CUSTOM_TYPES.find(([id]) => id === cvType)?.[1] || "Select Second Value\u2026" : _propLabel(lastApp, lastProp) || "Select Second Value\u2026", _sel)}
          </div>
          <div${cvType == null ? ' style="display:none"' : ""}>
            <div style="${_lbl}">Custom Value</div>
            ${customField}
          </div>
        </div>
      </div>`;
    }).join("");
    return `<div style="background:var(--is-btn-bg);border:1px solid var(--is-card-bdr);border-radius:16px;padding:14px 16px;margin-bottom:10px" data-mt-section="${si}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <span style="font-size:13px;font-weight:700;color:var(--is-text)">${this._t("mtSection")} #${si + 1}</span>
        ${si > 0 ? `<span style="font-size:10px;font-weight:700;color:rgba(0,122,255,0.9);background:rgba(0,122,255,0.12);border:1px solid rgba(0,122,255,0.3);border-radius:999px;padding:2px 10px;cursor:pointer" data-mt-toggle-sec-op="${si}">${opLabel}</span>` : ""}
        <div style="flex:1"></div>
        <button data-mt-del-section="${si}" style="${this._mtBtnA("red")};width:24px;height:24px;padding:0;font-size:13px">\xD7</button>
      </div>
      ${rulesHtml || `<div style="font-size:11px;color:var(--is-text-muted);padding:8px 0">${this._t("mtNoConditions")}</div>`}
      <button data-mt-add-rule="${si}" style="${this._mtBtnA("green")};margin-top:8px;font-size:11px">+ ${this._t("mtAddRule")}</button>
    </div>`;
  }
};
var maintainerrRenderMixin = _MaintainerrRenderMethods.prototype;


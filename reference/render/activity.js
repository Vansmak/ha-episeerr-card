
var _ActivityRenderMethods = class {
  // One capsule per tab: search, the pickers, then Columns — Columns is a
  // dropdown in all but name, so it belongs in the bar with the rest. A phone
  // gets a second bar for the pickers; three of them plus a search field on one
  // row would leave nothing to type in.
  // A phone has no room for worded pickers, so each one shows the glyph of what
  // it filters. Muted while it is on "all", blue once it actually filters —
  // otherwise a row of icons says nothing about what is set.
  _actFilterIcon(kind) {
    const F = 'viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"';
    const I = {
      source: `<svg ${F}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/></svg>`,
      status: `<svg ${F}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
      quality: `<svg ${F}><polygon points="12 2 15 9 22 9.3 16.5 13.8 18.4 21 12 17 5.6 21 7.5 13.8 2 9.3 9 9"/></svg>`,
      protocol: `<svg ${F}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>`,
      indexer: `<svg ${F}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/></svg>`,
      client: `<svg ${F}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
      event: `<svg ${F}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>`,
      langs: `<svg ${F}><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z"/></svg>`,
      formats: `<svg ${F}><path d="M20.6 13.4 12 22l-9-9V3h10z"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/></svg>`,
      relgroup: `<svg ${F}><path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/></svg>`,
      profile: `<svg ${F}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
      monitored: `<svg ${F}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
      filter: `<svg ${F}><polygon points="22 3 2 3 10 12.5 10 19 14 21 14 12.5"/></svg>`,
      sort: `<svg ${F}><polyline points="7 4 7 20"/><polyline points="4 17 7 20 10 17"/><polyline points="17 20 17 4"/><polyline points="14 7 17 4 20 7"/></svg>`
    };
    return I[kind] || I.status;
  }
  _actIconSelect(sel) {
    const cur = String(sel.value ?? "");
    const active = cur && cur !== "all";
    const label = sel.items.find(([v]) => String(v) === cur)?.[1] || "";
    const opts = sel.items.map(([v, l]) => `<option value="${this._escHtml(String(v))}"${String(v) === cur ? " selected" : ""}>${this._escHtml(l)}</option>`).join("");
    const chev = `<svg class="mt-tb-chev" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
    return `<span class="mt-tb-sel mt-tb-sel--ico${active ? " is-active" : ""}" title="${this._escHtml(label)}">
      ${this._actFilterIcon(sel.kind)}${chev}
      <select id="${sel.id}">${opts}</select>
    </span>`;
  }
  // The shared toolbar: search, the pickers, then the actions, split by
  // hairlines. On a phone the pickers and actions become glyphs and share a
  // scrolling cluster capped at 60% of the bar, so the search field keeps the
  // rest. Every tab in every category builds its bar through this.
  _uiBar(searchId, searchVal, sels, btns, { placeholder = "Search\u2026", style = "" } = {}) {
    const isMob = this._isMob;
    const live = (sels || []).filter((s) => s && s.items && s.items.length > 1);
    const actions = (btns || []).filter(Boolean);
    const btnHtml = actions.map((b) => b.html ?? `<button id="${b.id}" class="mt-tb-btn${b.on ? " is-on" : ""}"${b.attr ? " " + b.attr : ""} title="${this._escHtml(b.label || "")}">${b.icon || ""}${isMob ? "" : b.label || ""}</button>`).join("");
    const sep = '<span class="mt-tb-sep"></span>';
    const mobPicks = searchId ? live.map((x) => this._actIconSelect(x)) : live.map((x) => this._mtSelect(x.id, x.items, x.value, x.neutral ?? "all"));
    const mobInner = `${mobPicks.join("")}${btnHtml ? `${live.length ? sep : ""}${btnHtml}` : ""}`;
    const ctrls = isMob ? live.length || btnHtml ? searchId ? `<span class="act-tb-cluster">${mobInner}</span>` : mobInner : "" : `${live.map((x) => this._mtSelect(x.id, x.items, x.value, x.neutral ?? "all")).join("")}${btnHtml ? `${live.length ? sep : ""}${btnHtml}` : ""}`;
    const pad = searchId ? "0 3px 0 12px" : "0 3px";
    const lead = searchId ? "" : '<div style="flex:1;min-width:0"></div>';
    return this._mtToolbar(
      searchId,
      searchVal,
      ctrls ? [{ html: lead + ctrls }] : [],
      placeholder,
      `flex:1;min-width:0;height:34px;padding:${pad}${style ? ";" + style : ""}`
    );
  }
  // Our own trigger carries the label, and a partial refresh leaves the bar
  // untouched, so a new value never shows unless it is copied across.
  _tbSyncSelect(sel) {
    const trig = sel?.closest?.(".mt-tb-sel, .mt-fsel");
    if (!trig) return;
    const opt = sel.selectedOptions?.[0];
    const lbl = trig.querySelector(".mt-tb-lbl, .mt-fsel-lbl");
    if (lbl && opt) lbl.textContent = opt.textContent;
    const off = !sel.value || sel.value === "all";
    if (trig.classList.contains("mt-tb-sel--ico")) {
      trig.classList.toggle("is-active", !off);
      if (opt) trig.title = opt.textContent;
    } else {
      trig.classList.toggle("is-off", off);
    }
  }
  // A dropdown anchored inside the bar's scrolling icon cluster gets clipped by
  // it. Switching to fixed positioning takes the menu out of that box; the
  // modal's glass is its containing block, so it still moves with the modal.
  _floatMenu(btn, menu) {
    if (!btn || !menu || menu.style.display === "none") return;
    const r = btn.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.top = `${Math.round(r.bottom + 4)}px`;
    menu.style.left = "auto";
    menu.style.right = `${Math.round(window.innerWidth - r.right)}px`;
  }
  // Destructive row actions confirm where they stand: the button is swapped for
  // a tick and a cross, and the cross puts it back. No dialog, no state to
  // thread through the renderer.
  _confirmInline(btn, onYes, label = "") {
    if (!btn || btn._armed) return;
    btn._armed = true;
    const CHECK = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="20 6 9 17 4 12"/></svg>`;
    const CROSS = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    const holder = document.createElement("span");
    holder.style.cssText = "display:inline-flex;gap:4px;align-items:center;position:absolute;right:0;top:50%;transform:translateY(-50%);z-index:3";
    const host = btn.parentElement;
    const hostPos = host?.style.position || "";
    const hostOvf = host?.style.overflow || "";
    if (host) {
      host.style.position = "relative";
      host.style.overflow = "visible";
    }
    const restoreHost = () => {
      if (!host) return;
      host.style.position = hostPos;
      host.style.overflow = hostOvf;
    };
    holder.innerHTML = (label ? `<span style="font-size:10px;font-weight:600;color:#e5484d;white-space:nowrap;margin-right:2px">${this._escHtml(label)}</span>` : "") + this._mtRoundBtn("data-confirm-yes", CHECK, label || "Confirm", { size: 24, tone: "red" }) + this._mtRoundBtn("data-confirm-no", CROSS, "Cancel", { size: 24, tone: "blue" });
    btn.replaceWith(holder);
    holder.querySelector("[data-confirm-yes]").addEventListener("click", async () => {
      holder.querySelectorAll("button").forEach((b) => {
        b.disabled = true;
      });
      btn._armed = false;
      holder.replaceWith(btn);
      restoreHost();
      await onYes();
    });
    holder.querySelector("[data-confirm-no]").addEventListener("click", () => {
      btn._armed = false;
      holder.replaceWith(btn);
      restoreHost();
    });
  }
  // One switch for the whole card: the same blue as every other accent, a
  // hairline rim when off. Prowlarr had its own indigo variant.
  _uiSwitch(attr, on, title = "") {
    return `<button ${attr} title="${this._escHtml(title)}"
      style="flex-shrink:0;width:36px;height:20px;border-radius:999px;box-sizing:border-box;cursor:pointer;position:relative;padding:0;transition:background 0.15s,border-color 0.15s;border:1px solid ${on ? "rgba(0,122,255,0.8)" : "rgba(255,255,255,0.12)"};background:${on ? "rgba(0,122,255,0.7)" : "rgba(255,255,255,0.06)"}">
      <span style="position:absolute;top:50%;transform:translateY(-50%);left:${on ? "18px" : "4px"};width:12px;height:12px;border-radius:50%;background:rgba(255,255,255,${on ? "0.95" : "0.45"});transition:left 0.15s"></span>
    </button>`;
  }
  // Every badge in a table or modal goes through here, so the palette stays a
  // short list rather than a colour invented per call site.
  _uiBadge(label, tone = "neutral", { small = false, extra = "", title = "", white = false } = {}) {
    const TONES = {
      neutral: "150,150,165",
      blue: "99,140,255",
      green: "52,199,89",
      amber: "255,149,0",
      red: "255,69,58",
      purple: "175,82,222",
      teal: "48,196,196"
    };
    const rgb = TONES[tone] || (typeof tone === "string" && tone.includes(",") ? tone : TONES.neutral);
    return `<span class="ui-badge${small ? " ui-badge--sm" : ""}${white ? " ui-badge--w" : ""}" style="--bdg:${rgb}${extra ? ";" + extra : ""}"${title ? ` title="${this._escHtml(title)}"` : ""}>${label}</span>`;
  }
  // Some badges carry a colour that comes from data (an app's brand hue), not
  // from the palette, so it arrives as hex and is turned into the triple.
  _hexToRgbTriple(hex) {
    const h = String(hex).replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return Number.isFinite(n) ? `${n >> 16 & 255},${n >> 8 & 255},${n & 255}` : "150,150,165";
  }
  _actBar(searchId, searchVal, sels, colsBtnId) {
    const colsSvg = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18"/></svg>`;
    const bar = this._uiBar(
      searchId,
      searchVal,
      sels,
      colsBtnId ? [{ id: colsBtnId, label: this._t("actColumns"), icon: colsSvg }] : []
    );
    return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-shrink:0">${bar}</div>`;
  }
  // ── Right-panel card row ─────────────────────────────────────────────────
  _renderActivity() {
    const rItems = this._radarrQueueItems || [];
    const r2Items = this._radarr2QueueItems || [];
    const snPct = this._sonarrQueueSeriesPct || /* @__PURE__ */ new Map();
    const sn2Pct = this._sonarr2QueueSeriesPct || /* @__PURE__ */ new Map();
    const liPct = this._lidarrQueueArtists || /* @__PURE__ */ new Map();
    const totalFailed = rItems.filter((x) => x.failed).length + r2Items.filter((x) => x.failed).length;
    const totalActive = rItems.filter((x) => !x.failed).length + r2Items.filter((x) => !x.failed).length + snPct.size + sn2Pct.size + liPct.size;
    return `
      <div class="sec-card has-gradient" style="${this._sectionStyle()}">
        ${this._sectionOverlayHtml("radarr", 25, 75, 0.23)}
        <div class="col-hdr" style="margin-bottom:5px">
          ${this._appIconRow(["radarr", "sonarr", "lidarr"])}
          <span class="col-hdr-title">${this._t("actActivityQueue")}</span>
          <div class="col-hdr-line"></div>
        </div>
        <div class="pg-wrap" style="flex:1;align-items:stretch;position:relative">
          <button class="pg-btn pg-btn-ph" aria-hidden="true" tabindex="-1">&#8249;</button>
          <div class="tl-row">
            ${this._actQueueCard(totalActive, totalFailed)}
            ${this._actHistoryCard()}
            ${this._actBlocklistCard()}
            ${this._actMissingCard()}
          </div>
          <button class="pg-btn pg-btn-ph" aria-hidden="true" tabindex="-1">&#8250;</button>
        </div>
      </div>`;
  }
  _actQueueCard(totalActive, totalFailed) {
    const rItems = this._radarrQueueItems || [];
    const r2Items = this._radarr2QueueItems || [];
    const snSeries = this._sonarr || [];
    const snPct = this._sonarrQueueSeriesPct || /* @__PURE__ */ new Map();
    const snFirstEp = this._sonarrQueueFirstEp || /* @__PURE__ */ new Map();
    const sn2Series = this._sonarr2 || [];
    const sn2Pct = this._sonarr2QueueSeriesPct || /* @__PURE__ */ new Map();
    const sn2FirstEp = this._sonarr2QueueFirstEp || /* @__PURE__ */ new Map();
    const rows = [];
    const maxRows = this._actCardMax("queue");
    const CAP = Math.max(maxRows + 3, 20);
    for (const item of [...rItems, ...r2Items]) {
      if (rows.length >= CAP) break;
      rows.push({ title: item.title, type: "movie", failed: item.failed, pct: item.pct, sub: null });
    }
    for (const [sid, pct] of snPct) {
      if (rows.length >= CAP) break;
      const s = snSeries.find((x) => x.id === sid);
      const ep = snFirstEp.get(sid);
      const sub = ep ? `S${String(ep.season).padStart(2, "0")}E${String(ep.episode).padStart(2, "0")}${ep.count > 1 ? ` +${ep.count - 1}` : ""}` : "Show";
      if (s) rows.push({ title: s.title || "\u2014", type: "show", failed: false, pct, sub });
    }
    for (const [sid, pct] of sn2Pct) {
      if (rows.length >= CAP) break;
      const s = sn2Series.find((x) => x.id === sid);
      const ep = sn2FirstEp.get(sid);
      const sub = ep ? `S${String(ep.season).padStart(2, "0")}E${String(ep.episode).padStart(2, "0")}${ep.count > 1 ? ` +${ep.count - 1}` : ""}` : "Show";
      if (s) rows.push({ title: s.title || "\u2014", type: "show", failed: false, pct, sub });
    }
    for (const [aid, pct] of this._lidarrQueueArtists || /* @__PURE__ */ new Map()) {
      if (rows.length >= CAP) break;
      const a = this._lidarrArtists?.get(aid);
      if (!a) continue;
      rows.push({
        title: a.artistName || "\u2014",
        type: "music",
        failed: false,
        pct: pct >= 0 ? pct : 0,
        sub: this._t("typeArtist")
      });
    }
    const badge = totalFailed > 0 ? this._uiBadge(`${totalFailed} ${this._t("actFailed")}`, "amber", { extra: "flex-shrink:0", white: true }) : totalActive > 0 ? this._uiBadge(`${totalActive} ${this._t("tlActive")}`, "green", { extra: "flex-shrink:0", white: true }) : "";
    const rowsHtml = rows.length > 0 ? rows.map((r, i) => {
      const sep = i > 0 ? "border-top:1px solid rgba(255,255,255,0.06);" : "";
      const color = r.failed ? "rgba(248,113,113,0.85)" : "rgba(52,211,153,0.85)";
      const sub = r.sub ?? (r.type === "movie" ? this._t("typeMovie") : r.type === "music" ? this._t("typeArtist") : this._t("typeTv"));
      const pctBar = r.failed ? "" : `<div style="margin-top:3px;width:100%;height:2px;background:rgba(255,255,255,0.08);border-radius:1px"><div style="width:${r.pct}%;height:100%;background:${color};border-radius:1px"></div></div>`;
      const pctTxt = r.failed ? ` ${this._uiBadge(this._t("actFailed"), "amber")}` : ` \xB7 ${r.pct}%`;
      const hidden = i >= maxRows ? "display:none;" : "";
      return `<div style="${hidden}${sep}padding:4px 0">
            <div style="font-size:10px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.title}</div>
            <div style="font-size:9px;color:rgba(255,255,255,0.45);margin-top:1px">${sub}${pctTxt}</div>
            ${pctBar}
          </div>`;
    }).join("") : `<div style="font-size:9px;color:var(--is-text-muted);padding:8px 0">${this._t("actNoDownloads")}</div>`;
    return `<div class="tl-card u-sec-body" data-act-open="queue">
      <div class="u-bg-icon"><svg viewBox="0 0 24 24" width="130" height="130" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="3" x2="12" y2="21"/></svg></div>
      <div class="u-row-sb-w">
        <span style="font-size:10px;font-weight:800;color:var(--is-text);background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);padding:2px 6px;border-radius:4px;line-height:1">${this._t("actQueue")}</span>
        ${badge}
      </div>
      <div data-act-content class="u-flex-ovh-rel">${rowsHtml}</div>
    </div>`;
  }
  _actHistoryCard() {
    const cache = this._actHistoryCache;
    const grabbed = cache === null ? null : cache || [];
    const histMax = this._actCardMax("history");
    const content = grabbed === null ? `<div style="font-size:9px;color:var(--is-text-muted);padding:8px 0">${this._t("loading")}</div>` : grabbed.length === 0 ? `<div style="font-size:9px;color:var(--is-text-muted);padding:8px 0">${this._t("actNoHistory")}</div>` : grabbed.map((r, i) => {
      const sep = i > 0 ? "border-top:1px solid rgba(255,255,255,0.06);" : "";
      const ago = r.date ? this._tlFmtDate(r.date) : "";
      const sub = [r.svc, r.ep || null, ago].filter(Boolean).join(" \xB7 ");
      const hidden = i >= histMax ? "display:none;" : "";
      return `<div style="${hidden}${sep}padding:4px 0">
              <div style="font-size:10px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.title}</div>
              <div style="font-size:9px;color:rgba(255,255,255,0.45);margin-top:1px">${sub}</div>
            </div>`;
    }).join("");
    return `<div class="tl-card u-sec-body" data-act-open="history">
      <div class="u-bg-icon"><svg viewBox="0 0 24 24" width="130" height="130" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
      <div class="u-row-sb-w">
        <span style="font-size:10px;font-weight:800;color:var(--is-text);background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);padding:2px 6px;border-radius:4px;line-height:1">${this._t("actHistory")}</span>
      </div>
      <div data-act-content class="u-flex-ovh-rel">${content}</div>
    </div>`;
  }
  _actBlocklistCard() {
    const cache = this._actBlocklistCache;
    const items = cache === null ? null : cache || [];
    const blMax = this._actCardMax("blocklist");
    const content = items === null ? `<div style="font-size:9px;color:var(--is-text-muted);padding:8px 0">${this._t("loading")}</div>` : items.length === 0 ? `<div style="font-size:9px;color:var(--is-text-muted);padding:8px 0">${this._t("actNoBlocked")}</div>` : items.map((r, i) => {
      const sep = i > 0 ? "border-top:1px solid rgba(255,255,255,0.06);" : "";
      const ago = r.date ? this._tlFmtDate(r.date) : "";
      const sub = [r.svc, r.quality, ago].filter(Boolean).join(" \xB7 ");
      const hidden = i >= blMax ? "display:none;" : "";
      return `<div style="${hidden}${sep}padding:4px 0">
              <div style="font-size:10px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.title}</div>
              <div style="font-size:9px;color:rgba(255,255,255,0.45);margin-top:1px">${sub}</div>
            </div>`;
    }).join("");
    return `<div class="tl-card u-sec-body" data-act-open="blocklist">
      <div class="u-bg-icon"><svg viewBox="0 0 24 24" width="130" height="130" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
      <div class="u-row-sb-w">
        <span style="font-size:10px;font-weight:800;color:var(--is-text);background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);padding:2px 6px;border-radius:4px;line-height:1">${this._t("actBlocklist")}</span>
      </div>
      <div data-act-content class="u-flex-ovh-rel">${content}</div>
    </div>`;
  }
  // Returns the max items that fit in a poster card of the given type.
  // Uses a cached value (from previous successful trim) so re-renders never show overflow.
  // Keys: 'queue' | 'history' | 'blocklist' | 'tl-history' | 'js-history'
  _actCardMax(key) {
    if (!this._actCardLimits) {
      try {
        const stored = JSON.parse(localStorage.getItem("arr-act-card-limits") || "null");
        this._actCardLimits = stored && typeof stored === "object" ? stored : {};
      } catch {
        this._actCardLimits = {};
      }
    }
    return this._actCardLimits[key] ?? 3;
  }
  _trimActivityCards() {
    const BOTTOM_GAP = 12;
    const SEL_KEY = {
      '[data-act-open="queue"]': "queue",
      '[data-act-open="history"]': "history",
      '[data-act-open="blocklist"]': "blocklist",
      '[data-tl-open="history"]': "tl-history",
      '[data-js-open="history"]': "js-history"
    };
    const trimAndLearn = () => {
      let anyUpdated = false;
      for (const [attr, key] of Object.entries(SEL_KEY)) {
        const card = this.shadowRoot?.querySelector(`.tl-card${attr}`);
        if (!card) continue;
        const contentDiv = card.querySelector("[data-act-content]");
        if (!contentDiv) continue;
        for (const item of contentDiv.children) item.style.display = "";
        const limit = contentDiv.getBoundingClientRect().bottom - BOTTOM_GAP;
        if (limit <= 0) continue;
        let overflowing = false;
        let visible = 0;
        for (const item of contentDiv.children) {
          if (overflowing || item.getBoundingClientRect().bottom > limit) {
            overflowing = true;
            item.style.display = "none";
          } else {
            visible++;
          }
        }
        if (!this._actCardLimits) this._actCardLimits = {};
        if (this._actCardLimits[key] !== visible) {
          this._actCardLimits[key] = visible;
          anyUpdated = true;
        }
      }
      if (anyUpdated && !this._trimCalibrating) {
        try {
          localStorage.setItem("arr-act-card-limits", JSON.stringify(this._actCardLimits));
        } catch {
        }
        this._trimCalibrating = true;
        this._reRenderRight?.();
        this._trimCalibrating = false;
      }
    };
    this._trimRO?.disconnect();
    this._trimRO = null;
    requestAnimationFrame(trimAndLearn);
    const tlRow = this.shadowRoot?.querySelector(".tl-row");
    if (tlRow && typeof ResizeObserver !== "undefined") {
      let fires = 0;
      const ro = new ResizeObserver(() => {
        requestAnimationFrame(trimAndLearn);
        if (++fires >= 6) {
          ro.disconnect();
          this._trimRO = null;
        }
      });
      ro.observe(tlRow);
      this._trimRO = ro;
      setTimeout(() => {
        ro.disconnect();
        this._trimRO = null;
      }, 3e3);
    }
  }
  // ── Modal shell ──────────────────────────────────────────────────────────
  _actModalNavHtml(tab) {
    const isMobile2 = this._isMob;
    const _ico = (d) => `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${d}</svg>`;
    const NAV = [
      { id: "queue", label: this._t("actTabQueue"), icon: _ico('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>') },
      { id: "history", label: this._t("actTabHistory"), icon: _ico('<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>') },
      { id: "blocklist", label: this._t("actTabBlocklist"), icon: _ico('<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>') },
      { id: "missing", label: this._t("actTabMissing"), icon: _ico('<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>') }
    ];
    return `<div id="act-nav" class="mt-nav"><span class="mt-nav-ind"></span>${NAV.map((g) => {
      const on = g.id === tab;
      return `<button class="mt-nav-btn${on ? " is-on" : ""}" data-act-tab="${g.id}" title="${this._escHtml(g.label)}">${g.icon}${!isMobile2 || on ? g.label : ""}</button>`;
    }).join("")}</div>`;
  }
  _actModalHtml(tab) {
    const isMobile2 = this._isMob;
    const _backIco = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
    const hdrInner = `<div id="act-nav-area" style="min-width:0;flex-shrink:1;overflow:hidden">${this._actModalNavHtml(tab)}</div>
         ${isMobile2 ? "" : `<div id="act-status-slot" style="flex-shrink:0;display:flex;align-items:center"></div>`}
         <div style="flex:1;min-width:8px"></div>
         <button class="popup-close" id="act-close" style="position:relative;top:0;right:0;flex-shrink:0;align-self:center;margin-left:4px">${this._actPopupReturn ? _backIco : ICONS.close}</button>`;
    const hdrStyle = isMobile2 ? "padding:12px 12px 10px;gap:8px;align-items:center" : "padding:14px 22px 10px;gap:12px;align-items:center";
    return `<div class="popup-overlay${dayClass(this)}" data-act-modal>
      <div class="popup-glass tl-wide">
        <div class="is-panel-hdr" style="${hdrStyle}">${hdrInner}</div>
        <div class="popup-body" id="act-body" style="padding:${isMobile2 ? "12px 14px 16px" : "14px 22px 20px"};overflow:hidden">
          <div class="is-loading"><span>${this._t("loading")}</span></div>
        </div>
      </div>
    </div>`;
  }
  // ── Queue tab ────────────────────────────────────────────────────────────
  _actQueueTabHtml(radarrRecords, sonarrRecords, page, perPage, cols) {
    const isMobile2 = this._isMob;
    const _epNum = (ep) => ep ? ` S${String(ep.seasonNumber).padStart(2, "0")}E${String(ep.episodeNumber).padStart(2, "0")}` : "";
    const all = [
      ...(radarrRecords || []).map((r) => ({
        ...r,
        _svc: r._svc || "radarr",
        _title: r._enrichedTitle || r.movie?.title || r.title || "\u2014",
        _episodeTitle: ""
      })),
      ...(sonarrRecords || []).map((r) => {
        const seriesTitle = r._enrichedTitle || r.series?.title || r.title || "\u2014";
        return {
          ...r,
          _svc: r._svc || "sonarr",
          _title: seriesTitle + _epNum(r.episode),
          _episodeTitle: r.episode?.title || ""
        };
      })
    ];
    const m = this._activityModal || {};
    const fSvc = m.queueFilterSvc || "all";
    const fSts = m.queueFilterSts || "all";
    const fQual = m.queueFilterQuality || "all";
    const fProto = m.queueFilterProtocol || "all";
    const fIdx = m.queueFilterIndexer || "all";
    const fCli = m.queueFilterClient || "all";
    const qSearch = (m.queueSearch || "").toLowerCase().trim();
    const filtered = all.filter((item) => {
      if (qSearch && !item._title.toLowerCase().includes(qSearch)) return false;
      if (fSvc !== "all" && item._svc !== fSvc) return false;
      if (fSts === "failed") {
        const isBadF = item.trackedDownloadStatus === "warning" || item.trackedDownloadStatus === "error" || item.trackedDownloadState === "importFailed" || item.status === "failed";
        if (!isBadF) return false;
      }
      if (fSts === "downloading") {
        const isBadF = item.trackedDownloadStatus === "warning" || item.trackedDownloadStatus === "error" || item.trackedDownloadState === "importFailed" || item.status === "failed";
        if (isBadF) return false;
      }
      if (fQual !== "all" && (item.quality?.quality?.name || "") !== fQual) return false;
      if (fProto !== "all" && (item.protocol || "").toLowerCase() !== fProto) return false;
      if (fIdx !== "all" && (item.indexer || "") !== fIdx) return false;
      if (fCli !== "all" && (item.downloadClient || "") !== fCli) return false;
      return true;
    });
    if (!all.length) {
      return `<div style="text-align:center;color:var(--is-text-muted);padding:40px 20px">${this._t("actQueueEmpty")}</div>`;
    }
    const pp = perPage || 15;
    const pg = Math.min(page || 0, Math.max(0, Math.ceil(filtered.length / pp) - 1));
    const paged = filtered.slice(pg * pp, (pg + 1) * pp);
    const totPages = Math.max(1, Math.ceil(filtered.length / pp));
    const pagHtml = totPages > 1 ? this._tlMobPag("act-queue-page", pg, totPages) : "";
    const PAG = `<div style="flex-shrink:0;padding-top:8px">${pagHtml}</div>`;
    const importSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v10"/><polyline points="8 9 12 13 16 9"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>`;
    const trashSvg = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`;
    const dlDoneSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
    const srcFilmSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="2" y1="17" x2="7" y2="17"/></svg>`;
    const srcTvSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="15" rx="2"/><polyline points="8 21 12 17 16 21"/></svg>`;
    const ALL_QUEUE_COLS = [
      { id: "source", label: this._t("actColSource") },
      { id: "quality", label: this._t("actColQuality") },
      { id: "size", label: this._t("actColSize") },
      { id: "timeleft", label: this._t("actColTimeLeft") },
      { id: "formats", label: this._t("actColFormats") },
      { id: "protocol", label: this._t("actColProtocol") },
      { id: "indexer", label: this._t("actColIndexer") },
      { id: "client", label: this._t("actColClient") },
      { id: "status", label: this._t("actColStatus") }
    ];
    const C = cols instanceof Set ? cols : /* @__PURE__ */ new Set(["source", "quality", "size", "formats", "status"]);
    const visCols = ALL_QUEUE_COLS.filter((c) => C.has(c.id));
    const uniq = (arr, fn) => [...new Set(arr.map(fn).filter(Boolean))].sort();
    const mkItems = (ph, opts) => [["all", ph], ...opts.map((o) => [o, o])];
    const qSels = [
      C.has("source") && { id: "act-queue-svc", kind: "source", value: fSvc, items: [["all", this._t("actAllSources")], ["radarr", this._instLabel("radarr")], ["sonarr", this._instLabel("sonarr")], ...this._lidarrConfigured !== false ? [["lidarr", "Lidarr"]] : []] },
      C.has("status") && { id: "act-queue-sts", kind: "status", value: fSts, items: [["all", this._t("actAllStatus")], ["downloading", this._t("actDownloading")], ["failed", this._t("actEvtFailed")]] },
      C.has("quality") && { id: "act-queue-quality", kind: "quality", value: fQual, items: mkItems(this._t("actAllQualities"), uniq(all, (r) => r.quality?.quality?.name)) },
      C.has("protocol") && { id: "act-queue-proto", kind: "protocol", value: fProto, items: mkItems(this._t("actAllProtocols"), ["torrent", "usenet"]) },
      C.has("indexer") && { id: "act-queue-indexer", kind: "indexer", value: fIdx, items: mkItems(this._t("actAllIndexers"), uniq(all, (r) => r.indexer)) },
      C.has("client") && { id: "act-queue-client", kind: "client", value: fCli, items: mkItems(this._t("actAllClients"), uniq(all, (r) => r.downloadClient)) }
    ].filter(Boolean);
    const qToolbar = this._actBar("act-queue-search", m.queueSearch || "", qSels, "act-queue-cols-btn");
    const rows = paged.map((item) => {
      const isBad = item.trackedDownloadStatus === "warning" || item.trackedDownloadStatus === "error" || item.trackedDownloadState === "importFailed" || item.status === "failed";
      const pct = item.size > 0 ? Math.round((item.size - (item.sizeleft || 0)) / item.size * 100) : 0;
      const stCol = isBad ? "rgba(250,160,40,0.9)" : "var(--is-text-muted)";
      const _sm = item.statusMessages;
      const _smLines = isBad && item._miRejection ? [item._miRejection] : _sm?.length ? _sm.flatMap((s) => s.messages?.length ? s.messages : s.title ? [s.title] : []).filter(Boolean) : [];
      const stLbl = isBad ? _smLines[0] || item.trackedDownloadState || item.trackedDownloadStatus || "Error" : `${pct}%`;
      const svcCol = this._actSrcColor(item._svc);
      const svcLbl = this._instLabel(item._svc);
      const sizLbl = item.size ? this._actFmtSize(item.size) : "\u2014";
      const qualLbl = item.quality?.quality?.name || "\u2014";
      const timeLbl = item.timeleft || "\u2014";
      const protLbl = item.protocol || "\u2014";
      const idxLbl = item.indexer || "\u2014";
      const cliLbl = item.downloadClient || "\u2014";
      const pb = `<div style="width:100%;height:3px;background:var(--is-divider);border-radius:2px;overflow:hidden;margin-top:3px"><div style="width:${isBad ? 100 : pct}%;height:100%;background:rgba(99,140,255,0.65);border-radius:2px"></div></div>`;
      const removeBtn = this._mtRoundBtn(
        `class="act-remove-btn" data-id="${item.id}" data-svc="${item._svc}" data-title="${this._escHtml(item._title)}"`,
        trashSvg,
        "Remove from queue",
        { size: 24, tone: "red" }
      );
      const canImport = isBad && item.downloadId;
      const importing = item.downloadId && this._actImporting?.has(item.downloadId);
      const importBtn = importing ? `<span title="${this._escHtml(this._t("actImporting"))}" style="margin-right:4px;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0"><span class="is-spin"></span></span>` : canImport ? `<span style="margin-right:4px;display:inline-flex">${this._mtRoundBtn(
        `class="act-mi-btn" data-id="${item.id}" data-svc="${item._svc}" data-download-id="${item.downloadId}" data-movie-id="${item.movieId || ""}" data-series-id="${item.seriesId || ""}" data-episode-id="${item.episodeId || item.episode?.id || ""}" data-output-path="${this._escHtml(item.outputPath || "")}" data-title="${this._escHtml(item._title)}"`,
        importSvg,
        "Manual Import",
        { size: 24, tone: "blue" }
      )}</span>` : "";
      const isFullyDl = item.size > 0 && (item.sizeleft === 0 || item.sizeleft === null);
      const dlIcon = isFullyDl ? `<span style="color:rgba(250,160,40,0.85);display:flex;align-items:center;flex-shrink:0">${dlDoneSvg}</span>` : "";
      const addedLbl = item.added ? (() => {
        try {
          const dt = new Date(item.added);
          return dt.toLocaleDateString(this._locale, { month: "short", day: "numeric" });
        } catch {
          return "";
        }
      })() : "";
      const qExtraTags = isMobile2 ? visCols.filter((c) => !["source", "quality", "size", "status", "formats"].includes(c.id)).map((col) => {
        let v = "";
        if (col.id === "timeleft") v = item.timeleft || "";
        if (col.id === "protocol") v = item.protocol || "";
        if (col.id === "indexer") v = item.indexer || "";
        if (col.id === "client") v = item.downloadClient || "";
        return v && v !== "\u2014" ? `<span class="u-xxs-muted">${v}</span>` : "";
      }).filter(Boolean).join("") : "";
      if (isMobile2) {
        const subLine = isBad ? _smLines[0] || item.trackedDownloadState || "Error" : item._episodeTitle ? this._escHtml(item._episodeTitle) : null;
        const subLineClr = isBad ? "rgba(250,160,40,0.85)" : "var(--is-text-muted)";
        return `<div style="padding:9px 0;border-bottom:1px solid var(--is-divider)">
          <div style="display:flex;align-items:flex-start;gap:6px">
            <div style="flex-shrink:0;width:16px;display:flex;justify-content:center;padding-top:2px">${dlIcon}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:600;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item._title}</div>
              <div style="font-size:10px;color:${subLineClr};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;visibility:${subLine ? "visible" : "hidden"}">${subLine || "&nbsp;"}</div>
              <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
                <span style="color:var(--is-text-muted);display:flex;align-items:center">${this._actSrcIcon(item._svc)}</span>
                <span class="u-xxs-muted">${qualLbl}</span>
                <span class="u-xxs-muted">${sizLbl}</span>
                ${qExtraTags}
              </div>
              ${pb}
            </div>
            <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:3px;min-width:52px">
              <span style="font-size:14px;font-weight:700;color:var(--is-text-muted)">${pct}%</span>
              ${addedLbl ? `<span class="u-xxs-muted">${addedLbl}</span>` : ""}
              <div style="display:flex;gap:4px;margin-top:2px">${importBtn}${removeBtn}</div>
            </div>
          </div>
        </div>`;
      }
      const colTds = visCols.map((col) => {
        const tdBase = `style="padding:8px;white-space:nowrap;font-size:10px;"`;
        if (col.id === "source") return `<td ${tdBase} style="padding:8px;text-align:center"><div style="display:flex;align-items:center;justify-content:center;gap:7px"><span style="color:var(--is-text-sec);display:flex;align-items:center">${this._actSrcIcon(item._svc)}</span><span style="font-weight:600;color:var(--is-text-sec)">${svcLbl}</span></div></td>`;
        if (col.id === "quality") return `<td ${tdBase} style="padding:8px">${qualLbl ? this._uiBadge(qualLbl, "neutral") : '<span class="u-xs-muted">\u2014</span>'}</td>`;
        if (col.id === "size") return `<td ${tdBase} style="padding:8px;font-size:10px;color:var(--is-text-sec)">${sizLbl}</td>`;
        if (col.id === "timeleft") return `<td ${tdBase} style="padding:8px;font-size:10px;color:var(--is-text-sec)">${timeLbl}</td>`;
        if (col.id === "formats") {
          const fmts = (item.customFormats || []).filter((cf) => cf.name);
          return `<td style="padding:8px;overflow:hidden">${fmts.length ? `<div class="act-fmt-tags" style="display:flex;flex-wrap:wrap;align-content:flex-start;gap:3px;max-height:44px;overflow:hidden">${fmts.map((cf) => `<span class="act-fmt-tag ui-badge" style="--bdg:150,150,165">${this._escHtml(cf.name)}</span>`).join("")}</div>` : `<span class="u-xs-muted">\u2014</span>`}</td>`;
        }
        if (col.id === "protocol") return `<td ${tdBase} style="padding:8px;font-size:10px;color:var(--is-text-sec)">${this._escHtml(protLbl)}</td>`;
        if (col.id === "indexer") return `<td ${tdBase} style="padding:8px;font-size:10px;color:var(--is-text-sec);max-width:120px;overflow:hidden;text-overflow:ellipsis">${this._escHtml(idxLbl)}</td>`;
        if (col.id === "client") return `<td ${tdBase} style="padding:8px;font-size:10px;color:var(--is-text-sec)">${this._escHtml(cliLbl)}</td>`;
        if (col.id === "status") {
          const stHtml = isBad && _smLines.length > 1 ? _smLines.map((l) => `<div style="font-size:10px;color:${stCol};line-height:1.4">${this._escHtml(l)}</div>`).join("") : `<span style="font-size:10px;font-weight:${isBad ? "400" : "600"};color:${stCol}">${this._escHtml(stLbl)}</span>`;
          return `<td style="padding:8px;white-space:normal;min-width:80px;max-width:180px"><div style="display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden">${stHtml}</div></td>`;
        }
        return "";
      }).join("");
      return `<tr class="u-divider-b"${item.downloadId ? ` data-q-key="${this._escHtml(String(item.downloadId).toLowerCase())}"` : ""}>
        <td style="padding:8px 8px 8px 0;width:22px;text-align:center">${dlIcon}</td>
        <td style="padding:8px 8px 8px 0">
          <div style="display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;word-break:break-word">
            <span class="u-sm-text">${item._title}</span>${item._episodeTitle ? `<span style="font-size:10px;color:var(--is-text-muted);margin-left:7px">${this._escHtml(item._episodeTitle)}</span>` : ""}
          </div>
          ${pb}
        </td>
        ${colTds}
        <td style="padding:8px 0 8px 8px;text-align:right;white-space:nowrap">
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:4px">
            ${importBtn}${removeBtn}
          </div>
        </td>
      </tr>`;
    }).join("");
    if (isMobile2) {
      return `<div class="u-col-fill">
        ${qToolbar}
        <div class="act-queue-results-wrap" style="display:contents">
          <div class="u-flex-ovh" data-act-clip>${rows}</div>
          ${PAG}
        </div>
      </div>`;
    }
    const COL_W = { source: 70, quality: 75, size: 65, timeleft: 75, formats: 130, protocol: 65, indexer: 110, client: 100, status: 95 };
    const thSt = `padding:4px 8px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:left;white-space:nowrap`;
    return `<div class="u-col-fill">
      ${qToolbar}
      <div class="act-queue-results-wrap" style="display:contents">
        <div style="flex:1;overflow:hidden;overflow-x:auto" data-act-clip>
          <table style="width:100%;border-collapse:collapse;table-layout:fixed">
            <thead><tr class="u-divider-b">
              <th style="padding:4px 8px 8px 0;width:22px"></th>
              <th style="padding:4px 8px 8px 0;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:left;width:300px">${this._t("actColTitle")}</th>
              ${visCols.map((c) => `<th style="${thSt};width:${COL_W[c.id] || 80}px">${c.label}</th>`).join("")}
              <th style="padding:4px 0 8px 8px;width:60px"></th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${PAG}
      </div>
    </div>`;
  }
  // ── History tab ──────────────────────────────────────────────────────────
  _actHistoryTabHtml(radarrData, sonarrData, filter, page, perPage) {
    const isMobile2 = this._isMob;
    const rRecords = radarrData?.records || [];
    const sRecords = sonarrData?.records || [];
    const mh = this._activityModal || {};
    const hSvc = mh.histFilterSvc || "all";
    const hSearch = (mh.histSearch || "").toLowerCase().trim();
    const histSort = mh.histSort || "date";
    const histSortDir = mh.histSortDir || "desc";
    const ALL_HIST_COLS = [
      { id: "event", label: this._t("actColEvent") },
      { id: "quality", label: this._t("actColQuality") },
      { id: "langs", label: this._t("actColLangs") },
      { id: "formats", label: this._t("actColFormats") },
      { id: "date", label: this._t("actColDate") },
      { id: "client", label: this._t("actColDlClient") },
      { id: "indexer", label: this._t("actColIndexer") },
      { id: "relgroup", label: this._t("actColRelgroup") },
      { id: "srctitle", label: this._t("actColSrcTitle") },
      { id: "cfscore", label: this._t("actColCfScore") }
    ];
    const HC = mh.histCols instanceof Set ? mh.histCols : /* @__PURE__ */ new Set(["event", "quality", "date"]);
    const visHistCols = ALL_HIST_COLS.filter((c) => HC.has(c.id));
    const allRaw = [
      ...rRecords.map((r) => ({ ...r, _svc: r._svc || "radarr", _title: r._enrichedTitle || r.movie?.title || r.sourceTitle || "" })),
      ...sRecords.map((r) => ({ ...r, _svc: r._svc || "sonarr", _title: r._enrichedTitle || r.series?.title || r.sourceTitle || "" }))
    ];
    const uniq = (arr, fn) => [...new Set(arr.map(fn).filter(Boolean))].sort();
    const mkItems = (ph, opts) => [["all", ph], ...opts.map((o) => [o, o])];
    const fQual = mh.histFilterQuality || "all";
    const fLang = mh.histFilterLang || "all";
    const fFmt = mh.histFilterFormat || "all";
    const fCli = mh.histFilterClient || "all";
    const fIdx = mh.histFilterIndexer || "all";
    const fRG = mh.histFilterRelgroup || "all";
    const hSels = [
      HC.has("event") && { id: "act-hist-filter", kind: "event", value: filter || "all", items: [["all", this._t("actAllEvents")], ["grabbed", this._t("actEvtGrabbed")], ["downloadFolderImported", this._t("actEvtImported")], ["downloadFailed", this._t("actEvtFailed")]] },
      { id: "act-hist-svc", kind: "source", value: hSvc, items: [["all", this._t("actAllSources")], ["radarr", this._instLabel("radarr")], ["sonarr", this._instLabel("sonarr")], ...this._lidarrConfigured !== false ? [["lidarr", "Lidarr"]] : []] },
      HC.has("quality") && { id: "act-hist-quality", kind: "quality", value: fQual, items: mkItems(this._t("actAllQualities"), uniq(allRaw, (r) => r.quality?.quality?.name)) },
      HC.has("langs") && { id: "act-hist-lang", kind: "langs", value: fLang, items: mkItems(this._t("actAllLanguages"), [...new Set(allRaw.flatMap((r) => (r.languages || []).map((l) => l.name)).filter(Boolean))].sort()) },
      HC.has("formats") && { id: "act-hist-format", kind: "formats", value: fFmt, items: mkItems(this._t("actAllFormats"), [...new Set(allRaw.flatMap((r) => (r.customFormats || []).map((cf) => cf.name)).filter(Boolean))].sort()) },
      HC.has("client") && { id: "act-hist-client", kind: "client", value: fCli, items: mkItems(this._t("actAllClients"), uniq(allRaw, (r) => r.data?.downloadClient)) },
      HC.has("indexer") && { id: "act-hist-indexer", kind: "indexer", value: fIdx, items: mkItems(this._t("actAllIndexers"), uniq(allRaw, (r) => r.data?.indexer)) },
      HC.has("relgroup") && { id: "act-hist-relgroup", kind: "relgroup", value: fRG, items: mkItems(this._t("actAllGroups"), uniq(allRaw, (r) => r.data?.releaseGroup)) }
    ].filter(Boolean);
    const toolbar = this._actBar("act-hist-search", mh.histSearch || "", hSels, "act-hist-cols-btn");
    const allFiltered = allRaw.filter((r) => {
      if (hSvc !== "all" && r._svc !== hSvc) return false;
      if (hSearch && !r._title.toLowerCase().includes(hSearch)) return false;
      if (fQual !== "all" && (r.quality?.quality?.name || "") !== fQual) return false;
      if (fLang !== "all" && !(r.languages || []).some((l) => l.name === fLang)) return false;
      if (fFmt !== "all" && !(r.customFormats || []).some((cf) => cf.name === fFmt)) return false;
      if (fCli !== "all" && (r.data?.downloadClient || "") !== fCli) return false;
      if (fIdx !== "all" && (r.data?.indexer || "") !== fIdx) return false;
      if (fRG !== "all" && (r.data?.releaseGroup || "") !== fRG) return false;
      return true;
    });
    const _sortFn = {
      title: (r) => r._title.toLowerCase(),
      event: (r) => r.eventType || "",
      quality: (r) => r.quality?.quality?.name || "",
      langs: (r) => r.languages?.[0]?.name || "",
      formats: (r) => r.customFormats?.[0]?.name || "",
      date: (r) => new Date(r.date || 0).getTime(),
      client: (r) => r.data?.downloadClient || "",
      indexer: (r) => r.data?.indexer || "",
      relgroup: (r) => r.data?.releaseGroup || "",
      srctitle: (r) => r.sourceTitle || "",
      cfscore: (r) => Number(r.data?.customFormatScore || 0)
    }[histSort];
    const allItems = [...allFiltered].sort((a, b) => {
      if (!_sortFn) return new Date(b.date) - new Date(a.date);
      const va = _sortFn(a), vb = _sortFn(b);
      if (va < vb) return histSortDir === "asc" ? -1 : 1;
      if (va > vb) return histSortDir === "asc" ? 1 : -1;
      return 0;
    });
    if (!allRaw.length) {
      return `<div class="u-col-fill">
        ${toolbar}
        <div style="text-align:center;color:var(--is-text-muted);padding:32px 20px">${this._t("actHistoryEmpty")}</div>
      </div>`;
    }
    const pg = Math.min(page || 0, Math.max(0, Math.ceil(allItems.length / perPage) - 1));
    const paged = allItems.slice(pg * perPage, (pg + 1) * perPage);
    const totPages = Math.max(1, Math.ceil(allItems.length / perPage));
    const pagHtml = totPages > 1 ? this._tlMobPag("act-hist-page", pg, totPages) : "";
    const evColor = (ev) => {
      if (ev === "grabbed") return "rgba(99,140,255,0.9)";
      if (ev === "downloadFolderImported") return "rgba(60,200,120,0.9)";
      if (ev === "downloadFailed" || ev === "importFailed") return "rgba(255,100,100,0.9)";
      return "rgba(255,255,255,0.45)";
    };
    const evLabel = (ev) => ({
      grabbed: this._t("actEvtGrabbed"),
      downloadFolderImported: this._t("actEvtImported"),
      downloadFailed: this._t("actEvtFailed"),
      importFailed: this._t("actEvtImportFailed"),
      downloadIgnored: this._t("actEvtIgnored"),
      movieDeleted: this._t("actEvtDeleted"),
      seriesDeleted: this._t("actEvtDeleted")
    })[ev] || ev || "\u2014";
    const fmtDate = (d) => {
      if (!d) return "\u2014";
      try {
        const dt = new Date(d);
        return dt.toLocaleDateString(void 0, { month: "short", day: "numeric" }) + "\xA0" + dt.toLocaleTimeString(void 0, { hour: "2-digit", minute: "2-digit" });
      } catch {
        return d;
      }
    };
    const srcFilmSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="2" y1="17" x2="7" y2="17"/></svg>`;
    const srcTvSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="15" rx="2"/><polyline points="8 21 12 17 16 21"/></svg>`;
    const HCOL_W = { title: 300, event: 90, quality: 80, langs: 80, formats: 90, date: 80, client: 100, indexer: 110, relgroup: 90, srctitle: 140, cfscore: 70 };
    const _sth = (id, label, pad0 = false) => {
      const active = histSort === id;
      const arrow = active ? `<span style="margin-left:2px">${histSortDir === "asc" ? "\u2191" : "\u2193"}</span>` : "";
      const w = HCOL_W[id] ? `width:${HCOL_W[id]}px;` : "";
      return `<th data-act-hist-sort="${id}" style="${w}padding:4px 8px 8px${pad0 ? " 0" : ""};font-size:10px;font-weight:600;color:${active ? "var(--is-text-body)" : "var(--is-text-muted)"};text-align:left;cursor:pointer;user-select:none;white-space:nowrap">${label}${arrow}</th>`;
    };
    if (isMobile2) {
      const rowsHtml = paged.map((r) => {
        const svcCol = this._actSrcColor(r._svc);
        const qualLblM = r.quality?.quality?.name || "";
        const hExtraTags = visHistCols.filter((c) => !["source", "quality", "event", "date"].includes(c.id)).map((col) => {
          let v = "";
          if (col.id === "langs") v = (r.languages || []).map((l) => l.name).join(", ");
          if (col.id === "formats") v = (r.customFormats || []).map((cf) => cf.name).join(", ");
          if (col.id === "client") v = r.data?.downloadClient || "";
          if (col.id === "indexer") v = r.data?.indexer || "";
          if (col.id === "relgroup") v = r.data?.releaseGroup || "";
          if (col.id === "srctitle") v = r.sourceTitle || "";
          if (col.id === "cfscore") v = r.data?.customFormatScore != null ? String(r.data.customFormatScore) : "";
          return v ? `<span class="u-xxs-muted">${v}</span>` : "";
        }).filter(Boolean).join("");
        return `<div style="padding:8px 0;border-bottom:1px solid var(--is-divider)">
          <div style="display:flex;align-items:flex-start;gap:8px">
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:600;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r._title}</div>
              <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
                <span style="color:var(--is-text-muted);display:flex;align-items:center">${this._actSrcIcon(r._svc)}</span>
                ${qualLblM ? `<span class="u-xxs-muted">${qualLblM}</span>` : ""}
                ${hExtraTags}
              </div>
            </div>
            <div style="flex-shrink:0;text-align:right;min-width:60px">
              <div style="font-size:11px;font-weight:700;color:var(--is-text)">${evLabel(r.eventType)}</div>
              <div style="font-size:9px;color:var(--is-text-muted);margin-top:2px">${fmtDate(r.date)}</div>
            </div>
          </div>
        </div>`;
      }).join("");
      return `<div class="u-col-fill">
        ${toolbar}
        <div class="act-hist-results-wrap" style="display:contents">
          <div class="u-flex-ovh" data-act-clip>${rowsHtml}</div>
          <div style="flex-shrink:0;padding-top:4px">${pagHtml}</div>
        </div>
      </div>`;
    }
    const rows = paged.map((r) => {
      const srcCell = `<td style="padding:7px 8px;text-align:center"><div style="display:flex;align-items:center;justify-content:center;gap:7px"><span style="color:var(--is-text-sec);display:flex;align-items:center">${this._actSrcIcon(r._svc)}</span><span style="font-size:10px;font-weight:600;color:var(--is-text-sec)">${this._instLabel(r._svc)}</span></div></td>`;
      const colTds = visHistCols.map((col) => {
        if (col.id === "event") return `<td style="padding:7px 8px;white-space:nowrap"><span style="font-size:10px;font-weight:600;color:var(--is-text-body)">${evLabel(r.eventType)}</span></td>`;
        if (col.id === "quality") {
          const q = r.quality?.quality?.name;
          return `<td class="u-cell-pad">${q ? this._uiBadge(q, "neutral") : "\u2014"}</td>`;
        }
        if (col.id === "langs") return `<td class="u-cell-pad">${(r.languages || []).map((l) => l.name).join(", ") || "\u2014"}</td>`;
        if (col.id === "formats") {
          const fmts = (r.customFormats || []).filter((cf) => cf.name);
          return `<td style="padding:7px 8px;overflow:hidden">${fmts.length ? `<div class="act-fmt-tags" style="display:flex;flex-wrap:wrap;align-content:flex-start;gap:3px;max-height:44px;overflow:hidden">${fmts.map((cf) => `<span class="act-fmt-tag ui-badge" style="--bdg:150,150,165">${this._escHtml(cf.name)}</span>`).join("")}</div>` : `<span class="u-xs-muted">\u2014</span>`}</td>`;
        }
        if (col.id === "date") return `<td style="padding:7px 8px;white-space:nowrap;font-size:10px;color:var(--is-text-muted)">${fmtDate(r.date)}</td>`;
        if (col.id === "client") return `<td class="u-cell-pad">${this._escHtml(r.data?.downloadClient || "\u2014")}</td>`;
        if (col.id === "indexer") return `<td style="padding:7px 8px;font-size:10px;color:var(--is-text-sec);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this._escHtml(r.data?.indexer || "\u2014")}</td>`;
        if (col.id === "relgroup") return `<td class="u-cell-pad">${this._escHtml(r.data?.releaseGroup || "\u2014")}</td>`;
        if (col.id === "srctitle") return `<td style="padding:7px 8px;font-size:10px;color:var(--is-text-muted);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this._escHtml(r.sourceTitle || "\u2014")}</td>`;
        if (col.id === "cfscore") return `<td class="u-cell-pad">${r.data?.customFormatScore ?? "\u2014"}</td>`;
        return "";
      }).join("");
      return `<tr class="u-divider-b">
        <td style="padding:7px 8px 7px 0;overflow:hidden"><div style="font-size:12px;font-weight:500;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r._title}</div></td>
        ${srcCell}${colTds}
      </tr>`;
    }).join("");
    return `<div class="u-col-fill">
      ${toolbar}
      <div class="act-hist-results-wrap" style="display:contents">
        <div style="flex:1;overflow:hidden;overflow-x:auto" data-act-clip>
          <table style="width:100%;border-collapse:collapse;table-layout:fixed">
            <thead><tr class="u-divider-b">
              ${_sth("title", this._t("actColTitle"), true)}
              <th style="width:70px;padding:4px 8px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:center">${this._t("actColSource")}</th>
              ${visHistCols.map((c) => _sth(c.id, c.label)).join("")}
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div style="flex-shrink:0;padding-top:4px">${pagHtml}</div>
      </div>
    </div>`;
  }
  // ── Blocklist tab ────────────────────────────────────────────────────────
  _actBlocklistTabHtml(radarrData, sonarrData, page, perPage) {
    const isMobile2 = this._isMob;
    const rRecords = radarrData?.records || [];
    const sRecords = sonarrData?.records || [];
    const mb = this._activityModal || {};
    const blSvc = mb.blFilterSvc || "all";
    const blProto = mb.blFilterProto || "all";
    const blSearch = (mb.blSearch || "").toLowerCase().trim();
    const blSort = mb.blSort || "date";
    const blSortDir = mb.blSortDir || "desc";
    const ALL_BL_COLS = [
      { id: "source", label: this._t("actColSource") },
      { id: "srctitle", label: this._t("actColSrcTitle") },
      { id: "langs", label: this._t("actColLangs") },
      { id: "quality", label: this._t("actColQuality") },
      { id: "formats", label: this._t("actColFormats") },
      { id: "date", label: this._t("actColDate") },
      { id: "indexer", label: this._t("actColIndexer") },
      { id: "protocol", label: this._t("actColProtocol") }
    ];
    const BC = mb.blCols instanceof Set ? mb.blCols : /* @__PURE__ */ new Set(["quality", "date", "source"]);
    const visBLCols = ALL_BL_COLS.filter((c) => BC.has(c.id));
    const allRaw = [
      ...rRecords.map((r) => ({ ...r, _svc: r._svc || "radarr", _title: r._enrichedTitle || r.movie?.title || r.sourceTitle || "\u2014" })),
      ...sRecords.map((r) => ({ ...r, _svc: r._svc || "sonarr", _title: r._enrichedTitle || r.series?.title || r.sourceTitle || "\u2014" }))
    ];
    const uniq = (arr, fn) => [...new Set(arr.map(fn).filter(Boolean))].sort();
    const mkItems = (ph, opts) => [["all", ph], ...opts.map((o) => [o, o])];
    const fQual = mb.blFilterQuality || "all";
    const fLang = mb.blFilterLang || "all";
    const fFmt = mb.blFilterFormat || "all";
    const fIdx = mb.blFilterIndexer || "all";
    const blSels = [
      { id: "act-bl-svc", kind: "source", value: blSvc, items: [["all", this._t("actAllSources")], ["radarr", this._instLabel("radarr")], ["sonarr", this._instLabel("sonarr")], ...this._lidarrConfigured !== false ? [["lidarr", "Lidarr"]] : []] },
      { id: "act-bl-proto", kind: "protocol", value: blProto, items: [["all", this._t("actAllProtocols")], ["torrent", "Torrent"], ["usenet", "Usenet"]] },
      BC.has("quality") && { id: "act-bl-quality", kind: "quality", value: fQual, items: mkItems(this._t("actAllQualities"), uniq(allRaw, (r) => r.quality?.quality?.name)) },
      BC.has("langs") && { id: "act-bl-lang", kind: "langs", value: fLang, items: mkItems(this._t("actAllLanguages"), [...new Set(allRaw.flatMap((r) => (r.languages || []).map((l) => l.name)).filter(Boolean))].sort()) },
      BC.has("formats") && { id: "act-bl-format", kind: "formats", value: fFmt, items: mkItems(this._t("actAllFormats"), [...new Set(allRaw.flatMap((r) => (r.customFormats || []).map((cf) => cf.name)).filter(Boolean))].sort()) },
      BC.has("indexer") && { id: "act-bl-indexer", kind: "indexer", value: fIdx, items: mkItems(this._t("actAllIndexers"), uniq(allRaw, (r) => r.indexer)) }
    ].filter(Boolean);
    const blToolbar = this._actBar("act-bl-search", mb.blSearch || "", blSels, "act-bl-cols-btn");
    const trashSvg = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`;
    const allFiltered = allRaw.filter((r) => {
      if (blSvc !== "all" && r._svc !== blSvc) return false;
      if (blProto !== "all" && (r.protocol || "").toLowerCase() !== blProto) return false;
      if (blSearch && !r._title.toLowerCase().includes(blSearch)) return false;
      if (fQual !== "all" && (r.quality?.quality?.name || "") !== fQual) return false;
      if (fLang !== "all" && !(r.languages || []).some((l) => l.name === fLang)) return false;
      if (fFmt !== "all" && !(r.customFormats || []).some((cf) => cf.name === fFmt)) return false;
      if (fIdx !== "all" && (r.indexer || "") !== fIdx) return false;
      return true;
    });
    const _blSortFn = {
      title: (r) => r._title.toLowerCase(),
      srctitle: (r) => r.sourceTitle || "",
      langs: (r) => (r.languages || [])[0]?.name || "",
      quality: (r) => r.quality?.quality?.name || "",
      formats: (r) => (r.customFormats || [])[0]?.name || "",
      date: (r) => new Date(r.date || 0).getTime(),
      indexer: (r) => r.indexer || "",
      protocol: (r) => r.protocol || "",
      source: (r) => r._svc
    }[blSort];
    const allSorted = [...allFiltered].sort((a, b) => {
      if (!_blSortFn) return new Date(b.date) - new Date(a.date);
      const va = _blSortFn(a), vb = _blSortFn(b);
      if (va < vb) return blSortDir === "asc" ? -1 : 1;
      if (va > vb) return blSortDir === "asc" ? 1 : -1;
      return 0;
    });
    if (!allRaw.length) {
      return `<div class="u-col-fill">
        ${blToolbar}
        <div style="text-align:center;color:var(--is-text-muted);padding:32px 20px">${this._t("actBlocklistEmpty")}</div>
      </div>`;
    }
    const pg = Math.min(page || 0, Math.max(0, Math.ceil(allSorted.length / perPage) - 1));
    const paged = allSorted.slice(pg * perPage, (pg + 1) * perPage);
    const totPages = Math.max(1, Math.ceil(allSorted.length / perPage));
    const pagHtml = totPages > 1 ? this._tlMobPag("act-bl-page", pg, totPages) : "";
    const fmtDate = (d) => {
      if (!d) return "\u2014";
      try {
        const dt = new Date(d);
        return dt.toLocaleDateString(this._locale, { month: "short", day: "numeric" }) + " " + dt.toLocaleTimeString(this._locale, { hour: "2-digit", minute: "2-digit" });
      } catch {
        return d;
      }
    };
    const srcFilmSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="2" y1="17" x2="7" y2="17"/></svg>`;
    const srcTvSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="15" rx="2"/><polyline points="8 21 12 17 16 21"/></svg>`;
    const BCOL_W = { title: 300, source: 70, srctitle: 140, langs: 80, quality: 80, formats: 90, date: 80, indexer: 110, protocol: 65 };
    const _bsth = (id, label, pad0 = false, center = false) => {
      const active = blSort === id;
      const arrow = active ? `<span style="margin-left:2px">${blSortDir === "asc" ? "\u2191" : "\u2193"}</span>` : "";
      const w = BCOL_W[id] ? `width:${BCOL_W[id]}px;` : "";
      return `<th data-act-bl-sort="${id}" style="${w}padding:4px 8px 8px${pad0 ? " 0" : ""};font-size:10px;font-weight:600;color:${active ? "var(--is-text-body)" : "var(--is-text-muted)"};text-align:${center ? "center" : "left"};cursor:pointer;user-select:none;white-space:nowrap">${label}${arrow}</th>`;
    };
    if (isMobile2) {
      const rowsHtml = paged.map((r) => {
        const svcCol = this._actSrcColor(r._svc);
        const rmBtn = this._mtRoundBtn(`class="act-bl-remove-btn" data-id="${r.id}" data-svc="${r._svc}"`, trashSvg, "Remove", { size: 24, tone: "red" });
        const dateShortBl = (() => {
          try {
            const dt = new Date(r.date);
            return dt.toLocaleDateString(this._locale, { month: "short", day: "numeric" });
          } catch {
            return fmtDate(r.date);
          }
        })();
        const blExtraTags = visBLCols.filter((c) => !["source", "quality", "date"].includes(c.id)).map((col) => {
          let v = "";
          if (col.id === "srctitle") v = r.sourceTitle || "";
          if (col.id === "langs") v = (r.languages || []).map((l) => l.name).join(", ");
          if (col.id === "formats") v = (r.customFormats || []).map((cf) => cf.name).join(", ");
          if (col.id === "indexer") v = r.indexer || "";
          if (col.id === "protocol") v = r.protocol || "";
          return v ? `<span class="u-xxs-muted">${v}</span>` : "";
        }).filter(Boolean).join("");
        return `<div style="padding:9px 0;border-bottom:1px solid var(--is-divider)">
          <div style="display:flex;align-items:flex-start;gap:8px">
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:600;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r._title}</div>
              <div style="display:flex;gap:6px;margin-top:3px">
                <span style="color:var(--is-text-muted);display:flex;align-items:center">${this._actSrcIcon(r._svc)}</span>
                <span class="u-xxs-muted">${r.quality?.quality?.name || "\u2014"}</span>
                ${blExtraTags}
              </div>
            </div>
            <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:4px;min-width:44px">
              <span style="font-size:11px;font-weight:600;color:var(--is-text-sec)">${dateShortBl}</span>
              ${rmBtn}
            </div>
          </div>
        </div>`;
      }).join("");
      return `<div class="u-col-fill">
        ${blToolbar}
        <div class="act-bl-results-wrap" style="display:contents">
          <div class="u-flex-ovh" data-act-clip>${rowsHtml}</div>
          <div style="flex-shrink:0;padding-top:4px">${pagHtml}</div>
        </div>
      </div>`;
    }
    const rows = paged.map((r) => {
      const rmBtn = this._mtRoundBtn(`class="act-bl-remove-btn" data-id="${r.id}" data-svc="${r._svc}"`, trashSvg, "Remove", { size: 24, tone: "red" });
      const colTds = visBLCols.map((col) => {
        if (col.id === "source") return `<td style="padding:7px 8px;text-align:center"><div style="display:flex;align-items:center;justify-content:center;gap:7px"><span style="color:var(--is-text-sec);display:flex;align-items:center">${this._actSrcIcon(r._svc)}</span><span style="font-size:10px;font-weight:600;color:var(--is-text-sec)">${this._instLabel(r._svc)}</span></div></td>`;
        if (col.id === "srctitle") return `<td style="padding:7px 8px;font-size:10px;color:var(--is-text-muted);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this._escHtml(r.sourceTitle || "\u2014")}</td>`;
        if (col.id === "langs") return `<td class="u-cell-pad">${(r.languages || []).map((l) => l.name).join(", ") || "\u2014"}</td>`;
        if (col.id === "quality") {
          const q = r.quality?.quality?.name;
          return `<td class="u-cell-pad">${q ? this._uiBadge(q, "neutral") : "\u2014"}</td>`;
        }
        if (col.id === "formats") {
          const fmts = (r.customFormats || []).filter((cf) => cf.name);
          return `<td style="padding:7px 8px;overflow:hidden">${fmts.length ? `<div class="act-fmt-tags" style="display:flex;flex-wrap:wrap;align-content:flex-start;gap:3px;max-height:44px;overflow:hidden">${fmts.map((cf) => `<span class="act-fmt-tag ui-badge" style="--bdg:150,150,165">${this._escHtml(cf.name)}</span>`).join("")}</div>` : `<span class="u-xs-muted">\u2014</span>`}</td>`;
        }
        if (col.id === "date") return `<td style="padding:7px 8px;white-space:nowrap;font-size:10px;color:var(--is-text-muted)">${fmtDate(r.date)}</td>`;
        if (col.id === "indexer") return `<td style="padding:7px 8px;font-size:10px;color:var(--is-text-sec);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this._escHtml(r.indexer || "\u2014")}</td>`;
        if (col.id === "protocol") return `<td class="u-cell-pad">${r.protocol || "\u2014"}</td>`;
        return "";
      }).join("");
      return `<tr class="u-divider-b">
        <td style="padding:7px 8px 7px 0;overflow:hidden"><div style="font-size:12px;font-weight:500;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r._title}</div></td>
        ${colTds}
        <td style="padding:7px 0 7px 8px;text-align:right">${rmBtn}</td>
      </tr>`;
    }).join("");
    const thRow = visBLCols.map((c) => _bsth(c.id, c.label, false, c.id === "source")).join("");
    return `<div class="u-col-fill">
      ${blToolbar}
      <div class="act-bl-results-wrap" style="display:contents">
        <div style="flex:1;overflow:hidden;overflow-x:auto" data-act-clip>
          <table style="width:100%;border-collapse:collapse;table-layout:fixed">
            <thead><tr class="u-divider-b">
              ${_bsth("title", this._t("actColTitle"), true)}
              ${thRow}
              <th style="padding:4px 0 8px 8px;width:36px"></th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div style="flex-shrink:0;padding-top:4px">${pagHtml}</div>
      </div>
    </div>`;
  }
  // ── Manual Import modal ──────────────────────────────────────────────────
  _actManualImportModalHtml(title) {
    return `<div class="popup-overlay${dayClass(this)}" data-mi-modal style="z-index:1100">
      <div class="popup-glass" style="width:min(1100px,98vw);max-height:85vh;display:flex;flex-direction:column">
        <div class="is-panel-hdr" style="padding:14px 20px 12px;gap:10px">
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:700;color:var(--is-text)">${this._t("actManualImport")}</div>
            <div style="font-size:11px;color:var(--is-text-sec);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" id="mi-subtitle">${this._escHtml(title)}</div>
          </div>
          <button class="popup-close u-rel-shrink0" id="mi-close">${ICONS.close}</button>
        </div>
        <div id="mi-body" class="popup-body" style="padding:14px 20px 18px;overflow-y:auto;flex:1">
          <div class="is-loading"><span>${this._t("loading")}</span></div>
        </div>
      </div>
    </div>`;
  }
  _actManualImportCandidatesHtml(candidates, svc, qDefs, langs) {
    if (!candidates || !candidates.length) {
      return `<div style="text-align:center;color:var(--is-text-muted);padding:32px 20px">
        <div style="font-size:13px">${this._t("actNoFiles")}</div>
        <div style="font-size:11px;margin-top:6px;opacity:0.6">${this._t("actNoFilesHint")}</div>
      </div>`;
    }
    const isMobile2 = this._isMob;
    const isRadarr = svc === "radarr" || svc === "radarr2";
    const isSonarr = svc === "sonarr" || svc === "sonarr2";
    const isDay = this._isDay;
    const SEL_STYle = (missing) => `color-scheme:${isDay ? "light" : "dark"};appearance:none;-webkit-appearance:none;padding:5px 24px 5px 8px;border-radius:6px;width:100%;box-sizing:border-box;font-size:11px;font-weight:600;cursor:pointer;outline:none;border:${missing ? "1px dashed rgba(248,113,113,0.8)" : "1px solid var(--is-divider)"};background-color:${missing ? "rgba(248,113,113,0.1)" : "var(--is-btn-bg)"};background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(128,128,128,0.7)' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 6px center;color:${missing ? "rgba(248,113,113,0.95)" : "var(--is-text)"};`;
    const lib = svc === "radarr" ? this._radarr || [] : svc === "radarr2" ? this._radarr2 || [] : svc === "sonarr" ? this._sonarr || [] : svc === "sonarr2" ? this._sonarr2 || [] : [];
    const buildLibOpts = (curId) => lib.slice().sort((a, b) => (a.title || "").localeCompare(b.title || "")).map((m) => `<option value="${m.id}"${m.id == curId ? " selected" : ""}>${this._escHtml(m.title || "\u2014")}${m.year ? ` (${m.year})` : ""}</option>`).join("");
    const buildQualOpts = (curId) => (qDefs || []).slice().sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)).map((d) => {
      const id = d.quality?.id ?? d.id;
      return `<option value="${id}"${id == curId ? " selected" : ""}>${this._escHtml(d.quality?.name || d.title || "\u2014")}</option>`;
    }).join("");
    const buildLangOpts = (curId) => (langs || []).filter((l) => l.id !== -1).slice().sort((a, b) => (a.name || "").localeCompare(b.name || "")).map((l) => `<option value="${l.id}"${l.id == curId ? " selected" : ""}>${this._escHtml(l.name || "\u2014")}</option>`).join("");
    const allCanImport = candidates.every((c) => {
      if (isRadarr && !c.movie) return false;
      if (isSonarr && !c.series) return false;
      const qName = c.quality?.quality?.name;
      if (!qName || qName === "Unknown") return false;
      const langName = c.languages?.[0]?.name;
      if (!c.languages?.length || !langName || langName === "Unknown") return false;
      return true;
    });
    const importBtn = `<button id="mi-import-all" data-ready="${allCanImport ? "1" : ""}" style="width:100%;margin-top:8px;padding:9px;border-radius:8px;border:none;background:${allCanImport ? "rgba(60,200,120,0.18)" : "var(--is-btn-bg)"};color:${allCanImport ? "rgba(80,220,140,0.95)" : "var(--is-text-muted)"};font-size:13px;font-weight:700;cursor:${allCanImport ? "pointer" : "not-allowed"};opacity:${allCanImport ? "1" : "0.5"}">${this._t("actImport")}</button>`;
    const mediaLabel = isRadarr ? this._t("typeMovie") : this._t("typeTv");
    const mediaField = isRadarr ? "movie" : "series";
    if (isMobile2) {
      const rows2 = candidates.map((c, i) => {
        const fname = (c.path || "").split(/[/\\]/).pop() || "\u2014";
        const curMovieId = isRadarr ? c.movie?.id ?? "" : c.series?.id ?? "";
        const movieMiss = isRadarr ? !c.movie : isSonarr ? !c.series : false;
        const curQualId = c.quality?.quality?.id ?? "";
        const qualName = c.quality?.quality?.name;
        const curLangId = c.languages?.[0]?.id ?? "";
        const rejLower = (c.rejections || []).map((r) => (r.reason || r || "").toLowerCase());
        const qualMiss = rejLower.some((r) => r.includes("quality")) || !qualName || qualName === "Unknown";
        const langMiss = rejLower.some((r) => r.includes("language")) || !c.languages?.length || c.languages[0]?.name === "Unknown";
        const rg = c.releaseGroup || "\u2014";
        const size = c.size ? this._actFmtSize(c.size) : "\u2014";
        const rej = (c.rejections || []).map((r) => r.reason || r).filter(Boolean);
        const lbl = (t) => `<div style="font-size:9px;font-weight:700;color:var(--is-text-muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:3px">${t}</div>`;
        const movieSel = `<select class="mi-field-sel" data-field="${mediaField}" data-idx="${i}" style="${SEL_STYle(movieMiss)}"><option value="" disabled hidden${curMovieId === "" ? " selected" : ""}>${this._t("actSelectMedia")}</option>${buildLibOpts(curMovieId)}</select>`;
        const qualSel = `<select class="mi-field-sel" data-field="quality" data-idx="${i}" style="${SEL_STYle(qualMiss)}"><option value="" disabled hidden${curQualId === "" || qualMiss ? " selected" : ""}>${this._t("actSelectQuality")}</option>${buildQualOpts(curQualId)}</select>`;
        const langSel = `<select class="mi-field-sel" data-field="language" data-idx="${i}" style="${SEL_STYle(langMiss)}"><option value="" disabled hidden${curLangId === "" || langMiss ? " selected" : ""}>${this._t("actSelectLanguage")}</option>${buildLangOpts(curLangId)}</select>`;
        return `<div data-mi-idx="${i}" style="border:1px solid var(--is-divider);border-radius:8px;padding:10px 12px;margin-bottom:8px;background:var(--is-btn-bg)">
          <div style="display:flex;flex-direction:column;gap:8px">
            <div>${lbl(mediaLabel)}${movieSel}</div>
            <div>${lbl(this._t("actQuality"))}${qualSel}</div>
            <div>${lbl(this._t("actLanguages"))}${langSel}</div>
            <div>${lbl(this._t("actReleaseGroup"))}<div style="font-size:11px;color:var(--is-text-sec);padding:5px 0">${this._escHtml(rg)}</div></div>
            <div>${lbl(this._t("actSize"))}<div style="font-size:11px;color:var(--is-text-sec);padding:5px 0">${size}</div></div>
            ${rej.length ? `<div>${lbl(this._t("actError"))}<div style="font-size:10px;color:rgba(255,160,80,0.9)">${this._escHtml(rej[0])}</div></div>` : ""}
          </div>
        </div>`;
      }).join("");
      return `<div>${rows2}${importBtn}</div>`;
    }
    const thStyle = `padding:4px 8px 8px 0;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:left;white-space:nowrap`;
    const rows = candidates.map((c, i) => {
      const curMovieId = isRadarr ? c.movie?.id ?? "" : c.series?.id ?? "";
      const movieMiss = isRadarr ? !c.movie : isSonarr ? !c.series : false;
      const curQualId = c.quality?.quality?.id ?? "";
      const qualName = c.quality?.quality?.name;
      const curLangId = c.languages?.[0]?.id ?? "";
      const rejLower = (c.rejections || []).map((r) => (r.reason || r || "").toLowerCase());
      const qualMiss = rejLower.some((r) => r.includes("quality")) || !qualName || qualName === "Unknown";
      const langMiss = rejLower.some((r) => r.includes("language")) || !c.languages?.length || c.languages[0]?.name === "Unknown";
      const rg = c.releaseGroup || "\u2014";
      const size = c.size ? this._actFmtSize(c.size) : "\u2014";
      const rej = (c.rejections || []).map((r) => r.reason || r).filter(Boolean);
      const movieSel = `<select class="mi-field-sel" data-field="${mediaField}" data-idx="${i}" style="${SEL_STYle(movieMiss)}"><option value="" disabled hidden${curMovieId === "" ? " selected" : ""}>${this._t("actSelectMedia")}</option>${buildLibOpts(curMovieId)}</select>`;
      const qualSel = `<select class="mi-field-sel" data-field="quality" data-idx="${i}" style="${SEL_STYle(qualMiss)}"><option value="" disabled hidden${curQualId === "" || qualMiss ? " selected" : ""}>${this._t("actSelectQuality")}</option>${buildQualOpts(curQualId)}</select>`;
      const langSel = `<select class="mi-field-sel" data-field="language" data-idx="${i}" style="${SEL_STYle(langMiss)}"><option value="" disabled hidden${curLangId === "" || langMiss ? " selected" : ""}>${this._t("actSelectLanguage")}</option>${buildLangOpts(curLangId)}</select>`;
      const rejHtml = rej.length ? `<span style="font-size:10px;color:rgba(255,160,80,0.9)">${this._escHtml(rej[0])}</span>` : `<span style="color:var(--is-text-muted);font-size:10px">\u2014</span>`;
      const epInfo = isSonarr && c.episodes?.length ? `${c.seasonNumber ?? "?"}x${String(c.episodes[0].episodeNumber ?? "?").padStart(2, "0")}` : "";
      const epTitle = isSonarr && c.episodes?.length ? c.episodes[0].title || "" : "";
      return `<tr class="u-divider-b">
        <td style="padding:7px 4px">${movieSel}</td>
        ${isSonarr ? `<td style="padding:7px 8px;font-size:11px;color:var(--is-text-sec);white-space:nowrap">${epInfo}</td>` : ""}
        ${isSonarr ? `<td style="padding:7px 8px;font-size:11px;color:var(--is-text-sec);overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${this._escHtml(epTitle)}</td>` : ""}
        <td style="padding:7px 8px;font-size:11px;color:var(--is-text-sec);overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${this._escHtml(rg)}</td>
        <td style="padding:7px 4px">${qualSel}</td>
        <td style="padding:7px 4px">${langSel}</td>
        <td style="padding:7px 8px;font-size:11px;color:var(--is-text-sec);white-space:nowrap">${size}</td>
        <td style="padding:7px 8px;overflow:hidden">${rejHtml}</td>
      </tr>`;
    }).join("");
    const cols = isSonarr ? `<col style="width:22%"><col style="width:7%"><col style="width:14%"><col style="width:9%"><col style="width:16%"><col style="width:13%"><col style="width:7%"><col style="width:12%">` : `<col style="width:32%"><col style="width:12%"><col style="width:18%"><col style="width:16%"><col style="width:8%"><col style="width:14%">`;
    const heads = isSonarr ? `<th style="${thStyle}">${mediaLabel}</th>
         <th style="${thStyle};padding-left:8px">Episode</th>
         <th style="${thStyle};padding-left:8px">Episode Title</th>
         <th style="${thStyle};padding-left:8px">${this._t("actReleaseGroup")}</th>
         <th style="${thStyle};padding-left:8px">${this._t("actQuality")}</th>
         <th style="${thStyle};padding-left:8px">${this._t("actLanguages")}</th>
         <th style="${thStyle};padding-left:8px">${this._t("actSize")}</th>
         <th style="${thStyle};padding-left:8px">${this._t("actError")}</th>` : `<th style="${thStyle}">${mediaLabel}</th>
         <th style="${thStyle};padding-left:8px">${this._t("actReleaseGroup")}</th>
         <th style="${thStyle};padding-left:8px">${this._t("actQuality")}</th>
         <th style="${thStyle};padding-left:8px">${this._t("actLanguages")}</th>
         <th style="${thStyle};padding-left:8px">${this._t("actSize")}</th>
         <th style="${thStyle};padding-left:8px">${this._t("actError")}</th>`;
    return `<div class="u-col">
      <table style="width:100%;border-collapse:collapse;table-layout:fixed">
        <colgroup>${cols}</colgroup>
        <thead><tr class="u-divider-b">${heads}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${importBtn}
    </div>`;
  }
  // ── Missing / Wanted poster card ─────────────────────────────────────────
  _actMissingCard() {
    const cache = this._actMissingCache;
    const movieCount = cache?.movieCount ?? null;
    const seriesCount = cache?.seriesCount ?? null;
    const badge = movieCount !== null ? this._uiBadge(String(movieCount + seriesCount), "amber", { extra: "flex-shrink:0", white: true }) : "";
    const filmSvg = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="2" y1="17" x2="7" y2="17"/></svg>`;
    const tvSvg = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="15" rx="2"/><polyline points="8 21 12 17 16 21"/></svg>`;
    const mkRow = (svg, label, count) => `<div class="u-row-6"><span style="opacity:0.6;flex-shrink:0;display:flex">${svg}</span><span style="font-size:10px;font-weight:600;color:var(--is-text-sec);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${label}</span><span style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.85);flex-shrink:0">${count}</span></div>`;
    const mkSubRow = (label, count) => `<div style="display:flex;align-items:center;gap:6px;padding-left:16px"><span style="font-size:9px;color:var(--is-text-muted);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${label}</span><span style="font-size:9px;font-weight:600;color:rgba(255,255,255,0.75);flex-shrink:0">${count}</span></div>`;
    let rows = "";
    if (cache && movieCount !== null) {
      const rRecs = cache.rRecs || [];
      const sRecs = cache.sRecs || [];
      const hasR2 = this._radarr2Configured === true;
      const hasS2 = this._sonarr2Configured === true;
      if (hasR2 || hasS2) {
        const r1 = rRecs.filter((r) => r._inst === "radarr").length;
        const r2 = rRecs.filter((r) => r._inst === "radarr2").length;
        const s1 = sRecs.filter((s) => s._inst === "sonarr").length;
        const s2 = sRecs.filter((s) => s._inst === "sonarr2").length;
        if (movieCount > 0) {
          rows += mkRow(filmSvg, this._t("tlFilterMovies"), movieCount);
          if (hasR2) {
            if (r1 > 0) rows += mkSubRow(this._instLabel("radarr"), r1);
            if (r2 > 0) rows += mkSubRow(this._instLabel("radarr2"), r2);
          }
        }
        if (seriesCount > 0) {
          rows += mkRow(tvSvg, this._t("tlFilterTvShows"), seriesCount);
          if (hasS2) {
            if (s1 > 0) rows += mkSubRow(this._instLabel("sonarr"), s1);
            if (s2 > 0) rows += mkSubRow(this._instLabel("sonarr2"), s2);
          }
        }
      } else {
        if (movieCount > 0) rows += mkRow(filmSvg, this._t("tlFilterMovies"), movieCount);
        if (seriesCount > 0) rows += mkRow(tvSvg, this._t("tlFilterTvShows"), seriesCount);
      }
    }
    const content = cache === void 0 || movieCount === null ? `<div style="font-size:9px;color:var(--is-text-muted);padding:8px 0">${this._t("loading")}</div>` : movieCount + seriesCount === 0 ? `<div style="font-size:9px;color:var(--is-text-muted);padding:8px 0">${this._t("actMissingEmpty")}</div>` : `<div style="display:flex;flex-direction:column;gap:4px;padding:4px 0">${rows}</div>`;
    return `<div class="tl-card u-sec-body" data-act-open="missing">
      <div class="u-bg-icon"><svg viewBox="0 0 24 24" width="130" height="130" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></div>
      <div class="u-row-sb-w">
        <span style="font-size:10px;font-weight:800;color:var(--is-text);background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);padding:2px 6px;border-radius:4px;line-height:1">${this._t("actMissing")}</span>
        ${badge}
      </div>
      <div class="u-flex-rel">${content}</div>
    </div>`;
  }
  // ── Missing tab ───────────────────────────────────────────────────────────
  _actMissingTabHtml(radarrMovies, sonarrSeries, page, perPage, cols) {
    const isMobile2 = this._isMob;
    const m = this._activityModal || {};
    const expanded = m.missingExpanded || /* @__PURE__ */ new Set();
    const rRows = (radarrMovies || []).map((r) => ({
      _svc: r._inst || "radarr",
      _displaySvc: "radarr",
      _id: r.id,
      _title: r.title || "\u2014",
      _year: r.year || "",
      _profile: r._profileName || "",
      _added: r.added || "",
      _monitored: r.monitored ?? true,
      _missing: null,
      _seasons: null,
      _tmdbId: r.tmdbId,
      _raw: r
    }));
    const snRows = (sonarrSeries || []).map((s) => {
      const allSeasons = (s.seasons || []).filter((ss) => ss.seasonNumber > 0).map((ss) => ss.seasonNumber).sort((a, b) => a - b);
      const seasonStr = allSeasons.length > 0 ? allSeasons.length <= 3 ? allSeasons.map((n) => `S${String(n).padStart(2, "0")}`).join(", ") : `S${String(allSeasons[0]).padStart(2, "0")}\u2013S${String(allSeasons[allSeasons.length - 1]).padStart(2, "0")}` : "";
      return {
        _svc: s._inst || "sonarr",
        _displaySvc: "sonarr",
        _id: s.id,
        _title: s.title || "\u2014",
        _year: s.year || "",
        _profile: s._profileName || "",
        _added: s.added || "",
        _monitored: s.monitored ?? true,
        _missing: s._missingCount || 0,
        _fileCount: s._fileCount || 0,
        _totalCount: s._totalCount || 0,
        _seasons: seasonStr,
        _tvdbId: s.tvdbId,
        _raw: s
      };
    });
    const all = [...rRows, ...snRows];
    const fSvc = m.missingFilterSvc || "all";
    const fProf = m.missingFilterProfile || "all";
    const fMon = m.missingFilterMonitored || "all";
    const mSearch = (m.missingSearch || "").toLowerCase().trim();
    const mSort = m.missingSort || "title";
    const mSortDir = m.missingSortDir || "asc";
    const filtered = all.filter((r) => {
      if (fSvc !== "all" && r._svc !== fSvc) return false;
      if (fProf !== "all" && r._profile !== fProf) return false;
      if (fMon !== "all" && (fMon === "monitored" ? !r._monitored : r._monitored)) return false;
      if (mSearch && !r._title.toLowerCase().includes(mSearch)) return false;
      return true;
    });
    const _sortFn = {
      title: (r) => r._title.toLowerCase(),
      year: (r) => r._year || 0,
      profile: (r) => r._profile.toLowerCase(),
      added: (r) => new Date(r._added || 0).getTime(),
      missing: (r) => r._missing ?? 0,
      monitored: (r) => r._monitored ? 0 : 1
    }[mSort] || ((r) => r._title.toLowerCase());
    const sorted = [...filtered].sort((a, b) => {
      const va = _sortFn(a), vb = _sortFn(b);
      if (va < vb) return mSortDir === "asc" ? -1 : 1;
      if (va > vb) return mSortDir === "asc" ? 1 : -1;
      return 0;
    });
    if (!all.length) {
      return `<div style="text-align:center;color:var(--is-text-muted);padding:40px 20px">${this._t("actMissingEmpty")}</div>`;
    }
    const pp = perPage || 15;
    const pg = Math.min(page || 0, Math.max(0, Math.ceil(sorted.length / pp) - 1));
    const paged = sorted.slice(pg * pp, (pg + 1) * pp);
    const totPages = Math.max(1, Math.ceil(sorted.length / pp));
    const pagHtml = totPages > 1 ? this._tlMobPag("act-missing-page", pg, totPages) : "";
    const PAG = `<div style="flex-shrink:0;padding-top:8px">${pagHtml}</div>`;
    const searchSvg = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    const srcFilmSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="2" y1="17" x2="7" y2="17"/></svg>`;
    const srcTvSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="15" rx="2"/><polyline points="8 21 12 17 16 21"/></svg>`;
    const searchSvgSm = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    const isSvgSm = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
    const asSvgSm = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    const ALL_MISSING_COLS = [
      { id: "monitored", label: this._t("actColMonitored") },
      { id: "source", label: this._t("actColSource") },
      { id: "year", label: this._t("actColYear") },
      { id: "profile", label: this._t("actColProfile") },
      { id: "added", label: this._t("actColAdded") },
      { id: "missing", label: this._t("actColMissingEps") }
    ];
    const C = cols instanceof Set ? cols : /* @__PURE__ */ new Set(["source", "year", "missing"]);
    const visCols = ALL_MISSING_COLS.filter((c) => C.has(c.id));
    const uniq = (arr, fn) => [...new Set(arr.map(fn).filter(Boolean))].sort();
    const _svcInstances = [
      { v: "radarr", lbl: this._instLabel("radarr"), has: all.some((r) => r._svc === "radarr") },
      { v: "radarr2", lbl: this._instLabel("radarr2"), has: all.some((r) => r._svc === "radarr2") },
      { v: "sonarr", lbl: this._instLabel("sonarr"), has: all.some((r) => r._svc === "sonarr") },
      { v: "sonarr2", lbl: this._instLabel("sonarr2"), has: all.some((r) => r._svc === "sonarr2") }
    ].filter((x) => x.has);
    const profOpts = uniq(all, (r) => r._profile);
    const mSels = [
      { id: "act-missing-svc", kind: "source", value: fSvc, items: [["all", this._t("actAllSources")], ..._svcInstances.map((x) => [x.v, x.lbl])] },
      { id: "act-missing-profile", kind: "profile", value: fProf, items: [["all", this._t("actAllProfiles")], ...profOpts.map((p) => [p, p])] },
      { id: "act-missing-monitored", kind: "monitored", value: fMon, items: [["all", this._t("actAllMonitored")], ["monitored", this._t("actMonitored")], ["unmonitored", this._t("actNotMonitored")]] }
    ];
    const fmtDate = (d) => {
      if (!d) return "\u2014";
      try {
        return new Date(d).toLocaleDateString(this._locale, { year: "numeric", month: "short", day: "numeric" });
      } catch {
        return d;
      }
    };
    const mToolbar = this._actBar("act-missing-search", m.missingSearch || "", mSels, "act-missing-cols-btn");
    const thSt = `padding:4px 8px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:left;white-space:nowrap`;
    const _mth = (id, label, pad0 = false) => {
      const active = mSort === id;
      const arrow = active ? `<span style="margin-left:2px">${mSortDir === "asc" ? "\u2191" : "\u2193"}</span>` : "";
      return `<th data-act-missing-sort="${id}" style="padding:4px 8px 8px${pad0 ? " 0" : ""};font-size:10px;font-weight:600;color:${active ? "var(--is-text-body)" : "var(--is-text-muted)"};text-align:left;cursor:pointer;user-select:none;white-space:nowrap">${label}${arrow}</th>`;
    };
    const chevDownSvg = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>`;
    const chevRightSvg = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18"/></svg>`;
    const chevDownSvgLg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>`;
    const chevRightSvgLg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18"/></svg>`;
    const _monBookmarkSvg = (mon) => mon ? `<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>` : `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
    const _monToggleBtn = (mon, attrs, extraStyle = "") => `<button class="act-mon-toggle" ${attrs} data-mon="${mon ? 1 : 0}" title="${mon ? this._t("actMonitored") : this._t("actNotMonitored")}" style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;border-radius:50%;cursor:pointer;padding:0;color:${mon ? "var(--is-text)" : "var(--is-text-muted)"};${extraStyle}">${_monBookmarkSvg(mon)}</button>`;
    const _seasonSubRows = (r, mobile) => {
      if (!r._raw?.seasons) return "";
      const seasons = (r._raw.seasons || []).filter((ss) => ss.seasonNumber > 0).map((ss) => ({ n: ss.seasonNumber, monitored: ss.monitored, missing: (ss.statistics?.totalEpisodeCount || 0) - (ss.statistics?.episodeFileCount || 0), total: ss.statistics?.totalEpisodeCount || 0 })).filter((ss) => ss.missing > 0).sort((a, b) => a.n - b.n);
      if (!seasons.length) return "";
      if (mobile) {
        return seasons.map((ss, i) => `<div data-act-season style="padding:5px 10px 5px 22px;${i < seasons.length - 1 ? "border-bottom:1px solid var(--is-divider)" : ""}">
          <div class="u-row-6">
            <span style="font-size:11px;font-weight:700;color:var(--is-text-sec);min-width:28px">S${String(ss.n).padStart(2, "0")}</span>
            <span style="font-size:10px;font-weight:700;color:#fb923c">${ss.total - ss.missing}/${ss.total}</span>
            <span style="flex:1"></span>
            ${_monToggleBtn(ss.monitored, `data-id="${r._id}" data-svc="${r._svc}" data-season="${ss.n}" data-kind="season"`)}
            ${this._mtRoundBtn(`class="act-missing-season-is-btn" data-id="${r._id}" data-svc="${r._svc}" data-season="${ss.n}" data-title="${this._escHtml(r._title)}"`, isSvgSm, `IS S${String(ss.n).padStart(2, "0")}`, { size: 22, tone: "blue" })}
            ${this._mtRoundBtn(`class="act-missing-as-btn" data-id="${r._id}" data-svc="${r._svc}" data-season="${ss.n}"`, asSvgSm, `AS S${String(ss.n).padStart(2, "0")}`, { size: 22, tone: "blue" })}
          </div>
        </div>`).join("");
      }
      return seasons.map((ss) => `<tr data-act-season style="background:rgba(255,255,255,0.015)">
        <td style="padding:0;width:24px"></td>
        <td style="padding:5px 8px;overflow:hidden;max-width:300px">
          <span style="font-size:11px;font-weight:700;color:var(--is-text-sec)">S${String(ss.n).padStart(2, "0")}</span>
        </td>
        ${visCols.map((col) => {
        if (col.id === "missing") return `<td style="padding:5px 8px;font-size:10px;font-weight:700;color:#fb923c">${ss.total - ss.missing}/${ss.total}</td>`;
        if (col.id === "monitored") {
          return `<td style="padding:4px 8px">${_monToggleBtn(ss.monitored, `data-id="${r._id}" data-svc="${r._svc}" data-season="${ss.n}" data-kind="season"`, "margin:0 auto")}</td>`;
        }
        return `<td style="padding:5px 8px"></td>`;
      }).join("")}
        <td style="padding:5px 10px 5px 8px;text-align:right;white-space:nowrap">
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:4px">
            ${this._mtRoundBtn(`class="act-missing-season-is-btn" data-id="${r._id}" data-svc="${r._svc}" data-season="${ss.n}" data-title="${this._escHtml(r._title)}"`, isSvgSm, `IS S${String(ss.n).padStart(2, "0")}`, { size: 22, tone: "blue" })}
            ${this._mtRoundBtn(`class="act-missing-as-btn" data-id="${r._id}" data-svc="${r._svc}" data-season="${ss.n}"`, asSvgSm, `AS S${String(ss.n).padStart(2, "0")}`, { size: 22, tone: "blue" })}
          </div>
        </td>
      </tr>`).join("");
    };
    if (isMobile2) {
      const rowsHtml = paged.map((r) => {
        const isSonarr = (r._displaySvc || r._svc) === "sonarr";
        const expandKey = isSonarr ? `${r._svc}_${r._id}` : null;
        const isExpanded = isSonarr && expanded.has(expandKey);
        const expandBtn = isSonarr ? `<button class="act-missing-expand-btn" data-key="${expandKey}" style="flex-shrink:0;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;cursor:pointer;color:var(--is-text-muted);padding:0">${isExpanded ? chevDownSvgLg : chevRightSvgLg}</button>` : "";
        const seasonRows = isExpanded ? _seasonSubRows(r, true) : "";
        const typeIcon = `<span style="flex-shrink:0;color:var(--is-text-muted);display:flex;align-items:center">${isSonarr ? srcTvSvg : srcFilmSvg}</span>`;
        const subParts = (() => {
          const lbl = r._svc === "radarr2" || r._svc === "sonarr2" ? this._instLabel(r._svc) : null;
          const miss = r._missing !== null ? isSonarr ? `<span style="font-weight:700">${r._fileCount || 0}/${r._totalCount || 0}</span>` : `<span style="color:#fb923c;font-weight:700">${r._missing}</span>` : null;
          return [lbl, r._profile, miss].filter(Boolean);
        })();
        return `<div style="padding:9px 0;border-bottom:1px solid var(--is-divider)">
          <div style="display:flex;align-items:flex-start;gap:6px">
            <div style="flex-shrink:0;width:24px;align-self:stretch;display:flex;align-items:center;justify-content:center">${expandBtn}</div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:5px;min-width:0">
                ${typeIcon}
                <span class="act-missing-info-btn" data-tmdb="${r._tmdbId || ""}" data-tvdb="${r._tvdbId || ""}" data-title="${this._escHtml(r._title)}" data-type="${isSonarr ? "sonarr" : "radarr"}" style="font-size:13px;font-weight:600;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0;cursor:pointer">${r._title}${r._year ? ` <span class="u-xs-muted">(${r._year})</span>` : ""}</span>
              </div>
              ${subParts.length ? `<div style="font-size:10px;color:var(--is-text-muted);margin-top:2px">${subParts.join(" \xB7 ")}</div>` : ""}
            </div>
            <div style="flex-shrink:0;align-self:stretch;display:flex;flex-direction:column;align-items:flex-end;justify-content:flex-end;gap:4px;margin-right:10px">
              ${_monToggleBtn(r._monitored, `data-id="${r._id}" data-svc="${r._svc}" data-kind="${isSonarr ? "series" : "movie"}"`)}
              <div style="display:flex;gap:4px;align-items:center">
                ${this._mtRoundBtn(`class="act-missing-is-btn" data-id="${r._id}" data-svc="${r._svc}" data-tmdb="${r._tmdbId || ""}" data-tvdb="${r._tvdbId || ""}" data-title="${this._escHtml(r._title)}"`, isSvgSm, "Interactive search", { size: 24, tone: "blue" })}
                ${this._mtRoundBtn(`class="act-missing-as-btn" data-id="${r._id}" data-svc="${r._svc}" data-tmdb="${r._tmdbId || ""}" data-tvdb="${r._tvdbId || ""}" data-title="${this._escHtml(r._title)}"`, asSvgSm, this._t("actAutoSearch"), { size: 24, tone: "blue" })}
              </div>
            </div>
          </div>
          ${seasonRows}
        </div>`;
      }).join("");
      return `<div class="u-col-fill">
        ${mToolbar}
        <div class="act-missing-results-wrap" style="display:contents">
          <div class="u-flex-ovh" data-act-clip data-act-notrim>${rowsHtml}</div>
          ${PAG}
        </div>
      </div>`;
    }
    const COL_W = { source: 70, year: 60, profile: 120, added: 100, missing: 75, monitored: 110 };
    const COL_ALIGN = { source: "center", monitored: "center", year: "left", profile: "left", added: "left", missing: "left" };
    const rows = paged.flatMap((r) => {
      const isSonarr = (r._displaySvc || r._svc) === "sonarr";
      const expandKey = isSonarr ? `${r._svc}_${r._id}` : null;
      const isExpanded = isSonarr && expanded.has(expandKey);
      const s0total = isSonarr ? (r._raw?.seasons || []).find((ss) => ss.seasonNumber === 0)?.statistics?.totalEpisodeCount || 0 : 0;
      const totalEp = isSonarr ? (r._raw?.statistics?.totalEpisodeCount || 0) - s0total : 0;
      const colTds = visCols.map((col) => {
        if (col.id === "source") {
          const lbl = this._instLabel(r._svc);
          return `<td style="padding:8px;text-align:center"><div style="display:flex;align-items:center;justify-content:center;gap:7px"><span style="color:var(--is-text-sec);display:flex;align-items:center">${isSonarr ? srcTvSvg : srcFilmSvg}</span><span style="font-size:10px;font-weight:600;color:var(--is-text-sec)">${lbl}</span></div></td>`;
        }
        if (col.id === "year") return `<td style="padding:8px;font-size:10px;color:var(--is-text-sec)">${r._year || "\u2014"}</td>`;
        if (col.id === "profile") return `<td style="padding:8px;font-size:10px;color:var(--is-text-sec);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px">${r._profile || "\u2014"}</td>`;
        if (col.id === "added") return `<td style="padding:8px;font-size:10px;color:var(--is-text-muted);white-space:nowrap">${fmtDate(r._added)}</td>`;
        if (col.id === "missing") return `<td style="padding:8px;font-size:10px;font-weight:700;color:${r._missing ? "#fb923c" : "var(--is-text-muted)"}">${r._missing !== null ? `${isSonarr ? totalEp - r._missing + "/" + totalEp : r._missing}` : "\u2014"}</td>`;
        if (col.id === "monitored") {
          return `<td style="padding:4px 8px">${_monToggleBtn(r._monitored, `data-id="${r._id}" data-svc="${r._svc}" data-kind="${isSonarr ? "series" : "movie"}"`, "margin:0 auto")}</td>`;
        }
        return "";
      }).join("");
      const expandBtn = isSonarr ? `<button class="act-missing-expand-btn" data-key="${expandKey}" style="flex-shrink:0;width:18px;height:18px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;cursor:pointer;color:var(--is-text-muted);padding:0">${isExpanded ? chevDownSvg : chevRightSvg}</button>` : "";
      const isBtn = `${this._mtRoundBtn(`class="act-missing-is-btn" data-id="${r._id}" data-svc="${r._svc}" data-tmdb="${r._tmdbId || ""}" data-tvdb="${r._tvdbId || ""}" data-title="${this._escHtml(r._title)}"`, isSvgSm, "Interactive search", { size: 24, tone: "blue" })}`;
      const autoSearchBtn = `${this._mtRoundBtn(`class="act-missing-as-btn" data-id="${r._id}" data-svc="${r._svc}" data-tmdb="${r._tmdbId || ""}" data-tvdb="${r._tvdbId || ""}" data-title="${this._escHtml(r._title)}"`, asSvgSm, this._t("actAutoSearch"), { size: 24, tone: "blue" })}`;
      const mainRow = `<tr style="border-bottom:${isExpanded ? "none" : "1px solid var(--is-divider)"}">
        <td style="padding:8px 0;width:24px;text-align:center">${expandBtn}</td>
        <td style="padding:8px 8px 8px 0;overflow:hidden;max-width:300px">
          <div class="act-missing-info-btn" data-tmdb="${r._tmdbId || ""}" data-tvdb="${r._tvdbId || ""}" data-title="${this._escHtml(r._title)}" data-type="${isSonarr ? "sonarr" : "radarr"}" style="font-size:12px;font-weight:600;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer">${r._title}${r._year ? ` <span class="u-xs-muted">(${r._year})</span>` : ""}</div>
        </td>
        ${colTds}
        <td style="padding:8px 10px 8px 8px;text-align:right;white-space:nowrap"><div style="display:flex;align-items:center;justify-content:flex-end;gap:4px">${isBtn}${autoSearchBtn}</div></td>
      </tr>`;
      const seasonTrs = isExpanded ? _seasonSubRows(r, false) : "";
      return [mainRow, seasonTrs];
    }).join("");
    return `<div class="u-col-fill">
      ${mToolbar}
      <div class="act-missing-results-wrap" style="display:contents">
        <div style="flex:1;overflow:hidden;overflow-x:auto" data-act-clip data-act-notrim>
          <table style="width:100%;border-collapse:collapse;table-layout:fixed">
            <thead><tr class="u-divider-b">
              <th style="padding:4px 0 8px;width:24px"></th>
              ${_mth("title", this._t("actColTitle"), true)}
              ${visCols.map((c) => `<th data-act-missing-sort="${c.id}" style="${thSt};text-align:${COL_ALIGN[c.id] || "left"};width:${COL_W[c.id] || 80}px;cursor:pointer;user-select:none">${c.label}${mSort === c.id ? `<span style="margin-left:2px">${mSortDir === "asc" ? "\u2191" : "\u2193"}</span>` : ""}</th>`).join("")}
              <th style="padding:4px 0 8px 8px;width:60px"></th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${PAG}
      </div>
    </div>`;
  }
  // ── Instance label helper ─────────────────────────────────────────────────
  // Returns seerr server name if configured, else "Radarr" / "Radarr 2" / …
  // Which app a row came from, as a glyph: a film strip, a set, or a note.
  _actSrcIcon(svc) {
    const F = 'width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"';
    if (svc === "lidarr") {
      return `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z"/></svg>`;
    }
    if (svc === "radarr" || svc === "radarr2") {
      return `<svg ${F}><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="2" y1="17" x2="7" y2="17"/></svg>`;
    }
    return `<svg ${F}><rect x="2" y="3" width="20" height="15" rx="2"/><polyline points="8 21 12 17 16 21"/></svg>`;
  }
  // Lidarr's own green, beside Radarr's blue and Sonarr's amber.
  _actSrcColor(svc) {
    if (svc === "lidarr") return "rgba(21,158,90,0.9)";
    return svc === "radarr" || svc === "radarr2" ? "rgba(99,140,255,0.85)" : "rgba(250,160,40,0.85)";
  }
  _instLabel(svc) {
    const defaults = { radarr: "Radarr", radarr2: "Radarr 2", sonarr: "Sonarr", sonarr2: "Sonarr 2", lidarr: "Lidarr" };
    if (this._overseerrConfigured !== false) {
      const map = { radarr: this._seerrRadarr, radarr2: this._seerrRadarr2, sonarr: this._seerrSonarr, sonarr2: this._seerrSonarr2 };
      const name = map[svc]?.name;
      if (name) return name;
    }
    return defaults[svc] || svc;
  }
  // ── Utility ──────────────────────────────────────────────────────────────
  _actFmtSize(bytes) {
    if (!bytes) return "\u2014";
    const gb = bytes / 1073741824;
    if (gb >= 1) return gb.toFixed(1) + "\xA0GB";
    return Math.round(bytes / 1048576) + "\xA0MB";
  }
};
var activityRenderMixin = _ActivityRenderMethods.prototype;


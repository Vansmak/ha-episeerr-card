
var _PW_TEST_ICO = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;
var _WireProwlarrMethods = class {
  _wireProwlarrPosters(right) {
    right.addEventListener("click", (e) => {
      const card = e.target.closest("[data-pw-open]");
      if (!card) return;
      this._openProwlarrModal(card.dataset.pwOpen);
    });
  }
  async _openProwlarrModal(tab) {
    this._markActivated();
    tab = tab || "indexers";
    this._prowlarrModal = { tab };
    this.shadowRoot.querySelector("[data-pw-modal]")?.remove();
    const wrap = document.createElement("div");
    wrap.innerHTML = this._pwModalHtml(tab);
    const el = wrap.firstElementChild;
    this.shadowRoot.appendChild(el);
    this._wireProwlarrModal(el);
    await this._pwLoadTab(tab, el);
  }
  _closeProwlarrModal() {
    this.shadowRoot.querySelector("[data-pw-modal]")?.remove();
    this._prowlarrModal = null;
  }
  _pwModalHtml(tab) {
    const _mob = isMobile();
    const hdrInner = `<div id="pw-nav-area" style="min-width:0;flex-shrink:${_mob ? 0 : 1};overflow:hidden">${this._pwNavHtml(tab)}</div>
         <div id="pw-status" style="flex-shrink:0;display:flex;align-items:center">${this._pwStatusHtml()}</div>
         <div style="flex:1;min-width:8px"></div>
         <div id="pw-hdr-act" style="display:flex;gap:${_mob ? 4 : 6}px;flex-shrink:0;align-items:center">${this._pwHdrActHtml(tab)}</div>
         <button class="popup-close" id="pw-close" style="position:relative;top:0;right:0;flex-shrink:0;align-self:center;margin-left:${_mob ? 2 : 4}px">${ICONS.close}</button>`;
    const hdrStyle = _mob ? "padding:12px 10px 10px;gap:5px;align-items:center" : "padding:14px 22px 10px;gap:12px;align-items:center";
    return `<div class="popup-overlay${dayClass(this)}" data-pw-modal>
      <div class="popup-glass tl-wide">
        <div class="is-panel-hdr" style="${hdrStyle}">${hdrInner}</div>
        <div class="popup-body" id="pw-body" style="padding:${_mob ? "12px 14px 16px" : "14px 22px 20px"};overflow:hidden">
          <div class="is-loading"><span>Loading\u2026</span></div>
        </div>
      </div>
    </div>`;
  }
  // What the bulk buttons are doing right now, told in the header rather than
  // inside a 30px circle that has no room for words.
  _pwStatusHtml() {
    const m = this._prowlarrModal;
    if (!m?._statusMsg) return "";
    const rgb = m._statusErr ? "248,113,113" : "52,211,153";
    const spin = m._statusSpin ? '<span class="is-spin" style="margin-right:6px;vertical-align:-1px"></span>' : "";
    const mob = this._isMob;
    const bg = mob ? this._isDay ? "#fafafc" : "#14141a" : `rgba(${rgb},0.12)`;
    const pos = mob ? "position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:1200;padding:6px 16px;box-shadow:0 6px 20px rgba(0,0,0,0.55)" : "margin-left:8px;padding:2px 12px";
    return `<span style="font-size:11px;font-weight:600;color:rgba(${rgb},0.9);background:${bg};border:1px solid rgba(${rgb},0.45);border-radius:999px;white-space:nowrap;flex-shrink:0;${pos}">${spin}${this._escHtml(m._statusMsg)}</span>`;
  }
  _pwShowStatus(msg, el, duration = 3e3, opts = {}) {
    const m = this._prowlarrModal;
    if (!m) return;
    m._statusMsg = msg;
    m._statusErr = !!opts.err;
    m._statusSpin = !!opts.spin;
    const host = (el || this.shadowRoot.querySelector("[data-pw-modal]"))?.querySelector("#pw-status");
    if (host) host.innerHTML = this._pwStatusHtml();
    clearTimeout(m._statusTimer);
    if (!duration) return;
    m._statusTimer = setTimeout(() => {
      if (this._prowlarrModal !== m) return;
      m._statusMsg = null;
      m._statusErr = false;
      m._statusSpin = false;
      const h2 = (el || this.shadowRoot.querySelector("[data-pw-modal]"))?.querySelector("#pw-status");
      if (h2) h2.innerHTML = this._pwStatusHtml();
    }, duration);
  }
  // Bulk actions for the current tab, parked in the modal header next to close —
  // the same place Maintainerr keeps New rule / Run all.
  _pwHdrActHtml(tab) {
    const S = this._isMob ? 28 : 30;
    const RELOAD = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;
    const PLAY2 = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="display:block"><polygon points="3,4 12,12 3,20"/><polygon points="13,4 22,12 13,20"/></svg>`;
    const PLUS = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="display:block"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    if (tab === "indexers") {
      return this._mtRoundBtn('id="pw-add-btn"', PLUS, "Add indexer", { size: S, tone: "blue" }) + this._mtRoundBtn('id="pw-testall-btn"', RELOAD, "Test all", { size: S, tone: "green" });
    }
    if (tab === "apps") {
      return this._mtRoundBtn('id="pw-app-add-btn"', PLUS, "Add application", { size: S, tone: "blue" }) + this._mtRoundBtn('id="pw-app-testall-btn"', RELOAD, "Test all", { size: S, tone: "green" }) + this._mtRoundBtn('id="pw-app-syncall-btn"', PLAY2, "Sync all", { size: S, tone: "green" });
    }
    return "";
  }
  // Header bulk buttons live outside the body, so they survive its re-renders —
  // bind once, and report the result as a glyph swap rather than a text label
  // (they are 30px circles now).
  _pwHdrBtn(el, id, handler) {
    const btn = el.querySelector(`#${id}`);
    if (!btn || btn._pwBound) return;
    btn._pwBound = true;
    btn.addEventListener("click", () => handler(btn));
  }
  _pwHdrBtnBusy(btn) {
    btn._pwIco = btn.innerHTML;
    btn._pwSty = btn.getAttribute("style");
    btn.disabled = true;
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:block;animation:btn-spin 0.65s linear infinite"><path d="M12 2a10 10 0 0 1 10 10"/></svg>`;
  }
  async _pwHdrBtnResult(btn, hasErrors) {
    btn.disabled = false;
    btn.innerHTML = hasErrors ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="display:block"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>` : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="20 6 9 17 4 12"/></svg>`;
    btn.style.background = hasErrors ? "rgba(255,100,100,0.18)" : "rgba(52,211,153,0.18)";
    btn.style.color = hasErrors ? "rgba(255,100,100,0.9)" : "rgba(52,211,153,0.9)";
    await new Promise((r) => setTimeout(r, 2e3));
    btn.innerHTML = btn._pwIco || btn.innerHTML;
    if (btn._pwSty != null) btn.setAttribute("style", btn._pwSty);
  }
  _pwNavHtml(tab) {
    const _mob = isMobile();
    const _ico = (d) => `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${d}</svg>`;
    const NAV = [
      { id: "indexers", label: "Indexers", icon: _ico('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>') },
      { id: "apps", label: _mob ? "Apps" : "Applications", icon: _ico('<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>') },
      { id: "history", label: "History", icon: _ico('<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>') },
      { id: "stats", label: "Statistics", icon: _ico('<line x1="6" y1="20" x2="6" y2="13"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="9"/>') }
    ];
    return `<div id="pw-nav" class="mt-nav"><span class="mt-nav-ind"></span>${NAV.map((g) => {
      const on = g.id === tab;
      return `<button class="mt-nav-btn${on ? " is-on" : ""}" data-pw-tab="${g.id}" title="${this._escHtml(g.label)}">${g.icon}${!_mob || on ? g.label : ""}</button>`;
    }).join("")}</div>`;
  }
  _wireProwlarrModal(el) {
    el.querySelector("#pw-close")?.addEventListener("click", () => this._closeProwlarrModal());
    el.addEventListener("click", (e) => {
      if (e.target === el) this._closeProwlarrModal();
    });
    el.querySelector("#pw-nav-area")?.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-pw-tab]");
      if (!btn || !this._prowlarrModal) return;
      const t = btn.dataset.pwTab;
      if (!t || t === this._prowlarrModal.tab) return;
      const from = this._navIndRect(el.querySelector("#pw-nav"));
      this._prowlarrModal.tab = t;
      el.querySelector("#pw-nav-area").innerHTML = this._pwNavHtml(t);
      const hdrAct = el.querySelector("#pw-hdr-act");
      if (hdrAct) hdrAct.innerHTML = this._pwHdrActHtml(t);
      const nav = el.querySelector("#pw-nav");
      this._syncNavInd(nav, nav?.querySelector(`.mt-nav-btn[data-pw-tab="${t}"]`), from);
      await this._pwLoadTab(t, el);
    });
    requestAnimationFrame(() => {
      const nav = el.querySelector("#pw-nav");
      this._syncNavInd(nav, nav?.querySelector(".mt-nav-btn.is-on"));
    });
  }
  async _pwLoadTab(tab, el) {
    const body = el.querySelector("#pw-body");
    if (!body || !this._prowlarrModal) return;
    body.style.display = "";
    body.style.flexDirection = "";
    body.innerHTML = '<div class="is-loading"><span>Loading\u2026</span></div>';
    if (tab === "indexers") {
      await this._pwLoadIndexers(body, el);
    } else if (tab === "stats") {
      await this._pwLoadStats(body, el);
    } else if (tab === "history") {
      await this._pwLoadHistory(body, el);
    } else if (tab === "apps") {
      await this._pwLoadApps(body, el);
    }
  }
  // ── Indexers tab ─────────────────────────────────────────────────────────
  async _pwLoadIndexers(body, el) {
    const m = this._prowlarrModal;
    if (!m) return;
    const indexers = this._prowlarr?.indexers || [];
    body.innerHTML = this._pwIndexersTabHtml(indexers, m);
    this._pwWireIndexers(body, el);
  }
  _pwIndexersTabHtml(indexers, m) {
    const isMob = isMobile();
    const search = (m?.idxSearch || "").toLowerCase();
    const filterPr = m?.idxFilterProtocol || "all";
    const filterSt = m?.idxFilterStatus || "all";
    const sortCol = m?.idxSort || "name";
    const sortDir = m?.idxSortDir || "asc";
    let rows = [...indexers];
    if (search) rows = rows.filter((i) => (i.name || "").toLowerCase().includes(search));
    if (filterPr !== "all") rows = rows.filter((i) => (i.protocol || "").toLowerCase() === filterPr);
    if (filterSt === "ok") rows = rows.filter((i) => i.enable && !i._status);
    if (filterSt === "error") rows = rows.filter((i) => i.enable && !!i._status);
    if (filterSt === "disabled") rows = rows.filter((i) => !i.enable);
    rows.sort((a, b) => {
      let va, vb;
      if (sortCol === "name") {
        va = (a.name || "").toLowerCase();
        vb = (b.name || "").toLowerCase();
      } else if (sortCol === "priority") {
        va = a.priority || 0;
        vb = b.priority || 0;
      } else if (sortCol === "added") {
        va = a.added || "";
        vb = b.added || "";
      } else if (sortCol === "queries") {
        va = a.numberOfQueries || 0;
        vb = b.numberOfQueries || 0;
      } else if (sortCol === "status") {
        va = a.enable ? a._status ? 1 : 0 : 2;
        vb = b.enable ? b._status ? 1 : 0 : 2;
      } else if (sortCol === "privacy") {
        va = (a.privacy || "").toLowerCase();
        vb = (b.privacy || "").toLowerCase();
      } else {
        va = 0;
        vb = 0;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    const _PW_ICO = {
      add: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
      test: `<svg width="17" height="12" viewBox="0 0 34 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block"><g transform="translate(-1.5 0) scale(0.72) translate(0 4.6)"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></g><g transform="translate(15.5 0) scale(0.72) translate(0 4.6)"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></g></svg>`,
      sync: `<svg width="17" height="12" viewBox="0 0 34 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block"><g transform="translate(-1.5 0) scale(0.72) translate(0 4.6)"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></g><g transform="translate(15.5 0) scale(0.72) translate(0 4.6)"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></g></svg>`,
      cols: `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18"/></svg>`
    };
    const DEFAULT_HIDDEN = /* @__PURE__ */ new Set(["queries", "vipExpiration", "minSeeders", "seedRatio", "seedTime", "packSeedTime", "preferMagnet", "tags"]);
    const hiddenCols = m?.idxHiddenCols ?? DEFAULT_HIDDEN;
    const showCat = !hiddenCols.has("categories");
    const showProt = !hiddenCols.has("protocol");
    const showQ = !hiddenCols.has("queries");
    const showPriv2 = !hiddenCols.has("privacy");
    const showPrio = !hiddenCols.has("priority");
    const showAdded = !hiddenCols.has("added");
    const showVip = !hiddenCols.has("vipExpiration");
    const showMinS = !hiddenCols.has("minSeeders");
    const showSeedR = !hiddenCols.has("seedRatio");
    const showSeedT = !hiddenCols.has("seedTime");
    const showPackT = !hiddenCols.has("packSeedTime");
    const showMagnet = !hiddenCols.has("preferMagnet");
    const showTags = !hiddenCols.has("tags");
    const toolbar = `<div style="flex-shrink:0;margin-bottom:6px;display:flex;align-items:center;gap:6px">${this._uiBar("pw-idx-search", m?.idxSearch || "", [
      { id: "pw-idx-proto", kind: "protocol", value: filterPr, items: [["all", "All protocols"], ["torrent", "Torrent"], ["usenet", "Usenet"]] },
      { id: "pw-idx-status", kind: "status", value: filterSt, items: [["all", "All status"], ["ok", "OK"], ["error", "Error"], ["disabled", "Disabled"]] }
    ], [
      { id: "pw-cols-btn", label: "Columns", icon: _PW_ICO.cols }
    ])}</div>`;
    if (!rows.length) {
      return `${toolbar}<div class="pw-idx-results-wrap" style="display:contents"><div class="u-empty-lg">No indexers match</div></div>`;
    }
    if (isMob) {
      const mobRows = rows.map((idx, i) => {
        const hasErr = idx.enable && !!idx._status;
        const isOff = !idx.enable;
        const dot = isOff ? "rgba(255,255,255,0.25)" : hasErr ? "rgba(255,100,100,0.9)" : "rgba(52,211,153,0.9)";
        const statusLbl = isOff ? "Disabled" : hasErr ? "Error" : "OK";
        const statusClr = isOff ? "var(--is-text-muted)" : hasErr ? "rgba(255,100,100,0.9)" : "rgba(52,211,153,0.9)";
        const errMsg = "";
        return `<div data-pw-idx-id="${idx.id}" style="padding:10px 0;border-bottom:1px solid var(--is-divider);cursor:pointer">
          <div class="u-row-8">
            <div style="width:8px;height:8px;border-radius:50%;background:${dot};flex-shrink:0"></div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:600;color:var(--is-text)">${this._escHtml(idx.name || "\u2014")}</div>
              <div style="font-size:10px;color:var(--is-text-muted);margin-top:1px">${(idx.protocol || "").toLowerCase()} \xB7 ${idx.numberOfGrabs || 0} grabs \xB7 ${idx.numberOfQueries || 0} queries</div>
              ${errMsg}
            </div>
            <div style="flex-shrink:0;display:flex;align-items:center;gap:6px">
                ${this._mtRoundBtn(`class="pw-test-btn" data-idx-id="${idx.id}"`, _PW_TEST_ICO, "Test", { size: 24, tone: "green" })}
                ${this._uiSwitch(`class="pw-toggle-btn" data-idx-id="${idx.id}" data-enabled="${idx.enable}"`, idx.enable, idx.enable ? "Disable" : "Enable")}
            </div>
          </div>
        </div>`;
      }).join("");
      return `${toolbar}<div class="pw-idx-results-wrap" style="display:contents"><div style="flex:1;overflow-y:auto">${mobRows}</div></div>`;
    }
    const showPriv = !hiddenCols.has("privacy");
    const CAT_PNAMES = { 1e3: "Console", 2e3: "Movies", 3e3: "Audio", 4e3: "PC", 5e3: "TV", 6e3: "XXX", 7e3: "Books", 8e3: "Other" };
    const mkCatChips = (idx) => {
      let cats = idx.categories;
      if (!Array.isArray(cats) || !cats.length) cats = idx.capabilities?.categories;
      if (!Array.isArray(cats) || !cats.length) return "";
      const flat = [];
      for (const c of cats) {
        flat.push(c);
        if (Array.isArray(c.subCategories)) for (const s of c.subCategories) flat.push(s);
      }
      const seen = /* @__PURE__ */ new Set();
      const deduped = flat.filter((c) => {
        const id = typeof c === "object" ? c?.id ?? 0 : Number(c);
        const g = Math.floor(id / 1e3) * 1e3;
        return seen.has(g) ? false : (seen.add(g), true);
      }).map((c) => {
        const id = typeof c === "object" ? c?.id ?? 0 : Number(c);
        const name = typeof c === "object" ? c?.name || CAT_PNAMES[Math.floor(id / 1e3) * 1e3] || String(id) : CAT_PNAMES[Math.floor(id / 1e3) * 1e3] || String(id);
        return { id, name };
      });
      const chipSpan = (n, extra = "") => this._uiBadge(this._escHtml(n), "neutral", { extra });
      return deduped.map((r) => chipSpan(r.name)).join("") + chipSpan("+0", "display:none").replace('class="ui-badge"', 'class="ui-badge pw-cat-more"');
    };
    const privBadge = (priv) => {
      const p = (priv || "").toLowerCase();
      const tone = p === "public" ? "green" : p === "semi-private" || p === "semiprivate" ? "amber" : "red";
      return this._uiBadge(this._escHtml(priv || "\u2014"), tone);
    };
    const fmtDate = (d) => {
      try {
        return new Date(d).toLocaleDateString(this._locale, { month: "short", day: "numeric", year: "2-digit" });
      } catch {
        return "\u2014";
      }
    };
    const fv = (idx, name) => {
      const f = (idx.fields || []).find((f2) => f2.name === name || f2.name === name.split(".").pop());
      return f?.value ?? null;
    };
    const th = (label, key, w, align) => {
      const active = sortCol === key;
      const al = align || "left";
      return `<th data-pw-sort="${key}" style="padding:4px 8px 8px;font-size:10px;font-weight:600;color:${active ? "var(--is-text-body)" : "var(--is-text-muted)"};text-align:${al};cursor:pointer;user-select:none;white-space:nowrap${w ? ";width:" + w : ""}">${label}${active ? `<span style="margin-left:2px">${sortDir === "asc" ? "\u2191" : "\u2193"}</span>` : ""}</th>`;
    };
    const td = (content, w, align) => `<td style="padding:8px;font-size:10px;color:var(--is-text-sec);overflow:hidden;text-overflow:ellipsis;white-space:nowrap${w ? ";width:" + w : ""}${align ? ";text-align:" + align : ""}">${content}</td>`;
    const desktopRows = rows.map((idx) => {
      const hasErr = idx.enable && !!idx._status;
      const isOff = !idx.enable;
      const statusLbl = isOff ? "Disabled" : hasErr ? "Error" : "OK";
      const statusClr = isOff ? "var(--is-text-muted)" : hasErr ? "rgba(255,100,100,0.9)" : "rgba(52,211,153,0.9)";
      const errMsg = "";
      const catChipsHtml = mkCatChips(idx);
      const minS = fv(idx, "minimumSeeders");
      const seedR = fv(idx, "seedRatio") ?? fv(idx, "seedCriteria.seedRatio");
      const seedT = fv(idx, "seedTime") ?? fv(idx, "seedCriteria.seedTime");
      const packT = fv(idx, "packSeedTime") ?? fv(idx, "seedCriteria.packSeedTime");
      const magnet = fv(idx, "preferMagnetUrl") ?? fv(idx, "preferMagnet");
      const idxTags = Array.isArray(idx.tags) && idx.tags.length ? idx.tags.join(", ") : "\u2014";
      return `<tr style="border-bottom:1px solid var(--is-divider);cursor:pointer" data-pw-idx-id="${idx.id}">
        <td style="padding:8px;white-space:nowrap;overflow:hidden;width:65px"><span style="font-size:10px;font-weight:600;color:${statusClr}">${statusLbl}</span></td>
        <td style="padding:8px;overflow:hidden">
          <div style="font-size:12px;font-weight:600;color:var(--is-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this._escHtml(idx.name || "\u2014")}</div>
          ${errMsg}
        </td>
        ${showProt ? td((idx.protocol || "\u2014").toLowerCase(), "65px") : ""}
        ${showQ ? td(idx.numberOfQueries || 0, "65px", "right") : ""}
        ${showPriv2 ? `<td style="padding:8px;overflow:hidden;width:95px">${privBadge(idx.privacy)}</td>` : ""}
        ${showPrio ? td(idx.priority || "\u2014", "55px", "right") : ""}
        ${showAdded ? td(idx.added ? fmtDate(idx.added) : "\u2014", "80px") : ""}
        ${showVip ? td(idx.vipExpiration ? fmtDate(idx.vipExpiration) : "\u2014", "80px") : ""}
        ${showMinS ? td(minS != null ? minS : "\u2014", "60px", "right") : ""}
        ${showSeedR ? td(seedR != null ? seedR : "\u2014", "60px", "right") : ""}
        ${showSeedT ? td(seedT != null ? seedT + "m" : "\u2014", "60px", "right") : ""}
        ${showPackT ? td(packT != null ? packT + "m" : "\u2014", "70px", "right") : ""}
        ${showMagnet ? td(magnet != null ? magnet ? "Yes" : "No" : "\u2014", "60px") : ""}
        ${showTags ? td(this._escHtml(idxTags), "80px") : ""}
        ${showCat ? `<td style="padding:8px;overflow:hidden"><div class="pw-cats" style="display:flex;align-items:center;gap:4px;height:20px;overflow:hidden">${catChipsHtml || '<span class="u-xs-muted">\u2014</span>'}</div></td>` : ""}
        <td style="padding:8px;width:52px;vertical-align:middle">
          <div style="display:flex;justify-content:center;align-items:center;height:100%">
            ${this._uiSwitch(`class="pw-toggle-btn" data-idx-id="${idx.id}" data-enabled="${idx.enable}"`, idx.enable, idx.enable ? "Disable" : "Enable")}
          </div>
        </td>
        <td style="padding:8px;width:52px;vertical-align:middle">
          <div style="display:flex;justify-content:center;align-items:center;height:100%">
            ${this._mtRoundBtn(`class="pw-test-btn" data-idx-id="${idx.id}"`, _PW_TEST_ICO, "Test", { size: 24, tone: "green" })}
          </div>
        </td>
      </tr>`;
    }).join("");
    return `${toolbar}
    <div class="pw-idx-results-wrap" style="display:contents">
    <div class="u-flex-ovh">
      <table style="width:100%;border-collapse:collapse;table-layout:fixed">
        <thead><tr class="u-divider-b">
          ${th("Status", "status", "65px")}
          <th data-pw-sort="name" style="padding:4px 8px 8px;font-size:10px;font-weight:600;color:${sortCol === "name" ? "var(--is-text-body)" : "var(--is-text-muted)"};text-align:left;cursor:pointer;user-select:none;white-space:nowrap">Name${sortCol === "name" ? `<span style="margin-left:2px">${sortDir === "asc" ? "\u2191" : "\u2193"}</span>` : ""}</th>
          ${showProt ? `<th style="padding:4px 8px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:left;width:65px;white-space:nowrap">Protocol</th>` : ""}
          ${showQ ? th("Queries", "queries", "65px", "right") : ""}
          ${showPriv2 ? `<th style="padding:4px 8px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:left;width:95px;white-space:nowrap">Privacy</th>` : ""}
          ${showPrio ? th("Priority", "priority", "55px", "right") : ""}
          ${showAdded ? th("Added", "added", "80px") : ""}
          ${showVip ? `<th style="padding:4px 8px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:left;width:80px;white-space:nowrap">VIP Exp.</th>` : ""}
          ${showMinS ? `<th style="padding:4px 8px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:right;width:60px;white-space:nowrap">Min.Seeds</th>` : ""}
          ${showSeedR ? `<th style="padding:4px 8px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:right;width:60px;white-space:nowrap">Seed R.</th>` : ""}
          ${showSeedT ? `<th style="padding:4px 8px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:right;width:60px;white-space:nowrap">Seed T.</th>` : ""}
          ${showPackT ? `<th style="padding:4px 8px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:right;width:70px;white-space:nowrap">Pack Seed</th>` : ""}
          ${showMagnet ? `<th style="padding:4px 8px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:left;width:60px;white-space:nowrap">Magnet</th>` : ""}
          ${showTags ? `<th style="padding:4px 8px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:left;width:80px;white-space:nowrap">Tags</th>` : ""}
          ${showCat ? `<th style="padding:4px 8px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:left;white-space:nowrap">Categories</th>` : ""}
          <th style="padding:4px 8px 8px;width:52px"></th>
          <th style="padding:4px 8px 8px;width:52px"></th>
        </tr></thead>
        <tbody>${desktopRows}</tbody>
      </table>
    </div>
    </div>`;
  }
  _pwIndexerActionBtns(idx, compact) {
    const trashSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`;
    const editSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    const testSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    const spinSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:btn-spin 0.65s linear infinite"><path d="M12 2a10 10 0 0 1 10 10"/></svg>`;
    const toggleSvg = idx.enable ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="3" fill="currentColor"/></svg>` : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="8" cy="12" r="3" fill="currentColor"/></svg>`;
    return `<div style="display:inline-flex;gap:4px;align-items:center">${this._mtRoundBtn(`class="pw-delete-btn" data-idx-id="${idx.id}" data-name="${this._escHtml(idx.name || "")}"`, trashSvg, "Delete", { size: 24, tone: "red" })}</div>`;
  }
  // Category chips are emitted in full; here we hide the ones that don't fit and
  // surface the count on a trailing "+N" chip, so the row never wraps or clips.
  _pwFitCatChips(body) {
    for (const wrap of body.querySelectorAll(".pw-cats")) {
      const more = wrap.querySelector(".pw-cat-more");
      const chips = [...wrap.children].filter((c) => c !== more);
      if (!more || !chips.length) continue;
      for (const c of chips) c.style.display = "";
      more.style.display = "none";
      if (wrap.scrollWidth <= wrap.clientWidth) continue;
      let hidden = 0;
      more.style.display = "";
      for (let i = chips.length - 1; i >= 0; i--) {
        chips[i].style.display = "none";
        hidden++;
        more.textContent = `+${hidden}`;
        if (wrap.scrollWidth <= wrap.clientWidth) break;
      }
      if (hidden === 0) more.style.display = "none";
    }
  }
  _pwWireIndexers(body, el) {
    if (!this._prowlarrModal) return;
    requestAnimationFrame(() => this._pwFitCatChips(body));
    body.querySelector("#pw-idx-search")?.addEventListener("input", (e) => {
      if (!this._prowlarrModal) return;
      this._prowlarrModal.idxSearch = e.target.value;
      this._patchResultsWrap(body, "pw-idx-results-wrap", () => this._pwIndexersTabHtml(this._prowlarr?.indexers || [], this._prowlarrModal));
      this._pwWireIndexers(body, el);
    });
    body.querySelector("#pw-idx-proto")?.addEventListener("change", (e) => {
      if (!this._prowlarrModal) return;
      this._prowlarrModal.idxFilterProtocol = e.target.value;
      body.innerHTML = this._pwIndexersTabHtml(this._prowlarr?.indexers || [], this._prowlarrModal);
      this._pwWireIndexers(body, el);
    });
    body.querySelector("#pw-idx-status")?.addEventListener("change", (e) => {
      if (!this._prowlarrModal) return;
      this._prowlarrModal.idxFilterStatus = e.target.value;
      body.innerHTML = this._pwIndexersTabHtml(this._prowlarr?.indexers || [], this._prowlarrModal);
      this._pwWireIndexers(body, el);
    });
    body.querySelectorAll("[data-pw-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        if (!this._prowlarrModal) return;
        const col = th.dataset.pwSort;
        if (this._prowlarrModal.idxSort === col) {
          this._prowlarrModal.idxSortDir = this._prowlarrModal.idxSortDir === "asc" ? "desc" : "asc";
        } else {
          this._prowlarrModal.idxSort = col;
          this._prowlarrModal.idxSortDir = col === "name" ? "asc" : "desc";
        }
        body.innerHTML = this._pwIndexersTabHtml(this._prowlarr?.indexers || [], this._prowlarrModal);
        this._pwWireIndexers(body, el);
      });
    });
    body.querySelector("#pw-cols-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const existing = el.querySelector("#pw-cols-dropdown");
      if (existing) {
        existing.remove();
        return;
      }
      if (!this._prowlarrModal) return;
      const _DEFAULT_HIDDEN = /* @__PURE__ */ new Set(["queries", "vipExpiration", "minSeeders", "seedRatio", "seedTime", "packSeedTime", "preferMagnet", "tags"]);
      const hidden = this._prowlarrModal.idxHiddenCols ?? _DEFAULT_HIDDEN;
      const cols = [
        { key: "protocol", label: "Protocol" },
        { key: "queries", label: "Queries" },
        { key: "privacy", label: "Privacy" },
        { key: "priority", label: "Priority" },
        { key: "added", label: "Added" },
        { key: "vipExpiration", label: "VIP Expiration" },
        { key: "minSeeders", label: "Min. Seeders" },
        { key: "seedRatio", label: "Seed Ratio" },
        { key: "seedTime", label: "Seed Time" },
        { key: "packSeedTime", label: "Pack Seed Time" },
        { key: "preferMagnet", label: "Prefer Magnet" },
        { key: "tags", label: "Tags" },
        { key: "categories", label: "Categories" }
      ];
      const btn = body.querySelector("#pw-cols-btn");
      const rect = btn?.getBoundingClientRect();
      const items = cols.map((col) => {
        const checked = !hidden.has(col.key);
        return `<label style="display:flex;align-items:center;gap:8px;padding:6px 14px;cursor:pointer;font-size:12px;color:var(--is-text);white-space:nowrap">
          <input type="checkbox" data-col="${col.key}" ${checked ? "checked" : ""} style="cursor:pointer;accent-color:var(--is-accent,#0a84ff)"> ${col.label}
        </label>`;
      }).join("");
      const dd = document.createElement("div");
      dd.id = "pw-cols-dropdown";
      dd.setAttribute("class", dayClass(this).trim());
      dd.style.cssText = `position:absolute;background:var(--is-menu-bg);border:1px solid var(--is-btn-bdr);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.5);z-index:1200;padding:6px 0;min-width:150px;color:var(--is-text)`;
      if (rect) {
        dd.style.top = rect.bottom + 4 + "px";
        dd.style.left = rect.left + "px";
      }
      dd.innerHTML = items;
      dd.querySelectorAll("input[data-col]").forEach((inp) => {
        inp.addEventListener("change", () => {
          if (!this._prowlarrModal) return;
          if (!this._prowlarrModal.idxHiddenCols) this._prowlarrModal.idxHiddenCols = new Set(_DEFAULT_HIDDEN);
          if (inp.checked) this._prowlarrModal.idxHiddenCols.delete(inp.dataset.col);
          else this._prowlarrModal.idxHiddenCols.add(inp.dataset.col);
          body.innerHTML = this._pwIndexersTabHtml(this._prowlarr?.indexers || [], this._prowlarrModal);
          this._pwWireIndexers(body, el);
        });
      });
      const closeDD = (ev) => {
        if (!dd.contains(ev.target) && ev.target !== btn) {
          dd.remove();
          el.removeEventListener("click", closeDD, true);
        }
      };
      setTimeout(() => el.addEventListener("click", closeDD, true), 0);
      el.appendChild(dd);
    });
    this._pwHdrBtn(el, "pw-add-btn", () => this._pwOpenAddIndexer(el));
    this._pwHdrBtn(el, "pw-testall-btn", async (btn) => {
      this._pwHdrBtnBusy(btn);
      const _n = (this._prowlarr?.indexers || []).filter((i) => i.enable).length;
      this._pwShowStatus(`Testing ${_n} indexer${_n === 1 ? "" : "s"}\u2026`, el, 0, { spin: true });
      let hasErrors = false;
      try {
        await this._callApi("POST", "arr_stack/prowlarr/idxtestall");
        const [indexers, status] = await Promise.all([
          this._callApi("GET", "arr_stack/prowlarr/indexers"),
          this._callApi("GET", "arr_stack/prowlarr/indexerstatus")
        ]);
        const statusMap = {};
        for (const s of status || []) statusMap[s.indexerId] = s;
        if (this._prowlarr) this._prowlarr.indexers = (indexers || []).map((i) => ({ ...i, _status: statusMap[i.id] || null }));
        hasErrors = (this._prowlarr?.indexers || []).some((i) => i.enable && i._status);
      } catch (_) {
        hasErrors = true;
      }
      if (!this._prowlarrModal) return;
      const _bad = (this._prowlarr?.indexers || []).filter((i) => i.enable && i._status).length;
      this._pwShowStatus(hasErrors ? `${_bad || 1} indexer${_bad === 1 ? "" : "s"} failed` : "All indexers OK", el, 4e3, { err: hasErrors });
      await this._pwHdrBtnResult(btn, hasErrors);
      if (!this._prowlarrModal) return;
      body.innerHTML = this._pwIndexersTabHtml(this._prowlarr?.indexers || [], this._prowlarrModal);
      this._pwWireIndexers(body, el);
    });
    body.addEventListener("click", async (e) => {
      if (!this._prowlarrModal) return;
      const testBtn = e.target.closest(".pw-test-btn");
      if (testBtn) {
        e.stopPropagation();
        const id = testBtn.dataset.idxId;
        const idx = (this._prowlarr?.indexers || []).find((i) => String(i.id) === String(id));
        if (!idx) return;
        testBtn.disabled = true;
        testBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:btn-spin 0.65s linear infinite"><path d="M12 2a10 10 0 0 1 10 10"/></svg>`;
        try {
          await this._callApi("POST", `arr_stack/prowlarr/idxtest?id=${idx.id || 0}`, {});
          testBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(52,211,153,0.9)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
        } catch (_) {
          testBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,100,100,0.9)" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        }
        testBtn.disabled = false;
        return;
      }
      const toggleBtn = e.target.closest(".pw-toggle-btn");
      if (toggleBtn) {
        e.stopPropagation();
        const id = toggleBtn.dataset.idxId;
        const idx = (this._prowlarr?.indexers || []).find((i) => String(i.id) === String(id));
        if (!idx) return;
        toggleBtn.disabled = true;
        toggleBtn.style.background = "rgba(150,150,165,0.4)";
        toggleBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" style="animation:btn-spin 0.65s linear infinite;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"><path d="M12 2a10 10 0 0 1 10 10"/></svg>`;
        const updated = { ...idx, enable: !idx.enable };
        try {
          await this._callApi("PUT", `arr_stack/prowlarr/indexer/${id}`, updated);
          idx.enable = !idx.enable;
          await new Promise((r) => setTimeout(r, 1e3));
          const status = await this._callApi("GET", "arr_stack/prowlarr/indexerstatus").catch(() => []);
          const sm = {};
          for (const s of status || []) sm[s.indexerId] = s;
          (this._prowlarr?.indexers || []).forEach((i) => {
            i._status = sm[i.id] || null;
          });
        } catch (_) {
        }
        if (!this._prowlarrModal) return;
        body.innerHTML = this._pwIndexersTabHtml(this._prowlarr?.indexers || [], this._prowlarrModal);
        this._pwWireIndexers(body, el);
        return;
      }
      const editBtn = e.target.closest(".pw-edit-btn");
      if (editBtn) {
        e.stopPropagation();
        const id = editBtn.dataset.idxId;
        await this._pwOpenEditIndexer(id, el);
        return;
      }
      const delBtn = e.target.closest(".pw-delete-btn");
      if (delBtn) {
        e.stopPropagation();
        const id = delBtn.dataset.idxId;
        const name = delBtn.dataset.name;
        this._confirmInline(delBtn, () => this._pwDeleteIndexer(id, name, body, el), "Delete indexer?");
        return;
      }
      const row = e.target.closest("[data-pw-idx-id]");
      if (row && !e.target.closest("button")) {
        const id = row.dataset.pwIdxId;
        await this._pwOpenEditIndexer(id, el);
      }
    });
  }
  // Confirmation happens in the row before this is called.
  async _pwDeleteIndexer(id, name, body, el) {
    try {
      await this._callApi("DELETE", `arr_stack/prowlarr/indexer/${id}`);
      if (this._prowlarr) this._prowlarr.indexers = (this._prowlarr.indexers || []).filter((i) => String(i.id) !== String(id));
    } catch (err) {
      alert("Delete failed: " + (err?.body?.message || String(err)));
      return;
    }
    if (!this._prowlarrModal) return;
    body.innerHTML = this._pwIndexersTabHtml(this._prowlarr?.indexers || [], this._prowlarrModal);
    this._pwWireIndexers(body, el);
  }
  // ── Apps tab ─────────────────────────────────────────────────────────────
  async _pwLoadApps(body, el) {
    const m = this._prowlarrModal;
    if (!m) return;
    try {
      const [apps, appProfiles, cats] = await Promise.all([
        this._callApi("GET", "arr_stack/prowlarr/applications").catch(() => []),
        this._callApi("GET", "arr_stack/prowlarr/appprofiles").catch(() => []),
        this._callApi("GET", "arr_stack/prowlarr/categories").catch(() => [])
      ]);
      if (!this._prowlarrModal) return;
      if (this._prowlarr) this._prowlarr.apps = apps || [];
      m.appsData = apps || [];
      m.appsProfiles = appProfiles || [];
      m.appsCategories = cats || [];
      if (this._prowlarr?.appTestResults) m.appTestResults = this._prowlarr.appTestResults;
    } catch (_) {
      if (!this._prowlarrModal) return;
      m.appsData = [];
      m.appsProfiles = [];
      m.appsCategories = [];
    }
    body.innerHTML = this._pwAppsTabHtml(m);
    this._pwWireApps(body, el);
    this._pwAutoTestApps(body, el);
  }
  async _pwAutoTestApps(body, el) {
    const m = this._prowlarrModal;
    const apps = m?.appsData || [];
    if (!apps.length || !this._prowlarr) return;
    if (!this._prowlarr.appTestResults) this._prowlarr.appTestResults = {};
    m.appTestResults = this._prowlarr.appTestResults;
    await Promise.all(apps.map(async (app) => {
      try {
        const r = await this._callApi("POST", "arr_stack/prowlarr/apptest", app);
        this._prowlarr.appTestResults[app.id] = { ok: r?.ok !== false, errors: r?.errors || [] };
      } catch (_) {
        this._prowlarr.appTestResults[app.id] = { ok: false, errors: [] };
      }
    }));
    if (!this._prowlarrModal) return;
    body.innerHTML = this._pwAppsTabHtml(this._prowlarrModal);
    this._pwWireApps(body, el);
    const posterEl = this.shadowRoot?.querySelector('[data-pw-open="apps"]');
    if (posterEl) {
      const tmp = document.createElement("div");
      tmp.innerHTML = this._pwAppsCard();
      const newEl = tmp.firstElementChild;
      if (newEl) posterEl.replaceWith(newEl);
    }
  }
  _pwAppsTabHtml(m) {
    const apps = m?.appsData || [];
    const appProfiles = m?.appsProfiles || [];
    const testResults = m?.appTestResults || this._prowlarr?.appTestResults || {};
    const isMob = isMobile();
    const getField = (app, name) => {
      const f = (app.fields || []).find((f2) => f2.name === name);
      return f?.value || "";
    };
    const getProfileName = (id) => appProfiles.find((p) => p.id === id)?.name || `Profile ${id}`;
    const syncBadge = (level) => {
      const lv = level || "";
      const lvl = lv.toLowerCase();
      const tone = lvl === "fullsync" ? "green" : lvl === "addonly" ? "amber" : "neutral";
      const label = lvl === "fullsync" ? "Full Sync" : lvl === "addonly" ? "Add Only" : lvl === "disabled" ? "Disabled" : lv || "\u2014";
      return this._uiBadge(label, tone);
    };
    const IMPL_COLORS = { radarr: "#34d399", sonarr: "#638cff", lidarr: "#fbbf24", readarr: "#a855f7", whisparr: "#f87171", mylar3: "#60a5fa", lazylibrarian: "#fb923c" };
    const implBadge = (app) => {
      const name = app.implementationName || app.implementation || "App";
      const c = IMPL_COLORS[name.toLowerCase()] || "#9ca3af";
      return this._uiBadge(this._escHtml(name), this._hexToRgbTriple(c));
    };
    const statusDot = (id) => {
      const r = testResults[id];
      if (!r) return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:rgba(200,200,200,0.25)" title="Not tested"></span>`;
      return r.ok ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:rgba(52,211,153,0.85)" title="OK"></span>` : `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:rgba(255,100,100,0.85)" title="${this._escHtml((r.errors || []).map((e) => e.errorMessage).join(", ").substring(0, 80))}"></span>`;
    };
    const toolbar = "";
    if (!apps.length) {
      return `${toolbar}<div class="u-empty-lg">No apps configured</div>`;
    }
    if (isMob) {
      const mobRows = apps.map((app, i) => {
        const sep = i > 0 ? "border-top:1px solid var(--is-divider);" : "";
        const url = getField(app, "baseUrl");
        const tr = testResults[app.id];
        const errMsg = tr && !tr.ok ? `<div style="font-size:10px;color:rgba(255,120,80,0.8);margin-top:2px">${this._escHtml((tr.errors || []).map((e) => e.errorMessage).join(", ").substring(0, 80))}</div>` : "";
        const mobToggle = this._uiSwitch(`class="pw-app-toggle-btn" data-app-id="${app.id}" data-enabled="${app.enable}"`, app.enable, app.enable ? "Disable" : "Enable");
        return `<div data-pw-app-id="${app.id}" style="${sep}padding:10px 0;cursor:pointer">
          <div class="u-row-8">
            ${statusDot(app.id)}
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px">${this._escHtml(app.name || "\u2014")}</div>
              <div style="font-size:10px;color:var(--is-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._escHtml(url || "\u2014")}</div>
              ${errMsg}
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
              ${syncBadge(app.syncLevel)}
              ${mobToggle}
            </div>
          </div>
        </div>`;
      }).join("");
      return `${toolbar}<div style="flex:1;overflow-y:auto">${mobRows}</div>`;
    }
    const th = (label, w, align) => `<th style="padding:4px 8px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:${align || "left"};white-space:nowrap${w ? ";width:" + w : ""}">${label}</th>`;
    const td = (content, w, align) => `<td style="padding:8px;font-size:10px;color:var(--is-text-sec);overflow:hidden;text-overflow:ellipsis;white-space:nowrap${w ? ";width:" + w : ""}${align ? ";text-align:" + align : ""}">${content}</td>`;
    const rows = apps.map((app) => {
      const url = getField(app, "baseUrl");
      const toggleBtn = this._uiSwitch(`class="pw-app-toggle-btn" data-app-id="${app.id}" data-enabled="${app.enable}"`, app.enable, app.enable ? "Disable" : "Enable");
      return `<tr data-pw-app-id="${app.id}" style="border-bottom:1px solid var(--is-divider);cursor:pointer">
        <td style="padding:8px;width:18px;vertical-align:middle">${statusDot(app.id)}</td>
        <td style="padding:8px;overflow:hidden">
          <div style="font-size:12px;font-weight:600;color:var(--is-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this._escHtml(app.name || "\u2014")}</div>
        </td>
        ${td(this._escHtml(url || "\u2014"))}
        <td style="padding:8px">${syncBadge(app.syncLevel)}</td>
        ${td(this._escHtml(getProfileName(app.appProfileId)), "100px")}
        <td style="padding:8px;width:52px;vertical-align:middle">
          <div style="display:flex;justify-content:center;align-items:center;height:100%">${toggleBtn}</div>
        </td>
      </tr>`;
    }).join("");
    return `${toolbar}<div class="u-flex-ovh">
      <table style="width:100%;border-collapse:collapse;table-layout:fixed">
        <thead><tr class="u-divider-b">
          ${th("", "18px")}
          <th style="padding:4px 8px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:left">Name</th>
          ${th("URL")}${th("Sync", "90px")}${th("Profile", "100px")}${th("Enable", "52px", "center")}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }
  _pwWireApps(body, el) {
    if (!this._prowlarrModal) return;
    this._pwHdrBtn(el, "pw-app-add-btn", () => this._pwOpenAddApp(el));
    this._pwHdrBtn(el, "pw-app-testall-btn", async (btn) => {
      this._pwHdrBtnBusy(btn);
      const apps = this._prowlarrModal?.appsData || [];
      this._pwShowStatus(`Testing ${apps.length} application${apps.length === 1 ? "" : "s"}\u2026`, el, 0, { spin: true });
      if (!this._prowlarr.appTestResults) this._prowlarr.appTestResults = {};
      if (this._prowlarrModal) this._prowlarrModal.appTestResults = this._prowlarr.appTestResults;
      await Promise.all(apps.map(async (app) => {
        try {
          const r = await this._callApi("POST", "arr_stack/prowlarr/apptest", app);
          this._prowlarr.appTestResults[app.id] = { ok: r?.ok !== false, errors: r?.errors || [] };
        } catch (_) {
          this._prowlarr.appTestResults[app.id] = { ok: false, errors: [] };
        }
      }));
      if (!this._prowlarrModal) return;
      const hasErrors = Object.values(this._prowlarr.appTestResults).some((r) => !r.ok);
      const failed = Object.values(this._prowlarr.appTestResults).filter((r) => !r.ok).length;
      this._pwShowStatus(hasErrors ? `${failed} application${failed === 1 ? "" : "s"} failed` : "All applications OK", el, 4e3, { err: hasErrors });
      await this._pwHdrBtnResult(btn, hasErrors);
      if (!this._prowlarrModal) return;
      body.innerHTML = this._pwAppsTabHtml(this._prowlarrModal);
      this._pwWireApps(body, el);
    });
    this._pwHdrBtn(el, "pw-app-syncall-btn", async (btn) => {
      this._pwHdrBtnBusy(btn);
      const apps = this._prowlarrModal?.appsData || [];
      this._pwShowStatus(`Syncing ${apps.length} application${apps.length === 1 ? "" : "s"}\u2026`, el, 0, { spin: true });
      let hasErrors = false;
      await Promise.all(apps.map(async (app) => {
        try {
          await this._callApi("POST", `arr_stack/prowlarr/appsync/${app.id}`);
        } catch (_) {
          hasErrors = true;
        }
      }));
      if (!this._prowlarrModal) return;
      this._pwShowStatus(hasErrors ? "Sync failed" : "Sync done", el, 4e3, { err: hasErrors });
      await this._pwHdrBtnResult(btn, hasErrors);
    });
    body.addEventListener("click", async (e) => {
      if (!this._prowlarrModal) return;
      const toggleBtn = e.target.closest(".pw-app-toggle-btn");
      if (toggleBtn) {
        e.stopPropagation();
        const id = parseInt(toggleBtn.dataset.appId);
        const app = (this._prowlarrModal.appsData || []).find((a) => a.id === id);
        if (!app) return;
        toggleBtn.disabled = true;
        toggleBtn.style.background = "rgba(150,150,165,0.4)";
        toggleBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" style="animation:btn-spin 0.65s linear infinite;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"><path d="M12 2a10 10 0 0 1 10 10"/></svg>`;
        const updated = { ...app, enable: !app.enable };
        try {
          await this._callApi("PUT", `arr_stack/prowlarr/applications/${id}`, updated);
          app.enable = !app.enable;
        } catch (_) {
        }
        if (!this._prowlarrModal) return;
        body.innerHTML = this._pwAppsTabHtml(this._prowlarrModal);
        this._pwWireApps(body, el);
        return;
      }
      const row = e.target.closest("[data-pw-app-id]");
      if (row && !e.target.closest("button")) {
        const id = parseInt(row.dataset.pwAppId);
        const app = (this._prowlarrModal.appsData || []).find((a) => a.id === id);
        if (app) await this._pwOpenAppForm(id, app, false, this._prowlarrModal.appsProfiles || [], this._prowlarrModal.appsCategories || [], el);
      }
    });
  }
  async _pwOpenAddApp(parentEl) {
    const m = this._prowlarrModal;
    if (!m) return;
    let schemas = m.appsSchemas;
    if (!schemas) {
      try {
        schemas = m.appsSchemas = await this._callApi("GET", "arr_stack/prowlarr/applications/schema") || [];
      } catch (_) {
        schemas = [];
      }
    }
    const appProfiles = m.appsProfiles || [];
    const categories = m.appsCategories || [];
    const IMPL_COLORS = { radarr: "#34d399", sonarr: "#638cff", lidarr: "#fbbf24", readarr: "#a855f7", whisparr: "#f87171", mylar3: "#60a5fa", lazylibrarian: "#fb923c" };
    const items = schemas.map((s) => {
      const c = IMPL_COLORS[(s.implementationName || "").toLowerCase()] || "#9ca3af";
      return `<div data-pw-app-impl="${this._escHtml(s.implementation || "")}" class="pw-app-impl-item"
        style="padding:11px 16px;border:1px solid var(--is-divider);border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:10px"
        onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background=''">
        <div style="width:8px;height:8px;border-radius:50%;background:${c};flex-shrink:0"></div>
        <span style="font-size:13px;font-weight:600;color:var(--is-text)">${this._escHtml(s.implementationName || s.implementation || "\u2014")}</span>
      </div>`;
    }).join("");
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div class="popup-overlay${dayClass(this)}" data-pw-app-list style="z-index:1200">
      <div class="popup-glass" style="width:min(380px,94vw);max-height:80vh">
        <div class="is-panel-hdr" style="padding:14px 22px 12px;gap:12px">
          <div style="flex:1;font-size:15px;font-weight:700;color:var(--is-text)">Add App</div>
          <button class="popup-close u-rel-shrink0" id="pw-applist-close">${ICONS.close}</button>
        </div>
        <div class="popup-body" style="padding:14px 22px 20px;overflow-y:auto;display:flex;flex-direction:column;gap:6px">
          ${items || '<div style="color:var(--is-text-muted);text-align:center;padding:24px">No app schemas available</div>'}
        </div>
      </div>
    </div>`;
    const overlay = wrap.firstElementChild;
    overlay.querySelector("#pw-applist-close")?.addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });
    overlay.querySelectorAll(".pw-app-impl-item").forEach((item) => {
      item.addEventListener("click", async () => {
        const impl = item.dataset.pwAppImpl;
        const schema = schemas.find((s) => s.implementation === impl);
        if (!schema) return;
        overlay.remove();
        const initData = {
          ...schema,
          id: 0,
          name: schema.implementationName || schema.implementation || "",
          enable: true,
          syncLevel: "FullSync",
          syncCategories: [2e3, 5e3, 3e3, 4e3, 1e3, 7e3, 8e3],
          appProfileId: appProfiles[0]?.id || 1,
          tags: []
        };
        await this._pwOpenAppForm(null, initData, true, appProfiles, categories, parentEl);
      });
    });
    this.shadowRoot.appendChild(overlay);
  }
  async _pwOpenAppForm(id, data, isNew, appProfiles, categories, parentEl) {
    const isMob = isMobile();
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div class="popup-overlay${dayClass(this)}" data-pw-app-form style="z-index:1200">
      <div class="popup-glass" style="width:min(620px,96vw);max-height:90vh">
        <div class="is-panel-hdr" style="padding:14px ${isMob ? 16 : 22}px 12px;gap:12px">
          <div style="flex:1;font-size:15px;font-weight:700;color:var(--is-text)">${isNew ? "Add App" : "Edit App"} \u2014 ${this._escHtml(data.implementationName || data.implementation || data.name || "")}</div>
          <button class="popup-close u-rel-shrink0" id="pw-af-close">${ICONS.close}</button>
        </div>
        <div class="popup-body" id="pw-af-body" style="padding:${isMob ? "12px 14px" : "14px 22px"};overflow-y:auto">
          ${this._pwAppFormHtml(data, {}, isNew, appProfiles, categories)}
        </div>
      </div>
    </div>`;
    const el = wrap.firstElementChild;
    el.querySelector("#pw-af-close")?.addEventListener("click", () => el.remove());
    el.addEventListener("click", (e) => {
      if (e.target === el) el.remove();
    });
    this.shadowRoot.appendChild(el);
    this._pwWireAppForm(el, id, data, isNew, parentEl, appProfiles, categories);
  }
  _pwAppFormHtml(data, errors, isNew, appProfiles, categories) {
    const isMob = isMobile();
    const fields = data.fields || [];
    const inputSty = "width:100%";
    const _chk = (attrs, checked, label) => `<label class="mt-chk">
      <input ${attrs} type="checkbox"${checked ? " checked" : ""}>
      <span class="mt-chk-box">${_ICO_CHECK}</span>
      ${label ? `<span class="mt-chk-lbl">${label}</span>` : ""}
    </label>`;
    const row = (label, field) => isMob ? `<div style="margin-bottom:12px"><div style="font-size:11px;font-weight:600;color:var(--is-text-muted);margin-bottom:4px">${label}</div>${field}</div>` : `<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px">
             <div style="width:140px;flex-shrink:0;font-size:11px;font-weight:600;color:var(--is-text-muted);padding-top:7px;text-align:right">${label}</div>
             <div style="flex:1;min-width:0">${field}</div>
           </div>`;
    const nameRow = row("Name", `<input id="pw-af-name" type="text" value="${this._escHtml(data.name || "")}" class="mt-field" style="${inputSty}">`);
    const enableRow = `<div style="margin-bottom:12px">${_chk('id="pw-af-enable"', data.enable !== false, "Enabled")}</div>`;
    const appProfileRow = appProfiles.length > 0 ? row("App Profile", this._mtFieldSelect(
      "pw-af-appprofile",
      appProfiles.map((p) => [p.id, p.name || "Profile " + p.id]),
      data.appProfileId || appProfiles[0]?.id,
      inputSty
    )) : "";
    const syncLevels = [["fullSync", "Full Sync"], ["addOnly", "Add Only"], ["disabled", "Disabled"]];
    const curSync = (data.syncLevel || "fullSync").toLowerCase();
    const syncLevelRow = row("Sync Level", this._mtFieldSelect(
      "pw-af-synclevel",
      syncLevels,
      syncLevels.find(([v]) => v.toLowerCase() === curSync)?.[0] || "fullSync",
      inputSty
    ));
    const selectedCats = data.syncCategories || [];
    const CAT_COLORS = { 2e3: "#34d399", 5e3: "#638cff", 3e3: "#fbbf24", 1e3: "#a855f7", 4e3: "#60a5fa", 6e3: "#f87171", 7e3: "#b48c64", 8e3: "#9ca3af" };
    const catTree = categories.map((cat) => {
      const subs = cat.subCategories || [];
      const isChecked = selectedCats.includes(cat.id);
      const color = CAT_COLORS[cat.id] || "#9ca3af";
      const subHtml = subs.map((sub) => `<div style="padding-left:20px">${_chk(`class="pw-cat-cb" data-cat-id="${sub.id}"`, selectedCats.includes(sub.id), this._escHtml(sub.name || String(sub.id)))}</div>`).join("");
      return `<div style="border-bottom:1px solid rgba(255,255,255,0.06);padding:4px 0">
        <div style="display:flex;align-items:center;gap:8px;padding:2px 0${subs.length ? ";cursor:pointer" : ""}" class="${subs.length ? "pw-cat-toggle" : ""}">
          ${_chk(`class="pw-cat-cb" data-cat-id="${cat.id}" onclick="event.stopPropagation()"`, isChecked, "")}
          <div style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></div>
          <span style="font-size:12px;font-weight:600;color:var(--is-text);flex:1">${this._escHtml(cat.name || String(cat.id))}</span>
          ${subs.length ? `<svg class="pw-cat-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--is-text-muted)" stroke-width="2.5" style="transition:transform 0.15s;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>` : ""}
        </div>
        ${subs.length ? `<div class="pw-cat-subs" style="display:none">${subHtml}</div>` : ""}
      </div>`;
    }).join("");
    const catPanel = categories.length > 0 ? row("Sync Categories", `<div style="border:1px solid var(--is-card-bdr,rgba(255,255,255,0.09));border-radius:16px;max-height:180px;overflow-y:auto;padding:6px 12px;background:rgba(255,255,255,0.04)">${catTree}</div>`) : "";
    const dynFields = fields.map((f, fi) => {
      if (f.type === "info") return "";
      const val = f.value !== void 0 && f.value !== null ? f.value : "";
      const valStr = typeof val === "boolean" ? val ? "true" : "false" : String(val ?? "");
      const hint = f.helpText ? `<div style="font-size:10px;color:var(--is-text-muted);margin-top:3px">${this._escHtml(f.helpText.substring(0, 120))}</div>` : "";
      let fieldEl;
      if (f.type === "checkbox") {
        fieldEl = _chk(`class="pw-afield" data-fi="${fi}" data-fname="${f.name}"`, !!val, "");
      } else if (f.type === "password") {
        fieldEl = `<input class="pw-afield mt-field" data-fi="${fi}" data-fname="${f.name}" type="password" value="${this._escHtml(valStr)}" style="${inputSty}">`;
      } else if (f.type === "select" && f.selectOptions?.length) {
        fieldEl = this._mtFieldSelectRaw(
          `class="pw-afield" data-fi="${fi}" data-fname="${f.name}"`,
          f.selectOptions.map((o) => `<option value="${o.value}"${String(o.value) === valStr ? " selected" : ""}>${this._escHtml(o.name || o.label || String(o.value))}</option>`).join(""),
          f.selectOptions.find((o) => String(o.value) === valStr)?.name || "",
          inputSty
        );
      } else if (f.type === "number") {
        fieldEl = `<input class="pw-afield mt-field" data-fi="${fi}" data-fname="${f.name}" type="number" value="${this._escHtml(valStr)}" style="${inputSty}">`;
      } else {
        fieldEl = `<input class="pw-afield mt-field" data-fi="${fi}" data-fname="${f.name}" type="text" value="${this._escHtml(valStr)}" style="${inputSty}">`;
      }
      return row(f.label || f.name || "", fieldEl + hint);
    }).join("");
    const deleteBtn = !isNew ? `<button id="pw-af-delete" style="${this._mtBtnA("red")}">Delete</button>` : "";
    const btnRow = `<div style="display:flex;gap:8px;margin-top:16px;flex-shrink:0;align-items:center">
      <button id="pw-af-test" style="${MT_BTN}">Test</button>
      ${deleteBtn}
      <div style="flex:1;min-width:8px"></div>
      <button id="pw-af-save" style="${this._mtBtnA("blue")}">${isNew ? "Add" : "Save"}</button>
    </div>`;
    return `${nameRow}${enableRow}${appProfileRow}${syncLevelRow}${catPanel}${dynFields}${btnRow}`;
  }
  _pwWireAppForm(el, id, data, isNew, parentEl, appProfiles, categories) {
    const body = el.querySelector("#pw-af-body");
    if (!body) return;
    let testPassed = false;
    body.addEventListener("click", (e) => {
      const toggle = e.target.closest(".pw-cat-toggle");
      if (toggle && !e.target.closest("input")) {
        const subs = toggle.nextElementSibling;
        const arrow = toggle.querySelector(".pw-cat-arrow");
        if (subs) {
          const open = subs.style.display !== "none";
          subs.style.display = open ? "none" : "";
          if (arrow) arrow.style.transform = open ? "" : "rotate(180deg)";
        }
      }
    });
    const collectPayload = () => {
      const name = body.querySelector("#pw-af-name")?.value?.trim() || data.name || "";
      const enable = body.querySelector("#pw-af-enable")?.checked ?? true;
      const syncLevel = body.querySelector("#pw-af-synclevel")?.value || "FullSync";
      const appProfileId = parseInt(body.querySelector("#pw-af-appprofile")?.value) || data.appProfileId || 1;
      const syncCategories = [...body.querySelectorAll(".pw-cat-cb:checked")].map((cb) => parseInt(cb.dataset.catId)).filter(Boolean);
      const fields = [...body.querySelectorAll(".pw-afield")].map((inp) => {
        const fi = parseInt(inp.dataset.fi);
        const orig = (data.fields || [])[fi] || {};
        let value;
        if (inp.type === "checkbox") value = inp.checked;
        else if (inp.type === "number") {
          const p = parseFloat(inp.value);
          value = isNaN(p) ? orig.value ?? null : p === 0 ? null : p;
        } else if (orig.type === "tag") value = inp.value.split(",").map((s) => s.trim()).filter(Boolean);
        else if (orig.type === "select") value = inp.value === "" ? null : inp.value;
        else value = inp.value;
        return { ...orig, value };
      });
      return { ...data, name, enable, syncLevel, appProfileId, syncCategories, fields };
    };
    body.querySelector("#pw-af-test")?.addEventListener("click", async () => {
      const btn = body.querySelector("#pw-af-test");
      body.querySelector("#pw-af-err")?.remove();
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Testing\u2026";
      }
      try {
        const result = await this._callApi("POST", "arr_stack/prowlarr/apptest", collectPayload());
        if (result?.ok === false) {
          testPassed = false;
          const msgs = (result.errors || []).map((e) => e.errorMessage).filter(Boolean).join("\n");
          if (btn) {
            btn.textContent = "\u2717 Failed";
            btn.style.color = "rgba(255,100,100,0.9)";
          }
          if (msgs) {
            const errDiv = document.createElement("div");
            errDiv.id = "pw-af-err";
            errDiv.style.cssText = "margin-bottom:14px;padding:10px 12px;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);border-radius:8px;font-size:11px;color:rgba(248,113,113,0.9);line-height:1.6;white-space:pre-wrap;word-break:break-word";
            errDiv.textContent = msgs;
            body.prepend(errDiv);
          }
        } else {
          testPassed = true;
          body.querySelector("#pw-af-err")?.remove();
          if (btn) {
            btn.textContent = "\u2713 OK";
            btn.style.color = "rgba(52,211,153,0.9)";
          }
        }
      } catch (_) {
        testPassed = false;
        if (btn) {
          btn.textContent = "\u2717 Failed";
          btn.style.color = "rgba(255,100,100,0.9)";
        }
      }
      if (btn) {
        btn.disabled = false;
        setTimeout(() => {
          if (btn) {
            btn.textContent = "Test";
            btn.style.color = "";
          }
        }, 3e3);
      }
    });
    body.querySelector("#pw-af-delete")?.addEventListener("click", async () => {
      const btn = body.querySelector("#pw-af-delete");
      if (!btn) return;
      if (btn.dataset.confirm !== "1") {
        btn.dataset.confirm = "1";
        btn.textContent = "Confirm?";
        setTimeout(() => {
          if (btn.dataset.confirm === "1") {
            btn.dataset.confirm = "0";
            btn.textContent = "Delete";
          }
        }, 3e3);
        return;
      }
      btn.disabled = true;
      btn.textContent = "Deleting\u2026";
      try {
        await this._callApi("DELETE", `arr_stack/prowlarr/applications/${id}`);
        if (this._prowlarrModal) this._prowlarrModal.appsData = (this._prowlarrModal.appsData || []).filter((a) => String(a.id) !== String(id));
        if (this._prowlarr) this._prowlarr.apps = (this._prowlarr.apps || []).filter((a) => String(a.id) !== String(id));
        el.remove();
        const pwBody = parentEl?.querySelector("#pw-body");
        if (pwBody && this._prowlarrModal?.tab === "apps") {
          pwBody.innerHTML = this._pwAppsTabHtml(this._prowlarrModal);
          this._pwWireApps(pwBody, parentEl);
        }
      } catch (_) {
        btn.disabled = false;
        btn.textContent = "Delete";
      }
    });
    body.querySelector("#pw-af-save")?.addEventListener("click", async () => {
      if (!testPassed) {
        const btn2 = body.querySelector("#pw-af-save");
        if (btn2) {
          btn2.style.background = "rgba(248,113,113,0.25)";
          btn2.style.color = "rgba(248,113,113,0.95)";
          setTimeout(() => {
            btn2.style.background = "rgba(99,140,255,0.2)";
            btn2.style.color = "rgba(99,140,255,0.95)";
          }, 800);
        }
        if (!body.querySelector("#pw-af-err")) {
          const errDiv = document.createElement("div");
          errDiv.id = "pw-af-err";
          errDiv.style.cssText = "margin-bottom:14px;padding:10px 12px;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);border-radius:8px;font-size:11px;color:rgba(248,113,113,0.9);line-height:1.6";
          errDiv.textContent = "Run Test first to verify the app configuration before saving.";
          body.prepend(errDiv);
        }
        return;
      }
      const btn = body.querySelector("#pw-af-save");
      if (btn) {
        btn.disabled = true;
        btn.textContent = isNew ? "Adding\u2026" : "Saving\u2026";
      }
      try {
        const payload = collectPayload();
        if (isNew) {
          const created = await this._callApi("POST", "arr_stack/prowlarr/applications", payload);
          if (this._prowlarrModal) this._prowlarrModal.appsData = [...this._prowlarrModal.appsData || [], created];
          if (this._prowlarr) this._prowlarr.apps = [...this._prowlarr.apps || [], created];
        } else {
          const updated = await this._callApi("PUT", `arr_stack/prowlarr/applications/${id}`, payload);
          if (this._prowlarrModal) {
            const idx = (this._prowlarrModal.appsData || []).findIndex((a) => String(a.id) === String(id));
            if (idx >= 0) this._prowlarrModal.appsData[idx] = updated;
          }
          if (this._prowlarr) {
            const idx = (this._prowlarr.apps || []).findIndex((a) => String(a.id) === String(id));
            if (idx >= 0) this._prowlarr.apps[idx] = updated;
          }
        }
        el.remove();
        const pwBody = parentEl?.querySelector("#pw-body");
        if (pwBody && this._prowlarrModal?.tab === "apps") {
          pwBody.innerHTML = this._pwAppsTabHtml(this._prowlarrModal);
          this._pwWireApps(pwBody, parentEl);
        }
      } catch (err) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = isNew ? "Add" : "Save";
        }
        const errDiv = document.createElement("div");
        errDiv.style.cssText = "color:rgba(255,100,100,0.8);font-size:11px;margin-top:8px";
        errDiv.textContent = err?.body?.message || String(err);
        body.querySelector("#pw-af-save")?.after(errDiv);
      }
    });
  }
  // ── Stats tab ────────────────────────────────────────────────────────────
  async _pwLoadStats(body, el) {
    const m = this._prowlarrModal;
    if (!m) return;
    body.style.display = "flex";
    body.style.flexDirection = "column";
    const days = m.statsRange || 30;
    const endDate = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
    const startDt = new Date(Date.now() - (days - 1) * 864e5).toISOString().slice(0, 10);
    try {
      const stats = await this._callApi("GET", `arr_stack/prowlarr/indexerstats?startDate=${startDt}&endDate=${endDate}`);
      if (!this._prowlarrModal) return;
      m.statsData = stats;
    } catch (_) {
      if (!this._prowlarrModal) return;
      m.statsData = null;
    }
    body.innerHTML = this._pwStatsTabHtml(m);
    this._pwWireStats(body, el);
  }
  _pwStatsTabHtml(m) {
    const isMob = isMobile();
    const data = m?.statsData;
    const days = m?.statsRange || 30;
    const page = m?.statsPage || 0;
    const pageBtns = `<span class="mt-nav mt-nav--inline"><span class="mt-nav-ind"></span>
      <button class="mt-nav-btn${page === 0 ? " is-on" : ""}" data-pw-stats-page="0">Indexer performance</button>
      <button class="mt-nav-btn${page === 1 ? " is-on" : ""}" data-pw-stats-page="1">App breakdown</button>
    </span>`;
    const controls = `<div style="display:flex;align-items:center;justify-content:${isMob ? "flex-start" : "flex-end"};gap:8px;margin-bottom:10px;flex-shrink:0">
      <div class="mt-tb mt-tb--card" style="min-height:34px;padding:0 3px;gap:4px;flex-shrink:0">${pageBtns}</div>
    </div>`;
    if (!data) {
      return controls + `<div class="u-empty-lg">No data</div>`;
    }
    const indexers = data.indexers || [];
    const userAgents = data.userAgents || [];
    const activeIdx = indexers.length || (this._prowlarr?.indexers || []).filter((i) => i.enable).length;
    const totalQ = indexers.reduce((s, i) => s + (i.numberOfQueries || 0) + (i.numberOfFailedQueries || 0) + (i.numberOfRssQueries || 0) + (i.numberOfFailedRssQueries || 0) + (i.numberOfAuthQueries || 0) + (i.numberOfFailedAuthQueries || 0), 0);
    const totalG = indexers.reduce((s, i) => s + (i.numberOfGrabs || 0), 0);
    const totalApps = userAgents.length;
    const fmtNum = (n) => n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : String(n);
    const chips = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:${isMob ? "4px" : "8px"};margin-bottom:${isMob ? "6px" : "10px"};flex-shrink:0">
      ${[["Indexers", activeIdx], ["Queries", fmtNum(totalQ)], ["Grabs", fmtNum(totalG)], ["Apps", totalApps]].map(
      ([l, v]) => `<div style="background:var(--is-btn-bg);border:1px solid var(--is-divider);border-radius:${isMob ? "6px" : "8px"};padding:${isMob ? "4px 6px" : "7px 10px"}">
          <div style="font-size:${isMob ? "8px" : "9px"};color:var(--is-text-muted);margin-bottom:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${l}</div>
          <div style="font-size:${isMob ? "12px" : "15px"};font-weight:700;color:var(--is-text)">${v}</div>
        </div>`
    ).join("")}
    </div>`;
    const pagContent = page === 0 ? this._pwStatsPage0(indexers, isMob) : this._pwStatsPage1(indexers, userAgents, isMob);
    return `${controls}${chips}<div style="flex:1;overflow:hidden;display:flex;flex-direction:column;min-height:0">${pagContent}</div>`;
  }
  _pwStatsPage0(indexers, isMob) {
    if (!indexers.length) return `<div class="u-empty-lg">No indexer data</div>`;
    const CHART_H = isMob ? 110 : 130;
    const hLimit = isMob ? 4 : 8;
    const mkLegend = (secs) => secs.filter((s) => s.label).map(
      (s) => `<span style="display:inline-flex;align-items:center;gap:3px;font-size:9px;color:var(--is-text-muted)"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${s.color};flex-shrink:0"></span>${s.label}</span>`
    ).join("");
    const vBarChart = (items, maxVal, sections, nameFn) => {
      if (!items.length) return '<div style="color:var(--is-text-muted);font-size:11px;padding:8px 0">No data</div>';
      const fmtV = (v) => v >= 1e3 ? (v / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : Math.round(v).toString();
      if (isMob) {
        return items.map((item) => {
          const vals = sections.map((s) => Math.max(0, s.fn(item) || 0));
          const tot = vals.reduce((a, b) => a + b, 0);
          const lbl = fmtV(tot);
          const barVals = JSON.stringify(sections.map((s, i) => ({ label: s.label || "", val: vals[i], color: s.color })));
          const segs = sections.map((s, i) => {
            const w = tot > 0 ? Math.round(vals[i] / maxVal * 100) : 0;
            return w > 0 ? `<div style="width:${w}%;height:100%;background:${s.gradient || s.color};min-width:2px"></div>` : "";
          }).join("");
          return `<div class="pw-stats-bar" data-bar-name="${this._escHtml(nameFn(item))}" data-bar-vals='${barVals}' style="margin-bottom:5px;cursor:pointer">
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px">
              <span style="font-size:9px;font-weight:500;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:75%">${this._escHtml(nameFn(item))}</span>
              <span style="font-size:8px;color:var(--is-text-muted);flex-shrink:0">${lbl}</span>
            </div>
            <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;display:flex">${segs}</div>
          </div>`;
        }).join("");
      }
      const N_TICKS = 4;
      const tickStep = maxVal / N_TICKS;
      const yLabels = Array.from({ length: N_TICKS + 1 }, (_, i) => N_TICKS - i).map(
        (i) => `<div style="flex:1;display:flex;align-items:center;justify-content:flex-end"><span style="font-size:8px;color:var(--is-text-muted);line-height:1">${fmtV(i * tickStep)}</span></div>`
      ).join("");
      const gridlines = Array.from(
        { length: N_TICKS + 1 },
        (_, i) => `<div style="position:absolute;bottom:${i / N_TICKS * 100}%;left:0;right:0;border-top:1px solid rgba(255,255,255,${i === 0 ? "0.15" : "0.06"})"></div>`
      ).join("");
      const barCols = items.map((item) => {
        const vals = sections.map((s) => Math.max(0, s.fn(item) || 0));
        const tot = vals.reduce((a, b) => a + b, 0);
        const lbl = fmtV(tot);
        const barVals = JSON.stringify(sections.map((s, i) => ({ label: s.label || "", val: vals[i], color: s.color })));
        const totPct = maxVal > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / maxVal * 100) : 0;
        const secPcts = vals.map((v) => tot > 0 ? Math.round(v / tot * 100) : 0);
        return `<div class="pw-stats-bar" data-bar-name="${this._escHtml(nameFn(item))}" data-bar-vals='${barVals}' style="flex:1;min-width:0;position:relative;cursor:pointer;overflow:visible">
          ${tot > 0 ? `<div style="position:absolute;top:-14px;left:0;right:0;text-align:center;font-size:8px;font-weight:600;color:var(--is-text-muted);pointer-events:none">${lbl}</div>` : ""}
          <div style="position:absolute;bottom:0;left:22%;right:22%;height:${totPct}%;min-height:${tot > 0 ? 2 : 0}px;border-radius:3px 3px 0 0;overflow:hidden;display:flex;flex-direction:column">
            ${sections.map((s, i) => secPcts[i] > 0 ? `<div style="flex:${secPcts[i]};background:${s.gradient || s.color};min-height:2px"></div>` : "").reverse().join("")}
          </div>
        </div>`;
      }).join("");
      const xLabels = items.map(
        (item) => `<div style="flex:1;min-width:0;font-size:8px;color:var(--is-text-muted);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-top:4px">${this._escHtml(nameFn(item))}</div>`
      ).join("");
      return `<div style="flex:1;min-height:0;display:flex;gap:6px">
        <div style="width:32px;flex-shrink:0;display:flex;flex-direction:column;padding-bottom:22px;padding-top:14px">${yLabels}</div>
        <div style="flex:1;min-width:0;min-height:0;display:flex;flex-direction:column">
          <div style="flex:1;min-height:0;position:relative;padding-top:14px">
            <div style="position:absolute;top:14px;bottom:0;left:0;right:0">${gridlines}</div>
            <div style="position:absolute;top:14px;bottom:0;left:0;right:0;display:flex;align-items:stretch;gap:3px;padding:0 2px">${barCols}</div>
          </div>
          <div style="display:flex;gap:3px;padding:0 2px;flex-shrink:0">${xLabels}</div>
        </div>
      </div>`;
    };
    const sortedRT = [...indexers].sort((a, b) => (b.averageResponseTime || 0) + (b.averageGrabResponseTime || 0) - ((a.averageResponseTime || 0) + (a.averageGrabResponseTime || 0)));
    const maxRTtot = Math.max(1, ...sortedRT.map((i) => (i.averageResponseTime || 0) + (i.averageGrabResponseTime || 0)));
    const rtSections = [
      { fn: (i) => i.averageResponseTime || 0, color: "rgba(0,122,255,0.9)", gradient: "linear-gradient(to bottom, rgba(0,122,255,0.92) 0%, rgba(0,122,255,0.42) 100%)", label: "Avg Queries" },
      { fn: (i) => i.averageGrabResponseTime || 0, color: "rgba(255,149,0,0.9)", gradient: "linear-gradient(to bottom, rgba(255,149,0,0.92) 0%, rgba(255,149,0,0.42) 100%)", label: "Avg Grabs" }
    ];
    const qTotal = (i) => (i.numberOfQueries || 0) + (i.numberOfFailedQueries || 0) + (i.numberOfRssQueries || 0) + (i.numberOfFailedRssQueries || 0) + (i.numberOfAuthQueries || 0) + (i.numberOfFailedAuthQueries || 0);
    const sortedQ = [...indexers].sort((a, b) => qTotal(b) - qTotal(a));
    const maxQ = Math.max(1, ...sortedQ.map((i) => qTotal(i)));
    const qSections = [
      { fn: (i) => i.numberOfQueries || 0, color: "rgba(0,122,255,0.9)", gradient: "linear-gradient(to bottom, rgba(0,122,255,0.92) 0%, rgba(0,122,255,0.42) 100%)", label: "Search" },
      { fn: (i) => i.numberOfRssQueries || 0, color: "rgba(52,199,89,0.9)", gradient: "linear-gradient(to bottom, rgba(52,199,89,0.92) 0%, rgba(52,199,89,0.42) 100%)", label: "RSS" },
      { fn: (i) => i.numberOfAuthQueries || 0, color: "rgba(255,45,85,0.9)", gradient: "linear-gradient(to bottom, rgba(255,45,85,0.92) 0%, rgba(255,45,85,0.42) 100%)", label: "Auth" }
    ];
    const sortedG = [...indexers].sort((a, b) => (b.numberOfGrabs || 0) - (a.numberOfGrabs || 0));
    const maxG = Math.max(1, ...sortedG.map((i) => i.numberOfGrabs || 0));
    const gSections = [
      { fn: (i) => i.numberOfGrabs || 0, color: "rgba(255,149,0,0.9)", gradient: "linear-gradient(to bottom, rgba(255,149,0,0.92) 0%, rgba(255,149,0,0.42) 100%)", label: "Grabs" }
    ];
    const lim = isMob ? sortedRT.length : hLimit;
    const rtBars = vBarChart(sortedRT.slice(0, lim), maxRTtot, rtSections, (i) => (i.indexerName || i.name || "").substring(0, 10));
    const qBars = vBarChart(sortedQ.slice(0, lim), maxQ, qSections, (i) => (i.indexerName || i.name || "").substring(0, 10));
    const gBars = vBarChart(sortedG.slice(0, lim), maxG, gSections, (i) => (i.indexerName || i.name || "").substring(0, 10));
    const cardRT = this._pwChartCard("Average Indexer Response Times (ms)", rtBars, mkLegend(rtSections), isMob);
    const cardQ = this._pwChartCard("Total Indexer Queries", qBars, mkLegend(qSections), isMob);
    const cardG = this._pwChartCard("Total Indexer Successful Grabs", gBars, mkLegend(gSections), isMob);
    if (!isMob) {
      return `<div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:8px">
        <div style="flex:1;min-height:0;display:flex;flex-direction:column">${cardRT}</div>
        <div style="flex:1;min-height:0;display:flex;gap:8px"><div style="flex:1;min-width:0;min-height:0;display:flex;flex-direction:column">${cardQ}</div><div style="flex:1;min-width:0;min-height:0;display:flex;flex-direction:column">${cardG}</div></div>
      </div>`;
    }
    return `<div style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:8px">${cardRT}${cardQ}${cardG}</div>`;
  }
  _pwStatsPage1(indexers, userAgents, isMob) {
    const sortedQ = [...userAgents].sort((a, b) => (b.numberOfQueries || 0) - (a.numberOfQueries || 0));
    const sortedG = [...userAgents].sort((a, b) => (b.numberOfGrabs || 0) - (a.numberOfGrabs || 0));
    const hLimit = isMob ? 3 : 5;
    const hBar = (items, maxV, valFn, nameFn, color, gradient) => {
      if (!items.length) return '<div style="color:var(--is-text-muted);font-size:11px">No data</div>';
      const bg = gradient || color;
      return items.map((item) => {
        const v = valFn(item);
        const w = maxV > 0 ? Math.round(v / maxV * 100) : 0;
        const lbl = v >= 1e3 ? (v / 1e3).toFixed(1) + "K" : String(v);
        return `<div style="margin-bottom:6px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px">
            <span style="font-size:10px;font-weight:500;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:70%">${this._escHtml(nameFn(item))}</span>
            <span style="font-size:9px;color:var(--is-text-muted);flex-shrink:0">${lbl}</span>
          </div>
          <div style="height:7px;background:rgba(255,255,255,0.05);border-radius:4px;overflow:hidden">
            <div style="width:${w}%;height:100%;background:${bg};border-radius:4px"></div>
          </div>
        </div>`;
      }).join("");
    };
    const maxQ = Math.max(1, ...sortedQ.map((u) => u.numberOfQueries || 0));
    const maxG = Math.max(1, ...sortedG.map((u) => u.numberOfGrabs || 0));
    const lim1 = isMob ? sortedQ.length : hLimit;
    const qBars = hBar(sortedQ.slice(0, lim1), maxQ, (u) => u.numberOfQueries || 0, (u) => u.userAgent || "\u2014", "rgba(0,122,255,0.9)", "linear-gradient(to right, rgba(0,122,255,0.42) 0%, rgba(0,122,255,0.92) 100%)");
    const gBars = hBar(sortedG.slice(0, lim1), maxG, (u) => u.numberOfGrabs || 0, (u) => u.userAgent || "\u2014", "rgba(255,149,0,0.9)", "linear-gradient(to right, rgba(255,149,0,0.42) 0%, rgba(255,149,0,0.92) 100%)");
    const cardQ = this._pwChartCard("Total User Agent Queries", qBars, "", isMob);
    const cardG = this._pwChartCard("Total User Agent Grabs", gBars, "", isMob);
    if (!isMob) {
      return `<div style="flex:1;min-height:0;display:flex;gap:8px"><div style="flex:1;min-width:0;min-height:0;display:flex;flex-direction:column">${cardQ}</div><div style="flex:1;min-width:0;min-height:0;display:flex;flex-direction:column">${cardG}</div></div>`;
    }
    return `<div style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:8px">${cardQ}${cardG}</div>`;
  }
  _pwChartCard(title, content, legendHtml = "", shrink = false) {
    const flexSty = shrink ? "flex-shrink:0" : "flex:1;min-height:0";
    return `<div style="background:var(--is-btn-bg);border:1px solid var(--is-divider);border-radius:10px;padding:10px 14px;${flexSty};display:flex;flex-direction:column">
      <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;flex-shrink:0">
        <div style="font-size:11px;font-weight:700;color:var(--is-text-muted);text-transform:uppercase;letter-spacing:0.05em;flex:1">${title}</div>
        ${legendHtml ? `<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;flex-shrink:0">${legendHtml}</div>` : ""}
      </div>
      <div style="flex:1;min-height:0;display:flex;flex-direction:column">${content}</div>
    </div>`;
  }
  _pwWireStats(body, el) {
    requestAnimationFrame(() => {
      const nav = body.querySelector(".mt-nav--inline");
      this._syncNavInd(nav, nav?.querySelector(".mt-nav-btn.is-on"));
    });
    body.querySelectorAll("[data-pw-stats-page]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!this._prowlarrModal) return;
        this._prowlarrModal.statsPage = parseInt(btn.dataset.pwStatsPage) || 0;
        body.innerHTML = this._pwStatsTabHtml(this._prowlarrModal);
        this._pwWireStats(body, el);
      });
    });
    body.addEventListener("click", (e) => {
      const bar = e.target.closest(".pw-stats-bar");
      this.shadowRoot.querySelector(".pw-stats-tooltip")?.remove();
      if (!bar) return;
      e.stopPropagation();
      const name = bar.dataset.barName || "";
      let vals = [];
      try {
        vals = JSON.parse(bar.dataset.barVals || "[]");
      } catch (_) {
      }
      const filtered = vals.filter((v) => v.val > 0);
      if (!filtered.length) return;
      const total = filtered.reduce((s, v) => s + v.val, 0);
      const rows = filtered.map(
        (v) => `<div style="display:flex;align-items:center;gap:8px;padding:2px 0">
          <span style="width:8px;height:8px;border-radius:2px;background:${v.color};flex-shrink:0;display:inline-block"></span>
          <span style="flex:1;font-size:11px;color:var(--is-text-muted)">${this._escHtml(v.label)}</span>
          <span style="font-size:12px;font-weight:700;color:var(--is-text)">${v.val >= 1e3 ? (v.val / 1e3).toFixed(1) + "K" : v.val}</span>
        </div>`
      ).join("");
      const tip = document.createElement("div");
      tip.className = "pw-stats-tooltip" + dayClass(this);
      tip.style.cssText = `position:fixed;background:var(--is-popup-bg,rgba(28,32,46,0.98));border:1px solid var(--is-divider);border-radius:8px;padding:10px 14px;z-index:2000;min-width:160px;box-shadow:0 8px 24px rgba(0,0,0,0.5);pointer-events:auto`;
      tip.innerHTML = `<div style="font-size:12px;font-weight:700;color:var(--is-text);margin-bottom:6px">${this._escHtml(name)}</div>
        ${rows}
        ${filtered.length > 1 ? `<div style="border-top:1px solid var(--is-divider);margin-top:6px;padding-top:6px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:11px;color:var(--is-text-muted)">Total</span>
          <span style="font-size:13px;font-weight:700;color:var(--is-text)">${total >= 1e3 ? (total / 1e3).toFixed(1) + "K" : total}</span>
        </div>` : ""}`;
      this.shadowRoot.appendChild(tip);
      const rect = bar.getBoundingClientRect();
      const tipH = tip.offsetHeight, tipW = tip.offsetWidth;
      let top = rect.top - tipH - 10;
      if (top < 8) top = rect.bottom + 10;
      let left = rect.left + rect.width / 2 - tipW / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));
      tip.style.top = top + "px";
      tip.style.left = left + "px";
      const close = (ev) => {
        if (!tip.contains(ev.target) && ev.target !== bar) {
          tip.remove();
          el.removeEventListener("click", close, true);
        }
      };
      setTimeout(() => el.addEventListener("click", close, true), 0);
    });
  }
  // ── History tab ──────────────────────────────────────────────────────────
  async _pwLoadHistory(body, el) {
    const m = this._prowlarrModal;
    if (!m) return;
    try {
      const data = await this._callApi("GET", `arr_stack/prowlarr/history?pageSize=200`);
      if (!this._prowlarrModal) return;
      m.histData = data?.records || [];
      m.histTotal = data?.totalRecords || m.histData.length;
    } catch (_) {
      if (!this._prowlarrModal) return;
      m.histData = [];
      m.histTotal = 0;
    }
    m.histPage = 0;
    m.histPerPage = 20;
    m.histSortDir = "desc";
    body.innerHTML = this._pwHistoryTabHtml(m);
    this._pwWireHistory(body, el);
  }
  _pwHistoryTabHtml(m) {
    const isMob = isMobile();
    const all = m?.histData || [];
    const search = (m?.histSearch || "").toLowerCase();
    const fIdx = m?.histFilterIndexer || "all";
    const fEvt = m?.histFilterEvent || "all";
    const page = m?.histPage || 0;
    const perPage = m?.histPerPage || 20;
    const sortDir = m?.histSortDir || "desc";
    let rows = [...all];
    if (search) rows = rows.filter((r) => {
      const q = (r.data?.query || r.query || r.title || "").toLowerCase();
      return q.includes(search) || (r.indexer || "").toLowerCase().includes(search);
    });
    if (fIdx !== "all") rows = rows.filter((r) => String(r.indexerId) === fIdx);
    if (fEvt !== "all") rows = rows.filter((r) => r.eventType === fEvt);
    rows.sort((a, b) => {
      const da = new Date(a.date).getTime(), db = new Date(b.date).getTime();
      return sortDir === "asc" ? da - db : db - da;
    });
    const totPages = Math.max(1, Math.ceil(rows.length / perPage));
    const pg = Math.min(page, totPages - 1);
    const paged = rows.slice(pg * perPage, (pg + 1) * perPage);
    const indexers = this._prowlarr?.indexers || [];
    const idxOpts = indexers.map((i) => `<option value="${i.id}"${String(i.id) === fIdx ? " selected" : ""}>${this._escHtml(i.name || "\u2014")}</option>`).join("");
    const toolbar = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-shrink:0">${this._uiBar("pw-hist-search", m?.histSearch || "", [
      { id: "pw-hist-idx", kind: "indexer", value: fIdx, items: [["all", "All indexers"], ...(this._prowlarr?.indexers || []).map((i) => [i.id, i.name || "\u2014"])] },
      { id: "pw-hist-evt", kind: "event", value: fEvt, items: [["all", "All events"], ["indexerQuery", "Search"], ["releaseGrabbed", "Grab"], ["indexerRss", "RSS"]] }
    ], [])}</div>`;
    const catColor = (id) => {
      if (id >= 5e3 && id < 6e3) return "rgba(99,140,255,0.85)";
      if (id >= 2e3 && id < 3e3) return "rgba(52,211,153,0.85)";
      if (id >= 3e3 && id < 4e3) return "rgba(251,191,36,0.85)";
      if (id >= 1e3 && id < 2e3) return "rgba(168,85,247,0.85)";
      if (id >= 4e3 && id < 5e3) return "rgba(99,200,255,0.85)";
      if (id >= 6e3 && id < 7e3) return "rgba(251,113,133,0.85)";
      if (id >= 7e3 && id < 8e3) return "rgba(180,140,100,0.85)";
      return "rgba(140,140,140,0.85)";
    };
    const CAT_NAMES = { 1e3: "Console", 2e3: "Movies", 3e3: "Audio", 4e3: "PC", 5e3: "TV", 6e3: "XXX", 7e3: "Books", 8e3: "Other" };
    const normCats = (r) => {
      let raw = [];
      if (Array.isArray(r.categories) && r.categories.length) raw = r.categories;
      else if (Array.isArray(r.data?.categories) && r.data.categories.length) raw = r.data.categories;
      else {
        const catStr = r.data?.categories ?? r.data?.Categories ?? r.data?.category ?? "";
        if (typeof catStr === "string" && catStr)
          raw = catStr.split(/[,|;]/).map((s) => s.trim()).filter(Boolean).map(Number).filter((n) => !isNaN(n) && n > 0);
        else if (typeof catStr === "number" && catStr > 0) raw = [catStr];
      }
      return raw.map((c) => typeof c === "object" && c !== null ? c : { id: Number(c), name: CAT_NAMES[Math.floor(Number(c) / 1e3) * 1e3] || String(c) });
    };
    const catChips = (r) => {
      const cats = normCats(r);
      if (!cats.length) return "";
      const seen = /* @__PURE__ */ new Set();
      return cats.filter((c) => {
        const k = Math.floor(c.id / 1e3) * 1e3;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      }).map((c) => this._uiBadge(this._escHtml(c.name || String(c.id)), "neutral", { extra: "margin-right:2px" })).join("");
    };
    const fmtDate = (d) => {
      try {
        const dt = new Date(d), now = /* @__PURE__ */ new Date();
        if (dt.toDateString() === now.toDateString())
          return dt.toLocaleTimeString(this._locale, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
        return dt.toLocaleDateString(this._locale, { month: "short", day: "numeric" }) + " " + dt.toLocaleTimeString(this._locale, { hour: "2-digit", minute: "2-digit" });
      } catch {
        return d;
      }
    };
    const fmtElapsed = (r) => {
      const ms = r.data?.elapsed ?? r.data?.elapsedTime ?? r.data?.responseTime;
      return ms != null ? `${Math.round(Number(ms))}ms` : "\u2014";
    };
    const fmtQuery = (r) => r.data?.query || r.query || r.title || "";
    const fmtParams = (r) => {
      if (!r.data) return "";
      const skip = /* @__PURE__ */ new Set(["query", "queryType", "elapsed", "elapsedTime", "responseTime", "source", "host", "downloadUrl", "tvdbId", "imdbId", "tmdbId", "indexerFlags", "limit", "offset"]);
      return Object.entries(r.data).filter(([k, v]) => !skip.has(k) && v !== "" && v != null).map(([k, v]) => `${k}=${v}`).join(", ");
    };
    if (!isMob) {
      const thBase = "padding:4px 8px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:left;white-space:nowrap";
      const dateArrow = `<span style="margin-left:2px">${sortDir === "asc" ? "\u2191" : "\u2193"}</span>`;
      const trs = paged.map((r, i) => {
        const alt = i % 2 === 1 ? "background:rgba(255,255,255,0.025)" : "";
        return `<tr style="${alt}">
          <td style="padding:7px 8px;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--is-text)">${this._escHtml(indexers.find((i2) => i2.id === r.indexerId)?.name || r.indexer || "\u2014")}</td>
          <td style="padding:7px 8px;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--is-text-muted)">${this._escHtml(fmtQuery(r))}</td>
          <td style="padding:7px 8px;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--is-text-muted)">${this._escHtml(fmtParams(r))}</td>
          <td style="padding:7px 8px;overflow:hidden;white-space:nowrap">${catChips(r)}</td>
          <td style="padding:7px 8px;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--is-text-muted)">${fmtDate(r.date)}</td>
          <td style="padding:7px 8px;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--is-text-muted);text-align:right">${fmtElapsed(r)}</td>
        </tr>`;
      }).join("") || `<tr><td colspan="6" class="u-empty-lg">No history</td></tr>`;
      const pagHtml2 = totPages > 1 ? this._tlMobPag("pw-hist-page", pg, totPages) : "";
      return `${toolbar}<div class="pw-hist-results-wrap" style="display:contents"><div class="u-flex-ovh">
        <table style="width:100%;border-collapse:collapse;table-layout:fixed">
          <thead>
            <tr>
              <th style="${thBase};width:130px">Indexer</th>
              <th style="${thBase};width:120px">Query</th>
              <th style="${thBase}">Parameters</th>
              <th style="${thBase};width:90px">Categories</th>
              <th data-pw-hist-sort="date" style="${thBase};width:125px;cursor:pointer;user-select:none">Date ${dateArrow}</th>
              <th style="${thBase};width:90px;text-align:right">Elapsed Time</th>
            </tr>
          </thead>
          <tbody>${trs}</tbody>
        </table>
      </div><div style="flex-shrink:0">${pagHtml2}</div></div>`;
    }
    const listRows = paged.map((r, i) => {
      const sep = i > 0 ? "border-top:1px solid var(--is-divider);" : "";
      return `<div style="${sep}padding:8px 0;display:flex;align-items:flex-start;gap:8px">
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:600;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._escHtml(indexers.find((i2) => i2.id === r.indexerId)?.name || r.indexer || "\u2014")}</div>
          <div style="font-size:11px;color:var(--is-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px">${this._escHtml(fmtQuery(r) || "\u2014")}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:3px;flex-wrap:wrap">
            ${catChips(r)}
            <span class="u-xs-muted">${fmtDate(r.date)}</span>
            <span class="u-xs-muted">${fmtElapsed(r)}</span>
          </div>
        </div>
      </div>`;
    }).join("") || `<div class="u-empty-lg">No history</div>`;
    const pagHtml = totPages > 1 ? this._tlMobPag("pw-hist-page", pg, totPages) : "";
    return `${toolbar}<div class="pw-hist-results-wrap" style="display:contents"><div class="u-flex-ovh">${listRows}</div><div style="flex-shrink:0">${pagHtml}</div></div>`;
  }
  _pwWireHistory(body, el) {
    const rerender = () => {
      if (!this._prowlarrModal) return;
      body.innerHTML = this._pwHistoryTabHtml(this._prowlarrModal);
      this._pwWireHistory(body, el);
    };
    requestAnimationFrame(() => {
      const m = this._prowlarrModal;
      if (!m) return;
      const wrap = body.querySelector(".u-flex-ovh");
      const row = wrap?.querySelector("tbody tr") || wrap?.firstElementChild;
      if (!wrap || !row) return;
      const rowH = row.getBoundingClientRect().height;
      const headH = wrap.querySelector("thead")?.getBoundingClientRect().height || 0;
      if (rowH < 4) return;
      const fit = Math.max(4, Math.floor((wrap.clientHeight - headH) / rowH));
      if (fit === m.histPerPage) return;
      m.histPerPage = fit;
      m.histPage = Math.min(m.histPage || 0, Math.max(0, Math.ceil((m.histData?.length || 0) / fit) - 1));
      rerender();
    });
    body.querySelector("#pw-hist-search")?.addEventListener("input", (e) => {
      if (!this._prowlarrModal) return;
      this._prowlarrModal.histSearch = e.target.value;
      this._prowlarrModal.histPage = 0;
      this._patchResultsWrap(body, "pw-hist-results-wrap", () => this._pwHistoryTabHtml(this._prowlarrModal));
      this._pwWireHistory(body, el);
    });
    body.querySelector("#pw-hist-idx")?.addEventListener("change", (e) => {
      if (!this._prowlarrModal) return;
      this._prowlarrModal.histFilterIndexer = e.target.value;
      this._prowlarrModal.histPage = 0;
      rerender();
    });
    body.querySelector("#pw-hist-evt")?.addEventListener("change", (e) => {
      if (!this._prowlarrModal) return;
      this._prowlarrModal.histFilterEvent = e.target.value;
      this._prowlarrModal.histPage = 0;
      rerender();
    });
    body.querySelector('[data-pw-hist-sort="date"]')?.addEventListener("click", () => {
      if (!this._prowlarrModal) return;
      this._prowlarrModal.histSortDir = (this._prowlarrModal.histSortDir || "desc") === "desc" ? "asc" : "desc";
      this._prowlarrModal.histPage = 0;
      rerender();
    });
    body.onclick = (e) => {
      if (!this._prowlarrModal) return;
      const pBtn = e.target.closest("[data-pw-hist-page]");
      if (pBtn) {
        const m = this._prowlarrModal;
        const all = m.histData || [];
        const search = (m.histSearch || "").toLowerCase();
        const fIdx = m.histFilterIndexer || "all", fEvt = m.histFilterEvent || "all";
        let filtered = [...all];
        if (search) filtered = filtered.filter((r) => {
          const q = (r.data?.query || r.query || r.title || "").toLowerCase();
          return q.includes(search) || (r.indexer || "").toLowerCase().includes(search);
        });
        if (fIdx !== "all") filtered = filtered.filter((r) => String(r.indexerId) === fIdx);
        if (fEvt !== "all") filtered = filtered.filter((r) => r.eventType === fEvt);
        const tot = Math.max(1, Math.ceil(filtered.length / (m.histPerPage || 20)));
        const p = pBtn.dataset.pwHistPage, cur = m.histPage || 0;
        const np = p === "first" ? 0 : p === "prev" ? Math.max(0, cur - 1) : p === "next" ? Math.min(tot - 1, cur + 1) : p === "last" ? tot - 1 : parseInt(p) || 0;
        if (np !== cur) {
          m.histPage = np;
          rerender();
        }
        return;
      }
    };
  }
  _pwSchemaListOverlay() {
    const isMob = isMobile();
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div class="popup-overlay${dayClass(this)}" data-pw-schema-list>
      <div class="popup-glass" style="width:min(700px,96vw);height:80vh">
        <div class="is-panel-hdr" style="padding:14px ${isMob ? 16 : 22}px 12px;gap:12px">
          <div style="flex:1;font-size:15px;font-weight:700;color:var(--is-text)">Add Indexer</div>
          <button class="popup-close u-rel-shrink0" id="pw-schema-close">${ICONS.close}</button>
        </div>
        <div class="popup-body" id="pw-schema-body" style="padding:${isMob ? "12px 14px" : "14px 22px"};overflow:hidden;display:flex;flex-direction:column;flex:1;min-height:0">
          <div class="is-loading"><span>Loading indexers\u2026</span></div>
        </div>
      </div>
    </div>`;
    const el = wrap.firstElementChild;
    el.querySelector("#pw-schema-close")?.addEventListener("click", () => el.remove());
    el.addEventListener("click", (e) => {
      if (e.target === el) el.remove();
    });
    return el;
  }
  _pwRenderSchemaList(overlay, schemas, parentEl) {
    const body = overlay.querySelector("#pw-schema-body");
    const PER_PAGE = 50;
    let search = "";
    let fProto = "all";
    let fLang = "all";
    let fPrivacy = "all";
    let page = 0;
    const langs = [...new Set(schemas.map((s) => s.language).filter(Boolean))].sort();
    const render = () => {
      let rows = [...schemas];
      if (search) rows = rows.filter((s) => (s.name || "").toLowerCase().includes(search.toLowerCase()));
      if (fProto !== "all") rows = rows.filter((s) => (s.protocol || "").toLowerCase() === fProto);
      if (fLang !== "all") rows = rows.filter((s) => s.language === fLang);
      if (fPrivacy !== "all") rows = rows.filter((s) => (s.privacy || "").toLowerCase() === fPrivacy);
      const totPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
      page = Math.min(page, totPages - 1);
      const paged = rows.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
      const toolbar = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-shrink:0">${this._uiBar("pw-sl-search", search, [
        { id: "pw-sl-proto", kind: "protocol", value: fProto, items: [["all", "All protocols"], ["torrent", "Torrent"], ["usenet", "Usenet"]] },
        { id: "pw-sl-lang", kind: "langs", value: fLang, items: [["all", "All languages"], ...langs.map((l) => [l, l])] },
        { id: "pw-sl-priv", kind: "source", value: fPrivacy, items: [["all", "All privacy"], ["public", "Public"], ["private", "Private"], ["semiPublic", "Semi-Public"]] }
      ], [], { placeholder: "Search indexers\u2026" })}</div>`;
      const count = `<div style="font-size:11px;color:var(--is-text-muted);margin-bottom:8px;flex-shrink:0">${rows.length} indexer${rows.length !== 1 ? "s" : ""} available</div>`;
      const isMob = isMobile();
      let listHtml;
      if (isMob) {
        listHtml = paged.map((s) => {
          const isTrk = (s.protocol || "").toLowerCase() === "torrent";
          const protoBadge = this._uiBadge(isTrk ? "TRK" : "NZB", isTrk ? "blue" : "amber", { small: true });
          const privBadge = this._uiBadge(this._escHtml(s.privacy || "Private"), s.privacy === "public" ? "green" : "amber", { small: true });
          return `<div data-pw-schema-name="${this._escHtml(s.name || "")}" style="padding:8px;border:1px solid var(--is-divider);border-radius:6px;cursor:pointer;margin-bottom:4px;display:flex;align-items:center;gap:8px" class="pw-schema-item">
            <div style="flex:1;min-width:0">
              <div class="u-sm-text">${this._escHtml(s.name || "\u2014")}</div>
              <div style="font-size:10px;color:var(--is-text-muted);margin-top:2px">${s.language || ""}</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">${protoBadge}${privBadge}</div>
          </div>`;
        }).join("") || '<div style="text-align:center;color:var(--is-text-muted);padding:32px">No indexers match</div>';
      } else {
        const thSty = `padding:6px 10px;text-align:left;font-size:11px;font-weight:700;color:var(--is-text-muted);border-bottom:1px solid var(--is-divider);white-space:nowrap`;
        const tdSty = `padding:7px 10px;font-size:12px;color:var(--is-text);border-bottom:1px solid var(--is-divider)`;
        const rows2 = paged.map((s) => {
          const isTrk = (s.protocol || "").toLowerCase() === "torrent";
          const protoBadge = this._uiBadge(isTrk ? "TRK" : "NZB", isTrk ? "blue" : "amber");
          const priv = (s.privacy || "private").toLowerCase();
          const privBadge = this._uiBadge(
            this._escHtml(s.privacy || "Private"),
            priv === "public" ? "green" : priv === "semipublic" ? "amber" : "red"
          );
          return `<tr class="pw-schema-item" data-pw-schema-name="${this._escHtml(s.name || "")}" style="cursor:pointer" onmouseover="this.style.background='rgba(255,255,255,0.04)'" onmouseout="this.style.background=''">
            <td style="${tdSty}">${protoBadge}</td>
            <td style="${tdSty};font-weight:600">${this._escHtml(s.name || "\u2014")}</td>
            <td style="${tdSty};color:var(--is-text-muted)">${this._escHtml(s.language || "\u2014")}</td>
            <td style="${tdSty}">${privBadge}</td>
          </tr>`;
        }).join("");
        listHtml = `<table style="width:100%;border-collapse:collapse;table-layout:fixed">
          <thead><tr>
            <th style="${thSty};width:52px">Type</th>
            <th style="${thSty}">Name</th>
            <th style="${thSty};width:100px">Language</th>
            <th style="${thSty};width:80px">Privacy</th>
          </tr></thead>
          <tbody>${rows2 || '<tr><td colspan="4" style="text-align:center;color:var(--is-text-muted);padding:32px">No indexers match</td></tr>'}</tbody>
        </table>`;
      }
      const pagHtml = totPages > 1 ? this._tlMobPag("pw-sl-page", page, totPages) : "";
      body.innerHTML = `${toolbar}${count}<div style="flex:1;overflow-y:auto;min-height:0">${listHtml}</div><div style="flex-shrink:0">${pagHtml}</div>`;
      const inp = body.querySelector("#pw-sl-search");
      inp?.addEventListener("input", (e) => {
        search = e.target.value;
        page = 0;
        render();
        const ni = body.querySelector("#pw-sl-search");
        if (ni) {
          ni.focus();
          ni.setSelectionRange(ni.value.length, ni.value.length);
        }
      });
      body.querySelector("#pw-sl-proto")?.addEventListener("change", (e) => {
        fProto = e.target.value;
        page = 0;
        render();
      });
      body.querySelector("#pw-sl-lang")?.addEventListener("change", (e) => {
        fLang = e.target.value;
        page = 0;
        render();
      });
      body.querySelector("#pw-sl-priv")?.addEventListener("change", (e) => {
        fPrivacy = e.target.value;
        page = 0;
        render();
      });
      body.querySelectorAll("[data-pw-sl-page]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const p = btn.dataset.pwSlPage;
          const cur = page;
          const np = p === "first" ? 0 : p === "prev" ? Math.max(0, cur - 1) : p === "next" ? Math.min(totPages - 1, cur + 1) : p === "last" ? totPages - 1 : parseInt(p) || 0;
          if (np !== cur) {
            page = np;
            render();
          }
        });
      });
      body.querySelectorAll(".pw-schema-item").forEach((item) => {
        item.addEventListener("click", async () => {
          const name = item.dataset.pwSchemaName;
          const schema = schemas.find((s) => s.name === name);
          if (!schema) return;
          overlay.remove();
          await this._pwOpenIndexerForm(null, schema, parentEl);
        });
      });
    };
    render();
  }
  async _pwOpenEditIndexer(id, parentEl) {
    try {
      const idx = await this._callApi("GET", `arr_stack/prowlarr/indexer/${id}`);
      if (!idx) throw new Error("Not found");
      await this._pwOpenIndexerForm(id, idx, parentEl);
    } catch (err) {
      alert("Failed to load indexer: " + (err?.body?.message || String(err)));
    }
  }
  async _pwOpenIndexerForm(id, data, parentEl) {
    const isNew = !id;
    const isMob = isMobile();
    let appProfiles = [];
    if (isNew) {
      try {
        appProfiles = await this._callApi("GET", "arr_stack/prowlarr/appprofiles") || [];
      } catch (_) {
      }
    }
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div class="popup-overlay${dayClass(this)}" data-pw-idx-form>
      <div class="popup-glass" style="width:min(600px,96vw);max-height:90vh">
        <div class="is-panel-hdr" style="padding:14px ${isMob ? 16 : 22}px 12px;gap:12px">
          <div style="flex:1;font-size:15px;font-weight:700;color:var(--is-text)">${isNew ? "Add Indexer" : "Edit Indexer"} \u2014 ${this._escHtml(data.name || "")}</div>
          <button class="popup-close u-rel-shrink0" id="pw-form-close">${ICONS.close}</button>
        </div>
        <div class="popup-body" id="pw-form-body" style="padding:${isMob ? "12px 14px" : "14px 22px"};overflow-y:auto">
          ${this._pwIndexerFormHtml(data, {}, isNew, appProfiles)}
        </div>
      </div>
    </div>`;
    const el = wrap.firstElementChild;
    el.querySelector("#pw-form-close")?.addEventListener("click", () => el.remove());
    el.addEventListener("click", (e) => {
      if (e.target === el) el.remove();
    });
    this.shadowRoot.appendChild(el);
    this._pwWireIndexerForm(el, id, data, isNew, parentEl, appProfiles);
  }
  _pwIndexerFormHtml(data, errors, isNew, appProfiles = []) {
    const isMob = isMobile();
    const fields = data.fields || [];
    const inputSty = (err) => `width:100%${err ? ";border-color:rgba(248,113,113,0.8)" : ""}`;
    const _chk = (attrs, checked, label) => `<label class="mt-chk">
      <input ${attrs} type="checkbox"${checked ? " checked" : ""}>
      <span class="mt-chk-box">${_ICO_CHECK}</span>
      ${label ? `<span class="mt-chk-lbl">${label}</span>` : ""}
    </label>`;
    const row = (label, field) => isMob ? `<div style="margin-bottom:12px"><div style="font-size:11px;font-weight:600;color:var(--is-text-muted);margin-bottom:4px">${label}</div>${field}</div>` : `<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px">
             <div style="width:140px;flex-shrink:0;font-size:11px;font-weight:600;color:var(--is-text-muted);padding-top:7px;text-align:right">${label}</div>
             <div style="flex:1;min-width:0">${field}</div>
           </div>`;
    const nameRow = row("Name", `<input id="pw-f-name" type="text" value="${this._escHtml(data.name || "")}" class="mt-field" style="${inputSty(errors.name)}">`);
    const enableRow = `<div style="margin-bottom:12px">${_chk('id="pw-f-enable"', data.enable !== false, "Enabled")}</div>`;
    const dynFields = fields.map((f, fi) => {
      if (f.type === "info") {
        const shortText = (f.helpText || f.label || "").substring(0, 80);
        const hasMore = (f.helpText || "").length > 80;
        const infoHtml = `<div style="font-size:10px;color:rgba(99,140,255,0.8);cursor:${hasMore ? "pointer" : "default"}" ${hasMore ? `data-pw-info-full="${this._escHtml(f.helpText || f.label || "")}" class="pw-info-toggle"` : ""}>${this._escHtml(shortText)}${hasMore ? ' <span style="text-decoration:underline">Show more</span>' : ""}</div>`;
        return row(f.label || "", infoHtml);
      }
      const val = f.value !== void 0 && f.value !== null ? f.value : f.advanced ? "" : "";
      const valStr = typeof val === "boolean" ? val ? "true" : "false" : String(val ?? "");
      const errMsg = errors[`field_${fi}`] ? `<div style="font-size:10px;color:rgba(248,113,113,0.8);margin-top:3px">${errors[`field_${fi}`]}</div>` : "";
      const hint = f.helpText && f.type !== "info" ? `<div style="font-size:10px;color:var(--is-text-muted);margin-top:3px">${this._escHtml(f.helpText.substring(0, 120))}</div>` : "";
      let fieldEl;
      if (f.type === "checkbox") {
        fieldEl = _chk(`class="pw-field" data-fi="${fi}" data-fname="${f.name}"`, !!val, "");
      } else if (f.type === "password") {
        fieldEl = `<input class="pw-field mt-field" data-fi="${fi}" data-fname="${f.name}" type="password" value="${this._escHtml(valStr)}" style="${inputSty(!!errors[`field_${fi}`])}">`;
      } else if (f.type === "select" && f.selectOptions?.length) {
        fieldEl = this._mtFieldSelectRaw(
          `class="pw-field" data-fi="${fi}" data-fname="${f.name}"`,
          f.selectOptions.map((o) => `<option value="${o.value}"${String(o.value) === valStr ? " selected" : ""}>${this._escHtml(o.name || o.label || o.value)}</option>`).join(""),
          f.selectOptions.find((o) => String(o.value) === valStr)?.name || "",
          inputSty(false)
        );
      } else if (f.type === "number") {
        fieldEl = `<input class="pw-field mt-field" data-fi="${fi}" data-fname="${f.name}" type="number" value="${this._escHtml(valStr)}" style="${inputSty(!!errors[`field_${fi}`])}">`;
      } else if (f.type === "tag") {
        fieldEl = `<input class="pw-field mt-field" data-fi="${fi}" data-fname="${f.name}" type="text" value="${this._escHtml(Array.isArray(val) ? val.join(", ") : valStr)}" placeholder="Comma separated" style="${inputSty(!!errors[`field_${fi}`])}">`;
      } else {
        fieldEl = `<input class="pw-field mt-field" data-fi="${fi}" data-fname="${f.name}" type="text" value="${this._escHtml(valStr)}" style="${inputSty(!!errors[`field_${fi}`])}">`;
      }
      const fieldHtml = row(f.label || f.name || "", fieldEl + hint + errMsg);
      return f.advanced ? `<div data-pw-adv-field style="display:none">${fieldHtml}</div>` : fieldHtml;
    }).join("");
    const appProfileRow = isNew && appProfiles.length > 0 ? row("App Profile", this._mtFieldSelect(
      "pw-f-appprofile",
      appProfiles.map((p) => [p.id, p.name || "Profile " + p.id]),
      data.appProfileId || appProfiles[0]?.id,
      "width:100%"
    )) : "";
    const hasAdvanced = fields.some((f) => f.advanced);
    const advBtn = hasAdvanced ? `<button id="pw-form-adv" style="${MT_BTN}">Show Advanced</button>` : "";
    const deleteBtn = !isNew ? `<button id="pw-form-delete" style="${this._mtBtnA("red")}">Delete</button>` : "";
    const btnRow = `<div style="display:flex;gap:8px;margin-top:16px;flex-shrink:0;align-items:center;flex-wrap:wrap">
      <button id="pw-form-test" style="${MT_BTN}">Test</button>
      ${advBtn}${deleteBtn}
      <div style="flex:1;min-width:8px"></div>
      <button id="pw-form-save" style="${this._mtBtnA("blue")}">${isNew ? "Add" : "Save"}</button>
    </div>`;
    return `${nameRow}${enableRow}${appProfileRow}${dynFields}${btnRow}`;
  }
  _pwWireIndexerForm(el, id, data, isNew, parentEl, appProfiles = []) {
    const body = el.querySelector("#pw-form-body");
    if (!body) return;
    let testPassed = false;
    body.querySelector("#pw-form-adv")?.addEventListener("click", () => {
      const btn = body.querySelector("#pw-form-adv");
      const fields = body.querySelectorAll("[data-pw-adv-field]");
      const shown = btn.dataset.advShown === "1";
      fields.forEach((f) => {
        f.style.display = shown ? "none" : "";
      });
      btn.dataset.advShown = shown ? "0" : "1";
      btn.textContent = shown ? "Show Advanced" : "Hide Advanced";
    });
    body.addEventListener("click", (e) => {
      const toggle = e.target.closest(".pw-info-toggle");
      if (toggle) {
        const full = toggle.dataset.pwInfoFull;
        this._pwShowInfoModal(full);
      }
    });
    const collectPayload = () => {
      const name = body.querySelector("#pw-f-name")?.value?.trim() || data.name || "";
      const enable = body.querySelector("#pw-f-enable")?.checked ?? true;
      const fields = [...body.querySelectorAll(".pw-field")].map((inp) => {
        const fi = parseInt(inp.dataset.fi);
        const orig = (data.fields || [])[fi] || {};
        let value;
        if (inp.type === "checkbox") value = inp.checked;
        else if (inp.type === "number") {
          const parsed = parseFloat(inp.value);
          value = isNaN(parsed) ? orig.value ?? null : parsed === 0 ? null : parsed;
        } else if (orig.type === "tag") value = inp.value.split(",").map((s) => s.trim()).filter(Boolean);
        else if (orig.type === "select") value = inp.value === "" ? null : inp.value;
        else value = inp.value;
        return { ...orig, value };
      });
      const appProfileEl = body.querySelector("#pw-f-appprofile");
      const appProfileId = appProfileEl ? parseInt(appProfileEl.value) || appProfiles[0]?.id || 1 : data.appProfileId || 1;
      return { ...data, name, enable, fields, appProfileId };
    };
    body.querySelector("#pw-form-test")?.addEventListener("click", async () => {
      const btn = body.querySelector("#pw-form-test");
      body.querySelector("#pw-test-err")?.remove();
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Testing\u2026";
      }
      const payload = collectPayload();
      try {
        const testUrl = isNew || !data.id ? "arr_stack/prowlarr/idxtest?id=0" : `arr_stack/prowlarr/idxtest?id=${data.id}`;
        const result = isNew || !data.id ? await this._callApi("POST", testUrl, payload) : await this._callApi("POST", testUrl, {});
        if (result?.ok === false) {
          const msgs = (result.errors || []).map((e) => e.errorMessage).filter(Boolean).join("\n");
          if (btn) {
            btn.textContent = "\u2717 Failed";
            btn.style.color = "rgba(255,100,100,0.9)";
          }
          testPassed = false;
          if (msgs) {
            body.querySelector("#pw-test-err")?.remove();
            const errDiv = document.createElement("div");
            errDiv.id = "pw-test-err";
            errDiv.style.cssText = "margin-bottom:14px;padding:10px 12px;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);border-radius:8px;font-size:11px;color:rgba(248,113,113,0.9);line-height:1.6;white-space:pre-wrap;word-break:break-word";
            errDiv.textContent = msgs;
            body.prepend(errDiv);
          }
        } else {
          testPassed = true;
          body.querySelector("#pw-test-err")?.remove();
          if (btn) {
            btn.textContent = "\u2713 OK";
            btn.style.color = "rgba(52,211,153,0.9)";
          }
        }
      } catch (err) {
        testPassed = false;
        if (btn) {
          btn.textContent = "\u2717 Failed";
          btn.style.color = "rgba(255,100,100,0.9)";
        }
      }
      if (btn) {
        btn.disabled = false;
        setTimeout(() => {
          if (btn) {
            btn.textContent = "Test";
            btn.style.color = "";
          }
        }, 3e3);
      }
    });
    body.querySelector("#pw-form-delete")?.addEventListener("click", async () => {
      const btn = body.querySelector("#pw-form-delete");
      if (!btn) return;
      if (btn.dataset.confirm !== "1") {
        btn.dataset.confirm = "1";
        btn.textContent = "Confirm?";
        setTimeout(() => {
          if (btn.dataset.confirm === "1") {
            btn.dataset.confirm = "0";
            btn.textContent = "Delete";
          }
        }, 3e3);
        return;
      }
      btn.disabled = true;
      btn.textContent = "Deleting\u2026";
      try {
        await this._callApi("DELETE", `arr_stack/prowlarr/indexer/${id}`);
        if (this._prowlarr) this._prowlarr.indexers = this._prowlarr.indexers.filter((i) => String(i.id) !== String(id));
        el.remove();
        const pwBody = parentEl?.querySelector("#pw-body");
        if (pwBody && this._prowlarrModal?.tab === "indexers") {
          pwBody.innerHTML = this._pwIndexersTabHtml(this._prowlarr?.indexers || [], this._prowlarrModal);
          this._pwWireIndexers(pwBody, parentEl);
        }
      } catch (err) {
        btn.disabled = false;
        btn.textContent = "Delete";
      }
    });
    body.querySelector("#pw-form-save")?.addEventListener("click", async () => {
      if (!testPassed) {
        const btn2 = body.querySelector("#pw-form-save");
        if (btn2) {
          btn2.style.background = "rgba(248,113,113,0.25)";
          btn2.style.color = "rgba(248,113,113,0.95)";
          setTimeout(() => {
            btn2.style.background = "rgba(99,140,255,0.2)";
            btn2.style.color = "rgba(99,140,255,0.95)";
          }, 800);
        }
        if (!body.querySelector("#pw-test-err")) {
          const errDiv = document.createElement("div");
          errDiv.id = "pw-test-err";
          errDiv.style.cssText = "margin-bottom:14px;padding:10px 12px;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);border-radius:8px;font-size:11px;color:rgba(248,113,113,0.9);line-height:1.6";
          errDiv.textContent = "Run Test first to verify the indexer configuration before saving.";
          body.prepend(errDiv);
        }
        return;
      }
      const btn = body.querySelector("#pw-form-save");
      if (btn) {
        btn.disabled = true;
        btn.textContent = isNew ? "Adding\u2026" : "Saving\u2026";
      }
      const payload = collectPayload();
      delete payload._status;
      try {
        if (isNew) {
          const created = await this._callApi("POST", "arr_stack/prowlarr/indexer", payload);
          if (this._prowlarr) this._prowlarr.indexers.push({ ...created, _status: null });
        } else {
          const updated = await this._callApi("PUT", `arr_stack/prowlarr/indexer/${id}`, payload);
          if (this._prowlarr) {
            const idx = this._prowlarr.indexers.findIndex((i) => String(i.id) === String(id));
            if (idx >= 0) this._prowlarr.indexers[idx] = { ...updated, _status: this._prowlarr.indexers[idx]._status };
          }
        }
        el.remove();
        const pwBody = parentEl?.querySelector("#pw-body");
        if (pwBody && this._prowlarrModal?.tab === "indexers") {
          pwBody.innerHTML = this._pwIndexersTabHtml(this._prowlarr?.indexers || [], this._prowlarrModal);
          this._pwWireIndexers(pwBody, parentEl);
        }
      } catch (err) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = isNew ? "Add" : "Save";
        }
        const errDiv = document.createElement("div");
        errDiv.style.cssText = "color:rgba(255,100,100,0.8);font-size:11px;margin-top:8px";
        errDiv.textContent = err?.body?.message || String(err);
        body.querySelector("#pw-form-save")?.after(errDiv);
      }
    });
  }
  _pwShowInfoModal(text) {
    const wrap = document.createElement("div");
    const html = this._escHtml(text).replace(/\n(\d+)\./g, "<br><strong>$1.</strong>").replace(/\n/g, "<br>");
    wrap.innerHTML = `<div class="popup-overlay${dayClass(this)}" data-pw-info-modal style="z-index:1300">
      <div class="popup-glass" style="width:min(500px,94vw);max-height:80vh">
        <div class="is-panel-hdr" style="padding:14px 22px 12px;gap:12px">
          <div style="flex:1;font-size:14px;font-weight:700;color:var(--is-text)">Instructions</div>
          <button class="popup-close u-rel-shrink0" id="pw-info-close">${ICONS.close}</button>
        </div>
        <div class="popup-body" style="padding:14px 22px 20px;overflow-y:auto">
          <div style="font-size:12px;color:var(--is-text-muted);line-height:1.7">${html}</div>
        </div>
      </div>
    </div>`;
    const el = wrap.firstElementChild;
    el.querySelector("#pw-info-close")?.addEventListener("click", () => el.remove());
    el.addEventListener("click", (e) => {
      if (e.target === el) el.remove();
    });
    this.shadowRoot.appendChild(el);
  }
};
var wireProwlarrMixin = _WireProwlarrMethods.prototype;


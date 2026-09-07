
var _LibraryMethods = class {
  // ─── Section tile view ───────────────────────────────────────────────────
  _renderLibrary() {
    const hasMusic = this._lidarrConfigured !== false && (this._lidarrArtists?.size || 0) > 0;
    const tiles = (hasMusic ? [
      this._libBuildTile("movies", "Movies", this._libMoviesData()),
      this._libBuildTile("tv", "TV Shows", this._libTvData()),
      this._libBuildTile("music", "Music", this._libMusicData()),
      this._libBuildTile("toprated", "Top Rated", this._libTopRatedData())
    ] : [
      this._libBuildTile("movies", "Movies", this._libMoviesData()),
      this._libBuildTile("tv", "TV Shows", this._libTvData()),
      this._libBuildTile("toprated", "Top Rated", this._libTopRatedData()),
      this._libBuildTile("topquality", "Top Quality", this._libTopQualityData())
    ]).join("");
    const cols = 4;
    const grid = `<div class="mgrid" style="grid-template-columns:repeat(${cols},1fr)">${tiles}</div>`;
    return `
      <div class="sec-card has-gradient" style="${this._sectionStyle()}">
        ${this._sectionOverlayHtml("radarr", 25, 75, 0.18)}
        <div class="col-hdr" style="margin-bottom:5px">
          ${this._appIconRow(["radarr", "sonarr", "lidarr"])}
          <span class="col-hdr-title">Library</span>
          <div class="col-hdr-line"></div>
        </div>
        <div class="pg-wrap">
          <button class="pg-btn pg-btn-ph" disabled>\u2039</button>
          ${grid}
          <button class="pg-btn pg-btn-ph" disabled>\u203A</button>
        </div>
      </div>`;
  }
  // ─── Tile data ────────────────────────────────────────────────────────────
  _libMoviesData() {
    return (this._radarr || []).filter((m) => m.hasFile).sort((a, b) => new Date(b.added || 0) - new Date(a.added || 0)).slice(0, 4).map((m) => ({ url: this._getRadarrPoster(m), title: m.title, _libType: "movie" }));
  }
  _libTvData() {
    return (this._sonarr || []).filter((s) => (s.statistics?.episodeFileCount || 0) > 0).sort((a, b) => new Date(b.added || 0) - new Date(a.added || 0)).slice(0, 4).map((s) => ({ url: this._getSonarrPoster(s), title: s.title, _libType: "tv" }));
  }
  _libMusicData() {
    const arts = [...this._lidarrArtists?.values() || []].filter((a) => (a.statistics?.trackFileCount || 0) > 0).sort((a, b) => new Date(b.added || 0) - new Date(a.added || 0)).slice(0, 24);
    const out = [];
    for (const a of arts) {
      const url = this._lidarrArtistImage(a, "poster") || this._lidarrArtistImage(a, "fanart");
      if (!url) continue;
      out.push({ url, title: a.artistName || "", _libType: "music" });
      if (out.length === 4) break;
    }
    return out;
  }
  _libTopRatedData() {
    return [
      ...(this._radarr || []).filter((m) => m.hasFile).map((m) => ({
        url: this._getRadarrPoster(m),
        title: m.title,
        _libType: "movie",
        _score: m.ratings?.imdb?.value || m.ratings?.value || 0
      })),
      ...(this._sonarr || []).filter((s) => (s.statistics?.episodeFileCount || 0) > 0).map((s) => ({
        url: this._getSonarrPoster(s),
        title: s.title,
        _libType: "tv",
        _score: s.ratings?.imdb?.value || s.ratings?.tmdb?.value || s.ratings?.tvdb?.value || s.ratings?.tvMaze?.value || s.ratings?.trakt?.value || s.ratings?.value || 0
      }))
    ].filter((i) => i._score > 0).sort((a, b) => b._score - a._score).slice(0, 4);
  }
  _libTopQualityData() {
    const Q = ["2160p", "1080p", "720p", "480p"];
    const rank = (q) => {
      const i = Q.findIndex((r) => q.includes(r));
      return i === -1 ? 99 : i;
    };
    return [
      ...(this._radarr || []).filter((m) => m.hasFile).map((m) => ({
        url: this._getRadarrPoster(m),
        title: m.title,
        _libType: "movie",
        _rank: rank(m.movieFile?.quality?.quality?.name || "")
      })),
      ...(this._sonarr || []).filter((s) => (s.statistics?.episodeFileCount || 0) > 0).map((s) => ({
        url: this._getSonarrPoster(s),
        title: s.title,
        _libType: "tv",
        _rank: 99
      }))
    ].sort((a, b) => a._rank - b._rank).slice(0, 4);
  }
  // ─── Tile card builder ────────────────────────────────────────────────────
  _libBuildTile(key, label, posters) {
    const slots = [0, 1, 2, 3].map((i) => {
      const p = posters[i];
      if (!p) return `<div class="lib-sub-poster lib-sub-empty"></div>`;
      return p.url ? `<div class="lib-sub-poster"><img src="${p.url}" alt="${this._escHtml(p.title || "")}" loading="lazy" onerror="this.style.display='none'"></div>` : `<div class="lib-sub-poster lib-sub-empty"></div>`;
    }).join("");
    return `
      <div class="mc lib-tile-card" data-lib-open="${key}">
        <div class="lib-tile-grid">
          ${slots}
          <div class="lib-tile-dim"></div>
        </div>
        <span class="media-type-tag">${label}</span>
      </div>`;
  }
  // ─── Modal open / close ───────────────────────────────────────────────────
  _openLibModal(key) {
    this._markActivated();
    this.shadowRoot.querySelector("[data-lib-modal]")?.remove();
    let _saved = {};
    try {
      _saved = JSON.parse(localStorage.getItem("arr-lib-tabs") || "{}");
    } catch (_) {
    }
    const typeKey = key === "movies" || key === "topquality" ? "movies" : key === "tv" ? "tv" : key === "music" ? "music" : key === "all" && ["movies", "tv", "music"].includes(_saved.typeKey) && !(_saved.typeKey === "music" && this._lidarrConfigured === false) ? _saved.typeKey : "all";
    const qualityKey = key === "toprated" || key === "topquality" ? key : null;
    const sortDef = qualityKey === "toprated" ? typeKey === "music" ? "rating" : "imdb" : qualityKey === "topquality" ? "quality" : "added";
    const _byType = (_saved.byType || {})[typeKey] || {};
    const isTabNow = !this._isMob && window.matchMedia("(max-width:860px)").matches;
    this._libModal = {
      typeKey,
      qualityKey,
      instFilter: _saved.instFilter || "all",
      search: "",
      sort: qualityKey ? sortDef : _byType.sort || _saved.sort || sortDef,
      sortDir: _byType.sortDir || _saved.sortDir || "desc",
      view: _byType.view || _saved.view || "posters",
      page: 0,
      filter: qualityKey ? "all" : _byType.filter || "all",
      _libCols: !this._isMob ? _saved.tabCols || 0 : 0,
      _editMode: false,
      _selected: /* @__PURE__ */ new Set(),
      _bulkDialog: null,
      _bulkEdit: { monitored: "", qualityProfileId: "", minimumAvailability: "", rootFolderPath: "", monitorNewItems: "", seriesType: "", seasonFolder: "" },
      _bulkTags: { tags: "", applyTags: "add" },
      _bulkDelete: { addImportExclusion: true, deleteFiles: false }
    };
    const wrap = document.createElement("div");
    wrap.innerHTML = this._libModalHtml();
    const el = wrap.firstElementChild;
    this.shadowRoot.appendChild(el);
    const bodyEl = el.querySelector("#lib-body");
    if (bodyEl?.clientHeight > 0) {
      this._libModal._bodyH = bodyEl.clientHeight;
      bodyEl.innerHTML = this._libBodyHtml();
      const gw = bodyEl.querySelector("#lib-poster-grid")?.clientWidth || 0;
      if (gw > 0 && gw !== this._libModal._gridW) {
        this._libModal._gridW = gw;
        if (this._libModal._colsAuto) this._libModal._libCols = 0;
        bodyEl.innerHTML = this._libBodyHtml();
      }
    }
    this._wireLibModal(el);
  }
  // What this type was last left showing. Written on every switch as well as
  // on close, so a switch that is never followed by a clean close still sticks.
  _libSaveTypePrefs() {
    const m = this._libModal;
    if (!m) return;
    try {
      const prev = JSON.parse(localStorage.getItem("arr-lib-tabs") || "{}");
      prev.byType = prev.byType || {};
      prev.byType[m.typeKey] = { sort: m.sort, sortDir: m.sortDir, filter: m.filter, view: m.view };
      prev.typeKey = m.typeKey;
      localStorage.setItem("arr-lib-tabs", JSON.stringify(prev));
    } catch (_) {
    }
  }
  _libTypePrefs(typeKey) {
    try {
      return (JSON.parse(localStorage.getItem("arr-lib-tabs") || "{}").byType || {})[typeKey] || null;
    } catch (_) {
      return null;
    }
  }
  _closeLibModal() {
    if (this._libModal) {
      this._libSaveTypePrefs();
      try {
        const { typeKey, instFilter, qualityKey, sort, sortDir, view, filter } = this._libModal;
        const prev = JSON.parse(localStorage.getItem("arr-lib-tabs") || "{}");
        localStorage.setItem("arr-lib-tabs", JSON.stringify(
          { ...prev, typeKey, instFilter, qualityKey, sort, sortDir, view, filter }
        ));
      } catch (_) {
      }
    }
    this.shadowRoot.querySelector("[data-lib-modal]")?.remove();
    this._libModal = null;
  }
  // ─── Modal HTML ───────────────────────────────────────────────────────────
  _libModalHtml() {
    const m = this._libModal;
    const isMob = this._isMob;
    const isTab = !isMob && window.matchMedia("(max-width:860px)").matches;
    const _ICO_MOVIE = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/></svg>`;
    const _ICO_TV = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
    const _ICO_MUSIC = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="pointer-events:none"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z"/></svg>`;
    const G1_LABELS = { all: "All", movies: _ICO_MOVIE, tv: _ICO_TV, music: _ICO_MUSIC };
    const G1_LABELS_DSK = { all: "All", movies: "Movies", tv: "TV Shows", music: "Music" };
    const _types = this._lidarrConfigured === false ? ["all", "movies", "tv"] : ["all", "movies", "tv", "music"];
    const g1Seg = this._mtSegmented("data-lib-seg-type", _types.map((k) => ({
      v: k,
      label: G1_LABELS_DSK[k],
      // "All" has no obvious glyph, so it keeps its word; the other two are icons
      icon: k === "all" ? null : G1_LABELS[k],
      attr: `data-lib-tab-type="${k}"`,
      disabled: m.qualityKey === "topquality" && k !== "movies"
      // set below for music
    })), m.typeKey, {
      width: isMob ? 40 : 52,
      accent: "0,122,255",
      // Matches the Maintainerr header nav's fill exactly — same bar, so the
      // selection must not read as a paler blue here.
      accentAlpha: 0.9,
      animatePrev: !!m._animSegType,
      prev: m._prevTypeKey
    });
    const sep = `<span class="mt-tb-sep"></span>`;
    const _ICO_RATED = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="pointer-events:none"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
    const _ICO_QUAL = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="pointer-events:none"><path d="M6 2h12l4 6-10 14L2 8zm1.2 2L4.6 7.6h4.2zm3.1 0-1.5 3.6h6.4L13.7 4zm6.5 0 1.5 3.6h4.2zM5.4 9.6 12 18.9l6.6-9.3z"/></svg>`;
    const G2 = [["toprated", "Top Rated", _ICO_RATED], ["topquality", "Top Quality", _ICO_QUAL]];
    const g2Btns = G2.map(([k, lbl, ico]) => {
      const on = k === m.qualityKey;
      const acc = "--tgl-on:rgba(255,160,0,0.9)";
      const off = m.typeKey === "music" && k === "topquality";
      return `<button class="mt-tgl${on ? " is-on" : ""}" data-lib-tab-quality="${k}" title="${this._escHtml(lbl)}"${off ? ' disabled style="opacity:0.35;pointer-events:none;' + acc + '"' : ` style="${acc}"`}>${isMob ? ico : lbl}</button>`;
    }).join("");
    const hasMultiInst = !!(this._radarr2Configured || this._sonarr2Configured) && m.typeKey !== "music";
    const g3Btns = hasMultiInst ? this._mtSegmented("data-lib-seg-inst", [
      // Short labels on the pills, full wording in the tooltip
      { v: "all", label: "Both instances", icon: "1&nbsp;|&nbsp;2", attr: 'data-lib-tab-inst="all"' },
      { v: "1", label: "Instance 1", icon: "1", attr: 'data-lib-tab-inst="1"' },
      { v: "2", label: "Instance 2", icon: "2", attr: 'data-lib-tab-inst="2"' }
    ], m.instFilter || "all", {
      width: isMob ? 34 : 44,
      accent: "88,86,214",
      accentAlpha: 0.9,
      animatePrev: !!m._animSegInst,
      prev: m._prevInstFilter
    }) : "";
    const tabBtnsMain = g1Seg + sep + g2Btns;
    const tabBtns = tabBtnsMain + (!isMob && g3Btns ? sep + g3Btns : "");
    const itemCount = this._libFilteredItems().length;
    const countBadge = `<span style="font-size:12px;font-weight:600;opacity:0.55;color:var(--is-text);flex-shrink:0;white-space:nowrap;margin-left:4px">${itemCount}</span>`;
    const hdrPad = isMob ? "12px 12px 10px" : "14px 22px 10px";
    const hdrBar = "height:34px;padding:0 3px;gap:6px";
    const backIco = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
    const closeIco = this._libPopupReturn ? backIco : ICONS.close;
    const hdrInner = isMob ? `<div style="display:flex;align-items:center;gap:6px">
           <div class="mt-tb lib-hdr-scroll" style="flex:1;min-width:0;${hdrBar};overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;margin-right:50px">
             ${tabBtnsMain}${g3Btns ? sep + g3Btns : ""}
           </div>
           <button class="popup-close" id="lib-close" style="flex-shrink:0;margin-left:4px">${closeIco}</button>
         </div>` : `<div class="mt-tb" style="min-width:0;flex-shrink:1;overflow:hidden;${hdrBar}">${tabBtns}</div>
         ${countBadge}
         <span id="lib-cmd-status" style="font-size:11px;font-weight:400;opacity:0.55;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0"></span>
         <div style="flex:1;min-width:8px"></div>
         <button class="popup-close" id="lib-close" style="position:relative;top:0;right:0;flex-shrink:0;align-self:center;margin-left:4px">${closeIco}</button>`;
    return `<div class="popup-overlay${dayClass(this)}" data-lib-modal>
      <div class="popup-glass tl-wide">
        <div class="is-panel-hdr" style="flex-direction:${isMob ? "column" : "row"};align-items:${isMob ? "stretch" : "center"};padding:${hdrPad};gap:${isMob ? "4px" : "8px"}">
          ${hdrInner}
        </div>
        <div class="popup-body" id="lib-body" style="padding:${isMob ? "6px 10px 12px" : "8px 20px 16px"};display:flex;flex-direction:column;overflow:hidden">
          ${this._libBodyHtml()}
        </div>
      </div>
    </div>`;
  }
  // ─── Modal body (re-rendered on filter/sort/search/page change) ───────────
  _libBodyHtml() {
    const m = this._libModal;
    const isMob = this._isMob;
    const isTab = !isMob && window.matchMedia("(max-width:860px)").matches;
    const allItems = this._libFilteredItems();
    const vH = window.innerHeight;
    const vW = window.innerWidth;
    const bPad = isMob ? 18 : 24;
    const tlbH = isMob ? 80 : 48;
    const pagH = 48;
    const availH = m._bodyH ? m._bodyH - bPad - tlbH - pagH : vH * 0.88 - 60 - bPad - tlbH - pagH;
    let perPage;
    if (m.view === "posters") {
      const gap = 8;
      const glassW = Math.min(1100, vW * 0.96);
      const bodyPX = isMob ? 20 : 40;
      const gridW = m._gridW || glassW - bodyPX;
      let bestCols = m._libCols || 0;
      if (!bestCols) {
        const minW = isMob ? 70 : 90;
        const maxC = Math.floor((gridW + gap) / (minW + gap));
        const minC = isMob ? 2 : 3;
        let bestPP = 0;
        for (let c = minC; c <= maxC; c++) {
          const pW = (gridW - gap * (c - 1)) / c;
          const pH = pW * 1.5;
          const r = Math.max(1, Math.round((availH + gap) / (pH + gap)));
          const pp = c * r;
          if (pp > bestPP) {
            bestPP = pp;
            bestCols = c;
          }
        }
        m._libCols = bestCols;
        m._colsAuto = true;
      }
      if (isMob) {
        perPage = 4;
      }
      const cols = isMob ? 2 : bestCols;
      const posterW = (gridW - gap * (cols - 1)) / cols;
      const posterH = posterW * 1.5;
      const rows = Math.max(1, Math.round((availH + gap) / (posterH + gap)));
      let cardH = (availH - gap * (rows - 1)) / rows;
      let cardW = cardH / 1.5;
      if (cardW > posterW) {
        cardW = posterW;
        cardH = posterH;
      }
      m._libCard = { w: Math.floor(cardW), h: Math.floor(cardH) };
      if (!isMob) perPage = cols * rows;
    } else if (m.view === "overview") {
      const rowH = 79 + 6;
      perPage = Math.max(5, Math.floor((availH + 6) / rowH));
    } else {
      perPage = Math.max(5, Math.floor((availH - 30) / 38));
    }
    m._perPage = perPage;
    const totalPages = Math.max(1, Math.ceil(allItems.length / perPage));
    const page = Math.min(m.page, totalPages - 1);
    m._totalPages = totalPages;
    const pageItems = allItems.slice(page * perPage, (page + 1) * perPage);
    const _CHEV = `<svg class="mt-tb-chev" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none"><polyline points="6 9 12 15 18 9"/></svg>`;
    const sortDefs = this._libSortOptions();
    const sortLabel = sortDefs.find((s) => s.v === m.sort)?.label || "Sort";
    const dirArrow = m.sortDir === "desc" ? " \u2193" : " \u2191";
    const sortOpen = !!m._sortOpen;
    const sortDropList = sortOpen ? `<div id="lib-sort-list" style="position:absolute;top:34px;left:0;z-index:200;background:var(--is-menu-bg,#1c1c1e);border:1px solid var(--is-divider,rgba(255,255,255,0.15));border-radius:14px;min-width:190px;overflow:hidden;padding:4px;box-shadow:0 6px 24px rgba(0,0,0,0.4)">
      ${sortDefs.map((s) => {
      const act = s.v === m.sort;
      return `<div data-lib-sort-opt="${s.v}" style="padding:7px 12px;border-radius:999px;font-size:12px;cursor:pointer;color:${act ? "#4da3ff" : "var(--is-text)"};display:flex;align-items:center;justify-content:space-between;gap:8px;${act ? "font-weight:700" : ""}">
          <span style="pointer-events:none">${s.label}</span>
          ${act ? `<span style="opacity:0.7;font-size:11px;pointer-events:none">${dirArrow.trim()}</span>` : ""}
        </div>`;
    }).join("")}
    </div>` : "";
    const sortTrigger = isMob ? `<span id="lib-sort-btn" class="mt-tb-sel mt-tb-sel--ico is-active${sortOpen ? " is-open" : ""}" title="${this._escHtml(sortLabel + dirArrow)}">
          ${this._libSortIcon(m.sortDir)}${_CHEV}
        </span>` : `<span id="lib-sort-btn" class="mt-tb-sel${sortOpen ? " is-open" : ""}">
          <span class="mt-tb-lbl">${sortLabel}${dirArrow}</span>${_CHEV}
        </span>`;
    const sortSel = `<span id="lib-sort-wrap" style="position:relative;flex-shrink:0;min-width:0">
      ${sortTrigger}
      ${sortDropList}
    </span>`;
    const FILTER_OPTS = [["all", "All"], ["monitored", "Monitored Only"], ["unmonitored", "Unmonitored"], ["missing", "Missing"], ["wanted", "Wanted"], ["cutoff", "Cutoff Unmet"]];
    const filterSel = isMob ? this._actIconSelect({ id: "lib-filter-sel", kind: "filter", value: m.filter, items: FILTER_OPTS }) : this._mtSelect("lib-filter-sel", FILTER_OPTS, m.filter, "all");
    const _ICO_REFRESH = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;
    const _ICO_RSS = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1" fill="currentColor"/></svg>`;
    const _ICO_EDIT = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    const _tbBtn = (action, label, extra = "") => `<button class="mt-tb-btn" data-lib-action="${action}"${extra}>${label}</button>`;
    const actionBtnsText = `${_tbBtn("update-all", `${_ICO_REFRESH}Update All`)}${_tbBtn("rss-sync", `${_ICO_RSS}RSS Sync`)}`;
    const actionBtnsIcon = `${_tbBtn("update-all", _ICO_REFRESH)}${_tbBtn("rss-sync", _ICO_RSS)}`;
    const allSelected = m._editMode && m._selected?.size > 0 && allItems.length > 0 && m._selected.size >= allItems.length;
    const hasSel = m._editMode && (m._selected?.size || 0) > 0;
    const _dimBtn = (action, label) => {
      const red = action === "bulk-delete" && hasSel;
      const sty = `${hasSel ? "" : "opacity:0.35;cursor:default;"}${red ? "color:#ff6b6b;background:rgba(229,57,53,0.20);" : ""}`;
      return _tbBtn(action, label, `${hasSel ? "" : " disabled"} style="${sty}"`);
    };
    const editBtns = `${_dimBtn("bulk-edit", "Edit")}${_dimBtn("bulk-tags", "Set Tags")}${_dimBtn("bulk-delete", "Delete")}
        <span class="mt-tb-sep"></span>
        ${_tbBtn("stop-edit", "Stop Selecting")}${_tbBtn("select-toggle", allSelected ? "Deselect All" : "Select All")}`;
    const _VF = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15" style="display:block;pointer-events:none"';
    const _ICO_POSTERS = `<svg ${_VF}><rect x="3" y="4" width="5" height="16" rx="1"/><rect x="9.5" y="4" width="5" height="16" rx="1"/><rect x="16" y="4" width="5" height="16" rx="1"/></svg>`;
    const _ICO_OVERVIEW = `<svg ${_VF}><rect x="3" y="5" width="6" height="14" rx="1"/><line x1="12" y1="8" x2="21" y2="8"/><line x1="12" y1="12" x2="21" y2="12"/><line x1="12" y1="16" x2="18" y2="16"/></svg>`;
    const _ICO_TABLE = `<svg ${_VF}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
    const viewSeg = this._mtSegmented("data-lib-seg-view", [
      { v: "posters", label: "Posters", icon: _ICO_POSTERS, attr: 'data-lib-view="posters"' },
      { v: "overview", label: "Overview", icon: _ICO_OVERVIEW, attr: 'data-lib-view="overview"' },
      { v: "table", label: "Table", icon: _ICO_TABLE, attr: 'data-lib-view="table"' }
    ], m.view, {
      icons: true,
      width: isMob ? 32 : null,
      accent: "0,122,255",
      animatePrev: !!m._animSegView,
      prev: m._prevView
    });
    const TB_STY = "flex:1;min-width:0;height:34px;padding:0 3px 0 12px";
    const editEntry = m.typeKey === "music" ? "" : _tbBtn("start-edit", isMob ? _ICO_EDIT : `${_ICO_EDIT}Edit`);
    const barActions = `<span class="mt-tb-sep"></span>${isMob || isTab ? actionBtnsIcon : actionBtnsText}${editEntry}`;
    const searchTb = m._editMode ? `<div class="mt-tb" style="${TB_STY};padding:0 3px;gap:2px"><div style="flex:1"></div>${editBtns}</div>` : this._mtToolbar("lib-search", m.search, [
      { html: sortSel },
      { html: filterSel },
      { html: barActions }
    ], "Search\u2026", TB_STY);
    const ctrlRow = isMob ? `<div style="display:flex;align-items:center;gap:6px">${viewSeg}</div>` : "";
    const toolbar = isMob ? `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:6px">${searchTb}</div>
          ${ctrlRow}
        </div>` : `<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">${searchTb}</div>`;
    let contentHtml;
    if (m.view === "posters") {
      const cols = isMob ? 2 : m._libCols || 7;
      const card = m._libCard || null;
      const cellCols = card ? `repeat(${cols},${card.w}px)` : `repeat(${cols},1fr)`;
      const cellRows = card ? `grid-auto-rows:${card.h}px;justify-content:space-between;` : "";
      contentHtml = isMob ? `<div id="lib-poster-grid" class="lib-grid-fit" style="display:grid;grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(2,minmax(0,1fr));gap:10px;height:100%;min-height:0;overflow:hidden">${pageItems.map((i) => this._libPosterCard(i)).join("")}</div>` : `<div id="lib-poster-grid" class="lib-grid-fit" style="display:grid;grid-template-columns:${cellCols};${cellRows}gap:8px;overflow:hidden">${pageItems.map((i) => this._libPosterCard(i)).join("")}</div>`;
    } else if (m.view === "overview") {
      contentHtml = `<div style="display:flex;flex-direction:column;gap:6px;overflow:hidden">${pageItems.map((i) => this._libOverviewCard(i)).join("")}</div>`;
    } else {
      contentHtml = `<div style="overflow:hidden;flex:1;min-height:0">${this._libTableHtml(pageItems)}</div>`;
    }
    const pagHtml = this._tlMobPag("lib-page", page, totalPages, true);
    const LIB_COLS_MIN = 3, LIB_COLS_MAX = 12, LIB_TRACK_W = 120, LIB_INSET = 7;
    const dragHandle = !isMob && m.view === "posters" ? (() => {
      const cur = m._libCols || 7;
      const thumbPx = Math.round((cur - LIB_COLS_MIN) / (LIB_COLS_MAX - LIB_COLS_MIN) * (LIB_TRACK_W - LIB_INSET * 2)) + LIB_INSET;
      const _d = this._isDay;
      const _track = _d ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.18)";
      const _fill = _d ? "rgba(0,0,0,0.42)" : "rgba(255,255,255,0.45)";
      const _knob = _d ? "#ffffff" : "rgba(255,255,255,0.85)";
      const _knobBdr = _d ? "border:1px solid rgba(0,0,0,0.30);" : "";
      const _shadow = _d ? "0 1px 3px rgba(0,0,0,0.30)" : "0 1px 4px rgba(0,0,0,0.4)";
      return `<div id="lib-drag-handle" style="position:absolute;right:0;top:calc(50% + 6px);transform:translateY(-50%);display:flex;align-items:center;gap:6px;padding:6px 0 6px 8px;touch-action:none;user-select:none;cursor:ew-resize">
        <div id="lib-drag-track" style="position:relative;width:${LIB_TRACK_W}px;height:3px;background:${_track};border-radius:2px;cursor:ew-resize">
          <div style="position:absolute;top:0;left:0;width:${thumbPx}px;height:100%;background:${_fill};border-radius:2px;pointer-events:none"></div>
          <div id="lib-drag-thumb" style="position:absolute;top:50%;left:${thumbPx}px;transform:translateY(-50%);width:15px;height:15px;border-radius:50%;background:${_knob};${_knobBdr}box-shadow:${_shadow};pointer-events:none;margin-left:-7px;box-sizing:border-box"></div>
        </div>
      </div>`;
    })() : "";
    const viewWrap = isMob ? "" : `<div style="position:absolute;left:0;top:calc(50% + 6px);transform:translateY(-50%)">${viewSeg}</div>`;
    const pagWrap = pagHtml || dragHandle || viewWrap ? `<div style="flex-shrink:0;position:relative;${(dragHandle || viewWrap) && !pagHtml ? "height:36px" : ""}">${pagHtml}${viewWrap}${dragHandle}</div>` : "";
    const dialogHtml = m._bulkDialog ? `<div style="position:absolute;inset:0;z-index:20;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;border-radius:8px">${this._libBulkDialogHtml()}</div>` : "";
    return `<div style="flex-shrink:0">${toolbar}</div><div class="lib-results-wrap" style="display:contents"><div style="flex:1;min-height:0;overflow:hidden;position:relative">${contentHtml}${dialogHtml}</div>` + pagWrap + `</div>`;
  }
  // The two arrows carry the direction: the one that matches lights up, the
  // other stays dim. A single accented glyph could only say "sorted".
  _libSortIcon(dir) {
    const on = "#4da3ff";
    const off = "currentColor";
    const desc = dir !== "asc";
    const F = 'fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
    return `<svg viewBox="0 0 24 24" width="13" height="13" ${F} stroke="currentColor" style="flex-shrink:0">
      <g stroke="${desc ? on : off}" opacity="${desc ? 1 : 0.4}"><line x1="7" y1="4" x2="7" y2="20"/><polyline points="4 17 7 20 10 17"/></g>
      <g stroke="${desc ? off : on}" opacity="${desc ? 0.4 : 1}"><line x1="17" y1="20" x2="17" y2="4"/><polyline points="14 7 17 4 20 7"/></g>
    </svg>`;
  }
  _libBulkDialogHtml() {
    const m = this._libModal;
    const sel = [...m._selected || []];
    const allItems = this._libAllItems();
    const selItems = allItems.filter((i) => sel.includes(`${i._libType}-${i._libInst || "1"}-${i.id}`));
    const hasMovies = selItems.some((i) => i._libType === "movie");
    const hasShows = selItems.some((i) => i._libType === "tv");
    const _dStyle = `background:var(--is-menu-bg,#1c1c2e);border:1px solid var(--is-card-bdr,rgba(255,255,255,0.09));border-radius:20px;padding:20px 22px;min-width:380px;max-width:min(540px,90vw);box-sizing:border-box`;
    const _hStyle = `font-size:14px;font-weight:700;color:var(--is-text,#fff);margin:0 0 16px`;
    const _rowStyle = `display:flex;align-items:center;gap:12px;margin-bottom:10px`;
    const _labelStyle = `font-size:12px;color:var(--is-text,#fff);opacity:0.8;min-width:110px;text-align:right`;
    const _fld = "flex:1;min-width:0";
    const _footStyle = `display:flex;justify-content:flex-end;gap:8px;margin-top:18px;padding-top:16px;border-top:1px solid var(--is-card-bdr,rgba(255,255,255,0.09))`;
    const _cancelBtn = `<button data-lib-action="bulk-cancel" style="${MT_BTN}">Cancel</button>`;
    const _chk = (id, checked, label, hint) => `<label class="mt-chk" style="min-width:0">
      <input type="checkbox" id="${id}"${checked ? " checked" : ""}>
      <span class="mt-chk-box">${_ICO_CHECK}</span>
      <span class="mt-chk-lbl" style="font-weight:400;opacity:0.75">${hint}</span>
    </label>`;
    if (m._bulkDialog === "delete") {
      const n = selItems.length;
      const label = hasMovies && hasShows ? "items" : hasMovies ? `movie${n > 1 ? "s" : ""}` : `series`;
      const titles = selItems.slice(0, 8).map((i) => `<li>${this._escHtml(i.title || "")}</li>`).join("");
      const more = selItems.length > 8 ? `<li style="opacity:0.5">\u2026and ${selItems.length - 8} more</li>` : "";
      return `<div style="${_dStyle}">
        <p style="${_hStyle}">Delete Selected ${hasMovies && hasShows ? "Items" : hasMovies ? "Movie" : "Series"}</p>
        <div style="${_rowStyle}"><label style="${_labelStyle}">Add List Exclusion</label>
          ${_chk("bd-excl", m._bulkDelete.addImportExclusion, "Add List Exclusion", "Prevent from being re-added by lists")}</div>
        <div style="${_rowStyle}"><label style="${_labelStyle}">Delete Files</label>
          ${_chk("bd-files", m._bulkDelete.deleteFiles, "Delete Files", "Delete folder and its contents")}</div>
        <p style="font-size:12px;color:var(--is-text,#fff);opacity:0.8;margin:12px 0 4px">Are you sure you want to delete ${n} selected ${label}?</p>
        <ul style="font-size:12px;opacity:0.7;margin:0;padding-left:18px;line-height:1.8">${titles}${more}</ul>
        <div style="${_footStyle}">${_cancelBtn}<button data-lib-action="bulk-delete-confirm" style="${this._mtBtnA("red")}">Delete</button></div>
      </div>`;
    }
    if (m._bulkDialog === "tags") {
      return `<div style="${_dStyle}">
        <p style="${_hStyle}">Tags</p>
        <div style="${_rowStyle}"><label style="${_labelStyle}">Tags</label>
          <input id="bt-tags" type="text" value="${this._escHtml(m._bulkTags.tags)}" placeholder="tag1, tag2\u2026" class="mt-field" style="${_fld}"></div>
        <div style="${_rowStyle}"><label style="${_labelStyle}">Apply Tags</label>
          ${this._mtFieldSelect("bt-mode", [["add", "Add"], ["remove", "Remove"], ["replace", "Replace"]], m._bulkTags.applyTags, _fld)}</div>
        <div style="${_footStyle}">${_cancelBtn}<button data-lib-action="bulk-tags-confirm" style="${this._mtBtnA("blue")}">Apply</button></div>
      </div>`;
    }
    const hasMov1 = selItems.some((i) => i._libType === "movie" && (i._libInst || "1") === "1");
    const hasMov2 = selItems.some((i) => i._libType === "movie" && i._libInst === "2");
    const hasShw1 = selItems.some((i) => i._libType === "tv" && (i._libInst || "1") === "1");
    const hasShw2 = selItems.some((i) => i._libType === "tv" && i._libInst === "2");
    const profiles = [].concat(hasMov1 ? this._radarrProfiles || [] : []).concat(hasMov2 ? this._radarr2Profiles || [] : []).concat(hasShw1 ? this._sonarrProfiles || [] : []).concat(hasShw2 ? this._sonarr2Profiles || [] : []);
    const uniqueProfiles = [...new Map(profiles.map((p) => [p.name, p])).values()];
    const NC = "No Change";
    const profileItems = [["", NC], ...uniqueProfiles.map((p) => [p.name, p.name])];
    const monItems = [["", NC], ["true", "Monitored"], ["false", "Unmonitored"]];
    const availItems = [["", NC], ["announced", "Announced"], ["inCinemas", "In Cinemas"], ["released", "Released"], ["tba", "TBA"]];
    const monNewItems = [["", NC], ["all", "All"], ["none", "None"], ["latest", "Latest"]];
    const serTypeItems = [["", NC], ["standard", "Standard"], ["daily", "Daily"], ["anime", "Anime"]];
    const sfItems = [["", NC], ["true", "Yes"], ["false", "No"]];
    const mixed = hasMovies && hasShows;
    const title = mixed ? "Items" : hasMovies ? "Movies" : "Series";
    const _appCol = (txt) => mixed ? `<span style="font-size:10px;opacity:0.45;white-space:nowrap;min-width:90px">${txt}</span>` : "";
    const _row = (label, ctrl, app) => `<div style="${_rowStyle}"><label style="${_labelStyle}">${label}</label>${ctrl}${_appCol(app)}</div>`;
    const hdrRow = mixed ? `<div style="${_rowStyle};margin-bottom:4px"><span style="${_labelStyle}"></span><span style="flex:1"></span><span style="font-size:10px;font-weight:600;opacity:0.5;min-width:90px">Applies to</span></div>` : "";
    return `<div style="${_dStyle}">
      <p style="${_hStyle}">Edit Selected ${title}</p>
      ${hdrRow}
      ${_row("Monitored", this._mtFieldSelect("be-mon", monItems, m._bulkEdit.monitored, _fld), "Movies + Series")}
      ${_row("Quality Profile", this._mtFieldSelect("be-qual", profileItems, m._bulkEdit.qualityProfileId, _fld), "Movies + Series")}
      ${hasMovies ? _row("Min Availability", this._mtFieldSelect("be-avail", availItems, m._bulkEdit.minimumAvailability, _fld), "Movies only") : ""}
      ${hasShows ? _row("Monitor New Items", this._mtFieldSelect("be-monnew", monNewItems, m._bulkEdit.monitorNewItems, _fld), "Series only") : ""}
      ${hasShows ? _row("Series Type", this._mtFieldSelect("be-sertype", serTypeItems, m._bulkEdit.seriesType, _fld), "Series only") : ""}
      ${hasShows ? _row("Season Folder", this._mtFieldSelect("be-sf", sfItems, m._bulkEdit.seasonFolder, _fld), "Series only") : ""}
      <p style="font-size:11px;opacity:0.5;margin:0 0 4px;text-align:right">${selItems.length} ${title.toLowerCase()} selected</p>
      <div style="${_footStyle}">${_cancelBtn}<button data-lib-action="bulk-edit-confirm" style="${this._mtBtnA("blue")}">Apply Changes</button></div>
    </div>`;
  }
  // ─── Modal poster card ────────────────────────────────────────────────────
  _libPosterCard(item) {
    const pc = this._posterCfg();
    const m = this._libModal;
    if (item._libType === "music") {
      return this._renderMusicCard({ id: item.id, artist: item, newestAlbum: null, newAlbumCount: 0 }, { noSub: true });
    }
    const isMovie = item._libType === "movie";
    const poster = isMovie ? this._getRadarrPoster(item) : this._getSonarrPoster(item);
    const title = this._escHtml(item.title || "");
    const img = this._mcImg(poster, isMovie ? "\u{1F3AC}" : "\u{1F4FA}", item.id);
    const popupType = isMovie ? "radarr" : "sonarr";
    const tmdbAttr = item.tmdbId ? ` data-tmdbid="${item.tmdbId}"` : "";
    const tvdbAttr = !isMovie && item.tvdbId ? ` data-tvdbid="${item.tvdbId}"` : "";
    const radarrAttr = isMovie && item.id ? ` data-radarrid="${item.id}"` : "";
    const ratingHtml = pc.rating ? this._ratingBadge({ ...item, _mediaType: isMovie ? "movie" : "tv" }) : "";
    const showStripe = pc.statusDisplay === "stripes" || pc.statusDisplay === "both";
    const sizeBytes = isMovie ? item.movieFile?.size || 0 : item.statistics?.sizeOnDisk || 0;
    const sizeStr = sizeBytes ? this.fmtSize(sizeBytes) : "";
    const _mediaTag = pc.mediaType ? `<span class="media-type-tag" style="position:static">${isMovie ? "Movie" : "Show"}</span>` : "";
    const _sizeTag = sizeStr ? `<span class="media-type-tag" style="position:static">${sizeStr}</span>` : "";
    const qualStr = this._qualityLabel(item, isMovie);
    const _qualTag = qualStr ? `<span class="media-type-tag" style="position:static">${this._escHtml(qualStr)}</span>` : "";
    const typeTag = _mediaTag || _sizeTag || _qualTag ? `<div style="position:absolute;top:5px;left:5px;z-index:4;display:flex;flex-direction:column;align-items:flex-start;gap:3px">${_mediaTag}${_sizeTag}${_qualTag}</div>` : "";
    const selKey = `${item._libType}-${item._libInst || "1"}-${item.id}`;
    const checked = m._editMode && m._selected?.has(selKey);
    const checkHtml = m._editMode ? `<div data-lib-sel="${selKey}" style="position:absolute;top:5px;right:5px;z-index:5;width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,0.85);background:${checked ? "rgba(0,122,255,0.9)" : "rgba(0,0,0,0.45)"};display:flex;align-items:center;justify-content:center;cursor:pointer;box-sizing:border-box">${checked ? `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none"><polyline points="20 6 9 17 4 12"/></svg>` : ""}</div>` : "";
    const popupAttr = m._editMode ? "" : ` data-lib-popup="${popupType}"${tmdbAttr}${tvdbAttr}${radarrAttr} data-title="${title}"`;
    const small = (m._libCols || 0) >= 8;
    const _b = (cls, icon, text) => small ? `<span class="badge ${cls}">${icon}</span>` : this._badge(cls, icon, text);
    let statusBadge = "";
    let badgeCls = "";
    if (!m._editMode) {
      let badgeHtml = "";
      if (isMovie) {
        const dlFailed = this._radarrQueueFailed?.has(item.id);
        const dlActive = this._radarrQueueActive?.has(item.id);
        if (item.hasFile && item.movieFile?.qualityCutoffNotMet) {
          badgeCls = "b-cutoff";
          badgeHtml = _b("b-cutoff", "\u26A1", "Upgrade");
        } else if (item.hasFile) {
          badgeCls = "b-st-avail";
          badgeHtml = _b("b-st-avail", "\u2713", this._t("badgeAvailable"));
        } else if (dlFailed) {
          badgeCls = "b-missing";
          badgeHtml = _b("b-missing", "\u2717", this._t("badgeFailed"));
        } else if (dlActive) {
          badgeCls = "b-dl";
          badgeHtml = _b("b-dl", "\u2193", this._t("badgeDownloading"));
        } else {
          badgeCls = "b-missing";
          badgeHtml = _b("b-missing", "\u2717", this._t("badgeMissing"));
        }
      } else {
        const fc = item.statistics?.episodeFileCount || 0;
        const tc2 = item.statistics?.episodeCount || 0;
        if (fc === 0 && tc2 > 0) {
          badgeCls = "b-missing";
          badgeHtml = _b("b-missing", "\u2717", this._t("badgeMissing"));
        } else if (fc < tc2) {
          badgeCls = "b-partial";
          badgeHtml = small ? `<span class="badge b-partial">${fc}</span>` : `<span class="badge b-partial">${fc}/<span class="b-txt">${tc2}</span></span>`;
        } else if (fc > 0 && item.status === "continuing") {
          badgeCls = "b-continuing";
          badgeHtml = _b("b-continuing", "\u25B6", this._t("badgeAvailable"));
        } else if (fc > 0) {
          badgeCls = "b-st-avail";
          badgeHtml = _b("b-st-avail", "\u2713", this._t("badgeAvailable"));
        }
      }
      const showTag = pc.statusDisplay === "tags" || pc.statusDisplay === "both";
      statusBadge = badgeHtml && showTag ? this._statusBadge(badgeHtml) : "";
    }
    const _libFc = item.statistics?.episodeFileCount || 0;
    const _libTc = item.statistics?.episodeCount || 0;
    const _libPp = !isMovie && badgeCls === "b-partial" && _libTc > 0 ? Math.round(_libFc / _libTc * 100) : -1;
    const _libSp = badgeCls === "b-dl" ? this._dlPct(item.id, isMovie ? "movie" : "tv") : _libPp;
    const statusBar = showStripe ? this._statusStripe(badgeCls ? this._statusStripeColor(badgeCls) : this._libStatusColor(item), badgeCls === "b-dl", _libSp) : "";
    let subBadge = "";
    let audioBadge = "";
    let subCodes = [];
    let audioCodes = [];
    if (!m._editMode) {
      if (isMovie && item.hasFile) {
        if (pc.audio) {
          let audioLangs = [];
          if (Array.isArray(item.movieFile?.languages) && item.movieFile.languages.length > 0) {
            audioLangs = item.movieFile.languages.map((l) => this._langCode(l.name || "")).filter(Boolean);
          } else if (item.movieFile?.mediaInfo?.audioLanguages) {
            audioLangs = item.movieFile.mediaInfo.audioLanguages.split(/\s*[\/,]\s*/).map((l) => this._langCode(l.trim())).filter(Boolean);
          }
          if (audioLangs.length > 0) {
            audioCodes = audioLangs;
            audioBadge = this._badgeIcon("b-audio", "mdi:volume-high", this._topLangs(audioLangs).join(" | "));
          }
        }
        if (pc.subtitles) {
          const bz = this._bazarrConfigured ? this._bazarr[item.id] : null;
          if (bz) {
            if (bz.missing.length > 0) {
              subCodes = [];
              subBadge = this._badgeIcon("b-sub-miss", "mdi:subtitles-outline", this._topLangs(bz.missing.map((s) => (s.code2 || s.name || "?").toUpperCase())).join(" | "));
            } else if (bz.subtitles.length > 0) {
              subCodes = bz.subtitles.map((s) => (s.code2 || s.name || "?").toUpperCase());
              subBadge = this._badgeIcon("b-sub-ok", "mdi:subtitles", this._topLangs(subCodes).join(" | "));
            }
          }
        }
      } else if (!isMovie && (item.statistics?.episodeFileCount ?? 0) > 0) {
        const inst = item._libInst || "1";
        if (pc.audio) {
          const cached = this._libTvAudioCache.get(`${inst}-${item.id}`);
          if (Array.isArray(cached) && cached.length) {
            audioCodes = cached;
            audioBadge = this._badgeIcon("b-audio", "mdi:volume-high", this._topLangs(cached).join(" | "));
          } else if (cached === void 0) {
            this._fetchLibTvAudio(item.id, inst);
          }
        }
        const subs = this._tvSubInfo(item.id, inst);
        if (subs) {
          subCodes = subs.missing ? [] : subs.codes;
          subBadge = this._badgeIcon(subs.missing ? "b-sub-miss" : "b-sub-ok", subs.missing ? "mdi:subtitles-outline" : "mdi:subtitles", this._topLangs(subs.codes).join(" | "));
        }
      }
    }
    const flagStrip = this._ratingLangBlock({ ...item, _mediaType: isMovie ? "movie" : "tv" }, { subCodes, audioCodes, subBadge, audioBadge });
    return `
      <div class="mc"${popupAttr}>
        <div style="position:absolute;inset:0;overflow:hidden">${img}</div>
        ${this._mcGrad("rgba(0,0,0,0.7)", `${flagStrip}${pc.title ? `<div style="font-size:10px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</div>` : ""}`)}
        ${typeTag}
        ${statusBadge}
        ${this._goneBadge(item.tmdbId, isMovie ? null : item.tvdbId, isMovie, { compact: small })}
        ${checkHtml}
        ${statusBar}
      </div>`;
  }
  // Library's status classes predate the shared badge palette — map them over.
  _libBadgeTone(cls) {
    return {
      "b-st-avail": "green",
      "b-ok": "green",
      "b-cutoff": "amber",
      "b-partial": "amber",
      "b-missing": "red",
      "b-dl": "blue",
      "b-continuing": "blue"
    }[cls] || "neutral";
  }
  // ─── Table: status badge for a single item ────────────────────────────────
  _libTableStatus(item) {
    const isMovie = item._libType === "movie";
    if (isMovie) {
      const dlFailed = this._radarrQueueFailed?.has(item.id);
      const dlActive = this._radarrQueueActive?.has(item.id);
      const qName = item.movieFile?.quality?.quality?.name || "";
      if (item.hasFile && item.movieFile?.qualityCutoffNotMet) return { cls: "b-cutoff", label: qName || "Upgrade" };
      if (item.hasFile) return { cls: "b-st-avail", label: qName || "Available" };
      if (dlFailed) return { cls: "b-missing", label: "Failed" };
      if (dlActive) return { cls: "b-dl", label: "Downloading" };
      return { cls: "b-missing", label: "Missing" };
    }
    if (item._libType === "music") {
      const have = item.statistics?.trackFileCount ?? 0;
      const total = item.statistics?.trackCount ?? 0;
      if (total === 0) return { cls: "", label: "" };
      if (have === 0) return { cls: "b-missing", label: "Missing" };
      if (have < total) return { cls: "b-partial", label: `${have} / ${total}` };
      return { cls: "b-st-avail", label: `${have} / ${total}` };
    }
    const fc = item.statistics?.episodeFileCount || 0;
    const tc = item.statistics?.episodeCount || 0;
    if (fc === 0 && tc > 0) return { cls: "b-missing", label: "Missing" };
    if (fc < tc) return { cls: "b-partial", label: `${fc} / ${tc}` };
    if (fc > 0 && item.status === "continuing") return { cls: "b-continuing", label: `${fc} / ${tc}` };
    if (fc > 0) return { cls: "b-st-avail", label: `${fc} / ${tc}` };
    return { cls: "", label: "" };
  }
  // ─── Modal table ──────────────────────────────────────────────────────────
  _libTableHtml(items) {
    const isMob = this._isMob;
    const isTab = this._isTablet;
    const m = this._libModal;
    if (m.typeKey === "music") return this._libMusicTableHtml(items);
    const _icoMov = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;opacity:0.7"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/></svg>`;
    const _icoTv = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;opacity:0.7"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
    const _statusBadge = (st) => {
      if (!st.cls) return "";
      return this._uiBadge(st.label, this._libBadgeTone(st.cls));
    };
    const _popupAttrs = (item) => {
      const isMovie = item._libType === "movie";
      const title = this._escHtml(item.title || "");
      const popupType = isMovie ? "radarr" : "sonarr";
      const tmdbAttr = item.tmdbId ? ` data-tmdbid="${item.tmdbId}"` : "";
      const tvdbAttr = !isMovie && item.tvdbId ? ` data-tvdbid="${item.tvdbId}"` : "";
      const radarrAttr = isMovie && item.id ? ` data-radarrid="${item.id}"` : "";
      return m._editMode ? "" : ` data-lib-popup="${popupType}"${tmdbAttr}${tvdbAttr}${radarrAttr} data-title="${title}"`;
    };
    const _checkEl = (item, tag = "div") => {
      if (!m._editMode) return "";
      const selKey = `${item._libType}-${item._libInst || "1"}-${item.id}`;
      const checked = m._selected?.has(selKey);
      const inner = checked ? `<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none"><polyline points="20 6 9 17 4 12"/></svg>` : "";
      const el = `<div data-lib-sel="${selKey}" style="width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,0.7);background:${checked ? "rgba(0,122,255,0.9)" : "transparent"};display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;box-sizing:border-box">${inner}</div>`;
      return tag === "td" ? `<td style="width:28px;padding:0 6px">${el}</td>` : el;
    };
    const _monIcon = (item) => item.monitored ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;opacity:0.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>` : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:0.3"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
    if (isMob) {
      const rows2 = items.map((item) => {
        const isMovie = item._libType === "movie";
        const title = this._escHtml(item.title || "");
        const st = this._libTableStatus(item);
        const sizeBytes = isMovie ? item.movieFile?.size || 0 : item.statistics?.sizeOnDisk || 0;
        const sizeStr = sizeBytes ? this.fmtSize(sizeBytes) : "";
        const profile = item.qualityProfileName || "";
        const _mtMob = (txt) => txt ? `<span class="media-type-tag" style="position:static;font-size:9px;padding:1px 5px">${txt}</span>` : "";
        const metaTags = [_mtMob(profile), _mtMob(sizeStr)].filter(Boolean).join("");
        return `<div class="lib-table-row"${_popupAttrs(item)} style="display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid var(--is-divider,rgba(255,255,255,0.07))">
          ${_checkEl(item)}
          ${_monIcon(item)}
          <span style="display:inline-flex;flex-shrink:0">${isMovie ? _icoMov : _icoTv}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;color:var(--is-text,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</div>
            ${metaTags ? `<div style="display:flex;gap:4px;margin-top:2px">${metaTags}</div>` : ""}
          </div>
          ${_statusBadge(st)}
        </div>`;
      }).join("");
      return `<div style="overflow-y:auto">${rows2}</div>`;
    }
    const _thStyle = "cursor:pointer;user-select:none;white-space:nowrap";
    const _sortArrow = (key) => {
      const active = m.sort === key;
      const char = active ? m.sortDir === "asc" ? "\u2191" : "\u2193" : "\u2195";
      return `<span style="margin-left:3px;font-size:9px;opacity:${active ? "0.85" : "0.2"}">${char}</span>`;
    };
    const hasTv = items.some((i) => i._libType !== "movie");
    const rows = items.map((item) => {
      const isMovie = item._libType === "movie";
      const title = this._escHtml(item.title || "");
      const _mtTag = (txt) => txt ? this._uiBadge(txt, "neutral") : "\u2014";
      const profileRaw = this._escHtml(item.qualityProfileName || "");
      const profile = _mtTag(profileRaw);
      const sizeBytes = isMovie ? item.movieFile?.size || 0 : item.statistics?.sizeOnDisk || 0;
      const sizeStr = _mtTag(sizeBytes ? this.fmtSize(sizeBytes) : "");
      const st = this._libTableStatus(item);
      const typeTag = `<span style="display:inline-flex;align-items:center;flex-shrink:0;margin-right:6px">${isMovie ? _icoMov : _icoTv}</span>`;
      let extraCells = "";
      if (!isTab) {
        const ratingTxt = this._ratingBadge({ ...item, _mediaType: isMovie ? "movie" : "tv" }, true) || "\u2014";
        extraCells += `<td>${ratingTxt}</td>`;
        if (hasTv) {
          const seasons = isMovie ? "" : String(item.statistics?.seasonCount || item.seasonCount || "\u2014");
          const fc = isMovie ? "" : String(item.statistics?.episodeFileCount || 0);
          const tc = isMovie ? "" : String(item.statistics?.episodeCount || 0);
          const epStr = isMovie ? "" : `${fc} / ${tc}`;
          extraCells += `<td style="text-align:center">${seasons}</td>`;
          extraCells += `<td style="text-align:center">${epStr}</td>`;
        }
      }
      return `<tr class="lib-table-row"${_popupAttrs(item)}>
        ${_checkEl(item, "td")}
        <td><div style="display:flex;align-items:center;gap:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_monIcon(item)}<span style="margin:0 6px 0 4px">${typeTag}</span>${title}</div></td>
        <td>${profile}</td>
        <td>${sizeStr}</td>
        ${extraCells}
        <td style="text-align:right">${_statusBadge(st)}</td>
      </tr>`;
    }).join("");
    let extraHeaders = "";
    if (!isTab) {
      extraHeaders += `<th data-lib-th-sort="imdb" style="${_thStyle};width:110px">Rating${_sortArrow("imdb")}</th>`;
      if (hasTv) {
        extraHeaders += `<th style="${_thStyle};width:70px;text-align:center">Seasons</th>`;
        extraHeaders += `<th style="${_thStyle};width:80px;text-align:center">Episodes</th>`;
      }
    }
    return `<table class="tl-users-table lib-table" style="width:100%;table-layout:fixed">
      <thead><tr>
        <th data-lib-th-sort="title"    style="${_thStyle};width:auto">Title${_sortArrow("title")}</th>
        <th data-lib-th-sort="qualprof" style="${_thStyle};width:130px">Quality Profile${_sortArrow("qualprof")}</th>
        <th data-lib-th-sort="size"     style="${_thStyle};width:90px">Size${_sortArrow("size")}</th>
        ${extraHeaders}
        <th data-lib-th-sort="status"   style="${_thStyle};width:110px;text-align:right">Status${_sortArrow("status")}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }
  _libMusicTableHtml(items) {
    const isMob = this._isMob;
    const isTab = this._isTablet;
    const m = this._libModal;
    const _ico = `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="pointer-events:none;opacity:0.7"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z"/></svg>`;
    const _mon = (a) => a.monitored ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;opacity:0.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>` : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:0.3"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
    const _tag = (txt) => txt ? this._uiBadge(txt, "neutral") : "\u2014";
    const _row = (a) => {
      const st = this._libTableStatus(a);
      return {
        name: this._escHtml(a.artistName || a.title || ""),
        albums: a.statistics?.albumCount ?? 0,
        have: a.statistics?.trackFileCount ?? 0,
        total: a.statistics?.trackCount ?? 0,
        size: a.statistics?.sizeOnDisk ? this.fmtSize(a.statistics.sizeOnDisk) : "",
        rating: this._musRatingBadge(a, true),
        badge: st.cls ? this._uiBadge(st.label, this._libBadgeTone(st.cls)) : ""
      };
    };
    const _attrs = (a) => m._editMode ? "" : ` data-artist-id="${a.id}"`;
    if (isMob) {
      const rows2 = items.map((a) => {
        const r = _row(a);
        const tags = [r.albums ? `${r.albums} albums` : "", r.size].filter(Boolean).map((t) => `<span class="media-type-tag" style="position:static;font-size:9px;padding:1px 5px">${t}</span>`).join("");
        return `<div class="lib-table-row${this._libFlashArtist && this._libFlashArtist === a.id ? " lib-flash" : ""}"${_attrs(a)} style="display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid var(--is-divider,rgba(255,255,255,0.07))">
          ${_mon(a)}
          <span style="display:inline-flex;flex-shrink:0">${_ico}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;color:var(--is-text,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.name}</div>
            ${tags ? `<div style="display:flex;gap:4px;margin-top:2px">${tags}</div>` : ""}
          </div>
          ${r.badge}
        </div>`;
      }).join("");
      return `<div style="overflow-y:auto">${rows2}</div>`;
    }
    const _thStyle = "cursor:pointer;user-select:none;white-space:nowrap";
    const _sortArrow = (key) => {
      const active = m.sort === key;
      const char = active ? m.sortDir === "asc" ? "\u2191" : "\u2193" : "\u2195";
      return `<span style="margin-left:3px;font-size:9px;opacity:${active ? "0.85" : "0.2"}">${char}</span>`;
    };
    const rows = items.map((a) => {
      const r = _row(a);
      return `<tr class="lib-table-row${this._libFlashArtist && this._libFlashArtist === a.id ? " lib-flash" : ""}"${_attrs(a)}>
        <td><div style="display:flex;align-items:center;gap:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_mon(a)}<span style="margin:0 6px 0 4px;display:inline-flex">${_ico}</span>${r.name}</div></td>
        <td style="text-align:center">${r.albums || "\u2014"}</td>
        <td style="text-align:center">${r.total ? `${r.have} / ${r.total}` : "\u2014"}</td>
        <td>${_tag(r.size)}</td>
        ${isTab ? "" : `<td>${r.rating || "\u2014"}</td>`}
        <td style="text-align:right">${r.badge}</td>
      </tr>`;
    }).join("");
    return `<table class="tl-users-table lib-table" style="width:100%;table-layout:fixed">
      <thead><tr>
        <th data-lib-th-sort="title"  style="${_thStyle};width:auto">Artist${_sortArrow("title")}</th>
        <th data-lib-th-sort="albums" style="${_thStyle};width:80px;text-align:center">Albums${_sortArrow("albums")}</th>
        <th data-lib-th-sort="tracks" style="${_thStyle};width:100px;text-align:center">Tracks${_sortArrow("tracks")}</th>
        <th data-lib-th-sort="size"   style="${_thStyle};width:90px">Size${_sortArrow("size")}</th>
        ${isTab ? "" : `<th data-lib-th-sort="rating" style="${_thStyle};width:90px">Rating${_sortArrow("rating")}</th>`}
        <th data-lib-th-sort="status" style="${_thStyle};width:110px;text-align:right">Status${_sortArrow("status")}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }
  // ─── Overview card ────────────────────────────────────────────────────────
  _libOverviewCard(item) {
    if (item._libType === "music") return this._libMusicOverviewCard(item);
    const isMovie = item._libType === "movie";
    const poster = isMovie ? this._getRadarrPoster(item) : this._getSonarrPoster(item);
    const title = this._escHtml(item.title || "");
    const year = item.year || "";
    const overview = this._escHtml((item.overview || "").slice(0, 160));
    const popupType = isMovie ? "radarr" : "sonarr";
    const tmdbAttr = item.tmdbId ? ` data-tmdbid="${item.tmdbId}"` : "";
    const tvdbAttr = !isMovie && item.tvdbId ? ` data-tvdbid="${item.tvdbId}"` : "";
    const radarrAttr = isMovie && item.id ? ` data-radarrid="${item.id}"` : "";
    const m = this._libModal;
    const selKey = `${item._libType}-${item._libInst || "1"}-${item.id}`;
    const checked = m._editMode && m._selected?.has(selKey);
    const checkHtml = m._editMode ? `<div data-lib-sel="${selKey}" style="width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,0.7);background:${checked ? "rgba(0,122,255,0.9)" : "transparent"};display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;align-self:center;box-sizing:border-box">${checked ? `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none"><polyline points="20 6 9 17 4 12"/></svg>` : ""}</div>` : "";
    const popupAttrs = m._editMode ? "" : ` data-lib-popup="${popupType}"${tmdbAttr}${tvdbAttr}${radarrAttr} data-title="${title}"`;
    const imgHtml = poster ? `<img src="${poster}" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy" onerror="this.style.display='none'">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:20px">${isMovie ? "\u{1F3AC}" : "\u{1F4FA}"}</div>`;
    const st = this._libTableStatus(item);
    const stBadge = st.cls ? this._uiBadge(st.label, this._libBadgeTone(st.cls)) : "";
    const sizeBytes = isMovie ? item.movieFile?.size || 0 : item.statistics?.sizeOnDisk || 0;
    const sizeTxt = sizeBytes ? this.fmtSize(sizeBytes) : "";
    const profile = item.qualityProfileName || "";
    const seasons = !isMovie ? item.statistics?.seasonCount || item.seasonCount || "" : "";
    const rightTags = [
      sizeTxt && this._uiBadge(sizeTxt, "neutral"),
      profile && this._uiBadge(this._escHtml(profile), "neutral"),
      seasons && this._uiBadge(`${seasons} season${seasons != 1 ? "s" : ""}`, "neutral")
    ].filter(Boolean).join("");
    return `<div class="lib-table-row"${popupAttrs} style="display:flex;gap:10px;align-items:flex-start;padding:8px;border-radius:8px;background:var(--is-row-hover,rgba(255,255,255,0.04))">
      ${checkHtml}
      <div style="width:42px;height:63px;flex-shrink:0;border-radius:5px;overflow:hidden;background:rgba(255,255,255,0.08)">${imgHtml}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
          <span style="font-size:12px;font-weight:700;color:var(--is-text,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</span>
        </div>
        ${year ? `<div style="font-size:10px;color:var(--is-text-muted);margin-bottom:4px">${year}</div>` : ""}
        ${overview ? `<div style="font-size:10px;color:var(--is-text-muted);line-height:1.45;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${overview}</div>` : ""}
      </div>
      <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:4px;align-self:center">
        ${this._ratingBadge({ ...item, _mediaType: isMovie ? "movie" : "tv" }, true)}
        ${stBadge}
        ${rightTags ? `<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;justify-content:flex-end">${rightTags}</div>` : ""}
      </div>
    </div>`;
  }
  // The same row as a film's, reading what an artist actually has: albums and
  // tracks in place of a year and a quality profile, and square artwork.
  _libMusicOverviewCard(artist) {
    const m = this._libModal;
    const name = this._escHtml(artist.artistName || artist.title || "");
    const overview = this._escHtml((artist.overview || "").slice(0, 160));
    const art = this._lidarrArtistImage(artist, "poster");
    const st = this._libTableStatus(artist);
    const stBadge = st.cls ? this._uiBadge(st.label, this._libBadgeTone(st.cls)) : "";
    const albums = artist.statistics?.albumCount ?? 0;
    const size = artist.statistics?.sizeOnDisk ? this.fmtSize(artist.statistics.sizeOnDisk) : "";
    const tags = [
      size && this._uiBadge(size, "neutral"),
      albums && this._uiBadge(`${albums} album${albums != 1 ? "s" : ""}`, "neutral")
    ].filter(Boolean).join("");
    const imgHtml = art ? `<img src="${art}" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy" onerror="this.style.display='none'">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:16px">${this._escHtml(this._musInitials(artist.artistName || artist.title))}</div>`;
    return `<div class="lib-table-row${this._libFlashArtist && this._libFlashArtist === artist.id ? " lib-flash" : ""}"${m._editMode ? "" : ` data-artist-id="${artist.id}"`} style="display:flex;gap:10px;align-items:center;height:79px;box-sizing:border-box;padding:8px;border-radius:8px;background:var(--is-row-hover,rgba(255,255,255,0.04))">
      <div style="width:63px;height:63px;flex-shrink:0;border-radius:5px;overflow:hidden;background:rgba(255,255,255,0.08)">${imgHtml}</div>
      <div style="flex:1;min-width:0;align-self:center">
        <div style="font-size:12px;font-weight:700;color:var(--is-text,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px">${name}</div>
        ${overview ? `<div style="font-size:10px;color:var(--is-text-muted);line-height:1.45;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${overview}</div>` : ""}
      </div>
      <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;gap:4px;min-height:0;overflow:hidden">
        ${this._musRatingBadge(artist, true)}
        ${stBadge}
        ${tags ? `<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;justify-content:flex-end">${tags}</div>` : ""}
      </div>
    </div>`;
  }
  // ─── Data helpers ─────────────────────────────────────────────────────────
  _libFilteredItems() {
    const m = this._libModal;
    let items = this._libAllItems();
    if (m.filter === "monitored") items = items.filter((i) => i.monitored);
    if (m.filter === "unmonitored") items = items.filter((i) => !i.monitored);
    const _onDisk = (i) => i._libType === "movie" ? !!i.hasFile : i._libType === "music" ? (i.statistics?.trackFileCount || 0) > 0 : (i.statistics?.episodeFileCount || 0) > 0;
    if (m.filter === "missing") items = items.filter((i) => !_onDisk(i));
    if (m.filter === "wanted") items = items.filter((i) => i.monitored && !_onDisk(i));
    if (m.filter === "cutoff") items = items.filter((i) => i._libType === "movie" ? !!i.movieFile?.qualityCutoffNotMet : false);
    if (m.search) {
      const q = m.search.toLowerCase();
      items = items.filter((i) => (i.title || "").toLowerCase().includes(q) || (i.originalTitle || "").toLowerCase().includes(q));
    }
    const dir = m.sortDir === "desc" ? -1 : 1;
    return [...items].sort((a, b) => {
      switch (m.sort) {
        case "status":
          return dir * ((a.monitored ? 1 : 0) - (b.monitored ? 1 : 0)) || dir * ((a.hasFile || a.statistics?.episodeFileCount ? 1 : 0) - (b.hasFile || b.statistics?.episodeFileCount ? 1 : 0));
        case "title":
          return dir * (a.title || "").localeCompare(b.title || "");
        case "studio":
          return dir * (a.studio || "").localeCompare(b.studio || "");
        case "qualprof":
          return dir * (a.qualityProfileName || "").localeCompare(b.qualityProfileName || "");
        case "added":
          return dir * (new Date(a.added || 0) - new Date(b.added || 0));
        case "year":
          return dir * ((a.year || 0) - (b.year || 0));
        case "cinema":
          return dir * (new Date(a.inCinemas || 0) - new Date(b.inCinemas || 0));
        case "digital":
          return dir * (new Date(a.digitalRelease || 0) - new Date(b.digitalRelease || 0));
        case "physical":
          return dir * (new Date(a.physicalRelease || 0) - new Date(b.physicalRelease || 0));
        case "tmdb":
          return dir * ((a.ratings?.tmdb?.value || 0) - (b.ratings?.tmdb?.value || 0));
        case "imdb": {
          const ra = a.ratings?.imdb?.value || a.ratings?.tmdb?.value || a.ratings?.tvdb?.value || a.ratings?.tvMaze?.value || a.ratings?.trakt?.value || a.ratings?.value || 0;
          const rb = b.ratings?.imdb?.value || b.ratings?.tmdb?.value || b.ratings?.tvdb?.value || b.ratings?.tvMaze?.value || b.ratings?.trakt?.value || b.ratings?.value || 0;
          return dir * (ra - rb);
        }
        case "popularity":
          return dir * ((a.popularity || 0) - (b.popularity || 0));
        case "albums":
          return dir * ((a.statistics?.albumCount || 0) - (b.statistics?.albumCount || 0));
        case "tracks":
          return dir * ((a.statistics?.trackFileCount || 0) - (b.statistics?.trackFileCount || 0));
        case "rating":
          return dir * ((a.ratings?.value || 0) - (b.ratings?.value || 0));
        case "size":
          return dir * ((a.movieFile?.size || a.statistics?.sizeOnDisk || 0) - (b.movieFile?.size || b.statistics?.sizeOnDisk || 0));
        case "cert":
          return dir * (a.certification || "").localeCompare(b.certification || "");
        case "origtitle":
          return dir * (a.originalTitle || "").localeCompare(b.originalTitle || "");
        case "origlang":
          return dir * (a.originalLanguage?.name || "").localeCompare(b.originalLanguage?.name || "");
        case "quality": {
          const Q = ["2160p", "1080p", "720p", "480p"];
          const qa = Q.findIndex((r) => (a.movieFile?.quality?.quality?.name || "").includes(r));
          const qb = Q.findIndex((r) => (b.movieFile?.quality?.quality?.name || "").includes(r));
          const ra = qa === -1 ? -1 : Q.length - qa;
          const rb = qb === -1 ? -1 : Q.length - qb;
          return dir * (ra - rb);
        }
        default:
          return 0;
      }
    });
  }
  _libAllItems() {
    const m = this._libModal;
    const rp1 = new Map((this._radarrProfiles || []).map((p) => [p.id, p.name]));
    const rp2 = new Map((this._radarr2Profiles || []).map((p) => [p.id, p.name]));
    const sp1 = new Map((this._sonarrProfiles || []).map((p) => [p.id, p.name]));
    const sp2 = new Map((this._sonarr2Profiles || []).map((p) => [p.id, p.name]));
    const r1 = this._radarr || [];
    const r2 = this._radarr2Configured ? this._radarr2 || [] : [];
    const s1 = this._sonarr || [];
    const s2 = this._sonarr2Configured ? this._sonarr2 || [] : [];
    const inst = m.instFilter || "all";
    const movieSrc = inst === "1" ? r1.map((i) => ({ ...i, _libInst: "1" })) : inst === "2" ? r2.map((i) => ({ ...i, _libInst: "2" })) : [...r1.map((i) => ({ ...i, _libInst: "1" })), ...r2.map((i) => ({ ...i, _libInst: "2" }))];
    const tvSrc = inst === "1" ? s1.map((i) => ({ ...i, _libInst: "1" })) : inst === "2" ? s2.map((i) => ({ ...i, _libInst: "2" })) : [...s1.map((i) => ({ ...i, _libInst: "1" })), ...s2.map((i) => ({ ...i, _libInst: "2" }))];
    const movies = movieSrc.map((i) => ({ ...i, _libType: "movie", qualityProfileName: (i._libInst === "2" ? rp2 : rp1).get(i.qualityProfileId) || "" }));
    const tv = tvSrc.map((i) => ({ ...i, _libType: "tv", qualityProfileName: (i._libInst === "2" ? sp2 : sp1).get(i.qualityProfileId) || "" }));
    const music = (this._lidarrConfigured === false ? [] : [...this._lidarrArtists?.values() || []]).map((a) => ({ ...a, _libType: "music", title: a.artistName || "", _libInst: "1" }));
    let base;
    if (m.typeKey === "movies") base = movies;
    else if (m.typeKey === "tv") base = tv;
    else if (m.typeKey === "music") base = music;
    else base = [...movies, ...tv];
    if (m.qualityKey === "topquality") base = base.filter((i) => i._libType !== "music");
    if (m.qualityKey === "toprated") base = base.filter((i) => (i.ratings?.imdb?.value || i.ratings?.tmdb?.value || i.ratings?.tvdb?.value || i.ratings?.tvMaze?.value || i.ratings?.trakt?.value || i.ratings?.value || 0) > 0);
    if (m.qualityKey === "topquality") base = base.filter((i) => i._libType === "movie" && !!i.hasFile);
    return base;
  }
  _libSortOptions() {
    const m = this._libModal;
    const all = [
      { v: "status", label: "Monitored/Status" },
      { v: "title", label: "Title" },
      { v: "studio", label: "Studio" },
      { v: "qualprof", label: "Quality Profile" },
      { v: "added", label: "Added" },
      { v: "year", label: "Year" },
      { v: "cinema", label: "In Cinemas" },
      { v: "digital", label: "Digital Release" },
      { v: "physical", label: "Physical Release" },
      { v: "tmdb", label: "TMDb Rating" },
      { v: "imdb", label: "IMDb Rating" },
      { v: "popularity", label: "Popularity" },
      { v: "quality", label: "Quality" },
      { v: "size", label: "Size on Disk" },
      { v: "cert", label: "Certification" },
      { v: "origtitle", label: "Original Title" },
      { v: "origlang", label: "Original Language" }
    ];
    if (m.typeKey === "music") return [
      { v: "status", label: "Monitored/Status" },
      { v: "title", label: "Artist" },
      { v: "added", label: "Added" },
      { v: "albums", label: "Albums" },
      { v: "tracks", label: "Tracks on disk" },
      { v: "rating", label: "Rating" },
      { v: "size", label: "Size on Disk" }
    ];
    if (m.typeKey === "tv" && !m.qualityKey) return all.filter((o) => !["studio", "cinema", "digital", "physical", "cert", "quality"].includes(o.v));
    return all;
  }
  _libStatusColor(item) {
    const isMovie = item._libType === "movie";
    if (isMovie) {
      if (!item.hasFile) return item.monitored ? "#2980b9" : "#555";
      if (item.movieFile?.qualityCutoffNotMet) return "#e67e22";
      return item.monitored ? "#27ae60" : "#5a9e71";
    } else {
      const count = item.statistics?.episodeFileCount || 0;
      if (count === 0) return item.monitored ? "#2980b9" : "#555";
      const total = item.statistics?.episodeCount || 0;
      if (total > 0 && count < total) return item.monitored ? "#27ae60" : "#5a9e71";
      return item.monitored ? "#27ae60" : "#5a9e71";
    }
  }
};
var libraryMixin = _LibraryMethods.prototype;


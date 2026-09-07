
var TMDB_NOTICE_KEY = "arr-stack-tmdb-notice";
var TMDB_NOTICE_SNOOZE = 3 * 24 * 60 * 60 * 1e3;
var _RenderRight = class {
  _renderRight() {
    const perPage = Math.max(2, parseInt(this._cfgGet("discover", "categoriesCount", 3)) || 3);
    const regularPerPage = perPage - 1;
    const hasCalendar = this._calendar && this._calendar.length > 0;
    const hasPending = this._hass.user.is_admin && this._pendingRequests.length > 0;
    const DEFAULT_CATS = ["recentlyAdded", "recentlyRequested", "upcoming", "tvUpcoming", "trending", "popular", "recommendations", "calendar", "tautulli", "jellystat", "tracearr", "activity", "prowlarr", "maintainerr", "library"];
    const catConfig = this._config?.categories ? this._catConfigMigrated(this._config.categories) : DEFAULT_CATS.map((id) => ({ id, enabled: true }));
    const states = this._hass?.states || {};
    const hasActiveStreams = (this._jellyfinSessions || []).length > 0 || (this._embySessions || []).length > 0 || (this._kodiSessions || []).length > 0 || Object.keys(states).some((id) => {
      if (!id.startsWith("media_player.plex_")) return false;
      const st = states[id].state;
      return st === "playing" || st === "paused";
    });
    const CAT_FN = {
      radarr: () => this._renderRadarr(),
      sonarr: () => this._renderSonarr(),
      recentlyAdded: () => this._renderRecentlyAdded(),
      recentlyRequested: () => this._renderRecentlyRequested(),
      upcoming: () => this._renderUpcoming(),
      tvUpcoming: () => this._renderTvUpcoming(),
      trending: () => this._renderTrending(),
      popular: () => this._renderPopular(),
      recommendations: (() => {
        const src = this._recSources;
        return src.trakt || src.suggestarr || src.lastfm ? () => this._renderRecommendations() : null;
      })(),
      calendar: hasCalendar ? () => this._renderCalendar() : null,
      streams: hasActiveStreams ? () => this._renderStreams() : null,
      tautulli: this._hass?.user?.is_admin && this._tautulliConfigured !== false ? () => this._renderTautulli() : null,
      jellystat: this._hass?.user?.is_admin && this._jellystatConfigured !== false ? () => this._renderJellystat() : null,
      tracearr: this._hass?.user?.is_admin && this._tracearrConfigured !== false ? () => this._renderTracearr() : null,
      activity: this._hass?.user?.is_admin ? () => this._renderActivity() : null,
      prowlarr: this._hass?.user?.is_admin && this._prowlarrConfigured !== false ? () => this._renderProwlarr() : null,
      maintainerr: this._hass?.user?.is_admin && this._maintainerrConfigured !== false ? () => this._renderMaintainerr() : null,
      library: this._radarr?.length || this._sonarr?.length ? () => this._renderLibrary() : null
    };
    const regularCategories = [
      ...hasPending ? [() => this._renderPendingRequests()] : [],
      ...catConfig.filter((c) => c.enabled !== false).map((c) => CAT_FN[c.id]).filter(Boolean)
    ];
    const totalPages = Math.max(1, Math.ceil(regularCategories.length / regularPerPage));
    const page = Math.max(0, Math.min(this._rightPage || 0, totalPages - 1));
    this._rightTotalPages = totalPages;
    const regStart = page * regularPerPage;
    const regSlice = regularCategories.slice(regStart, regStart + regularPerPage);
    const pageSlice = [() => this._renderSearch(), ...regSlice];
    const _join = (fns) => fns.map((fn, i) => `${i === 1 ? '<div style="height:3px"></div>' : i > 1 ? '<div class="spacer-sm"></div>' : ""}${fn()}`).join("");
    const hasPrev = page > 0;
    const hasNext = page < totalPages - 1;
    const navBar = hasPrev || hasNext ? this._rpPag(page, totalPages, {
      firstAttr: 'data-section="right" data-dir="first"',
      prevAttr: 'data-section="right" data-dir="prev"',
      nextAttr: 'data-section="right" data-dir="next"',
      lastAttr: 'data-section="right" data-dir="last"',
      dotAttr: "data-page",
      dotSecAttr: 'data-section="right" '
    }) : "";
    if (this._overlay?.section) return `<div class="rp-sections">${this._renderSearch()}<div style="height:3px"></div>${this._renderSectionOverlay(this._overlay.section)}</div>${this._renderSectionOverlayNav(this._overlay.section)}`;
    if (this._searchActive) {
      const _sCols = Math.max(2, Math.min(10, parseInt(this._cfgGet("discover", "itemsPerCategory", 4)) || 4));
      const searchPerPage = _sCols * 2;
      const searchTotal = Math.ceil((this._searchResults || []).length / searchPerPage);
      const sp = this._searchPage || 0;
      const hasPrevS = sp > 0;
      const hasNextS = sp < searchTotal - 1;
      const searchNavBar = searchTotal > 1 ? this._rpPag(sp, searchTotal, {
        firstAttr: 'data-section="right" data-dir="first"',
        prevAttr: 'data-section="right" data-dir="prev"',
        nextAttr: 'data-section="right" data-dir="next"',
        lastAttr: 'data-section="right" data-dir="last"',
        dotAttr: "data-page",
        dotSecAttr: 'data-section="right" '
      }) : "";
      return `<div class="rp-sections">${this._renderSearch()}</div>${searchNavBar}`;
    }
    const filler = Array(Math.max(0, regularPerPage - regSlice.length)).fill('<div class="spacer-sm"></div>').join("");
    return `<div class="rp-sections">${_join(pageSlice)}${filler}</div>${navBar}`;
  }
  // One-off notice for installs with neither Seerr nor their own TMDB key: those
  // lose posters, ratings, cast, trailers and the Trending/Popular rows on
  // 2026-09-01. Admins only — nobody else can act on it — and snoozed for three
  // days per dismissal so it reminds without nagging daily.
  _tmdbNoticeSnoozed() {
    try {
      const until = parseInt(localStorage.getItem(TMDB_NOTICE_KEY) || "0", 10);
      return Date.now() < until;
    } catch (_) {
      return false;
    }
  }
  _tmdbNoticeHtml() {
    if (!this._hass?.user?.is_admin) return "";
    if (this._overseerrConfigured !== false || this._tmdbOwnKey !== false) return "";
    if (this._tmdbNoticeSnoozed()) return "";
    return `
    <div class="tmdb-notice">
      <svg class="tmdb-notice-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
      <span class="tmdb-notice-txt">${this._t("tmdbNoticeShort")}</span>
      <button class="tmdb-notice-btn" data-tmdb-info>${this._t("tmdbNoticeMore")}</button>
      <button class="tmdb-notice-x" data-tmdb-notice-dismiss title="${this._t("tmdbNoticeDismiss")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
    </div>`;
  }
  _wireTmdbNotice(right) {
    if (!right || right._tmdbWired) return;
    right._tmdbWired = true;
    right.addEventListener("click", (e) => {
      if (e.target.closest("[data-tmdb-notice-dismiss]")) {
        e.stopPropagation();
        try {
          localStorage.setItem(TMDB_NOTICE_KEY, String(Date.now() + TMDB_NOTICE_SNOOZE));
        } catch (_) {
        }
        this._reRenderRight(true);
        return;
      }
      if (e.target.closest("[data-tmdb-info]")) {
        e.stopPropagation();
        this._tmdbInfoOpen = true;
        this._renderTmdbModalEl();
      }
    });
  }
  // Shown when a download-client row has no arr link. Clicking such a row used to
  // do nothing at all, which reads as a broken card rather than a deliberate gap.
  _renderDlInfoModal() {
    const name = this._dlInfoName || "";
    const p = (n) => `<p class="info-modal-p">${this._t("dlInfo" + n)}</p>`;
    return `
    <div class="popup-overlay info-modal-overlay${dayClass(this)}" data-dl-info-modal>
      <div class="popup-glass info-modal">
        <div class="info-modal-hdr">
          <span class="info-modal-title">${this._t("dlInfoTitle")}</span>
          <button class="popup-close" data-dl-info-close style="position:relative;top:0;right:0;flex-shrink:0;align-self:center;margin-left:4px">${ICONS.close}</button>
        </div>
        <div class="info-modal-body">
          ${name ? `<p class="info-modal-name">${this._escHtml(name)}</p>` : ""}
          ${p(1)}
        </div>
      </div>
    </div>`;
  }
  _renderTmdbModal() {
    const p = (n) => `<p class="info-modal-p">${this._t("tmdbInfo" + n)}</p>`;
    return `
    <div class="popup-overlay info-modal-overlay${dayClass(this)}" data-info-modal>
      <div class="popup-glass info-modal">
        <div class="info-modal-hdr">
          <span class="info-modal-title">${this._t("tmdbInfoTitle")}</span>
          <button class="popup-close" data-tmdb-info-close style="position:relative;top:0;right:0;flex-shrink:0;align-self:center;margin-left:4px">${ICONS.close}</button>
        </div>
        <div class="info-modal-body">
          ${[1, 2, 3, 4, 5].map(p).join("")}
          <a class="info-modal-link" href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer">${this._t("tmdbInfoLink")}</a>
        </div>
      </div>
    </div>`;
  }
  _renderSearch() {
    const hasQuery = !!this._searchQuery;
    const headingColor = this._cfgGet("styles", "headingTextColor", "#fff") || "#fff";
    const iconDefaultColor = this._cfgGet("styles", "searchBarIconColor", "") || "";
    const iconStyle = hasQuery ? `color:${headingColor};` : iconDefaultColor ? `color:${iconDefaultColor};` : "";
    const inputStyle = hasQuery ? `color:${headingColor};` : "";
    return `
    <div class="sec-card sec-search" style="position:relative">
      <div class="search-bar-wrap">
        <ha-icon icon="mdi:magnify" class="search-bar-icon" style="--mdc-icon-size:22px;${iconStyle}"></ha-icon>
        <input
          class="search-bar-input"
          type="text"
          placeholder="${this._t("searchPlaceholder")}"
          value="${this._escHtml(this._searchQuery)}"
          data-action="search-input"
          autocomplete="off"
          style="${inputStyle}"
        >
        ${this._searchTypeSeg()}
        <button class="search-bar-clear" data-action="search-clear" style="${iconStyle}${this._searchActive ? "" : "display:none;"}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        ${this._tmdbNoticeHtml()}
      </div>
      ${this._searchActive ? `<div class="col-hdr" style="margin:13px 0 5px">
        ${this._searchHdrIcon()}
        <span class="col-hdr-title">${this._t("searchResults")}</span>
        <div class="col-hdr-line"></div>
      </div>` : ""}
      <div class="search-results-wrap">${this._renderSearchResultsInner()}</div>
    </div>`;
  }
  _searchHdrIcon() {
    const t = this._searchType;
    if (t === "movie") return this._appIcon("radarr", 24);
    if (t === "tv") return this._appIcon("sonarr", 24);
    if (t === "music") return this._appIcon("lidarr", 24);
    return this._appIconRow(["radarr", "sonarr", "lidarr"]);
  }
  // All, films, series, music — the library's type filter at the size the search
  // bar can carry, and only while there is a search to narrow. Music appears
  // where there is a Lidarr to answer for it; All is where it starts.
  _searchTypeSeg() {
    if (!this._searchActive && !(this._searchQuery || "").trim()) return "";
    const _si = this._mtSegIcons;
    const opts = [
      { v: "all", label: this._t("tabAll"), attr: 'data-search-type="all"' },
      { v: "movie", label: this._t("tabMovies"), icon: _si.movie, attr: 'data-search-type="movie"' },
      { v: "tv", label: this._t("tabTvShows"), icon: _si.tv, attr: 'data-search-type="tv"' },
      ...this._lidarrConfigured !== false ? [{ v: "music", label: this._t("tabMusic"), icon: _si.music, attr: 'data-search-type="music"' }] : []
    ];
    return `<div class="search-type-seg">${this._mtSegmented("data-search-seg", opts, this._searchType, {
      width: 38,
      accent: "0,122,255",
      animatePrev: !!this._searchSegAnim,
      prev: this._searchSegPrev
    })}</div>`;
  }
  // Only the results grid + inline TV overlay — kept in a stable wrapper so re-rendering
  // it during typing never touches .search-bar-wrap (recreating the input closes the iOS keyboard).
  _renderSearchResultsInner() {
    const inner = this._searchActive ? this._renderSearchResultsGrid() : "";
    const overlay = this._musAddPending ? this._renderMusicAddOverlay() : this._tvRequestPending?.source === "search" ? this._renderTvRequestOverlay() : "";
    if (!overlay) return inner;
    const cols = Math.max(2, Math.min(10, parseInt(this._cfgGet("discover", "itemsPerCategory", 4)) || 4));
    return `<div class="tv-req-anchor" style="--sr-cols:${cols}">${inner}${overlay}</div>`;
  }
  _renderSearchResultsGrid() {
    if (this._searchLoading && !this._searchResults.length) {
      return `<div class="placeholder">${this._t("loading")}</div>`;
    }
    if (!this._searchResults.length) {
      return `<div class="placeholder" style="font-size:12px;color:var(--secondary-text-color,#888)">No results</div>`;
    }
    const gradColor = "rgba(0,0,0,0.88)";
    const textColor = "rgba(var(--arr-pt-rgb, 255, 255, 255), 1)";
    const cols = Math.max(2, Math.min(10, parseInt(this._cfgGet("discover", "itemsPerCategory", 4)) || 4));
    const sPage = cols * 2;
    const sp = this._searchPage || 0;
    const pc = this._posterCfg();
    const cards = this._searchResults.slice(sp * sPage, (sp + 1) * sPage).map((m) => {
      if (m.mediaType === "music") return this._renderSearchMusicCard(m);
      const isMovie = m.mediaType === "movie";
      const title = this._escHtml(m.title || m.name || "");
      const tmdbId = m.id;
      const popupType = isMovie ? POPUP_TYPE.MOVIE : POPUP_TYPE.TV;
      const typeTag = isMovie ? this._t("typeMovie") : this._t("typeTv");
      const poster = m.posterPath ? m.posterPath.startsWith("http") ? m.posterPath : `https://image.tmdb.org/t/p/w342${m.posterPath}` : "";
      const _findMovie = (list) => (Array.isArray(list) ? list.find((r) => r.tmdbId === tmdbId) : null) || null;
      const _findShow = (list) => (Array.isArray(list) ? list.find((s) => tmdbId && s.tmdbId === tmdbId) || list.find((s) => m.tvdbId && s.tvdbId === m.tvdbId) : null) || null;
      const radarrEntry = isMovie ? _findMovie(this._radarr) : null;
      const radarr2Entry = isMovie ? _findMovie(this._radarr2) : null;
      const sonarrEntry = !isMovie ? _findShow(this._sonarr) : null;
      const sonarr2Entry = !isMovie ? _findShow(this._sonarr2) : null;
      const libEntry = isMovie ? radarrEntry?.hasFile && radarrEntry || radarr2Entry?.hasFile && radarr2Entry || radarrEntry || radarr2Entry : sonarrEntry?.statistics?.episodeFileCount > 0 && sonarrEntry || sonarr2Entry?.statistics?.episodeFileCount > 0 && sonarr2Entry || sonarrEntry || sonarr2Entry;
      const mediaStatus = m.mediaInfo?.status;
      const _inOptimistic = this._optimisticRequested.has(tmdbId);
      const _withdrawn = this._withdrawnIds.has(tmdbId);
      const _hasPending = this._familyPendingIds.has(tmdbId);
      const inLib = isMovie ? !!(radarrEntry || radarr2Entry) : !!(sonarrEntry || sonarr2Entry);
      const hasFile = isMovie ? !!(radarrEntry?.hasFile || radarr2Entry?.hasFile) : !!(sonarrEntry?.statistics?.episodeFileCount > 0 || sonarr2Entry?.statistics?.episodeFileCount > 0);
      const _stale = mediaStatus >= 3 && !inLib && !_inOptimistic && !_hasPending;
      const _isAvail = (hasFile || mediaStatus === 5) && !_withdrawn && !_stale;
      const _isReq = (mediaStatus >= 2 || _inOptimistic || _hasPending || inLib) && !_withdrawn && !hasFile && !_stale;
      const _reqId = m.mediaInfo?.requests?.[0]?.id || this._familyPendingIds.get(tmdbId);
      const searchReqKey = "search-" + tmdbId;
      const _isAdmin = this._hass.user.is_admin;
      const _noSeerr = this._overseerrConfigured === false;
      let actionBtn = "";
      if (_isAvail) {
        actionBtn = "";
      } else if (_isReq) {
        if (_isAdmin || _noSeerr || mediaStatus >= 3 && !_inOptimistic && !_hasPending) {
          actionBtn = "";
        } else {
          const withdrawBtn = _reqId ? `<button class="req-withdraw" data-reqid="${_reqId}" data-mediaid="${tmdbId}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>` : "";
          actionBtn = withdrawBtn;
        }
      } else if (isMovie) {
        actionBtn = `<button class="btn-add req-open" data-movieid="${tmdbId}" data-tmdb="${tmdbId}" data-reqkey="${searchReqKey}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg></button>`;
      } else {
        actionBtn = `<button class="btn-add tv-req-open" data-showid="${tmdbId}" data-title="${title}" data-source="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg></button>`;
      }
      let badgeCls = "";
      let badgeHtml = "";
      if (_isAvail) {
        badgeCls = "b-st-avail";
        badgeHtml = this._badge("b-st-avail", "\u2713", this._t("badgeAvailable"));
      } else if (_isReq) {
        if (_isAdmin || _noSeerr || mediaStatus >= 3 && !_inOptimistic && !_hasPending) {
          badgeCls = "b-st-proc";
          badgeHtml = this._badge("b-st-proc", "\u2193", this._t("badgeAdded"));
        } else {
          badgeCls = "b-st-pend";
          badgeHtml = this._badge("b-st-pend", "\u23F1", this._t("badgePending"));
        }
      }
      const showTag = pc.statusDisplay === "tags" || pc.statusDisplay === "both";
      const showStripe = pc.statusDisplay === "stripes" || pc.statusDisplay === "both";
      const statusBadge = badgeHtml && showTag ? this._statusBadge(badgeHtml) : "";
      const stripe = badgeCls && showStripe ? this._statusStripe(this._statusStripeColor(badgeCls), false, radarrEntry ? this._dlPct(radarrEntry.id) : -1) : "";
      const arrAttr = isMovie ? radarrEntry ? ` data-radarrid="${radarrEntry.id}"` : radarr2Entry ? ` data-radarr2id="${radarr2Entry.id}"` : "" : "";
      const img = this._mcImg(poster || null, isMovie ? "\u{1F3AC}" : "\u{1F4FA}", tmdbId);
      const reqOverlay = isMovie && this._requestPending?.reqKey === searchReqKey ? this._renderRequestOverlay(tmdbId, tmdbId) : "";
      const tvdbAttr = !isMovie && m.tvdbId ? ` data-tvdbid="${m.tvdbId}"` : "";
      const langs = this._arrLangCodes(libEntry, isMovie);
      const ratingHtml = this._ratingLangBlock(
        { ...m, ratings: libEntry?.ratings || m.ratings },
        langs
      );
      return `
      <div class="mc" data-popup="${popupType}" data-tmdbid="${tmdbId}"${tvdbAttr} data-title="${title}"${arrAttr}>
        ${this._goneBadge(tmdbId, m.tvdbId, isMovie)}
        ${img}
        ${pc.mediaType ? `<span class="media-type-tag"><span class="b-txt">${typeTag}</span></span>` : ""}
        ${statusBadge}
        ${this._mcGrad(gradColor, `${ratingHtml}${pc.title ? `<div style="font-size:10px;font-weight:600;color:${textColor};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${actionBtn ? "padding-right:20px" : ""}">${title}</div>` : ""}${actionBtn ? `<div style="position:absolute;bottom:8px;right:10px">${actionBtn}</div>` : ""}`)}
        ${stripe}
        ${reqOverlay}
      </div>`;
    }).join("");
    return `<div class="pg-wrap">
    <button class="pg-btn pg-btn-ph" disabled>\u2039</button>
    <div class="mgrid" style="grid-template-columns:repeat(${cols},1fr);row-gap:10px">${cards}</div>
    <button class="pg-btn pg-btn-ph" disabled>\u203A</button>
  </div>`;
  }
  _ratingBadge(m, inline = false, solid = false) {
    const prov = this._ratingProvider;
    const ratings = m.ratings || {};
    const tmdbId = m.tmdbId ? String(m.tmdbId) : m.tmdbId === void 0 ? String(m.id || "") : "";
    const isMovie = m._mediaType !== "tv" && m.mediaType !== "tv";
    const cached = tmdbId ? this._posterRatingsCache.get(tmdbId) : void 0;
    let raw, display, icon, bdrClr, bgClr;
    switch (prov) {
      case "tmdb": {
        raw = ratings.tmdb?.value ?? m.voteAverage;
        if (!raw && tmdbId) {
          const tmdbVote = this._posterTmdbVoteCache.get(this._tmdbVoteKey(tmdbId, isMovie));
          if (tmdbVote) {
            raw = tmdbVote;
          } else if (tmdbVote === void 0) {
            this._fetchPosterTmdbVote(tmdbId, isMovie);
            return "";
          }
        }
        if (!raw) return "";
        display = (Math.round(raw * 10) / 10).toFixed(1);
        icon = `<svg width="30" height="11" viewBox="0 0 64 28" style="flex-shrink:0"><rect width="64" height="28" rx="4" fill="#0d253f"/><text x="32" y="21" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="800" fill="#01b4e4">TMDB</text></svg>`;
        bdrClr = "rgba(1,180,228,0.45)";
        bgClr = "rgba(1,180,228,0.22)";
        break;
      }
      case "trakt":
        raw = ratings.trakt?.value;
        if (!raw) return "";
        display = (Math.round(raw * 10) / 10).toFixed(1);
        icon = `<svg width="24" height="11" viewBox="0 0 64 28" style="flex-shrink:0"><rect width="64" height="28" rx="4" fill="#1a1a1a"/><text x="32" y="21" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="900" fill="#e8191a">trakt</text></svg>`;
        bdrClr = "rgba(232,25,26,0.45)";
        bgClr = "rgba(232,25,26,0.22)";
        break;
      case "rottenTomatoes": {
        const rtVal = ratings.rottenTomatoes?.value ?? cached?.rt ?? null;
        if (rtVal == null) {
          if (cached === void 0 && tmdbId) this._fetchPosterRating(tmdbId, isMovie);
          return "";
        }
        display = `${Math.round(rtVal)}%`;
        icon = `<svg width="10" height="10" viewBox="0 0 24 24" style="flex-shrink:0"><path fill="#FA320A" d="M12 7.5c-5 0-8.5 3-8.5 7.8 0 4.4 3.8 6.7 8.5 6.7s8.5-2.3 8.5-6.7c0-4.8-3.5-7.8-8.5-7.8z"/><path fill="#00912D" d="M11.8 7.6c.2-2 1.5-3.6 3.6-4.1-1 1.2-1.2 2.1-1.2 2.1s2-1.6 4.1-1c-1.5 1-2 2.3-2 2.3s1.7-.7 3.2-.2c-2 1.5-4.2 1.4-5.7 1.1-.5-.1-1.4-.2-2-.2z"/></svg>`;
        bdrClr = "rgba(250,50,10,0.45)";
        bgClr = "rgba(250,50,10,0.22)";
        raw = rtVal;
        break;
      }
      case "metacritic": {
        const mcVal = ratings.metacritic?.value ?? cached?.metacritic ?? null;
        if (mcVal == null) {
          if (cached === void 0 && tmdbId) this._fetchPosterRating(tmdbId, isMovie);
          return "";
        }
        display = `${Math.round(mcVal)}`;
        icon = `<svg width="26" height="11" viewBox="0 0 64 28" style="flex-shrink:0"><rect width="64" height="28" rx="4" fill="#ffcc33"/><text x="32" y="21" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="900" fill="#000">meta</text></svg>`;
        bdrClr = "rgba(255,204,51,0.45)";
        bgClr = "rgba(255,204,51,0.22)";
        raw = mcVal;
        break;
      }
      default: {
        if (ratings.imdb?.value) {
          raw = ratings.imdb.value;
          display = (Math.round(raw * 10) / 10).toFixed(1);
          icon = `<svg width="24" height="11" viewBox="0 0 64 28" style="flex-shrink:0"><rect width="64" height="28" rx="4" fill="#F5C518"/><text x="32" y="21" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="900" fill="#000">IMDb</text></svg>`;
          bdrClr = "rgba(245,197,24,0.45)";
          bgClr = "rgba(245,197,24,0.22)";
          break;
        }
        let tmdbVal = ratings.tmdb?.value ?? m.voteAverage ?? null;
        if (!tmdbVal && tmdbId) {
          const cachedVote = this._posterTmdbVoteCache.get(this._tmdbVoteKey(tmdbId, isMovie));
          if (cachedVote) tmdbVal = cachedVote;
          else if (cachedVote === void 0) this._fetchPosterTmdbVote(tmdbId, isMovie);
        }
        if (tmdbVal) {
          display = (Math.round(tmdbVal * 10) / 10).toFixed(1);
          icon = `<svg width="30" height="11" viewBox="0 0 64 28" style="flex-shrink:0"><rect width="64" height="28" rx="4" fill="#0d253f"/><text x="32" y="21" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="800" fill="#01b4e4">TMDB</text></svg>`;
          bdrClr = "rgba(1,180,228,0.45)";
          bgClr = "rgba(1,180,228,0.22)";
          break;
        }
        if (!isMovie && ratings.value) {
          display = (Math.round(ratings.value * 10) / 10).toFixed(1);
          icon = `<svg width="26" height="11" viewBox="0 0 64 28" style="flex-shrink:0"><rect width="64" height="28" rx="4" fill="#6cd591"/><text x="32" y="21" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="900" fill="#003224">TVDB</text></svg>`;
          bdrClr = "rgba(108,213,145,0.45)";
          bgClr = "rgba(108,213,145,0.22)";
          break;
        }
        return "";
      }
    }
    if (!display) return "";
    let sty = `border-color:${bdrClr};background:${bgClr}`;
    let iconHtml = icon;
    if (solid) {
      const A = 0.85;
      const SOLID = {
        "245,197,24": [`rgba(245,197,24,${A})`, "#000"],
        // IMDb
        "1,180,228": [`rgba(1,180,228,${A})`, "#0d253f"],
        // TMDB — teal ground, navy text
        "108,213,145": [`rgba(108,213,145,${A})`, "#003224"],
        // TheTVDB
        "232,25,26": [`rgba(232,25,26,${A})`, "#fff"],
        // Trakt
        "250,50,10": [`rgba(250,50,10,${A})`, "#fff"],
        // Rotten Tomatoes
        "255,204,51": [`rgba(255,204,51,${A})`, "#000"]
        // Metacritic
      };
      const rgb = /rgba?\(([^)]+)\)/.exec(bgClr);
      const nums = rgb ? rgb[1].split(",").slice(0, 3).map((n) => String(parseFloat(n))).join(",") : "";
      let bg = null, fg = null;
      if (SOLID[nums]) {
        [bg, fg] = SOLID[nums];
      } else if (rgb) {
        const [r, g, b] = rgb[1].split(",").map((n) => parseFloat(n));
        bg = `rgba(${r},${g},${b},${A})`;
        fg = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#000" : "#fff";
      }
      if (bg) {
        sty = `border-color:transparent;background:${bg};color:${fg};text-shadow:none`;
        iconHtml = "";
      }
    }
    const badge = `<span class="imdb" style="${sty};padding:2px ${solid ? "5px" : "3px"};gap:3px">${iconHtml}<span style="line-height:1;display:block;margin-top:-1px">${display}</span></span>`;
    return inline ? badge : `<div style="margin-bottom:3px">${badge}</div>`;
  }
  _pageIndicator(section, itemsOrCount, perPage = null) {
    const count = Array.isArray(itemsOrCount) ? itemsOrCount.length : itemsOrCount || 0;
    const totalPages = Math.ceil(count / (perPage ?? this._perPage(section)));
    if (totalPages <= 1) return "";
    const page = Math.min(this._pages[section] || 0, totalPages - 1);
    return `<span class="sec-page-ind">${page + 1}<span class="sec-page-sep">/</span>${totalPages}</span>`;
  }
  _renderRightHeader() {
    return `
    <div class="col-hdr">
      <ha-icon icon="mdi:movie-outline" style="--mdc-icon-size:22px"></ha-icon>
      <span class="col-hdr-title">${this._t("overview")}</span>
      <div class="col-hdr-line"></div>
    </div>`;
  }
  _renderRootDiskChip(key, roots) {
    if (!roots || roots.length === 0) return "";
    const fmtGB = (bytes) => {
      const gb = bytes / 1073741824;
      return gb >= 1024 ? (gb / 1024).toFixed(1) + " TB" : gb.toFixed(1) + " GB";
    };
    const DISK_ROUND = 100 * 1024 * 1024;
    const diskMap = /* @__PURE__ */ new Map();
    for (const r of roots) {
      const key2 = Math.round(r.freeSpace / DISK_ROUND);
      if (!diskMap.has(key2)) diskMap.set(key2, { freeSpace: r.freeSpace, paths: [] });
      diskMap.get(key2).paths.push(r.path);
    }
    const uniqueDisks = [...diskMap.values()];
    const total = uniqueDisks.length;
    const page = Math.min(this._diskPage[key] || 0, total - 1);
    const disk = uniqueDisks[page];
    const pathsHtml = disk.paths.map((p) => `<div class="dc-root-path">${this._escHtml(p)}</div>`).join("");
    const pagingHtml = total > 1 ? `
    <div class="dc-disk-paging">
      <button class="dc-disk-btn" data-diskkey="${key}" data-diskdir="prev" ${page === 0 ? "disabled" : ""}>\u2039</button>
      <span class="dc-disk-dots">${page + 1} / ${total}</span>
      <button class="dc-disk-btn" data-diskkey="${key}" data-diskdir="next" ${page >= total - 1 ? "disabled" : ""}>\u203A</button>
    </div>` : "";
    return `
    <div class="disk-chip rf-disk-chip">
      <div class="rf-disk-inner">
        <div class="rf-disk-left">
          <div class="dc-label">${this._t("storage")}</div>
          <div class="dc-val"><span class="pill-orange dc-pill">${fmtGB(disk.freeSpace)} ${this._t("free")}</span></div>
          ${pagingHtml}
        </div>
        <div class="rf-disk-right">${pathsHtml}</div>
      </div>
    </div>`;
  }
  _renderRadarr() {
    const smpCount = this._smpPageCount(this._radarr, "radarr");
    const grid = this._radarr.length === 0 ? `<div class="placeholder">${this._t("noRadarr")}</div>` : this._pagedGridWithSmp(this._radarr, "radarr", (m) => this._renderRadarrCard(m));
    return `
    <div class="sec-card">
      <div class="col-hdr" style="margin-bottom:5px">
        ${this._appIcon("radarr", 24)}
        <span class="col-hdr-title">${this._t("recentMovies")}</span>
        <div class="col-hdr-line"></div>
        ${this._pageIndicator("radarr", smpCount)}
        <span class="sec-badge" style="background:rgba(0,132,255,0.15);border:1px solid rgba(0,132,255,0.25)">${this._radarrTotal} ${this._t("movies")}</span>
        ${this._seeMoreBtn("radarr")}
      </div>
      ${grid}
    </div>`;
  }
  _renderRequestOverlay(movieId, tmdbId) {
    const isAdmin = this._hass?.user?.is_admin;
    const hasDual = this._radarr2Configured && (this._seerrRadarr2 || this._overseerrConfigured === false);
    const tab1Name = hasDual && this._seerrRadarr2?.is4k ? "HD" : this._seerrRadarr?.name || "Radarr";
    const tab2Name = hasDual && this._seerrRadarr2?.is4k ? "4K" : this._seerrRadarr2?.name || "Radarr 2";
    const buildPanel = (panelId, profiles, defProfileId, tags, rootFolders, selectId, tagId, rfId, hidden = false) => {
      const profileOptions = profiles.length > 0 ? profiles.map(
        (p) => `<option value="${p.id}" ${Number(p.id) === defProfileId ? "selected" : ""}>${this._escHtml(p.name)}</option>`
      ).join("") : `<option value="${defProfileId}">${this._t("defaultProfile")}</option>`;
      const tagItems = [["", "\u2014 no tag \u2014"], ...tags.map((t) => [t.id, t.label])];
      const tagHtml = isAdmin && tags.length > 0 ? `
      <span class="req-label">Tag</span>
      ${this._mtFieldSelect(tagId, tagItems, "", "width:100%")}` : "";
      const rfItems = rootFolders.map((f) => [f.path, f.path]);
      const rfHtml = isAdmin && rootFolders.length > 1 ? `
      <span class="req-label">Root folder</span>
      ${this._mtFieldSelect(rfId, rfItems, rfItems[0]?.[0] ?? "", "width:100%")}` : "";
      const profLabel = profiles.find((pr) => Number(pr.id) === defProfileId)?.name || profiles[0]?.name || this._t("defaultProfile");
      return `
      <div class="req-panel${hidden ? " req-panel--hidden" : ""}" data-panel="${panelId}">
        <span class="req-label">${this._t("downloadQuality")}</span>
        ${this._mtFieldSelectRaw(`id="${selectId}"`, profileOptions, profLabel, "width:100%")}
        ${tagHtml}
        ${rfHtml}
      </div>`;
    };
    const panel1 = buildPanel(
      "r1",
      this._radarrProfiles,
      Number(this._seerrRadarr?.profileId ?? 0),
      this._radarrTags,
      this._radarrRootFolders,
      `req-select-${movieId}`,
      `req-tag-${movieId}`,
      `req-rootfolder-${movieId}`
    );
    const panel2 = hasDual ? buildPanel(
      "r2",
      this._radarr2Profiles,
      Number(this._seerrRadarr2?.profileId ?? 0),
      this._radarr2Tags,
      this._radarr2RootFolders,
      `req-select2-${movieId}`,
      `req-tag2-${movieId}`,
      `req-rootfolder2-${movieId}`,
      true
      // hidden initially
    ) : "";
    const tabBar = hasDual ? `
    <div class="req-tabs">
      <span class="mt-nav-ind"></span>
      <button class="req-tab req-tab--active" data-tab="r1">${tab1Name}</button>
      <button class="req-tab" data-tab="r2">${tab2Name}</button>
    </div>` : "";
    return `
    <div class="req-overlay">
      <div class="req-inner">
        ${tabBar}
        <div class="req-panels-wrap">
          ${panel1}
          ${panel2}
        </div>
        <div class="req-actions">
          <button class="req-cancel" data-req="cancel" title="${this._t("cancel")}"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          <button class="req-confirm" data-req="confirm" data-movieid="${movieId}" data-tmdb="${tmdbId}" title="${this._t("confirm")}"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="20 6 9 17 4 12"/></svg></button>
        </div>
      </div>
    </div>`;
  }
  _renderSonarr() {
    const smpCount = this._smpPageCount(this._sonarr, "sonarr");
    const grid = this._sonarr.length === 0 ? `<div class="placeholder">${this._t("noSonarr")}</div>` : this._pagedGridWithSmp(this._sonarr, "sonarr", (s) => this._renderSonarrCard(s));
    return `
    <div class="sec-card">
      <div class="col-hdr" style="margin-bottom:5px">
        ${this._appIcon("sonarr", 24)}
        <span class="col-hdr-title">${this._t("recentShows")}</span>
        <div class="col-hdr-line"></div>
        ${this._pageIndicator("sonarr", smpCount)}
        <span class="sec-badge" style="background:rgba(255,214,10,0.12);border:1px solid rgba(255,214,10,0.22)">${this._sonarrTotal} ${this._t("shows")}</span>
        ${this._seeMoreBtn("sonarr")}
      </div>
      ${grid}
    </div>`;
  }
  _renderRecentlyAdded() {
    const hasMusic = this._lidarrConfigured !== false;
    const items = this._raItems();
    const smpCount = this._smpPageCount(items, "recentlyAdded");
    const grid = items.length === 0 ? `<div class="placeholder">${this._t("loading")}</div>` : this._pagedGridWithSmp(items, "recentlyAdded", (m) => this._renderRecentlyAddedCard(m));
    const noSeerr = this._overseerrConfigured === false;
    const headerIcon = noSeerr ? this._appIconRow(hasMusic ? ["radarr", "sonarr", "lidarr"] : ["radarr", "sonarr"]) : hasMusic ? `<div style="display:inline-flex;gap:4px;flex-shrink:0;align-items:center">${this._appIcon(this._discoverIconKey(), 24)}${this._appIcon("lidarr", 24)}</div>` : this._appIcon(this._discoverIconKey(), 24);
    const _si = this._mtSegIcons;
    const raSeg = hasMusic ? this._hdrFilter(`<div class="search-type-seg" style="margin:0 0 0 -6px">${this._mtSegmented("data-ra-seg", [
      { v: "all", label: this._t("tabAll"), attr: 'data-ra-type="all"', w: 38 },
      {
        v: "video",
        label: `${this._t("tabMovies")} / ${this._t("tabTvShows")}`,
        icon: `<span style="display:inline-flex;align-items:center;justify-content:center;gap:5px">${_si.movie}<span style="width:1px;height:12px;background:currentColor;opacity:0.35;flex-shrink:0"></span>${_si.tv}</span>`,
        attr: 'data-ra-type="video"'
      },
      { v: "music", label: this._t("tabMusic"), icon: _si.music, attr: 'data-ra-type="music"' }
    ], this._raTypeSaved, { accent: "0,122,255", animatePrev: !!this._raSegAnim, prev: this._raSegPrev })}</div>`, this._raTypeSaved !== "all", "ra") : "";
    return `
    <div class="sec-card has-gradient" style="${this._sectionStyle()}">
      ${noSeerr ? this._sectionOverlayHtml("radarr", 25, 75, 0.18) : this._sectionOverlayHtml(this._discoverIconKey())}
      <div class="col-hdr" style="margin-bottom:5px">
        ${headerIcon}
        <span class="col-hdr-title">${this._t("recentlyAdded")}</span>
        ${raSeg}
        <div class="col-hdr-line"></div>
        ${this._pageIndicator("recentlyAdded", smpCount)}
        ${this._seeMoreBtn("recentlyAdded")}
      </div>
      ${grid}
    </div>`;
  }
  _renderRecentlyRequested() {
    const hasMusic = this._lidarrConfigured !== false;
    const rqType = hasMusic ? this._rqTypeSaved : "all";
    const all = this.recentlyRequested;
    const items = rqType === "all" ? all : rqType === "music" ? all.filter((m) => m._mediaType === "music") : all.filter((m) => m._mediaType !== "music");
    const smpCount = this._smpPageCount(items, "recentlyRequested");
    const grid = items.length === 0 ? `<div class="placeholder">${this._t("loading")}</div>` : this._pagedGridWithSmp(items, "recentlyRequested", (m) => this._renderRecentlyRequestedCard(m));
    const noSeerrRq = this._overseerrConfigured === false;
    const headerIconRq = noSeerrRq ? this._appIconRow(["radarr", "sonarr", "lidarr"]) : hasMusic ? `<div style="display:inline-flex;gap:4px;flex-shrink:0;align-items:center">${this._appIcon(this._discoverIconKey(), 24)}${this._appIcon("lidarr", 24)}</div>` : this._appIcon(this._discoverIconKey(), 24);
    const _si = this._mtSegIcons;
    const rqSeg = hasMusic ? this._hdrFilter(`<div class="search-type-seg" style="margin:0 0 0 -6px">${this._mtSegmented("data-rq-seg", [
      { v: "all", label: this._t("tabAll"), attr: 'data-rq-type="all"', w: 38 },
      {
        v: "video",
        label: `${this._t("tabMovies")} / ${this._t("tabTvShows")}`,
        icon: `<span style="display:inline-flex;align-items:center;justify-content:center;gap:5px">${_si.movie}<span style="width:1px;height:12px;background:currentColor;opacity:0.35;flex-shrink:0"></span>${_si.tv}</span>`,
        attr: 'data-rq-type="video"'
      },
      { v: "music", label: this._t("tabMusic"), icon: _si.music, attr: 'data-rq-type="music"' }
    ], rqType, { accent: "0,122,255", animatePrev: !!this._rqSegAnim, prev: this._rqSegPrev })}</div>`, rqType !== "all", "rq") : "";
    return `
    <div class="sec-card has-gradient" style="${this._sectionStyle()}">
      ${noSeerrRq ? this._sectionOverlayHtml("radarr", 25, 75, 0.18) : this._sectionOverlayHtml(this._discoverIconKey())}
      <div class="col-hdr" style="margin-bottom:5px">
        ${headerIconRq}
        <span class="col-hdr-title">${this._t("recentlyRequested")}</span>
        ${rqSeg}
        <div class="col-hdr-line"></div>
        ${this._pageIndicator("recentlyRequested", smpCount)}
        ${this._seeMoreBtn("recentlyRequested")}
      </div>
      ${grid}
    </div>`;
  }
  // Anything that has since made it into Lidarr is no longer a suggestion — the
  // list is held for hours on the server and the library moves under it.
  _lastfmRowItems() {
    return (this._lastfm || []).filter((e) => {
      const mb = String(e?.artist?.foreignArtistId || "").toLowerCase();
      const nm = String(e?.artist?.artistName || "").trim().toLowerCase();
      if (mb && this._musAdded?.has(mb)) return true;
      for (const a of this._lidarrArtists?.values() || []) {
        if (mb && String(a.foreignArtistId || "").toLowerCase() === mb) return false;
        if (nm && String(a.artistName || "").trim().toLowerCase() === nm) return false;
      }
      return true;
    });
  }
  // One suggestion. Nothing here is owned, so there is no status to show and the
  // corner carries the plus instead — the same one a search result has.
  _renderLastfmCard(entry) {
    const artist = entry?.artist || {};
    const mbid2 = String(artist.foreignArtistId || "");
    const added = this._musAdded?.has(mbid2.toLowerCase());
    const card = this._renderMusicCard(
      { id: null, artist, newestAlbum: null, newAlbumCount: 0 },
      { noSub: true, noStatus: true }
    );
    const pc = this._posterCfg();
    const corner = added ? pc.statusDisplay === "tags" || pc.statusDisplay === "both" ? `${this._statusBadge(this._badge("b-st-proc", "\u2193", this._t("badgeAdded")))}` : "" : `<div style="position:absolute;bottom:8px;right:10px;z-index:3">
        <button class="btn-add mus-add-open" data-mus-add="${this._escHtml(mbid2)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg></button>
      </div>`;
    const libHit = added ? [...this._lidarrArtists?.values() || []].find((a) => String(a.foreignArtistId || "").toLowerCase() === mbid2.toLowerCase()) : null;
    const dlPct = libHit ? this._lidarrQueueArtists?.get(libHit.id) : void 0;
    const stripe = dlPct !== void 0 && (pc.statusDisplay === "stripes" || pc.statusDisplay === "both") ? this._statusStripe(this._statusStripeColor("b-dl"), true, dlPct) : "";
    const _chars = (t) => t.toUpperCase().split("").join("<br>");
    const overlays = `<div class="trakt-seen-ol mus-like-ol" data-mus-mbid="${this._escHtml(mbid2)}"><span>${_chars(this._t("musLike"))}</span></div><div class="trakt-ni-ol mus-skip-ol" data-mus-mbid="${this._escHtml(mbid2)}"><span>${_chars(this._t("skip"))}</span></div>`;
    return card.replace(/data-artist-id="[^"]*"/, libHit ? `data-artist-id="${libHit.id}"` : `data-artist-unowned="${this._escHtml(mbid2)}"`).replace(/<\/div>\s*$/, `${overlays}${corner}${stripe}</div>`);
  }
  _renderUpcoming() {
    const items = this._upcoming || [];
    const smpCount = this._smpPageCount(items, "upcoming");
    let grid = "";
    if (this._upcomingError) {
      grid = `<div class="placeholder" style="color:rgba(255,80,80,0.9);font-size:11px">\u26A0 ${this._escHtml(this._upcomingError)}</div>`;
    } else if (items.length === 0) {
      grid = `<div class="placeholder">${this._t("loading")}</div>`;
    } else {
      grid = this._pagedGridWithSmp(items, "upcoming", (m) => this._renderUpcomingCard(m, { reqKey: "upcoming-" + m.id }));
    }
    return `
    <div class="sec-card has-gradient" style="${this._sectionStyle()}">
      ${this._sectionOverlayHtml(this._discoverIconKey())}
      <div class="col-hdr" style="margin-bottom:5px">
        ${this._appIcon(this._discoverIconKey(), 24)}
        <span class="col-hdr-title">${this._t("upcomingMovies")}</span>
        <div class="col-hdr-line"></div>
        ${this._pageIndicator("upcoming", smpCount)}
        ${this._seeMoreBtn("upcoming")}
      </div>
      ${grid}
    </div>`;
  }
  _renderTvUpcoming() {
    const items = this._tvUpcoming || [];
    const smpCount = this._smpPageCount(items, "tvUpcoming");
    const p = this._tvRequestPending?.source === "tvUpcoming" ? this._tvRequestPending : null;
    const grid = items.length === 0 ? `<div class="placeholder">${this._t("loading")}</div>` : this._pagedGridWithSmp(items, "tvUpcoming", (m) => this._renderTvUpcomingCard(m));
    return `
    <div class="sec-card has-gradient" style="${this._sectionStyle()}position:relative;">
      ${this._sectionOverlayHtml(this._discoverIconKey())}
      <div class="col-hdr" style="margin-bottom:5px">
        ${this._appIcon(this._discoverIconKey(), 24)}
        <span class="col-hdr-title">${this._t("newShows")}</span>
        <div class="col-hdr-line"></div>
        ${this._pageIndicator("tvUpcoming", smpCount)}
        ${this._seeMoreBtn("tvUpcoming")}
      </div>
      <div class="tv-req-anchor">${grid}${p ? this._renderTvRequestOverlay() : ""}</div>
    </div>`;
  }
  _renderTvRequestOverlay() {
    const p = this._tvRequestPending;
    if (!p) return "";
    if (p.loading || !p.seasons) {
      return `
      <div class="req-overlay tv-req-overlay">
        <span class="action-spinner" style="width:22px;height:22px;border-width:2.5px"></span>
      </div>`;
    }
    const isAdmin = this._hass?.user?.is_admin;
    const hasDual = this._sonarr2Configured === true && (this._seerrSonarr2 || this._overseerrConfigured === false);
    const sn1Name = this._seerrSonarr?.name || this._instLabel?.("sonarr") || "Sonarr";
    const sn2Name = this._seerrSonarr2?.name || this._instLabel?.("sonarr2") || "Sonarr 2";
    const buildTvPanel = (panelId, profiles, defProfId, tags, rootFolders, profileSelId, tagSelId, rfSelId, hidden = false) => {
      const profileOpts = profiles.length > 0 ? profiles.map((pr) => `<option value="${pr.id}" ${Number(pr.id) === defProfId ? "selected" : ""}>${this._escHtml(pr.name)}</option>`).join("") : `<option value="${defProfId}">${this._t("defaultProfile")}</option>`;
      const tagItems = [["", "\u2014 no tag \u2014"], ...tags.map((t) => [t.id, t.label])];
      const tagHtml = isAdmin && tags.length > 0 ? `<span class="req-label">Tag</span>${this._mtFieldSelect(tagSelId, tagItems, "", "width:100%")}` : "";
      const rfItems = rootFolders.map((f) => [f.path, f.path]);
      const rfHtml = isAdmin && rootFolders.length > 1 ? `<span class="req-label">Root folder</span>${this._mtFieldSelect(rfSelId, rfItems, rfItems[0]?.[0] ?? "", "width:100%")}` : "";
      const profLabel = profiles.find((pr) => Number(pr.id) === defProfId)?.name || profiles[0]?.name || this._t("defaultProfile");
      return `<div class="req-panel${hidden ? " req-panel--hidden" : ""}" data-panel="${panelId}" style="display:${hidden ? "none" : "flex"};flex-direction:column;gap:4px"><span class="req-label">${this._t("downloadQuality")}</span>${this._mtFieldSelectRaw(`id="${profileSelId}"`, profileOpts, profLabel, "width:100%")}${tagHtml}${rfHtml}</div>`;
    };
    const defProfileId = Number(p.profileId ?? 0);
    const panel1 = buildTvPanel("s1", this._sonarrProfiles, defProfileId, this._sonarrTags || [], this._sonarrRootFolders || [], "tv-req-profile", "tv-req-tag", "tv-req-rootfolder");
    const panel2 = hasDual ? buildTvPanel("s2", this._sonarr2Profiles || [], Number(this._seerrSonarr2?.profileId ?? 0), this._sonarrTags || [], this._sonarr2RootFolders || [], "tv-req-profile2", "tv-req-tag2", "tv-req-rootfolder2", true) : "";
    const tabBar = hasDual ? `<div class="req-tabs"><span class="mt-nav-ind"></span><button class="req-tab req-tab--active" data-tab="s1">${sn1Name}</button><button class="req-tab" data-tab="s2">${sn2Name}</button></div>` : "";
    const seasons = [...p.seasons].sort((a, b) => b - a);
    const perPage = this._isMob || !hasDual ? 8 : 4;
    const pages = [];
    for (let i = 0; i < seasons.length; i += perPage) pages.push(seasons.slice(i, i + perPage));
    const multiPage = pages.length > 1;
    const pagesHtml = pages.map((page) => `
    <div class="sv-page">
      ${page.map((sn) => `
        <label class="sv-wrap">
          <input type="checkbox" class="sv-input" data-season="${sn}" ${p.selected.has(sn) ? "checked" : ""}>
          <span class="sv-track"><span class="sv-thumb"></span></span>
          <span class="sv-lbl">S${sn}</span>
        </label>`).join("")}
    </div>`).join("");
    const dotsHtml = multiPage ? `<div class="sv-dots">${pages.map(
      (_, i) => `<span class="sv-dot${i === 0 ? " sv-dot-active" : ""}" data-pg="${i}"></span>`
    ).join("")}</div>` : "";
    const poster = p.show.posterPath ? `<img src="${p.show.posterPath.startsWith("http") ? p.show.posterPath : `https://image.tmdb.org/t/p/w92${p.show.posterPath}`}" class="tv-req-poster">` : `<span class="tv-req-poster tv-req-poster-ph">\u{1F4FA}</span>`;
    return `
    <div class="req-overlay tv-req-overlay">
      <div class="tv-req-inner">
        <div class="tv-req-col-poster">
          ${poster}
        </div>
        <div class="tv-req-row2">
          <div class="tv-req-controls">
            ${tabBar}
            ${panel1}${panel2}
            <div class="tv-req-seasons">
              <span class="req-label" style="display:block;margin-bottom:4px;margin-top:6px">${this._t("seasons")}</span>
              <div class="sv-nav-wrap">
                ${multiPage ? `<button class="sv-chev sv-prev" disabled><ha-icon icon="mdi:chevron-left" style="--mdc-icon-size:18px"></ha-icon></button>` : ""}
                <div class="sv-scroll" id="sv-scroll">${pagesHtml}</div>
                ${multiPage ? `<button class="sv-chev sv-next"><ha-icon icon="mdi:chevron-right" style="--mdc-icon-size:18px"></ha-icon></button>` : ""}
              </div>
              ${dotsHtml}
            </div>
            <div class="tv-req-actions-col">
              <div class="req-actions">
                <button class="req-cancel tv-req-cancel" title="${this._t("cancel")}"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                <button class="tv-req-confirm req-confirm" data-mediaid="${p.mediaId}" title="${this._t("confirm")}"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="20 6 9 17 4 12"/></svg></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }
  _renderTrending() {
    const items = this._trending || [];
    const smpCount = this._smpPageCount(items, "trending");
    const p = this._tvRequestPending?.source === "trending" ? this._tvRequestPending : null;
    const grid = items.length === 0 ? `<div class="placeholder">${this._t("loading")}</div>` : this._pagedGridWithSmp(items, "trending", (m) => this._renderTrendingCard(m));
    return `
    <div class="sec-card has-gradient" style="${this._sectionStyle()}position:relative;">
      ${this._sectionOverlayHtml(this._discoverIconKey())}
      <div class="col-hdr" style="margin-bottom:5px">
        ${this._appIcon(this._discoverIconKey(), 24)}
        <span class="col-hdr-title">${this._t("trendingMovies")}</span>
        <div class="col-hdr-line"></div>
        ${this._pageIndicator("trending", smpCount)}
        ${this._seeMoreBtn("trending")}
      </div>
      <div class="tv-req-anchor">${grid}${p ? this._renderTvRequestOverlay() : ""}</div>
    </div>`;
  }
  _renderRecommendations() {
    const src = this._recSources;
    const items = this._recItems();
    const smpCount = this._smpPageCount(items, "recommendations");
    const p = ["trakt", "suggestarr"].includes(this._tvRequestPending?.source) ? this._tvRequestPending : null;
    const emptyMsg = this._suggestarrRefreshing ? this._t("saRefreshing") : src.trakt && this._trakt === null || src.suggestarr && this._suggestarr === null || src.lastfm && this._lastfm === null ? this._t("loading") : this._t("saEmpty");
    const gridInner = items.length === 0 ? `<div class="placeholder">${emptyMsg}</div>` : this._pagedGridWithSmp(items, "recommendations", (m, i) => this._renderRecCard(m, i));
    const grid = this._musAddPending?.source === "lastfm" ? `<div class="tv-req-anchor">${gridInner}${this._renderMusicAddOverlay()}</div>` : `<div class="tv-req-anchor">${gridInner}${p ? this._renderTvRequestOverlay() : ""}</div>`;
    const icons = [src.trakt && "trakt", src.suggestarr && "suggestarr", src.lastfm && "lastfm"].filter(Boolean);
    const _si = this._mtSegIcons;
    const hasMusic = src.lastfm && (src.trakt || src.suggestarr);
    const recSeg = hasMusic ? this._hdrFilter(`<div class="search-type-seg" style="margin:0 0 0 -6px">${this._mtSegmented("data-rec-seg", [
      { v: "all", label: this._t("tabAll"), attr: 'data-rec-type="all"', w: 38 },
      {
        v: "video",
        label: `${this._t("tabMovies")} / ${this._t("tabTvShows")}`,
        icon: `<span style="display:inline-flex;align-items:center;justify-content:center;gap:5px">${_si.movie}<span style="width:1px;height:12px;background:currentColor;opacity:0.35;flex-shrink:0"></span>${_si.tv}</span>`,
        attr: 'data-rec-type="video"'
      },
      { v: "music", label: this._t("tabMusic"), icon: _si.music, attr: 'data-rec-type="music"' }
    ], this._recTypeSaved, { accent: "0,122,255", animatePrev: !!this._recSegAnim, prev: this._recSegPrev })}</div>`, this._recTypeSaved !== "all", "rec") : "";
    return `
    <div class="sec-card has-gradient" data-trakt-sec style="${this._sectionStyle()}">
      ${this._sectionOverlayHtml(icons[0] || "trakt", 25, 75, 0.4)}
      <div class="col-hdr" style="margin-bottom:5px">
        ${icons.length > 1 ? this._appIconRow(icons) : this._appIcon(icons[0] || "trakt", 24)}
        <span class="col-hdr-title">${this._t("catRecommendations")}</span>
        ${recSeg}
        <div class="col-hdr-line"></div>
        ${this._suggestarrRefreshing ? `<span class="action-spinner" style="width:12px;height:12px;border-width:1.5px;flex-shrink:0"></span>` : ""}
        ${this._pageIndicator("recommendations", smpCount)}
        ${this._seeMoreBtn("recommendations")}
      </div>
      ${grid}
    </div>`;
  }
  // One tile, drawn by whichever feed put it there, with that feed's own icon in
  // the corner — three sets of controls in one row otherwise say little about
  // where a suggestion came from.
  _renderRecCard(m, i = null) {
    const card = m._recSrc === "lastfm" ? this._renderLastfmCard(m) : m._recSrc === "suggestarr" ? this._renderSuggestArrCard(m, i) : this._renderTraktCard(m, i);
    const icon = this._appIcon(m._recSrc || "trakt", 16);
    return card.replace(
      /<\/div>\s*$/,
      `<div class="rec-src-badge" title="${m._recSrc || "trakt"}">${icon}</div></div>`
    );
  }
  // Returns a right-arrow button for the section header that opens the overlay at page 0
  _seeMoreBtn(section) {
    if (!this._hasSeeMore(section)) return "";
    return `<button class="smp-hdr-btn" data-action="overlay-open" data-sec="${section}" data-page="0" style="width:28px;height:28px;margin:-2px 0;flex-shrink:0">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  </button>`;
  }
  // Returns item count for _pageIndicator, accounting for SMP card insertion
  _smpPageCount(items, section) {
    if (!items || items.length === 0) return 0;
    const showMorePage = Math.max(1, parseInt(this._cfgGet("discover", "showMoreOnPage", 3)) || 3);
    const cols = Math.max(2, Math.min(10, parseInt(this._cfgGet("discover", "itemsPerCategory", 4)) || 4));
    const itemsBefore = showMorePage * cols - 1;
    return items.length > itemsBefore ? itemsBefore + 1 : items.length;
  }
  _renderSeeMoreCardFor(section) {
    const cfg = this._getSectionOverlayConfig(section);
    const items = (cfg ? cfg.getItems ? cfg.getItems() : this[cfg.dataKey] : []) || [];
    const showMorePage = Math.max(1, parseInt(this._cfgGet("discover", "showMoreOnPage", 3)) || 3);
    const itemsBefore = showMorePage * 4 - 1;
    const teasers = items.slice(-4);
    const cells = [];
    for (let i = 0; i < 4; i++) {
      const m = teasers[i];
      if (m && cfg) {
        const url = cfg.getPosterUrl(m);
        if (url) {
          cells.push(`<img src="${url}" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy">`);
        } else {
          cells.push(`<div class="${this._grad(m.id)}" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:13px">${cfg.emoji(m)}</div>`);
        }
      } else {
        cells.push(`<div style="width:100%;height:100%;background:rgba(255,255,255,0.06)"></div>`);
      }
    }
    const remainCount = Math.max(0, items.length - itemsBefore);
    return `
    <div class="mc smp-card" data-action="overlay-open" data-sec="${section}">
      <!-- 2\xD72 grid pokr\xFDv\xE1 celou kartu -->
      <div class="smp-full">
        <div class="smp-posters">${cells.join("")}</div>
        <div class="smp-overlay">
          <div class="smp-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </div>
          <span class="smp-cta">${this._t("seeMore")}</span>
          <span class="smp-count">+${remainCount}</span>
        </div>
      </div>
    </div>`;
  }
  _renderSectionOverlay(section) {
    const cfg = this._getSectionOverlayConfig(section);
    if (!cfg) return "";
    const items = (cfg.getItems ? cfg.getItems() : this[cfg.dataKey]) || [];
    const isMobile2 = window.matchMedia("(max-width: 480px)").matches;
    const cols = Math.max(2, Math.min(10, parseInt(this._cfgGet("discover", "itemsPerCategory", 4)) || 4));
    const perPage = isMobile2 ? cols : cols * 2;
    const page = this._overlay.page || 0;
    const totalPages = Math.ceil(items.length / perPage);
    const pageItems = items.slice(page * perPage, (page + 1) * perPage);
    const gridHtml = pageItems.map((m, i) => cfg.renderCard(m, i)).join("");
    const pageInd = totalPages > 1 ? `<span class="sec-page-ind">${page + 1}<span class="sec-page-sep">/</span>${totalPages}</span>` : "";
    let musAddOv = "";
    if (this._musAddPending && section === "recommendations") {
      const mb = String(this._musAddPending.artist?.foreignArtistId || "").toLowerCase();
      const idx = pageItems.findIndex((x) => String(x?.artist?.foreignArtistId || x?.foreignArtistId || "").toLowerCase() === mb);
      const rowNo = Math.floor(Math.max(0, idx) / cols) + 1;
      musAddOv = `<div class="mus-add-row" style="grid-column:1/-1;grid-row:${rowNo}">${this._renderMusicAddOverlay()}</div>`;
    }
    const [gposL = 15, gposR = 85, go = 0.35] = cfg.gradPos || [];
    return `
    <div class="trending-overlay">
      ${cfg.appKey ? this._sectionOverlayHtmlTop(cfg.appKey, gposL, gposR, go) : ""}
      <div class="col-hdr" style="margin-bottom:5px;position:relative;z-index:1">
        ${cfg.appKey ? this._appIcon(cfg.appKey, 24) : `<ha-icon icon="${cfg.icon}" style="--mdc-icon-size:24px"></ha-icon>`}
        <span class="col-hdr-title">${this._t(cfg.titleKey)}</span>
        <div class="col-hdr-line"></div>
        ${pageInd}
        <!-- The same box and mark as the See More arrow it replaces: the button
             swaps under the reader's cursor, so a smaller one is noticed. -->
        <button class="to-close" data-action="overlay-close" style="width:28px;height:28px;margin:-2px 0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <path d="M19 12H5M11 6l-6 6 6 6"/>
          </svg>
        </button>
      </div>
      <div class="pg-wrap" style="flex:1;align-items:stretch;position:relative;z-index:1">
        <button class="pg-btn pg-btn-ph" aria-hidden="true" tabindex="-1">\u2039</button>
        <div class="to-grid" style="grid-template-columns:repeat(${cols},1fr)">${gridHtml}${musAddOv}</div>
        <button class="pg-btn pg-btn-ph" aria-hidden="true" tabindex="-1">\u203A</button>
      </div>
    </div>`;
  }
  // Paging nav pro sekce overlay — stejná struktura jako standardní rp-nav
  _renderSectionOverlayNav(section) {
    const cfg = this._getSectionOverlayConfig(section);
    if (!cfg) return "";
    const items = (cfg.getItems ? cfg.getItems() : this[cfg.dataKey]) || [];
    const isMobile2 = window.matchMedia("(max-width: 480px)").matches;
    const cols = Math.max(2, Math.min(10, parseInt(this._cfgGet("discover", "itemsPerCategory", 4)) || 4));
    const perPage = isMobile2 ? cols : cols * 2;
    const page = this._overlay.page || 0;
    const totalPages = Math.ceil(items.length / perPage);
    const hasPrev = page > 0;
    const apiPage = this._overlayApiPage[section] || 0;
    const apiTotal = this._overlayApiTotalPages[section] || 1;
    const hasNext = page < totalPages - 1 || cfg.apiEndpoint && apiPage < apiTotal;
    if (!hasPrev && !hasNext) return "";
    return this._rpPag(page, totalPages, {
      firstAttr: 'data-action="overlay-first"',
      prevAttr: 'data-action="overlay-prev"',
      nextAttr: 'data-action="overlay-next"',
      lastAttr: 'data-action="overlay-last"',
      dotAttr: "data-topage",
      dotSecAttr: "",
      hasNext
    });
  }
  _renderTvOverlayCompact(p) {
    if (!p || p.loading || !p.seasons) {
      return `<div style="display:flex;align-items:center;justify-content:center;padding:20px">
      <span class="action-spinner" style="width:22px;height:22px;border-width:2.5px"></span>
    </div>`;
    }
    const defProfileId = Number(p.profileId ?? 0);
    const profileOptions = this._sonarrProfiles.length > 0 ? this._sonarrProfiles.map(
      (pr) => `<option value="${pr.id}" ${Number(pr.id) === defProfileId ? "selected" : ""}>${this._escHtml(pr.name)}</option>`
    ).join("") : `<option value="${defProfileId}">${this._t("defaultProfile")}</option>`;
    const seasons = [...p.seasons].sort((a, b) => b - a);
    const pages = [];
    for (let i = 0; i < seasons.length; i += 8) pages.push(seasons.slice(i, i + 8));
    const multiPage = pages.length > 1;
    const pagesHtml = pages.map((page) => `
    <div class="sv-page">
      ${page.map((sn) => `
        <label class="sv-wrap">
          <input type="checkbox" class="sv-input" data-season="${sn}" ${p.selected.has(sn) ? "checked" : ""}>
          <span class="sv-track"><span class="sv-thumb"></span></span>
          <span class="sv-lbl">S${sn}</span>
        </label>`).join("")}
    </div>`).join("");
    const dotsHtml = multiPage ? `<div class="sv-dots">${pages.map(
      (_, i) => `<span class="sv-dot${i === 0 ? " sv-dot-active" : ""}" data-pg="${i}"></span>`
    ).join("")}</div>` : "";
    const poster = p.show.posterPath ? `<img src="${p.show.posterPath.startsWith("http") ? p.show.posterPath : `https://image.tmdb.org/t/p/w92${p.show.posterPath}`}" class="tv-req-poster">` : `<span class="tv-req-poster tv-req-poster-ph">\u{1F4FA}</span>`;
    return `
    <div class="tv-req-inner">
      <div class="tv-req-col-poster">
        ${poster}
        <div class="tv-req-title tv-req-mob-title">${this._escHtml(p.show.name || p.show.originalName || "")}</div>
      </div>
      <div class="tv-req-row2">
        <div class="tv-req-controls">
          <div class="tv-req-title tv-req-desk-title">${this._escHtml(p.show.name || p.show.originalName || "")}</div>
          <span class="req-label">${this._t("downloadQuality")}</span>
          <select class="req-select" id="tv-req-profile-abs">${profileOptions}</select>
          ${this._hass?.user?.is_admin && this._sonarrTags.length > 0 ? `
          <span class="req-label">Tag</span>
          <select class="req-select" id="tv-req-tag-abs">
            <option value="">\u2014 no tag \u2014</option>
            ${this._sonarrTags.map((t) => `<option value="${t.id}">${this._escHtml(t.label)}</option>`).join("")}
          </select>` : ""}
          ${this._hass?.user?.is_admin && this._sonarrRootFolders.length > 1 ? `
          <span class="req-label">Root folder</span>
          <select class="req-select" id="tv-req-rootfolder-abs">
            ${this._sonarrRootFolders.map((f) => `<option value="${this._escHtml(f.path)}">${this._escHtml(f.path)}</option>`).join("")}
          </select>` : ""}
          <div class="tv-req-seasons">
            <span class="req-label" style="display:block;margin-bottom:4px;margin-top:6px">${this._t("seasons")}</span>
            <div class="sv-nav-wrap">
              ${multiPage ? `<button class="sv-chev sv-prev-abs" disabled><ha-icon icon="mdi:chevron-left" style="--mdc-icon-size:18px"></ha-icon></button>` : ""}
              <div class="sv-scroll" id="sv-scroll-abs">${pagesHtml}</div>
              ${multiPage ? `<button class="sv-chev sv-next-abs"><ha-icon icon="mdi:chevron-right" style="--mdc-icon-size:18px"></ha-icon></button>` : ""}
            </div>
            ${dotsHtml}
          </div>
          <div class="tv-req-actions-col">
            <div class="req-actions">
              <button class="req-cancel to-tv-cancel-abs" title="${this._t("cancel")}"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
              <button class="to-tv-confirm-abs req-confirm" data-mediaid="${p.mediaId}" title="${this._t("confirm")}"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="20 6 9 17 4 12"/></svg></button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }
  _renderPopular() {
    const items = this._popular || [];
    const smpCount = this._smpPageCount(items, "popular");
    const grid = items.length === 0 ? `<div class="placeholder">${this._t("loading")}</div>` : this._pagedGridWithSmp(items, "popular", (m) => this._renderUpcomingCard(m, { showDate: false, typeTag: this._t("typeMovie"), reqKey: "popular-" + m.id }));
    return `
    <div class="sec-card has-gradient" style="${this._sectionStyle()}">
      ${this._sectionOverlayHtml(this._discoverIconKey())}
      <div class="col-hdr" style="margin-bottom:5px">
        ${this._appIcon(this._discoverIconKey(), 24)}
        <span class="col-hdr-title">${this._t("popularMovies")}</span>
        <div class="col-hdr-line"></div>
        ${this._pageIndicator("popular", smpCount)}
        ${this._seeMoreBtn("popular")}
      </div>
      ${grid}
    </div>`;
  }
  _renderCalendar() {
    const calSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    const calSvgLg = `<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    let grid = "";
    if (!this._calCatItems().length) {
      grid = `<div class="placeholder">${this._t("noEpisodes")}</div>`;
    } else {
      const cols = Math.max(2, Math.min(10, parseInt(this._cfgGet("discover", "itemsPerCategory", 4)) || 4));
      const showMorePage = Math.max(1, parseInt(this._cfgGet("discover", "showMoreOnPage", 3)) || 3);
      const itemsBefore = showMorePage * cols - 1;
      let items = this._calCatItems();
      if (items.length > itemsBefore) {
        const teasers = items.slice(-4);
        const cells = Array.from({ length: 4 }, (_, i) => {
          const ep = teasers[i];
          if (!ep) return `<div style="width:100%;height:100%;background:rgba(255,255,255,0.06)"></div>`;
          const isMovie = ep._mediaType === "movie";
          const seriesRaw = ep.series || {};
          const _sid = seriesRaw.id || ep.seriesId;
          const series = isMovie ? (this._radarr || []).find((m) => seriesRaw.tmdbId ? m.tmdbId === seriesRaw.tmdbId : m.id === _sid) || (this._radarr2 || []).find((m) => seriesRaw.tmdbId ? m.tmdbId === seriesRaw.tmdbId : m.id === _sid) || seriesRaw : (this._sonarrAll || this._sonarr || []).find((s) => seriesRaw.tvdbId ? s.tvdbId === seriesRaw.tvdbId : s.id === _sid) || (this._sonarr2All || this._sonarr2 || []).find((s) => seriesRaw.tvdbId ? s.tvdbId === seriesRaw.tvdbId : s.id === _sid) || seriesRaw;
          const url = isMovie ? this._getRadarrPoster(series) : this._getSonarrPoster(series);
          return url ? `<img src="${url}" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy">` : `<div style="width:100%;height:100%;background:rgba(255,255,255,0.06)"></div>`;
        }).join("");
        const smpCard = `<div class="mc smp-card" data-action="open-cal-modal">
        <div class="smp-full">
          <div class="smp-posters">${cells}</div>
          <div class="smp-overlay">
            <div class="smp-btn">${calSvgLg}</div>
            <span class="smp-cta">${this._t("seeMore")}</span>
          </div>
        </div>
      </div>`;
        items = [...items.slice(0, itemsBefore), { _isCalSeeMore: true, _smpCard: smpCard }];
      }
      grid = this._pagedGrid(items, "calendar", (ep) => {
        if (ep._isCalSeeMore) return ep._smpCard;
        return this._renderCalendarCard(ep);
      }, cols);
    }
    const hasLidarr = this._lidarrConfigured !== false;
    const _si = this._mtSegIcons;
    const calSeg = hasLidarr ? this._hdrFilter(`<div class="search-type-seg" style="margin:0 0 0 -6px">${this._mtSegmented("data-calcat-seg", [
      { v: "all", label: this._t("tabAll"), attr: 'data-calcat-type="all"', w: 38 },
      {
        v: "video",
        label: `${this._t("tabMovies")} / ${this._t("tabTvShows")}`,
        icon: `<span style="display:inline-flex;align-items:center;justify-content:center;gap:5px">${_si.movie}<span style="width:1px;height:12px;background:currentColor;opacity:0.35;flex-shrink:0"></span>${_si.tv}</span>`,
        attr: 'data-calcat-type="video"'
      },
      { v: "music", label: this._t("tabMusic"), icon: _si.music, attr: 'data-calcat-type="music"' }
    ], this._calCatTypeSaved, { accent: "0,122,255", animatePrev: !!this._calCatSegAnim, prev: this._calCatSegPrev })}</div>`, this._calCatTypeSaved !== "all", "cal") : "";
    const mask = `linear-gradient(to bottom,transparent 0.07%,black 6%,black 80%,transparent 100%)`;
    const dualOverlay = this._categoryOverlaysEnabled ? `<div style="position:absolute;inset:0;background:radial-gradient(circle at 25% 15%,${this._brandColor("radarr", 0.23)} 0%,transparent 48%),radial-gradient(circle at 75% 15%,${this._brandColor("sonarr", 0.23)} 0%,transparent 48%);mask-image:${mask};-webkit-mask-image:${mask};filter:blur(25px);pointer-events:none;z-index:0;"></div>` : "";
    return `
    <div class="sec-card has-gradient" style="${this._sectionStyle()}">
      ${dualOverlay}
      <div class="col-hdr" style="margin-bottom:5px">
        ${this._appIconRow(hasLidarr ? ["radarr", "sonarr", "lidarr"] : ["radarr", "sonarr"])}
        <span class="col-hdr-title">${this._t("catCalendar")}</span>
        ${calSeg}
        <div class="col-hdr-line"></div>
        ${this._pageIndicator("calendar", this._smpPageCount(this._calCatItems(), "calendar"))}
        <button class="smp-hdr-btn" data-action="open-cal-modal" title="Weekly calendar" style="width:28px;height:28px;margin:-2px 0;flex-shrink:0">${calSvg}</button>
      </div>
      ${grid}
    </div>`;
  }
  // ─────────────────────────────────────────────
  // Active Streams (Plex / Jellyfin via hass.states)
  // ─────────────────────────────────────────────
  _renderStreams() {
    const states = this._hass?.states || {};
    const plexStreams = Object.entries(states).filter(([id, s]) => {
      if (!id.startsWith("media_player.plex_")) return false;
      if (s.state !== "playing" && s.state !== "paused") {
        this._streamsEnded.delete(id);
        return false;
      }
      if (this._streamsEnded.has(id)) return false;
      const attr = s.attributes || {};
      const dur = attr.media_duration || 0;
      const pos = attr.media_position || 0;
      if (dur > 0 && pos >= dur - 2) return false;
      return true;
    }).map(([id, s]) => ({ id, state: s.state, attr: s.attributes || {} }));
    const jellyfinStreams = (this._jellyfinSessions || []).filter((s) => {
      if (this._streamsEnded.has(s.id)) return false;
      const dur = s.attr.media_duration || 0;
      const pos = s.attr.media_position || 0;
      if (dur > 0 && pos >= dur - 2) return false;
      return true;
    });
    const embyStreams = (this._embySessions || []).filter((s) => {
      if (this._streamsEnded.has(s.id)) return false;
      const dur = s.attr.media_duration || 0;
      const pos = s.attr.media_position || 0;
      if (dur > 0 && pos >= dur - 2) return false;
      return true;
    });
    const kodiStreams = (this._kodiSessions || []).filter((s) => {
      if (this._streamsEnded.has(s.id)) return false;
      const dur = s.attr.media_duration || 0;
      const pos = s.attr.media_position || 0;
      if (dur > 0 && pos >= dur - 2) return false;
      return true;
    });
    const streams = [...plexStreams, ...jellyfinStreams, ...embyStreams, ...kodiStreams];
    this._streams = streams;
    this._startStreamsTimer(streams);
    this._syncStreamPopup();
    if (streams.length === 0) return "";
    const grid = this._pagedGridWithSmp(streams, "streams", (s) => this._renderStreamCard(s));
    const hasPlex = plexStreams.length > 0;
    const hasJF = jellyfinStreams.length > 0;
    const hasEmby = embyStreams.length > 0;
    const hasKodi = kodiStreams.length > 0;
    const activeApps = [hasPlex && "plex", hasJF && "jellyfin", hasEmby && "emby", hasKodi && "kodi"].filter(Boolean);
    const overlayApp = activeApps[0] || "plex";
    const _streamOverlay = (() => {
      if (!this._categoryOverlaysEnabled) return "";
      const o = 0.4;
      if (streams.length <= 2) {
        const mask = `linear-gradient(to bottom,transparent 0.07%,black 6%,black 80%,transparent 100%)`;
        const g = `radial-gradient(circle at 25% 15%,${this._brandColor(overlayApp, o)} 0%,transparent 48%)`;
        return `<div style="position:absolute;inset:0;background:${g};mask-image:${mask};-webkit-mask-image:${mask};filter:blur(25px);pointer-events:none;z-index:0;"></div>`;
      }
      return this._sectionOverlayHtml(overlayApp, 25, 75, o);
    })();
    const iconHtml = activeApps.length > 1 ? activeApps.map((a) => this._appIcon(a, 20)).join("") : this._appIcon(activeApps[0] || "plex", 24);
    return `
    <div class="sec-card has-gradient" style="${this._sectionStyle()}">
      ${_streamOverlay}
      <div class="col-hdr" style="margin-bottom:5px">
        <div style="display:flex;gap:4px;align-items:center">${iconHtml}</div>
        <span class="col-hdr-title">${this._t("streamsTitle")}</span>
        <div class="col-hdr-line"></div>
        <span class="sec-badge" style="background:rgba(229,160,13,0.12);border:1px solid rgba(229,160,13,0.25)">${streams.length} ${this._t("streamsActive")}</span>
      </div>
      ${grid}
    </div>`;
  }
  _startStreamsTimer(streams) {
    if (this._streamsTimer) {
      clearInterval(this._streamsTimer);
      this._streamsTimer = null;
    }
    const playing = streams.filter((s) => s.state === "playing" && s.attr.media_duration > 0);
    if (!playing.length) return;
    this._streamsTimer = setInterval(() => {
      let anyNewlyEnded = false;
      this.shadowRoot?.querySelectorAll(".stream-prog-fill").forEach((el) => {
        const pos = parseFloat(el.dataset.pos);
        const dur = parseFloat(el.dataset.dur);
        const updatedAt = parseFloat(el.dataset.updated);
        const entity = el.dataset.entity;
        if (!dur) return;
        if (!el.dataset.state) return;
        const isPlaying = el.dataset.state === "playing";
        const elapsed = isPlaying ? (Date.now() - updatedAt) / 1e3 : 0;
        const current = Math.min(pos + elapsed, dur);
        el.style.width = (current / dur * 100).toFixed(2) + "%";
        if (isPlaying && entity && current >= dur && !this._streamsEnded.has(entity)) {
          this._streamsEnded.add(entity);
          anyNewlyEnded = true;
        }
      });
      if (anyNewlyEnded) this._reRenderSection("streams");
      let anyRestarted = false;
      for (const endedId of this._streamsEnded) {
        const s = this._hass?.states?.[endedId];
        if (!s) continue;
        if (s.state !== "playing" && s.state !== "paused") continue;
        const hassPos = s.attributes?.media_position || 0;
        const hassDur = s.attributes?.media_duration || 0;
        if (hassDur > 0 && hassPos < hassDur - 5) {
          this._streamsEnded.delete(endedId);
          anyRestarted = true;
        }
      }
      if (anyRestarted) this._reRenderSection("streams");
    }, 1e3);
  }
  // Plex streams reach the card twice: as HA media_player entities and as proxy
  // sessions keyed `plex:<machineIdentifier>`. Only the proxy side carries the
  // user and the provider ids, so pair the two up.
  _streamPlexSession(id, attr) {
    const sessions = this._plexSessions || [];
    if (id.startsWith("plex:")) return sessions.find((s) => s.id === id) || null;
    if (!id.startsWith("media_player.plex_")) return null;
    return sessions.find((s) => {
      const sTitle = s.attr.media_title || "";
      const hTitle = attr.media_title || "";
      const titleMatch = hTitle === sTitle || hTitle.startsWith(sTitle + " (") || sTitle.startsWith(hTitle + " (");
      const seriesMatch = (s.attr.media_series_title || "") === (attr.media_series_title || "");
      return titleMatch && seriesMatch;
    }) || null;
  }
  _streamLibPoster(id, attr, isTV, plexMatch) {
    let tmdbId = null;
    let tvdbId = null;
    if (id.startsWith("jellyfin:")) {
      tmdbId = attr._jfTmdbId;
      tvdbId = attr._jfTvdbId;
    } else if (id.startsWith("emby:")) {
      tmdbId = attr._embyTmdbId;
      tvdbId = attr._embyTvdbId;
    } else if (plexMatch) {
      tmdbId = plexMatch._tmdbId;
      tvdbId = plexMatch._tvdbId;
    }
    if (!tmdbId && !tvdbId) return null;
    const eq = (a, b) => a != null && b != null && String(a) === String(b);
    if (isTV) {
      const shows = [...this._sonarr || [], ...this._sonarr2 || []];
      const hit2 = shows.find((s) => eq(s.tvdbId, tvdbId)) || shows.find((s) => eq(s.tmdbId, tmdbId));
      return hit2 ? this._getSonarrPoster(hit2) : null;
    }
    const movies = [...this._radarr || [], ...this._radarr2 || []];
    const hit = movies.find((m) => eq(m.tmdbId, tmdbId));
    return hit ? this._getRadarrPoster(hit) : null;
  }
  _renderStreamCard({ id, state, attr }) {
    const isPlex = id.startsWith("media_player.plex_") || id.startsWith("plex:");
    const isJellyfin = id.startsWith("jellyfin:");
    const isEmby = id.startsWith("emby:");
    const isKodi = (this._kodiSessions || []).some((s) => s.id === id);
    const isPlaying = state === "playing";
    const contentType = attr.media_content_type || "";
    const isMusic = contentType === "music" || contentType === "artist" || contentType === "album";
    const isLiveTV = contentType === "channel" || !!attr.media_channel && !isMusic || attr.media_library_title === "Live TV";
    const isTV = isLiveTV || contentType === "tvshow" || contentType === "episode" || !!attr.media_series_title;
    const channel = attr.media_channel || "";
    const title = isLiveTV ? channel || attr.media_title || "" : isTV ? attr.media_series_title || attr.media_title || "" : attr.media_artist || attr.media_title || "";
    const epLabel = !isLiveTV && isTV && attr.media_season && attr.media_episode ? `S${String(attr.media_season).padStart(2, "0")}E${String(attr.media_episode).padStart(2, "0")}` : "";
    const subtitle = isMusic ? attr.media_album_name || "" : isLiveTV ? attr.media_title || "" : isTV ? attr.media_title || "" : "";
    let deviceIcon = attr._jfDeviceIcon || attr._embyDeviceIcon || "mdi:television";
    let deviceName = attr._jfDeviceName || attr._embyDeviceName || "TV";
    const nl = (attr.friendly_name || id).toLowerCase();
    if (!isJellyfin && !isEmby && /iphone|android.*mobile|for\s+ios|for\s+android\s*\(mobile\)/i.test(nl)) {
      deviceIcon = "mdi:cellphone";
      deviceName = "Phone";
    } else if (!isJellyfin && !isEmby && /ipad|for\s+android\s*\(tablet\)|tablet/i.test(nl)) {
      deviceIcon = "mdi:tablet";
      deviceName = "Tablet";
    } else if (!isJellyfin && !isEmby && /macbook|for\s+mac\b|mac\s+desktop/i.test(nl)) {
      deviceIcon = "mdi:laptop";
      deviceName = "Mac";
    } else if (!isJellyfin && !isEmby && /laptop/i.test(nl)) {
      deviceIcon = "mdi:laptop";
      deviceName = "Notebook";
    } else if (!isJellyfin && !isEmby && /windows|for\s+windows|desktop|pc\b/i.test(nl)) {
      deviceIcon = "mdi:monitor";
      deviceName = "PC";
    } else if (!isJellyfin && !isEmby && /web|chrome|browser|safari|firefox|for\s+web/i.test(nl)) {
      deviceIcon = "mdi:web";
      deviceName = "Browser";
    } else if (!isJellyfin && !isEmby && /apple\s*tv|android\s*tv|fire\s*tv|roku|samsung.*tv|lg.*tv|shield|htpc|for\s+tv/i.test(nl)) {
      deviceIcon = "mdi:television";
      deviceName = "TV";
    } else if (!isJellyfin && !isEmby && /android/i.test(nl)) {
      deviceIcon = "mdi:cellphone";
      deviceName = "Phone";
    }
    const plexMatch = this._streamPlexSession(id, attr);
    const poster = this._streamLibPoster(id, attr, isTV, plexMatch) || attr.entity_picture || null;
    let img;
    let musicFlat = false;
    if (!poster && isLiveTV) {
      const ch = channel || (attr.media_title || "").slice(0, 6).toUpperCase();
      img = `<div style="position:absolute;inset:0;background:linear-gradient(135deg,#0d1b2a 0%,#1b2838 60%,#0a1628 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px">
      <ha-icon icon="mdi:broadcast" style="--mdc-icon-size:30px;color:rgba(220,60,60,0.85)"></ha-icon>
      ${ch ? `<span style="font-size:8px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.45);max-width:70px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this._escHtml(ch)}</span>` : ""}
      <span style="font-size:7px;font-weight:800;letter-spacing:3px;color:rgba(220,60,60,0.7)">LIVE</span>
    </div>`;
    } else if (isMusic) {
      const perf = this._cfgGet("styles", "performanceMode", false);
      const back = !perf && poster ? `<img src="${poster}" class="mus-back" loading="lazy" aria-hidden="true" onerror="this.style.display='none'">` : "";
      const front = poster ? `<img src="${poster}" class="mus-cover" loading="lazy" onerror="this.style.display='none'">` : `<div class="mus-cover mus-cover-ph">\u266A</div>`;
      img = `${back}<div class="mus-scrim"></div>${front}`;
      musicFlat = !back;
    } else {
      img = this._mcImg(poster, isMusic ? "\u{1F3B5}" : isTV ? "\u{1F4FA}" : "\u{1F3AC}", id);
    }
    const duration = attr.media_duration || 0;
    const position = attr.media_position || 0;
    const updatedAt = attr.media_position_updated_at ? new Date(attr.media_position_updated_at).getTime() : Date.now();
    const elapsed = isPlaying ? (Date.now() - updatedAt) / 1e3 : 0;
    const currentPos = Math.min(position + elapsed, duration);
    const initPct = duration > 0 ? (currentPos / duration * 100).toFixed(2) : 0;
    const progBar = duration > 0 ? `<div class="stream-prog-track"><div class="stream-prog-fill" data-entity="${this._escHtml(id)}" data-pos="${position}" data-dur="${duration}" data-updated="${updatedAt}" data-state="${state}" style="width:${initPct}%;transition:none"></div></div>` : "";
    const svcBadge = this._statusBadge(
      isPlex ? `<span class="stream-badge stream-badge-plex">PLEX</span>` : isEmby ? `<span class="stream-badge stream-badge-emby">EMBY</span>` : isKodi ? `<span class="stream-badge stream-badge-kodi">KODI</span>` : `<span class="stream-badge stream-badge-jf">JF</span>`
    );
    const pausedOverlay = !isPlaying ? `<div class="stream-paused-overlay"><ha-icon icon="mdi:pause-circle" style="--mdc-icon-size:32px;opacity:0.85"></ha-icon></div>` : "";
    const deviceTag = `<span class="stream-device-tag"><ha-icon icon="${deviceIcon}" style="--mdc-icon-size:9px"></ha-icon> ${this._escHtml(deviceName)}</span>`;
    let userName = "";
    let userThumb = "";
    if (isPlex) {
      if (plexMatch?._plexUser) {
        userName = plexMatch._plexUser;
        userThumb = plexMatch._plexUserThumb || "";
      }
    } else if (isJellyfin) {
      userName = attr._jfUser || "";
    } else if (isEmby) {
      userName = attr._embyUser || "";
    } else if (isKodi) {
      userName = "";
    } else {
      const fn = attr.friendly_name || "";
      const jf = fn.replace(/^jellyfin\s*/i, "").trim();
      const parts = jf.split(/\s+/);
      userName = parts.length > 1 ? parts.slice(0, -1).join(" ") : jf;
    }
    const initials = userName ? userName.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "?";
    const hue = userName ? [...userName].reduce((a, c) => a + c.charCodeAt(0), 0) % 360 : 200;
    const avatarEl = userThumb ? `<img src="${this._escHtml(userThumb)}" style="width:12px;height:12px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid rgba(255,255,255,0.2)" loading="lazy" onerror="this.style.display='none'">` : "";
    const userBadge = userName ? `<div class="stream-user-tag">
        ${avatarEl}
        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0">${this._escHtml(userName)}</span>
      </div>` : "";
    const _musArtist = isMusic && this._lidarrConfigured !== false ? [...this._lidarrArtists?.values() || []].find((a) => String(a.artistName || "").trim().toLowerCase() === String(attr.media_artist || attr.media_album_artist || "").trim().toLowerCase()) : null;
    const grad = "rgba(0,0,0,0.88)";
    const tc = "rgba(var(--arr-pt-rgb,255,255,255),1)";
    const sub = subtitle ? `<div style="font-size:${isMusic ? 9 : 10}px;color:rgba(var(--arr-pt-rgb,255,255,255),${isMusic ? "0.66" : "0.6"});margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._escHtml(subtitle)}</div>` : "";
    return `
    <div class="mc${isMusic ? " mc-music" : ""}${musicFlat ? " mus-flat" : ""}${!isPlaying ? " stream-paused" : ""}"${_musArtist ? ` data-artist-id="${_musArtist.id}"` : ""} data-stream-entity="${this._escHtml(id)}" data-stream-type="${this._escHtml(contentType)}" data-stream-title="${this._escHtml(attr.media_title || title)}" data-stream-series="${this._escHtml(attr.media_series_title || "")}" style="cursor:pointer">
      ${img}
      ${deviceTag}
      ${svcBadge}
      ${pausedOverlay}
      ${userBadge}
      ${this._mcGrad(grad, isMusic ? `
        ${this._musStreamRating(attr)}
        <div style="font-size:10px;font-weight:700;color:${tc};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._escHtml(title)}</div>
        ${sub}
      ` : `
        ${epLabel ? `<div style="margin-bottom:3px"><span class="imdb">${epLabel}</span></div>` : ""}
        ${isLiveTV && channel ? `<div style="margin-bottom:3px"><span class="imdb">${this._escHtml(channel)}</span></div>` : ""}
        <div style="font-size:10px;font-weight:700;color:${tc};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._escHtml(title)}</div>
        ${sub}
      `)}
      ${progBar}
    </div>`;
  }
  _renderSearchMusicCard(res) {
    const artist = res.artist || {};
    const mbid2 = String(artist.foreignArtistId || "").toLowerCase();
    const hit = res.id ? null : mbid2 ? [...this._lidarrArtists?.values() || []].find((a) => String(a.foreignArtistId || "").toLowerCase() === mbid2) : null;
    if (hit) res = { ...res, id: hit.id };
    const inLib = !!res.id;
    const card = this._renderMusicCard(
      { id: res.id, artist: inLib ? this._lidarrArtists?.get(res.id) || artist : artist, newestAlbum: null, newAlbumCount: 0 },
      { noSub: true, noStatus: !inLib }
    );
    if (inLib) return card;
    const plus = `<div style="position:absolute;bottom:8px;right:10px;z-index:3">
    <button class="btn-add mus-add-open" data-mus-add="${this._escHtml(artist.foreignArtistId || "")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg></button>
  </div>`;
    return card.replace(/data-artist-id="[^"]*"/, `data-artist-unowned="${this._escHtml(artist.foreignArtistId || "")}"`).replace(/<\/div>\s*$/, `${plus}</div>`);
  }
  // The overlay a series gets when it is requested: it takes the poster row, asks
  // the two things Lidarr cannot guess, and adds. No album picker — Lidarr has no
  // discography for an artist it does not hold yet, and MusicBrainz's own list is
  // every bootleg and live tape a band ever had its name on.
  _renderMusicAddOverlay() {
    const p = this._musAddPending;
    if (!p) return "";
    if (p.loading || !p.opts) {
      return `<div class="req-overlay tv-req-overlay mus-add-overlay"><span class="action-spinner" style="width:22px;height:22px;border-width:2.5px"></span></div>`;
    }
    const o = p.opts;
    const qualityItems = (o.quality || []).map((q) => [q.id, q.name]);
    const metaItems = (o.metadata || []).map((m) => [m.id, m.name]);
    const rootItems = (o.rootFolders || []).map((f) => [f.path, f.path]);
    const monitorItems = [
      ["future", this._t("musMonFuture")],
      ["latest", this._t("musMonLatest")],
      ["all", this._t("musMonAll")],
      ["none", this._t("musMonNone")]
    ];
    const art = this._lidarrArtistImage(p.artist, "poster");
    const poster = art ? `<img src="${art}" class="tv-req-poster">` : `<span class="tv-req-poster tv-req-poster-ph">${this._escHtml(this._musInitials(p.artist?.artistName))}</span>`;
    const rootHtml = rootItems.length > 1 ? `<div class="mus-add-field"><span class="req-label">${this._t("musRootFolder")}</span>${this._mtFieldSelect("mus-add-root", rootItems, p.rootFolder, "width:100%")}</div>` : "";
    const metaHtml = metaItems.length > 1 ? `<div class="mus-add-field"><span class="req-label">${this._t("musMetadata")}</span>${this._mtFieldSelect("mus-add-meta", metaItems, p.metadataId, "width:100%")}</div>` : "";
    return `
    <div class="req-overlay tv-req-overlay mus-add-overlay">
      <div class="tv-req-inner">
        <div class="tv-req-col-poster">${poster}</div>
        <div class="tv-req-row2">
          <div class="tv-req-controls">
            <div class="req-panel mus-add-panel">
              <div class="mus-add-field"><span class="req-label">${this._t("downloadQuality")}</span>${this._mtFieldSelect("mus-add-profile", qualityItems, p.profileId, "width:100%")}</div>
              <div class="mus-add-field"><span class="req-label">${this._t("musMonitorWhat")}</span>${this._mtFieldSelect("mus-add-monitor", monitorItems, p.monitor, "width:100%")}</div>
              ${metaHtml}
              ${rootHtml}
            </div>
            <div class="tv-req-actions-col">
              ${p.done ? `<span class="mus-add-done">${this._t("badgeAdded")}</span>` : ""}
              <div class="req-actions">
                <button class="req-cancel mus-add-cancel" title="${this._t("cancel")}"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                <button class="req-confirm mus-add-confirm${p.done ? " is-done" : ""}" title="${this._t("confirm")}">${p.busy ? `<span class="action-spinner" style="width:13px;height:13px;border-width:2px"></span>` : `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="20 6 9 17 4 12"/></svg>`}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }
  // The playing artist's own score, where Lidarr holds them — the same badge the
  // artist card wears, so a track and its artist read alike.
  _musStreamRating(attr) {
    const name = String(attr?.media_artist || "").toLowerCase();
    if (!name || !this._lidarrArtists?.size) return "";
    const hit = [...this._lidarrArtists.values()].find((a) => String(a.artistName || "").toLowerCase() === name);
    if (!hit) return "";
    const rating = this._posterCfg().rating ? this._musRatingBadge(hit, true, true) : "";
    return this._flagStrip([], this._musOrigin(hit), rating, { endIcon: false });
  }
  // ─────────────────────────────────────────────
  // Shared pagination helper
  // ─────────────────────────────────────────────
  /**
   * Generates rp-nav HTML with first/prev/dots-or-counter/next/last buttons.
   * @param {number} page - current 0-based page
   * @param {number} totalPages
   * @param {object} opts
   *   firstAttr / prevAttr / nextAttr / lastAttr  — full HTML attribute strings for each button
   *   dotAttr       — attribute name for dot page index (e.g. 'data-page' or 'data-topage')
   *   dotSecAttr    — extra attribute prefix for dots (e.g. 'data-section="right" ')
   *   hasNext       — override for last/next disabled state (for API lazy-load)
   */
  _rpPag(page, totalPages, { firstAttr, prevAttr, nextAttr, lastAttr, dotAttr, dotSecAttr = "", hasNext: hasNextOverride } = {}) {
    const DOT_LIMIT = 10;
    const first = page === 0;
    const last = hasNextOverride !== void 0 ? !hasNextOverride : page >= totalPages - 1;
    let center;
    if (totalPages > 0 && totalPages <= DOT_LIMIT) {
      const dots = Array.from(
        { length: totalPages },
        (_, i) => `<button class="rp-dot${i === page ? " rp-dot-active" : ""}" ${dotSecAttr}${dotAttr}="${i}"${i === page ? " disabled" : ""}></button>`
      ).join("");
      center = `<div class="rp-dots">${dots}</div>`;
    } else {
      center = `<div class="rp-dots"><span class="rp-page-counter">${page + 1} / ${Math.max(totalPages, page + 1)}</span></div>`;
    }
    const Cll = `<ha-icon icon="mdi:chevron-double-left" style="--mdc-icon-size:20px"></ha-icon>`;
    const Cl = `<ha-icon icon="mdi:chevron-left" style="--mdc-icon-size:22px"></ha-icon>`;
    const Cr = `<ha-icon icon="mdi:chevron-right" style="--mdc-icon-size:22px"></ha-icon>`;
    const Crr = `<ha-icon icon="mdi:chevron-double-right" style="--mdc-icon-size:20px"></ha-icon>`;
    return `<div class="rp-nav">
    <button class="rp-btn rp-btn-icon" ${firstAttr}${first ? " disabled" : ""}>${Cll}</button>
    <button class="rp-btn rp-btn-icon" ${prevAttr}${first ? " disabled" : ""}>${Cl}</button>
    ${center}
    <button class="rp-btn rp-btn-icon" ${nextAttr}${last ? " disabled" : ""}>${Cr}</button>
    <button class="rp-btn rp-btn-icon" ${lastAttr}${last ? " disabled" : ""}>${Crr}</button>
  </div>`;
  }
};
var renderRightMixin = _RenderRight.prototype;


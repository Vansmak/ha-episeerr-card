
var _WireActivityMethods = class {
  _wireActivityPosters(right) {
    right.addEventListener("click", (e) => {
      const card = e.target.closest("[data-act-open]");
      if (!card) return;
      this._openActivityModal(card.dataset.actOpen);
    });
  }
  async _openActivityModal(tab) {
    this._markActivated();
    tab = tab || "queue";
    const _defaultCols = /* @__PURE__ */ new Set(["source", "quality", "size", "timeleft", "formats", "status"]);
    const _savedCols = (() => {
      try {
        const s = localStorage.getItem("arr-stack-queue-cols");
        if (s) {
          const arr = JSON.parse(s);
          if (arr.length) {
            const set = new Set(arr);
            if (!set.has("formats")) {
              set.add("formats");
              try {
                localStorage.setItem("arr-stack-queue-cols", JSON.stringify([...set]));
              } catch {
              }
            }
            return set;
          }
        }
      } catch {
      }
      return null;
    })();
    this._activityModal = {
      tab,
      queueData: null,
      histData: null,
      blData: null,
      histFilter: "all",
      queuePage: 0,
      queuePerPage: 15,
      histPage: 0,
      histPerPage: 15,
      blPage: 0,
      blPerPage: 15,
      queueCols: _savedCols || _defaultCols,
      queueDeleteMode: false,
      queueSearch: "",
      queueFilterSvc: "all",
      queueFilterSts: "all",
      queueFilterQuality: "all",
      queueFilterProtocol: "all",
      queueFilterIndexer: "all",
      queueFilterClient: "all",
      histFilterSvc: "all",
      histFilterQuality: "all",
      histFilterLang: "all",
      histFilterFormat: "all",
      histFilterClient: "all",
      histFilterIndexer: "all",
      histFilterRelgroup: "all",
      histSearch: "",
      histSort: "date",
      histSortDir: "desc",
      histCols: (() => {
        try {
          const s = localStorage.getItem("arr-stack-hist-cols");
          if (s) {
            const a = JSON.parse(s);
            if (a.length) return new Set(a);
          }
        } catch {
        }
        return /* @__PURE__ */ new Set(["event", "quality", "date"]);
      })(),
      blFilterSvc: "all",
      blFilterProto: "all",
      blSearch: "",
      blCols: (() => {
        try {
          const s = localStorage.getItem("arr-stack-bl-cols");
          if (s) {
            const a = JSON.parse(s);
            if (a.length) return new Set(a);
          }
        } catch {
        }
        return /* @__PURE__ */ new Set(["quality", "date", "source"]);
      })(),
      blSort: "date",
      blSortDir: "desc",
      blDeleteMode: false,
      blFilterQuality: "all",
      blFilterLang: "all",
      blFilterFormat: "all",
      blFilterIndexer: "all",
      missingPage: 0,
      missingPerPage: 15,
      missingSearch: "",
      missingFilterSvc: "all",
      missingFilterProfile: "all",
      missingFilterMonitored: "all",
      missingSort: "added",
      missingSortDir: "desc",
      missingExpanded: /* @__PURE__ */ new Set(),
      missingCols: (() => {
        try {
          const s = localStorage.getItem("arr-stack-missing-cols");
          if (s) {
            const a = JSON.parse(s);
            if (a.length) return new Set(a);
          }
        } catch {
        }
        return /* @__PURE__ */ new Set(["monitored", "source", "year", "missing"]);
      })()
    };
    this.shadowRoot.querySelector("[data-act-modal]")?.remove();
    const wrap = document.createElement("div");
    wrap.innerHTML = this._actModalHtml(tab);
    const el = wrap.firstElementChild;
    this.shadowRoot.appendChild(el);
    const bodyEl = el.querySelector("#act-body");
    if (bodyEl) {
      const bodyH = bodyEl.clientHeight || 500;
      const mobile = this._isMob;
      const rowH = mobile ? 58 : 40;
      const ovhFlt = mobile ? 80 : 78;
      const ovhQ = mobile ? 46 : 68;
      const ovhMissing = mobile ? 130 : 120;
      const perPageFlt = Math.max(4, Math.floor((bodyH - ovhFlt) / rowH));
      const perPageQueue = Math.max(4, Math.floor((bodyH - ovhQ) / rowH));
      const perPageMissing = Math.max(4, Math.floor((bodyH - ovhMissing) / rowH));
      this._activityModal.histPerPage = perPageFlt;
      this._activityModal.blPerPage = perPageFlt;
      this._activityModal.queuePerPage = perPageQueue;
      this._activityModal.missingPerPage = perPageMissing;
      this._activityModal.missingPerPageBase = perPageMissing;
    }
    this._wireActivityModal(el);
    await this._actLoadTab(tab, el);
  }
  _closeActivityModal() {
    this.shadowRoot.querySelector("[data-act-modal]")?.remove();
    this._activityModal = null;
  }
  _wireActivityModal(el) {
    el.querySelector("#act-close")?.addEventListener("click", () => {
      const back = this._actPopupReturn;
      this._actPopupReturn = null;
      this._closeActivityModal();
      if (back) this._openPopup(back.type, back.tmdbId, back.tvdbId, back.title);
    });
    el.addEventListener("click", (e) => {
      if (e.target === el) this._closeActivityModal();
    });
    el.querySelector("#act-nav-area")?.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-act-tab]");
      if (!btn || !this._activityModal) return;
      const t = btn.dataset.actTab;
      if (!t || t === this._activityModal.tab) return;
      const from = this._navIndRect(el.querySelector("#act-nav"));
      this._activityModal.tab = t;
      el.querySelector("#act-nav-area").innerHTML = this._actModalNavHtml(t);
      const nav = el.querySelector("#act-nav");
      this._syncNavInd(nav, nav?.querySelector(`.mt-nav-btn[data-act-tab="${t}"]`), from);
      await this._actLoadTab(t, el);
    });
    requestAnimationFrame(() => {
      const nav = el.querySelector("#act-nav");
      this._syncNavInd(nav, nav?.querySelector(".mt-nav-btn.is-on"));
    });
  }
  async _actLoadTab(tab, el) {
    const m = this._activityModal;
    if (!m) return;
    const body = el.querySelector("#act-body");
    if (!body) return;
    body.innerHTML = '<div class="is-loading"><span>Loading\u2026</span></div>';
    const hasR2 = this._radarr2Configured === true;
    const hasS2 = this._sonarr2Configured === true;
    const hasLi = this._lidarrConfigured !== false;
    if (tab === "queue") {
      const calls = [
        this._callApi("GET", "arr_stack/radarr/queue?includeUnknownMovieItems=true"),
        this._callApi("GET", "arr_stack/sonarr/queue?includeUnknownSeriesItems=true"),
        hasR2 ? this._callApi("GET", "arr_stack/radarr2/queue?includeUnknownMovieItems=true") : Promise.resolve(null),
        hasS2 ? this._callApi("GET", "arr_stack/sonarr2/queue?includeUnknownSeriesItems=true") : Promise.resolve(null),
        hasLi ? this._callApi("GET", "arr_stack/lidarr/queue?pageSize=100") : Promise.resolve(null)
      ];
      const [rq, sq, rq2, sq2, lq] = await Promise.allSettled(calls);
      if (!this._activityModal) return;
      const _toArr = (v) => Array.isArray(v) ? v : Array.isArray(v?.records) ? v.records : [];
      const rMovieMap = new Map((this._radarr || []).map((m2) => [m2.id, m2.title]));
      const rMovieMap2 = new Map((this._radarr2 || []).map((m2) => [m2.id, m2.title]));
      const rRaw = rq.status === "fulfilled" && rq.value ? _toArr(rq.value) : [];
      const rRaw2 = rq2.status === "fulfilled" && rq2.value ? _toArr(rq2.value) : [];
      const rRecords = [
        ...rRaw.map((r) => ({ ...r, _svc: "radarr", _enrichedTitle: rMovieMap.get(r.movieId) || r.movie?.title || r.title || null })),
        ...rRaw2.map((r) => ({ ...r, _svc: "radarr2", _enrichedTitle: rMovieMap2.get(r.movieId) || r.movie?.title || r.title || null }))
      ];
      const sSeriesMap = new Map((this._sonarr || []).map((s) => [s.id, s.title]));
      const sSeriesMap2 = new Map((this._sonarr2 || []).map((s) => [s.id, s.title]));
      const sRaw = sq.status === "fulfilled" && sq.value ? _toArr(sq.value) : [];
      const sRaw2 = sq2.status === "fulfilled" && sq2.value ? _toArr(sq2.value) : [];
      const sRecords = [
        ...sRaw.map((r) => ({ ...r, _svc: "sonarr", _enrichedTitle: sSeriesMap.get(r.seriesId) || r.series?.title || r.title || null })),
        ...sRaw2.map((r) => ({ ...r, _svc: "sonarr2", _enrichedTitle: sSeriesMap2.get(r.seriesId) || r.series?.title || r.title || null }))
      ];
      const _isBadItem = (r) => r.trackedDownloadStatus === "warning" || r.trackedDownloadStatus === "error" || r.trackedDownloadState === "importFailed" || r.status === "failed";
      const badItems = [
        ...rRecords.filter((r) => _isBadItem(r) && r.downloadId).map((r) => ({ r, svc: r._svc, qs: `downloadId=${encodeURIComponent(r.downloadId)}&movieId=${r.movieId || ""}` })),
        ...sRecords.filter((r) => _isBadItem(r) && r.downloadId).map((r) => ({ r, svc: r._svc, qs: `downloadId=${encodeURIComponent(r.downloadId)}&seriesId=${r.seriesId || ""}` }))
      ];
      if (badItems.length) {
        const miResults = await Promise.allSettled(badItems.map((b) => this._callApi("GET", `arr_stack/${b.svc}/manualimport?${b.qs}`)));
        miResults.forEach((res, i) => {
          if (res.status === "fulfilled") {
            const candidates = Array.isArray(res.value) ? res.value : [];
            const rej = candidates[0]?.rejections?.[0]?.reason;
            if (rej) badItems[i].r._miRejection = rej;
          }
        });
      }
      const lRaw = lq?.status === "fulfilled" && lq.value ? _toArr(lq.value) : [];
      const lArtists = this._lidarrArtists || /* @__PURE__ */ new Map();
      const lRecords = lRaw.map((r) => {
        const who = r.artist?.artistName || lArtists.get(r.artistId)?.artistName || "";
        const alb = r.album?.title || r.title || "";
        return { ...r, _svc: "lidarr", _enrichedTitle: [who, alb].filter(Boolean).join(" \u2014 ") || r.title || null };
      });
      m.queueData = { radarr: rRecords, sonarr: [...sRecords, ...lRecords] };
      this._actRenderQueue(body, el);
    } else if (tab === "history") {
      const et = m.histFilter === "all" ? "" : "&eventType=" + encodeURIComponent(m.histFilter);
      const calls = [
        this._callApi("GET", "arr_stack/radarr/activity/history?page=1&pageSize=500&sortKey=date&sortDir=desc" + et),
        this._callApi("GET", "arr_stack/sonarr/activity/history?page=1&pageSize=100&sortKey=date&sortDir=desc" + et),
        hasR2 ? this._callApi("GET", "arr_stack/radarr2/activity/history?page=1&pageSize=200&sortKey=date&sortDir=desc" + et) : Promise.resolve(null),
        hasS2 ? this._callApi("GET", "arr_stack/sonarr2/activity/history?page=1&pageSize=100&sortKey=date&sortDir=desc" + et) : Promise.resolve(null),
        hasLi ? this._callApi("GET", "arr_stack/lidarr/activity/history?page=1&pageSize=100&sortKey=date&sortDir=desc" + et) : Promise.resolve(null)
      ];
      const [rh, sh, rh2, sh2, lh] = await Promise.allSettled(calls);
      if (!this._activityModal) return;
      const _mergeHist = (a, b) => {
        if (!a && !b) return null;
        const recs = [...a?.records || [], ...b?.records || []];
        return { records: recs, totalRecords: recs.length };
      };
      const _lidarrHist = (raw) => {
        if (!raw?.records) return null;
        const artists = this._lidarrArtists || /* @__PURE__ */ new Map();
        return { records: raw.records.map((r) => {
          const who = r.artist?.artistName || artists.get(r.artistId)?.artistName || "";
          const alb = r.album?.title || "";
          return { ...r, _svc: "lidarr", _enrichedTitle: [who, alb].filter(Boolean).join(" \u2014 ") || r.sourceTitle };
        }) };
      };
      m.histData = {
        radarr: _mergeHist(rh.status === "fulfilled" ? rh.value : null, rh2.status === "fulfilled" ? rh2.value : null),
        sonarr: _mergeHist(
          _mergeHist(sh.status === "fulfilled" ? sh.value : null, sh2.status === "fulfilled" ? sh2.value : null),
          _lidarrHist(lh.status === "fulfilled" ? lh.value : null)
        )
      };
      this._actSetBodyHtml(body, this._actHistoryTabHtml(m.histData.radarr, m.histData.sonarr, m.histFilter, m.histPage, m.histPerPage));
      this._wireActBody(body, el, "history");
    } else if (tab === "blocklist") {
      const calls = [
        this._callApi("GET", "arr_stack/radarr/activity/blocklist?page=1&pageSize=100"),
        this._callApi("GET", "arr_stack/sonarr/activity/blocklist?page=1&pageSize=100"),
        hasR2 ? this._callApi("GET", "arr_stack/radarr2/activity/blocklist?page=1&pageSize=100") : Promise.resolve(null),
        hasS2 ? this._callApi("GET", "arr_stack/sonarr2/activity/blocklist?page=1&pageSize=100") : Promise.resolve(null),
        hasLi ? this._callApi("GET", "arr_stack/lidarr/activity/blocklist?page=1&pageSize=100") : Promise.resolve(null)
      ];
      const [rb, sb, rb2, sb2, lb] = await Promise.allSettled(calls);
      if (!this._activityModal) return;
      const _mergeBl = (a, b) => {
        if (!a && !b) return null;
        const recs = [...a?.records || [], ...b?.records || []];
        return { records: recs, totalRecords: recs.length };
      };
      const _lidarrBl = (raw) => {
        if (!raw?.records) return null;
        const artists = this._lidarrArtists || /* @__PURE__ */ new Map();
        return { records: raw.records.map((r) => ({
          ...r,
          _svc: "lidarr",
          _enrichedTitle: artists.get(r.artistId)?.artistName || r.artist?.artistName || r.sourceTitle
        })) };
      };
      m.blData = {
        radarr: _mergeBl(rb.status === "fulfilled" ? rb.value : null, rb2.status === "fulfilled" ? rb2.value : null),
        sonarr: _mergeBl(
          _mergeBl(sb.status === "fulfilled" ? sb.value : null, sb2.status === "fulfilled" ? sb2.value : null),
          _lidarrBl(lb.status === "fulfilled" ? lb.value : null)
        )
      };
      this._actSetBodyHtml(body, this._actBlocklistTabHtml(m.blData.radarr, m.blData.sonarr, m.blPage, m.blPerPage));
      this._wireActBody(body, el, "blocklist");
    } else if (tab === "missing") {
      if (!this._activityModal) return;
      await Promise.allSettled([
        this._fetchSonarrProfiles(),
        this._fetchRadarrProfiles()
      ]);
      if (!this._activityModal) return;
      this._computeActMissingCache();
      this._actRenderMissing(body, el);
    }
  }
  _actRenderQueue(body, el, pageOverride) {
    const m = this._activityModal;
    if (!m) return;
    if (pageOverride !== void 0) m.queuePage = pageOverride;
    body.innerHTML = this._actQueueTabHtml(m.queueData?.radarr || [], m.queueData?.sonarr || [], m.queuePage, m.queuePerPage, m.queueCols);
    requestAnimationFrame(() => {
      if (!this._activityModal) return;
      const clip = body.querySelector("[data-act-clip]");
      if (clip) {
        const m2 = this._activityModal;
        const isMob = !clip.querySelector("table");
        const pagH = isMob ? 44 : 40;
        const effectiveClipB = clip.getBoundingClientRect().bottom - pagH;
        const items = isMob ? [...clip.children] : [...clip.querySelectorAll("tbody tr")];
        const fitting = items.filter((el2) => el2.getBoundingClientRect().bottom <= effectiveClipB + 2).length;
        if (fitting < items.length && fitting >= 1) {
          m2.queuePerPage = fitting;
          body.innerHTML = this._actQueueTabHtml(m2.queueData?.radarr || [], m2.queueData?.sonarr || [], m2.queuePage, m2.queuePerPage, m2.queueCols);
        }
      }
      this._wireActBody(body, el, "queue");
    });
  }
  _actRenderMissing(body, el, pageOverride, skipBaseReset) {
    const m = this._activityModal;
    if (!m) return;
    if (pageOverride !== void 0) m.missingPage = pageOverride;
    if (!skipBaseReset && m.missingPerPageBase) m.missingPerPage = m.missingPerPageBase;
    const c = this._actMissingCache;
    body.innerHTML = this._actMissingTabHtml(c?.rRecs || [], c?.sRecs || [], m.missingPage, m.missingPerPage, m.missingCols);
    requestAnimationFrame(() => {
      if (!this._activityModal) return;
      const clip = body.querySelector("[data-act-clip]");
      if (clip) {
        const m2 = this._activityModal;
        const clipB = clip.getBoundingClientRect().bottom;
        const isMobileClip = !clip.querySelector("table");
        const items = isMobileClip ? [...clip.children] : [...clip.querySelectorAll("tbody tr:not([data-act-season])")];
        const isExpandedRow = (el2) => isMobileClip && !!el2.querySelector("[data-act-season]");
        const hasExpandedRow = isMobileClip ? items.some((el2) => isExpandedRow(el2)) : !!clip.querySelector("[data-act-season]");
        if (!hasExpandedRow) {
          const overflowing = items.filter((el2) => el2.getBoundingClientRect().bottom > clipB + 2).length;
          if (overflowing > 0) {
            this._activityModal.missingPerPage = Math.max(4, this._activityModal.missingPerPage - overflowing);
            const m22 = this._activityModal;
            const c2 = this._actMissingCache;
            body.innerHTML = this._actMissingTabHtml(c2?.rRecs || [], c2?.sRecs || [], m22.missingPage, m22.missingPerPage, m22.missingCols);
          }
        }
        const expandedOverflow = isMobileClip ? hasExpandedRow && items.some((el2) => isExpandedRow(el2) && el2.getBoundingClientRect().bottom > clipB + 2) : hasExpandedRow && [...clip.querySelectorAll("[data-act-season]")].some((el2) => el2.getBoundingClientRect().bottom > clipB + 2);
        clip.style.overflowY = expandedOverflow ? "auto" : "";
        if (isMobileClip) clip.style.paddingRight = expandedOverflow ? "14px" : "";
        if (expandedOverflow && isMobileClip) {
          const expandedRowEl = items.find((el2) => isExpandedRow(el2));
          if (expandedRowEl) {
            const rowBottom = expandedRowEl.getBoundingClientRect().bottom;
            const overflow = rowBottom - clipB;
            if (overflow > 0) clip.scrollTop = overflow + 8;
          }
        }
      }
      this._wireActBody(body, el, "missing");
    });
  }
  _computeActMissingCache() {
    const _buildProfMap = (...profArrays) => {
      const map = /* @__PURE__ */ new Map();
      for (const arr of profArrays) for (const p of arr || []) if (p.id != null && p.name) map.set(p.id, p.name);
      return map;
    };
    const rProfMap = _buildProfMap(this._radarrProfiles, this._radarr2Profiles);
    const sProfMap = _buildProfMap(this._sonarrProfiles, this._sonarr2Profiles);
    const rRecs = [
      ...(this._radarr || []).filter((m) => !m.hasFile).map((m) => ({ ...m, _inst: "radarr", _profileName: rProfMap.get(m.qualityProfileId) || "" })),
      ...(this._radarr2 || []).filter((m) => !m.hasFile).map((m) => ({ ...m, _inst: "radarr2", _profileName: rProfMap.get(m.qualityProfileId) || "" }))
    ];
    const sRecs = [
      ...(this._sonarr || []).map((s) => {
        const s0 = (s.seasons || []).find((ss) => ss.seasonNumber === 0);
        const mc = Math.max(0, (s.statistics?.totalEpisodeCount || 0) - (s0?.statistics?.totalEpisodeCount || 0) - ((s.statistics?.episodeFileCount || 0) - (s0?.statistics?.episodeFileCount || 0)));
        const tc = Math.max(0, (s.statistics?.totalEpisodeCount || 0) - (s0?.statistics?.totalEpisodeCount || 0));
        const fc = Math.max(0, (s.statistics?.episodeFileCount || 0) - (s0?.statistics?.episodeFileCount || 0));
        return { ...s, _inst: "sonarr", _profileName: sProfMap.get(s.qualityProfileId) || "", _missingCount: mc, _totalCount: tc, _fileCount: fc };
      }).filter((s) => s._missingCount > 0),
      ...(this._sonarr2 || []).map((s) => {
        const s0 = (s.seasons || []).find((ss) => ss.seasonNumber === 0);
        const mc = Math.max(0, (s.statistics?.totalEpisodeCount || 0) - (s0?.statistics?.totalEpisodeCount || 0) - ((s.statistics?.episodeFileCount || 0) - (s0?.statistics?.episodeFileCount || 0)));
        const tc = Math.max(0, (s.statistics?.totalEpisodeCount || 0) - (s0?.statistics?.totalEpisodeCount || 0));
        const fc = Math.max(0, (s.statistics?.episodeFileCount || 0) - (s0?.statistics?.episodeFileCount || 0));
        return { ...s, _inst: "sonarr2", _profileName: sProfMap.get(s.qualityProfileId) || "", _missingCount: mc, _totalCount: tc, _fileCount: fc };
      }).filter((s) => s._missingCount > 0)
    ];
    this._actMissingCache = { movieCount: rRecs.length, seriesCount: sRecs.length, rRecs, sRecs };
  }
  _wireActBody(body, modalEl, tab) {
    const m = this._activityModal;
    if (!m) return;
    if (body._wireAbort) body._wireAbort.abort();
    body._wireAbort = new AbortController();
    const signal = body._wireAbort.signal;
    const _clipEl = body.querySelector("[data-act-clip]");
    if (_clipEl && this._isMob) {
      let _tsx = 0;
      _clipEl.addEventListener("touchstart", (e) => {
        _tsx = e.touches[0].clientX;
      }, { signal, passive: true });
      _clipEl.addEventListener("touchend", (e) => {
        const dx = e.changedTouches[0].clientX - _tsx;
        if (Math.abs(dx) < 50) return;
        const dir = dx < 0 ? "next" : "prev";
        const attr = tab === "queue" ? "act-queue-page" : tab === "history" ? "act-hist-page" : tab === "missing" ? "act-missing-page" : "act-bl-page";
        body.querySelector(`[data-${attr}="${dir}"]`)?.click();
      }, { signal });
    }
    if (tab === "queue") {
      body.querySelector("#act-queue-search")?.addEventListener("input", (e) => {
        if (!this._activityModal) return;
        const val = e.target.value;
        this._activityModal.queueSearch = val;
        this._activityModal.queuePage = 0;
        const m2 = this._activityModal;
        this._patchResultsWrap(body, "act-queue-results-wrap", () => this._actQueueTabHtml(m2.queueData?.radarr || [], m2.queueData?.sonarr || [], 0, m2.queuePerPage, m2.queueCols));
        requestAnimationFrame(() => this._actFitFmtTags(body));
        this._wireActBody(body, modalEl, "queue");
      });
      body.querySelector("#act-queue-cols-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this._openQueueColPicker(e.currentTarget, modalEl);
      });
      const _qRerender = () => {
        const m2 = this._activityModal;
        if (!m2) return;
        m2.queuePage = 0;
        this._actSetBodyHtml(body, this._actQueueTabHtml(m2.queueData?.radarr || [], m2.queueData?.sonarr || [], 0, m2.queuePerPage, m2.queueCols));
        this._wireActBody(body, modalEl, "queue");
      };
      [
        ["#act-queue-svc", "queueFilterSvc"],
        ["#act-queue-sts", "queueFilterSts"],
        ["#act-queue-quality", "queueFilterQuality"],
        ["#act-queue-proto", "queueFilterProtocol"],
        ["#act-queue-indexer", "queueFilterIndexer"],
        ["#act-queue-client", "queueFilterClient"]
      ].forEach(([sel, key]) => {
        body.querySelector(sel)?.addEventListener("change", (e) => {
          const m2 = this._activityModal;
          if (!m2) return;
          m2[key] = e.target.value;
          _qRerender();
        });
      });
      body.addEventListener("click", async (e) => {
        if (!this._activityModal) return;
        const removeBtn = e.target.closest(".act-remove-btn");
        if (removeBtn) {
          this._openQueueRemoveModal(removeBtn.dataset, modalEl);
          return;
        }
        const miBtn = e.target.closest(".act-mi-btn");
        if (miBtn) {
          await this._openManualImportModal(miBtn, modalEl);
          return;
        }
        const pBtn = e.target.closest("[data-act-queue-page]");
        if (pBtn) {
          const m2 = this._activityModal;
          const all = [...m2.queueData?.radarr || [], ...m2.queueData?.sonarr || []];
          const tot = Math.max(1, Math.ceil(all.length / m2.queuePerPage));
          const p = pBtn.dataset.actQueuePage;
          const cur = m2.queuePage;
          const np = p === "first" ? 0 : p === "prev" ? Math.max(0, cur - 1) : p === "next" ? Math.min(tot - 1, cur + 1) : p === "last" ? tot - 1 : parseInt(p) || 0;
          if (np !== cur) {
            m2.queuePage = np;
            this._actSetBodyHtml(body, this._actQueueTabHtml(m2.queueData?.radarr || [], m2.queueData?.sonarr || [], np, m2.queuePerPage, m2.queueCols));
            this._wireActBody(body, modalEl, "queue");
          }
        }
      }, { signal });
    }
    if (tab === "history") {
      body.querySelector("#act-hist-search")?.addEventListener("input", (e) => {
        if (!this._activityModal) return;
        const val = e.target.value;
        this._activityModal.histSearch = val;
        this._activityModal.histPage = 0;
        const m2 = this._activityModal;
        this._patchResultsWrap(body, "act-hist-results-wrap", () => this._actHistoryTabHtml(m2.histData?.radarr, m2.histData?.sonarr, m2.histFilter, 0, m2.histPerPage));
        requestAnimationFrame(() => this._actFitFmtTags(body));
        this._wireActBody(body, modalEl, "history");
      });
      body.querySelector("#act-hist-cols-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this._openHistoryColPicker(e.currentTarget, modalEl);
      });
      body.querySelector("#act-hist-svc")?.addEventListener("change", (e) => {
        const m2 = this._activityModal;
        if (!m2) return;
        m2.histFilterSvc = e.target.value;
        m2.histPage = 0;
        this._actSetBodyHtml(body, this._actHistoryTabHtml(m2.histData?.radarr, m2.histData?.sonarr, m2.histFilter, 0, m2.histPerPage));
        this._wireActBody(body, modalEl, "history");
      });
      body.querySelector("#act-hist-filter")?.addEventListener("change", async (e) => {
        const m2 = this._activityModal;
        if (!m2) return;
        m2.histFilter = e.target.value;
        m2.histPage = 0;
        m2.histData = null;
        await this._actLoadTab("history", modalEl);
      });
      const _hRerender = () => {
        const m2 = this._activityModal;
        if (!m2) return;
        m2.histPage = 0;
        this._actSetBodyHtml(body, this._actHistoryTabHtml(m2.histData?.radarr, m2.histData?.sonarr, m2.histFilter, 0, m2.histPerPage));
        this._wireActBody(body, modalEl, "history");
      };
      [
        ["#act-hist-quality", "histFilterQuality"],
        ["#act-hist-lang", "histFilterLang"],
        ["#act-hist-format", "histFilterFormat"],
        ["#act-hist-client", "histFilterClient"],
        ["#act-hist-indexer", "histFilterIndexer"],
        ["#act-hist-relgroup", "histFilterRelgroup"]
      ].forEach(([sel, key]) => {
        body.querySelector(sel)?.addEventListener("change", (e) => {
          const m2 = this._activityModal;
          if (!m2) return;
          m2[key] = e.target.value;
          _hRerender();
        });
      });
      body.addEventListener("click", async (e) => {
        if (!this._activityModal) return;
        const sortBtn = e.target.closest("[data-act-hist-sort]");
        if (sortBtn) {
          const col = sortBtn.dataset.actHistSort;
          const m2 = this._activityModal;
          if (m2.histSort === col) {
            m2.histSortDir = m2.histSortDir === "asc" ? "desc" : "asc";
          } else {
            m2.histSort = col;
            m2.histSortDir = col === "date" ? "desc" : "asc";
          }
          m2.histPage = 0;
          this._actSetBodyHtml(body, this._actHistoryTabHtml(m2.histData?.radarr, m2.histData?.sonarr, m2.histFilter, 0, m2.histPerPage));
          this._wireActBody(body, modalEl, "history");
          return;
        }
        const pBtn = e.target.closest("[data-act-hist-page]");
        if (pBtn) {
          const m2 = this._activityModal;
          const all = [...m2.histData?.radarr?.records || [], ...m2.histData?.sonarr?.records || []];
          const tot = Math.max(1, Math.ceil(all.length / m2.histPerPage));
          const p = pBtn.dataset.actHistPage;
          const cur = m2.histPage;
          const np = p === "first" ? 0 : p === "prev" ? Math.max(0, cur - 1) : p === "next" ? Math.min(tot - 1, cur + 1) : p === "last" ? tot - 1 : parseInt(p) || 0;
          if (np !== cur) {
            m2.histPage = np;
            this._actSetBodyHtml(body, this._actHistoryTabHtml(m2.histData?.radarr, m2.histData?.sonarr, m2.histFilter, np, m2.histPerPage));
            this._wireActBody(body, modalEl, "history");
          }
        }
      }, { signal });
    }
    if (tab === "missing") {
      body.querySelector("#act-missing-search")?.addEventListener("input", (e) => {
        if (!this._activityModal) return;
        const val = e.target.value;
        this._activityModal.missingSearch = val;
        this._activityModal.missingPage = 0;
        const m2 = this._activityModal;
        const c = this._actMissingCache;
        this._patchResultsWrap(body, "act-missing-results-wrap", () => this._actMissingTabHtml(c?.rRecs || [], c?.sRecs || [], m2.missingPage, m2.missingPerPage, m2.missingCols));
        this._wireActBody(body, modalEl, "missing");
      });
      body.querySelector("#act-missing-cols-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this._openMissingColPicker(e.currentTarget, modalEl);
      });
      const _mRerender = () => {
        if (!this._activityModal) return;
        this._actRenderMissing(body, modalEl, 0);
      };
      [
        ["#act-missing-svc", "missingFilterSvc"],
        ["#act-missing-profile", "missingFilterProfile"],
        ["#act-missing-monitored", "missingFilterMonitored"]
      ].forEach(([sel, key]) => {
        body.querySelector(sel)?.addEventListener("change", (e) => {
          const m2 = this._activityModal;
          if (!m2) return;
          m2[key] = e.target.value;
          _mRerender();
        });
      });
      body.addEventListener("click", async (e) => {
        if (!this._activityModal) return;
        const monT = e.target.closest(".act-mon-toggle");
        if (monT) {
          const kind = monT.dataset.kind;
          const id = Number(monT.dataset.id);
          const svc = monT.dataset.svc;
          const cur = monT.dataset.mon === "1";
          monT.disabled = true;
          monT.innerHTML = `<span class="action-spinner" style="width:11px;height:11px;border-width:1.5px"></span>`;
          try {
            if (kind === "movie") {
              const arr = svc === "radarr2" ? this._radarr2 : this._radarr;
              const movie = (arr || []).find((m2) => m2.id === id) || { id };
              const fresh = await this._callApi("PUT", `arr_stack/${svc}/movie/${id}`, { ...movie, monitored: !cur });
              if (fresh && arr) {
                const idx = arr.findIndex((m2) => m2.id === id);
                if (idx !== -1) arr[idx] = { ...arr[idx], ...fresh };
              }
            } else {
              const arr = (svc === "sonarr2" ? this._sonarr2 : this._sonarr) || [];
              const series = arr.find((s) => s.id === id);
              if (series) {
                const payload = kind === "season" ? { ...series, seasons: (series.seasons || []).map((ss) => ss.seasonNumber === Number(monT.dataset.season) ? { ...ss, monitored: !cur } : ss) } : { ...series, monitored: !cur };
                const fresh = await this._callApi("PUT", `arr_stack/${svc}/series/${id}`, payload);
                if (fresh) {
                  const idx2 = arr.findIndex((s) => s.id === id);
                  if (idx2 !== -1) arr[idx2] = { ...arr[idx2], ...fresh };
                }
              }
            }
            await this._actLoadTab("missing", modalEl);
          } catch {
            monT.disabled = false;
          }
          return;
        }
        const infoBtn = e.target.closest(".act-missing-info-btn");
        if (infoBtn) {
          const tmdb = infoBtn.dataset.tmdb || null;
          const tvdb = infoBtn.dataset.tvdb || null;
          const title = infoBtn.dataset.title || "";
          const type = infoBtn.dataset.type || "radarr";
          const _pr = this.shadowRoot.getElementById("popup-root");
          if (_pr) this.shadowRoot.appendChild(_pr);
          await this._openPopup(type, tmdb || null, tvdb || null, title);
          if (this._popup) {
            this._popup._infoOnly = true;
            this._renderPopupEl();
          }
          return;
        }
        const sortBtn = e.target.closest("[data-act-missing-sort]");
        if (sortBtn) {
          const col = sortBtn.dataset.actMissingSort;
          const m2 = this._activityModal;
          if (m2.missingSort === col) {
            m2.missingSortDir = m2.missingSortDir === "asc" ? "desc" : "asc";
          } else {
            m2.missingSort = col;
            m2.missingSortDir = col === "added" ? "desc" : "asc";
          }
          this._actRenderMissing(body, modalEl, 0);
          return;
        }
        const expandBtn = e.target.closest(".act-missing-expand-btn");
        if (expandBtn) {
          const key = expandBtn.dataset.key;
          const m2 = this._activityModal;
          if (!m2) return;
          const isCollapse = m2.missingExpanded.has(key);
          m2.missingExpanded.clear();
          if (!isCollapse) m2.missingExpanded.add(key);
          this._actRenderMissing(body, modalEl, void 0, !isCollapse);
          return;
        }
        const seasonIsBtn = e.target.closest(".act-missing-season-is-btn");
        if (seasonIsBtn) {
          const seriesId = Number(seasonIsBtn.dataset.id);
          const svc = seasonIsBtn.dataset.svc;
          const seasonNumber = Number(seasonIsBtn.dataset.season);
          const title = seasonIsBtn.dataset.title || "";
          await this._openSeasonIsOverlay(seriesId, svc, seasonNumber, title);
          return;
        }
        const isBtn = e.target.closest(".act-missing-is-btn");
        if (isBtn) {
          const id = Number(isBtn.dataset.id);
          const svc = isBtn.dataset.svc;
          const tmdb = isBtn.dataset.tmdb || null;
          const tvdb = isBtn.dataset.tvdb || null;
          const title = isBtn.dataset.title || "";
          const _pr = this.shadowRoot.getElementById("popup-root");
          if (_pr) this.shadowRoot.appendChild(_pr);
          const isSonarr = svc === "sonarr" || svc === "sonarr2";
          if (isSonarr) {
            const inst = svc === "sonarr2" ? "sonarr2" : "sonarr";
            try {
              await this._openPopup("sonarr", tmdb, tvdb, title);
            } catch (err) {
              if (err?.message !== "no_id") {
                console.warn("[arr-card] IS open error:", err);
                return;
              }
              if (!this._popup?._sonarrSeries) return;
              delete this._popup._loading;
            }
            if (this._popup) {
              this._popup._fromActivity = true;
              this._snIsInstance = inst;
              this._snIsOpen = true;
              this._snIsState = null;
              this._snSeasonsPage = 0;
              this._renderPopupEl();
            }
          } else {
            try {
              const radarrLib = svc === "radarr2" ? this._radarr2 || [] : this._radarr || [];
              const movie = radarrLib.find((m2) => m2.id === id);
              const radarrId = movie?.id ?? id;
              const tmdbId = movie?.tmdbId ? String(movie.tmdbId) : tmdb;
              const inst = svc === "radarr2" ? "radarr2" : "radarr";
              await this._openPopup("radarr", tmdbId, null, title, radarrId);
              if (this._popup) {
                this._popup._fromActivity = true;
                this._isInstance = inst;
                this._fetchInteractiveSearch(radarrId, inst);
              }
            } catch (err) {
              if (err?.message !== "no_id") console.warn("[arr-card] IS open error:", err);
            }
          }
          return;
        }
        const asBtn = e.target.closest(".act-missing-as-btn");
        if (asBtn) {
          const id = asBtn.dataset.id;
          const svc = asBtn.dataset.svc;
          const origHtml = asBtn.innerHTML;
          asBtn.disabled = true;
          asBtn.textContent = "\u2026";
          try {
            if (svc === "radarr" || svc === "radarr2") {
              await this._callApi("POST", `arr_stack/${svc}/command`, { name: "MoviesSearch", movieIds: [Number(id)] });
            } else {
              const season = asBtn.dataset.season != null ? Number(asBtn.dataset.season) : null;
              const cmd = season != null ? { name: "SeasonSearch", seriesId: Number(id), seasonNumber: season } : { name: "SeriesSearch", seriesId: Number(id) };
              await this._callApi("POST", `arr_stack/${svc}/command`, cmd);
            }
            asBtn.textContent = "\u2713";
            asBtn.style.color = "rgba(80,200,100,0.9)";
          } catch {
            asBtn.innerHTML = origHtml;
          } finally {
            asBtn.disabled = false;
          }
          return;
        }
        const pBtn = e.target.closest("[data-act-missing-page]");
        if (pBtn) {
          const m2 = this._activityModal;
          const c = this._actMissingCache;
          const fSvc = m2.missingFilterSvc || "all";
          const fProf = m2.missingFilterProfile || "all";
          const fMon = m2.missingFilterMonitored || "all";
          const mSrch = (m2.missingSearch || "").toLowerCase().trim();
          const allRows = [
            ...(c?.rRecs || []).map((r) => ({ _svc: r._inst || "radarr", _profile: r._profileName || "", _monitored: r.monitored ?? true, _title: r.title || "" })),
            ...(c?.sRecs || []).map((s) => ({ _svc: s._inst || "sonarr", _profile: s._profileName || "", _monitored: s.monitored ?? true, _title: s.title || "" }))
          ];
          const filteredLen = allRows.filter((r) => {
            if (fSvc !== "all" && r._svc !== fSvc) return false;
            if (fProf !== "all" && r._profile !== fProf) return false;
            if (fMon !== "all" && (fMon === "monitored" ? !r._monitored : r._monitored)) return false;
            if (mSrch && !r._title.toLowerCase().includes(mSrch)) return false;
            return true;
          }).length;
          const tot = Math.max(1, Math.ceil(filteredLen / m2.missingPerPage));
          const p = pBtn.dataset.actMissingPage;
          const cur = m2.missingPage;
          const np = p === "first" ? 0 : p === "prev" ? Math.max(0, cur - 1) : p === "next" ? Math.min(tot - 1, cur + 1) : p === "last" ? tot - 1 : parseInt(p) || 0;
          if (np !== cur) {
            this._actRenderMissing(body, modalEl, np, true);
          }
        }
      }, { signal });
    }
    if (tab === "blocklist") {
      body.querySelector("#act-bl-search")?.addEventListener("input", (e) => {
        if (!this._activityModal) return;
        const val = e.target.value;
        this._activityModal.blSearch = val;
        this._activityModal.blPage = 0;
        const m2 = this._activityModal;
        this._patchResultsWrap(body, "act-bl-results-wrap", () => this._actBlocklistTabHtml(m2.blData?.radarr, m2.blData?.sonarr, 0, m2.blPerPage));
        requestAnimationFrame(() => this._actFitFmtTags(body));
        this._wireActBody(body, modalEl, "blocklist");
      });
      body.querySelector("#act-bl-cols-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this._openBlColPicker(e.currentTarget, modalEl);
      });
      const _blRerender = () => {
        const m2 = this._activityModal;
        if (!m2) return;
        m2.blPage = 0;
        this._actSetBodyHtml(body, this._actBlocklistTabHtml(m2.blData?.radarr, m2.blData?.sonarr, 0, m2.blPerPage));
        this._wireActBody(body, modalEl, "blocklist");
      };
      [
        ["#act-bl-svc", "blFilterSvc"],
        ["#act-bl-proto", "blFilterProto"],
        ["#act-bl-quality", "blFilterQuality"],
        ["#act-bl-lang", "blFilterLang"],
        ["#act-bl-format", "blFilterFormat"],
        ["#act-bl-indexer", "blFilterIndexer"]
      ].forEach(([sel, key]) => {
        body.querySelector(sel)?.addEventListener("change", (e) => {
          const m2 = this._activityModal;
          if (!m2) return;
          m2[key] = e.target.value;
          _blRerender();
        });
      });
      body.addEventListener("click", async (e) => {
        if (!this._activityModal) return;
        const sortBtn = e.target.closest("[data-act-bl-sort]");
        if (sortBtn) {
          const col = sortBtn.dataset.actBlSort;
          const m2 = this._activityModal;
          if (m2.blSort === col) {
            m2.blSortDir = m2.blSortDir === "asc" ? "desc" : "asc";
          } else {
            m2.blSort = col;
            m2.blSortDir = col === "date" ? "desc" : "asc";
          }
          m2.blPage = 0;
          this._actSetBodyHtml(body, this._actBlocklistTabHtml(m2.blData?.radarr, m2.blData?.sonarr, 0, m2.blPerPage));
          this._wireActBody(body, modalEl, "blocklist");
          return;
        }
        const removeBtn = e.target.closest(".act-bl-remove-btn");
        if (removeBtn) {
          this._confirmInline(removeBtn, async () => {
            await this._actRemoveBlocklistItem(Number(removeBtn.dataset.id), removeBtn.dataset.svc, modalEl);
          });
          return;
        }
        const pBtn = e.target.closest("[data-act-bl-page]");
        if (pBtn) {
          const m2 = this._activityModal;
          const all = [...m2.blData?.radarr?.records || [], ...m2.blData?.sonarr?.records || []];
          const tot = Math.max(1, Math.ceil(all.length / m2.blPerPage));
          const p = pBtn.dataset.actBlPage;
          const cur = m2.blPage;
          const np = p === "first" ? 0 : p === "prev" ? Math.max(0, cur - 1) : p === "next" ? Math.min(tot - 1, cur + 1) : p === "last" ? tot - 1 : parseInt(p) || 0;
          if (np !== cur) {
            m2.blPage = np;
            this._actSetBodyHtml(body, this._actBlocklistTabHtml(m2.blData?.radarr, m2.blData?.sonarr, np, m2.blPerPage));
            this._wireActBody(body, modalEl, "blocklist");
          }
        }
      }, { signal });
    }
  }
  async _actRemoveQueueItem(id, svc, removeFromClient, blocklist, skipRedownload, modalEl) {
    if (!this._activityModal) return;
    this._markActivated();
    try {
      const qs = `removeFromClient=${removeFromClient ? "true" : "false"}&blocklist=${blocklist ? "true" : "false"}&skipRedownload=${skipRedownload ? "true" : "false"}`;
      await this._callApi("DELETE", `arr_stack/${svc}/queue/${id}?${qs}`);
    } catch (e) {
      console.error("[arr-card] Queue remove error:", e);
    }
    await this._actLoadTab("queue", modalEl);
    await this._refreshQueueCounters();
  }
  _openQueueRemoveModal(dataset, parentModalEl) {
    const id = dataset.id;
    const svc = dataset.svc;
    const title = dataset.title || "";
    const overlay = document.createElement("div");
    overlay.className = `popup-overlay${dayClass(this)}`;
    overlay.style.cssText = "position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55)";
    const _row = (label, field, hint = "") => `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:${hint ? "4px" : "12px"}">
        <div style="width:130px;flex-shrink:0;font-size:11px;font-weight:600;color:var(--is-text-muted);text-align:right">${label}</div>
        <div style="flex:1;min-width:0">${field}</div>
      </div>
      ${hint ? `<div style="margin:0 0 12px 142px;font-size:10px;color:rgba(200,120,0,0.9)" id="qrm-method-warn">${hint}</div>` : ""}`;
    overlay.innerHTML = `
      <div style="background:var(--is-menu-bg,#1c1c2e);border:1px solid var(--is-card-bdr,rgba(255,255,255,0.09));border-radius:20px;padding:20px 22px;width:min(480px,94vw);box-shadow:0 8px 40px rgba(0,0,0,0.35);color:var(--is-text);font-family:inherit">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div style="font-size:14px;font-weight:700">Remove</div>
          ${this._mtRoundBtn('class="qrm-close"', `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`, "Close", { size: 28, tone: "blue", active: false })}
        </div>
        <p style="font-size:12px;color:var(--is-text-muted);margin:0 0 16px">Are you sure you want to remove <strong style="color:var(--is-text)">${this._escHtml(title)}</strong> from the queue?</p>
        ${_row(
      "Removal Method",
      this._mtFieldSelect("qrm-method", [["client", "Remove from Download Client"], ["queue", "Remove from Queue Only"]], "client", "width:100%"),
      "'Remove from Download Client' will remove the download and the file(s) from the download client."
    )}
        ${_row(
      "Blocklist Release",
      this._mtFieldSelect("qrm-blocklist", [["none", "Do not Blocklist"], ["search", "Blocklist and Search"], ["only", "Blocklist Only"]], "none", "width:100%")
    )}
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;padding-top:14px;border-top:1px solid var(--is-card-bdr,rgba(255,255,255,0.09))">
          <button class="qrm-close" style="${MT_BTN}">Close</button>
          <button class="qrm-remove" style="${this._mtBtnA("red")}">Remove</button>
        </div>
      </div>`;
    const methodSel = overlay.querySelector("#qrm-method");
    const warn = overlay.querySelector("#qrm-method-warn");
    methodSel.addEventListener("change", () => {
      warn.style.display = methodSel.value === "client" ? "block" : "none";
      this._tbSyncSelect(methodSel);
    });
    overlay.querySelector("#qrm-blocklist")?.addEventListener("change", (e) => this._tbSyncSelect(e.target));
    overlay.addEventListener("click", async (e) => {
      if (e.target.closest(".qrm-close") || e.target === overlay) {
        overlay.remove();
        return;
      }
      if (e.target.closest(".qrm-remove")) {
        const removeFromClient = overlay.querySelector("#qrm-method").value === "client";
        const blVal = overlay.querySelector("#qrm-blocklist").value;
        const blocklist = blVal !== "none";
        const skipRedownload = blVal === "only";
        overlay.remove();
        await this._actRemoveQueueItem(Number(id), svc, removeFromClient, blocklist, skipRedownload, parentModalEl);
      }
    });
    this.shadowRoot.appendChild(overlay);
  }
  _openHistoryColPicker(gearBtn, modalEl) {
    const existing = this.shadowRoot.querySelector("[data-hist-col-picker]");
    if (existing) {
      existing.remove();
      gearBtn.classList.remove("active");
      return;
    }
    const m = this._activityModal;
    if (!m) return;
    const isDay = this._isDay;
    const pkBg = isDay ? "rgba(245,246,255,0.99)" : "rgba(18,18,28,0.97)";
    const pkBdr = isDay ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.14)";
    const pkHdr = isDay ? "rgba(0,0,0,0.32)" : "rgba(255,255,255,0.35)";
    const pkLbl = isDay ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.82)";
    const cols = m.histCols;
    const ALL_COLS = [
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
    const rect = gearBtn.getBoundingClientRect();
    const top = Math.round(rect.bottom + 6);
    const right = Math.round(window.innerWidth - rect.right);
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div data-hist-col-picker style="position:fixed;top:${top}px;right:${right}px;z-index:1200;min-width:175px;background:${pkBg};border:1px solid ${pkBdr};border-radius:9px;padding:10px 14px 12px;box-shadow:0 8px 28px rgba(0,0,0,0.25)">
      <div style="font-size:9px;font-weight:700;color:${pkHdr};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">${this._t("actColPickerHdr")}</div>
      ${ALL_COLS.map((c) => `<label style="display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer;user-select:none"><input type="checkbox" class="hist-col-cb" data-col-id="${c.id}" ${cols.has(c.id) ? "checked" : ""} style="cursor:pointer;accent-color:rgba(99,140,255,1);width:14px;height:14px;flex-shrink:0"><span style="font-size:12px;color:${pkLbl}">${c.label}</span></label>`).join("")}
    </div>`;
    const picker = wrap.firstElementChild;
    this.shadowRoot.appendChild(picker);
    gearBtn.classList.add("active");
    picker.querySelectorAll(".hist-col-cb").forEach((cb) => {
      cb.addEventListener("change", () => {
        if (cb.checked) cols.add(cb.dataset.colId);
        else cols.delete(cb.dataset.colId);
        try {
          localStorage.setItem("arr-stack-hist-cols", JSON.stringify([...cols]));
        } catch {
        }
        const actModal = this.shadowRoot.querySelector("[data-act-modal]");
        const body = actModal?.querySelector("#act-body");
        if (body && m.histData) {
          this._actSetBodyHtml(body, this._actHistoryTabHtml(m.histData.radarr, m.histData.sonarr, m.histFilter, m.histPage, m.histPerPage));
          this._wireActBody(body, actModal, "history");
        }
      });
    });
    const closeHandler = (e) => {
      if (!picker.contains(e.target) && !gearBtn.contains(e.target)) {
        picker.remove();
        gearBtn.classList.remove("active");
        this.shadowRoot.removeEventListener("click", closeHandler, true);
      }
    };
    setTimeout(() => this.shadowRoot.addEventListener("click", closeHandler, true), 0);
  }
  _openBlColPicker(gearBtn, modalEl) {
    const existing = this.shadowRoot.querySelector("[data-bl-col-picker]");
    if (existing) {
      existing.remove();
      gearBtn.classList.remove("active");
      return;
    }
    const m = this._activityModal;
    if (!m) return;
    const isDay = this._isDay;
    const pkBg = isDay ? "rgba(245,246,255,0.99)" : "rgba(18,18,28,0.97)";
    const pkBdr = isDay ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.14)";
    const pkHdr = isDay ? "rgba(0,0,0,0.32)" : "rgba(255,255,255,0.35)";
    const pkLbl = isDay ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.82)";
    const cols = m.blCols;
    const ALL_COLS = [
      { id: "source", label: this._t("actColSource") },
      { id: "srctitle", label: this._t("actColSrcTitle") },
      { id: "langs", label: this._t("actColLangs") },
      { id: "quality", label: this._t("actColQuality") },
      { id: "formats", label: this._t("actColFormats") },
      { id: "date", label: this._t("actColDate") },
      { id: "indexer", label: this._t("actColIndexer") },
      { id: "protocol", label: this._t("actColProtocol") }
    ];
    const rect = gearBtn.getBoundingClientRect();
    const top = Math.round(rect.bottom + 6);
    const right = Math.round(window.innerWidth - rect.right);
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div data-bl-col-picker style="position:fixed;top:${top}px;right:${right}px;z-index:1200;min-width:175px;background:${pkBg};border:1px solid ${pkBdr};border-radius:9px;padding:10px 14px 12px;box-shadow:0 8px 28px rgba(0,0,0,0.25)">
      <div style="font-size:9px;font-weight:700;color:${pkHdr};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">${this._t("actColPickerHdr")}</div>
      ${ALL_COLS.map((c) => `<label style="display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer;user-select:none"><input type="checkbox" class="bl-col-cb" data-col-id="${c.id}" ${cols.has(c.id) ? "checked" : ""} style="cursor:pointer;accent-color:rgba(99,140,255,1);width:14px;height:14px;flex-shrink:0"><span style="font-size:12px;color:${pkLbl}">${c.label}</span></label>`).join("")}
    </div>`;
    const picker = wrap.firstElementChild;
    this.shadowRoot.appendChild(picker);
    gearBtn.classList.add("active");
    picker.querySelectorAll(".bl-col-cb").forEach((cb) => {
      cb.addEventListener("change", () => {
        if (cb.checked) cols.add(cb.dataset.colId);
        else cols.delete(cb.dataset.colId);
        try {
          localStorage.setItem("arr-stack-bl-cols", JSON.stringify([...cols]));
        } catch {
        }
        const actModal = this.shadowRoot.querySelector("[data-act-modal]");
        const body = actModal?.querySelector("#act-body");
        if (body && m.blData) {
          this._actSetBodyHtml(body, this._actBlocklistTabHtml(m.blData.radarr, m.blData.sonarr, m.blPage, m.blPerPage));
          this._wireActBody(body, actModal, "blocklist");
        }
      });
    });
    const closeHandler = (e) => {
      if (!picker.contains(e.target) && !gearBtn.contains(e.target)) {
        picker.remove();
        gearBtn.classList.remove("active");
        this.shadowRoot.removeEventListener("click", closeHandler, true);
      }
    };
    setTimeout(() => this.shadowRoot.addEventListener("click", closeHandler, true), 0);
  }
  // Drop the custom-format tags that don't fit the cell's two lines and replace
  // them with a "+N" chip, so a long format list never renders half-clipped.
  _actFitFmtTags(root) {
    root.querySelectorAll(".act-fmt-tags").forEach((wrap) => {
      if (wrap.querySelector(".act-fmt-more")) return;
      if (wrap.scrollHeight <= wrap.clientHeight) return;
      const tags = [...wrap.querySelectorAll(".act-fmt-tag")];
      const more = document.createElement("span");
      more.className = "act-fmt-tag act-fmt-more ui-badge";
      more.style.cssText = "--bdg:150,150,165";
      wrap.appendChild(more);
      let hidden = 0;
      while (tags.length > 1 && wrap.scrollHeight > wrap.clientHeight) {
        tags.pop().remove();
        hidden++;
        more.textContent = `+${hidden}`;
      }
      if (!hidden) more.remove();
    });
  }
  // Set body content and clip any partially-visible rows
  _actSetBodyHtml(body, html) {
    body.innerHTML = html;
    requestAnimationFrame(() => {
      this._actFitFmtTags(body);
      const clip = body.querySelector("[data-act-clip]");
      if (!clip || clip.hasAttribute("data-act-notrim")) return;
      const clipBottom = clip.getBoundingClientRect().bottom;
      clip.querySelectorAll("tbody tr").forEach((row) => {
        if (row.dataset.actSeason !== void 0) return;
        if (row.getBoundingClientRect().bottom > clipBottom + 1) row.remove();
      });
      if (!clip.querySelector("table")) {
        [...clip.children].forEach((child) => {
          if (child.getBoundingClientRect().bottom > clipBottom + 1) child.remove();
        });
      }
    });
  }
  async _actRemoveBlocklistItem(id, svc, modalEl) {
    const m = this._activityModal;
    if (!m) return;
    try {
      await this._callApi("DELETE", "arr_stack/" + svc + "/activity/blocklist/" + id);
    } catch (e) {
      if (e?.error !== "Unable to parse JSON response") {
        console.error("[arr-card] Blocklist remove error:", e);
      }
    }
    await this._actLoadTab("blocklist", modalEl);
  }
  async _openManualImportModal(btn, modalEl) {
    const svc = btn.dataset.svc;
    const downloadId = btn.dataset.downloadId;
    const movieId = btn.dataset.movieId;
    const seriesId = btn.dataset.seriesId;
    const episodeId = btn.dataset.episodeId || "";
    const outputPath = btn.dataset.outputPath || "";
    const title = btn.dataset.title || "\u2014";
    this.shadowRoot.querySelector("[data-mi-modal]")?.remove();
    const wrap = document.createElement("div");
    wrap.innerHTML = this._actManualImportModalHtml(title);
    const overlay = wrap.firstElementChild;
    this.shadowRoot.appendChild(overlay);
    overlay.querySelector("#mi-close")?.addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });
    const miBody = overlay.querySelector("#mi-body");
    try {
      const ids = (movieId ? `&movieId=${encodeURIComponent(movieId)}` : "") + (seriesId ? `&seriesId=${encodeURIComponent(seriesId)}` : "");
      const dl = `downloadId=${encodeURIComponent(downloadId)}`;
      const folder = outputPath ? `folder=${encodeURIComponent(outputPath)}` : "";
      const attempts = [dl + ids, dl, ...folder ? [folder + ids, folder] : []];
      const _fetchCandidates = async () => {
        let lastErr;
        for (const qs of attempts) {
          try {
            return await this._callApi("GET", `arr_stack/${svc}/manualimport?${qs}`);
          } catch (err) {
            lastErr = err;
            console.warn("[arr-card] manual import attempt failed:", qs, err?.body?.message || err);
          }
        }
        throw lastErr;
      };
      const [allCandidates, qDefs, langs] = await Promise.all([
        _fetchCandidates(),
        this._callApi("GET", `arr_stack/${svc}/qualitydefs`).catch(() => []),
        this._callApi("GET", `arr_stack/${svc}/languages`).catch(() => [])
      ]);
      let candidates = allCandidates || [];
      if (episodeId) {
        candidates = candidates.filter(
          (c) => c.episodes?.some((ep) => String(ep.id) === episodeId)
        );
      }
      this._miRenderAndWire(candidates, svc, qDefs, langs, miBody, overlay, modalEl);
    } catch (err) {
      console.error("[arr-card] Manual import fetch error:", err);
      const detail = err?.body?.message || err?.body?.error || err?.message || "";
      miBody.innerHTML = `<div style="text-align:center;color:rgba(255,100,100,0.85);padding:28px 20px;font-size:12px;line-height:1.5">
        <div style="font-weight:700;margin-bottom:6px">Failed to fetch candidates</div>
        ${detail ? `<div style="opacity:0.8">${this._escHtml(String(detail))}</div>` : ""}
      </div>`;
    }
  }
  // Render candidates with select dropdowns and wire change + import buttons
  _miRenderAndWire(candidates, svc, qDefs, langs, miBody, overlay, modalEl) {
    const lib = svc === "radarr" ? this._radarr || [] : svc === "radarr2" ? this._radarr2 || [] : svc === "sonarr" ? this._sonarr || [] : svc === "sonarr2" ? this._sonarr2 || [] : [];
    miBody.innerHTML = this._actManualImportCandidatesHtml(candidates, svc, qDefs, langs);
    miBody.addEventListener("change", (e) => {
      const sel = e.target.closest("select.mi-field-sel");
      if (!sel) return;
      const field = sel.dataset.field;
      const idx = parseInt(sel.dataset.idx);
      const c = candidates[idx];
      if (!c) return;
      const valStr = sel.value;
      const valNum = parseInt(valStr);
      if (field === "movie") {
        const m = lib.find((x) => x.id === valNum);
        candidates[idx].movie = m || { id: valNum };
        candidates[idx].movieId = valNum;
      } else if (field === "series") {
        const m = lib.find((x) => x.id === valNum);
        candidates[idx].series = m || { id: valNum };
        candidates[idx].seriesId = valNum;
      } else if (field === "quality") {
        const def = (qDefs || []).find((d) => (d.quality?.id ?? d.id) === valNum);
        candidates[idx].quality = {
          quality: { id: valNum, name: def?.quality?.name || def?.title || "" },
          revision: candidates[idx].quality?.revision || { version: 1, real: 0 }
        };
      } else if (field === "language") {
        const lang = (langs || []).find((l) => l.id === valNum);
        candidates[idx].languages = [{ id: valNum, name: lang?.name || "" }];
      }
      this._miRenderAndWire(candidates, svc, qDefs, langs, miBody, overlay, modalEl);
    });
    miBody.addEventListener("click", async (e) => {
      const btn = e.target.closest("#mi-import-all");
      if (!btn || !btn.dataset.ready) return;
      btn.dataset.ready = "";
      btn.style.opacity = "0.5";
      btn.style.cursor = "not-allowed";
      btn.textContent = this._t("actImporting");
      try {
        await this._submitManualImport(candidates, candidates.map((_, i) => i), svc, overlay, modalEl);
      } catch (err) {
        console.error("[arr-card] manual import submit:", err);
      }
    });
  }
  _openQueueColPicker(gearBtn, modalEl) {
    const existing = this.shadowRoot.querySelector("[data-col-picker]");
    if (existing) {
      existing.remove();
      gearBtn.classList.remove("active");
      return;
    }
    const m = this._activityModal;
    if (!m) return;
    const isDay = this._isDay;
    const pkBg = isDay ? "rgba(245,246,255,0.99)" : "rgba(18,18,28,0.97)";
    const pkBdr = isDay ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.14)";
    const pkHdr = isDay ? "rgba(0,0,0,0.32)" : "rgba(255,255,255,0.35)";
    const pkLbl = isDay ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.82)";
    const cols = m.queueCols;
    const ALL_COLS = [
      { id: "source", label: this._t("actColSource") },
      { id: "quality", label: this._t("actColQuality") },
      { id: "size", label: this._t("actColSize") },
      { id: "timeleft", label: this._t("actColTimeLeft") },
      { id: "formats", label: this._t("actColFormats") },
      { id: "protocol", label: this._t("actColProtocol") },
      { id: "indexer", label: this._t("actColIndexer") },
      { id: "client", label: this._t("actColDlClient") },
      { id: "status", label: this._t("actColStatus") }
    ];
    const rect = gearBtn.getBoundingClientRect();
    const top = Math.round(rect.bottom + 6);
    const right = Math.round(window.innerWidth - rect.right);
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div data-col-picker style="position:fixed;top:${top}px;right:${right}px;z-index:1200;min-width:175px;background:${pkBg};border:1px solid ${pkBdr};border-radius:9px;padding:10px 14px 12px;box-shadow:0 8px 28px rgba(0,0,0,0.25)">
      <div style="font-size:9px;font-weight:700;color:${pkHdr};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">${this._t("actColPickerHdr")}</div>
      ${ALL_COLS.map((c) => `
        <label style="display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer;user-select:none">
          <input type="checkbox" class="col-picker-cb" data-col-id="${c.id}" ${cols.has(c.id) ? "checked" : ""} style="cursor:pointer;accent-color:rgba(99,140,255,1);width:14px;height:14px;flex-shrink:0">
          <span style="font-size:12px;color:${pkLbl}">${c.label}</span>
        </label>`).join("")}
    </div>`;
    const picker = wrap.firstElementChild;
    this.shadowRoot.appendChild(picker);
    gearBtn.classList.add("active");
    picker.querySelectorAll(".col-picker-cb").forEach((cb) => {
      cb.addEventListener("change", () => {
        if (cb.checked) cols.add(cb.dataset.colId);
        else cols.delete(cb.dataset.colId);
        try {
          localStorage.setItem("arr-stack-queue-cols", JSON.stringify([...cols]));
        } catch {
        }
        const actModal = this.shadowRoot.querySelector("[data-act-modal]");
        const body = actModal?.querySelector("#act-body");
        if (body && m.queueData) {
          this._actSetBodyHtml(body, this._actQueueTabHtml(m.queueData.radarr, m.queueData.sonarr, m.queuePage, m.queuePerPage, cols));
          this._wireActBody(body, actModal, "queue");
        }
      });
    });
    const closeHandler = (e) => {
      if (!picker.contains(e.target) && !gearBtn.contains(e.target)) {
        picker.remove();
        gearBtn.classList.remove("active");
        this.shadowRoot.removeEventListener("click", closeHandler, true);
      }
    };
    setTimeout(() => this.shadowRoot.addEventListener("click", closeHandler, true), 0);
  }
  _openMissingColPicker(gearBtn, modalEl) {
    const existing = this.shadowRoot.querySelector("[data-missing-col-picker]");
    if (existing) {
      existing.remove();
      gearBtn.classList.remove("active");
      return;
    }
    const m = this._activityModal;
    if (!m) return;
    const isDay = this._isDay;
    const pkBg = isDay ? "rgba(245,246,255,0.99)" : "rgba(18,18,28,0.97)";
    const pkBdr = isDay ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.14)";
    const pkHdr = isDay ? "rgba(0,0,0,0.32)" : "rgba(255,255,255,0.35)";
    const pkLbl = isDay ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.82)";
    const cols = m.missingCols;
    const ALL_COLS = [
      { id: "monitored", label: this._t("actColMonitored") },
      { id: "source", label: this._t("actColSource") },
      { id: "year", label: this._t("actColYear") },
      { id: "profile", label: this._t("actColProfile") },
      { id: "added", label: this._t("actColAdded") },
      { id: "missing", label: this._t("actColMissingEps") }
    ];
    const rect = gearBtn.getBoundingClientRect();
    const top = Math.round(rect.bottom + 6);
    const right = Math.round(window.innerWidth - rect.right);
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div data-missing-col-picker style="position:fixed;top:${top}px;right:${right}px;z-index:1200;min-width:175px;background:${pkBg};border:1px solid ${pkBdr};border-radius:9px;padding:10px 14px 12px;box-shadow:0 8px 28px rgba(0,0,0,0.25)">
      <div style="font-size:9px;font-weight:700;color:${pkHdr};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">${this._t("actColPickerHdr")}</div>
      ${ALL_COLS.map((c) => `<label style="display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer;user-select:none"><input type="checkbox" class="missing-col-cb" data-col-id="${c.id}" ${cols.has(c.id) ? "checked" : ""} style="cursor:pointer;accent-color:rgba(99,140,255,1);width:14px;height:14px;flex-shrink:0"><span style="font-size:12px;color:${pkLbl}">${c.label}</span></label>`).join("")}
    </div>`;
    const picker = wrap.firstElementChild;
    this.shadowRoot.appendChild(picker);
    gearBtn.classList.add("active");
    picker.querySelectorAll(".missing-col-cb").forEach((cb) => {
      cb.addEventListener("change", () => {
        if (cb.checked) cols.add(cb.dataset.colId);
        else cols.delete(cb.dataset.colId);
        try {
          localStorage.setItem("arr-stack-missing-cols", JSON.stringify([...cols]));
        } catch {
        }
        const actModal = this.shadowRoot.querySelector("[data-act-modal]");
        const body = actModal?.querySelector("#act-body");
        const c = this._actMissingCache;
        if (body && c) {
          this._actRenderMissing(body, actModal);
        }
      });
    });
    const closeHandler = (e) => {
      if (!picker.contains(e.target) && !gearBtn.contains(e.target)) {
        picker.remove();
        gearBtn.classList.remove("active");
        this.shadowRoot.removeEventListener("click", closeHandler, true);
      }
    };
    setTimeout(() => this.shadowRoot.addEventListener("click", closeHandler, true), 0);
  }
  async _openSeasonIsOverlay(seriesId, svc, seasonNumber, seriesTitle) {
    this.shadowRoot.querySelector("[data-season-is-modal]")?.remove();
    const seasonLbl = `S${String(seasonNumber).padStart(2, "0")}`;
    const isSvgSm = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
    const asSvgSm = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div class="popup-overlay${dayClass(this)}" data-season-is-modal style="z-index:1100">
      <div class="popup-glass" style="width:min(900px,94vw);max-height:88vh;display:flex;flex-direction:column">
        <div class="is-panel-hdr" style="padding:14px 20px 12px;gap:10px">
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:700;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._escHtml(seriesTitle)} \u2014 ${seasonLbl}</div>
          </div>
          <button class="popup-close u-rel-shrink0" id="sis-close">${ICONS.close}</button>
        </div>
        <div id="sis-body" class="popup-body" style="overflow-y:auto;flex:1;padding:0 20px 18px">
          <div class="is-loading"><span>${this._t("loading")}</span></div>
        </div>
      </div>
    </div>`;
    const el = wrap.firstElementChild;
    this.shadowRoot.appendChild(el);
    el.querySelector("#sis-close")?.addEventListener("click", () => el.remove());
    el.addEventListener("click", (e) => {
      if (e.target === el) el.remove();
    });
    const body = el.querySelector("#sis-body");
    try {
      const episodes = await this._callApi("GET", `arr_stack/${svc}/episodes?seriesId=${seriesId}&seasonNumber=${seasonNumber}`);
      const epList = (Array.isArray(episodes) ? episodes : []).sort((a, b) => a.episodeNumber - b.episodeNumber);
      if (!epList.length) {
        body.innerHTML = `<div style="text-align:center;color:var(--is-text-muted);padding:32px 20px">${this._t("actNoFiles")}</div>`;
        return;
      }
      const fmtDate = (d) => {
        if (!d) return "";
        try {
          return new Date(d).toLocaleDateString(this._locale, { month: "short", day: "numeric", year: "numeric" });
        } catch {
          return d;
        }
      };
      const rowsHtml = epList.map((ep) => {
        const epCode = `S${String(ep.seasonNumber).padStart(2, "0")}E${String(ep.episodeNumber).padStart(2, "0")}`;
        const epDate = fmtDate(ep.airDate);
        return `<div data-sis-ep="${ep.id}" style="padding:8px 0;border-bottom:1px solid var(--is-divider)">
          <div class="u-row-8">
            <span style="font-size:11px;font-weight:700;color:${ep.hasFile ? "var(--is-green)" : "var(--is-text-muted)"};min-width:55px;flex-shrink:0">${epCode}</span>
            <span style="flex:1;min-width:0;font-size:12px;font-weight:500;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._escHtml(ep.title || "\u2014")}</span>
            ${epDate ? `<span style="font-size:10px;color:var(--is-text-muted);flex-shrink:0">${epDate}</span>` : ""}
            <div style="display:flex;gap:4px;flex-shrink:0">
              <button class="sis-ep-is-btn" data-ep-id="${ep.id}" data-svc="${svc}" title="IS" style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:none;background:rgba(99,140,255,0.12);border-radius:5px;cursor:pointer;color:rgba(99,140,255,0.75)">${isSvgSm}</button>
              <button class="sis-ep-as-btn" data-ep-id="${ep.id}" data-svc="${svc}" title="AS" style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:none;background:rgba(99,140,255,0.15);border-radius:5px;cursor:pointer;color:rgba(99,140,255,0.9)">${asSvgSm}</button>
            </div>
          </div>
          <div class="sis-ep-releases" data-ep-id="${ep.id}" style="display:none;margin-top:6px;padding:8px;background:rgba(99,140,255,0.06);border-radius:6px"></div>
        </div>`;
      }).join("");
      body.innerHTML = rowsHtml;
      body.addEventListener("click", async (e) => {
        const isBtn = e.target.closest(".sis-ep-is-btn");
        if (isBtn) {
          const epId = isBtn.dataset.epId;
          const epSvc = isBtn.dataset.svc;
          const panel = body.querySelector(`.sis-ep-releases[data-ep-id="${epId}"]`);
          if (!panel) return;
          const isOpen = panel.style.display !== "none";
          body.querySelectorAll(".sis-ep-releases").forEach((p) => {
            p.style.display = "none";
            p.innerHTML = "";
          });
          if (isOpen) return;
          panel.style.display = "block";
          panel.innerHTML = `<div class="is-loading"><span>${this._t("loading")}</span></div>`;
          try {
            const releases = await this._callApi("GET", `arr_stack/${epSvc}/release?episodeId=${epId}`);
            this._renderSisEpReleases(panel, epSvc, releases || []);
          } catch {
            panel.innerHTML = `<div style="text-align:center;color:rgba(255,100,100,0.8);padding:12px;font-size:11px">${this._t("actNoFiles")}</div>`;
          }
          return;
        }
        const asBtn = e.target.closest(".sis-ep-as-btn");
        if (asBtn) {
          const epId = Number(asBtn.dataset.epId);
          const epSvc = asBtn.dataset.svc;
          const origHtml = asBtn.innerHTML;
          asBtn.disabled = true;
          asBtn.textContent = "\u2026";
          try {
            await this._callApi("POST", `arr_stack/${epSvc}/command`, { name: "EpisodeSearch", episodeIds: [epId] });
            asBtn.textContent = "\u2713";
            asBtn.style.color = "rgba(80,200,100,0.9)";
          } catch {
            asBtn.innerHTML = origHtml;
          } finally {
            asBtn.disabled = false;
          }
          return;
        }
        const grabBtn = e.target.closest(".sis-grab-btn");
        if (grabBtn) {
          const idx = Number(grabBtn.dataset.idx);
          const epSvc = grabBtn.dataset.svc;
          const panel = grabBtn.closest(".sis-ep-releases");
          if (!panel || !panel._releases || !panel._releases[idx]) return;
          grabBtn.disabled = true;
          grabBtn.textContent = "\u2026";
          try {
            await this._callApi("POST", `arr_stack/${epSvc}/release`, panel._releases[idx]);
            grabBtn.textContent = "\u2713";
            grabBtn.style.color = "rgba(80,200,100,0.9)";
            grabBtn.style.background = "rgba(80,200,100,0.15)";
          } catch {
            grabBtn.textContent = "!";
            grabBtn.style.color = "rgba(255,100,100,0.9)";
          }
        }
      });
    } catch (err) {
      console.error("[arr-card] Season IS error:", err);
      body.innerHTML = `<div style="text-align:center;color:rgba(255,100,100,0.8);padding:32px 20px">Failed to load episodes</div>`;
    }
  }
  _renderSisEpReleases(panel, svc, releases) {
    if (!releases.length) {
      panel.innerHTML = `<div style="text-align:center;color:var(--is-text-muted);font-size:11px;padding:8px">${this._t("actNoFiles")}</div>`;
      return;
    }
    panel._releases = releases;
    const rows = releases.slice(0, 30).map((rel, i) => {
      const title = rel.title || rel.releaseTitle || "\u2014";
      const quality = rel.quality?.quality?.name || "\u2014";
      const size = rel.size ? this._actFmtSize(rel.size) : "\u2014";
      const seeders = rel.seeders != null ? rel.seeders : null;
      const seederHtml = seeders != null ? `<span style="font-size:9px;color:rgba(80,200,100,0.8)">${seeders}S</span>` : "";
      const sep = i > 0 ? "border-top:1px solid var(--is-divider);" : "";
      return `<div style="${sep}display:flex;align-items:center;gap:6px;padding:5px 0">
        <div style="flex:1;min-width:0">
          <div style="font-size:10px;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._escHtml(title)}</div>
          <div style="display:flex;gap:5px;margin-top:2px">
            <span class="u-xxs-muted">${quality}</span>
            <span class="u-xxs-muted">${size}</span>
            ${seederHtml}
          </div>
        </div>
        <button class="sis-grab-btn" data-idx="${i}" data-svc="${svc}" style="flex-shrink:0;height:22px;padding:0 8px;font-size:10px;font-weight:700;border:none;background:rgba(99,140,255,0.15);border-radius:5px;cursor:pointer;color:rgba(99,140,255,0.9)">Grab</button>
      </div>`;
    }).join("");
    panel.innerHTML = rows;
  }
  // The import closes its dialog and then works in the background, so without
  // this nothing said whether it had started or finished. On desktop the pill
  // sits in the modal header next to the tabs; a phone header has no room for
  // it, so there it floats over the bottom of the screen instead.
  _actShowStatus(msg, opts = {}, duration = 4e3) {
    const host = this.shadowRoot;
    if (!host) return;
    host.querySelector("[data-act-status]")?.remove();
    clearTimeout(this._actStatusTimer);
    if (!msg) return;
    const rgb = opts.err ? "248,113,113" : opts.spin ? "96,165,250" : "52,211,153";
    const slot = this._isMob ? null : host.querySelector("#act-status-slot");
    const pos = slot ? "" : `position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:1300;box-shadow:0 4px 18px rgba(0,0,0,0.5);`;
    const el = document.createElement("div");
    el.innerHTML = `<div data-act-status style="${pos}display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:rgba(${rgb},0.95);background:${this._isDay ? "#fafafc" : "#14141a"};border:1px solid rgba(${rgb},0.45);border-radius:999px;padding:6px 16px;white-space:nowrap">
      ${opts.spin ? '<span class="is-spin"></span>' : ""}${this._escHtml(msg)}
    </div>`;
    (slot || host).appendChild(el.firstElementChild);
    if (!duration) return;
    this._actStatusTimer = setTimeout(() => {
      this.shadowRoot?.querySelector("[data-act-status]")?.remove();
    }, duration);
  }
  // Pulls the queue state the Activity card renders from and repaints it, so an
  // action taken in the modal shows on the dashboard without waiting for a poll.
  async _refreshQueueCounters() {
    await Promise.all([
      this._fetchRadarrQueue(),
      this._fetchRadarr2Queue(),
      this._fetchSonarrQueue("sonarr"),
      this._fetchSonarrQueue("sonarr2")
    ]).catch(() => {
    });
    this._reRenderSection("activity");
  }
  async _submitManualImport(candidates, indices, svc, overlayEl, modalEl) {
    this._markActivated();
    const isRadarr = svc === "radarr" || svc === "radarr2";
    const isSonarr = svc === "sonarr" || svc === "sonarr2";
    const toImport = indices.map((i) => candidates[i]).filter((c) => {
      if (!c) return false;
      if (isRadarr && !c.movie) return false;
      if (isSonarr && !c.series) return false;
      return true;
    }).map((c) => ({
      // Send only the fields Radarr expects for ManualImportResource.
      // Sending the full GET response can trigger unwanted reprocessing paths.
      id: c.id,
      path: c.path,
      movieId: isRadarr ? c.movie?.id || c.movieId : void 0,
      seriesId: isSonarr ? c.series?.id || c.seriesId : void 0,
      episodeIds: c.episodeIds || (c.episodes ? c.episodes.map((ep) => ep.id) : []),
      seasonNumber: c.seasonNumber,
      quality: c.quality,
      languages: c.languages,
      releaseGroup: c.releaseGroup || "",
      downloadId: c.downloadId || "",
      indexerFlags: c.indexerFlags || 0,
      importMode: "auto",
      disableReleaseSwitching: false
    }));
    if (!toImport.length) return;
    try {
      await this._callApi("POST", `arr_stack/${svc}/command`, {
        name: "ManualImport",
        importMode: "Auto",
        files: toImport.map((c) => ({
          path: c.path,
          movieId: c.movieId,
          seriesId: c.seriesId,
          episodeIds: c.episodeIds,
          seasonNumber: c.seasonNumber,
          quality: c.quality,
          languages: c.languages,
          releaseGroup: c.releaseGroup || "",
          downloadId: c.downloadId || "",
          indexerFlags: c.indexerFlags || 0,
          disableReleaseSwitching: false
        }))
      });
      const importedIds = new Set(toImport.map((c) => c.downloadId).filter(Boolean));
      importedIds.forEach((id) => this._actImporting.add(id));
      overlayEl.remove();
      this._actShowStatus(this._t("actImporting"), { spin: true }, 0);
      let gone = false;
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((r) => setTimeout(r, attempt === 0 ? 2e3 : 3e3));
        if (!this._activityModal) break;
        await this._actLoadTab("queue", modalEl);
        if (!this._activityModal) break;
        const qd = this._activityModal.queueData;
        const allItems = [...qd?.radarr || [], ...qd?.sonarr || []];
        if (!allItems.some((item) => importedIds.has(item.downloadId))) {
          gone = true;
          break;
        }
      }
      importedIds.forEach((id) => this._actImporting.delete(id));
      if (this._activityModal) await this._actLoadTab("queue", modalEl);
      await this._refreshQueueCounters();
      this._actShowStatus(gone ? this._t("actImported") : this._t("actImportQueued"));
    } catch (err) {
      console.error("[arr-card] Manual import submit error:", err);
      this._actImporting.clear();
      this._actShowStatus(this._t("actImportFailed"), { err: true }, 6e3);
      const miBody = overlayEl.querySelector("#mi-body");
      if (miBody) {
        const msg = err?.body?.message || err?.body?.description?.split("\n")[0] || String(err?.error || err);
        const isParseErr = msg.toLowerCase().includes("parse") || msg.toLowerCase().includes("augment");
        const hint = isParseErr ? "Radarr cannot parse the filename (likely special characters). Rename the file or import directly in Radarr." : "";
        miBody.innerHTML = `<div style="padding:20px 0;color:rgba(255,120,80,0.9)">
          <div style="font-size:13px;font-weight:600;margin-bottom:6px">Import failed</div>
          <div style="font-size:11px;opacity:0.8">${this._escHtml(msg)}</div>
          ${hint ? `<div style="font-size:11px;color:rgba(255,200,100,0.85);margin-top:8px">${hint}</div>` : ""}
        </div>`;
      }
    }
  }
};
var wireActivityMixin = _WireActivityMethods.prototype;


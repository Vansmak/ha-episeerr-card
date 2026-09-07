
var _WireMethods = class {
  async _qbitAction(hash, action, deleteFiles = false) {
    this._markActivated();
    const isGlobal = action === "pauseAll" || action === "resumeAll";
    if (isGlobal) {
      this._qbitBusy = true;
    } else {
      this._qbitItemBusy = hash;
    }
    this._reRenderLeft();
    try {
      await this._hass.callApi("POST", "arr_stack/qbit/action", { action, hash, deleteFiles });
    } catch (e) {
      console.error("[arr-card] qBit action error:", e);
    } finally {
      this._confirmRemove = null;
      await new Promise((r) => setTimeout(r, 2e3));
      await this._fetchQbit();
      this._qbitBusy = false;
      this._qbitItemBusy = null;
      this._reRenderLeft();
    }
  }
  // ─────────────────────────────────────────────
  // Deluge action API
  // ─────────────────────────────────────────────
  async _delugeAction(hash, action, deleteFiles = false) {
    this._markActivated();
    const isGlobal = action === "pauseAll" || action === "resumeAll";
    if (isGlobal) {
      this._delugeBusy = true;
    } else {
      this._delugeItemBusy = hash;
    }
    this._reRenderLeft();
    try {
      await this._hass.callApi("POST", "arr_stack/deluge/action", { action, hash, deleteFiles });
    } catch (e) {
      console.error("[arr-card] Deluge action error:", e);
    } finally {
      this._delugeConfirm = null;
      await new Promise((r) => setTimeout(r, 2e3));
      await this._fetchDeluge();
      this._delugeBusy = false;
      this._delugeItemBusy = null;
      this._reRenderLeft();
    }
  }
  async _rtorrentAction(hash, action, deleteFiles = false) {
    this._markActivated();
    const isGlobal = action === "pauseAll" || action === "resumeAll";
    if (isGlobal) {
      this._rtorrentBusy = true;
    } else {
      this._rtorrentItemBusy = hash;
    }
    this._reRenderLeft();
    try {
      const mode = isGlobal ? action === "pauseAll" ? "global_pause" : "global_resume" : deleteFiles ? "delete_files" : action === "delete" ? "delete" : action;
      await this._hass.callApi("POST", "arr_stack/rtorrent/action", { action: mode, id: hash });
    } catch (e) {
      console.error("[arr-card] rTorrent action error:", e);
    } finally {
      this._rtorrentConfirm = null;
      await new Promise((r) => setTimeout(r, 2e3));
      await this._fetchRtorrent();
      this._rtorrentBusy = false;
      this._rtorrentItemBusy = null;
      this._reRenderLeft();
    }
  }
  // ─────────────────────────────────────────────
  // SABnzbd action API
  // ─────────────────────────────────────────────
  async _sabAction(mode) {
    this._markActivated();
    this._sabBusy = true;
    this._reRenderLeft();
    try {
      await this._hass.callApi("POST", "arr_stack/sabnzbd/action", { mode });
    } catch (e) {
      console.error("[arr-card] SAB action error:", e);
    } finally {
      await this._fetchSab();
      this._sabBusy = false;
      this._reRenderLeft();
    }
  }
  // ─────────────────────────────────────────────
  // Re-render only the left column (downloads)
  // ─────────────────────────────────────────────
  _reRenderLeft() {
    const left = this.shadowRoot.getElementById("col-left");
    if (!left) return;
    this._blurActive();
    this._lastLeftHtml = null;
    left.innerHTML = this._mobMinWrap("left", this._renderLeft());
    this._wireSort();
    this._wireActionButtons();
    this._wirePageButtons(left);
    this._wireMinimize();
  }
  // ─────────────────────────────────────────────
  // Wire up action buttons (global + per-torrent)
  // ─────────────────────────────────────────────
  _wireActionButtons() {
    const dlCol = this.shadowRoot.getElementById("col-left");
    if (dlCol && !dlCol._dlOpenWired) {
      dlCol._dlOpenWired = true;
      dlCol.addEventListener("click", (e) => {
        if (e.target.closest("button, .tb, a, input, select")) return;
        const row = e.target.closest("[data-dl-open]");
        if (!row) return;
        this._markActivated();
        const hit = this._mediaForDownloadId(row.dataset.dlOpen);
        if (!hit) {
          this._dlInfoName = row.querySelector(".dl-name")?.textContent?.trim() || "";
          this._dlInfoOpen = true;
          this._renderDlInfoEl();
          return;
        }
        this._openPopup(hit.type, hit.tmdbId, hit.tvdbId, hit.title, hit.radarrId, hit.radarr2Id);
      });
    }
    const qbitToggle = this.shadowRoot.querySelector(".qbit-global-toggle");
    if (qbitToggle) {
      qbitToggle.addEventListener("click", () => {
        const paused = qbitToggle.classList.contains("paused");
        this._qbitAction(null, paused ? "resumeAll" : "pauseAll");
      });
    }
    const sabToggle = this.shadowRoot.querySelector(".sab-global-toggle");
    if (sabToggle) {
      sabToggle.addEventListener("click", () => {
        const paused = sabToggle.classList.contains("paused");
        this._sabAction(paused ? "resume" : "pause");
      });
    }
    this.shadowRoot.querySelectorAll(".tb-retry").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const nzoId = btn.dataset.nzoid;
        if (nzoId) this._sabRetry(nzoId);
      });
    });
    this.shadowRoot.querySelectorAll(".tb-hist-del").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const nzoId = btn.dataset.nzoid;
        if (nzoId) this._sabHistoryDelete(nzoId);
      });
    });
    this.shadowRoot.querySelectorAll("[data-sab-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.sabAction;
        const nzoId = btn.dataset.nzoid;
        if (!nzoId) return;
        if (action === "confirm") {
          this._sabQueueConfirm = nzoId;
          this._reRenderLeft();
        } else if (action === "cancel") {
          this._sabQueueConfirm = null;
          this._reRenderLeft();
        } else if (action === "delete") {
          this._sabQueueConfirm = null;
          this._sabQueueDelete(nzoId);
        }
      });
    });
    const nzbgetToggle = this.shadowRoot.querySelector(".nzbget-global-toggle");
    if (nzbgetToggle) {
      nzbgetToggle.addEventListener("click", () => {
        const paused = nzbgetToggle.classList.contains("paused");
        this._nzbgetAction(paused ? "resume" : "pause");
      });
    }
    this.shadowRoot.querySelectorAll("[data-nzbget-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.nzbgetAction;
        const nzbId = parseInt(btn.dataset.nzbid, 10);
        if (!nzbId) return;
        if (action === "confirm") {
          this._nzbgetConfirm = nzbId;
          this._reRenderLeft();
        } else if (action === "cancel") {
          this._nzbgetConfirm = null;
          this._reRenderLeft();
        } else if (action === "item-delete") {
          this._nzbgetConfirm = null;
          this._nzbgetItemDelete(nzbId);
        } else if (action === "retry") {
          this._nzbgetRetry(nzbId);
        }
      });
    });
    const delugeToggle = this.shadowRoot.querySelector(".deluge-global-toggle");
    if (delugeToggle) {
      delugeToggle.addEventListener("click", () => {
        const paused = delugeToggle.classList.contains("paused");
        this._delugeAction(null, paused ? "resumeAll" : "pauseAll");
      });
    }
    this.shadowRoot.querySelectorAll("[data-dlg-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.dlgAction;
        const hash = btn.dataset.dlgHash || "";
        if (action === "pause") {
          this._delugeAction(hash, "pause");
        } else if (action === "resume") {
          this._delugeAction(hash, "resume");
        } else if (action === "remove-confirm") {
          this._delugeConfirm = hash;
          this._reRenderLeft();
        } else if (action === "cancel-remove") {
          this._delugeConfirm = null;
          this._reRenderLeft();
        } else if (action === "remove-keep") {
          this._delugeAction(hash, "delete", false);
        } else if (action === "remove-del") {
          this._delugeAction(hash, "delete", true);
        }
      });
    });
    const rtorrentToggle = this.shadowRoot.querySelector(".rtorrent-global-toggle");
    if (rtorrentToggle) {
      rtorrentToggle.addEventListener("click", () => {
        const paused = rtorrentToggle.classList.contains("paused");
        this._rtorrentAction(null, paused ? "resumeAll" : "pauseAll");
      });
    }
    this.shadowRoot.querySelectorAll("[data-rt-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.rtAction;
        const hash = btn.dataset.rtHash || "";
        if (action === "pause") {
          this._rtorrentAction(hash, "pause");
        } else if (action === "resume") {
          this._rtorrentAction(hash, "resume");
        } else if (action === "remove-confirm") {
          this._rtorrentConfirm = hash;
          this._reRenderLeft();
        } else if (action === "cancel-remove") {
          this._rtorrentConfirm = null;
          this._reRenderLeft();
        } else if (action === "remove-keep") {
          this._rtorrentAction(hash, "delete", false);
        } else if (action === "remove-del") {
          this._rtorrentAction(hash, "delete", true);
        }
      });
    });
    this.shadowRoot.querySelectorAll("[data-tb-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.tbAction;
        const hash = btn.dataset.hash || "";
        if (action === "pause") {
          this._qbitAction(hash, "pause");
        } else if (action === "resume") {
          this._qbitAction(hash, "resume");
        } else if (action === "remove-confirm") {
          this._confirmRemove = hash;
          this._reRenderLeft();
        } else if (action === "cancel-remove") {
          this._confirmRemove = null;
          this._reRenderLeft();
        } else if (action === "remove-keep") {
          this._qbitAction(hash, "delete", false);
        } else if (action === "remove-del") {
          this._qbitAction(hash, "delete", true);
        }
      });
    });
  }
  // ─────────────────────────────────────────────
  // Wire up sort buttons (only re-renders torrent list)
  // ─────────────────────────────────────────────
  _wireSort() {
    const btns = this.shadowRoot.querySelectorAll(".sort-btns .sb");
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.dataset.sort || "progress_desc";
        if (btn.dataset.client === "deluge") {
          this._sortDeluge = val;
          this._pages.deluge = 0;
        } else if (btn.dataset.client === "rtorrent") {
          this._sortRtorrent = val;
          this._pages.rtorrent = 0;
        } else {
          this._sort = val;
          this._pages.qbit = 0;
        }
        this._render();
      });
    });
  }
  // ─────────────────────────────────────────────
  // Wire up Overseerr add buttons
  // ─────────────────────────────────────────────
  _wireOverseerrButtons() {
    if (this._traktAnimateNext) {
      this._traktAnimateNext = false;
      requestAnimationFrame(() => {
        const sec = this.shadowRoot.querySelector("[data-trakt-sec]");
        if (!sec) return;
        sec.classList.remove("trakt-animate");
        void sec.offsetWidth;
        sec.classList.add("trakt-animate");
      });
    }
    this.shadowRoot.querySelectorAll(".overseerr-add").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mediaId = parseInt(btn.dataset.mediaid, 10);
        if (mediaId) {
          btn.disabled = true;
          btn.textContent = "\u2026";
          this._addOverseerrRequest(mediaId);
        }
      });
    });
    this.shadowRoot.querySelectorAll(".req-open").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const movieId = parseInt(btn.dataset.movieid, 10);
        const tmdbId = parseInt(btn.dataset.tmdb, 10);
        if (!movieId) return;
        btn.disabled = true;
        btn.textContent = "\u2026";
        const oneClick = (this._cfgGet("discover", "oneClickRequest", false) || this._cfgGet("discover", "oneClickMovieRequest", false)) && !(this._cfgGet("discover", "oneClickNonAdminOnly", false) && this._hass.user.is_admin);
        if (oneClick) {
          const profileName = this._cfgGet("discover", "oneClickDefaultMovieProfile", "");
          let profileId = null;
          if (profileName) {
            await this._fetchRadarrProfiles();
            const match = this._radarrProfiles.find((p) => p.name === profileName);
            profileId = match ? match.id : null;
          }
          const cfgMovieTag = this._cfgGet("discover", "oneClickDefaultMovieTag", "") || "";
          let movieTagId = null;
          if (cfgMovieTag && this._radarrTags.length > 0) {
            const tm = this._radarrTags.find((t) => t.label === cfgMovieTag);
            if (tm) movieTagId = tm.id;
          }
          const cfgMovieRootFolder = this._cfgGet("discover", "oneClickDefaultMovieRootFolder", "") || null;
          if (this._overseerrConfigured === false) {
            await this._addDirectMovieRequest(tmdbId, profileId, movieTagId, cfgMovieRootFolder, "radarr");
          } else {
            await this._addOverseerrRequest(tmdbId, profileId, movieTagId, cfgMovieRootFolder);
          }
        } else {
          await Promise.all([this._fetchRadarrProfiles(), this._fetchRadarrTags(), this._fetchRadarrRootFolders()]);
          const reqKey = btn.dataset.reqkey || String(tmdbId);
          this._requestPending = { movieId, tmdbId, reqKey };
          this._reRenderRight(true);
        }
      });
    });
    this.shadowRoot.querySelectorAll(".req-cancel:not(.tv-req-cancel):not(.mus-add-cancel)").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this._requestPending = null;
        this._reRenderRight(true);
      });
    });
    this.shadowRoot.querySelectorAll(".req-panel select").forEach((sel) => {
      if (sel._qSync) return;
      sel._qSync = true;
      sel.addEventListener("change", (e) => this._tbSyncSelect(e.target));
    });
    this.shadowRoot.querySelectorAll(".req-tabs").forEach((nav) => {
      requestAnimationFrame(() => this._syncNavInd(nav, nav.querySelector(".req-tab--active")));
    });
    this.shadowRoot.querySelectorAll(".req-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        e.stopPropagation();
        const overlay = tab.closest(".req-overlay");
        if (!overlay) return;
        const targetPanel = tab.dataset.tab;
        const nav = tab.closest(".req-tabs");
        const from = this._navIndRect(nav);
        overlay.querySelectorAll(".req-tab").forEach((t) => t.classList.toggle("req-tab--active", t.dataset.tab === targetPanel));
        this._syncNavInd(nav, tab, from);
        overlay.querySelectorAll(".req-panel").forEach((p) => p.classList.toggle("req-panel--hidden", p.dataset.panel !== targetPanel));
      });
    });
    this.shadowRoot.querySelectorAll(".req-confirm:not(.tv-req-confirm):not(.mus-add-confirm)").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const movieId = parseInt(btn.dataset.movieid, 10);
        const tmdbId = parseInt(btn.dataset.tmdb, 10);
        const overlay = btn.closest(".req-overlay");
        const activeTab = overlay?.querySelector(".req-tab--active")?.dataset.tab ?? "r1";
        const use2 = activeTab === "r2";
        const suffix = use2 ? "2" : "";
        const sel = this.shadowRoot.getElementById(`req-select${suffix}-${movieId}`);
        const tagSel = this.shadowRoot.getElementById(`req-tag${suffix}-${movieId}`);
        const rfSel = this.shadowRoot.getElementById(`req-rootfolder${suffix}-${movieId}`);
        const profileId = sel ? sel.value : null;
        const tagId = tagSel ? tagSel.value : null;
        const rootFolder = rfSel?.value || null;
        btn.disabled = true;
        btn.innerHTML = '<span class="action-spinner" style="width:11px;height:11px;border-width:1.5px"></span>';
        if (this._overseerrConfigured === false) {
          await this._addDirectMovieRequest(tmdbId, profileId, tagId || null, rootFolder, use2 ? "radarr2" : "radarr");
        } else {
          await this._addOverseerrRequest(tmdbId, profileId, tagId || null, rootFolder, use2);
        }
      });
    });
    const tvBtns = this.shadowRoot.querySelectorAll(".tv-req-open");
    tvBtns.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const showId = parseInt(btn.dataset.showid, 10);
        if (!showId) return;
        const tvSource = btn.dataset.source || "tvUpcoming";
        const show = tvSource === "trending" ? this._trending.find((m) => m.id === showId && m.mediaType === "tv") : tvSource === "search" ? (this._searchResults || []).find((m) => m.id === showId && m.mediaType === "tv") : tvSource === "trakt" ? (this._trakt || []).find((m) => m.id === showId && m.mediaType === "tv") : tvSource === "popular" ? (this._popular || []).find((m) => m.id === showId && m.mediaType === "tv") : tvSource === "suggestarr" ? (this._suggestarr || []).find((m) => m.id === showId && m.mediaType === "tv") : (this._tvUpcoming || []).find((m) => m.id === showId);
        const fromTrending = tvSource === "trending";
        const fromSearch = tvSource === "search";
        if (!show) return;
        btn.disabled = true;
        btn.textContent = "\u2026";
        const oneClick = (this._cfgGet("discover", "oneClickRequest", false) || this._cfgGet("discover", "oneClickMovieRequest", false)) && !(this._cfgGet("discover", "oneClickNonAdminOnly", false) && this._hass.user.is_admin);
        if (oneClick) {
          await this._oneClickTvRequest(show);
          btn.disabled = false;
          return;
        }
        if (btn.closest(".trending-overlay")) {
          const grid = btn.closest(".to-grid");
          const card = btn.closest(".mc[data-oi]");
          const cardIndex = card ? parseInt(card.dataset.oi, 10) : 0;
          const colCount = grid ? Math.round(getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length) : 4;
          await this._openOverlayTvRequest(show, cardIndex, colCount);
        } else {
          await this._openTvRequestOverlay(show, tvSource);
        }
      });
    });
    this.shadowRoot.querySelectorAll(".tv-req-cancel").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this._tvRequestPending = null;
        this._reRenderRight(true);
      });
    });
    this.shadowRoot.querySelectorAll(".tv-req-confirm").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const mediaId = parseInt(btn.dataset.mediaid, 10);
        const checked = [...this.shadowRoot.querySelectorAll(".sv-input:checked")];
        const seasons = checked.map((el) => parseInt(el.dataset.season, 10)).filter(Boolean);
        if (!seasons.length) return;
        const activePanel = this.shadowRoot.querySelector(".req-panel:not(.req-panel--hidden)")?.dataset.panel || "s1";
        const use2 = activePanel === "s2";
        const profileSel = this.shadowRoot.getElementById(use2 ? "tv-req-profile2" : "tv-req-profile");
        const tagSel = this.shadowRoot.getElementById(use2 ? "tv-req-tag2" : "tv-req-tag");
        const rfSel = this.shadowRoot.getElementById(use2 ? "tv-req-rootfolder2" : "tv-req-rootfolder");
        const profileId = profileSel ? profileSel.value : null;
        const tagId = tagSel?.value || null;
        const rootFolder = rfSel?.value || null;
        btn.disabled = true;
        btn.innerHTML = '<span class="action-spinner" style="width:11px;height:11px;border-width:1.5px"></span>';
        if (this._overseerrConfigured === false) {
          await this._addDirectTvRequest(this._tvRequestPending?.show, seasons, profileId, tagId, rootFolder, use2 ? "sonarr2" : "sonarr");
        } else {
          await this._addOverseerrTvRequest(mediaId, seasons, profileId, tagId, rootFolder, use2);
        }
      });
    });
    this._wireTraktButtons();
    this.shadowRoot.querySelectorAll(".req-withdraw").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const reqId = parseInt(btn.dataset.reqid, 10);
        const mediaId = parseInt(btn.dataset.mediaid, 10);
        btn.disabled = true;
        btn.innerHTML = '<span class="action-spinner" style="width:8px;height:8px;border-width:1.5px"></span>';
        this._withdrawOverseerrRequest(reqId, mediaId);
      });
    });
    this.shadowRoot.querySelectorAll(".pr-approve").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const ids = btn.dataset.reqid.split(",").map(Number);
        btn.disabled = true;
        btn.innerHTML = "\u2026";
        this._markActivated();
        ids.forEach((id) => this._approvePendingRequest(id));
      });
    });
    this.shadowRoot.querySelectorAll(".pr-decline").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const ids = btn.dataset.reqid.split(",").map(Number);
        btn.disabled = true;
        btn.innerHTML = "\u2026";
        this._markActivated();
        ids.forEach((id) => this._declinePendingRequest(id));
      });
    });
    this._wireTvOverlay();
    this._wireSectionOverlay();
    this._alignReqOverlay();
    const _rightCol = this.shadowRoot?.getElementById("col-right");
    if (_rightCol) this._wireMusicCards(_rightCol);
  }
  // The overlay's anchor wraps the paging chevrons as well as the posters, so
  // inset:0 spilled it over the arrows on both sides. Measured rather than
  // hardcoded — the chevrons have no fixed width and the grid's own columns
  // follow the card's settings.
  _alignReqOverlay() {
    this.shadowRoot?.querySelectorAll(".tv-req-anchor > .req-overlay").forEach((ov) => {
      const anchor = ov.parentElement;
      const grid = anchor?.querySelector(".mgrid");
      if (!grid || !grid.offsetWidth || !anchor.offsetWidth) return;
      let left = 0;
      for (let el = grid; el && el !== anchor; el = el.offsetParent) left += el.offsetLeft;
      ov.style.left = `${Math.max(0, Math.round(left))}px`;
      ov.style.right = `${Math.max(0, Math.round(anchor.offsetWidth - left - grid.offsetWidth))}px`;
    });
  }
  _wireTvOverlay() {
    const scroll = this.shadowRoot.getElementById("sv-scroll");
    if (!scroll) return;
    const prev = this.shadowRoot.querySelector(".sv-prev");
    const next = this.shadowRoot.querySelector(".sv-next");
    const dots = this.shadowRoot.querySelectorAll(".sv-dot");
    const pageWidth = () => scroll.offsetWidth;
    const updateState = () => {
      const sl = scroll.scrollLeft;
      const pw = pageWidth();
      const maxSl = scroll.scrollWidth - pw;
      if (prev) prev.disabled = sl <= 2;
      if (next) next.disabled = sl >= maxSl - 2;
      if (dots.length) {
        const pg = Math.round(sl / pw);
        dots.forEach((d, i) => d.classList.toggle("sv-dot-active", i === pg));
      }
    };
    scroll.addEventListener("scroll", updateState, { passive: true });
    if (prev) prev.addEventListener("click", (e) => {
      e.stopPropagation();
      scroll.scrollBy({ left: -pageWidth(), behavior: "smooth" });
    });
    if (next) next.addEventListener("click", (e) => {
      e.stopPropagation();
      scroll.scrollBy({ left: pageWidth(), behavior: "smooth" });
    });
    updateState();
  }
  _wireSectionOverlay() {
    const sr = this.shadowRoot;
    if (this._ovAbort) this._ovAbort.abort();
    this._ovAbort = new AbortController();
    const ovSig = this._ovAbort.signal;
    sr.querySelectorAll('[data-action="overlay-open"]').forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const sec = el.dataset.sec;
        if (!sec) return;
        let startPage;
        if (el.dataset.page !== void 0) {
          startPage = parseInt(el.dataset.page) || 0;
        } else {
          const showMorePage = Math.max(1, parseInt(this._cfgGet("discover", "showMoreOnPage", 3)) || 3);
          const cols = Math.max(2, Math.min(10, parseInt(this._cfgGet("discover", "itemsPerCategory", 4)) || 4));
          const itemsBefore = showMorePage * cols - 1;
          const isMobile2 = window.matchMedia("(max-width: 480px)").matches;
          const perPage = isMobile2 ? cols : cols * 2;
          startPage = Math.floor(itemsBefore / perPage);
        }
        const _rc = this.shadowRoot?.getElementById("col-right");
        this._overlayLockH = _rc ? _rc.offsetHeight : 0;
        this._overlay = { section: sec, page: startPage, tvPending: null };
        this._reRenderSection(sec);
        const cfg = this._getSectionOverlayConfig(sec);
        if (cfg?.apiEndpoint) this._proactiveSectionLoad(sec);
      }, { signal: ovSig });
    });
    const overlay = sr.querySelector(".trending-overlay");
    if (!overlay) return;
    let _swipeStartX = null;
    overlay.addEventListener("touchstart", (e) => {
      _swipeStartX = e.touches[0].clientX;
    }, { passive: true, signal: ovSig });
    overlay.addEventListener("touchend", (e) => {
      if (_swipeStartX === null) return;
      const dx = e.changedTouches[0].clientX - _swipeStartX;
      _swipeStartX = null;
      if (Math.abs(dx) < 40) return;
      const action = dx < 0 ? "overlay-next" : "overlay-prev";
      sr.querySelector(`[data-action="${action}"]`)?.click();
    }, { passive: true, signal: ovSig });
    overlay.querySelector('[data-action="overlay-close"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      const sec = this._overlay?.section;
      this._overlay = { section: null, page: 0, tvPending: null };
      this._overlayLockH = 0;
      this._reRenderSection(sec || "trending");
    }, { signal: ovSig });
    sr.querySelector('[data-action="overlay-first"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      this._overlay.page = 0;
      this._overlay.tvPending = null;
      this._reRenderSection(this._overlay.section);
      this._scrollToSectionOverlay();
    }, { signal: ovSig });
    sr.querySelector('[data-action="overlay-prev"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      this._overlay.page = Math.max(0, (this._overlay.page || 0) - 1);
      this._overlay.tvPending = null;
      this._reRenderSection(this._overlay.section);
      this._scrollToSectionOverlay();
    }, { signal: ovSig });
    sr.querySelector('[data-action="overlay-next"]')?.addEventListener("click", async (e) => {
      e.stopPropagation();
      const sec = this._overlay?.section;
      const cfg = this._getSectionOverlayConfig(sec);
      if (!cfg) return;
      const isMobile2 = window.matchMedia("(max-width: 480px)").matches;
      const rows = Math.max(1, parseInt(this._cfgGet("discover", "categoriesCount", 3)) || 3);
      const perPage = isMobile2 ? rows * 2 : rows * 4;
      const items = (cfg.getItems ? cfg.getItems() : this[cfg.dataKey]) || [];
      const newPage = (this._overlay.page || 0) + 1;
      if (cfg.apiEndpoint && newPage * perPage >= items.length) {
        const apiPage = this._overlayApiPage[sec] || 0;
        const apiTotal = this._overlayApiTotalPages[sec] || 1;
        if (apiPage < apiTotal) {
          try {
            const nextApiPage = apiPage + 1;
            const data = await this._hass.callApi("GET", `arr_stack/${cfg.apiEndpoint}?page=${nextApiPage}`);
            this[cfg.dataKey] = [...items, ...data.results || []];
            this._overlayApiTotalPages[sec] = data.totalPages || apiTotal;
            this._overlayApiPage[sec] = nextApiPage;
          } catch (err) {
            console.error(`[arr-card] ${sec} overlay lazy load error:`, err);
          }
        }
      }
      const finalItems = (cfg.getItems ? cfg.getItems() : this[cfg.dataKey]) || [];
      const cols = Math.max(2, Math.min(10, parseInt(this._cfgGet("discover", "itemsPerCategory", 4)) || 4));
      const pageSize = isMobile2 ? cols : cols * 2;
      const lastPage = Math.max(0, Math.ceil(finalItems.length / pageSize) - 1);
      this._overlay.page = Math.min(newPage, lastPage);
      this._overlay.tvPending = null;
      this._reRenderSection(this._overlay.section);
      this._scrollToSectionOverlay();
    }, { signal: ovSig });
    sr.querySelector('[data-action="overlay-last"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      const sec = this._overlay?.section;
      const cfg = this._getSectionOverlayConfig(sec);
      if (!cfg) return;
      const isMobile2 = window.matchMedia("(max-width: 480px)").matches;
      const cols = Math.max(2, Math.min(10, parseInt(this._cfgGet("discover", "itemsPerCategory", 4)) || 4));
      const perPage = isMobile2 ? cols : cols * 2;
      const items = (cfg.getItems ? cfg.getItems() : this[cfg.dataKey]) || [];
      const totalPages = Math.ceil(items.length / perPage);
      this._overlay.page = Math.max(0, totalPages - 1);
      this._overlay.tvPending = null;
      this._reRenderSection(this._overlay.section);
      this._scrollToSectionOverlay();
    }, { signal: ovSig });
    sr.querySelectorAll(".rp-dot[data-topage]").forEach((dot) => {
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        const pg = parseInt(dot.dataset.topage, 10);
        if (!isNaN(pg)) {
          this._overlay.page = pg;
          this._overlay.tvPending = null;
          this._reRenderSection(this._overlay.section);
          this._scrollToSectionOverlay();
        }
      }, { signal: ovSig });
    });
    if (this._overlay.tvPending) {
      requestAnimationFrame(() => this._positionTvOverlay());
    }
  }
  _scrollToSectionOverlay() {
    if (!window.matchMedia("(max-width: 480px)").matches) return;
    requestAnimationFrame(() => {
      const rect = this.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      if (rect.bottom <= viewportH) return;
      const sc = this._findScrollContainer();
      if (!sc) return;
      sc.scrollBy({ top: rect.bottom - viewportH + 8, behavior: "smooth" });
    });
  }
  async _openOverlayTvRequest(show, cardIndex, colCount) {
    this._overlay.tvPending = {
      show,
      seasons: null,
      selected: null,
      profileId: null,
      mediaId: show.id,
      loading: true,
      cardIndex,
      colCount
    };
    requestAnimationFrame(() => this._positionTvOverlay());
    await Promise.allSettled([
      (async () => {
        const detail = await this._hass.callApi("GET", `arr_stack/overseerr/tv/${show.id}`);
        const seasons = (detail.seasons || []).filter((s) => s.seasonNumber > 0).map((s) => s.seasonNumber).sort((a, b) => a - b);
        if (this._overlay.tvPending) {
          this._overlay.tvPending.seasons = seasons;
          this._overlay.tvPending.selected = new Set(seasons);
        }
      })(),
      this._fetchSonarrProfiles(),
      (async () => {
        if (!this._seerrSonarr) await this._fetchOverseerrSonarrSettings();
      })()
    ]);
    if (this._overlay.tvPending) {
      this._overlay.tvPending.profileId = this._seerrSonarr?.profileId ?? null;
      this._overlay.tvPending.loading = false;
      requestAnimationFrame(() => this._positionTvOverlay());
    }
  }
  _positionTvOverlay() {
    const tvp = this._overlay.tvPending;
    const grid = this.shadowRoot.querySelector(".to-grid");
    if (!grid || !tvp) return;
    const container = grid.parentElement;
    grid.querySelector(".to-tv-abs-overlay")?.remove();
    container.querySelector(".to-tv-abs-overlay")?.remove();
    grid.style.position = "relative";
    const card = grid.querySelector(`.mc[data-oi="${tvp.cardIndex}"]`);
    if (!card) return;
    const ctnRect = container.getBoundingClientRect();
    const cRect = card.getBoundingClientRect();
    const colCount = Math.round(getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length) || 4;
    const prevCard = tvp.cardIndex >= colCount ? grid.querySelector(`.mc[data-oi="${tvp.cardIndex - colCount}"]`) : null;
    const topPx = card.offsetTop;
    const heightPx = card.offsetHeight;
    const el = document.createElement("div");
    el.className = "to-tv-abs-overlay";
    el.style.cssText = `top:${topPx}px;height:${heightPx}px`;
    el.innerHTML = this._renderTvOverlayCompact(tvp);
    grid.appendChild(el);
    if (!tvp.loading && tvp.seasons) {
      this._wireTvAbsOverlay(el, tvp);
    }
  }
  _wireTvAbsOverlay(el, tvp) {
    const scroll = el.querySelector("#sv-scroll-abs");
    const prev = el.querySelector(".sv-prev-abs");
    const next = el.querySelector(".sv-next-abs");
    const dots = el.querySelectorAll(".sv-dot");
    if (scroll) {
      const pageWidth = () => scroll.offsetWidth;
      const updateState = () => {
        const sl = scroll.scrollLeft;
        const pw = pageWidth();
        const max = scroll.scrollWidth - pw;
        if (prev) prev.disabled = sl <= 2;
        if (next) next.disabled = sl >= max - 2;
        if (dots.length) {
          const pg = Math.round(sl / pw);
          dots.forEach((d, i) => d.classList.toggle("sv-dot-active", i === pg));
        }
      };
      scroll.addEventListener("scroll", updateState, { passive: true });
      prev?.addEventListener("click", (e) => {
        e.stopPropagation();
        scroll.scrollBy({ left: -pageWidth(), behavior: "smooth" });
      });
      next?.addEventListener("click", (e) => {
        e.stopPropagation();
        scroll.scrollBy({ left: pageWidth(), behavior: "smooth" });
      });
      updateState();
    }
    el.querySelector(".to-tv-cancel-abs")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this._overlay.tvPending = null;
      this._reRenderSection(this._overlay.section);
    });
    el.querySelector(".to-tv-confirm-abs")?.addEventListener("click", async (e) => {
      e.stopPropagation();
      const checkedSeasons = [...el.querySelectorAll(".sv-input:checked")].map((cb) => parseInt(cb.dataset.season, 10)).filter(Boolean);
      if (!checkedSeasons.length) return;
      const profileSel = el.querySelector("#tv-req-profile-abs");
      const tagSel = el.querySelector("#tv-req-tag-abs");
      const rfSel = el.querySelector("#tv-req-rootfolder-abs");
      const profileId = profileSel ? profileSel.value : null;
      const tagId = tagSel?.value || null;
      const rootFolder = rfSel?.value || null;
      const mediaId = parseInt(e.currentTarget.dataset.mediaid, 10);
      e.currentTarget.disabled = true;
      e.currentTarget.innerHTML = '<span class="action-spinner" style="width:10px;height:10px;border-width:1.5px"></span>';
      const show = tvp.show;
      this._optimisticRequested.add(show.id);
      this._withdrawnIds.delete(show.id);
      this._overlay.tvPending = null;
      el.remove();
      try {
        if (!this._seerrSonarr) await this._fetchOverseerrSonarrSettings();
        const body = { mediaType: "tv", mediaId, seasons: checkedSeasons };
        if (this._seerrSonarr) {
          body.serverId = this._seerrSonarr.serverId;
          body.profileId = profileId !== null ? parseInt(profileId) : this._seerrSonarr.profileId;
          body.rootFolder = rootFolder || this._seerrSonarr.rootFolder;
        }
        if (tagId) body.tags = [parseInt(tagId)];
        {
          const _acct = this._seerrAccountForUser();
          if (_acct !== "admin") body.userMode = _acct;
        }
        await this._hass.callApi("POST", "arr_stack/overseerr/request", body);
      } catch (err) {
        console.error("[arr-card] overlay TV request error:", err);
        this._optimisticRequested.delete(show.id);
      }
      await this._fetchAll();
    });
  }
  // Scoped wiring for cards inside .search-results-wrap only — used by _reRenderSearchResults()
  // so we don't re-wire (and double-bind) cards elsewhere in the right panel that weren't touched.
  _sizeSearchOverlay(root) {
    const anchor = root?.querySelector(".tv-req-anchor") || this.shadowRoot?.querySelector("#col-right .tv-req-anchor");
    const ov = anchor?.querySelector(":scope > .req-overlay");
    const grid = anchor?.querySelector(".mgrid, .to-grid");
    if (!ov || !grid) return;
    const cards = [...grid.children];
    if (!cards.length) return;
    const mb = String(this._musAddPending?.artist?.foreignArtistId || "").toLowerCase();
    const target = mb && cards.find((c) => String(c.querySelector("[data-mus-add]")?.dataset.musAdd || "").toLowerCase() === mb || String(c.dataset.artistUnowned || "").toLowerCase() === mb) || cards[0];
    const row = cards.filter((c) => c.offsetTop === target.offsetTop);
    const first = row[0];
    const last = row[row.length - 1];
    ov.style.left = `${first.offsetLeft}px`;
    ov.style.right = "auto";
    ov.style.width = `${last.offsetLeft + last.offsetWidth - first.offsetLeft}px`;
    ov.style.top = `${first.offsetTop}px`;
    ov.style.bottom = "auto";
    ov.style.height = `${first.offsetHeight}px`;
  }
  _wireSearchResultCards(root) {
    requestAnimationFrame(() => this._sizeSearchOverlay(root));
    this._wireMusAddSelects(root);
    root.querySelectorAll(".mc[data-popup]").forEach((card) => {
      card.style.cursor = "pointer";
      card.addEventListener("click", (e) => {
        if (e.target.closest(".overseerr-add, .btn-add, .req-open, .req-cancel, .req-confirm, .req-overlay, .tv-req-open, .tv-req-cancel, .tv-req-confirm, .tv-req-overlay, .req-withdraw, .pr-approve, .pr-decline")) return;
        const type = card.dataset.popup;
        const tmdbId = card.dataset.tmdbid;
        const tvdbId = card.dataset.tvdbid;
        const title = card.dataset.title || "";
        const radarrId = card.dataset.radarrid ? parseInt(card.dataset.radarrid, 10) : null;
        const radarr2Id = card.dataset.radarr2id ? parseInt(card.dataset.radarr2id, 10) : null;
        this._openPopup(type, tmdbId, tvdbId, title, radarrId, radarr2Id);
      });
    });
    root.querySelectorAll(".req-open").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const movieId = parseInt(btn.dataset.movieid, 10);
        const tmdbId = parseInt(btn.dataset.tmdb, 10);
        if (!movieId) return;
        btn.disabled = true;
        btn.textContent = "\u2026";
        const oneClick = (this._cfgGet("discover", "oneClickRequest", false) || this._cfgGet("discover", "oneClickMovieRequest", false)) && !(this._cfgGet("discover", "oneClickNonAdminOnly", false) && this._hass.user.is_admin);
        if (oneClick) {
          const profileName = this._cfgGet("discover", "oneClickDefaultMovieProfile", "");
          let profileId = null;
          if (profileName) {
            await this._fetchRadarrProfiles();
            const match = this._radarrProfiles.find((p) => p.name === profileName);
            profileId = match ? match.id : null;
          }
          const cfgMovieTag = this._cfgGet("discover", "oneClickDefaultMovieTag", "") || "";
          let movieTagId = null;
          if (cfgMovieTag && this._radarrTags.length > 0) {
            const tm = this._radarrTags.find((t) => t.label === cfgMovieTag);
            if (tm) movieTagId = tm.id;
          }
          const cfgMovieRootFolder = this._cfgGet("discover", "oneClickDefaultMovieRootFolder", "") || null;
          if (this._overseerrConfigured === false) {
            await this._addDirectMovieRequest(tmdbId, profileId, movieTagId, cfgMovieRootFolder, "radarr");
          } else {
            await this._addOverseerrRequest(tmdbId, profileId, movieTagId, cfgMovieRootFolder);
          }
        } else {
          await Promise.all([this._fetchRadarrProfiles(), this._fetchRadarrTags(), this._fetchRadarrRootFolders()]);
          const reqKey = btn.dataset.reqkey || String(tmdbId);
          this._requestPending = { movieId, tmdbId, reqKey };
          this._reRenderRight(true);
        }
      });
    });
    root.querySelectorAll(".tv-req-open").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const showId = parseInt(btn.dataset.showid, 10);
        if (!showId) return;
        const tvSource = btn.dataset.source || "tvUpcoming";
        const show = (this._searchResults || []).find((m) => m.id === showId && m.mediaType === "tv");
        if (!show) return;
        btn.disabled = true;
        btn.textContent = "\u2026";
        const oneClick = (this._cfgGet("discover", "oneClickRequest", false) || this._cfgGet("discover", "oneClickMovieRequest", false)) && !(this._cfgGet("discover", "oneClickNonAdminOnly", false) && this._hass.user.is_admin);
        if (oneClick) {
          await this._oneClickTvRequest(show);
          btn.disabled = false;
          return;
        }
        await this._openTvRequestOverlay(show, tvSource);
      });
    });
    root.querySelectorAll(".req-withdraw").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const reqId = parseInt(btn.dataset.reqid, 10);
        const mediaId = parseInt(btn.dataset.mediaid, 10);
        btn.disabled = true;
        btn.innerHTML = '<span class="action-spinner" style="width:8px;height:8px;border-width:1.5px"></span>';
        this._withdrawOverseerrRequest(reqId, mediaId);
      });
    });
  }
  // A choice made in the phone's pop-out filter is shown before it is acted on:
  // the peanut marks the chosen half, folds away, and only then does the row
  // underneath change. Acting first would rebuild the header mid-animation, so
  // the reader would never see which one they hit.
  _applyTypeSeg(el, spec) {
    const cur = this[spec.cur] || "all";
    const wrap = el.closest(".hdr-filter");
    const open = !!wrap?.classList.contains("is-open");
    const commit = (animate) => {
      this[spec.prev] = cur;
      this[spec.anim] = animate;
      this[spec.cur] = spec.v;
      try {
        localStorage.setItem(spec.ls, spec.v);
      } catch (_) {
      }
      this._pages[spec.sec] = 0;
      this._hdrFilterOpen = null;
      this._reRenderSection(spec.sec);
    };
    if (spec.v === cur) {
      if (open) {
        wrap.classList.remove("is-open");
        this._hdrFilterOpen = null;
      }
      return;
    }
    if (!open) {
      commit(true);
      return;
    }
    const seg = el.closest(".mt-seg");
    const half = el.closest(".mt-seg-half");
    const idx = seg && half ? [...seg.querySelectorAll(".mt-seg-half")].indexOf(half) : -1;
    if (idx >= 0) seg.dataset.seg = String(idx);
    setTimeout(() => {
      wrap.classList.remove("is-open");
      setTimeout(() => commit(false), 300);
    }, 340);
  }
  // Categories are not the same height — a row of posters stands taller than the
  // statistics tiles — so paging through them resized the whole card, and with it
  // everything below it on the dashboard. The tallest category seen becomes the
  // floor for all of them, carried on the column as --sec-min-h so it applies the
  // moment a page is drawn rather than a frame later. Desktop only: on a phone the
  // column is one category wide and scrolls anyway.
  _syncSecHeights(measure = true) {
    const right = this.shadowRoot?.getElementById("col-right");
    if (!right) return;
    if (this._overlay?.section || window.matchMedia("(max-width: 900px)").matches) {
      right.style.removeProperty("--sec-min-h");
      right.style.removeProperty("--sec-wrap-h");
      return;
    }
    if (measure) {
      const cards = [...right.querySelectorAll(".sec-card:not(.sec-search)")];
      if (cards.length) {
        right.style.setProperty("--sec-min-h", "0px");
        const tallest = Math.max(...cards.map((c) => c.offsetHeight));
        this._secMaxH = Math.min(900, Math.max(this._secMaxH || 0, tallest));
      }
    }
    if (this._secMaxH) right.style.setProperty("--sec-min-h", `${this._secMaxH}px`);
    const wrap = right.querySelector(".rp-sections");
    if (!wrap) return;
    const perPage = Math.max(2, parseInt(this._cfgGet("discover", "categoriesCount", 3)) || 3) - 1;
    const shown = wrap.querySelectorAll(".sec-card:not(.sec-search)").length;
    if (measure && shown >= perPage) {
      right.style.removeProperty("--sec-wrap-h");
      this._secWrapH = Math.max(this._secWrapH || 0, wrap.offsetHeight);
    }
    if (this._secWrapH) right.style.setProperty("--sec-wrap-h", `${this._secWrapH}px`);
  }
  _wireSearch() {
    const root = this.shadowRoot;
    const _srWrap = root.querySelector(".search-results-wrap");
    const _right = this.shadowRoot?.getElementById("col-right");
    if (_srWrap || _right) {
      requestAnimationFrame(() => this._sizeSearchOverlay(_srWrap || _right));
      this._wireMusAddSelects(_right || _srWrap);
    }
    this._syncSegVars(root);
    root.querySelectorAll(".search-type-seg .mt-seg[data-seg-to]").forEach((seg) => {
      if (seg.dataset.seg === seg.dataset.segTo) return;
      requestAnimationFrame(() => {
        seg.dataset.seg = seg.dataset.segTo;
      });
    });
    this._searchSegAnim = false;
    this._rqSegAnim = false;
    this._raSegAnim = false;
    this._calCatSegAnim = false;
    this._recSegAnim = false;
    const input = root.querySelector(".search-bar-input");
    if (!input) return;
    if (this._searchAbort) this._searchAbort.abort();
    this._searchAbort = new AbortController();
    const sig = this._searchAbort.signal;
    const headingColor = this._cfgGet("styles", "headingTextColor", "#fff") || "#fff";
    const iconDefaultColor = this._cfgGet("styles", "searchBarIconColor", "") || "";
    const _setSearchColors = (on) => {
      const wrap = input.closest(".search-bar-wrap");
      if (!wrap) return;
      const icon = wrap.querySelector("ha-icon");
      const clear = wrap.querySelector(".search-bar-clear");
      if (icon) icon.style.color = on ? headingColor : iconDefaultColor;
      if (clear) clear.style.color = on ? headingColor : "";
      input.style.color = on ? headingColor : "";
    };
    input.addEventListener("focus", () => _setSearchColors(true), { signal: sig });
    input.addEventListener("blur", () => {
      if (!this._searchQuery?.trim()) _setSearchColors(false);
    }, { signal: sig });
    input.addEventListener("input", () => {
      const q = input.value.trim();
      this._searchQuery = input.value;
      this._searchPage = 0;
      clearTimeout(this._searchTimer);
      _setSearchColors(!!q || document.activeElement === input);
      if (!q) {
        this._searchActive = false;
        this._searchResults = [];
        this._searchMaxH = null;
        this._reRenderRight(true);
        return;
      }
      this._searchActive = true;
      this._searchTimer = setTimeout(() => this._fetchSearch(q), 1500);
    }, { signal: sig });
    root.addEventListener("mousedown", (e) => {
      if (e.target.closest(".search-type-seg")) e.preventDefault();
    }, { signal: sig });
    root.addEventListener("click", (e) => {
      const funnel = e.target.closest("[data-hdr-filter-btn]");
      if (funnel) {
        e.stopPropagation();
        const wrap = funnel.closest(".hdr-filter");
        root.querySelectorAll(".hdr-filter.is-open").forEach((w) => {
          if (w !== wrap) w.classList.remove("is-open");
        });
        const open = wrap?.classList.toggle("is-open");
        this._hdrFilterOpen = open ? wrap?.dataset.hdrFilter || null : null;
        return;
      }
      const typeBtn = e.target.closest("[data-rec-type],[data-ra-type],[data-rq-type],[data-calcat-type]");
      if (!typeBtn && !e.target.closest(".hdr-filter")) {
        root.querySelectorAll(".hdr-filter.is-open").forEach((w) => w.classList.remove("is-open"));
        this._hdrFilterOpen = null;
      }
      if (typeBtn) {
        const d = typeBtn.dataset;
        const spec = d.recType ? { v: d.recType, cur: "_recType", prev: "_recSegPrev", anim: "_recSegAnim", ls: "arr-rec-type", sec: "recommendations" } : d.raType ? { v: d.raType, cur: "_raType", prev: "_raSegPrev", anim: "_raSegAnim", ls: "arr-ra-type", sec: "recentlyAdded" } : d.rqType ? { v: d.rqType, cur: "_rqType", prev: "_rqSegPrev", anim: "_rqSegAnim", ls: "arr-rq-type", sec: "recentlyRequested" } : { v: d.calcatType, cur: "_calCatType", prev: "_calCatSegPrev", anim: "_calCatSegAnim", ls: "arr-cal-type", sec: "calendar" };
        this._applyTypeSeg(typeBtn, spec);
        return;
      }
      const seg = e.target.closest("[data-search-type]");
      if (seg) {
        const next = seg.dataset.searchType;
        if (next !== this._searchType) {
          this._searchSegPrev = this._searchType;
          this._searchSegAnim = true;
          try {
            localStorage.setItem("arr-search-type", next);
          } catch (_) {
          }
          this._searchPage = 0;
          const segEl = seg.closest(".mt-seg");
          if (segEl) {
            const idx = [...segEl.querySelectorAll(".mt-seg-half")].indexOf(seg);
            if (idx >= 0) {
              segEl.dataset.segTo = String(idx);
              requestAnimationFrame(() => {
                segEl.dataset.seg = String(idx);
              });
            }
          }
          this._searchSegAnim = false;
          const q = (this._searchQuery || "").trim();
          clearTimeout(this._searchTimer);
          if (q) this._fetchSearch(q);
          else this._reRenderSearchResults();
        }
        return;
      }
      if (e.target.closest(".search-bar-clear")) {
        clearTimeout(this._searchTimer);
        this._searchQuery = "";
        this._searchActive = false;
        this._searchPage = 0;
        this._searchResults = [];
        this._searchMaxH = null;
        this._reRenderRight(true);
      }
    }, { signal: sig });
  }
  // Rerenderuj jen sloupec kde sekce leží (nezpůsobuje scroll reset stránky)
  _reRenderSection(section) {
    const leftSections = /* @__PURE__ */ new Set(["qbit", "sab"]);
    if (leftSections.has(section)) {
      this._reRenderLeft();
    } else {
      const right = this.shadowRoot.getElementById("col-right");
      if (!right) return;
      if (this._searchActive) return;
      const isMobile2 = window.matchMedia("(max-width: 900px)").matches;
      const navWasVisible = right.querySelector(".rp-nav")?.classList.contains("rp-nav-visible") ?? false;
      const sc = isMobile2 ? this._findScrollContainer() : null;
      const raw = this._cfg.sticky_nav_offset ?? this._cfg.stickyNavOffset;
      const navOffset = raw != null ? Math.max(0, parseInt(raw)) : 100;
      const left = isMobile2 ? this.shadowRoot.getElementById("col-left") : null;
      const navWasMet = isMobile2 && left ? left.getBoundingClientRect().bottom < navOffset : false;
      right.innerHTML = this._mobMinWrap("right", this._renderRight());
      if (isMobile2) {
        if (this._overlay?.section) {
          right.style.minHeight = "";
        } else if (this._rightMaxH) {
          right.style.minHeight = this._rightMaxH + "px";
        }
      } else if (this._overlay?.section && this._overlayLockH) {
        right.style.minHeight = this._overlayLockH + "px";
      } else {
        right.style.minHeight = "";
      }
      if (navWasVisible) {
        const newNav = right.querySelector(".rp-nav");
        if (newNav) {
          newNav.style.transition = "none";
          newNav.classList.add("rp-nav-visible");
          requestAnimationFrame(() => {
            newNav.style.transition = "";
          });
        }
      }
      this._wirePageButtons();
      this._wirePopup();
      this._wireOverseerrButtons();
      this._wireSearch();
      this._wireMinimize();
      this._syncSecHeights(false);
      requestAnimationFrame(() => {
        this._syncSecHeights();
        this._checkBadgeOverflow();
        if (isMobile2 && sc && left) {
          const lRect = left.getBoundingClientRect();
          const rightEl = this.shadowRoot.getElementById("col-right");
          const rRect = rightEl ? rightEl.getBoundingClientRect() : null;
          const isShortPage = rRect ? rRect.height <= window.innerHeight : false;
          if (!this._overlay?.section && lRect.bottom >= navOffset && (navWasMet || isShortPage && lRect.top < 0)) {
            sc.scrollTop += lRect.bottom - navOffset + 1;
          }
        }
      });
    }
  }
  _swapRightKeepNav(right, scrollState) {
    const isMobile2 = window.matchMedia("(max-width: 900px)").matches;
    const lockH = this._searchActive ? this._searchLockHeight() : this._rightMaxH;
    if (lockH) right.style.minHeight = lockH + "px";
    const oldNav = isMobile2 ? right.querySelector(".rp-nav") : null;
    const navVisible = oldNav?.classList.contains("rp-nav-visible") ?? false;
    if (oldNav) oldNav.remove();
    const newHtml = this._renderRight();
    const wrap = this._mobMinWrap("right", newHtml);
    if (oldNav && navVisible) {
      const tmp = document.createElement("div");
      tmp.innerHTML = wrap;
      const renderedNav = tmp.querySelector(".rp-nav");
      if (renderedNav) {
        oldNav.innerHTML = renderedNav.innerHTML;
        renderedNav.remove();
      }
      right.innerHTML = tmp.innerHTML;
      right.appendChild(oldNav);
    } else {
      right.innerHTML = wrap;
      if (navVisible) {
        const newNav = right.querySelector(".rp-nav");
        if (newNav) {
          newNav.style.transition = "none";
          newNav.classList.add("rp-nav-visible");
          requestAnimationFrame(() => {
            newNav.style.transition = "";
          });
        }
      }
    }
    this._wirePageButtons();
    this._wirePopup();
    this._wireOverseerrButtons();
    this._wireSearch();
    this._wireMinimize();
    this._syncSecHeights(false);
    requestAnimationFrame(() => this._syncSecHeights());
    this._afterRightPageSwitch(scrollState);
    this._resetFetchInterval();
    this._fetchVisibleCats();
  }
  _wirePageButtons(scope = this.shadowRoot) {
    if (this._pageBtnAbort) this._pageBtnAbort.abort();
    this._pageBtnAbort = new AbortController();
    const sig = this._pageBtnAbort.signal;
    if (scope === this.shadowRoot) scope.querySelectorAll(".rp-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.action) return;
        btn.classList.add("rp-btn-ping");
        btn.addEventListener("animationend", () => btn.classList.remove("rp-btn-ping"), { once: true });
        const scrollState = this._captureScrollState();
        const dir = btn.dataset.dir;
        if (this._searchActive) {
          const _sc = Math.max(2, Math.min(10, parseInt(this._cfgGet("discover", "itemsPerCategory", 4)) || 4));
          const searchTotal = Math.ceil((this._searchResults || []).length / (_sc * 2));
          const cur = this._searchPage || 0;
          if (dir === "next") this._searchPage = Math.min(cur + 1, searchTotal - 1);
          else if (dir === "prev") this._searchPage = Math.max(cur - 1, 0);
          else if (dir === "first") this._searchPage = 0;
          else if (dir === "last") this._searchPage = Math.max(0, searchTotal - 1);
        } else {
          const totalPages = this._rightTotalPages || this.shadowRoot.querySelectorAll(".rp-dot").length || 1;
          const cur = typeof this._rightPage === "number" ? this._rightPage : 0;
          if (dir === "next") this._rightPage = Math.min(cur + 1, totalPages - 1);
          else if (dir === "prev") this._rightPage = Math.max(cur - 1, 0);
          else if (dir === "first") this._rightPage = 0;
          else if (dir === "last") this._rightPage = Math.max(0, totalPages - 1);
        }
        const right = this.shadowRoot.getElementById("col-right");
        if (right) {
          this._swapRightKeepNav(right, scrollState);
        }
      }, { signal: sig });
    });
    if (scope === this.shadowRoot) this.shadowRoot.querySelectorAll(".rp-dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        if (dot.dataset.topage !== void 0) return;
        const targetPage = parseInt(dot.dataset.page, 10);
        if (!isNaN(targetPage)) {
          const scrollState = this._captureScrollState();
          if (this._searchActive) this._searchPage = targetPage;
          else this._rightPage = targetPage;
          const right = this.shadowRoot.getElementById("col-right");
          if (right) {
            this._swapRightKeepNav(right, scrollState);
          }
        }
      }, { signal: sig });
    });
    if (scope === this.shadowRoot) this._wireSwipe(sig);
    if (scope === this.shadowRoot) this._wireStickyNav();
    scope.querySelectorAll('[data-action="open-cal-modal"]').forEach((btn) => {
      btn.addEventListener("click", async () => {
        this._markActivated();
        this._calendarModalOpen = true;
        this._calendarWeekOffset = 0;
        this._calendarMonthOffset = 0;
        this._calDayOpen = null;
        this._calendarModalData = [];
        this._renderCalendarModalEl();
        await this._fetchCalendarWindow();
      }, { signal: sig });
    });
    scope.querySelectorAll(".pg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const section = btn.dataset.section;
        const dir = btn.dataset.dir;
        const data = this._getPageData(section);
        const perPage = this._perPage(section);
        const count = this._hasSeeMore(section) ? this._smpPageCount(data, section) : data.length;
        const total = Math.ceil(count / perPage);
        const cur = this._pages[section] || 0;
        if (dir === "next" && cur < total - 1) {
          this._pages[section] = cur + 1;
          this._pageDir[section] = "next";
        } else if (dir === "prev" && cur > 0) {
          this._pages[section] = cur - 1;
          this._pageDir[section] = "prev";
        } else {
          return;
        }
        this._reRenderSection(section);
        Object.keys(this._pageDir).forEach((k) => {
          this._pageDir[k] = "";
        });
      }, { signal: sig });
    });
    scope.querySelectorAll(".dc-chev").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.diskkey;
        const dir = btn.dataset.diskdir;
        if (!key || btn.disabled) return;
        let roots;
        if (key === "left") {
          roots = [...this._radarrRootFolders || [], ...this._sonarrRootFolders || []];
        } else {
          roots = key === "radarr" ? this._radarrRootFolders : this._sonarrRootFolders;
        }
        const DISK_ROUND = 100 * 1024 * 1024;
        const diskMap = /* @__PURE__ */ new Map();
        for (const r of roots) {
          const key2 = Math.round(r.freeSpace / DISK_ROUND);
          if (!diskMap.has(key2)) diskMap.set(key2, true);
        }
        const total = diskMap.size;
        const cur = this._diskPage[key] ?? 0;
        if (dir === "next" && cur < total - 1) this._diskPage[key] = cur + 1;
        else if (dir === "prev" && cur > 0) this._diskPage[key] = cur - 1;
        else return;
        if (key === "left") {
          this._reRenderLeft();
        } else {
          this._reRenderSection(key);
        }
      }, { signal: sig });
    });
  }
  // ─────────────────────────────────────────────
  // Swipe gesta pro stránkování sekcí (touch)
  // ─────────────────────────────────────────────
  _wireSwipe(sig) {
    const THRESHOLD = 40;
    this.shadowRoot.querySelectorAll(".pg-wrap").forEach((wrap) => {
      const btn = wrap.querySelector(".pg-btn[data-section]");
      if (!btn) return;
      const section = btn.dataset.section;
      let startX = null;
      wrap.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
      }, { passive: true, signal: sig });
      wrap.addEventListener("touchend", (e) => {
        if (startX === null) return;
        const dx = e.changedTouches[0].clientX - startX;
        startX = null;
        if (Math.abs(dx) < THRESHOLD) return;
        const dir = dx < 0 ? "next" : "prev";
        const data = this._getPageData(section);
        const perPage = this._perPage(section);
        const total = Math.ceil(this._smpPageCount(data, section) / perPage);
        const cur = this._pages[section] || 0;
        if (dir === "next" && cur < total - 1) {
          this._pages[section] = cur + 1;
          this._pageDir[section] = "next";
        } else if (dir === "prev" && cur > 0) {
          this._pages[section] = cur - 1;
          this._pageDir[section] = "prev";
        } else {
          return;
        }
        this._reRenderSection(section);
        Object.keys(this._pageDir).forEach((k) => {
          this._pageDir[k] = "";
        });
      }, { passive: true, signal: sig });
    });
    const rpNav = this.shadowRoot.querySelector(".rp-nav");
    if (rpNav) {
      let startX = null;
      rpNav.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
      }, { passive: true, signal: sig });
      rpNav.addEventListener("touchend", (e) => {
        if (startX === null) return;
        const dx = e.changedTouches[0].clientX - startX;
        startX = null;
        if (Math.abs(dx) < THRESHOLD) return;
        const dir = dx < 0 ? "next" : "prev";
        const allCategories = (this._cfg.categories || this._defaultCategories()).filter((c) => c.enabled !== false);
        const perPage = Math.max(1, parseInt(this._cfgGet("discover", "categoriesCount", 3)) || 3);
        const totalPages = Math.ceil(allCategories.length / perPage);
        const cur = this._pages["right"] || 0;
        if (dir === "next" && cur < totalPages - 1) {
          this._pages["right"] = cur + 1;
        } else if (dir === "prev" && cur > 0) {
          this._pages["right"] = cur - 1;
        } else {
          return;
        }
        this._reRenderRight(true);
      }, { passive: true, signal: sig });
    }
  }
  _wireTraktButtons() {
    const _traktDismiss = (btn, apiCall) => {
      if (btn._traktWired) return;
      btn._traktWired = true;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const slug = btn.dataset.traktSlug;
        const type = btn.dataset.traktType;
        const tmdbId = parseInt(btn.dataset.traktTmdb, 10);
        const key = slug || String(tmdbId);
        this._markActivated();
        btn.disabled = true;
        btn.innerHTML = '<span class="action-spinner" style="width:8px;height:8px;border-width:1.5px"></span>';
        const card = btn.closest(".mc");
        if (card) {
          card.style.transition = "opacity 0.35s ease, transform 0.35s ease";
          card.style.opacity = "0";
          card.style.transform = "scale(0.7) translateX(30px)";
        }
        setTimeout(() => {
          if (!this._traktWatching) this._traktWatching = /* @__PURE__ */ new Set();
          this._traktWatching.add(key);
          this._trakt = this._traktInterleave((this._trakt || []).filter((m) => (m._traktSlug || String(m.id)) !== key));
          this._reRenderRight(true);
          (async () => {
            try {
              await apiCall(type, slug, tmdbId);
            } catch (_) {
            }
            try {
              await this._fetchTrakt();
              this._reRenderRight(true);
            } catch (_) {
            }
          })();
        }, 200);
      });
    };
    const _traktConfetti = (card) => {
      const colors = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF6FC8", "#FF9F1C", "#A8DADC", "#E63946", "#C77DFF", "#FFBE0B"];
      const cw = card.offsetWidth || 100;
      const ch = card.offsetHeight || 160;
      const cx = cw / 2;
      const cy = ch / 2;
      const count = 38;
      for (let i = 0; i < count; i++) {
        const p = document.createElement("div");
        p.className = "trakt-confetti-p";
        const w = 2 + Math.random() * 3;
        const h = 10 + Math.random() * 18;
        const baseAngle = i / count * 360;
        const jitter = (Math.random() - 0.5) * 22;
        const dist = 32 + Math.random() * Math.min(cx, cy) * 0.9;
        const rad = (baseAngle + jitter) * Math.PI / 180;
        const tx = Math.cos(rad) * dist;
        const ty = Math.sin(rad) * dist;
        const rot = (Math.random() - 0.5) * 800;
        const dur = 650 + Math.random() * 500;
        const delay = Math.random() * 100;
        Object.assign(p.style, {
          width: w + "px",
          height: h + "px",
          background: colors[i % colors.length],
          left: cx + "px",
          top: cy + "px",
          marginLeft: -w / 2 + "px",
          marginTop: -h / 2 + "px"
        });
        card.appendChild(p);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          p.style.transition = `transform ${dur}ms ease-out ${delay}ms, opacity ${dur}ms ease-out ${delay}ms`;
          p.style.transform = `translate(${tx}px,${ty}px) rotate(${rot}deg)`;
          p.style.opacity = "0";
        }));
        setTimeout(() => p.remove(), dur + delay + 120);
      }
    };
    const _STAR_COLORS = {
      5: "rgba(255,255,255,0.85)",
      4: "rgba(255,255,255,0.70)",
      3: "rgba(255,255,255,0.55)",
      2: "rgba(255,255,255,0.42)",
      1: "rgba(255,255,255,0.30)"
    };
    const _buildStarsHtml = () => {
      let h = '<div class="trakt-star-wrap">';
      for (let s = 5; s >= 1; s--) {
        h += `<span class="trakt-star" data-trakt-star="${s}" style="animation-delay:${(5 - s) * 45}ms;color:${_STAR_COLORS[s]}">\u2605</span>`;
      }
      h += `<span class="trakt-heart" data-trakt-heart="1" style="animation-delay:${5 * 45}ms">\u2665</span>`;
      h += "</div>";
      return h;
    };
    this.shadowRoot.querySelectorAll(".trakt-seen-ol:not(.sa-seen-ol):not(.mus-like-ol)").forEach((btn) => {
      if (btn._traktWired) return;
      btn._traktWired = true;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (btn.classList.contains("trakt-rating-open")) {
          btn.classList.remove("trakt-rating-open");
          const _chars = (s) => s.toUpperCase().split("").join("<br>");
          btn.innerHTML = `<span>${_chars(this._t("watched"))}</span>`;
          return;
        }
        const card = btn.closest(".mc");
        btn.classList.add("trakt-rating-open");
        btn.innerHTML = _buildStarsHtml();
        const _closeRating = (ev) => {
          if (btn.contains(ev.target)) return;
          btn.classList.remove("trakt-rating-open");
          const _ch = (s) => s.toUpperCase().split("").join("<br>");
          btn.innerHTML = `<span>${_ch(this._t("watched"))}</span>`;
          this.shadowRoot.removeEventListener("click", _closeRating, true);
        };
        this.shadowRoot.addEventListener("click", _closeRating, true);
        const slug = btn.dataset.traktSlug;
        const type = btn.dataset.traktType;
        const tmdbId = parseInt(btn.dataset.traktTmdb, 10);
        const key = slug || String(tmdbId);
        const allStars = [...btn.querySelectorAll("[data-trakt-star]")];
        const heartEl = btn.querySelector("[data-trakt-heart]");
        const wrapEl = btn.querySelector(".trakt-star-wrap");
        const _resetStars = () => {
          allStars.forEach((x) => {
            x.style.color = _STAR_COLORS[parseInt(x.dataset.traktStar)] || "";
            x.style.transform = "";
          });
          if (heartEl) heartEl.style.color = "";
        };
        allStars.forEach((s) => {
          s.addEventListener("mouseenter", () => {
            const val = parseInt(s.dataset.traktStar);
            allStars.forEach((x) => {
              const xv = parseInt(x.dataset.traktStar);
              x.style.color = xv <= val ? "#FFD700" : "rgba(255,255,255,0.25)";
              x.style.transform = xv === val ? "scale(1.25)" : "";
            });
            if (heartEl) heartEl.style.color = "rgba(255,255,255,0.25)";
          });
        });
        if (heartEl) {
          heartEl.addEventListener("mouseenter", () => {
            allStars.forEach((x) => {
              x.style.color = "rgba(255,255,255,0.25)";
              x.style.transform = "";
            });
            heartEl.style.color = "#ff4466";
          });
        }
        if (wrapEl) wrapEl.addEventListener("mouseleave", _resetStars);
        btn.querySelectorAll("[data-trakt-star],[data-trakt-heart]").forEach((starEl) => {
          starEl.addEventListener("click", (ev) => {
            ev.stopPropagation();
            this._markActivated();
            this.shadowRoot.removeEventListener("click", _closeRating, true);
            const stars = starEl.dataset.traktStar ? parseInt(starEl.dataset.traktStar) : null;
            const rating = stars !== null ? stars * 2 : 10;
            if (stars !== null) {
              allStars.forEach((x) => {
                const xv = parseInt(x.dataset.traktStar);
                x.style.color = xv <= stars ? "#FFD700" : "rgba(255,255,255,0.15)";
                x.style.transform = xv <= stars ? "scale(1.1)" : "";
              });
              if (heartEl) heartEl.style.color = "rgba(255,255,255,0.15)";
            } else {
              allStars.forEach((x) => {
                x.style.color = "rgba(255,255,255,0.15)";
                x.style.transform = "";
              });
              if (heartEl) {
                heartEl.style.color = "#ff4466";
                heartEl.style.transform = "scale(1.2)";
              }
            }
            setTimeout(() => {
              if (card) _traktConfetti(card);
            }, 180);
            setTimeout(() => {
              if (card) {
                card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
                card.style.opacity = "0";
                card.style.transform = "scale(0.85)";
              }
              setTimeout(() => {
                if (!this._traktWatching) this._traktWatching = /* @__PURE__ */ new Set();
                this._traktWatching.add(key);
                this._trakt = this._traktInterleave((this._trakt || []).filter((m) => (m._traktSlug || String(m.id)) !== key));
                this._reRenderRight(true);
                (async () => {
                  try {
                    await this._callApi("POST", "arr_stack/trakt/history", { mediaType: type, slug, tmdbId });
                  } catch (_) {
                  }
                  try {
                    await this._callApi("POST", "arr_stack/trakt/rate", { mediaType: type, slug, tmdbId, rating });
                  } catch (_) {
                  }
                  try {
                    await this._fetchTrakt();
                    this._reRenderRight(true);
                  } catch (_) {
                  }
                })();
              }, 320);
            }, 580);
          });
        });
      });
    });
    this.shadowRoot.querySelectorAll(".trakt-ni-ol:not(.sa-skip-ol):not(.mus-skip-ol)").forEach(
      (btn) => _traktDismiss(btn, (type, slug) => {
        const mediaType = type === "tv" ? "shows" : "movies";
        return this._callApi("DELETE", `arr_stack/trakt/recommendations/${mediaType}/${encodeURIComponent(slug)}`);
      })
    );
    const _saDecide = (btn, endpoint) => {
      if (btn._saWired) return;
      btn._saWired = true;
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        this._markActivated();
        const id = parseInt(btn.dataset.saId, 10);
        const card = btn.closest(".mc");
        if (!id) return;
        if (card) {
          card.style.transition = "opacity 0.28s ease, transform 0.28s ease";
          card.style.opacity = "0";
          card.style.transform = "scale(0.85)";
        }
        setTimeout(async () => {
          this._suggestarr = (this._suggestarr || []).filter((m) => m._saId !== id);
          this._reRenderRight(true);
          try {
            await this._callApi("POST", `arr_stack/suggestarr/${endpoint}`, { ids: [id] });
          } catch (_) {
          }
          const left = (this._suggestarr || []).length;
          if (this._suggestarrBaseline > 1 && left < this._suggestarrBaseline / 2) {
            try {
              const r = await this._callApi("POST", "arr_stack/suggestarr/refresh", {});
              if (r?.ok) {
                this._suggestarrRefreshing = true;
                this._suggestarrPendingFrom = left;
                this._reRenderRight(true);
                const SA_POLLS = [20, 45, 90, 150, 240, 330, 420, 510, 600];
                SA_POLLS.forEach((s) => setTimeout(async () => {
                  if (!this._suggestarrRefreshing) return;
                  await this._fetchSuggestArr();
                  this._reRenderRight(true);
                }, s * 1e3));
                setTimeout(() => {
                  if (!this._suggestarrRefreshing) return;
                  this._suggestarrRefreshing = false;
                  this._reRenderRight(true);
                }, 63e4);
              }
            } catch (_) {
            }
          }
        }, 300);
      });
    };
    this.shadowRoot.querySelectorAll(".sa-seen-ol").forEach((btn) => _saDecide(btn, "reject"));
    this.shadowRoot.querySelectorAll(".sa-skip-ol").forEach((btn) => _saDecide(btn, "blacklist"));
  }
};
var wireMixin = _WireMethods.prototype;


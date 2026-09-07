
var _WireMusicMethods = class {
  // Delegated on col-right, which survives every re-render of the sections
  // inside it — a listener on the cards themselves would be lost on the next
  // repaint, which is how this row lost its clicks the first time round.
  _wireMusicCards(right) {
    if (!right || right._musicWired) return;
    right._musicWired = true;
    right.addEventListener("click", (e) => {
      const albumCard = e.target.closest("[data-album-cal]");
      if (albumCard) {
        e.stopPropagation();
        this._openCalAlbumArtist(Number(albumCard.dataset.albumCal));
        return;
      }
      const likeOl = e.target.closest(".mus-like-ol");
      if (likeOl) {
        e.stopPropagation();
        this._musDropSuggestion(likeOl.dataset.musMbid, "like", likeOl.closest(".mc"));
        return;
      }
      const skipOl = e.target.closest(".mus-skip-ol");
      if (skipOl) {
        e.stopPropagation();
        this._musDropSuggestion(skipOl.dataset.musMbid, "skip", skipOl.closest(".mc"));
        return;
      }
      const addBtn = e.target.closest("[data-mus-add]");
      if (addBtn) {
        e.stopPropagation();
        const inSearch = !!addBtn.closest(".search-results-wrap");
        this._musOpenAdd(addBtn.dataset.musAdd, inSearch ? "search" : "lastfm");
        return;
      }
      if (e.target.closest(".mus-add-cancel")) {
        e.stopPropagation();
        const src = this._musAddPending?.source;
        this._musAddPending = null;
        if (src === "lastfm") this._reRenderSection("recommendations");
        else this._reRenderSearchResults();
        const hit = mbid ? [...this._lidarrArtists?.values() || []].find((a) => String(a.foreignArtistId || "").toLowerCase() === mbid) : null;
        if (hit?.id && this._musicModal?.preview === mbid) this._openMusicModal(hit.id);
        this._musScheduleLastfmRefresh();
        return;
      }
      if (e.target.closest(".mus-add-confirm")) {
        e.stopPropagation();
        this._musConfirmAdd();
        return;
      }
      const unowned = e.target.closest("[data-artist-unowned]");
      if (unowned) {
        e.stopPropagation();
        this._openMusicPreview(unowned.dataset.artistUnowned);
        return;
      }
      const card = e.target.closest(".mc-music[data-artist-id]");
      if (!card) return;
      e.stopPropagation();
      this._openMusicModal(Number(card.dataset.artistId), { stream: card.dataset.streamEntity || null });
    });
  }
  // The detail for an artist Lidarr has never heard of. Everything the record
  // itself carries is drawn as usual; the albums come from MusicBrainz, and the
  // covers from the Cover Art Archive, which answers on a release group's id
  // without a key.
  _musUnownedArtist(mbid2) {
    const inSearch = (this._searchResults || []).find((r) => r.mediaType === "music" && r.artist?.foreignArtistId === mbid2);
    if (inSearch?.artist) return inSearch.artist;
    const inSug = (this._lastfm || []).find((r) => r.artist?.foreignArtistId === mbid2);
    return inSug?.artist || null;
  }
  async _openMusicPreview(mbid2) {
    const artist = this._musUnownedArtist(mbid2);
    if (!artist) return;
    const hit = { artist };
    this._musPanelH = null;
    this._musDescH = null;
    this._musAlbH = null;
    this._musicModal = {
      artistId: null,
      artist: hit.artist,
      albums: [],
      loading: true,
      preview: mbid2
    };
    this._renderMusicModalEl();
    let list = [];
    try {
      list = await this._callApi("GET", `arr_stack/lidarr/mbalbums?mbid=${encodeURIComponent(mbid2)}`);
    } catch (e) {
      console.warn("[arr-card] MusicBrainz discography failed:", e);
    }
    if (this._musicModal?.preview !== mbid2) return;
    this._musicModal.albums = (Array.isArray(list) ? list : []).map((a) => ({
      id: null,
      mbId: a.id,
      title: a.title,
      releaseDate: a.releaseDate,
      statistics: null,
      _mbCover: `https://coverartarchive.org/release-group/${a.id}/front-250`
    }));
    this._musicModal.loading = false;
    this._renderMusicModalEl();
  }
  // Adding from the preview: unmonitored, nothing searched for, so a search can
  // run against a record that now exists. The overlay's questions are skipped —
  // this is the quick way in, and the detail that follows is where monitoring
  // and profiles are changed.
  async _musAddFromPreview() {
    const m = this._musicModal;
    if (!m?.preview || m.adding) return null;
    m.adding = true;
    try {
      const opts = await this._fetchLidarrAddOptions();
      const res = await this._addLidarrArtist(m.artist, {
        profileId: opts.quality?.[0]?.id ?? 1,
        metadataId: opts.metadata?.[0]?.id ?? 1,
        rootFolder: opts.rootFolders?.[0]?.path || "",
        monitor: "none"
      });
      if (!res?.id) throw new Error("no id returned");
      await this._openMusicModal(Number(res.id));
      return Number(res.id);
    } catch (e) {
      console.error("[arr-card] add from preview failed:", e);
      if (this._musicModal) {
        this._musicModal.adding = false;
        this._renderMusicModalEl();
      }
      return null;
    }
  }
  async _musDropSuggestion(mbid2, verdict, cardEl) {
    const id = String(mbid2 || "").toLowerCase();
    if (!id) return;
    this._markActivated();
    const skip = verdict === "skip";
    if (cardEl) {
      cardEl.style.transition = "opacity 0.28s ease, transform 0.28s ease";
      cardEl.style.opacity = "0";
      cardEl.style.transform = "scale(0.85)";
      await new Promise((r) => setTimeout(r, 280));
    }
    this._lastfm = (this._lastfm || []).filter((r) => String(r.artist?.foreignArtistId || "").toLowerCase() !== id);
    this._musSkipped = (this._musSkipped || /* @__PURE__ */ new Set()).add(id);
    this._musAddedEntries?.delete(id);
    this._musAdded?.delete(id);
    const perPage = this._perPage("recommendations");
    const count = this._hasSeeMore("recommendations") ? this._smpPageCount(this._recItems(), "recommendations") : (this._lastfm || []).length;
    const last = Math.max(0, Math.ceil(count / perPage) - 1);
    if ((this._pages.recommendations || 0) > last) {
      this._pages.recommendations = last;
      this._pageDir.recommendations = "prev";
    }
    this._reRenderSection("recommendations");
    this._pageDir.recommendations = "";
    try {
      await this._callApi("POST", `arr_stack/lastfm/${skip ? "skips" : "likes"}`, { mbid: id });
    } catch (e) {
      console.warn("[arr-card] suggestion verdict failed:", e);
    }
    if (!(this._lastfm || []).length) {
      await this._fetchLastfm({ refresh: true });
      this._reRenderSection("recommendations");
      return;
    }
    this._musScheduleLastfmRefresh();
  }
  // Rebuilding the suggestions costs a Last.fm round per seed plus a Lidarr
  // lookup per hit, so a run of clicks waits for the last one. It also runs in
  // the background: the row the reader is working through stays as it is until
  // the answer arrives.
  _musScheduleLastfmRefresh(delay = 1500) {
    clearTimeout(this._lastfmRefreshT);
    this._lastfmRefreshT = setTimeout(async () => {
      if (this._lastfmRefreshing) {
        this._musScheduleLastfmRefresh(800);
        return;
      }
      this._lastfmRefreshing = true;
      try {
        await this._fetchLastfm({ refresh: true });
        if (!this._musAddPending) this._reRenderSection("recommendations");
      } catch (e) {
        console.warn("[arr-card] suggestion refresh failed:", e);
      } finally {
        this._lastfmRefreshing = false;
      }
    }, delay);
  }
  // The artist behind the plus, and what Lidarr needs to be told before it can
  // hold one.
  async _musOpenAdd(mbid2, source = "search") {
    const artist = this._musUnownedArtist(mbid2);
    if (!artist) return;
    const hit = { artist };
    this._musAddPending = { artist: hit.artist, loading: true, opts: null, source };
    this._musAddRepaint();
    const opts = await this._fetchLidarrAddOptions();
    if (!this._musAddPending) return;
    this._musAddPending = {
      source,
      artist: hit.artist,
      loading: false,
      opts,
      profileId: opts.quality?.[0]?.id ?? 1,
      metadataId: opts.metadata?.[0]?.id ?? 1,
      rootFolder: opts.rootFolders?.[0]?.path || "",
      // Adding an act should not pull its back catalogue by surprise; the
      // discography in the detail is where albums are chosen.
      monitor: "future",
      busy: false
    };
    this._musAddRepaint();
  }
  // The overlay lives in whichever row it was opened from.
  _musAddRepaint() {
    if (this._musAddPending?.source === "lastfm") this._reRenderSection("recommendations");
    else this._reRenderSearchResults();
  }
  _wireMusAddSelects(root) {
    root?.querySelectorAll(".mus-add-overlay select").forEach((sel) => {
      if (sel._musWired) return;
      sel._musWired = true;
      sel.addEventListener("change", () => {
        this._tbSyncSelect(sel);
        const p = this._musAddPending;
        if (!p) return;
        if (sel.id === "mus-add-profile") p.profileId = sel.value;
        if (sel.id === "mus-add-monitor") p.monitor = sel.value;
        if (sel.id === "mus-add-meta") p.metadataId = sel.value;
        if (sel.id === "mus-add-root") p.rootFolder = sel.value;
      });
    });
  }
  async _musConfirmAdd() {
    const p = this._musAddPending;
    if (!p || p.busy || !p.artist) return;
    this._markActivated();
    const root = this.shadowRoot;
    const _val = (id, fallback) => root.querySelector(`#${id}`)?.value ?? fallback;
    p.profileId = _val("mus-add-profile", p.profileId);
    p.monitor = _val("mus-add-monitor", p.monitor);
    p.metadataId = _val("mus-add-meta", p.metadataId);
    p.rootFolder = _val("mus-add-root", p.rootFolder);
    p.busy = true;
    this._musAddRepaint();
    const src = p.source;
    try {
      const res = await this._addLidarrArtist(p.artist, p);
      const mbid2 = String(p.artist?.foreignArtistId || "").toLowerCase();
      if (mbid2) {
        this._musAdded.add(mbid2);
        this._musAddedEntries = this._musAddedEntries || /* @__PURE__ */ new Map();
        const kept = (this._lastfm || []).find((r) => String(r.artist?.foreignArtistId || "").toLowerCase() === mbid2) || { artist: p.artist, score: 0, seed: "" };
        this._musAddedEntries.set(mbid2, kept);
      }
      await this._fetchLidarrQueue();
      p.busy = false;
      p.done = true;
      this._musAddRepaint();
      await new Promise((r) => setTimeout(r, 900));
      if (this._musAddPending !== p) return;
      this._musAddPending = null;
      if (src === "lastfm") this._reRenderSection("recommendations");
      else this._reRenderSearchResults();
      if (res?.id && this._musicModal?.preview === mbid2) this._openMusicModal(res.id);
      this._musScheduleLastfmRefresh();
    } catch (e) {
      const already = JSON.stringify(e?.body || "").includes("ArtistExistsValidator");
      if (already) {
        const mbid2 = String(p.artist?.foreignArtistId || "").toLowerCase();
        this._lidarrArtistsAt = 0;
        await this._fetchLidarrArtists();
        if (mbid2) {
          this._musAdded.add(mbid2);
          this._musAddedEntries = this._musAddedEntries || /* @__PURE__ */ new Map();
          const kept = (this._lastfm || []).find((r) => String(r.artist?.foreignArtistId || "").toLowerCase() === mbid2) || { artist: p.artist, score: 0, seed: "" };
          this._musAddedEntries.set(mbid2, kept);
        }
        await this._fetchLidarrQueue();
        p.busy = false;
        p.done = true;
        this._musAddRepaint();
        await new Promise((r) => setTimeout(r, 900));
        if (this._musAddPending !== p) return;
        this._musAddPending = null;
        if (src === "lastfm") this._reRenderSection("recommendations");
        else this._reRenderSearchResults();
        return;
      }
      console.error("[arr-card] Lidarr add failed:", e);
      if (this._musAddPending) {
        this._musAddPending.busy = false;
        this._musAddRepaint();
      }
    }
  }
  async _openAlbumModal(album) {
    if (!album?.id) return;
    if (this._calendarModalOpen) {
      this._albumCalReturn = true;
      this._calendarModalOpen = false;
      this._renderCalendarModalEl();
    }
    const artist = this._lidarrArtists?.get(album.artistId) || album.artist || {};
    this._albumModal = { albumId: album.id, album, artist, tracks: null };
    this._renderAlbumModalEl();
    try {
      const list = await this._callApi("GET", `arr_stack/lidarr/tracks?albumId=${album.id}`);
      if (this._albumModal?.albumId !== album.id) return;
      this._albumModal.tracks = Array.isArray(list) ? list : [];
    } catch (e) {
      console.warn("[arr-card] Lidarr tracks failed:", e);
      if (this._albumModal?.albumId === album.id) this._albumModal.tracks = [];
    }
    this._renderAlbumModalEl();
  }
  // The record the tile was drawn from, wherever it came from — the row's
  // calendar or the modal's own window.
  // A calendar tile is an album, but what the reader wants behind it is the
  // artist — the discography, the monitoring, the search. The album detail is
  // still one click further in, from its own row.
  _openCalAlbumArtist(albumId) {
    const album = this._calAlbumById(albumId);
    const artistId = album?.artistId || album?.artist?.id;
    if (artistId) this._openMusicModal(Number(artistId));
    else if (album) this._openAlbumModal(album);
  }
  _calAlbumById(id) {
    return (this._calendar || []).find((e) => e._mediaType === "music" && e.id === id) || (this._calendarModalData || []).find((e) => e._mediaType === "music" && e.id === id) || null;
  }
  _closeAlbumModal() {
    this._albumModal = null;
    this._renderAlbumModalEl();
    if (this._albumCalReturn) {
      this._albumCalReturn = false;
      this._calendarModalOpen = true;
      this._renderCalendarModalEl();
    }
  }
  _renderAlbumModalEl() {
    const root = this.shadowRoot;
    if (!root) return;
    root.querySelector("[data-album-modal]")?.remove();
    if (!this._albumModal) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = this._albumModalHtml();
    const el = wrap.firstElementChild;
    if (!el) return;
    root.appendChild(el);
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-album-close]") || e.target === el) {
        this._closeAlbumModal();
      }
    });
  }
  async _openMusicModal(artistId, { stream = null } = {}) {
    if (!artistId) return;
    this._markActivated();
    const artist = this._lidarrArtists?.get(artistId) || (this._lidarrArtistFeed || []).find((e) => e.id === artistId)?.artist || null;
    if (!artist) return;
    this._musPanelH = null;
    this._musDescH = null;
    this._musAlbH = null;
    this._musQueueSigLast = null;
    this._musicModal = { artistId, artist, albums: [], loading: true, stream };
    this._renderMusicModalEl();
    const [full, albums] = await Promise.all([
      this._fetchLidarrArtist(artistId),
      this._fetchLidarrDiscography(artistId),
      this._fetchLidarrQueue()
    ]);
    if (full && this._musicModal?.artistId === artistId) this._musicModal.artist = full;
    if (this._musicModal?.artistId !== artistId) return;
    this._musicModal.albums = albums;
    this._musicModal.loading = false;
    this._renderMusicModalEl();
  }
  async _musOpenAlbum(albumId) {
    const m = this._musicModal;
    if (!m || !albumId) return;
    if (!m.search) {
      m.search = { mode: "is", searched: /* @__PURE__ */ new Set(), grabbed: /* @__PURE__ */ new Set() };
      m.menu = null;
    } else {
      m.search.mode = "is";
    }
    await this._musPickAlbum(albumId);
    requestAnimationFrame(() => {
      const row = this.shadowRoot?.querySelector(`[data-music-modal] [data-album-row="${albumId}"]`);
      row?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }
  async _musPickAlbum(albumId) {
    const m = this._musicModal;
    const sp = m?.search;
    if (!sp || !albumId) return;
    const album = (m.albums || []).find((a) => a.id === albumId);
    if (sp.mode === "as") {
      sp.busyAlbum = albumId;
      this._renderMusicModalEl();
      try {
        await this._callApi("POST", "arr_stack/lidarr/command", { name: "AlbumSearch", albumIds: [albumId] });
        sp.searched = sp.searched || /* @__PURE__ */ new Set();
        sp.searched.add(albumId);
      } catch (e) {
        console.error("[arr-card] Lidarr album search error:", e);
      }
      sp.busyAlbum = null;
      this._renderMusicModalEl();
      return;
    }
    if (sp.albumId === albumId) {
      sp.albumId = null;
      sp.state = null;
      sp.results = [];
      this._renderMusicModalEl();
      return;
    }
    sp.state = "loading";
    sp.albumId = albumId;
    sp.albumTitle = album?.title || "";
    this._renderMusicModalEl();
    try {
      const res = await this._callApi("GET", `arr_stack/lidarr/release?albumId=${albumId}`);
      if (this._musicModal?.search !== sp) return;
      sp.results = (Array.isArray(res) ? res : []).sort((a, b) => (b.customFormatScore ?? 0) - (a.customFormatScore ?? 0) || (b.seeders ?? 0) - (a.seeders ?? 0));
      sp.state = "results";
    } catch (e) {
      sp.state = "error";
      sp.error = e?.body?.message || String(e?.error || e);
    }
    this._renderMusicModalEl();
  }
  // Same gesture and threshold the poster rows use, so paging the covers feels
  // like paging anything else in the card.
  _wireMusSwipe(el) {
    const wrap = el?.querySelector(".mus-alb-wrap");
    if (!wrap) return;
    const THRESHOLD = 40;
    let startX = null;
    wrap.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });
    wrap.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) < THRESHOLD) return;
      const m = this._musicModal;
      if (!m) return;
      const per = Math.max(2, (m.cols || 4) * 2);
      const pages = Math.max(1, Math.ceil((m.albums || []).length / per));
      const cur = m.albPage || 0;
      const next = dx < 0 ? cur + 1 : cur - 1;
      if (next < 0 || next > pages - 1) return;
      m.albPage = next;
      this._renderMusicModalEl();
    }, { passive: true });
  }
  // How many covers fit across is a layout answer, not a guess: read it from the
  // grid the browser has just laid out, and only redraw if the page size changed.
  _musMeasureCols(el) {
    const grid = el?.querySelector(".mus-alb-grid");
    const tile = el?.querySelector(".mus-alb");
    const m = this._musicModal;
    if (!grid || !m) return;
    const cols = getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length;
    const tileH = tile?.getBoundingClientRect().height || 0;
    const wrap = el.querySelector(".mus-alb-wrap") || grid;
    const gap = this._isMob ? 8 : 12;
    const avail = wrap.getBoundingClientRect().height;
    const rows = !tileH ? 2 : Math.max(1, Math.floor((avail + gap) / (tileH + gap)));
    if ((!cols || cols === m.cols) && rows === m.rows) return;
    const per = Math.max(2, (cols || m.cols || 4) * rows);
    const pages = Math.max(1, Math.ceil((m.albums?.length || 0) / per));
    m.albPage = Math.min(m.albPage || 0, pages - 1);
    if (cols) m.cols = cols;
    m.rows = rows;
    this._renderMusicModalEl();
  }
  // Opens reaching up to just under the header rather than to its own content
  // height, so two albums fill the modal the same as twenty. Once dragged, the
  // height the user chose wins.
  _musSizePanel(el) {
    const panel = el?.querySelector(".mus-search");
    const body = el?.querySelector(".mus-modal-body");
    const head = el?.querySelector(".mus-content");
    if (!panel || !body) return;
    const h = this._musPanelH || Math.round(
      body.getBoundingClientRect().bottom - (head?.getBoundingClientRect().bottom ?? 0) - 8
    );
    if (h > 80) {
      panel.style.height = `${h}px`;
      this._musPanelH = h;
    }
  }
  // The grabber trades height between the sources panel and the discography.
  // Applied inline while dragging rather than through a re-render — repainting
  // the release table on every pointer move is what makes that feel sticky.
  _wireMusPanelDrag(el) {
    const handle = el.querySelector("[data-mus-grab-handle]");
    const panel = el.querySelector(".mus-search");
    if (!handle || !panel) return;
    const glass = panel.closest(".popup-glass");
    handle.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      const startY = ev.clientY;
      const startH = panel.getBoundingClientRect().height;
      const max = Math.max(200, (glass?.getBoundingClientRect().height || 600) * 0.7);
      handle.classList.add("is-dragging");
      handle.setPointerCapture(ev.pointerId);
      const move = (e) => {
        const h = Math.round(Math.min(max, Math.max(120, startH - (e.clientY - startY))));
        panel.style.height = `${h}px`;
        this._musPanelH = h;
      };
      const up = (e) => {
        handle.classList.remove("is-dragging");
        try {
          handle.releasePointerCapture(ev.pointerId);
        } catch (_) {
        }
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
    });
  }
  // Two rows of covers is what the sheet opens on: measured once from a real
  // tile, since a cover's height depends on how many fit across. A drag then
  // sets the height and that is what the modal keeps.
  _musFitAlbums(el) {
    if (!el?.isConnected) return;
    if (this._musAlbH != null) return;
    const albums = el?.querySelector(".mus-albums");
    const tile = el?.querySelector(".mus-alb");
    const grab = el?.querySelector(".mus-alb-grab");
    if (!albums || !tile) return;
    const rowGap = this._isMob ? 8 : 12;
    const chrome = (grab?.getBoundingClientRect().height || 0) + 8 + 18;
    const rows = this._musicModal?.stream ? 1 : 2;
    const tileH = tile.getBoundingClientRect().height;
    const max = this._musAlbMax(el);
    const fit = Math.max(1, Math.floor((max - chrome + rowGap) / (tileH + rowGap)));
    const want = Math.min(rows, fit);
    const h = Math.round(tileH * want + rowGap * (want - 1) + chrome);
    this._musAlbH = Math.max(120, Math.min(max, h));
    albums.style.height = `${this._musAlbH}px`;
  }
  // As far up as the backdrop, which is where the sources panel stops too.
  _musAlbMax(el) {
    const body = el?.querySelector(".mus-modal-body");
    const back = el?.querySelector(".mus-backdrop");
    if (!body) return 400;
    const bottom = body.getBoundingClientRect().bottom;
    const top = back?.getBoundingClientRect().bottom ?? body.getBoundingClientRect().top;
    return Math.max(160, Math.round(bottom - top));
  }
  // The grabber the sources panel has, on the discography — applied inline
  // while dragging for the same reason: repainting a page of covers on every
  // pointer move is what makes it feel sticky.
  _wireMusAlbDrag(el) {
    const handle = el.querySelector("[data-mus-alb-handle]");
    const panel = el.querySelector(".mus-albums");
    if (!handle || !panel) return;
    handle.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      const startY = ev.clientY;
      const startH = panel.getBoundingClientRect().height;
      const max = this._musAlbMax(el);
      const tileH = el.querySelector(".mus-alb")?.getBoundingClientRect().height || 0;
      const gap = this._isMob ? 8 : 12;
      const chrome = (handle.getBoundingClientRect().height || 0) + 8 + 18;
      const snap = (raw) => {
        if (!tileH) return Math.max(120, raw);
        const rows = Math.max(1, Math.round((raw - chrome + gap) / (tileH + gap)));
        return Math.round(chrome + rows * tileH + gap * (rows - 1));
      };
      handle.classList.add("is-dragging");
      handle.setPointerCapture(ev.pointerId);
      const move = (e) => {
        const raw = startH - (e.clientY - startY);
        const h = Math.round(Math.min(max, Math.max(120, snap(raw))));
        panel.style.height = `${h}px`;
        this._musAlbH = h;
      };
      const up = () => {
        handle.classList.remove("is-dragging");
        try {
          handle.releasePointerCapture(ev.pointerId);
        } catch (_) {
        }
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
        const m = this._musicModal;
        if (m) m.rows = null;
        this._renderMusicModalEl();
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
    });
  }
  // Monitoring, from the bookmark. Lidarr wants the whole record back rather
  // than a patch, the same as the menu entry that used to do this.
  async _musToggleArtist() {
    const m = this._musicModal;
    if (!m?.artist) return;
    this._markActivated();
    const next = { ...m.artist, monitored: !m.artist.monitored };
    m.artist = next;
    this._renderMusicModalEl();
    try {
      await this._callApi("PUT", `arr_stack/lidarr/artist/${m.artistId}`, next);
    } catch (e) {
      console.error("[arr-card] Lidarr monitor error:", e);
      if (this._musicModal?.artistId === m.artistId) {
        this._musicModal.artist = { ...next, monitored: !next.monitored };
        this._renderMusicModalEl();
      }
      return;
    }
    const full = await this._fetchLidarrArtist(m.artistId);
    if (full && this._musicModal?.artistId === m.artistId) {
      this._musicModal.artist = full;
      this._renderMusicModalEl();
    }
  }
  // The library, on Music, on the page this artist is actually on — the same
  // trip Show in library makes for a film.
  _musShowInLibrary() {
    const id = this._musicModal?.artistId;
    this._closeMusicModal();
    this._libReturnState = null;
    this._openLibModal("music");
    const m = this._libModal;
    if (!m || !id) return;
    m.typeKey = "music";
    m.qualityKey = null;
    m.search = "";
    m.page = 0;
    const el = this.shadowRoot.querySelector("[data-lib-modal]");
    const body = el?.querySelector("#lib-body");
    if (!body) return;
    body.innerHTML = this._libBodyHtml();
    this._wireLibModalBody(el);
    const idx = (this._libFilteredItems() || []).findIndex((i) => i.id === id);
    const per = m._perPage || 0;
    if (idx >= 0 && per > 0) {
      const page = Math.floor(idx / per);
      if (page !== m.page) {
        m.page = page;
        body.innerHTML = this._libBodyHtml();
        this._wireLibModalBody(el);
      }
    }
    this._libFlashArtist = id;
    body.innerHTML = this._libBodyHtml();
    this._wireLibModalBody(el);
    requestAnimationFrame(() => {
      this.shadowRoot.querySelector(`[data-lib-modal] [data-artist-id="${id}"]`)?.scrollIntoView({ block: "nearest" });
    });
    clearTimeout(this._libFlashTimer);
    this._libFlashTimer = setTimeout(() => {
      this._libFlashArtist = null;
      const b = this.shadowRoot.querySelector("[data-lib-modal] #lib-body");
      const e2 = this.shadowRoot.querySelector("[data-lib-modal]");
      if (b && this._libModal) {
        b.innerHTML = this._libBodyHtml();
        this._wireLibModalBody(e2);
      }
    }, 2400);
  }
  // Patches one drawer in place: a re-render would close the menu the moment
  // its contents arrived.
  _musPatchDrawer(kind) {
    if (this._musicModal?.menuSub !== kind) return;
    const el = this.shadowRoot?.querySelector("[data-music-modal] .qa-drawer");
    if (!el) return;
    el.innerHTML = kind === "cast" ? this._musCastRowsHtml() : this._musStatsRowsHtml();
  }
  async _musCast(entityId) {
    const m = this._musicModal;
    const name = m?.artist?.artistName;
    if (!entityId || !name) return;
    this._musCastErr = null;
    try {
      const hit = await this._callApi("GET", `arr_stack/plex/artist?name=${encodeURIComponent(name)}`);
      if (!hit?.plex_key) throw new Error("artist not on Plex");
      const contentId = {};
      if (hit.library) contentId.library_name = hit.library;
      if (hit.title) contentId.artist_name = hit.title;
      await this._hass.callService("media_player", "play_media", {
        entity_id: entityId,
        media_content_type: "plex",
        media_content_id: JSON.stringify(contentId)
      });
      m.menu = null;
      m.menuSub = null;
      this._renderMusicModalEl();
    } catch (err) {
      console.warn("[arr-card] Plex cast refused:", err?.message || err);
    }
  }
  async _musToggleTracks(albumId) {
    const sp = this._musicModal?.search;
    if (!sp) return;
    sp.tracks = sp.tracks || /* @__PURE__ */ new Map();
    if (sp.expanded === albumId) {
      sp.expanded = null;
      this._renderMusicModalEl();
      return;
    }
    sp.expanded = albumId;
    this._renderMusicModalEl();
    if (sp.tracks.has(albumId)) return;
    try {
      const list = await this._callApi("GET", `arr_stack/lidarr/tracks?albumId=${albumId}`);
      sp.tracks.set(albumId, Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("[arr-card] Lidarr tracks error:", e);
      sp.tracks.set(albumId, []);
    }
    if (this._musicModal?.search === sp) this._renderMusicModalEl();
  }
  async _musDeleteFiles(albumId) {
    const m = this._musicModal;
    const sp = m?.search;
    if (!sp) return;
    sp.delConfirm = null;
    sp.delBusy = albumId;
    this._renderMusicModalEl();
    try {
      const files = await this._callApi("GET", `arr_stack/lidarr/trackfiles?albumId=${albumId}`);
      const ids = (Array.isArray(files) ? files : []).map((f) => f.id).filter(Boolean);
      if (ids.length) {
        await this._callApi("DELETE", `arr_stack/lidarr/trackfiles?ids=${ids.join(",")}`);
      }
      const fresh = await this._fetchLidarrDiscography(m.artistId);
      if (this._musicModal?.artistId === m.artistId && fresh.length) m.albums = fresh;
      sp.tracks?.delete(albumId);
    } catch (e) {
      console.error("[arr-card] Lidarr delete files error:", e);
    }
    sp.delBusy = null;
    this._renderMusicModalEl();
  }
  async _musToggleAlbum(albumId) {
    const m = this._musicModal;
    const sp = m?.search;
    const album = (m?.albums || []).find((a) => a.id === albumId);
    if (!sp || !album) return;
    sp.monBusy = albumId;
    this._renderMusicModalEl();
    try {
      const next = { ...album, monitored: !album.monitored };
      await this._callApi("PUT", `arr_stack/lidarr/album/${albumId}`, next);
      m.albums = m.albums.map((a) => a.id === albumId ? next : a);
    } catch (e) {
      console.error("[arr-card] Lidarr album monitor error:", e);
    }
    sp.monBusy = null;
    this._renderMusicModalEl();
  }
  async _musGrab(guid) {
    const sp = this._musicModal?.search;
    if (!sp) return;
    const release = (sp.results || []).find((r) => r.guid === guid);
    if (!release) return;
    sp.grabbing = guid;
    this._renderMusicModalEl();
    try {
      await this._callApi("POST", "arr_stack/lidarr/release", { ...release, albumId: sp.albumId });
      sp.grabbed = sp.grabbed || /* @__PURE__ */ new Set();
      sp.grabbed.add(guid);
    } catch (e) {
      console.error("[arr-card] Lidarr grab error:", e);
    }
    sp.grabbing = null;
    this._renderMusicModalEl();
    for (const ms of [0, 2e3, 5e3, 1e4, 2e4]) {
      setTimeout(async () => {
        if (!this._musicModal) return;
        await this._fetchLidarrQueue();
        if (this._musicModal) this._renderMusicModalEl();
        this._reRenderSection?.("recentlyRequested");
      }, ms);
    }
  }
  // The dropdown belongs under the button that opened it. Anchored in script
  // for the same reason the film popup does it: the three triggers sit in a
  // flex capsule whose widths shift with state, so no fixed offset holds.
  _musPositionMenu(el) {
    const menu = el?.querySelector(".mus-menu");
    if (!menu) return;
    const glass = menu.closest(".popup-glass");
    const trigger = el.querySelector(`[data-mus-menu="${this._musicModal?.menu}"]`);
    if (!glass || !trigger) return;
    const g = glass.getBoundingClientRect();
    const b = trigger.getBoundingClientRect();
    const w = menu.getBoundingClientRect().width;
    const PAD = 12;
    const left = Math.max(PAD, Math.min(b.left - g.left, g.width - w - PAD));
    menu.style.left = `${Math.round(left)}px`;
    menu.style.right = "auto";
    menu.style.top = `${Math.round(b.bottom - g.top + 6)}px`;
  }
  async _musAction(act) {
    const m = this._musicModal;
    if (!m) return;
    const id = m.artistId;
    this._markActivated();
    m.menu = null;
    m.busy = act.startsWith("search") ? "search" : act.startsWith("remove") ? "remove" : "actions";
    this._renderMusicModalEl();
    try {
      if (act === "as" || act === "is") {
        m.busy = null;
        if (m.preview) {
          if (act === "is") {
            m.search = { mode: "is", confirmAdd: true, searched: /* @__PURE__ */ new Set(), grabbed: /* @__PURE__ */ new Set() };
            this._renderMusicModalEl();
            return;
          }
          m.search = { mode: "as", adding: true, searched: /* @__PURE__ */ new Set(), grabbed: /* @__PURE__ */ new Set() };
          this._renderMusicModalEl();
          const id2 = await this._musAddFromPreview();
          if (!id2) return;
          const nm = this._musicModal;
          if (nm) nm.search = { mode: "as", searched: /* @__PURE__ */ new Set(), grabbed: /* @__PURE__ */ new Set() };
          this._renderMusicModalEl();
          return;
        }
        m.search = { mode: act, searched: /* @__PURE__ */ new Set(), grabbed: /* @__PURE__ */ new Set() };
        this._renderMusicModalEl();
        return;
      }
      if (act === "add-yes") {
        m.busy = null;
        const want = m.search?.wantAlbum || null;
        if (m.search) {
          m.search.confirmAdd = false;
          m.search.adding = true;
        }
        this._renderMusicModalEl();
        const id2 = await this._musAddFromPreview();
        if (!id2 || !this._musicModal) return;
        this._musicModal.search = { mode: "is", searched: /* @__PURE__ */ new Set(), grabbed: /* @__PURE__ */ new Set() };
        this._renderMusicModalEl();
        if (want) {
          const norm = (t) => String(t || "").toLowerCase().replace(/\s+/g, " ").trim();
          const hit = (this._musicModal.albums || []).find((a) => norm(a.title) === norm(want));
          if (hit?.id) this._musOpenAlbum(hit.id);
        }
        return;
      }
      if (act === "add-no") {
        m.busy = null;
        m.search = null;
        this._renderMusicModalEl();
        return;
      }
      if (act === "show-in-lib") {
        m.busy = null;
        this._musShowInLibrary();
        return;
      }
      if (act === "cast" || act === "stats") {
        m.busy = null;
        m.menu = "actions";
        m.menuSub = m.menuSub === act ? null : act;
        this._renderMusicModalEl();
        if (m.menuSub === "cast") this._fetchPlexClients({ silent: true, maxAge: 3e4 }).then(() => this._musPatchDrawer("cast"));
        if (m.menuSub === "stats") this._musLoadStats();
        return;
      }
      if (act === "search-missing") {
        await this._callApi("POST", "arr_stack/lidarr/command", { name: "ArtistSearch", artistId: id });
      } else if (act === "refresh") {
        await this._callApi("POST", "arr_stack/lidarr/command", { name: "RefreshArtist", artistId: id });
      } else if (act === "monitor" || act === "unmonitor") {
        const next = { ...m.artist, monitored: act === "monitor" };
        await this._callApi("PUT", `arr_stack/lidarr/artist/${id}`, next);
        m.artist = next;
      } else if (act === "remove-lib" || act === "remove-disc") {
        const files = act === "remove-disc" ? "true" : "false";
        await this._callApi("DELETE", `arr_stack/lidarr/artist/${id}?deleteFiles=${files}`);
        this._closeMusicModal();
        this._musForgetArtist(id);
        return;
      }
    } catch (e) {
      console.error("[arr-card] Lidarr action error:", act, e);
    }
    if (this._musicModal?.artistId !== id) return;
    this._musicModal.busy = null;
    const full = await this._fetchLidarrArtist(id);
    if (full && this._musicModal?.artistId === id) this._musicModal.artist = full;
    this._renderMusicModalEl();
  }
  // A deleted artist is still sitting in every list the card holds — the
  // library grid, Recently Requested, the recently added row, the queue tally,
  // the Last.fm card marked as added — and the next poll is minutes away. Drop
  // it from all of them at once rather than leaving posters that 404 on click.
  _musForgetArtist(id) {
    this._lidarrArtists?.delete(id);
    this._lidarrArtistFeed = (this._lidarrArtistFeed || []).filter((e) => e.id !== id);
    this._lidarrQueueArtists?.delete(id);
    for (const [mbid2, row] of this._musAddedEntries || /* @__PURE__ */ new Map()) {
      if ((row?.artist?.id ?? row?.id) === id) {
        this._musAddedEntries.delete(mbid2);
        this._musAdded?.delete(mbid2);
      }
    }
    this._reRenderSection?.("recentlyAdded");
    const libEl = this.shadowRoot?.querySelector("[data-lib-modal]");
    if (libEl && this._libModal) this._libRerenderBody?.(libEl);
  }
  // What the modal draws from the download queue: whether each of its albums is
  // in it and how far along, plus the artist's own furthest album.
  _musStreamAction(el, ev) {
    const eid = el.dataset.entity;
    const act = el.dataset.action;
    if (!eid) return;
    const st = this._hass?.states?.[eid];
    const feats = st?.attributes?.supported_features || 0;
    if (act === "stream-seek") {
      const rect = el.getBoundingClientRect();
      const x = ev.clientX ?? ev.changedTouches?.[0]?.clientX ?? 0;
      const dur = parseFloat(el.dataset.dur);
      if (dur > 0) {
        const next = Math.max(0, Math.min(1, (x - rect.left) / rect.width)) * dur;
        this._updateStreamFills(eid, next, dur);
        this._doSeek(eid, next);
      }
      return;
    }
    if (act === "stream-playpause") {
      const playing = st?.state === "playing";
      const svc = playing ? feats & 1 ? "media_pause" : feats & 16384 ? "media_play_pause" : null : feats & 16384 ? "media_play" : feats & 1 ? "media_play_pause" : null;
      if (svc) {
        try {
          this._hass.callService("media_player", svc, { entity_id: eid });
        } catch (_) {
        }
      }
      el.innerHTML = `<ha-icon icon="mdi:${playing ? "play" : "pause"}" style="--mdc-icon-size:26px"></ha-icon>`;
      return;
    }
    if (act === "stream-prev" || act === "stream-next") {
      const svc = act === "stream-prev" ? "media_previous_track" : "media_next_track";
      try {
        this._hass.callService("media_player", svc, { entity_id: eid });
      } catch (_) {
      }
      setTimeout(() => {
        if (this._musicModal?.stream === eid) this._renderMusicModalEl();
      }, 1500);
      return;
    }
  }
  _musQueueSig() {
    const m = this._musicModal;
    if (!m) return "";
    const albums = (m.albums || []).map((a) => `${a.id}:${this._lidarrQueue?.has(a.id) ? 1 : 0}:${this._lidarrQueuePct?.get(a.id) ?? ""}`).join(",");
    return `${this._lidarrQueueArtists?.get(m.artistId) ?? ""}|${albums}`;
  }
  _closeMusicModal() {
    this._musQueueSigLast = null;
    this._musicModal = null;
    this.shadowRoot?.querySelector("[data-music-modal]")?.remove();
  }
  _renderMusicModalEl() {
    const root = this.shadowRoot;
    if (!root) return;
    const prev = root.querySelector("[data-music-modal]");
    const keepScroll = prev?.querySelector(".sn-seasons-rows")?.scrollTop || 0;
    prev?.remove();
    if (!this._musicModal) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = this._musicModalHtml();
    const el = wrap.firstElementChild;
    if (!el) return;
    root.appendChild(el);
    if (keepScroll) {
      const rows = el.querySelector(".sn-seasons-rows");
      if (rows) rows.scrollTop = keepScroll;
    }
    requestAnimationFrame(() => {
      this._musPositionMenu(el);
      this._musSizePanel(el);
      this._musFitAlbums(el);
      this._musMeasureCols(el);
    });
    this._wireMusPanelDrag(el);
    this._wireMusAlbDrag(el);
    this._wireMusSwipe(el);
    el.addEventListener("click", (e) => {
      const menuBtn = e.target.closest("[data-mus-menu]");
      if (menuBtn) {
        e.stopPropagation();
        const kind = menuBtn.dataset.musMenu;
        if (kind === "search" && this._musicModal.search) {
          this._musicModal.search = null;
          this._musicModal.menu = null;
        } else {
          this._musicModal.menu = this._musicModal.menu === kind ? null : kind;
          if (!this._musicModal.menu) this._musicModal.menuSub = null;
        }
        this._renderMusicModalEl();
        return;
      }
      const act = e.target.closest("[data-mus-act]");
      if (act) {
        e.stopPropagation();
        this._musAction(act.dataset.musAct);
        return;
      }
      const prevTile = e.target.closest("[data-mus-prev-album]");
      if (prevTile) {
        e.stopPropagation();
        const m = this._musicModal;
        if (!m?.preview) return;
        m.search = {
          mode: "is",
          confirmAdd: true,
          wantAlbum: prevTile.dataset.musPrevAlbum,
          searched: /* @__PURE__ */ new Set(),
          grabbed: /* @__PURE__ */ new Set()
        };
        this._renderMusicModalEl();
        return;
      }
      const tile = e.target.closest(".mus-alb[data-album-id]");
      if (tile) {
        e.stopPropagation();
        this._musOpenAlbum(Number(tile.dataset.albumId));
        return;
      }
      const pg = e.target.closest("[data-mus-page]");
      if (pg) {
        e.stopPropagation();
        const dir = pg.dataset.musPage === "next" ? 1 : -1;
        this._musicModal.albPage = Math.max(0, (this._musicModal.albPage || 0) + dir);
        this._renderMusicModalEl();
        return;
      }
      const exp = e.target.closest("[data-mus-expand]");
      if (exp) {
        e.stopPropagation();
        this._musToggleTracks(Number(exp.dataset.musExpand));
        return;
      }
      const delBtn = e.target.closest("[data-mus-del]");
      if (delBtn) {
        e.stopPropagation();
        this._musicModal.search.delConfirm = Number(delBtn.dataset.musDel);
        this._renderMusicModalEl();
        return;
      }
      if (e.target.closest("[data-mus-del-no]")) {
        e.stopPropagation();
        this._musicModal.search.delConfirm = null;
        this._renderMusicModalEl();
        return;
      }
      const delYes = e.target.closest("[data-mus-del-yes]");
      if (delYes) {
        e.stopPropagation();
        this._musDeleteFiles(Number(delYes.dataset.musDelYes));
        return;
      }
      const strBtn = e.target.closest('[data-action^="stream-"]');
      if (strBtn) {
        e.stopPropagation();
        this._musStreamAction(strBtn, e);
        return;
      }
      const artistMon = e.target.closest(".mus-mon");
      if (artistMon) {
        e.stopPropagation();
        this._musToggleArtist();
        return;
      }
      const castBtn = e.target.closest("[data-mus-cast]");
      if (castBtn) {
        e.stopPropagation();
        this._musCast(castBtn.dataset.musCast);
        return;
      }
      const mon = e.target.closest("[data-mus-mon]");
      if (mon) {
        e.stopPropagation();
        this._musToggleAlbum(Number(mon.dataset.musMon));
        return;
      }
      const pick = e.target.closest("[data-mus-album]");
      if (pick) {
        e.stopPropagation();
        this._musPickAlbum(Number(pick.dataset.musAlbum));
        return;
      }
      const grab = e.target.closest("[data-mus-grab]");
      if (grab) {
        e.stopPropagation();
        this._musGrab(grab.dataset.musGrab);
        return;
      }
      if (e.target.closest("[data-music-close]") || e.target === el) {
        this._closeMusicModal();
        this._popupReturn?.();
        return;
      }
      if (this._musicModal?.search && !e.target.closest(".mus-search") && !e.target.closest("[data-mus-grab-handle]")) {
        this._musCloseSearch();
      }
    });
  }
  // The sheet drops out of sight before the state changes, so the discography
  // appears once it is gone rather than behind it mid-animation.
  _musCloseSearch() {
    const panel = this.shadowRoot?.querySelector("[data-music-modal] .mus-search");
    const done = () => {
      if (!this._musicModal) return;
      this._musicModal.search = null;
      this._renderMusicModalEl();
    };
    if (!panel) {
      done();
      return;
    }
    panel.classList.add("mus-fall");
    setTimeout(done, 200);
  }
};
var wireMusicMixin = _WireMusicMethods.prototype;


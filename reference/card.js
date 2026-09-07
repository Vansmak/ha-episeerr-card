
var ArrStackCard = class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._interval = null;
    this._fastInterval = null;
    this._initialized = false;
    this._pageBtnAbort = null;
    this._sort = "progress_desc";
    this._sortDeluge = "progress_desc";
    this._sortRtorrent = "progress_desc";
    this._radarr = [];
    this._radarrTotal = 0;
    this._radarr2 = [];
    this._radarr2Total = 0;
    this._radarr2Configured = null;
    this._radarr2ByTmdb = /* @__PURE__ */ new Map();
    this._sonarr = [];
    this._sonarrAll = [];
    this._sonarrTotal = 0;
    this._sonarr2 = [];
    this._sonarr2Total = 0;
    this._sonarr2Configured = null;
    this._sonarr2ByTvdb = /* @__PURE__ */ new Map();
    this._calendar = [];
    this._calendarModalOpen = false;
    this._calendarWeekOffset = 0;
    this._calendarModalData = [];
    this._calendarModalLoading = false;
    this._calReturnState = false;
    this._albumModal = null;
    this._musAddPending = null;
    this._lidarrAddOpts = null;
    this._albumCalReturn = false;
    this._calendarTab = localStorage.getItem("arr-cal-tab") || "all";
    this._calendarView = localStorage.getItem("arr-cal-view") === "month" ? "month" : "week";
    this._calendarMonthOffset = 0;
    this._calDayOpen = null;
    this._upcoming = [];
    this._tvUpcoming = [];
    this._trending = [];
    this._popular = [];
    this._trakt = [];
    this._traktConfigured = null;
    this._suggestarr = null;
    this._suggestarrConfigured = null;
    this._suggestarrBaseline = 0;
    this._suggestarrRefreshing = false;
    this._suggestarrPendingFrom = 0;
    this._tmdbOwnKey = true;
    this._dlMediaRadarr = /* @__PURE__ */ new Map();
    this._dlMediaRadarr2 = /* @__PURE__ */ new Map();
    this._dlMediaSonarr = /* @__PURE__ */ new Map();
    this._dlMediaSonarr2 = /* @__PURE__ */ new Map();
    this._dlHistRadarr = /* @__PURE__ */ new Map();
    this._dlHistRadarr2 = /* @__PURE__ */ new Map();
    this._dlHistSonarr = /* @__PURE__ */ new Map();
    this._dlHistSonarr2 = /* @__PURE__ */ new Map();
    this._tmdbInfoOpen = false;
    this._dlInfoOpen = false;
    this._ppMenu = null;
    this._ppSeasonPick = null;
    this._ppStats = null;
    this._ppJfId = null;
    this._traV2 = void 0;
    this._actImporting = /* @__PURE__ */ new Set();
    this._ppGrabWait = null;
    this._ppGrabTimer = null;
    this._plexClientsTs = 0;
    this._libPopupReturn = null;
    this._actPopupReturn = null;
    this._arrHosts = {};
    this._ppStatus = null;
    this._dlInfoName = "";
    this._prowlarrConfigured = null;
    this._prowlarr = null;
    this._qbit = [];
    this._qbitTransfer = {};
    this._qbitDiskFreeBytes = null;
    this._sab = {};
    this._sabLocalIp = null;
    this._sabPublicIp = null;
    this._sabVpnFetched = false;
    this._sabFailed = [];
    this._sabRetryBusy = null;
    this._sabDeleteBusy = null;
    this._qbCookies = null;
    this._capsLoaded = false;
    this._qbitConfigured = true;
    this._sabConfigured = true;
    this._nzbgetConfigured = true;
    this._nzbget = null;
    this._nzbgetQueue = [];
    this._nzbgetFailed = [];
    this._nzbgetCompleted = [];
    this._nzbgetBusy = false;
    this._nzbgetItemBusy = null;
    this._nzbgetConfirm = null;
    this._nzbgetRetryBusy = null;
    this._delugeConfigured = true;
    this._deluge = null;
    this._delugeQueue = [];
    this._delugeBusy = false;
    this._delugeItemBusy = null;
    this._delugeConfirm = null;
    this._gluetunConfigured = null;
    this._gluetunStatus = null;
    this._gluetunCountry = null;
    this._gluetunIp = null;
    this._gluetunProvider = null;
    this._rtorrentConfigured = null;
    this._rtorrentStatus = {};
    this._rtorrentQueue = [];
    this._rtorrentBusy = false;
    this._rtorrentItemBusy = null;
    this._rtorrentConfirm = null;
    this._bazarrConfigured = true;
    this._tautulliConfigured = true;
    this._tautulli = null;
    this._tautulliModal = null;
    this._jellystatConfigured = true;
    this._jellystat = null;
    this._jellystatModal = null;
    this._tracearrConfigured = true;
    this._tracearr = null;
    this._tracearrModal = null;
    this._maintainerrConfigured = true;
    this._maintainerr = null;
    this._maintainerrModal = null;
    this._maintainerrConstants = null;
    this._maintainerrLibraries = null;
    this._maintainerrArrServers = null;
    this._activityModal = null;
    this._actHistoryCache = null;
    this._actBlocklistCache = null;
    this._radarrQueueItems = [];
    this._radarr2QueueItems = [];
    this._bazarr = {};
    this._posterRatingsCache = /* @__PURE__ */ new Map();
    this._posterTmdbVoteCache = /* @__PURE__ */ new Map();
    this._libTvAudioCache = /* @__PURE__ */ new Map();
    this._libTvSubCache = /* @__PURE__ */ new Map();
    this._radarrQueueFailed = /* @__PURE__ */ new Set();
    this._radarrQueueActive = /* @__PURE__ */ new Set();
    this._radarr2QueueFailed = /* @__PURE__ */ new Set();
    this._radarr2QueueActive = /* @__PURE__ */ new Set();
    this._plexSessions = [];
    this._plexConfigured = null;
    this._plexLastFetch = 0;
    this._jellyfinSessions = [];
    this._jellyfinLastFetch = 0;
    this._embySessions = [];
    this._embyLastFetch = 0;
    this._kodiSessions = [];
    this._kodiLastFetch = 0;
    this._kodiEntityIds = /* @__PURE__ */ new Set();
    this._overseerrConfigured = null;
    this._tmdbPinged = false;
    this._seerrRadarr = null;
    this._seerrRadarr2 = null;
    this._confirmRemove = null;
    this._requestPending = null;
    this._pendingRequests = [];
    this._optimisticRequested = /* @__PURE__ */ new Set();
    this._withdrawnIds = /* @__PURE__ */ new Set();
    this._traktWatching = /* @__PURE__ */ new Set();
    this._myRequestIds = /* @__PURE__ */ new Map();
    this._familyPendingIds = /* @__PURE__ */ new Map();
    this._radarrProfiles = [];
    this._radarrTags = [];
    this._sonarrTags = [];
    this._radarrRootFolders = [];
    this._sonarrRootFolders = [];
    this._radarr2Profiles = [];
    this._radarr2Tags = [];
    this._radarr2RootFolders = [];
    this._sonarr2Profiles = [];
    this._sonarr2RootFolders = [];
    this._radarrDiskspace = [];
    this._radarr2Diskspace = [];
    this._sonarrDiskspace = [];
    this._sonarr2Diskspace = [];
    this._tvRequestPending = null;
    this._overlay = { section: null, page: 0, tvPending: null };
    this._overlayApiPage = {};
    this._overlayApiTotalPages = {};
    this._discoverLastFetch = {};
    this._seerrSonarr = null;
    this._seerrSonarr2 = null;
    this._sonarrProfiles = [];
    this._qbitBusy = false;
    this._sabBusy = false;
    this._qbitItemBusy = null;
    this._popup = null;
    this._isState = null;
    this._isResults = [];
    this._isFilters = { protocol: "", indexer: "", quality: "", lang: "" };
    this._isSort = { col: null, dir: 1 };
    this._isGrabbing = null;
    this._isGrabbed = /* @__PURE__ */ new Set();
    this._isConfirm = null;
    this._isError = null;
    this._snIsOpen = false;
    this._snExpandedSeasons = /* @__PURE__ */ new Set();
    this._snEpisodes = /* @__PURE__ */ new Map();
    this._snActiveIs = null;
    this._snMonitorBusy = null;
    this._popupMonExpand = false;
    this._popupMonBusy = null;
    this._popupMonAddInst = null;
    this._popupMonAddBusy = null;
    this._popupCastOpen = false;
    this._popupCastPage = 0;
    this._snIsState = null;
    this._snIsResults = [];
    this._snIsError = null;
    this._snIsFilter = "all";
    this._snIsFilters = { protocol: "", indexer: "", quality: "", lang: "" };
    this._snIsSort = { col: null, dir: 1 };
    this._snIsGrabbing = null;
    this._snIsGrabbed = /* @__PURE__ */ new Set();
    this._snIsHistory = {};
    this._searchExpand = null;
    this._plexCastOpen = false;
    this._plexCasting = null;
    this._plexClients = null;
    this._plexCastBtnRect = null;
    this._asOpen = false;
    this._asInstance = null;
    this._asState = null;
    this._asError = null;
    this._asMovieSearching = false;
    this._asMovieSearched = false;
    this._asSearchingItems = /* @__PURE__ */ new Set();
    this._asSearchedItems = /* @__PURE__ */ new Set();
    this._asDownloadingItems = /* @__PURE__ */ new Set();
    this._asNotFound = /* @__PURE__ */ new Set();
    this._asPolling = /* @__PURE__ */ new Set();
    this._radarrQueuePct = /* @__PURE__ */ new Map();
    this._radarr2QueuePct = /* @__PURE__ */ new Map();
    this._dlTriggeredBy = null;
    this._epFileConfirm = null;
    this._epFileDeleting = null;
    this._seasonFileConfirm = null;
    this._seasonFileDeleting = null;
    this._sonarrQueueSeasons = /* @__PURE__ */ new Set();
    this._sonarrQueueEpisodes = /* @__PURE__ */ new Set();
    this._sonarrQueueEpPct = /* @__PURE__ */ new Map();
    this._sonarrQueueSeasonPct = /* @__PURE__ */ new Map();
    this._sonarrQueueSeriesPct = /* @__PURE__ */ new Map();
    this._sonarr2QueueSeasons = /* @__PURE__ */ new Set();
    this._sonarr2QueueEpisodes = /* @__PURE__ */ new Set();
    this._sonarr2QueueEpPct = /* @__PURE__ */ new Map();
    this._sonarr2QueueSeasonPct = /* @__PURE__ */ new Map();
    this._sonarr2QueueSeriesPct = /* @__PURE__ */ new Map();
    this._sonarr2ImportDates = {};
    this._sonarrImportEps = {};
    this._sonarr2ImportEps = {};
    this._pendingRequestedShows = /* @__PURE__ */ new Set();
    this._pendingRequestedMovies = /* @__PURE__ */ new Set();
    this._seerrRequests = null;
    this._lidarrConfigured = null;
    this._lastfm = null;
    try {
      this._rqType = localStorage.getItem("arr-rq-type") || "all";
    } catch (_) {
      this._rqType = "all";
    }
    try {
      this._raType = localStorage.getItem("arr-ra-type") || "all";
    } catch (_) {
      this._raType = "all";
    }
    try {
      this._calCatType = localStorage.getItem("arr-cal-type") || "all";
    } catch (_) {
      this._calCatType = "all";
    }
    try {
      this._recType = localStorage.getItem("arr-rec-type") || "all";
    } catch (_) {
      this._recType = "all";
    }
    this._musAdded = /* @__PURE__ */ new Set();
    this._musAddedEntries = /* @__PURE__ */ new Map();
    this._lastfmConfigured = false;
    this._lastfmUserConfigured = false;
    this._lidarrArtistFeed = null;
    this._musicModal = null;
    this._lidarrArtists = /* @__PURE__ */ new Map();
    this._lidarrQueue = /* @__PURE__ */ new Set();
    this._lidarrQueuePct = /* @__PURE__ */ new Map();
    this._lidarrQueueArtists = /* @__PURE__ */ new Map();
    this._searchQuery = "";
    this._searchResults = [];
    this._searchPage = 0;
    this._searchLoading = false;
    this._searchActive = false;
    this._searchTimer = null;
    this._searchAbort = null;
    this._pages = { radarr: 0, sonarr: 0, upcoming: 0, tvUpcoming: 0, calendar: 0, trending: 0, popular: 0, qbit: 0, sab: 0, deluge: 0, rtorrent: 0, pending: 0, recentlyAdded: 0, recentlyRequested: 0, music: 0, lastfm: 0, recommendations: 0, streams: 0 };
    this._pageDir = { radarr: "", sonarr: "", upcoming: "", tvUpcoming: "", calendar: "", trending: "", popular: "", qbit: "", sab: "", pending: "", streams: "" };
    this._streamsTimer = null;
    this._streamPopupTimer = null;
    this._streamsEnded = /* @__PURE__ */ new Set();
    this._diskPage = { radarr: 0, sonarr: 0, left: null };
    this._rightPage = 0;
    this._rightMaxH = 0;
    this._gradients = ["ca", "cb", "cc", "cd", "ce", "cf", "cg", "ch", "ci", "cj", "ck", "cl", "cm", "cn", "co", "cp", "cq", "cr"];
    this._gradientMap = {};
    this._gradientIdx = 0;
    try {
      this._leftMinimized = localStorage.getItem("arr-left-minimized") === "1";
      this._rightMinimized = localStorage.getItem("arr-right-minimized") === "1";
    } catch {
      this._leftMinimized = false;
      this._rightMinimized = false;
    }
  }
  // ─────────────────────────────────────────────
  // HA lifecycle
  // ─────────────────────────────────────────────
  setConfig(config) {
    if (Array.isArray(config.categories)) {
      const CAT_MAP = { radarr: "recentlyAdded", sonarr: "recentlyRequested" };
      const seen = /* @__PURE__ */ new Set();
      config = {
        ...config,
        categories: config.categories.map((c) => CAT_MAP[c.id] ? { ...c, id: CAT_MAP[c.id] } : c).filter((c) => seen.has(c.id) ? false : seen.add(c.id))
      };
    }
    this._config = config;
    this._debug = !!config.debug;
    if (this._initialized) {
      this._wireStickyNav();
      this._applyTheme();
    }
  }
  set hass(hass) {
    const prev = this._hass;
    this._hass = hass;
    if (!this._initialized) {
      this._initialized = true;
      this._buildShell();
      this._loadPendingFromStorage();
      this._fetchAll();
      this._interval = setInterval(() => this._fetchAll(), 3e4);
      this._fastInterval = setInterval(() => this._fetchDownloadsAndRender(), 5e3);
      this._resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => this._checkBadgeOverflow());
      });
      this._resizeObserver.observe(this);
      return;
    }
    if (prev) {
      const cur = hass.states || {};
      const old = prev.states || {};
      for (const id of Object.keys(cur)) {
        if (!(id.startsWith("media_player.plex_") || id.startsWith("media_player.jellyfin_"))) continue;
        const nowActive = cur[id]?.state === "playing" || cur[id]?.state === "paused";
        const wasActive = old[id]?.state === "playing" || old[id]?.state === "paused";
        if (nowActive && !wasActive) {
          this._streamsEnded.delete(id);
          this._reRenderSection("streams");
          break;
        }
      }
      for (const id of this._streamsEnded) {
        const curS = cur[id];
        if (!curS) {
          this._streamsEnded.delete(id);
          continue;
        }
        const nowActive = curS.state === "playing" || curS.state === "paused";
        if (!nowActive) {
          this._streamsEnded.delete(id);
          continue;
        }
        const curAttr = curS.attributes || {};
        const oldAttr = old[id]?.attributes || {};
        const curUpd = curAttr.media_position_updated_at;
        const oldUpd = oldAttr.media_position_updated_at;
        const titleChg = curAttr.media_title !== oldAttr.media_title;
        const idChg = curAttr.media_content_id !== oldAttr.media_content_id;
        const posReset = (curAttr.media_position || 0) < 10 && (oldAttr.media_position || 0) > 30;
        if (curUpd && curUpd !== oldUpd || titleChg || idChg || posReset) {
          this._streamsEnded.delete(id);
          this._reRenderSection("streams");
          break;
        }
      }
      if (this._kodiEntityIds.size) {
        let kodiChanged = false;
        for (const id of this._kodiEntityIds) {
          if (cur[id]?.state !== old[id]?.state) {
            kodiChanged = true;
            break;
          }
        }
        if (kodiChanged) {
          this._kodiSessions = [...this._kodiEntityIds].map((id) => {
            const s = cur[id];
            if (!s || s.state !== "playing" && s.state !== "paused") return null;
            return { id, source: "kodi", state: s.state, attr: s.attributes || {} };
          }).filter(Boolean);
          this._reRenderSection("streams");
        }
      }
    }
  }
  // Reset the 30s full-fetch interval after a page switch so the next cycle starts
  // fresh from now (avoids a fetch arriving seconds after navigation).
  _resetFetchInterval() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = setInterval(() => this._fetchAll(), 3e4);
    }
  }
  disconnectedCallback() {
    if (this._overlayObserver) {
      this._overlayObserver.disconnect();
      this._overlayObserver = null;
    }
    if (this._scrollLocked) {
      this._scrollRestore = null;
      this._applyScrollLock(false);
    }
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    if (this._fastInterval) {
      clearInterval(this._fastInterval);
      this._fastInterval = null;
    }
    if (this._streamsTimer) {
      clearInterval(this._streamsTimer);
      this._streamsTimer = null;
    }
    if (this._streamPopupTimer) {
      clearInterval(this._streamPopupTimer);
      this._streamPopupTimer = null;
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    this._clearNavWatcher();
    if (this._pageBtnAbort) {
      this._pageBtnAbort.abort();
      this._pageBtnAbort = null;
    }
  }
  connectedCallback() {
    if (!this._initialized) return;
    if (!this._interval) {
      this._interval = setInterval(() => this._fetchAll(), 3e4);
    }
    if (!this._fastInterval) {
      this._fastInterval = setInterval(() => this._fetchDownloadsAndRender(), 5e3);
    }
    if (!this._resizeObserver) {
      this._resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => this._checkBadgeOverflow());
      });
      this._resizeObserver.observe(this);
    }
    requestAnimationFrame(() => this._wireStickyNav());
  }
  // ─────────────────────────────────────────────
  // Config helpers
  // ─────────────────────────────────────────────
  get _cfg() {
    return this._config;
  }
  // Nested config read with flat fallback for backward compat
  // e.g. _cfgGet('downloads', 'torrentItems') reads config.downloads.torrentItems ?? config.torrentItems
  _cfgGet(group, key, fallback) {
    const grouped = this._config?.[group]?.[key];
    if (grouped !== void 0) return grouped;
    const flat = this._config?.[key];
    if (flat !== void 0) return flat;
    return fallback;
  }
  // Returns config object for a section overlay (icon, data key, render fn, etc.)
  _getSectionOverlayConfig(section) {
    const tmdbUrl = (path) => !path ? null : path.startsWith("http") ? path : `https://image.tmdb.org/t/p/w92${path}`;
    const cfgs = {
      trending: {
        dataKey: "_trending",
        icon: "mdi:trending-up",
        titleKey: "trendingMovies",
        appKey: this._discoverIconKey(),
        apiEndpoint: `${this._discoverSvc}/trending`,
        hasTvPending: true,
        renderCard: (m, i) => this._renderTrendingCard(m, i),
        getPosterUrl: (m) => tmdbUrl(m.posterPath || m.poster_path),
        emoji: (m) => m.mediaType === "tv" ? "\u{1F4FA}" : "\u{1F3AC}"
      },
      popular: {
        dataKey: "_popular",
        icon: "mdi:fire",
        titleKey: "popularMovies",
        appKey: this._discoverIconKey(),
        apiEndpoint: `${this._discoverSvc}/popular`,
        hasTvPending: false,
        renderCard: (m, i) => this._renderUpcomingCard(m, { showDate: false, typeTag: this._t("typeMovie"), overlayIndex: i }),
        getPosterUrl: (m) => tmdbUrl(m.posterPath),
        emoji: () => "\u{1F3AC}"
      },
      upcoming: {
        dataKey: "_upcoming",
        icon: "mdi:ticket-outline",
        titleKey: "upcomingMovies",
        appKey: this._discoverIconKey(),
        apiEndpoint: null,
        hasTvPending: false,
        renderCard: (m, i) => this._renderUpcomingCard(m, { overlayIndex: i }),
        getPosterUrl: (m) => tmdbUrl(m.posterPath || m.poster_path),
        emoji: () => "\u{1F3AC}"
      },
      tvUpcoming: {
        dataKey: "_tvUpcoming",
        icon: "mdi:television-play",
        titleKey: "newShows",
        appKey: this._discoverIconKey(),
        apiEndpoint: `${this._discoverSvc}/tv_upcoming`,
        hasTvPending: true,
        renderCard: (m, i) => this._renderTvUpcomingCard(m, { showRating: true, overlayIndex: i }),
        getPosterUrl: (m) => tmdbUrl(m.posterPath),
        emoji: () => "\u{1F4FA}"
      },
      radarr: {
        dataKey: "_radarr",
        icon: "mdi:filmstrip",
        titleKey: "recentMovies",
        appKey: "radarr",
        apiEndpoint: null,
        hasTvPending: false,
        renderCard: (m) => this._renderRadarrCard(m),
        getPosterUrl: (m) => this._getRadarrPoster(m),
        emoji: () => "\u{1F3AC}"
      },
      sonarr: {
        dataKey: "_sonarr",
        icon: "mdi:television-play",
        titleKey: "recentShows",
        appKey: "sonarr",
        apiEndpoint: null,
        hasTvPending: false,
        renderCard: (m) => this._renderSonarrCard(m),
        getPosterUrl: (m) => this._getSonarrPoster(m),
        emoji: () => "\u{1F4FA}"
      },
      recentlyAdded: {
        dataKey: "recentlyAdded",
        icon: "mdi:check-circle-outline",
        titleKey: "recentlyAdded",
        appKey: this._discoverIconKey(),
        apiEndpoint: null,
        hasTvPending: false,
        // See More shows what the header peanut is showing, not the raw list.
        getItems: () => this._raItems(),
        renderCard: (m) => this._renderRecentlyAddedCard(m),
        getPosterUrl: (m) => m._mediaType === "music" ? this._lidarrArtistImage(m.artist, "poster") || (m.newestAlbum ? this._lidarrCover(m.newestAlbum) : null) : m._mediaType === "movie" ? this._getRadarrPoster(m) : this._getSonarrPoster(m),
        emoji: (m) => m._mediaType === "music" ? "\u{1F3B5}" : m._mediaType === "movie" ? "\u{1F3AC}" : "\u{1F4FA}"
      },
      recommendations: {
        dataKey: "_trakt",
        icon: "mdi:star-shooting-outline",
        titleKey: "catRecommendations",
        appKey: "trakt",
        gradPos: [25, 75, 0.6],
        apiEndpoint: null,
        hasTvPending: true,
        getItems: () => this._recItems(),
        renderCard: (m, i) => this._renderRecCard(m, i),
        getPosterUrl: (m) => m._recSrc === "lastfm" ? this._lidarrArtistImage(m.artist, "poster") : m.posterPath ? m.posterPath.startsWith("http") ? m.posterPath : `https://image.tmdb.org/t/p/w92${m.posterPath}` : null,
        emoji: (m) => m._recSrc === "lastfm" ? "\u{1F3B5}" : m.mediaType === "tv" ? "\u{1F4FA}" : "\u{1F3AC}"
      },
      recentlyRequested: {
        dataKey: "recentlyRequested",
        icon: "mdi:clock-time-four-outline",
        titleKey: "recentlyRequested",
        appKey: this._discoverIconKey(),
        apiEndpoint: null,
        hasTvPending: false,
        renderCard: (m) => this._renderRecentlyRequestedCard(m),
        getPosterUrl: (m) => m._mediaType === "movie" ? this._getRadarrPoster(m) : this._getSonarrPoster(m),
        emoji: (m) => m._mediaType === "movie" ? "\u{1F3AC}" : "\u{1F4FA}"
      }
    };
    return cfgs[section] || null;
  }
  // Returns true if section has enough items to show the See-More card
  _hasSeeMore(section) {
    const cfg = this._getSectionOverlayConfig(section);
    if (!cfg) return false;
    const items = (cfg.getItems ? cfg.getItems() : this[cfg.dataKey]) || [];
    if (items.length === 0) return false;
    const showMorePage = Math.max(1, parseInt(this._cfgGet("discover", "showMoreOnPage", 3)) || 3);
    const cols = Math.max(2, Math.min(10, parseInt(this._cfgGet("discover", "itemsPerCategory", 4)) || 4));
    return items.length > showMorePage * cols - 1;
  }
  // Paged grid with automatic See-More card insertion (if items exceed showMoreOnPage threshold)
  _pagedGridWithSmp(items, section, renderFn) {
    if (!items || items.length === 0) return "";
    const showMorePage = Math.max(1, parseInt(this._cfgGet("discover", "showMoreOnPage", 3)) || 3);
    const cols = Math.max(2, Math.min(10, parseInt(this._cfgGet("discover", "itemsPerCategory", 4)) || 4));
    const itemsBefore = showMorePage * cols - 1;
    if (items.length > itemsBefore) {
      const withSmp = [...items.slice(0, itemsBefore), { _isSeeMore: true }];
      return this._pagedGrid(withSmp, section, (m) => m._isSeeMore ? this._renderSeeMoreCardFor(section) : renderFn(m), cols);
    }
    return this._pagedGrid(items, section, renderFn, cols);
  }
  // Lokalizační helper — vrátí přeložený řetězec dle nastavení localisation: cs|en
  _t(key) {
    const lang = this._cfg?.localisation === "cs" ? "cs" : "en";
    return (ARR_I18N[lang] || ARR_I18N.cs)[key] || key;
  }
  // "X seasons" s českou plurálovou logikou (1 série / 2–4 série / 5+ sérií)
  _tSeasons(n) {
    const lang = this._cfg?.localisation === "cs" ? "cs" : "en";
    if (lang === "cs") {
      const word = n === 1 ? "s\xE9rie" : n >= 2 && n <= 4 ? "s\xE9rie" : "s\xE9ri\xED";
      return `${n} ${word}`;
    }
    return `${n} ${n === 1 ? "season" : "seasons"}`;
  }
  // Columns (and therefore items per page) for the right-panel categories
  _catCols() {
    return Math.max(2, Math.min(10, parseInt(this._cfgGet("discover", "itemsPerCategory", 4)) || 4));
  }
  // Returns items per page for a given section (respects YAML config)
  _perPage(section) {
    if (section === "qbit") return parseInt(this._cfgGet("downloads", "torrentItems", 3)) || 3;
    if (section === "sab") return parseInt(this._cfgGet("downloads", "usenetItems", 3)) || 3;
    if (section === "nzbget") return parseInt(this._cfgGet("downloads", "usenetItems", 3)) || 3;
    if (section === "deluge") return parseInt(this._cfgGet("downloads", "torrentItems", 3)) || 3;
    if (section === "rtorrent") return parseInt(this._cfgGet("downloads", "torrentItems", 3)) || 3;
    if (section === "pending") return 4;
    return this._catCols();
  }
  // Converts "#rrggbb" or "#rgb" to "r,g,b" string for use in rgba()
  // ─────────────────────────────────────────────
  // Formatters
  // ─────────────────────────────────────────────
  fmtSpeed(bytesPerSec) {
    if (bytesPerSec === void 0 || bytesPerSec === null || isNaN(bytesPerSec)) return "0 KB/s";
    if (bytesPerSec >= 1024 * 1024) {
      return (bytesPerSec / (1024 * 1024)).toFixed(1) + " MB/s";
    }
    return Math.round(bytesPerSec / 1024) + " KB/s";
  }
  fmtSize(bytes) {
    if (bytes === void 0 || bytes === null || isNaN(bytes)) return "0 MB";
    if (bytes >= 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
    }
    return Math.round(bytes / (1024 * 1024)) + " MB";
  }
  fmtEta(seconds) {
    if (!seconds || seconds <= 0 || seconds >= 864e4) return "\u221E";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    if (h > 0) return `${h}h ${m}min`;
    return `${m} min`;
  }
  get _locale() {
    return this._hass?.locale?.language || "en";
  }
  fmtDate(dateStr) {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString(this._locale, { month: "numeric", day: "numeric" });
    } catch {
      return "";
    }
  }
  // The year is dropped on a phone: the header also carries the type filter,
  // which grew by one when music arrived, and the close button was the part
  // pushed off the edge. Nobody reads a week range to find out which year it is.
  _fmtWeekRange(start, end) {
    const locale = this._locale;
    const fmt = this._hass?.locale?.date_format || "DMY";
    const mon = (d) => new Intl.DateTimeFormat(locale, { month: "short" }).format(d);
    const s = start.getDate(), sm = mon(start);
    const e = end.getDate(), em = mon(end), y = end.getFullYear();
    const narrow = window.matchMedia("(max-width: 700px)").matches;
    if (fmt === "MDY") return narrow ? `${sm} ${s} \u2013 ${em} ${e}` : `${sm} ${s} \u2013 ${em} ${e}, ${y}`;
    if (fmt === "YMD") return narrow ? `${sm} ${s} \u2013 ${em} ${e}` : `${y} ${sm} ${s} \u2013 ${em} ${e}`;
    return narrow ? `${s} ${sm} \u2013 ${e} ${em}` : `${s} ${sm} \u2013 ${e} ${em} ${y}`;
  }
  fmtPct(ratio) {
    if (ratio === void 0 || ratio === null || isNaN(ratio)) return "0%";
    return Math.round(ratio * 100) + "%";
  }
  // Assign a stable gradient class to each media item ID
  _grad(id) {
    const key = String(id);
    if (!this._gradientMap[key]) {
      this._gradientMap[key] = this._gradients[this._gradientIdx % this._gradients.length];
      this._gradientIdx++;
    }
    return this._gradientMap[key];
  }
  // ─────────────────────────────────────────────
  // ─────────────────────────────────────────────
  // Badge / pill helpers
  // ─────────────────────────────────────────────
  /** Media card poster img + gradient placeholder fallback */
  _mcImg(poster, emoji, gradId, phClass = "") {
    return poster ? `<img src="${poster}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" loading="lazy" onerror="this.style.display='none'">` : `<div class="${phClass}${this._grad(gradId)}" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:28px">${emoji}</div>`;
  }
  // Recently Requested's type filter: all, films and shows, or music.
  // Which of the three feeds the Recommendations row is built from. Trakt and
  // SuggestArr are chosen in the config; music rides along whenever Lidarr and
  // Last.fm are both set up, and is switched off with the row's own filter.
  get _recSources() {
    return {
      trakt: this._traktConfigured !== false && this._cfgGet("discover", "recTrakt", true) !== false,
      suggestarr: this._suggestarrConfigured !== false && this._cfgGet("discover", "recSuggestarr", true) !== false,
      lastfm: !!this._lastfmConfigured
    };
  }
  // A config saved before the merge still names up to three recommendation
  // rows and one for music. They read as one Recommendations row, in the place
  // the first of them held — Trakt's, when it is there.
  _catConfigMigrated(cats) {
    const REC = ["trakt", "suggestarr", "lastfm"];
    const noMusic = cats.filter((c) => c.id !== "music");
    if (!noMusic.some((c) => REC.includes(c.id))) return noMusic;
    if (noMusic.some((c) => c.id === "recommendations")) return noMusic.filter((c) => !REC.includes(c.id));
    const idx = noMusic.findIndex((c) => c.id === "trakt");
    const slot = idx >= 0 ? idx : noMusic.findIndex((c) => REC.includes(c.id));
    const enabled = noMusic.some((c) => REC.includes(c.id) && c.enabled !== false);
    const out = noMusic.filter((c) => !REC.includes(c.id));
    out.splice(Math.min(slot, out.length), 0, { id: "recommendations", enabled });
    return out;
  }
  // A header filter, and on a phone the funnel that stands in for it. Both are
  // always rendered and CSS decides which is seen: a JS branch on width would
  // need a re-render to follow a rotation, and the peanut would be measured
  // while it was still collapsed.
  _hdrFilter(segHtml, isSet, key = "") {
    if (!segHtml) return "";
    const funnel = `<ha-icon icon="mdi:filter-variant"></ha-icon>`;
    const open = key && this._hdrFilterOpen === key ? " is-open" : "";
    const accent = `--seg-accent:rgba(0,122,255,${this._isDay ? 0.85 : 0.5});--seg-accent-bdr:rgba(0,122,255,${this._isDay ? 0.95 : 0.8})`;
    return `<div class="hdr-filter${isSet ? " is-set" : ""}${open}" data-hdr-filter="${key}" style="${accent}">
      <button class="hdr-filter-btn" data-hdr-filter-btn aria-label="${this._t("tabAll")}">${funnel}</button>
      ${segHtml}
    </div>`;
  }
  get _recTypeSaved() {
    const v = this._recType || "all";
    return ["all", "video", "music"].includes(v) ? v : "all";
  }
  // Trakt and SuggestArr are dealt out one apiece so neither takes the row on
  // its own; music follows, in the order Last.fm gave it.
  _recItems() {
    const src = this._recSources;
    const tk = src.trakt ? this._trakt || [] : [];
    const sa = src.suggestarr ? this._suggestarr || [] : [];
    const video = [];
    for (let i = 0; i < Math.max(tk.length, sa.length); i++) {
      if (tk[i]) video.push({ ...tk[i], _recSrc: "trakt" });
      if (sa[i]) video.push({ ...sa[i], _recSrc: "suggestarr" });
    }
    const music = src.lastfm ? (this._lastfmRowItems() || []).map((e) => ({ ...e, _recSrc: "lastfm", _mediaType: "music" })) : [];
    const t = music.length ? this._recTypeSaved : "all";
    if (t === "music") return music;
    if (t === "video") return video;
    const lanes = [
      video.filter((m) => m.mediaType !== "tv"),
      video.filter((m) => m.mediaType === "tv"),
      music
    ].filter((l) => l.length);
    if (lanes.length < 2) return [...video, ...music];
    const out = [];
    for (let i = 0; out.length < video.length + music.length; i++) {
      for (const lane of lanes) if (lane[i]) out.push(lane[i]);
    }
    return out;
  }
  get _calCatTypeSaved() {
    const v = this._calCatType || "all";
    return ["all", "video", "music"].includes(v) ? v : "all";
  }
  // The calendar row through its header peanut, the same three choices the
  // other rows carry.
  _calCatItems() {
    const all = this._calendar || [];
    const t = this._lidarrConfigured !== false ? this._calCatTypeSaved : "all";
    if (t === "music") return all.filter((e) => e._mediaType === "music");
    if (t === "video") return all.filter((e) => e._mediaType !== "music");
    return all;
  }
  get _raTypeSaved() {
    const v = this._raType || "all";
    return ["all", "video", "music"].includes(v) ? v : "all";
  }
  get _rqTypeSaved() {
    const v = this._rqType || "all";
    return ["all", "video", "music"].includes(v) ? v : "all";
  }
  _posterCfg() {
    return {
      title: this._cfgGet("posters", "showTitle", true) !== false,
      audio: this._cfgGet("posters", "showAudio", true) !== false,
      subtitles: this._cfgGet("posters", "showSubtitles", true) !== false,
      rating: this._cfgGet("posters", "showRating", true) !== false,
      mediaType: this._cfgGet("posters", "showMediaType", true) !== false,
      statusDisplay: this._cfgGet("posters", "statusDisplay", "tags"),
      // 'all' | 'maintainerr' | 'off' — where the Maintainerr deletion tag shows
      goneTag: this._cfgGet("posters", "goneTag", "all"),
      // 'flags' = one combined strip; 'tags' = the original separate badges
      langDisplay: this._cfgGet("posters", "langDisplay", "flags")
    };
  }
  // `inst` says which instance the id belongs to. Without it both maps are
  // tried in order, and two instances number their libraries from 1 apiece —
  // so an id that exists in both answers with the wrong film's progress.
  _dlPct(id, type = "movie", inst = null) {
    if (!id) return -1;
    if (type === "tv") {
      if (inst === "sonarr2") return this._sonarr2QueueSeriesPct?.get(id) ?? -1;
      if (inst === "sonarr") return this._sonarrQueueSeriesPct?.get(id) ?? -1;
      return this._sonarrQueueSeriesPct?.get(id) ?? this._sonarr2QueueSeriesPct?.get(id) ?? -1;
    }
    if (inst === "radarr2") return this._radarr2QueuePct?.get(id) ?? -1;
    if (inst === "radarr") return this._radarrQueuePct?.get(id) ?? -1;
    return this._radarrQueuePct?.get(id) ?? this._radarr2QueuePct?.get(id) ?? -1;
  }
  _statusStripeColor(cls) {
    const map = { "b-st-avail": "#27ae60", "b-continuing": "#2980b9", "b-dl": "#2980b9", "b-st-proc": "#2980b980", "b-st-pend": "#e67e22", "b-missing": "#c0392b", "b-cutoff": "#e67e22", "b-partial": "#c0392b" };
    return map[cls] || "#555";
  }
  _statusStripe(color, animated = false, pct = -1) {
    const bg = `linear-gradient(90deg,${color} 0%,color-mix(in srgb,${color} 70%,white) 50%,${color} 100%)`;
    const dimColor = `color-mix(in srgb,${color} 50%,transparent)`;
    const dimBg = `linear-gradient(90deg,${dimColor} 0%,color-mix(in srgb,${dimColor} 70%,white) 50%,${dimColor} 100%)`;
    if (pct >= 0 && pct < 100) {
      const w = animated ? Math.max(pct, 4) : pct;
      return `<div style="position:absolute;bottom:0;left:0;right:0;height:4px;z-index:3;pointer-events:none;background:${dimBg};overflow:hidden"><div style="position:absolute;left:0;top:0;bottom:0;width:${w}%;background:${bg}${animated ? ";animation:stripe-pulse 1.8s ease-in-out infinite" : ""}"></div></div>`;
    }
    return `<div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:${bg};z-index:3;pointer-events:none${animated ? ";animation:stripe-pulse 1.8s ease-in-out infinite" : ""}"></div>`;
  }
  /** Media card gradient footer overlay */
  _mcGrad(grad, inner) {
    return `<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,${grad} 0%,transparent 80%);padding:28px 6px 6px;z-index:1">${inner}</div>`;
  }
  /** Media card badge with text: <span class="badge {cls}">{icon}<span class="b-txt"> {text}</span></span> */
  _badge(cls, icon, text) {
    return `<span class="badge ${cls}">${icon}<span class="b-txt"> ${text}</span></span>`;
  }
  /** Media card badge with mdi icon: <span class="badge {cls}"><ha-icon ...> {text}</span> */
  _badgeIcon(cls, mdiIcon, text) {
    return `<span class="badge ${cls}"><ha-icon icon="${mdiIcon}" style="--mdc-icon-size:9px"></ha-icon> ${text}</span>`;
  }
  /** Download panel status pill: <span class="status-pill {cls}"><ha-icon ...> {text}</span> */
  _pill(cls, mdiIcon, text, style = "") {
    return `<span class="status-pill ${cls}"${style ? ` style="${style}"` : ""}><ha-icon icon="${mdiIcon}" style="--mdc-icon-size:11px"></ha-icon> ${text}</span>`;
  }
  // App SVG icons (white, 22×22)
  // ─────────────────────────────────────────────
  _appIconRow(apps, size = 24) {
    const list = apps.filter((a) => a !== "lidarr" || this._lidarrConfigured !== false);
    return `<div class="app-icon-row" style="display:inline-flex;gap:4px;flex-shrink:0;align-items:center">${list.map((a) => this._appIcon(a, size)).join("")}</div>`;
  }
  _appIcon(app, size = 26) {
    const useReal = this._cfgGet("styles", "applicationIcons", "real") !== "mdi";
    const sz = `width="${size}" height="${size}"`;
    const CDN = "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg";
    const cdnSlugs = {
      qbit: "qbittorrent",
      sab: "sabnzbd",
      nzbget: "nzbget",
      deluge: "deluge",
      rtorrent: "rutorrent",
      radarr: "radarr",
      sonarr: "sonarr",
      overseerr: "overseerr",
      jellyseerr: "jellyseerr",
      tmdb: "tmdb",
      trakt: "trakt",
      plex: "plex",
      tautulli: "tautulli",
      prowlarr: "prowlarr",
      jellystat: "jellystat",
      tracearr: "tracearr",
      maintainerr: "maintainerr",
      lidarr: "lidarr",
      bazarr: "bazarr",
      suggestarr: "suggest-arr",
      jellyfin: "jellyfin",
      emby: "emby",
      kodi: "kodi"
    };
    const mdiIcons = {
      radarr: "mdi:filmstrip",
      sonarr: "mdi:television-play",
      overseerr: "mdi:movie-open-check-outline",
      jellyseerr: "mdi:movie-open-check-outline",
      tmdb: "mdi:movie-open",
      trakt: "mdi:movie-star-outline",
      suggestarr: "mdi:lightbulb-on-outline",
      plex: "mdi:plex",
      tautulli: "mdi:chart-bar",
      prowlarr: "mdi:magnify-scan",
      jellystat: "mdi:chart-line",
      tracearr: "mdi:shield-account-outline",
      maintainerr: "mdi:broom",
      lidarr: "mdi:music-box-multiple-outline",
      lastfm: "mdi:radio-tower",
      bazarr: "mdi:subtitles-outline",
      jellyfin: "mdi:jellyfish-outline",
      emby: "mdi:emby",
      kodi: "mdi:kodi"
    };
    const customSvgs = {
      qbit: `<svg ${sz} viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><text x="12" y="16.5" text-anchor="middle" font-size="9.5" font-weight="700" font-family="sans-serif">qb</text></svg>`,
      sab: `<svg ${sz} viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><path d="M5 2h14v10h3L12 22 2 12h3V2z"/></svg>`,
      deluge: `<svg ${sz} viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3l6 5h-4v5H10v-5H6l6-5z"/></svg>`,
      rtorrent: `<svg ${sz} viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm-1 3v5.27l-3.5 2.02.99 1.71L12 14.15l3.51 2.02.99-1.71L13 12.27V7h-2z"/></svg>`,
      lastfm: `<svg ${sz} viewBox="0 0 24 24" style="flex-shrink:0"><rect width="24" height="24" rx="5" fill="#D51007"/><g transform="translate(2.4 2.4) scale(0.8)"><path fill="#fff" d="M10.584 17.21l-.88-2.392s-1.43 1.594-3.573 1.594c-1.897 0-3.244-1.649-3.244-4.288 0-3.382 1.704-4.591 3.381-4.591 2.42 0 3.189 1.567 3.849 3.574l.88 2.749c.88 2.666 2.529 4.81 7.285 4.81 3.409 0 5.718-1.044 5.718-3.793 0-2.227-1.265-3.381-3.63-3.931l-1.758-.385c-1.21-.275-1.567-.77-1.567-1.595 0-.934.742-1.484 1.952-1.484 1.32 0 2.034.495 2.144 1.677l2.749-.33c-.22-2.474-1.924-3.492-4.729-3.492-2.474 0-4.893.935-4.893 3.932 0 1.87.907 3.051 3.189 3.601l1.87.44c1.402.33 1.869.907 1.869 1.704 0 1.017-.99 1.43-2.86 1.43-2.776 0-3.93-1.457-4.59-3.464l-.907-2.75c-1.155-3.573-2.997-4.893-6.653-4.893C2.144 5.333 0 7.89 0 12.233c0 4.18 2.144 6.434 5.993 6.434 3.106 0 4.591-1.457 4.591-1.457z"/></g></svg>`,
      nzbget: `<svg ${sz} viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><rect x="5" y="2" width="14" height="2" rx="0.5"/><rect x="5" y="5.5" width="14" height="2" rx="0.5"/><rect x="5" y="9" width="14" height="2" rx="0.5"/><path d="M5 12h14v4h3L12 22 2 16h3v-4z"/></svg>`
    };
    const pngOnly = /* @__PURE__ */ new Set(["suggest-arr"]);
    if (useReal && cdnSlugs[app]) {
      const slug = cdnSlugs[app];
      const url = pngOnly.has(slug) ? `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/${slug}.png` : `${CDN}/${slug}.svg`;
      return `<img src="${url}" ${sz} style="flex-shrink:0;display:block;object-fit:contain" onerror="this.style.display='none'">`;
    }
    if (customSvgs[app]) {
      return customSvgs[app];
    }
    if (mdiIcons[app]) {
      return `<ha-icon icon="${mdiIcons[app]}" style="--mdc-icon-size:${size}px;flex-shrink:0"></ha-icon>`;
    }
    return "";
  }
  _discoverIconKey() {
    if (this._overseerrConfigured === false) return "tmdb";
    return this._seerrType || "overseerr";
  }
  _brandColor(app, o = 0.35) {
    const map = {
      trakt: `rgba(230,87,99,${o})`,
      suggestarr: `rgba(250,180,50,${o})`,
      overseerr: `rgba(99,102,241,${o})`,
      jellyseerr: `rgba(0,164,220,${o})`,
      tmdb: `rgba(1,180,228,${o})`,
      radarr: `rgba(255,197,0,${o})`,
      sonarr: `rgba(53,202,255,${o})`,
      plex: `rgba(229,160,13,${o})`,
      tautulli: `rgba(255,111,0,${o})`,
      jellystat: `rgba(0,164,220,${o})`,
      jellyfin: `rgba(0,164,220,${o})`,
      emby: `rgba(82,182,92,${o})`,
      kodi: `rgba(23,154,215,${o})`,
      prowlarr: `rgba(255,80,0,${o})`,
      tracearr: `rgba(99,200,150,${o})`,
      qbit: `rgba(30,140,255,${o})`,
      deluge: `rgba(10,80,220,${o})`,
      rtorrent: `rgba(60,120,255,${o})`,
      sab: `rgba(200,150,0,${o})`,
      nzbget: `rgba(40,140,60,${o})`,
      maintainerr: `rgba(245,158,11,${o})`,
      lidarr: `rgba(21,158,90,${o})`
    };
    return map[app] || `rgba(255,255,255,${o})`;
  }
  _brandColorSecondary(app, o = 0.35) {
    const map = {
      trakt: `rgba(236,72,153,${o})`,
      suggestarr: `rgba(255,120,80,${o})`,
      overseerr: `rgba(124,58,237,${o})`,
      jellyseerr: `rgba(139,92,246,${o})`,
      tmdb: `rgba(144,206,161,${o})`,
      radarr: `rgba(100,200,255,${o})`,
      sonarr: `rgba(255,255,255,${o})`,
      plex: `rgba(200,100,0,${o})`,
      tautulli: `rgba(255,255,255,${o})`,
      jellystat: `rgba(139,92,246,${o})`,
      jellyfin: `rgba(139,92,246,${o})`,
      prowlarr: `rgba(255,160,50,${o})`,
      tracearr: `rgba(50,180,120,${o})`,
      qbit: `rgba(10,80,220,${o})`,
      deluge: `rgba(5,45,160,${o})`,
      rtorrent: `rgba(140,60,240,${o})`,
      sab: `rgba(170,125,0,${o})`,
      nzbget: `rgba(30,120,50,${o})`,
      maintainerr: `rgba(200,120,0,${o})`
    };
    return map[app] || `rgba(255,255,255,${o})`;
  }
  _sectionStyle() {
    return `position:relative;margin-left:-15px;padding-left:15px;margin-right:-15px;padding-right:15px;margin-top:-10px;padding-top:10px;`;
  }
  get _categoryOverlaysEnabled() {
    return this._cfgGet("styles", "categoryOverlays", true) !== false;
  }
  _sectionOverlayHtml(app, posL = 15, posR = 85, o = 0.4, bottomFade = 80, topFade = 6) {
    if (!this._categoryOverlaysEnabled) return "";
    const mask = `linear-gradient(to bottom,transparent 0.07%,black ${topFade}%,black ${bottomFade}%,transparent 100%)`;
    const gradL = `radial-gradient(circle at ${posL}% 15%,${this._brandColor(app, o)} 0%,transparent 48%)`;
    const gradR = `radial-gradient(circle at ${posR}% 15%,${this._brandColorSecondary(app, o)} 0%,transparent 48%)`;
    return `<div style="position:absolute;inset:0;background:${gradL},${gradR};mask-image:${mask};-webkit-mask-image:${mask};filter:blur(25px);pointer-events:none;z-index:0;"></div>`;
  }
  _sectionOverlayHtmlSingle(app, o = 0.4) {
    if (!this._categoryOverlaysEnabled) return "";
    const mask = `linear-gradient(to bottom,transparent 0.07%,black 6%,black 80%,transparent 100%)`;
    const g = `radial-gradient(circle at 15% 0%,${this._brandColor(app, o)} 0%,transparent 65%)`;
    return `<div style="position:absolute;left:-15px;right:-15px;top:0;bottom:0;background:${g};mask-image:${mask};-webkit-mask-image:${mask};filter:blur(25px);pointer-events:none;z-index:0;"></div>`;
  }
  _sectionOverlayHtmlTop(app, posL = 15, posR = 85, o = 0.4) {
    if (!this._categoryOverlaysEnabled) return "";
    const mask = "linear-gradient(to bottom,transparent 0.07%,black 6%,transparent 100%)";
    const gradL = `radial-gradient(circle at ${posL}% 30%,${this._brandColor(app, o)} 0%,transparent 48%)`;
    const gradR = `radial-gradient(circle at ${posR}% 30%,${this._brandColorSecondary(app, o)} 0%,transparent 48%)`;
    return `<div style="position:absolute;top:0;left:0;right:0;height:55%;background:${gradL},${gradR};mask-image:${mask};-webkit-mask-image:${mask};filter:blur(25px);pointer-events:none;z-index:0;"></div>`;
  }
  // ─────────────────────────────────────────────
  // Paginated grid helper
  // ─────────────────────────────────────────────
  _pagedGrid(items, section, renderFn, perPage = 4) {
    if (!items || items.length === 0) return "";
    const page = this._pages[section] || 0;
    const totalPages = Math.ceil(items.length / perPage);
    const pageItems = items.slice(page * perPage, page * perPage + perPage);
    const dir = this._pageDir[section] || "";
    const animClass = dir === "next" ? "anim-next" : dir === "prev" ? "anim-prev" : "";
    const grid = `<div class="mgrid ${animClass}" style="grid-template-columns:repeat(${perPage},1fr)">${pageItems.map((it) => renderFn(it)).join("")}</div>`;
    if (totalPages <= 1) {
      return `
        <div class="pg-wrap">
          <button class="pg-btn pg-btn-ph" disabled>\u2039</button>
          ${grid}
          <button class="pg-btn pg-btn-ph" disabled>\u203A</button>
        </div>`;
    }
    const prevDis = page === 0 ? "disabled" : "";
    const nextDis = page >= totalPages - 1 ? "disabled" : "";
    return `
      <div class="pg-wrap">
        <button class="pg-btn" data-section="${section}" data-dir="prev" ${prevDis}>\u2039</button>
        ${grid}
        <button class="pg-btn" data-section="${section}" data-dir="next" ${nextDis}>\u203A</button>
      </div>`;
  }
  // Returns the correct data array for a given section key
  // Resolves a download-client item back to the media it belongs to. Keyed on
  // the arr queue's downloadId (torrent hash / SAB nzo_id), so no release-name
  // parsing is involved and two files with similar names cannot cross over.
  _mediaForDownloadId(downloadId) {
    const key = String(downloadId || "").toLowerCase();
    if (!key) return null;
    const sources = [
      [this._dlMediaRadarr, this._radarr, "radarr"],
      [this._dlMediaRadarr2, this._radarr2, "radarr2"],
      [this._dlMediaSonarr, this._sonarr, "sonarr"],
      [this._dlMediaSonarr2, this._sonarr2, "sonarr2"],
      [this._dlHistRadarr, this._radarr, "radarr"],
      [this._dlHistRadarr2, this._radarr2, "radarr2"],
      [this._dlHistSonarr, this._sonarr, "sonarr"],
      [this._dlHistSonarr2, this._sonarr2, "sonarr2"]
    ];
    for (const [map, lib, inst] of sources) {
      const arrId = map?.get(key);
      if (arrId == null) continue;
      const hit = (lib || []).find((x) => x.id === arrId);
      if (!hit) continue;
      const isMovie = inst.startsWith("radarr");
      return {
        type: isMovie ? "radarr" : "sonarr",
        tmdbId: hit.tmdbId ? String(hit.tmdbId) : null,
        tvdbId: hit.tvdbId ? String(hit.tvdbId) : null,
        title: hit.title || "",
        radarrId: inst === "radarr" ? hit.id : null,
        radarr2Id: inst === "radarr2" ? hit.id : null
      };
    }
    return null;
  }
  _getPageData(section) {
    if (section === "qbit") return Array.isArray(this._qbit) ? this._qbit : [];
    if (section === "deluge") return Array.isArray(this._delugeQueue) ? this._delugeQueue : [];
    if (section === "rtorrent") return Array.isArray(this._rtorrentQueue) ? this._rtorrentQueue : [];
    if (section === "nzbget") {
      const queue = Array.isArray(this._nzbgetQueue) ? this._nzbgetQueue : [];
      const completed = (this._nzbgetCompleted || []).map((s) => ({
        NZBID: s.NZBID,
        NZBName: s.NZBName || "Unknown",
        FileSizeMB: s.FileSizeMB || 0,
        RemainingSizeMB: 0,
        Status: "SUCCESS",
        _history: true
      }));
      return [...queue, ...completed];
    }
    if (section === "sab") {
      const slots = Array.isArray(this._sab?.slots) ? this._sab.slots : [];
      const completed = (this._sabCompleted || []).map((s) => ({
        nzo_id: s.nzo_id,
        filename: s.name || s.filename || "Unknown",
        percentage: "100",
        mb: String((s.bytes || 0) / 1024 / 1024),
        mbleft: "0",
        status: "Completed",
        timeleft: "",
        size: s.size || "",
        _history: true
      }));
      return [...slots, ...completed];
    }
    if (section === "pending") return this._pendingRequests || [];
    if (section === "recommendations") return this._recItems();
    if (section === "calendar") return this._calCatItems();
    if (section === "recentlyAdded") return this._raItems();
    if (section === "recentlyRequested") return this.recentlyRequested;
    if (section === "music") return this._lidarrArtistFeed || [];
    return this["_" + section] || [];
  }
  get recentlyAdded() {
    const movies = (this._radarr || []).filter((m) => m.hasFile).map((m) => ({ ...m, _mediaType: "movie", _sortDate: m.movieFile?.dateAdded || m.added || "" }));
    const movies2 = (this._radarr2 || []).filter((m) => m.hasFile).map((m) => ({ ...m, _mediaType: "movie", _isRadarr2: true, _sortDate: m.movieFile?.dateAdded || m.added || "" }));
    const shows = (this._sonarr || []).filter((s) => (s.statistics?.episodeFileCount ?? 0) > 0).map((s) => ({ ...s, _mediaType: "tv", _sortDate: this._sonarrImportDates?.[s.id] || s.added || "" }));
    const shows2 = (this._sonarr2 || []).filter((s) => (s.statistics?.episodeFileCount ?? 0) > 0).map((s) => ({ ...s, _mediaType: "tv", _isSonarr2: true, _sortDate: this._sonarr2ImportDates?.[s.id] || s.added || "" }));
    const movieMap = /* @__PURE__ */ new Map();
    for (const m of [...movies, ...movies2]) {
      const key = m.tmdbId ? String(m.tmdbId) : `_uid_m_${m._isRadarr2 ? "r2" : "r1"}_${m.id}`;
      if (!movieMap.has(key)) movieMap.set(key, m);
    }
    const showMap = /* @__PURE__ */ new Map();
    for (const s of [...shows, ...shows2]) {
      const key = s.tvdbId ? String(s.tvdbId) : `_uid_s_${s._isSonarr2 ? "s2" : "s1"}_${s.id}`;
      if (!showMap.has(key)) showMap.set(key, s);
    }
    const music = (this._lidarrConfigured === false ? [] : this._lidarrArtistFeed || []).map((e) => ({ ...e, _mediaType: "music", _sortDate: e._importedAt || "" }));
    return [...movieMap.values(), ...showMap.values(), ...music].sort((a, b) => b._sortDate.localeCompare(a._sortDate));
  }
  // Recently Added through its header peanut: everything, the two the row
  // always held, or music alone.
  _raItems() {
    const all = this.recentlyAdded;
    const t = this._lidarrConfigured !== false ? this._raTypeSaved : "all";
    if (t === "music") return all.filter((m) => m._mediaType === "music");
    if (t === "video") return all.filter((m) => m._mediaType !== "music");
    return all;
  }
  // Seerr knows what was requested; Radarr and Sonarr only know what is missing.
  // Those two lists overlap heavily on an install fed purely by Seerr, which is
  // why the difference went unnoticed — but anything reaching the *arrs by
  // another route (import lists, another user, a manual add) belongs in neither
  // this section nor a user's mental model of "my requests".
  _seerrRequestItems() {
    if (this._cfgGet("discover", "requestedSource", "both") === "library") return null;
    const reqs = this._seerrRequests;
    if (!Array.isArray(reqs)) {
      return this._overseerrConfigured !== false && !this._seerrRequestsErr ? [] : null;
    }
    const movieByTmdb = /* @__PURE__ */ new Map();
    for (const m of [...this._radarr || [], ...this._radarr2 || []]) {
      if (m.tmdbId && !movieByTmdb.has(String(m.tmdbId))) movieByTmdb.set(String(m.tmdbId), m);
    }
    const showByTvdb = /* @__PURE__ */ new Map();
    const showByTmdb = /* @__PURE__ */ new Map();
    for (const sh of [...this._sonarr || [], ...this._sonarr2 || []]) {
      if (sh.tvdbId && !showByTvdb.has(String(sh.tvdbId))) showByTvdb.set(String(sh.tvdbId), sh);
      if (sh.tmdbId && !showByTmdb.has(String(sh.tmdbId))) showByTmdb.set(String(sh.tmdbId), sh);
    }
    const items = [];
    const seen = /* @__PURE__ */ new Set();
    for (const r of reqs) {
      const media = r?.media || {};
      const isMovie = (r?.type || "") === "movie";
      const tmdbId = media.tmdbId != null ? String(media.tmdbId) : null;
      const tvdbId = media.tvdbId != null ? String(media.tvdbId) : null;
      const dedupKey = `${isMovie ? "m" : "t"}:${tvdbId || tmdbId || r?.id}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);
      const entry = isMovie ? tmdbId ? movieByTmdb.get(tmdbId) : null : tvdbId && showByTvdb.get(tvdbId) || tmdbId && showByTmdb.get(tmdbId) || null;
      const base = entry ? { ...entry } : {
        id: null,
        title: media.title || r?.title || "Unknown",
        tmdbId: tmdbId ? Number(tmdbId) : null,
        tvdbId: tvdbId ? Number(tvdbId) : null,
        images: []
      };
      items.push({
        ...base,
        _mediaType: isMovie ? "movie" : "tv",
        _sortDate: r?.createdAt || r?.updatedAt || base.added || "",
        _seerr: true,
        _seerrOnly: !entry,
        _seerrPoster: media.posterPath || null,
        _seerrStatus: Number(r?.status ?? 0),
        // 1 pending, 2 approved, 3 declined
        _seerrMedia: Number(media.status ?? 0),
        // 3 processing, 4 partial, 5 available
        _seerrUser: r?.requestedBy?.displayName || r?.requestedBy?.plexUsername || ""
      });
    }
    const have = new Set(items.map((i) => `${i._mediaType === "movie" ? "m" : "t"}:${i.tvdbId || i.tmdbId}`));
    const _rqA = this._radarrQueueActive || /* @__PURE__ */ new Set();
    const _rq2A = this._radarr2QueueActive || /* @__PURE__ */ new Set();
    const _snQ = this._sonarrQueueSeriesPct || /* @__PURE__ */ new Map();
    const _snQ2 = this._sonarr2QueueSeriesPct || /* @__PURE__ */ new Map();
    const _now = (/* @__PURE__ */ new Date()).toISOString();
    const extras = [];
    if (this._cfgGet("discover", "requestedSource", "both") === "seerr") {
      return items.sort((a, b) => String(b._sortDate).localeCompare(String(a._sortDate)));
    }
    for (const [pool, queue] of [[this._radarr || [], _rqA], [this._radarr2 || [], _rq2A]]) {
      for (const m of pool) {
        const dl = queue.has(m.id);
        if (!dl && !this._pendingRequestedMovies.has(String(m.tmdbId))) continue;
        if (have.has(`m:${m.tmdbId}`)) continue;
        have.add(`m:${m.tmdbId}`);
        extras.push({ ...m, _mediaType: "movie", _sortDate: dl ? _now : m.added || "", _seerr: false });
      }
    }
    for (const [pool, queue] of [[this._sonarr || [], _snQ], [this._sonarr2 || [], _snQ2]]) {
      for (const sh of pool) {
        const dl = queue.has(sh.id);
        if (!dl && !this._pendingRequestedShows.has(String(sh.tvdbId))) continue;
        if (have.has(`t:${sh.tvdbId}`)) continue;
        have.add(`t:${sh.tvdbId}`);
        extras.push({ ...sh, _mediaType: "tv", _sortDate: dl ? _now : sh.added || "", _seerr: false });
      }
    }
    return [...extras, ...items].sort((a, b) => String(b._sortDate).localeCompare(String(a._sortDate)));
  }
  get recentlyRequested() {
    const fromSeerr = this._seerrRequestItems();
    if (fromSeerr) return fromSeerr;
    const _rqA = this._radarrQueueActive || /* @__PURE__ */ new Set();
    const _rq2A = this._radarr2QueueActive || /* @__PURE__ */ new Set();
    const _snQ = this._sonarrQueueSeriesPct || /* @__PURE__ */ new Map();
    const _snQ2 = this._sonarr2QueueSeriesPct || /* @__PURE__ */ new Map();
    const _pM = this._pendingRequestedMovies || /* @__PURE__ */ new Set();
    const _pS = this._pendingRequestedShows || /* @__PURE__ */ new Set();
    const _now = (/* @__PURE__ */ new Date()).toISOString();
    const movies = (this._radarr || []).filter((m) => (m.monitored || _rqA.has(m.id) || _pM.has(String(m.tmdbId))) && !m.hasFile).map((m) => ({ ...m, _mediaType: "movie", _sortDate: m.added || "" }));
    const movies2 = (this._radarr2 || []).filter((m) => (m.monitored || _rq2A.has(m.id) || _pM.has(String(m.tmdbId))) && !m.hasFile).map((m) => ({ ...m, _mediaType: "movie", _isRadarr2: true, _sortDate: m.added || "" }));
    const shows = (this._sonarr || []).filter((s) => (s.monitored || _snQ.has(s.id) || _pS.has(String(s.tvdbId))) && ((s.statistics?.episodeFileCount ?? 0) === 0 || _snQ.has(s.id))).map((s) => ({ ...s, _mediaType: "tv", _sortDate: _snQ.has(s.id) && (s.statistics?.episodeFileCount ?? 0) > 0 ? _now : s.added || "" }));
    const shows2 = (this._sonarr2 || []).filter((s) => (s.monitored || _snQ2.has(s.id) || _pS.has(String(s.tvdbId))) && ((s.statistics?.episodeFileCount ?? 0) === 0 || _snQ2.has(s.id))).map((s) => ({ ...s, _mediaType: "tv", _isSonarr2: true, _sortDate: _snQ2.has(s.id) && (s.statistics?.episodeFileCount ?? 0) > 0 ? _now : s.added || "" }));
    const _isDlMovie = (m) => m._isRadarr2 ? _rq2A.has(m.id) : _rqA.has(m.id);
    const _isDlShow = (s) => s._isSonarr2 ? _snQ2.has(s.id) : _snQ.has(s.id);
    const movieMap = /* @__PURE__ */ new Map();
    for (const m of [...movies, ...movies2]) {
      const key = m.tmdbId ? String(m.tmdbId) : `_uid_m_${m._isRadarr2 ? "r2" : "r1"}_${m.id}`;
      const ex = movieMap.get(key);
      if (!ex || !_isDlMovie(ex) && _isDlMovie(m)) movieMap.set(key, m);
    }
    const showMap = /* @__PURE__ */ new Map();
    for (const s of [...shows, ...shows2]) {
      const key = s.tvdbId ? String(s.tvdbId) : `_uid_s_${s._isSonarr2 ? "s2" : "s1"}_${s.id}`;
      const ex = showMap.get(key);
      if (!ex || !_isDlShow(ex) && _isDlShow(s)) showMap.set(key, s);
    }
    const _movieHasFile = /* @__PURE__ */ new Set([
      ...(this._radarr || []).filter((m) => m.hasFile && m.tmdbId).map((m) => String(m.tmdbId)),
      ...(this._radarr2 || []).filter((m) => m.hasFile && m.tmdbId).map((m) => String(m.tmdbId))
    ]);
    const _showHasEps = /* @__PURE__ */ new Set([
      ...(this._sonarr || []).filter((s) => (s.statistics?.episodeFileCount ?? 0) > 0 && s.tvdbId).map((s) => String(s.tvdbId)),
      ...(this._sonarr2 || []).filter((s) => (s.statistics?.episodeFileCount ?? 0) > 0 && s.tvdbId).map((s) => String(s.tvdbId))
    ]);
    const finalMovies = [...movieMap.values()].filter((m) => {
      const key = m.tmdbId ? String(m.tmdbId) : null;
      return !key || !_movieHasFile.has(key);
    });
    const finalShows = [...showMap.values()].filter((s) => {
      if (_isDlShow(s)) return true;
      const key = s.tvdbId ? String(s.tvdbId) : null;
      return !key || !_showHasEps.has(key);
    });
    return [...finalMovies, ...finalShows, ...this._rqMusicItems()].sort((a, b) => b._sortDate.localeCompare(a._sortDate));
  }
  // Artists whose music is still on its way — monitored with tracks missing, or
  // with something in Lidarr's queue right now. Newest request first, and the
  // album named is the one that prompted it.
  _rqMusicItems() {
    if (this._lidarrConfigured === false) return [];
    const dl = this._lidarrQueueArtists || /* @__PURE__ */ new Map();
    const out = [];
    for (const a of this._lidarrArtists?.values() || []) {
      const st = a.statistics || {};
      const have = st.trackFileCount ?? 0;
      const total = st.trackCount ?? 0;
      const downloading = dl.has(a.id);
      const missing = total > 0 ? have < total : have === 0;
      if (!downloading && !(a.monitored && missing)) continue;
      const feed = (this._lidarrArtistFeed || []).find((e) => e.id === a.id);
      out.push({
        id: a.id,
        artist: a,
        newestAlbum: feed?.newestAlbum || null,
        newAlbumCount: 0,
        _mediaType: "music",
        _sortDate: a.added || ""
      });
    }
    return out;
  }
  // Paginated vertical list (for download items)
  _pagedList(items, section, renderFn, perPage = 4, innerClass = "", overlayHtml = "") {
    if (!items || items.length === 0)
      return innerClass ? `<div class="${innerClass} dc-no-chev">${overlayHtml}<div class="placeholder">${this._t("noDownloads")}</div></div>` : `<div class="placeholder">${this._t("noDownloads")}</div>`;
    const page = this._pages[section] || 0;
    const totalPages = Math.ceil(items.length / perPage);
    const pageItems = items.slice(page * perPage, page * perPage + perPage);
    const dir = this._pageDir[section] || "";
    const animClass = dir === "next" ? "anim-next" : dir === "prev" ? "anim-prev" : "";
    const list = `<div class="dl-list ${animClass}">${pageItems.map((it) => renderFn(it)).join("")}</div>`;
    if (totalPages <= 1) {
      return innerClass ? `<div class="${innerClass} dc-no-chev">${overlayHtml}${list}</div>` : list;
    }
    const prevDis = page === 0 ? "disabled" : "";
    const nextDis = page >= totalPages - 1 ? "disabled" : "";
    const inner = innerClass ? `<div class="${innerClass}" style="flex:1;min-width:0">${overlayHtml}${list}</div>` : list;
    return `
      <div class="pg-wrap">
        <button class="pg-btn" data-section="${section}" data-dir="prev" ${prevDis}>\u2039</button>
        ${inner}
        <button class="pg-btn" data-section="${section}" data-dir="next" ${nextDis}>\u203A</button>
      </div>`;
  }
  // ─────────────────────────────────────────────
  // Fetch helpers
  // ─────────────────────────────────────────────
  // Odstraní focus před innerHTML zápisem — zabrání neočekávanému chování prohlížeče.
  _blurActive() {
    const el = this.shadowRoot.activeElement || document.activeElement;
    if (el && typeof el.blur === "function") el.blur();
  }
  // Floating nav — IntersectionObserver na sentinel.
  // Nav se zobrazí (fade-in) když uživatel scrolluje k pravé sekci.
  // Observer 1 (col-left): zobraz nav když col-left vyjede z viewportu — pro standardní stránky.
  // Observer 2 (col-right): záloha pro krátké stránky kde scroll nestačí ke spuštění obs. 1.
  _wireStickyNav() {
    if (window.matchMedia("(min-width: 901px)").matches) return;
    const colLeft = this.shadowRoot.getElementById("col-left");
    const colRight = this.shadowRoot.getElementById("col-right");
    if (!colLeft) return;
    this._clearNavWatcher();
    const raw = this._cfg.sticky_nav_offset ?? this._cfg.stickyNavOffset;
    const offset = raw != null ? Math.max(0, parseInt(raw)) : 100;
    const swapped = !!this._cfg?.swap_sides;
    const left = swapped ? colRight : colLeft;
    const right = swapped ? colLeft : colRight;
    const syncNav = () => {
      const nav = this.shadowRoot.querySelector(".rp-nav");
      if (!nav) return;
      const lRect = left.getBoundingClientRect();
      const leftIsGone = lRect.bottom < offset;
      let rightEnough = false;
      if (right && lRect.top < 0) {
        const rRect = right.getBoundingClientRect();
        const vh = window.innerHeight;
        const visible = Math.min(rRect.bottom, vh) - Math.max(rRect.top, 0);
        rightEnough = rRect.height > 0 && visible / rRect.height >= 0.9;
      }
      nav.classList.toggle("rp-nav-visible", leftIsGone || rightEnough);
    };
    syncNav();
    this._navInterval = setInterval(syncNav, 150);
  }
  _clearNavWatcher() {
    if (this._navObserver) {
      this._navObserver.disconnect();
      this._navObserver = null;
    }
    if (this._navObserver2) {
      this._navObserver2.disconnect();
      this._navObserver2 = null;
    }
    if (this._navInterval) {
      clearInterval(this._navInterval);
      this._navInterval = null;
    }
    if (this._navScrollHandler) {
      document.removeEventListener("scroll", this._navScrollHandler, true);
      this._navScrollHandler = null;
    }
  }
  // Po přepnutí stránky pravého sloupce (rp-btn / rp-dot):
  // Zachytí scroll stav těsně před re-renderem pravého sloupce.
  // Musí být voláno PŘED right.innerHTML = ..., proto jako samostatná metoda.
  _captureScrollState() {
    if (!window.matchMedia("(max-width: 900px)").matches) return null;
    const sc = this._findScrollContainer();
    const colLeft = this.shadowRoot.getElementById("col-left");
    const colRight = this.shadowRoot.getElementById("col-right");
    if (!sc) return null;
    const swapped = !!this._cfg?.swap_sides;
    const topCol = swapped ? colRight : colLeft;
    const bottomCol = swapped ? colLeft : colRight;
    const prevScrollTop = sc.scrollTop;
    const atBottom = sc.scrollHeight - sc.scrollTop - sc.clientHeight < 60;
    let shortPage = false;
    if (atBottom && topCol && bottomCol) {
      const rRect = bottomCol.getBoundingClientRect();
      const lRect = topCol.getBoundingClientRect();
      shortPage = rRect.top >= 0 && lRect.top < 0;
    }
    return { sc, prevScrollTop, atBottom, shortPage };
  }
  // Po přepnutí stránky pravého sloupce (rp-btn / rp-dot):
  // Na mobilu přeskočíme _measureAndLockHeight() — zabrání scroll-to-top (stejný princip jako u pg-btn).
  // Na desktopu měříme výšky normálně.
  // scrollState musí být zachycen PŘED renderem (viz _captureScrollState).
  _afterRightPageSwitch(scrollState = null) {
    const isMobile2 = window.matchMedia("(max-width: 900px)").matches;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._checkBadgeOverflow();
        if (!isMobile2 || !scrollState) return;
        const { sc, prevScrollTop, atBottom, shortPage } = scrollState;
        if (shortPage) {
          const swapped = !!this._cfg?.swap_sides;
          const topColId = swapped ? "col-right" : "col-left";
          const topCol = this.shadowRoot.getElementById(topColId);
          if (topCol) {
            const raw = this._cfg.sticky_nav_offset ?? this._cfg.stickyNavOffset;
            const offset = raw != null ? Math.max(0, parseInt(raw)) : 100;
            const lRect = topCol.getBoundingClientRect();
            sc.scrollTop += lRect.bottom - offset + 1;
          }
        } else if (atBottom) {
          sc.scrollTop = sc.scrollHeight;
        } else {
          sc.scrollTop = prevScrollTop;
        }
      });
    });
    this._trimActivityCards();
  }
  // Projde DOM stromem nahoru přes shadow DOM hranice a vrátí první scroll container.
  // scrollIntoView() / window.scroll nejsou spolehlivé v HA shadow DOM na Android Chrome.
  _findScrollContainer() {
    let node = this;
    for (let i = 0; i < 20; i++) {
      const next = node.parentNode ?? (node.getRootNode?.() !== document ? node.getRootNode?.()?.host : null);
      if (!next || next === document || next === window) break;
      node = next;
      if (node.nodeType !== 1) continue;
      try {
        const oy = window.getComputedStyle(node).overflowY;
        if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight + 1) {
          return node;
        }
      } catch (_) {
      }
    }
    return document.documentElement;
  }
  // Generic helper for modal/table search bars — recomputes the full render via `renderFn`
  // (unavoidable, cheapest option given how these render functions are written) but only
  // patches the `.wrapClass` subtree's innerHTML, never touching whatever lives outside it
  // (the search input, filter/sort selects, tab buttons). Recreating an <input> the user is
  // actively typing into is what closes the keyboard on iOS — this keeps it untouched.
  _patchResultsWrap(root, wrapClass, renderFn) {
    const target = root?.querySelector(`.${wrapClass}`);
    if (!target) {
      root.innerHTML = renderFn();
      return;
    }
    const temp = document.createElement("div");
    temp.innerHTML = renderFn();
    const fresh = temp.querySelector(`.${wrapClass}`);
    if (!fresh) {
      root.innerHTML = renderFn();
      return;
    }
    target.innerHTML = fresh.innerHTML;
  }
  // Updates only the search results grid (+ inline TV overlay), never touching
  // .search-bar-wrap — recreating the <input> there closes the keyboard on iOS
  // every time results refresh while the user is still typing.
  // Only safe once the right panel is already in the search-only layout
  // (_renderRight()'s searchActive branch) — otherwise other categories
  // still shown alongside the search bar would never get hidden.
  _reRenderSearchResults() {
    if (!this._searchOnlyLayout) {
      this._reRenderRight(true);
      return;
    }
    const wrap = this.shadowRoot.querySelector(".sec-search .search-results-wrap");
    if (!wrap) {
      this._reRenderRight(true);
      return;
    }
    const html = this._renderSearchResultsInner();
    if (html !== this._searchResultsHtml || !wrap.firstElementChild) {
      this._searchResultsHtml = html;
      wrap.innerHTML = html;
    }
    const clearBtn = this.shadowRoot.querySelector(".sec-search .search-bar-clear");
    if (clearBtn) clearBtn.style.display = this._searchActive ? "" : "none";
    this._wireSearchResultCards(wrap);
  }
  _reRenderRight(force = false) {
    const right = this.shadowRoot.getElementById("col-right");
    if (!right) return;
    if (!force && (this._requestPending || this._searchActive)) return;
    const enteringSearchLayout = this._searchActive && !this._searchOnlyLayout;
    this._searchOnlyLayout = this._searchActive;
    if (!this._searchActive) this._blurActive();
    if (this._searchActive) {
      if (enteringSearchLayout || this._searchMaxH == null) this._searchMaxH = this._measureSearchMaxHeight();
      const lockH = this._searchLockHeight();
      if (lockH) right.style.minHeight = lockH + "px";
    }
    right.innerHTML = this._renderRight();
    this._wirePageButtons();
    this._wirePopup();
    this._wireOverseerrButtons();
    this._wireSearch();
    this._wireTraktButtons();
    this._wireTautulliPosters(right);
    this._wireJellystatPosters(right);
    this._wireTracearrPosters(right);
    this._wireActivityPosters(right);
    this._wireProwlarrPosters(right);
    this._wireMaintainerrPosters(right);
    this._wireTmdbNotice(right);
    this._wireLibraryTiles(right);
    this._syncSecHeights(false);
    requestAnimationFrame(() => this._syncSecHeights());
    if (this._searchActive) {
      const srWrap = right.querySelector(".search-results-wrap");
      if (srWrap) this._wireSearchResultCards(srWrap);
    }
    this._trimActivityCards();
    requestAnimationFrame(() => {
      if (!this._searchActive) {
        const isMobile2 = window.matchMedia("(max-width: 900px)").matches;
        if (isMobile2) {
          const sc = this._findScrollContainer();
          const savedTop = sc ? sc.scrollTop : 0;
          this._measureAndLockHeight();
          if (sc) sc.scrollTop = savedTop;
        } else {
          this._measureAndLockHeight();
        }
      }
      requestAnimationFrame(() => this._checkBadgeOverflow());
    });
  }
  // Combined height lock while search is active — the greater of the cached
  // normal-browsing height and the search grid's own max-across-pages height.
  _searchLockHeight() {
    return Math.max(this._rightMaxH || 0, this._searchMaxH || 0) || null;
  }
  // Přeměří všechny stránky search výsledků a vrátí nejvyšší scrollHeight —
  // stejná logika jako _measureAndLockHeight(), ale iteruje _searchPage místo _rightPage.
  _measureSearchMaxHeight() {
    const right = this.shadowRoot.getElementById("col-right");
    if (!right) return 0;
    const savedPage = this._searchPage;
    let maxH = 0;
    right.style.visibility = "hidden";
    right.style.minHeight = "";
    for (let p = 0; p < 20; p++) {
      this._searchPage = p;
      right.innerHTML = this._renderRight();
      maxH = Math.max(maxH, right.scrollHeight);
      const hasNext = !!right.querySelector('.rp-btn[data-dir="next"]:not(.rp-btn-hidden):not([disabled])');
      if (!hasNext) break;
    }
    this._searchPage = savedPage;
    right.style.visibility = "";
    return maxH;
  }
  // Přeměří všechny stránky pravého sloupce a nastaví min-height na nejvyšší.
  // Každá outer stránka se měří se všemi _pages sekcí = 0 (nejvyšší možná varianta).
  // Vše proběhne synchronně v jednom JS tiku — browser nestihne malovat.
  _measureAndLockHeight() {
    const right = this.shadowRoot.getElementById("col-right");
    if (!right) return;
    if (this._overlay?.section && this._rightMaxH) {
      if (!window.matchMedia("(max-width: 900px)").matches) {
        right.style.minHeight = this._rightMaxH + "px";
      }
      this._wirePageButtons();
      this._wirePopup();
      this._wireOverseerrButtons();
      this._wireSearch();
      return;
    }
    const savedPage = this._rightPage;
    const savedPages = { ...this._pages };
    let maxH = 0;
    right.style.visibility = "hidden";
    right.style.minHeight = "";
    for (let p = 0; p < 20; p++) {
      this._rightPage = p;
      Object.keys(this._pages).forEach((k) => {
        this._pages[k] = 0;
      });
      right.innerHTML = this._renderRight();
      maxH = Math.max(maxH, right.scrollHeight);
      const hasNext = !!right.querySelector('.rp-btn[data-dir="next"]:not(.rp-btn-hidden):not([disabled])');
      if (!hasNext) break;
    }
    this._rightPage = savedPage;
    Object.assign(this._pages, savedPages);
    right.innerHTML = this._renderRight();
    right.style.visibility = "";
    this._rightMaxH = maxH;
    right.style.minHeight = maxH + "px";
    this._wirePageButtons();
    this._wirePopup();
    this._wireOverseerrButtons();
    this._wireSearch();
  }
  _checkBadgeOverflow() {
    this.shadowRoot.querySelectorAll(".mc").forEach((card) => {
      const row = card.querySelector(".mc-act") || card.querySelector(".mc-badges");
      if (!row) return;
      const overflows = row.scrollWidth > row.clientWidth + 1;
      card.classList.toggle("badge-compact", overflows);
    });
  }
  async _fetchPendingRequests() {
    if (!this._hass.user.is_admin) return;
    if (this._overseerrConfigured === false) {
      this._pendingRequests = [];
      return;
    }
    try {
      const data = await this._hass.callApi("GET", "arr_stack/overseerr/pending");
      this._pendingRequests = data?.results ?? [];
    } catch (e) {
      console.error("[arr-card] Pending requests fetch error:", e);
      this._pendingRequests = [];
    }
  }
  // ── LocalStorage helpers pro pending žádosti (přežije refresh stránky) ──
  _pendingStorageKey() {
    return `arr_stack_pending_${this._hass?.user?.id || "default"}`;
  }
  _loadPendingFromStorage() {
    if (this._hass?.user?.is_admin) return;
    try {
      const raw = localStorage.getItem(this._pendingStorageKey());
      if (raw) {
        const obj = JSON.parse(raw);
        this._familyPendingIds = new Map(
          Object.entries(obj).map(([k, v]) => [Number(k), v])
        );
      }
    } catch (e) {
    }
  }
  _savePendingToStorage() {
    if (this._hass?.user?.is_admin) return;
    try {
      const obj = {};
      this._familyPendingIds.forEach((reqId, tmdbId) => {
        obj[tmdbId] = reqId;
      });
      localStorage.setItem(this._pendingStorageKey(), JSON.stringify(obj));
    } catch (e) {
    }
  }
  _seerrAccountForUser() {
    if (this._hass.user.is_admin) return "admin";
    const map = this._config.seerr_user_map || [];
    const userId = this._hass.user.id;
    const specific = map.find((m) => m.ha === userId);
    if (specific) return specific.seerr;
    const def = map.find((m) => m.ha === "all_non_admin");
    if (def) return def.seerr;
    return "family";
  }
  async _fetchMyPendingRequests() {
    if (this._hass.user.is_admin) return;
    if (this._overseerrConfigured === false) return;
    try {
      const acct = this._seerrAccountForUser();
      const data = await this._hass.callApi("GET", `arr_stack/overseerr/my_pending?userMode=${acct}`);
      const results = data?.results || [];
      const serverReqMap = new Map(results.map((r) => [r.id, r.status]));
      let changed = false;
      for (const [tmdbId, reqId] of this._familyPendingIds) {
        const serverStatus = serverReqMap.get(reqId);
        if (serverStatus === void 0 || serverStatus === 3) {
          this._familyPendingIds.delete(tmdbId);
          changed = true;
        }
      }
      const knownReqIds = new Set(this._familyPendingIds.values());
      for (const r of results) {
        if (r.status !== 1) continue;
        const tmdbId = Number(r.media?.tmdbId);
        if (!tmdbId) continue;
        if (this._familyPendingIds.has(tmdbId)) continue;
        if (knownReqIds.has(r.id)) continue;
        this._familyPendingIds.set(tmdbId, r.id);
        changed = true;
      }
      if (changed) {
        this._savePendingToStorage();
        this._reRenderRight();
      }
    } catch (e) {
      console.error("[arr-card] my_pending fetch error:", e);
    }
  }
  _optimisticRemovePending(requestId) {
    this._pendingRequests = this._pendingRequests.filter((r) => r.id !== requestId);
    const newTotal = Math.ceil(this._pendingRequests.length / 4);
    this._pages.pending = Math.max(0, Math.min(this._pages.pending, newTotal - 1));
    this._reRenderRight();
  }
  async _approvePendingRequest(requestId) {
    const req = this._pendingRequests.find((r) => r.id === requestId);
    const isMovie = req?.type === "movie";
    this._optimisticRemovePending(requestId);
    try {
      if (isMovie && !this._seerrRadarr) await this._fetchOverseerrRadarrSettings();
      if (!isMovie && !this._seerrSonarr) await this._fetchOverseerrSonarrSettings();
      const seerr = isMovie ? this._seerrRadarr : this._seerrSonarr;
      const body = { requestId };
      if (seerr) {
        body.mediaType = isMovie ? "movie" : "tv";
        body.serverId = seerr.serverId;
        body.profileId = seerr.profileId;
        body.rootFolder = seerr.rootFolder;
        if (!isMovie && req?.seasons) body.seasons = req.seasons.map((s) => s.seasonNumber);
      }
      await this._hass.callApi("POST", "arr_stack/overseerr/approve", body);
      await Promise.all([
        this._fetchPendingRequests(),
        this._fetchRadarr(),
        this._fetchSonarr()
      ]);
      this._reRenderRight();
    } catch (e) {
      await this._fetchPendingRequests();
      this._reRenderRight();
      console.error("[arr-card] Approve request error:", e);
    }
  }
  async _declinePendingRequest(requestId) {
    this._optimisticRemovePending(requestId);
    try {
      await this._hass.callApi("POST", "arr_stack/overseerr/decline", { requestId });
      this._fetchPendingRequests().then(() => this._reRenderRight());
    } catch (e) {
      await this._fetchPendingRequests();
      this._reRenderRight();
      console.error("[arr-card] Decline request error:", e);
    }
  }
  async _withdrawOverseerrRequest(requestId, mediaId) {
    this._markActivated();
    this._optimisticRequested.delete(mediaId);
    this._familyPendingIds.delete(mediaId);
    this._savePendingToStorage();
    this._withdrawnIds.add(mediaId);
    this._reRenderRight();
    try {
      await this._hass.callApi("POST", "arr_stack/overseerr/request_delete", { requestId });
      await this._fetchOverseerr();
      await this._fetchTvUpcoming();
      this._withdrawnIds.delete(mediaId);
      this._reRenderRight();
    } catch (e) {
      this._withdrawnIds.delete(mediaId);
      this._reRenderRight();
      console.error("[arr-card] Withdraw request error:", e);
    }
  }
  // ─────────────────────────────────────────────
  // Shell build (CSS + skeleton)
  // ─────────────────────────────────────────────
  _buildShell() {
    const style = document.createElement("style");
    style.textContent = this._css();
    const userStyles = this._cfg?.styles || {};
    const perfMode = !!(userStyles.performanceMode || this._cfg?.performanceMode);
    const customVars = [];
    const hexRgba = (hex, alpha) => {
      if (!hex || !hex.startsWith("#")) return null;
      const rgb = this._hexToRgb(hex);
      return rgb ? `rgba(${rgb},${alpha})` : null;
    };
    if (perfMode && userStyles.cardBackground) {
      const opacityPct = userStyles.cardBackgroundOpacity;
      const alpha = typeof opacityPct === "number" && opacityPct >= 0 && opacityPct <= 100 ? opacityPct / 100 : 0.9;
      const v = hexRgba(userStyles.cardBackground, alpha);
      if (v) customVars.push(`--card-bg-perf: ${v}`);
    }
    const layout = this._cfg?.layout || "both";
    const wrapper = document.createElement("div");
    wrapper.className = "card";
    const layoutClass = layout === "left" ? " layout-left" : layout === "right" ? " layout-right" : "";
    const perfClass = this._cfg?.styles?.performanceMode || this._cfg?.performanceMode ? " perf-mode" : "";
    const swapClass = this._cfg?.swap_sides ? " swap-sides" : "";
    wrapper.innerHTML = `<div class="card-body${layoutClass}${perfClass}${swapClass}">
      <div class="col col-left" id="col-left"></div>
      <div class="col col-right" id="col-right"></div>
    </div>`;
    const popupRoot = document.createElement("div");
    popupRoot.id = "popup-root";
    this.shadowRoot.appendChild(style);
    if (customVars.length) {
      const varStyle = document.createElement("style");
      varStyle.textContent = `:host { ${customVars.join("; ")}; }`;
      this.shadowRoot.appendChild(varStyle);
    }
    const calModalRoot = document.createElement("div");
    calModalRoot.id = "cal-modal-root";
    const tmdbModalRoot = document.createElement("div");
    tmdbModalRoot.id = "tmdb-modal-root";
    const dlInfoRoot = document.createElement("div");
    dlInfoRoot.id = "dl-info-root";
    this.shadowRoot.appendChild(wrapper);
    this.shadowRoot.appendChild(popupRoot);
    this.shadowRoot.appendChild(calModalRoot);
    this.shadowRoot.appendChild(tmdbModalRoot);
    this.shadowRoot.appendChild(dlInfoRoot);
    this._applyTheme();
  }
  // ─────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────
  _render() {
    const left = this.shadowRoot.getElementById("col-left");
    const right = this.shadowRoot.getElementById("col-right");
    if (!left || !right) return;
    this._measureFlagRatio();
    this._watchOverlays();
    const layout = this._cfg?.layout || "both";
    if (layout !== "right") {
      const leftContent = this._renderLeft();
      const leftHtml = this._mobMinWrap("left", leftContent);
      if (leftHtml !== this._lastLeftHtml) {
        this._lastLeftHtml = leftHtml;
        left.innerHTML = leftHtml;
      }
      const body = this.shadowRoot.querySelector(".card-body");
      if (body) body.classList.toggle("no-downloads", !leftContent);
    }
    if (this._requestPending || this._searchActive) return;
    if (layout !== "left") right.innerHTML = this._mobMinWrap("right", this._renderRight());
    this._wireSort();
    this._wireActionButtons();
    this._wireOverseerrButtons();
    this._wirePageButtons();
    this._wirePopup();
    this._wireSearch();
    if (right) this._wireTautulliPosters(right);
    if (right) this._wireJellystatPosters(right);
    if (right) this._wireTracearrPosters(right);
    if (right) this._wireActivityPosters(right);
    if (right) this._wireProwlarrPosters(right);
    if (right) this._wireMaintainerrPosters(right);
    if (right) this._wireTmdbNotice(right);
    if (right) this._wireLibraryTiles(right);
    this._syncSecHeights(false);
    this._renderPopupEl();
    this._renderCalendarModalEl();
    this._wireMinimize();
    requestAnimationFrame(() => {
      this._syncSecHeights();
      if (!window.matchMedia("(max-width: 900px)").matches) this._measureAndLockHeight();
      requestAnimationFrame(() => {
        this._checkBadgeOverflow();
        this._fixPeerChips();
      });
    });
    this._trimActivityCards();
  }
  _renderDlInfoEl() {
    const root = this.shadowRoot?.getElementById("dl-info-root");
    if (!root) return;
    root.innerHTML = this._dlInfoOpen ? this._renderDlInfoModal() : "";
    if (!this._dlInfoOpen) return;
    const close = () => {
      this._dlInfoOpen = false;
      this._renderDlInfoEl();
    };
    root.querySelector("[data-dl-info-close]")?.addEventListener("click", close);
    root.querySelector("[data-dl-info-modal]")?.addEventListener("click", (e) => {
      if (!e.target.closest(".info-modal")) close();
    });
  }
  _renderTmdbModalEl() {
    const root = this.shadowRoot?.getElementById("tmdb-modal-root");
    if (!root) return;
    root.innerHTML = this._tmdbInfoOpen ? this._renderTmdbModal() : "";
    if (!this._tmdbInfoOpen) return;
    const close = () => {
      this._tmdbInfoOpen = false;
      this._renderTmdbModalEl();
    };
    root.querySelector("[data-tmdb-info-close]")?.addEventListener("click", close);
    root.querySelector("[data-info-modal]")?.addEventListener("click", (e) => {
      if (!e.target.closest(".tmdb-modal")) close();
    });
  }
  _renderCalendarModalEl() {
    const root = this.shadowRoot?.getElementById("cal-modal-root");
    if (!root) return;
    root.innerHTML = this._calendarModalOpen ? this._renderCalendarModal() : "";
    if (this._calendarModalOpen) {
      this._wireCalendarModal();
      this._wirePopup();
      this._calAnimType = false;
      this._calAnimView = false;
      this._syncSegVars(root);
      root.querySelectorAll(".mt-seg[data-seg-to]").forEach((seg) => {
        if (seg.dataset.seg === seg.dataset.segTo) return;
        requestAnimationFrame(() => {
          seg.dataset.seg = seg.dataset.segTo;
        });
      });
    }
  }
  _fixPeerChips() {
    this.shadowRoot?.querySelectorAll(".dl-r2 .dm-peer").forEach((el) => {
      el.style.display = "";
      const r2 = el.closest(".dl-r2");
      if (!r2) return;
      if (el.getBoundingClientRect().right > r2.getBoundingClientRect().right + 2) {
        el.style.display = "none";
      }
    });
  }
  // ─────────────────────────────────────────────
  // Left column
  // ─────────────────────────────────────────────
  // ─────────────────────────────────────────────
  // Mobile minimize / restore
  // ─────────────────────────────────────────────
  // Wraps rendered HTML with minimize bar — call before every innerHTML assignment.
  // Buttons are baked into HTML so they survive all re-renders.
  _mobMinWrap(side, html) {
    if (!window.matchMedia("(max-width:900px)").matches || !html) return html || "";
    const isMin = side === "left" ? this._leftMinimized : this._rightMinimized;
    const btnBase = "width:18px;height:18px;border-radius:50%;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid rgba(0,0,0,0.25)";
    const minusSvg = `<svg width="10" height="2" viewBox="0 0 10 2"><rect x="0" y="0" width="10" height="2" rx="1" fill="rgba(0,0,0,0.55)"/></svg>`;
    const plusSvg = `<svg width="10" height="10" viewBox="0 0 10 10"><line x1="5" y1="1" x2="5" y2="9" stroke="rgba(0,0,0,0.55)" stroke-width="1.8" stroke-linecap="round"/><line x1="1" y1="5" x2="9" y2="5" stroke="rgba(0,0,0,0.55)" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    const sectionLabel = side === "left" ? "Download Manager" : "Discovery";
    if (isMin) {
      return `<div data-min-content="${side}" style="display:none">${html}</div>
      <div style="height:20px;display:flex;align-items:center;justify-content:center">
        <span style="font-size:11px;font-weight:700;color:var(--is-text-muted);text-transform:uppercase;letter-spacing:0.07em">${sectionLabel}</span>
      </div>
      <button data-min-restore="${side}" title="Restore" style="${btnBase};background:rgba(39,201,63,0.85);position:absolute;top:12px;right:14px;z-index:5">${plusSvg}</button>`;
    }
    return `<div data-min-content="${side}">${html}</div>
    <button data-min-btn="${side}" title="Minimize" style="${btnBase};background:rgba(255,189,46,0.85);position:absolute;top:12px;right:14px;z-index:5">${minusSvg}</button>`;
  }
  // Wires minimize/restore click events. Must be called after every innerHTML update.
  _wireMinimize() {
    if (!window.matchMedia("(max-width:900px)").matches) return;
    ["left", "right"].forEach((side) => {
      const col = this.shadowRoot.getElementById(`col-${side}`);
      if (!col) return;
      col.querySelector(`[data-min-btn="${side}"]`)?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (side === "left") this._leftMinimized = true;
        else this._rightMinimized = true;
        try {
          localStorage.setItem(`arr-${side}-minimized`, "1");
        } catch {
        }
        this._render();
      });
      col.querySelector(`[data-min-restore="${side}"]`)?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (side === "left") this._leftMinimized = false;
        else this._rightMinimized = false;
        try {
          localStorage.removeItem(`arr-${side}-minimized`);
        } catch {
        }
        this._render();
      });
    });
  }
  // ─────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────
  get _isMob() {
    return window.matchMedia("(max-width:600px)").matches;
  }
  get _isTablet() {
    return window.matchMedia("(max-width:900px)").matches;
  }
  // Popup-sized breakpoint: tablets run wider than _isTablet's 900px cut-off —
  // a Nest Hub Max is 1280 — so this one has to clear the widest of them.
  get _isNarrow() {
    return window.matchMedia("(max-width:1400px)").matches;
  }
  // Selected state for a header tab pill or a segmented control, shared by every
  // category so they stay identical. The label is always white — a selected tab
  // reads as a filled chip, not as tinted text — which means day mode has to
  // carry a near-opaque fill, since white over a 50%-alpha blue on a light
  // background has almost no contrast.
  _tabFill(rgb = "0,122,255") {
    const day = this._isDay;
    return {
      bg: `rgba(${rgb},${day ? 0.85 : 0.5})`,
      bdr: `rgba(${rgb},${day ? 0.95 : 0.8})`,
      clr: "#fff"
    };
  }
  _importEpLabel(eps) {
    if (!eps || eps.length === 0) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const bySeason = {};
    for (const ep of eps) {
      if (!bySeason[ep.s]) bySeason[ep.s] = [];
      bySeason[ep.s].push(ep.e);
    }
    const seasons = Object.keys(bySeason).map(Number).sort((a, b) => a - b);
    const parts = [];
    for (const s of seasons) {
      const nums = [...new Set(bySeason[s])].sort((a, b) => a - b);
      if (nums.length === 1) {
        parts.push(`S${pad(s)}E${pad(nums[0])}`);
      } else {
        parts.push(`S${pad(s)}E${pad(nums[0])}-E${pad(nums[nums.length - 1])}`);
      }
    }
    return parts.join(" ");
  }
  get _isDay() {
    return !!(this._isDaytime && this._config?.styles?.dayNightMode !== false);
  }
  get _ratingProvider() {
    const v = this._cfgGet("posters", "ratingProvider", null) || this._cfgGet("discover", "ratingProvider", "imdb");
    return ["imdb", "tmdb"].includes(v) ? v : "imdb";
  }
  _fetchPosterRating(tmdbId, isMovie = true) {
    if (!this._overseerrConfigured || !tmdbId) return;
    const key = String(tmdbId);
    if (this._posterRatingsCache.has(key)) return;
    this._posterRatingsCache.set(key, null);
    const path = isMovie ? `overseerr/movie/${tmdbId}/ratings` : `overseerr/tv/${tmdbId}/ratings`;
    this._callApi("GET", `arr_stack/${path}`).then((data) => {
      this._posterRatingsCache.set(key, {
        rt: data?.criticsScore ?? data?.rottenTomatoes?.criticsScore ?? null,
        metacritic: data?.metacritic ?? null
      });
      this._render();
    }).catch(() => {
      this._posterRatingsCache.set(key, false);
    });
  }
  // TMDB voteAverage, used as the IMDb-provider poster fallback: Sonarr carries
  // only a generic TheTVDB score, and a film can be in Radarr with no IMDb
  // rating at all — the detail popup falls back to TMDB in both cases, so the
  // poster does too. Uses Overseerr when configured, otherwise the direct
  // public TMDB proxy (the same source _discoverSvc uses for discover data).
  // Films and shows are cached apart: the two number their ids separately and
  // the same id means different titles in each.
  _tmdbVoteKey(tmdbId, isMovie) {
    return `${isMovie ? "m" : "t"}${tmdbId}`;
  }
  _fetchPosterTmdbVote(tmdbId, isMovie = false) {
    if (!tmdbId) return;
    const key = this._tmdbVoteKey(tmdbId, isMovie);
    if (this._posterTmdbVoteCache.has(key)) return;
    this._posterTmdbVoteCache.set(key, null);
    const path = isMovie ? "movie" : "tv";
    this._callApi("GET", `arr_stack/${this._discoverSvc}/${path}/${tmdbId}`).then((data) => {
      this._posterTmdbVoteCache.set(key, data?.voteAverage || false);
      this._render();
    }).catch(() => {
      this._posterTmdbVoteCache.set(key, false);
    });
  }
  // Audio language badge for a Sonarr series in the Library category — lazy-fetched per
  // visible poster (only the current page, not the whole library) since Sonarr series
  // objects don't embed episode file info the way Radarr movies embed movieFile directly.
  _fetchLibTvAudio(seriesId, inst = "1") {
    if (!seriesId) return;
    const key = `${inst}-${seriesId}`;
    if (this._libTvAudioCache.has(key)) return;
    this._libTvAudioCache.set(key, null);
    const svc = inst === "2" ? "sonarr2" : "sonarr";
    this._callApi("GET", `arr_stack/${svc}/episodefiles?seriesId=${seriesId}`).then((files) => {
      const seen = /* @__PURE__ */ new Set();
      for (const f of Array.isArray(files) ? files : []) {
        if (Array.isArray(f.languages) && f.languages.length) {
          for (const l of f.languages) {
            const c = this._langCode(l.name || "");
            if (c) seen.add(c);
          }
        } else if (f.mediaInfo?.audioLanguages) {
          for (const l of f.mediaInfo.audioLanguages.split(/\s*[\/,]\s*/)) {
            const c = this._langCode(l.trim());
            if (c) seen.add(c);
          }
        }
      }
      const langs = [...seen];
      this._libTvAudioCache.set(key, langs.length ? langs : false);
      this._render();
    }).catch(() => {
      this._libTvAudioCache.set(key, false);
    });
  }
  // Bazarr answers per episode, with no series-level rollup, so a show's
  // subtitle languages are the union across its episodes. Missing languages win
  // over present ones — the same precedence a movie's badge uses. One request
  // per series, cached for the session.
  _fetchLibTvSubs(seriesId) {
    if (!seriesId || !this._bazarrConfigured) return;
    const key = String(seriesId);
    if (this._libTvSubCache.has(key)) return;
    this._libTvSubCache.set(key, null);
    this._callApi("GET", `arr_stack/bazarr/episodes?seriesId=${seriesId}`).then((res) => {
      const rows = res?.data || [];
      const missing = /* @__PURE__ */ new Set();
      const present = /* @__PURE__ */ new Set();
      for (const ep of rows) {
        for (const s of ep.missing_subtitles || []) missing.add((s.code2 || s.name || "?").toUpperCase());
        for (const s of ep.subtitles || []) if (s.code2 || s.name) present.add((s.code2 || s.name).toUpperCase());
      }
      const codes = missing.size ? [...missing] : [...present];
      this._libTvSubCache.set(key, codes.length ? { codes, missing: missing.size > 0 } : false);
      this._render();
    }).catch(() => {
      this._libTvSubCache.set(key, false);
    });
  }
  // How tall a flag emoji actually draws, as a fraction of its font-size. Apple
  // Color Emoji gives ~0.72, Noto Color Emoji on Android noticeably more — which
  // is why a hard-coded font-size made the flags overshoot the rating badge on
  // one platform and not the other. Measured once per session from the glyph's
  // own ink, then handed to CSS so the sizing is font-independent.
  _measureFlagRatio() {
    if (this._flagRatio != null) return;
    this._flagRatio = 0.72;
    try {
      const FS = 40, PAD = 20, SIZE = 120;
      const c = document.createElement("canvas");
      c.width = SIZE;
      c.height = SIZE;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.font = `${FS}px sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText("\u{1F1E8}\u{1F1FF}", PAD, PAD);
      const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
      let minY = SIZE, maxY = -1, minX = SIZE, maxX = -1;
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        if (data[(y * SIZE + x) * 4 + 3] > 10) {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
      if (maxY > minY) {
        const inkH = maxY - minY + 1;
        this._flagRatio = inkH / FS;
        this._flagAspect = (maxX - minX + 1) / inkH;
      }
    } catch (_) {
    }
    const host = this.shadowRoot?.host;
    if (host) {
      host.style.setProperty("--fl-ratio", String(this._flagRatio));
      if (this._flagAspect) host.style.setProperty("--fl-aspect", String(this._flagAspect));
    }
  }
  // Any modal in this card is a full-screen overlay, so the page behind it must
  // not keep scrolling under the finger. Watched rather than wired into each
  // open/close: there are two dozen places that mount an overlay, and a missed
  // one would leave the page locked. Phone only — on a desktop the page behind
  // a dialog scrolling is normal and harmless.
  _syncScrollLock() {
    if (!this._isMob) {
      if (this._scrollLocked) this._applyScrollLock(false);
      return;
    }
    const open = !!this.shadowRoot?.querySelector(".popup-overlay");
    if (open !== !!this._scrollLocked) this._applyScrollLock(open);
  }
  _applyScrollLock(on) {
    this._scrollLocked = on;
    const html = document.documentElement;
    const body = document.body;
    if (on) {
      const el = this._findScrollContainer();
      this._scrollRestore = {
        el: el && el !== html ? el : null,
        top: el ? el.scrollTop : 0,
        win: window.scrollY || window.pageYOffset || html.scrollTop || 0
      };
      this._prevHtmlOverflow = html.style.overflow;
      this._prevBodyOverflow = body.style.overflow;
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      body.style.overscrollBehavior = "none";
    } else {
      html.style.overflow = this._prevHtmlOverflow || "";
      body.style.overflow = this._prevBodyOverflow || "";
      body.style.overscrollBehavior = "";
      const saved = this._scrollRestore;
      this._scrollRestore = null;
      if (!saved || !saved.top && !saved.win) return;
      const restore = () => {
        if (saved.el) saved.el.scrollTop = saved.top;
        if (saved.win) {
          window.scrollTo(0, saved.win);
          if (!window.scrollY) html.scrollTop = saved.win;
        }
      };
      restore();
      requestAnimationFrame(() => requestAnimationFrame(restore));
    }
  }
  _watchOverlays() {
    if (this._overlayObserver || !this.shadowRoot) return;
    this._overlayObserver = new MutationObserver(() => this._syncScrollLock());
    this._overlayObserver.observe(this.shadowRoot, { childList: true, subtree: true });
    this._syncScrollLock();
  }
  _markActivated() {
    if (!this._actPingSent && !this._metricsOptOut) {
      this._actPingSent = true;
      this._sendPing();
    }
  }
  _sendPing() {
    if (this._metricsOptOut) return;
    try {
      const act = this._actPingSent ? 1 : 0;
      const sid = btoa(location.hostname).replace(/=/g, "").slice(0, 16);
      const svcs = [
        this._radarr2Configured !== false && "radarr2",
        this._sonarr2Configured !== false && "sonarr2",
        this._overseerrConfigured !== false && "overseerr",
        this._bazarrConfigured !== false && "bazarr",
        this._plexConfigured !== false && "plex",
        this._tautulliConfigured !== false && "tautulli",
        this._jellystatConfigured !== false && "jellystat",
        this._qbitConfigured !== false && "qbit",
        this._sabConfigured !== false && "sabnzbd",
        this._nzbgetConfigured !== false && "nzbget",
        this._delugeConfigured !== false && "deluge",
        this._traktConfigured !== false && "trakt",
        this._suggestarrConfigured !== false && "suggestarr",
        this._lidarrConfigured !== false && "lidarr",
        // Last.fm only counts as set up when it can actually suggest, which
        // takes a key and a library to compare against.
        this._lastfmConfigured && this._lidarrConfigured !== false && "lastfm",
        this._gluetunConfigured !== false && "gluetun",
        this._prowlarrConfigured !== false && "prowlarr",
        this._rtorrentConfigured !== false && "rtorrent",
        this._tracearrConfigured !== false && "tracearr",
        this._maintainerrConfigured !== false && "maintainerr",
        // Whether this install already has its own TMDB key. With the shared key
        // going away on 2026-09-01, this is what says how many installs without
        // Seerr still have to act.
        this._tmdbOwnKey === true && "tmdb_key",
        this._jellyfinConfigured === true && "jellyfin",
        this._config.seerr_user_map?.length > 0 && "seerr_users"
      ].filter(Boolean);
      fetch("https://arr-ping.martinargalas.workers.dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ v: "1.9.1", sid, svcs, mob: this._isMob ? 1 : 0, act })
      }).catch(() => {
      });
    } catch (_) {
    }
  }
  _escHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  // ─────────────────────────────────────────────
  // CSS
  // ─────────────────────────────────────────────
  _css() {
    return STYLES;
  }
  getCardSize() {
    return 10;
  }
  static getConfigElement() {
    return document.createElement("arr-stack-card-editor");
  }
  static getStubConfig() {
    return {
      localisation: "en",
      layout: "both",
      downloads: { torrentItems: 3, usenetItems: 3 },
      discover: { categoriesCount: 3, oneClickRequest: false, oneClickDefaultMovieProfile: "", oneClickDefaultShowProfile: "", oneClickTvSeasonMode: "first", oneClickNonAdminOnly: false },
      styles: { performanceMode: false, applicationIcons: "real", categoryOverlays: true }
    };
  }
};
function applyMixin(target, mixin) {
  for (const name of Object.getOwnPropertyNames(mixin)) {
    if (name !== "constructor") {
      Object.defineProperty(target, name, Object.getOwnPropertyDescriptor(mixin, name));
    }
  }
}
applyMixin(ArrStackCard.prototype, interactiveSearchMixin);
applyMixin(ArrStackCard.prototype, sonarrIsMixin);
applyMixin(ArrStackCard.prototype, autoSearchMixin);
applyMixin(ArrStackCard.prototype, sessionsMixin);
applyMixin(ArrStackCard.prototype, downloadsMixin);
applyMixin(ArrStackCard.prototype, arrMixin);
applyMixin(ArrStackCard.prototype, fetchMixin);
applyMixin(ArrStackCard.prototype, renderLeftMixin);
applyMixin(ArrStackCard.prototype, renderRightMixin);
applyMixin(ArrStackCard.prototype, mediaCardsMixin);
applyMixin(ArrStackCard.prototype, musicRenderMixin);
applyMixin(ArrStackCard.prototype, wireMusicMixin);
applyMixin(ArrStackCard.prototype, themeMixin);
applyMixin(ArrStackCard.prototype, wireMixin);
applyMixin(ArrStackCard.prototype, wireTautulliMixin);
applyMixin(ArrStackCard.prototype, wireJellystatMixin);
applyMixin(ArrStackCard.prototype, popupMixin);
applyMixin(ArrStackCard.prototype, tautulliSharedMixin);
applyMixin(ArrStackCard.prototype, tautulliTableMixin);
applyMixin(ArrStackCard.prototype, tautulliMixin);
applyMixin(ArrStackCard.prototype, tautulliGraphsMixin);
applyMixin(ArrStackCard.prototype, jellystatSharedMixin);
applyMixin(ArrStackCard.prototype, jellystatTableMixin);
applyMixin(ArrStackCard.prototype, jellystatMixin);
applyMixin(ArrStackCard.prototype, jellystatGraphsMixin);
applyMixin(ArrStackCard.prototype, wireTracearrMixin);
applyMixin(ArrStackCard.prototype, tracearrTableMixin);
applyMixin(ArrStackCard.prototype, tracearrMixin);
applyMixin(ArrStackCard.prototype, libraryMixin);
applyMixin(ArrStackCard.prototype, libraryWireMixin);
applyMixin(ArrStackCard.prototype, activityRenderMixin);
applyMixin(ArrStackCard.prototype, wireActivityMixin);
applyMixin(ArrStackCard.prototype, prowlarrRenderMixin);
applyMixin(ArrStackCard.prototype, wireProwlarrMixin);
applyMixin(ArrStackCard.prototype, maintainerrRenderMixin);
applyMixin(ArrStackCard.prototype, wireMaintainerrMixin);
customElements.define("arr-stack-card", ArrStackCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "arr-stack-card",
  name: "Arr Stack Card",
  description: "Media server dashboard \u2014 Radarr, Sonarr, Overseerr, SABnzbd, qBittorrent"
});

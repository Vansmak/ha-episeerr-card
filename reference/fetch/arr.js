
var _ArrMethods = class {
  async _fetchRadarr() {
    try {
      const data = await this._callApi("GET", "arr_stack/radarr/movies");
      const radarrFiltered = data.filter((m) => m.added && m.added !== "0001-01-01T00:00:00Z");
      this._radarrTotal = radarrFiltered.length;
      this._radarr = radarrFiltered.sort((a, b) => new Date(b.added) - new Date(a.added));
    } catch (e) {
      console.error("[arr-card] Radarr fetch error:", e);
    }
  }
  async _fetchSonarr() {
    try {
      const data = await this._callApi("GET", "arr_stack/sonarr/series");
      const sonarrFiltered = data.filter((s) => s.added && s.added !== "0001-01-01T00:00:00Z");
      this._sonarrAll = Array.isArray(data) ? data : [];
      this._sonarrTotal = sonarrFiltered.length;
      this._sonarr = sonarrFiltered.sort((a, b) => new Date(b.added) - new Date(a.added));
      await this._fetchSonarrRecentImports();
    } catch (e) {
      console.error("[arr-card] Sonarr fetch error:", e);
    }
  }
  _is503(e) {
    return e?.status === 503 || Number(e?.statusCode) === 503 || typeof e?.message === "string" && e.message.includes("503");
  }
  async _fetchRadarr2() {
    if (this._radarr2Configured === false) return;
    try {
      const data = await this._callApi("GET", "arr_stack/radarr2/movies");
      if (data && data._notConfigured) {
        this._radarr2Configured = false;
        return;
      }
      const tagged = (Array.isArray(data) ? data : []).map((m) => ({ ...m, _isRadarr2: true }));
      const filtered = tagged.filter((m) => m.added && m.added !== "0001-01-01T00:00:00Z");
      this._radarr2 = filtered.sort((a, b) => new Date(b.added) - new Date(a.added));
      this._radarr2Total = filtered.length;
      this._radarr2Configured = true;
      const map = /* @__PURE__ */ new Map();
      for (const m of filtered) if (m.tmdbId) map.set(String(m.tmdbId), m);
      this._radarr2ByTmdb = map;
    } catch (e) {
      if (this._radarr2Configured === null) this._radarr2Configured = false;
    }
  }
  async _fetchSonarr2() {
    if (this._sonarr2Configured === false) return;
    try {
      const data = await this._callApi("GET", "arr_stack/sonarr2/series");
      if (data && data._notConfigured) {
        this._sonarr2Configured = false;
        return;
      }
      const tagged = (Array.isArray(data) ? data : []).map((s) => ({ ...s, _isSonarr2: true }));
      this._sonarr2All = tagged;
      const filtered = tagged.filter((s) => s.added && s.added !== "0001-01-01T00:00:00Z");
      this._sonarr2 = filtered.sort((a, b) => new Date(b.added) - new Date(a.added));
      this._sonarr2Total = filtered.length;
      this._sonarr2Configured = true;
      const map = /* @__PURE__ */ new Map();
      for (const s of filtered) if (s.tvdbId) map.set(String(s.tvdbId), s);
      this._sonarr2ByTvdb = map;
      await this._fetchSonarr2RecentImports();
    } catch (e) {
      if (this._sonarr2Configured === null) this._sonarr2Configured = false;
    }
  }
  async _fetchSonarr2RecentImports() {
    try {
      const data = await this._callApi("GET", "arr_stack/sonarr2/recentimports");
      const records = (data.records || []).filter((r) => r.eventType === "downloadFolderImported");
      const dateMap = {};
      const epMap = {};
      for (const r of records) {
        if (!(r.seriesId in dateMap)) dateMap[r.seriesId] = r.date;
        const sn = r.episode?.seasonNumber;
        const en = r.episode?.episodeNumber;
        if (sn != null && en != null) {
          if (!epMap[r.seriesId]) epMap[r.seriesId] = [];
          epMap[r.seriesId].push({ s: sn, e: en });
        }
      }
      this._sonarr2ImportDates = dateMap;
      this._sonarr2ImportEps = epMap;
    } catch (e) {
      this._sonarr2ImportDates = {};
      this._sonarr2ImportEps = {};
    }
  }
  async _fetchSonarrRecentImports() {
    try {
      const data = await this._callApi("GET", "arr_stack/sonarr/recentimports");
      const records = (data.records || []).filter((r) => r.eventType === "downloadFolderImported");
      const dateMap = {};
      const epMap = {};
      for (const r of records) {
        if (!(r.seriesId in dateMap)) dateMap[r.seriesId] = r.date;
        const sn = r.episode?.seasonNumber;
        const en = r.episode?.episodeNumber;
        if (sn != null && en != null) {
          if (!epMap[r.seriesId]) epMap[r.seriesId] = [];
          epMap[r.seriesId].push({ s: sn, e: en });
        }
      }
      this._sonarrImportDates = dateMap;
      this._sonarrImportEps = epMap;
    } catch (e) {
      console.error("[arr-card] Sonarr recent imports fetch error:", e);
      this._sonarrImportDates = {};
      this._sonarrImportEps = {};
    }
  }
  async _fetchSonarrEpisodeFiles() {
    try {
      const allSeries = (this._sonarr || []).filter((s) => (s.statistics?.episodeFileCount ?? 0) > 0);
      const importDates = this._sonarrImportDates || {};
      const withImports = allSeries.filter((s) => s.id in importDates).sort((a, b) => importDates[b.id].localeCompare(importDates[a.id])).slice(0, 20);
      const withoutImports = allSeries.filter((s) => !(s.id in importDates)).slice(0, Math.max(0, 20 - withImports.length));
      const recent = [...withImports, ...withoutImports];
      if (!recent.length) return;
      const results = await Promise.allSettled(
        recent.map((s) => this._callApi("GET", `arr_stack/sonarr/episodefiles?seriesId=${s.id}`))
      );
      const epFiles = {};
      for (let i = 0; i < recent.length; i++) {
        const r = results[i];
        if (r.status === "fulfilled" && Array.isArray(r.value) && r.value.length > 0) {
          const epNum = (f) => {
            const m = (f.relativePath || "").match(/[Ss](\d{1,2})[Ee](\d{1,3})/);
            return m ? parseInt(m[1]) * 1e4 + parseInt(m[2]) : 0;
          };
          const sorted = r.value.sort((a, b) => epNum(b) - epNum(a));
          epFiles[recent[i].id] = sorted[0];
        }
      }
      this._sonarrEpFiles = epFiles;
    } catch (e) {
      console.error("[arr-card] Sonarr episode files fetch error:", e);
    }
  }
  _pickReleaseDate(m) {
    return m.digitalRelease || m.inCinemasDate || m.physicalRelease || null;
  }
  async _fetchCalendar() {
    try {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const end = new Date(Date.now() + 60 * 864e5).toISOString().split("T")[0];
      const [sonarrRaw, radarrRaw, sonarr2Raw, radarr2Raw, lidarrRaw] = await Promise.all([
        this._callApi("GET", `arr_stack/sonarr/calendar?start=${today}&end=${end}`).catch(() => []),
        this._callApi("GET", `arr_stack/radarr/calendar?start=${today}&end=${end}`).catch(() => []),
        this._sonarr2Configured !== false ? this._callApi("GET", `arr_stack/sonarr2/calendar?start=${today}&end=${end}`).catch(() => []) : Promise.resolve([]),
        this._radarr2Configured !== false ? this._callApi("GET", `arr_stack/radarr2/calendar?start=${today}&end=${end}`).catch(() => []) : Promise.resolve([]),
        this._lidarrConfigured !== false ? this._callApi("GET", `arr_stack/lidarr/calendar?start=${today}&end=${end}`).catch(() => []) : Promise.resolve([])
      ]);
      const tvDedup = /* @__PURE__ */ new Set();
      const tvGrouped = /* @__PURE__ */ new Map();
      for (const ep of [...sonarrRaw || [], ...sonarr2Raw || []]) {
        const dedupKey = `${ep.series?.tvdbId || ep.seriesId}-s${ep.seasonNumber}-e${ep.episodeNumber}`;
        if (tvDedup.has(dedupKey)) continue;
        tvDedup.add(dedupKey);
        const groupKey = `${ep.series?.tvdbId || ep.seriesId}-${ep.airDate}`;
        if (!tvGrouped.has(groupKey)) tvGrouped.set(groupKey, []);
        tvGrouped.get(groupKey).push(ep);
      }
      const tvEps = [];
      for (const eps of tvGrouped.values()) {
        eps.sort((a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber);
        const first = eps[0];
        if (eps.length > 1) {
          const last = eps[eps.length - 1];
          first._epRangeEnd = { seasonNumber: last.seasonNumber, episodeNumber: last.episodeNumber };
        }
        tvEps.push(first);
      }
      const movieSeen = /* @__PURE__ */ new Map();
      const cutoff = Date.now() - 864e5;
      for (const m of [...radarrRaw || [], ...radarr2Raw || []]) {
        const key = m.tmdbId || m.id;
        if (!m.digitalRelease) continue;
        if (new Date(m.digitalRelease).getTime() < cutoff) continue;
        if (movieSeen.has(key)) continue;
        movieSeen.set(key, { ...m, _mediaType: "movie", airDate: m.digitalRelease.split("T")[0], series: m });
      }
      this._calendar = [...tvEps, ...Array.from(movieSeen.values()), ...this._calMusicItems(lidarrRaw)].sort((a, b) => new Date(a.airDate) - new Date(b.airDate)).slice(0, 32);
    } catch (e) {
      console.error("[arr-card] Calendar fetch error:", e);
    }
  }
  _calMusicItems(raw) {
    const seen = /* @__PURE__ */ new Set();
    return (Array.isArray(raw) ? raw : []).filter((a) => {
      if (!a?.releaseDate || seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    }).map((a) => ({
      ...a,
      _mediaType: "music",
      airDate: String(a.releaseDate).split("T")[0],
      series: a.artist || {}
    }));
  }
  _calWeekRange(offset) {
    const now = /* @__PURE__ */ new Date();
    const daysSinceMon = (now.getDay() + 6) % 7;
    const mon = new Date(now);
    mon.setDate(now.getDate() - daysSinceMon + offset * 7);
    mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);
    return { start: mon, end: sun };
  }
  // Grid start/end for the month view — always whole weeks, Monday-first, so the
  // fetched range matches exactly what the grid draws.
  _calMonthRange(offset) {
    const base = /* @__PURE__ */ new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + (offset || 0));
    base.setHours(0, 0, 0, 0);
    const lead = (base.getDay() + 6) % 7;
    const start = new Date(base);
    start.setDate(1 - lead);
    const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    const weeks = Math.ceil((lead + daysInMonth) / 7);
    const end = new Date(start);
    end.setDate(start.getDate() + weeks * 7 - 1);
    end.setHours(23, 59, 59, 999);
    return { start, end, month: base.getMonth(), weeks, base };
  }
  // Fetches whatever window the modal is currently showing
  _fetchCalendarWindow() {
    const { start, end } = this._calendarView === "month" ? this._calMonthRange(this._calendarMonthOffset || 0) : this._calWeekRange(this._calendarWeekOffset || 0);
    return this._fetchCalendarRange(start, end);
  }
  async _fetchCalendarWeek(weekOffset) {
    const { start, end } = this._calWeekRange(weekOffset);
    return this._fetchCalendarRange(start, end);
  }
  async _fetchCalendarRange(start, end) {
    this._calendarModalLoading = true;
    this._renderCalendarModalEl();
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];
    try {
      const [sonarrRaw, radarrRaw, sonarr2Raw, radarr2Raw, lidarrRaw] = await Promise.all([
        this._callApi("GET", `arr_stack/sonarr/calendar?start=${startStr}&end=${endStr}`).catch(() => []),
        this._callApi("GET", `arr_stack/radarr/calendar?start=${startStr}&end=${endStr}`).catch(() => []),
        this._sonarr2Configured !== false ? this._callApi("GET", `arr_stack/sonarr2/calendar?start=${startStr}&end=${endStr}`).catch(() => []) : Promise.resolve([]),
        this._radarr2Configured !== false ? this._callApi("GET", `arr_stack/radarr2/calendar?start=${startStr}&end=${endStr}`).catch(() => []) : Promise.resolve([]),
        this._lidarrConfigured !== false ? this._callApi("GET", `arr_stack/lidarr/calendar?start=${startStr}&end=${endStr}`).catch(() => []) : Promise.resolve([])
      ]);
      const seen = /* @__PURE__ */ new Set();
      const tvDeduped = [...sonarrRaw || [], ...sonarr2Raw || []].filter((ep) => {
        const tvdbId = ep.series?.tvdbId || ep.tvdbId || ep.seriesId;
        const key = `${tvdbId}-${ep.seasonNumber}-${ep.episodeNumber}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const tvGrouped = /* @__PURE__ */ new Map();
      for (const ep of tvDeduped) {
        const tvdbId = ep.series?.tvdbId || ep.tvdbId || ep.seriesId;
        const day = (ep.airDate || "").split("T")[0];
        const key = `${tvdbId}-${day}`;
        if (!tvGrouped.has(key)) tvGrouped.set(key, []);
        tvGrouped.get(key).push(ep);
      }
      const tvItems = [];
      for (const eps of tvGrouped.values()) {
        eps.sort((a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber);
        const first = eps[0];
        if (eps.length > 1) {
          const last = eps[eps.length - 1];
          first._epRangeEnd = { seasonNumber: last.seasonNumber, episodeNumber: last.episodeNumber };
          first._epCount = eps.length;
        }
        tvItems.push(first);
      }
      const seenM = /* @__PURE__ */ new Set();
      const movieItems = [...radarrRaw || [], ...radarr2Raw || []].filter((m) => {
        const key = m.tmdbId || m.id;
        if (seenM.has(key)) return false;
        seenM.add(key);
        return true;
      }).map((m) => {
        const releaseDate = this._pickReleaseDate(m);
        return {
          ...m,
          _mediaType: "movie",
          airDate: releaseDate ? releaseDate.split("T")[0] : null,
          series: m
        };
      }).filter((m) => m.airDate);
      this._calendarModalData = [...tvItems, ...movieItems, ...this._calMusicItems(lidarrRaw)];
    } catch (e) {
      console.error("[arr-card] Calendar week fetch error:", e);
      this._calendarModalData = [];
    }
    this._calendarModalLoading = false;
    this._renderCalendarModalEl();
  }
  // Returns discover service prefix — 'overseerr' when configured, 'tmdb' as fallback
  get _discoverSvc() {
    return this._overseerrConfigured === false ? "tmdb" : "overseerr";
  }
  async _fetchOverseerr() {
    if (this._overseerrConfigured === null) return;
    const now = Date.now();
    if (now - (this._discoverLastFetch["upcoming"] || 0) < 6e5) return;
    try {
      const svc = this._discoverSvc;
      const [d1, d2] = await Promise.all([
        this._callApi("GET", `arr_stack/${svc}/upcoming?page=1`),
        this._callApi("GET", `arr_stack/${svc}/upcoming?page=2`).catch(() => ({ results: [] }))
      ]);
      this._upcoming = [...d1.results || [], ...d2.results || []];
      this._upcomingError = null;
      this._discoverLastFetch["upcoming"] = now;
    } catch (e) {
      this._upcomingError = e.message;
      console.error("[arr-card] Upcoming fetch error:", e);
    }
  }
  // Společný helper pro stránkované fetche (trending/popular/tvUpcoming)
  async _fetchOverseerrPaged(endpoint, dataKey, section) {
    if (this._overseerrConfigured === null) return;
    const now = Date.now();
    if (now - (this._discoverLastFetch[section] || 0) < 6e5) return;
    try {
      const svc = this._discoverSvc;
      const [d1, d2] = await Promise.all([
        this._callApi("GET", `arr_stack/${svc}/${endpoint}?page=1`),
        this._callApi("GET", `arr_stack/${svc}/${endpoint}?page=2`).catch(() => ({ results: [] }))
      ]);
      this[dataKey] = [...d1.results || [], ...d2.results || []];
      this._overlayApiTotalPages[section] = d1.totalPages || 1;
      this._overlayApiPage[section] = 2;
      this._discoverLastFetch[section] = now;
    } catch (e) {
      console.error(`[arr-card] ${section} fetch error:`, e);
    }
  }
  async _fetchTrending() {
    await this._fetchOverseerrPaged("trending", "_trending", "trending");
    if (this._overlay?.section === "trending") {
      const isMobile2 = window.matchMedia("(max-width: 480px)").matches;
      const rows = Math.max(1, parseInt(this._cfg.categoriesCount) || 3);
      const perPage = isMobile2 ? rows * 2 : rows * 4;
      const maxPage = Math.max(0, Math.ceil(this._trending.length / perPage) - 1);
      if (this._overlay.page > maxPage) this._overlay.page = 0;
    }
  }
  // Proaktivně načte další API stránky na pozadí, pokud overlay nemá dost dat
  async _proactiveSectionLoad(section) {
    const cfg = this._getSectionOverlayConfig(section);
    if (!cfg?.apiEndpoint) return;
    const isMobile2 = window.matchMedia("(max-width: 480px)").matches;
    const rows = Math.max(1, parseInt(this._cfg.categoriesCount) || 3);
    const perPage = isMobile2 ? rows * 2 : rows * 4;
    while (this._overlay?.section === section && ((cfg.getItems ? cfg.getItems() : this[cfg.dataKey]) || []).length < perPage * 2 && (this._overlayApiPage[section] || 0) < (this._overlayApiTotalPages[section] || 1)) {
      try {
        const nextApiPage = (this._overlayApiPage[section] || 0) + 1;
        const data = await this._callApi("GET", `arr_stack/${cfg.apiEndpoint}?page=${nextApiPage}`);
        this[cfg.dataKey] = [...(cfg.getItems ? cfg.getItems() : this[cfg.dataKey]) || [], ...data.results || []];
        this._overlayApiTotalPages[section] = data.totalPages || this._overlayApiTotalPages[section] || 1;
        this._overlayApiPage[section] = nextApiPage;
        this._reRenderSection(section);
      } catch (err) {
        console.error(`[arr-card] ${section} proactive load error:`, err);
        break;
      }
    }
  }
  async _fetchPopular() {
    await this._fetchOverseerrPaged("popular", "_popular", "popular");
  }
  _traktInterleave(arr) {
    const movies = arr.filter((m) => m.mediaType === "movie");
    const shows = arr.filter((m) => m.mediaType === "tv");
    const result = [];
    let mi = 0, si = 0;
    while (mi < movies.length || si < shows.length) {
      if (mi < movies.length) result.push(movies[mi++]);
      if (si < shows.length) result.push(shows[si++]);
    }
    return result;
  }
  async _fetchTrakt() {
    try {
      const data = await this._callApi("GET", "arr_stack/trakt/recommendations?limit=40");
      if (Array.isArray(data)) {
        const filtered = this._traktWatching?.size ? data.filter((m) => !this._traktWatching.has(m._traktSlug || String(m.id))) : data;
        this._trakt = this._traktInterleave(filtered);
      }
    } catch (e) {
      if (e?.status === 503) {
        this._traktConfigured = false;
      } else {
        console.warn("[arr-card] Trakt fetch error:", e);
      }
    }
  }
  // SuggestArr keeps the state (blacklist, what is still pending) — the card only
  // reads what is waiting for a decision.
  async _fetchSuggestArr() {
    try {
      const data = await this._callApi("GET", "arr_stack/suggestarr/suggestions?per_page=40");
      const items = (data?.items || []).map((it) => {
        const mediaTitle = it.title || "";
        const isTv = (it.media_type || it.mediaType || "movie") === "tv";
        const date = it.release_date || it.releaseDate || "";
        const tmdbId = Number(it.tmdb_id ?? it.tmdbId ?? it.id);
        return {
          id: tmdbId,
          _saId: it.id,
          mediaType: isTv ? "tv" : "movie",
          title: mediaTitle,
          name: mediaTitle,
          posterPath: it.poster_path || it.posterPath || null,
          backdropPath: it.backdrop_path || it.backdropPath || null,
          overview: it.overview || "",
          releaseDate: isTv ? "" : date,
          firstAirDate: isTv ? it.first_air_date || it.firstAirDate || date : "",
          voteAverage: it.vote_average ?? it.voteAverage ?? it.rating ?? 0
        };
      }).filter((m) => Number.isFinite(m.id) && m.id > 0);
      this._suggestarr = this._traktInterleave(items);
      if (items.length > this._suggestarrBaseline) this._suggestarrBaseline = items.length;
      if (this._suggestarrRefreshing) {
        if (items.length > this._suggestarrPendingFrom) this._suggestarrRefreshing = false;
      } else if (items.length) {
        this._suggestarrPendingFrom = 0;
      }
    } catch (e) {
      if (e?.status === 503) this._suggestarrConfigured = false;
      else console.warn("[arr-card] SuggestArr fetch error:", e);
    }
  }
  async _fetchTvUpcoming() {
    await this._fetchOverseerrPaged("tv_upcoming", "_tvUpcoming", "tvUpcoming");
  }
  async _fetchOverseerrSonarrSettings() {
    try {
      const servers = await this._callApi("GET", "arr_stack/overseerr/sonarr_settings");
      if (!Array.isArray(servers) || servers.length === 0) return;
      const primary = servers.find((s) => s.isDefault) || servers[0];
      this._seerrSonarr = {
        serverId: primary.id,
        profileId: primary.activeProfileId,
        rootFolder: primary.activeDirectory,
        name: primary.name || ""
      };
      const secondary = servers.find((s) => s.id !== primary.id);
      if (secondary) {
        this._seerrSonarr2 = {
          serverId: secondary.id,
          profileId: secondary.activeProfileId,
          rootFolder: secondary.activeDirectory,
          name: secondary.name || ""
        };
      }
    } catch (e) {
      console.error("[arr-card] Overseerr Sonarr settings fetch error:", e);
    }
  }
  async _fetchSonarrProfiles() {
    if (this._sonarrProfiles.length > 0) return;
    try {
      const data = await this._callApi("GET", "arr_stack/sonarr/profiles");
      if (Array.isArray(data)) this._sonarrProfiles = data;
    } catch (e) {
      console.error("[arr-card] Sonarr profiles fetch error:", e);
    }
  }
  async _oneClickTvRequest(show) {
    try {
      if (this._overseerrConfigured !== false && !this._seerrSonarr) await this._fetchOverseerrSonarrSettings();
      const profileName = this._cfgGet("discover", "oneClickDefaultShowProfile", "");
      let profileId = this._seerrSonarr?.profileId ?? null;
      if (profileName) {
        await this._fetchSonarrProfiles();
        const match = this._sonarrProfiles.find((p) => p.name === profileName);
        if (match) profileId = match.id;
      }
      const tagName = this._cfgGet("discover", "oneClickDefaultShowTag", "");
      let tagId = null;
      if (tagName && this._sonarrTags.length > 0) {
        const tagMatch = this._sonarrTags.find((t) => t.label === tagName);
        if (tagMatch) tagId = tagMatch.id;
      }
      const cfgRootFolder = this._cfgGet("discover", "oneClickDefaultShowRootFolder", "") || null;
      const tvSeasonMode = this._cfgGet("discover", "oneClickTvSeasonMode", "first");
      let seasons = [];
      if (this._overseerrConfigured !== false) {
        const detail = await this._callApi("GET", `arr_stack/overseerr/tv/${show.id}`);
        const allS = (detail.seasons || []).filter((s) => s.seasonNumber > 0).sort((a, b) => a.seasonNumber - b.seasonNumber);
        if (tvSeasonMode === "all") {
          seasons = allS.map((s) => s.seasonNumber);
        } else if (tvSeasonMode === "latest") {
          seasons = allS.length ? [allS[allS.length - 1].seasonNumber] : [];
        } else {
          const s1 = allS.find((s) => s.seasonNumber === 1);
          seasons = s1 ? [1] : allS.length ? [allS[0].seasonNumber] : [];
        }
      } else {
        const tvdbId = show.externalIds?.tvdbId || show.tvdbId;
        if (tvdbId) {
          const lookup = await this._callApi("GET", `arr_stack/sonarr/lookup?tvdbId=${tvdbId}`);
          const s = Array.isArray(lookup) ? lookup[0] : lookup;
          const allS = (s?.seasons || []).filter((x) => x.seasonNumber > 0).sort((a, b) => a.seasonNumber - b.seasonNumber);
          if (tvSeasonMode === "all") {
            seasons = allS.map((x) => x.seasonNumber);
          } else if (tvSeasonMode === "latest") {
            seasons = allS.length ? [allS[allS.length - 1].seasonNumber] : [];
          } else {
            seasons = allS.length ? [allS[0].seasonNumber] : [];
          }
        }
      }
      if (seasons.length === 0) return;
      this._optimisticRequested.add(show.id);
      this._withdrawnIds.delete(show.id);
      this._reRenderRight();
      if (this._overseerrConfigured === false) {
        await this._addDirectTvRequest(show, seasons, profileId, tagId, cfgRootFolder);
        return;
      }
      const body = { mediaType: "tv", mediaId: show.id, seasons };
      if (this._seerrSonarr) {
        body.serverId = this._seerrSonarr.serverId;
        body.profileId = profileId;
        body.rootFolder = cfgRootFolder || this._seerrSonarr.rootFolder;
      }
      {
        const _acct = this._seerrAccountForUser();
        if (_acct !== "admin") body.userMode = _acct;
      }
      if (tagId !== null) body.tags = [parseInt(tagId)];
      const resp = await this._callApi("POST", "arr_stack/overseerr/request", body);
      const reqId = Array.isArray(resp) ? resp[0]?.id : resp?.id;
      if (reqId && !this._hass.user.is_admin) {
        this._familyPendingIds.set(Number(show.id), reqId);
        this._savePendingToStorage();
      }
      this._reRenderRight();
    } catch (e) {
      console.error("[arr-card] oneClick TV request error:", e);
      this._optimisticRequested.delete(show.id);
      this._reRenderRight();
    }
  }
  async _openTvRequestOverlay(m, source = "tvUpcoming") {
    this._tvRequestPending = { show: m, seasons: null, selected: null, profileId: null, mediaId: m.id, loading: true, source };
    this._reRenderRight();
    await Promise.allSettled([
      (async () => {
        let seasons = [];
        if (this._overseerrConfigured !== false) {
          try {
            const detail = await this._callApi("GET", `arr_stack/overseerr/tv/${m.id}`);
            seasons = (detail.seasons || []).filter((s) => s.seasonNumber > 0).map((s) => s.seasonNumber).sort((a, b) => a - b);
          } catch (_) {
          }
        }
        if (!seasons.length) {
          let tvdbId = m.externalIds?.tvdbId || m.tvdbId;
          if (!tvdbId && this._overseerrConfigured === false) {
            try {
              const ext = await this._callApi("GET", `arr_stack/tmdb/tv/${m.id}`);
              tvdbId = ext?.externalIds?.tvdbId;
            } catch (_) {
            }
          }
          if (tvdbId) {
            try {
              const lookup = await this._callApi("GET", `arr_stack/sonarr/lookup?tvdbId=${tvdbId}`);
              const s = Array.isArray(lookup) ? lookup[0] : lookup;
              seasons = (s?.seasons || []).filter((s2) => s2.seasonNumber > 0).map((s2) => s2.seasonNumber).sort((a, b) => a - b);
            } catch (_) {
            }
          }
        }
        if (this._tvRequestPending) {
          this._tvRequestPending.seasons = seasons;
          this._tvRequestPending.selected = new Set(seasons);
        }
      })(),
      this._fetchSonarrProfiles(),
      this._fetchSonarrRootFolders(),
      (async () => {
        if (this._overseerrConfigured !== false && !this._seerrSonarr) await this._fetchOverseerrSonarrSettings();
      })(),
      (async () => {
        if (this._sonarr2Configured !== false) {
          await Promise.all([
            this._sonarr2Profiles?.length ? null : this._fetchSonarr2Profiles(),
            this._sonarr2RootFolders?.length ? null : this._fetchSonarr2RootFolders()
          ].filter(Boolean));
        }
      })()
    ]);
    if (this._tvRequestPending) {
      this._tvRequestPending.profileId = this._seerrSonarr?.profileId ?? null;
      this._tvRequestPending.loading = false;
      this._reRenderRight();
      this._wireTvOverlay();
    }
  }
  async _addOverseerrTvRequest(mediaId, seasons, profileId, tagId = null, rootFolder = null, use2 = false) {
    this._markActivated();
    const showId = this._tvRequestPending?.show?.id;
    if (showId) {
      this._optimisticRequested.add(showId);
      this._withdrawnIds.delete(showId);
    }
    this._tvRequestPending = null;
    this._reRenderRight(true);
    if (this._popup) this._renderPopupEl();
    try {
      const seerrCfg = use2 ? this._seerrSonarr2 : this._seerrSonarr;
      if (!seerrCfg) await this._fetchOverseerrSonarrSettings();
      const activeCfg = use2 ? this._seerrSonarr2 : this._seerrSonarr;
      const body = { mediaType: "tv", mediaId, seasons };
      if (activeCfg) {
        body.serverId = activeCfg.serverId;
        body.profileId = profileId !== null ? parseInt(profileId) : activeCfg.profileId;
        body.rootFolder = rootFolder || activeCfg.rootFolder;
      }
      if (tagId !== null) body.tags = [parseInt(tagId)];
      {
        const _acct = this._seerrAccountForUser();
        if (_acct !== "admin") body.userMode = _acct;
      }
      const resp = await this._callApi("POST", "arr_stack/overseerr/request", body);
      const reqId = Array.isArray(resp) ? resp[0]?.id : resp?.id;
      if (reqId && !this._hass.user.is_admin) {
        this._familyPendingIds.set(Number(mediaId), reqId);
        this._savePendingToStorage();
        this._reRenderRight(true);
      }
      this._fetchTvUpcoming().then(() => {
        this._reRenderRight(true);
        if (this._popup) this._renderPopupEl();
      });
      setTimeout(() => this._fetchSonarr().then(() => {
        this._reRenderRight(true);
        if (this._popup) this._renderPopupEl();
      }), 2e3);
    } catch (e) {
      if (showId) this._optimisticRequested.delete(showId);
      this._reRenderRight(true);
      console.error("[arr-card] Overseerr TV request error:", e);
    }
  }
  // ─── Direct add (bez Overseerr) ────────────────────────────────────────────
  async _addDirectMovieRequest(tmdbId, profileId, tagId, rootFolder, instance = "radarr") {
    this._markActivated();
    const svc = instance === "radarr2" ? "radarr2" : "radarr";
    const profiles = instance === "radarr2" ? this._radarr2Profiles : this._radarrProfiles;
    const rootFolders = instance === "radarr2" ? this._radarr2RootFolders : this._radarrRootFolders;
    this._optimisticRequested.add(tmdbId);
    this._withdrawnIds?.delete(tmdbId);
    this._requestPending = null;
    this._reRenderRight(true);
    if (this._popup) this._renderPopupEl();
    try {
      const rf = rootFolder || rootFolders?.[0]?.path || "/movies";
      const pId = profileId ? parseInt(profileId) : profiles?.[0]?.id ?? 1;
      const pd = this._popup;
      const body = { tmdbId: parseInt(tmdbId), title: pd?.title || pd?.name || "", qualityProfileId: pId, rootFolderPath: rf, monitored: true, addOptions: { searchForMovie: true } };
      if (tagId) body.tags = [parseInt(tagId)];
      await this._callApi("POST", `arr_stack/${svc}/movie`, body);
      setTimeout(() => {
        (svc === "radarr2" ? this._fetchRadarr2() : this._fetchRadarr()).then(() => {
          this._reRenderRight(true);
          if (this._popup) this._renderPopupEl();
        });
      }, 2e3);
    } catch (e) {
      this._optimisticRequested.delete(tmdbId);
      this._reRenderRight(true);
      console.error("[arr-card] Direct Radarr add error:", e);
    }
  }
  async _addDirectTvRequest(show, seasons, profileId, tagId, rootFolder, inst = "sonarr") {
    this._markActivated();
    const showId = show?.id;
    const tvdbId = show?.externalIds?.tvdbId || show?.tvdbId;
    if (!tvdbId) return;
    const use2 = inst === "sonarr2";
    if (showId) {
      this._optimisticRequested.add(showId);
      this._withdrawnIds?.delete(showId);
    }
    this._tvRequestPending = null;
    this._reRenderRight(true);
    if (this._popup) this._renderPopupEl();
    try {
      if (use2) {
        await this._fetchSonarr2Profiles();
        await this._fetchSonarr2RootFolders();
      } else {
        await this._fetchSonarrProfiles();
        await this._fetchSonarrRootFolders();
      }
      const svcPath = use2 ? "sonarr2" : "sonarr";
      const lookupResults = await this._callApi("GET", `arr_stack/${svcPath}/lookup?tvdbId=${tvdbId}`);
      const seriesData = Array.isArray(lookupResults) ? lookupResults[0] : lookupResults;
      if (!seriesData) throw new Error("Series not found");
      const profiles = use2 ? this._sonarr2Profiles : this._sonarrProfiles;
      const rootFolders = use2 ? this._sonarr2RootFolders : this._sonarrRootFolders;
      const rf = rootFolder || rootFolders?.[0]?.path || "/tv";
      const pId = profileId ? parseInt(profileId) : profiles?.[0]?.id ?? 1;
      const seasonObjs = (seriesData.seasons || []).map((s) => ({ ...s, monitored: seasons.includes(s.seasonNumber) }));
      try {
        await this._callApi("POST", `arr_stack/${svcPath}/series`, {
          ...seriesData,
          seasons: seasonObjs,
          qualityProfileId: pId,
          rootFolderPath: rf,
          monitored: true,
          addOptions: { searchForMissingEpisodes: true, searchForCutoffUnmetEpisodes: false },
          ...tagId ? { tags: [parseInt(tagId)] } : {}
        });
      } catch (_) {
      }
      setTimeout(() => this._fetchSonarr().then(() => {
        this._reRenderRight(true);
        if (this._popup) this._renderPopupEl();
      }), 2e3);
    } catch (e) {
      if (showId) this._optimisticRequested.delete(showId);
      this._reRenderRight(true);
      console.error("[arr-card] Direct Sonarr add error:", e);
    }
  }
  // ──────────────────────────────────────────────────────────────────────────
  async _fetchBazarr() {
    try {
      const data = await this._callApi("GET", "arr_stack/bazarr/movies");
      const map = {};
      for (const movie of data.data || []) {
        map[movie.radarrId] = {
          subtitles: movie.subtitles || [],
          missing: movie.missing_subtitles || []
        };
      }
      this._bazarr = map;
      this._bazarrConfigured = true;
    } catch (e) {
      const status = e?.status_code ?? e?.status ?? e?.response?.status;
      const body = typeof e?.body === "string" ? e.body : JSON.stringify(e?.body ?? e?.message ?? e);
      this._bazarrConfigured = !(status === 503 || body.includes("not configured"));
      console.error("[arr-card] Bazarr fetch error:", e);
    }
  }
  async _fetchBazarrEpisodes() {
    if (!this._bazarrConfigured) return;
    try {
      const seriesIds = Object.keys(this._sonarrEpFiles || {});
      if (!seriesIds.length) return;
      const results = await Promise.allSettled(
        seriesIds.map((sid) => this._callApi("GET", `arr_stack/bazarr/episodes?seriesId=${sid}`))
      );
      const map = {};
      for (let i = 0; i < seriesIds.length; i++) {
        const r = results[i];
        if (r.status !== "fulfilled") continue;
        for (const ep of r.value?.data || []) {
          map[ep.sonarrEpisodeFileId] = {
            subtitles: ep.subtitles || [],
            missing: ep.missing_subtitles || []
          };
        }
      }
      this._bazarrEpisodes = map;
    } catch (e) {
      console.error("[arr-card] Bazarr episodes fetch error:", e);
    }
  }
  async _fetchRadarrQueue() {
    try {
      const data = await this._callApi("GET", "arr_stack/radarr/queue?includeUnknownMovieItems=true");
      const records = Array.isArray(data) ? data : data.records || [];
      const failed = /* @__PURE__ */ new Set();
      const active = /* @__PURE__ */ new Set();
      const pct = /* @__PURE__ */ new Map();
      const dlIds = /* @__PURE__ */ new Map();
      const items = [];
      for (const item of records) {
        const bad = item.trackedDownloadStatus === "warning" || item.trackedDownloadStatus === "error" || item.trackedDownloadState === "importFailed" || item.status === "failed";
        const sz = item.size || 0;
        const sl = item.sizeleft || 0;
        const done = item.trackedDownloadState === "importPending" || item.trackedDownloadState === "importBlocked" || item.status === "completed";
        const p = sz > 0 ? Math.round((sz - sl) / sz * 100) : done ? 100 : 0;
        items.push({ title: item.movie?.title || item.title || "\u2014", svc: "radarr", failed: bad, pct: p });
        if (item.downloadId && item.movieId) dlIds.set(String(item.downloadId).toLowerCase(), item.movieId);
        if (!item.movieId) continue;
        if (bad) {
          failed.add(item.movieId);
          continue;
        }
        active.add(item.movieId);
        pct.set(item.movieId, p);
      }
      this._radarrQueueFailed = failed;
      this._radarrQueueActive = active;
      this._radarrQueuePct = pct;
      this._radarrQueueItems = items;
      this._dlMediaRadarr = dlIds;
    } catch (e) {
      console.error("[arr-card] Radarr queue fetch error:", e);
    }
  }
  async _fetchRadarr2Queue() {
    if (this._radarr2Configured === false) return;
    try {
      const data = await this._callApi("GET", "arr_stack/radarr2/queue?includeUnknownMovieItems=true");
      const records = Array.isArray(data) ? data : data.records || [];
      const failed = /* @__PURE__ */ new Set();
      const active = /* @__PURE__ */ new Set();
      const pct = /* @__PURE__ */ new Map();
      const dlIds = /* @__PURE__ */ new Map();
      const items = [];
      for (const item of records) {
        const bad = item.trackedDownloadStatus === "warning" || item.trackedDownloadStatus === "error" || item.trackedDownloadState === "importFailed" || item.status === "failed";
        const sz = item.size || 0;
        const sl = item.sizeleft || 0;
        const done = item.trackedDownloadState === "importPending" || item.trackedDownloadState === "importBlocked" || item.status === "completed";
        const p = sz > 0 ? Math.round((sz - sl) / sz * 100) : done ? 100 : 0;
        items.push({ title: item.movie?.title || item.title || "\u2014", svc: "radarr2", failed: bad, pct: p });
        if (item.downloadId && item.movieId) dlIds.set(String(item.downloadId).toLowerCase(), item.movieId);
        if (!item.movieId) continue;
        if (bad) {
          failed.add(item.movieId);
          continue;
        }
        active.add(item.movieId);
        pct.set(item.movieId, p);
      }
      this._radarr2QueueFailed = failed;
      this._radarr2QueueActive = active;
      this._radarr2QueuePct = pct;
      this._radarr2QueueItems = items;
      this._dlMediaRadarr2 = dlIds;
    } catch (e) {
    }
  }
  // Once a download is imported the arr queue forgets it, but the torrent usually
  // keeps seeding in the client. Recent history still ties downloadId to the media,
  // so those rows stay clickable instead of going dead the moment the import runs.
  async _fetchDlHistory() {
    const jobs = [
      ["radarr", "_dlHistRadarr", "movieId", this._radarr2Configured],
      ["radarr2", "_dlHistRadarr2", "movieId", this._radarr2Configured],
      ["sonarr", "_dlHistSonarr", "seriesId", this._sonarr2Configured],
      ["sonarr2", "_dlHistSonarr2", "seriesId", this._sonarr2Configured]
    ];
    await Promise.all(jobs.map(async ([svc, key, idField, secondCfg]) => {
      if ((svc === "radarr2" || svc === "sonarr2") && secondCfg === false) return;
      try {
        const data = await this._callApi(
          "GET",
          `arr_stack/${svc}/activity/history?page=1&pageSize=100&sortKey=date&sortDir=desc`
        );
        const recs = Array.isArray(data) ? data : data?.records || [];
        const map = /* @__PURE__ */ new Map();
        for (const h of recs) {
          const arrId = h?.[idField];
          if (h?.downloadId && arrId != null) {
            map.set(String(h.downloadId).toLowerCase(), arrId);
          }
        }
        this[key] = map;
      } catch (_) {
      }
    }));
  }
  async _fetchSonarrQueue(instance = "sonarr") {
    const svc = instance === "sonarr2" ? "sonarr2" : "sonarr";
    const seasonsKey = instance === "sonarr2" ? "_sonarr2QueueSeasons" : "_sonarrQueueSeasons";
    const episodesKey = instance === "sonarr2" ? "_sonarr2QueueEpisodes" : "_sonarrQueueEpisodes";
    const epPctKey = instance === "sonarr2" ? "_sonarr2QueueEpPct" : "_sonarrQueueEpPct";
    const seasonPctKey = instance === "sonarr2" ? "_sonarr2QueueSeasonPct" : "_sonarrQueueSeasonPct";
    const seriesPctKey = instance === "sonarr2" ? "_sonarr2QueueSeriesPct" : "_sonarrQueueSeriesPct";
    const firstEpKey = instance === "sonarr2" ? "_sonarr2QueueFirstEp" : "_sonarrQueueFirstEp";
    try {
      const data = await this._callApi("GET", `arr_stack/${svc}/queue`);
      const records = Array.isArray(data) ? data : data.records || [];
      const seasons = /* @__PURE__ */ new Set();
      const episodes = /* @__PURE__ */ new Set();
      const epPct = /* @__PURE__ */ new Map();
      const seasonData = /* @__PURE__ */ new Map();
      const seriesData = /* @__PURE__ */ new Map();
      const firstEpMap = /* @__PURE__ */ new Map();
      const dlIds = /* @__PURE__ */ new Map();
      for (const item of records) {
        const sz = item.size || 0;
        const sl = item.sizeleft || 0;
        const pct = sz > 0 ? Math.round((sz - sl) / sz * 100) : 0;
        if (item.downloadId && item.seriesId != null) {
          dlIds.set(String(item.downloadId).toLowerCase(), item.seriesId);
        }
        if (item.seriesId != null && item.seasonNumber != null) {
          const sk = `${item.seriesId}:${item.seasonNumber}`;
          seasons.add(sk);
          const prev = seasonData.get(sk) || { size: 0, sizeleft: 0 };
          seasonData.set(sk, { size: prev.size + sz, sizeleft: prev.sizeleft + sl });
          const sprev = seriesData.get(item.seriesId) || { size: 0, sizeleft: 0 };
          seriesData.set(item.seriesId, { size: sprev.size + sz, sizeleft: sprev.sizeleft + sl });
          const epNum = item.episode?.episodeNumber ?? item.episodeNumber;
          if (epNum != null) {
            if (!firstEpMap.has(item.seriesId)) {
              firstEpMap.set(item.seriesId, { season: item.seasonNumber, episode: epNum, count: 0 });
            }
            firstEpMap.get(item.seriesId).count++;
          }
        }
        if (item.episodeId != null) {
          episodes.add(item.episodeId);
          epPct.set(item.episodeId, pct);
        }
      }
      const seasonPct = /* @__PURE__ */ new Map();
      for (const [sk, { size, sizeleft }] of seasonData)
        seasonPct.set(sk, size > 0 ? Math.round((size - sizeleft) / size * 100) : 0);
      const seriesPct = /* @__PURE__ */ new Map();
      for (const [sid, { size, sizeleft }] of seriesData)
        seriesPct.set(sid, size > 0 ? Math.round((size - sizeleft) / size * 100) : 0);
      this[seasonsKey] = seasons;
      this[episodesKey] = episodes;
      this[epPctKey] = epPct;
      this[seasonPctKey] = seasonPct;
      this[seriesPctKey] = seriesPct;
      this[firstEpKey] = firstEpMap;
      this[instance === "sonarr2" ? "_dlMediaSonarr2" : "_dlMediaSonarr"] = dlIds;
    } catch (e) {
    }
  }
  async _fetchOverseerrRadarrSettings() {
    try {
      const servers = await this._callApi("GET", "arr_stack/overseerr/radarr_settings");
      if (!Array.isArray(servers) || servers.length === 0) {
        this._overseerrConfigured = false;
        return;
      }
      this._overseerrConfigured = true;
      const primary = servers.find((s) => s.isDefault && !s.is4k) || servers.find((s) => !s.is4k) || servers[0];
      this._seerrRadarr = {
        serverId: primary.id,
        profileId: primary.activeProfileId,
        rootFolder: primary.activeDirectory,
        name: primary.name || ""
      };
      const secondary = servers.find((s) => s.id !== primary.id && s.is4k) || servers.find((s) => s.id !== primary.id);
      if (secondary) {
        this._seerrRadarr2 = {
          serverId: secondary.id,
          profileId: secondary.activeProfileId,
          rootFolder: secondary.activeDirectory,
          is4k: !!secondary.is4k,
          name: secondary.name || ""
        };
      }
    } catch (e) {
      this._overseerrConfigured = false;
    }
  }
  async _fetchRadarrProfiles() {
    if (this._radarrProfiles.length > 0) return;
    try {
      const data = await this._callApi("GET", "arr_stack/radarr/profiles");
      if (Array.isArray(data)) this._radarrProfiles = data;
    } catch (e) {
      console.error("[arr-card] Radarr profiles fetch error:", e);
    }
  }
  async _fetchRadarrTags() {
    if (this._radarrTags.length > 0) return;
    try {
      const data = await this._callApi("GET", "arr_stack/radarr/tags");
      if (Array.isArray(data)) this._radarrTags = data;
    } catch (e) {
    }
  }
  async _fetchSonarrTags() {
    if (this._sonarrTags.length > 0) return;
    try {
      const data = await this._callApi("GET", "arr_stack/sonarr/tags");
      if (Array.isArray(data)) this._sonarrTags = data;
    } catch (e) {
    }
  }
  async _fetchRadarrRootFolders() {
    if (this._radarrRootFolders.length > 0) return;
    try {
      const data = await this._callApi("GET", "arr_stack/radarr/rootfolders");
      if (Array.isArray(data)) this._radarrRootFolders = data;
    } catch (e) {
    }
  }
  async _fetchRadarr2Profiles() {
    if (this._radarr2Configured === false) return;
    if (this._radarr2Profiles.length > 0) return;
    try {
      const data = await this._callApi("GET", "arr_stack/radarr2/profiles");
      if (Array.isArray(data)) this._radarr2Profiles = data;
    } catch (e) {
    }
  }
  async _fetchRadarr2Tags() {
    if (this._radarr2Configured === false) return;
    if (this._radarr2Tags.length > 0) return;
    try {
      const data = await this._callApi("GET", "arr_stack/radarr2/tags");
      if (Array.isArray(data)) this._radarr2Tags = data;
    } catch (e) {
    }
  }
  async _fetchRadarr2RootFolders() {
    if (this._radarr2Configured === false) return;
    if (this._radarr2RootFolders.length > 0) return;
    try {
      const data = await this._callApi("GET", "arr_stack/radarr2/rootfolders");
      if (Array.isArray(data)) this._radarr2RootFolders = data;
    } catch (e) {
    }
  }
  async _fetchSonarrRootFolders() {
    if (this._sonarrRootFolders.length > 0) return;
    try {
      const data = await this._callApi("GET", "arr_stack/sonarr/rootfolders");
      if (Array.isArray(data)) this._sonarrRootFolders = data;
    } catch (e) {
    }
  }
  async _fetchSonarr2Profiles() {
    if (this._sonarr2Configured === false) return;
    if (this._sonarr2Profiles?.length > 0) return;
    try {
      const data = await this._callApi("GET", "arr_stack/sonarr2/profiles");
      if (Array.isArray(data)) this._sonarr2Profiles = data;
    } catch (e) {
    }
  }
  async _fetchSonarr2RootFolders() {
    if (this._sonarr2Configured === false) return;
    if (this._sonarr2RootFolders?.length > 0) return;
    try {
      const data = await this._callApi("GET", "arr_stack/sonarr2/rootfolders");
      if (Array.isArray(data)) this._sonarr2RootFolders = data;
    } catch (e) {
    }
  }
  async _fetchRadarrDiskspace() {
    if (this._radarrDiskspace.length > 0) return;
    try {
      const data = await this._callApi("GET", "arr_stack/radarr/diskspace");
      if (Array.isArray(data)) this._radarrDiskspace = data;
    } catch (e) {
    }
  }
  async _fetchRadarr2Diskspace() {
    if (this._radarr2Configured === false) return;
    if (this._radarr2Diskspace.length > 0) return;
    try {
      const data = await this._callApi("GET", "arr_stack/radarr2/diskspace");
      if (Array.isArray(data)) this._radarr2Diskspace = data;
    } catch (e) {
    }
  }
  async _fetchSonarrDiskspace() {
    if (this._sonarrDiskspace.length > 0) return;
    try {
      const data = await this._callApi("GET", "arr_stack/sonarr/diskspace");
      if (Array.isArray(data)) this._sonarrDiskspace = data;
    } catch (e) {
    }
  }
  async _fetchSonarr2Diskspace() {
    if (this._sonarr2Configured === false) return;
    if (this._sonarr2Diskspace?.length > 0) return;
    try {
      const data = await this._callApi("GET", "arr_stack/sonarr2/diskspace");
      if (Array.isArray(data)) this._sonarr2Diskspace = data;
    } catch (e) {
    }
  }
  // ─────────────────────────────────────────────
  // Sonarr Interactive Search
  // ─────────────────────────────────────────────
  async _fetchSonarrEpisodes(seriesId, seasonNumber, instance = "sonarr") {
    const svc = instance === "sonarr2" ? "sonarr2" : "sonarr";
    try {
      const data = await this._callApi("GET", `arr_stack/${svc}/episodes?seriesId=${seriesId}&seasonNumber=${seasonNumber}`);
      const eps = (Array.isArray(data) ? data : []).sort((a, b) => a.episodeNumber - b.episodeNumber);
      this._snEpisodes.set(seasonNumber, eps);
    } catch (e) {
      console.error("[arr-card] Sonarr episodes fetch error:", e);
      this._snEpisodes.set(seasonNumber, []);
    }
    this._renderPopupEl();
  }
  async _fetchSonarrSeasonIS(seriesId, seasonNumber, instance = "sonarr") {
    const svc = instance === "sonarr2" ? "sonarr2" : "sonarr";
    this._snIsState = "loading";
    this._snIsResults = [];
    this._snIsError = null;
    this._snIsGrabbing = null;
    this._snIsHistory = {};
    this._renderPopupEl();
    try {
      let eps = this._snEpisodes.get(seasonNumber);
      if (!eps || eps.length === 0) {
        const epData = await this._callApi("GET", `arr_stack/${svc}/episodes?seriesId=${seriesId}&seasonNumber=${seasonNumber}`);
        eps = (Array.isArray(epData) ? epData : []).sort((a, b) => a.episodeNumber - b.episodeNumber);
        if (eps.length > 0) this._snEpisodes.set(seasonNumber, eps);
      }
      const firstEp = eps[0];
      if (!firstEp) throw new Error(this._t("snNoEpisodes"));
      const [data, histRaw] = await Promise.all([
        this._callApi("GET", `arr_stack/${svc}/release?episodeId=${firstEp.id}`),
        this._callApi("GET", `arr_stack/${svc}/history?seriesId=${seriesId}`).catch(() => null)
      ]);
      this._snIsHistory = this._buildSnHistoryMap(histRaw);
      this._snIsResults = this._sortIsResults(Array.isArray(data) ? data : []);
      this._snIsState = "results";
    } catch (e) {
      this._snIsState = "error";
      this._snIsError = e.message || this._t("isLoadError");
    }
    this._renderPopupEl();
  }
  async _fetchSonarrEpIS(episodeId, seriesId, instance = "sonarr") {
    const svc = instance === "sonarr2" ? "sonarr2" : "sonarr";
    this._snIsState = "loading";
    this._snIsResults = [];
    this._snIsError = null;
    this._snIsGrabbing = null;
    this._snIsHistory = {};
    this._renderPopupEl();
    try {
      const [data, histRaw] = await Promise.all([
        this._callApi("GET", `arr_stack/${svc}/release?episodeId=${episodeId}`),
        this._callApi("GET", `arr_stack/${svc}/history?seriesId=${seriesId}`).catch(() => null)
      ]);
      this._snIsHistory = this._buildSnHistoryMap(histRaw);
      this._snIsResults = this._sortIsResults(Array.isArray(data) ? data : []);
      this._snIsState = "results";
    } catch (e) {
      this._snIsState = "error";
      this._snIsError = e.message || this._t("isLoadError");
    }
    this._renderPopupEl();
  }
  _buildSnHistoryMap(histRaw) {
    const records = Array.isArray(histRaw) ? histRaw : histRaw?.records ?? [];
    const dlIdOutcome = {};
    records.forEach((h) => {
      if (!h.downloadId || h.downloadId in dlIdOutcome) return;
      if (h.eventType === "downloadFailed") dlIdOutcome[h.downloadId] = "failed";
      else if (h.eventType === "downloadFolderImported" || h.eventType === "episodeFileImported") dlIdOutcome[h.downloadId] = "imported";
    });
    const histMap = {};
    records.forEach((h) => {
      if (h.eventType !== "grabbed") return;
      const guid = h.data?.guid;
      if (!guid || guid in histMap) return;
      histMap[guid] = dlIdOutcome[h.downloadId] ?? "grabbed";
    });
    return histMap;
  }
  _sortIsResults(data) {
    return data.sort((a, b) => {
      if (a.approved !== b.approved) return a.approved ? -1 : 1;
      return (b.customFormatScore ?? 0) - (a.customFormatScore ?? 0);
    });
  }
  async _sonarrGrab(guid, indexerId) {
    this._snIsGrabbing = guid;
    this._renderPopupEl();
    try {
      const release = this._snIsResults.find((r) => r.guid === guid) || { guid, indexerId };
      const snSvc = this._snIsInstance === "sonarr2" ? "sonarr2" : "sonarr";
      await this._callApi("POST", `arr_stack/${snSvc}/release`, release);
      this._snIsGrabbed.add(guid);
      const snGrabId = snSvc === "sonarr2" ? this._popup?._sonarr2Series?.id : this._popup?._sonarrSeries?.id;
      this._ppGrabWait = { inst: snSvc, id: snGrabId, until: Date.now() + 18e4 };
      this._ppGrabPollStart();
      this._dlTriggeredBy = "is";
      const seriesId = release.seriesId;
      const seasonNumber = release.seasonNumber;
      const snCache = this._snIsInstance === "sonarr2" ? this._sonarr2 || [] : this._sonarr || [];
      const series = snCache.find((s) => s.id === seriesId);
      if (series && seriesId) {
        const updated = {
          ...series,
          monitored: true,
          seasons: (series.seasons || []).map(
            (s) => s.seasonNumber === seasonNumber ? { ...s, monitored: true } : s
          )
        };
        this._callApi("PUT", `arr_stack/${snSvc}/series/${seriesId}`, updated).catch(() => {
        });
        if (this._snIsInstance === "sonarr2") this._sonarr2 = snCache.map((s) => s.id === seriesId ? updated : s);
        else this._sonarr = snCache.map((s) => s.id === seriesId ? updated : s);
      }
    } catch (e) {
      console.error("[arr-card] Sonarr grab error:", e);
      const prev = this._snIsError;
      this._snIsError = this._t("isGrabError") + ": " + (e.message || "");
      this._renderPopupEl();
      setTimeout(() => {
        this._snIsError = prev;
        this._renderPopupEl();
      }, 3e3);
    } finally {
      this._snIsGrabbing = null;
      this._renderPopupEl();
    }
  }
  get _searchType() {
    let v = "all";
    try {
      v = localStorage.getItem("arr-search-type") || "all";
    } catch (_) {
    }
    if (v === "music" && this._lidarrConfigured === false) return "all";
    return ["all", "movie", "tv", "music"].includes(v) ? v : "all";
  }
  get _searchMusic() {
    const t = this._searchType;
    return this._lidarrConfigured !== false && (t === "all" || t === "music");
  }
  async _fetchLidarrAddOptions() {
    if (this._lidarrAddOpts) return this._lidarrAddOpts;
    try {
      const o = await this._callApi("GET", "arr_stack/lidarr/addoptions");
      this._lidarrAddOpts = {
        quality: o?.quality || [],
        metadata: o?.metadata || [],
        rootFolders: o?.rootFolders || []
      };
    } catch (e) {
      console.warn("[arr-card] Lidarr add options failed:", e);
      this._lidarrAddOpts = { quality: [], metadata: [], rootFolders: [] };
    }
    return this._lidarrAddOpts;
  }
  // Lidarr wants the whole looked-up record back with the choices folded in —
  // the same shape its own Add screen posts.
  async _addLidarrArtist(artist, { profileId, metadataId, rootFolder, monitor }) {
    const body = {
      ...artist,
      id: 0,
      qualityProfileId: Number(profileId),
      metadataProfileId: Number(metadataId),
      rootFolderPath: rootFolder,
      monitored: monitor !== "none",
      monitorNewItems: monitor === "all" ? "all" : "new",
      addOptions: {
        monitor: ["all", "future", "latest", "none"].includes(monitor) ? monitor : "future",
        // Whatever was chosen to monitor is searched for: monitoring an album and
        // then not looking for it leaves a library that never fills. Future-only
        // has nothing to find today, so this costs nothing there.
        searchForMissingAlbums: monitor === "all" || monitor === "latest",
        searchForMissingTracks: monitor === "all" || monitor === "latest"
      }
    };
    const res = await this._callApi("POST", "arr_stack/lidarr/artist", body);
    this._lidarrArtistsAt = 0;
    await this._fetchLidarrArtists();
    if (res?.id) this._lidarrApplyMonitor(res.id, monitor).catch(() => {
    });
    await this._fetchLidarrQueue();
    return res;
  }
  // The album side of the Monitor choice in the add overlay. Albums only exist
  // once Lidarr's refresh has run, so this waits for them before deciding.
  async _lidarrApplyMonitor(artistId, monitor) {
    if (monitor === "future" || monitor === "none") return;
    let albums = [];
    for (let i = 0; i < 10; i++) {
      albums = await this._fetchLidarrDiscography(artistId);
      if (albums.length) break;
      await new Promise((r) => setTimeout(r, 1500));
    }
    if (!albums.length) return;
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const released = albums.filter((a) => (a.releaseDate || "") && a.releaseDate.slice(0, 10) <= today);
    const newest = (released.length ? released : albums).slice().sort((a, b) => String(b.releaseDate || "").localeCompare(String(a.releaseDate || "")))[0];
    const want = monitor === "all" ? albums.map((a) => a.id) : newest ? [newest.id] : [];
    const wantSet = new Set(want);
    const off = albums.filter((a) => a.monitored && !wantSet.has(a.id)).map((a) => a.id);
    const on = albums.filter((a) => !a.monitored && wantSet.has(a.id)).map((a) => a.id);
    if (off.length) await this._callApi("PUT", "arr_stack/lidarr/albums/monitor", { albumIds: off, monitored: false });
    if (on.length) await this._callApi("PUT", "arr_stack/lidarr/albums/monitor", { albumIds: on, monitored: true });
    const search = albums.filter((a) => wantSet.has(a.id) && !(a.statistics?.trackFileCount > 0)).map((a) => a.id);
    if (search.length) {
      await this._callApi("POST", "arr_stack/lidarr/command", { name: "AlbumSearch", albumIds: search });
    }
    await this._fetchLidarrQueue();
    this._reRenderSection?.("recentlyAdded");
  }
  async _fetchLastfm({ refresh = false } = {}) {
    if (!this._lastfmConfigured) {
      this._lastfm = [];
      return;
    }
    try {
      const list = await this._callApi("GET", `arr_stack/lastfm/suggested?limit=24${refresh ? "&refresh=1" : ""}`);
      const fresh = (Array.isArray(list) ? list : []).filter((r) => !this._musSkipped?.has(String(r.artist?.foreignArtistId || "").toLowerCase()));
      const held = [...this._musAddedEntries?.values() || []].filter((h) => !fresh.some((r) => String(r.artist?.foreignArtistId || "").toLowerCase() === String(h.artist?.foreignArtistId || "").toLowerCase()));
      this._lastfm = [...held, ...fresh];
      if (!refresh && fresh.length < 8 && !this._lastfmToppedUp) {
        this._lastfmToppedUp = true;
        this._musScheduleLastfmRefresh?.(400);
      }
    } catch (e) {
      console.warn("[arr-card] Last.fm suggestions failed:", e);
      this._lastfm = [];
    }
  }
  async _fetchSearchMusic(query) {
    if (!this._searchMusic) return [];
    const [byArtist, byAlbum] = await Promise.all([
      this._callApi("GET", `arr_stack/lidarr/lookup?term=${encodeURIComponent(query)}`).catch(() => []),
      this._callApi("GET", `arr_stack/lidarr/albumlookup?term=${encodeURIComponent(query)}`).catch(() => [])
    ]);
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    const push = (a, album) => {
      const key = a?.foreignArtistId || (a?.id ? `id:${a.id}` : null);
      if (!a?.artistName || !key || seen.has(key)) return;
      seen.add(key);
      const full = a.id ? this._lidarrArtists?.get(a.id) || a : a;
      out.push({ id: a.id || null, mediaType: "music", title: a.artistName, artist: full, viaAlbum: album || null });
    };
    for (const a of Array.isArray(byArtist) ? byArtist : []) push(a);
    for (const al of Array.isArray(byAlbum) ? byAlbum : []) push(al.artist, al.title);
    return out.slice(0, 8);
  }
  async _fetchSearch(query) {
    this._searchLoading = true;
    const musicP = this._fetchSearchMusic(query);
    if (this._searchType === "music") {
      this._searchResults = await musicP.catch(() => []);
      this._searchLoading = false;
      this._reRenderSearchResults();
      return;
    }
    try {
      if (this._overseerrConfigured === false) {
        const [movieRaw, tvRaw] = await Promise.allSettled([
          this._callApi("GET", `arr_stack/radarr/lookup?term=${encodeURIComponent(query)}`),
          this._callApi("GET", `arr_stack/sonarr/lookup?term=${encodeURIComponent(query)}`)
        ]);
        const movies = (movieRaw.status === "fulfilled" && Array.isArray(movieRaw.value) ? movieRaw.value : []).filter((m) => m.tmdbId).map((m) => ({
          id: m.tmdbId,
          mediaType: "movie",
          title: m.title || "",
          posterPath: m.remotePoster || null,
          overview: m.overview || "",
          releaseDate: m.year ? `${m.year}-01-01` : "",
          genres: (m.genres || []).map((g) => typeof g === "string" ? { name: g } : g),
          ratings: m.ratings || {},
          voteAverage: m.ratings?.tmdb?.value || m.ratings?.imdb?.value || 0,
          images: m.images || [],
          youTubeTrailerId: m.youTubeTrailerId || null,
          mediaInfo: null
        }));
        const shows = (tvRaw.status === "fulfilled" && Array.isArray(tvRaw.value) ? tvRaw.value : []).filter((s) => s.tvdbId).map((s) => ({
          id: s.tmdbId || null,
          tvdbId: s.tvdbId,
          mediaType: "tv",
          name: s.title || "",
          posterPath: s.remotePoster || null,
          overview: s.overview || "",
          firstAirDate: s.year ? `${s.year}-01-01` : "",
          genres: (s.genres || []).map((g) => typeof g === "string" ? { name: g } : g),
          ratings: s.ratings || {},
          voteAverage: s.ratings?.tmdb?.value || s.ratings?.imdb?.value || s.ratings?.value || 0,
          images: s.images || [],
          youTubeTrailerId: s.youTubeTrailerId || null,
          mediaInfo: null
        }));
        const merged = [];
        const max = Math.max(movies.length, shows.length);
        for (let i = 0; i < max; i++) {
          if (movies[i]) merged.push(movies[i]);
          if (shows[i]) merged.push(shows[i]);
        }
        this._searchResults = merged;
      } else {
        const data = await this._callApi("POST", `arr_stack/${this._discoverSvc}/search`, { query });
        this._searchResults = (data?.results || []).filter((r) => r.mediaType === "movie" || r.mediaType === "tv");
      }
      const type = this._searchType;
      if (type === "movie" || type === "tv") {
        this._searchResults = this._searchResults.filter((r) => r.mediaType === type);
      }
      this._searchResults = [...this._searchResults, ...await musicP];
    } catch (e) {
      this._searchResults = await musicP.catch(() => []);
      console.error("[arr-card] Search fetch error:", e);
    }
    this._searchLoading = false;
    this._reRenderSearchResults();
  }
  async _addOverseerrRequest(mediaId, profileId = null, tagId = null, rootFolder = null, use4k = false) {
    this._markActivated();
    this._optimisticRequested.add(mediaId);
    this._withdrawnIds.delete(mediaId);
    this._requestPending = null;
    this._reRenderRight(true);
    if (this._popup) this._renderPopupEl();
    try {
      if (!this._seerrRadarr) await this._fetchOverseerrRadarrSettings();
      const seerr = use4k && this._seerrRadarr2 ? this._seerrRadarr2 : this._seerrRadarr;
      const body = { mediaId, mediaType: "movie" };
      if (seerr) {
        body.serverId = seerr.serverId;
        body.profileId = profileId !== null ? parseInt(profileId) : seerr.profileId;
        body.rootFolder = rootFolder || seerr.rootFolder;
      }
      if (tagId !== null) body.tags = [parseInt(tagId)];
      {
        const _acct = this._seerrAccountForUser();
        if (_acct !== "admin") body.userMode = _acct;
      }
      const resp = await this._callApi("POST", "arr_stack/overseerr/request", body);
      const reqId = Array.isArray(resp) ? resp[0]?.id : resp?.id;
      if (reqId && !this._hass.user.is_admin) {
        this._familyPendingIds.set(Number(mediaId), reqId);
        this._savePendingToStorage();
        this._reRenderRight(true);
      }
      this._fetchOverseerr().then(() => {
        this._reRenderRight(true);
        if (this._popup) this._renderPopupEl();
      });
      setTimeout(() => this._fetchRadarr().then(() => {
        this._reRenderRight(true);
        if (this._popup) this._renderPopupEl();
      }), 2e3);
      if (use4k) setTimeout(() => this._fetchRadarr2().then(() => {
        this._reRenderRight(true);
        if (this._popup) this._renderPopupEl();
      }), 2e3);
    } catch (e) {
      this._optimisticRequested.delete(mediaId);
      this._reRenderRight(true);
      console.error("[arr-card] Overseerr add request error:", e);
    }
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Tautulli — poster data fetch
  // ──────────────────────────────────────────────────────────────────────────
  async _fetchTautulli() {
    if (!this._tautulliConfigured) return;
    try {
      const [actRaw, statsRaw, playsRaw, ackRaw, libsRaw, histRaw] = await Promise.all([
        this._hass.callApi("GET", "arr_stack/tautulli/get_activity").catch(() => null),
        this._hass.callApi("GET", "arr_stack/tautulli/get_home_stats?time_range=7&stats_count=5&stats_type=plays").catch(() => null),
        this._hass.callApi("GET", "arr_stack/tautulli/get_plays_by_date?time_range=7&y_axis=plays").catch(() => null),
        this._hass.callApi("GET", "arr_stack/tautulli/sharing_ack").catch(() => null),
        this._hass.callApi("GET", "arr_stack/tautulli/get_libraries_table?length=20&start=0").catch(() => null),
        this._hass.callApi("GET", `arr_stack/tautulli/get_history?length=${this._config?.security?.ip_history_depth ?? 200}&order_column=date&order_dir=desc`).catch(() => null)
      ]);
      if (actRaw === null && statsRaw === null) {
        this._tautulliConfigured = false;
        return;
      }
      const act = actRaw?.response?.data || {};
      const stats = statsRaw?.response?.data || [];
      const playsD = playsRaw?.response?.data || {};
      const cats = playsD.categories || [];
      const series = playsD.series || [];
      const movieSeries = series.find((sr) => /movie/i.test(sr.name));
      const showSeries = series.find((sr) => /tv|show/i.test(sr.name));
      const musicSeries = series.find((sr) => /music|artist/i.test(sr.name));
      const playsData = cats.map((date, i) => ({
        date,
        value: series.reduce((s, sr) => s + ((sr.data || [])[i] || 0), 0),
        movie: (movieSeries?.data || [])[i] || 0,
        show: (showSeries?.data || [])[i] || 0,
        music: (musicSeries?.data || [])[i] || 0
      }));
      const threshold = this._config?.security?.ip_sharing_threshold ?? 2;
      const histRows = histRaw?.response?.data?.data || [];
      const byUser = {};
      histRows.forEach((h) => {
        const name = h.friendly_name || h.user || h.username;
        if (!name || !h.ip_address) return;
        if (!byUser[name]) byUser[name] = {};
        const ip = h.ip_address;
        if (!byUser[name][ip]) byUser[name][ip] = { ip, lastSeen: h.date || h.stopped || 0, count: 0 };
        byUser[name][ip].count++;
        if ((h.date || h.stopped || 0) > byUser[name][ip].lastSeen) byUser[name][ip].lastSeen = h.date || h.stopped || 0;
      });
      const ackedIps = ackRaw?.ackedIps || {};
      const sharingUsers = [];
      const ipReport = {};
      for (const [name, ipMap] of Object.entries(byUser)) {
        const knownIps = new Set(ackedIps[name] || []);
        const newIps = Object.values(ipMap).filter((e) => !knownIps.has(e.ip));
        if (newIps.length >= threshold) {
          sharingUsers.push(name);
          ipReport[name] = Object.values(ipMap).sort((a, b) => b.lastSeen - a.lastSeen);
        }
      }
      this._tautulli = {
        activity: act,
        stats,
        playsData,
        libraries: libsRaw?.response?.data?.data || [],
        recentHistory: histRaw?.response?.data?.data || [],
        sharingDetected: sharingUsers.length > 0,
        sharingAcked: false,
        sharingUsers,
        ackedIps,
        ipReport
      };
    } catch (e) {
      console.warn("[arr-card] Tautulli fetch error:", e);
    }
  }
  async _ackTautulliSharing() {
    if (!this._tautulli) return;
    const { sharingUsers, ackedIps: prev, ipReport } = this._tautulli;
    const updated = { ...prev };
    sharingUsers.forEach((name) => {
      const ips = (ipReport?.[name] || []).map((e) => e.ip);
      const existing = new Set(prev[name] || []);
      ips.forEach((ip) => existing.add(ip));
      updated[name] = [...existing];
    });
    try {
      await this._hass.callApi("POST", "arr_stack/tautulli/sharing_ack", { ackedIps: updated });
      this._tautulli = { ...this._tautulli, sharingAcked: true, ackedIps: updated };
      this._reRenderRight();
    } catch (e) {
      console.warn("[arr-card] Tautulli ack error:", e);
    }
  }
  // ─────────────────────────────────────────────
  // Jellystat
  // ─────────────────────────────────────────────
  async _fetchJellystat() {
    if (!this._jellystatConfigured) return;
    try {
      const [libsRaw, usersRaw, histRaw, playsRaw] = await Promise.all([
        this._hass.callApi("GET", "arr_stack/jellystat/getLibraries").catch(() => null),
        this._hass.callApi("GET", "arr_stack/jellystat/stats/getAllUserActivity").catch(() => null),
        this._hass.callApi("GET", "arr_stack/jellystat/getHistory?page=1&size=5").catch(() => null),
        this._hass.callApi("GET", "arr_stack/jellystat/stats/getViewsOverTime").catch(() => null)
      ]);
      if (libsRaw === null && usersRaw === null) {
        this._jellystatConfigured = false;
        return;
      }
      const libraries = Array.isArray(libsRaw) ? libsRaw : libsRaw?.data || libsRaw?.items || [];
      const users = Array.isArray(usersRaw) ? usersRaw : usersRaw?.data || usersRaw?.users || [];
      const recentHistory = (histRaw?.results || histRaw?.data || (Array.isArray(histRaw) ? histRaw : [])).slice(0, 5);
      const statsArr = playsRaw?.stats || [];
      const today = /* @__PURE__ */ new Date();
      const playsData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today - (6 - i) * 864e5);
        const dateStr = d.toISOString().slice(0, 10);
        const entry = statsArr.find((r) => {
          try {
            return new Date(r.Key).toISOString().slice(0, 10) === dateStr;
          } catch {
            return false;
          }
        });
        if (!entry) return { date: dateStr, value: 0 };
        const value = Object.values(entry).filter((v) => v && typeof v === "object" && "count" in v).reduce((s, v) => s + (v.count || 0), 0);
        return { date: dateStr, value };
      });
      users.sort((a, b) => (b.Plays ?? b.TotalPlays ?? 0) - (a.Plays ?? a.TotalPlays ?? 0));
      this._jellystat = { libraries, users, recentHistory, activity: {}, playsData };
    } catch (e) {
      console.warn("[arr-card] Jellystat fetch error:", e);
    }
  }
  // ─────────────────────────────────────────────
  // Auto Search — Radarr
  // ─────────────────────────────────────────────
  async _triggerRadarrAutoSearch(instance = "radarr") {
    this._markActivated();
    const svc = instance === "radarr2" ? "radarr2" : "radarr";
    const d = this._popup;
    const movieId = instance === "radarr2" ? d._radarr2Id : d._radarrId;
    const _asDelay = (ms) => new Promise((r) => setTimeout(r, ms));
    this._dlTriggeredBy = "as";
    if (movieId) {
      this._asMovieSearching = true;
      this._renderPopupEl();
      try {
        await Promise.all([
          this._callApi("POST", `arr_stack/${svc}/command`, { name: "MoviesSearch", movieIds: [movieId] }),
          _asDelay(1e3)
        ]);
        this._asMovieSearched = true;
        this._asState = "done";
        this._asPollForDownload(`movie:${instance}`, svc, movieId);
      } catch (e) {
        this._asState = "error";
        this._asError = e.message || this._t("isLoadError");
        this._asOpen = false;
        this._asState = null;
      }
      this._asMovieSearching = false;
      this._renderPopupEl();
    } else {
      this._asState = "adding";
      this._renderPopupEl();
      try {
        const tmdbId = d.id || d.tmdbId;
        if (!tmdbId) throw new Error(this._t("isMissingTmdb"));
        const seerr = instance === "radarr2" ? this._seerrRadarr2 : this._seerrRadarr;
        if (instance === "radarr2") {
          if (!this._radarr2Profiles?.length) await this._fetchRadarr2Profiles();
          if (!this._radarr2RootFolders?.length) await this._fetchRadarr2RootFolders();
        } else {
          if (!this._radarrProfiles?.length) await this._fetchRadarrProfiles();
          if (!this._radarrRootFolders?.length) await this._fetchRadarrRootFolders();
        }
        const profiles = instance === "radarr2" ? this._radarr2Profiles : this._radarrProfiles;
        const rootFolders = instance === "radarr2" ? this._radarr2RootFolders : this._radarrRootFolders;
        const pId = seerr?.profileId ? parseInt(seerr.profileId) : profiles?.[0]?.id ?? 1;
        const rf = seerr?.rootFolder || rootFolders?.[0]?.path || "/movies";
        const body = { tmdbId: parseInt(tmdbId), title: d.title || d.name || "", qualityProfileId: pId, rootFolderPath: rf, monitored: true, addOptions: { searchForMovie: true } };
        const [added] = await Promise.all([
          this._callApi("POST", `arr_stack/${svc}/movie`, body),
          _asDelay(1e3)
        ]);
        if (added?.id) {
          if (instance === "radarr2") d._radarr2Id = added.id;
          else d._radarrId = added.id;
        }
        if (instance === "radarr2") await this._fetchRadarr2();
        else await this._fetchRadarr();
        this._asMovieSearched = true;
        this._asState = "done";
        const newMovieId = instance === "radarr2" ? d._radarr2Id : d._radarrId;
        if (newMovieId) this._asPollForDownload(`movie:${instance}`, svc, newMovieId);
      } catch (e) {
        this._asState = "error";
        this._asError = e.message || this._t("isLoadError");
        this._asOpen = false;
        this._asState = null;
      }
      this._renderPopupEl();
    }
  }
  // ─────────────────────────────────────────────
  // Auto Search — Sonarr (add series + seasons)
  // ─────────────────────────────────────────────
  async _addSeriesForAs(instance = "sonarr") {
    this._markActivated();
    const svc = instance === "sonarr2" ? "sonarr2" : "sonarr";
    this._dlTriggeredBy = "as";
    this._asState = "adding";
    this._renderPopupEl();
    try {
      const d = this._popup;
      const tvdbId = d.externalIds?.tvdbId || d._tvdbId;
      if (!tvdbId) throw new Error(this._t("snNoSonarrId"));
      const lookupResults = await this._callApi("GET", `arr_stack/${svc}/lookup?tvdbId=${tvdbId}`);
      const seriesData = Array.isArray(lookupResults) ? lookupResults[0] : lookupResults;
      if (!seriesData) throw new Error(this._t("snNoSonarrId"));
      if (this._overseerrConfigured !== false && !this._seerrSonarr) await this._fetchOverseerrSonarrSettings();
      const seerr = instance === "sonarr2" ? this._seerrSonarr2 : this._seerrSonarr;
      let profileId, rootFolder;
      if (seerr) {
        profileId = seerr.profileId ?? 1;
        rootFolder = seerr.rootFolder ?? "/tv";
      } else {
        if (instance === "sonarr2") {
          if (!this._sonarr2Profiles?.length) await this._fetchSonarr2Profiles();
          if (!this._sonarr2RootFolders?.length) await this._fetchSonarr2RootFolders();
          profileId = this._sonarr2Profiles?.[0]?.id ?? 1;
          rootFolder = this._sonarr2RootFolders?.[0]?.path ?? "/tv";
        } else {
          await this._fetchSonarrProfiles();
          await this._fetchSonarrRootFolders();
          profileId = this._sonarrProfiles?.[0]?.id ?? 1;
          rootFolder = this._sonarrRootFolders?.[0]?.path ?? "/tv";
        }
      }
      let added;
      try {
        added = await this._callApi("POST", `arr_stack/${svc}/series`, {
          ...seriesData,
          qualityProfileId: parseInt(profileId),
          rootFolderPath: rootFolder,
          monitored: false,
          addOptions: { searchForMissingEpisodes: false, searchForCutoffUnmetEpisodes: false, monitor: "none" }
        });
      } catch (_) {
      }
      if (instance === "sonarr2") {
        await this._fetchSonarr2();
        const found = (this._sonarr2 || []).find(
          (s) => String(s.tvdbId) === String(tvdbId) || added?.id && s.id === added.id
        ) || added;
        if (found) d._sonarr2Series = found;
      } else {
        await this._fetchSonarr();
        const found = (this._sonarrAll || []).find(
          (s) => String(s.tvdbId) === String(tvdbId) || added?.id && s.id === added.id
        ) || added;
        if (found) d._sonarrSeries = found;
      }
      if (tvdbId) this._pendingRequestedShows.add(String(tvdbId));
      this._render();
      this._asState = "seasons";
    } catch (e) {
      this._asState = "error";
      this._asError = e.message || this._t("isLoadError");
    }
    this._renderPopupEl();
  }
  async _triggerSonarrSeasonSearch(seasonNumber, instance = "sonarr") {
    const svc = instance === "sonarr2" ? "sonarr2" : "sonarr";
    const d = this._popup;
    const series = instance === "sonarr2" ? d._sonarr2Series : d._sonarrSeries;
    if (!series?.id) return;
    const seriesId = series.id;
    const key = `season:${seasonNumber}`;
    this._dlTriggeredBy = "as";
    this._asSearchingItems.add(key);
    this._renderPopupEl();
    try {
      const cache = instance === "sonarr2" ? this._sonarr2 || [] : this._sonarr || [];
      const full = cache.find((s) => s.id === seriesId) || series;
      const updated = {
        ...full,
        monitored: true,
        seasons: (full.seasons || []).map(
          (s) => s.seasonNumber === seasonNumber ? { ...s, monitored: true } : s
        )
      };
      await this._callApi("PUT", `arr_stack/${svc}/series/${seriesId}`, updated);
      if (instance === "sonarr2") {
        this._sonarr2 = (this._sonarr2 || []).map((s) => s.id === seriesId ? updated : s);
        d._sonarr2Series = updated;
      } else {
        this._sonarr = (this._sonarr || []).map((s) => s.id === seriesId ? updated : s);
        d._sonarrSeries = updated;
      }
      this._render();
      await Promise.all([
        this._callApi("POST", `arr_stack/${svc}/command`, { name: "SeasonSearch", seriesId, seasonNumber }),
        new Promise((r) => setTimeout(r, 1e3))
      ]);
      this._asSearchedItems.add(key);
      this._asPollForDownload(key, svc, seriesId);
    } catch (e) {
      console.error("[arr-card] Season search error:", e);
    }
    this._asSearchingItems.delete(key);
    this._renderPopupEl();
  }
  async _triggerSonarrEpisodeSearch(episodeId, seasonNumber, instance = "sonarr") {
    const svc = instance === "sonarr2" ? "sonarr2" : "sonarr";
    const d = this._popup;
    const series = instance === "sonarr2" ? d._sonarr2Series : d._sonarrSeries;
    const key = `ep:${episodeId}`;
    this._asSearchingItems.add(key);
    this._renderPopupEl();
    try {
      await Promise.all([
        this._callApi("POST", `arr_stack/${svc}/command`, { name: "EpisodeSearch", episodeIds: [episodeId] }),
        new Promise((r) => setTimeout(r, 1e3))
      ]);
      this._asSearchedItems.add(key);
      if (series?.id) this._asPollForDownload(key, svc, series.id);
    } catch (e) {
      console.error("[arr-card] Episode search error:", e);
    }
    this._asSearchingItems.delete(key);
    this._renderPopupEl();
  }
  // ─────────────────────────────────────────────
  // Auto Search — poll queue after search fired
  // key: 'movie' | 'season:N' | 'ep:ID'
  // movieOrSeriesId: Radarr movieId or Sonarr seriesId
  // ─────────────────────────────────────────────
  async _asPollForDownload(key, svc, movieOrSeriesId) {
    const isRadarr = svc === "radarr" || svc === "radarr2";
    const endpoint = `arr_stack/${svc}/queue`;
    this._asPolling.add(key);
    this._renderPopupEl();
    const delays = [1e3, 2e3, 2e3, 2e3];
    for (let i = 0; i < delays.length; i++) {
      await new Promise((r) => setTimeout(r, delays[i]));
      if (!this._asOpen) {
        this._asPolling.delete(key);
        return;
      }
      try {
        const data = await this._callApi("GET", endpoint);
        const records = Array.isArray(data) ? data : data.records || [];
        const found = records.some((item) => {
          if (isRadarr) return item.movieId === movieOrSeriesId;
          return item.seriesId === movieOrSeriesId;
        });
        if (found) {
          this._asPolling.delete(key);
          this._asDownloadingItems.add(key);
          if (isRadarr) {
            this._asOpen = false;
            this._asState = null;
          }
          this._renderPopupEl();
          return;
        }
      } catch (_) {
      }
    }
    this._asPolling.delete(key);
    if (this._asOpen) {
      this._asNotFound.add(key);
      this._renderPopupEl();
      setTimeout(() => {
        this._asNotFound.delete(key);
        if (isRadarr) {
          this._asOpen = false;
          this._asState = null;
        }
        this._renderPopupEl();
      }, 5e3);
    }
  }
  async _fetchActivityHistory() {
    try {
      const svcs = ["radarr", "sonarr"];
      const calls = [
        this._callApi("GET", "arr_stack/radarr/activity/history?page=1&pageSize=30&sortKey=date&sortDir=desc"),
        this._callApi("GET", "arr_stack/sonarr/activity/history?page=1&pageSize=30&sortKey=date&sortDir=desc")
      ];
      if (this._radarr2Configured !== false) {
        svcs.push("radarr2");
        calls.push(this._callApi("GET", "arr_stack/radarr2/activity/history?page=1&pageSize=30&sortKey=date&sortDir=desc"));
      }
      if (this._sonarr2Configured !== false) {
        svcs.push("sonarr2");
        calls.push(this._callApi("GET", "arr_stack/sonarr2/activity/history?page=1&pageSize=30&sortKey=date&sortDir=desc"));
      }
      const results = await Promise.allSettled(calls);
      const all = [];
      results.forEach((r, i) => {
        if (r.status !== "fulfilled") return;
        const isRadarr = svcs[i].startsWith("radarr");
        for (const rec of r.value?.records || []) {
          const title = isRadarr ? rec.movie?.title || rec.sourceTitle || "\u2014" : rec.series?.title || rec.sourceTitle || "\u2014";
          const ep = !isRadarr && rec.episode ? `S${String(rec.episode.seasonNumber).padStart(2, "0")}E${String(rec.episode.episodeNumber).padStart(2, "0")}` : null;
          all.push({ title, date: rec.date, eventType: rec.eventType, svc: svcs[i], ep });
        }
      });
      all.sort((a, b) => new Date(b.date) - new Date(a.date));
      this._actHistoryCache = all;
    } catch (e) {
    }
  }
  async _fetchActivityBlocklist() {
    try {
      const svcs = ["radarr", "sonarr"];
      const calls = [
        this._callApi("GET", "arr_stack/radarr/activity/blocklist?page=1&pageSize=30"),
        this._callApi("GET", "arr_stack/sonarr/activity/blocklist?page=1&pageSize=30")
      ];
      if (this._radarr2Configured !== false) {
        svcs.push("radarr2");
        calls.push(this._callApi("GET", "arr_stack/radarr2/activity/blocklist?page=1&pageSize=30"));
      }
      if (this._sonarr2Configured !== false) {
        svcs.push("sonarr2");
        calls.push(this._callApi("GET", "arr_stack/sonarr2/activity/blocklist?page=1&pageSize=30"));
      }
      const results = await Promise.allSettled(calls);
      const all = [];
      results.forEach((r, i) => {
        if (r.status !== "fulfilled") return;
        const isRadarr = svcs[i].startsWith("radarr");
        for (const rec of r.value?.records || []) {
          const title = isRadarr ? rec.movie?.title || rec.sourceTitle || "\u2014" : rec.series?.title || rec.sourceTitle || "\u2014";
          all.push({ title, date: rec.date, quality: rec.quality?.quality?.name || "", svc: svcs[i] });
        }
      });
      all.sort((a, b) => new Date(b.date) - new Date(a.date));
      this._actBlocklistCache = all;
    } catch (e) {
    }
  }
  async _fetchProwlarr() {
    if (this._prowlarrConfigured === false) return;
    try {
      const endDate = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
      const startDt = new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
      const [indexers, status, apps, stats, histResp] = await Promise.all([
        this._callApi("GET", "arr_stack/prowlarr/indexers"),
        this._callApi("GET", "arr_stack/prowlarr/indexerstatus"),
        this._callApi("GET", "arr_stack/prowlarr/applications").catch(() => []),
        this._callApi("GET", `arr_stack/prowlarr/indexerstats?startDate=${startDt}&endDate=${endDate}`).catch(() => null),
        this._callApi("GET", "arr_stack/prowlarr/history?pageSize=50").catch(() => null)
      ]);
      if (indexers?._notConfigured) {
        this._prowlarrConfigured = false;
        return;
      }
      this._prowlarrConfigured = true;
      const statusMap = {};
      for (const s of status || []) statusMap[s.indexerId] = s;
      const prevResults = this._prowlarr?.appTestResults || null;
      this._prowlarr = {
        indexers: (indexers || []).map((idx) => ({
          ...idx,
          _status: statusMap[idx.id] || null
        })),
        apps: apps || [],
        stats: stats || null,
        recentHistory: histResp?.records || [],
        appTestResults: prevResults || {},
        lastFetch: Date.now()
      };
      this._prowlarrTestAppsBackground();
    } catch (_) {
      this._prowlarrConfigured = false;
    }
  }
  async _prowlarrTestAppsBackground() {
    const apps = this._prowlarr?.apps || [];
    if (!apps.length) return;
    if (!this._prowlarr.appTestResults) this._prowlarr.appTestResults = {};
    await Promise.all(apps.map(async (app) => {
      try {
        const r = await this._callApi("POST", "arr_stack/prowlarr/apptest", app);
        if (this._prowlarr?.appTestResults)
          this._prowlarr.appTestResults[app.id] = { ok: r?.ok !== false, errors: r?.errors || [] };
      } catch (_) {
        if (this._prowlarr?.appTestResults)
          this._prowlarr.appTestResults[app.id] = { ok: false, errors: [] };
      }
    }));
    const posterEl = this.shadowRoot?.querySelector('[data-pw-open="apps"]');
    if (posterEl && this._pwAppsCard) {
      const tmp = document.createElement("div");
      tmp.innerHTML = this._pwAppsCard();
      const newEl = tmp.firstElementChild;
      if (newEl) posterEl.replaceWith(newEl);
    }
  }
  async _fetchTracearr() {
    if (!this._tracearrConfigured) return;
    try {
      const [stats, health, viols, act] = await Promise.all([
        this._hass.callApi("GET", "arr_stack/tracearr/v1/public/stats").catch(() => null),
        this._hass.callApi("GET", "arr_stack/tracearr/v1/public/health").catch(() => null),
        this._hass.callApi("GET", "arr_stack/tracearr/v1/public/violations?pageSize=5").catch(() => null),
        this._hass.callApi("GET", "arr_stack/tracearr/v1/public/activity?days=7").catch(() => null)
      ]);
      if (stats?._notConfigured || stats?.error === "Tracearr not configured") {
        this._tracearrConfigured = false;
        return;
      }
      const [usersR, topTranscode] = await Promise.all([
        this._hass.callApi("GET", "arr_stack/tracearr/v1/public/users?pageSize=10&sort=trustScore&order=asc").catch(() => null),
        this._hass.callApi("GET", "arr_stack/tracearr/v1/stats/device-compatibility/top-transcoding-users?period=month").catch(() => null)
      ]);
      this._tracearr = {
        stats: stats || {},
        health: health || {},
        users: usersR?.data || [],
        violations: viols?.data || [],
        violationTotal: viols?.meta?.total || 0,
        activity: act || {},
        topTranscode: topTranscode?.data || []
      };
    } catch (_) {
      this._tracearrConfigured = false;
    }
  }
  async _deleteEpisodeFile(episodeFileId, seasonNumber, instance = "sonarr") {
    const svc = instance === "sonarr2" ? "sonarr2" : "sonarr";
    this._epFileDeleting = episodeFileId;
    this._renderPopupEl();
    try {
      await this._callApi("DELETE", `arr_stack/${svc}/episodefile/${episodeFileId}`);
      this._snEpisodes.delete(seasonNumber);
      const series = instance === "sonarr2" ? this._popup?._sonarr2Series : this._popup?._sonarrSeries;
      if (series) {
        const s = (series.seasons || []).find((s2) => s2.seasonNumber === seasonNumber);
        if (s?.statistics) s.statistics.episodeFileCount = Math.max(0, (s.statistics.episodeFileCount || 0) - 1);
      }
      const sid = series?.id;
      if (sid) this._fetchSonarrEpisodes(sid, seasonNumber, instance);
    } catch (e) {
      console.error("[arr-card] Episode file delete error:", e);
    }
    this._epFileDeleting = null;
    this._renderPopupEl();
  }
  async _deleteSeasonFiles(seasonNumber, instance = "sonarr") {
    const svc = instance === "sonarr2" ? "sonarr2" : "sonarr";
    const series = instance === "sonarr2" ? this._popup?._sonarr2Series : this._popup?._sonarrSeries;
    const sid = series?.id;
    if (!sid) return;
    this._seasonFileDeleting = seasonNumber;
    this._renderPopupEl();
    try {
      const data = await this._callApi("GET", `arr_stack/${svc}/episodefiles?seriesId=${sid}`);
      const files = (Array.isArray(data) ? data : []).filter((f) => {
        const eps = this._snEpisodes.get(seasonNumber);
        if (eps) return eps.some((ep) => ep.episodeFileId === f.id);
        return f.seasonNumber === seasonNumber;
      });
      if (files.length > 0) {
        const ids = files.map((f) => f.id);
        await this._callApi("DELETE", `arr_stack/${svc}/episodefile-bulk`, { episodeFileIds: ids });
      }
      this._snEpisodes.delete(seasonNumber);
      const s = (series.seasons || []).find((s2) => s2.seasonNumber === seasonNumber);
      if (s?.statistics) s.statistics.episodeFileCount = 0;
      this._fetchSonarrEpisodes(sid, seasonNumber, instance);
    } catch (e) {
      console.error("[arr-card] Season files delete error:", e);
    }
    this._seasonFileDeleting = null;
    this._renderPopupEl();
  }
  async _fetchMaintainerr() {
    if (this._maintainerrConfigured === false) return;
    try {
      const [rules, collections, settings, libraries] = await Promise.all([
        this._hass.callApi("GET", "arr_stack/maintainerr/rules").catch(() => null),
        this._hass.callApi("GET", "arr_stack/maintainerr/collections").catch(() => null),
        this._hass.callApi("GET", "arr_stack/maintainerr/settings").catch(() => null),
        this._hass.callApi("GET", "arr_stack/maintainerr/media-server/libraries").catch(() => null)
      ]);
      if (Array.isArray(libraries) && libraries.length) this._maintainerrLibraries = libraries;
      if (rules?._notConfigured || collections?._notConfigured) {
        this._maintainerrConfigured = false;
        return;
      }
      this._maintainerr = {
        rules: Array.isArray(rules) ? rules : [],
        collections: Array.isArray(collections) ? collections : [],
        settings: settings || {}
      };
      this._maintainerrConfigured = true;
      await this._mtLoadDelMap();
      this._mtLoadLibTotals();
    } catch (e) {
      console.warn("[arr-card] Maintainerr fetch:", e);
    }
  }
  // Item count per library, for the Overview card. Asked for once per session
  // rather than every poll: it costs one request per library and a media server's
  // library sizes do not move on a 30-second timescale.
  async _mtLoadLibTotals() {
    if (this._mtLibTotals || this._mtLibTotalsLoading) return;
    const libs = this._maintainerrLibraries || [];
    if (!libs.length) return;
    this._mtLibTotalsLoading = true;
    try {
      const totals = {};
      await Promise.all(libs.map(async (l) => {
        const params = new URLSearchParams({ page: "1", limit: "1" });
        if (l.type) params.set("type", l.type);
        const data = await this._hass.callApi("GET", `arr_stack/maintainerr/media-server/library/${l.id}/content?${params}`).catch(() => null);
        if (data?.totalSize != null) totals[l.id] = data.totalSize;
      }));
      this._mtLibTotals = totals;
    } catch (e) {
      console.warn("[arr-card] Maintainerr library totals:", e);
    } finally {
      this._mtLibTotalsLoading = false;
    }
  }
  // Recently Requested reads Seerr's own request list when Seerr is configured —
  // the section is named after requests, and the Radarr/Sonarr wanted list it used
  // to be built from answers a different question. `null` means "no Seerr data",
  // which is what makes the getter fall back to the library.
  async _fetchSeerrRequests() {
    if (this._overseerrConfigured === false) {
      this._seerrRequests = null;
      return;
    }
    try {
      this._seerrRequestsErr = false;
      const acct = this._seerrAccountForUser();
      const url = acct === "admin" ? "arr_stack/overseerr/requests?take=30" : `arr_stack/overseerr/my_pending?userMode=${acct}&enrich=1&take=30`;
      const data = await this._callApi("GET", url);
      this._seerrRequests = Array.isArray(data?.results) ? data.results : null;
    } catch (e) {
      console.error("[arr-card] Seerr requests fetch error:", e);
      this._seerrRequests = null;
      this._seerrRequestsErr = true;
    }
  }
  // ── Lidarr ────────────────────────────────────────────────────────────────
  // An album has no "added" date and the full album list runs to tens of
  // megabytes, so recently added music is assembled the other way round: read the
  // import history, which is ordered and small, then fetch only the albums it
  // names.
  async _fetchLidarr() {
    if (this._lidarrConfigured === false) return;
    try {
      const hist = await this._callApi("GET", "arr_stack/lidarr/history?pageSize=200&eventType=3");
      if (hist && hist._notConfigured) {
        this._lidarrConfigured = false;
        return;
      }
      this._lidarrConfigured = true;
      const albumSeen = /* @__PURE__ */ new Map();
      const artistOrder = [];
      const artistAlbums = /* @__PURE__ */ new Map();
      for (const r of hist?.records || []) {
        const albumId = r.albumId;
        const artistId = r.artistId;
        if (!albumId || !artistId) continue;
        if (!albumSeen.has(albumId)) albumSeen.set(albumId, r.date || "");
        if (!artistAlbums.has(artistId)) {
          artistAlbums.set(artistId, []);
          artistOrder.push(artistId);
        }
        const list = artistAlbums.get(artistId);
        if (!list.includes(albumId)) list.push(albumId);
        if (artistOrder.length >= 40 && albumSeen.size >= 60) break;
      }
      if (artistOrder.length === 0) {
        this._lidarrArtistFeed = [];
        return;
      }
      await this._fetchLidarrArtists();
      const wanted = artistOrder.map((id) => artistAlbums.get(id)[0]);
      const albums = await this._callApi("GET", `arr_stack/lidarr/albums?ids=${wanted.join(",")}`);
      const byId = new Map((Array.isArray(albums) ? albums : []).map((a) => [a.id, a]));
      this._lidarrArtistFeed = artistOrder.map((artistId) => {
        const newestId = artistAlbums.get(artistId)[0];
        const album = byId.get(newestId) || null;
        const artist = this._lidarrArtists?.get(artistId) || album?.artist || null;
        if (!artist) return null;
        return {
          id: artistId,
          artist,
          newestAlbum: album,
          newAlbumCount: artistAlbums.get(artistId).length,
          _importedAt: albumSeen.get(newestId) || ""
        };
      }).filter(Boolean);
      await this._fetchLidarrQueue();
    } catch (e) {
      if (this._lidarrConfigured === null) this._lidarrConfigured = false;
      console.error("[arr-card] Lidarr fetch error:", e);
    }
  }
  // One artist's discography, read when their card is opened. Small enough to
  // take whole — the full album list across the library is not.
  async _fetchLidarrArtist(artistId) {
    try {
      const a = await this._callApi("GET", `arr_stack/lidarr/artist?id=${artistId}`);
      if (a?.id) this._lidarrArtists?.set(a.id, a);
      return a?.id ? a : null;
    } catch (e) {
      if (e?.status_code === 404) {
        if (this._musicModal?.artistId === artistId) this._closeMusicModal?.();
        this._musForgetArtist?.(artistId);
        return null;
      }
      console.error("[arr-card] Lidarr artist error:", e);
      return null;
    }
  }
  async _fetchLidarrDiscography(artistId) {
    try {
      const albums = await this._callApi("GET", `arr_stack/lidarr/albums?artistId=${artistId}`);
      return Array.isArray(albums) ? albums : [];
    } catch (e) {
      console.error("[arr-card] Lidarr discography error:", e);
      return [];
    }
  }
  // Hundreds of artists rather than thousands of albums, so this one can be read
  // whole — and it carries the fanart the album cards sit on. Refreshed at most
  // hourly; new artists are rare and the payload is the largest of the three.
  async _fetchLidarrArtists() {
    const now = Date.now();
    if (this._lidarrArtists?.size && now - (this._lidarrArtistsAt || 0) < 36e5) return;
    try {
      const list = await this._callApi("GET", "arr_stack/lidarr/artists");
      if (!Array.isArray(list)) return;
      this._lidarrArtists = new Map(list.map((a) => [a.id, a]));
      this._lidarrArtistsAt = now;
    } catch (_) {
    }
  }
  async _fetchLidarrQueue() {
    try {
      const q = await this._callApi("GET", "arr_stack/lidarr/queue?pageSize=100");
      const recs = Array.isArray(q) ? q : q?.records || [];
      this._lidarrQueue = new Set(recs.map((r) => r.albumId).filter(Boolean));
      const pct = /* @__PURE__ */ new Map();
      const artists = /* @__PURE__ */ new Map();
      for (const r of recs) {
        const size = Number(r.size) || 0;
        const left = Number(r.sizeleft) || 0;
        const done = size > 0 ? Math.max(0, Math.min(100, Math.round((1 - left / size) * 100))) : -1;
        if (r.albumId) pct.set(r.albumId, done);
        const aid = r.artistId ?? r.artist?.id;
        if (aid) {
          const cur = artists.get(aid);
          if (cur === void 0 || done > cur) artists.set(aid, done);
        }
      }
      this._lidarrQueuePct = pct;
      this._lidarrQueueArtists = artists;
    } catch (_) {
      this._lidarrQueue = /* @__PURE__ */ new Set();
      this._lidarrQueuePct = /* @__PURE__ */ new Map();
      this._lidarrQueueArtists = /* @__PURE__ */ new Map();
    }
  }
  // Cover, and the backdrop it sits on. Album art is square and the card's grid
  // is 2:3, so the frame is filled with the artist's fanart where there is one —
  // covers are on 99% of albums, fanart on 82% of artists, so the blurred cover
  // stands in for the rest rather than leaving a flat panel.
  _lidarrCover(album) {
    if (album?._mbCover) return album._mbCover;
    this._wireLidarrDeadImgs();
    const img = (album?.images || []).find((i) => i.coverType === "cover");
    if (img && album?.id) {
      const viaApi = this._lidarrImg("album", album.id, `cover${img.extension || ".jpg"}`, 400);
      if (viaApi !== null) return viaApi;
    }
    return this._lidarrCoverOf(album?.images, "cover");
  }
  // Cover Art Archive publishes a 250 and a 500 alongside every 1200 it stores,
  // and the address Lidarr hands out is always the 1200 — a third of a megabyte
  // for a cover drawn at a couple of hundred pixels. The 500 is a fifth of that
  // and still sharp on a retina grid.
  _lidarrThumbUrl(u) {
    return typeof u === "string" ? u.replace(/-1200(\.(?:jpg|jpeg|png))(\?.*)?$/i, "-500$1$2") : u;
  }
  _lidarrBackdrop(album) {
    const artist = this._lidarrArtists?.get(album?.artistId);
    return this._lidarrArtistImage(artist, "fanart");
  }
  // Artist artwork comes in four shapes and none of them is 2:3 — measured on a
  // real library, `poster` is a 1000x1000 square, fanart 16:9, banner and logo
  // wider still. So the square is what a card shows, over the fanart.
  // Lidarr rewrites artwork URLs to container paths once it has cached the files,
  // so most artists end up with nothing the browser can load. Its mediacover API
  // serves the same files to an API key, and Home Assistant will sign a path so an
  // <img> can fetch it without the key ever reaching the page. Signatures are
  // asked for once per image and cached; anything still unsigned renders from
  // whatever absolute URL the payload happens to have.
  // `width` asks the proxy for a downscaled copy: Lidarr keeps no small version
  // of an album cover, so a tile a couple of hundred pixels wide otherwise pulls
  // the full 59 kB original apiece.
  _lidarrImg(kind, id, file, width = 0) {
    if (!id || !file) return null;
    this._wireLidarrDeadImgs();
    const path = `/api/arr_stack/lidarr/image?kind=${kind}&id=${id}&file=${encodeURIComponent(file)}${width ? `&w=${width}` : ""}`;
    this._lidarrSigned = this._lidarrSigned || /* @__PURE__ */ new Map();
    if (this._lidarrDead?.has(path)) return null;
    if (this._lidarrSigned.has(path)) return this._lidarrSigned.get(path);
    this._lidarrSignQueue = this._lidarrSignQueue || /* @__PURE__ */ new Set();
    if (!this._lidarrSignQueue.has(path)) {
      this._lidarrSignQueue.add(path);
      this._lidarrSignSoon();
    }
    return void 0;
  }
  // Batched: a row of cards asks for a dozen signatures in the same tick, and one
  // re-render at the end beats one per image.
  _lidarrSignSoon() {
    if (this._lidarrSignTimer) return;
    this._lidarrSignTimer = setTimeout(async () => {
      this._lidarrSignTimer = null;
      const paths = [...this._lidarrSignQueue || []];
      this._lidarrSignQueue = /* @__PURE__ */ new Set();
      if (!paths.length) return;
      let changed = false;
      await Promise.all(paths.map(async (path) => {
        try {
          const res = await this._hass.callWS({ type: "auth/sign_path", path, expires: 60 * 60 * 12 });
          if (res?.path) {
            this._lidarrSigned.set(path, res.path);
            changed = true;
          }
        } catch (_) {
          this._lidarrSigned.set(path, null);
        }
      }));
      if (!changed) return;
      this._lidarrRepaint();
    }, 60);
  }
  // Everything Lidarr artwork is drawn on: the row in the right column, the
  // artist modal, the calendar and the library — the last two hang off the shadow
  // root and are reached by neither of the others, so a cover that arrived after
  // the first paint never appeared there. That is why the calendar showed
  // initials where an album has a perfectly good cover.
  _lidarrRepaint() {
    if (this._musicModal) this._renderMusicModalEl();
    if (this._calendarModalOpen) this._renderCalendarModalEl();
    const lib = this.shadowRoot?.querySelector("[data-lib-modal]");
    if (lib && this._libModal) this._libRerenderBody(lib);
    this._reRenderSection?.("recentlyAdded");
  }
  // Lidarr's mediacover API answers for most artwork it lists and 404s for the
  // rest — a file it never wrote, or wrote under a name it no longer reports.
  // One listener over the whole card notes those paths so the next paint reaches
  // for the remote address instead, and no page of the library asks twice.
  _wireLidarrDeadImgs() {
    if (this._lidarrDeadWired || !this.shadowRoot) return;
    this._lidarrDeadWired = true;
    this.shadowRoot.addEventListener("load", (ev) => {
      const img = ev.target;
      if (!(img instanceof HTMLImageElement)) return;
      const src = img.getAttribute("src");
      if (!src || !img.closest(".mus-alb-art")) return;
      this._musArtSeen = this._musArtSeen || /* @__PURE__ */ new Set();
      this._musArtSeen.add(src);
    }, true);
    this.shadowRoot.addEventListener("error", (ev) => {
      const img = ev.target;
      if (!(img instanceof HTMLImageElement)) return;
      const src = img.getAttribute("src") || "";
      if (!src.includes("/api/arr_stack/lidarr/image?")) return;
      const path = src.replace(/^https?:\/\/[^/]+/, "").replace(/&authSig=[^&]*/, "");
      this._lidarrDead = this._lidarrDead || /* @__PURE__ */ new Set();
      if (this._lidarrDead.has(path)) return;
      this._lidarrDead.add(path);
      clearTimeout(this._lidarrDeadTimer);
      this._lidarrDeadTimer = setTimeout(() => this._lidarrRepaint(), 120);
    }, true);
  }
  _lidarrArtistImage(artist, type, { full = false } = {}) {
    const img = (artist?.images || []).find((i) => i.coverType === type);
    if (!img) return null;
    const size = full ? 0 : { poster: 500, fanart: 360, banner: 70 }[type];
    const ext = img.extension || ".jpg";
    const viaApi = this._lidarrImg("artist", artist.id, size ? `${type}-${size}${ext}` : `${type}${ext}`);
    if (viaApi) return viaApi;
    if (viaApi === void 0) return null;
    const abs = [img.remoteUrl, img.url].find((u) => typeof u === "string" && u.startsWith("http"));
    return abs || null;
  }
  // Which backend can answer for music at all. Tracearr 2.x keys its lookups on
  // tmdb and tvdb ids, which no artist has, so the order the popup uses drops to
  // the two that key on the media server's own item: Jellystat through Jellyfin,
  // Tautulli through Plex.
  _musStatsSource() {
    if (this._tracearrConfigured !== false) return "tracearr";
    if (this._jellystatConfigured !== false && this._jellyfinConfigured) return "jellystat";
    if (this._tautulliConfigured !== false && this._plexConfigured !== false) return "tautulli";
    return null;
  }
  // Tracearr has no server-side filter worth using — mediaType and artistName are
  // ignored, and search matches the track title only — so the history is walked
  // the way the film popup walks it, and the artist is matched in the card.
  async _musTracearrStats(name, fmt, asTime) {
    const want = String(name).toLowerCase();
    const seen = /* @__PURE__ */ new Map();
    let cursor = null;
    let anyTrack = false;
    for (let i = 0; i < 20; i++) {
      const q = `pageSize=100&order=desc${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      const r = await this._callApi("GET", `arr_stack/tracearr/v1/sessions/history?${q}`);
      const data = r?.data || [];
      let fresh = 0;
      for (const x of data) {
        if (seen.has(x.id)) continue;
        fresh++;
        if (x.mediaType !== "track") {
          seen.set(x.id, null);
          continue;
        }
        anyTrack = true;
        seen.set(x.id, String(x.artistName || "").toLowerCase() === want ? x : null);
      }
      cursor = r?.nextCursor || null;
      if (!r?.hasMore || !cursor || !data.length || !fresh) break;
    }
    const rows = [...seen.values()].filter(Boolean);
    if (!rows.length) return anyTrack ? { any: false } : null;
    const perUser = /* @__PURE__ */ new Map();
    for (const r of rows) {
      const uid = r.serverUserId || r.user?.id || "";
      const who = r.user?.username || r.user?.identityName || "";
      const u = perUser.get(uid) || { name: who, ms: 0 };
      u.ms += Number(r.durationMs) || 0;
      if (who) u.name = who;
      perUser.set(uid, u);
    }
    const ranked = [...perUser.values()].sort((a, b) => b.ms - a.ms);
    const rest = ranked.slice(1).map((u) => u.name).filter(Boolean);
    const newest = rows.map((r) => r.stoppedAt || r.startedAt).filter(Boolean).sort().pop();
    return {
      any: true,
      tracks: new Set(rows.map((r) => r.mediaTitle).filter(Boolean)).size,
      plays: rows.length,
      watched: asTime(ranked.reduce((n, u) => n + u.ms, 0) / 1e3),
      last: newest ? fmt.format(new Date(newest)) : "",
      top: ranked[0]?.name || "",
      others: rest.slice(0, 3).join(", ") + (rest.length > 3 ? ` +${rest.length - 3}` : "")
    };
  }
  // Whether either backend could answer, which is what decides if the entry is
  // offered at all — the one that runs first may still come up empty.
  _musStatsPossible() {
    return this._musStatsSource() !== null;
  }
  async _musLoadStats() {
    const m = this._musicModal;
    const name = m?.artist?.artistName;
    if (!name) return;
    this._musStats = null;
    const id = m.artistId;
    const done = (st) => {
      if (this._musicModal?.artistId !== id) return;
      this._musStats = st;
      this._musPatchDrawer("stats");
    };
    const fmt = new Intl.DateTimeFormat(
      this._cfg?.localisation === "cs" ? "cs-CZ" : "en-GB",
      { day: "numeric", month: "short", year: "numeric" }
    );
    const asTime = (secs) => {
      const mins = Math.round(secs / 60);
      if (!mins) return "";
      return mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`;
    };
    const src = this._musStatsSource();
    try {
      if (src === "tracearr") {
        const tra = await this._musTracearrStats(name, fmt, asTime).catch(() => null);
        if (tra) {
          done(tra);
          return;
        }
      }
      if (this._jellystatConfigured !== false && this._jellyfinConfigured) {
        const mbid2 = m.artist?.foreignArtistId || "";
        const q = `name=${encodeURIComponent(name)}${mbid2 ? `&mbid=${encodeURIComponent(mbid2)}` : ""}`;
        const hit2 = await this._callApi("GET", `arr_stack/jellyfin/artist?${q}`).catch(() => null);
        if (hit2?.id) {
          const det = await this._callApi("POST", "arr_stack/jellystat/getItemDetails", { Id: hit2.id }).catch(() => null);
          const row = Array.isArray(det) ? det[0] : det?.[0] || det;
          const plays = Number(row?.times_played) || 0;
          const secs2 = Number(row?.total_play_time) || 0;
          if (plays || secs2) {
            const hist = await this._callApi("POST", "arr_stack/jellystat/getItemHistory?size=200&page=1", { itemid: hit2.id }).catch(() => null);
            const rows2 = hist?.results || hist?.rows || (Array.isArray(hist) ? hist : []);
            const perUser2 = /* @__PURE__ */ new Map();
            for (const r of rows2) {
              const who = r.UserName || r.userName || r.User || "";
              if (who) perUser2.set(who, (perUser2.get(who) || 0) + (Number(r.PlaybackDuration) || 0));
            }
            const ranked2 = [...perUser2.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
            const dates = rows2.map((r) => r.ActivityDateInserted).filter(Boolean).sort();
            done({
              any: true,
              plays,
              watched: asTime(secs2),
              last: dates.length ? fmt.format(new Date(dates[dates.length - 1])) : "",
              top: ranked2[0] || "",
              others: ranked2.slice(1, 4).join(", ") + (ranked2.length > 4 ? ` +${ranked2.length - 4}` : "")
            });
            return;
          }
        }
      }
      if (this._tautulliConfigured === false || this._plexConfigured === false) {
        done({ any: false });
        return;
      }
      const hit = await this._callApi("GET", `arr_stack/plex/artist?name=${encodeURIComponent(name)}`).catch(() => null);
      if (!hit?.plex_key) {
        done({ any: false });
        return;
      }
      const raw = await this._callApi("GET", `arr_stack/tautulli/get_history?grandparent_rating_key=${encodeURIComponent(hit.plex_key)}&length=500`);
      const rows = raw?.response?.data?.data || [];
      if (!rows.length) {
        done({ any: false });
        return;
      }
      const perUser = /* @__PURE__ */ new Map();
      for (const r of rows) {
        const who = r.friendly_name || r.user;
        if (who) perUser.set(who, (perUser.get(who) || 0) + (Number(r.duration) || 0));
      }
      const ranked = [...perUser.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
      const secs = rows.reduce((n, r) => n + (Number(r.duration) || 0), 0);
      const newest = rows.reduce((acc, r) => Math.max(acc, Number(r.date) || 0), 0);
      done({
        any: true,
        // Distinct tracks says more about an artist than the raw count of plays,
        // which a single album on repeat runs away with.
        tracks: new Set(rows.map((r) => r.title).filter(Boolean)).size,
        plays: rows.length,
        watched: asTime(secs),
        last: newest ? fmt.format(new Date(newest * 1e3)) : "",
        top: ranked[0] || "",
        others: ranked.slice(1, 4).join(", ") + (ranked.length > 4 ? ` +${ranked.length - 4}` : "")
      });
    } catch (e) {
      console.warn("[arr-card] listen stats failed:", e);
      done({ any: false });
    }
  }
  _musOrigin(artist) {
    const mbid2 = artist?.foreignArtistId;
    if (!mbid2) return [];
    this._musOriginMap = this._musOriginMap || /* @__PURE__ */ new Map();
    if (this._musOriginMap.has(mbid2)) {
      const cc = this._musOriginMap.get(mbid2);
      return cc ? [cc] : [];
    }
    this._musOriginQueue = this._musOriginQueue || /* @__PURE__ */ new Set();
    this._musOriginQueue.delete(mbid2);
    this._musOriginQueue.add(mbid2);
    this._musOriginSoon();
    return [];
  }
  _musOriginSoon() {
    if (this._musOriginBusy) return;
    this._musOriginBusy = true;
    setTimeout(async () => {
      while (this._musOriginQueue?.size) {
        const batch = [...this._musOriginQueue].slice(-20);
        batch.forEach((id) => this._musOriginQueue.delete(id));
        try {
          const r = await this._callApi("GET", `arr_stack/lidarr/origins?mbids=${batch.join(",")}`);
          let changed = false;
          for (const id of batch) {
            const cc = r?.[id] ?? null;
            this._musOriginMap.set(id, cc);
            if (cc) changed = true;
          }
          if (changed) this._lidarrRepaint();
        } catch (_) {
          batch.forEach((id) => this._musOriginMap.set(id, null));
        }
      }
      this._musOriginBusy = false;
    }, 80);
  }
  _lidarrCoverOf(images, type) {
    const img = (images || []).find((i) => i.coverType === type);
    if (!img) return null;
    const abs = [img.remoteUrl, img.url].find((u) => typeof u === "string" && u.startsWith("http"));
    return abs ? this._lidarrThumbUrl(abs) : null;
  }
};
var arrMixin = _ArrMethods.prototype;



var STATS_FORCE = null;
var _PopupMethods = class {
  // Puts the user back wherever the popup was opened from — the Library modal, a
  // Maintainerr tab, or the calendar — instead of the bare category list. Assumes
  // `this._popup` is already cleared. Returns false when the popup was opened
  // straight from a category and there is nothing to return to.
  // ── Quick actions ────────────────────────────────────────────────────────────
  // A chevron in the details section. Every entry is gated on its own prerequisite,
  // so the menu never offers something that would fail — and when nothing is
  // available the chevron itself is not rendered.
  // Maintainerr keys media by the media-server item, not by TMDB, and it is a
  // Plex-only tool. Without Plex configured there is no way to resolve the id.
  _qaMaintainerrReady() {
    return this._plexConfigured !== false && this._maintainerrConfigured !== false && (this._maintainerr?.collections || []).length > 0;
  }
  // Maintainerr keys on media-server items, so a title with nothing on disk has
  // no Plex entry to point at — offering its actions would only ever fail.
  _qaHasFiles(d) {
    const isTv = d._type === POPUP_TYPE.SONARR || d._type === POPUP_TYPE.TV;
    if (isTv) {
      const s1 = (this._sonarr || []).find((x) => x.id === d._sonarrSeries?.id);
      const s2 = (this._sonarr2 || []).find((x) => x.id === d._sonarr2Series?.id);
      return s1?.statistics?.episodeFileCount > 0 || s2?.statistics?.episodeFileCount > 0;
    }
    const m1 = (this._radarr || []).find((x) => x.id === d._radarrId);
    const m2 = (this._radarr2 || []).find((x) => x.id === d._radarr2Id);
    return !!(m1?.hasFile || m2?.hasFile);
  }
  _qaCollectionsFor(d) {
    const isMovie = d._type === POPUP_TYPE.RADARR || d._type === POPUP_TYPE.MOVIE;
    const want = isMovie ? ["movie"] : ["show", "season", "episode"];
    const rules = this._maintainerr?.rules || [];
    return (this._maintainerr?.collections || []).filter((c) => {
      const type = c.type || rules.find((r) => r.collectionId === c.id)?.dataType;
      return want.includes(type);
    });
  }
  // The request the signed-in user could still take back. Admins manage requests
  // in the pending list instead, so this is only offered to the requester.
  _qaWithdrawable(d) {
    if (this._overseerrConfigured === false) return null;
    if (this._hass?.user?.is_admin) return null;
    const tmdb = d.tmdbId || d.id || null;
    const reqId = d.mediaInfo?.requests?.[0]?.id || (tmdb ? this._familyPendingIds?.get(Number(tmdb)) : null);
    return reqId ? { reqId: Number(reqId), mediaId: Number(tmdb) } : null;
  }
  // One chip per group — audio or subtitles — carrying its own glyph, at most
  // three languages and a count for whatever is left. Follows the card's language
  // setting: flags where flags are configured, codes where tags are.
  _ppLangChip(kind, codes) {
    const list = [...new Set((codes || []).filter(Boolean))];
    if (!list.length) return "";
    const pc = this._posterCfg();
    const ico = kind === "audio" ? "mdi:volume-high" : "mdi:subtitles";
    const shown = list.slice(0, 3);
    const rest = list.length - shown.length;
    const body = (pc.langDisplay || "flags") === "tags" ? `<span class="pp-fi-txt">${shown.map((c) => this._escHtml(c)).join(" \xB7 ")}</span>` : `<span class="pp-fi-flags">${shown.map((c) => {
      const art = this._flagSvg(c) || this._flagEmoji(c);
      return art ? `<span class="pp-fi-flag" title="${this._escHtml(c)}">${art}</span>` : `<span class="pp-fi-txt">${this._escHtml(c)}</span>`;
    }).join("")}</span>`;
    return `<span class="pp-fi-chip pp-fi-${kind}"><ha-icon icon="${ico}" style="--mdc-icon-size:11px"></ha-icon>${body}${rest > 0 ? `<span class="pp-fi-more">+${rest}</span>` : ""}</span>`;
  }
  _qaItems(d) {
    const items = [];
    const inLib = this._qaLibTargets(d);
    if (inLib.length) {
      items.push({
        key: "lib",
        label: this._t("qaShowInLib"),
        icon: d._type === POPUP_TYPE.SONARR || d._type === POPUP_TYPE.TV ? "sonarr" : "radarr",
        // One instance needs no choice; two do, so it cascades only then
        direct: inLib.length === 1
      });
    }
    if (this._qaQueueTarget(d)) {
      items.push({
        key: "queue",
        label: this._t("qaJumpDl"),
        direct: true,
        icon: d._type === POPUP_TYPE.SONARR || d._type === POPUP_TYPE.TV ? "sonarr" : "radarr"
      });
    }
    const stopSrc = d._plexSessionId ? "plex" : d._jfSessionId ? "jellyfin" : d._embySessionId ? "emby" : d._kodiEntityId ? "kodi" : null;
    if (stopSrc && d._streamEntity && this._hass?.user?.is_admin) {
      items.push({ key: "stop", label: this._t("stopPlayback"), icon: stopSrc, direct: true });
    }
    if (this._plexConfigured !== false && this._qaHasFiles(d)) {
      items.push({ key: "cast", label: this._t("qaCast"), icon: "plex" });
    }
    if (this._qaMaintainerrReady() && this._qaHasFiles(d) && this._qaCollectionsFor(d).length) {
      items.push({ key: "mtCol", label: this._t("qaMtAddCol"), icon: "maintainerr" });
      if (this._qaInCollection(d)) {
        items.push({ key: "mtRemove", label: this._t("qaMtRemove"), icon: "maintainerr" });
      }
      items.push({ key: "mtExcl", label: this._t("qaMtAddExcl"), icon: "maintainerr" });
    }
    if (this._qaWithdrawable(d)) {
      items.push({
        key: "seerrWithdraw",
        label: this._t("qaWithdraw"),
        direct: true,
        icon: this._discoverIconKey ? this._discoverIconKey() : "overseerr"
      });
    }
    if (this._qaAiringSeriesId(d)) {
      items.push({ key: "airing", label: this._t("qaAiring"), icon: "sonarr" });
    }
    const statsSrc = STATS_FORCE ? STATS_FORCE : this._tracearrConfigured !== false && (this._plexConfigured !== false || this._jellyfinConfigured) ? "tracearr" : this._jellystatConfigured !== false ? "jellystat" : this._tautulliConfigured !== false && this._plexConfigured !== false ? "tautulli" : null;
    if (statsSrc && this._qaHasFiles(d)) {
      items.push({ key: "stats", label: this._t("qaStats"), icon: statsSrc });
    }
    return items;
  }
  // Which instances actually hold this title. Drives both whether the entry is
  // offered at all and whether it needs a submenu.
  _qaLibTargets(d) {
    const isTv = d._type === POPUP_TYPE.SONARR || d._type === POPUP_TYPE.TV;
    const tmdb = d.tmdbId || d.id || null;
    const out = [];
    if (isTv) {
      const tvdb = d.tvdbId || null;
      const has = (lib) => (lib || []).some((x) => tvdb && String(x.tvdbId) === String(tvdb) || tmdb && String(x.tmdbId) === String(tmdb));
      if (has(this._sonarr)) out.push({ inst: "sonarr", label: this._arrInstLabels("sonarr")[0] });
      if (has(this._sonarr2)) out.push({ inst: "sonarr2", label: this._arrInstLabels("sonarr")[1] });
    } else {
      const has = (lib) => (lib || []).some((x) => tmdb && String(x.tmdbId) === String(tmdb));
      if (has(this._radarr)) out.push({ inst: "radarr", label: this._arrInstLabels("radarr")[0] });
      if (has(this._radarr2)) out.push({ inst: "radarr2", label: this._arrInstLabels("radarr")[1] });
    }
    return out;
  }
  // Opens the Library on this title: the right instance, the page the title
  // actually sits on, and a couple of slow pulses so the eye finds it. Matching is
  // by tmdb/tvdb id — titles repeat across remakes and localisations.
  _qaShowInLibrary(d, inst) {
    const isTv = d._type === POPUP_TYPE.SONARR || d._type === POPUP_TYPE.TV;
    const tmdb = d.tmdbId || d.id || null;
    const tvdb = d.tvdbId || null;
    this._libPopupReturn = {
      type: d._type,
      tmdbId: tmdb ? String(tmdb) : null,
      tvdbId: tvdb ? String(tvdb) : null,
      title: d.title || d.name || ""
    };
    this._ppMenu = null;
    this._popup = null;
    this._renderPopupEl();
    this._openLibModal(isTv ? "tv" : "movies");
    const m = this._libModal;
    if (!m) return;
    m.search = "";
    m.page = 0;
    if (inst) m.instFilter = inst;
    const el = this.shadowRoot.querySelector("[data-lib-modal]");
    const body = el?.querySelector("#lib-body");
    if (!body) return;
    body.innerHTML = this._libBodyHtml();
    this._wireLibModalBody(el);
    const matches = (x) => tvdb && String(x.tvdbId) === String(tvdb) || tmdb && String(x.tmdbId) === String(tmdb);
    const idx = (this._libFilteredItems() || []).findIndex(matches);
    const per = m._perPage || 0;
    if (idx >= 0 && per > 0) {
      const page = Math.floor(idx / per);
      if (page !== m.page) {
        m.page = page;
        body.innerHTML = this._libBodyHtml();
        this._wireLibModalBody(el);
      }
    }
    this._qaBlinkInLibrary(tmdb, tvdb);
  }
  // Two slow pulses so the eye lands on the right card without a jarring flash.
  _qaBlinkInLibrary(tmdb, tvdb) {
    requestAnimationFrame(() => {
      const el = this.shadowRoot.querySelector("[data-lib-modal]");
      const card = tmdb ? el?.querySelector(`[data-tmdbid="${tmdb}"]`) : null;
      const target = card || (tvdb ? el?.querySelector(`[data-tvdbid="${tvdb}"]`) : null);
      if (!target) return;
      target.scrollIntoView({ block: "nearest" });
      target.style.transition = "opacity 0.55s ease";
      let n = 0;
      const pulse = () => {
        if (n >= 4) {
          target.style.opacity = "";
          return;
        }
        target.style.opacity = n % 2 === 0 ? "0.25" : "1";
        n++;
        setTimeout(pulse, 560);
      };
      pulse();
    });
  }
  // Only the live queues, never the history maps: an imported download leaves the
  // arr queue, and that is exactly the case where there is nothing to jump to.
  _qaQueueTarget(d) {
    const isTv = d._type === POPUP_TYPE.SONARR || d._type === POPUP_TYPE.TV;
    const ids = isTv ? [d._sonarrSeries?.id, d._sonarr2Series?.id] : [d._radarrId, d._radarr2Id];
    const maps = isTv ? [this._dlMediaSonarr, this._dlMediaSonarr2] : [this._dlMediaRadarr, this._dlMediaRadarr2];
    for (let i = 0; i < maps.length; i++) {
      const arrId = ids[i];
      if (arrId == null || !maps[i]) continue;
      for (const [dlId, mappedId] of maps[i]) {
        if (String(mappedId) === String(arrId)) return dlId;
      }
    }
    return null;
  }
  async _qaJumpToQueue(d) {
    const key = this._qaQueueTarget(d);
    if (!key) return;
    const title = d.title || d.name || "";
    this._actPopupReturn = {
      type: d._type,
      tmdbId: d.tmdbId ? String(d.tmdbId) : d.id ? String(d.id) : null,
      tvdbId: d.tvdbId ? String(d.tvdbId) : null,
      title
    };
    this._ppMenu = null;
    this._popup = null;
    this._renderPopupEl();
    await this._openActivityModal("queue");
    const m = this._activityModal;
    const el = () => this.shadowRoot.querySelector("[data-act-modal]");
    if (m && title) {
      m.queueSearch = title;
      m.queuePage = 0;
      await this._actLoadTab("queue", el());
      await new Promise((r) => requestAnimationFrame(r));
    }
    const row = el()?.querySelector(`[data-q-key="${key}"]`);
    if (row) this._qaBlinkRow(row);
  }
  // Two slow pulses, same as the library jump
  _qaBlinkRow(row) {
    row.scrollIntoView({ block: "nearest" });
    row.style.transition = "opacity 0.55s ease";
    let n = 0;
    const pulse = () => {
      if (n >= 4) {
        row.style.opacity = "";
        return;
      }
      row.style.opacity = n % 2 === 0 ? "0.25" : "1";
      n++;
      setTimeout(pulse, 560);
    };
    pulse();
  }
  // Only for series that are actually in Sonarr — the air dates come from there.
  _qaAiringSeriesId(d) {
    const isTv = d._type === POPUP_TYPE.SONARR || d._type === POPUP_TYPE.TV;
    if (!isTv) return null;
    return d._sonarrSeries?.id ?? d._sonarr2Series?.id ?? null;
  }
  // The calendar answers "what airs this week" across everything; this answers
  // "when does this show come back", which is a list, not a date window.
  async _qaLoadAiring(d, drawerEl) {
    const id = this._qaAiringSeriesId(d);
    if (id == null) return;
    const inst = d._sonarrSeries?.id === id ? "sonarr" : "sonarr2";
    try {
      const eps = await this._callApi("GET", `arr_stack/${inst}/episodes?seriesId=${encodeURIComponent(id)}`);
      const now = Date.now();
      const fmt = new Intl.DateTimeFormat(
        this._cfg?.localisation === "cs" ? "cs-CZ" : "en-GB",
        { weekday: "short", day: "numeric", month: "short" }
      );
      this._ppAiring = (Array.isArray(eps) ? eps : []).filter((e) => e.airDateUtc && new Date(e.airDateUtc).getTime() > now).sort((a, b) => new Date(a.airDateUtc) - new Date(b.airDateUtc)).slice(0, 8).map((e) => ({
        code: `S${String(e.seasonNumber).padStart(2, "0")}E${String(e.episodeNumber).padStart(2, "0")}`,
        when: fmt.format(new Date(e.airDateUtc))
      }));
    } catch (_) {
      this._ppAiring = [];
    }
    if (drawerEl && this._ppMenu?.sub === "airing") {
      drawerEl.innerHTML = this._qaAiringRowsHtml();
    }
  }
  // Shared placeholder for drawers that fetch on open — Tracearr's history can
  // take a couple of seconds, and a row of dots reads as "empty", not "working".
  _qaLoadingRow() {
    return `<div class="qa-item qa-sub-item qa-static" style="opacity:0.7">
    <span class="qa-spin"><span class="action-spinner"></span></span>
    <span>${this._t("loading")}</span>
  </div>`;
  }
  _qaStatsRowsHtml() {
    const st = this._ppStats;
    if (!st) return this._qaLoadingRow();
    if (!st.any) return `<div class="qa-item qa-sub-item qa-static" style="opacity:0.6">${this._t("qaStatsNone")}</div>`;
    const row = (label, value) => `<div class="qa-item qa-sub-item qa-static"><span>${label}</span><span class="qa-air-date">${this._escHtml(value)}</span></div>`;
    return [
      st.eps ? row(this._t("qaStatsEps"), st.eps) : "",
      st.lastEp ? row(this._t("qaStatsLastEp"), st.lastEp) : "",
      st.plays ? row(this._t("qaStatsPlays"), String(st.plays)) : "",
      st.done ? row(this._t("qaStatsDone"), st.done) : "",
      st.watched ? row(this._t("qaStatsWatched"), st.watched) : "",
      st.last ? row(this._t("qaStatsLast"), st.last) : "",
      st.top ? row(this._t("qaStatsTop"), st.top) : "",
      st.others ? row(this._t("qaStatsOthers"), st.others) : "",
      st.users ? row(this._t("qaStatsUsers"), st.users) : ""
    ].join("");
  }
  // Jellystat keys on the Jellyfin item id, so the title has to be resolved on
  // the Jellyfin server first. getItemDetails hands back the totals directly;
  // getItemHistory fills in who watched and when.
  // The Jellyfin item id, cached per popup — both Jellystat and the Tracearr
  // matcher need it, and the lookup can walk the whole library.
  async _qaJellyfinItemId(d, isTv) {
    if (this._ppJfId?.key === d) return this._ppJfId.id;
    const tmdb = d.tmdbId || d.id || null;
    const _sn = (this._sonarr || []).find((x) => x.id === d._sonarrSeries?.id) || (this._sonarr2 || []).find((x) => x.id === d._sonarr2Series?.id);
    const tvdb = d.tvdbId || _sn?.tvdbId || null;
    const q = isTv ? tvdb ? `tvdbId=${encodeURIComponent(tvdb)}` : tmdb ? `tmdbId=${encodeURIComponent(tmdb)}` : null : tmdb ? `tmdbId=${encodeURIComponent(tmdb)}` : null;
    if (!q) return null;
    const item = await this._callApi("GET", `arr_stack/jellyfin/lookup?${q}`).catch(() => null);
    const id = item?.id || null;
    this._ppJfId = { key: d, id };
    return id;
  }
  async _qaJellystatStats(d, isTv) {
    const id = await this._qaJellyfinItemId(d, isTv);
    if (!id) return null;
    const det = await this._callApi("POST", "arr_stack/jellystat/getItemDetails", { Id: id }).catch(() => null);
    const row = Array.isArray(det) ? det[0] : det?.[0] || det;
    const plays = Number(row?.times_played) || 0;
    const secs = Number(row?.total_play_time) || 0;
    if (!plays && !secs) return null;
    const hist = await this._callApi("POST", "arr_stack/jellystat/getItemHistory?size=200&page=1", { itemid: id }).catch(() => null);
    const rows = hist?.results || hist?.rows || (Array.isArray(hist) ? hist : []);
    const perUser = /* @__PURE__ */ new Map();
    for (const r of rows) {
      const name = r.UserName || r.userName || r.User || "";
      if (!name) continue;
      perUser.set(name, (perUser.get(name) || 0) + (Number(r.PlaybackDuration) || 0));
    }
    const ranked = [...perUser.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
    const rest = ranked.slice(1);
    const dates = rows.map((r) => r.ActivityDateInserted).filter(Boolean).sort();
    const fmt = new Intl.DateTimeFormat(
      this._cfg?.localisation === "cs" ? "cs-CZ" : "en-GB",
      { day: "numeric", month: "short", year: "numeric" }
    );
    const mins = Math.round(secs / 60);
    return {
      any: true,
      plays,
      watched: mins ? mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min` : "",
      last: dates.length ? fmt.format(new Date(dates[dates.length - 1])) : "",
      top: ranked[0] || "",
      others: rest.slice(0, 3).join(", ") + (rest.length > 3 ? ` +${rest.length - 3}` : "")
    };
  }
  // Tracearr's per-title aggregate carries no external id and ignores `search`,
  // and its titles come from Plex — localised, so "The Secret Life of Pets 2" and
  // "Tajný život mazlíčků 2" are the same film under different names. The session
  // history is the only place with an id: thumbPath embeds the media-server item,
  // so one marker per server is what ties a session back to this title.
  // Tracearr 2.x answers per title through its public API; 1.x has no such
  // endpoint and has to be matched session by session. One probe decides, cached
  // for the session — the answer cannot change without the server restarting.
  async _traIsV2() {
    if (this._traV2 !== void 0) return this._traV2;
    this._traV2 = await this._callApi("GET", "arr_stack/tracearr/v2/public/libraries").then(() => true).catch(() => false);
    return this._traV2;
  }
  // `movie:tmdb:585` / `show:tvdb:81189` — the ids the popup already carries, so
  // none of 1.x's matching through Plex rating keys and Jellyfin item ids applies.
  _traMediaRef(d, isTv) {
    const tmdb = d.tmdbId || d.id || null;
    const _sn = (this._sonarr || []).find((x) => x.id === d._sonarrSeries?.id) || (this._sonarr2 || []).find((x) => x.id === d._sonarr2Series?.id);
    const tvdb = d.tvdbId || _sn?.tvdbId || null;
    if (isTv) return tvdb ? `show:tvdb:${tvdb}` : tmdb ? `show:tmdb:${tmdb}` : null;
    return tmdb ? `movie:tmdb:${tmdb}` : null;
  }
  // Tracearr 2.x: totals and viewers in two calls, already de-duplicated across
  // servers — the same person on Plex and Jellyfin counts once, and only plays
  // past two minutes count at all.
  async _qaTracearrV2Stats(d, isTv) {
    const ref = this._traMediaRef(d, isTv);
    if (!ref) return null;
    const enc = encodeURIComponent(ref);
    const [st, wt] = await Promise.all([
      this._callApi("GET", `arr_stack/tracearr/v2/public/media/${enc}/stats`).catch(() => null),
      this._callApi("GET", `arr_stack/tracearr/v2/public/media/${enc}/watchers`).catch(() => null)
    ]);
    const all = st?.windows?.all_time?.combined;
    if (!all) return null;
    if (!all.plays && !all.watch_time_ms) return { any: false };
    const watchers = (wt?.watchers || []).filter((w) => w?.user);
    const name = (w) => w.user.username || w.user.display_name || w.user.name || "";
    const ranked = [...watchers].sort((a, b) => (b.watch_time_ms || 0) - (a.watch_time_ms || 0));
    const rest = ranked.slice(1).map(name).filter(Boolean);
    const mins = Math.round((all.watch_time_ms || 0) / 6e4);
    const fmt = new Intl.DateTimeFormat(
      this._cfg?.localisation === "cs" ? "cs-CZ" : "en-GB",
      { day: "numeric", month: "short", year: "numeric" }
    );
    const lastDay = ranked.map((w) => w.last_watched_day).filter(Boolean).sort().pop();
    const out = {
      any: true,
      watched: mins ? mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min` : "",
      top: name(ranked[0] || {}) || "",
      others: rest.slice(0, 3).join(", ") + (rest.length > 3 ? ` +${rest.length - 3}` : ""),
      last: lastDay ? fmt.format(new Date(lastDay)) : ""
    };
    if (isTv) {
      const eps = Math.max(0, ...ranked.map((w) => w.distinct_episodes_watched || 0));
      const lib = (this._sonarr || []).find((x) => x.id === d._sonarrSeries?.id) || (this._sonarr2 || []).find((x) => x.id === d._sonarr2Series?.id);
      const total = lib?.statistics?.episodeFileCount || 0;
      if (eps) out.eps = total ? `${eps} / ${total}` : String(eps);
    } else {
      out.plays = all.plays || 0;
    }
    return out;
  }
  async _qaTracearrStats(d, markers, isTv) {
    const marks = (markers || []).filter(Boolean);
    if (!marks.length) return null;
    const seen = /* @__PURE__ */ new Map();
    const covers = /* @__PURE__ */ new Set();
    let cursor = null;
    for (let i = 0; i < 20; i++) {
      const q = `pageSize=100&order=desc${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      const r = await this._callApi("GET", `arr_stack/tracearr/v1/sessions/history?${q}`);
      const data = r?.data || [];
      let fresh = 0;
      for (const x of data) {
        if (x.server?.type) covers.add(String(x.server.type).toLowerCase());
        if (seen.has(x.id)) continue;
        fresh++;
        seen.set(x.id, marks.some((m) => String(x.thumbPath || "").includes(m)) ? x : null);
      }
      cursor = r?.nextCursor || null;
      if (!r?.hasMore || !cursor || !data.length || !fresh) break;
    }
    const rows = [...seen.values()].filter(Boolean);
    if (!rows.length) return null;
    const perUser = /* @__PURE__ */ new Map();
    for (const r of rows) {
      const uid = r.serverUserId || r.user?.id || "";
      const name = r.user?.username || r.user?.identityName || "";
      const ms = Number(r.durationMs) || 0;
      const u = perUser.get(uid) || { name, ms: 0 };
      u.ms += ms;
      if (name) u.name = name;
      perUser.set(uid, u);
    }
    const ranked = [...perUser.values()].sort((a, b) => b.ms - a.ms);
    const top = ranked[0]?.name || "";
    const rest = ranked.slice(1).map((u) => u.name);
    const others = rest.slice(0, 3).join(", ") + (rest.length > 3 ? ` +${rest.length - 3}` : "");
    const watchedMs = [...perUser.values()].reduce((n, u) => n + u.ms, 0);
    const mins = Math.round(watchedMs / 6e4);
    const time = mins ? mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min` : "";
    const fmt = new Intl.DateTimeFormat(
      this._cfg?.localisation === "cs" ? "cs-CZ" : "en-GB",
      { day: "numeric", month: "short", year: "numeric" }
    );
    if (isTv) {
      const code = (r) => r.seasonNumber != null && r.episodeNumber != null ? `S${String(r.seasonNumber).padStart(2, "0")}E${String(r.episodeNumber).padStart(2, "0")}` : null;
      const seen2 = new Set(rows.map(code).filter(Boolean));
      const lib = (this._sonarr || []).find((x) => x.id === d._sonarrSeries?.id) || (this._sonarr2 || []).find((x) => x.id === d._sonarr2Series?.id);
      const total = lib?.statistics?.episodeFileCount || 0;
      const latest = rows.filter((r) => code(r) && (r.stoppedAt || r.startedAt)).sort((a, b) => String(a.stoppedAt || a.startedAt).localeCompare(String(b.stoppedAt || b.startedAt))).pop();
      return {
        any: true,
        eps: seen2.size ? total ? `${seen2.size} / ${total}` : String(seen2.size) : "",
        lastEp: latest ? `${code(latest)} \xB7 ${fmt.format(new Date(latest.stoppedAt || latest.startedAt))}` : "",
        watched: time,
        top,
        others
      };
    }
    const newest = rows.map((r) => r.stoppedAt || r.startedAt).filter(Boolean).sort().pop();
    return {
      any: true,
      plays: rows.length,
      watched: time,
      last: newest ? fmt.format(new Date(newest)) : "",
      top,
      others
    };
  }
  // Tautulli keys history on the Plex item — a show by its own key, since every
  // episode row carries the show as its grandparent.
  async _qaLoadStats(d, drawerEl) {
    const isTv = d._type === POPUP_TYPE.SONARR || d._type === POPUP_TYPE.TV;
    const done = () => {
      if (drawerEl && this._ppMenu?.sub === "stats") drawerEl.innerHTML = this._qaStatsRowsHtml();
    };
    if (this._tracearrConfigured !== false && (!STATS_FORCE || STATS_FORCE === "tracearr")) {
      try {
        if (await this._traIsV2()) {
          const v2 = await this._qaTracearrV2Stats(d, isTv);
          if (v2) {
            this._ppStats = v2;
            done();
            return;
          }
        }
        const [plex2, jfId] = await Promise.all([
          this._qaPlexRatingKey(d).catch(() => null),
          this._jellyfinConfigured ? this._qaJellyfinItemId(d, isTv).catch(() => null) : null
        ]);
        const marks = [
          plex2?.ratingKey ? `/library/metadata/${plex2.ratingKey}/` : null,
          jfId || null
        ];
        const tra = await this._qaTracearrStats(d, marks, isTv);
        if (tra) {
          this._ppStats = tra;
          done();
          return;
        }
      } catch (_) {
      }
    }
    if (this._jellystatConfigured !== false && (!STATS_FORCE || STATS_FORCE === "jellystat")) {
      try {
        const js = await this._qaJellystatStats(d, isTv);
        if (js) {
          this._ppStats = js;
          done();
          return;
        }
      } catch (_) {
      }
    }
    if (STATS_FORCE && STATS_FORCE !== "tautulli") {
      this._ppStats = { any: false };
      done();
      return;
    }
    const plex = await this._qaPlexRatingKey(d);
    if (!plex) {
      this._ppStats = { any: false };
    } else {
      try {
        const param = isTv ? "grandparent_rating_key" : "rating_key";
        const raw = await this._callApi("GET", `arr_stack/tautulli/get_history?${param}=${encodeURIComponent(plex.ratingKey)}&length=500`);
        const rows = raw?.response?.data?.data || [];
        const fmt = new Intl.DateTimeFormat(
          this._cfg?.localisation === "cs" ? "cs-CZ" : "en-GB",
          { day: "numeric", month: "short", year: "numeric" }
        );
        const perUser = /* @__PURE__ */ new Map();
        for (const r of rows) {
          const name = r.friendly_name || r.user;
          if (!name) continue;
          perUser.set(name, (perUser.get(name) || 0) + (Number(r.duration) || 0));
        }
        const ranked = [...perUser.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
        const rest = ranked.slice(1);
        const secs = rows.reduce((n, r) => n + (Number(r.duration) || 0), 0);
        const mins = Math.round(secs / 60);
        const time = mins ? mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min` : "";
        const newest = rows.reduce((acc, r) => Math.max(acc, Number(r.date) || 0), 0);
        const base = {
          any: rows.length > 0,
          watched: time,
          top: ranked[0] || "",
          others: rest.slice(0, 3).join(", ") + (rest.length > 3 ? ` +${rest.length - 3}` : "")
        };
        if (isTv) {
          const code = (r) => r.parent_media_index != null && r.media_index != null ? `S${String(r.parent_media_index).padStart(2, "0")}E${String(r.media_index).padStart(2, "0")}` : null;
          const seen = new Set(rows.map(code).filter(Boolean));
          const lib = (this._sonarr || []).find((x) => x.id === d._sonarrSeries?.id) || (this._sonarr2 || []).find((x) => x.id === d._sonarr2Series?.id);
          const total = lib?.statistics?.episodeFileCount || 0;
          const latest = rows.filter((r) => code(r)).sort((a, b) => (Number(a.date) || 0) - (Number(b.date) || 0)).pop();
          this._ppStats = {
            ...base,
            eps: seen.size ? total ? `${seen.size} / ${total}` : String(seen.size) : "",
            lastEp: latest ? `${code(latest)} \xB7 ${fmt.format(new Date(Number(latest.date) * 1e3))}` : ""
          };
        } else {
          this._ppStats = {
            ...base,
            plays: rows.length,
            last: newest ? fmt.format(new Date(newest * 1e3)) : ""
          };
        }
      } catch (_) {
        this._ppStats = { any: false };
      }
    }
    if (drawerEl && this._ppMenu?.sub === "stats") drawerEl.innerHTML = this._qaStatsRowsHtml();
  }
  _qaCastRowsHtml() {
    const list = this._plexClients;
    if (list === null || list === void 0) return this._qaLoadingRow();
    if (!list.length) return `<div class="qa-item qa-sub-item qa-static" style="opacity:0.6">${this._t("qaCastNone")}</div>`;
    return list.map(
      (p) => `<button class="qa-item qa-sub-item" data-action="plex-cast-play" data-entity="${this._escHtml(p.entityId)}"><span>${this._escHtml(p.name)}</span></button>`
    ).join("");
  }
  _qaAiringRowsHtml() {
    const rows = this._ppAiring;
    if (!rows) return this._qaLoadingRow();
    if (!rows.length) return `<div class="qa-item qa-sub-item qa-static" style="opacity:0.6">${this._t("qaAiringNone")}</div>`;
    return rows.map((r) => `<div class="qa-item qa-sub-item qa-static"><span>${this._escHtml(r.code)}</span><span class="qa-air-date">${this._escHtml(r.when)}</span></div>`).join("");
  }
  async _qaWithdraw(d) {
    const hit = this._qaWithdrawable(d);
    if (!hit) return;
    this._ppMenu = null;
    this._qaShowStatus(this._t("mtProcessing") || "\u2026", { spin: true }, 0);
    try {
      await this._withdrawOverseerrRequest(hit.reqId, hit.mediaId);
      this._qaShowStatus(this._t("qaWithdrawn"));
    } catch (e) {
      this._qaShowStatus(`${this._t("qaFailed")}: ${this._qaErrText(e)}`, { err: true }, 7e3);
    }
  }
  _qaBtnHtml(d) {
    if (!this._qaItems(d).length) return "";
    const open = this._ppMenu?.panel === "options";
    const dots = `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" style="flex-shrink:0"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`;
    const chev = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
    const st = this._ppStatus;
    const label = `${dots}<span class="pp-lbl">${this._t("qaTitle")} ${chev}</span>`;
    if (st?.msg) {
      const rgb = st.spin ? "96,165,250" : st.err ? "248,113,113" : "52,211,153";
      const tick = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>`;
      const cross = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="flex-shrink:0"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
      const ico = st.spin ? `<span class="is-spin" style="flex-shrink:0"></span>` : st.err ? cross : tick;
      return `<div class="is-btn-row">
      <button class="is-open-btn qa-opt-btn qa-st-btn" style="--qa-st:${rgb}" title="${this._escHtml(st.msg)}" disabled>
        <span class="qa-st-ghost">${label}</span>
        <span class="qa-st-ov">${ico}<span>${this._escHtml(this._qaShortStatus(st.msg))}</span></span>
      </button>
    </div>`;
    }
    return `<div class="is-btn-row">
    <button class="is-open-btn qa-opt-btn${open ? " active" : ""}" data-qa-toggle>${label}</button>
  </div>`;
  }
  // The button is one word wide — anything past the colon is the raw API text,
  // which belongs in the tooltip rather than on the control.
  _qaShortStatus(msg) {
    const head = String(msg || "").split(":")[0].trim();
    return head.length > 16 ? `${head.slice(0, 15)}\u2026` : head;
  }
  _qaMenuHtml(d, searchRows = "", removeRows = "") {
    if (this._searchExpand && searchRows) {
      return `<div class="qa-menu" data-qa-menu><div class="qa-list">${searchRows}</div></div>`;
    }
    if (this._removeConfirm && removeRows) {
      return `<div class="qa-menu" data-qa-menu><div class="qa-list">${removeRows}</div></div>`;
    }
    const menu = this._ppMenu;
    if (menu?.panel !== "options") return "";
    const items = this._qaItems(d);
    if (!items.length) return "";
    const subRows = (key) => {
      if (key === "cast") return this._qaCastRowsHtml();
      if (key === "stats") return this._qaStatsRowsHtml();
      if (key === "airing") return this._qaAiringRowsHtml();
      if (key === "lib") {
        return this._qaLibTargets(d).map((t) => `<button class="qa-item qa-sub-item" data-qa-lib="${t.inst}">${this._escHtml(t.label)}</button>`).join("");
      }
      if (this._ppSeasonPick?.kind === key) return this._qaSeasonRowsHtml();
      return this._qaColRowsHtml(key, d);
    };
    const chev = `<svg class="qa-chev" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
    const ico = (it) => it.icon ? `<span class="qa-ico">${this._appIcon(it.icon, 16)}</span>` : "";
    const rows = items.map((it) => {
      if (it.key === "stop") {
        return `<button class="qa-item" data-action="stream-terminate-show" data-session-id="${this._escHtml(String(d._plexSessionId || ""))}">${ico(it)}<span>${it.label}</span></button>`;
      }
      if (it.direct) {
        return `<button class="qa-item" data-qa-do="${it.key}">${ico(it)}<span>${it.label}</span></button>`;
      }
      const open = menu.sub === it.key;
      return `<div class="qa-group">
      <button class="qa-item qa-item-parent${open ? " qa-item-on" : ""}" data-qa-sub="${it.key}">
        ${ico(it)}<span>${it.label}</span>${chev}
      </button>
      <div class="qa-drawer" data-qa-drawer="${it.key}">${subRows(it.key)}</div>
    </div>`;
    }).join("");
    return `<div class="qa-menu" data-qa-menu><div class="qa-list qa-list-actions">${rows}</div></div>`;
  }
  // The drawer is rebuilt collapsed on every render, so the open state has to be
  // applied after the browser has seen the collapsed one — two frames, the same
  // trick the nav indicator and the sources panel use.
  _qaOpenDrawer(key) {
    if (!key) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      this.shadowRoot?.querySelector(`[data-qa-drawer="${key}"]`)?.classList.add("is-open");
    }));
  }
  _qaStatusHtml() {
    const st = this._ppStatus;
    if (!st?.msg) return "";
    if (this._popup && this._qaItems(this._popup).length) return "";
    const rgb = st.err ? "248,113,113" : "52,211,153";
    const spin = st.spin ? '<span class="is-spin" style="margin-right:6px;vertical-align:-1px"></span>' : "";
    const mob = this._isMob;
    const bg = mob ? this._isDay ? "#fafafc" : "#14141a" : `rgba(${rgb},0.12)`;
    const pos = mob ? ";position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:1200;padding:5px 14px;box-shadow:0 4px 16px rgba(0,0,0,0.55)" : "";
    return `<span style="font-size:11px;font-weight:600;color:rgba(${rgb},0.9);background:${bg};border:1px solid rgba(${rgb},0.45);border-radius:999px;padding:2px 12px;white-space:nowrap;flex-shrink:0${pos}">${spin}${this._escHtml(st.msg)}</span>`;
  }
  // hass.callApi rejects with { error, status_code, body }, which has no .message
  // — printing it raw is how the status ended up reading "[object Object]".
  _qaErrText(e) {
    if (!e) return "error";
    if (typeof e === "string") return e;
    const body = e.body;
    const detail = body && (body.error || body.message || body.detail) || e.error || e.message || "";
    const code = e.status_code || e.status || body && body.status || "";
    const text = [detail, code ? `HTTP ${code}` : ""].filter(Boolean).join(" \xB7 ");
    return text || "error";
  }
  // While the popup is open the regular polling is paused, so nothing would ever
  // clear the spinner on its own. This asks only the queue of the instance that
  // was grabbed into, until its download shows up or the wait expires.
  _ppGrabPollStart() {
    if (this._ppGrabTimer) return;
    const tick = async () => {
      const w = this._ppGrabWait;
      if (!w || !this._popup || Date.now() > w.until) {
        clearInterval(this._ppGrabTimer);
        this._ppGrabTimer = null;
        if (w && Date.now() > w.until) this._ppGrabWait = null;
        if (this._popup) this._renderPopupEl();
        return;
      }
      try {
        if (w.inst === "radarr") await this._fetchRadarrQueue();
        else if (w.inst === "radarr2") await this._fetchRadarr2Queue();
        else await this._fetchSonarrQueue(w.inst);
      } catch (_) {
      }
      const pct = w.inst === "radarr" ? this._radarrQueuePct : w.inst === "radarr2" ? this._radarr2QueuePct : w.inst === "sonarr" ? this._sonarrQueueSeriesPct : this._sonarr2QueueSeriesPct;
      const id = w.id ?? (w.inst.startsWith("radarr") ? w.inst === "radarr2" ? this._popup?._radarr2Id : this._popup?._radarrId : w.inst === "sonarr2" ? this._popup?._sonarr2Series?.id : this._popup?._sonarrSeries?.id);
      if (id != null && pct?.has(id)) {
        this._ppGrabWait = null;
        clearInterval(this._ppGrabTimer);
        this._ppGrabTimer = null;
      }
      if (this._popup) this._renderPopupEl();
    };
    this._ppGrabTimer = setInterval(tick, 5e3);
    tick();
  }
  _qaShowStatus(msg, opts = {}, duration = 3500) {
    this._ppStatus = { msg, err: !!opts.err, spin: !!opts.spin };
    this._renderPopupEl();
    clearTimeout(this._ppStatusTimer);
    if (!duration) return;
    this._ppStatusTimer = setTimeout(() => {
      this._ppStatus = null;
      if (this._popup) this._renderPopupEl();
    }, duration);
  }
  // tmdbId is meaningless to Maintainerr — it keys on the Plex item.
  async _qaPlexRatingKey(d) {
    const tmdb = d.tmdbId || d.id || null;
    const _snEntry = (this._sonarr || []).find((x) => x.id === d._sonarrSeries?.id) || (this._sonarr2 || []).find((x) => x.id === d._sonarr2Series?.id) || d._sonarrSeries || d._sonarr2Series || null;
    const tvdb = d.tvdbId || _snEntry?.tvdbId || null;
    const isTv = d._type === POPUP_TYPE.SONARR || d._type === POPUP_TYPE.TV;
    const first = isTv ? tvdb && `tvdbId=${encodeURIComponent(tvdb)}` : tmdb && `tmdbId=${encodeURIComponent(tmdb)}`;
    const second = isTv ? tmdb && `tmdbId=${encodeURIComponent(tmdb)}` : tvdb && `tvdbId=${encodeURIComponent(tvdb)}`;
    const q = first || second;
    if (!q) return null;
    try {
      let raw = await this._callApi("GET", `arr_stack/plex/lookup?${q}`).catch(() => null);
      if (!raw?.plex_key && second && second !== q) {
        raw = await this._callApi("GET", `arr_stack/plex/lookup?${second}`).catch(() => null);
      }
      const key = String(raw?.plex_key || "").split("/").filter(Boolean).pop();
      return key && /^\d+$/.test(key) ? { ratingKey: key, type: raw?.type || null } : null;
    } catch (_) {
      return null;
    }
  }
  // A deletion date exists only for titles that sit in some collection, so the
  // same map that paints the "Gone in" badge answers membership.
  _qaInCollection(d) {
    const ext = this._mtDelExt;
    if (!ext || !ext.size) return false;
    const isMovie = d._type === POPUP_TYPE.RADARR || d._type === POPUP_TYPE.MOVIE;
    const tmdb = d.tmdbId || d.id || null;
    const tvdb = d.tvdbId || null;
    if (isMovie) return !!(tmdb && ext.get(`mv:${tmdb}`));
    return !!(tvdb && ext.get(`tv:tvdb:${tvdb}`) || tmdb && ext.get(`tv:tmdb:${tmdb}`));
  }
  // A collection's level comes from the rule that built it — show, season or
  // episode. Anything but "show" needs a more specific media id than the series.
  _qaColType(c) {
    const rules = this._maintainerr?.rules || [];
    return c.type || rules.find((r) => r.collectionId === c.id)?.dataType || "movie";
  }
  // A tick box and a label. Several of these can be armed before anything runs,
  // so the row is a toggle rather than the action itself.
  _qaCbRow(attrs, label, checked) {
    const tick = `<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    return `<button class="qa-item qa-sub-item qa-cb-row" ${attrs}>
    <span class="qa-cb${checked ? " is-on" : ""}">${checked ? tick : ""}</span>
    <span>${this._escHtml(label)}</span>
  </button>`;
  }
  // The row that fires whatever is ticked. Disabled while nothing is, so the
  // menu never offers an action that would do nothing.
  _qaApplyRowHtml(kind, count) {
    const lbl = count ? `${this._t("qaApply")} (${count})` : this._t("qaApply");
    return `<button class="qa-item qa-sub-item qa-apply${count ? "" : " is-off"}" data-qa-apply="${kind}"${count ? "" : " disabled"}>
    <span>${lbl}</span>
  </button>`;
  }
  // Collections stay single-click: each row is one destination, and picking it
  // is the whole decision. Only seasons multi-select, since a show has many and
  // arming them one at a time would mean reopening the menu for each.
  // Collection ids this title currently sits in. Unlike _qaInCollection it does
  // not go through the "Gone in" poster setting — the menu should say where a
  // title is regardless of whether the badge is switched on.
  _qaColMembership(d) {
    const m = this._mtColMemb;
    if (!m || !m.size) return /* @__PURE__ */ new Set();
    const isMovie = d._type === POPUP_TYPE.RADARR || d._type === POPUP_TYPE.MOVIE;
    const tmdb = d.tmdbId || d.id || null;
    const _sn = (this._sonarr || []).find((x) => x.id === d._sonarrSeries?.id) || (this._sonarr2 || []).find((x) => x.id === d._sonarr2Series?.id);
    const tvdb = d.tvdbId || _sn?.tvdbId || null;
    const hit = isMovie ? tmdb && m.get(`mv:${tmdb}`) : tvdb && m.get(`tv:tvdb:${tvdb}`) || tmdb && m.get(`tv:tmdb:${tmdb}`);
    return hit || /* @__PURE__ */ new Set();
  }
  _qaColRowsHtml(kind, d) {
    const cols = this._qaCollectionsFor(d);
    const isTv = d._type === POPUP_TYPE.SONARR || d._type === POPUP_TYPE.TV;
    const memb = this._qaColMembership(d);
    const dot = `<span class="qa-dot" title="${this._escHtml(this._t("qaInCollection"))}"></span>`;
    return [
      ...kind === "mtExcl" || kind === "mtRemove" ? [`<button class="qa-item qa-sub-item" data-qa-run="${kind}" data-qa-col=""${isTv ? ' data-qa-type="season"' : ""}>${this._t("qaAllCollections")}</button>`] : [],
      ...cols.map((c) => `<button class="qa-item qa-sub-item" data-qa-run="${kind}" data-qa-col="${c.id}" data-qa-type="${this._qaColType(c)}"><span>${this._escHtml(this._mtColLabel(c, cols))}</span>${memb.has(String(c.id)) ? dot : ""}</button>`)
    ].join("");
  }
  _qaSeasonRowsHtml() {
    const p = this._ppSeasonPick;
    if (!p) return "";
    if (!p.seasons) return this._qaLoadingRow();
    if (!p.seasons.length) return `<div class="qa-item qa-sub-item qa-static" style="opacity:0.6">${this._t("qaAiringNone")}</div>`;
    const sel = p.sel || /* @__PURE__ */ new Set();
    const allOn = p.seasons.length > 0 && p.seasons.every((sn) => sel.has(String(sn.key)));
    return [
      this._qaCbRow('data-qa-season-pick="*"', this._t("qaAllSeasons"), allOn),
      ...p.seasons.map((sn) => this._qaCbRow(
        `data-qa-season-pick="${sn.key}"`,
        sn.title,
        sel.has(String(sn.key))
      )),
      this._qaApplyRowHtml(p.kind, sel.size)
    ].join("");
  }
  // Seasons live under the show in Plex, so this needs the show's rating key first.
  async _qaLoadSeasons(d, drawerEl) {
    const plex = await this._qaPlexRatingKey(d);
    if (!plex) {
      this._ppSeasonPick = null;
      this._qaShowStatus(this._t("qaNoPlexItem"), { err: true }, 5e3);
      return;
    }
    try {
      const raw = await this._callApi("GET", `arr_stack/plex/children?ratingKey=${encodeURIComponent(plex.ratingKey)}`);
      const items = raw?.MediaContainer?.Metadata || [];
      if (this._ppSeasonPick) {
        this._ppSeasonPick.seasons = items.filter((i) => i.ratingKey && i.type === "season").map((i) => ({ key: String(i.ratingKey), title: i.title || `Season ${i.index}` }));
      }
    } catch (_) {
      if (this._ppSeasonPick) this._ppSeasonPick.seasons = [];
    }
    if (drawerEl && this._ppSeasonPick) drawerEl.innerHTML = this._qaSeasonRowsHtml();
  }
  // One collection, one optional season. Kept apart from the runner below so a
  // batch can fire every job before anything is refetched.
  async _qaMtCall(kind, colId, d, plex, seasonKey = null) {
    const isMovie = d._type === POPUP_TYPE.RADARR || d._type === POPUP_TYPE.MOVIE;
    const mediaId = seasonKey || plex.ratingKey;
    const type = seasonKey ? "season" : plex.type || (isMovie ? "movie" : "show");
    const context = { id: mediaId, type };
    const body = { action: kind === "mtRemove" ? 1 : 0, mediaId, context };
    if (colId) body.collectionId = parseInt(colId);
    if (kind === "mtRemove" && !colId) {
      await this._callApi("DELETE", `arr_stack/maintainerr/collections/media?mediaId=${encodeURIComponent(mediaId)}`);
    } else if (kind === "mtExcl") {
      const res = await this._callApi("POST", "arr_stack/maintainerr/rules/exclusion", body);
      if (res && res.code === 0) throw new Error(res.result || "failed");
    } else {
      await this._callApi("POST", "arr_stack/maintainerr/collections/media/add", body);
    }
  }
  // jobs: [{ colId, seasonKey }]. The Plex lookup and the refetch happen once for
  // the whole set — per-job refreshes made a multi-select flicker and re-render
  // the popup underneath the menu on every step.
  async _qaRunMaintainerrBatch(kind, jobs, d) {
    this._ppMenu = null;
    this._ppSeasonPick = null;
    if (!jobs.length) {
      this._renderPopupEl();
      return;
    }
    this._qaShowStatus(this._t("mtProcessing") || "\u2026", { spin: true }, 0);
    try {
      const plex = await this._qaPlexRatingKey(d);
      if (!plex) {
        this._qaShowStatus(this._t("qaNoPlexItem"), { err: true }, 5e3);
        return;
      }
      for (const j of jobs) await this._qaMtCall(kind, j.colId, d, plex, j.seasonKey || null);
      this._mtDelMap = null;
      this._mtDelExt = null;
      this._mtColMemb = null;
      this._qaShowStatus(this._t("qaDone"));
      await this._fetchMaintainerr();
      if (this._popup) this._renderPopupEl();
      this._reRenderRight(true);
    } catch (e) {
      console.warn("[arr-card] quick action:", e);
      this._qaShowStatus(`${this._t("qaFailed")}: ${this._qaErrText(e)}`, { err: true }, 7e3);
    }
  }
  async _qaRunMaintainerr(kind, colId, d, seasonKey = null) {
    return this._qaRunMaintainerrBatch(kind, [{ colId, seasonKey }], d);
  }
  // Runs the ticked seasons, all in one batch against the collection whose row
  // opened the picker.
  async _qaApplyPicks(kind) {
    const d = this._popup;
    const sp = this._ppSeasonPick;
    if (!d || sp?.kind !== kind || !sp.seasons) return;
    const jobs = [...sp.sel || []].map((seasonKey) => ({ colId: sp.colId, seasonKey }));
    return this._qaRunMaintainerrBatch(kind, jobs, d);
  }
  _popupReturn() {
    if (this._calReturnState) {
      this._calReturnState = false;
      this._calendarModalOpen = true;
      this._renderPopupEl();
      this._renderCalendarModalEl();
      return true;
    }
    if (this._mtReturnState) {
      const saved = this._mtReturnState;
      this._mtReturnState = null;
      this._renderPopupEl();
      Promise.resolve(this._openMaintainerrModal(saved.tab)).then(() => {
        const mm = this._maintainerrModal;
        if (!mm) return;
        if (saved.overview) mm.overview = saved.overview;
        if (saved.colDetail) mm.colDetail = saved.colDetail;
        if (saved.colSubTab) mm.colSubTab = saved.colSubTab;
        if (saved.cal) mm.cal = saved.cal;
        this._mtLoadTab(saved.tab, this.shadowRoot.querySelector("[data-mt-modal]"));
      });
      return true;
    }
    if (this._libReturnState) {
      const saved = this._libReturnState;
      this._libReturnState = null;
      this._renderPopupEl();
      this._openLibModal(
        ["movies", "tv", "music"].includes(saved.typeKey) ? saved.typeKey : saved.qualityKey || "all"
      );
      const m = this._libModal;
      if (m) {
        m.typeKey = saved.typeKey;
        m.qualityKey = saved.qualityKey;
        m.instFilter = saved.instFilter;
        m.search = saved.search;
        m.sort = saved.sort;
        m.sortDir = saved.sortDir;
        m.view = saved.view;
        m.filter = saved.filter;
        m.page = saved.page;
        const libEl = this.shadowRoot.querySelector("[data-lib-modal]");
        const bodyEl = libEl?.querySelector("#lib-body");
        if (bodyEl?.clientHeight > 0) {
          m._bodyH = bodyEl.clientHeight;
          bodyEl.innerHTML = this._libBodyHtml();
          this._wireLibModalBody(libEl);
        }
      }
      return true;
    }
    return false;
  }
  _wirePopup() {
    this.shadowRoot.querySelectorAll(".mc[data-popup]").forEach((card) => {
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
    this.shadowRoot.querySelectorAll(".mc[data-stream-entity]:not([data-artist-id])").forEach((card) => {
      card.addEventListener("click", () => {
        this._openStreamPopup(
          card.dataset.streamEntity,
          card.dataset.streamType || "",
          card.dataset.streamTitle || "",
          card.dataset.streamSeries || ""
        );
      });
    });
  }
  // ─────────────────────────────────────────────
  // Stream popup — open from stream card click
  // ─────────────────────────────────────────────
  async _openStreamPopup(entityId, contentType, trackTitle, seriesTitle) {
    const isMusic = contentType === "music" || contentType === "artist" || contentType === "album";
    const streamAttr = this._hass?.states?.[entityId]?.attributes || {};
    const isLiveTV = contentType === "channel" || !!streamAttr.media_channel || streamAttr.media_library_title === "Live TV";
    const isTV = isLiveTV || contentType === "tvshow" || contentType === "episode" || !!seriesTitle || !!streamAttr.media_series_title;
    if (isMusic) {
      const s = this._hass?.states?.[entityId];
      const attr = s?.attributes || {};
      this._popup = {
        _type: POPUP_TYPE.STREAM,
        _streamEntity: entityId,
        _streamState: s?.state || "idle",
        title: attr.media_title || "",
        _artist: attr.media_artist || "",
        _album: attr.media_album_name || "",
        _duration: attr.media_duration || 0,
        _position: attr.media_position || 0,
        _updatedAt: attr.media_position_updated_at ? new Date(attr.media_position_updated_at).getTime() : Date.now(),
        _poster: attr.entity_picture || null
      };
      this._renderPopupEl();
      if (entityId.startsWith("media_player.plex_")) this._fetchPlexMachineId(entityId);
      return;
    }
    if (isTV) {
      const lookupTitle = seriesTitle || trackTitle;
      const lt = lookupTitle.toLowerCase();
      let showIds = { tvdbId: null, tmdbId: null };
      if (!isLiveTV && entityId.startsWith("media_player.plex")) {
        try {
          const raw = await this._hass.callApi("GET", "arr_stack/plex/sessions");
          const sess = this._plexSessionForEntity(raw?.MediaContainer?.Metadata || [], entityId) || this._plexSessionFallback(raw?.MediaContainer?.Metadata || [], entityId);
          if (sess) showIds = await this._plexShowIds(sess);
        } catch (_) {
        }
      }
      const _snById = (arr) => !showIds.tvdbId && !showIds.tmdbId ? null : (arr || []).find(
        (s3) => showIds.tvdbId && String(s3.tvdbId) === String(showIds.tvdbId) || showIds.tmdbId && String(s3.tmdbId) === String(showIds.tmdbId)
      );
      const _snMatch = (arr) => (arr || []).find((s3) => (s3.title?.toLowerCase() || "") === lt);
      const s = _snById(this._sonarr) || _snMatch(this._sonarr);
      const s2 = !s && (_snById(this._sonarr2) || _snMatch(this._sonarr2));
      const snHit = s || s2;
      if (snHit) {
        const popType = snHit === s ? POPUP_TYPE.SONARR : POPUP_TYPE.SONARR;
        await this._openPopup(popType, snHit.tmdbId ? String(snHit.tmdbId) : null, snHit.tvdbId ? String(snHit.tvdbId) : null, snHit.title);
      } else if (this._overseerrConfigured !== false) {
        let tvTmdbId = null;
        try {
          const sr = await this._hass.callApi("POST", "arr_stack/overseerr/search", { query: lookupTitle, page: 1 });
          const hit2 = (sr?.results || []).find((r) => r.mediaType === "tv");
          if (hit2?.id) tvTmdbId = String(hit2.id);
        } catch (_) {
        }
        await this._openPopup(POPUP_TYPE.TV, tvTmdbId, null, lookupTitle);
      } else {
        await this._openPopup(POPUP_TYPE.TV, null, null, lookupTitle);
      }
      if (this._popup) {
        this._popup._noIS = isLiveTV;
        this._attachStreamData(entityId);
        this._renderPopupEl();
      }
      return;
    }
    const titleNoYear = trackTitle.replace(/\s*\(\d{4}\)\s*$/, "").trim();
    const _normT = (s) => (s || "").toLowerCase().replace(/\s*\(\d{4}\)\s*$/, "").trim();
    this._popup = { _loading: true, title: trackTitle };
    this._renderPopupEl();
    let sessionTmdbId = null;
    if (entityId.startsWith("jellyfin:")) {
      const jfSession = (this._jellyfinSessions || []).find((s) => s.id === entityId);
      if (jfSession?.attr?._jfTmdbId) sessionTmdbId = String(jfSession.attr._jfTmdbId);
    } else if (entityId.startsWith("emby:")) {
      const embySession = (this._embySessions || []).find((s) => s.id === entityId);
      if (embySession?.attr?._embyTmdbId) sessionTmdbId = String(embySession.attr._embyTmdbId);
    }
    if (!sessionTmdbId && entityId.startsWith("plex:")) {
      const ps = (this._plexSessions || []).find((x) => x.id === entityId);
      const guid = [...ps?._plexGuids || [], ...ps?._plexShowGuids || []].find((g) => typeof g === "string" && g.startsWith("tmdb://"));
      if (guid) sessionTmdbId = guid.replace("tmdb://", "").split("?")[0];
    }
    if (!sessionTmdbId && (entityId.startsWith("media_player.plex_") || entityId.startsWith("media_player.plex "))) {
      try {
        const raw = await this._hass.callApi("GET", "arr_stack/plex/sessions");
        const sessions = raw?.MediaContainer?.Metadata || [];
        const match = this._plexSessionForEntity(sessions, entityId) || this._plexSessionFallback(sessions, entityId);
        if (match?.Guid) {
          for (const g of Array.isArray(match.Guid) ? match.Guid : []) {
            if (g.id?.startsWith("tmdb://")) sessionTmdbId = g.id.replace("tmdb://", "");
          }
        }
        if (!sessionTmdbId && match?.ratingKey) {
          const meta = await this._callApi(
            "GET",
            `arr_stack/plex/metadata?ratingKey=${encodeURIComponent(match.ratingKey)}`
          ).catch(() => null);
          const md = meta?.MediaContainer?.Metadata?.[0];
          for (const g of Array.isArray(md?.Guid) ? md.Guid : []) {
            if (g.id?.startsWith("tmdb://")) sessionTmdbId = g.id.replace("tmdb://", "");
          }
        }
      } catch (_) {
      }
    }
    if (sessionTmdbId) {
      const radarrByTmdb = (this._radarr || []).find((m3) => m3.tmdbId && String(m3.tmdbId) === sessionTmdbId);
      const radarr2ByTmdb = !radarrByTmdb && (this._radarr2 || []).find((m3) => m3.tmdbId && String(m3.tmdbId) === sessionTmdbId);
      await this._openPopup(
        radarrByTmdb || radarr2ByTmdb ? POPUP_TYPE.RADARR : POPUP_TYPE.MOVIE,
        sessionTmdbId,
        null,
        titleNoYear,
        radarrByTmdb?.id ?? null,
        radarr2ByTmdb?.id ?? null
      );
      if (this._popup) {
        this._attachStreamData(entityId);
        this._renderPopupEl();
      }
      return;
    }
    const _titleMatch = (entry) => {
      const ql = _normT(trackTitle);
      const qn = _normT(titleNoYear);
      return [entry.title, entry.sortTitle, entry.originalTitle].some((t) => {
        const tl = _normT(t);
        return tl && (tl === ql || tl === qn);
      });
    };
    const m = (this._radarr || []).find((m3) => _titleMatch(m3));
    const m2 = !m && (this._radarr2 || []).find((m3) => _titleMatch(m3));
    const hit = m || m2;
    if (hit) {
      let hitTmdbId = hit.tmdbId ? String(hit.tmdbId) : null;
      if (!hitTmdbId && this._overseerrConfigured !== false) {
        try {
          const sr = await this._hass.callApi("POST", "arr_stack/overseerr/search", { query: titleNoYear, page: 1 });
          const qt = _normT(titleNoYear);
          const oh = (sr?.results || []).find((r) => {
            if (r.mediaType !== "movie") return false;
            const rt = _normT(r.title);
            const ort = _normT(r.originalTitle || "");
            return rt === qt || ort === qt || rt.includes(qt) || qt.includes(rt);
          });
          if (oh?.id) hitTmdbId = String(oh.id);
        } catch (_) {
        }
      }
      await this._openPopup(POPUP_TYPE.RADARR, hitTmdbId, null, hit.title, m?.id ?? null, m2?.id ?? null);
      if (this._popup) {
        this._attachStreamData(entityId);
        this._renderPopupEl();
      }
    } else {
      const _trackYear = trackTitle.match(/\((\d{4})\)/)?.[1] || null;
      let movieTmdbId = null;
      if (this._overseerrConfigured !== false) {
        try {
          const sr = await this._hass.callApi("POST", "arr_stack/overseerr/search", { query: titleNoYear, page: 1 });
          const qt = _normT(titleNoYear);
          const oh = (sr?.results || []).find((r) => {
            if (r.mediaType !== "movie") return false;
            const rt = _normT(r.title);
            const ort = _normT(r.originalTitle || "");
            if (rt === qt || ort === qt || rt.includes(qt) || qt.includes(rt)) return true;
            return !!(_trackYear && r.releaseDate?.startsWith(_trackYear));
          });
          if (oh?.id) movieTmdbId = String(oh.id);
        } catch (_) {
        }
      }
      if (movieTmdbId) {
        const radarrByTmdb = (this._radarr || []).find((m3) => m3.tmdbId && String(m3.tmdbId) === movieTmdbId);
        const radarr2ByTmdb = !radarrByTmdb && (this._radarr2 || []).find((m3) => m3.tmdbId && String(m3.tmdbId) === movieTmdbId);
        if (radarrByTmdb || radarr2ByTmdb) {
          await this._openPopup(POPUP_TYPE.RADARR, movieTmdbId, null, titleNoYear, radarrByTmdb?.id ?? null, radarr2ByTmdb?.id ?? null);
        } else {
          await this._openPopup(POPUP_TYPE.MOVIE, movieTmdbId, null, titleNoYear);
        }
        if (this._popup) {
          this._attachStreamData(entityId);
          this._renderPopupEl();
        }
      } else {
        this._popup = {
          _type: POPUP_TYPE.STREAM,
          _streamEntity: entityId,
          _streamState: this._hass?.states?.[entityId]?.state || "idle",
          title: trackTitle,
          _artist: "",
          _album: "",
          _duration: streamAttr.media_duration || 0,
          _position: streamAttr.media_position || 0,
          _updatedAt: streamAttr.media_position_updated_at ? new Date(streamAttr.media_position_updated_at).getTime() : Date.now(),
          _poster: streamAttr.entity_picture || null,
          _noIS: false
        };
        this._renderPopupEl();
      }
    }
  }
  // Attach live stream data to current popup (called after _openPopup for movie/TV from stream card)
  _attachStreamData(entityId) {
    if (!this._popup) return;
    let state = "idle", attr = {}, updatedAt = Date.now();
    if (entityId.startsWith("jellyfin:")) {
      const jf = (this._jellyfinSessions || []).find((s) => s.id === entityId);
      if (jf) {
        state = jf.state;
        attr = jf.attr;
      }
      updatedAt = attr.media_position_updated_at ? new Date(attr.media_position_updated_at).getTime() : Date.now();
    } else if (entityId.startsWith("emby:")) {
      const emby = (this._embySessions || []).find((s) => s.id === entityId);
      if (emby) {
        state = emby.state;
        attr = emby.attr;
      }
      updatedAt = attr.media_position_updated_at ? new Date(attr.media_position_updated_at).getTime() : Date.now();
    } else {
      const s = this._hass?.states?.[entityId];
      attr = s?.attributes || {};
      state = s?.state || "idle";
      updatedAt = attr.media_position_updated_at ? new Date(attr.media_position_updated_at).getTime() : Date.now();
    }
    this._popup._streamEntity = entityId;
    this._popup._streamState = state;
    this._popup._duration = attr.media_duration || 0;
    this._popup._position = attr.media_position || 0;
    this._popup._updatedAt = updatedAt;
    this._popup._plexMachineId = null;
    this._popup._jfSessionId = entityId.startsWith("jellyfin:") ? entityId.replace("jellyfin:", "") : null;
    this._popup._embySessionId = entityId.startsWith("emby:") ? entityId.replace("emby:", "") : null;
    const isKodiSession = (this._kodiSessions || []).some((s) => s.id === entityId);
    this._popup._kodiEntityId = isKodiSession ? entityId : null;
    if (entityId.startsWith("media_player.plex_")) this._fetchPlexMachineId(entityId);
  }
  _plexSlug(s) {
    return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }
  // Home Assistant names its Plex entities after the client — "Plex (<user> -
  // <product> - <device>)" — so the entity id says which player is streaming,
  // independent of what is on screen. Matching sessions on that instead of the
  // media title stops two players watching two different titles that share a
  // name from picking up each other's metadata.
  _plexSessionForEntity(sessions, entityId) {
    const want = (entityId || "").replace(/^media_player\.plex_/, "").replace(/_\d+$/, "");
    if (!want) return null;
    return (sessions || []).find((s) => {
      const p = s.Player || {};
      const dev = p.device || p.title || "";
      const withUser = this._plexSlug([s.User?.title, p.product, dev].filter(Boolean).join(" "));
      const noUser = this._plexSlug([p.product, dev].filter(Boolean).join(" "));
      return want === withUser || want === noUser;
    }) || null;
  }
  // Falls back to title + position only when the player could not be identified.
  // The old "if there is exactly one session, take it" guess is gone: a session
  // belonging to someone else is worse than no ids at all.
  _plexSessionFallback(sessions, entityId) {
    const attr = this._hass?.states?.[entityId]?.attributes || {};
    const rawTitle = (attr.media_title || "").replace(/\s*\(\d{4}\)\s*$/, "").trim().toLowerCase();
    if (!rawTitle) return null;
    const mediaPos = attr.media_position || 0;
    return (sessions || []).find((s) => {
      const st = (s.title || "").toLowerCase();
      return st === rawTitle && Math.abs((s.viewOffset || 0) / 1e3 - mediaPos) < 60;
    }) || null;
  }
  // Resolves the SHOW's tvdb/tmdb id for an episode session. The episode's own
  // Guid array is useless for matching against Sonarr, which keys on the series.
  async _plexShowIds(session) {
    const out = { tvdbId: null, tmdbId: null };
    const take = (guid) => {
      if (typeof guid !== "string") return;
      if (guid.startsWith("tvdb://")) out.tvdbId = guid.slice(7).split("?")[0];
      if (guid.startsWith("tmdb://")) out.tmdbId = guid.slice(7).split("?")[0];
      if (guid.startsWith("themoviedb://")) out.tmdbId = guid.slice(13).split("?")[0].split("/")[0];
    };
    take(session?.grandparentGuid);
    if (out.tvdbId || out.tmdbId) return out;
    const key = session?.grandparentRatingKey;
    if (!key) return out;
    try {
      const raw = await this._hass.callApi("GET", `arr_stack/plex/metadata?ratingKey=${encodeURIComponent(key)}`);
      const show = raw?.MediaContainer?.Metadata?.[0];
      take(show?.guid);
      for (const g of Array.isArray(show?.Guid) ? show.Guid : []) take(g?.id);
    } catch (_) {
    }
    return out;
  }
  async _fetchPlexMachineId(entityId) {
    try {
      const [raw, clientsRaw] = await Promise.all([
        this._hass.callApi("GET", "arr_stack/plex/sessions"),
        this._hass.callApi("GET", "arr_stack/plex/clients").catch(() => null)
      ]);
      const clients = clientsRaw?.MediaContainer?.Server || [];
      const sessions = raw?.MediaContainer?.Metadata || [];
      if (!sessions.length) return;
      const match = this._plexSessionForEntity(sessions, entityId) || this._plexSessionFallback(sessions, entityId);
      const p = match?.Player;
      if (p && this._popup) {
        this._popup._plexMachineId = p.machineIdentifier;
        this._popup._plexSessionId = match?.Session?.id || match?.sessionKey || "";
        this._popup._plexSessionKey = match?.sessionKey || "";
        this._popup._plexUser = match?.User?.title || "";
        this._popup._plexUserThumb = match?.User?.thumb || "";
        const port = p.port || (p.secure ? 32433 : 32500);
        const protocol = p.secure ? "https" : "http";
        this._popup._plexPlayerUrl = p.platform === "tvOS" && p.address ? `${protocol}://${p.address}:${port}` : null;
        this._renderPopupEl();
      }
    } catch (_) {
    }
  }
  // Seek via HA media_seek, or fall back to Plex direct API when HA seek unsupported
  _doSeek(entityId, newPos) {
    const supported = this._hass?.states?.[entityId]?.attributes?.supported_features || 0;
    const canSeek = !!(supported & 2);
    if (canSeek) {
      this._hass.callService("media_player", "media_seek", { entity_id: entityId, seek_position: newPos });
      return;
    }
    const machineId = this._popup?._plexMachineId;
    if (machineId) {
      this._hass.callApi("POST", "arr_stack/plex/player", {
        action: "seekTo",
        machineIdentifier: machineId,
        offset: Math.round(newPos * 1e3),
        playerUrl: this._popup?._plexPlayerUrl || null
      }).catch(() => {
      });
    }
  }
  // Update all progress fills for an entity across card + popup (call after seek)
  _updateStreamFills(entityId, newPos, dur) {
    const pct = dur > 0 ? Math.min(newPos / dur * 100, 100).toFixed(2) : 0;
    const now = Date.now().toString();
    this.shadowRoot?.querySelectorAll(`.stream-prog-fill[data-entity="${entityId}"]`).forEach((f) => {
      f.style.width = pct + "%";
      f.dataset.pos = newPos.toFixed(2);
      f.dataset.updated = now;
    });
  }
  // Sync music popup to current hass state (called from _renderStreams on each refresh)
  _syncStreamPopup() {
    const d = this._popup;
    if (!d || !d._streamEntity) return;
    const s = this._hass?.states?.[d._streamEntity];
    if (!s) return;
    const attr = s.attributes || {};
    if (d._type === POPUP_TYPE.STREAM) {
      if (d._plexTerminated) return;
      if (attr.media_title === d.title && s.state === d._streamState) return;
      this._popup = {
        ...d,
        _streamState: s.state,
        title: attr.media_title || d.title,
        _artist: attr.media_artist || "",
        _album: attr.media_album_name || "",
        _duration: attr.media_duration || 0,
        _position: attr.media_position || 0,
        _updatedAt: attr.media_position_updated_at ? new Date(attr.media_position_updated_at).getTime() : Date.now(),
        _poster: attr.entity_picture || null
      };
      this._renderPopupEl();
      return;
    }
    if (d._plexTerminated) return;
    if (s.state !== d._streamState) {
      d._streamState = s.state;
      d._position = attr.media_position || 0;
      d._duration = attr.media_duration || 0;
      d._updatedAt = attr.media_position_updated_at ? new Date(attr.media_position_updated_at).getTime() : Date.now();
      const root = this.shadowRoot?.getElementById("popup-root");
      const btn = root?.querySelector('[data-action="stream-playpause"]');
      if (btn) {
        const playing = s.state === "playing";
        btn.innerHTML = playing ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>` : `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
      }
    }
  }
  // ─────────────────────────────────────────────
  // Popup: fetch detail data and open modal
  // ─────────────────────────────────────────────
  // ─────────────────────────────────────────────
  // Day/night helper (sun.sun entity)
  // ─────────────────────────────────────────────
  get _isDaytime() {
    return this._hass?.states?.["sun.sun"]?.state === "above_horizon";
  }
  async _openPopup(type, tmdbId, tvdbId, title, radarrId = null, radarr2IdHint = null) {
    if (this._calendarModalOpen) {
      this._calReturnState = true;
      this._calendarModalOpen = false;
      this._renderCalendarModalEl();
    }
    if (this._plexConfigured !== false) {
      this._fetchPlexClients({ silent: true, maxAge: 3e4 });
    }
    if (!this._maintainerrArrServers && this._maintainerrConfigured !== false) {
      this._mtLoadArrServers();
    }
    this._isState = null;
    this._isInstance = "radarr";
    this._isResults = [];
    this._isFilters = { protocol: "", indexer: "", quality: "", lang: "" };
    this._isSort = { col: null, dir: 1 };
    this._isPage = 0;
    this._isPerPage = 8;
    this._isGrabbing = null;
    this._isGrabbed = /* @__PURE__ */ new Set();
    this._isHistory = {};
    this._isError = null;
    this._removeConfirm = false;
    this._removeInstance = null;
    this._snIsInstance = "sonarr";
    this._snIsOpen = false;
    this._snExpandedSeasons = /* @__PURE__ */ new Set();
    this._snEpisodes = /* @__PURE__ */ new Map();
    this._snActiveIs = null;
    this._snIsState = null;
    this._snIsResults = [];
    this._snIsError = null;
    this._snIsFilter = "all";
    this._snIsFilters = { protocol: "", indexer: "", quality: "", lang: "" };
    this._snIsSort = { col: null, dir: 1 };
    this._snIsGrabbing = null;
    this._snIsGrabbed = /* @__PURE__ */ new Set();
    this._snIsHistory = {};
    this._snSeasonsPage = 0;
    this._searchExpand = null;
    this._searchPickInst = null;
    this._asOpen = false;
    this._asInstance = null;
    this._asState = null;
    this._asError = null;
    this._asMovieSearching = false;
    this._asMovieSearched = false;
    this._asSearchingItems = /* @__PURE__ */ new Set();
    this._asSearchedItems = /* @__PURE__ */ new Set();
    let _radarrId = null;
    let _radarr2Id = null;
    if ((type === POPUP_TYPE.RADARR || type === POPUP_TYPE.MOVIE) && (radarrId || radarr2IdHint || tmdbId)) {
      if (!radarr2IdHint) {
        _radarrId = radarrId ?? (this._radarr || []).find((m) => String(m.tmdbId) === String(tmdbId))?.id ?? null;
      }
      _radarr2Id = radarr2IdHint ?? (tmdbId ? this._radarr2ByTmdb?.get(String(tmdbId))?.id ?? null : null);
    }
    let _sonarrSeries = null;
    let _sonarr2Series = null;
    if ((type === POPUP_TYPE.SONARR || type === POPUP_TYPE.TV) && (tvdbId || tmdbId)) {
      const sonarrPool = this._sonarrAll || this._sonarr || [];
      _sonarrSeries = sonarrPool.find(
        (s) => tvdbId && String(s.tvdbId) === String(tvdbId) || tmdbId && String(s.tmdbId) === String(tmdbId)
      ) ?? null;
      if (this._sonarr2Configured) {
        _sonarr2Series = (this._sonarr2 || []).find(
          (s) => tvdbId && String(s.tvdbId) === String(tvdbId) || tmdbId && String(s.tmdbId) === String(tmdbId)
        ) ?? null;
      }
    }
    this._popupMonExpand = false;
    this._popupMonBusy = null;
    this._popupMonAddInst = null;
    this._popupMonAddBusy = null;
    this._popupMonAddSearch = null;
    this._popupCastOpen = false;
    this._popupCastPage = 0;
    this._popup = { _loading: true, title, _radarrId, _radarr2Id, _sonarrSeries, _sonarr2Series };
    this._renderPopupEl();
    if (this._overseerrConfigured === false) {
      const local = this._localFallbackData(type, tmdbId, tvdbId, title);
      const _popId = tmdbId ? parseInt(tmdbId) : void 0;
      const _popTvdb = tvdbId ? parseInt(tvdbId) : void 0;
      this._popup = local ? { ...local, _type: type, _radarrId, _radarr2Id, _sonarrSeries, _sonarr2Series, id: _popId, _tvdbId: _popTvdb } : { title, _type: type, _radarrId, _radarr2Id, _sonarrSeries, _sonarr2Series, id: _popId, _tvdbId: _popTvdb };
      this._renderPopupEl();
      if (tmdbId) {
        const isMovie = type === POPUP_TYPE.RADARR || type === POPUP_TYPE.MOVIE;
        const tmdbPath = isMovie ? `arr_stack/tmdb/movie/${tmdbId}` : `arr_stack/tmdb/tv/${tmdbId}`;
        this._callApi("GET", tmdbPath).then((detail) => {
          if (!this._popup || this._popup._type !== type) return;
          const prev = this._popup;
          this._popup = {
            ...prev,
            overview: detail.overview || prev.overview || "",
            posterPath: detail.posterPath || prev.posterPath || null,
            backdropPath: detail.backdropPath || prev.backdropPath || null,
            voteAverage: detail.voteAverage || prev.voteAverage || 0,
            genres: detail.genres?.length ? detail.genres : prev.genres || [],
            releaseDate: detail.releaseDate || prev.releaseDate || "",
            firstAirDate: detail.firstAirDate || prev.firstAirDate || "",
            numberOfSeasons: detail.numberOfSeasons || prev.numberOfSeasons || 0,
            credits: detail.credits?.cast?.length ? detail.credits : prev.credits || null,
            relatedVideos: detail.youTubeTrailerId ? [{ site: "YouTube", type: "Trailer", key: detail.youTubeTrailerId }] : prev.relatedVideos || []
          };
          this._renderPopupEl();
        }).catch(() => {
        });
      }
      return;
    }
    try {
      let apiPath = "";
      if (!tmdbId && (type === POPUP_TYPE.SONARR || type === POPUP_TYPE.TV)) {
        const fallbackTmdb = _sonarrSeries?.tmdbId || _sonarr2Series?.tmdbId;
        if (fallbackTmdb) tmdbId = String(fallbackTmdb);
      }
      if (type === POPUP_TYPE.TV && tmdbId) {
        apiPath = `arr_stack/overseerr/tv/${tmdbId}`;
      } else if (type === POPUP_TYPE.SONARR && tmdbId) {
        apiPath = `arr_stack/overseerr/tv/${tmdbId}`;
      } else if ((type === POPUP_TYPE.RADARR || type === POPUP_TYPE.MOVIE) && tmdbId) {
        apiPath = `arr_stack/overseerr/movie/${tmdbId}`;
      } else {
        const local = this._localFallbackData(type, tmdbId, tvdbId, title);
        const _popId = tmdbId ? parseInt(tmdbId) : void 0;
        const _popTvdb = tvdbId ? parseInt(tvdbId) : void 0;
        this._popup = local ? { ...local, _type: type, _radarrId, _radarr2Id, _sonarrSeries, _sonarr2Series, id: _popId, _tvdbId: _popTvdb } : { title, _type: type, _radarrId, _radarr2Id, _sonarrSeries, _sonarr2Series, id: _popId, _tvdbId: _popTvdb };
        this._renderPopupEl();
        return;
      }
      const data = await this._hass.callApi("GET", apiPath);
      if ((type === POPUP_TYPE.TV || type === POPUP_TYPE.SONARR) && !_sonarrSeries && data.externalIds?.tvdbId) {
        const tvdbFromDetail = String(data.externalIds.tvdbId);
        let sonarrPool = this._sonarrAll || this._sonarr || [];
        _sonarrSeries = sonarrPool.find((s) => String(s.tvdbId) === tvdbFromDetail) ?? null;
        if (!_sonarrSeries) {
          await this._fetchSonarr();
          sonarrPool = this._sonarrAll || this._sonarr || [];
          _sonarrSeries = sonarrPool.find((s) => String(s.tvdbId) === tvdbFromDetail) ?? null;
        }
      }
      this._popup = { ...data, _type: type, _radarrId, _radarr2Id, _sonarrSeries, _sonarr2Series };
      {
        const _isMovieRt = type === POPUP_TYPE.RADARR || type === POPUP_TYPE.MOVIE;
        if (tmdbId && (!_isMovieRt || !_radarrId) && this._overseerrConfigured !== false) {
          const _rtPath = _isMovieRt ? `arr_stack/overseerr/movie/${tmdbId}/ratings` : `arr_stack/overseerr/tv/${tmdbId}/ratings`;
          this._callApi("GET", _rtPath).then((rt) => {
            if (this._popup && this._popup._type === type) {
              this._popup._rtRatings = rt;
              this._renderPopupEl();
            }
          }).catch(() => {
          });
        }
      }
      if (_sonarrSeries || type === POPUP_TYPE.TV || type === POPUP_TYPE.SONARR) {
        this._fetchSonarrQueue("sonarr").then(() => this._renderPopupEl());
        if (this._sonarr2Configured !== false)
          this._fetchSonarrQueue("sonarr2").then(() => this._renderPopupEl());
      }
      if (tmdbId && (!data.overview || !data.relatedVideos?.length)) {
        const _isMovie = type === POPUP_TYPE.RADARR || type === POPUP_TYPE.MOVIE;
        const _tmdbPath = _isMovie ? `arr_stack/overseerr/movie/${tmdbId}` : `arr_stack/overseerr/tv/${tmdbId}`;
        this._callApi("GET", _tmdbPath).then((detail) => {
          if (!this._popup || this._popup._type !== type) return;
          const prev = this._popup;
          this._popup = {
            ...prev,
            overview: detail.overview || prev.overview || "",
            posterPath: detail.posterPath || prev.posterPath || null,
            backdropPath: detail.backdropPath || prev.backdropPath || null,
            voteAverage: detail.voteAverage || prev.voteAverage || 0,
            genres: detail.genres?.length ? detail.genres : prev.genres || [],
            releaseDate: detail.releaseDate || prev.releaseDate || "",
            firstAirDate: detail.firstAirDate || prev.firstAirDate || "",
            numberOfSeasons: detail.numberOfSeasons || prev.numberOfSeasons || 0,
            relatedVideos: detail.youTubeTrailerId ? [{ site: "YouTube", type: "Trailer", key: detail.youTubeTrailerId }] : prev.relatedVideos || []
          };
          this._renderPopupEl();
        }).catch(() => {
        });
      }
    } catch (e) {
      console.error("[arr-card] popup fetch error:", e);
      const local = this._localFallbackData(type, tmdbId, tvdbId, title);
      const _popId = tmdbId ? parseInt(tmdbId) : void 0;
      const _popTvdb = tvdbId ? parseInt(tvdbId) : void 0;
      this._popup = local ? { ...local, _radarrId, _radarr2Id, _sonarrSeries, _sonarr2Series, id: _popId, _tvdbId: _popTvdb } : { title, _radarrId, _radarr2Id, _sonarrSeries, _sonarr2Series, _error: e.message, id: _popId, _tvdbId: _popTvdb };
      if (tmdbId) {
        const _isMovie = type === POPUP_TYPE.RADARR || type === POPUP_TYPE.MOVIE;
        const _tmdbPath = _isMovie ? `arr_stack/tmdb/movie/${tmdbId}` : `arr_stack/tmdb/tv/${tmdbId}`;
        const _snapType = type;
        this._callApi("GET", _tmdbPath).then((detail) => {
          if (!this._popup || this._popup._type !== _snapType) return;
          const prev = this._popup;
          this._popup = {
            ...prev,
            overview: detail.overview || prev.overview || "",
            posterPath: detail.posterPath || prev.posterPath || null,
            backdropPath: detail.backdropPath || prev.backdropPath || null,
            voteAverage: detail.voteAverage || prev.voteAverage || 0,
            genres: detail.genres?.length ? detail.genres : prev.genres || [],
            releaseDate: detail.releaseDate || prev.releaseDate || "",
            firstAirDate: detail.firstAirDate || prev.firstAirDate || "",
            numberOfSeasons: detail.numberOfSeasons || prev.numberOfSeasons || 0,
            credits: detail.credits?.cast?.length ? detail.credits : prev.credits || null,
            relatedVideos: detail.youTubeTrailerId ? [{ site: "YouTube", type: "Trailer", key: detail.youTubeTrailerId }] : prev.relatedVideos || []
          };
          this._renderPopupEl();
        }).catch(() => {
        });
      }
    }
    this._renderPopupEl();
  }
  // Build popup data from local arrays when Overseerr is unavailable/fails
  _localFallbackData(type, tmdbId, tvdbId, title) {
    if (type === POPUP_TYPE.TV) {
      const show = this._tvUpcoming?.find((m) => String(m.id) === String(tmdbId)) || (this._searchResults || []).find((m) => m.mediaType === "tv" && (tmdbId && String(m.id) === String(tmdbId) || tvdbId && String(m.tvdbId) === String(tvdbId)));
      if (show) return {
        _type: POPUP_TYPE.TV,
        _localData: true,
        title: show.name || show.originalName || title,
        overview: show.overview || "",
        firstAirDate: show.firstAirDate || "",
        genres: (show.genreIds || []).map((id) => ({ name: String(id) })),
        ratings: show.ratings || {},
        images: show.images || [],
        _localPosterUrl: show.posterPath ? show.posterPath.startsWith("http") ? show.posterPath : `https://image.tmdb.org/t/p/w342${show.posterPath}` : null,
        relatedVideos: show.youTubeTrailerId ? [{ site: "YouTube", type: "Trailer", key: show.youTubeTrailerId }] : []
      };
    }
    if (type === POPUP_TYPE.SONARR) {
      let series = tmdbId && this._sonarr.find((s) => String(s.tmdbId) === String(tmdbId)) || tvdbId && this._sonarr.find((s) => String(s.tvdbId) === String(tvdbId));
      if (!series) {
        const ep = this._calendar.find(
          (ep2) => tmdbId && String(ep2.series?.tmdbId) === String(tmdbId) || tvdbId && String(ep2.series?.tvdbId) === String(tvdbId)
        );
        if (ep?.series) series = ep.series;
      }
      if (series) {
        const fanart = series.images?.find((i) => i.coverType === "fanart")?.remoteUrl || null;
        return {
          _type: POPUP_TYPE.SONARR,
          _localData: true,
          title: series.title,
          overview: series.overview || "",
          firstAirDate: series.firstAired || "",
          genres: (series.genres || []).map((g) => typeof g === "string" ? { name: g } : g),
          voteAverage: series.ratings?.tmdb?.value || series.ratings?.imdb?.value || 0,
          _localPosterUrl: this._getSonarrPoster(series),
          _localBackdropUrl: fanart,
          relatedVideos: series.youTubeTrailerId ? [{ site: "YouTube", type: "Trailer", key: series.youTubeTrailerId }] : []
        };
      }
    }
    if (type === POPUP_TYPE.RADARR) {
      const movie = this._radarr.find((m) => tmdbId && String(m.tmdbId) === String(tmdbId));
      if (movie) {
        const fanart = movie.images?.find((i) => i.coverType === "fanart")?.remoteUrl || null;
        return {
          _type: POPUP_TYPE.RADARR,
          _localData: true,
          title: movie.title,
          overview: movie.overview || "",
          releaseDate: movie.digitalRelease || movie.physicalRelease || movie.inCinemas || "",
          genres: (movie.genres || []).map((g) => typeof g === "string" ? { name: g } : g),
          voteAverage: movie.ratings?.tmdb?.value || movie.ratings?.imdb?.value || 0,
          _localPosterUrl: this._getRadarrPoster(movie),
          _localBackdropUrl: fanart,
          relatedVideos: movie.youTubeTrailerId ? [{ site: "YouTube", type: "Trailer", key: movie.youTubeTrailerId }] : []
        };
      }
    }
    if (type === POPUP_TYPE.MOVIE || type === POPUP_TYPE.TV) {
      const _allDiscover = [
        ...this._searchResults || [],
        ...this._upcoming || [],
        ...this._trending || [],
        ...this._popular || [],
        ...this._tvUpcoming || []
      ];
      const sr = _allDiscover.find(
        (m) => tmdbId && String(m.id) === String(tmdbId) || tvdbId && m.tvdbId && String(m.tvdbId) === String(tvdbId)
      );
      if (sr) {
        const posterPath = sr.posterPath || null;
        return {
          _type: type,
          _localData: true,
          title: sr.title || sr.name || title,
          overview: sr.overview || "",
          releaseDate: sr.releaseDate || "",
          firstAirDate: sr.firstAirDate || "",
          genres: sr.genres || [],
          ratings: sr.ratings || {},
          voteAverage: sr.voteAverage || 0,
          images: sr.images || [],
          _tvdbId: sr.tvdbId || null,
          _localPosterUrl: posterPath ? posterPath.startsWith("http") ? posterPath : `https://image.tmdb.org/t/p/w342${posterPath}` : null,
          relatedVideos: sr.youTubeTrailerId ? [{ site: "YouTube", type: "Trailer", key: sr.youTubeTrailerId }] : []
        };
      }
    }
    return { _type: type, _localData: true, title, overview: "", relatedVideos: [] };
  }
  // ─────────────────────────────────────────────
  // Calendar modal
  // ─────────────────────────────────────────────
  _renderCalendarModal() {
    const CAL_MAX = 5;
    const calMob = window.matchMedia("(max-width:700px)").matches;
    if (calMob && this._calendarView === "month") this._calendarView = "week";
    const isMonth = this._calendarView === "month";
    const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const localDateStr = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    const todayStr = localDateStr(/* @__PURE__ */ new Date());
    const activeTab = this._calendarTab || "tv";
    const filteredData = activeTab === "all" ? this._calendarModalData || [] : (this._calendarModalData || []).filter(
      (ep) => activeTab === "movie" ? ep._mediaType === "movie" : activeTab === "music" ? ep._mediaType === "music" : ep._mediaType !== "movie" && ep._mediaType !== "music"
    );
    const byDay = {};
    for (const ep of filteredData) {
      const key = (ep.airDate || "").split("T")[0];
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(ep);
    }
    const DOTS = `<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" style="display:block"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`;
    const _dotsBg = this._isDay ? "rgba(0,122,255,0.85)" : "rgba(0,122,255,0.30)";
    const _dotsBdr = this._isDay ? "rgba(0,122,255,0.95)" : "rgba(0,122,255,0.50)";
    const _dotsBtn = (dateStr, n, size = 34) => `<button data-cal-day="${dateStr}" title="${n}" style="width:${size}px;height:${size}px;padding:0;border-radius:50%;border:1px solid ${_dotsBdr};background:${_dotsBg};color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:0;flex-shrink:0;backdrop-filter:blur(8px)">${DOTS}</button>`;
    let gridHtml, rangeLabel;
    if (isMonth) {
      const { start, month, weeks, base } = this._calMonthRange(this._calendarMonthOffset || 0);
      const cells = Array.from({ length: weeks * 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = localDateStr(d);
        const items = byDay[dateStr] || [];
        const outside = d.getMonth() !== month;
        const posters = items.map((ep) => this._calItemPoster(ep)).filter(Boolean).slice(0, 4);
        const scrim = this._isDay ? "linear-gradient(180deg,rgba(255,255,255,0.58) 0%,rgba(255,255,255,0.74) 100%)" : "linear-gradient(180deg,rgba(18,18,22,0.45) 0%,rgba(14,14,18,0.62) 100%)";
        const mosaic = posters.length ? `<div style="position:absolute;inset:0;z-index:0;display:flex">${posters.map((u) => `<div style="flex:1;min-width:0;background:url('${u}') center/cover no-repeat"></div>`).join("")}</div>
           <div style="position:absolute;inset:0;z-index:1;background:${scrim}"></div>` : "";
        const nMovie = items.filter((ep) => ep._mediaType === "movie").length;
        const nTv = new Set(items.filter((ep) => ep._mediaType !== "movie" && ep._mediaType !== "music").map((ep) => this._calItemSeries(ep)?.id ?? ep.seriesId)).size;
        const nMusic = items.filter((ep) => ep._mediaType === "music").length;
        const _line = (n, forms) => `<span class="media-type-tag" style="position:static;font-size:11px;padding:3px 8px;border-radius:5px;white-space:nowrap">${this._calPlural(n, forms)}</span>`;
        const counts = [
          nMovie ? _line(nMovie, "calMovieForms") : "",
          nTv ? _line(nTv, "calSeriesForms") : "",
          nMusic ? _line(nMusic, "calAlbumForms") : ""
        ].join("");
        const open = items.length ? ` data-cal-day="${dateStr}"` : "";
        return `<div class="cal-day-col${dateStr === todayStr ? " cal-day-today" : ""}" style="${outside ? "opacity:0.35;" : ""}min-height:0;overflow:hidden">
        <div class="cal-day-hdr" style="padding:5px 4px 4px">
          <span class="cal-day-num${dateStr === todayStr ? " cal-day-num-today" : ""}" style="font-size:13px">${d.getDate()}</span>
        </div>
        <div${open} style="position:relative;flex:1;min-height:0;overflow:hidden;${open ? "cursor:pointer" : ""}">
          ${mosaic}
          <div style="position:relative;z-index:2;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:6px;text-align:center">
            ${counts}
          </div>
        </div>
      </div>`;
      }).join("");
      const dayHdr = DAY_NAMES.map((n) => `<div class="cal-day-name" style="text-align:center;padding:2px 0">${n}</div>`).join("");
      gridHtml = `<div style="display:flex;flex-direction:column;gap:6px;flex:1;min-height:0;padding:8px">
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;flex-shrink:0">${dayHdr}</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(${weeks},1fr);gap:6px;flex:1;min-height:0">${cells}</div>
    </div>`;
      rangeLabel = base.toLocaleDateString(void 0, { month: "long", year: "numeric" });
    } else {
      const { start, end } = this._calWeekRange(this._calendarWeekOffset || 0);
      const cols = DAY_NAMES.map((name, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = localDateStr(d);
        const isToday = dateStr === todayStr;
        const episodes = byDay[dateStr] || [];
        const cards = episodes.slice(0, CAL_MAX).map((ep) => this._renderCalendarModalCard(ep)).join("");
        const more = episodes.length > CAL_MAX ? `<div style="display:flex;justify-content:center;padding-top:2px">${_dotsBtn(dateStr, episodes.length)}</div>` : "";
        return `
        <div class="cal-day-col${isToday ? " cal-day-today" : ""}${episodes.length === 0 ? " cal-day-empty" : ""}">
          <div class="cal-day-hdr">
            <span class="cal-day-name">${name}</span>
            <span class="cal-day-num${isToday ? " cal-day-num-today" : ""}">${d.getDate()}</span>
          </div>
          <div class="cal-day-body">${cards}${more}</div>
        </div>`;
      }).join("");
      gridHtml = `<div class="cal-modal-grid">${cols}</div>`;
      rangeLabel = this._fmtWeekRange(start, end);
    }
    const loading = this._calendarModalLoading ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);border-radius:inherit;z-index:10"><span class="action-spinner" style="width:28px;height:28px"></span></div>` : "";
    const chevL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>`;
    const chevR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>`;
    const chevLL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="16" height="16"><polyline points="18 18 12 12 18 6"/><polyline points="12 18 6 12 12 6"/></svg>`;
    const chevRR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="16" height="16"><polyline points="6 18 12 12 6 6"/><polyline points="12 18 18 12 12 6"/></svg>`;
    const closeX = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    const backX = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>`;
    const dayOpen = !!this._calDayOpen;
    const dayLabel = dayOpen ? new Date(this._calDayOpen).toLocaleDateString(void 0, { weekday: "long", day: "numeric", month: "long" }) : "";
    const atNow = isMonth ? (this._calendarMonthOffset || 0) === 0 : (this._calendarWeekOffset || 0) === 0;
    const btnSty = "display:inline-flex;align-items:center;gap:4px;padding:5px 10px";
    const footer = `
    ${!isMonth ? `<button class="tl-page-btn tl-icon-btn" data-cal-action="prev-month" style="${btnSty}">${chevLL}</button>` : ""}
    <button class="tl-page-btn tl-icon-btn" data-cal-action="prev" style="${btnSty}">${chevL}</button>
    <button class="tl-page-btn tl-pill-btn${atNow ? " is-here" : ""}" data-cal-action="this-week"${atNow ? " disabled" : ""}>${isMonth ? this._t("mtThisMonth") : this._t("mtThisWeek")}</button>
    <button class="tl-page-btn tl-icon-btn" data-cal-action="next" style="${btnSty}">${chevR}</button>
    ${!isMonth ? `<button class="tl-page-btn tl-icon-btn" data-cal-action="next-month" style="${btnSty}">${chevRR}</button>` : ""}`;
    const isDay = this._isDay;
    const _si = this._mtSegIcons;
    const typeSeg = this._mtSegmented("data-cal-type-seg", [
      { v: "all", label: this._t("tabAll"), attr: 'data-cal-action="tab-all"' },
      { v: "movie", label: this._t("tabMovies"), icon: _si.movie, attr: 'data-cal-action="tab-movie"' },
      { v: "tv", label: this._t("tabTvShows"), icon: _si.tv, attr: 'data-cal-action="tab-tv"' },
      ...this._lidarrConfigured !== false ? [{ v: "music", label: this._t("tabMusic"), icon: _si.music, attr: 'data-cal-action="tab-music"' }] : []
    ], activeTab, { width: 52, accent: "0,122,255", animatePrev: !!this._calAnimType, prev: this._calPrevTab });
    const viewSeg = calMob ? "" : this._mtSegmented("data-cal-view-seg", [
      { v: "week", label: this._t("mtWeek"), icon: _si.week },
      { v: "month", label: this._t("mtMonth"), icon: _si.month }
    ], isMonth ? "month" : "week", { icons: true, animatePrev: !!this._calAnimView, prev: isMonth ? "week" : "month" });
    return `
    <div class="popup-overlay${isDay ? " popup-day" : ""}" id="cal-overlay">
      <div class="popup-glass cal-modal-glass" id="cal-glass">
        ${loading}
        <div class="cal-modal-hdr" style="justify-content:flex-start">
          <div class="is-filter" style="flex-shrink:0">${typeSeg}</div>
          <span class="cal-week-label">${dayOpen ? this._escHtml(dayLabel) : rangeLabel}</span>
          <div style="flex:1;min-width:8px"></div>
          <button class="popup-close" data-cal-action="${dayOpen ? "day-back" : "close"}" style="position:static;flex-shrink:0;margin-left:4px">${dayOpen ? backX : closeX}</button>
        </div>
        ${dayOpen ? this._renderCalDayList(byDay[this._calDayOpen] || []) : gridHtml}
        ${dayOpen ? "" : `<div class="cal-modal-footer" style="position:relative">
          ${footer}
          ${viewSeg ? `<div style="position:absolute;left:14px;top:50%;transform:translateY(-50%)">${viewSeg}</div>` : ""}
        </div>`}
      </div>
    </div>`;
  }
  // Every entry for one day, filling the space the grid normally occupies
  // Czech needs three plural forms; English reuses the second for both.
  _calPlural(n, formsKey) {
    const forms = this._t(formsKey);
    if (!Array.isArray(forms)) return `${n}`;
    const i = n === 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2;
    return `${n} ${forms[i]}`;
  }
  _renderCalDayList(items) {
    if (!items.length) return `<div class="cal-modal-grid" style="display:flex;align-items:center;justify-content:center"><span class="u-empty-dim">\u2014</span></div>`;
    return `<div style="flex:1;min-height:0;overflow-y:auto;padding:8px">
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px">
      ${items.map((ep) => this._renderCalendarModalCard(ep)).join("")}
    </div>
  </div>`;
  }
  _wireCalendarModal() {
    const root = this.shadowRoot?.getElementById("cal-modal-root");
    if (!root) return;
    const overlay = root.querySelector("#cal-overlay");
    const glass = root.querySelector("#cal-glass");
    if (!overlay || !glass) return;
    overlay.addEventListener("click", () => {
      this._calendarModalOpen = false;
      this._renderCalendarModalEl();
    });
    glass.addEventListener("click", async (e) => {
      e.stopPropagation();
      const action = e.target.closest("[data-cal-action]")?.dataset.calAction;
      const albumTile = e.target.closest("[data-album-cal]");
      if (albumTile) {
        this._openCalAlbumArtist(Number(albumTile.dataset.albumCal));
        return;
      }
      if (!action && !e.target.closest("[data-cal-day],[data-cal-view-seg]")) return;
      if (action === "close") {
        this._calendarModalOpen = false;
        this._renderCalendarModalEl();
        return;
      }
      const isMonth = this._calendarView === "month";
      if (action === "day-back") {
        this._calDayOpen = null;
        this._renderCalendarModalEl();
        return;
      }
      if (action === "this-week") {
        if (isMonth) this._calendarMonthOffset = 0;
        else this._calendarWeekOffset = 0;
        await this._fetchCalendarWindow();
        return;
      }
      if (action === "prev-month" || action === "next-month") {
        this._calendarWeekOffset = (this._calendarWeekOffset || 0) + (action === "next-month" ? 4 : -4);
        await this._fetchCalendarWindow();
        return;
      }
      if (action === "prev" || action === "next") {
        const step = action === "next" ? 1 : -1;
        if (isMonth) this._calendarMonthOffset = (this._calendarMonthOffset || 0) + step;
        else this._calendarWeekOffset = (this._calendarWeekOffset || 0) + step;
        await this._fetchCalendarWindow();
        return;
      }
      if (action === "tab-all" || action === "tab-tv" || action === "tab-movie" || action === "tab-music") {
        const next = action === "tab-movie" ? "movie" : action === "tab-tv" ? "tv" : action === "tab-music" ? "music" : "all";
        if (next === (this._calendarTab || "tv")) return;
        this._calPrevTab = this._calendarTab || "tv";
        this._calAnimType = true;
        this._calendarTab = next;
        try {
          localStorage.setItem("arr-cal-tab", this._calendarTab);
        } catch (_) {
        }
        this._renderCalendarModalEl();
        return;
      }
      const dayBtn = e.target.closest("[data-cal-day]");
      if (dayBtn) {
        this._calDayOpen = dayBtn.dataset.calDay;
        this._renderCalendarModalEl();
        return;
      }
      if (e.target.closest("[data-cal-view-seg]")) {
        this._calendarView = isMonth ? "week" : "month";
        this._calAnimView = true;
        this._calDayOpen = null;
        try {
          localStorage.setItem("arr-cal-view", this._calendarView);
        } catch (_) {
        }
        await this._fetchCalendarWindow();
        return;
      }
    });
  }
  // ─────────────────────────────────────────────
  // Popup: render popup HTML into popup-root
  // ─────────────────────────────────────────────
  // A phone's sources list is the part worth more room, so it gets a grabber:
  // drag it up to take height from the description, down to give it back. The
  // ceiling is the action capsule — the panel never hides it.
  _ppWirePanelGrab(root) {
    const panel = root.querySelector(".popup-body .is-panel, .popup-body .sn-is-panel, .popup-body .sn-is-section");
    if (!panel || panel.querySelector(".is-confirm-wrap")) {
      this._ppPanelWasOpen = false;
      return;
    }
    if (!this._ppPanelWasOpen) {
      this._ppPanelWasOpen = true;
      this._ppPanelAnimDone = false;
      this._isFitHist = null;
      this._snFitHist = null;
    }
    if (!this._ppPanelAnimDone) {
      panel.classList.add("pp-panel-in");
      panel.addEventListener("animationend", () => {
        this._ppPanelAnimDone = true;
        panel.classList.remove("pp-panel-in");
        this._renderPopupEl();
      }, { once: true });
    }
    const bodyEl = root.querySelector(".popup-body");
    const clampH = (h) => {
      const bodyR = bodyEl?.getBoundingClientRect();
      const barR = root.querySelector(".pp-hero-bar")?.getBoundingClientRect();
      const top = Math.max(bodyR?.top ?? 0, barR ? barR.bottom + 10 : 0);
      const max = bodyR ? bodyR.bottom - top : (glass?.getBoundingClientRect().height || 600) - 120;
      return Math.min(Math.max(120, h), Math.max(160, max));
    };
    const applyH = (h) => {
      panel.style.flex = `0 0 ${h}px`;
      panel.style.height = `${h}px`;
      panel.style.minHeight = "0";
      panel.style.maxHeight = "none";
    };
    if (this._ppPanelH) {
      this._ppPanelH = clampH(this._ppPanelH);
      applyH(this._ppPanelH);
    } else {
      requestAnimationFrame(() => {
        if (this._ppPanelH) return;
        const poster = root.querySelector(".popup-poster");
        const bodyR = bodyEl?.getBoundingClientRect();
        if (!poster || !bodyR) return;
        const h = clampH(bodyR.bottom - poster.getBoundingClientRect().bottom - 18);
        this._ppPanelH = h;
        applyH(h);
      });
    }
    if (panel.querySelector(".pp-grab")) return;
    const grab = document.createElement("div");
    grab.className = "pp-grab";
    grab.innerHTML = "<span></span>";
    panel.insertBefore(grab, panel.firstChild);
    const glass = root.querySelector(".popup-glass");
    let startY = 0, startH = 0;
    const onMove = (e) => {
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      let h = clampH(startH + (startY - y));
      applyH(h);
      const spill = panel.getBoundingClientRect().bottom - (bodyEl?.getBoundingClientRect().bottom ?? Infinity);
      if (spill > 0.5) {
        h = Math.max(120, h - spill);
        applyH(h);
      }
      this._ppPanelH = h;
      e.preventDefault();
    };
    const onUp = () => {
      grab.classList.remove("is-dragging");
      const rowEl = panel.querySelector(".sn-season-row, .sn-seasons-rows > *, tbody tr, .is-card");
      const rowH = rowEl ? rowEl.getBoundingClientRect().height : 40;
      const last = this._ppRenderedH ?? startH;
      if (Math.abs((this._ppPanelH || 0) - last) >= Math.max(24, rowH * 0.9)) {
        this._ppRenderedH = this._ppPanelH;
        this._snSeasonsPerPage = null;
        this._isPerPage = null;
        this._renderPopupEl();
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
    const onDown = (e) => {
      startY = e.touches ? e.touches[0].clientY : e.clientY;
      startH = panel.getBoundingClientRect().height;
      grab.classList.add("is-dragging");
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("touchmove", onMove, { passive: false });
      window.addEventListener("touchend", onUp);
      e.preventDefault();
      e.stopPropagation();
    };
    grab.addEventListener("pointerdown", onDown);
    grab.addEventListener("touchstart", onDown, { passive: false });
  }
  // The dropdown belongs under the control that opened it. Anchored in script
  // rather than CSS because all three triggers live in a flex capsule whose
  // widths shift with state, so no fixed offset stays correct.
  _qaPositionMenu() {
    const root = this.shadowRoot?.getElementById("popup-root");
    const menu = root?.querySelector(".qa-menu");
    if (!menu) return;
    const glass = menu.closest(".popup-glass");
    const trigger = this._searchExpand ? root.querySelector(".is-search-btn") : this._removeConfirm ? root.querySelector(".remove-lib-btn") : root.querySelector(".qa-opt-btn");
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
  _renderPopupEl() {
    if (this._terminateActive) return;
    const root = this.shadowRoot.getElementById("popup-root");
    if (!root) return;
    if (this._streamPopupTimer) {
      clearInterval(this._streamPopupTimer);
      this._streamPopupTimer = null;
    }
    if (!this._popup) {
      root.innerHTML = "";
      return;
    }
    const prevIsWrap = root.querySelector(".is-results-wrap");
    const prevBody = root.querySelector(".popup-body");
    const prevSnPanel = root.querySelector(".sn-is-panel");
    const savedIsScroll = prevIsWrap ? prevIsWrap.scrollTop : 0;
    const savedBodyScroll = prevBody ? prevBody.scrollTop : 0;
    const savedSnIsScroll = prevSnPanel ? prevSnPanel.scrollTop : 0;
    const d = this._popup;
    if (d && !d._loading && !d._streamEntity) {
      const _tmdb = d.tmdbId || d.id;
      const _tvdb = d.externalIds?.tvdbId || d._tvdbId;
      if (_tmdb && !d._radarrId) {
        const m = (this._radarr || []).find((r) => String(r.tmdbId) === String(_tmdb));
        if (m) d._radarrId = m.id;
      }
      if (_tmdb && !d._radarr2Id) {
        const m = this._radarr2ByTmdb?.get(String(_tmdb));
        if (m) d._radarr2Id = m.id;
      }
      if ((_tvdb || _tmdb) && !d._sonarrSeries) {
        const s = (this._sonarrAll || this._sonarr || []).find(
          (s2) => _tvdb && String(s2.tvdbId) === String(_tvdb) || _tmdb && String(s2.tmdbId) === String(_tmdb)
        );
        if (s) d._sonarrSeries = s;
      }
      if ((_tvdb || _tmdb) && !d._sonarr2Series && this._sonarr2Configured) {
        const s = (this._sonarr2All || this._sonarr2 || []).find(
          (s2) => _tvdb && String(s2.tvdbId) === String(_tvdb) || _tmdb && String(s2.tmdbId) === String(_tmdb)
        );
        if (s) d._sonarr2Series = s;
      }
    }
    const _oldBar = root.querySelector(".pp-hero-bar");
    const _oldBarHtml = _oldBar?.outerHTML;
    root.innerHTML = this._renderPopup();
    if (_oldBar) {
      const _newBar = root.querySelector(".pp-hero-bar");
      if (_newBar) {
        const oldPills = _oldBar.querySelectorAll(".pp-hero-pill");
        const newPills = _newBar.querySelectorAll(".pp-hero-pill");
        if (_newBar.outerHTML === _oldBarHtml) {
          _newBar.replaceWith(_oldBar);
        } else if (oldPills.length && oldPills.length === newPills.length) {
          oldPills.forEach((pill, i) => {
            const next = newPills[i];
            if (pill.innerHTML !== next.innerHTML) pill.innerHTML = next.innerHTML;
          });
          _newBar.replaceWith(_oldBar);
        }
      }
    }
    this._ppWirePanelGrab(root);
    const openKeys = /* @__PURE__ */ new Set();
    root.querySelectorAll(".pp-hero-pill .pp-sub").forEach((sub) => {
      const key = sub.dataset.subKey || "sub";
      openKeys.add(key);
      if (!sub.classList.contains("is-open")) {
        requestAnimationFrame(() => requestAnimationFrame(() => sub.classList.add("is-open")));
      }
    });
    this._ppSubOpenKeys = openKeys;
    if (savedIsScroll > 0) {
      const newIsWrap = root.querySelector(".is-results-wrap");
      if (newIsWrap) newIsWrap.scrollTop = savedIsScroll;
    }
    if (savedSnIsScroll > 0) {
      const newSnPanel = root.querySelector(".sn-is-panel");
      if (newSnPanel) newSnPanel.scrollTop = savedSnIsScroll;
    }
    if (savedBodyScroll > 0) {
      const newBody = root.querySelector(".popup-body");
      if (newBody) newBody.scrollTop = savedBodyScroll;
    }
    requestAnimationFrame(() => this._qaPositionMenu());
    if (this._isState === "results") {
      const _gen = this._isMeasureGen = (this._isMeasureGen || 0) + 1;
      requestAnimationFrame(() => {
        if (this._isMeasureGen !== _gen) return;
        const root2 = this.shadowRoot?.getElementById("popup-root");
        const glass2 = root2?.querySelector(".popup-glass");
        const panel = root2?.querySelector(".is-panel");
        const hdr = root2?.querySelector(".is-panel-hdr");
        const pager = root2?.querySelector('.is-panel > div[style*="flex-shrink"]');
        const wrap = root2?.querySelector(".is-results-wrap");
        const rows = wrap ? [...wrap.querySelectorAll("tbody tr, .is-card")] : [];
        if (!glass2 || !panel || !hdr || !wrap || !rows.length) return;
        if (panel.classList.contains("pp-panel-in")) return;
        const hdrBottom = hdr.getBoundingClientRect().bottom;
        const _floor = this._ppPanelH ? panel.getBoundingClientRect().bottom : glass2.getBoundingClientRect().bottom;
        const glassVisBottom = Math.min(_floor, window.innerHeight);
        const pagerH = pager ? pager.getBoundingClientRect().height : 0;
        const available = glassVisBottom - hdrBottom - pagerH - 8;
        const rowH = Math.max(20, ...rows.map((r) => r.getBoundingClientRect().height));
        const fits = Math.max(1, Math.floor(available / rowH));
        this._isFitHist = [...this._isFitHist || [], fits].slice(-3);
        const _osc = this._isFitHist.length === 3 && this._isFitHist[0] === this._isFitHist[2] && this._isFitHist[0] !== this._isFitHist[1];
        if (_osc) return;
        if (fits !== this._isPerPage) {
          this._isPerPage = fits;
          this._isPage = Math.min(this._isPage, Math.max(0, Math.ceil(this._applyIsFilters(this._isResults || []).length / fits) - 1));
          this._renderPopupEl();
        }
      });
    }
    if (this._snIsOpen && !(this._snExpandedSeasons?.size > 0) && !this._snActiveIs) {
      const _snGen = this._snSeasonsMeasureGen = (this._snSeasonsMeasureGen || 0) + 1;
      requestAnimationFrame(() => {
        if (this._snSeasonsMeasureGen !== _snGen) return;
        const root2 = this.shadowRoot?.getElementById("popup-root");
        const glass2 = root2?.querySelector(".popup-glass");
        const rowsWrap = root2?.querySelector(".sn-seasons-rows");
        const pager = root2?.querySelector('.sn-is-section > div[style*="padding-bottom"]');
        const rows = rowsWrap ? [...rowsWrap.children] : [];
        if (!glass2 || !rowsWrap || !rows.length) return;
        const wrapTop = rowsWrap.getBoundingClientRect().top;
        const _panel = root2?.querySelector(".sn-is-section, .sn-is-panel");
        if (_panel?.classList.contains("pp-panel-in")) return;
        const _floor = this._ppPanelH && _panel ? _panel.getBoundingClientRect().bottom : glass2.getBoundingClientRect().bottom;
        const glassVisBottom = Math.min(_floor, window.innerHeight);
        const pagerH = pager ? pager.getBoundingClientRect().height : 0;
        const available = glassVisBottom - wrapTop - pagerH;
        const rowH = Math.round(Math.max(20, ...rows.map((r) => r.getBoundingClientRect().height)));
        const gapH = 4;
        const fits = Math.max(3, Math.floor((available + gapH) / (rowH + gapH)));
        this._snFitHist = [...this._snFitHist || [], `${fits}/${rowH}`].slice(-3);
        const _snOsc = this._snFitHist.length === 3 && this._snFitHist[0] === this._snFitHist[2] && this._snFitHist[0] !== this._snFitHist[1];
        if (_snOsc) return;
        if (fits !== this._snSeasonsPerPage || rowH !== this._snSeasonsRowH) {
          this._snSeasonsPerPage = fits;
          this._snSeasonsRowH = rowH;
          this._snSeasonsPage = 0;
          this._renderPopupEl();
        }
      });
    }
    const overlay = root.querySelector(".popup-overlay");
    const glass = root.querySelector(".popup-glass");
    const closeBtn = root.querySelector(".popup-close");
    const _resetPopupTransient = () => {
      this._plexCastOpen = false;
      this._plexCasting = null;
      this._plexClients = null;
      this._plexCastBtnRect = null;
    };
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        const playBtn = e.target.closest('[data-action="plex-cast-play"]');
        if (playBtn) {
          const castEntity = playBtn.dataset.entity;
          const dd = this._popup;
          if (!castEntity || !dd) return;
          const _isMovT = dd._type === "radarr" || dd._type === "movie";
          const tmdbId = dd.id || dd.tmdbId || (dd._radarrId ? (this._radarr || []).find((m) => m.id === dd._radarrId)?.tmdbId : null) || (dd._radarr2Id ? (this._radarr2 || []).find((m) => m.id === dd._radarr2Id)?.tmdbId : null);
          const tvdbId = dd.externalIds?.tvdbId || dd._sonarrSeries?.tvdbId || dd._sonarr2Series?.tvdbId;
          this._plexCasting = castEntity;
          this._plexCastOpen = false;
          this._renderPopupEl();
          (async () => {
            try {
              const lookupParam = _isMovT ? `tmdbId=${tmdbId}` : `tvdbId=${tvdbId}`;
              const lookup = await this._callApi("GET", `arr_stack/plex/lookup?${lookupParam}`);
              if (!lookup?.plex_key) throw new Error("Plex item not found");
              const contentId = {};
              if (lookup.library) contentId.library_name = lookup.library;
              if (lookup.title) contentId.title = lookup.title;
              await this._hass.callService("media_player", "play_media", {
                entity_id: castEntity,
                media_content_type: "plex",
                media_content_id: JSON.stringify(contentId)
              });
            } catch (err) {
              console.warn("[arr-card] Plex cast error:", err);
            }
            this._plexCasting = null;
            this._renderPopupEl();
          })();
          return;
        }
        if (e.target.closest(".plex-cast-dropdown")) return;
        _resetPopupTransient();
        this._popup = null;
        this._libReturnState = null;
        this._calReturnState = false;
        this._mtReturnState = null;
        this._renderPopupEl();
      });
    }
    if (closeBtn) {
      const _backArrow = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
      if (this._libReturnState || this._calReturnState || this._mtReturnState) {
        closeBtn.innerHTML = _backArrow;
      }
      closeBtn.addEventListener("click", () => {
        _resetPopupTransient();
        this._popup = null;
        this._isState = null;
        if (!this._popupReturn()) this._renderPopupEl();
      });
    }
    if (glass) glass.addEventListener("click", (e) => {
      e.stopPropagation();
      if (e.target.closest("[data-qa-toggle]")) {
        const opening = this._ppMenu?.panel !== "options";
        this._ppMenu = opening ? { panel: "options", sub: null } : null;
        if (opening) {
          this._ppSeasonPick = null;
          this._searchExpand = null;
          this._searchPickInst = null;
          this._removeConfirm = false;
          this._removeArmed = null;
        }
        this._renderPopupEl();
        return;
      }
      if (e.target.closest('[data-qa-do],[data-qa-lib],[data-qa-run],[data-qa-apply],[data-qa-season-pick],[data-action="plex-cast-play"],[data-action="stream-terminate-show"]')) {
        this._markActivated();
      }
      const qaSub = e.target.closest("[data-qa-sub]");
      if (qaSub) {
        const key = qaSub.dataset.qaSub;
        const menuEl = e.target.closest("[data-qa-menu]");
        const next = this._ppMenu?.sub === key ? null : key;
        this._ppMenu = { ...this._ppMenu || {}, sub: next };
        if (next !== this._ppSeasonPick?.kind) this._ppSeasonPick = null;
        if (next === "cast") {
          const dr = menuEl?.querySelector('[data-qa-drawer="cast"]');
          if (dr) dr.innerHTML = this._qaCastRowsHtml();
          this._fetchPlexClients({ silent: true }).then(() => {
            const dr2 = this.shadowRoot?.querySelector('[data-qa-drawer="cast"]');
            if (dr2 && this._ppMenu?.sub === "cast") dr2.innerHTML = this._qaCastRowsHtml();
          });
        }
        if (next === "stats") {
          this._ppStats = null;
          const dr = menuEl?.querySelector('[data-qa-drawer="stats"]');
          if (dr) dr.innerHTML = this._qaStatsRowsHtml();
          this._qaLoadStats(this._popup, dr);
        }
        if (next === "airing") {
          this._ppAiring = null;
          const dr = menuEl?.querySelector('[data-qa-drawer="airing"]');
          if (dr) dr.innerHTML = this._qaAiringRowsHtml();
          this._qaLoadAiring(this._popup, dr);
        }
        if (menuEl) {
          menuEl.querySelectorAll(".qa-drawer").forEach((dr) => {
            dr.classList.toggle("is-open", dr.dataset.qaDrawer === next);
          });
          menuEl.querySelectorAll(".qa-item-parent").forEach((btn) => {
            btn.classList.toggle("qa-item-on", btn.dataset.qaSub === next);
          });
        } else {
          this._renderPopupEl();
          this._qaOpenDrawer(next);
        }
        return;
      }
      const qaDo = e.target.closest("[data-qa-do]");
      if (qaDo) {
        const k = qaDo.dataset.qaDo;
        if (k === "seerrWithdraw") this._qaWithdraw(this._popup);
        if (k === "lib") this._qaShowInLibrary(this._popup, this._qaLibTargets(this._popup)[0]?.inst);
        if (k === "queue") this._qaJumpToQueue(this._popup);
        return;
      }
      const qaLib = e.target.closest("[data-qa-lib]");
      if (qaLib) {
        this._qaShowInLibrary(this._popup, qaLib.dataset.qaLib);
        return;
      }
      const qaSn = e.target.closest("[data-qa-season-pick]");
      if (qaSn && this._ppSeasonPick) {
        const p = this._ppSeasonPick;
        p.sel = p.sel || /* @__PURE__ */ new Set();
        const key = qaSn.dataset.qaSeasonPick;
        const keys = (p.seasons || []).map((sn) => String(sn.key));
        if (key === "*") {
          const allOn = keys.length > 0 && keys.every((k) => p.sel.has(k));
          p.sel.clear();
          if (!allOn) keys.forEach((k) => p.sel.add(k));
        } else if (p.sel.has(key)) p.sel.delete(key);
        else p.sel.add(key);
        const dr = e.target.closest("[data-qa-menu]")?.querySelector(`[data-qa-drawer="${p.kind}"]`);
        if (dr) dr.innerHTML = this._qaSeasonRowsHtml();
        return;
      }
      const qaApply = e.target.closest("[data-qa-apply]");
      if (qaApply) {
        this._qaApplyPicks(qaApply.dataset.qaApply);
        return;
      }
      const qaRun = e.target.closest("[data-qa-run]");
      if (qaRun) {
        const kind = qaRun.dataset.qaRun;
        const col = qaRun.dataset.qaCol;
        const season = qaRun.dataset.qaSeason;
        if (!season && qaRun.dataset.qaType === "season") {
          this._ppSeasonPick = { kind, colId: col, seasons: null, sel: /* @__PURE__ */ new Set() };
          const dr = e.target.closest("[data-qa-menu]")?.querySelector(`[data-qa-drawer="${kind}"]`);
          if (dr) dr.innerHTML = this._qaSeasonRowsHtml();
          this._qaLoadSeasons(this._popup, dr);
          return;
        }
        this._qaRunMaintainerr(kind, col, this._popup, season || null);
        return;
      }
      if (this._ppMenu?.panel === "options" && !e.target.closest("[data-qa-menu]")) {
        this._ppMenu = null;
        this._renderPopupEl();
      }
      const _panelOpen = this._isState || this._asOpen || this._snIsOpen;
      if (_panelOpen && !e.target.closest(".is-panel, .sn-is-panel, .sn-is-section, .pp-hero-bar, .qa-menu")) {
        const panelEl = glass.querySelector(".is-panel, .sn-is-panel, .sn-is-section");
        const finish = () => {
          this._isState = null;
          this._isExpanded = false;
          this._asOpen = false;
          this._asExpanded = false;
          this._asState = null;
          this._snIsOpen = false;
          this._snIsExpanded = false;
          this._snIsState = null;
          this._snActiveIs = null;
          this._searchExpand = null;
          this._renderPopupEl();
        };
        if (panelEl) {
          panelEl.classList.add("pp-panel-out");
          setTimeout(finish, 220);
        } else finish();
        return;
      }
      if (!e.target.closest(".pp-hero-bar, .qa-menu, .is-panel, .sn-is-panel, .sn-is-section, .pp-grab, [data-is-page], [data-sn-spage], [data-issort], [data-isfil], [data-snisfilter], [data-snissort]") && (this._searchExpand || this._removeConfirm || this._removeArmed)) {
        this._searchExpand = null;
        this._removeConfirm = false;
        this._removeArmed = null;
        this._removeInstance = null;
        this._renderPopupEl();
        return;
      }
      const goneCol = e.target.closest("[data-gone-col]");
      if (goneCol) {
        const colId = parseInt(goneCol.dataset.goneCol);
        this._mtPopupReturn = {
          type: d._type,
          tmdbId: d.tmdbId ? String(d.tmdbId) : d.id ? String(d.id) : null,
          tvdbId: d.tvdbId ? String(d.tvdbId) : null,
          title: d.title || d.name || ""
        };
        this._popup = null;
        this._renderPopupEl();
        this._openMaintainerrModal("collections").then(() => {
          const el = this.shadowRoot.querySelector("[data-mt-modal]");
          if (!el || !this._maintainerrModal) return;
          this._maintainerrModal.colSubTab = "media";
          this._mtOpenCollectionDetail(colId, el);
        });
        return;
      }
      const t = e.target.closest("[data-action],[data-isfil],[data-snisfilter],[data-issort],[data-snissort],[data-grab],[data-sngrab],[data-guid],[data-sn-spage],[data-is-page]");
      if (!t) return;
      const _closeAS = () => {
        this._asOpen = false;
        this._asExpanded = false;
        this._asState = null;
        this._asMovieSearched = false;
        this._asNotFound = /* @__PURE__ */ new Set();
      };
      const _closeIS = () => {
        this._isState = null;
        this._isExpanded = false;
      };
      const _closeSnIS = () => {
        this._snIsOpen = false;
        this._snIsExpanded = false;
        this._snIsState = null;
        this._snActiveIs = null;
      };
      const _closeRemove = () => {
        this._removeConfirm = false;
      };
      if (t.dataset.action === "plex-cast-open") {
        if (this._plexCastOpen) {
          this._plexCastOpen = false;
          this._renderPopupEl();
          return;
        }
        this._plexCastOpen = true;
        this._plexClients = null;
        const rect = t.getBoundingClientRect();
        this._plexCastBtnRect = { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
        this._renderPopupEl();
        this._fetchPlexClients();
        return;
      }
      if (t.dataset.action === "search-expand") {
        _closeAS();
        _closeIS();
        _closeSnIS();
        _closeRemove();
        this._ppMenu = null;
        this._searchExpand = "pick";
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "search-collapse") {
        _closeAS();
        _closeIS();
        _closeSnIS();
        _closeRemove();
        this._searchExpand = null;
        this._searchPickInst = null;
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "search-pick-inst") {
        this._searchPickInst = t.dataset.instance;
        this._searchExpand = "pick-mode";
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "search-pick-as") {
        if (t.dataset.instance) this._searchPickInst = t.dataset.instance;
        _closeIS();
        _closeSnIS();
        _closeRemove();
        this._searchExpand = null;
        const dd2 = this._popup;
        const _isMovT2 = dd2._type === "radarr" || dd2._type === "movie";
        const inst = this._searchPickInst ?? (_isMovT2 ? dd2._radarrId ? "radarr" : dd2._radarr2Id ? "radarr2" : "radarr" : dd2._sonarrSeries ? "sonarr" : dd2._sonarr2Series ? "sonarr2" : "sonarr");
        if (this._asOpen && this._asInstance === inst) {
          this._asOpen = false;
          this._asState = null;
          this._renderPopupEl();
        } else {
          this._asOpen = true;
          this._asInstance = inst;
          this._asState = null;
          this._asMovieSearching = false;
          this._asMovieSearched = false;
          this._asSearchingItems = /* @__PURE__ */ new Set();
          this._asSearchedItems = /* @__PURE__ */ new Set();
          this._asError = null;
          if (_isMovT2) {
            const mId = inst === "radarr2" ? dd2._radarr2Id : dd2._radarrId;
            if (!mId) {
              this._asState = "confirm";
              this._renderPopupEl();
            } else {
              this._triggerRadarrAutoSearch(inst);
            }
          } else {
            const ss = inst === "sonarr2" ? dd2._sonarr2Series : dd2._sonarrSeries;
            this._asState = ss ? "seasons" : "confirm";
            this._renderPopupEl();
          }
        }
        return;
      }
      if (t.dataset.action === "search-pick-is") {
        if (t.dataset.instance) this._searchPickInst = t.dataset.instance;
        _closeAS();
        _closeRemove();
        this._searchExpand = null;
        const dd2 = this._popup;
        const _isMovT2 = dd2._type === "radarr" || dd2._type === "movie";
        const inst = this._searchPickInst ?? (_isMovT2 ? dd2._radarrId ? "radarr" : dd2._radarr2Id ? "radarr2" : "radarr" : dd2._sonarrSeries ? "sonarr" : dd2._sonarr2Series ? "sonarr2" : "sonarr");
        if (_isMovT2) {
          const radarrId = inst === "radarr2" ? dd2._radarr2Id : dd2._radarrId;
          if (this._isState && this._isInstance === inst && this._isState !== "loading") {
            this._isState = null;
            this._renderPopupEl();
          } else if (this._isState === "loading") {
            return;
          } else {
            _closeSnIS();
            this._isInstance = inst;
            this._isState = null;
            if (!radarrId) {
              this._isState = "confirm-add";
              this._renderPopupEl();
            } else {
              this._fetchInteractiveSearch(radarrId, inst);
            }
          }
        } else {
          if (this._snIsOpen && this._snIsInstance === inst) {
            this._snIsOpen = false;
            this._snActiveIs = null;
            this._snIsState = null;
            this._renderPopupEl();
          } else {
            _closeIS();
            this._snIsInstance = inst;
            this._snIsOpen = true;
            this._snActiveIs = null;
            this._snIsState = null;
            this._snSeasonsPage = 0;
            const seriesInInst = inst === "sonarr2" ? dd2._sonarr2Series : dd2._sonarrSeries;
            if (!seriesInInst) {
              this._snIsState = "confirm-add";
            }
            this._renderPopupEl();
          }
        }
        return;
      }
      if (t.dataset.action === "as-confirm-yes") {
        const dd = this._popup;
        const isMovT = dd._type === "radarr" || dd._type === "movie";
        if (isMovT) {
          this._triggerRadarrAutoSearch(this._asInstance);
        } else {
          this._addSeriesForAs(this._asInstance);
        }
        return;
      }
      if (t.dataset.action === "as-confirm-no") {
        this._asOpen = false;
        this._asState = null;
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "as-season-search") {
        const n = parseInt(t.dataset.season);
        this._triggerSonarrSeasonSearch(n, this._asInstance);
        return;
      }
      if (t.dataset.action === "as-ep-search") {
        const epId = parseInt(t.dataset.epid);
        const seasonN = parseInt(t.dataset.season);
        this._triggerSonarrEpisodeSearch(epId, seasonN, this._asInstance);
        return;
      }
      if (t.dataset.action === "ep-del-confirm") {
        this._epFileConfirm = parseInt(t.dataset.epid);
        this._seasonFileConfirm = null;
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "ep-del-no") {
        this._epFileConfirm = null;
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "ep-del-yes") {
        const efId = parseInt(t.dataset.efid);
        const seasonN = parseInt(t.dataset.season);
        const inst = this._asOpen ? this._asInstance : this._snIsInstance || "sonarr";
        this._epFileConfirm = null;
        this._deleteEpisodeFile(efId, seasonN, inst);
        return;
      }
      if (t.dataset.action === "season-del-confirm") {
        this._seasonFileConfirm = parseInt(t.dataset.season);
        this._epFileConfirm = null;
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "season-del-no") {
        this._seasonFileConfirm = null;
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "season-del-yes") {
        const seasonN = parseInt(t.dataset.season);
        const inst = this._asOpen ? this._asInstance : this._snIsInstance || "sonarr";
        this._seasonFileConfirm = null;
        this._deleteSeasonFiles(seasonN, inst);
        return;
      }
      if (t.dataset.action === "is-confirm-yes") {
        const radarrId = this._isInstance === "radarr2" ? this._popup._radarr2Id : this._popup._radarrId;
        this._fetchInteractiveSearch(radarrId, this._isInstance);
        return;
      }
      if (t.dataset.action === "is-confirm-no") {
        this._isState = null;
        this._renderPopupEl();
        return;
      }
      if (t.dataset.issort !== void 0) {
        const col = t.dataset.issort;
        if (this._isSort.col === col) {
          this._isSort = { col, dir: this._isSort.dir * -1 };
        } else {
          this._isSort = { col, dir: -1 };
        }
        this._renderPopupEl();
        return;
      }
      if (t.dataset.grab !== void 0) {
        this._grabRelease(t.dataset.grab, parseInt(t.dataset.indexerid));
        return;
      }
      if (t.dataset.action === "sn-confirm-yes") {
        this._addSeriesToSonarr(this._snIsInstance);
        return;
      }
      if (t.dataset.action === "sn-confirm-no") {
        this._snIsOpen = false;
        this._snIsState = null;
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "sn-season-toggle") {
        const n = parseInt(t.dataset.season);
        if (this._snExpandedSeasons.has(n)) {
          this._snExpandedSeasons.delete(n);
        } else {
          this._snExpandedSeasons.clear();
          this._snExpandedSeasons.add(n);
          this._snActiveIs = null;
          this._snIsState = null;
          if (!this._snEpisodes.has(n)) {
            const epInst = this._asOpen ? this._asInstance : this._snIsInstance;
            const activeSeries = epInst === "sonarr2" ? this._popup._sonarr2Series : this._popup._sonarrSeries;
            const sid = activeSeries?.id;
            if (sid) this._fetchSonarrEpisodes(sid, n, epInst);
          }
        }
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "popup-cast-toggle") {
        this._popupCastOpen = !this._popupCastOpen;
        this._popupCastPage = 0;
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "popup-cast-prev") {
        this._popupCastPage = Math.max(0, (this._popupCastPage || 0) - 1);
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "popup-cast-next") {
        this._popupCastPage = (this._popupCastPage || 0) + 1;
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "popup-monitor-expand") {
        this._popupMonExpand = !this._popupMonExpand;
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "popup-monitor-toggle") {
        if (this._popupMonBusy) return;
        this._markActivated();
        this._popupMonBusy = t.dataset.instance;
        this._renderPopupEl();
        this._togglePopupMonitor(t.dataset.instance);
        return;
      }
      if (t.dataset.action === "popup-monitor-add-confirm") {
        this._popupMonAddInst = t.dataset.instance;
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "popup-monitor-add-no") {
        this._popupMonAddInst = null;
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "popup-monitor-add-yes") {
        if (this._popupMonAddBusy) return;
        const inst = t.dataset.instance;
        if (inst?.startsWith("radarr")) this._addMovieToRadarr(inst, true);
        else this._addSeriesToSonarr(inst, true);
        return;
      }
      if (t.dataset.action === "popup-mon-search-as") {
        const inst = this._popupMonAddSearch;
        this._popupMonAddSearch = null;
        this._asOpen = true;
        this._asInstance = inst;
        this._asState = null;
        const d2 = this._popup;
        const isMovT = d2._type === "radarr" || d2._type === "movie";
        if (isMovT) this._triggerRadarrAutoSearch(inst);
        else {
          this._asState = "seasons";
          this._renderPopupEl();
        }
        return;
      }
      if (t.dataset.action === "popup-mon-search-is") {
        const inst = this._popupMonAddSearch;
        this._popupMonAddSearch = null;
        const d2 = this._popup;
        const isMovT = d2._type === "radarr" || d2._type === "movie";
        if (isMovT) {
          const radarrId = inst === "radarr2" ? d2._radarr2Id : d2._radarrId;
          this._isInstance = inst;
          this._fetchInteractiveSearch(radarrId, inst);
        } else {
          this._snIsInstance = inst;
          this._snIsOpen = true;
          this._snActiveIs = null;
          this._snIsState = null;
          this._snSeasonsPage = 0;
          this._renderPopupEl();
        }
        return;
      }
      if (t.dataset.action === "popup-mon-search-no") {
        this._popupMonAddSearch = null;
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "sn-season-monitor") {
        const n = parseInt(t.dataset.season);
        if (this._snMonitorBusy != null) return;
        const monInst = this._asOpen ? this._asInstance : this._snIsInstance;
        const monSeries = monInst === "sonarr2" ? this._popup?._sonarr2Series : this._popup?._sonarrSeries;
        if (!monSeries?.id) return;
        this._snMonitorBusy = n;
        this._renderPopupEl();
        this._toggleSeasonMonitor(monSeries, n, monInst);
        return;
      }
      if (t.dataset.action === "sn-season-is") {
        const n = parseInt(t.dataset.season);
        const isMobile2 = this._isMob;
        if (this._snActiveIs?.type === "season" && this._snActiveIs?.key === n) {
          this._snActiveIs = null;
          this._snIsState = null;
        } else {
          this._snActiveIs = { type: "season", key: n };
          this._snExpandedSeasons.clear();
          const snInst_s = this._asOpen ? this._asInstance : this._snIsInstance;
          const activeSn = snInst_s === "sonarr2" ? this._popup._sonarr2Series : this._popup._sonarrSeries;
          const sid = activeSn?.id;
          if (sid) {
            if (isMobile2) {
              this._renderPopupEl();
              this._fetchSonarrSeasonIS(sid, n, snInst_s);
            } else {
              this._fetchSonarrSeasonIS(sid, n, snInst_s);
            }
          }
        }
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "sn-ep-is") {
        const epId = parseInt(t.dataset.epid);
        const seasonN = parseInt(t.dataset.season);
        const isMobile2 = this._isMob;
        if (this._snActiveIs?.type === "episode" && this._snActiveIs?.key === epId) {
          this._snActiveIs = null;
          this._snIsState = null;
        } else {
          const eps = this._snEpisodes.get(seasonN) || [];
          const ep = eps.find((e2) => e2.id === epId);
          this._snActiveIs = {
            type: "episode",
            key: epId,
            seasonNumber: seasonN,
            epNum: ep?.episodeNumber ?? 0,
            label: ep?.title || ""
          };
          const snInst_ep = this._asOpen ? this._asInstance : this._snIsInstance;
          const activeSnEp = snInst_ep === "sonarr2" ? this._popup._sonarr2Series : this._popup._sonarrSeries;
          const sid = activeSnEp?.id;
          if (sid) {
            if (isMobile2) {
              this._renderPopupEl();
              this._fetchSonarrEpIS(epId, sid, snInst_ep);
            } else {
              this._fetchSonarrEpIS(epId, sid, snInst_ep);
            }
          }
        }
        this._renderPopupEl();
        return;
      }
      if (t.dataset.snisfilter !== void 0) {
        this._snIsFilter = t.dataset.snisfilter;
        this._renderPopupEl();
        return;
      }
      if (t.dataset.snissort !== void 0) {
        const col = t.dataset.snissort;
        if (this._snIsSort.col === col) {
          this._snIsSort = { col, dir: this._snIsSort.dir * -1 };
        } else {
          this._snIsSort = { col, dir: -1 };
        }
        this._renderPopupEl();
        return;
      }
      if (t.dataset.sngrab !== void 0) {
        this._sonarrGrab(t.dataset.sngrab, parseInt(t.dataset.indexerid));
        return;
      }
      {
        const snSpageBtn = t.closest("[data-sn-spage]") || (t.dataset.snSpage !== void 0 ? t : null);
        if (snSpageBtn) {
          const _snInst = this._snIsInstance || "sonarr";
          const series = _snInst === "sonarr2" ? this._popup?._sonarr2Series : this._popup?._sonarrSeries;
          const total = (series?.seasons || []).filter((s) => s.seasonNumber > 0).length;
          const totalPages = Math.max(1, Math.ceil(total / (this._snSeasonsPerPage || 6)));
          const val = snSpageBtn.dataset.snSpage;
          let p = this._snSeasonsPage || 0;
          if (val === "first") p = 0;
          else if (val === "prev") p = Math.max(0, p - 1);
          else if (val === "next") p = Math.min(totalPages - 1, p + 1);
          else if (val === "last") p = totalPages - 1;
          else p = parseInt(val) || 0;
          if (p !== this._snSeasonsPage) {
            this._snSeasonsPage = p;
            this._renderPopupEl();
          }
          return;
        }
      }
      {
        const isPageBtn = t.closest("[data-is-page]") || (t.dataset.isPage !== void 0 ? t : null);
        if (isPageBtn) {
          const visible = this._applyIsFilters(this._isResults || []);
          const totalPages = Math.max(1, Math.ceil(visible.length / (this._isPerPage || 8)));
          const val = isPageBtn.dataset.isPage;
          let p = this._isPage || 0;
          if (val === "first") p = 0;
          else if (val === "prev") p = Math.max(0, p - 1);
          else if (val === "next") p = Math.min(totalPages - 1, p + 1);
          else if (val === "last") p = totalPages - 1;
          else p = parseInt(val) || 0;
          if (p !== this._isPage) {
            this._isPage = p;
            this._renderPopupEl();
          }
          return;
        }
      }
      if (t.dataset.action === "sn-back") {
        this._snActiveIs = null;
        this._snIsState = null;
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "remove-confirm") {
        _closeAS();
        _closeIS();
        _closeSnIS();
        this._searchExpand = null;
        this._ppMenu = null;
        const pd = this._popup;
        const dualR = pd && pd._radarrId && pd._radarr2Id;
        const dualS = pd && pd._sonarrSeries?.id && pd._sonarr2Series?.id;
        if (dualR || dualS) {
          this._removeConfirm = "instance";
        } else {
          this._removeInstance = null;
          if (pd?._radarr2Id && !pd?._radarrId) this._removeInstance = "radarr2";
          else if (pd?._sonarr2Series?.id && !pd?._sonarrSeries?.id) this._removeInstance = "sonarr2";
          this._removeConfirm = "choose";
        }
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "remove-instance") {
        this._removeInstance = t.dataset.instance;
        this._removeConfirm = "choose";
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "remove-choose-lib" || t.dataset.action === "remove-choose-disc") {
        if (t.dataset.instance) this._removeInstance = t.dataset.instance;
        this._removeArmed = t.dataset.action === "remove-choose-disc" ? "disc" : "lib";
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "remove-armed-no") {
        this._removeArmed = null;
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "remove-armed-yes") {
        const disc = this._removeArmed === "disc";
        this._removeArmed = null;
        this._removeFromLibrary(disc, disc);
        return;
      }
      if (t.dataset.action === "remove-no") {
        this._removeArmed = null;
        this._removeConfirm = false;
        this._removeInstance = null;
        this._renderPopupEl();
        return;
      }
      if (t.dataset.action === "remove-yes") {
        this._markActivated();
        this._removeFromLibrary(t.dataset.files === "true");
        return;
      }
      if (t.dataset.action === "stream-playpause") {
        const entityId = t.dataset.entity;
        const curState = this._hass?.states?.[entityId]?.state;
        const supported = this._hass?.states?.[entityId]?.attributes?.supported_features || 0;
        const canPause = supported & 1;
        const canPlay = supported & 16384;
        const plexAction = curState === "playing" ? "pause" : "play";
        let svc;
        if (curState === "playing") {
          svc = canPause ? "media_pause" : canPlay ? "media_play_pause" : null;
        } else {
          svc = canPlay ? "media_play" : canPause ? "media_play_pause" : null;
        }
        if (svc) {
          try {
            this._hass.callService("media_player", svc, { entity_id: entityId });
          } catch (_) {
          }
        }
        if (!svc && this._popup?._plexMachineId) {
          this._hass.callApi("POST", "arr_stack/plex/player", {
            action: plexAction,
            machineIdentifier: this._popup._plexMachineId,
            playerUrl: this._popup._plexPlayerUrl || null
          }).catch(() => {
          });
        }
        const newState = curState === "playing" ? "paused" : "playing";
        if (this._popup?._streamEntity === entityId) {
          this._popup._streamState = newState;
          if (this._popup._type === POPUP_TYPE.STREAM) this._renderPopupEl();
          else {
            const btn = this.shadowRoot?.getElementById("popup-root")?.querySelector('[data-action="stream-playpause"]');
            if (btn) btn.innerHTML = `<ha-icon icon="mdi:${newState === "playing" ? "pause" : "play"}" style="--mdc-icon-size:32px"></ha-icon>`;
          }
        }
        return;
      }
      if (t.dataset.action === "stream-prev") {
        const _plexPrev = () => this._popup?._plexMachineId && this._hass.callApi("POST", "arr_stack/plex/player", {
          action: "skipPrevious",
          machineIdentifier: this._popup._plexMachineId,
          playerUrl: this._popup._plexPlayerUrl || null
        }).catch(() => {
        });
        this._hass.callService("media_player", "media_previous_track", { entity_id: t.dataset.entity }).catch(() => _plexPrev());
        setTimeout(() => {
          this._syncStreamPopup();
          this._reRenderSection("streams");
        }, 2e3);
        return;
      }
      if (t.dataset.action === "stream-next") {
        const _plexNext = () => this._popup?._plexMachineId && this._hass.callApi("POST", "arr_stack/plex/player", {
          action: "skipNext",
          machineIdentifier: this._popup._plexMachineId,
          playerUrl: this._popup._plexPlayerUrl || null
        }).catch(() => {
        });
        this._hass.callService("media_player", "media_next_track", { entity_id: t.dataset.entity }).catch(() => _plexNext());
        setTimeout(() => {
          this._syncStreamPopup();
          this._reRenderSection("streams");
        }, 2e3);
        return;
      }
      if (t.dataset.action === "stream-terminate-show") {
        const glass2 = this.shadowRoot?.querySelector(".popup-glass");
        if (!glass2) return;
        this._ppMenu = null;
        glass2.querySelector(".qa-menu")?.remove();
        glass2.querySelector(".qa-opt-btn")?.classList.remove("active");
        glass2.querySelector(".plex-terminate-modal")?.remove();
        const d2 = this._popup;
        const sessionId = t.dataset.sessionId;
        const userName = d2?._plexUser || "";
        const userThumb = d2?._plexUserThumb || "";
        const title = d2?.title || "";
        const isDay = this._isDaytime && this._config?.styles?.dayNightMode !== false;
        const fg = isDay ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)";
        const fgSub = isDay ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
        const bg = isDay ? "rgba(235,235,240,0.97)" : "rgba(16,16,26,0.97)";
        const inputBg = isDay ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.07)";
        const inputBd = isDay ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.12)";
        const avatarEl = userThumb ? `<img src="${this._escHtml(userThumb)}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid rgba(255,255,255,0.15)">` : "";
        const modal = document.createElement("div");
        modal.className = "plex-terminate-modal";
        modal.style.cssText = `position:absolute;inset:0;background:${bg};backdrop-filter:blur(12px);border-radius:inherit;z-index:50;display:flex;flex-direction:column;padding:20px 24px;gap:14px;overflow:auto`;
        modal.innerHTML = `
        <div style="font-size:15px;font-weight:700;color:${fg}">${this._t("terminateTitle")} \u2014 ${this._escHtml(title)}</div>
        <div style="display:flex;gap:12px;align-items:flex-start">
          ${avatarEl}
          <div style="font-size:13px;color:${fgSub};line-height:1.5">
            ${this._t("terminatePrompt")}
            ${userName ? `<br>${this._t("terminateUserHint")} <strong style="color:${fg}">${this._escHtml(userName)}</strong>.` : ""}
          </div>
        </div>
        <div>
          <div style="font-size:10px;font-weight:800;color:${fgSub};letter-spacing:0.1em;margin-bottom:6px">${this._t("terminateMsgLabel")}</div>
          <textarea id="stream-terminate-reason" rows="3" placeholder="${this._t("terminateDefault")}"
            style="width:100%;box-sizing:border-box;background:${inputBg};border:1px solid ${inputBd};border-radius:8px;padding:8px 10px;font-size:12px;color:${fg};outline:none;resize:none;font-family:inherit"></textarea>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:auto">
          <button data-action="stream-terminate-cancel" class="is-open-btn" style="justify-content:center;padding:0 12px;min-width:74px">${this._t("terminateCancel")}</button>
          <button data-action="stream-terminate-confirm" data-session-id="${this._escHtml(sessionId || "")}"
            class="is-open-btn remove-disc-btn" style="justify-content:center;padding:0 12px;min-width:74px">${this._t("terminateStop")}</button>
        </div>`;
        this._terminateActive = true;
        glass2.appendChild(modal);
        return;
      }
      if (t.dataset.action === "stream-terminate-cancel") {
        this._terminateActive = false;
        this.shadowRoot?.querySelector(".plex-terminate-modal")?.remove();
        return;
      }
      if (t.dataset.action === "stream-terminate-confirm") {
        this._markActivated();
        const sessionId = t.dataset.sessionId;
        if (!sessionId && !this._popup?._jfSessionId && !this._popup?._embySessionId && !this._popup?._kodiEntityId) return;
        const modal = this.shadowRoot?.querySelector(".plex-terminate-modal");
        const reason = (modal?.querySelector("#stream-terminate-reason")?.value || "").trim() || this._t("terminateDefault");
        const stopBtn = this.shadowRoot?.querySelector('[data-action="stream-terminate-show"]');
        const stopSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`;
        const checkSvgInline = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        this._terminateActive = false;
        modal?.remove();
        t.disabled = true;
        if (this._popup) {
          const d2 = this._popup;
          if (d2._streamState === "playing") {
            const elapsed = (Date.now() - (d2._updatedAt || Date.now())) / 1e3;
            d2._position = Math.min((d2._position || 0) + elapsed, d2._duration || 0);
            d2._updatedAt = Date.now();
            d2._streamState = "paused";
          }
          d2._plexTerminated = true;
        }
        if (this._popup?._jfSessionId) {
          this._callApi("POST", "arr_stack/jellyfin/stop", { session_id: this._popup._jfSessionId, message: reason }).catch(() => {
          });
        } else if (this._popup?._embySessionId) {
          this._callApi("POST", "arr_stack/emby/stop", { session_id: this._popup._embySessionId, message: reason }).catch(() => {
          });
        } else if (this._popup?._kodiEntityId) {
          this._callApi("POST", "arr_stack/kodi/stop", { entity_id: this._popup._kodiEntityId, message: reason }).catch(() => {
          });
        } else {
          this._callApi("DELETE", "arr_stack/plex/session/terminate", { sessionId, reason }).catch(() => {
          });
        }
        if (stopBtn) {
          stopBtn.innerHTML = `<ha-icon icon="mdi:loading" style="--mdc-icon-size:14px;animation:btn-spin 0.65s linear infinite"></ha-icon> ${this._t("stopPlayback")}`;
          stopBtn.disabled = true;
          setTimeout(() => {
            if (stopBtn) stopBtn.innerHTML = `${checkSvgInline} ${this._t("stopPlayback")}`;
            setTimeout(() => {
              if (this._popup) {
                this._popup._plexSessionId = null;
                this._popup._jfSessionId = null;
                this._popup._embySessionId = null;
                this._popup._kodiEntityId = null;
              }
              this._renderPopupEl();
              this._reRenderSection?.("streams");
            }, 600);
          }, 1e3);
        } else {
          setTimeout(() => {
            if (this._popup) {
              this._popup._plexSessionId = null;
              this._popup._jfSessionId = null;
              this._popup._embySessionId = null;
              this._popup._kodiEntityId = null;
            }
            this._renderPopupEl();
            this._reRenderSection?.("streams");
          }, 1e3);
        }
        return;
      }
      if (t.dataset.action === "stream-seek") {
        const rect = t.getBoundingClientRect();
        const clientX = e.clientX ?? e.changedTouches?.[0]?.clientX ?? 0;
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const dur = parseFloat(t.dataset.dur);
        if (dur > 0) {
          const newPos = pct * dur;
          this._updateStreamFills(t.dataset.entity, newPos, dur);
          this._doSeek(t.dataset.entity, newPos);
        }
        return;
      }
    });
    const seekWrap = root.querySelector(".stream-seek-wrap");
    if (seekWrap) {
      const applySeek = (clientX, commit) => {
        const rect = seekWrap.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const dur = parseFloat(seekWrap.dataset.dur);
        const eid = seekWrap.dataset.entity;
        if (dur > 0 && eid) {
          const newPos = pct * dur;
          this._updateStreamFills(eid, newPos, dur);
          if (commit) this._doSeek(eid, newPos);
        }
      };
      seekWrap.addEventListener("touchstart", (e) => {
        e.preventDefault();
        applySeek(e.touches[0].clientX, true);
      }, { passive: false });
      seekWrap.addEventListener("touchmove", (e) => {
        e.preventDefault();
        applySeek(e.touches[0].clientX, false);
      }, { passive: false });
      seekWrap.addEventListener("touchend", (e) => {
        e.preventDefault();
        applySeek(e.changedTouches[0].clientX, true);
      }, { passive: false });
    }
    const isPanel = root.querySelector(".is-panel");
    if (isPanel) {
      let _swipeX = null;
      isPanel.addEventListener("touchstart", (e) => {
        _swipeX = e.touches[0].clientX;
      }, { passive: true });
      isPanel.addEventListener("touchend", (e) => {
        if (_swipeX === null) return;
        const dx = e.changedTouches[0].clientX - _swipeX;
        _swipeX = null;
        if (Math.abs(dx) < 40) return;
        const visible = this._applyIsFilters(this._isResults || []);
        const totalPages = Math.max(1, Math.ceil(visible.length / (this._isPerPage || 8)));
        const p = dx < 0 ? Math.min(totalPages - 1, (this._isPage || 0) + 1) : Math.max(0, (this._isPage || 0) - 1);
        if (p !== this._isPage) {
          this._isPage = p;
          this._renderPopupEl();
        }
      }, { passive: true });
    }
    if (glass) glass.addEventListener("change", (e) => {
      const sel = e.target.closest("[data-isselect],[data-snisselect]");
      if (!sel) return;
      if (sel.dataset.isselect !== void 0) {
        this._isFilters = { ...this._isFilters, [sel.dataset.isselect]: sel.value };
        this._isPage = 0;
      } else if (sel.dataset.snisselect !== void 0) {
        this._snIsFilters = { ...this._snIsFilters, [sel.dataset.snisselect]: sel.value };
      }
      this._renderPopupEl();
    });
    if (this._popup?._type === POPUP_TYPE.STREAM || this._popup?._streamEntity) {
      const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
      this._streamPopupTimer = setInterval(() => {
        const fill = root.querySelector(".stream-prog-fill");
        const timeEl = root.querySelector(".stream-popup-time");
        if (!fill) return;
        const pos = parseFloat(fill.dataset.pos);
        const dur = parseFloat(fill.dataset.dur);
        const updatedAt = parseFloat(fill.dataset.updated);
        if (!dur) return;
        const playing = this._popup?._streamState === "playing";
        const elapsed = playing ? (Date.now() - updatedAt) / 1e3 : 0;
        const current = Math.min(pos + elapsed, dur);
        fill.style.width = (current / dur * 100).toFixed(2) + "%";
        if (timeEl) timeEl.textContent = `${fmt(current)} / ${fmt(dur)}`;
      }, 1e3);
    }
  }
  // Season monitoring toggle button — bookmark outline/filled, spinner while saving
  _snMonitorBtn(season) {
    const n = season.seasonNumber;
    if (this._snMonitorBusy === n) {
      return `<button class="btn-person" disabled><span class="action-spinner" style="width:11px;height:11px;border-width:1.5px"></span></button>`;
    }
    const mon = !!season.monitored;
    const icon = mon ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>` : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
    const title = mon ? this._cfg?.localisation === "cs" ? "Monitorov\xE1no \u2014 kliknut\xEDm vypne\u0161" : "Monitored \u2014 click to unmonitor" : this._cfg?.localisation === "cs" ? "Nemonitorov\xE1no \u2014 kliknut\xEDm zapne\u0161" : "Not monitored \u2014 click to monitor";
    return `<button class="btn-person${mon ? " active" : ""}" data-action="sn-season-monitor" data-season="${n}" title="${title}">${icon}</button>`;
  }
  // Toggle movie/series monitored flag from popup title bookmark
  async _togglePopupMonitor(inst) {
    const d = this._popup;
    try {
      if (inst === "radarr" || inst === "radarr2") {
        const arr = inst === "radarr2" ? this._radarr2 : this._radarr;
        const id = inst === "radarr2" ? d?._radarr2Id : d?._radarrId;
        const movie = (arr || []).find((m) => m.id === id);
        if (movie) {
          const fresh = await this._callApi("PUT", `arr_stack/${inst}/movie/${id}`, { ...movie, monitored: !movie.monitored });
          const upd = fresh && fresh.id ? fresh : { ...movie, monitored: !movie.monitored };
          const i = arr.findIndex((m) => m.id === id);
          if (i >= 0) arr[i] = { ...arr[i], ...upd };
        }
      } else {
        const series = inst === "sonarr2" ? d?._sonarr2Series : d?._sonarrSeries;
        if (series?.id) {
          const pool = inst === "sonarr2" ? this._sonarr2 : this._sonarr;
          const cur = (pool || []).find((s) => s.id === series.id) || series;
          const fresh = await this._callApi("PUT", `arr_stack/${inst}/series/${series.id}`, { ...cur, monitored: !cur.monitored });
          const upd = fresh && fresh.id ? fresh : { ...cur, monitored: !cur.monitored };
          if (inst === "sonarr2") {
            if (d?._sonarr2Series?.id === series.id) d._sonarr2Series = upd;
          } else if (d?._sonarrSeries?.id === series.id) {
            d._sonarrSeries = upd;
          }
          for (const p of inst === "sonarr2" ? [this._sonarr2] : [this._sonarr, this._sonarrAll]) {
            const i = (p || []).findIndex((s) => s.id === series.id);
            if (i >= 0) p[i] = { ...p[i], ...upd };
          }
        }
      }
    } catch (e) {
      console.error("[arr-card] popup monitor toggle failed:", e);
    }
    this._popupMonBusy = null;
    this._renderPopupEl();
  }
  // Toggle season monitored flag via Sonarr PUT /series/{id}
  async _toggleSeasonMonitor(series, seasonNumber, inst) {
    try {
      const svc = inst === "sonarr2" ? "sonarr2" : "sonarr";
      const updated = {
        ...series,
        seasons: (series.seasons || []).map((s) => s.seasonNumber === seasonNumber ? { ...s, monitored: !s.monitored } : s)
      };
      const res = await this._callApi("PUT", `arr_stack/${svc}/series/${series.id}`, updated);
      const fresh = res && res.id ? res : updated;
      if (inst === "sonarr2") {
        if (this._popup?._sonarr2Series?.id === series.id) this._popup._sonarr2Series = fresh;
        const i = (this._sonarr2 || []).findIndex((s) => s.id === series.id);
        if (i >= 0) this._sonarr2[i] = fresh;
      } else {
        if (this._popup?._sonarrSeries?.id === series.id) this._popup._sonarrSeries = fresh;
        for (const pool of [this._sonarr, this._sonarrAll]) {
          const i = (pool || []).findIndex((s) => s.id === series.id);
          if (i >= 0) pool[i] = fresh;
        }
      }
    } catch (e) {
      console.error("[arr-card] season monitor toggle failed:", e);
    }
    this._snMonitorBusy = null;
    this._renderPopupEl();
  }
  // Sonarr instance chip — episode counts from monitored seasons
  // green = all monitored episodes downloaded, blue = incomplete or not monitored
  _snInstChip(chipFn, label, entry, pct, inst = null) {
    if (!entry) return chipFn(label, "none", null, inst);
    if (pct !== null) return chipFn(label, "downloading", pct, inst);
    const notMonitored = !entry.monitored;
    if (notMonitored) {
      const nm = this._cfg?.localisation === "cs" ? "nemonitorov\xE1no" : "not monitored";
      return chipFn(label ? `${label} \u2014 ${nm}` : nm, "added", null, inst);
    }
    const efc = entry.statistics?.episodeFileCount ?? 0;
    const ec = entry.statistics?.episodeCount ?? 0;
    const cnt = `${efc}/${ec}`;
    const complete = ec > 0 && efc >= ec;
    return chipFn(label ? `${label} ${cnt}` : cnt, complete ? "available" : "partial", null, inst);
  }
  _renderPopup() {
    const d = this._popup;
    if (!d) return "";
    if (d._loading) {
      return `
      <div class="popup-overlay">
        <div class="popup-glass" style="align-items:center;justify-content:center;min-height:200px">
          <button class="popup-close"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          <div style="color:rgba(255,255,255,0.7);font-size:13px">${this._t("loadingDetail")}</div>
        </div>
      </div>`;
    }
    if (d._type === POPUP_TYPE.STREAM) return this._renderStreamPopup(d);
    if (d._infoOnly) {
      const _year = d.releaseDate ? d.releaseDate.slice(0, 4) : d.firstAirDate ? d.firstAirDate.slice(0, 4) : "";
      const _genres = (d.genres || []).map((g) => this._escHtml(g.name || "")).filter(Boolean).join(" \xB7 ");
      const _rating = d.voteAverage ? d.voteAverage.toFixed(1) : "";
      const _overview = this._escHtml(d.overview || "");
      const _subLine = [_year, _genres, _rating ? `\u2B50 ${_rating}` : ""].filter(Boolean).join(" \xB7 ");
      const _posterUrl = d.posterPath ? d.posterPath.startsWith("http") ? d.posterPath : `https://image.tmdb.org/t/p/w342${d.posterPath}` : d._localPosterUrl || "";
      const _backdropUrl = d.backdropPath ? `https://image.tmdb.org/t/p/w1280${d.backdropPath}` : d._localBackdropUrl || "";
      const _videos = Array.isArray(d.relatedVideos) ? d.relatedVideos : [];
      const _trailer = _videos.find((v) => v.site === "YouTube" && v.type === "Trailer") || _videos.find((v) => v.site === "YouTube");
      const _trailerHtml = _trailer ? `<a class="popup-yt-thumb" href="https://www.youtube.com/watch?v=${encodeURIComponent(_trailer.key)}" target="_blank" rel="noopener noreferrer"><img src="https://img.youtube.com/vi/${encodeURIComponent(_trailer.key)}/hqdefault.jpg" loading="lazy" onerror="this.style.display='none'"/><div class="popup-yt-overlay"><div class="popup-yt-btn">\u25B6 ${this._t("watchTrailer")}</div></div></a>` : "";
      const _hdrStyle = _backdropUrl ? `background-image:url('${_backdropUrl}');background-size:cover;background-position:center top` : _posterUrl ? `background-image:url('${_posterUrl}');background-size:cover;background-position:center;filter:blur(6px) brightness(0.4)` : "background:linear-gradient(135deg,rgba(20,20,40,1),rgba(40,20,60,1))";
      return `
      <div class="popup-overlay${dayClass(this)}">
        <div class="popup-glass" style="max-width:600px;width:calc(100vw - 32px);padding:0;gap:0;max-height:calc(100vh - 60px);overflow-y:auto;position:relative">
          <button class="popup-close" style="position:absolute;top:10px;right:10px;z-index:2">${ICONS.close}</button>
          <div style="height:160px;${_hdrStyle};position:relative;flex-shrink:0">
            ${_posterUrl ? `<img src="${_posterUrl}" style="position:absolute;bottom:-32px;left:16px;width:72px;height:108px;object-fit:cover;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.5)" loading="lazy" onerror="this.style.display='none'"/>` : ""}
          </div>
          <div style="padding:${_posterUrl ? "44px" : "16px"} 16px 16px ${_posterUrl ? "100px" : "16px"}">
            <div style="font-size:15px;font-weight:700;color:var(--is-text);line-height:1.3">${this._escHtml(d.title || d.name || "")}</div>
            ${_subLine ? `<div style="font-size:11px;color:var(--is-text-muted);margin-top:3px">${_subLine}</div>` : ""}
          </div>
          ${_overview ? `<div style="padding:0 16px 12px;font-size:12px;color:var(--is-text-sec);line-height:1.6">${_overview}</div>` : ""}
          ${_trailerHtml ? `<div style="padding:0 16px 16px">${_trailerHtml}</div>` : ""}
        </div>
      </div>`;
    }
    if (d._fromActivity) {
      const actTitle = this._escHtml(d.title || d.name || "");
      const isPanel = this._isState ? this._renderIsPanel() : "";
      const snPanel = this._snIsOpen ? this._renderSonarrIsSection() : "";
      return `
      <div class="popup-overlay${dayClass(this)}">
        <div class="popup-glass" style="width:min(900px, 94vw);padding:0;gap:0;max-height:calc(100vh - 80px);overflow-y:auto;overflow-x:hidden;position:relative">
          <button class="popup-close" style="position:absolute;top:12px;right:12px">${ICONS.close}</button>
          <div style="font-size:14px;font-weight:600;color:var(--is-text);margin-bottom:12px;padding:16px 48px 0 16px">${actTitle}</div>
          ${isPanel}${snPanel}
        </div>
      </div>`;
    }
    if (d._error) {
      return `
      <div class="popup-overlay">
        <div class="popup-glass" style="align-items:center;justify-content:center;min-height:200px;padding:24px">
          <button class="popup-close"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          <div style="color:rgba(255,255,255,0.7);font-size:13px;text-align:center">
            \u26A0 ${this._escHtml(d._error)}<br>
            <span style="font-size:11px;color:rgba(255,255,255,0.45)">${this._escHtml(d.title || "")}</span>
          </div>
        </div>
      </div>`;
    }
    const title = this._escHtml(d.title || d.name || "");
    const year = d.releaseDate ? d.releaseDate.slice(0, 4) : d.firstAirDate ? d.firstAirDate.slice(0, 4) : "";
    const genres = (d.genres || []).map((g) => this._escHtml(g.name || "")).filter(Boolean).join(" \xB7 ");
    const rating = d.voteAverage ? d.voteAverage.toFixed(1) : "";
    const overview = this._escHtml(d.overview || "");
    const _isSeriesPopup = d._type === POPUP_TYPE.SONARR || d._type === POPUP_TYPE.TV;
    let seasonsLine = "";
    if (_isSeriesPopup) {
      const snCount = d._sonarrSeries?.statistics?.seasonCount ?? d._sonarr2Series?.statistics?.seasonCount ?? d.numberOfSeasons ?? 0;
      if (snCount > 0) seasonsLine = this._tSeasons(snCount);
    }
    const subLine = [year, seasonsLine, genres].filter(Boolean).join(" \xB7 ");
    const backdropPath = d.backdropPath || null;
    const posterPath = d.posterPath || null;
    const backdropUrl = backdropPath ? `https://image.tmdb.org/t/p/w1280${backdropPath}` : d._localBackdropUrl || "";
    const posterUrl = posterPath ? posterPath.startsWith("http") ? posterPath : `https://image.tmdb.org/t/p/w342${posterPath}` : d._localPosterUrl || "";
    const backdropStyle = backdropUrl ? `background-image:url('${backdropUrl}')` : posterUrl ? `background-image:url('${posterUrl}');background-size:cover;background-position:center;filter:blur(6px) brightness(0.4)` : "background:linear-gradient(135deg,rgba(20,20,40,1),rgba(40,20,60,1))";
    const videos = Array.isArray(d.relatedVideos) ? d.relatedVideos : [];
    const trailer = videos.find((v) => v.site === "YouTube" && v.type === "Trailer") || videos.find((v) => v.site === "YouTube");
    const trailerHtml = trailer ? `<a class="popup-yt-thumb"
         href="https://www.youtube.com/watch?v=${encodeURIComponent(trailer.key)}"
         target="_blank" rel="noopener noreferrer">
         <img src="https://img.youtube.com/vi/${encodeURIComponent(trailer.key)}/hqdefault.jpg"
              loading="lazy" onerror="this.style.display='none'" />
         <div class="popup-yt-overlay">
           <div class="popup-yt-btn">\u25B6 ${this._t("watchTrailer")}</div>
         </div>
       </a>` : "";
    const posterHtml = posterUrl ? `<img class="popup-poster" src="${posterUrl}" loading="lazy" onerror="this.style.display='none'" />` : "";
    const _castList = (d.credits?.cast || []).filter((c) => c.name);
    let castPanelHtml = "";
    if (this._popupCastOpen && _castList.length) {
      const PER = window.innerWidth <= 600 ? 3 : 6;
      const castPages = Math.max(1, Math.ceil(_castList.length / PER));
      const castPg = Math.min(this._popupCastPage || 0, castPages - 1);
      const slice = _castList.slice(castPg * PER, castPg * PER + PER);
      const items = slice.map((c) => {
        const pp = c.profilePath || c.profile_path;
        const img = pp ? `https://image.tmdb.org/t/p/w185${pp}` : null;
        const initials = this._escHtml(c.name.split(" ").map((w) => w[0] || "").slice(0, 2).join("").toUpperCase());
        return `<div class="popup-cast-item">
        ${img ? `<img src="${img}" loading="lazy">` : `<div class="popup-cast-ph">${initials}</div>`}
        <div class="popup-cast-name">${this._escHtml(c.name)}</div>
        <div class="popup-cast-role">${this._escHtml(c.character || "")}</div>
      </div>`;
      }).join("");
      const _chevL = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
      const _chevR = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
      const nav = castPages > 1 ? `<button class="popup-cast-arrow popup-cast-arrow--l" data-action="popup-cast-prev"${castPg === 0 ? " disabled" : ""}>${_chevL}</button>
         <button class="popup-cast-arrow popup-cast-arrow--r" data-action="popup-cast-next"${castPg >= castPages - 1 ? " disabled" : ""}>${_chevR}</button>
         <span class="popup-cast-pg">${castPg + 1} / ${castPages}</span>` : "";
      castPanelHtml = `<div class="popup-cast-panel"><div class="popup-cast-grid">${items}</div>${nav}</div>`;
    }
    const castGroupSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
    const castToggleBtn = _castList.length ? `<button class="popup-cast-fab${this._popupCastOpen ? " active" : ""}" data-action="popup-cast-toggle">${castGroupSvg} ${this._cfg?.localisation === "cs" ? "Obsazen\xED" : "Cast"}</button>` : "";
    const isAdmin = this._hass.user.is_admin;
    const isMovieType = d._type === POPUP_TYPE.RADARR || d._type === POPUP_TYPE.MOVIE;
    const isSonarrType = d._type === POPUP_TYPE.SONARR || d._type === POPUP_TYPE.TV;
    const isConfirmAdd = this._isState === "confirm-add";
    const isActive = !!this._isState && !isConfirmAdd;
    const snConfirmAdd = this._snIsOpen && this._snIsState === "confirm-add";
    const snIsActive = this._snIsOpen && !snConfirmAdd;
    const personIconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>`;
    const searchSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`;
    const chevRSvg = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;
    const MAX_INST_LBL = 10;
    const _instLabels = (n1, n2, fb1, fb2) => {
      const use = n1 && n2 && n1.length <= MAX_INST_LBL && n2.length <= MAX_INST_LBL;
      return use ? [n1, n2] : [fb1, fb2];
    };
    const hasDualRadarr = !!this._radarr2Configured;
    const hasDualSonarr = !!this._sonarr2Configured;
    const singleInstance = d._radarrId ? "radarr" : d._radarr2Id ? "radarr2" : "radarr";
    const [isl1, isl2] = this._seerrRadarr2?.is4k ? ["HD", "4K"] : _instLabels(this._seerrRadarr?.name, this._seerrRadarr2?.name, "Radarr 1", "Radarr 2");
    const _re1 = d._radarrId ? (this._radarr || []).find((m) => m.id === d._radarrId) : null;
    const _re2 = d._radarr2Id ? (this._radarr2 || []).find((m) => m.id === d._radarr2Id) : null;
    const _se1 = d._sonarrSeries?.id ? (this._sonarr || []).find((s) => s.id === d._sonarrSeries.id) : null;
    const _se2 = d._sonarr2Series?.id ? (this._sonarr2 || []).find((s) => s.id === d._sonarr2Series.id) : null;
    const rInLib1 = !!_re1?.hasFile;
    const rInLib2 = !!_re2?.hasFile;
    const snInLib1 = _se1?.statistics?.episodeFileCount > 0;
    const snInLib2 = _se2?.statistics?.episodeFileCount > 0;
    const asActive = this._asOpen;
    const _isMovieType = d._type === "radarr" || d._type === "movie";
    const asConfirmOnly = asActive && this._asState === "confirm";
    const asMovieActive = asActive && _isMovieType && !asConfirmOnly;
    const asSonarrActive = asActive && !_isMovieType && !asConfirmOnly;
    const _asLoading = (inst) => this._asInstance === inst && (this._asMovieSearching || asActive && this._asState === "adding");
    const _asDone = (inst) => this._asInstance === inst && (this._asState === "done" || this._asMovieSearched);
    const _asErr = (inst) => this._asInstance === inst && this._asState === "error";
    const _asSpinner = `<span class="action-spinner" style="width:12px;height:12px;border-width:1.5px"></span>`;
    const _movieDlPct = (inst) => {
      const mId = inst === "radarr2" ? d._radarr2Id : d._radarrId;
      if (!mId) return null;
      const qPct = inst === "radarr2" ? this._radarr2QueuePct || /* @__PURE__ */ new Map() : this._radarrQueuePct || /* @__PURE__ */ new Map();
      return qPct.has(mId) ? qPct.get(mId) : null;
    };
    const _seriesDlPct = (inst) => {
      const series = inst === "sonarr2" ? d._sonarr2Series : d._sonarrSeries;
      if (!series?.id) return null;
      const qPct = inst === "sonarr2" ? this._sonarr2QueueSeriesPct || /* @__PURE__ */ new Map() : this._sonarrQueueSeriesPct || /* @__PURE__ */ new Map();
      return qPct.has(series.id) ? qPct.get(series.id) : null;
    };
    const _inLibCls = (inLib, inst) => inLib && _movieDlPct(inst) === null ? " in-lib" : "";
    const _snInLibCls = (inLib, inst) => inLib && _seriesDlPct(inst) === null ? " in-lib" : "";
    const collXSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    let searchBtnHtml = "";
    let searchMenuRows = "";
    if (isAdmin && (isMovieType || isSonarrType) && !d._noIS) {
      const open = !!this._searchExpand;
      const lit = open || this._asOpen || !!this._isState || this._snIsOpen;
      const _chev = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
      searchBtnHtml = `<div class="is-btn-row">
      <button class="is-open-btn is-search-btn${lit ? " active" : ""}" data-action="${lit ? "search-collapse" : "search-expand"}">${searchSvg}<span class="pp-lbl">Search ${_chev}</span></button>
    </div>`;
      const _asRow = (inst, label, indent) => {
        const key = `movie:${inst}`;
        const spinning = this._asPolling.has(key) || this._asMovieSearching || this._asOpen && this._asState === "adding" && this._asInstance === inst;
        const icon = spinning ? _asSpinner : searchSvg;
        const notFound = this._asNotFound.has(key);
        const downloading = this._asDownloadingItems.has(key);
        const active = this._asOpen && this._asInstance === inst;
        const tail = notFound ? `<span class="qa-air-date" style="color:rgba(255,149,0,1)">${this._t("asNotFound")}</span>` : downloading ? `<span class="qa-air-date" style="color:rgba(48,209,88,1)">\u2193</span>` : "";
        return `<button class="qa-item${indent ? " qa-sub-item" : ""}${active ? " qa-item-on" : ""}" data-action="search-pick-as" data-instance="${inst}"><span class="qa-ico">${icon}</span><span>${label}</span>${tail}</button>`;
      };
      const _isRow = (inst, label, indent) => {
        const active = isMovieType ? !!this._isState && this._isInstance === inst : this._snIsOpen && this._snIsInstance === inst;
        return `<button class="qa-item${indent ? " qa-sub-item" : ""}${active ? " qa-item-on" : ""}" data-action="search-pick-is" data-instance="${inst}"><span class="qa-ico">${personIconSvg}</span><span>${label}</span></button>`;
      };
      const dual = isMovieType ? hasDualRadarr : hasDualSonarr;
      const insts = isMovieType ? ["radarr", "radarr2"] : ["sonarr", "sonarr2"];
      const labels = isMovieType ? [isl1, isl2] : _instLabels(this._seerrSonarr?.name, this._seerrSonarr2?.name, "Sonarr 1", "Sonarr 2");
      const block = (inst, indent) => `${_asRow(inst, "Automatic", indent)}${_isRow(inst, "Interactive", indent)}`;
      const chevR = `<svg class="qa-chev" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
      searchMenuRows = dual ? insts.map((inst, n) => {
        const key = `inst:${inst}`;
        const on = this._ppMenu?.sub === key;
        return `<div class="qa-group">
            <button class="qa-item qa-item-parent${on ? " qa-item-on" : ""}" data-qa-sub="${key}">
              <span class="qa-ico">${this._appIcon(isMovieType ? "radarr" : "sonarr", 16)}</span><span>${this._escHtml(labels[n])}</span>${chevR}
            </button>
            <div class="qa-drawer" data-qa-drawer="${key}">${block(inst, true)}</div>
          </div>`;
      }).join("") : block(insts[0], false);
    }
    const trashSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
    const stopSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`;
    const checkSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    const crossSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    const canRemoveRadarr = isAdmin && isMovieType && (d._radarrId || d._radarr2Id);
    const canRemoveSonarr = isAdmin && isSonarrType && (d._sonarrSeries?.id || d._sonarr2Series?.id);
    const radarrEntry = d._radarrId ? (this._radarr || []).find((m) => m.id === d._radarrId) : null;
    const radarr2Entry = d._radarr2Id ? (this._radarr2 || []).find((m) => m.id === d._radarr2Id) : null;
    const sonarrEntry = d._sonarrSeries?.id ? (this._sonarr || []).find((s) => s.id === d._sonarrSeries.id) : null;
    const sonarr2Entry = d._sonarr2Series?.id ? (this._sonarr2 || []).find((s) => s.id === d._sonarr2Series.id) : null;
    const hasFiles = !!(radarrEntry?.hasFile || radarr2Entry?.hasFile || sonarrEntry?.statistics?.episodeFileCount > 0 || sonarr2Entry?.statistics?.episodeFileCount > 0);
    const _instStatus = (entry, qActive, qFailed) => {
      if (!entry) return "none";
      const hasF = entry.hasFile || entry.statistics?.episodeFileCount > 0;
      if (qFailed?.has(entry.id)) return "failed";
      if (qActive?.has(entry.id)) return "downloading";
      if (!entry.monitored) return "unmonitored";
      if (hasF) return "available";
      return "missing";
    };
    const _dlSvgSm = `<svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/></svg>`;
    const _grabWaiting = (inst) => {
      const w = this._ppGrabWait;
      if (!w || w.inst !== inst) return false;
      if (Date.now() > w.until) {
        this._ppGrabWait = null;
        return false;
      }
      const openId = inst === "radarr" ? this._popup?._radarrId : inst === "radarr2" ? this._popup?._radarr2Id : inst === "sonarr" ? this._popup?._sonarrSeries?.id : this._popup?._sonarr2Series?.id;
      return w.id == null || String(w.id) === String(openId);
    };
    const _instChip = (label, status, pct = null, inst = null) => {
      if (inst && status !== "downloading" && _grabWaiting(inst)) {
        return `<span class="inst-chip ic--downloading">${label}<span class="is-spin" style="margin-left:5px;width:9px;height:9px;border-width:1.5px"></span></span>`;
      }
      if (status === "unmonitored") {
        const nm = this._cfg?.localisation === "cs" ? "nemonitorov\xE1no" : "not monitored";
        return `<span class="inst-chip ic--added">${label ? `${label} \u2014 ${nm}` : nm}</span>`;
      }
      const map = {
        available: { cls: "ic--available", icon: "\u2713" },
        downloading: { cls: "ic--downloading", icon: "" },
        failed: { cls: "ic--failed", icon: "\u2717" },
        missing: { cls: "ic--missing", icon: "\u2717" },
        added: { cls: "ic--added", icon: "" },
        partial: { cls: "ic--partial", icon: "" },
        none: { cls: "ic--none", icon: "\u2013" }
      };
      const { cls } = map[status] || map.none;
      if (status === "downloading") {
        const p = pct ?? 0;
        const barHtml = `<div style="display:inline-flex;align-items:center;gap:3px;margin-left:4px;vertical-align:middle"><div style="width:36px;height:3px;background:rgba(59,130,246,0.20);border-radius:2px;overflow:hidden;display:inline-block;vertical-align:middle"><div style="width:${Math.max(p, 4)}%;height:100%;background:#3b82f6;border-radius:2px"></div></div><span style="font-size:9px;color:#3b82f6;font-weight:700;white-space:nowrap">${p}%</span></div>`;
        return `<span class="inst-chip ${cls}">${label}${barHtml}</span>`;
      }
      const { icon } = map[status] || map.none;
      return `<span class="inst-chip ${cls}">${label}${icon ? ` <span class="ic-icon">${icon}</span>` : ""}</span>`;
    };
    const _chipMoviePct = (inst) => {
      const mId = inst === "radarr2" ? d._radarr2Id : d._radarrId;
      if (!mId) return null;
      const qPct = inst === "radarr2" ? this._radarr2QueuePct || /* @__PURE__ */ new Map() : this._radarrQueuePct || /* @__PURE__ */ new Map();
      return qPct.has(mId) ? qPct.get(mId) : null;
    };
    const _chipSeriesPct = (inst) => {
      const series = inst === "sonarr2" ? d._sonarr2Series : d._sonarrSeries;
      if (!series?.id) return null;
      const qPct = inst === "sonarr2" ? this._sonarr2QueueSeriesPct || /* @__PURE__ */ new Map() : this._sonarrQueueSeriesPct || /* @__PURE__ */ new Map();
      return qPct.has(series.id) ? qPct.get(series.id) : null;
    };
    let instanceStatusHtml = "";
    let singleDlTag = "";
    if (isMovieType && this._radarr2Configured) {
      const is4k = this._seerrRadarr2?.is4k;
      let lbl1, lbl2;
      if (is4k) {
        [lbl1, lbl2] = ["HD", "4K"];
      } else {
        [lbl1, lbl2] = _instLabels(
          this._seerrRadarr?.name,
          this._seerrRadarr2?.name,
          "Radarr 1",
          "Radarr 2"
        );
      }
      const st1 = _instStatus(radarrEntry, this._radarrQueueActive, this._radarrQueueFailed);
      const st2 = _instStatus(radarr2Entry, this._radarr2QueueActive, this._radarr2QueueFailed);
      instanceStatusHtml = `<div class="instance-status-row">${_instChip(lbl1, st1, _chipMoviePct("radarr"), "radarr")}${_instChip(lbl2, st2, _chipMoviePct("radarr2"), "radarr2")}</div>`;
    } else if (isSonarrType && this._sonarr2Configured) {
      const [lbl1, lbl2] = _instLabels(
        this._seerrSonarr?.name,
        this._seerrSonarr2?.name,
        "Sonarr 1",
        "Sonarr 2"
      );
      instanceStatusHtml = `<div class="instance-status-row">${this._snInstChip(_instChip, lbl1, sonarrEntry, _chipSeriesPct("sonarr"), "sonarr")}${this._snInstChip(_instChip, lbl2, sonarr2Entry, _chipSeriesPct("sonarr2"), "sonarr2")}</div>`;
    } else if (isMovieType) {
      const pct = _chipMoviePct("radarr");
      if (pct === null && _grabWaiting("radarr")) {
        singleDlTag = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span class="is-spin" style="width:10px;height:10px;border-width:1.5px"></span><span style="font-size:10px;color:#3b82f6;font-weight:700">${this._t("loading")}</span></div>`;
      } else if (pct !== null) {
        singleDlTag = `<div style="display:flex;align-items:center;gap:4px;margin-bottom:4px"><div style="width:80px;height:3px;background:rgba(59,130,246,0.20);border-radius:2px;overflow:hidden"><div style="width:${Math.max(pct, 4)}%;height:100%;background:#3b82f6;border-radius:2px"></div></div><span style="font-size:10px;color:#3b82f6;font-weight:700">${pct}%</span></div>`;
      }
    } else if (isSonarrType) {
      const pct = _chipSeriesPct("sonarr");
      if (pct !== null) {
        singleDlTag = `<div style="display:flex;align-items:center;gap:4px;margin-bottom:4px"><div style="width:80px;height:3px;background:rgba(59,130,246,0.20);border-radius:2px;overflow:hidden"><div style="width:${Math.max(pct, 4)}%;height:100%;background:#3b82f6;border-radius:2px"></div></div><span style="font-size:10px;color:#3b82f6;font-weight:700">${pct}%</span></div>`;
      } else if (sonarrEntry) {
        instanceStatusHtml = `<div class="instance-status-row">${this._snInstChip(_instChip, "", sonarrEntry, null, "sonarr")}</div>`;
      }
    }
    const _popupRadarrEntry = d._type === POPUP_TYPE.RADARR || d._type === POPUP_TYPE.MOVIE ? (this._radarr || []).find((m) => m.id === d._radarrId) : null;
    const _popupSonarrEntry = (d._type === POPUP_TYPE.SONARR || d._type === POPUP_TYPE.TV) && d._sonarrSeries?.id ? (this._sonarr || []).find((s) => s.id === d._sonarrSeries.id) : null;
    const _popupTags = _popupRadarrEntry ? (_popupRadarrEntry.tags || []).map((id) => (this._radarrTags || []).find((t) => t.id === id)?.label).filter(Boolean) : _popupSonarrEntry ? (_popupSonarrEntry.tags || []).map((id) => (this._sonarrTags || []).find((t) => t.id === id)?.label).filter(Boolean) : [];
    const _tagIconSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;opacity:0.7"><path d="M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M17.41,11.58C17.77,11.94 18,12.44 18,13C18,13.55 17.78,14.05 17.41,14.41L12.41,19.41C12.05,19.78 11.55,20 11,20C10.45,20 9.95,19.78 9.58,19.41L2.59,12.42C2.22,12.05 2,11.55 2,11V6C2,4.89 2.89,4 4,4H9C9.55,4 10.05,4.22 10.41,4.58L17.41,11.58Z"/></svg>`;
    const popupTagHtml = _popupTags.length > 0 ? `<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:-6px;margin-bottom:10px">${_popupTags.map((l) => `<span style="display:inline-flex;align-items:center;gap:2px;font-size:11px;color:rgba(255,255,255,0.5);background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:3px;padding:0 4px 0 3px;line-height:1.7">${_tagIconSvg}${this._escHtml(l)}</span>`).join("")}</div>` : "";
    const _goneInfo = this._goneInfo(d.tmdbId || d.id, d.tvdbId, isMovieType);
    const _goneBadgeInner = _goneInfo ? this._mtDelBadge(_goneInfo.due, false, _goneInfo.seasons?.length ? this._mtSeasonLabel(_goneInfo.seasons) : "") : "";
    const goneTagHtml = _goneBadgeInner ? `<div style="display:flex;margin:-2px 0 10px">${_goneInfo.colId != null ? `<span data-gone-col="${_goneInfo.colId}" title="${this._escHtml(_goneInfo.colTitle || "")}" style="cursor:pointer">${_goneBadgeInner}</span>` : _goneBadgeInner}</div>` : "";
    const removeLabel = "Remove \u203A";
    const _rmIs4k = this._seerrRadarr2?.is4k;
    const [_rmLbl1R, _rmLbl2R] = _rmIs4k ? ["HD", "4K"] : _instLabels(this._seerrRadarr?.name, this._seerrRadarr2?.name, "Radarr 1", "Radarr 2");
    const [_rmLbl1S, _rmLbl2S] = _instLabels(this._seerrSonarr?.name, this._seerrSonarr2?.name, "Sonarr 1", "Sonarr 2");
    const chevronSvg = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
    const removeBtn = canRemoveRadarr || canRemoveSonarr ? `<button class="is-open-btn remove-lib-btn${this._removeConfirm ? " active" : ""}" data-action="${this._removeConfirm ? "remove-no" : "remove-confirm"}">${trashSvg}<span class="pp-lbl">Remove ${chevronSvg}</span></button>` : "";
    let removeMenuRows = "";
    if (canRemoveRadarr || canRemoveSonarr) {
      if (this._removeArmed) {
        const yesLbl = this._removeArmed === "disc" ? "Yes, delete files" : "Yes, remove from library";
        removeMenuRows = `
        <button class="qa-item pp-armed-yes" data-action="remove-armed-yes"><span class="qa-ico">${checkSvg}</span><span>${yesLbl}</span></button>
        <button class="qa-item" data-action="remove-armed-no"><span class="qa-ico">${crossSvg}</span><span>Cancel</span></button>`;
      } else {
        const hasFiles2 = (inst) => inst === "radarr" ? !!radarrEntry?.hasFile : inst === "radarr2" ? !!radarr2Entry?.hasFile : inst === "sonarr" ? sonarrEntry?.statistics?.episodeFileCount > 0 : sonarr2Entry?.statistics?.episodeFileCount > 0;
        const present = [];
        if (canRemoveRadarr && d._radarrId) present.push(["radarr", _rmLbl1R]);
        if (canRemoveRadarr && d._radarr2Id) present.push(["radarr2", _rmLbl2R]);
        if (canRemoveSonarr && d._sonarrSeries?.id) present.push(["sonarr", _rmLbl1S]);
        if (canRemoveSonarr && d._sonarr2Series?.id) present.push(["sonarr2", _rmLbl2S]);
        const _rmLibSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
        const _rmDiscSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`;
        const block = (inst, indent) => `
        <button class="qa-item${indent ? " qa-sub-item" : ""}" data-action="remove-choose-lib" data-instance="${inst}"><span class="qa-ico">${_rmLibSvg}</span><span>From library</span></button>
        ${hasFiles2(inst) ? `<button class="qa-item${indent ? " qa-sub-item" : ""}" data-action="remove-choose-disc" data-instance="${inst}"><span class="qa-ico">${_rmDiscSvg}</span><span>From library and disc</span></button>` : ""}`;
        const chevR2 = `<svg class="qa-chev" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
        removeMenuRows = present.length > 1 ? present.map(([inst, lbl]) => {
          const key = `rminst:${inst}`;
          const on = this._ppMenu?.sub === key;
          return `<div class="qa-group">
              <button class="qa-item qa-item-parent${on ? " qa-item-on" : ""}" data-qa-sub="${key}">
                <span class="qa-ico">${this._appIcon(inst.startsWith("radarr") ? "radarr" : "sonarr", 16)}</span><span>${this._escHtml(lbl)}</span>${chevR2}
              </button>
              <div class="qa-drawer" data-qa-drawer="${key}">${block(inst, true)}</div>
            </div>`;
        }).join("") : present.length ? block(present[0][0], false) : "";
      }
    }
    let ratingsRow = "";
    {
      const _icImdb = `<svg width="30" height="15" viewBox="0 0 64 32" style="flex-shrink:0"><rect width="64" height="32" rx="6" fill="#F5C518"/><text x="32" y="23" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="900" fill="#000">IMDb</text></svg>`;
      const _icTmdb = `<svg width="30" height="15" viewBox="0 0 64 32" style="flex-shrink:0"><rect width="64" height="32" rx="6" fill="#0d253f"/><text x="32" y="22" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="800" fill="#01b4e4">TMDB</text></svg>`;
      const _icRt = `<svg width="15" height="15" viewBox="0 0 24 24" style="flex-shrink:0"><path fill="#FA320A" d="M12 7.5c-5 0-8.5 3-8.5 7.8 0 4.4 3.8 6.7 8.5 6.7s8.5-2.3 8.5-6.7c0-4.8-3.5-7.8-8.5-7.8z"/><path fill="#00912D" d="M11.8 7.6c.2-2 1.5-3.6 3.6-4.1-1 1.2-1.2 2.1-1.2 2.1s2-1.6 4.1-1c-1.5 1-2 2.3-2 2.3s1.7-.7 3.2-.2c-2 1.5-4.2 1.4-5.7 1.1-.5-.1-1.4-.2-2-.2z"/></svg>`;
      const _icMc = `<svg width="15" height="15" viewBox="0 0 32 32" style="flex-shrink:0"><circle cx="16" cy="16" r="16" fill="#001a35"/><text x="16" y="23" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="900" fill="#ffcc33">m</text></svg>`;
      const _icTvdb = `<svg width="30" height="15" viewBox="0 0 64 32" style="flex-shrink:0"><rect width="64" height="32" rx="6" fill="#6cd591"/><text x="32" y="22" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="900" fill="#003224">TVDB</text></svg>`;
      const _fmt1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
      const items = [];
      const _rR = (radarrEntry || radarr2Entry)?.ratings;
      const _snR = (sonarrEntry || sonarr2Entry)?.ratings;
      if (isMovieType && _rR) {
        if (_rR.imdb?.value) items.push([_icImdb, _fmt1(_rR.imdb.value)]);
        if (_rR.tmdb?.value) items.push([_icTmdb, _fmt1(_rR.tmdb.value)]);
        else if (d.voteAverage) items.push([_icTmdb, _fmt1(d.voteAverage)]);
        if (_rR.rottenTomatoes?.value > 0) items.push([_icRt, `${Math.round(_rR.rottenTomatoes.value)}%`]);
        if (_rR.metacritic?.value > 0) items.push([_icMc, `${Math.round(_rR.metacritic.value)}`]);
      } else if (isSonarrType) {
        if (d.voteAverage) items.push([_icTmdb, _fmt1(d.voteAverage)]);
        else if (_snR?.value) items.push([_icTvdb, _fmt1(_snR.value)]);
      } else if (d.voteAverage) {
        items.push([_icTmdb, _fmt1(d.voteAverage)]);
      }
      const _rtOv = d._rtRatings;
      if (_rtOv?.criticsScore != null && !items.some((it) => it[0] === _icRt)) {
        items.push([_icRt, `${Math.round(_rtOv.criticsScore)}%`]);
      }
      if (items.length) {
        ratingsRow = `<div class="popup-ratings">${items.map(([ic, v]) => `<span style="display:inline-flex;align-items:center;gap:4px">${ic}<b style="font-size:12px;color:var(--is-text);line-height:1;display:block;margin-top:-1px">${v}</b></span>`).join("")}</div>`;
      }
    }
    let fileInfoRow = "";
    {
      const _fiEntry = isMovieType ? radarrEntry?.hasFile && radarrEntry || radarr2Entry?.hasFile && radarr2Entry : sonarrEntry?.statistics?.episodeFileCount > 0 && sonarrEntry || sonarr2Entry?.statistics?.episodeFileCount > 0 && sonarr2Entry;
      if (_fiEntry) {
        const _fiLangs = this._arrLangCodes(_fiEntry, isMovieType, { force: true });
        const _fiQual = this._qualityLabel(_fiEntry, isMovieType);
        const _fiTags = [
          // Subtitles before audio throughout the card — the poster strip reads
          // the same way round.
          _fiQual ? `<span class="pp-fi-chip"><span class="pp-fi-txt">${this._escHtml(_fiQual)}</span></span>` : "",
          this._ppLangChip("subs", _fiLangs.subCodes),
          this._ppLangChip("audio", _fiLangs.audioCodes)
        ].filter(Boolean).join("");
        if (_fiTags) fileInfoRow = `<div class="popup-fileinfo">${_fiTags}</div>`;
      }
    }
    let monTitleBtn = "";
    let monAddLabel = "";
    if (isAdmin && (isMovieType || isSonarrType)) {
      const _monE1 = isMovieType ? radarrEntry : sonarrEntry;
      const _monE2 = isMovieType ? radarr2Entry : sonarr2Entry;
      const _monI1 = isMovieType ? "radarr" : "sonarr";
      const _monI2 = isMovieType ? "radarr2" : "sonarr2";
      const _mon2Configured = isMovieType ? this._radarr2Configured : this._sonarr2Configured;
      const _monAdded = [_monE1 && _monI1, _monE2 && _monI2].filter(Boolean);
      if (_monAdded.length || _mon2Configured) {
        const _bmSvg = (mon, sz = 20) => mon ? `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>` : `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
        const _monSpin = `<span class="action-spinner" style="width:13px;height:13px;border-width:1.5px"></span>`;
        const _monAny = !!(_monE1?.monitored || _monE2?.monitored);
        const _monTitleTip = this._cfg?.localisation === "cs" ? "Monitoring" : "Monitoring";
        if (!_mon2Configured && _monAdded.length === 1) {
          const inst = _monAdded[0];
          const busy = this._popupMonBusy === inst;
          monTitleBtn = `<button class="popup-mon-btn" data-action="popup-monitor-toggle" data-instance="${inst}" title="${_monTitleTip}"${busy ? " disabled" : ""}>${busy ? _monSpin : _bmSvg(_monAny)}</button>`;
        } else {
          monTitleBtn = `<button class="popup-mon-btn${this._popupMonExpand ? " active" : ""}" data-action="popup-monitor-expand" title="${_monTitleTip}">${_bmSvg(_monAny)}</button>`;
          if (this._popupMonExpand) {
            const [_ml1, _ml2] = isMovieType ? [isl1, isl2] : _instLabels(this._seerrSonarr?.name, this._seerrSonarr2?.name, "Sonarr 1", "Sonarr 2");
            monTitleBtn += [[_monI1, _monE1, _ml1], [_monI2, _monE2, _ml2]].map(([inst, e, lbl]) => {
              if (e) {
                const busy = this._popupMonBusy === inst;
                return `<button class="is-open-btn" data-action="popup-monitor-toggle" data-instance="${inst}" style="flex-shrink:0;height:18px;padding:0 7px 0 6px;font-size:10px;gap:4px;margin-top:0;align-self:center" title="${lbl}"${busy ? " disabled" : ""}>${busy ? _monSpin : _bmSvg(!!e?.monitored, 10)} ${lbl}</button>`;
              }
              const addActive = this._popupMonAddInst === inst;
              if (addActive) monAddLabel = lbl;
              return `<button class="is-open-btn${addActive ? " active" : ""}" data-action="popup-monitor-add-confirm" data-instance="${inst}" style="flex-shrink:0;height:18px;padding:0 7px 0 6px;font-size:10px;gap:4px;margin-top:0;align-self:center;opacity:${addActive ? "1" : "0.55"};border-style:dashed" title="${lbl}">+ ${lbl}</button>`;
            }).join("");
          }
        }
      }
    }
    const canTerminate = !!(d._streamEntity && (d._plexSessionId || d._jfSessionId || d._embySessionId || d._kodiEntityId)) && !!this._hass?.user?.is_admin;
    const _cfCheckSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    const _cfCrossSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    const _cfStyle = "height:clamp(140px,28vh,210px);min-height:0;flex:0 0 auto;display:flex;align-items:center;justify-content:center";
    const _instLbl = (inst) => {
      if (inst === "radarr") return hasDualRadarr ? isl1 : "Radarr";
      if (inst === "radarr2") return hasDualRadarr ? isl2 : "Radarr";
      if (inst === "sonarr") return hasDualSonarr ? _instLabels(this._seerrSonarr?.name, this._seerrSonarr2?.name, "Sonarr 1", "Sonarr 2")[0] : "Sonarr";
      if (inst === "sonarr2") return hasDualSonarr ? _instLabels(this._seerrSonarr?.name, this._seerrSonarr2?.name, "Sonarr 1", "Sonarr 2")[1] : "Sonarr";
      return inst;
    };
    const monAddActive = !!this._popupMonAddInst;
    let confirmPanelHtml = "";
    if (isConfirmAdd) {
      const _isInstLbl = _instLbl(this._isInstance);
      const _isMsg = this._cfg?.localisation === "cs" ? `Film bude nejd\u0159\xEDve p\u0159id\xE1n do ${_isInstLbl} bez monitorov\xE1n\xED.` : `Movie will be added to ${_isInstLbl} unmonitored first.`;
      confirmPanelHtml = `<div class="is-panel" style="${_cfStyle}"><div class="is-confirm-wrap">
      <div class="is-confirm-msg">${_isMsg}</div>
      <div class="is-confirm-actions">
        <button class="is-confirm-btn is-confirm-yes" data-action="is-confirm-yes">${_cfCheckSvg}</button>
        <button class="is-confirm-btn is-confirm-no" data-action="is-confirm-no">${_cfCrossSvg}</button>
      </div></div></div>`;
    } else if (snConfirmAdd) {
      const _snInstLbl = _instLbl(this._snIsInstance);
      const _snMsg = this._cfg?.localisation === "cs" ? `Seri\xE1l bude nejd\u0159\xEDve p\u0159id\xE1n do ${_snInstLbl} bez monitorov\xE1n\xED.` : `Series will be added to ${_snInstLbl} unmonitored first.`;
      confirmPanelHtml = `<div class="is-panel" style="${_cfStyle}"><div class="is-confirm-wrap">
      <div class="is-confirm-msg">${_snMsg}</div>
      <div class="is-confirm-actions">
        <button class="is-confirm-btn is-confirm-yes" data-action="sn-confirm-yes">${_cfCheckSvg}</button>
        <button class="is-confirm-btn is-confirm-no" data-action="sn-confirm-no">${_cfCrossSvg}</button>
      </div></div></div>`;
    } else if (asConfirmOnly) {
      const _asInstLbl = _instLbl(this._asInstance);
      const _asMsg = _isMovieType ? this._cfg?.localisation === "cs" ? `Film bude p\u0159id\xE1n do ${_asInstLbl} a spust\xED se automatick\xE9 vyhled\xE1v\xE1n\xED.` : `Movie will be added to ${_asInstLbl} and automatic search will start.` : this._cfg?.localisation === "cs" ? `Seri\xE1l bude p\u0159id\xE1n do ${_asInstLbl}. Vyberte sez\xF3nu pro vyhled\xE1v\xE1n\xED.` : `Series will be added to ${_asInstLbl}. Select a season to search.`;
      confirmPanelHtml = `<div class="is-panel" style="${_cfStyle}"><div class="is-confirm-wrap">
      <div class="is-confirm-msg">${_asMsg}</div>
      <div class="is-confirm-actions">
        <button class="is-confirm-btn is-confirm-yes" data-action="as-confirm-yes">${_cfCheckSvg}</button>
        <button class="is-confirm-btn is-confirm-no" data-action="as-confirm-no">${_cfCrossSvg}</button>
      </div></div></div>`;
    } else if (this._popupMonAddSearch) {
      const _searchMsg = this._cfg?.localisation === "cs" ? "Spustit vyhled\xE1v\xE1n\xED nyn\xED?" : "Run search now?";
      const _asLabel = this._cfg?.localisation === "cs" ? "Automatick\xE9" : "Automatic";
      const _isLabel = this._cfg?.localisation === "cs" ? "Interaktivn\xED" : "Interactive";
      const _asSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`;
      const _isSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      confirmPanelHtml = `<div class="is-panel" style="${_cfStyle}"><div class="is-confirm-wrap" style="gap:10px">
      <div class="is-confirm-msg">${_searchMsg}</div>
      <div class="is-confirm-actions" style="gap:8px">
        <button class="is-confirm-btn is-confirm-yes" data-action="popup-mon-search-as" style="width:auto;border-radius:19px;padding:0 14px;gap:5px;font-size:11px;font-weight:500">${_asSvg} ${_asLabel}</button>
        <button class="is-confirm-btn is-confirm-yes" data-action="popup-mon-search-is" style="width:auto;border-radius:19px;padding:0 14px;gap:5px;font-size:11px;font-weight:500">${_isSvg} ${_isLabel}</button>
        <button class="is-confirm-btn is-confirm-no" data-action="popup-mon-search-no">${_cfCrossSvg}</button>
      </div>
    </div></div>`;
    } else if (monAddActive) {
      const monAddBusy = this._popupMonAddBusy === this._popupMonAddInst;
      const monAddMsg = this._cfg?.localisation === "cs" ? `P\u0159idat do ${monAddLabel} jako monitorovan\xE9?` : `Add to ${monAddLabel} as monitored?`;
      confirmPanelHtml = `<div class="is-panel" style="${_cfStyle}"><div class="is-confirm-wrap">
      <div class="is-confirm-msg">${this._escHtml(monAddMsg)}</div>
      <div class="is-confirm-actions">
        ${monAddBusy ? `<span class="action-spinner" style="width:20px;height:20px;border-width:2px"></span>` : `
        <button class="is-confirm-btn is-confirm-yes" data-action="popup-monitor-add-yes" data-instance="${this._popupMonAddInst}">${_cfCheckSvg}</button>
        <button class="is-confirm-btn is-confirm-no" data-action="popup-monitor-add-no">${_cfCrossSvg}</button>`}
      </div></div></div>`;
    }
    const wideClass = "";
    const searchActive = isActive || snIsActive || asSonarrActive;
    const glassStyle = "";
    const heroSearchHtml = searchBtnHtml;
    const heroRemoveHtml = removeBtn;
    const optionsBtn = this._qaBtnHtml(d);
    const heroBar = searchBtnHtml || removeBtn || optionsBtn ? `<div class="pp-hero-bar">
         <div class="pp-hero-pill">${heroSearchHtml}${heroRemoveHtml}${optionsBtn}</div>
       </div>` : "";
    const overviewHtml = overview ? `<p class="popup-overview">${overview}</p>` : `<p class="popup-overview" style="color:rgba(255,255,255,0.35);font-style:italic">${this._t("noDescription")}</p>`;
    const backdropEl = searchActive ? "" : this._popupCastOpen && castPanelHtml ? `
        <div class="popup-backdrop popup-backdrop--cast${heroBar ? " popup-backdrop--bar" : ""}">
          ${castPanelHtml}
          <div class="popup-backdrop-fade"></div>
          ${heroBar}
          ${castToggleBtn ? `<div class="popup-cast-fab-anchor">${castToggleBtn}</div>` : ""}
        </div>` : `
        <div class="popup-backdrop${heroBar ? " popup-backdrop--bar" : ""}" style="${backdropStyle}">
          <div class="popup-backdrop-fade"></div>
          ${heroBar}
          ${castToggleBtn ? `<div class="popup-cast-fab-anchor">${castToggleBtn}</div>` : ""}
        </div>`;
    const posterHtmlFinal = posterHtml ? searchActive ? posterHtml.replace('<img class="popup-poster"', '<img class="popup-poster" style="margin-top:0"') : posterHtml : "";
    return `
    <div class="popup-overlay${dayClass(this)}">
      <div class="popup-glass${wideClass}"${glassStyle}>
        <button class="popup-close"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>

        ${backdropEl}
        ${heroBar && !backdropEl ? heroBar : ""}
        ${this._qaMenuHtml(d, searchMenuRows, removeMenuRows)}
        <div class="popup-body${heroBar && !backdropEl ? " popup-body--bar" : ""}${searchActive ? " popup-body--search" : ""}${snIsActive && !isActive && !asActive || asSonarrActive ? " popup-body--sn-is" : ""}${asActive || confirmPanelHtml ? " popup-body--panel" : ""}">
          <div class="popup-content"${searchActive && !heroBar ? ' style="padding-top:52px"' : ""}>
            ${posterHtmlFinal}
            <div class="popup-meta">
              <div style="display:flex;align-items:flex-start;gap:8px;margin:0 0 5px;position:relative">
                <h2 class="popup-title" style="margin:0;flex:1;min-width:0">${title}${monTitleBtn}</h2>
                ${this._qaStatusHtml()}
              </div>
              ${subLine || ratingsRow ? `<div class="popup-subrow">${subLine ? `<div class="popup-sub">${subLine}</div>` : ""}${ratingsRow}</div>` : ""}
              ${fileInfoRow}
              ${instanceStatusHtml}
              ${goneTagHtml}
              ${singleDlTag}
              ${popupTagHtml}
              ${this._isMob ? "" : overviewHtml}
              ${d._streamEntity ? this._renderPopupStreamControls(d) : ""}
              ${heroBar ? "" : `<div class="popup-actions">
                ${searchBtnHtml}
                ${removeBtn}
                ${optionsBtn}
              </div>`}
            </div>
          </div>
          ${this._isMob ? `<div class="popup-desc">${overviewHtml}</div>` : ""}
          ${confirmPanelHtml || isActive || snIsActive || asSonarrActive ? "" : trailerHtml}
          ${confirmPanelHtml}
          ${asActive && !asConfirmOnly ? this._renderAsSection() : ""}
          ${isActive ? this._renderIsPanel() : ""}
          ${snIsActive ? this._renderSonarrIsSection() : ""}
        </div>
      </div>
      ${this._renderPlexCastDropdown()}
    </div>`;
  }
  // ─────────────────────────────────────────────
  // Stream controls embedded in movie/TV popup
  // ─────────────────────────────────────────────
  _renderPopupStreamControls(d) {
    const eid = d._streamEntity;
    const dur = d._duration || 0;
    const pos = d._position || 0;
    const upd = d._updatedAt || Date.now();
    const playing = d._streamState === "playing";
    const elapsed = playing ? (Date.now() - upd) / 1e3 : 0;
    const current = Math.min(pos + elapsed, dur);
    const initPct = dur > 0 ? (current / dur * 100).toFixed(2) : 0;
    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    const timeLabel = dur > 0 ? `${fmt(current)} / ${fmt(dur)}` : "";
    const canSeek = false;
    const canPlexSeek = false;
    const seekBar = dur > 0 ? `
    <div ${canSeek || canPlexSeek ? `class="stream-seek-wrap" data-action="stream-seek" data-entity="${this._escHtml(eid)}" data-dur="${dur}" style="cursor:pointer;padding:6px 0;margin-bottom:2px"` : `style="padding:6px 0;margin-bottom:2px"`}>
      <div class="stream-popup-track" style="position:relative;height:4px;border-radius:2px;overflow:hidden">
        <div class="stream-prog-fill stream-popup-fill" data-entity="${this._escHtml(eid)}" data-pos="${pos}" data-dur="${dur}" data-updated="${upd}" style="position:absolute;inset:0 auto 0 0;width:${initPct}%;border-radius:2px;transition:none"></div>
      </div>
    </div>
    <div class="stream-popup-time" style="font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:8px">${timeLabel}</div>` : "";
    return `<div style="margin-top:10px;margin-bottom:2px">
    ${seekBar}
  </div>`;
  }
  // ─────────────────────────────────────────────
  // Interactive Search — panel HTML
  // ─────────────────────────────────────────────
  async _removeFromLibrary(deleteFiles = false, addExclusion = false) {
    const d = this._popup;
    if (!d) return;
    const df = deleteFiles ? "true" : "false";
    const ex = addExclusion ? "true" : "false";
    const inst = this._removeInstance || (d._radarrId ? "radarr" : d._radarr2Id ? "radarr2" : d._sonarrSeries?.id ? "sonarr" : "sonarr2");
    try {
      if (inst === "radarr2" && d._radarr2Id) {
        await this._hass.callApi("DELETE", `arr_stack/radarr2/movie/${d._radarr2Id}?deleteFiles=${df}&addExclusion=${ex}`);
        this._radarr2 = (this._radarr2 || []).filter((m) => m.id !== d._radarr2Id);
        const map = /* @__PURE__ */ new Map();
        for (const m of this._radarr2 || []) if (m.tmdbId) map.set(String(m.tmdbId), m);
        this._radarr2ByTmdb = map;
      } else if ((inst === "radarr" || !inst.startsWith("sonarr")) && d._radarrId) {
        await this._hass.callApi("DELETE", `arr_stack/radarr/movie/${d._radarrId}?deleteFiles=${df}&addExclusion=${ex}`);
        this._radarr = (this._radarr || []).filter((m) => m.id !== d._radarrId);
      } else if (inst === "sonarr2" && d._sonarr2Series?.id) {
        await this._hass.callApi("DELETE", `arr_stack/sonarr2/series/${d._sonarr2Series.id}?deleteFiles=${df}&addExclusion=${ex}`);
        this._sonarr2 = (this._sonarr2 || []).filter((s) => s.id !== d._sonarr2Series.id);
        if (this._sonarr2All) this._sonarr2All = this._sonarr2All.filter((s) => s.id !== d._sonarr2Series.id);
      } else if (d._sonarrSeries?.id) {
        await this._hass.callApi("DELETE", `arr_stack/sonarr/series/${d._sonarrSeries.id}?deleteFiles=${df}&addExclusion=${ex}`);
        this._sonarr = (this._sonarr || []).filter((s) => s.id !== d._sonarrSeries.id);
        if (this._sonarrAll) this._sonarrAll = this._sonarrAll.filter((s) => s.id !== d._sonarrSeries.id);
      }
    } catch (e) {
      console.error("[ArrStack] Remove failed:", e);
    }
    this._removeConfirm = false;
    this._removeInstance = null;
    const stillInOther = inst === "radarr" && d._radarr2Id || inst === "radarr2" && d._radarrId || inst === "sonarr" && d._sonarr2Series?.id || inst === "sonarr2" && d._sonarrSeries?.id;
    const _tmdb = String(d.tmdbId || d.id || "");
    if (_tmdb && this._optimisticRequested) this._optimisticRequested.delete(_tmdb);
    if (stillInOther) {
      if (inst === "radarr") d._radarrId = null;
      if (inst === "radarr2") d._radarr2Id = null;
      if (inst === "sonarr") d._sonarrSeries = null;
      if (inst === "sonarr2") d._sonarr2Series = null;
      this._renderPopupEl();
      this._reRenderRight(true);
    } else {
      this._popup = null;
      if (this._popupReturn()) {
        this._reRenderRight(true);
      } else {
        this._render();
      }
    }
    this._fetchAll();
  }
  // ─────────────────────────────────────────────
  // Music / stream popup renderer
  // ─────────────────────────────────────────────
  _renderStreamPopup(d) {
    const isPlaying = d._streamState === "playing";
    const title = this._escHtml(d.title || "");
    const artist = this._escHtml(d._artist || "");
    const album = this._escHtml(d._album || "");
    const duration = d._duration || 0;
    const position = d._position || 0;
    const updatedAt = d._updatedAt || Date.now();
    const elapsed = isPlaying ? (Date.now() - updatedAt) / 1e3 : 0;
    const currentPos = Math.min(position + elapsed, duration);
    const initPct = duration > 0 ? (currentPos / duration * 100).toFixed(2) : 0;
    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    const timeLabel = duration > 0 ? `${fmt(currentPos)} / ${fmt(duration)}` : "";
    const eid = this._escHtml(d._streamEntity || "");
    const posterUrl = d._poster || "";
    const posterHtml = posterUrl ? `<img class="popup-poster" src="${this._escHtml(posterUrl)}" loading="lazy" onerror="this.style.display='none'" />` : "";
    const backdropStyle = posterUrl ? `background-image:url('${this._escHtml(posterUrl)}');background-size:cover;background-position:center;filter:blur(6px) brightness(0.4)` : "background:linear-gradient(135deg,rgba(20,20,40,1),rgba(40,20,60,1))";
    const subLine = [artist, album].filter(Boolean).join(" \xB7 ");
    const rawEid = d._streamEntity || "";
    const suppFeats = this._hass?.states?.[rawEid]?.attributes?.supported_features || 0;
    const canControl = !!(suppFeats & 1) || !!(suppFeats & 16384) || !!d._plexMachineId;
    const canSeek = !!(suppFeats & 2);
    const canPlexSeek = !!d._plexMachineId;
    const seekBar = duration > 0 ? `
    <div ${canSeek || canPlexSeek ? `class="stream-seek-wrap" data-action="stream-seek" data-entity="${eid}" data-dur="${duration}" style="cursor:pointer;padding:6px 0;margin-bottom:4px"` : `style="padding:6px 0;margin-bottom:4px"`}>
      <div class="stream-prog-track" style="height:4px;position:relative;bottom:auto;left:auto;right:auto;border-radius:2px">
        <div class="stream-prog-fill" data-entity="${eid}" data-pos="${position}" data-dur="${duration}" data-updated="${updatedAt}" style="width:${initPct}%;transition:none;border-radius:2px"></div>
      </div>
    </div>
    <div class="stream-popup-time" style="font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:10px">${timeLabel}</div>` : "";
    const controls = canControl ? `
    <div style="display:flex;align-items:center;gap:16px;margin-top:4px">
      <button class="popup-ctrl-btn" data-action="stream-prev" data-entity="${eid}">
        <ha-icon icon="mdi:skip-previous" style="--mdc-icon-size:26px"></ha-icon>
      </button>
      <button class="popup-ctrl-btn popup-ctrl-btn-main" data-action="stream-playpause" data-entity="${eid}">
        <ha-icon icon="mdi:${isPlaying ? "pause" : "play"}" style="--mdc-icon-size:32px"></ha-icon>
      </button>
      <button class="popup-ctrl-btn" data-action="stream-next" data-entity="${eid}">
        <ha-icon icon="mdi:skip-next" style="--mdc-icon-size:26px"></ha-icon>
      </button>
    </div>` : "";
    return `
    <div class="popup-overlay${dayClass(this)}">
      <div class="popup-glass">
        <button class="popup-close"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <div class="popup-backdrop" style="${backdropStyle}">
          <div class="popup-backdrop-fade"></div>
        </div>
        <div class="popup-body">
          <div class="popup-content">
            ${posterHtml}
            <div class="popup-meta">
              <h2 class="popup-title">${title}</h2>
              ${subLine ? `<div class="popup-sub">${subLine}</div>` : ""}
              ${seekBar}
              ${controls}
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }
  async _addSeriesToSonarr(instance = "sonarr", addMonitored = false) {
    this._markActivated();
    this._snIsState = "adding";
    this._renderPopupEl();
    const svc = instance === "sonarr2" ? "sonarr2" : "sonarr";
    try {
      const d = this._popup;
      const tvdbId = d.externalIds?.tvdbId || d._tvdbId;
      if (!tvdbId) throw new Error(this._t("snNoSonarrId"));
      const lookupResults = await this._callApi("GET", `arr_stack/${svc}/lookup?tvdbId=${tvdbId}`);
      const seriesData = Array.isArray(lookupResults) ? lookupResults[0] : lookupResults;
      if (!seriesData) throw new Error(this._t("snNoSonarrId"));
      const seerr = instance === "sonarr2" ? this._seerrSonarr2 : this._seerrSonarr;
      if (this._overseerrConfigured !== false && !seerr) await this._fetchOverseerrSonarrSettings();
      let profileId, rootFolder;
      if (seerr) {
        profileId = seerr.profileId ?? 1;
        rootFolder = seerr.rootFolder ?? "/tv";
      } else if (instance === "sonarr2") {
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
      if (!addMonitored && seriesData.seasons) {
        seriesData.seasons = seriesData.seasons.map((s) => ({ ...s, monitored: false }));
      }
      let added;
      try {
        added = await this._callApi("POST", `arr_stack/${svc}/series`, {
          ...seriesData,
          qualityProfileId: parseInt(profileId),
          rootFolderPath: rootFolder,
          monitored: addMonitored,
          addOptions: { searchForMissingEpisodes: false, searchForCutoffUnmetEpisodes: false, monitor: addMonitored ? "all" : "none" }
        });
      } catch (addErr) {
        if (instance === "sonarr2") await this._fetchSonarr2();
        else await this._fetchSonarr();
        const pool2 = instance === "sonarr2" ? this._sonarr2All || [] : this._sonarrAll || [];
        added = pool2.find((s) => String(s.tvdbId) === String(tvdbId));
      }
      if (instance === "sonarr2") await this._fetchSonarr2();
      else await this._fetchSonarr();
      const pool = instance === "sonarr2" ? this._sonarr2All || [] : this._sonarrAll || [];
      const refreshed = pool.find(
        (s) => String(s.tvdbId) === String(tvdbId) || added?.id && s.id === added.id
      ) || added;
      if (!refreshed) throw new Error(this._t("snNoSonarrId"));
      if (instance === "sonarr2") this._popup._sonarr2Series = refreshed;
      else this._popup._sonarrSeries = refreshed;
      if (tvdbId) this._pendingRequestedShows.add(String(tvdbId));
      this._snIsState = null;
      if (addMonitored) {
        this._popupMonAddBusy = null;
        this._popupMonAddSearch = instance;
        this._popupMonAddInst = null;
        this._render();
        return;
      }
      this._render();
    } catch (e) {
      this._snIsState = "error";
      this._snIsError = e.message || this._t("isLoadError");
    }
    this._renderPopupEl();
  }
  // Add a movie to Radarr unmonitored, without opening Interactive Search afterward — used
  // by the missing-instance "+" tag next to the popup title (dual-instance monitor row).
  async _addMovieToRadarr(instance = "radarr", addMonitored = false) {
    this._markActivated();
    this._popupMonAddBusy = instance;
    this._renderPopupEl();
    const svc = instance === "radarr2" ? "radarr2" : "radarr";
    try {
      const d = this._popup;
      const tmdbId = d?.tmdbId || d?.id;
      const title = d?.title || d?.originalTitle || "";
      if (!tmdbId) throw new Error(this._t("isMissingTmdb"));
      const seerr = instance === "radarr2" ? this._seerrRadarr2 : this._seerrRadarr;
      if (this._overseerrConfigured !== false && !seerr) await this._fetchOverseerrRadarrSettings();
      if (instance === "radarr2") {
        if (!this._radarr2Profiles?.length) await this._fetchRadarr2Profiles();
        if (!this._radarr2RootFolders?.length) await this._fetchRadarr2RootFolders();
      } else {
        if (!this._radarrProfiles?.length) await this._fetchRadarrProfiles();
        if (!this._radarrRootFolders?.length) await this._fetchRadarrRootFolders();
      }
      const profiles = instance === "radarr2" ? this._radarr2Profiles : this._radarrProfiles;
      const rootFolders = instance === "radarr2" ? this._radarr2RootFolders : this._radarrRootFolders;
      const profileId = seerr?.profileId ?? (profiles?.[0]?.id ?? 1);
      const rootFolder = seerr?.rootFolder ?? rootFolders?.[0]?.path ?? "/movies";
      let addedMovie;
      try {
        addedMovie = await this._callApi("POST", `arr_stack/${svc}/movie`, {
          tmdbId: parseInt(tmdbId),
          title,
          qualityProfileId: parseInt(profileId),
          rootFolderPath: rootFolder,
          monitored: addMonitored,
          addOptions: { searchForMovie: false, monitor: addMonitored ? "movieOnly" : "none" }
        });
      } catch (addErr) {
        if (instance === "radarr2") await this._fetchRadarr2();
        else await this._fetchRadarr();
        const pool2 = instance === "radarr2" ? this._radarr2 || [] : this._radarr || [];
        addedMovie = pool2.find((m) => String(m.tmdbId) === String(tmdbId));
      }
      if (instance === "radarr2") await this._fetchRadarr2();
      else await this._fetchRadarr();
      const pool = instance === "radarr2" ? this._radarr2 || [] : this._radarr || [];
      const refreshed = pool.find(
        (m) => String(m.tmdbId) === String(tmdbId) || addedMovie?.id && m.id === addedMovie.id
      ) || addedMovie;
      if (!refreshed) throw new Error(this._t("isNoRadarrId"));
      if (instance === "radarr2") this._popup._radarr2Id = refreshed.id;
      else this._popup._radarrId = refreshed.id;
      if (tmdbId) this._pendingRequestedMovies.add(String(tmdbId));
      this._popupMonAddBusy = null;
      this._popupMonAddSearch = instance;
      this._popupMonAddInst = null;
      this._render();
      return;
    } catch (e) {
      console.error("[arr-card] add movie to instance failed:", e);
    }
    this._popupMonAddBusy = null;
    this._popupMonAddInst = null;
    this._render();
  }
  // ─────────────────────────────────────────────
  // Plex Cast helpers
  // ─────────────────────────────────────────────
  // `silent` keeps the popup untouched: the cast drawer patches itself and a
  // re-render would close it. `maxAge` lets a warm list be reused instead of
  // making the user wait for a round trip they cannot see the point of.
  async _fetchPlexClients({ silent = false, maxAge = 0 } = {}) {
    if (maxAge && this._plexClients && Date.now() - (this._plexClientsTs || 0) < maxAge) return;
    const states = this._hass?.states || {};
    const online = /* @__PURE__ */ new Set(["playing", "paused", "idle", "standby", "on"]);
    const allPlayers = Object.entries(states).filter(([id, s]) => id.startsWith("media_player.plex_") && s.state !== "unavailable").map(([id, s]) => ({ entityId: id, name: s.attributes?.friendly_name || id }));
    try {
      const raw = await this._callApi("GET", "arr_stack/plex/clients");
      const mc = raw?.MediaContainer || raw || {};
      const clients = mc.Server || mc.Device || mc.Client || [];
      const seen = /* @__PURE__ */ new Set();
      const result = [];
      for (const c of clients) {
        const cName = (c.name || c.Name || c.title || "").trim();
        const cLow = cName.toLowerCase();
        const ha = allPlayers.find((e) => e.name.toLowerCase().includes(cLow) || cLow.includes(e.name.toLowerCase()));
        if (ha && !seen.has(ha.entityId)) {
          seen.add(ha.entityId);
          result.push({ name: cName, entityId: ha.entityId });
        }
      }
      for (const p of allPlayers) {
        if (!seen.has(p.entityId)) {
          seen.add(p.entityId);
          result.push(p);
        }
      }
      this._plexClients = result;
    } catch {
      this._plexClients = allPlayers;
    }
    this._plexClientsTs = Date.now();
    if (!silent) this._renderPopupEl();
  }
  _renderPlexCastBtn(d, movieInLib, showInLib) {
    const isMovieType = d._type === "radarr" || d._type === "movie";
    const isShowType = d._type === "sonarr" || d._type === "tv";
    const inLib = isMovieType ? movieInLib : isShowType ? showInLib : false;
    if (!inLib) return "";
    const castSvg = `<svg viewBox="0 0 24 24" width="14" height="14" style="display:block"><path fill="currentColor" d="M1 18v3h3a3 3 0 0 0-3-3m0-4v2a5 5 0 0 1 5 5h2a7 7 0 0 0-7-7m0-4v2a9 9 0 0 1 9 9h2A11 11 0 0 0 1 10m20-7H3C1.9 3 1 3.9 1 5v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>`;
    const spinner = `<span class="action-spinner" style="width:12px;height:12px;border-width:1.5px"></span>`;
    const _btnCommon = `flex-shrink:0;width:36px;height:36px;padding:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;transition:background 0.15s,color 0.15s,border-color 0.15s`;
    const btnBase = `${_btnCommon};border:none;background:rgba(0,0,0,0.45);color:#fff`;
    const btnActive = `${_btnCommon};border:1px solid rgba(0,122,255,0.5);background:rgba(0,122,255,0.25);color:#fff`;
    if (this._plexCasting) {
      return `<button disabled style="${btnBase};opacity:0.6">${spinner}</button>`;
    }
    const btnStyle = this._plexCastOpen ? btnActive : btnBase;
    return `<button data-action="plex-cast-open" style="${btnStyle}">${castSvg}</button>`;
  }
  _renderPlexCastDropdown() {
    if (!this._plexCastOpen) return "";
    const r = this._plexCastBtnRect;
    if (!r) return "";
    const castSvg = `<svg viewBox="0 0 24 24" width="12" height="12" style="display:block;flex-shrink:0"><path fill="currentColor" d="M1 18v3h3a3 3 0 0 0-3-3m0-4v2a5 5 0 0 1 5 5h2a7 7 0 0 0-7-7m0-4v2a9 9 0 0 1 9 9h2A11 11 0 0 0 1 10m20-7H3C1.9 3 1 3.9 1 5v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>`;
    const spinner = `<span class="action-spinner" style="width:12px;height:12px;border-width:1.5px"></span>`;
    let dropContent;
    if (this._plexClients === null) {
      dropContent = `<div style="padding:10px 14px;font-size:11px;color:rgba(255,255,255,0.5);display:flex;align-items:center;gap:8px">${spinner} Loading\u2026</div>`;
    } else if (!this._plexClients.length) {
      dropContent = `<div style="padding:10px 14px;font-size:11px;color:rgba(255,255,255,0.45)">No devices found</div>`;
    } else {
      dropContent = this._plexClients.map(
        (p) => `<button data-action="plex-cast-play" data-entity="${this._escHtml(p.entityId)}"
        style="display:flex;align-items:center;gap:7px;width:100%;background:none;border:none;padding:7px 12px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.85);cursor:pointer;text-align:left;border-radius:6px;transition:background 0.12s"
        onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='none'"
      >${castSvg}${this._escHtml(p.name)}</button>`
      ).join("");
    }
    const dropW = 190, dropH = 220, gap = 8;
    const leftPx = Math.max(8, Math.round(r.left - gap - dropW));
    const topPx = Math.max(8, Math.min(Math.round(r.top), window.innerHeight - dropH - 8));
    return `<div class="plex-cast-dropdown" style="position:absolute;left:${leftPx}px;top:${topPx}px;z-index:9999;background:rgba(18,18,28,0.97);border:1px solid rgba(255,255,255,0.12);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.5);min-width:${dropW}px;max-height:${dropH}px;overflow-y:auto;padding:4px;display:flex;flex-direction:column">
    ${dropContent}
  </div>`;
  }
};
var popupMixin = _PopupMethods.prototype;


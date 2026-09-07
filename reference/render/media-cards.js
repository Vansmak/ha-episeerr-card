
var FLAT_SVG_FLAGS = true;
var _MediaCardMethods = class {
  // Maintainerr's deletion queue, looked up the way the rest of the card knows
  // its titles. Returns null when Maintainerr is not configured or the title is
  // not queued, so callers can drop the badge with no extra guard.
  _goneInfo(tmdbId, tvdbId, isMovie) {
    if (this._posterCfg().goneTag !== "all") return null;
    const ext = this._mtDelExt;
    if (!ext || !ext.size) return null;
    if (isMovie) return tmdbId && ext.get(`mv:${tmdbId}`) || null;
    return tvdbId && ext.get(`tv:tvdb:${tvdbId}`) || tmdbId && ext.get(`tv:tmdb:${tmdbId}`) || null;
  }
  // Centred over the poster, below the type tag. `compact` shrinks the wording to
  // "3D" for tiles too small to carry the full sentence.
  _goneBadge(tmdbId, tvdbId, isMovie, { compact = false, top = 26 } = {}) {
    const info = this._goneInfo(tmdbId, tvdbId, isMovie);
    if (!info) return "";
    const prefix = info.seasons?.length ? this._mtSeasonLabel(info.seasons) : "";
    const badge = this._mtDelBadge(info.due, compact, prefix, true);
    if (!badge) return "";
    return `<div style="position:absolute;top:${top}px;left:6px;right:6px;z-index:4;display:flex;pointer-events:none">${badge}</div>`;
  }
  _statusBadge(html) {
    return `<div style="position:absolute;top:6px;right:6px;z-index:2;display:flex;align-items:flex-start">${html}</div>`;
  }
  // Country whose flag stands in for a spoken language. English is the awkward
  // one: the track is just "English", with no region, so the flag is a stand-in
  // either way. Installs that set their country to the US get the US flag, since
  // that is the one their users read as English; everyone else keeps GB.
  _flagCountry(lang) {
    const code = (lang || "").toUpperCase();
    if (code === "EN" && this._hass?.config?.country === "US") return "US";
    const MAP = {
      CS: "CZ",
      EN: "GB",
      DE: "DE",
      FR: "FR",
      ES: "ES",
      IT: "IT",
      PL: "PL",
      SK: "SK",
      RU: "RU",
      JA: "JP",
      KO: "KR",
      ZH: "CN",
      PT: "PT",
      NL: "NL",
      SV: "SE",
      NO: "NO",
      DA: "DK",
      FI: "FI",
      HU: "HU",
      RO: "RO",
      UK: "UA",
      TR: "TR",
      AR: "SA",
      HI: "IN",
      HR: "HR",
      SR: "RS",
      BG: "BG",
      EL: "GR",
      HE: "IL",
      TH: "TH",
      VI: "VN",
      ID: "ID",
      FA: "IR",
      MS: "MY",
      ET: "EE",
      LV: "LV",
      LT: "LT",
      SL: "SI",
      CA: "ES",
      IS: "IS"
    };
    if (MAP[code]) return MAP[code];
    return FLAG_SVGS[code] || this._flagSpecs[code] ? code : null;
  }
  // Regional-indicator pair — no image assets, no network, and Chrome renders
  // these natively.
  _flagEmoji(lang) {
    const cc = this._flagCountry(lang);
    if (!cc) return "";
    return String.fromCodePoint(...[...cc].map((c) => 127462 + c.charCodeAt(0) - 65));
  }
  // Audio/subtitle codes for a title that exists in Radarr or Sonarr. Discover
  // and calendar cards only have a TMDB record, so they resolve their *arr entry
  // first and hand it here; nothing is shown when the title is not in the library.
  // `force` ignores the poster toggles — those govern what a poster is cluttered
  // with, and the detail popup is where someone went looking for exactly this.
  _arrLangCodes(entry, isMovie, { force = false } = {}) {
    const _pc = this._posterCfg();
    const pc = force ? { ..._pc, audio: true, subtitles: true } : _pc;
    const out = { audioCodes: [], subCodes: [] };
    if (!entry || !entry.id) return out;
    if (isMovie) {
      if (pc.audio && entry.hasFile) {
        if (Array.isArray(entry.movieFile?.languages) && entry.movieFile.languages.length) {
          out.audioCodes = entry.movieFile.languages.map((l) => this._langCode(l.name || "")).filter(Boolean);
        } else if (entry.movieFile?.mediaInfo?.audioLanguages) {
          out.audioCodes = entry.movieFile.mediaInfo.audioLanguages.split(/\s*[\/,]\s*/).map((l) => this._langCode(l.trim())).filter(Boolean);
        }
      }
      if (pc.subtitles && this._bazarrConfigured && entry.hasFile) {
        const bz = this._bazarr?.[entry.id];
        out.subCodes = (bz?.subtitles || []).map((s) => (s.code2 || s.name || "?").toUpperCase());
      }
      return out;
    }
    const inst = entry._isSonarr2 ? "2" : "1";
    if ((entry.statistics?.episodeFileCount || 0) > 0) {
      if (pc.audio) {
        const cached = this._libTvAudioCache.get(`${inst}-${entry.id}`);
        if (Array.isArray(cached) && cached.length) out.audioCodes = cached;
        else if (cached === void 0) this._fetchLibTvAudio(entry.id, inst);
      }
      const subs = this._tvSubInfo(entry.id, inst, force);
      if (subs && !subs.missing) out.subCodes = subs.codes;
    }
    return out;
  }
  // Radarr and Sonarr name a file's quality as source plus resolution
  // ("Bluray-1080p", "WEBDL-2160p", "Bluray-2160p Remux"). Marketing labels like
  // "Full HD" are avoided on purpose: they cover two resolutions at once and drop
  // the source, which is the half that decides how good the file actually is —
  // a Remux and a WEB-DL are both 1080p and nowhere near each other.
  _qualityLabel(entry, isMovie) {
    const file = isMovie ? entry?.hasFile ? entry.movieFile : null : entry?.id ? this._sonarrEpFiles?.[entry.id] : null;
    const q = file?.quality?.quality;
    if (!q) return "";
    const res = Number(q.resolution) || 0;
    const resLbl = res >= 2160 ? "4K" : res >= 1080 ? "1080p" : res >= 720 ? "720p" : res > 0 ? "SD" : "";
    const name = String(q.name || "");
    const src = /remux/i.test(name) ? "Remux" : /bluray|bd/i.test(name) ? "BluRay" : /web/i.test(name) ? "WEB" : /hdtv|sdtv|tv/i.test(name) ? "TV" : /dvd/i.test(name) ? "DVD" : "";
    if (resLbl && src) return `${resLbl} \xB7 ${src}`;
    return resLbl || src || name;
  }
  // A show's subtitle languages, aggregated across its episodes. Bazarr is a
  // single instance keyed by Sonarr's own ids, so this covers instance 1 only.
  _tvSubInfo(seriesId, inst = "1", force = false) {
    const pc = this._posterCfg();
    if (!pc.subtitles && !force || !this._bazarrConfigured || inst !== "1" || !seriesId) return null;
    const cached = this._libTvSubCache?.get(String(seriesId));
    if (cached === void 0) {
      this._fetchLibTvSubs(seriesId);
      return null;
    }
    return cached || null;
  }
  // Rating plus language info, in whichever of the two layouts is configured.
  // The audio/subtitle toggles are applied upstream by whoever fills subCodes and
  // audioCodes, so switching them off drops the matching side of the strip.
  _ratingLangBlock(ratingObj, { subCodes = [], audioCodes = [], subBadge = "", audioBadge = "", extraBadge = "", showRating = true } = {}) {
    const pc = this._posterCfg();
    const wantRating = showRating && pc.rating && ratingObj;
    if ((pc.langDisplay || "flags") !== "tags") {
      return this._flagStrip(subCodes, audioCodes, wantRating ? this._ratingBadge(ratingObj, true, true) : "") + (extraBadge ? `<div style="display:flex;justify-content:flex-start;gap:3px;flex-wrap:wrap;margin-bottom:3px">${extraBadge}</div>` : "");
    }
    const row = audioBadge || subBadge || extraBadge ? `<div style="display:flex;justify-content:flex-start;gap:3px;flex-wrap:wrap;margin-bottom:3px">${audioBadge}${subBadge}${extraBadge}</div>` : "";
    return (wantRating ? this._ratingBadge(ratingObj) : "") + row;
  }
  // Flat SVG flags. Emoji flags are drawn as waving cloth on Apple platforms and
  // flat on Android, so they can neither be made rectangular nor kept consistent
  // — these are rendered instead, with emoji kept only as a fallback for
  // countries not covered here.
  //
  // Most flags are plain stripes, so those are declared as colour lists; the rest
  // carry their own markup. viewBox is 30x20 throughout.
  get _flagSpecs() {
    const nordic = (bg, cross, inner) => ({
      raw: `<rect width="30" height="20" fill="${bg}"/><rect x="9" y="0" width="4" height="20" fill="${cross}"/><rect x="0" y="8" width="30" height="4" fill="${cross}"/>` + (inner ? `<rect x="10" y="0" width="2" height="20" fill="${inner}"/><rect x="0" y="9" width="30" height="2" fill="${inner}"/>` : "")
    });
    return {
      // ── stripes ──
      DE: { h: ["#000000", "#dd0000", "#ffce00"] },
      NL: { h: ["#ae1c28", "#ffffff", "#21468b"] },
      RU: { h: ["#ffffff", "#0039a6", "#d52b1e"] },
      AT: { h: ["#ed2939", "#ffffff", "#ed2939"] },
      HU: { h: ["#cd2a3e", "#ffffff", "#436f4d"] },
      BG: { h: ["#ffffff", "#00966e", "#d62612"] },
      LT: { h: ["#fdb913", "#006a44", "#c1272d"] },
      EE: { h: ["#0072ce", "#000000", "#ffffff"] },
      IR: { h: ["#239f40", "#ffffff", "#da0000"] },
      ID: { h: ["#ff0000", "#ffffff"] },
      UA: { h: ["#0057b7", "#ffd700"] },
      PL: { h: ["#ffffff", "#dc143c"] },
      FR: { v: ["#002395", "#ffffff", "#ed2939"] },
      IT: { v: ["#009246", "#ffffff", "#ce2b37"] },
      RO: { v: ["#002b7f", "#fcd116", "#ce1126"] },
      BE: { v: ["#000000", "#fdda24", "#ef3340"] },
      // ── nordic crosses ──
      DK: nordic("#c8102e", "#ffffff"),
      SE: nordic("#006aa7", "#fecc00"),
      NO: nordic("#ba0c2f", "#ffffff", "#00205b"),
      FI: nordic("#ffffff", "#003580"),
      IS: nordic("#02529c", "#ffffff", "#dc1e35"),
      // ── the rest ──
      CZ: { raw: `<rect width="30" height="10" fill="#ffffff"/><rect y="10" width="30" height="10" fill="#d7141a"/><path d="M0 0 L15 10 L0 20 Z" fill="#11457e"/>` },
      SK: { raw: `<rect width="30" height="6.67" fill="#ffffff"/><rect y="6.67" width="30" height="6.67" fill="#0b4ea2"/><rect y="13.34" width="30" height="6.66" fill="#ee1c25"/><path d="M6 5.5h6v6.2c0 2-3 3.3-3 3.3s-3-1.3-3-3.3z" fill="#ee1c25" stroke="#ffffff" stroke-width="0.8"/>` },
      US: { raw: `<rect width="30" height="20" fill="#ffffff"/><rect y="0.0" width="30" height="1.54" fill="#b22234"/><rect y="3.08" width="30" height="1.54" fill="#b22234"/><rect y="6.15" width="30" height="1.54" fill="#b22234"/><rect y="9.23" width="30" height="1.54" fill="#b22234"/><rect y="12.31" width="30" height="1.54" fill="#b22234"/><rect y="15.38" width="30" height="1.54" fill="#b22234"/><rect y="18.46" width="30" height="1.54" fill="#b22234"/><rect width="12" height="10.77" fill="#3c3b6e"/><circle cx="1.3" cy="1.2" r="0.5" fill="#ffffff"/><circle cx="3.65" cy="1.2" r="0.5" fill="#ffffff"/><circle cx="6.0" cy="1.2" r="0.5" fill="#ffffff"/><circle cx="8.35" cy="1.2" r="0.5" fill="#ffffff"/><circle cx="10.7" cy="1.2" r="0.5" fill="#ffffff"/><circle cx="1.3" cy="3.8" r="0.5" fill="#ffffff"/><circle cx="3.65" cy="3.8" r="0.5" fill="#ffffff"/><circle cx="6.0" cy="3.8" r="0.5" fill="#ffffff"/><circle cx="8.35" cy="3.8" r="0.5" fill="#ffffff"/><circle cx="10.7" cy="3.8" r="0.5" fill="#ffffff"/><circle cx="1.3" cy="6.4" r="0.5" fill="#ffffff"/><circle cx="3.65" cy="6.4" r="0.5" fill="#ffffff"/><circle cx="6.0" cy="6.4" r="0.5" fill="#ffffff"/><circle cx="8.35" cy="6.4" r="0.5" fill="#ffffff"/><circle cx="10.7" cy="6.4" r="0.5" fill="#ffffff"/><circle cx="1.3" cy="9.0" r="0.5" fill="#ffffff"/><circle cx="3.65" cy="9.0" r="0.5" fill="#ffffff"/><circle cx="6.0" cy="9.0" r="0.5" fill="#ffffff"/><circle cx="8.35" cy="9.0" r="0.5" fill="#ffffff"/><circle cx="10.7" cy="9.0" r="0.5" fill="#ffffff"/>` },
      GB: { raw: `<rect width="30" height="20" fill="#012169"/><path d="M0 0L30 20M30 0L0 20" stroke="#ffffff" stroke-width="4"/><path d="M0 0L30 20M30 0L0 20" stroke="#c8102e" stroke-width="2"/><path d="M15 0v20M0 10h30" stroke="#ffffff" stroke-width="6.5"/><path d="M15 0v20M0 10h30" stroke="#c8102e" stroke-width="4"/>` },
      ES: { raw: `<rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/>` },
      PT: { raw: `<rect width="30" height="20" fill="#ff0000"/><rect width="12" height="20" fill="#006600"/><circle cx="12" cy="10" r="4" fill="#ffff00" stroke="#ff0000" stroke-width="0.8"/>` },
      JP: { raw: `<rect width="30" height="20" fill="#ffffff"/><circle cx="15" cy="10" r="5.5" fill="#bc002d"/>` },
      CN: { raw: `<rect width="30" height="20" fill="#de2910"/><path d="M5 3l1.2 3.6L3.2 4.4h3.6L3.8 6.6z" fill="#ffde00"/><circle cx="10" cy="2.5" r="0.9" fill="#ffde00"/><circle cx="12" cy="5" r="0.9" fill="#ffde00"/><circle cx="12" cy="8.5" r="0.9" fill="#ffde00"/><circle cx="10" cy="11" r="0.9" fill="#ffde00"/>` },
      KR: { raw: `<rect width="30" height="20" fill="#ffffff"/><circle cx="15" cy="10" r="5" fill="#cd2e3a"/><path d="M15 5a5 5 0 0 0 0 10 2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 0 0-5z" fill="#0047a0"/><g fill="#000"><rect x="3" y="4" width="5" height="0.9"/><rect x="3" y="5.6" width="5" height="0.9"/><rect x="22" y="4" width="5" height="0.9"/><rect x="22" y="14.2" width="5" height="0.9"/></g>` },
      GR: { raw: `<rect width="30" height="20" fill="#ffffff"/><g fill="#0d5eaf"><rect y="0" width="30" height="2.22"/><rect y="4.44" width="30" height="2.22"/><rect y="8.88" width="30" height="2.22"/><rect y="13.32" width="30" height="2.22"/><rect y="17.76" width="30" height="2.24"/></g><rect width="11.1" height="11.1" fill="#0d5eaf"/><path d="M4.4 0h2.3v11.1H4.4z M0 4.4h11.1v2.3H0z" fill="#ffffff"/>` },
      TR: { raw: `<rect width="30" height="20" fill="#e30a17"/><circle cx="12" cy="10" r="5" fill="#ffffff"/><circle cx="13.6" cy="10" r="4" fill="#e30a17"/><path d="M18 10l-3.4 1.1 2.1-2.9v3.6l-2.1-2.9z" fill="#ffffff"/>` },
      IN: { raw: `<rect width="30" height="6.67" fill="#ff9933"/><rect y="6.67" width="30" height="6.67" fill="#ffffff"/><rect y="13.34" width="30" height="6.66" fill="#138808"/><circle cx="15" cy="10" r="2.6" fill="none" stroke="#000080" stroke-width="0.8"/>` },
      IL: { raw: `<rect width="30" height="20" fill="#ffffff"/><rect y="2.5" width="30" height="2.6" fill="#0038b8"/><rect y="14.9" width="30" height="2.6" fill="#0038b8"/><path d="M15 6.2l3.2 5.6h-6.4z M15 13.8l-3.2-5.6h6.4z" fill="none" stroke="#0038b8" stroke-width="0.9"/>` },
      SA: { raw: `<rect width="30" height="20" fill="#006c35"/><rect x="6" y="12.5" width="18" height="1.2" fill="#ffffff"/><rect x="6" y="7" width="14" height="1.2" fill="#ffffff"/><rect x="6" y="9.4" width="16" height="1.2" fill="#ffffff"/>` },
      TH: { raw: `<rect width="30" height="20" fill="#a51931"/><rect y="3.33" width="30" height="13.34" fill="#f4f5f8"/><rect y="6.67" width="30" height="6.66" fill="#2d2a4a"/>` },
      HR: { raw: `<rect width="30" height="6.67" fill="#ff0000"/><rect y="6.67" width="30" height="6.67" fill="#ffffff"/><rect y="13.34" width="30" height="6.66" fill="#171796"/><g fill="#ff0000"><rect x="12" y="6" width="2" height="2"/><rect x="16" y="6" width="2" height="2"/><rect x="14" y="8" width="2" height="2"/><rect x="12" y="10" width="2" height="2"/><rect x="16" y="10" width="2" height="2"/></g><rect x="12" y="6" width="6" height="6" fill="none" stroke="#ffffff" stroke-width="0.6"/>` },
      RS: { raw: `<rect width="30" height="6.67" fill="#c6363c"/><rect y="6.67" width="30" height="6.67" fill="#0c4076"/><rect y="13.34" width="30" height="6.66" fill="#ffffff"/><path d="M9 6h5v5c0 1.6-2.5 2.6-2.5 2.6S9 12.6 9 11z" fill="#c6363c" stroke="#edb92e" stroke-width="0.7"/>` },
      VN: { raw: `<rect width="30" height="20" fill="#da251d"/><path d="M15 5.5l1.6 4.9-4.2-3h5.2l-4.2 3z" fill="#ffff00"/>` },
      MY: { raw: `<rect width="30" height="20" fill="#ffffff"/><g fill="#cc0001"><rect y="0" width="30" height="1.43"/><rect y="2.86" width="30" height="1.43"/><rect y="5.72" width="30" height="1.43"/><rect y="8.58" width="30" height="1.43"/><rect y="11.44" width="30" height="1.43"/><rect y="14.3" width="30" height="1.43"/><rect y="17.16" width="30" height="1.43"/></g><rect width="15" height="11.44" fill="#010066"/><circle cx="6.5" cy="5.7" r="3" fill="#ffcc00"/><circle cx="8" cy="5.7" r="2.4" fill="#010066"/>` },
      LV: { raw: `<rect width="30" height="20" fill="#9e3039"/><rect y="8" width="30" height="4" fill="#ffffff"/>` },
      SI: { raw: `<rect width="30" height="6.67" fill="#ffffff"/><rect y="6.67" width="30" height="6.67" fill="#0000ff"/><rect y="13.34" width="30" height="6.66" fill="#ff0000"/>` }
    };
  }
  // Flat SVG for a language's country, or null when it is not in the set above.
  _flagSvg(lang) {
    const cc = this._flagCountry(lang);
    if (!cc) return null;
    if (FLAG_SVGS[cc]) return FLAG_SVGS[cc];
    const spec = this._flagSpecs[cc];
    if (!spec) return null;
    let inner = spec.raw;
    if (!inner && spec.h) {
      const h = 20 / spec.h.length;
      inner = spec.h.map((c, i) => `<rect y="${(i * h).toFixed(2)}" width="30" height="${h.toFixed(2)}" fill="${c}"/>`).join("");
    }
    if (!inner && spec.v) {
      const w = 30 / spec.v.length;
      inner = spec.v.map((c, i) => `<rect x="${(i * w).toFixed(2)}" width="${w.toFixed(2)}" height="20" fill="${c}"/>`).join("");
    }
    if (!inner) return null;
    return `<svg class="fl-svg" viewBox="0 0 30 20" preserveAspectRatio="none" aria-hidden="true">${inner}</svg>`;
  }
  get _flStripIcons() {
    const _ico = (d) => `<svg class="fl-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${d}</svg>`;
    return {
      sub: _ico('<path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z"/>'),
      audio: _ico('<path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM16.5 12c0-1.77-1-3.29-2.5-4.03v8.05c1.5-.73 2.5-2.25 2.5-4.02zM3 9v6h4l5 5V4L7 9H3z"/>')
    };
  }
  _flagStrip(subCodes, audioCodes, ratingHtml, { endIcon = true } = {}) {
    const subs = this._topLangs((subCodes || []).filter(Boolean));
    const auds = this._topLangs((audioCodes || []).filter(Boolean));
    if (!ratingHtml && !subs.length && !auds.length) return "";
    const flag = (code, side, z, tuck, ico, casts) => {
      const art = FLAT_SVG_FLAGS ? this._flagSvg(code) || this._flagEmoji(code) : this._flagEmoji(code);
      if (!art) return "";
      const right2 = side === "right";
      const label = ico ? `<span class="fl-ico-ov fl-ico-${right2 ? "r" : "l"}">${ico}</span>` : "";
      const sh = casts ? ` fl-${right2 ? "r" : "l"}` : "";
      return `<span class="fl-flag${sh}${tuck ? " fl-tuck" : ""}" title="${this._escHtml(code)}" style="z-index:${z}">${art}${label}</span>`;
    };
    const left = subs.map((c, i) => flag(c, "left", i + 1, i > 0, "", i > 0)).join("");
    const right = auds.map((c, i) => flag(c, "right", 90 - i, true, "", i < auds.length - 1)).join("");
    const endIco = endIcon && auds.length ? `<span class="fl-ico-end">${this._flStripIcons.audio}</span>` : "";
    return `<div class="fl-strip">
    ${left}
    ${ratingHtml ? `<span class="fl-badge${subs.length ? " fl-tuck fl-sh-l" : ""}${auds.length ? " fl-sh-r" : ""}">${ratingHtml}</span>` : ""}
    ${right}
    ${endIco}
  </div>`;
  }
  // Map full language name → ISO 639-1 code
  _langCode(name) {
    const raw = String(name ?? "").trim();
    if (!raw) return "";
    const MAP = {
      czech: "CS",
      english: "EN",
      german: "DE",
      french: "FR",
      spanish: "ES",
      italian: "IT",
      polish: "PL",
      slovak: "SK",
      russian: "RU",
      japanese: "JA",
      korean: "KO",
      chinese: "ZH",
      portuguese: "PT",
      dutch: "NL",
      swedish: "SV",
      norwegian: "NO",
      danish: "DA",
      finnish: "FI",
      hungarian: "HU",
      romanian: "RO",
      ukrainian: "UK",
      turkish: "TR",
      arabic: "AR",
      hindi: "HI",
      croatian: "HR",
      serbian: "SR",
      bulgarian: "BG",
      greek: "EL",
      hebrew: "HE",
      thai: "TH",
      vietnamese: "VI",
      indonesian: "ID",
      persian: "FA",
      farsi: "FA",
      malay: "MS",
      estonian: "ET",
      latvian: "LV",
      lithuanian: "LT",
      slovenian: "SL",
      catalan: "CA",
      icelandic: "IS",
      flemish: "NL"
    };
    const ISO3 = {
      ces: "CS",
      cze: "CS",
      eng: "EN",
      deu: "DE",
      ger: "DE",
      fra: "FR",
      fre: "FR",
      spa: "ES",
      ita: "IT",
      pol: "PL",
      slk: "SK",
      slo: "SK",
      rus: "RU",
      jpn: "JA",
      kor: "KO",
      zho: "ZH",
      chi: "ZH",
      por: "PT",
      nld: "NL",
      dut: "NL",
      swe: "SV",
      nor: "NO",
      nob: "NO",
      dan: "DA",
      fin: "FI",
      hun: "HU",
      ron: "RO",
      rum: "RO",
      ukr: "UK",
      tur: "TR",
      ara: "AR",
      hin: "HI",
      hrv: "HR",
      srp: "SR",
      bul: "BG",
      ell: "EL",
      gre: "EL",
      heb: "HE",
      tha: "TH",
      vie: "VI",
      ind: "ID",
      fas: "FA",
      per: "FA",
      msa: "MS",
      may: "MS",
      est: "ET",
      lav: "LV",
      lit: "LT",
      slv: "SL",
      cat: "CA",
      isl: "IS",
      ice: "IS"
    };
    const l = raw.toLowerCase();
    if (MAP[l]) return MAP[l];
    if (ISO3[l]) return ISO3[l];
    if (l.length === 2) return raw.toUpperCase();
    if (l === "unknown" || l === "original" || l === "any") return "";
    return raw.substring(0, 2).toUpperCase();
  }
  // Max 2 languages, CS first then EN then others
  _topLangs(langs) {
    const unique = [...new Set(langs.filter(Boolean))];
    if (unique.length <= 2) return unique;
    const priority = ["CS", "EN"];
    const ordered = [
      ...priority.filter((l) => unique.includes(l)),
      ...unique.filter((l) => !priority.includes(l))
    ];
    return ordered.slice(0, 2);
  }
  _getRadarrPoster(m) {
    if (!m.images) return null;
    const img = m.images.find((i) => i.coverType === "poster");
    return img ? img.remoteUrl : null;
  }
  _getSonarrPoster(s) {
    if (!s.images) return null;
    const img = s.images.find((i) => i.coverType === "poster");
    return img ? img.remoteUrl : null;
  }
  _qualityBadge2(m) {
    if (!this._radarr2Configured) return "";
    const m2 = m.tmdbId ? this._radarr2ByTmdb.get(String(m.tmdbId)) : null;
    if (!m2) return "";
    const inR2 = m2.hasFile;
    const inR1 = m.hasFile;
    const style = "font-size:8px;padding:1px 4px;border-radius:3px;color:#fff;font-weight:700;letter-spacing:.3px";
    if (inR1 && inR2) return `<span class="badge b-r2" style="background:linear-gradient(90deg,rgba(0,120,255,0.85),rgba(140,40,220,0.85));${style}">R+R2</span>`;
    if (inR2) return `<span class="badge b-r2" style="background:rgba(140,40,220,0.85);${style}">R2</span>`;
    return "";
  }
  _renderRadarrCard(m) {
    const pc = this._posterCfg();
    const poster = this._getRadarrPoster(m);
    const title = this._escHtml(m.title || "Unknown");
    const grad = "rgba(0,0,0,0.88)";
    const tc = "rgba(var(--arr-pt-rgb, 255, 255, 255), 1)";
    const hasFile = m.hasFile;
    const cutoffNotMet = m.movieFile?.qualityCutoffNotMet;
    const dlFailed = this._radarrQueueFailed.has(m.id);
    const dlActive = this._radarrQueueActive.has(m.id);
    let badgeCls = "";
    if (hasFile && cutoffNotMet) badgeCls = "b-cutoff";
    else if (hasFile) badgeCls = "b-st-avail";
    else if (dlFailed) badgeCls = "b-missing";
    else if (dlActive) badgeCls = "b-dl";
    else badgeCls = "b-missing";
    let badgeHtml = "";
    if (badgeCls === "b-cutoff") badgeHtml = this._badge("b-cutoff", "\u26A1", "Upgrade");
    else if (badgeCls === "b-st-avail") badgeHtml = this._badge("b-st-avail", "\u2713", this._t("badgeAvailable"));
    else if (badgeCls === "b-dl") badgeHtml = this._badge("b-dl", "\u2193", this._t("badgeDownloading"));
    else if (dlFailed) badgeHtml = this._badge("b-missing", "\u2717", this._t("badgeFailed"));
    else badgeHtml = this._badge("b-missing", "\u2717", this._t("badgeMissing"));
    const showTag = pc.statusDisplay === "tags" || pc.statusDisplay === "both";
    const showStripe = pc.statusDisplay === "stripes" || pc.statusDisplay === "both";
    const statusBadge = badgeHtml && showTag ? this._statusBadge(badgeHtml) : "";
    const stripe = showStripe ? this._statusStripe(this._statusStripeColor(badgeCls), badgeCls === "b-dl", this._dlPct(m.id, "movie", m._isRadarr2 ? "radarr2" : "radarr")) : "";
    const qualBadge4k = this._qualityBadge2(m);
    let audioBadge = "";
    let subBadge = "";
    let audioCodes = [];
    let subCodes = [];
    if (hasFile) {
      if (pc.audio) {
        let audioLangs = [];
        if (Array.isArray(m.movieFile?.languages) && m.movieFile.languages.length > 0) {
          audioLangs = m.movieFile.languages.map((l) => this._langCode(l.name || "")).filter(Boolean);
        } else if (m.movieFile?.mediaInfo?.audioLanguages) {
          audioLangs = m.movieFile.mediaInfo.audioLanguages.split(/\s*[\/,]\s*/).map((l) => this._langCode(l.trim())).filter(Boolean);
        }
        if (audioLangs.length > 0) {
          audioCodes = audioLangs;
          const codes = this._topLangs(audioLangs).join(" | ");
          audioBadge = this._badgeIcon("b-audio", "mdi:volume-high", codes);
        }
      }
      if (pc.subtitles) {
        const bz = this._bazarrConfigured ? this._bazarr[m.id] : null;
        if (bz) {
          if (bz.missing.length > 0) {
            subCodes = [];
            const langs = this._topLangs(bz.missing.map((s) => (s.code2 || s.name || "?").toUpperCase())).join(" | ");
            subBadge = this._badgeIcon("b-sub-miss", "mdi:subtitles-outline", langs);
          } else if (bz.subtitles.length > 0) {
            subCodes = bz.subtitles.map((s) => (s.code2 || s.name || "?").toUpperCase());
            const langs = this._topLangs(subCodes).join(" | ");
            subBadge = this._badgeIcon("b-sub-ok", "mdi:subtitles", langs);
          }
        }
      }
    }
    const img = this._mcImg(poster, "\u{1F3AC}", m.id);
    return `
    <div class="mc" data-popup="${POPUP_TYPE.RADARR}" data-tmdbid="${m.tmdbId}" data-title="${title}">
      ${img}
      ${statusBadge}
      ${this._goneBadge(m.tmdbId, null, true)}
      ${this._mcGrad(grad, `${this._ratingLangBlock(m, { subCodes, audioCodes, subBadge, audioBadge, extraBadge: qualBadge4k })}
        ${pc.title ? `<div style="font-size:10px;font-weight:600;color:${tc};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</div>` : ""}`)}
      ${stripe}
    </div>`;
  }
  _renderSonarrCard(s) {
    const pc = this._posterCfg();
    const poster = this._getSonarrPoster(s);
    const title = this._escHtml(s.title || "Unknown");
    const grad = "rgba(0,0,0,0.88)";
    const tc = "rgba(var(--arr-pt-rgb, 255, 255, 255), 1)";
    const stats = s.statistics || {};
    const fileCount = stats.episodeFileCount || 0;
    const totalCount = stats.episodeCount || 0;
    let badgeCls = "";
    let badgeHtml = "";
    if (fileCount === 0 && totalCount > 0) {
      badgeCls = "b-missing";
      badgeHtml = this._badge("b-missing", "\u2717", this._t("badgeMissing"));
    } else if (fileCount < totalCount) {
      badgeCls = "b-partial";
      badgeHtml = `<span class="badge b-partial">${fileCount}/<span class="b-txt">${totalCount}</span></span>`;
    } else if (totalCount > 0 && s.status === "continuing") {
      badgeCls = "b-continuing";
      badgeHtml = this._badge("b-continuing", "\u25B6", this._t("badgeAvailable"));
    } else if (totalCount > 0) {
      badgeCls = "b-st-avail";
      badgeHtml = this._badge("b-st-avail", "\u2713", this._t("badgeAvailable"));
    }
    const showTag = pc.statusDisplay === "tags" || pc.statusDisplay === "both";
    const showStripe = pc.statusDisplay === "stripes" || pc.statusDisplay === "both";
    const statusBadge = badgeHtml && showTag ? this._statusBadge(badgeHtml) : "";
    const partialPct = badgeCls === "b-partial" && totalCount > 0 ? Math.round(fileCount / totalCount * 100) : -1;
    const stripePct = badgeCls === "b-dl" ? this._dlPct(s.id, "tv", s._isSonarr2 ? "sonarr2" : "sonarr") : partialPct;
    const stripe = badgeCls && showStripe ? this._statusStripe(this._statusStripeColor(badgeCls), badgeCls === "b-dl", stripePct) : "";
    const img = this._mcImg(poster, "\u{1F4FA}", s.id);
    let audioCodes = [];
    const _snInst = s._isSonarr2 ? "2" : "1";
    if (pc.audio && totalCount > 0) {
      const cached = this._libTvAudioCache.get(`${_snInst}-${s.id}`);
      if (Array.isArray(cached) && cached.length) audioCodes = cached;
      else if (cached === void 0) this._fetchLibTvAudio(s.id, _snInst);
    }
    const _snSubs = totalCount > 0 ? this._tvSubInfo(s.id, _snInst) : null;
    return `
    <div class="mc" data-popup="${POPUP_TYPE.SONARR}" data-tvdbid="${s.tvdbId}" data-tmdbid="${s.tmdbId || ""}" data-title="${title}">
      ${this._goneBadge(s.tmdbId, s.tvdbId, false)}
      ${img}
      ${statusBadge}
      ${this._mcGrad(grad, `${this._ratingLangBlock(s, {
      audioCodes,
      subCodes: _snSubs && !_snSubs.missing ? _snSubs.codes : [],
      audioBadge: audioCodes.length ? this._badgeIcon("b-audio", "mdi:volume-high", this._topLangs(audioCodes).join(" | ")) : "",
      subBadge: _snSubs ? this._badgeIcon(_snSubs.missing ? "b-sub-miss" : "b-sub-ok", _snSubs.missing ? "mdi:subtitles-outline" : "mdi:subtitles", this._topLangs(_snSubs.codes).join(" | ")) : ""
    })}
        ${pc.title ? `<div style="font-size:10px;font-weight:600;color:${tc};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</div>` : ""}`)}
      ${stripe}
    </div>`;
  }
  _renderRecentlyAddedCard(item) {
    if (item._mediaType === "music") return this._renderMusicCard(item);
    const pc = this._posterCfg();
    const isMovie = item._mediaType === "movie";
    const poster = isMovie ? this._getRadarrPoster(item) : this._getSonarrPoster(item);
    const title = this._escHtml(item.title || "Unknown");
    const typeTag = isMovie ? this._t("typeMovie") : this._t("typeTv");
    const popup = isMovie ? POPUP_TYPE.RADARR : POPUP_TYPE.SONARR;
    const grad = "rgba(0,0,0,0.88)";
    const tc = "rgba(var(--arr-pt-rgb, 255, 255, 255), 1)";
    const img = this._mcImg(poster, isMovie ? "\u{1F3AC}" : "\u{1F4FA}", item.id);
    const tvdbAttr = !isMovie && item.tvdbId ? ` data-tvdbid="${item.tvdbId}"` : "";
    const tmdbAttr = item.tmdbId ? ` data-tmdbid="${item.tmdbId}"` : "";
    const radarrAttr = isMovie ? item._isRadarr2 ? ` data-radarr2id="${item.id}"` : ` data-radarrid="${item.id}"` : "";
    let badgeCls = "";
    let badgeHtml = "";
    if (isMovie) {
      if (item.movieFile?.qualityCutoffNotMet) {
        badgeCls = "b-cutoff";
        badgeHtml = this._badge("b-cutoff", "\u26A1", "Upgrade");
      } else {
        badgeCls = "b-st-avail";
        badgeHtml = this._badge("b-st-avail", "\u2713", this._t("badgeAvailable"));
      }
    } else {
      const fileCount = item.statistics?.episodeFileCount ?? 0;
      const totalCount = item.statistics?.episodeCount ?? 0;
      const isPartial = totalCount > 0 && fileCount < totalCount;
      const importEps = item._isSonarr2 ? this._sonarr2ImportEps || {} : this._sonarrImportEps || {};
      const imp = importEps[item.id];
      if (imp && imp.length > 0) {
        if (isPartial) {
          badgeCls = "b-partial";
          badgeHtml = `<span class="badge b-partial">${fileCount}/<span class="b-txt">${totalCount}</span></span>`;
        } else {
          const epLabel = this._importEpLabel(imp);
          badgeCls = "b-st-avail";
          badgeHtml = this._badge("b-st-avail", "\u2713", epLabel || this._t("badgeAvailable"));
        }
      } else {
        const epFile = this._sonarrEpFiles?.[item.id];
        if (epFile) {
          if (isPartial) {
            badgeCls = "b-partial";
            badgeHtml = `<span class="badge b-partial">${fileCount}/<span class="b-txt">${totalCount}</span></span>`;
          } else {
            const match = (epFile.relativePath || "").match(/[Ss](\d{1,2})[Ee](\d{1,3})/);
            badgeCls = "b-st-avail";
            badgeHtml = match ? this._badge("b-st-avail", "\u2713", `S${String(match[1]).padStart(2, "0")}E${String(match[2]).padStart(2, "0")}`) : this._badge("b-st-avail", "\u2713", this._t("badgeAvailable"));
          }
        } else {
          if (isPartial) {
            badgeCls = "b-partial";
            badgeHtml = `<span class="badge b-partial">${fileCount}/<span class="b-txt">${totalCount}</span></span>`;
          } else {
            badgeCls = "b-st-avail";
            badgeHtml = this._badge("b-st-avail", "\u2713", this._t("badgeAvailable"));
          }
        }
      }
    }
    const showTag = pc.statusDisplay === "tags" || pc.statusDisplay === "both";
    const showStripe = pc.statusDisplay === "stripes" || pc.statusDisplay === "both";
    const statusBadge = badgeHtml && showTag ? this._statusBadge(badgeHtml) : "";
    const _partialPct = !isMovie && badgeCls === "b-partial" && (item.statistics?.episodeCount || 0) > 0 ? Math.round((item.statistics?.episodeFileCount || 0) / (item.statistics?.episodeCount || 1) * 100) : -1;
    const _stripePct = badgeCls === "b-dl" ? this._dlPct(
      item.id,
      isMovie ? "movie" : "tv",
      isMovie ? item._isRadarr2 ? "radarr2" : "radarr" : item._isSonarr2 ? "sonarr2" : "sonarr"
    ) : _partialPct;
    const stripe = badgeCls && showStripe ? this._statusStripe(this._statusStripeColor(badgeCls), badgeCls === "b-dl", _stripePct) : "";
    let audioBadge = "";
    let subBadge = "";
    let audioCodes = [];
    let subCodes = [];
    if (isMovie) {
      if (pc.audio) {
        let audioLangs = [];
        if (Array.isArray(item.movieFile?.languages) && item.movieFile.languages.length > 0) {
          audioLangs = item.movieFile.languages.map((l) => this._langCode(l.name || "")).filter(Boolean);
        } else if (item.movieFile?.mediaInfo?.audioLanguages) {
          audioLangs = item.movieFile.mediaInfo.audioLanguages.split(/\s*[\/,]\s*/).map((l) => this._langCode(l.trim())).filter(Boolean);
        }
        if (audioLangs.length > 0) {
          audioCodes = audioLangs;
          const codes = this._topLangs(audioLangs).join(" | ");
          audioBadge = this._badgeIcon("b-audio", "mdi:volume-high", codes);
        }
      }
      if (pc.subtitles) {
        const bz = this._bazarrConfigured ? this._bazarr[item.id] : null;
        if (bz) {
          if (bz.missing.length > 0) {
            subCodes = [];
            const langs = this._topLangs(bz.missing.map((s) => (s.code2 || s.name || "?").toUpperCase())).join(" | ");
            subBadge = this._badgeIcon("b-sub-miss", "mdi:subtitles-outline", langs);
          } else if (bz.subtitles.length > 0) {
            subCodes = bz.subtitles.map((s) => (s.code2 || s.name || "?").toUpperCase());
            const langs = this._topLangs(subCodes).join(" | ");
            subBadge = this._badgeIcon("b-sub-ok", "mdi:subtitles", langs);
          }
        }
      }
    } else {
      const epFile = this._sonarrEpFiles?.[item.id];
      if (epFile) {
        if (pc.audio) {
          let audioLangs = [];
          if (Array.isArray(epFile.languages) && epFile.languages.length > 0) {
            audioLangs = epFile.languages.map((l) => this._langCode(l.name || "")).filter(Boolean);
          } else if (epFile.mediaInfo?.audioLanguages) {
            audioLangs = epFile.mediaInfo.audioLanguages.split(/\s*[\/,]\s*/).map((l) => this._langCode(l.trim())).filter(Boolean);
          }
          if (audioLangs.length > 0) {
            audioCodes = audioLangs;
            const codes = this._topLangs(audioLangs).join(" | ");
            audioBadge = this._badgeIcon("b-audio", "mdi:volume-high", codes);
          }
        }
        if (pc.subtitles) {
          const bze = this._bazarrConfigured ? this._bazarrEpisodes?.[epFile.id] : null;
          if (bze) {
            if (bze.missing.length > 0) {
              subCodes = [];
              const langs = this._topLangs(bze.missing.map((s) => (s.code2 || s.name || "?").toUpperCase())).join(" | ");
              subBadge = this._badgeIcon("b-sub-miss", "mdi:subtitles-outline", langs);
            } else if (bze.subtitles.length > 0) {
              subCodes = bze.subtitles.map((s) => (s.code2 || s.name || "?").toUpperCase());
              const langs = this._topLangs(subCodes).join(" | ");
              subBadge = this._badgeIcon("b-sub-ok", "mdi:subtitles", langs);
            }
          } else if (epFile.mediaInfo?.subtitles) {
            subCodes = epFile.mediaInfo.subtitles.split(/\s*[\/,]\s*/).map((l) => this._langCode(l.trim())).filter(Boolean);
            const subLangs = this._topLangs(subCodes).join(" | ");
            if (subLangs) subBadge = this._badgeIcon("b-sub-ok", "mdi:subtitles", subLangs);
          }
        }
      }
    }
    if (!isMovie && !audioCodes.length && pc.audio) {
      const l = this._arrLangCodes(item, false);
      if (l.audioCodes.length) {
        audioCodes = l.audioCodes;
        audioBadge = this._badgeIcon("b-audio", "mdi:volume-high", this._topLangs(audioCodes).join(" | "));
      }
    }
    if (!isMovie && !subCodes.length) {
      const l = this._arrLangCodes(item, false);
      if (l.subCodes.length) {
        subCodes = l.subCodes;
        subBadge = this._badgeIcon("b-sub-ok", "mdi:subtitles", this._topLangs(subCodes).join(" | "));
      }
    }
    let epBadge = "";
    if (!isMovie) {
      const importEps = item._isSonarr2 ? this._sonarr2ImportEps || {} : this._sonarrImportEps || {};
      const imp = importEps[item.id];
      if (imp) {
        const epLabel = this._importEpLabel(imp);
        if (epLabel) epBadge = `<span class="badge b-ep">${epLabel}</span>`;
      } else {
        const epFile = this._sonarrEpFiles?.[item.id];
        if (epFile) {
          const match = (epFile.relativePath || "").match(/[Ss](\d{1,2})[Ee](\d{1,3})/);
          if (match) epBadge = `<span class="badge b-ep">S${String(match[1]).padStart(2, "0")}E${String(match[2]).padStart(2, "0")}</span>`;
        }
      }
    }
    return `
    <div class="mc" data-popup="${popup}"${tmdbAttr}${tvdbAttr}${radarrAttr} data-title="${title}">
      ${this._goneBadge(item.tmdbId, item.tvdbId, !!isMovie)}
      ${img}
      <div style="position:absolute;top:6px;left:6px;z-index:2;display:flex;flex-direction:column;gap:3px;align-items:flex-start">
        ${pc.mediaType ? `<span class="media-type-tag" style="position:static">${typeTag}</span>` : ""}
        ${epBadge}
      </div>
      ${statusBadge}
      ${this._mcGrad(grad, `${this._ratingLangBlock(item, { subCodes, audioCodes, subBadge, audioBadge })}
        ${pc.title ? `<div style="font-size:10px;font-weight:600;color:${tc};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</div>` : ""}`)}
      ${stripe}
    </div>`;
  }
  _renderRecentlyRequestedCard(item) {
    if (item._mediaType === "music") return this._renderMusicCard(item, { requested: true });
    const pc = this._posterCfg();
    const isMovie = item._mediaType === "movie";
    const seerrOnly = !!item._seerrOnly;
    const arrPoster = isMovie ? this._getRadarrPoster(item) : this._getSonarrPoster(item);
    const poster = arrPoster || (item._seerrPoster ? item._seerrPoster.startsWith("http") ? item._seerrPoster : `https://image.tmdb.org/t/p/w342${item._seerrPoster}` : null);
    const title = this._escHtml(item.title || "Unknown");
    const typeTag = isMovie ? this._t("typeMovie") : this._t("typeTv");
    const popup = seerrOnly ? isMovie ? POPUP_TYPE.MOVIE : POPUP_TYPE.TV : isMovie ? POPUP_TYPE.RADARR : POPUP_TYPE.SONARR;
    const grad = "rgba(0,0,0,0.88)";
    const tc = "rgba(var(--arr-pt-rgb, 255, 255, 255), 1)";
    const img = this._mcImg(poster, isMovie ? "\u{1F3AC}" : "\u{1F4FA}", item.id || item.tmdbId);
    const tvdbAttr = !isMovie && item.tvdbId ? ` data-tvdbid="${item.tvdbId}"` : "";
    const tmdbAttr = item.tmdbId ? ` data-tmdbid="${item.tmdbId}"` : "";
    const radarrAttr = isMovie && item.id ? item._isRadarr2 ? ` data-radarr2id="${item.id}"` : ` data-radarrid="${item.id}"` : "";
    let badgeCls = "";
    let badgeHtml = "";
    const dlActive = item.id != null && (isMovie ? (item._isRadarr2 ? this._radarr2QueueActive : this._radarrQueueActive)?.has(item.id) : (item._isSonarr2 ? this._sonarr2QueueSeriesPct : this._sonarrQueueSeriesPct)?.has(item.id));
    const dlFailed = isMovie && item.id != null && (item._isRadarr2 ? this._radarr2QueueFailed : this._radarrQueueFailed)?.has(item.id);
    if (dlFailed) {
      badgeCls = "b-missing";
      badgeHtml = this._badge("b-missing", "\u2717", this._t("badgeFailed"));
    } else if (dlActive) {
      badgeCls = "b-dl";
      badgeHtml = this._badge("b-dl", "\u2193", this._t("badgeDownloading"));
    } else if (item._seerr) {
      if (item._seerrStatus === 3) {
        badgeCls = "b-missing";
        badgeHtml = this._badge("b-missing", "\u2717", this._t("badgeDeclined"));
      } else if (item._seerrMedia === 5) {
        badgeCls = "b-st-avail";
        badgeHtml = this._badge("b-st-avail", "\u2713", this._t("badgeAvailable"));
      } else if (item._seerrMedia === 4) {
        badgeCls = "b-partial";
        badgeHtml = this._badge("b-partial", "\u25D0", this._t("badgePartial"));
      } else if (item._seerrStatus === 1) {
        badgeCls = "b-st-pend";
        badgeHtml = this._badge("b-st-pend", "\u23F3", this._t("badgeRequested"));
      } else {
        badgeCls = "b-missing";
        badgeHtml = this._badge("b-missing", "\u2717", this._t("badgeMissing"));
      }
    } else {
      badgeCls = "b-missing";
      badgeHtml = this._badge("b-missing", "\u2717", this._t("badgeMissing"));
    }
    const showTag = pc.statusDisplay === "tags" || pc.statusDisplay === "both";
    const showStripe = pc.statusDisplay === "stripes" || pc.statusDisplay === "both";
    const statusBadge = badgeHtml && showTag ? this._statusBadge(badgeHtml) : "";
    const stripe = badgeCls && showStripe ? this._statusStripe(this._statusStripeColor(badgeCls), badgeCls === "b-dl", item.id != null ? this._dlPct(
      item.id,
      isMovie ? "movie" : "tv",
      isMovie ? item._isRadarr2 ? "radarr2" : "radarr" : item._isSonarr2 ? "sonarr2" : "sonarr"
    ) : -1) : "";
    const _rqLangs = seerrOnly ? [] : this._arrLangCodes(item, isMovie);
    return `
    <div class="mc" data-popup="${popup}"${tmdbAttr}${tvdbAttr}${radarrAttr} data-title="${title}">
      ${this._goneBadge(item.tmdbId, item.tvdbId, !!isMovie)}
      ${img}
      ${pc.mediaType ? `<span class="media-type-tag">${typeTag}</span>` : ""}
      ${statusBadge}
      ${this._mcGrad(grad, `${this._ratingLangBlock(item, _rqLangs)}
        ${pc.title ? `<div style="font-size:10px;font-weight:600;color:${tc};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</div>` : ""}`)}
      ${stripe}
    </div>`;
  }
  // A missing portrait falls back to initials — two of them when the name has
  // more than one word, which is what tells "Alan Walker" from "ABBA".
  _musInitials(name) {
    const words = String(name || "?").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "?";
    const take = words.length > 1 ? words.slice(0, 2) : words.slice(0, 1);
    return take.map((w) => [...w][0].toUpperCase()).join("");
  }
  _musRatingBadge(artist, inline = false, solid = false) {
    if (!inline && !this._posterCfg().rating) return "";
    const v = artist?.ratings?.value;
    if (!v) return "";
    const display = (Math.round(v * 10) / 10).toFixed(1);
    const votes = artist?.ratings?.votes;
    const tip = votes ? ` title="MusicBrainz \xB7 ${votes} ${votes === 1 ? "vote" : "votes"}"` : ' title="MusicBrainz"';
    if (solid) {
      const sty2 = "border-color:transparent;background:rgba(186,71,143,0.85);color:#fff;text-shadow:none";
      const num = "line-height:1;display:block;margin-top:-1px;font-variant-numeric:tabular-nums";
      return `<span class="imdb"${tip} style="${sty2};padding:2px 5px;gap:3px"><span style="${num}">${display}</span></span>`;
    }
    const icon = `<svg width="22" height="11" viewBox="0 0 64 28" style="flex-shrink:0"><rect width="64" height="28" rx="4" fill="#BA478F"/><text x="32" y="21" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" font-weight="900" fill="#fff">MB</text></svg>`;
    const sty = "border-color:rgba(186,71,143,0.45);background:rgba(186,71,143,0.22)";
    const badge = `<span class="imdb"${tip} style="${sty};padding:2px 3px;gap:3px">${icon}<span style="line-height:1;display:block;margin-top:-1px">${display}</span></span>`;
    return inline ? badge : `<div style="margin-bottom:3px">${badge}</div>`;
  }
  // The row lists artists, the way Lidarr's own library does — and the way this
  // card already treats series. Artist artwork is square (measured: 1000x1000),
  // the grid is 2:3, so the portrait sits over the artist's own fanart rather
  // than being cropped or leaving the row a third shorter than every other one.
  _renderMusicCard(entry, { noSub = false, noStatus = false, requested = false } = {}) {
    const pc = this._posterCfg();
    const artist = entry.artist || {};
    const album = entry.newestAlbum || null;
    const front = this._lidarrArtistImage(artist, "poster") || (album ? this._lidarrCover(album) : null);
    const back = this._lidarrArtistImage(artist, "fanart") || (album ? this._lidarrCover(album) : null);
    const name = this._escHtml(artist.artistName || "Unknown");
    const sub = noSub ? "" : entry.newAlbumCount > 1 ? `${entry.newAlbumCount} ${this._t("musicNewAlbums")}` : this._escHtml(album?.title || "");
    const ast = artist.statistics || {};
    const st = ast.totalTrackCount !== void 0 ? ast : album?.statistics || {};
    const have = st.trackFileCount ?? 0;
    const total = st.trackCount ?? 0;
    const allTr = st.totalTrackCount ?? total;
    const dlAlbum = album && this._lidarrQueue?.has(album.id);
    const dlArtist = this._lidarrQueueArtists?.get(artist.id);
    const dl = dlAlbum || dlArtist !== void 0;
    let badgeCls = "";
    let badgeHtml = "";
    if (dl) {
      badgeCls = "b-dl";
      badgeHtml = this._badge("b-dl", "\u2193", this._t("badgeDownloading"));
    } else if (total > 0 && have >= total) {
      badgeCls = allTr > total ? "b-continuing" : "b-st-avail";
      badgeHtml = this._badge(badgeCls, "\u2713", this._t("badgeAvailable"));
    } else if (have > 0) {
      badgeCls = "b-partial";
      badgeHtml = `<span class="badge b-partial">${have}/<span class="b-txt">${total}</span></span>`;
    } else {
      badgeCls = "b-missing";
      badgeHtml = this._badge("b-missing", "\u2717", this._t("badgeMissing"));
    }
    const showTag = !noStatus && (pc.statusDisplay === "tags" || pc.statusDisplay === "both");
    const showStripe = !noStatus && (pc.statusDisplay === "stripes" || pc.statusDisplay === "both");
    const statusBadge = badgeHtml && showTag ? this._statusBadge(badgeHtml) : "";
    const dlPct = dlAlbum ? this._lidarrQueuePct?.get(album.id) ?? -1 : dlArtist ?? -1;
    const pct = badgeCls === "b-dl" ? dlPct : requested ? -1 : total > 0 && have < total && have > 0 ? Math.round(have / total * 100) : -1;
    const stripeCls = requested && badgeCls !== "b-dl" ? "b-missing" : badgeCls;
    const stripeColor = stripeCls === "b-missing" && !requested ? "#555" : this._statusStripeColor(stripeCls);
    const stripe = badgeCls && showStripe ? this._statusStripe(stripeColor, badgeCls === "b-dl", pct) : "";
    const perf = this._cfgGet("styles", "performanceMode", false);
    const backLayer = !perf && back ? `<img src="${back}" class="mus-back" loading="lazy" aria-hidden="true" onerror="this.style.display='none'">` : "";
    const frontEl = front ? `<img src="${front}" class="mus-cover" loading="lazy" onerror="this.style.display='none'">` : `<div class="mus-cover mus-cover-ph">${this._escHtml(this._musInitials(artist.artistName))}</div>`;
    const grad = "rgba(0,0,0,0.88)";
    const tc = "rgba(var(--arr-pt-rgb, 255, 255, 255), 1)";
    return `
    <div class="mc mc-music${backLayer ? "" : " mus-flat"}${this._libFlashArtist && this._libFlashArtist === artist.id ? " lib-flash" : ""}"${this._isDay ? ` style="${backLayer ? "" : "background:rgba(0,0,0,0.05);"}border-color:rgba(0,0,0,0.14);box-shadow:inset 0 1px 0 rgba(255,255,255,0.35)"` : ""} data-artist-id="${artist.id}" data-title="${name}">
      ${backLayer}
      <div class="mus-scrim"></div>
      ${frontEl}
      ${pc.mediaType ? `<span class="media-type-tag">${this._t("typeArtist")}</span>` : ""}
      ${statusBadge}
      ${this._mcGrad(grad, `${this._flagStrip(
      [],
      this._musOrigin(artist),
      pc.rating ? this._musRatingBadge(artist, true, true) : "",
      { endIcon: false }
    )}${pc.title ? `<div style="font-size:10px;font-weight:600;color:${tc};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div>` : ""}
        ${sub ? `<div style="font-size:9px;color:rgba(var(--arr-pt-rgb,255,255,255),0.66);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sub}</div>` : ""}`)}
      ${stripe}
    </div>`;
  }
  _renderTvUpcomingCard(m, { showDate = true, showRating = false, typeTag = "", overlayIndex = null, source = "tvUpcoming", watchedBtn = "", traktOverlays = "" } = {}) {
    const title = this._escHtml(m.name || m.originalName || "Unknown");
    const rating = m.voteAverage ? m.voteAverage.toFixed(1) : "?";
    const dateStr = this.fmtDate(m.firstAirDate || m.first_air_date);
    const mediaStatus = m.mediaInfo?.status;
    const sonarrEntry = Array.isArray(this._sonarr) && this._sonarr.find((s) => s.tmdbId === m.id);
    const inSonarr = !!sonarrEntry;
    const inSonarrAvail = !!(sonarrEntry && sonarrEntry.statistics?.episodeFileCount > 0);
    const _sonarrFc = sonarrEntry?.statistics?.episodeFileCount || 0;
    const _sonarrTc = sonarrEntry?.statistics?.episodeCount || 0;
    const _sonarrPartial = inSonarrAvail && _sonarrTc > 0 && _sonarrFc < _sonarrTc;
    const _inOptimistic = this._optimisticRequested.has(m.id);
    const _withdrawn = this._withdrawnIds.has(m.id);
    const _hasPending = this._familyPendingIds.has(m.id);
    const _stale = mediaStatus >= 3 && !inSonarr && !_inOptimistic && !_hasPending;
    const _isAvail = (inSonarrAvail || mediaStatus === 5) && !_withdrawn && !_stale;
    const _isReq = (mediaStatus >= 2 || _inOptimistic || _hasPending || inSonarr) && !_withdrawn && !inSonarrAvail && !_stale;
    const _reqId = m.mediaInfo?.requests?.[0]?.id || this._familyPendingIds.get(m.id);
    const _isAdmin = this._hass.user.is_admin;
    const _noSeerr = this._overseerrConfigured === false;
    let actionBtn = "";
    if (_isAvail) {
      actionBtn = "";
    } else if (_isReq) {
      if (_isAdmin || _noSeerr || mediaStatus >= 3 && !_inOptimistic && !_hasPending) {
        actionBtn = "";
      } else {
        const withdrawBtn = _reqId ? `<button class="req-withdraw" data-reqid="${_reqId}" data-mediaid="${m.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>` : "";
        actionBtn = withdrawBtn;
      }
    } else {
      actionBtn = `<button class="btn-add tv-req-open" data-showid="${m.id}" data-title="${title}" data-source="${source}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" width="14" height="14" style="display:block"><path d="M12 5v14M5 12h14"/></svg></button>`;
    }
    const pc = this._posterCfg();
    let badgeCls = "";
    let badgeHtml = "";
    if (_isAvail) {
      if (_sonarrPartial) {
        badgeCls = "b-partial";
        badgeHtml = `<span class="badge b-partial">${_sonarrFc}/<span class="b-txt">${_sonarrTc}</span></span>`;
      } else {
        badgeCls = "b-st-avail";
        badgeHtml = this._badge("b-st-avail", "\u2713", this._t("badgeAvailable"));
      }
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
    const _partialPct2 = badgeCls === "b-partial" && _sonarrTc > 0 ? Math.round(_sonarrFc / _sonarrTc * 100) : -1;
    const _stripePct2 = badgeCls === "b-dl" ? this._dlPct(sonarrEntry?.id, "tv") : _partialPct2;
    const stripe = badgeCls && showStripe ? this._statusStripe(this._statusStripeColor(badgeCls), badgeCls === "b-dl", _stripePct2) : "";
    const grad = "rgba(0,0,0,0.88)";
    const tc = "rgba(var(--arr-pt-rgb, 255, 255, 255), 1)";
    const effectiveTypeTag = typeTag || (showDate ? this._t("typeTv") : "");
    const img = this._mcImg(m.posterPath ? m.posterPath.startsWith("http") ? m.posterPath : `https://image.tmdb.org/t/p/w342${m.posterPath}` : null, "\u{1F4FA}", m.id);
    const _tvLangs = this._arrLangCodes(sonarrEntry, false);
    const ratingHtml = this._ratingLangBlock(m, { ..._tvLangs, showRating });
    return `
    <div class="mc" data-popup="${POPUP_TYPE.TV}" data-tmdbid="${m.id}" data-title="${title}"${overlayIndex !== null ? ` data-oi="${overlayIndex}"` : ""}>
      ${this._goneBadge(m.id, m.tvdbId || null, false)}
      ${img}
      ${traktOverlays}
      ${effectiveTypeTag && pc.mediaType ? `<span class="media-type-tag"><span class="b-txt">${effectiveTypeTag}</span></span>` : ""}
      ${showDate ? `<div style="position:absolute;top:6px;right:6px;z-index:2;display:flex;flex-direction:column;gap:3px;align-items:flex-end">
        ${dateStr ? `<span class="media-type-tag" style="position:static">${dateStr}</span>` : ""}
        ${statusBadge}
      </div>` : statusBadge}
      ${this._mcGrad(grad, `${ratingHtml}${pc.title ? `<div style="font-size:10px;font-weight:600;color:${tc};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${actionBtn ? "padding-right:20px" : ""}">${title}</div>` : ""}${actionBtn ? `<div style="position:absolute;bottom:8px;right:10px">${actionBtn}</div>` : ""}`)}
      ${stripe}
    </div>`;
  }
  _renderTraktCard(m, overlayIndex = null) {
    if (m._traktLoading) {
      return `<div class="mc trakt-loading-card" style="display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.03);animation:trakt-pulse 1.8s ease-in-out infinite">
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
        <span class="action-spinner" style="width:18px;height:18px;border-width:2px;border-color:rgba(255,255,255,0.12);border-top-color:rgba(255,255,255,0.5)"></span>
        <span style="font-size:9px;color:rgba(255,255,255,0.3);text-align:center;letter-spacing:0.5px">${this._t("traktRefreshing")}</span>
      </div>
    </div>`;
    }
    const normalized = Object.assign({}, m, {
      name: m.name || m.title,
      originalName: m.originalName || m.title,
      firstAirDate: m.firstAirDate || m.releaseDate,
      releaseDate: m.releaseDate
    });
    const alreadyHidden = this._traktWatching?.has(m._traktSlug || String(m.id));
    const traktData = `data-trakt-slug="${m._traktSlug || ""}" data-trakt-type="${m.mediaType}" data-trakt-tmdb="${m.id}"`;
    const _chars = (s) => s.toUpperCase().split("").join("<br>");
    const traktOverlays = alreadyHidden ? "" : `<div class="trakt-seen-ol" ${traktData}><span>${_chars(this._t("watched"))}</span></div><div class="trakt-ni-ol"   ${traktData}><span>${_chars(this._t("skip"))}</span></div>`;
    if (m.mediaType === "tv") {
      return this._renderTvUpcomingCard(normalized, { showDate: false, showRating: true, typeTag: this._t("typeTv"), overlayIndex, source: "trakt", traktOverlays });
    }
    return this._renderUpcomingCard(normalized, { showDate: false, typeTag: this._t("typeMovie"), overlayIndex, reqKey: "trakt-" + m.id, traktOverlays });
  }
  // Same shape as a Trakt card. The overlays differ in what they mean upstream:
  // Seen only drops the suggestion, Skip blacklists it in SuggestArr for good.
  _renderSuggestArrCard(m, overlayIndex = null) {
    const saData = `data-sa-id="${m._saId}" data-sa-tmdb="${m.id}" data-sa-type="${m.mediaType}"`;
    const _chars = (s) => s.toUpperCase().split("").join("<br>");
    const overlays = `<div class="trakt-seen-ol sa-seen-ol" ${saData}><span>${_chars(this._t("watched"))}</span></div><div class="trakt-ni-ol   sa-skip-ol" ${saData}><span>${_chars(this._t("skip"))}</span></div>`;
    if (m.mediaType === "tv") {
      return this._renderTvUpcomingCard(m, { showDate: false, showRating: true, typeTag: this._t("typeTv"), overlayIndex, source: "suggestarr", traktOverlays: overlays });
    }
    return this._renderUpcomingCard(m, { showDate: false, typeTag: this._t("typeMovie"), overlayIndex, reqKey: "sa-" + m.id, traktOverlays: overlays });
  }
  _renderTrendingCard(m, overlayIndex = null) {
    if (m.mediaType === "tv") {
      return this._renderTvUpcomingCard(m, { showDate: false, showRating: true, typeTag: this._t("typeTv"), overlayIndex, source: "trending" });
    }
    return this._renderUpcomingCard(m, { showDate: false, typeTag: this._t("typeMovie"), overlayIndex, reqKey: "trending-" + m.id });
  }
  _renderUpcomingCard(m, { showDate = true, showRating = !showDate, typeTag = "", overlayIndex = null, reqKey = String(m.id), watchedBtn = "", traktOverlays = "" } = {}) {
    const title = this._escHtml(m.title || "Unknown");
    const rating = m.voteAverage ? m.voteAverage.toFixed(1) : "?";
    const dateStr = showDate ? this.fmtDate(m.digitalRelease || m.releaseDate) : "";
    const radarrEntry = Array.isArray(this._radarr) && this._radarr.find((r) => r.tmdbId === m.id);
    const inRadarr = !!radarrEntry;
    const inRadarrAvail = !!(radarrEntry && radarrEntry.hasFile);
    const inRadarrDownloading = !!(radarrEntry && !radarrEntry.hasFile && this._radarrQueueActive.has(radarrEntry.id));
    const radarr2Entry = this._radarr2ByTmdb?.get(String(m.id));
    const inRadarr2 = !!radarr2Entry;
    const inRadarr2Avail = !!(radarr2Entry && radarr2Entry.hasFile);
    const inRadarr2Downloading = !!(radarr2Entry && !radarr2Entry.hasFile && this._radarr2QueueActive?.has(radarr2Entry.id));
    const mediaStatus = m.mediaInfo?.status;
    const _inOptimistic = this._optimisticRequested.has(m.id);
    const _withdrawn = this._withdrawnIds.has(m.id);
    const _hasPending = this._familyPendingIds.has(m.id);
    const _stale = mediaStatus >= 3 && !inRadarr && !inRadarr2 && !_inOptimistic && !_hasPending;
    const _isAvail = (inRadarrAvail || inRadarr2Avail || mediaStatus === 5) && !_withdrawn && !_stale;
    const _isReq = (mediaStatus >= 2 || _inOptimistic || _hasPending || inRadarr || inRadarr2) && !_withdrawn && !inRadarrAvail && !inRadarr2Avail && !_stale;
    const _isDownloading = inRadarrDownloading || inRadarr2Downloading;
    const _reqId = m.mediaInfo?.requests?.[0]?.id || this._familyPendingIds.get(m.id);
    const _isAdmin = this._hass.user.is_admin;
    const _noSeerr2 = this._overseerrConfigured === false;
    let actionBtn = "";
    if (_isAvail) {
      actionBtn = "";
    } else if (_isReq) {
      if (_isDownloading) {
        actionBtn = "";
      } else if (_isAdmin || _noSeerr2 || mediaStatus >= 3 && !_inOptimistic && !_hasPending) {
        actionBtn = "";
      } else {
        const withdrawBtn = _reqId ? `<button class="req-withdraw" data-reqid="${_reqId}" data-mediaid="${m.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>` : "";
        actionBtn = withdrawBtn;
      }
    } else {
      actionBtn = `<button class="btn-add req-open" data-movieid="${m.id}" data-tmdb="${m.id}" data-reqkey="${reqKey}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" width="14" height="14" style="display:block"><path d="M12 5v14M5 12h14"/></svg></button>`;
    }
    const pc = this._posterCfg();
    let badgeCls = "";
    let statusBadge = "";
    if (_isAvail) {
      badgeCls = "b-st-avail";
      statusBadge = this._badge("b-st-avail", "\u2713", this._t("badgeAvailable"));
    } else if (_isReq) {
      if (_isDownloading) {
        badgeCls = "b-dl";
        statusBadge = this._badge("b-dl", "\u2193", this._t("badgeDownloading"));
      } else if (_isAdmin || _noSeerr2 || mediaStatus >= 3 && !_inOptimistic && !_hasPending) {
        badgeCls = "b-st-proc";
        statusBadge = this._badge("b-st-proc", "\u2193", this._t("badgeAdded"));
      } else {
        badgeCls = "b-st-pend";
        statusBadge = this._badge("b-st-pend", "\u23F1", this._t("badgePending"));
      }
    }
    const showTag = pc.statusDisplay === "tags" || pc.statusDisplay === "both";
    const showStripe = pc.statusDisplay === "stripes" || pc.statusDisplay === "both";
    const statusHtml = statusBadge && showTag ? this._statusBadge(statusBadge) : "";
    const _dlInst = inRadarr2Downloading && !inRadarrDownloading ? "radarr2" : "radarr";
    const _dlId = _dlInst === "radarr2" ? radarr2Entry?.id : radarrEntry?.id ?? radarr2Entry?.id;
    const stripe = badgeCls && showStripe ? this._statusStripe(this._statusStripeColor(badgeCls), badgeCls === "b-dl", this._dlPct(_dlId, "movie", _dlInst)) : "";
    const overlay = this._requestPending?.reqKey === reqKey ? this._renderRequestOverlay(m.id, m.id) : "";
    const grad = "rgba(0,0,0,0.88)";
    const tc = "rgba(var(--arr-pt-rgb, 255, 255, 255), 1)";
    const posterPath = m.posterPath || m.poster_path || null;
    const img = this._mcImg(posterPath ? posterPath.startsWith("http") ? posterPath : `https://image.tmdb.org/t/p/w342${posterPath}` : null, "\u{1F3AC}", m.id);
    const effectiveTypeTag = typeTag || (showDate ? this._t("typeMovie") : "");
    const _mvLangs = this._arrLangCodes(radarrEntry, true);
    const ratingHtml = this._ratingLangBlock(m, { ..._mvLangs, showRating });
    return `
    <div class="mc" data-popup="${POPUP_TYPE.MOVIE}" data-tmdbid="${m.id}" data-title="${title}"${radarrEntry ? ` data-radarrid="${radarrEntry.id}"` : ""}${overlayIndex !== null ? ` data-oi="${overlayIndex}"` : ""}>
      ${this._goneBadge(m.id, null, true)}
      ${img}
      ${traktOverlays}
      ${effectiveTypeTag && pc.mediaType ? `<span class="media-type-tag"><span class="b-txt">${effectiveTypeTag}</span></span>` : ""}
      ${showDate ? `<div style="position:absolute;top:6px;right:6px;z-index:2;display:flex;flex-direction:column;gap:3px;align-items:flex-end">
        ${dateStr ? `<span class="media-type-tag" style="position:static">${dateStr}</span>` : ""}
        ${statusHtml}
      </div>` : statusHtml}
      ${this._mcGrad(grad, `${ratingHtml}${pc.title ? `<div style="font-size:10px;font-weight:600;color:${tc};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${actionBtn ? "padding-right:20px" : ""}">${title}</div>` : ""}${actionBtn ? `<div style="position:absolute;bottom:8px;right:10px">${actionBtn}</div>` : ""}`)}
      ${stripe}
      ${overlay}
    </div>`;
  }
  // Resolves a calendar entry to its *arr record, so poster lookups and the card
  // renderer agree on which series/movie an episode belongs to.
  _calItemSeries(ep) {
    if (ep._mediaType === "music") {
      const a = ep.artist || ep.series || {};
      return this._lidarrArtists?.get(a.id) || a;
    }
    const seriesRaw = ep.series || {};
    const isMovie = ep._mediaType === "movie";
    const _sid = seriesRaw.id || ep.seriesId;
    return isMovie ? (this._radarr || []).find((m) => seriesRaw.tmdbId ? m.tmdbId === seriesRaw.tmdbId : m.id === _sid) || (this._radarr2 || []).find((m) => seriesRaw.tmdbId ? m.tmdbId === seriesRaw.tmdbId : m.id === _sid) || seriesRaw : (this._sonarrAll || this._sonarr || []).find((s) => seriesRaw.tvdbId ? s.tvdbId === seriesRaw.tvdbId : s.id === _sid) || (this._sonarr2All || this._sonarr2 || []).find((s) => seriesRaw.tvdbId ? s.tvdbId === seriesRaw.tvdbId : s.id === _sid) || seriesRaw;
  }
  _calItemPoster(ep) {
    if (ep._mediaType === "music") return this._lidarrCover(ep) || this._lidarrArtistImage(ep.artist, "poster");
    const series = this._calItemSeries(ep);
    return ep._mediaType === "movie" ? this._getRadarrPoster(series) : this._getSonarrPoster(series);
  }
  _renderCalendarModalCard(ep) {
    if (ep._mediaType === "music") return this._renderCalendarMusicCard(ep, { modal: true });
    const pc = this._posterCfg();
    const seriesRaw = ep.series || {};
    const isMovie = ep._mediaType === "movie";
    const _sid = seriesRaw.id || ep.seriesId;
    const series = isMovie ? (this._radarr || []).find((m) => seriesRaw.tmdbId ? m.tmdbId === seriesRaw.tmdbId : m.id === _sid) || (this._radarr2 || []).find((m) => seriesRaw.tmdbId ? m.tmdbId === seriesRaw.tmdbId : m.id === _sid) || seriesRaw : (this._sonarrAll || this._sonarr || []).find((s) => seriesRaw.tvdbId ? s.tvdbId === seriesRaw.tvdbId : s.id === _sid) || (this._sonarr2All || this._sonarr2 || []).find((s) => seriesRaw.tvdbId ? s.tvdbId === seriesRaw.tvdbId : s.id === _sid) || seriesRaw;
    const title = this._escHtml(series.title || ep.seriesTitle || ep.title || "Unknown");
    const typeTag = isMovie ? this._t("typeMovie") : this._t("typeTv");
    const poster = isMovie ? this._getRadarrPoster(series) : this._getSonarrPoster(series);
    const popup = isMovie ? POPUP_TYPE.RADARR : POPUP_TYPE.SONARR;
    const grad = "rgba(0,0,0,0.88)";
    const tc = "rgba(var(--arr-pt-rgb, 255, 255, 255), 1)";
    const img = this._mcImg(poster, isMovie ? "\u{1F3AC}" : "\u{1F4FA}", series.id || ep.seriesId || ep.id);
    let epLabel = "";
    if (!isMovie) {
      const s1 = String(ep.seasonNumber || 0).padStart(2, "0");
      const e1 = String(ep.episodeNumber || 0).padStart(2, "0");
      if (ep._epRangeEnd) {
        const s2 = String(ep._epRangeEnd.seasonNumber || 0).padStart(2, "0");
        const e2 = String(ep._epRangeEnd.episodeNumber || 0).padStart(2, "0");
        epLabel = s1 === s2 ? `S${s1}E${e1}-E${e2}` : `S${s1}E${e1}-S${s2}E${e2}`;
      } else {
        epLabel = `S${s1}E${e1}`;
      }
    }
    const epBadge = epLabel ? `<span class="badge b-ep">${epLabel}</span>` : "";
    let badgeCls = "";
    let badgeHtml = "";
    if (isMovie) {
      const dlActive = this._radarrQueueActive?.has(series.id) || this._radarr2QueueActive?.has(series.id);
      const dlFailed = this._radarrQueueFailed?.has(series.id) || this._radarr2QueueFailed?.has(series.id);
      if (series.hasFile) {
        badgeCls = "b-st-avail";
        badgeHtml = this._badge("b-st-avail", "\u2713", this._t("badgeAvailable"));
      } else if (dlFailed) {
        badgeCls = "b-missing";
        badgeHtml = this._badge("b-missing", "\u2717", this._t("badgeFailed"));
      } else if (dlActive) {
        badgeCls = "b-dl";
        badgeHtml = this._badge("b-dl", "\u2193", this._t("badgeDownloading"));
      } else {
        badgeCls = "b-missing";
        badgeHtml = this._badge("b-missing", "\u2717", this._t("badgeMissing"));
      }
    } else {
      const fc = series.statistics?.episodeFileCount || 0;
      const tc2 = series.statistics?.episodeCount || 0;
      if (fc === 0 && tc2 > 0) {
        badgeCls = "b-missing";
        badgeHtml = this._badge("b-missing", "\u2717", this._t("badgeMissing"));
      } else if (fc < tc2) {
        badgeCls = "b-partial";
        badgeHtml = `<span class="badge b-partial">${fc}/<span class="b-txt">${tc2}</span></span>`;
      } else if (fc > 0 && series.status === "continuing") {
        badgeCls = "b-continuing";
        badgeHtml = this._badge("b-continuing", "\u25B6", this._t("badgeAvailable"));
      } else if (fc > 0) {
        badgeCls = "b-st-avail";
        badgeHtml = this._badge("b-st-avail", "\u2713", this._t("badgeAvailable"));
      }
    }
    const showTag = pc.statusDisplay === "tags" || pc.statusDisplay === "both";
    const showStripe = pc.statusDisplay === "stripes" || pc.statusDisplay === "both";
    const statusBadge = badgeHtml && showTag ? this._statusBadge(badgeHtml) : "";
    const _fcS = series.statistics?.episodeFileCount || 0;
    const _tcS = series.statistics?.episodeCount || 0;
    const _ppS = !isMovie && badgeCls === "b-partial" && _tcS > 0 ? Math.round(_fcS / _tcS * 100) : -1;
    const _spS = badgeCls === "b-dl" ? this._dlPct(series.id, isMovie ? "movie" : "tv") : _ppS;
    const stripe = badgeCls && showStripe ? this._statusStripe(this._statusStripeColor(badgeCls), badgeCls === "b-dl", _spS) : "";
    return `
    <div class="mc" data-popup="${popup}" data-tvdbid="${series.tvdbId || ""}" data-tmdbid="${series.tmdbId || ""}" data-title="${title}">
      ${this._goneBadge(series.tmdbId || null, series.tvdbId || null, isMovie)}
      ${img}
      <div style="position:absolute;top:6px;left:6px;z-index:2;display:flex;flex-direction:column;gap:3px;align-items:flex-start">
        ${pc.mediaType ? `<span class="media-type-tag" style="position:static">${typeTag}</span>` : ""}
        ${epBadge}
      </div>
      ${statusBadge}
      ${this._mcGrad(grad, `${this._ratingLangBlock({ ...series, _mediaType: isMovie ? "movie" : "tv" }, this._arrLangCodes(series, isMovie))}${pc.title ? `<div style="font-size:10px;font-weight:600;color:${tc};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</div>` : ""}`)}
      ${stripe}
    </div>`;
  }
  _renderCalendarMusicCard(ep, { modal = false } = {}) {
    const pc = this._posterCfg();
    const artist = this._calItemSeries(ep);
    const name = this._escHtml(artist.artistName || ep.artist?.artistName || "Unknown");
    const album = this._escHtml(ep.title || "");
    const dateStr = this.fmtDate(ep.airDate);
    const cover = this._lidarrCover(ep);
    const back = this._lidarrArtistImage(artist, "fanart") || cover;
    const st = ep.statistics || {};
    const have = st.trackFileCount ?? 0;
    const total = st.trackCount ?? 0;
    const dl = this._lidarrQueue?.has(ep.id);
    let cls = "b-missing", badgeHtml = this._badge("b-missing", "\u2717", this._t("badgeMissing"));
    if (dl) {
      cls = "b-dl";
      badgeHtml = this._badge("b-dl", "\u2193", this._t("badgeDownloading"));
    } else if (total > 0 && have >= total) {
      cls = "b-st-avail";
      badgeHtml = this._badge("b-st-avail", "\u2713", this._t("badgeAvailable"));
    } else if (have > 0) {
      cls = "b-partial";
      badgeHtml = `<span class="badge b-partial">${have}/<span class="b-txt">${total}</span></span>`;
    }
    const showTag = pc.statusDisplay === "tags" || pc.statusDisplay === "both";
    const showStripe = pc.statusDisplay === "stripes" || pc.statusDisplay === "both";
    const pct = total > 0 && have < total && have > 0 ? Math.round(have / total * 100) : -1;
    const stripe = showStripe ? this._statusStripe(this._statusStripeColor(cls), cls === "b-dl", pct) : "";
    const perf = this._cfgGet("styles", "performanceMode", false);
    const backLayer = !perf && back ? `<img src="${back}" class="mus-back" loading="lazy" aria-hidden="true" onerror="this.style.display='none'">` : "";
    const frontEl = cover ? `<img src="${cover}" class="mus-cover" loading="lazy" onerror="this.style.display='none'">` : `<div class="mus-cover mus-cover-ph">${this._escHtml(this._musInitials(artist.artistName))}</div>`;
    const grad = "rgba(0,0,0,0.88)";
    const tc = "rgba(var(--arr-pt-rgb, 255, 255, 255), 1)";
    return `
    <div class="mc mc-music${backLayer ? "" : " mus-flat"}" data-album-cal="${ep.id}" data-title="${name}">
      ${backLayer}
      <div class="mus-scrim"></div>
      ${frontEl}
      <div style="position:absolute;top:6px;left:6px;z-index:2;display:flex;flex-direction:column;gap:3px;align-items:flex-start">
        ${pc.mediaType ? `<span class="media-type-tag" style="position:static">${this._t("typeAlbum")}</span>` : ""}
      </div>
      <div style="position:absolute;top:6px;right:6px;z-index:2;display:flex;flex-direction:column;gap:3px;align-items:flex-end">
        ${dateStr ? `<span class="media-type-tag" style="position:static">${dateStr}</span>` : ""}
        ${showTag ? this._statusBadge(badgeHtml) : ""}
      </div>
      ${this._mcGrad(grad, `${this._flagStrip(
      [],
      this._musOrigin(artist),
      pc.rating ? this._musRatingBadge(artist, true, true) : "",
      { endIcon: false }
    )}${pc.title ? `<div style="font-size:10px;font-weight:600;color:${tc};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div>` : ""}
        ${album ? `<div style="font-size:9px;color:rgba(var(--arr-pt-rgb,255,255,255),0.66);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${album}</div>` : ""}`)}
      ${stripe}
    </div>`;
  }
  _renderCalendarCard(ep) {
    if (ep._mediaType === "music") return this._renderCalendarMusicCard(ep);
    const isMovie = ep._mediaType === "movie";
    const seriesRaw = ep.series || {};
    const _sid = seriesRaw.id || ep.seriesId;
    const series = isMovie ? (this._radarr || []).find((m) => seriesRaw.tmdbId ? m.tmdbId === seriesRaw.tmdbId : m.id === _sid) || (this._radarr2 || []).find((m) => seriesRaw.tmdbId ? m.tmdbId === seriesRaw.tmdbId : m.id === _sid) || seriesRaw : (this._sonarrAll || this._sonarr || []).find((s) => seriesRaw.tvdbId ? s.tvdbId === seriesRaw.tvdbId : s.id === _sid) || (this._sonarr2All || this._sonarr2 || []).find((s) => seriesRaw.tvdbId ? s.tvdbId === seriesRaw.tvdbId : s.id === _sid) || seriesRaw;
    const title = this._escHtml(series.title || ep.seriesTitle || ep.title || "Unknown");
    const dateStr = this.fmtDate(ep.airDate);
    const typeTag = isMovie ? this._t("typeMovie") : this._t("typeTv");
    const popup = isMovie ? POPUP_TYPE.RADARR : POPUP_TYPE.SONARR;
    const poster = isMovie ? this._getRadarrPoster(series) : this._getSonarrPoster(series);
    const img = this._mcImg(poster, isMovie ? "\u{1F3AC}" : "\u{1F4FA}", ep.series?.id || ep.seriesId || ep.id);
    const pc = this._posterCfg();
    let epLabel = "";
    if (!isMovie) {
      const s1 = String(ep.seasonNumber || 0).padStart(2, "0");
      const e1 = String(ep.episodeNumber || 0).padStart(2, "0");
      if (ep._epRangeEnd) {
        const s2 = String(ep._epRangeEnd.seasonNumber || 0).padStart(2, "0");
        const e2 = String(ep._epRangeEnd.episodeNumber || 0).padStart(2, "0");
        epLabel = s1 === s2 ? `S${s1}E${e1}-E${e2}` : `S${s1}E${e1}-S${s2}E${e2}`;
      } else {
        epLabel = `S${s1}E${e1}`;
      }
    }
    const epBadge = epLabel ? `<span class="badge b-ep">${epLabel}</span>` : "";
    let badgeCls = "";
    let badgeHtml = "";
    if (isMovie) {
      const dlActive = this._radarrQueueActive?.has(series.id) || this._radarr2QueueActive?.has(series.id);
      const dlFailed = this._radarrQueueFailed?.has(series.id) || this._radarr2QueueFailed?.has(series.id);
      if (series.hasFile) {
        badgeCls = "b-st-avail";
        badgeHtml = this._badge("b-st-avail", "\u2713", this._t("badgeAvailable"));
      } else if (dlFailed) {
        badgeCls = "b-missing";
        badgeHtml = this._badge("b-missing", "\u2717", this._t("badgeFailed"));
      } else if (dlActive) {
        badgeCls = "b-dl";
        badgeHtml = this._badge("b-dl", "\u2193", this._t("badgeDownloading"));
      } else {
        badgeCls = "b-missing";
        badgeHtml = this._badge("b-missing", "\u2717", this._t("badgeMissing"));
      }
    } else {
      const fc = series.statistics?.episodeFileCount || 0;
      const tc2 = series.statistics?.episodeCount || 0;
      if (fc === 0 && tc2 > 0) {
        badgeCls = "b-missing";
        badgeHtml = this._badge("b-missing", "\u2717", this._t("badgeMissing"));
      } else if (fc < tc2) {
        badgeCls = "b-partial";
        badgeHtml = `<span class="badge b-partial">${fc}/<span class="b-txt">${tc2}</span></span>`;
      } else if (fc > 0 && series.status === "continuing") {
        badgeCls = "b-continuing";
        badgeHtml = this._badge("b-continuing", "\u25B6", this._t("badgeAvailable"));
      } else if (fc > 0) {
        badgeCls = "b-st-avail";
        badgeHtml = this._badge("b-st-avail", "\u2713", this._t("badgeAvailable"));
      }
    }
    const showTag = pc.statusDisplay === "tags" || pc.statusDisplay === "both";
    const showStripe = pc.statusDisplay === "stripes" || pc.statusDisplay === "both";
    const statusBadge = badgeHtml && showTag ? this._statusBadge(badgeHtml) : "";
    const _fcS = series.statistics?.episodeFileCount || 0;
    const _tcS = series.statistics?.episodeCount || 0;
    const _ppS = !isMovie && badgeCls === "b-partial" && _tcS > 0 ? Math.round(_fcS / _tcS * 100) : -1;
    const _spS = badgeCls === "b-dl" ? this._dlPct(series.id, isMovie ? "movie" : "tv") : _ppS;
    const stripe = badgeCls && showStripe ? this._statusStripe(this._statusStripeColor(badgeCls), badgeCls === "b-dl", _spS) : "";
    const grad = "rgba(0,0,0,0.88)";
    const tc = "rgba(var(--arr-pt-rgb, 255, 255, 255), 1)";
    return `
    <div class="mc" data-popup="${popup}" data-tvdbid="${series.tvdbId || ep.series?.tvdbId || ""}" data-tmdbid="${series.tmdbId || ep.series?.tmdbId || ep.tmdbId || ""}" data-title="${title}">
      ${this._goneBadge(series.tmdbId || ep.series?.tmdbId || null, series.tvdbId || ep.series?.tvdbId || null, isMovie)}
      ${img}
      <div style="position:absolute;top:6px;left:6px;z-index:2;display:flex;flex-direction:column;gap:3px;align-items:flex-start">
        ${pc.mediaType ? `<span class="media-type-tag" style="position:static">${typeTag}</span>` : ""}
        ${epBadge}
      </div>
      <div style="position:absolute;top:6px;right:6px;z-index:2;display:flex;flex-direction:column;gap:3px;align-items:flex-end">
        ${dateStr ? `<span class="media-type-tag" style="position:static">${dateStr}</span>` : ""}
        ${statusBadge}
      </div>
      ${this._mcGrad(grad, `${this._ratingLangBlock({ ...series, _mediaType: isMovie ? "movie" : "tv" }, this._arrLangCodes(series, isMovie))}${pc.title ? `<div style="font-size:10px;font-weight:600;color:${tc};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</div>` : ""}`)}
      ${stripe}
    </div>`;
  }
};
var mediaCardsMixin = _MediaCardMethods.prototype;


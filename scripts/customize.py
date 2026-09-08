#!/usr/bin/env python3
"""Layer Episeerr-specific edits on top of the rebranded bundle.

Run scripts/rebrand.py first (regenerates episeerr-card.js from
arr-stack-card.js, a pure rename), then this script, in that order - both
are idempotent against a freshly-rebranded file, so re-running the pair
after `git fetch upstream && git merge upstream/main` reproduces today's
customizations on top of whatever upstream changed (assuming upstream
didn't touch the exact lines targeted below, which would need a manual
re-diff at that point - this is a hand-applied patch, not a real merge).

2026-09-07/08, Library section's two quality-tab slots (originally "Top
Rated"/★ and "Top Quality"/◆):

- ★ went through two iterations. First "Unassigned" (series/movies with
  no Episeerr rule - a real gap-finder using episeerr-ha's
  select.episeerr_* entities cross-referenced by series_id/movie_id,
  narrowed to TV-only once live data showed movies are unassigned by
  design 35% of the time vs. 1% for series - see git history). Joe then
  called it "blank and kinda pointless since I can see them in detail"
  once the item popup's own "Episeerr Rule" quick-action (below) made
  checking/fixing one item at a time easy without a dedicated finder tab -
  replaced with "Recently Watched" instead, using the new watched list
  exposed via episeerr-ha's activity_feed sensor.
- ◆ became "Upcoming" - library items with something happening in the
  next 30 days (Sonarr's per-series nextAiring, or Radarr's
  digitalRelease/inCinemas/physicalRelease). First cut used "any future
  date" with no window/hasFile check - real bugs found live: Backrooms
  (already downloaded) still showed because its physicalRelease hadn't
  happened, and The Rookie/Scrubs showed with nextAiring 4+ months out.
  Fixed with a 30-day window plus requiring !hasFile for movies.

Also: "Episeerr Rule" quick-action in the item detail popup (alongside
the card's existing Search/Remove/Cast actions), a "Rule: <name>" option
in the regular filter dropdown (distinct from the ★/◆ slots - this is a
real multi-value picker, which a rule choice needs and a boolean toggle
doesn't fit), and a rule badge in the Overview list-view row.

Usage: python3 scripts/customize.py  (after scripts/rebrand.py)
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGET = ROOT / "episeerr-card.js"

content = TARGET.read_text()


def replace_once(old: str, new: str, content: str) -> str:
    count = content.count(old)
    assert count == 1, f"expected exactly 1 match, found {count}: {old[:80]!r}"
    return content.replace(old, new, 1)


# 1. Compact tile: both call sites use this identical string (music-enabled
# branch has one, the normal branch has two references to Top Rated) -
# replace every occurrence deliberately, not replace_once.
TILE_OLD = '"toprated", "Top Rated", this._libTopRatedData()'
TILE_NEW = '"recentwatch", "Recently Watched", this._libRecentWatchedData()'
tile_count = content.count(TILE_OLD)
assert tile_count == 2, f"expected 2 tile call sites, found {tile_count}"
content = content.replace(TILE_OLD, TILE_NEW)

# 2. New data functions - inserted right after _libTopRatedData()'s closing
# brace, before _libTopQualityData() (left untouched, still real Top
# Quality data, just no longer reachable from the UI - harmless dead code).
ANCHOR = "].filter((i) => i._score > 0).sort((a, b) => b._score - a._score).slice(0, 4);\n  }\n  _libTopQualityData() {"
NEW_METHODS = """].filter((i) => i._score > 0).sort((a, b) => b._score - a._score).slice(0, 4);
  }
  // Cross-references episeerr-ha's select.episeerr_* entities (one per
  // Sonarr series / Radarr movie) by series_id/movie_id to find each
  // item's Episeerr-assigned rule, without any new backend call - the data
  // already lives in hass.states. Built once per call rather than scanning
  // all of hass.states per item.
  //
  // Keys are String()-coerced deliberately: episeerr-ha's series_id/
  // movie_id attributes and arr_stack's own item.id both come through as
  // JSON numbers in principle, but this codebase's own existing code
  // (_qaLibTargets, elsewhere) already defensively String()-coerces id
  // comparisons across its data sources rather than trust they arrive as
  // the same JS type - matching that pattern here rather than assuming.
  _episeerrRuleMaps() {
    const states = this._hass?.states || {};
    const seriesMap = /* @__PURE__ */ new Map();
    const movieMap = /* @__PURE__ */ new Map();
    for (const key in states) {
      if (!key.startsWith("select.episeerr_")) continue;
      const attrs = states[key].attributes || {};
      const rule = states[key].state;
      if (attrs.series_id != null) seriesMap.set(String(attrs.series_id), rule);
      if (attrs.movie_id != null) movieMap.set(String(attrs.movie_id), rule);
    }
    return { seriesMap, movieMap };
  }
  // TV-only: the "watched" list (episeerr-ha's activity_feed sensor,
  // ultimately from Episeerr's watched.json) only ever records episodes -
  // there's no equivalent movie-watch tracking in this data source.
  _libRecentWatchedData() {
    const watched = this._hass?.states?.["sensor.episeerr_activity_feed"]?.attributes?.watched || [];
    const bySeriesId = new Map((this._sonarr || []).map((s) => [String(s.id), s]));
    const out = [];
    for (const w of watched) {
      const s = bySeriesId.get(String(w.series_id));
      if (!s) continue;
      out.push({ url: this._getSonarrPoster(s), title: s.title, _libType: "tv" });
      if (out.length === 4) break;
    }
    return out;
  }
  _libUpcomingData() {
    const now = Date.now();
    // "Upcoming" means soon (30 days), not just any future date - a movie
    // still shows a future physicalRelease (Blu-ray date) long after it's
    // already downloaded and available, and an ongoing show's nextAiring
    // can be months out over a hiatus - neither reads as "upcoming".
    const isSoon = (d) => {
      if (!d) return false;
      const diff = new Date(d).getTime() - now;
      return diff > 0 && diff < 30 * 24 * 60 * 60 * 1e3;
    };
    return [
      ...(this._radarr || []).filter((m) => !m.hasFile && (isSoon(m.digitalRelease) || isSoon(m.inCinemas) || isSoon(m.physicalRelease))).map((m) => ({
        url: this._getRadarrPoster(m),
        title: m.title,
        _libType: "movie"
      })),
      ...(this._sonarr || []).filter((s) => isSoon(s.nextAiring)).map((s) => ({
        url: this._getSonarrPoster(s),
        title: s.title,
        _libType: "tv"
      }))
    ].slice(0, 4);
  }
  _libTopQualityData() {"""
content = replace_once(ANCHOR, NEW_METHODS, content)

# 3. Compact tile: the ◆ slot's call site (Top Quality -> Upcoming).
TILE2_OLD = '"topquality", "Top Quality", this._libTopQualityData()'
TILE2_NEW = '"libupcoming", "Upcoming", this._libUpcomingData()'
content = replace_once(TILE2_OLD, TILE2_NEW, content)

# 4. Modal: qualityKey computation needs to recognize both new quality-tab
# keys (sort-default handled separately below). The old "toprated"/
# "topquality" branches elsewhere are now dead code (nothing emits those
# keys anymore) - left in place, harmless.
QK_OLD = 'const qualityKey = key === "toprated" || key === "topquality" ? key : null;'
QK_NEW = 'const qualityKey = key === "toprated" || key === "topquality" || key === "recentwatch" || key === "libupcoming" ? key : null;'
content = replace_once(QK_OLD, QK_NEW, content)

# 4b. sortDef: "recentwatch" needs its own default sort field
# ("watchedDate", added in step 6b below) rather than falling through to
# "added" (date added to library, not date watched - wrong axis).
SORTDEF_OLD = 'const sortDef = qualityKey === "toprated" ? typeKey === "music" ? "rating" : "imdb" : qualityKey === "topquality" ? "quality" : "added";'
SORTDEF_NEW = 'const sortDef = qualityKey === "toprated" ? typeKey === "music" ? "rating" : "imdb" : qualityKey === "topquality" ? "quality" : qualityKey === "recentwatch" ? "watchedDate" : "added";'
content = replace_once(SORTDEF_OLD, SORTDEF_NEW, content)

# 5. Modal toolbar: both button icons/labels - new icons (fill-style to
# match _ICO_RATED/_ICO_QUAL) plus the G2 array entries.
G2_OLD = 'const G2 = [["toprated", "Top Rated", _ICO_RATED], ["topquality", "Top Quality", _ICO_QUAL]];'
G2_NEW = (
    'const _ICO_WATCHED = `<svg viewBox="0 0 24 24" width="14" height="14" '
    'fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" '
    'stroke-linejoin="round" style="pointer-events:none"><path d="M2 12s3.5-7 10-7 '
    '10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>`;\n'
    '    const _ICO_UPCOMING = `<svg viewBox="0 0 24 24" width="14" height="14" '
    'fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" '
    'stroke-linejoin="round" style="pointer-events:none"><rect x="3" y="4" width="18" '
    'height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" '
    'x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;\n'
    '    const G2 = [["recentwatch", "Recently Watched", _ICO_WATCHED], '
    '["libupcoming", "Upcoming", _ICO_UPCOMING]];'
)
content = replace_once(G2_OLD, G2_NEW, content)

# 6. The real grid filter (this is what actually populates the expanded
# modal's grid when a tab is active, not just the compact tile preview).
FILTER_OLD = 'if (m.qualityKey === "toprated") base = base.filter((i) => (i.ratings?.imdb?.value || i.ratings?.tmdb?.value || i.ratings?.tvdb?.value || i.ratings?.tvMaze?.value || i.ratings?.trakt?.value || i.ratings?.value || 0) > 0);'
FILTER_NEW = FILTER_OLD + (
    '\n    if (m.qualityKey === "recentwatch") {\n'
    '      const watched = this._hass?.states?.["sensor.episeerr_activity_feed"]?.attributes?.watched || [];\n'
    "      const watchedMap = new Map(watched.map((w) => [String(w.series_id), w.watched_date]));\n"
    '      base = base.filter((i) => i._libType === "tv" && watchedMap.has(String(i.id)))'
    ".map((i) => ({ ...i, _watchedAt: watchedMap.get(String(i.id)) }));\n"
    "    }\n"
    '    if (m.qualityKey === "libupcoming") {\n'
    "      const now = Date.now();\n"
    "      const isSoon = (d) => {\n"
    "        if (!d) return false;\n"
    "        const diff = new Date(d).getTime() - now;\n"
    "        return diff > 0 && diff < 30 * 24 * 60 * 60 * 1e3;\n"
    "      };\n"
    "      base = base.filter((i) => i._libType === \"movie\" ? "
    "!i.hasFile && (isSoon(i.digitalRelease) || isSoon(i.inCinemas) || isSoon(i.physicalRelease)) : "
    'i._libType === "tv" ? isSoon(i.nextAiring) : false);\n'
    "    }"
)
content = replace_once(FILTER_OLD, FILTER_NEW, content)

# 6b. Sort switch: a "watchedDate" case reading the _watchedAt attached
# above, so the default view is actually ordered by recency-watched.
SORTCASE_OLD = '        case "added":\n          return dir * (new Date(a.added || 0) - new Date(b.added || 0));'
SORTCASE_NEW = SORTCASE_OLD + (
    '\n        case "watchedDate":\n'
    "          return dir * ((a._watchedAt || 0) - (b._watchedAt || 0));"
)
content = replace_once(SORTCASE_OLD, SORTCASE_NEW, content)

# 7. Force typeKey to "tv" when opening the modal via the Recently Watched
# tile/tab, same treatment "topquality" already gets forcing "movies" -
# keeps the modal's own type toggle consistent with what the data is.
TYPEKEY_OLD = 'const typeKey = key === "movies" || key === "topquality" ? "movies" : key === "tv" ? "tv" : key === "music" ? "music"'
TYPEKEY_NEW = 'const typeKey = key === "movies" || key === "topquality" ? "movies" : key === "tv" || key === "recentwatch" ? "tv" : key === "music" ? "music"'
content = replace_once(TYPEKEY_OLD, TYPEKEY_NEW, content)

# 8. Disable the Movies/Music type-toggle buttons while Recently Watched is
# active, mirroring topquality's existing movies-only lockout.
DISABLED_OLD = 'disabled: m.qualityKey === "topquality" && k !== "movies"'
DISABLED_NEW = 'disabled: m.qualityKey === "topquality" && k !== "movies" || m.qualityKey === "recentwatch" && k !== "tv"'
content = replace_once(DISABLED_OLD, DISABLED_NEW, content)

# 9. Item popup: add "Episeerr Rule" to the existing quick-actions ("qa")
# menu system (Search/Remove/Cast/Stats already live here) - Joe: "maybe
# actions can also be rule change, search for etc" (search already exists
# via this same menu; rule-change didn't). Reuses the standard
# select.select_option service against episeerr-ha's select.episeerr_*
# entity for this item, matched by the raw Sonarr/Radarr id already
# tracked on the popup data object (d._sonarrSeries.id / d._radarrId) -
# the same fields _qaQueueTarget() already relies on, so only shows for
# items actually in the library (nothing to set a rule on otherwise).
QAITEMS_OLD = """    if (statsSrc && this._qaHasFiles(d)) {
      items.push({ key: "stats", label: this._t("qaStats"), icon: statsSrc });
    }
    return items;
  }"""
QAITEMS_NEW = """    if (statsSrc && this._qaHasFiles(d)) {
      items.push({ key: "stats", label: this._t("qaStats"), icon: statsSrc });
    }
    if (this._episeerrRuleTarget(d)) {
      items.push({ key: "episeerrRule", label: "Episeerr Rule" });
    }
    return items;
  }
  _episeerrRuleTarget(d) {
    const isTv = d._type === POPUP_TYPE.SONARR || d._type === POPUP_TYPE.TV;
    const arrId = isTv ? d._sonarrSeries?.id : d._radarrId;
    if (arrId == null) return null;
    const states = this._hass?.states || {};
    for (const key in states) {
      if (!key.startsWith("select.episeerr_")) continue;
      const attrs = states[key].attributes || {};
      if (isTv ? String(attrs.series_id) === String(arrId) : String(attrs.movie_id) === String(arrId)) return key;
    }
    return null;
  }
  _qaEpiseerrRuleRowsHtml(d) {
    const entityId = this._episeerrRuleTarget(d);
    if (!entityId) return this._qaLoadingRow();
    const st = this._hass.states[entityId];
    const current = st.state;
    const options = st.attributes.options || [];
    return options.map((o) => `<button class="qa-item qa-sub-item${o === current ? " qa-item-on" : ""}" data-qa-rule="${this._escHtml(o)}">${this._escHtml(o)}</button>`).join("");
  }
  async _qaSetEpiseerrRule(d, rule) {
    const entityId = this._episeerrRuleTarget(d);
    if (!entityId) return;
    this._ppMenu = null;
    this._qaShowStatus(this._t("mtProcessing") || "\\u2026", { spin: true }, 0);
    try {
      await this._hass.callService("select", "select_option", { entity_id: entityId, option: rule });
      this._qaShowStatus("Rule updated");
    } catch (e) {
      this._qaShowStatus(`Failed: ${this._qaErrText(e)}`, { err: true }, 7e3);
    }
  }"""
content = replace_once(QAITEMS_OLD, QAITEMS_NEW, content)

# 10. Wire the new sub-drawer's rows.
SUBROWS_OLD = """      if (key === "lib") {
        return this._qaLibTargets(d).map((t) => `<button class="qa-item qa-sub-item" data-qa-lib="${t.inst}">${this._escHtml(t.label)}</button>`).join("");
      }"""
SUBROWS_NEW = SUBROWS_OLD + """
      if (key === "episeerrRule") {
        return this._qaEpiseerrRuleRowsHtml(d);
      }"""
content = replace_once(SUBROWS_OLD, SUBROWS_NEW, content)

# 11. Wire the click handler for picking a rule row.
QACLICK_OLD = """      const qaLib = e.target.closest("[data-qa-lib]");
      if (qaLib) {
        this._qaShowInLibrary(this._popup, qaLib.dataset.qaLib);
        return;
      }"""
QACLICK_NEW = QACLICK_OLD + """
      const qaRule = e.target.closest("[data-qa-rule]");
      if (qaRule) {
        this._qaSetEpiseerrRule(this._popup, qaRule.dataset.qaRule);
        return;
      }"""
content = replace_once(QACLICK_OLD, QACLICK_NEW, content)

# 12. Filter dropdown: one "Rule: <name>" option per real Episeerr rule
# (both TV and movie rules, unlike the ★ slot - a specific rule choice
# isn't noisy for movies the way "no rule at all" was), alongside the
# existing Monitored/Missing/Wanted/Cutoff options. Joe: "fikterd can have
# by rule" - a real multi-value picker fits this dropdown; it never fit
# the ★/◆ boolean-toggle buttons, which is why "By Rule" was dropped as an
# idea for those slots earlier.
FILTEROPTS_OLD = 'const FILTER_OPTS = [["all", "All"], ["monitored", "Monitored Only"], ["unmonitored", "Unmonitored"], ["missing", "Missing"], ["wanted", "Wanted"], ["cutoff", "Cutoff Unmet"]];'
FILTEROPTS_NEW = (
    FILTEROPTS_OLD
    + "\n    this._episeerrRuleFilterOptions().forEach((opt) => FILTER_OPTS.push(opt));"
)
content = replace_once(FILTEROPTS_OLD, FILTEROPTS_NEW, content)

# 12b. The option-list builder + the filter predicate it drives.
FILTERPRED_OLD = 'if (m.filter === "cutoff") items = items.filter((i) => i._libType === "movie" ? !!i.movieFile?.qualityCutoffNotMet : false);'
FILTERPRED_NEW = FILTERPRED_OLD + (
    '\n    if (m.filter && m.filter.startsWith("episeerrRule:")) {\n'
    '      const rule = m.filter.slice("episeerrRule:".length);\n'
    "      const { seriesMap, movieMap } = this._episeerrRuleMaps();\n"
    "      items = items.filter((i) => i._libType === \"movie\" ? movieMap.get(String(i.id)) === rule : "
    'i._libType === "tv" ? seriesMap.get(String(i.id)) === rule : false);\n'
    "    }"
)
content = replace_once(FILTERPRED_OLD, FILTERPRED_NEW, content)

METHOD_INSERT_ANCHOR = "  // ─── Data helpers ─────────────────────────────────────────────────────────\n  _libFilteredItems() {"
METHOD_INSERT_NEW = (
    "  // Collects real rule names from both TV and movie select.episeerr_*\n"
    "  // entities' options attribute (already the same set every such entity\n"
    "  // carries per type) - no separate backend call needed.\n"
    "  _episeerrRuleFilterOptions() {\n"
    "    const states = this._hass?.states || {};\n"
    "    const rules = /* @__PURE__ */ new Set();\n"
    "    for (const key in states) {\n"
    '      if (!key.startsWith("select.episeerr_")) continue;\n'
    "      for (const o of states[key].attributes?.options || []) rules.add(o);\n"
    "    }\n"
    '    return [...rules].sort().map((r) => [`episeerrRule:${r}`, `Rule: ${r}`]);\n'
    "  }\n"
    "  // ─── Data helpers ─────────────────────────────────────────────────────────\n"
    "  _libFilteredItems() {"
)
content = replace_once(METHOD_INSERT_ANCHOR, METHOD_INSERT_NEW, content)

# 13. Overview (list) row: add a rule badge alongside the existing size/
# quality-profile/season-count badges. Joe: "can this show rule?" while
# looking at the Overview view specifically.
RIGHTTAGS_OLD = """    const rightTags = [
      sizeTxt && this._uiBadge(sizeTxt, "neutral"),
      profile && this._uiBadge(this._escHtml(profile), "neutral"),
      seasons && this._uiBadge(`${seasons} season${seasons != 1 ? "s" : ""}`, "neutral")
    ].filter(Boolean).join("");"""
RIGHTTAGS_NEW = """    const { seriesMap: _rmSeries, movieMap: _rmMovie } = this._episeerrRuleMaps();
    const ruleTxt = isMovie ? _rmMovie.get(String(item.id)) : _rmSeries.get(String(item.id));
    const rightTags = [
      ruleTxt && ruleTxt !== "None" && this._uiBadge(this._escHtml(ruleTxt), "neutral"),
      sizeTxt && this._uiBadge(sizeTxt, "neutral"),
      profile && this._uiBadge(this._escHtml(profile), "neutral"),
      seasons && this._uiBadge(`${seasons} season${seasons != 1 ? "s" : ""}`, "neutral")
    ].filter(Boolean).join("");"""
content = replace_once(RIGHTTAGS_OLD, RIGHTTAGS_NEW, content)

TARGET.write_text(content)
print(f"customized {TARGET} ({len(content)} bytes)")

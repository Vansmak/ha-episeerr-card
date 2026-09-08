#!/usr/bin/env python3
"""Layer Episeerr-specific edits on top of the rebranded bundle.

Run scripts/rebrand.py first (regenerates episeerr-card.js from
arr-stack-card.js, a pure rename), then this script, in that order - both
are idempotent against a freshly-rebranded file, so re-running the pair
after `git fetch upstream && git merge upstream/main` reproduces today's
customizations on top of whatever upstream changed (assuming upstream
didn't touch the exact lines targeted below, which would need a manual
re-diff at that point - this is a hand-applied patch, not a real merge).

2026-09-07: the Library section's "Top Rated"/★ slot becomes "Unassigned"
(series/movies with no Episeerr rule assigned at all - a real gap-finder,
using episeerr-ha's select.episeerr_* entities cross-referenced by
series_id/movie_id) since Joe has zero use for IMDB-rating sorting but
constant use for "what did I forget to assign a rule to". "Top Quality"/◆
becomes "Upcoming" - library items with something happening in the next
30 days (Sonarr's per-series nextAiring, or Radarr's digitalRelease/
inCinemas/physicalRelease), i.e. "which of what I already have has
something coming soon" - distinct from the separate "Upcoming Movies"/
"New Shows" categories elsewhere on the dashboard, which are TMDB
discovery of things NOT yet in the library. A true "By Rule" (rule-picker
dropdown) was the original idea for this slot but doesn't fit a
boolean-toggle button; Upcoming does, cleanly, with no new UI needed.

First cut of Upcoming used "any future date" with no window and no
hasFile check - real bugs found live 2026-09-08: Backrooms (already
downloaded, "released" status) still showed because its physicalRelease
(Blu-ray date) hadn't happened yet, and The Rookie/Scrubs showed with
nextAiring dates 4+ months out, reading as "a mix of old" rather than
"upcoming". Fixed with a 30-day window on all date checks plus requiring
!hasFile for movies specifically (a missing file is what actually makes a
movie "not here yet" - TV doesn't need the equivalent check since
nextAiring is inherently about an episode that hasn't aired, hence
doesn't have a file, yet).

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
# branch has one, the normal branch has two References Top Rated) - replace
# every occurrence deliberately, not replace_once.
TILE_OLD = '"toprated", "Top Rated", this._libTopRatedData()'
TILE_NEW = '"unassigned", "Unassigned", this._libUnassignedData()'
tile_count = content.count(TILE_OLD)
assert tile_count == 2, f"expected 2 tile call sites, found {tile_count}"
content = content.replace(TILE_OLD, TILE_NEW)

# 2. New data functions - inserted right after _libTopRatedData()'s closing
# brace, before _libTopQualityData() (left untouched, still real Top Quality
# data behind the ◆ button, which still reads "Top Quality" for now).
ANCHOR = "].filter((i) => i._score > 0).sort((a, b) => b._score - a._score).slice(0, 4);\n  }\n  _libTopQualityData() {"
NEW_METHODS = """].filter((i) => i._score > 0).sort((a, b) => b._score - a._score).slice(0, 4);
  }
  // Cross-references episeerr-ha's select.episeerr_* entities (one per
  // Sonarr series / Radarr movie) by series_id/movie_id to find each
  // item's Episeerr-assigned rule, without any new backend call - the data
  // already lives in hass.states. Built once per call rather than scanning
  // all of hass.states per item.
  _episeerrRuleMaps() {
    const states = this._hass?.states || {};
    const seriesMap = /* @__PURE__ */ new Map();
    const movieMap = /* @__PURE__ */ new Map();
    for (const key in states) {
      if (!key.startsWith("select.episeerr_")) continue;
      const attrs = states[key].attributes || {};
      const rule = states[key].state;
      if (attrs.series_id != null) seriesMap.set(attrs.series_id, rule);
      if (attrs.movie_id != null) movieMap.set(attrs.movie_id, rule);
    }
    return { seriesMap, movieMap };
  }
  // TV-only, deliberately: confirmed live 2026-09-08 that movies are
  // usually unassigned by design (8/23 = 35%, most movies just aren't
  // rule-managed) while series almost always are (1/99 = 1%) - mixing
  // both in one list buries the one real TV gap under normal-for-movies
  // noise. Joe: "rules are mostly for shows so maybe separate radarr and
  // sonarr".
  _libUnassignedData() {
    const { seriesMap } = this._episeerrRuleMaps();
    const isUnassigned = (rule) => !rule || rule === "unassigned" || rule === "None";
    return (this._sonarr || []).filter((s) => (s.statistics?.episodeFileCount || 0) > 0 && isUnassigned(seriesMap.get(s.id))).map((s) => ({
      url: this._getSonarrPoster(s),
      title: s.title,
      _libType: "tv"
    })).slice(0, 4);
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
# keys (typeKey/sort-default logic already fall through to the same
# defaults "toprated"/"topquality" got - see script docstring, no other
# changes needed there). The old "topquality" branch below is now dead
# code (nothing emits that key anymore) - left in place, harmless.
QK_OLD = 'const qualityKey = key === "toprated" || key === "topquality" ? key : null;'
QK_NEW = 'const qualityKey = key === "toprated" || key === "topquality" || key === "unassigned" || key === "libupcoming" ? key : null;'
content = replace_once(QK_OLD, QK_NEW, content)

# 5. Modal toolbar: both button icons/labels - new icons (fill-style to
# match _ICO_RATED/_ICO_QUAL) plus the G2 array entries.
G2_OLD = 'const G2 = [["toprated", "Top Rated", _ICO_RATED], ["topquality", "Top Quality", _ICO_QUAL]];'
G2_NEW = (
    'const _ICO_UNASSIGNED = `<svg viewBox="0 0 24 24" width="14" height="14" '
    'fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" '
    'stroke-linejoin="round" style="pointer-events:none"><circle cx="12" cy="12" r="9"/>'
    '<line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.5" r="0.75" '
    'fill="currentColor" stroke="none"/></svg>`;\n'
    '    const _ICO_UPCOMING = `<svg viewBox="0 0 24 24" width="14" height="14" '
    'fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" '
    'stroke-linejoin="round" style="pointer-events:none"><rect x="3" y="4" width="18" '
    'height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" '
    'x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;\n'
    '    const G2 = [["unassigned", "Unassigned", _ICO_UNASSIGNED], '
    '["libupcoming", "Upcoming", _ICO_UPCOMING]];'
)
content = replace_once(G2_OLD, G2_NEW, content)

# 6. The real grid filter (this is what actually populates the expanded
# modal's grid when a tab is active, not just the compact tile preview).
FILTER_OLD = 'if (m.qualityKey === "toprated") base = base.filter((i) => (i.ratings?.imdb?.value || i.ratings?.tmdb?.value || i.ratings?.tvdb?.value || i.ratings?.tvMaze?.value || i.ratings?.trakt?.value || i.ratings?.value || 0) > 0);'
FILTER_NEW = FILTER_OLD + (
    '\n    if (m.qualityKey === "unassigned") {\n'
    "      const { seriesMap } = this._episeerrRuleMaps();\n"
    '      const isUnassigned = (rule) => !rule || rule === "unassigned" || rule === "None";\n'
    '      base = base.filter((i) => i._libType === "tv" && isUnassigned(seriesMap.get(i.id)));\n'
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

# 7. Force typeKey to "tv" when opening the modal via the Unassigned tile/
# tab, same treatment "topquality" already gets forcing "movies" - keeps
# the modal's own type toggle consistent with what the data actually is.
TYPEKEY_OLD = 'const typeKey = key === "movies" || key === "topquality" ? "movies" : key === "tv" ? "tv" : key === "music" ? "music"'
TYPEKEY_NEW = 'const typeKey = key === "movies" || key === "topquality" ? "movies" : key === "tv" || key === "unassigned" ? "tv" : key === "music" ? "music"'
content = replace_once(TYPEKEY_OLD, TYPEKEY_NEW, content)

# 8. Disable the Movies/Music type-toggle buttons while Unassigned is
# active, mirroring topquality's existing movies-only lockout.
DISABLED_OLD = 'disabled: m.qualityKey === "topquality" && k !== "movies"'
DISABLED_NEW = 'disabled: m.qualityKey === "topquality" && k !== "movies" || m.qualityKey === "unassigned" && k !== "tv"'
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
      if (isTv ? attrs.series_id === arrId : attrs.movie_id === arrId) return key;
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

TARGET.write_text(content)
print(f"customized {TARGET} ({len(content)} bytes)")

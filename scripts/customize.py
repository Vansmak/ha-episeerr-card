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
is untouched for now - repurposing it needs a rule-picker dropdown, not a
boolean toggle, which doesn't fit this button's shape without more design
work.

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
  _libUnassignedData() {
    const { seriesMap, movieMap } = this._episeerrRuleMaps();
    const isUnassigned = (rule) => !rule || rule === "unassigned" || rule === "None";
    return [
      ...(this._radarr || []).filter((m) => m.hasFile && isUnassigned(movieMap.get(m.id))).map((m) => ({
        url: this._getRadarrPoster(m),
        title: m.title,
        _libType: "movie"
      })),
      ...(this._sonarr || []).filter((s) => (s.statistics?.episodeFileCount || 0) > 0 && isUnassigned(seriesMap.get(s.id))).map((s) => ({
        url: this._getSonarrPoster(s),
        title: s.title,
        _libType: "tv"
      }))
    ].slice(0, 4);
  }
  _libTopQualityData() {"""
content = replace_once(ANCHOR, NEW_METHODS, content)

# 3. Modal: qualityKey computation needs to recognize "unassigned" as a
# quality-tab key (typeKey/sort-default logic already fall through to the
# same defaults "toprated" gets - see script docstring / README, no other
# changes needed there).
QK_OLD = 'const qualityKey = key === "toprated" || key === "topquality" ? key : null;'
QK_NEW = 'const qualityKey = key === "toprated" || key === "topquality" || key === "unassigned" ? key : null;'
content = replace_once(QK_OLD, QK_NEW, content)

# 4. Modal toolbar: the ★ button itself - new icon (a simple "tag-off"
# glyph, fill-style to match _ICO_RATED/_ICO_QUAL) plus the G2 array entry.
G2_OLD = 'const G2 = [["toprated", "Top Rated", _ICO_RATED], ["topquality", "Top Quality", _ICO_QUAL]];'
G2_NEW = (
    'const _ICO_UNASSIGNED = `<svg viewBox="0 0 24 24" width="14" height="14" '
    'fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" '
    'stroke-linejoin="round" style="pointer-events:none"><circle cx="12" cy="12" r="9"/>'
    '<line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.5" r="0.75" '
    'fill="currentColor" stroke="none"/></svg>`;\n'
    '    const G2 = [["unassigned", "Unassigned", _ICO_UNASSIGNED], '
    '["topquality", "Top Quality", _ICO_QUAL]];'
)
content = replace_once(G2_OLD, G2_NEW, content)

# 5. The real grid filter (this is what actually populates the expanded
# modal's grid when the ★-turned-Unassigned tab is active, not just the
# compact tile preview).
FILTER_OLD = 'if (m.qualityKey === "toprated") base = base.filter((i) => (i.ratings?.imdb?.value || i.ratings?.tmdb?.value || i.ratings?.tvdb?.value || i.ratings?.tvMaze?.value || i.ratings?.trakt?.value || i.ratings?.value || 0) > 0);'
FILTER_NEW = FILTER_OLD + (
    '\n    if (m.qualityKey === "unassigned") {\n'
    "      const { seriesMap, movieMap } = this._episeerrRuleMaps();\n"
    '      const isUnassigned = (rule) => !rule || rule === "unassigned" || rule === "None";\n'
    "      base = base.filter((i) => i._libType === \"movie\" ? isUnassigned(movieMap.get(i.id)) : "
    'i._libType === "tv" ? isUnassigned(seriesMap.get(i.id)) : false);\n'
    "    }"
)
content = replace_once(FILTER_OLD, FILTER_NEW, content)

TARGET.write_text(content)
print(f"customized {TARGET} ({len(content)} bytes)")

# Reference split (do not build from this directly)

`arr-stack-card.js` at the repo root is martinargalas' shipped esbuild bundle
(v1.9.1) — not minified, but concatenated: cross-module `import`/`export`
statements were stripped by the bundler, so these files share one global
scope and are **not** independently valid ES modules as-is.

This directory is a mechanical split of that bundle back along its original
`// src/*.js` boundary comments, kept purely as a legible reference for
porting pieces into the real `episeerr` source tree (top-level, once it
exists) - not something `hacs.json`/a build step should ever point at.

Module map, by relevance to an Episeerr-focused card:

**Directly relevant** (~15.8k lines) - `card.js`, `editor.js`,
`constants.js`, `i18n.js`, `shared/ui.js`, `styles/*`, `popup/index.js`,
`render/left.js` + `render/right.js` (panel layout), `render/library.js` +
`render/media-cards.js` (library grid/poster cards), `render/activity.js` +
`wire/activity.js` (recent-activity feed - overlaps
`sensor.episeerr_activity_feed`), `render/interactive-search.js` +
`render/interactive-search-sonarr.js` (add-by-search flow - overlaps
`episeerr.search_media`/`add_series`/`add_movie`), `fetch/arr.js` +
`fetch/index.js` (data layer - needs a full rewrite to read `hass.states`/
call `episeerr.*` services instead of `callApi("GET", "arr_stack/...")`).

**Not relevant for v1** (~18.9k lines) - `render/jellystat*`,
`render/tautulli*`, `render/tracearr*`, `render/maintainerr.js`,
`render/music.js`, `render/prowlarr.js` and their `wire/*` counterparts,
`fetch/sessions.js`, `fetch/downloads.js` - each is a standalone-integration
panel (direct Tautulli/Jellystat/Tracearr/Maintainerr/Prowlarr/Last.fm
connections) that Episeerr either already aggregates differently or that
`episeerr-ha` has no matching entity surface for yet.

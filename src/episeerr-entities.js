// Reads episeerr-ha's entities straight off hass.states - no separate
// backend/proxy call, unlike the reference card's fetch/arr.js (which hits
// callApi("GET", "arr_stack/...") on a dedicated integration endpoint).
// This *is* the whole point of building on episeerr-ha: the data already
// lives in HA's own state machine.

// select.episeerr_<slug> entities: one per Sonarr series / Radarr movie,
// distinguished by which id attribute they carry (see
// EpiseerrSeriesRuleSelect/EpiseerrMovieRuleSelect in episeerr-ha's
// select.py - series entities carry series_id + year/status/ended/
// last_episode, movie entities carry movie_id + hasFile/monitored/
// quality_profile/genres).
export function librarySeries(hass) {
  return Object.values(hass.states)
    .filter((s) => s.entity_id.startsWith("select.episeerr_") && "series_id" in s.attributes)
    .sort((a, b) => (a.attributes.friendly_name || "").localeCompare(b.attributes.friendly_name || ""));
}

export function libraryMovies(hass) {
  return Object.values(hass.states)
    .filter((s) => s.entity_id.startsWith("select.episeerr_") && "movie_id" in s.attributes)
    .sort((a, b) => (a.attributes.friendly_name || "").localeCompare(b.attributes.friendly_name || ""));
}

// Standard select.select_option service - not a custom episeerr.* call.
// The select entity's own async_select_option handler (episeerr-ha's
// select.py) is what actually calls Episeerr's assign_series_rule/
// assign_movie_rule API and refreshes the coordinators; this card just
// triggers the same entity action any other HA UI would.
export function assignRule(hass, entityId, option) {
  return hass.callService("select", "select_option", { entity_id: entityId, option });
}

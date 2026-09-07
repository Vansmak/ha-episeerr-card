import { librarySeries, libraryMovies, assignRule } from "../episeerr-entities.js";

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function tileHtml(stateObj) {
  const title = stateObj.attributes.friendly_name || stateObj.entity_id;
  const current = stateObj.state;
  const poster = stateObj.attributes.poster;
  const options = stateObj.attributes.options || [];
  const optionsHtml = options
    .map(
      (o) =>
        `<option value="${escapeHtml(o)}"${o === current ? " selected" : ""}>${escapeHtml(o)}</option>`
    )
    .join("");
  const posterHtml = poster
    ? `<img class="episeerr-tile-poster" src="${escapeHtml(poster)}" loading="lazy" alt="">`
    : `<div class="episeerr-tile-poster episeerr-tile-noposter"><ha-icon icon="mdi:image-off-outline"></ha-icon></div>`;

  return `
    <div class="episeerr-tile">
      ${posterHtml}
      <div class="episeerr-tile-overlay">${escapeHtml(title)}</div>
      <select class="episeerr-tile-select" data-entity-id="${stateObj.entity_id}">
        ${optionsHtml}
      </select>
    </div>
  `;
}

function gridHtml(items) {
  return `<div class="episeerr-grid">${items.map(tileHtml).join("")}</div>`;
}

export function renderLibrary(hass) {
  const series = librarySeries(hass);
  const movies = libraryMovies(hass);

  if (series.length === 0 && movies.length === 0) {
    return `<div class="episeerr-panel episeerr-empty">No series/movie select entities found — check episeerr-ha is set up and has run at least one refresh.</div>`;
  }

  return `
    <div class="episeerr-panel episeerr-library">
      ${series.length ? `<h3>TV (${series.length})</h3>${gridHtml(series)}` : ""}
      ${movies.length ? `<h3>Movies (${movies.length})</h3>${gridHtml(movies)}` : ""}
    </div>
  `;
}

export function wireLibrary(root, hass) {
  root.querySelectorAll(".episeerr-library .episeerr-tile-select").forEach((select) => {
    select.addEventListener("change", (ev) => {
      assignRule(hass, ev.target.dataset.entityId, ev.target.value);
    });
    // Tapping the dropdown to change a rule shouldn't also trigger
    // whatever tap behavior the tile itself might grow later (e.g. opening
    // more-info) - stop it at the source.
    select.addEventListener("click", (ev) => ev.stopPropagation());
  });
}

import { librarySeries, libraryMovies, assignRule } from "../episeerr-entities.js";

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function rowHtml(stateObj) {
  const title = stateObj.attributes.friendly_name || stateObj.entity_id;
  const current = stateObj.state;
  const options = stateObj.attributes.options || [];
  const optionsHtml = options
    .map(
      (o) =>
        `<option value="${escapeHtml(o)}"${o === current ? " selected" : ""}>${escapeHtml(o)}</option>`
    )
    .join("");
  return `
    <div class="episeerr-lib-row">
      <span class="episeerr-lib-title">${escapeHtml(title)}</span>
      <select class="episeerr-lib-select" data-entity-id="${stateObj.entity_id}">
        ${optionsHtml}
      </select>
    </div>
  `;
}

export function renderLibrary(hass) {
  const series = librarySeries(hass);
  const movies = libraryMovies(hass);

  if (series.length === 0 && movies.length === 0) {
    return `<div class="episeerr-panel episeerr-empty">No series/movie select entities found — check episeerr-ha is set up and has run at least one refresh.</div>`;
  }

  return `
    <div class="episeerr-panel episeerr-library">
      ${series.length ? `<h3>TV (${series.length})</h3>${series.map(rowHtml).join("")}` : ""}
      ${movies.length ? `<h3>Movies (${movies.length})</h3>${movies.map(rowHtml).join("")}` : ""}
    </div>
  `;
}

export function wireLibrary(root, hass) {
  root.querySelectorAll(".episeerr-library .episeerr-lib-select").forEach((select) => {
    select.addEventListener("change", (ev) => {
      assignRule(hass, ev.target.dataset.entityId, ev.target.value);
    });
  });
}

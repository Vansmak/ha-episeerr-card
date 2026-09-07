// src/constants.js
var PANEL_REGISTRY = {
  library: { title: "Library", status: "implemented" },
  rules_pending: { title: "Rules & Pending", status: "planned" },
  search_add: { title: "Search & Add", status: "planned" },
  downloads: { title: "Downloads", status: "planned" },
  activity: { title: "Now Playing / Activity", status: "planned" },
  dispatcharr: { title: "Dispatcharr", status: "tbd" },
  xadarr: { title: "Xadarr", status: "tbd" }
};
var DEFAULT_PANELS = ["library"];
var CARD_VERSION = "0.2.0";

// src/episeerr-entities.js
function librarySeries(hass) {
  return Object.values(hass.states).filter((s) => s.entity_id.startsWith("select.episeerr_") && "series_id" in s.attributes).sort((a, b) => (a.attributes.friendly_name || "").localeCompare(b.attributes.friendly_name || ""));
}
function libraryMovies(hass) {
  return Object.values(hass.states).filter((s) => s.entity_id.startsWith("select.episeerr_") && "movie_id" in s.attributes).sort((a, b) => (a.attributes.friendly_name || "").localeCompare(b.attributes.friendly_name || ""));
}
function assignRule(hass, entityId, option) {
  return hass.callService("select", "select_option", { entity_id: entityId, option });
}

// src/panels/library.js
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function tileHtml(stateObj) {
  const title = stateObj.attributes.friendly_name || stateObj.entity_id;
  const current = stateObj.state;
  const poster = stateObj.attributes.poster;
  const options = stateObj.attributes.options || [];
  const optionsHtml = options.map(
    (o) => `<option value="${escapeHtml(o)}"${o === current ? " selected" : ""}>${escapeHtml(o)}</option>`
  ).join("");
  const posterHtml = poster ? `<img class="episeerr-tile-poster" src="${escapeHtml(poster)}" loading="lazy" alt="">` : `<div class="episeerr-tile-poster episeerr-tile-noposter"><ha-icon icon="mdi:image-off-outline"></ha-icon></div>`;
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
function renderLibrary(hass) {
  const series = librarySeries(hass);
  const movies = libraryMovies(hass);
  if (series.length === 0 && movies.length === 0) {
    return `<div class="episeerr-panel episeerr-empty">No series/movie select entities found \u2014 check episeerr-ha is set up and has run at least one refresh.</div>`;
  }
  return `
    <div class="episeerr-panel episeerr-library">
      ${series.length ? `<h3>TV (${series.length})</h3>${gridHtml(series)}` : ""}
      ${movies.length ? `<h3>Movies (${movies.length})</h3>${gridHtml(movies)}` : ""}
    </div>
  `;
}
function wireLibrary(root, hass) {
  root.querySelectorAll(".episeerr-library .episeerr-tile-select").forEach((select) => {
    select.addEventListener("change", (ev) => {
      assignRule(hass, ev.target.dataset.entityId, ev.target.value);
    });
    select.addEventListener("click", (ev) => ev.stopPropagation());
  });
}

// src/card.js
var PANEL_RENDERERS = {
  library: { render: renderLibrary, wire: wireLibrary }
};
var STYLE = `
  :host { display: block; }
  ha-card { padding: 16px; }
  .episeerr-panel + .episeerr-panel { margin-top: 24px; }
  .episeerr-panel h3 { margin: 0 0 8px; font-size: 1.05em; opacity: 0.8; }
  .episeerr-empty { opacity: 0.7; font-style: italic; }
  .episeerr-panel-todo { opacity: 0.6; font-style: italic; padding: 8px 0; }

  .episeerr-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }
  .episeerr-tile {
    position: relative;
    aspect-ratio: 2 / 3;
    border-radius: 8px;
    overflow: hidden;
    background: var(--card-background-color, #1c1c1c);
    display: flex;
    flex-direction: column;
  }
  .episeerr-tile-poster {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
  }
  .episeerr-tile-noposter {
    display: flex; align-items: center; justify-content: center;
    color: var(--secondary-text-color, #888);
    background: var(--secondary-background-color, #2a2a2a);
  }
  .episeerr-tile-overlay {
    position: absolute; left: 0; right: 0; top: 0;
    padding: 6px 8px 16px;
    font-size: 0.82em;
    line-height: 1.2;
    color: #fff;
    background: linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0));
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .episeerr-tile-select {
    position: absolute; left: 4px; right: 4px; bottom: 4px;
    font-size: 0.75em;
    background: rgba(0,0,0,0.75);
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 3px 4px;
    max-width: none;
  }
`;
var EpiseerrCard = class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._lastSignature = null;
  }
  setConfig(config) {
    const panels = Array.isArray(config?.panels) && config.panels.length ? config.panels : DEFAULT_PANELS;
    const unknown = panels.filter((p) => !(p in PANEL_REGISTRY));
    if (unknown.length) {
      throw new Error(`episeerr-card: unknown panel(s): ${unknown.join(", ")}`);
    }
    this._config = { ...config, panels };
    this._lastSignature = null;
  }
  set hass(hass) {
    this._hass = hass;
    const signature = this._signature(hass);
    if (signature === this._lastSignature) return;
    this._lastSignature = signature;
    this._render();
  }
  // Cheap dirty-check so a re-render only happens when something this card
  // actually shows has changed, not on every unrelated HA state update -
  // also avoids blowing away an open <select> the user is mid-interaction
  // with on every tick.
  _signature(hass) {
    const relevant = [...librarySeries(hass), ...libraryMovies(hass)];
    return relevant.map((s) => `${s.entity_id}:${s.state}`).join("|");
  }
  _render() {
    if (!this._config || !this._hass) return;
    const body = this._config.panels.map((panelId) => {
      const renderer = PANEL_RENDERERS[panelId];
      if (renderer) return renderer.render(this._hass);
      const meta = PANEL_REGISTRY[panelId];
      return `<div class="episeerr-panel episeerr-panel-todo">${meta.title} - not built yet.</div>`;
    }).join("");
    this.shadowRoot.innerHTML = `
      <style>${STYLE}</style>
      <ha-card header="${this._config.title || "Episeerr"}">
        <div class="card-content">${body}</div>
      </ha-card>
    `;
    this._config.panels.forEach((panelId) => {
      PANEL_RENDERERS[panelId]?.wire(this.shadowRoot, this._hass);
    });
  }
  getCardSize() {
    return this._config?.panels.length ? this._config.panels.length * 3 : 3;
  }
  static getStubConfig() {
    return { type: "custom:episeerr-card", panels: DEFAULT_PANELS };
  }
};
customElements.define("episeerr-card", EpiseerrCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "episeerr-card",
  name: "Episeerr Card",
  description: "Modular card for episeerr-ha - library, rules, downloads, activity."
});
console.info(`%c EPISEERR-CARD %c v${CARD_VERSION} `, "color: white; background: #03a9f4; font-weight: 700;", "color: #03a9f4; background: white; font-weight: 700;");

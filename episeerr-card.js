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
var CARD_VERSION = "0.1.0";

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
function rowHtml(stateObj) {
  const title = stateObj.attributes.friendly_name || stateObj.entity_id;
  const current = stateObj.state;
  const options = stateObj.attributes.options || [];
  const optionsHtml = options.map(
    (o) => `<option value="${escapeHtml(o)}"${o === current ? " selected" : ""}>${escapeHtml(o)}</option>`
  ).join("");
  return `
    <div class="episeerr-lib-row">
      <span class="episeerr-lib-title">${escapeHtml(title)}</span>
      <select class="episeerr-lib-select" data-entity-id="${stateObj.entity_id}">
        ${optionsHtml}
      </select>
    </div>
  `;
}
function renderLibrary(hass) {
  const series = librarySeries(hass);
  const movies = libraryMovies(hass);
  if (series.length === 0 && movies.length === 0) {
    return `<div class="episeerr-panel episeerr-empty">No series/movie select entities found \u2014 check episeerr-ha is set up and has run at least one refresh.</div>`;
  }
  return `
    <div class="episeerr-panel episeerr-library">
      ${series.length ? `<h3>TV (${series.length})</h3>${series.map(rowHtml).join("")}` : ""}
      ${movies.length ? `<h3>Movies (${movies.length})</h3>${movies.map(rowHtml).join("")}` : ""}
    </div>
  `;
}
function wireLibrary(root, hass) {
  root.querySelectorAll(".episeerr-library .episeerr-lib-select").forEach((select) => {
    select.addEventListener("change", (ev) => {
      assignRule(hass, ev.target.dataset.entityId, ev.target.value);
    });
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
  .episeerr-lib-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 6px 0; border-bottom: 1px solid var(--divider-color, #444);
    gap: 12px;
  }
  .episeerr-lib-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .episeerr-lib-select {
    background: var(--card-background-color, #1c1c1c);
    color: var(--primary-text-color, #fff);
    border: 1px solid var(--divider-color, #444);
    border-radius: 4px; padding: 4px 6px; max-width: 45%;
  }
  .episeerr-empty { opacity: 0.7; font-style: italic; }
  .episeerr-panel-todo { opacity: 0.6; font-style: italic; padding: 8px 0; }
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

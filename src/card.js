import { PANEL_REGISTRY, DEFAULT_PANELS, CARD_VERSION } from "./constants.js";
import { renderLibrary, wireLibrary } from "./panels/library.js";
import { librarySeries, libraryMovies } from "./episeerr-entities.js";

const PANEL_RENDERERS = {
  library: { render: renderLibrary, wire: wireLibrary },
};

const STYLE = `
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

class EpiseerrCard extends HTMLElement {
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
    this._lastSignature = null; // force a re-render on the next hass set
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
    const body = this._config.panels
      .map((panelId) => {
        const renderer = PANEL_RENDERERS[panelId];
        if (renderer) return renderer.render(this._hass);
        const meta = PANEL_REGISTRY[panelId];
        return `<div class="episeerr-panel episeerr-panel-todo">${meta.title} - not built yet.</div>`;
      })
      .join("");

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
}

customElements.define("episeerr-card", EpiseerrCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "episeerr-card",
  name: "Episeerr Card",
  description: "Modular card for episeerr-ha - library, rules, downloads, activity.",
});

console.info(`%c EPISEERR-CARD %c v${CARD_VERSION} `, "color: white; background: #03a9f4; font-weight: 700;", "color: #03a9f4; background: white; font-weight: 700;");

// Panel registry - the "modular, customizable" part of the card. A card
// config lists which panels it wants (`panels: [...]`), in what order;
// each entry here just needs a matching module under src/panels/.
//
// `status: "planned"` entries are real Episeerr-flavored panels that don't
// have an implementation yet - listed now so the config schema doesn't need
// to change shape later. `status: "tbd"` entries (dispatcharr, xadarr) are
// explicitly undecided - Joe hasn't scoped whether they belong on this card
// at all (2026-09-07); episeerr-ha's backend client doesn't talk to those
// routes yet either way, so nothing here can render them until that's
// decided and built.
export const PANEL_REGISTRY = {
  library: { title: "Library", status: "implemented" },
  rules_pending: { title: "Rules & Pending", status: "planned" },
  search_add: { title: "Search & Add", status: "planned" },
  downloads: { title: "Downloads", status: "planned" },
  activity: { title: "Now Playing / Activity", status: "planned" },
  dispatcharr: { title: "Dispatcharr", status: "tbd" },
  xadarr: { title: "Xadarr", status: "tbd" },
};

export const DEFAULT_PANELS = ["library"];

export const CARD_VERSION = "0.1.0";

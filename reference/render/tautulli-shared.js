
var _TL_COLS_SVG = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18"/></svg>`;
var _TL_EDIT_SVG = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
var _TL_TRASH_SVG = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`;
var _TL_CHEV_L = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
var _TL_CHEV_R = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
var _TL_CHEV_LL = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 18 12 12 18 6"/><polyline points="12 18 6 12 12 6"/></svg>`;
var _TL_CHEV_RR = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 18 12 12 6 6"/><polyline points="12 18 18 12 12 6"/></svg>`;
var _TL_SEL_STY = `margin:0 4px;background:var(--is-row-hover,rgba(255,255,255,0.06));border:1px solid var(--is-divider,rgba(255,255,255,0.1));border-radius:6px;color:var(--is-text,#fff);padding:4px 8px;font-size:12px`;
var _TL_MENU_STY = `position:absolute;right:0;top:calc(100% + 4px);background:var(--is-menu-bg,#18182a);border:1px solid var(--is-divider,rgba(255,255,255,0.12));border-radius:8px;padding:6px 0;min-width:190px;z-index:20;box-shadow:0 8px 24px rgba(0,0,0,0.18)`;
var _TautulliSharedMethods = class {
  // ── State helper ──────────────────────────────────────────────────────────
  _tlHidden(key, defaults) {
    const m = this._tautulliModal;
    if (!m) return new Set(defaults);
    if (!m[key]) m[key] = new Set(defaults);
    return m[key];
  }
  // ── Column prefs — HA user data (cross-device) ────────────────────────────
  async _tlLoadColPrefs() {
    try {
      const r = await this._hass.callWS({ type: "frontend/get_user_data", key: "arr-tl-cols" });
      return r?.value || {};
    } catch {
      return {};
    }
  }
  _tlSaveColPrefs() {
    const m = this._tautulliModal;
    if (!m) return;
    const KEYS = ["libsHiddenCols", "libsMobHiddenCols", "usersHiddenCols", "usersMobHiddenCols", "histHiddenCols", "histMobHiddenCols", "udHistHiddenCols", "udHistMobHiddenCols", "ldHistHiddenCols", "ldHistMobHiddenCols"];
    const value = {};
    for (const k of KEYS) if (m[k]) value[k] = [...m[k]];
    this._hass.callWS({ type: "frontend/store_user_data", key: "arr-tl-cols", value }).catch(() => {
    });
  }
  // ── Icons ─────────────────────────────────────────────────────────────────
  _tlLibSvgIcon(type, name, size) {
    const sm = size !== "md";
    const sz = sm ? 10 : 15;
    const clr = "var(--is-text-sec)";
    const sty = sm ? `flex-shrink:0;color:${clr}` : `vertical-align:middle;margin-right:7px;flex-shrink:0;color:${clr}`;
    const isPodcast = type === "podcast" || (name || "").toLowerCase().includes("podcast");
    const s = `stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
    const w = (p) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${sz}" height="${sz}" ${s} style="${sty}">${p}</svg>`;
    if (type === "movie") return w('<rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5"/>');
    if (type === "show") return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="currentColor" style="${sty}"><path d="M21,3H3A2,2 0 0,0 1,5V17A2,2 0 0,0 3,19H8V21H16V19H21A2,2 0 0,1 23,17V5A2,2 0 0,1 21,3M21,17H3V5H21V17Z"/></svg>`;
    if (isPodcast) return w('<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>');
    if (type === "artist") return w('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>');
    return w('<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>');
  }
  _tlMediaIcon(type, size) {
    const sz = size || 15;
    const s = `stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
    const sty = `flex-shrink:0;vertical-align:middle;color:var(--is-text-sec)`;
    if (type === "movie") return `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" ${s} style="${sty}"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5"/></svg>`;
    if (type === "episode") return `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="currentColor" style="${sty}"><path d="M21,3H3A2,2 0 0,0 1,5V17A2,2 0 0,0 3,19H8V21H16V19H21A2,2 0 0,1 23,17V5A2,2 0 0,1 21,3M21,17H3V5H21V17Z"/></svg>`;
    if (type === "track") return `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" ${s} style="${sty}"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
    if (type === "live" || type === "liveTV" || type === "livetv") return `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" ${s} style="${sty}"><rect x="2" y="8" width="20" height="13" rx="2"/><path d="M8 8L12 3l4 5"/></svg>`;
    if (type === "generic") return `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" ${s} style="${sty}"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/></svg>`;
    return "";
  }
  // ── Toolbar building blocks ───────────────────────────────────────────────
  _tlPerPageSelect(id, perPage, opts) {
    opts = opts || [10, 25, 50, 100];
    const options = opts.map((n) => `<option value="${n}"${n === perPage ? " selected" : ""}>${n}</option>`).join("");
    return `<select id="${id}" style="${_TL_SEL_STY}">${options}</select>`;
  }
  _tlEditBtn(id, active, label) {
    label = label || "Edit";
    const icon = label === "Delete" ? _TL_TRASH_SVG : _TL_EDIT_SVG;
    return `<button id="${id}" class="mt-tgl${active ? " is-on" : ""}" title="${label}" style="--tgl-on:rgba(229,57,53,0.75)">${icon}${label}</button>`;
  }
  _tlColsMenu(btnId, menuId, items, isOpen, iconOnly = false) {
    const label = iconOnly || this._isMob ? "" : "Columns";
    return `<span style="position:relative;flex-shrink:0"><button id="${btnId}" class="mt-tb-btn" title="Columns">${_TL_COLS_SVG}${label}</button><div id="${menuId}" style="display:${isOpen ? "block" : "none"};${_TL_MENU_STY}">${items}</div></span>`;
  }
  _tlColItems(cols, hiddenSet, dataAttr) {
    return cols.map((c) => {
      const on = !hiddenSet.has(c.key);
      return `<div class="tl-col-item" ${dataAttr}="${c.key}"><span class="tl-col-chk${on ? " on" : ""}"></span>${c.label}</div>`;
    }).join("");
  }
  _tlToolbar(opts) {
    const { isMobile: isMobile2, select, editBtn, colsBtn, banner } = opts;
    const b = banner || "";
    const showLabel = select ? `<span style="font-size:12px;color:var(--is-text-label)">${isMobile2 ? `Show ${select}` : `Show ${select} entries per page`}</span>` : "";
    return `${b}<div class="tl-toolbar">${showLabel}<div class="tl-toolbar-actions">${editBtn}${colsBtn}</div></div>`;
  }
  // ── Pagination ────────────────────────────────────────────────────────────
  _tlMobPag(attr, page, totalPages, numeric = false) {
    if (totalPages <= 1) return "";
    const DOT_LIMIT = 15;
    let center;
    if (!numeric && totalPages <= DOT_LIMIT) {
      const dots = Array.from(
        { length: totalPages },
        (_, i) => i === page ? `<button data-${attr}="${i}" style="width:18px;height:6px;border-radius:3px;background:var(--is-text);padding:0;min-width:0;flex-shrink:0;vertical-align:middle;border:none;cursor:default;outline:none" disabled></button>` : `<button class="tl-page-btn" data-${attr}="${i}" style="width:6px;height:6px;border-radius:50%;background:var(--is-text-muted);padding:0;min-width:0;flex-shrink:0;vertical-align:middle;border:none"></button>`
      ).join("");
      center = `<div class="u-row-5">${dots}</div>`;
    } else {
      center = `<span style="font-size:13px;font-weight:600;color:var(--is-text,#fff);min-width:44px;text-align:center">${page + 1}/${totalPages}</span>`;
    }
    const first = page === 0;
    const last = page >= totalPages - 1;
    const btnSty = "display:inline-flex;align-items:center;gap:4px;padding:5px 10px";
    return `<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:12px">
      <button class="tl-page-btn tl-icon-btn" data-${attr}="first" style="${btnSty}"${first ? " disabled" : ""}>${_TL_CHEV_LL}</button>
      <button class="tl-page-btn tl-icon-btn" data-${attr}="prev" style="${btnSty}"${first ? " disabled" : ""}>${_TL_CHEV_L}</button>
      ${center}
      <button class="tl-page-btn tl-icon-btn" data-${attr}="next" style="${btnSty}"${last ? " disabled" : ""}>${_TL_CHEV_R}</button>
      <button class="tl-page-btn tl-icon-btn" data-${attr}="last" style="${btnSty}"${last ? " disabled" : ""}>${_TL_CHEV_RR}</button>
    </div>`;
  }
  _tlDeskPag(attr, page, perPage, total, label) {
    label = label || "entries";
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const from = total > 0 ? page * perPage + 1 : 0;
    const to = Math.min((page + 1) * perPage, total);
    const showing = total > 0 ? `Showing ${from}\u2013${to} of ${total} ${label}` : `No ${label}`;
    const btns = [];
    btns.push(`<button class="tl-page-btn" data-${attr}="first"${page === 0 ? " disabled" : ""}>First</button>`);
    btns.push(`<button class="tl-page-btn" data-${attr}="prev"${page === 0 ? " disabled" : ""}>Previous</button>`);
    const lo = Math.max(0, Math.min(page - 2, totalPages - 5));
    const hi = Math.min(totalPages - 1, lo + 4);
    for (let i = lo; i <= hi; i++) btns.push(`<button class="tl-page-btn${i === page ? " active" : ""}" data-${attr}="${i}">${i + 1}</button>`);
    btns.push(`<button class="tl-page-btn" data-${attr}="next"${page >= totalPages - 1 ? " disabled" : ""}>Next</button>`);
    btns.push(`<button class="tl-page-btn" data-${attr}="last"${page >= totalPages - 1 ? " disabled" : ""}>Last</button>`);
    return `<div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;flex-wrap:wrap;gap:8px"><span style="font-size:12px;color:var(--is-text-label)">${showing}</span><div style="display:flex;gap:4px;flex-wrap:wrap">${btns.join("")}</div></div>`;
  }
  // ── Formatters ────────────────────────────────────────────────────────────
  // Dynamický počet řádků/karet = (88vh − overhead) / výška řádku
  // hasFilter: true pro history (filter bar +44px)
  _tlCalcPerPage(opts) {
    const isMob = this._isMob;
    const modalH = window.innerHeight * 0.88;
    const hdr = isMob ? 90 : 68;
    const pad = 34;
    const bar = opts && opts.bar !== void 0 ? opts.bar : 44;
    const filter = opts && opts.hasFilter ? opts.filterH || 44 : 0;
    const thead = isMob ? 0 : 36;
    const pag = isMob ? 56 : 52;
    const rowH = opts && opts.rowH || (isMob ? 62 : 38);
    return Math.max(3, Math.floor((modalH - hdr - pad - bar - filter - thead - pag) / rowH));
  }
  _tlFmtDuration(secs) {
    if (!secs) return "0m";
    const h = Math.floor(secs / 3600);
    const m = Math.floor(secs % 3600 / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
  _tlFmtTime(ts) {
    if (!ts) return "\u2014";
    const d = new Date(typeof ts === "number" ? ts * 1e3 : ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  _tlUserSelect(id, users, selUser) {
    const opts = [
      `<option value="">All users</option>`,
      ...(users || []).map((u) => `<option value="${u.user_id ?? ""}"${String(selUser ?? "") === String(u.user_id ?? "") ? " selected" : ""}>${u.friendly_name || u.user || "?"}</option>`)
    ].join("");
    return `<select id="${id}" style="${_TL_SEL_STY};max-width:130px">${opts}</select>`;
  }
  _tlFmtDate(ts) {
    if (!ts) return "\u2014";
    const d = new Date(typeof ts === "number" ? ts * 1e3 : ts);
    const sec = Math.floor((Date.now() - d.getTime()) / 1e3);
    if (sec < 60) return "just now";
    if (sec < 3600) return Math.floor(sec / 60) + "m ago";
    if (sec < 86400) return Math.floor(sec / 3600) + "h ago";
    if (sec < 604800) return Math.floor(sec / 86400) + "d ago";
    return d.toLocaleDateString(this._locale);
  }
  _tlSearchInput(id, value) {
    const SEARCH_SVG = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    return `<div style="display:inline-flex;align-items:center;gap:5px;background:var(--is-row-hover,rgba(255,255,255,0.06));border:1px solid var(--is-divider,rgba(255,255,255,0.1));border-radius:6px;padding:0 7px;height:28px;box-sizing:border-box">
      ${SEARCH_SVG}
      <input id="${id}" type="search" value="${this._escHtml(value || "")}" placeholder="Search\u2026" autocomplete="off" style="background:none;border:none;outline:none;color:var(--is-text,#fff);font-size:12px;line-height:1.4;width:110px;min-width:60px;padding:0;margin:0;box-sizing:border-box">
    </div>`;
  }
};
var tautulliSharedMixin = _TautulliSharedMethods.prototype;


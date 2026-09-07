
var _tlSortTh = (c, sortCol, sortDir, dataAttr) => `<th data-${dataAttr}="${c.sort}" style="${c.right ? "text-align:right;" : ""}cursor:pointer;user-select:none"><span style="white-space:nowrap">${c.label} <span style="opacity:${c.sort === sortCol ? 1 : 0.3};font-size:9px">${c.sort === sortCol ? sortDir === "asc" ? "\u2191" : "\u2193" : "\u2195"}</span></span></th>`;
var _TL_TRASH = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`;
var _TL_PURGE = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`;
var _TautulliTableMethods = class {
  // ──────────────────────────────────────────────────────────────────────────
  // Libraries
  // ──────────────────────────────────────────────────────────────────────────
  _tlBodyLibraries(data, total) {
    const isMobile2 = this._isMob;
    const m = this._tautulliModal || {};
    if (m.mediaDetailKey) return this._tlBodyMediaDetail();
    if (m.libDetailId) return this._tlBodyLibDetail();
    const page = m.libsPage || 0;
    const perPage = this._tlCalcPerPage();
    const sortCol = m.libsSortCol || "plays";
    const sortDir = m.libsSortDir || "desc";
    const editMode = m.libsEditMode || false;
    const search = (m.libsSearch || "").toLowerCase().trim();
    const hidden = this._tlHidden("libsHiddenCols", ["type"]);
    const mobHidden = this._tlHidden("libsMobHiddenCols", ["type", "parents", "children", "lastStream"]);
    const filtered = search ? (data || []).filter((l) => (l.section_name || "").toLowerCase().includes(search)) : data || [];
    const tot = filtered.length;
    const totalPages = Math.max(1, Math.ceil(tot / perPage));
    const COLS = [
      { key: "name", label: this._t("tlColLibrary"), sort: "section_name", right: false },
      { key: "type", label: this._t("tlColType"), sort: "section_type", right: false },
      { key: "count", label: this._t("tlColItems"), sort: "count", right: true },
      { key: "parents", label: this._t("tlColSeasonsAlbums"), sort: "parent_count", right: true },
      { key: "children", label: this._t("tlColEpisodesTracks"), sort: "child_count", right: true },
      { key: "lastStream", label: this._t("tlColStreamed"), sort: "last_accessed", right: false },
      { key: "lastPlayed", label: this._t("tlColLastPlayed"), sort: "last_played", right: false },
      { key: "plays", label: this._t("tlColPlays"), sort: "plays", right: true },
      { key: "duration", label: this._t("tlColDuration"), sort: "duration", right: true }
    ];
    const vis = COLS.filter((c) => !hidden.has(c.key));
    const deskColItems = this._tlColItems(COLS.filter((c) => c.key !== "name"), hidden, "data-tl-lib-col");
    const deskColsBtn = this._tlColsMenu("tl-libs-cols-btn", "tl-libs-cols-menu", deskColItems, m.libsColsOpen);
    const MOB_LIB_COLS = [
      { key: "plays", label: this._t("tlColPlays") },
      { key: "lastPlayed", label: this._t("tlColLastPlayed") },
      { key: "type", label: this._t("tlColType") },
      { key: "parents", label: this._t("tlColSeasonsAlbums") },
      { key: "children", label: this._t("tlColEpsTracks") },
      { key: "lastStream", label: this._t("tlColLastStreamedMob") }
    ];
    const mobColItems = this._tlColItems(MOB_LIB_COLS, mobHidden, "data-tl-lib-mob-col");
    const mobColsBtn = this._tlColsMenu("tl-libs-mob-cols-btn", "tl-libs-mob-cols-menu", mobColItems, m.libsMobColsOpen);
    const editBtn = this._tlEditBtn("tl-libs-edit-btn", editMode);
    const colsBtn = isMobile2 ? mobColsBtn : deskColsBtn;
    const toolbar = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-shrink:0">${this._uiBar("tl-libs-search", m.libsSearch || "", [], [{ html: editBtn }, { html: colsBtn }])}</div>`;
    const page2 = Math.min(page, totalPages - 1);
    const sliced = filtered.slice(page2 * perPage, (page2 + 1) * perPage);
    if (isMobile2) {
      const cards = sliced.map((lib) => {
        const type = (lib.section_type || "").toLowerCase();
        const icon = this._tlLibSvgIcon(type, lib.section_name || "", "sm");
        const sid = lib.section_id || "";
        const editBtns = editMode ? `<div class="tl-mob-edit">
          ${this._mtRoundBtn(`data-tl-lib-delete="${sid}" data-tl-lib-name="${lib.section_name || sid}"`, _TL_TRASH, "Delete", { size: 24, tone: "red" })}
          ${this._mtRoundBtn(`data-tl-lib-purge="${sid}" data-tl-lib-name="${lib.section_name || sid}"`, _TL_PURGE, "Purge history", { size: 24, tone: "red" })}
        </div>` : "";
        const mp = [];
        if (!mobHidden.has("plays")) mp.push(`<span style="font-weight:600;flex-shrink:0">&#9654; ${lib.plays ?? 0}</span>`);
        if (!mobHidden.has("lastPlayed") && lib.last_played) mp.push(`<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lib.last_played}</span>`);
        if (!mobHidden.has("type") && lib.section_type) mp.push(`<span style="text-transform:capitalize;color:var(--is-text-label)">${lib.section_type}</span>`);
        if (!mobHidden.has("parents") && lib.parent_count != null) mp.push(`<span>${lib.parent_count} sea/alb</span>`);
        if (!mobHidden.has("children") && lib.child_count != null) mp.push(`<span>${lib.child_count} ep/trk</span>`);
        if (!mobHidden.has("lastStream") && lib.last_accessed) mp.push(`<span>${this._tlFmtDate(lib.last_accessed)}</span>`);
        const ldAttr = !editMode ? ` data-tl-ld-open="${sid}" data-tl-ld-name="${this._escHtml(lib.section_name || "")}" style="cursor:pointer"` : "";
        return `<div class="tl-mob-card"${ldAttr}><div class="u-row-10">
          <div style="flex-shrink:0;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:var(--is-row-hover)">${icon.replace(/width="\d+" height="\d+"/, 'width="16" height="16"')}</div>
          <div style="flex:1;min-width:0"><div class="tl-mob-name">${lib.section_name || "\u2014"}</div>${mp.length ? `<div class="tl-mob-meta">${mp.join("")}</div>` : ""}</div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:15px;font-weight:700;color:rgba(250,180,50,0.9)">${lib.count ?? "\u2014"}</div>
            ${lib.duration ? `<div class="u-sm-label">${this._tlFmtDuration(lib.duration)}</div>` : ""}
          </div>
        </div>${editBtns}</div>`;
      }).join("") || `<div class="u-empty">${this._t("tlNoLibraryData")}</div>`;
      return toolbar + `<div class="tl-libs-results-wrap" style="display:contents"><div>${cards}</div>${this._tlMobPag("tl-lpage", page, totalPages)}</div>`;
    }
    const editThHdr = editMode ? `<th style="white-space:nowrap;width:1px;padding-right:12px">${this._t("tlEdit")}</th>` : "";
    const thead = vis.map((c) => _tlSortTh(c, sortCol, sortDir, "tl-lib-sort")).join("");
    const rows = sliced.map((lib) => {
      const type = (lib.section_type || "").toLowerCase();
      const icon = this._tlLibSvgIcon(type, lib.section_name || "", "md");
      const lAcc = lib.last_accessed ? this._tlFmtDate(lib.last_accessed) : `<span style="color:var(--is-text-muted)">${this._t("tlNever")}</span>`;
      const lPly = lib.last_played ? `<span style="font-size:11px;color:var(--is-text-sec)">${lib.last_played}</span>` : `<span style="color:var(--is-text-muted)">${this._t("tlNA")}</span>`;
      const cm = {
        name: `<td style="max-width:150px"><span style="display:flex;align-items:center;min-width:0">${icon}<strong class="u-truncate">${lib.section_name || "\u2014"}</strong></span></td>`,
        type: `<td style="text-transform:capitalize;color:var(--is-text-label);white-space:nowrap">${lib.section_type || "\u2014"}</td>`,
        count: `<td style="text-align:right;color:rgba(250,180,50,0.9);font-weight:700">${lib.count ?? "\u2014"}</td>`,
        parents: `<td style="text-align:right">${lib.parent_count != null ? lib.parent_count : "\u2014"}</td>`,
        children: `<td style="text-align:right">${lib.child_count != null ? lib.child_count : "\u2014"}</td>`,
        lastStream: `<td style="white-space:nowrap">${lAcc}</td>`,
        lastPlayed: `<td style="max-width:160px"><div class="u-truncate">${lPly}</div></td>`,
        plays: `<td style="text-align:right;font-weight:700">${lib.plays ?? 0}</td>`,
        duration: `<td style="text-align:right;white-space:nowrap">${lib.duration ? this._tlFmtDuration(lib.duration) : "\u2014"}</td>`
      };
      const sid = lib.section_id || "";
      const editCell = editMode ? `<td style="white-space:nowrap;padding-right:12px"><div style="display:inline-flex;align-items:center;gap:4px">
        ${this._mtRoundBtn(`data-tl-lib-delete="${sid}" data-tl-lib-name="${lib.section_name || sid}"`, _TL_TRASH, "Delete", { size: 24, tone: "red" })}
        ${this._mtRoundBtn(`data-tl-lib-purge="${sid}" data-tl-lib-name="${lib.section_name || sid}"`, _TL_PURGE, "Purge history", { size: 24, tone: "red" })}
      </div></td>` : "";
      const ldAttr = !editMode ? ` data-tl-ld-open="${sid}" data-tl-ld-name="${this._escHtml(lib.section_name || "")}" style="cursor:pointer"` : "";
      return `<tr${ldAttr}>${editCell}${vis.map((c) => cm[c.key] || "<td>\u2014</td>").join("")}</tr>`;
    }).join("");
    return toolbar + `<div class="tl-libs-results-wrap" style="display:contents"><div style="overflow-x:auto"><table class="tl-users-table"><thead><tr>${editThHdr}${thead}</tr></thead><tbody>${rows || `<tr><td colspan="${vis.length}" class="u-empty">${this._t("tlNoLibraryData")}</td></tr>`}</tbody></table></div>${this._tlMobPag("tl-lpage", page, totalPages)}</div>`;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Users
  // ──────────────────────────────────────────────────────────────────────────
  _tlIpReport() {
    const tl = this._tautulli || {};
    const m = this._tautulliModal || {};
    if (!tl.sharingDetected || tl.sharingAcked) return "";
    const open = m.ipReportOpen !== false;
    const threshold = this._config?.security?.ip_sharing_threshold ?? 2;
    const users = tl.sharingUsers || [];
    const report = tl.ipReport || {};
    const rows = users.map((name) => {
      const ips = report[name] || [];
      const ipRows = ips.map((e) => {
        const d = e.lastSeen ? new Date(e.lastSeen * 1e3) : null;
        const dateStr = d ? d.toLocaleDateString(this._locale, { month: "short", day: "numeric", year: "numeric" }) : "\u2014";
        return `<tr>
          <td style="padding:4px 8px;font-size:11px;font-family:monospace;color:var(--is-text)">${e.ip}</td>
          <td style="padding:4px 8px;font-size:11px;color:var(--is-text-muted)">${dateStr}</td>
          <td style="padding:4px 8px;font-size:11px;color:var(--is-text-muted);text-align:right">${e.count}</td>
        </tr>`;
      }).join("");
      return `<div style="margin-bottom:12px">
        <div style="font-size:12px;font-weight:700;color:rgba(255,150,150,0.9);margin-bottom:6px;display:flex;align-items:center;gap:6px">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          ${name}
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.08)">
              <th style="padding:3px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:left">${this._t("tlColIPAddress")}</th>
              <th style="padding:3px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:left">${this._t("tlColLastSeen")}</th>
              <th style="padding:3px 8px;font-size:10px;font-weight:600;color:var(--is-text-muted);text-align:right">${this._t("tlColPlays")}</th>
            </tr>
          </thead>
          <tbody>${ipRows}</tbody>
        </table>
      </div>`;
    }).join("");
    const chevron = open ? `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>` : `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`;
    return `<div style="background:rgba(180,30,30,0.12);border:1px solid rgba(255,100,100,0.2);border-radius:8px;margin-bottom:10px;overflow:hidden">
      <div id="tl-ip-report-toggle" style="display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:pointer;user-select:none">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="rgba(255,150,150,0.9)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span style="font-size:12px;font-weight:700;color:rgba(255,150,150,0.95);flex:1">${this._t("tlSharingDetected")} \xB7 ${users.length} user${users.length !== 1 ? "s" : ""} \xB7 ${threshold}+ unique IPs</span>
        <button class="tl-ack-btn" id="tl-ack-btn" style="font-size:10px;padding:3px 10px;margin-right:4px" onclick="event.stopPropagation()">${this._t("tlAcknowledge")}</button>
        ${chevron}
      </div>
      ${open ? `<div style="padding:0 12px 12px">${rows}</div>` : ""}
    </div>`;
  }
  _tlBodyUsers(data, total) {
    const isMobile2 = this._isMob;
    const m = this._tautulliModal || {};
    if (m.mediaDetailKey) return this._tlBodyMediaDetail();
    if (m.userDetailId) return this._tlBodyUserDetail();
    const page = m.usersPage || 0;
    const perPage = this._tlCalcPerPage();
    const sortCol = m.usersSortCol || "plays";
    const sortDir = m.usersSortDir || "desc";
    const editMode = m.usersEditMode || false;
    const search = (m.usersSearch || "").toLowerCase().trim();
    const hidden = this._tlHidden("usersHiddenCols", ["username", "fullname", "email"]);
    const mobHidden = this._tlHidden("usersMobHiddenCols", ["lastPlayed", "platform", "player", "ip", "username", "email"]);
    const filtered = search ? (data || []).filter((u) => [u.friendly_name || "", u.username || "", u.email || ""].some((v) => v.toLowerCase().includes(search))) : data || [];
    const tot = filtered.length;
    const totalPages = Math.max(1, Math.ceil(tot / perPage));
    const COLS = [
      { key: "user", label: this._t("tlColUser"), sort: "friendly_name", right: false },
      { key: "username", label: this._t("tlColUsername"), sort: "username", right: false },
      { key: "fullname", label: this._t("tlColFullName"), sort: "full_name", right: false },
      { key: "email", label: this._t("tlColEmail"), sort: "email", right: false },
      { key: "lastSeen", label: this._t("tlColLastStreamed"), sort: "last_seen", right: false },
      { key: "ip", label: this._t("tlColLastKnownIP"), sort: "ip_address", right: false },
      { key: "platform", label: this._t("tlColLastPlatform"), sort: "platform", right: false },
      { key: "player", label: this._t("tlColLastPlayer"), sort: "player", right: false },
      { key: "lastPlayed", label: this._t("tlColLastPlayed"), sort: "last_played", right: false },
      { key: "plays", label: this._t("tlColTotalPlays"), sort: "plays", right: true },
      { key: "duration", label: this._t("tlColTotalDuration"), sort: "duration", right: true }
    ];
    const vis = COLS.filter((c) => !hidden.has(c.key));
    const tl2 = this._tautulli || {};
    const showBanner = tl2.sharingDetected && !tl2.sharingAcked;
    const wU = tl2.sharingUsers || [];
    const banner = "";
    const deskColItems = this._tlColItems(COLS.filter((c) => c.key !== "user"), hidden, "data-tl-col");
    const deskColsBtn = this._tlColsMenu("tl-users-cols-btn", "tl-users-cols-menu", deskColItems, m.usersColsOpen);
    const MOB_USR_COLS = [
      { key: "lastSeen", label: this._t("tlColLastSeen") },
      { key: "lastPlayed", label: this._t("tlColLastPlayed") },
      { key: "platform", label: this._t("tlColPlatform") },
      { key: "player", label: this._t("tlColPlayer") },
      { key: "ip", label: this._t("tlColLastIP") },
      { key: "username", label: this._t("tlColUsername") },
      { key: "email", label: this._t("tlColEmail") }
    ];
    const mobColItems = this._tlColItems(MOB_USR_COLS, mobHidden, "data-tl-usr-mob-col");
    const mobColsBtn = this._tlColsMenu("tl-users-mob-cols-btn", "tl-users-mob-cols-menu", mobColItems, m.usersMobColsOpen);
    const editBtn = this._tlEditBtn("tl-users-edit-btn", editMode);
    const colsBtn = isMobile2 ? mobColsBtn : deskColsBtn;
    const ipReport = this._tlIpReport();
    const toolbar = `${ipReport}<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-shrink:0">${this._uiBar("tl-users-search", m.usersSearch || "", [], [{ html: editBtn }, { html: colsBtn }])}</div>`;
    const page2 = Math.min(page, totalPages - 1);
    const sliced = filtered.slice(page2 * perPage, (page2 + 1) * perPage);
    if (isMobile2) {
      const warnUsers2 = wU;
      const cards = sliced.map((u) => {
        const name = u.friendly_name || u.username || "\u2014";
        const thumb = u.user_thumb || "";
        const av = thumb ? `<img src="${thumb}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid var(--is-divider)" loading="lazy" onerror="this.style.display='none'">` : `<span style="width:36px;height:36px;border-radius:50%;background:var(--is-btn-bg);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--is-text-muted);font-size:13px;font-weight:700">${(name[0] || "?").toUpperCase()}</span>`;
        const uid = u.user_id || "";
        const kh = u.keep_history != null ? Number(u.keep_history) : 1;
        const ag = u.allow_guest != null ? Number(u.allow_guest) : 0;
        const editBtns = editMode ? `<div class="tl-mob-edit">
          ${this._mtRoundBtn(`data-tl-delete="${uid}" data-tl-name="${this._escHtml(name)}"`, _TL_TRASH, "Delete", { size: 24, tone: "red" })}
          ${this._mtRoundBtn(`data-tl-purge="${uid}" data-tl-name="${this._escHtml(name)}"`, _TL_PURGE, "Purge history", { size: 24, tone: "red" })}
          <button class="tl-edit-btn tl-tog-btn${kh ? " on" : ""}" data-tl-toggle-hist="${uid}" data-tl-kh="${kh}"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></button>
          <button class="tl-edit-btn tl-tog-btn${ag ? " on" : ""}" data-tl-toggle-guest="${uid}" data-tl-ag="${ag}"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></button>
        </div>` : "";
        const um = [];
        if (!mobHidden.has("lastSeen")) um.push(`<span>${u.last_seen ? this._tlFmtDate(u.last_seen) : this._t("tlNeverSeen")}</span>`);
        if (!mobHidden.has("lastPlayed") && u.last_played) um.push(`<span style="display:inline-flex;align-items:center;gap:3px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this._tlMediaIcon(u.media_type, 13)}<span style="overflow:hidden;text-overflow:ellipsis">${this._escHtml(u.last_played)}</span></span>`);
        if (!mobHidden.has("platform") && u.platform) um.push(`<span>${this._escHtml(u.platform)}</span>`);
        if (!mobHidden.has("player") && u.player) um.push(`<span>${this._escHtml(u.player)}</span>`);
        if (!mobHidden.has("ip") && u.ip_address) um.push(`<span style="font-family:monospace;font-size:10px">${this._escHtml(u.ip_address)}</span>`);
        if (!mobHidden.has("username") && u.username) um.push(`<span style="color:var(--is-text-label)">${this._escHtml(u.username)}</span>`);
        if (!mobHidden.has("email") && u.email) um.push(`<span style="color:var(--is-text-label);font-size:10px">${this._escHtml(u.email)}</span>`);
        return `<div class="tl-mob-card" data-tl-ud-open="${uid}" data-tl-ud-name="${this._escHtml(name)}" data-tl-ud-thumb="${thumb}" style="cursor:pointer"><div class="u-row-10">
          ${av}
          <div style="flex:1;min-width:0"><div class="tl-mob-name">${this._escHtml(name)}</div>${um.length ? `<div class="tl-mob-meta">${um.join("")}</div>` : ""}</div>
          <div style="text-align:right;flex-shrink:0">
            <div style="color:rgba(250,180,50,0.9);font-weight:700">&#9654; ${u.plays ?? 0}</div>
            <div class="u-sm-label">${u.duration ? this._tlFmtDuration(u.duration) : "\u2014"}</div>
          </div>
        </div>${editBtns}</div>`;
      }).join("") || `<div class="u-empty">${this._t("tlNoUserData")}</div>`;
      return toolbar + `<div class="tl-users-results-wrap" style="display:contents"><div>${cards}</div>${this._tlMobPag("tl-upage", page, totalPages)}</div>`;
    }
    const warnUsers = wU;
    const editThHdr = editMode ? `<th style="white-space:nowrap;width:1px;padding-right:12px">${this._t("tlEdit")}</th>` : "";
    const thead = vis.map((c) => _tlSortTh(c, sortCol, sortDir, "tl-sort")).join("");
    const rows = sliced.map((u) => {
      const name = u.friendly_name || u.username || "\u2014";
      const isW = warnUsers.includes(name) || warnUsers.includes(u.username);
      const thumb = u.user_thumb || "";
      const av = thumb ? `<img src="${thumb}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid var(--is-divider)" loading="lazy" onerror="this.style.display='none'">` : `<span style="width:30px;height:30px;border-radius:50%;background:var(--is-btn-bg);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--is-text-muted);font-size:12px;font-weight:700">${(name[0] || "?").toUpperCase()}</span>`;
      const mIco = u.last_played ? this._tlMediaIcon(u.media_type) : "";
      const cm = {
        user: `<td><div class="u-row-8">${av}<span style="font-weight:600">${this._escHtml(name)}</span></div></td>`,
        username: `<td style="color:var(--is-text-label)">${this._escHtml(u.username || "\u2014")}</td>`,
        fullname: `<td style="color:var(--is-text-label)">${this._escHtml(u.full_name || "\u2014")}</td>`,
        email: `<td style="color:var(--is-text-label);font-size:11px">${this._escHtml(u.email || "\u2014")}</td>`,
        lastSeen: `<td>${u.last_seen ? this._tlFmtDate(u.last_seen) : `<span style="color:var(--is-text-muted)">${this._t("tlNever")}</span>`}</td>`,
        ip: `<td style="font-family:monospace;font-size:11px">${this._escHtml(u.ip_address || this._t("tlNA"))}</td>`,
        platform: `<td>${this._escHtml(u.platform || this._t("tlNA"))}</td>`,
        player: `<td>${u.player ? `<span style="display:inline-flex;align-items:center;gap:5px"><svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" style="color:var(--is-text-muted)" stroke="none"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><polygon points="10 8 17 12 10 16"/></svg>${this._escHtml(u.player)}</span>` : `<span style="color:var(--is-text-muted)">${this._t("tlNA")}</span>`}</td>`,
        lastPlayed: `<td style="max-width:160px"><div style="display:flex;align-items:center;gap:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.last_played ? mIco + '<span style="overflow:hidden;text-overflow:ellipsis">' + this._escHtml(u.last_played) + "</span>" : '<span style="color:var(--is-text-muted)">n/a</span>'}</div></td>`,
        plays: `<td style="text-align:right;color:rgba(250,180,50,0.9);font-weight:700">${u.plays ?? 0}</td>`,
        duration: `<td style="text-align:right">${u.duration ? this._tlFmtDuration(u.duration) : "\u2014"}</td>`
      };
      const uid = u.user_id || "";
      const kh = u.keep_history != null ? Number(u.keep_history) : 1;
      const ag = u.allow_guest != null ? Number(u.allow_guest) : 0;
      const editCell = editMode ? `<td style="white-space:nowrap;padding-right:12px"><div style="display:inline-flex;align-items:center;gap:4px">
        ${this._mtRoundBtn(`data-tl-delete="${uid}" data-tl-name="${this._escHtml(name)}"`, _TL_TRASH, "Delete", { size: 24, tone: "red" })}
        ${this._mtRoundBtn(`data-tl-purge="${uid}" data-tl-name="${this._escHtml(name)}"`, _TL_PURGE, "Purge history", { size: 24, tone: "red" })}
        <button class="tl-edit-btn tl-tog-btn${kh ? " on" : ""}" data-tl-toggle-hist="${uid}" data-tl-kh="${kh}" title="${kh ? "Disable" : "Enable"} history"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></button>
        <button class="tl-edit-btn tl-tog-btn${ag ? " on" : ""}" data-tl-toggle-guest="${uid}" data-tl-ag="${ag}" title="${ag ? "Disable" : "Enable"} guest"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></button>
      </div></td>` : "";
      return `<tr${isW ? ' class="tl-row-warn"' : ""} data-tl-ud-open="${uid}" data-tl-ud-name="${this._escHtml(name)}" data-tl-ud-thumb="${thumb}" style="cursor:pointer">${editCell}${vis.map((c) => cm[c.key] || "<td>\u2014</td>").join("")}</tr>`;
    }).join("");
    return toolbar + `<div class="tl-users-results-wrap" style="display:contents"><div style="overflow-x:auto"><table class="tl-users-table"><thead><tr>${editThHdr}${thead}</tr></thead><tbody>${rows || `<tr><td colspan="${vis.length}" class="u-empty">${this._t("tlNoUserData")}</td></tr>`}</tbody></table></div>${this._tlMobPag("tl-upage", page, totalPages)}</div>`;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Refetch
  // ──────────────────────────────────────────────────────────────────────────
  async _tlRefetchLibraries(body) {
    const m = this._tautulliModal;
    if (!m) return;
    body.innerHTML = `<div class="u-empty-lg">${this._t("loading")}</div>`;
    const pp = this._tlCalcPerPage();
    const start = (m.libsPage || 0) * pp;
    const r = await this._tlApiFetch("get_libraries_table", `length=${pp}&start=${start}&order_column=${m.libsSortCol || "plays"}&order_dir=${m.libsSortDir || "desc"}`);
    if (!this._tautulliModal) return;
    m.libsData = r?.response?.data?.data || [];
    m.libsTotal = r?.response?.data?.recordsFiltered || r?.response?.data?.recordsTotal || m.libsData.length;
    body.innerHTML = this._tlBodyLibraries(m.libsData, m.libsTotal);
    this._wireTautulliModalBody(body);
  }
  async _tlRefetchUsers(body) {
    const m = this._tautulliModal;
    if (!m) return;
    body.innerHTML = '<div class="u-empty-lg">Loading\u2026</div>';
    const pp = this._tlCalcPerPage();
    const start = (m.usersPage || 0) * pp;
    const r = await this._tlApiFetch("get_users_table", `length=${pp}&start=${start}&order_column=${m.usersSortCol || "plays"}&order_dir=${m.usersSortDir || "desc"}`);
    if (!this._tautulliModal) return;
    m.usersData = r?.response?.data?.data || [];
    m.usersTotal = r?.response?.data?.recordsFiltered || r?.response?.data?.recordsTotal || m.usersData.length;
    body.innerHTML = this._tlBodyUsers(m.usersData, m.usersTotal);
    this._wireTautulliModalBody(body);
  }
  // ──────────────────────────────────────────────────────────────────────────
  // History
  // ──────────────────────────────────────────────────────────────────────────
  _tlBodyHistory() {
    const m = this._tautulliModal;
    if (!m) return "";
    if (m.histLoading) return `<div class="u-empty-lg">${this._t("loading")}</div>`;
    const isMob = this._isMob;
    const page = m.histPage || 0;
    const perPage = this._tlCalcPerPage({ hasFilter: true });
    const tot = m.histTotal || 0;
    const data = m.histData || [];
    const media = m.histMedia || null;
    const playback = m.histPlayback || null;
    const _TRASH_S = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`;
    const _CHECK_S = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="20 6 9 17 4 12"/></svg>`;
    const _CROSS_S = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    const _rowDel = (rid) => m.histDelId === String(rid) ? `<span style="display:inline-flex;gap:4px">
           ${this._mtRoundBtn(`data-tl-hist-delete-yes="${rid}"`, _CHECK_S, this._t("tlDelete"), { size: 24, tone: "red" })}
           ${this._mtRoundBtn("data-tl-hist-delete-no", _CROSS_S, "Cancel", { size: 24, tone: "blue" })}
         </span>` : this._mtRoundBtn(`data-tl-hist-delete="${rid}"`, _TRASH_S, this._t("tlDelete"), { size: 24, tone: "red" });
    const users = m.histUsers || [];
    const selUser = m.histUser || "";
    const hidden = this._tlHidden("histHiddenCols", ["ip", "paused", "stopped"]);
    const mobHidden = this._tlHidden("histMobHiddenCols", ["ip", "platform", "product", "player", "paused", "stopped"]);
    const totalPages = Math.max(1, Math.ceil(tot / perPage));
    const HIST_COLS = [
      { key: "date", label: this._t("tlColDate"), right: false },
      { key: "user", label: this._t("tlColUser"), right: false },
      { key: "ip", label: this._t("tlColIP"), right: false },
      { key: "platform", label: this._t("tlColPlatform"), right: false },
      { key: "product", label: this._t("tlColProduct"), right: false },
      { key: "player", label: this._t("tlColPlayer"), right: false },
      { key: "title", label: this._t("tlColTitle"), right: false },
      { key: "started", label: this._t("tlColStarted"), right: false },
      { key: "paused", label: this._t("tlColPaused"), right: true },
      { key: "stopped", label: this._t("tlColStopped"), right: false },
      { key: "duration", label: this._t("tlColDuration"), right: true }
    ];
    const MOB_HIST_PICKER = [
      { key: "platform", label: this._t("tlColPlatform") },
      { key: "player", label: this._t("tlColPlayer") },
      { key: "started", label: this._t("tlColStarted") },
      { key: "duration", label: this._t("tlColDuration") },
      { key: "ip", label: this._t("tlColIP") },
      { key: "paused", label: this._t("tlColPaused") },
      { key: "stopped", label: this._t("tlColStopped") }
    ];
    const colsBtn = isMob ? this._tlColsMenu("tl-hist-mob-cols-btn", "tl-hist-mob-cols-menu", this._tlColItems(MOB_HIST_PICKER, mobHidden, "data-tl-hist-mob-col"), m.histMobColsOpen) : this._tlColsMenu("tl-hist-cols-btn", "tl-hist-cols-menu", this._tlColItems(HIST_COLS.filter((c) => c.key !== "title"), hidden, "data-tl-hist-col"), m.histColsOpen);
    const toolbar = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-shrink:0">${this._uiBar("tl-hist-search", m.histSearch || "", [
      {
        id: "tl-hist-user-sel",
        kind: "relgroup",
        value: selUser || "",
        neutral: "",
        items: [["", this._t("tlAllUsers")], ...(users || []).map((u) => [u.user_id ?? "", u.friendly_name || u.user || "?"])]
      },
      {
        id: "tl-hist-media",
        kind: "source",
        value: media || "",
        neutral: "",
        items: [["", this._t("tlAllMedia")], ["movie", this._t("tlFilterMovies")], ["episode", this._t("tlFilterTvShows")], ["track", this._t("tlFilterMusic")], ["live", this._t("tlFilterLiveTV")]]
      },
      {
        id: "tl-hist-play",
        kind: "protocol",
        value: playback || "",
        neutral: "",
        items: [["", this._t("tlAllPlayback")], ["direct play", this._t("tlFilterDirectPlay")], ["direct stream", this._t("tlFilterDirectStream")], ["transcode", this._t("tlFilterTranscode")]]
      }
    ], [
      { html: colsBtn }
    ])}</div>`;
    const _wRing = '<circle cx="7" cy="7" r="5.5" fill="none" style="stroke:var(--is-text-muted)" stroke-width="1.5"/>';
    const _wSvg = (inner) => `<svg width="14" height="14" viewBox="0 0 14 14">${inner}</svg>`;
    const _wArc = (d) => `<path d="${d}" style="fill:var(--is-text-body)"/>`;
    const watchSvg = (ws) => ws === 4 ? _wSvg('<circle cx="7" cy="7" r="5.5" style="fill:var(--is-text-body)"/>') : ws === 3 ? _wSvg(`${_wRing}${_wArc("M7,7 L7,1.5 A5.5,5.5 0,1,1 1.5,7 Z")}`) : ws === 2 ? _wSvg(`${_wRing}${_wArc("M7,7 L7,1.5 A5.5,5.5 0,0,1 7,12.5 Z")}`) : ws === 1 ? _wSvg(`${_wRing}${_wArc("M7,7 L7,1.5 A5.5,5.5 0,0,1 12.5,7 Z")}`) : _wSvg(_wRing);
    if (!data.length) {
      return toolbar + `<div class="tl-hist-results-wrap" style="display:contents"><div class="u-empty">${this._t("tlNoHistory")}</div></div>`;
    }
    if (isMob) {
      const cards = data.map((h) => {
        const icon = this._tlMediaIcon(h.media_type || "", 15);
        const title = this._escHtml(h.full_title || h.title || "\u2014");
        const user = this._escHtml(h.friendly_name || h.user || "\u2014");
        const ago = h.date ? this._tlFmtDate(h.date) : "\u2014";
        const dur = h.duration ? this._tlFmtDuration(h.duration) : "\u2014";
        const pct = h.percent_complete ?? 0;
        const ws = pct >= 85 ? 4 : pct >= 63 ? 3 : pct >= 38 ? 2 : pct >= 10 ? 1 : 0;
        const mp = [];
        if (!mobHidden.has("platform") && h.platform) mp.push(this._escHtml(h.platform));
        if (!mobHidden.has("player") && h.player) mp.push(this._escHtml(h.player));
        if (!mobHidden.has("started") && h.started) mp.push(this._tlFmtTime(h.started));
        if (!mobHidden.has("ip") && h.ip_address) mp.push(h.ip_address);
        if (!mobHidden.has("paused") && h.paused_counter) mp.push(this._t("tlColPaused") + " " + this._tlFmtDuration(h.paused_counter));
        const meta = `<div class="tl-mob-meta"><span>${user}</span><span style="color:var(--is-text-muted)"> &middot; </span><span>${ago}</span>${mp.map((v) => `<span style="color:var(--is-text-muted)"> &middot; </span><span>${v}</span>`).join("")}</div>`;
        const delEl = `<div style="margin-top:6px;display:flex;justify-content:flex-end">${_rowDel(h.row_id)}</div>`;
        return `<div class="tl-mob-card"><div class="u-row-10"><div style="flex:1;min-width:0"><div class="tl-mob-name u-row-4">${icon}<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${title}</span></div>${meta}</div><div style="text-align:right;flex-shrink:0"><div style="font-size:13px;font-weight:600;color:var(--is-text)">${dur}</div><div style="margin-top:2px;display:flex;justify-content:flex-end">${watchSvg(ws)}</div></div></div>${delEl}</div>`;
      }).join("");
      return toolbar + `<div class="tl-hist-results-wrap" style="display:contents"><div>${cards}</div>${this._tlMobPag("tl-hpage", page, totalPages)}</div>`;
    }
    const vis = HIST_COLS.filter((c) => !hidden.has(c.key));
    const thead = vis.map((c) => `<th style="${c.right ? "text-align:right;" : ""}white-space:nowrap">${c.label}</th>`).join("") + "<th></th>";
    const delHdr = '<th style="width:1px"></th>';
    const rows = data.map((h) => {
      const icon = this._tlMediaIcon(h.media_type || "", 15);
      const pct = h.percent_complete ?? 0;
      const ws = pct >= 85 ? 4 : pct >= 63 ? 3 : pct >= 38 ? 2 : pct >= 10 ? 1 : 0;
      const rid = h.row_id || "";
      const esc = (s) => this._escHtml(s || "");
      const cm = {
        date: `<td style="white-space:nowrap;font-size:11px;color:var(--is-text-label)">${h.date ? this._tlFmtDate(h.date) : "\u2014"}</td>`,
        user: `<td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(h.friendly_name || h.user)}</td>`,
        ip: `<td style="white-space:nowrap;font-size:11px;color:var(--is-text-label)">${h.ip_address || "\u2014"}</td>`,
        platform: `<td style="white-space:nowrap;color:var(--is-text-label)">${esc(h.platform)}</td>`,
        product: `<td style="white-space:nowrap;color:var(--is-text-label)">${esc(h.product)}</td>`,
        player: `<td style="white-space:nowrap;color:var(--is-text-label)">${esc(h.player)}</td>`,
        title: `<td style="max-width:240px"><div style="display:flex;align-items:center;gap:5px;min-width:0">${icon}<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1" title="${esc(h.full_title || h.title)}">${esc(h.full_title || h.title)}</span></div></td>`,
        started: `<td class="u-nowrap-sm">${h.started ? this._tlFmtTime(h.started) : "\u2014"}</td>`,
        paused: `<td style="text-align:right;white-space:nowrap;font-size:11px">${h.paused_counter ? this._tlFmtDuration(h.paused_counter) : "0m"}</td>`,
        stopped: `<td class="u-nowrap-sm">${h.stopped ? this._tlFmtTime(h.stopped) : "\u2014"}</td>`,
        duration: `<td style="text-align:right;white-space:nowrap;font-weight:600">${h.duration ? this._tlFmtDuration(h.duration) : "\u2014"}</td>`
      };
      const watchCell = `<td style="text-align:right;padding-right:8px;white-space:nowrap">${watchSvg(ws)}</td>`;
      const delCell = `<td style="padding:0 4px;white-space:nowrap">${_rowDel(rid)}</td>`;
      return `<tr>${vis.map((c) => cm[c.key] || "<td>\u2014</td>").join("")}${watchCell}${delCell}</tr>`;
    }).join("");
    return toolbar + `<div class="tl-hist-results-wrap" style="display:contents"><div style="overflow-x:auto"><table class="tl-users-table"><thead><tr>${thead}${delHdr}</tr></thead><tbody>${rows || `<tr><td colspan="${vis.length + 2}" class="u-empty">${this._t("tlNoHistory")}</td></tr>`}</tbody></table></div>${this._tlMobPag("tl-hpage", page, totalPages)}</div>`;
  }
  async _tlRefetchHistory(body) {
    const m = this._tautulliModal;
    if (!m) return;
    const resultsWrap = body.querySelector(".tl-hist-results-wrap");
    if (resultsWrap) resultsWrap.innerHTML = `<div class="u-empty-lg">${this._t("loading")}</div>`;
    else body.innerHTML = `<div class="u-empty-lg">${this._t("loading")}</div>`;
    const data = await this._tlFetchHistory(m.histPage, m.histUser, m.histMedia, m.histPlayback, this._tlCalcPerPage({ hasFilter: true }), m.histSearch);
    if (!this._tautulliModal) return;
    m.histData = data.data || [];
    m.histTotal = data.recordsFiltered || 0;
    this._patchResultsWrap(body, "tl-hist-results-wrap", () => this._tlBodyHistory());
    this._wireTautulliModalBody(body);
  }
  // ──────────────────────────────────────────────────────────────────────────
  // User detail — wrapper
  // ──────────────────────────────────────────────────────────────────────────
  _tlBodyUserDetail() {
    const m = this._tautulliModal || {};
    const tab = m.userDetailTab || "profile";
    const name = m.userDetailName || "\u2014";
    const thumb = m.userDetailThumb || "";
    const isMob = this._isMob;
    const av = thumb ? `<img src="${thumb}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:1px solid var(--is-divider);flex-shrink:0" loading="lazy" onerror="this.style.display='none'">` : `<span style="width:40px;height:40px;border-radius:50%;background:var(--is-btn-bg);display:inline-flex;align-items:center;justify-content:center;color:var(--is-text-muted);font-size:15px;font-weight:700;flex-shrink:0">${(name[0] || "?").toUpperCase()}</span>`;
    const TAB_LABELS = { profile: "Profile", history: "History", ips: "IP Addresses" };
    const tabBtns = `<span class="mt-nav mt-nav--inline"><span class="mt-nav-ind"></span>${["profile", "history", "ips"].map((t) => `<button class="mt-nav-btn${tab === t ? " is-on" : ""}" data-tl-ud-tab="${t}">${TAB_LABELS[t]}</button>`).join("")}</span>`;
    const backBtn = `<button data-tl-ud-back style="display:none"></button>`;
    const hdr = isMob ? `<div style="margin-bottom:12px">
           ${backBtn}
           <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
             ${av}
             <div style="font-size:15px;font-weight:700;color:var(--is-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this._escHtml(name)}</div>
           </div>
           ${tabBtns}
         </div>` : `<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
           ${backBtn}${av}
           <div style="font-size:15px;font-weight:700;color:var(--is-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0">${this._escHtml(name)}</div>
           ${tabBtns}
         </div>`;
    let content = "";
    if (tab === "profile") content = this._tlBodyUdProfile();
    else if (tab === "history") content = this._tlBodyUdHistory();
    else content = this._tlBodyUdIps();
    return hdr + content;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // User detail — Profile tab
  // ──────────────────────────────────────────────────────────────────────────
  _tlBodyUdProfile() {
    const m = this._tautulliModal || {};
    const profile = m.userDetailProfile;
    if (!profile) return `<div class="u-empty-lg">${this._t("loading")}</div>`;
    const isMob = this._isMob;
    const wts = profile.watchTimeStats || [];
    const ps = profile.playerStats || [];
    const rh = profile.recentHistory || [];
    const periodLabel = (d) => d === 1 ? "Last 24h" : d === 7 ? "Last 7 days" : d === 30 ? "Last 30 days" : "All Time";
    const statMap = {};
    wts.forEach((s) => {
      statMap[Number(s.query_days)] = s;
    });
    const statCards = [1, 7, 30, 0].map((d) => {
      const s = statMap[d] || {};
      const plays = s.total_plays ?? 0;
      const dur = s.total_time ? this._tlFmtDuration(s.total_time) : "0m";
      return `<div style="background:var(--is-row-hover);border-radius:8px;padding:${isMob ? "6px" : "8px 6px"};text-align:center;display:flex;flex-direction:column;gap:2px">
        <div style="font-size:${isMob ? "9px" : "10px"};font-weight:700;color:var(--is-text);text-transform:uppercase;letter-spacing:0.3px">${periodLabel(d)}</div>
        <div style="font-size:${isMob ? "16px" : "20px"};font-weight:800;color:rgba(250,180,50,0.95);line-height:1">${plays} <span style="font-size:8px;font-weight:600;color:var(--is-text-muted);text-transform:uppercase">plays</span></div>
        <div style="font-size:${isMob ? "10px" : "11px"};font-weight:600;color:var(--is-text)">${dur}</div>
      </div>`;
    }).join("");
    const _platIcon = (plat) => {
      const p = (plat || "").toLowerCase();
      const s = `viewBox="0 0 24 24" width="20" height="20" fill="currentColor"`;
      if (p.includes("ios") || p.includes("ipad") || p.includes("iphone") || p.includes("tvos") || p.includes("apple"))
        return `<svg ${s}><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>`;
      if (p.includes("android") || p.includes("samsung") || p.includes("pixel") || p.includes("galaxy"))
        return `<svg ${s}><path d="M17.523 15.341c-.398 0-.72-.322-.72-.72s.322-.72.72-.72.72.322.72.72-.322.72-.72.72m-11.046 0c-.398 0-.72-.322-.72-.72s.322-.72.72-.72.72.322.72.72-.322.72-.72.72M17.69 8.5l1.6-2.771a.333.333 0 10-.577-.333l-1.62 2.806A9.867 9.867 0 0012 7.167a9.867 9.867 0 00-5.093 1.035L5.287 5.396a.333.333 0 10-.577.333L6.31 8.5C3.7 9.991 1.97 12.768 2 16h20c.03-3.232-1.7-6.009-4.31-7.5z"/></svg>`;
      if (p.includes("chrome") || p.includes("chromium"))
        return `<svg ${s} fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>`;
      if (p.includes("roku"))
        return `<svg ${s} fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="14" rx="2"/><line x1="8" y1="22" x2="16" y2="22"/><line x1="12" y1="18" x2="12" y2="22"/></svg>`;
      if (p.includes("xbox"))
        return `<svg ${s}><path d="M4.102 7.512C3.438 8.28 3 9.251 3 10.343c0 1.574.757 2.968 1.917 3.86C4.918 8.948 7.14 5.852 10.14 3.4 8.34 3.543 6.024 4.698 4.103 7.512zm15.796 0C17.977 4.698 15.661 3.543 13.86 3.4c3 2.451 5.222 5.548 5.223 10.803A4.986 4.986 0 0021 10.343c0-1.092-.438-2.063-1.102-2.83zM12 4c-1.55 1.254-5 4.73-5 9 0 1.636.438 3.168 1.194 4.494.806 1.408 1.937 2.573 3.806 4.506 1.869-1.933 3-3.098 3.806-4.506C16.562 16.168 17 14.636 17 13c0-4.27-3.45-7.746-5-9z"/></svg>`;
      if (p.includes("playstation") || p.includes("ps4") || p.includes("ps5"))
        return `<svg ${s}><path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.996.636.199.76.866.76 1.554v5.302c2.773 1.103 4.926-.24 4.926-3.604C19.38 5.726 17.581 4 14.198 4 12.99 4 10.67 4.344 8.985 2.596zM4.62 18.686c-2.545.73-2.697-1.114-.76-1.688l3.15-.934v-2.314l-4.6 1.361C-1.327 16.44.63 21.04 4.62 20.109l3.389-1.004v-2.33z"/></svg>`;
      return `<svg ${s} fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
    };
    const playerChips = ps.length ? `<div style="display:flex;flex-wrap:nowrap;gap:${isMob ? "8px" : "12px"};overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px">` + ps.map((p) => {
      const platform = this._escHtml(p.platform || "");
      const player = this._escHtml(p.player || p.friendly_name || platform);
      const plays = p.total_plays ?? 0;
      const icon = _platIcon(p.platform || "");
      return `<div style="background:var(--is-row-hover);border-radius:12px;padding:${isMob ? "10px 12px" : "12px 16px"};display:flex;flex-direction:column;align-items:center;gap:6px;min-width:${isMob ? "76px" : "90px"};flex-shrink:0">
            <div style="color:var(--is-text-muted)">${icon}</div>
            <div style="font-size:${isMob ? "10px" : "11px"};font-weight:600;color:var(--is-text);text-align:center;width:${isMob ? "68px" : "82px"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${player}</div>
            <div style="font-size:${isMob ? "14px" : "16px"};font-weight:800;color:rgba(250,180,50,0.95);line-height:1">${plays}</div>
            <div style="font-size:9px;color:var(--is-text-muted);text-transform:uppercase">plays</div>
          </div>`;
    }).join("") + "</div>" : `<div style="color:var(--is-text-muted);font-size:12px;padding:8px 0">No player data available.</div>`;
    let recentSection = "";
    if (rh.length) {
      const W = isMob ? 100 : 130;
      const H = Math.round(W * 1.5);
      const perPage = isMob ? 4 : 7;
      const pages = [];
      for (let i = 0; i < rh.length; i += perPage) pages.push(rh.slice(i, i + perPage));
      const multiPage = pages.length > 1;
      const posterCard = (h) => {
        const title = this._escHtml(h.full_title || h.title || "\u2014");
        const ago = h.date ? this._tlFmtDate(h.date) : "";
        const mt = (h.media_type || "").toLowerCase();
        const isLive = mt === "live" || mt === "livetv" || h.live === 1;
        const thumbPath = mt === "episode" && h.grandparent_thumb ? h.grandparent_thumb : h.thumb || "";
        const icon = this._tlMediaIcon(mt, 16);
        const typeLabel = isLive ? "Live TV" : mt === "movie" ? "Movie" : mt === "episode" ? "Show" : mt === "track" ? "Music" : null;
        const typeTag = typeLabel ? `<span class="media-type-tag">${typeLabel}</span>` : "";
        const rk = h.rating_key || "";
        const mdAttr = rk ? ` data-tl-md-open="${rk}" data-tl-md-title="${title}" data-tl-md-thumb="${this._escHtml(thumbPath)}" data-tl-md-prev="user" style="cursor:pointer"` : "";
        const imgTag = thumbPath ? `<img data-tl-plex-path="${this._escHtml(thumbPath)}" alt="" style="width:${W}px;height:${H}px;object-fit:cover;border-radius:6px;display:block" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div style="display:none;width:${W}px;height:${H}px;background:var(--is-row-hover);border-radius:6px;align-items:center;justify-content:center">${icon}</div>` : `<div style="width:${W}px;height:${H}px;background:var(--is-row-hover);border-radius:6px;display:flex;align-items:center;justify-content:center">${icon}</div>`;
        const grad = `<div class="mc-grad" style="border-radius:0 0 6px 6px">
          <div class="mc-title" style="font-size:10px" title="${title}">${title}</div>
          ${ago ? `<div class="mc-sub" style="font-size:9px">${ago}</div>` : ""}
        </div>`;
        return `<div${mdAttr} style="flex-shrink:0;width:${W}px">
          <div style="position:relative;line-height:0;border-radius:6px;overflow:hidden">${imgTag}${typeTag}${grad}</div>
        </div>`;
      };
      const pagesHtml = pages.map(
        (pg) => `<div style="display:flex;gap:8px;flex-shrink:0;min-width:100%;scroll-snap-align:start;padding:2px 0">${pg.map(posterCard).join("")}</div>`
      ).join("");
      const chevStyle = `background:none;border:none;color:var(--is-text);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;opacity:0.85`;
      const chevL = `<button class="tl-ud-rec-prev" disabled style="${chevStyle}"><ha-icon icon="mdi:chevron-left"  style="--mdc-icon-size:28px"></ha-icon></button>`;
      const chevR = `<button class="tl-ud-rec-next"        style="${chevStyle}"><ha-icon icon="mdi:chevron-right" style="--mdc-icon-size:28px"></ha-icon></button>`;
      recentSection = `<div style="margin-top:14px">
        <div class="u-section-hdr">Recently Played</div>
        <div class="sv-nav-wrap">
          ${multiPage ? chevL : ""}
          <div class="sv-scroll" id="tl-ud-rec-scroll" style="scroll-snap-type:x mandatory">${pagesHtml}</div>
          ${multiPage ? chevR : ""}
        </div>
      </div>`;
    }
    return `<div style="margin-bottom:${isMob ? "10px" : "14px"}">
      <div class="u-section-hdr">Global Watch Stats</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:${isMob ? "6px" : "10px"}">${statCards}</div>
    </div>
    <div style="margin-bottom:0">
      <div class="u-section-hdr">Player Stats</div>
      ${playerChips}
    </div>
    ${recentSection}`;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // User detail — History tab
  // ──────────────────────────────────────────────────────────────────────────
  _tlBodyUdHistory() {
    const m = this._tautulliModal;
    if (!m) return "";
    if (m.userDetailHistLoading) return `<div class="u-empty-lg">${this._t("loading")}</div>`;
    const isMob = this._isMob;
    const page = m.userDetailHistPage || 0;
    const perPage = this._tlCalcPerPage({ hasFilter: true });
    const tot = m.userDetailHistTotal || 0;
    const data = m.userDetailHistData || [];
    const media = m.userDetailHistMedia || null;
    const playback = m.userDetailHistPlayback || null;
    const expRow = m.userDetailHistExpandedRow || null;
    const hidden = this._tlHidden("userDetailHistHiddenCols", ["ip", "paused", "stopped"]);
    const mobHidden = this._tlHidden("userDetailHistMobHiddenCols", ["ip", "platform", "product", "player", "paused", "stopped"]);
    const totalPages = Math.max(1, Math.ceil(tot / perPage));
    const HIST_COLS = [
      { key: "date", label: this._t("tlColDate"), right: false },
      { key: "ip", label: this._t("tlColIP"), right: false },
      { key: "platform", label: this._t("tlColPlatform"), right: false },
      { key: "product", label: this._t("tlColProduct"), right: false },
      { key: "player", label: this._t("tlColPlayer"), right: false },
      { key: "title", label: this._t("tlColTitle"), right: false },
      { key: "started", label: this._t("tlColStarted"), right: false },
      { key: "paused", label: this._t("tlColPaused"), right: true },
      { key: "stopped", label: this._t("tlColStopped"), right: false },
      { key: "duration", label: this._t("tlColDuration"), right: true }
    ];
    const MOB_PICKER = [
      { key: "platform", label: this._t("tlColPlatform") },
      { key: "player", label: this._t("tlColPlayer") },
      { key: "started", label: this._t("tlColStarted") },
      { key: "duration", label: this._t("tlColDuration") },
      { key: "ip", label: this._t("tlColIP") },
      { key: "paused", label: this._t("tlColPaused") },
      { key: "stopped", label: this._t("tlColStopped") }
    ];
    const colsBtn = isMob ? this._tlColsMenu("tl-ud-hist-mob-cols-btn", "tl-ud-hist-mob-cols-menu", this._tlColItems(MOB_PICKER, mobHidden, "data-tl-ud-hist-mob-col"), m.userDetailHistMobColsOpen) : this._tlColsMenu("tl-ud-hist-cols-btn", "tl-ud-hist-cols-menu", this._tlColItems(HIST_COLS.filter((c) => c.key !== "title"), hidden, "data-tl-ud-hist-col"), m.userDetailHistColsOpen);
    const toolbar = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-shrink:0">${this._uiBar("tl-ud-hist-search", m.userDetailHistSearch || "", [
      {
        id: "tl-ud-hist-media",
        kind: "source",
        value: media || "",
        neutral: "",
        items: [["", this._t("tlAllMedia")], ["movie", this._t("tlFilterMovies")], ["episode", this._t("tlFilterTvShows")], ["track", this._t("tlFilterMusic")], ["live", this._t("tlFilterLiveTV")]]
      },
      {
        id: "tl-ud-hist-play",
        kind: "protocol",
        value: playback || "",
        neutral: "",
        items: [["", this._t("tlAllPlayback")], ["direct play", this._t("tlFilterDirectPlay")], ["direct stream", this._t("tlFilterDirectStream")], ["transcode", this._t("tlFilterTranscode")]]
      }
    ], [{ html: colsBtn }])}</div>`;
    if (!data.length && !m.userDetailHistLoading) {
      return toolbar + `<div class="tl-ud-hist-results-wrap" style="display:contents"><div class="u-empty">${this._t("tlNoHistory")}</div></div>`;
    }
    const _wRing = '<circle cx="7" cy="7" r="5.5" fill="none" style="stroke:var(--is-text-muted)" stroke-width="1.5"/>';
    const _wSvg = (inner) => `<svg width="14" height="14" viewBox="0 0 14 14">${inner}</svg>`;
    const _wArc = (d) => `<path d="${d}" style="fill:var(--is-text-body)"/>`;
    const watchSvg = (ws) => ws === 4 ? _wSvg('<circle cx="7" cy="7" r="5.5" style="fill:var(--is-text-body)"/>') : ws === 3 ? _wSvg(`${_wRing}${_wArc("M7,7 L7,1.5 A5.5,5.5 0,1,1 1.5,7 Z")}`) : ws === 2 ? _wSvg(`${_wRing}${_wArc("M7,7 L7,1.5 A5.5,5.5 0,0,1 7,12.5 Z")}`) : ws === 1 ? _wSvg(`${_wRing}${_wArc("M7,7 L7,1.5 A5.5,5.5 0,0,1 12.5,7 Z")}`) : _wSvg(_wRing);
    const _streamBadge = (dec) => {
      if (!dec) return "";
      const lo = dec.toLowerCase();
      const tone = lo === "direct play" ? "green" : lo === "direct stream" ? "blue" : "red";
      const lbl = lo === "direct play" ? "Direct Play" : lo === "direct stream" ? "Direct Stream" : "Transcode";
      return this._uiBadge(lbl, tone);
    };
    const _expandedRow = (h, colCount) => {
      const esc = (s) => this._escHtml(s || "");
      const decBdg = _streamBadge(h.transcode_decision);
      const vBdg = h.video_decision ? _streamBadge(h.video_decision) : "";
      const aBdg = h.audio_decision ? _streamBadge(h.audio_decision) : "";
      const vInfo = [esc(h.video_full_resolution || ""), esc(h.video_codec || "")].filter(Boolean).join(" \xB7 ");
      const aInfo = [esc(h.audio_codec || ""), esc(h.audio_channel_layout || "")].filter(Boolean).join(" \xB7 ");
      const qual = esc(h.quality_profile || "");
      const ip = esc(h.ip_address || "");
      const chunks = [
        decBdg ? `<span>${decBdg}</span>` : "",
        qual ? `<span class="u-sm-label">${qual}</span>` : "",
        vInfo ? `<span class="u-sm-label">${vInfo}</span>` : "",
        vBdg ? `<span class="u-xs-muted">Video: ${vBdg}</span>` : "",
        aInfo ? `<span class="u-sm-label">${aInfo}</span>` : "",
        aBdg ? `<span class="u-xs-muted">Audio: ${aBdg}</span>` : "",
        ip ? `<span style="font-family:monospace;font-size:10px;color:var(--is-text-muted)">${ip}</span>` : ""
      ].filter(Boolean);
      return `<tr class="tl-ud-hist-detail-row"><td colspan="${colCount}" style="padding:0 10px 10px">
        <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 10px;background:var(--is-row-hover);border-radius:6px">${chunks.join("")}</div>
      </td></tr>`;
    };
    if (isMob) {
      const cards = data.map((h) => {
        const rid = String(h.row_id || "");
        const icon = this._tlMediaIcon(h.media_type || "", 15);
        const title = this._escHtml(h.full_title || h.title || "\u2014");
        const ago = h.date ? this._tlFmtDate(h.date) : "\u2014";
        const dur = h.duration ? this._tlFmtDuration(h.duration) : "\u2014";
        const pct = h.percent_complete ?? 0;
        const ws = pct >= 85 ? 4 : pct >= 63 ? 3 : pct >= 38 ? 2 : pct >= 10 ? 1 : 0;
        const isExp = expRow === rid;
        const mp = [];
        if (!mobHidden.has("platform") && h.platform) mp.push(this._escHtml(h.platform));
        if (!mobHidden.has("player") && h.player) mp.push(this._escHtml(h.player));
        if (!mobHidden.has("started") && h.started) mp.push(this._tlFmtTime(h.started));
        if (!mobHidden.has("ip") && h.ip_address) mp.push(h.ip_address);
        if (!mobHidden.has("paused") && h.paused_counter) mp.push(this._t("tlColPaused") + " " + this._tlFmtDuration(h.paused_counter));
        const meta = `<div class="tl-mob-meta"><span>${ago}</span>${mp.map((v) => `<span style="color:var(--is-text-muted)"> &middot; </span><span>${v}</span>`).join("")}</div>`;
        const delEl = `<div style="margin-top:6px;display:flex;justify-content:flex-end">${this._mtRoundBtn(`data-tl-ud-hist-delete="${rid}"`, _TL_TRASH, this._t("tlDelete"), { size: 24, tone: "red" })}</div>`;
        let expDetail = "";
        if (isExp) {
          const decBdg = _streamBadge(h.transcode_decision);
          const vInfo = [this._escHtml(h.video_full_resolution || ""), this._escHtml(h.video_codec || "")].filter(Boolean).join(" \xB7 ");
          const aInfo = [this._escHtml(h.audio_codec || ""), this._escHtml(h.audio_channel_layout || "")].filter(Boolean).join(" \xB7 ");
          const qual = this._escHtml(h.quality_profile || "");
          const ip = this._escHtml(h.ip_address || "");
          expDetail = `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--is-divider);display:flex;flex-wrap:wrap;gap:5px;align-items:center">
            ${decBdg}
            ${qual ? `<span class="u-sm-label">${qual}</span>` : ""}
            ${vInfo ? `<span class="u-sm-label">${vInfo}</span>` : ""}
            ${aInfo ? `<span class="u-sm-label">${aInfo}</span>` : ""}
            ${ip ? `<span style="font-family:monospace;font-size:10px;color:var(--is-text-muted)">${ip}</span>` : ""}
          </div>`;
        }
        return `<div class="tl-mob-card tl-ud-hist-row" data-tl-ud-hist-row="${rid}" style="cursor:pointer${isExp ? ";background:var(--is-row-hover)" : ""}">
          <div class="u-row-10">
            <div style="flex:1;min-width:0">
              <div class="tl-mob-name u-row-4">${icon}<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${title}</span></div>
              ${meta}
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:13px;font-weight:600;color:var(--is-text)">${dur}</div>
              <div style="margin-top:2px;display:flex;justify-content:flex-end">${watchSvg(ws)}</div>
            </div>
          </div>
          ${expDetail}${delEl}
        </div>`;
      }).join("");
      return toolbar + `<div class="tl-ud-hist-results-wrap" style="display:contents"><div>${cards}</div>${this._tlMobPag("tl-ud-hpage", page, totalPages, true)}</div>`;
    }
    const vis = HIST_COLS.filter((c) => !hidden.has(c.key));
    const thead = vis.map((c) => `<th style="${c.right ? "text-align:right;" : ""}white-space:nowrap">${c.label}</th>`).join("") + "<th></th>";
    const delHdr = '<th style="width:1px"></th>';
    const rows = data.map((h) => {
      const icon = this._tlMediaIcon(h.media_type || "", 15);
      const pct = h.percent_complete ?? 0;
      const ws = pct >= 85 ? 4 : pct >= 63 ? 3 : pct >= 38 ? 2 : pct >= 10 ? 1 : 0;
      const rid = String(h.row_id || "");
      const isExp = expRow === rid;
      const esc = (s) => this._escHtml(s || "");
      const cm = {
        date: `<td style="white-space:nowrap;font-size:11px;color:var(--is-text-label)">${h.date ? this._tlFmtDate(h.date) : "\u2014"}</td>`,
        ip: `<td style="white-space:nowrap;font-size:11px;color:var(--is-text-label)">${h.ip_address || "\u2014"}</td>`,
        platform: `<td style="white-space:nowrap;color:var(--is-text-label)">${esc(h.platform)}</td>`,
        product: `<td style="white-space:nowrap;color:var(--is-text-label)">${esc(h.product)}</td>`,
        player: `<td style="white-space:nowrap;color:var(--is-text-label)">${esc(h.player)}</td>`,
        title: `<td style="max-width:240px"><div style="display:flex;align-items:center;gap:5px;min-width:0">${icon}<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1" title="${esc(h.full_title || h.title)}">${esc(h.full_title || h.title)}</span></div></td>`,
        started: `<td class="u-nowrap-sm">${h.started ? this._tlFmtTime(h.started) : "\u2014"}</td>`,
        paused: `<td style="text-align:right;white-space:nowrap;font-size:11px">${h.paused_counter ? this._tlFmtDuration(h.paused_counter) : "0m"}</td>`,
        stopped: `<td class="u-nowrap-sm">${h.stopped ? this._tlFmtTime(h.stopped) : "\u2014"}</td>`,
        duration: `<td style="text-align:right;white-space:nowrap;font-weight:600">${h.duration ? this._tlFmtDuration(h.duration) : "\u2014"}</td>`
      };
      const watchCell = `<td style="text-align:right;padding-right:8px">${watchSvg(ws)}</td>`;
      const delCell = `<td style="padding:0 4px">${this._mtRoundBtn(`data-tl-ud-hist-delete="${rid}"`, _TL_TRASH, this._t("tlDelete"), { size: 24, tone: "red" })}</td>`;
      const mainRow = `<tr class="tl-ud-hist-row" data-tl-ud-hist-row="${rid}" style="cursor:pointer${isExp ? ";background:var(--is-row-hover)" : ""}">${vis.map((c) => cm[c.key] || "<td>\u2014</td>").join("")}${watchCell}${delCell}</tr>`;
      return mainRow + (isExp ? _expandedRow(h, vis.length + 2) : "");
    }).join("");
    return toolbar + `<div class="tl-ud-hist-results-wrap" style="display:contents"><div style="overflow-x:auto;overflow-y:hidden"><table class="tl-users-table"><thead><tr>${thead}${delHdr}</tr></thead><tbody>${rows || `<tr><td colspan="${vis.length + 2}" class="u-empty">${this._t("tlNoHistory")}</td></tr>`}</tbody></table></div>${this._tlMobPag("tl-ud-hpage", page, totalPages, true)}</div>`;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // User detail — IP Addresses tab
  // ──────────────────────────────────────────────────────────────────────────
  _tlBodyUdIps() {
    const m = this._tautulliModal || {};
    const data = m.userDetailIpsData || [];
    const sortCol = m.userDetailIpsSortCol || "last_seen";
    const sortDir = m.userDetailIpsSortDir || "desc";
    const page = m.userDetailIpsPage || 0;
    const perPage = this._tlCalcPerPage();
    const isMob = this._isMob;
    if (!data.length) {
      return `<div class="u-empty">No IP address data available.</div>`;
    }
    const sorted = [...data].sort((a, b) => {
      let av = a[sortCol] ?? "", bv = b[sortCol] ?? "";
      if (typeof av === "number" || typeof bv === "number") {
        av = Number(av);
        bv = Number(bv);
      } else {
        av = String(av).toLowerCase();
        bv = String(bv).toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
    const page2 = Math.min(page, totalPages - 1);
    const sliced = sorted.slice(page2 * perPage, (page2 + 1) * perPage);
    const IP_COLS = [
      { key: "ip_address", label: "IP Address", sort: "ip_address", right: false },
      { key: "last_seen", label: "Last Seen", sort: "last_seen", right: false },
      { key: "first_seen", label: "First Seen", sort: "first_seen", right: false },
      { key: "platform", label: this._t("tlColPlatform"), sort: "platform", right: false },
      { key: "player", label: this._t("tlColPlayer"), sort: "player", right: false },
      { key: "last_played", label: this._t("tlColLastPlayed"), sort: "last_played", right: false },
      { key: "play_count", label: this._t("tlColPlays"), sort: "play_count", right: true }
    ];
    const thFn = (c) => {
      const arrow = c.sort === sortCol ? sortDir === "asc" ? "\u2191" : "\u2193" : "\u2195";
      const op = c.sort === sortCol ? 1 : 0.3;
      return `<th data-tl-ud-ip-sort="${c.sort}" style="${c.right ? "text-align:right;" : ""}cursor:pointer;user-select:none;white-space:nowrap"><span style="white-space:nowrap">${c.label} <span style="opacity:${op};font-size:9px">${arrow}</span></span></th>`;
    };
    if (isMob) {
      const cards = sliced.map((ip) => {
        const addr = this._escHtml(ip.ip_address || "\u2014");
        const ls = ip.last_seen ? this._tlFmtDate(ip.last_seen) : "\u2014";
        const fs = ip.first_seen ? this._tlFmtDate(ip.first_seen) : "\u2014";
        const plat = this._escHtml(ip.platform || "");
        const player = this._escHtml(ip.player || "");
        const lp = this._escHtml(ip.last_played || "");
        const pc = ip.play_count ?? 0;
        return `<div class="tl-mob-card">
          <div class="u-row-10">
            <div style="flex:1;min-width:0">
              <div class="tl-mob-name" style="font-family:monospace;font-size:12px">${addr}</div>
              <div class="tl-mob-meta">
                ${ls ? `<span>${ls}</span>` : ""}
                ${plat ? `<span>${plat}</span>` : ""}
                ${player && player !== plat ? `<span>${player}</span>` : ""}
                ${lp ? `<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lp}</span>` : ""}
              </div>
              ${fs ? `<div style="font-size:10px;color:var(--is-text-muted);margin-top:2px">First: ${fs}</div>` : ""}
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:15px;font-weight:700;color:rgba(250,180,50,0.9)">${pc}</div>
              <div style="font-size:9px;color:var(--is-text-muted);text-transform:uppercase">plays</div>
            </div>
          </div>
        </div>`;
      }).join("") || `<div class="u-empty">No data</div>`;
      return `<div>${cards}</div>` + this._tlMobPag("tl-ud-ippage", page, totalPages);
    }
    const thead = IP_COLS.map(thFn).join("");
    const rows = sliced.map((ip) => {
      const esc = (s) => this._escHtml(s || "");
      const addr = esc(ip.ip_address || "\u2014");
      const ls = ip.last_seen ? this._tlFmtDate(ip.last_seen) : "\u2014";
      const fs = ip.first_seen ? this._tlFmtDate(ip.first_seen) : "\u2014";
      const plat = esc(ip.platform || "\u2014");
      const player = esc(ip.player || "\u2014");
      const lp = esc(ip.last_played || "\u2014");
      const pc = ip.play_count ?? 0;
      return `<tr>
        <td style="font-family:monospace;font-size:12px">${addr}</td>
        <td class="u-nowrap-sm">${ls}</td>
        <td class="u-nowrap-sm">${fs}</td>
        <td style="white-space:nowrap">${plat}</td>
        <td style="white-space:nowrap">${player}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lp}</td>
        <td style="text-align:right;font-weight:700;color:rgba(250,180,50,0.9)">${pc}</td>
      </tr>`;
    }).join("");
    return `<div style="overflow-x:auto"><table class="tl-users-table"><thead><tr>${thead}</tr></thead><tbody>${rows || `<tr><td colspan="7" class="u-empty">No data</td></tr>`}</tbody></table></div>` + this._tlMobPag("tl-ud-ippage", page, totalPages);
  }
  // ══════════════════════════════════════════════════════════════════════════
  // Library detail
  // ══════════════════════════════════════════════════════════════════════════
  _tlBodyLibDetail() {
    const m = this._tautulliModal || {};
    const name = m.libDetailName || "\u2014";
    const tab = m.libDetailTab || "profile";
    const isMob = this._isMob;
    const backBtn = `<button data-tl-ld-back style="display:none"></button>`;
    const tabs = [["profile", "Profile"], ["history", "History"], ["media", "Media Info"]];
    const tabBtns = `<span class="mt-nav mt-nav--inline"><span class="mt-nav-ind"></span>${tabs.map(([k, l]) => `<button class="mt-nav-btn${tab === k ? " is-on" : ""}" data-tl-ld-tab="${k}">${l}</button>`).join("")}</span>`;
    const hdr = isMob ? `<div style="margin-bottom:12px">
           ${backBtn}
           <div style="font-size:15px;font-weight:700;color:var(--is-text);margin-bottom:10px">${this._escHtml(name)}</div>
           ${tabBtns}
         </div>` : `<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
           ${backBtn}
           <div style="font-size:15px;font-weight:700;color:var(--is-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0">${this._escHtml(name)}</div>
           ${tabBtns}
         </div>`;
    let content = "";
    if (tab === "profile") content = this._tlBodyLdProfile();
    else if (tab === "history") content = this._tlBodyLdHistory();
    else content = this._tlBodyLdMedia();
    return hdr + content;
  }
  _tlBodyLdProfile() {
    const m = this._tautulliModal || {};
    const prof = m.libDetailProfile;
    const isMob = this._isMob;
    if (!prof) return `<div class="is-loading"><span>${this._t("loading")}</span></div>`;
    const wts = prof.watchTimeStats || [];
    const us = prof.userStats || [];
    const rh = prof.recentHistory || [];
    const periodLabel = (d) => d === 1 ? "Last 24h" : d === 7 ? "Last 7 days" : d === 30 ? "Last 30 days" : "All Time";
    const statMap = {};
    wts.forEach((s) => {
      statMap[Number(s.query_days)] = s;
    });
    const statCards = [1, 7, 30, 0].map((d) => {
      const s = statMap[d] || {};
      const plays = s.total_plays ?? 0;
      const dur = s.total_time ? this._tlFmtDuration(s.total_time) : "0m";
      return `<div style="background:var(--is-row-hover);border-radius:8px;padding:${isMob ? "6px" : "8px 6px"};text-align:center;display:flex;flex-direction:column;gap:2px">
        <div style="font-size:${isMob ? "9px" : "10px"};font-weight:700;color:var(--is-text);text-transform:uppercase;letter-spacing:0.3px">${periodLabel(d)}</div>
        <div style="font-size:${isMob ? "16px" : "20px"};font-weight:800;color:rgba(250,180,50,0.95);line-height:1">${plays} <span style="font-size:8px;font-weight:600;color:var(--is-text-muted);text-transform:uppercase">plays</span></div>
        <div style="font-size:${isMob ? "10px" : "11px"};font-weight:600;color:var(--is-text)">${dur}</div>
      </div>`;
    }).join("");
    const userChips = us.length ? `<div style="display:flex;flex-wrap:wrap;gap:${isMob ? "8px" : "10px"}">` + us.map((u) => {
      const uname = this._escHtml(u.friendly_name || u.user || "\u2014");
      const plays = u.total_plays ?? 0;
      const dur = u.total_time ? this._tlFmtDuration(u.total_time) : "0m";
      const thumb = u.user_thumb || "";
      const av = thumb ? `<img src="${this._escHtml(thumb)}" style="width:28px;height:28px;border-radius:50%;object-fit:cover" onerror="this.style.display='none'">` : `<div style="width:28px;height:28px;border-radius:50%;background:var(--is-row-hover);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--is-text)">${(uname[0] || "?").toUpperCase()}</div>`;
      return `<div style="display:flex;align-items:center;gap:8px;background:var(--is-row-hover);border-radius:10px;padding:6px 10px">
            ${av}
            <div>
              <div style="font-size:11px;font-weight:600;color:var(--is-text)">${uname}</div>
              <div class="u-xs-muted">${plays} plays \xB7 ${dur}</div>
            </div>
          </div>`;
    }).join("") + "</div>" : `<div style="color:var(--is-text-muted);font-size:12px;padding:4px 0">No user data.</div>`;
    let recentSection = "";
    if (rh.length) {
      const W = isMob ? 100 : 130;
      const H = Math.round(W * 1.5);
      const perPage = isMob ? 4 : 7;
      const pages = [];
      for (let i = 0; i < rh.length; i += perPage) pages.push(rh.slice(i, i + perPage));
      const multi = pages.length > 1;
      const posterCard = (h) => {
        const title = this._escHtml(h.full_title || h.title || "\u2014");
        const ago = h.date ? this._tlFmtDate(h.date) : "";
        const mt = (h.media_type || "").toLowerCase();
        const isLive = mt === "live" || mt === "livetv" || h.live === 1;
        const thumbPath = mt === "episode" && h.grandparent_thumb ? h.grandparent_thumb : h.thumb || "";
        const icon = this._tlMediaIcon(mt, 16);
        const typeLabel = isLive ? "Live TV" : mt === "movie" ? "Movie" : mt === "episode" ? "Show" : mt === "track" ? "Music" : null;
        const typeTag = typeLabel ? `<span class="media-type-tag">${typeLabel}</span>` : "";
        const rk = h.rating_key || "";
        const mdAttr = rk ? ` data-tl-md-open="${rk}" data-tl-md-title="${title}" data-tl-md-thumb="${this._escHtml(thumbPath)}" data-tl-md-prev="lib" style="cursor:pointer"` : "";
        const imgTag = thumbPath ? `<img data-tl-plex-path="${this._escHtml(thumbPath)}" alt="" style="width:${W}px;height:${H}px;object-fit:cover;border-radius:6px;display:block" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div style="display:none;width:${W}px;height:${H}px;background:var(--is-row-hover);border-radius:6px;align-items:center;justify-content:center">${icon}</div>` : `<div style="width:${W}px;height:${H}px;background:var(--is-row-hover);border-radius:6px;display:flex;align-items:center;justify-content:center">${icon}</div>`;
        const grad = `<div class="mc-grad" style="border-radius:0 0 6px 6px">
          <div class="mc-title" style="font-size:10px" title="${title}">${title}</div>
          ${ago ? `<div class="mc-sub" style="font-size:9px">${ago}</div>` : ""}
        </div>`;
        return `<div${mdAttr} style="flex-shrink:0;width:${W}px">
          <div style="position:relative;line-height:0;border-radius:6px;overflow:hidden">${imgTag}${typeTag}${grad}</div>
        </div>`;
      };
      const pagesHtml = pages.map((pg) => `<div style="display:flex;gap:8px;flex-shrink:0;min-width:100%;scroll-snap-align:start;padding:2px 0">${pg.map(posterCard).join("")}</div>`).join("");
      const chevSt = `background:none;border:none;color:var(--is-text);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;opacity:0.85`;
      const chevL = `<button class="tl-ld-rec-prev" disabled style="${chevSt}"><ha-icon icon="mdi:chevron-left"  style="--mdc-icon-size:28px"></ha-icon></button>`;
      const chevR = `<button class="tl-ld-rec-next" style="${chevSt}"><ha-icon icon="mdi:chevron-right" style="--mdc-icon-size:28px"></ha-icon></button>`;
      recentSection = `<div style="margin-top:14px">
        <div class="u-section-hdr">Recently Played</div>
        <div class="sv-nav-wrap">
          ${multi ? chevL : ""}
          <div class="sv-scroll" id="tl-ld-rec-scroll" style="scroll-snap-type:x mandatory">${pagesHtml}</div>
          ${multi ? chevR : ""}
        </div>
      </div>`;
    }
    return `<div style="margin-bottom:${isMob ? "10px" : "14px"}">
      <div class="u-section-hdr">Global Watch Stats</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:${isMob ? "6px" : "10px"}">${statCards}</div>
    </div>
    <div style="margin-bottom:${isMob ? "10px" : "14px"}">
      <div class="u-section-hdr">User Stats</div>
      ${userChips}
    </div>
    ${recentSection}`;
  }
  _tlBodyLdHistory() {
    const m = this._tautulliModal || {};
    const isMob = this._isMob;
    const data = m.libDetailHistData || [];
    const tot = m.libDetailHistTotal || 0;
    const page = m.libDetailHistPage || 0;
    const media = m.libDetailHistMedia;
    const playback = m.libDetailHistPlayback;
    const search = m.libDetailHistSearch || "";
    const hidden = this._tlHidden("libDetailHistHiddenCols", ["ip", "paused", "stopped"]);
    const mobHidden = this._tlHidden("libDetailHistMobHiddenCols", ["ip", "platform", "product", "player", "paused", "stopped"]);
    const perPage = this._tlCalcPerPage({ hasFilter: true });
    const totalPages = Math.max(1, Math.ceil(tot / perPage));
    if (m.libDetailHistLoading) return `<div class="is-loading"><span>${this._t("loading")}</span></div>`;
    const HIST_COLS = [
      { key: "date", label: "Date", sort: "date", right: false },
      { key: "user", label: "User", sort: "user", right: false },
      { key: "ip", label: "IP", sort: "ip_address", right: false },
      { key: "platform", label: "Platform", sort: "platform", right: false },
      { key: "product", label: "Product", sort: "product", right: false },
      { key: "player", label: "Player", sort: "player", right: false },
      { key: "title", label: "Title", sort: "title", right: false },
      { key: "duration", label: "Duration", sort: "duration", right: true },
      { key: "paused", label: "Paused", sort: "paused_counter", right: true },
      { key: "stopped", label: "Stopped", sort: "stopped", right: true }
    ];
    const MOB_PICKER = [
      { key: "ip", label: "IP" },
      { key: "platform", label: "Platform" },
      { key: "product", label: "Product" },
      { key: "player", label: "Player" },
      { key: "paused", label: "Paused" },
      { key: "stopped", label: "Stopped" }
    ];
    const vis = HIST_COLS.filter((c) => !hidden.has(c.key));
    const colsMenu = isMob ? this._tlColsMenu("tl-ld-hist-mob-cols-btn", "tl-ld-hist-mob-cols-menu", this._tlColItems(MOB_PICKER, mobHidden, "data-tl-ld-hist-mob-col"), m.libDetailHistMobColsOpen) : this._tlColsMenu("tl-ld-hist-cols-btn", "tl-ld-hist-cols-menu", this._tlColItems(HIST_COLS.filter((c) => c.key !== "title"), hidden, "data-tl-ld-hist-col"), m.libDetailHistColsOpen);
    const toolbar = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-shrink:0">${this._uiBar("tl-ld-hist-search", search || "", [
      {
        id: "tl-ld-hist-media",
        kind: "source",
        value: media || "",
        neutral: "",
        items: [["", this._t("tlAllMedia")], ["movie", this._t("tlFilterMovies")], ["episode", this._t("tlFilterTvShows")], ["track", this._t("tlFilterMusic")], ["live", this._t("tlFilterLiveTV")]]
      },
      {
        id: "tl-ld-hist-play",
        kind: "protocol",
        value: playback || "",
        neutral: "",
        items: [["", this._t("tlAllPlayback")], ["direct play", this._t("tlFilterDirectPlay")], ["copy", this._t("tlFilterDirectStream")], ["transcode", this._t("tlFilterTranscode")]]
      }
    ], [{ html: colsMenu }])}</div>`;
    const _expandedRow = (h, colCount2) => {
      const esc2 = (s) => this._escHtml(String(s ?? ""));
      const td = (s) => this._tlFmtDuration(s);
      const ws = h.watched_status ?? -1;
      return `<tr class="tl-ld-hist-detail-row"><td colspan="${colCount2}" style="padding:0 10px 10px">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:6px;font-size:11px;color:var(--is-text-muted);padding:10px;background:var(--is-row-hover);border-radius:6px">
          ${h.transcode_decision ? `<div><span style="color:var(--is-text)">Transcode:</span> ${esc2(h.transcode_decision)}</div>` : ""}
          ${h.quality_profile ? `<div><span style="color:var(--is-text)">Quality:</span> ${esc2(h.quality_profile)}</div>` : ""}
          ${h.video_full_resolution ? `<div><span style="color:var(--is-text)">Resolution:</span> ${esc2(h.video_full_resolution)}</div>` : ""}
          ${h.video_codec ? `<div><span style="color:var(--is-text)">Video:</span> ${esc2(h.video_codec)}</div>` : ""}
          ${h.audio_codec ? `<div><span style="color:var(--is-text)">Audio:</span> ${esc2(h.audio_codec)}</div>` : ""}
          ${h.ip_address ? `<div><span style="color:var(--is-text)">IP:</span> ${esc2(h.ip_address)}</div>` : ""}
        </div>
      </td></tr>`;
    };
    const esc = (s) => this._escHtml(String(s ?? ""));
    if (isMob) {
      const cards = data.map((h) => {
        const rid = h.reference_id || h.session_key || Math.random();
        const isExp = m.libDetailHistExpandedRow === rid;
        const icon = this._tlMediaIcon(h.media_type || "", 15);
        const title = esc(h.full_title || h.title || "\u2014");
        const dur = this._tlFmtDuration(h.duration || 0);
        const ws = h.watched_status ?? -1;
        const watchSvg = (s) => s === 1 ? `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="rgba(48,209,88,0.9)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` : s === 0 ? `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="rgba(250,180,50,0.9)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` : "";
        const meta = [];
        if (!mobHidden.has("platform") && h.platform) meta.push(`<span>${esc(h.platform)}</span>`);
        if (!mobHidden.has("player") && h.player) meta.push(`<span>${esc(h.player)}</span>`);
        if (!mobHidden.has("ip") && h.ip_address) meta.push(`<span style="font-family:monospace;font-size:10px">${esc(h.ip_address)}</span>`);
        const delEl = `<div style="margin-top:6px;display:flex;justify-content:flex-end">${this._mtRoundBtn(`data-tl-ld-hist-delete="${rid}"`, _TL_TRASH, this._t("tlDelete"), { size: 24, tone: "red" })}</div>`;
        const detail = isExp ? `<div style="margin-top:8px;font-size:11px;color:var(--is-text-muted);display:grid;grid-template-columns:1fr 1fr;gap:4px">
          ${h.transcode_decision ? `<div><span style="color:var(--is-text)">Transcode:</span> ${esc(h.transcode_decision)}</div>` : ""}
          ${h.quality_profile ? `<div><span style="color:var(--is-text)">Quality:</span> ${esc(h.quality_profile)}</div>` : ""}
          ${h.ip_address ? `<div><span style="color:var(--is-text)">IP:</span> ${esc(h.ip_address)}</div>` : ""}
        </div>` : "";
        return `<div class="tl-mob-card tl-ld-hist-row" data-tl-ld-hist-row="${rid}" style="cursor:pointer${isExp ? ";background:var(--is-row-hover)" : ""}">
          <div class="u-row-10">
            <div style="flex:1;min-width:0">
              <div class="tl-mob-name u-row-4">${icon}<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${title}</span></div>
              ${meta.length ? `<div class="tl-mob-meta">${meta.join("")}</div>` : ""}
            </div>
            <div style="text-align:right;flex-shrink:0"><div style="font-size:13px;font-weight:600;color:var(--is-text)">${dur}</div><div style="margin-top:2px;display:flex;justify-content:flex-end">${watchSvg(ws)}</div></div>
          </div>${detail}${delEl}</div>`;
      }).join("") || `<div class="u-empty">${this._t("tlNoHistory")}</div>`;
      return toolbar + `<div class="tl-ld-hist-results-wrap" style="display:contents"><div>${cards}</div>${this._tlMobPag("tl-ld-hpage", page, totalPages, true)}</div>`;
    }
    const watchCell = `<td style="padding:0 6px;text-align:center"></td>`;
    const delHdr = `<th style="width:32px"></th>`;
    const thead = vis.map((c) => `<th style="text-align:${c.right ? "right" : "left"}">${c.label}</th>`).join("") + watchCell;
    const colCount = vis.length + 2;
    const rows = data.map((h) => {
      const rid = h.reference_id || h.session_key || Math.random();
      const isExp = m.libDetailHistExpandedRow === rid;
      const icon = this._tlMediaIcon(h.media_type || "", 15);
      const esc2 = (s) => this._escHtml(String(s ?? ""));
      const ws = h.watched_status ?? -1;
      const watchSvg = (s) => s === 1 ? `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="rgba(48,209,88,0.9)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` : s === 0 ? `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="rgba(250,180,50,0.9)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` : "";
      const cm = {
        date: `<td class="u-nowrap-sm">${esc2(h.date || "\u2014")}</td>`,
        user: `<td style="white-space:nowrap">${esc2(h.friendly_name || h.user || "\u2014")}</td>`,
        ip: `<td style="font-family:monospace;font-size:11px">${esc2(h.ip_address || "\u2014")}</td>`,
        platform: `<td style="white-space:nowrap">${esc2(h.platform || "\u2014")}</td>`,
        product: `<td class="u-nowrap-sm">${esc2(h.product || "\u2014")}</td>`,
        player: `<td class="u-nowrap-sm">${esc2(h.player || "\u2014")}</td>`,
        title: `<td style="max-width:240px"><div style="display:flex;align-items:center;gap:5px;min-width:0">${icon}<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1" title="${esc2(h.full_title || h.title)}">${esc2(h.full_title || h.title)}</span></div></td>`,
        duration: `<td style="text-align:right;white-space:nowrap">${this._tlFmtDuration(h.duration || 0)}</td>`,
        paused: `<td style="text-align:right">${this._tlFmtDuration(h.paused_counter || 0)}</td>`,
        stopped: `<td style="text-align:right;white-space:nowrap">${esc2(h.stopped || "\u2014")}</td>`
      };
      const watchTd = `<td style="padding:0 6px;text-align:center">${watchSvg(ws)}</td>`;
      const delCell = `<td style="padding:0 4px">${this._mtRoundBtn(`data-tl-ld-hist-delete="${rid}"`, _TL_TRASH, this._t("tlDelete"), { size: 24, tone: "red" })}</td>`;
      const mainRow = `<tr class="tl-ld-hist-row" data-tl-ld-hist-row="${rid}" style="cursor:pointer${isExp ? ";background:var(--is-row-hover)" : ""}">${vis.map((c) => cm[c.key] || "<td>\u2014</td>").join("")}${watchTd}${delCell}</tr>`;
      return mainRow + (isExp ? _expandedRow(h, colCount) : "");
    }).join("");
    return toolbar + `<div class="tl-ld-hist-results-wrap" style="display:contents"><div style="overflow-x:auto;overflow-y:hidden"><table class="tl-users-table"><thead><tr>${thead}${delHdr}</tr></thead><tbody>${rows || `<tr><td colspan="${colCount}" class="u-empty">${this._t("tlNoHistory")}</td></tr>`}</tbody></table></div>${this._tlMobPag("tl-ld-hpage", page, totalPages, true)}</div>`;
  }
  _tlBodyLdMedia() {
    const m = this._tautulliModal || {};
    const isMob = this._isMob;
    const data = m.libDetailMediaData || [];
    const tot = m.libDetailMediaTotal || 0;
    const page = m.libDetailMediaPage || 0;
    const search = m.libDetailMediaSearch || "";
    const sort = m.libDetailMediaSort || "added_at";
    const dir = m.libDetailMediaDir || "desc";
    const perPage = 25;
    const totalPages = Math.max(1, Math.ceil(tot / perPage));
    const _sortTh = (key, label, right = false) => {
      const active = sort === key;
      const nextDir = active && dir === "asc" ? "desc" : "asc";
      const arrow = active ? dir === "asc" ? "\u2191" : "\u2193" : "";
      return `<th data-tl-ld-media-sort="${key}" data-tl-ld-media-dir="${nextDir}" style="text-align:${right ? "right" : "left"};cursor:pointer;white-space:nowrap;user-select:none">${label}${arrow ? ` <span style="color:rgba(250,180,50,0.9)">${arrow}</span>` : ""}</th>`;
    };
    const searchEl = this._tlSearchInput("tl-ld-media-search", search);
    const toolbar = `<div style="display:flex;gap:6px;align-items:center;margin-bottom:10px;flex-wrap:wrap">${searchEl}</div>`;
    if (isMob) {
      const cards = data.map((item) => {
        const rk = item.rating_key || "";
        const title = this._escHtml(item.title || "\u2014");
        const year = item.year ? `<span style="color:var(--is-text-muted)">${item.year}</span>` : "";
        const meta = [item.video_resolution, item.video_codec, item.audio_codec].filter(Boolean).map((v) => this._escHtml(v)).join(" \xB7 ");
        const mdAttr = rk ? ` data-tl-md-open="${rk}" data-tl-md-title="${title}" data-tl-md-prev="lib" style="cursor:pointer"` : "";
        return `<div class="tl-mob-card"${mdAttr}>
          <div class="tl-mob-name">${title} ${year}</div>
          ${meta ? `<div class="tl-mob-meta"><span>${meta}</span></div>` : ""}
        </div>`;
      }).join("") || `<div class="u-empty">No media data.</div>`;
      return toolbar + `<div class="tl-ld-media-results-wrap" style="display:contents"><div>${cards}</div>${this._tlMobPag("tl-ld-mpage", page, totalPages, true)}</div>`;
    }
    const thead = [
      _sortTh("added_at", "Added"),
      _sortTh("title", "Title"),
      _sortTh("container", "Format"),
      _sortTh("bitrate", "Bitrate", true),
      _sortTh("video_codec", "Video"),
      _sortTh("video_resolution", "Res"),
      _sortTh("video_framerate", "FPS"),
      _sortTh("audio_codec", "Audio"),
      _sortTh("audio_channels", "Ch", true),
      _sortTh("file_size", "Size", true),
      _sortTh("last_played", "Last Played"),
      _sortTh("play_count", "Plays", true)
    ].join("");
    const rows = data.map((item) => {
      const rk = item.rating_key || "";
      const esc = (s) => this._escHtml(String(s ?? ""));
      const mdAttr = rk ? ` data-tl-md-open="${rk}" data-tl-md-title="${esc(item.title || "")}" data-tl-md-prev="lib" style="cursor:pointer"` : "";
      const fmtSz = (b) => {
        if (!b) return "\u2014";
        const gb = b / 1073741824;
        return gb >= 1 ? gb.toFixed(1) + " GB" : (b / 1048576).toFixed(0) + " MB";
      };
      return `<tr${mdAttr}>
        <td class="u-nowrap-sm">${esc(item.added_at || "\u2014")}</td>
        <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(item.title || "\u2014")}${item.year ? ` <span style="color:var(--is-text-muted);font-size:10px">${item.year}</span>` : ""}</td>
        <td>${esc(item.container || "\u2014")}</td>
        <td style="text-align:right;white-space:nowrap">${item.bitrate ? esc(item.bitrate) + " kbps" : "\u2014"}</td>
        <td>${esc(item.video_codec || "\u2014")}</td>
        <td>${esc(item.video_resolution || "\u2014")}</td>
        <td>${esc(item.video_framerate || "\u2014")}</td>
        <td>${esc(item.audio_codec || "\u2014")}</td>
        <td style="text-align:right">${item.audio_channels ? esc(item.audio_channels) + " ch" : "\u2014"}</td>
        <td style="text-align:right;white-space:nowrap">${fmtSz(item.file_size)}</td>
        <td class="u-nowrap-sm">${esc(item.last_played || "\u2014")}</td>
        <td style="text-align:right;font-weight:700;color:rgba(250,180,50,0.9)">${item.play_count ?? 0}</td>
      </tr>`;
    }).join("");
    return toolbar + `<div class="tl-ld-media-results-wrap" style="display:contents"><div style="overflow-x:auto;overflow-y:hidden"><table class="tl-users-table"><thead><tr>${thead}</tr></thead><tbody>${rows || `<tr><td colspan="12" class="u-empty">No media data.</td></tr>`}</tbody></table></div>${this._tlMobPag("tl-ld-mpage", page, totalPages, true)}</div>`;
  }
  // ══════════════════════════════════════════════════════════════════════════
  // Media item detail
  // ══════════════════════════════════════════════════════════════════════════
  _tlBodyMediaDetail() {
    const m = this._tautulliModal || {};
    const tab = m.mediaDetailTab || "info";
    const isMob = this._isMob;
    const backAttr = m.mediaDetailPrev === "lib" ? "data-tl-md-back-lib" : "data-tl-md-back-user";
    const backBtn = `<button ${backAttr} style="display:none"></button>`;
    const tabs = [["info", "Info"], ["history", "History"]];
    const tabBtns = `<span class="mt-nav mt-nav--inline"><span class="mt-nav-ind"></span>${tabs.map(([k, l]) => `<button class="mt-nav-btn${tab === k ? " is-on" : ""}" data-tl-md-tab="${k}">${l}</button>`).join("")}</span>`;
    const title = this._escHtml(m.mediaDetailTitle || "\u2014");
    const hdr = isMob ? `<div style="margin-bottom:12px">
           ${backBtn}
           <div style="font-size:15px;font-weight:700;color:var(--is-text);margin-bottom:10px">${title}</div>
           ${tabBtns}
         </div>` : `<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
           ${backBtn}
           <div style="font-size:15px;font-weight:700;color:var(--is-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0">${title}</div>
           ${tabBtns}
         </div>`;
    let content = "";
    if (tab === "info") content = this._tlBodyMdInfo();
    else content = this._tlBodyMdHistory();
    return hdr + content;
  }
  _tlBodyMdInfo() {
    const m = this._tautulliModal || {};
    const data = m.mediaDetailData;
    const isMob = this._isMob;
    if (!data) return `<div class="is-loading"><span>${this._t("loading")}</span></div>`;
    const meta = data.metadata || {};
    const wts = data.watchTimeStats || [];
    const us = data.userStats || [];
    const esc = (s) => this._escHtml(String(s ?? ""));
    const thumbPath = meta.thumb || meta.grandparent_thumb || "";
    const W = isMob ? 80 : 110;
    const H = Math.round(W * 1.5);
    const posterEl = thumbPath ? `<img data-tl-plex-path="${esc(thumbPath)}" alt="" style="width:${W}px;height:${H}px;object-fit:cover;border-radius:8px;flex-shrink:0;display:block" onerror="this.style.display='none'">` : `<div style="width:${W}px;height:${H}px;background:var(--is-row-hover);border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center">${this._tlMediaIcon(meta.media_type || "", 24)}</div>`;
    const metaRows = [];
    if (meta.studio) metaRows.push(`<span style="color:var(--is-text-muted)">Studio:</span> ${esc(meta.studio)}`);
    if (meta.year) metaRows.push(`<span style="color:var(--is-text-muted)">Year:</span> ${esc(meta.year)}`);
    if (meta.rating) metaRows.push(`<span style="color:var(--is-text-muted)">Rating:</span> ${esc(meta.rating)}`);
    if (meta.content_rating) metaRows.push(`<span style="color:var(--is-text-muted)">Rated:</span> ${esc(meta.content_rating)}`);
    if (meta.duration) metaRows.push(`<span style="color:var(--is-text-muted)">Runtime:</span> ${this._tlFmtDuration(meta.duration)}`);
    if (meta.originally_available_at) metaRows.push(`<span style="color:var(--is-text-muted)">Aired:</span> ${esc(meta.originally_available_at)}`);
    if (meta.directors?.length) metaRows.push(`<span style="color:var(--is-text-muted)">Director:</span> ${meta.directors.map((d) => esc(d.tag || d)).join(", ")}`);
    if (meta.genres?.length) metaRows.push(`<span style="color:var(--is-text-muted)">Genres:</span> ${meta.genres.map((g) => esc(g.tag || g)).join(", ")}`);
    const fullTitle = esc(meta.full_title || meta.title || m.mediaDetailTitle || "\u2014");
    const subtitle = meta.parent_title ? `${esc(meta.parent_title)}${meta.media_index ? " \xB7 E" + meta.media_index : ""}` : "";
    const summary = meta.summary ? `<div style="font-size:11px;color:var(--is-text-muted);margin-top:8px;line-height:1.5;max-height:60px;overflow:hidden">${esc(meta.summary)}</div>` : "";
    const metaHdr = `<div style="display:flex;gap:12px;margin-bottom:${isMob ? "12px" : "16px"}">
      ${posterEl}
      <div style="flex:1;min-width:0">
        <div style="font-size:${isMob ? "13px" : "15px"};font-weight:700;color:var(--is-text)">${fullTitle}</div>
        ${subtitle ? `<div style="font-size:11px;color:var(--is-text-muted);margin-top:2px">${subtitle}</div>` : ""}
        ${summary}
        <div style="font-size:11px;color:var(--is-text);margin-top:8px;display:flex;flex-direction:column;gap:3px">${metaRows.map((r) => `<div>${r}</div>`).join("")}</div>
      </div>
    </div>`;
    const periodLabel = (d) => d === 1 ? "Last 24h" : d === 7 ? "Last 7 days" : d === 30 ? "Last 30 days" : "All Time";
    const statMap = {};
    wts.forEach((s) => {
      statMap[Number(s.query_days)] = s;
    });
    const statCards = [1, 7, 30, 0].map((d) => {
      const s = statMap[d] || {};
      const plays = s.total_plays ?? 0;
      const dur = s.total_time ? this._tlFmtDuration(s.total_time) : "0m";
      return `<div style="background:var(--is-row-hover);border-radius:8px;padding:${isMob ? "6px" : "8px 6px"};text-align:center;display:flex;flex-direction:column;gap:2px">
        <div style="font-size:${isMob ? "9px" : "10px"};font-weight:700;color:var(--is-text);text-transform:uppercase;letter-spacing:0.3px">${periodLabel(d)}</div>
        <div style="font-size:${isMob ? "16px" : "20px"};font-weight:800;color:rgba(250,180,50,0.95);line-height:1">${plays} <span style="font-size:8px;font-weight:600;color:var(--is-text-muted);text-transform:uppercase">plays</span></div>
        <div style="font-size:${isMob ? "10px" : "11px"};font-weight:600;color:var(--is-text)">${dur}</div>
      </div>`;
    }).join("");
    const userChips = us.length ? `<div style="display:flex;flex-wrap:wrap;gap:${isMob ? "8px" : "10px"}">` + us.map((u) => {
      const uname = esc(u.friendly_name || u.user || "\u2014");
      const plays = u.total_plays ?? 0;
      const dur = u.total_time ? this._tlFmtDuration(u.total_time) : "0m";
      const av = u.user_thumb ? `<img src="${esc(u.user_thumb)}" style="width:28px;height:28px;border-radius:50%;object-fit:cover" onerror="this.style.display='none'">` : `<div style="width:28px;height:28px;border-radius:50%;background:var(--is-row-hover);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--is-text)">${(uname[0] || "?").toUpperCase()}</div>`;
      return `<div style="display:flex;align-items:center;gap:8px;background:var(--is-row-hover);border-radius:10px;padding:6px 10px">
            ${av}
            <div>
              <div style="font-size:11px;font-weight:600;color:var(--is-text)">${uname}</div>
              <div class="u-xs-muted">${plays} plays \xB7 ${dur}</div>
            </div>
          </div>`;
    }).join("") + "</div>" : `<div style="color:var(--is-text-muted);font-size:12px;padding:4px 0">No user data.</div>`;
    return metaHdr + `<div style="margin-bottom:${isMob ? "10px" : "14px"}">
           <div class="u-section-hdr">Global Watch Stats</div>
           <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:${isMob ? "6px" : "10px"}">${statCards}</div>
         </div>
         <div>
           <div class="u-section-hdr">User Stats</div>
           ${userChips}
         </div>`;
  }
  _tlBodyMdHistory() {
    const m = this._tautulliModal || {};
    const isMob = this._isMob;
    const data = m.mediaDetailHistData || [];
    const tot = m.mediaDetailHistTotal || 0;
    const page = m.mediaDetailHistPage || 0;
    const perPage = this._tlCalcPerPage({ hasFilter: false });
    const totalPages = Math.max(1, Math.ceil(tot / perPage));
    const esc = (s) => this._escHtml(String(s ?? ""));
    if (isMob) {
      const cards = data.map((h) => {
        const title = esc(h.full_title || h.title || "\u2014");
        const user = esc(h.friendly_name || h.user || "\u2014");
        const dur = this._tlFmtDuration(h.duration || 0);
        return `<div class="tl-mob-card">
          <div class="u-row-10">
            <div style="flex:1;min-width:0">
              <div class="tl-mob-name">${user}</div>
              <div class="tl-mob-meta"><span>${esc(h.date || "")}</span>${h.platform ? `<span>${esc(h.platform)}</span>` : ""}</div>
            </div>
            <div style="font-size:13px;font-weight:600;color:var(--is-text)">${dur}</div>
          </div>
        </div>`;
      }).join("") || `<div class="u-empty">${this._t("tlNoHistory")}</div>`;
      return `<div>${cards}</div>` + this._tlMobPag("tl-md-hpage", page, totalPages, true);
    }
    const thead = `<th>Date</th><th>User</th><th>Platform</th><th>Player</th><th style="text-align:right">Duration</th><th style="text-align:right">Paused</th>`;
    const rows = data.map((h) => `<tr>
      <td class="u-nowrap-sm">${esc(h.date || "\u2014")}</td>
      <td>${esc(h.friendly_name || h.user || "\u2014")}</td>
      <td style="white-space:nowrap">${esc(h.platform || "\u2014")}</td>
      <td class="u-nowrap-sm">${esc(h.player || "\u2014")}</td>
      <td style="text-align:right;white-space:nowrap">${this._tlFmtDuration(h.duration || 0)}</td>
      <td style="text-align:right">${this._tlFmtDuration(h.paused_counter || 0)}</td>
    </tr>`).join("");
    return `<div style="overflow-x:auto;overflow-y:hidden"><table class="tl-users-table"><thead><tr>${thead}</tr></thead><tbody>${rows || `<tr><td colspan="6" class="u-empty">${this._t("tlNoHistory")}</td></tr>`}</tbody></table></div>` + this._tlMobPag("tl-md-hpage", page, totalPages, true);
  }
};
var tautulliTableMixin = _TautulliTableMethods.prototype;


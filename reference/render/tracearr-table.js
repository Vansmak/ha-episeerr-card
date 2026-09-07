
var _sevTone = (sev) => ({ critical: "red", high: "red", warning: "amber", medium: "amber", low: "green" })[String(sev || "").toLowerCase()] || "amber";
function _traSegHtml(items, cur, attr, extra = "") {
  return `<span class="mt-nav mt-nav--inline"${extra ? ` style="${extra}"` : ""}><span class="mt-nav-ind"></span>${items.map(([v, l]) => `<button class="mt-nav-btn${String(v) === String(cur) ? " is-on" : ""}" ${attr}="${v}">${l}</button>`).join("")}</span>`;
}
var _traSortTh = (col, label, sortCol, sortDir) => `<th style="cursor:pointer;user-select:none" data-tra-users-sort="${col}"><span style="white-space:nowrap">${label} <span style="opacity:${col === sortCol ? 1 : 0.3};font-size:9px">${col === sortCol ? sortDir === "asc" ? "\u2191" : "\u2193" : "\u2195"}</span></span></th>`;
var _TraceaRrTableMethods = class {
  // ──────────────────────────────────────────────────────────────────────────
  // Overview tab
  // ──────────────────────────────────────────────────────────────────────────
  _traBodyOverview() {
    const m = this._tracearrModal;
    const st = m.overviewStats || {};
    const hlth = m.overviewHealth || {};
    const viols = m.overviewViols || [];
    const act = m.overviewAct || {};
    const plays7 = (act.plays || []).slice(-7);
    const total7 = plays7.reduce((s, p) => s + (p.count || 0), 0);
    const isMob = this._isMob;
    const tile = (lbl, val, sub, color) => `<div style="background:var(--is-row-hover);border-radius:10px;padding:${isMob ? "10px 11px" : "12px 13px"}">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--is-text-label);margin-bottom:6px">${lbl}</div>
        <div style="font-size:${isMob ? "20px" : "24px"};font-weight:800;line-height:1;color:${color}">${val}</div>
        ${sub ? `<div style="font-size:10px;color:var(--is-text-muted);margin-top:4px">${sub}</div>` : ""}
      </div>`;
    const tiles = `<div style="display:grid;grid-template-columns:repeat(${isMob ? 2 : 4},1fr);gap:${isMob ? "8px" : "10px"};margin-bottom:${isMob ? "14px" : "16px"}">
      ${tile(this._t("traStreamsNow"), st.activeStreams ?? 0, null, "#34C759")}
      ${tile(this._t("traUsers"), st.totalUsers ?? 0, st.totalSessions ? st.totalSessions + " " + this._t("tlPlays") : null, "#BF5AF2")}
      ${tile(this._t("traViolations"), st.recentViolations ?? 0, this._t("traThisMonth"), st.recentViolations > 0 ? "#FF3B30" : "#34C759")}
      ${tile(this._t("traActivity7d"), total7, null, "#007AFF")}
    </div>`;
    const srvs = (hlth.servers || []).map((s) => {
      const ic = { plex: { bg: "#e5a00d", c: "#000", l: "P" }, jellyfin: { bg: "#7c4dff", c: "#fff", l: "J" }, emby: { bg: "#52b54b", c: "#fff", l: "E" } }[s.type] || { bg: "rgba(255,255,255,0.15)", c: "#fff", l: "?" };
      const dot = s.online ? "#34d399" : "#f87171";
      const streams = s.activeStreams > 0 ? this._uiBadge(`${s.activeStreams} live`, "green") : "";
      return `<div style="display:flex;align-items:center;gap:8px;padding:9px 0;border-top:1px solid var(--is-divider)">
        <span style="width:22px;height:22px;border-radius:6px;background:${ic.bg};color:${ic.c};display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0">${ic.l}</span>
        <span style="font-size:13px;font-weight:600;color:var(--is-text);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name}</span>
        ${streams}
        <span style="width:8px;height:8px;border-radius:50%;background:${dot};box-shadow:0 0 7px ${dot};flex-shrink:0"></span>
      </div>`;
    }).join("");
    const vioRows = viols.slice(0, 5).map((v) => {
      const color = this._traSevColor(v.severity);
      const bg = this._traSevBg(v.severity);
      const type = this._traViolTypeLabel(v.type);
      const user = v.user?.displayName || v.username || "";
      const when = this._traFmtDate(v.createdAt || v.detectedAt);
      return `<div style="display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-top:1px solid var(--is-divider)">
        ${this._uiBadge((v.severity || "").toUpperCase(), _sevTone(v.severity), { extra: "flex-shrink:0;margin-top:1px" })}
        <div style="flex:1;min-width:0">
          <div class="u-sm-text">${type}</div>
          <div style="font-size:10px;color:var(--is-text-muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${[user, when].filter(Boolean).join(" \xB7 ")}</div>
        </div>
      </div>`;
    }).join("") || `<div style="font-size:12px;color:#34C759;padding:12px 0;display:flex;align-items:center;gap:8px">
        <span style="width:8px;height:8px;border-radius:50%;background:#34d399;flex-shrink:0"></span>${this._t("traNoViolations")}
      </div>`;
    const sectionLabel = (lbl) => `<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--is-text-label);margin-bottom:2px">${lbl}</div>`;
    const srvBlock = `<div style="background:var(--is-row-hover);border-radius:10px;padding:${isMob ? "12px 14px" : "14px 16px"}">${sectionLabel(this._t("traServers"))}${srvs || `<div style="font-size:12px;color:var(--is-text-muted);padding:8px 0">${this._t("tlNoData")}</div>`}</div>`;
    const vioBlock = `<div style="background:var(--is-row-hover);border-radius:10px;padding:${isMob ? "12px 14px" : "14px 16px"}">${sectionLabel(this._t("traRecentViolations"))}${vioRows}</div>`;
    const cols = isMob ? `<div style="display:flex;flex-direction:column;gap:10px">${srvBlock}${vioBlock}</div>` : `<div style="display:grid;grid-template-columns:1fr 1.4fr;gap:14px">${srvBlock}${vioBlock}</div>`;
    return tiles + cols;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Rules tab
  // ──────────────────────────────────────────────────────────────────────────
  _traBodyRules() {
    const m = this._tracearrModal;
    const rules = m.rulesData || [];
    const isMob = this._isMob;
    const _day = this._isDay;
    const _btnClr = _day ? "#000" : "#fff";
    const CLASSIC_LABELS = {
      concurrent_streams: "Concurrent Streams",
      geo_restriction: "Geo Restriction",
      impossible_travel: "Impossible Travel",
      simultaneous_locations: "Simultaneous Locations",
      device_velocity: "Device Velocity",
      account_inactivity: "Account Inactivity"
    };
    const _sc = (s) => ({ high: "#FF3B30", warning: "#FF9500", low: "#34C759" })[s] || "#FF9500";
    const _sb = (s) => ({ high: "rgba(255,59,48,0.16)", warning: "rgba(255,149,0,0.14)", low: "rgba(52,199,89,0.14)" })[s] || "rgba(255,149,0,0.14)";
    const rows = rules.map((r) => {
      const typeLabel = r.type ? CLASSIC_LABELS[r.type] || r.type : "Custom";
      const sev = (r.severity || "warning").toLowerCase();
      const toggle = this._uiSwitch(`data-tra-rule-toggle="${r.id}" data-active="${r.isActive}"`, r.isActive, r.isActive ? "Disable" : "Enable");
      const TRASH = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
      const CHECK = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="20 6 9 17 4 12"/></svg>`;
      const CROSS = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
      const delBtn = m.traRuleDelId === r.id ? `<span style="display:flex;gap:4px;flex-shrink:0">
             ${this._mtRoundBtn(`data-tra-rule-del-yes="${r.id}"`, CHECK, "Delete", { size: 26, tone: "red" })}
             ${this._mtRoundBtn("data-tra-rule-del-no", CROSS, "Cancel", { size: 26, tone: "blue" })}
           </span>` : this._mtRoundBtn(`data-tra-rule-del="${r.id}"`, TRASH, "Delete", { size: 26, tone: "red" });
      const desc = r.description ? `<div style="font-size:10px;color:var(--is-text-muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.description}</div>` : "";
      const classicBadge = this._uiBadge(this._escHtml(typeLabel), "neutral", { extra: "flex-shrink:0" });
      return `<div style="display:flex;align-items:center;gap:${isMob ? "7px" : "10px"};padding:9px 0;border-top:1px solid var(--is-divider)">
        ${toggle}
        <div data-tra-rule-edit="${r.id}" style="flex:1;min-width:0;cursor:pointer">
          <div style="font-size:12px;font-weight:600;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.name}</div>
          ${desc}
        </div>
        ${this._uiBadge(sev.toUpperCase(), _sevTone(sev), { extra: "flex-shrink:0" })}
        ${isMob ? "" : classicBadge}
        ${delBtn}
      </div>`;
    }).join("") || `<div style="font-size:12px;color:var(--is-text-muted);padding:28px 0;text-align:center">No rules configured</div>`;
    const menuSt = `position:absolute;top:32px;right:0;background:#1c1c2e;border:1px solid rgba(255,255,255,0.14);border-radius:8px;padding:4px;min-width:140px;z-index:200`;
    const menuItemSt = `display:block;width:100%;text-align:left;padding:6px 10px;font-size:12px;font-weight:500;color:#fff;background:transparent;border:none;cursor:pointer;border-radius:5px`;
    const addMenu = `<div style="position:relative;display:inline-block" id="tra-rules-add-wrap">
      <div id="tra-rules-add-menu" style="${menuSt};display:none">
        <button data-tra-rule-new="classic" style="${menuItemSt}">Classic Rule</button>
        <button data-tra-rule-new="custom" style="${menuItemSt}">Custom Rule</button>
      </div>
    </div>`;
    return `<div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:12px;font-weight:700;color:var(--is-text-label);text-transform:uppercase;letter-spacing:.06em">${rules.length} Rule${rules.length !== 1 ? "s" : ""}</span>
        ${isMob ? "" : addMenu}
      </div>
      <div id="tra-rules-list">${rows}</div>
    </div>`;
  }
  _traRuleTemplatePicker() {
    const isMob = this._isMob;
    const TEMPLATES = [
      {
        id: "concurrent_streams",
        name: "Concurrent Streams",
        desc: "Limit simultaneous streams per user",
        icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'
      },
      {
        id: "geo_restriction",
        name: "Geo Restriction",
        desc: "Block streaming from specific countries",
        icon: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'
      },
      {
        id: "impossible_travel",
        name: "Impossible Travel",
        desc: "Detect physically impossible travel between sessions",
        icon: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'
      },
      {
        id: "simultaneous_locations",
        name: "Simultaneous Locations",
        desc: "Detect concurrent sessions from distant locations",
        icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
      },
      {
        id: "device_velocity",
        name: "Device Velocity",
        desc: "Detect excessive unique IPs in a time window",
        icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'
      },
      {
        id: "account_inactivity",
        name: "Account Inactivity",
        desc: "Detect inactive accounts",
        icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'
      }
    ];
    const btnSt = `display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:12px 14px;margin-bottom:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:8px;cursor:pointer;color:var(--is-text,#fff);transition:background .12s`;
    const rows = TEMPLATES.map(
      (t) => `<button data-tra-rule-template="${t.id}" style="${btnSt}">
        <span style="width:32px;height:32px;border-radius:8px;background:rgba(0,122,255,0.1);border:1px solid rgba(0,122,255,0.2);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="rgba(0,122,255,0.8)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${t.icon}</svg></span>
        <div style="min-width:0">
          <div style="font-size:13px;font-weight:600;margin-bottom:2px">${t.name}</div>
          <div style="font-size:11px;color:var(--is-text-muted)">${t.desc}</div>
        </div>
      </button>`
    ).join("");
    return `<div style="max-width:480px;margin:0 auto">
      <div style="font-size:14px;font-weight:700;color:var(--is-text);margin-bottom:4px">Choose a Rule Template</div>
      <div style="font-size:11px;color:var(--is-text-muted);margin-bottom:14px">Select a pre-configured rule type to get started quickly.</div>
      ${rows}
      <!-- Going back is the header's close button while a rule is being made,
           so the picker needs no button of its own \u2014 this is only the hook. -->
      <button id="tra-rf-cancel" style="display:none"></button>
    </div>`;
  }
  _traRuleFormHtml(ruleType, existingRule, templateType) {
    const isMob = this._isMob;
    const inputSt = `width:100%`;
    const selectSt = inputSt;
    const labelSt = `display:block;font-size:10px;font-weight:700;color:var(--is-text-label);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px`;
    const isEdit = !!existingRule;
    const isCustom = existingRule ? !existingRule.type : ruleType === "custom";
    const ruleId = existingRule?.id || "";
    const showConditions = true;
    const CLASSIC_TYPES = [
      ["concurrent_streams", "Concurrent Streams"],
      ["geo_restriction", "Geo Restriction"],
      ["impossible_travel", "Impossible Travel"],
      ["simultaneous_locations", "Simultaneous Locations"],
      ["device_velocity", "Device Velocity"],
      ["account_inactivity", "Account Inactivity"]
    ];
    const TEMPLATE_DEFAULTS = {
      concurrent_streams: { name: "Concurrent Stream Limit", desc: "Limit simultaneous streams per user" },
      geo_restriction: { name: "Country Block List", desc: "Block streaming from specific countries" },
      impossible_travel: { name: "Impossible Travel Detection", desc: "Detect physically impossible travel between sessions" },
      simultaneous_locations: { name: "Simultaneous Locations", desc: "Detect concurrent sessions from distant locations" },
      device_velocity: { name: "Device Velocity Check", desc: "Detect excessive unique IPs in a time window" },
      account_inactivity: { name: "Account Inactivity Monitor", desc: "Detect inactive accounts" }
    };
    const FIELDS = [
      ["concurrent_streams", "Concurrent Streams"],
      ["travel_speed_kmh", "Travel Speed (km/h)"],
      ["active_session_distance", "Active Session Distance (km)"],
      ["unique_ips_window", "Unique IPs in Window"],
      ["unique_devices_window", "Unique Devices in Window"],
      ["inactive_days", "Inactive Days"],
      ["current_pause_duration", "Current Pause Duration (min)"],
      ["total_pause_duration", "Total Pause Duration (min)"]
    ];
    const FIELDS_WITH_UNIQUE = /* @__PURE__ */ new Set(["concurrent_streams", "travel_speed_kmh", "active_session_distance", "unique_ips_window", "unique_devices_window"]);
    const OPS = [
      ["gt", "greater than"],
      ["gte", "at least"],
      ["lt", "less than"],
      ["lte", "at most"],
      ["eq", "equals"],
      ["neq", "not equals"]
    ];
    const ACTIONS = [
      ["log_only", "Log Only"],
      ["send_notification", "Send Notification"],
      ["kill_stream", "Kill Stream"],
      ["adjust_trust_score", "Adjust Trust Score"],
      ["set_trust_score", "Set Trust Score"],
      ["reset_trust_score", "Reset Trust Score"],
      ["message_client", "Message Client"]
    ];
    const ACTION_MSG_LABEL = {
      log_only: "Log Message",
      send_notification: "Message",
      kill_stream: "Kill Message",
      message_client: "Message"
    };
    const ACTION_DESC = {
      log_only: "Log the event without taking action",
      send_notification: "Send a push notification",
      kill_stream: "Terminate the active stream",
      adjust_trust_score: "Add or subtract from trust score",
      set_trust_score: "Set trust score to a specific value",
      reset_trust_score: "Reset trust score to default",
      message_client: "Send a message to the streaming client"
    };
    const TEMPLATE_CONDITIONS = {
      concurrent_streams: [{ conditions: [{ field: "concurrent_streams", operator: "gt", value: 3, params: { uniqueDevices: true, uniqueIPs: false } }] }],
      impossible_travel: [{ conditions: [{ field: "travel_speed_kmh", operator: "gt", value: 500, params: { uniqueDevices: true, uniqueIPs: false } }] }],
      simultaneous_locations: [{ conditions: [{ field: "active_session_distance", operator: "gt", value: 100, params: { uniqueDevices: true, uniqueIPs: false } }] }],
      device_velocity: [{ conditions: [{ field: "unique_ips_window", operator: "gt", value: 3 }] }],
      account_inactivity: [{ conditions: [{ field: "inactive_days", operator: "gt", value: 30 }] }]
    };
    const tplDef = TEMPLATE_DEFAULTS[templateType] || {};
    const curType = existingRule?.type || templateType || CLASSIC_TYPES[0][0];
    const curName = existingRule?.name || tplDef.name || "";
    const curDesc = existingRule?.description || tplDef.desc || "";
    const curSev = existingRule?.severity || "warning";
    const curActive = existingRule ? existingRule.isActive !== false : true;
    const _opt = (arr, cur) => arr.map(([v, l]) => `<option value="${v}"${v === cur ? " selected" : ""}>${l}</option>`).join("");
    const activeToggle = this._uiSwitch('id="tra-rf-active-toggle" data-active="' + curActive + '"', curActive, curActive ? "Disable" : "Enable");
    const classicTypeField = "";
    const classicParams = "";
    const condRow = (gi, ci, cond) => {
      const field = cond?.field || "concurrent_streams";
      const fSel = FIELDS.map(([v, l]) => `<option value="${v}"${v === field ? " selected" : ""}>${l}</option>`).join("");
      const oSel = OPS.map(([v, l]) => `<option value="${v}"${v === (cond?.operator || "gt") ? " selected" : ""}>${l}</option>`).join("");
      const val = cond?.value ?? 2;
      const hasUniq = FIELDS_WITH_UNIQUE.has(field);
      const uDev = cond?.params?.uniqueDevices ?? field === "concurrent_streams";
      const uIP = cond?.params?.uniqueIPs ?? false;
      const _c = (cls, on, lbl) => `<label class="mt-chk">
        <input type="checkbox" class="${cls}"${on ? " checked" : ""}>
        <span class="mt-chk-box">${_ICO_CHECK}</span>
        <span class="mt-chk-lbl">${lbl}</span>
      </label>`;
      const uniqHtml = hasUniq ? _c("tra-cond-uniq-dev", uDev, "Unique devices") + _c("tra-cond-uniq-ip", uIP, "Unique IPs") : "";
      const trashSvg = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
      return `<div class="tra-cr" data-grp="${gi}" data-row="${ci}" style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px;align-items:center">
        ${this._mtFieldSelectRaw('class="tra-cond-field"', fSel, FIELDS.find(([v]) => v === field)?.[1] || "", "flex:2;min-width:130px")}
        ${this._mtFieldSelectRaw('class="tra-cond-op"', oSel, OPS.find(([v]) => v === (cond?.operator || "gt"))?.[1] || "", "flex:1.2;min-width:100px")}
        <input class="tra-cond-val mt-field" type="number" value="${val}" style="width:76px;flex-shrink:0">
        ${uniqHtml}
        ${this._mtRoundBtn('class="tra-cond-del"', trashSvg, "Delete", { size: 26, tone: "red" })}
      </div>`;
    };
    const condGroup = (gi, grp) => {
      const conds = grp?.conditions?.length ? grp.conditions : [null];
      const rows = conds.map((c, ci) => {
        const html = condRow(gi, ci, c);
        return ci === 0 ? html : `<div class="tra-or-label" style="font-size:10px;font-weight:700;color:rgba(0,122,255,0.8);margin:2px 0 6px">OR</div>${html}`;
      }).join("");
      return `<div class="tra-cg" data-grp="${gi}" style="background:rgba(255,255,255,0.03);border:1px solid var(--is-card-bdr,rgba(255,255,255,0.09));border-radius:16px;padding:12px 14px;margin-bottom:8px">
        <div style="font-size:11px;font-weight:600;color:var(--is-text-label);margin-bottom:10px">Group ${gi + 1} <span style="font-weight:400;font-size:10px;opacity:0.6">(conditions match with OR logic)</span></div>
        <div class="tra-cg-rows">${rows}</div>
        <button class="tra-add-or" data-grp="${gi}" style="font-size:11px;color:rgba(0,122,255,0.8);background:transparent;border:none;cursor:pointer;padding:2px 0;margin-top:2px">+ Add <strong>OR</strong> condition</button>
      </div>`;
    };
    const existGroups = existingRule?.conditions?.groups || !isEdit && templateType && TEMPLATE_CONDITIONS[templateType] || [];
    const condGroupsHtml = (existGroups.length ? existGroups : [null]).map((g, i) => condGroup(i, g)).join("");
    const actionRow = (idx, act) => {
      const aType = act?.type || (idx === 0 ? "log_only" : "log_only");
      const msgLbl = ACTION_MSG_LABEL[aType];
      const msgVal = act?.message || act?.logMessage || "";
      const descTxt = ACTION_DESC[aType] || "";
      const msgInput = msgLbl ? `<label style="display:flex;align-items:center;gap:6px;flex-basis:100%;min-width:0;font-size:11px;color:var(--is-text-muted);white-space:nowrap;margin-top:6px">
             ${msgLbl}:
             <input class="tra-act-msg mt-field" type="text" value="${msgVal.replace(/"/g, "&quot;")}" placeholder="Optional message"
               style="flex:1;min-width:0">
           </label>` : "";
      const trashSvg = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
      return `<div class="tra-act-row" data-idx="${idx}" style="background:rgba(255,255,255,0.03);border:1px solid var(--is-card-bdr,rgba(255,255,255,0.09));border-radius:14px;padding:10px 12px;margin-bottom:6px">
        <div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center">
          ${this._mtFieldSelectRaw('class="tra-act-type"', _opt(ACTIONS, aType), ACTIONS.find(([v]) => v === aType)?.[1] || "", "flex:1;min-width:0")}
          ${this._mtRoundBtn('class="tra-act-del"', trashSvg, "Delete", { size: 26, tone: "red" })}
          ${msgInput}
        </div>
        ${descTxt ? `<div class="tra-act-desc" style="font-size:10px;color:var(--is-text-muted);margin-top:6px">${descTxt}</div>` : ""}
      </div>`;
    };
    const existActions = existingRule?.actions?.actions || [];
    const actionsHtml = (existActions.length ? existActions : [null]).map((a, i) => actionRow(i, a)).join("");
    const condCard = showConditions ? `
      <div style="background:rgba(255,255,255,0.03);border:1px solid var(--is-card-bdr,rgba(255,255,255,0.09));border-radius:20px;padding:16px;margin-bottom:12px">
        <div style="font-size:13px;font-weight:700;color:var(--is-text);margin-bottom:2px">Conditions</div>
        ${isMob ? "" : `<div style="font-size:11px;color:var(--is-text-muted);margin-bottom:12px">Define when this rule should trigger. Groups are combined with <strong>AND</strong> logic.</div>`}
        <div id="tra-rf-conds">${condGroupsHtml}</div>
        <button id="tra-add-and-group" style="font-size:11px;color:rgba(0,122,255,0.8);background:transparent;border:none;cursor:pointer;padding:2px 0">+ Add <strong>AND</strong> condition group</button>
      </div>` : "";
    const actCard = showConditions ? `
      <div style="background:rgba(255,255,255,0.03);border:1px solid var(--is-card-bdr,rgba(255,255,255,0.09));border-radius:20px;padding:16px;margin-bottom:12px">
        <div style="font-size:13px;font-weight:700;color:var(--is-text);margin-bottom:2px">Additional Actions</div>
        ${isMob ? "" : `<div style="font-size:11px;color:var(--is-text-muted);margin-bottom:12px">Optional side-effects when conditions are met. A violation is always created automatically.</div>`}
        <div id="tra-rf-actions">${actionsHtml}</div>
        <button id="tra-add-action" style="font-size:11px;color:rgba(0,122,255,0.8);background:transparent;border:none;cursor:pointer;padding:2px 0">+ Add action</button>
      </div>` : "";
    const title = isEdit ? "Edit Rule" : `New ${isCustom ? "Custom" : "Classic"} Rule`;
    const saveLabel = isEdit ? "Update" : "Create";
    const _day = this._isDay;
    const _btnClr = _day ? "#000" : "#fff";
    return `<div ${ruleId ? `data-rule-id="${ruleId}"` : ""}>
      <!-- Flipped to 1 by the first edit; the header's save reads it to decide
           whether there is anything worth writing. -->
      <span id="tra-rf-dirty" data-tra-dirty="0" style="display:none"></span>
      ${classicTypeField}
      <!-- Three columns need width a phone has not got: there the fields take a
           line each and severity with the toggle follow underneath. -->
      <div style="display:grid;grid-template-columns:${isMob ? "1fr" : "1fr 1fr auto"};gap:10px;align-items:end;margin-bottom:12px">
        <div>
          <label style="${labelSt}">Rule Name *</label>
          <input id="tra-rf-name" type="text" value="${curName.replace(/"/g, "&quot;")}" placeholder="Rule name" class="mt-field" style="${inputSt}">
        </div>
        <div>
          <label style="${labelSt}">Description</label>
          <input id="tra-rf-description" type="text" value="${curDesc.replace(/"/g, "&quot;")}" placeholder="Description" class="mt-field" style="${inputSt}">
        </div>
        <div style="display:flex;flex-direction:column;gap:4px">
          <label style="${labelSt}">Severity</label>
          <div class="u-row-10">
            ${this._mtFieldSelect("tra-rf-severity", [["warning", "Warning"], ["high", "High"], ["low", "Low"]], curSev, "min-width:110px")}
            ${activeToggle}
            <span style="font-size:11px;color:var(--is-text-muted)">Active</span>
          </div>
        </div>
      </div>
      ${classicParams}
      ${condCard}
      ${actCard}
      <!-- Save and Back sit in the modal header, like Maintainerr's editor.
           These stay as the hooks those header buttons click. -->
      <div style="display:none">
        <button id="tra-rf-cancel">Cancel</button>
        <button id="tra-rf-save">${saveLabel}</button>
      </div>
    </div>`;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Users tab
  // ──────────────────────────────────────────────────────────────────────────
  _traBodyUsers() {
    const m = this._tracearrModal;
    const seen = /* @__PURE__ */ new Set();
    const deduped = (m.usersData || []).filter((u) => {
      const k = u.id || u.username;
      return k && !seen.has(k) && seen.add(k);
    });
    const search = (m.usersSearch || "").toLowerCase().trim();
    const filtered = search ? deduped.filter((u) => (u.displayName || "").toLowerCase().includes(search) || (u.username || "").toLowerCase().includes(search)) : deduped;
    const isMob = this._isMob;
    const pp = this._tlCalcPerPage();
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / pp));
    const page = Math.min(m.usersPage || 0, pages - 1);
    const users = filtered.slice(page * pp, (page + 1) * pp);
    const toolbar = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-shrink:0">${this._uiBar("tra-users-search", m.usersSearch || "", [], [])}</div>`;
    if (isMob) {
      const cards = users.map((u) => {
        const score = u.trustScore ?? 100;
        const c = this._traTrustColor(score);
        const bg = this._traTrustBg(score);
        const badge = u.totalViolations > 0 ? this._uiBadge(`${u.totalViolations} viol.`, "red") : this._uiBadge("OK", "green");
        const meta = [u.serverName, `${u.sessionCount ?? 0} ${this._t("tlPlays")}`].filter(Boolean).join(" \xB7 ");
        return `<div class="tl-mob-card u-row-10">
          ${this._traUserAvatar(u, 32)}
          <div style="flex:1;min-width:0">
            <div class="tl-mob-name">${u.displayName || u.username}</div>
            <div class="tl-mob-meta"><span>${meta}</span></div>
          </div>
          ${badge}
          <span style="font-size:14px;font-weight:800;color:${c};background:${bg};border-radius:8px;padding:3px 8px;flex-shrink:0">${score}</span>
        </div>`;
      }).join("") || `<div class="tl-mob-card" style="text-align:center;color:var(--is-text-muted)">${this._t("tlNoData")}</div>`;
      return toolbar + `<div class="tra-users-results-wrap" style="display:contents"><div>${cards}</div>${this._tlMobPag("tra-users-page", page, pages)}</div>`;
    }
    const rows = users.map((u) => {
      const score = u.trustScore ?? 100;
      const c = this._traTrustColor(score);
      const pct = score + "%";
      const vBadge = u.totalViolations > 0 ? this._uiBadge(String(u.totalViolations), "red") : this._uiBadge("0", "neutral");
      const srvBg = { plex: "#e5a00d", jellyfin: "#7c4dff", emby: "#52b54b" }[u.serverType] || "rgba(255,255,255,0.15)";
      const srvC = u.serverType === "plex" ? "#000" : "#fff";
      const srvL = { plex: "P", jellyfin: "J", emby: "E" }[u.serverType] || "?";
      return `<tr${u.totalViolations > 0 ? ' class="tl-row-warn"' : ""}>
        <td><div class="u-row-8">${this._traUserAvatar(u, 22)}<strong class="u-sm-text">${u.displayName || u.username}</strong></div></td>
        <td><span style="width:18px;height:18px;border-radius:5px;background:${srvBg};color:${srvC};display:inline-flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;vertical-align:middle;margin-right:5px">${srvL}</span><span style="font-size:11px;color:var(--is-text)">${u.serverName || "\u2014"}</span></td>
        <td>
          <div class="u-row-6">
            <div style="width:52px;height:5px;border-radius:4px;background:rgba(255,255,255,0.1);overflow:hidden;flex-shrink:0"><div style="height:100%;border-radius:4px;background:${c.replace("0.9", "0.7")};width:${pct}"></div></div>
            <span style="font-size:11px;font-weight:700;color:${c}">${score}</span>
          </div>
        </td>
        <td style="font-size:11px;color:var(--is-text)">${u.sessionCount ?? 0}</td>
        <td>${vBadge}</td>
        <td style="font-size:11px;color:var(--is-text-muted);white-space:nowrap">${u.lastActivityAt ? this._traFmtDate(u.lastActivityAt) : "\u2014"}</td>
      </tr>`;
    }).join("") || `<tr><td colspan="6" style="text-align:center;color:var(--is-text-muted);padding:20px">${this._t("tlNoData")}</td></tr>`;
    return toolbar + `<div class="tra-users-results-wrap" style="display:contents"><div style="overflow-x:auto">
      <table class="tl-users-table">
        <thead><tr>
          ${_traSortTh("displayName", this._t("traUser"), m.usersSortCol, m.usersSortDir)}
          <th>${this._t("traServer")}</th>
          ${_traSortTh("trustScore", "Trust", m.usersSortCol, m.usersSortDir)}
          ${_traSortTh("sessionCount", this._t("tlPlays"), m.usersSortCol, m.usersSortDir)}
          ${_traSortTh("totalViolations", "Violations", m.usersSortCol, m.usersSortDir)}
          <th>${this._t("traNaposledy")}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>${this._tlMobPag("tra-users-page", page, pages)}</div>`;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Violations tab
  // ──────────────────────────────────────────────────────────────────────────
  _traBodyViolations() {
    const m = this._tracearrModal;
    const viols = m.violsData || [];
    const total = m.violsTotal || 0;
    const isMob = this._isMob;
    const pp = this._tlCalcPerPage({ hasFilter: true });
    const pages = Math.max(1, Math.ceil(total / pp));
    const SEVERITIES = ["low", "medium", "high", "critical"];
    const STATUSES = ["active", "resolved", "dismissed"];
    const sevLbl = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
    const statLbl = { active: "Active", resolved: "Resolved", dismissed: "Dismissed" };
    const filters = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-shrink:0">
      <div style="font-size:14px;font-weight:700;color:var(--is-text);flex:1;min-width:0">Violation Log</div>
      ${this._uiBar("", "", [
      {
        id: "tra-viols-sev",
        kind: "status",
        value: m.violsSeverity || "",
        neutral: "",
        items: [["", "All Severities"], ...SEVERITIES.map((s) => [s, sevLbl[s]])]
      },
      {
        id: "tra-viols-stat",
        kind: "event",
        value: m.violsStatus || "",
        neutral: "",
        items: [["", "All Statuses"], ...STATUSES.map((s) => [s, statLbl[s]])]
      }
    ], [], { style: "flex:0 0 auto" })}
    </div>`;
    if (!viols.length) {
      return filters + `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:40px 24px;color:var(--is-text-muted)">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.4"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div style="font-size:14px;font-weight:600;color:var(--is-text)">No violations found</div>
        <div style="font-size:12px">No violations have been recorded yet.</div>
      </div>`;
    }
    if (isMob) {
      const cards = viols.map((v) => {
        const sev = v.severity || "high";
        const c = this._traSevColor(sev);
        const bg = this._traSevBg(sev);
        const type = this._traViolTypeLabel(v.type);
        const user = v.user?.displayName || v.username || "";
        const when = this._traFmtDate(v.createdAt || v.detectedAt);
        const det = v.detail || v.description || "";
        const borderC = c.replace("0.9", "0.5");
        return `<div class="tl-mob-card" style="border-left:3px solid ${borderC}">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            ${this._uiBadge(`${sev.toUpperCase()}`, this._hexToRgbTriple(c), { small: true })}
            <span class="tl-mob-name">${type}</span>
          </div>
          <div class="tl-mob-meta">
            ${user ? `<span>${user}</span>` : ""}
            ${det ? `<span>${det}</span>` : ""}
            <span>${when}</span>
          </div>
        </div>`;
      }).join("");
      return filters + `<div>${cards}</div>` + this._tlMobPag("tra-viols-page", m.violsPage, pages);
    }
    const rows = viols.map((v) => {
      const sev = v.severity || "high";
      const c = this._traSevColor(sev);
      const bg = this._traSevBg(sev);
      const type = this._traViolTypeLabel(v.type);
      const user = v.user || {};
      const when = this._traFmtDate(v.createdAt || v.detectedAt);
      const det = v.detail || v.description || "\u2014";
      return `<tr${sev === "high" ? ' class="tl-row-warn"' : ""}>
        <td>${this._uiBadge(`${sev.toUpperCase()}`, this._hexToRgbTriple(c), { small: true })}</td>
        <td class="u-sm-text">${type}</td>
        <td><div style="display:flex;align-items:center;gap:7px">${this._traUserAvatar(v.user, 18)}<span style="font-size:11px;color:var(--is-text)">${user.displayName || user.username || "\u2014"}</span></div></td>
        <td style="font-size:11px;color:var(--is-text-muted);max-width:280px">${det}</td>
        <td style="font-size:11px;color:var(--is-text-muted);white-space:nowrap">${when}</td>
      </tr>`;
    }).join("");
    return filters + `<div style="overflow-x:auto">
      <table class="tl-users-table">
        <thead><tr>
          <th>Severity</th>
          <th>Type</th>
          <th>${this._t("traUser")}</th>
          <th>Detail</th>
          <th>${this._t("traNaposledy")}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>` + this._tlMobPag("tra-viols-page", m.violsPage, Math.max(1, Math.ceil(total / pp)));
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Shared animated donut chart (matches Activity tab style)
  _traDonutSvg(segs, size) {
    const total = segs.reduce((s, sg) => s + (sg.value || 0), 0);
    if (!total) return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"></svg>`;
    const cx = size / 2, cy = size / 2, r = size * 0.34, sw = size * 0.15;
    const C = 2 * Math.PI * r;
    let cum = 0;
    const gap = segs.length > 1 ? 3 : 0;
    const uid = Math.random().toString(36).slice(2, 7);
    const ro = (r + sw / 2).toFixed(1);
    const ri = (r - sw / 2).toFixed(1);
    const ip = (Number(ri) / Number(ro) * 100).toFixed(0);
    const defs = "<defs>" + segs.map(
      (sg, i) => `<radialGradient id="dg-${uid}-${i}" cx="${cx}" cy="${cy}" r="${ro}" fx="${cx}" fy="${cy}" gradientUnits="userSpaceOnUse"><stop offset="${ip}%" stop-color="${sg.color}" stop-opacity="0.5"/><stop offset="100%" stop-color="${sg.color}" stop-opacity="1"/></radialGradient>`
    ).join("") + "</defs>";
    const rings = segs.map((sg) => {
      const full = sg.value / total * C;
      const dash = Math.max(0, full - gap);
      const off = -cum;
      cum += full;
      return `<circle class="donut-ring" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${sg.color}" stroke-width="${sw * 1.9}" stroke-linecap="butt" stroke-dasharray="${dash.toFixed(2)} ${(C - dash).toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 ${cx} ${cy})" stroke-opacity="0" style="transition:stroke-opacity 0.15s"/>`;
    }).join("");
    cum = 0;
    const arcs = segs.map((sg, i) => {
      const full = sg.value / total * C;
      const dash = Math.max(0, full - gap);
      const off = -cum;
      cum += full;
      const pct = Math.round(sg.value / total * 100);
      return `<circle class="donut-arc" data-idx="${i}" data-label="${sg.label}" data-value="${sg.value}" data-pct="${pct}" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#dg-${uid}-${i})" stroke-width="${sw}" stroke-linecap="butt" stroke-dasharray="${dash.toFixed(2)} ${(C - dash).toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 ${cx} ${cy})" style="cursor:pointer"><animate attributeName="r" from="0" to="${r.toFixed(2)}" dur="0.8s" begin="0s" fill="freeze" calcMode="spline" keySplines="0.25 0.46 0.45 0.94" keyTimes="0;1"/><animate attributeName="stroke-dasharray" from="0 ${C.toFixed(2)}" to="${dash.toFixed(2)} ${(C - dash).toFixed(2)}" dur="0.8s" begin="0s" fill="freeze" calcMode="spline" keySplines="0.25 0.46 0.45 0.94" keyTimes="0;1"/></circle>`;
    }).join("");
    const fs = Math.min(size * 0.14, 12);
    return `<div class="donut-wrap" style="position:relative;display:inline-block;flex-shrink:0"><svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;overflow:visible">
      ${defs}
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="${sw}"/>
      <g><animateTransform attributeName="transform" type="rotate" from="-360 ${cx} ${cy}" to="0 ${cx} ${cy}" dur="0.8s" begin="0s" fill="freeze" calcMode="spline" keySplines="0.25 0.46 0.45 0.94" keyTimes="0;1"/>${rings}${arcs}</g>
      <text x="${cx}" y="${cy + fs * 0.4}" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="${fs}" font-weight="700">${total}</text>
    </svg><div class="donut-tt" style="display:none;position:absolute;pointer-events:none;background:rgba(15,15,20,0.92);border:1px solid rgba(255,255,255,0.13);border-radius:6px;padding:5px 9px;white-space:nowrap;z-index:10;color:rgba(255,255,255,0.9)"></div></div>`;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Shared progress pie (5-level Tautulli style, 14×14 SVG)
  _traWatchPie(pct) {
    const ring = '<circle cx="7" cy="7" r="5.5" fill="none" style="stroke:var(--is-text-muted)" stroke-width="1.5"/>';
    const svg = (inner) => `<svg width="14" height="14" viewBox="0 0 14 14" style="flex-shrink:0">${inner}</svg>`;
    const arc = (d) => `<path d="${d}" style="fill:var(--is-text-body)"/>`;
    return pct >= 85 ? svg('<circle cx="7" cy="7" r="5.5" style="fill:var(--is-text-body)"/>') : pct >= 63 ? svg(`${ring}${arc("M7,7 L7,1.5 A5.5,5.5 0,1,1 1.5,7 Z")}`) : pct >= 38 ? svg(`${ring}${arc("M7,7 L7,1.5 A5.5,5.5 0,0,1 7,12.5 Z")}`) : pct >= 10 ? svg(`${ring}${arc("M7,7 L7,1.5 A5.5,5.5 0,0,1 12.5,7 Z")}`) : svg(ring);
  }
  // History tab
  // ──────────────────────────────────────────────────────────────────────────
  _traBodyHistory() {
    const m = this._tracearrModal;
    const hist = m.histData || [];
    const total = m.histTotal || 0;
    const isMob = this._isMob;
    const _NAV_SUBS = { stats: 1, library: 3, performance: 2 };
    const _navH = isMob ? (_NAV_SUBS[m.navGroup] ? 44 : 0) + 56 : 0;
    const pp = isMob ? Math.max(2, Math.floor((window.innerHeight * 0.88 - 90 - _navH - 26 - 72 - 46) / 92) - 1) : this._tlCalcPerPage({ hasFilter: true, filterH: 40, rowH: 44, bar: 0 });
    const pages = Math.max(1, Math.ceil(total / pp));
    const TRA_HIST_COLS = [
      { key: "date", label: "Date" },
      { key: "user", label: this._t("traUser") },
      { key: "content", label: this._t("traMedia"), always: true },
      { key: "platform", label: "Platform" },
      { key: "quality", label: "Quality" },
      { key: "duration", label: "Duration" },
      { key: "progress", label: "Progress" }
    ];
    if (!m.traHistHiddenCols) m.traHistHiddenCols = /* @__PURE__ */ new Set();
    const hidden = m.traHistHiddenCols;
    const vis = TRA_HIST_COLS.filter((col) => !hidden.has(col.key));
    const toggleable = TRA_HIST_COLS.filter((col) => !col.always);
    const colsBtn = this._tlColsMenu(
      "tra-hist-cols-btn",
      "tra-hist-cols-menu",
      this._tlColItems(toggleable, hidden, "data-tra-hist-col"),
      m.traHistColsOpen
    );
    const colsBtnIcon = this._tlColsMenu(
      "tra-hist-cols-btn",
      "tra-hist-cols-menu",
      this._tlColItems(toggleable, hidden, "data-tra-hist-col"),
      m.traHistColsOpen,
      true
    );
    const mediaIcon = (type) => this._tlMediaIcon(type || "", 15);
    const watchPie = (pct) => this._traWatchPie(pct);
    const watchBadge = (h) => {
      const p = parseInt(h.progressMs || 0, 10);
      const t = parseInt(h.totalDurationMs || 0, 10);
      const pct = t ? Math.round(p / t * 100) : 0;
      let label, color, bg;
      if (h.watched || pct >= 90) {
        label = "Watched";
        color = "#34C759";
        bg = "rgba(52,199,89,0.15)";
      } else if (pct >= 50) {
        label = "Engaged";
        color = "#007AFF";
        bg = "rgba(0,122,255,0.15)";
      } else if (pct >= 10) {
        label = "Abandoned";
        color = "#FF9500";
        bg = "rgba(255,149,0,0.15)";
      } else {
        label = "Sampled";
        color = "rgba(255,255,255,0.35)";
        bg = "rgba(255,255,255,0.07)";
      }
      return { label, color, bg, pct };
    };
    const fmtDt = (iso) => {
      if (!iso) return "\u2014";
      const d = new Date(iso);
      const date = d.toLocaleDateString(this._locale, { month: "short", day: "numeric" });
      const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
      return { date, time };
    };
    const _SRV_CLR_F = { plex: "#e5a00d", jellyfin: "#7c4dff", emby: "#52b54b" };
    const srvMapF = Object.fromEntries((m.histServers || []).map((s) => [s.id, s]));
    const _srvSfx = (id) => {
      const s = srvMapF[id];
      if (!s?.type) return "";
      return " - " + (s.type.charAt(0).toUpperCase() + s.type.slice(1));
    };
    const srvOpts = (m.histServers || []).map((s) => `<option value="${s.id}"${m.histServer === s.id ? " selected" : ""}>${s.name}</option>`).join("");
    const filteredUsers = m.histServer ? (m.histUsers || []).filter((u) => u.serverId === m.histServer) : m.histUsers || [];
    const uOpts = filteredUsers.map((u) => `<option value="${u.id}"${m.histUser === u.id ? " selected" : ""}>${u.displayName || u.username}${_srvSfx(u.serverId)}</option>`).join("");
    const periodItems = [
      ["all", this._t("traAllTime")],
      ["week", this._t("traLastWeek")],
      ["month", this._t("traLastMonth")],
      ["year", this._t("traLastYear")]
    ];
    const mediaItems = [
      ["", this._t("traAllMedia")],
      ["movie", "Movie"],
      ["episode", "Episode"],
      ["track", "Music"]
    ];
    const userItems = [
      ["", this._t("traAllUsers")],
      ...filteredUsers.map((u) => [u.id, (u.displayName || u.username) + _srvSfx(u.serverId)])
    ];
    const filters = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-shrink:0">${this._uiBar("tra-hist-search", m.histSearch || "", [
      { id: "tra-hist-period", kind: "event", value: m.histPeriod || "all", neutral: "all", items: periodItems },
      { id: "tra-hist-user", kind: "relgroup", value: m.histUser || "", neutral: "", items: userItems },
      { id: "tra-hist-media", kind: "source", value: m.histMedia || "", neutral: "", items: mediaItems }
    ], [{ html: colsBtn }])}</div>`;
    if (!hist.length) return filters + `<div class="tra-hist-results-wrap" style="display:contents"><div style="color:var(--is-text-muted);text-align:center;padding:24px">${this._t("tlNoHistory")}</div></div>`;
    if (isMob) {
      const _DP_ICO = `<svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" style="flex-shrink:0"><polygon points="5,3 19,12 5,21"/></svg>`;
      const _TC_ICO = `<svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" style="flex-shrink:0"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;
      const _CLK = `<svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0;opacity:0.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
      const cards = hist.map((h, idx) => {
        const title = h.showTitle || h.mediaTitle || "\u2014";
        const yearLbl = h.showTitle ? `S${String(h.seasonNumber || 0).padStart(2, "0")}E${String(h.episodeNumber || 0).padStart(2, "0")}` : h.year ? String(h.year) : "";
        const user = h.user?.displayName || h.user?.username || "";
        const durRaw = h.durationMs ? (() => {
          const s = Math.round(h.durationMs / 1e3);
          const hh = Math.floor(s / 3600);
          const mm = Math.floor(s % 3600 / 60);
          const ss = s % 60;
          return hh > 0 ? `${hh}h ${String(mm).padStart(2, "0")}m` : `${mm}m ${String(ss).padStart(2, "0")}s`;
        })() : "";
        const { label, color, bg, pct } = watchBadge(h);
        const dt = fmtDt(h.startedAt);
        const decTag = h.isTranscode ? `${this._uiBadge(`${_TC_ICO}Transcode`, this._hexToRgbTriple("#FF9500"), { small: true })}` : `${this._uiBadge(`${_DP_ICO}Direct Play`, this._hexToRgbTriple("#34C759"), { small: true })}`;
        const metaParts = [
          yearLbl ? `<span>${yearLbl}</span>` : "",
          user ? `<span>${user}</span>` : "",
          durRaw ? `<span style="display:inline-flex;align-items:center;gap:3px">${_CLK}${durRaw}</span>` : ""
        ].filter(Boolean).join('<span style="opacity:0.3;margin:0 1px">\xB7</span>');
        return `<div class="tl-mob-card" data-tra-hist-row="${h.id || idx}" style="display:grid;grid-template-columns:1fr auto;row-gap:5px;column-gap:8px;align-items:center;cursor:pointer">
          <div style="display:flex;align-items:center;gap:5px;min-width:0;overflow:hidden">
            <span style="flex-shrink:0">${mediaIcon(h.mediaType)}</span>
            <span style="font-size:12px;font-weight:600;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</span>
          </div>
          <div style="display:flex;align-items:center;gap:4px;white-space:nowrap;justify-content:flex-end">
            ${watchPie(pct)}<span class="u-xs-muted">${pct}%</span>
          </div>
          <div>${decTag}</div>
          <div style="display:flex;justify-content:flex-end">
            ${this._uiBadge(`${label}`, this._hexToRgbTriple(color), { small: true })}
          </div>
          <div style="font-size:10px;color:var(--is-text-muted);display:flex;align-items:center;gap:4px;overflow:hidden;white-space:nowrap;min-width:0">${metaParts}</div>
          <div style="text-align:right;font-size:10px;color:var(--is-text-muted);white-space:nowrap;line-height:1.4">
            <div>${dt.date}</div><div>${dt.time}</div>
          </div>
        </div>`;
      }).join("");
      const pag2 = this._tlMobPag("tra-hist-page", m.histPage, pages);
      return `<div style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;margin:-10px -12px -16px">
        <div style="flex-shrink:0;padding:10px 12px 0">${filters}</div>
        <div class="tra-hist-results-wrap" style="display:contents">
          <div style="flex:1;min-height:0;overflow:hidden">${cards}</div>
          ${pag2 ? `<div style="flex-shrink:0;padding:4px 12px 8px">${pag2}</div>` : ""}
        </div>
      </div>`;
    }
    const rows = hist.map((h, idx) => {
      const title = h.mediaTitle || "\u2014";
      const sub = h.showTitle ? `<div style="font-size:10px;color:var(--is-text-muted);margin-top:1px">${h.showTitle} \xB7 S${String(h.seasonNumber || 0).padStart(2, "0")}E${String(h.episodeNumber || 0).padStart(2, "0")}</div>` : h.year ? `<div style="font-size:10px;color:var(--is-text-muted);margin-top:1px">${h.year}</div>` : "";
      const user = h.user?.displayName || h.user?.username || "\u2014";
      const srv = srvMapF[h.serverId] || null;
      const srvType = srv?.type || null;
      const srvLabel = srvType ? srvType.charAt(0).toUpperCase() + srvType.slice(1) : null;
      const srvColor = srvType ? _SRV_CLR_F[srvType] || "rgba(255,255,255,0.4)" : null;
      const _DP_ICO = `<svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" style="flex-shrink:0"><polygon points="5,3 19,12 5,21"/></svg>`;
      const _TC_ICO = `<svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" style="flex-shrink:0"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;
      const dec = h.isTranscode ? `${this._uiBadge(`${_TC_ICO}Transcode`, this._hexToRgbTriple("#FF9500"), { small: true })}` : `${this._uiBadge(`${_DP_ICO}Direct Play`, this._hexToRgbTriple("#34C759"), { small: true })}`;
      const _CLK = `<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0;opacity:0.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
      const durRaw = h.durationMs ? (() => {
        const s = Math.round(h.durationMs / 1e3);
        const h2 = Math.floor(s / 3600);
        const m2 = Math.floor(s % 3600 / 60);
        const s2 = s % 60;
        return h2 > 0 ? `${h2}h ${String(m2).padStart(2, "0")}m` : `${m2}m ${String(s2).padStart(2, "0")}s`;
      })() : "\u2014";
      const dur = h.durationMs ? `<div style="display:inline-flex;align-items:center;gap:4px">${_CLK}<span>${durRaw}</span></div>` : "\u2014";
      const { label, color, bg, pct } = watchBadge(h);
      const dt = fmtDt(h.startedAt);
      const cm = {
        date: `<td style="white-space:nowrap"><div style="font-size:11px;font-weight:600;color:var(--is-text)">${dt.date}</div><div class="u-xs-muted">${dt.time}</div></td>`,
        user: `<td><div class="u-row-6">${this._traUserAvatar(h.user, 18)}<div><div style="font-size:11px;color:var(--is-text)">${user}</div>${srvLabel ? `<div style="font-size:9px;font-weight:700;color:${srvColor}">${srvLabel}</div>` : ""}</div></div></td>`,
        content: `<td style="min-width:180px"><div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">${mediaIcon(h.mediaType)}<strong class="u-sm-text">${title}</strong>${this._uiBadge(`${label}`, this._hexToRgbTriple(color), { small: true })}</div>${sub}</td>`,
        platform: `<td><div style="font-size:11px;color:var(--is-text)">${h.platform || "\u2014"}</div><div class="u-xs-muted">${h.product || ""}</div></td>`,
        quality: `<td>${dec}</td>`,
        duration: `<td style="font-size:11px;color:var(--is-text-muted);white-space:nowrap">${dur}</td>`,
        progress: `<td><div class="u-row-5">${watchPie(pct)}<span style="font-size:11px;color:var(--is-text-muted)">${pct}%</span></div></td>`
      };
      return `<tr data-tra-hist-row="${h.id || idx}" style="cursor:pointer">${vis.map((col) => cm[col.key] || "<td>\u2014</td>").join("")}</tr>`;
    }).join("");
    const thead = vis.map((col) => `<th>${col.label}</th>`).join("");
    const pag = this._tlMobPag("tra-hist-page", m.histPage, Math.max(1, Math.ceil(total / pp)), true);
    return `<div style="display:flex;flex-direction:column;flex:1;min-height:0;height:100%">
      <div style="flex-shrink:0">${filters}</div>
      <div class="tra-hist-results-wrap" style="display:contents">
        <div style="flex:1;min-height:0;overflow-x:auto;overflow-y:auto">
          <table class="tl-hist-table">
            <thead><tr>${thead}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div style="flex-shrink:0">${pag}</div>
      </div>
    </div>`;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // History — session detail view
  // ──────────────────────────────────────────────────────────────────────────
  _traBodyHistDetail() {
    const m = this._tracearrModal;
    const h = m.histDetailItem;
    if (!h) return '<div style="color:var(--is-text-muted);padding:40px;text-align:center">No data</div>';
    const isMob = this._isMob;
    const poster = !!h.posterUrl;
    const fmtDur = (ms) => {
      if (!ms || ms <= 0) return null;
      const s = Math.round(Number(ms) / 1e3);
      const hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60;
      return hh > 0 ? `${hh}h ${String(mm).padStart(2, "0")}m ${String(ss).padStart(2, "0")}s` : `${mm}m ${String(ss).padStart(2, "0")}s`;
    };
    const fmtDt = (iso) => {
      if (!iso) return null;
      const d = new Date(iso);
      return d.toLocaleDateString(this._locale, { month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    };
    const row = (label, value) => value != null && value !== "" && value !== "\u2014" ? `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.05);gap:8px">
           <span style="font-size:11px;color:var(--is-text-muted);flex-shrink:0">${label}</span>
           <span style="font-size:11px;color:var(--is-text);text-align:right;word-break:break-all">${value}</span>
         </div>` : "";
    const secHdr = (label, bdg = "") => `<div style="display:flex;align-items:center;gap:6px;margin:14px 0 6px">
         <span style="font-size:10px;font-weight:700;color:var(--is-text-muted);text-transform:uppercase;letter-spacing:.06em">${label}</span>
         ${bdg}
       </div>`;
    const badge = (txt, color, bg) => `${this._uiBadge(`${txt}`, this._hexToRgbTriple(color), { small: true })}`;
    const decisionBadge = (dec) => dec === "transcode" ? badge("Transcode", "#FF9500", "rgba(255,149,0,0.14)") : dec === "copy" ? badge("Copy", "#007AFF", "rgba(0,122,255,0.14)") : badge("Direct Play", "#34C759", "rgba(52,199,89,0.14)");
    const title = h.showTitle || h.mediaTitle || "\u2014";
    const subtitle = h.showTitle ? `${h.mediaTitle ? h.mediaTitle + " \xB7 " : ""}S${String(h.seasonNumber || 0).padStart(2, "0")}E${String(h.episodeNumber || 0).padStart(2, "0")}` : h.year ? String(h.year) : "";
    const p = parseInt(h.progressMs || 0), t = parseInt(h.totalDurationMs || 0);
    const pct = t ? Math.round(p / t * 100) : 0;
    const stateBadge = h.state === "playing" ? badge("Playing", "#34C759", "rgba(52,199,89,0.14)") : badge("Stopped", "rgba(255,255,255,0.5)", "rgba(255,255,255,0.08)");
    const decBadge = decisionBadge(h.videoDecision || (h.isTranscode ? "transcode" : "directplay"));
    const watchMs = h.startedAt && h.stoppedAt ? new Date(h.stoppedAt) - new Date(h.startedAt) : Number(h.durationMs) || 0;
    const _SRV_CLR = { plex: "#e5a00d", jellyfin: "#7c4dff", emby: "#52b54b" };
    const srvMapF = Object.fromEntries((m.histServers || []).map((s) => [s.id, s]));
    const srv = srvMapF[h.serverId];
    const srvType = (srv?.type || h.serverName || "").toLowerCase();
    const srvName = h.serverName || srv?.name || "";
    const srvClr = _SRV_CLR[srvType] || "#fff";
    const srvBadge = srvName ? badge(srvName, srvClr, "rgba(255,255,255,0.07)") : "";
    const streamTbl = (fields) => {
      const any = fields.some(([, sv, dv]) => sv != null || dv != null);
      if (!any) return "";
      return `<table style="width:100%;border-collapse:collapse;font-size:10px">
        <thead><tr>
          <th style="text-align:left;color:var(--is-text-muted);font-weight:600;padding:3px 0;width:35%"></th>
          <th style="text-align:left;color:var(--is-text-muted);font-weight:600;padding:3px 4px;width:28%">Source</th>
          <th style="padding:3px 0;width:6%"></th>
          <th style="text-align:left;color:var(--is-text-muted);font-weight:600;padding:3px 4px;width:31%">Stream</th>
        </tr></thead>
        <tbody>${fields.map(([lbl, sv, dv]) => {
        if (sv == null && dv == null) return "";
        const svStr = sv != null ? String(sv) : "\u2014";
        const dvStr = dv != null ? String(dv) : svStr;
        const same = svStr === dvStr;
        return `<tr>
            <td style="color:var(--is-text-muted);padding:3px 0;vertical-align:top">${lbl}</td>
            <td style="color:var(--is-text);font-weight:600;padding:3px 4px;vertical-align:top">${svStr}</td>
            <td style="color:rgba(255,255,255,0.2);text-align:center;padding:3px 0;vertical-align:top">\u2192</td>
            <td style="color:${same ? "rgba(255,255,255,0.38)" : "#0a84ff"};font-weight:600;padding:3px 4px;vertical-align:top">${dvStr}</td>
          </tr>`;
      }).join("")}</tbody>
      </table>`;
    };
    const svd = h.sourceVideoDetails || {};
    const stv = h.streamVideoDetails || svd;
    const sad = h.sourceAudioDetails || {};
    const sta = h.streamAudioDetails || sad;
    const srcRes = h.sourceVideoWidth && h.sourceVideoHeight ? `${h.sourceVideoWidth}\xD7${h.sourceVideoHeight}${h.resolution ? ` (${h.resolution})` : ""}` : h.resolution || null;
    const stmRes = srcRes;
    const leftPanel = `<div style="flex:1;min-width:0">
      <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px 14px;display:flex;gap:12px;align-items:flex-start">
        ${poster ? `<img id="tra-hist-poster" style="width:60px;min-width:60px;border-radius:6px;object-fit:cover;aspect-ratio:2/3;background:rgba(255,255,255,0.05)">` : ""}
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap">
            ${this._tlMediaIcon(h.mediaType || "", 15)}
            <span style="font-size:13px;font-weight:700;color:var(--is-text)">${title}</span>
            ${stateBadge}
          </div>
          ${subtitle ? `<div style="font-size:11px;color:var(--is-text-muted);margin-bottom:6px">${subtitle}</div>` : ""}
          <div style="height:4px;border-radius:2px;background:rgba(255,255,255,0.1);margin:8px 0 2px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:#0a84ff;border-radius:2px"></div>
          </div>
          <div style="font-size:10px;color:var(--is-text-muted);text-align:right">${pct}%</div>
        </div>
      </div>

      ${secHdr("Playback")}
      <div class="u-panel">
        ${row("Started", fmtDt(h.startedAt))}
        ${row("Stopped", fmtDt(h.stoppedAt))}
        ${row("Watch time", fmtDur(watchMs))}
        ${row("Length", fmtDur(parseInt(h.totalDurationMs || 0)))}
      </div>

      ${secHdr("User")}
      <div class="u-panel">
        <div class="u-row-8">
          ${this._traUserAvatar(h.user, 28)}
          <span class="u-sm-text">${h.user?.displayName || h.user?.username || "\u2014"}</span>
        </div>
      </div>

      ${srvName ? `${secHdr("Server")}
      <div class="u-panel">
        ${row("Server", `<span style="color:${srvClr};font-weight:700">${srvName}</span> \xB7 ${srvName}`)}
      </div>` : ""}

      ${secHdr("Device")}
      <div class="u-panel">
        ${row("Platform", h.platform)}
        ${row("Product", h.product)}
        ${row("Device", h.device)}
        ${row("Player", h.player)}
      </div>
    </div>`;
    const rightPanel = `<div style="flex:1;min-width:0${isMob ? ";margin-top:0" : ""}">
      ${secHdr("Stream Details", decBadge)}
      <div class="u-panel">
        ${row("Container", h.transcodeInfo?.sourceContainer ? `${h.transcodeInfo.sourceContainer} \u2192 ${h.transcodeInfo.sourceContainer}` : null)}
        ${row("Bitrate", h.bitrate ? `${(h.bitrate / 1e3).toFixed(1)} Mbps` : null)}
      </div>

      ${secHdr("Video", decisionBadge(h.videoDecision))}
      <div class="u-panel">
        ${streamTbl([
      ["Codec", h.sourceVideoCodecDisplay || h.sourceVideoCodec, h.streamVideoCodecDisplay || h.streamVideoCodec || h.sourceVideoCodecDisplay],
      ["Resolution", srcRes, stmRes],
      ["Bitrate", svd.bitrate ? `${(svd.bitrate / 1e3).toFixed(1)} Mbps` : null, stv.bitrate ? `${(stv.bitrate / 1e3).toFixed(1)} Mbps` : null],
      ["Framerate", svd.framerate, stv.framerate],
      ["HDR", svd.dynamicRange, stv.dynamicRange],
      ["Profile", svd.profile, null],
      ["Color", svd.colorSpace ? `${svd.colorSpace} ${svd.colorDepth ? svd.colorDepth + "bit" : ""}`.trim() : null, null]
    ])}
      </div>

      ${secHdr("Audio", decisionBadge(h.audioDecision))}
      <div class="u-panel">
        ${streamTbl([
      ["Codec", h.sourceAudioCodecDisplay || h.sourceAudioCodec, h.streamAudioCodecDisplay || h.streamAudioCodec || h.sourceAudioCodecDisplay],
      ["Channels", h.audioChannelsDisplay || (h.sourceAudioChannels != null ? String(h.sourceAudioChannels) : null), h.audioChannelsDisplay],
      ["Bitrate", sad.bitrate ? `${sad.bitrate} kbps` : null, sta.bitrate ? `${sta.bitrate} kbps` : null],
      ["Language", sad.language, sta.language],
      ["Sample Rate", sad.sampleRate ? `${(sad.sampleRate / 1e3).toFixed(0)} kHz` : null, null]
    ])}
      </div>

      ${h.subtitleInfo ? `${secHdr("Subtitles")}
      <div class="u-panel">
        ${row("Format", [h.subtitleInfo.format || h.subtitleInfo.codec, h.subtitleInfo.language].filter(Boolean).join(" \xB7 "))}
        ${row("Decision", h.subtitleInfo.decision)}
      </div>` : ""}
    </div>`;
    return `<div id="tra-hist-detail" style="display:flex;flex-direction:${isMob ? "column" : "row"};gap:20px;height:100%;min-height:0;overflow-y:auto">
      <button id="tra-hist-detail-back" style="display:none"></button>
      ${leftPanel}
      ${rightPanel}
    </div>`;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Activity tab
  // ──────────────────────────────────────────────────────────────────────────
  _traBodyActivity() {
    const m = this._tracearrModal;
    const act = m.activityData || {};
    const period = m.activityPeriod || "month";
    const days = period === "week" ? 7 : period === "year" ? 365 : 30;
    const isMob = this._isMob;
    const isTablet = !isMob && window.matchMedia("(max-width:860px)").matches;
    const tauFmt = (categories, series) => ({ response: { data: { categories, series } } });
    const playsAll = act.plays || [];
    const concAll = act.concurrent || [];
    const ptsP = playsAll.slice(-days);
    const ptsC = concAll.slice(-days);
    const playsRaw = tauFmt(
      ptsP.map((p) => (p.date || "").slice(0, 10)),
      [{ name: "Plays", data: ptsP.map((p) => p.count || 0) }]
    );
    const concRaw = tauFmt(
      ptsC.map((p) => (p.date || p.day || "").slice(0, 10)),
      [
        { name: "Direct Play", data: ptsC.map((p) => Number(p.direct) || 0) },
        { name: "Direct Stream", data: ptsC.map((p) => Number(p.directStream) || 0) },
        { name: "Transcode", data: ptsC.map((p) => Number(p.transcode) || 0) }
      ]
    );
    const dowRaw = (() => {
      const raw = act.byDayOfWeek || [];
      const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const cats = raw.map((it, i) => it.name ? it.name.slice(0, 3) : DOW[it.day ?? it.dayOfWeek ?? i] || String(i));
      const vals = raw.map((it) => it.count || 0);
      return tauFmt(cats, [{ name: "Plays", data: vals }]);
    })();
    const hodRaw = (() => {
      const raw = act.byHourOfDay || [];
      const cats = raw.map((it, i) => String(typeof it === "number" ? i : it.hour ?? i));
      const vals = raw.map((it) => typeof it === "number" ? it : it.count || it.plays || 0);
      return tauFmt(cats, [{ name: "Plays", data: vals }]);
    })();
    const qual = act.quality || {};
    const qualRaw = (() => {
      const entries = [
        { name: "Direct Play", val: qual.directPlay || 0 },
        { name: "Direct Stream", val: qual.directStream || 0 },
        { name: "Transcode", val: qual.transcode || 0 }
      ].filter((e) => e.val > 0);
      return tauFmt(
        entries.map((e) => e.name),
        entries.map((e, i) => ({ name: e.name, data: entries.map((_, j) => j === i ? e.val : 0) }))
      );
    })();
    const platRaw = (() => {
      const plats = (act.platforms || []).slice(0, 8);
      return tauFmt(
        plats.map((p) => p.platform),
        plats.map((p, i) => ({ name: p.platform, data: plats.map((_, j) => j === i ? p.count || 0 : 0) }))
      );
    })();
    const _ACT_P_LBLS = isMob ? { week: "W", month: "M", year: "Y" } : { week: "Week", month: "Month", year: "Year" };
    const dayBtns = _traSegHtml(["week", "month", "year"].map((p) => [p, _ACT_P_LBLS[p]]), period, "data-tra-act-period");
    const hdr = `<div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:${isMob ? 10 : 12}px">
      ${dayBtns}
    </div>`;
    const chartH = isMob ? 100 : isTablet ? 108 : 118;
    const BASE = { range: ptsP.length || days, isDate: true, isMob, height: chartH };
    const BOPT = { isMob, height: chartH };
    const lineXLabel = /* @__PURE__ */ ((n) => (d, i) => i % Math.max(1, Math.ceil(n / 7)) === 0 ? d.slice(-5) : "")(ptsP.length);
    const playsSvg = this._tlGLineSvg(playsRaw, { ...BASE, chartId: "tra-p", xLabel: lineXLabel, noDots: true });
    const concSvg = this._tlGLineSvg(concRaw, { ...BASE, chartId: "tra-c", isDuration: false, xLabel: lineXLabel, noDots: true });
    const dowSvg = this._tlGBarSvg(dowRaw, { ...BOPT, chartId: "tra-dw", xLabel: (d) => d.slice(0, 3) });
    const hodSvg = this._tlGBarSvg(hodRaw, { ...BOPT, chartId: "tra-hd", xLabel: (_, i) => i % 4 === 0 ? `${i}h` : "" });
    const playsCard = this._tlGCard(this._t("traPlaybackTrend"), playsRaw, playsSvg);
    const concCard = this._tlGCard("Concurrent streams", concRaw, concSvg);
    const dowCard = this._tlGCard("Activity by day of week", dowRaw, dowSvg);
    const hodCard = this._tlGCard("Activity by hour of day", hodRaw, hodSvg);
    const DONUT_HEX = ["#34C759", "#007AFF", "#FF3B30", "#FF9500", "#BF5AF2", "#FF2D55", "#5AC8FA", "#FFCC00"];
    const QUAL_HEX = { "Direct Play": "#34C759", "Direct Stream": "#007AFF", "Transcode": "#FF3B30" };
    const svgDonut = (segs, size) => {
      const total = segs.reduce((s, sg) => s + (sg.value || 0), 0);
      if (!total) return `<div class="donut-wrap" style="position:relative;display:inline-block;flex-shrink:0"><svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"></svg><div class="donut-tt" style="display:none"></div></div>`;
      const cx = size / 2, cy = size / 2, r = size * 0.34, sw = size * 0.15;
      const C = 2 * Math.PI * r;
      let cum = 0;
      const gap = segs.length > 1 ? 3 : 0;
      const uid = Math.random().toString(36).slice(2, 7);
      const ro = (r + sw / 2).toFixed(1);
      const ri = (r - sw / 2).toFixed(1);
      const ip = (Number(ri) / Number(ro) * 100).toFixed(0);
      const defs = "<defs>" + segs.map(
        (sg, i) => `<radialGradient id="dg-${uid}-${i}" cx="${cx}" cy="${cy}" r="${ro}" fx="${cx}" fy="${cy}" gradientUnits="userSpaceOnUse"><stop offset="${ip}%" stop-color="${sg.color}" stop-opacity="0.5"/><stop offset="100%" stop-color="${sg.color}" stop-opacity="1"/></radialGradient>`
      ).join("") + "</defs>";
      const rings = segs.map((sg) => {
        const full = sg.value / total * C;
        const dash = Math.max(0, full - gap);
        const off = -cum;
        cum += full;
        return `<circle class="donut-ring" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${sg.color}" stroke-width="${sw * 1.9}" stroke-linecap="butt" stroke-dasharray="${dash.toFixed(2)} ${(C - dash).toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 ${cx} ${cy})" stroke-opacity="0" style="transition:stroke-opacity 0.15s"/>`;
      }).join("");
      cum = 0;
      const arcs = segs.map((sg, i) => {
        const full = sg.value / total * C;
        const dash = Math.max(0, full - gap);
        const off = -cum;
        cum += full;
        const pct = Math.round(sg.value / total * 100);
        return `<circle class="donut-arc" data-idx="${i}" data-label="${sg.label}" data-value="${sg.value}" data-pct="${pct}" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#dg-${uid}-${i})" stroke-width="${sw}" stroke-linecap="butt" stroke-dasharray="${dash.toFixed(2)} ${(C - dash).toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 ${cx} ${cy})" style="cursor:pointer"><animate attributeName="r" from="0" to="${r.toFixed(2)}" dur="0.8s" begin="0s" fill="freeze" calcMode="spline" keySplines="0.25 0.46 0.45 0.94" keyTimes="0;1"/><animate attributeName="stroke-dasharray" from="0 ${C.toFixed(2)}" to="${dash.toFixed(2)} ${(C - dash).toFixed(2)}" dur="0.8s" begin="0s" fill="freeze" calcMode="spline" keySplines="0.25 0.46 0.45 0.94" keyTimes="0;1"/></circle>`;
      }).join("");
      const fs = Math.min(size * 0.14, 12);
      const svg = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;overflow:visible">
        ${defs}
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="${sw}"/>
        <g><animateTransform attributeName="transform" type="rotate" from="-360 ${cx} ${cy}" to="0 ${cx} ${cy}" dur="0.8s" begin="0s" fill="freeze" calcMode="spline" keySplines="0.25 0.46 0.45 0.94" keyTimes="0;1"/>${rings}${arcs}</g>
        <text x="${cx}" y="${cy + fs * 0.4}" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="${fs}" font-weight="700">${total}</text>
      </svg>`;
      return `<div class="donut-wrap" style="position:relative;display:inline-block;flex-shrink:0">${svg}<div class="donut-tt" style="display:none;position:absolute;pointer-events:none;background:rgba(15,15,20,0.92);border:1px solid rgba(255,255,255,0.13);border-radius:6px;padding:5px 9px;white-space:nowrap;z-index:10;color:rgba(255,255,255,0.9)"></div></div>`;
    };
    const donutCard = (title, segs) => {
      const total = segs.reduce((s, sg) => s + sg.value, 0);
      const ds = isMob ? 78 : 92;
      const legendItems = segs.map((s) => {
        const pct = total ? Math.round(s.value / total * 100) : 0;
        return `<div style="display:flex;align-items:center;gap:5px;margin-bottom:4px">
          <span style="width:7px;height:7px;border-radius:2px;background:${s.color};flex-shrink:0"></span>
          <span style="font-size:10px;color:var(--is-text);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.label}</span>
          <span style="font-size:10px;font-weight:700;color:var(--is-text-muted)">${pct}%</span>
        </div>`;
      }).join("");
      return `<div class="tl-g-card">
        <div style="margin-bottom:8px"><span class="tl-graph-title">${title}</span></div>
        <div style="display:flex;align-items:center;gap:12px">
          ${svgDonut(segs, ds)}
          <div style="flex:1;min-width:0">${legendItems}</div>
        </div>
      </div>`;
    };
    const qualSegs = [
      { label: "Direct Play", value: qual.directPlay || 0, color: QUAL_HEX["Direct Play"] },
      { label: "Direct Stream", value: qual.directStream || 0, color: QUAL_HEX["Direct Stream"] },
      { label: "Transcode", value: qual.transcode || 0, color: QUAL_HEX["Transcode"] }
    ].filter((s) => s.value > 0);
    const platSegs = (act.platforms || []).slice(0, 8).map((p, i) => ({
      label: p.platform,
      value: p.count || 0,
      color: DONUT_HEX[i % DONUT_HEX.length]
    }));
    const qualCard = donutCard("Stream quality", qualSegs);
    const platCard = donutCard("Platforms", platSegs);
    if (isMob) {
      return hdr + `<div style="display:flex;flex-direction:column;gap:8px">${playsCard}${concCard}${dowCard}${hodCard}${qualCard}${platCard}</div>`;
    }
    return hdr + `<div style="display:grid;grid-template-columns:1fr 1fr;gap:${isTablet ? "6px" : "8px"}">` + playsCard + concCard + dowCard + hodCard + qualCard + platCard + `</div>`;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Quality tab (library analytics)
  // ──────────────────────────────────────────────────────────────────────────
  _traQualEvolCard() {
    const m = this._tracearrModal;
    const qd = m.qualityData || {};
    const _allData = qd.data || [];
    const isMob = this._isMob;
    const Q_COLORS = { "4K": "#34C759", "1080p": "#007AFF", "720p": "#FF9500", "SD": "#FF3B30" };
    const _period = m.qualityPeriod || "month";
    const _periodDays = { week: 7, month: 30, year: 365 };
    const _sliced = _period === "all" ? _allData : _allData.slice(-(_periodDays[_period] || 30));
    const data = _period === "year" ? _sliced.filter((_, i) => i % 7 === 0 || i === _sliced.length - 1) : _period === "all" ? _sliced.filter((_, i) => i % 30 === 0 || i === _sliced.length - 1) : _sliced;
    const days = data.map((d) => d.day);
    const n = days.length;
    const shortQ = !isMob && window.innerHeight < 900;
    const chartH = isMob ? 110 : shortQ ? 96 : 130;
    const layers = [
      { label: "SD", color: Q_COLORS["SD"] },
      { label: "720p", color: Q_COLORS["720p"] },
      { label: "1080p", color: Q_COLORS["1080p"] },
      { label: "4K", color: Q_COLORS["4K"] }
    ];
    const _curPeriod = _period;
    const _curMt = m.qualityMediaType || null;
    const _Q_P_LBLS = isMob ? { week: "W", month: "M", year: "Y", all: "All" } : { week: "Week", month: "Month", year: "Year", all: "All" };
    const _periodBtns = _traSegHtml(["week", "month", "year", "all"].map((p) => [p, _Q_P_LBLS[p]]), _curPeriod, "data-tra-q-period");
    const _mtBtns = _traSegHtml([["", "All"], ["movies", "Movies"], ["shows", "Series"]], _curMt || "", "data-tra-q-mt");
    const legend = layers.slice().reverse().map(
      (l) => `<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;color:var(--is-text-muted)"><span style="width:7px;height:7px;border-radius:2px;background:${l.color};display:inline-block"></span>${l.label}</span>`
    ).join("");
    const qBar = `<div class="tra-qe-bar" style="display:flex;align-items:center;gap:6px;flex-shrink:0">
        ${_mtBtns}<span class="mt-tb-sep"></span>${_periodBtns}
      </div>`;
    const header = `<div style="display:flex;align-items:center;gap:${isMob ? 6 : 10}px;margin-bottom:8px">
             <span class="tl-graph-title" style="flex-shrink:0">${isMob ? "Quality" : this._t("traQualityEvolution")}</span>
             <div style="flex:1;min-width:0"></div>${qBar}
           </div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">${legend}</div>`;
    if (!n) return `<div class="tl-g-card" style="position:relative">${header}<div style="height:${chartH}px;display:flex;align-items:center;justify-content:center;color:var(--is-text-muted);font-size:12px">No data</div></div>`;
    const VBW = 1e3, SVH = 200;
    const PL = 12, PR = 6, PT = 18, PB = 6;
    const cW = VBW - PL - PR, cH = SVH - PT - PB;
    const slotW = cW / Math.max(n, 1);
    const xOf = (i) => PL + (i + 0.5) * slotW;
    const maxV = Math.max(1, ...data.map((d) => d.totalItems || 0));
    const yAbs = (v) => PT + (1 - v / maxV) * cH;
    const baseY = PT + cH;
    const seriesAbs = [
      { label: "4K", color: Q_COLORS["4K"], vals: data.map((d) => (d.countSd || 0) + (d.count720p || 0) + (d.count1080p || 0) + (d.count4k || 0)) },
      { label: "1080p", color: Q_COLORS["1080p"], vals: data.map((d) => (d.countSd || 0) + (d.count720p || 0) + (d.count1080p || 0)) },
      { label: "720p", color: Q_COLORS["720p"], vals: data.map((d) => (d.countSd || 0) + (d.count720p || 0)) },
      { label: "SD", color: Q_COLORS["SD"], vals: data.map((d) => d.countSd || 0) }
    ];
    const pts = seriesAbs.map((s) => s.vals.map((v, i) => ({ x: xOf(i), y: yAbs(v), v, cat: data[i]?.day })));
    const wkndRects = _period === "year" || _period === "all" ? "" : data.map((d, i) => {
      const dow = (/* @__PURE__ */ new Date(d.day + "T12:00:00")).getDay();
      if (dow !== 0 && dow !== 6) return "";
      const rx = xOf(i) - slotW / 2;
      return `<rect x="${rx.toFixed(1)}" y="${PT}" width="${slotW.toFixed(1)}" height="${cH}" style="fill:var(--tl-wknd)"/>`;
    }).join("");
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((v) => Math.round(v * maxV));
    const gridlines = yTicks.map(
      (v) => `<line x1="${PL}" y1="${yAbs(v).toFixed(1)}" x2="${VBW - PR}" y2="${yAbs(v).toFixed(1)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`
    ).join("");
    const defs = "<defs>" + seriesAbs.map(
      (s, si) => `<linearGradient id="traq-g${si}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${s.color}" stop-opacity="0.18"/><stop offset="100%" stop-color="${s.color}" stop-opacity="0"/></linearGradient>`
    ).join("") + "</defs>";
    const areaFills = seriesAbs.map(
      (s, si) => `<path d="${this._tlGSmoothArea(pts[si], baseY)}" fill="url(#traq-g${si})" style="animation:fade-in 0.8s ease-out both"/>`
    ).join("");
    const lines = seriesAbs.map(
      (s, si) => `<path d="${this._tlGSmoothLine(pts[si])}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" class="tl-g-anim-line"/>`
    ).join("");
    const colW = (VBW - PL - PR) / n;
    const hitCols = data.map((d, i) => {
      const vals = [
        { n: "4K", v: d.count4k || 0, hex: Q_COLORS["4K"] },
        { n: "1080p", v: d.count1080p || 0, hex: Q_COLORS["1080p"] },
        { n: "720p", v: d.count720p || 0, hex: Q_COLORS["720p"] },
        { n: "SD", v: d.countSd || 0, hex: Q_COLORS["SD"] }
      ].filter((v) => v.v > 0).sort((a, b) => b.v - a.v);
      const tot = vals.reduce((s, v) => s + v.v, 0);
      const td = JSON.stringify({ lbl: d.day, tot, vals }).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
      const rx = (PL + i * colW).toFixed(1);
      return `<g class="tl-g-lcol" data-tl-g-col="${td}" style="cursor:pointer"><rect class="tl-g-lhlt" x="${rx}" y="${PT}" width="${colW.toFixed(1)}" height="${SVH - PT - PB}" style="fill:var(--tl-col-hlt,rgba(255,255,255,0.04));opacity:0"/><rect x="${rx}" y="${PT}" width="${colW.toFixed(1)}" height="${SVH - PT - PB}" fill="transparent"/></g>`;
    }).join("");
    const yLblTxt = maxV >= 1e3 ? (maxV / 1e3).toFixed(1) + "K" : String(maxV);
    const step = Math.max(1, Math.ceil(n / 7));
    const xLabelsHtml = '<div class="tl-g-x-labels">' + data.map((d, i) => {
      if (i % step !== 0 && i !== n - 1) return "";
      const pct = (xOf(i) / VBW * 100).toFixed(1);
      const pos = i === 0 ? `left:${pct}%;transform:translateX(0)` : i === n - 1 ? `left:${pct}%;transform:translateX(-100%)` : `left:${pct}%;transform:translateX(-50%)`;
      return `<span style="position:absolute;${pos};font-size:10px;color:var(--is-text-muted);white-space:nowrap;line-height:1">${d.day.slice(5)}</span>`;
    }).join("") + "</div>";
    const chartHtml = this._tlGWrap(this._tlGSvgEl(defs + wkndRects + gridlines + areaFills + lines + hitCols, chartH), xLabelsHtml, yLblTxt);
    return `<div class="tl-g-card" style="position:relative">${header}<div style="position:relative">${chartHtml}</div><div class="tl-g-tip" style="display:none;position:absolute;top:0;left:0;background:var(--is-menu-bg,#18182a);border:1px solid var(--is-btn-bdr);border-radius:7px;padding:7px 10px;font-size:11px;pointer-events:none;z-index:50;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.3)"></div></div>`;
  }
  _traQualCodecsCard() {
    const m = this._tracearrModal;
    const isMob = this._isMob;
    const codecs = m.qualityCodecs || {};
    const CODEC_COLORS = ["#34C759", "#007AFF", "#FF9500", "#FF3B30", "#BF5AF2", "#FF2D55", "#5AC8FA", "#FFCC00"];
    const codecBars = (items) => {
      if (!items?.length) return "";
      const rowGap = !isMob && window.innerHeight < 900 ? 5 : 7;
      const maxC = items[0].count || 1;
      return items.map((it, i) => {
        const pct = Math.round(it.count / maxC * 100);
        const color = CODEC_COLORS[i % CODEC_COLORS.length];
        const delay = (i * 0.05).toFixed(2);
        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:${rowGap}px">
          <span style="font-size:10px;font-weight:600;color:var(--is-text);width:44px;text-align:right;flex-shrink:0;white-space:nowrap">${it.codec}</span>
          <div style="flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,0.08);overflow:hidden">
            <div class="tl-g-anim-bar-h" style="height:100%;border-radius:3px;background:linear-gradient(to right,${color},${color}70);width:${pct}%;animation-delay:${delay}s"></div>
          </div>
          <span style="font-size:10px;color:var(--is-text-muted);width:32px;flex-shrink:0">${it.count}</span>
        </div>`;
      }).join("");
    };
    const codecSection = (title, items, extra = "") => `<div class="u-panel-hdr"><span class="tl-graph-title">${title}</span>${extra}</div>${codecBars(items)}`;
    const _codecTab = m.qualityCodecTab || "movies";
    const _ctBtnsEl = _traSegHtml([["movies", "Movies / TV"], ["music", "Music"]], _codecTab, "data-tra-q-codec-tab", "margin-left:auto");
    if (_codecTab === "music") {
      const musicBars = codecBars(codecs.music?.codecs);
      return `<div class="tl-g-card">${codecSection(this._t("traAudioCodecs"), codecs.music?.codecs, _ctBtnsEl)}${musicBars ? "" : '<span style="font-size:11px;color:var(--is-text-muted)">No data</span>'}</div>`;
    }
    const videoSec = codecSection(this._t("traVideoCodecs"), codecs.video?.codecs);
    const audioSec = codecSection(this._t("traAudioCodecs"), codecs.audio?.codecs);
    const chanSec = codecSection(this._t("traAudioChannels"), codecs.channels?.codecs, _ctBtnsEl);
    const isTabletQ = window.matchMedia("(max-width:860px) and (min-width:601px)").matches;
    const _innerCols = isMob ? `<div>${chanSec}</div><div>${videoSec}</div><div>${audioSec}</div>` : `<div>${videoSec}</div><div>${audioSec}</div><div>${chanSec}</div>`;
    const _qCols = isMob ? "1fr" : isTabletQ ? "1fr 1fr" : "1fr 1fr 1fr";
    const _qGap = isMob ? "12px" : isTabletQ ? "10px" : "16px";
    return `<div class="tl-g-card"><div style="display:grid;grid-template-columns:${_qCols};gap:${_qGap}">${_innerCols}</div></div>`;
  }
  _traBodyQuality() {
    const m = this._tracearrModal;
    const qd = m.qualityData || {};
    if (qd.status === "generating" || qd.message && !qd.data) {
      return `<div style="text-align:center;padding:48px 24px">
        <div style="font-size:28px;margin-bottom:12px">\u23F3</div>
        <div style="font-size:14px;font-weight:700;color:var(--is-text);margin-bottom:6px">Generating historical data\u2026</div>
        <div style="font-size:12px;color:var(--is-text-muted)">${qd.message || "Creating snapshots from library history. This may take a few minutes."}</div>
      </div>`;
    }
    const isMob = this._isMob;
    const Q_COLORS = { "4K": "#34C759", "1080p": "#007AFF", "720p": "#FF9500", "SD": "#FF3B30" };
    const qualCard = this._traQualEvolCard();
    const codecsRow = this._traQualCodecsCard();
    const res = m.qualityResolution || {};
    const _resSegs = (obj) => {
      if (!obj) return [];
      const c4k = obj.count4k ?? obj["4K"] ?? obj["4k"] ?? 0;
      const c1080 = obj.count1080p ?? obj["1080p"] ?? 0;
      const c720 = obj.count720p ?? obj["720p"] ?? 0;
      const cSd = obj.countSd ?? obj["SD"] ?? obj["sd"] ?? 0;
      return [
        { label: "4K", value: c4k, color: Q_COLORS["4K"] },
        { label: "1080p", value: c1080, color: Q_COLORS["1080p"] },
        { label: "720p", value: c720, color: Q_COLORS["720p"] },
        { label: "SD", value: cSd, color: Q_COLORS["SD"] }
      ].filter((s) => s.value > 0);
    };
    const movSegs = _resSegs(res.movies);
    const showSegs = _resSegs(res.shows ?? res.tv ?? res.series);
    const movTotal = movSegs.reduce((s, sg) => s + sg.value, 0) || 1;
    const showTotal = showSegs.reduce((s, sg) => s + sg.value, 0) || 1;
    const svgDonut = (segs, size) => {
      const total = segs.reduce((s, sg) => s + sg.value, 0);
      if (!total) return `<div class="donut-wrap" style="position:relative;display:inline-block;flex-shrink:0"><svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"></svg><div class="donut-tt" style="display:none"></div></div>`;
      const cx = size / 2, cy = size / 2, r = size * 0.34, sw = size * 0.15;
      const C = 2 * Math.PI * r;
      let cum = 0;
      const gap = segs.length > 1 ? 3 : 0;
      const uid = Math.random().toString(36).slice(2, 7);
      const ro = (r + sw / 2).toFixed(1);
      const ri = (r - sw / 2).toFixed(1);
      const ip = (Number(ri) / Number(ro) * 100).toFixed(0);
      const defs = "<defs>" + segs.map(
        (sg, i) => `<radialGradient id="dg-${uid}-${i}" cx="${cx}" cy="${cy}" r="${ro}" fx="${cx}" fy="${cy}" gradientUnits="userSpaceOnUse"><stop offset="${ip}%" stop-color="${sg.color}" stop-opacity="0.5"/><stop offset="100%" stop-color="${sg.color}" stop-opacity="1"/></radialGradient>`
      ).join("") + "</defs>";
      const rings = segs.map((sg) => {
        const full = sg.value / total * C;
        const dash = Math.max(0, full - gap);
        const off = -cum;
        cum += full;
        return `<circle class="donut-ring" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${sg.color}" stroke-width="${sw * 1.9}" stroke-linecap="butt" stroke-dasharray="${dash.toFixed(2)} ${(C - dash).toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 ${cx} ${cy})" stroke-opacity="0" style="transition:stroke-opacity 0.15s"/>`;
      }).join("");
      cum = 0;
      const arcs = segs.map((sg, i) => {
        const full = sg.value / total * C;
        const dash = Math.max(0, full - gap);
        const off = -cum;
        cum += full;
        const pct = Math.round(sg.value / total * 100);
        return `<circle class="donut-arc" data-idx="${i}" data-label="${sg.label}" data-value="${sg.value}" data-pct="${pct}" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#dg-${uid}-${i})" stroke-width="${sw}" stroke-linecap="butt" stroke-dasharray="${dash.toFixed(2)} ${(C - dash).toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 ${cx} ${cy})" style="cursor:pointer"><animate attributeName="r" from="0" to="${r.toFixed(2)}" dur="0.8s" begin="0s" fill="freeze" calcMode="spline" keySplines="0.25 0.46 0.45 0.94" keyTimes="0;1"/><animate attributeName="stroke-dasharray" from="0 ${C.toFixed(2)}" to="${dash.toFixed(2)} ${(C - dash).toFixed(2)}" dur="0.8s" begin="0s" fill="freeze" calcMode="spline" keySplines="0.25 0.46 0.45 0.94" keyTimes="0;1"/></circle>`;
      }).join("");
      const fs = Math.min(size * 0.13, 11);
      const svg = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;overflow:visible">
        ${defs}
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="${sw}"/>
        <g><animateTransform attributeName="transform" type="rotate" from="-360 ${cx} ${cy}" to="0 ${cx} ${cy}" dur="0.8s" begin="0s" fill="freeze" calcMode="spline" keySplines="0.25 0.46 0.45 0.94" keyTimes="0;1"/>${rings}${arcs}</g>
        <text x="${cx}" y="${cy + fs * 0.4}" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-size="${fs}" font-weight="700">${total}</text>
      </svg>`;
      return `<div class="donut-wrap" style="position:relative;display:inline-block;flex-shrink:0">${svg}<div class="donut-tt" style="display:none;position:absolute;pointer-events:none;background:rgba(15,15,20,0.92);border:1px solid rgba(255,255,255,0.13);border-radius:6px;padding:5px 9px;white-space:nowrap;z-index:10;color:rgba(255,255,255,0.9)"></div></div>`;
    };
    const shortQ2 = !isMob && window.innerHeight < 900;
    const ds = isMob ? 90 : shortQ2 ? 82 : 110;
    const _donutLegend = (segs, total) => segs.map((s) => {
      const pct = Math.round(s.value / total * 100);
      return `<div style="display:flex;align-items:center;gap:5px;margin-bottom:5px">
        <span style="width:8px;height:8px;border-radius:2px;background:${s.color};flex-shrink:0"></span>
        <span style="font-size:11px;color:var(--is-text);flex:1">${s.label}</span>
        <span style="font-size:11px;font-weight:700;color:var(--is-text-muted)">${s.value} <span style="opacity:0.6">(${pct}%)</span></span>
      </div>`;
    }).join("");
    const movCard = `<div class="tl-g-card">
      <div style="margin-bottom:10px"><span class="tl-graph-title">Movies</span><span style="float:right;font-size:10px;color:var(--is-text-muted)">${movTotal} ${this._t("traTotalItems")}</span></div>
      <div style="display:flex;align-items:center;gap:14px">
        ${svgDonut(movSegs, ds)}
        <div style="flex:1;min-width:0">${_donutLegend(movSegs, movTotal)}</div>
      </div>
    </div>`;
    const showCard = `<div class="tl-g-card">
      <div style="margin-bottom:10px"><span class="tl-graph-title">TV Shows</span><span style="float:right;font-size:10px;color:var(--is-text-muted)">${showTotal} ${this._t("traTotalItems")}</span></div>
      <div style="display:flex;align-items:center;gap:14px">
        ${svgDonut(showSegs, ds)}
        <div style="flex:1;min-width:0">${_donutLegend(showSegs, showTotal)}</div>
      </div>
    </div>`;
    if (isMob) {
      return `<div style="display:flex;flex-direction:column;gap:8px"><div data-tra-q-evol>${qualCard}</div>${movCard}${showCard}<div data-tra-q-codecs>${codecsRow}</div></div>`;
    }
    return `<div data-tra-q-evol style="margin-bottom:8px">${qualCard}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">${movCard}${showCard}</div>
      <div data-tra-q-codecs>${codecsRow}</div>`;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Storage tab (library analytics)
  // ──────────────────────────────────────────────────────────────────────────
  _traBodyStorage() {
    const m = this._tracearrModal;
    const hist = m.storageData?.history || [];
    const cur = m.storageData?.current || {};
    const st = m.storageStats || {};
    const isMob = this._isMob;
    const fmtBytes = (b) => {
      const n = Number(b) || 0;
      if (n >= 1024 ** 4) return (n / 1024 ** 4).toFixed(2) + " TB";
      if (n >= 1024 ** 3) return (n / 1024 ** 3).toFixed(1) + " GB";
      if (n >= 1024 ** 2) return (n / 1024 ** 2).toFixed(0) + " MB";
      return n + " B";
    };
    const tile = (lbl, val, color, sub) => `<div style="background:var(--is-row-hover);border-radius:7px;padding:5px 8px">
        <div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--is-text-label);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${lbl}</div>
        <div style="font-size:${isMob ? "13px" : "14px"};font-weight:800;line-height:1;color:${color};white-space:nowrap">${val}</div>
        ${sub ? `<div style="font-size:8px;color:var(--is-text-muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sub}</div>` : ""}
      </div>`;
    const period = m.storagePeriod || "month";
    const gr = m.storageData?.growthRate;
    const growthVal = (() => {
      if (!gr) {
        const days = { week: 7, month: 30, year: 365 }[period];
        const slice = days ? hist.slice(-days) : hist;
        const f = slice[0], l = slice[slice.length - 1];
        return f && l ? Number(l.totalSizeBytes) - Number(f.totalSizeBytes) : 0;
      }
      if (period === "week") return Number(gr.bytesPerWeek || 0);
      if (period === "year") return Number(gr.bytesPerMonth || 0) * 12;
      if (period === "all") {
        const f = hist[0], l = hist[hist.length - 1];
        return f && l ? Number(l.totalSizeBytes) - Number(f.totalSizeBytes) : 0;
      }
      return Number(gr.bytesPerMonth || 0);
    })();
    const growthLabel = { week: "Growth/wk", month: "Growth/mo", year: "Growth/yr", all: "Total Growth" }[period] || "Growth";
    const growthSign = growthVal >= 0 ? "+" : "";
    const dupG = m.dupsSummary?.totalGroups || 0;
    const dupSav = Number(m.dupsSummary?.totalPotentialSavingsBytes || 0);
    const stSum = m.staleSummary?.total || m.staleSummary?.neverWatched || {};
    const stCnt = stSum.count || 0;
    const stSz = Number(stSum.sizeBytes || 0);
    const tiles = `<div style="display:grid;grid-template-columns:repeat(${isMob ? 2 : 4},1fr);gap:${isMob ? "6px" : "8px"};margin-bottom:${isMob ? "6px" : "6px"}">
      ${tile(this._t("traTotalSize"), fmtBytes(cur.totalSizeBytes || st.totalSizeBytes || 0), "#007AFF")}
      ${tile(growthLabel, growthSign + fmtBytes(Math.abs(growthVal)), growthVal >= 0 ? "#34C759" : "#FF3B30")}
      ${tile("Duplicates", dupG ? `${dupG.toLocaleString()} groups` : "\u2014", "#FF3B30", dupG ? `${fmtBytes(dupSav)} recoverable` : "")}
      ${tile(this._t("traStaleContent"), stCnt ? `${stCnt.toLocaleString()} items` : "\u2014", "#FF9500", stCnt ? `${fmtBytes(stSz)} unused` : "")}
    </div>`;
    const periodDays = { week: 7, month: 30, year: 365 };
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const showPred = m.storagePredictions !== false && period !== "all";
    const predDays = { week: 7, month: 30, year: 365, all: 30 }[period] || 30;
    const _rawSlice = period === "all" ? hist : hist.slice(-(periodDays[period] || 30));
    const _pastFull = _rawSlice.filter((d) => d.day <= today);
    const _past = period === "all" && _pastFull.length > 250 ? (() => {
      const stride = Math.ceil(_pastFull.length / 250);
      const sampled = _pastFull.filter((_, i) => i % stride === 0);
      if (sampled[sampled.length - 1] !== _pastFull[_pastFull.length - 1]) sampled.push(_pastFull[_pastFull.length - 1]);
      return sampled;
    })() : _pastFull;
    const histSlice = showPred ? (() => {
      const _needed = predDays - _past.length;
      if (_needed <= 0) return _past;
      const firstDay = _past[0]?.day || today;
      const _padded = Array.from({ length: _needed }, (_, i) => {
        const d = /* @__PURE__ */ new Date(firstDay + "T12:00:00");
        d.setDate(d.getDate() - (_needed - i));
        return { day: d.toISOString().slice(0, 10), totalSizeBytes: 0 };
      });
      return [..._padded, ..._past];
    })() : _past.filter((d) => Number(d.totalSizeBytes) > 0);
    const lastHist = histSlice[histSlice.length - 1];
    const lastBytes = Number(lastHist?.totalSizeBytes || 0);
    const _recentPts = _past.filter((d) => Number(d.totalSizeBytes) > 0).slice(-30);
    const bytesPerDay = _recentPts.length >= 2 ? (Number(_recentPts[_recentPts.length - 1].totalSizeBytes) - Number(_recentPts[0].totalSizeBytes)) / (_recentPts.length - 1) : Number(gr?.bytesPerDay || 0);
    const predPoints = showPred && lastHist && lastBytes > 0 ? Array.from({ length: predDays }, (_, i) => {
      const d = /* @__PURE__ */ new Date(lastHist.day + "T12:00:00");
      d.setDate(d.getDate() + i + 1);
      const mid = lastBytes + bytesPerDay * (i + 1);
      const spread = mid * 0.1;
      return { day: d.toISOString().slice(0, 10), totalSizeBytes: mid, spreadHi: mid + spread, spreadLo: Math.max(0, mid - spread) };
    }) : [];
    const _nonZeroLen = histSlice.filter((d) => Number(d.totalSizeBytes) > 0).length;
    const confidence = _nonZeroLen >= 30 ? "High" : _nonZeroLen >= 7 ? "Medium" : "Low";
    const confColor = { High: "#34C759", Medium: "#FF9500", Low: "#FF3B30" }[confidence];
    const VBW = 1e3, SVH = 200, PL = 8, PR = 8, PT = 14, PB = 4;
    const cW = VBW - PL - PR, cH = SVH - PT - PB;
    const baseY = PT + cH;
    const allPts = [...histSlice, ...predPoints];
    const toGiB = (b) => Number(b) / 1024 ** 3;
    const allGiB = allPts.flatMap((d) => [toGiB(d.totalSizeBytes), d.spreadHi ? toGiB(d.spreadHi) : 0]);
    const maxGiB = Math.max(...allGiB, 1) * 1.08;
    const N = allPts.length;
    const slotW = cW / Math.max(N, 1);
    const ptX = (i) => PL + (i + 0.5) * slotW;
    const ptY = (v) => Math.max(PT, Math.min(baseY, PT + cH * (1 - v / maxGiB)));
    const linePath = (pts) => {
      const n = pts.length;
      if (!n) return "";
      if (n < 2) return `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
      const dx = [], dy = [], m2 = [];
      for (let i = 0; i < n - 1; i++) {
        dx[i] = pts[i + 1].x - pts[i].x;
        dy[i] = pts[i + 1].y - pts[i].y;
        m2[i] = dy[i] / dx[i];
      }
      const t = new Array(n);
      t[0] = m2[0];
      t[n - 1] = m2[n - 2];
      for (let i = 1; i < n - 1; i++) t[i] = (m2[i - 1] + m2[i]) / 2;
      for (let i = 0; i < n - 1; i++) {
        if (Math.abs(m2[i]) < 1e-10) {
          t[i] = t[i + 1] = 0;
          continue;
        }
        const a = t[i] / m2[i], b = t[i + 1] / m2[i];
        if (a < 0 || b < 0) {
          t[i] = t[i + 1] = 0;
          continue;
        }
        const h = Math.sqrt(a * a + b * b);
        if (h > 3) {
          t[i] = 3 * m2[i] / h * a;
          t[i + 1] = 3 * m2[i] / h * b;
        }
      }
      let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < n - 1; i++) {
        const x1 = pts[i].x + dx[i] / 3, y1 = pts[i].y + t[i] * dx[i] / 3;
        const x2 = pts[i + 1].x - dx[i] / 3, y2 = pts[i + 1].y - t[i + 1] * dx[i] / 3;
        d += ` C${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${pts[i + 1].x.toFixed(1)},${pts[i + 1].y.toFixed(1)}`;
      }
      return d;
    };
    const areaPath = (pts, bY) => {
      if (!pts.length) return "";
      return `${linePath(pts)} L${pts[pts.length - 1].x.toFixed(1)},${bY} L${pts[0].x.toFixed(1)},${bY} Z`;
    };
    const histCoords = histSlice.map((d, i) => ({ x: ptX(i), y: ptY(toGiB(d.totalSizeBytes)), day: d.day, bytes: d.totalSizeBytes }));
    const hLast = histCoords[histCoords.length - 1];
    const predCoords = predPoints.map((d, i) => ({ x: ptX(histSlice.length + i), y: ptY(toGiB(d.totalSizeBytes)), day: d.day, bytes: d.totalSizeBytes, spreadHi: d.spreadHi, spreadLo: d.spreadLo }));
    const predWithJoint = hLast ? [hLast, ...predCoords] : predCoords;
    const _spreadJoint = showPred && predCoords.length && predCoords[0]?.spreadHi && hLast ? { x: hLast.x, y: hLast.y } : null;
    const spreadHiPts = _spreadJoint ? [_spreadJoint, ...predCoords.map((p) => ({ x: p.x, y: ptY(toGiB(p.spreadHi)) }))] : [];
    const spreadLoPts = _spreadJoint ? [_spreadJoint, ...predCoords.map((p) => ({ x: p.x, y: ptY(toGiB(p.spreadLo)) }))] : [];
    const spreadBandPath = spreadHiPts.length >= 2 && spreadLoPts.length >= 2 ? (() => {
      const j = spreadHiPts[0];
      const hi = spreadHiPts[spreadHiPts.length - 1];
      const lo = spreadLoPts[spreadLoPts.length - 1];
      return `M${j.x.toFixed(1)},${j.y.toFixed(1)} L${hi.x.toFixed(1)},${hi.y.toFixed(1)} L${lo.x.toFixed(1)},${lo.y.toFixed(1)} Z`;
    })() : "";
    const lastPred = predPoints[predPoints.length - 1];
    const rangeLoTB = lastPred ? (toGiB(lastPred.spreadLo) / 1024).toFixed(2) : null;
    const rangeHiTB = lastPred ? (toGiB(lastPred.spreadHi) / 1024).toFixed(2) : null;
    const HEX = "#007AFF";
    const PRED_HEX = "#e0f2fe";
    const SPRD_HEX = "#5AC8FA";
    const chartH = isMob ? showPred ? 88 : 108 : showPred ? 90 : 110;
    const maxTB = maxGiB / 1024;
    const tickStep = maxTB <= 0.5 ? 0.1 : maxTB <= 1 ? 0.25 : maxTB <= 2 ? 0.5 : maxTB <= 5 ? 1 : maxTB <= 10 ? 2 : 5;
    const yTicks = [];
    for (let v = 0; v <= maxTB * 1.01; v = Math.round((v + tickStep) * 1e3) / 1e3) yTicks.push(v);
    const yAxisHtml = yTicks.map((v) => {
      const pct = (ptY(v * 1024) / SVH * 100).toFixed(1);
      return `<span style="position:absolute;right:4px;top:${pct}%;transform:translateY(-50%);font-size:9px;color:rgba(255,255,255,0.32);white-space:nowrap;line-height:1">${v} TB</span>`;
    }).join("");
    const showEvery = Math.max(1, Math.ceil((isMob ? 110 : 62) / slotW));
    const xLabelsHtml = (() => {
      let lastLbl = "";
      return `<div class="tl-g-x-labels">` + allPts.map((d, i) => {
        const isLast = i === N - 1, isFirst = i === 0;
        if (!isFirst && !isLast && i % showEvery !== 0) return "";
        const lbl = period === "week" || period === "month" ? d.day.slice(5) : d.day.slice(2, 7);
        if (lbl === lastLbl) return "";
        lastLbl = lbl;
        const pct = ptX(i) / VBW * 100;
        const tx = isFirst ? "-25%" : isLast ? "-75%" : "-50%";
        return `<span style="position:absolute;left:${pct.toFixed(1)}%;transform:translateX(${tx});font-size:10px;color:var(--is-text-muted);white-space:nowrap;line-height:1">${lbl}</span>`;
      }).join("") + "</div>";
    })();
    const DOT_R = 3;
    const MASK_R = DOT_R + 2;
    const predDotStep = Math.max(1, Math.floor(predCoords.length / 12));
    const visPredDots = showPred ? predCoords.filter((_, i) => i % predDotStep === 0) : [];
    const maskCircles = visPredDots.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${MASK_R}"/>`).join("");
    const dotEl = (p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${DOT_R}" style="fill:transparent;stroke:${HEX};stroke-width:1.5" vector-effect="non-scaling-stroke"/>`;
    const histDots = "";
    const predDots = visPredDots.map(dotEl).join("");
    const _esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    const fmtTB = (b) => (toGiB(b) / 1024).toFixed(2) + " TB";
    const hitCols = allPts.map((d, i) => {
      const isPred = i >= histSlice.length;
      const byt = Number(d.totalSizeBytes);
      if (byt <= 0 && !isPred) return "";
      const hex = HEX;
      const name = isPred ? "Prediction" : "Storage";
      const fv = fmtTB(isPred ? byt : byt);
      const td = _esc(JSON.stringify({ lbl: d.day, tot: null, ftot: fv, vals: [{ n: name, v: byt, fv, hex }] }));
      const rx = (PL + i * slotW).toFixed(1);
      const rw = slotW.toFixed(1);
      return `<g class="tl-g-lcol" data-tl-g-col="${td}" style="cursor:pointer"><rect class="tl-g-lhlt" x="${rx}" y="${PT}" width="${rw}" height="${cH}" style="fill:rgba(255,255,255,0.12);opacity:0"/><rect x="${rx}" y="${PT}" width="${rw}" height="${cH}" fill="transparent"/></g>`;
    }).join("");
    const nowX = hLast ? hLast.x.toFixed(1) : null;
    const svgInner = `
      <defs>
        <linearGradient id="tras-gh" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${HEX}" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="${HEX}" stop-opacity="0"/>
        </linearGradient>
        <mask id="tras-dot-mask">
          <rect x="0" y="0" width="${VBW}" height="${SVH}" fill="white"/>
          ${maskCircles}
        </mask>
      </defs>
      ${yTicks.map((v) => `<line x1="${PL}" y1="${ptY(v * 1024).toFixed(1)}" x2="${VBW - PR}" y2="${ptY(v * 1024).toFixed(1)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`).join("")}
      ${spreadBandPath ? `<path d="${spreadBandPath}" fill="${SPRD_HEX}" fill-opacity="0.12" style="animation:fade-in 0.8s ease-out both"/>` : ""}
      ${spreadHiPts.length >= 2 ? `<line x1="${spreadHiPts[0].x.toFixed(1)}" y1="${spreadHiPts[0].y.toFixed(1)}" x2="${spreadHiPts[spreadHiPts.length - 1].x.toFixed(1)}" y2="${spreadHiPts[spreadHiPts.length - 1].y.toFixed(1)}" stroke="${SPRD_HEX}" stroke-width="1" stroke-opacity="0.5" vector-effect="non-scaling-stroke" style="animation:fade-in 0.8s ease-out both"/>` : ""}
      ${spreadLoPts.length >= 2 ? `<line x1="${spreadLoPts[0].x.toFixed(1)}" y1="${spreadLoPts[0].y.toFixed(1)}" x2="${spreadLoPts[spreadLoPts.length - 1].x.toFixed(1)}" y2="${spreadLoPts[spreadLoPts.length - 1].y.toFixed(1)}" stroke="${SPRD_HEX}" stroke-width="1" stroke-opacity="0.5" vector-effect="non-scaling-stroke" style="animation:fade-in 0.8s ease-out both"/>` : ""}
      <path d="${areaPath(histCoords, baseY)}" fill="url(#tras-gh)" style="animation:fade-in 0.8s ease-out both"/>
      ${nowX ? `<line x1="${nowX}" y1="${PT}" x2="${nowX}" y2="${baseY}" stroke="rgba(255,255,255,0.22)" stroke-width="1" stroke-dasharray="4 3"/>` : ""}
      <path d="${linePath(histCoords, period === "week" ? 0 : period === "month" ? 0.1 : 0.3)}" fill="none" stroke="${HEX}" stroke-width="2" vector-effect="non-scaling-stroke" class="tl-g-anim-line"/>
      ${showPred && predWithJoint.length > 1 ? `<path d="${linePath(predWithJoint, period === "week" ? 0 : period === "month" ? 0.1 : 0.3)}" fill="none" stroke="${HEX}" stroke-width="1.5" stroke-dasharray="8 5" vector-effect="non-scaling-stroke" mask="url(#tras-dot-mask)" style="animation:fade-in 0.8s ease-out both"/>` : ""}
      ${histDots}${predDots ? `<g class="u-fade-in">${predDots}</g>` : ""}
      ${hitCols}
    `;
    const storSvg = `<div class="tl-g-wrap" style="position:relative;padding-left:36px">
      <div style="position:absolute;left:0;top:0;height:${chartH}px;width:34px"><div style="position:relative;height:100%">${yAxisHtml}</div></div>
      <svg class="tl-g-svg" viewBox="0 0 ${VBW} ${SVH}" width="100%" height="${chartH}" preserveAspectRatio="none">${svgInner}</svg>
      ${xLabelsHtml}
    </div>`;
    const legend = showPred ? `<div style="display:flex;gap:10px;align-items:center;font-size:10px;color:var(--is-text-muted)">
      <span class="u-row-4"><span style="display:inline-block;width:18px;height:2px;background:${HEX}"></span>Historical</span>
      <span class="u-row-4"><svg width="20" height="4" style="flex-shrink:0"><line x1="0" y1="2" x2="20" y2="2" stroke="${HEX}" stroke-width="2" stroke-dasharray="6 4"/></svg>Prediction</span>
      <span class="u-row-4"><span style="display:inline-block;width:18px;height:6px;border-radius:2px;background:${SPRD_HEX};opacity:0.35"></span>Range</span>
    </div>` : "";
    const _STOR_P_LBLS = isMob ? { week: "W", month: "M", year: "Y", all: "All" } : { week: "Week", month: "Month", year: "Year", all: "All" };
    const periodBtns = _traSegHtml(["week", "month", "year", "all"].map((p) => [p, _STOR_P_LBLS[p]]), period, "data-tra-stor-period");
    const predToggle = `<button data-tra-stor-pred style="display:flex;align-items:center;gap:5px;background:none;border:none;cursor:pointer;padding:0;font-size:10px;color:var(--is-text-muted)">
      <span style="position:relative;display:inline-block;width:28px;height:15px;border-radius:8px;background:${showPred ? HEX : "rgba(255,255,255,0.15)"};transition:background 0.2s;flex-shrink:0">
        <span style="position:absolute;top:2px;left:${showPred ? "15px" : "2px"};width:11px;height:11px;border-radius:50%;background:#fff;transition:left 0.2s"></span>
      </span>
      Predictions
    </button>`;
    const rangeStr = rangeLoTB && rangeHiTB ? ` \xB7 ${rangeLoTB}\u2013${rangeHiTB} TB` : "";
    const confBadge = showPred ? `${this._uiBadge(`${confidence} Confidence${rangeStr}`, this._hexToRgbTriple(confColor), { small: true })}` : "";
    const storCard = `<div class="tl-g-card" style="position:relative">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
        <span class="tl-graph-title" style="display:inline-flex;align-items:center;gap:7px">${this._t("traStorageTrend")}${isMob ? "" : confBadge}</span>
        ${isMob ? `<div style="display:flex;align-items:center;gap:8px;flex-shrink:0">${predToggle}<span class="mt-tb-sep"></span>${periodBtns}</div>` : `<div class="mt-tb mt-tb--card" style="min-height:34px;padding:0 10px 0 12px;gap:8px;flex-shrink:0">
               ${predToggle}<span class="mt-tb-sep"></span>${periodBtns}
             </div>`}
      </div>
      ${legend ? `<div style="margin-bottom:4px">${legend}</div>` : ""}
      <div style="position:relative">
        ${storSvg}
        <div class="tl-g-tip" style="display:none;position:absolute;top:0;left:0;background:var(--is-menu-bg,#18182a);border:1px solid var(--is-btn-bdr);border-radius:7px;padding:7px 10px;font-size:11px;pointer-events:none;z-index:50;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.3)"></div>
      </div>
      ${isMob && confBadge ? `<div style="display:flex;justify-content:flex-end;margin-top:6px">${confBadge}</div>` : ""}
    </div>`;
    if (isMob) {
      return `<div style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;margin:-10px -12px -16px">
        <div style="flex:1;min-height:0;overflow-y:auto;padding:10px 12px 0">
          ${tiles}${storCard}<div data-tra-stale-wrap style="margin-top:6px">${this._traBodyStaleSection()}</div>
        </div>
        <div data-tra-stale-pag style="flex-shrink:0;padding:4px 12px 8px">${this._traStalePagHtml()}</div>
      </div>`;
    }
    return tiles + storCard + `<div data-tra-stale-wrap style="margin-top:6px">${this._traBodyStaleSection()}</div>`;
  }
  _traBodyStaleSection() {
    const m = this._tracearrModal;
    const isMob = this._isMob;
    const items = m.staleItems || [];
    const total = m.staleTotal || 0;
    const sum = m.staleSummary || {};
    const cat = m.staleCategory || "never_watched";
    const page = m.stalePage || 0;
    const pp = m.stalePageSize || 10;
    const totalP = Math.max(1, Math.ceil(total / pp));
    const nwCnt = sum.neverWatched?.count ?? 0;
    const stCnt = sum.stale?.count ?? 0;
    const fmtBytes = (b) => {
      const n = Number(b) || 0;
      if (n >= 1024 ** 4) return (n / 1024 ** 4).toFixed(2) + " TB";
      if (n >= 1024 ** 3) return (n / 1024 ** 3).toFixed(1) + " GB";
      if (n >= 1024 ** 2) return (n / 1024 ** 2).toFixed(0) + " MB";
      return n + " B";
    };
    const fmtDate = (iso) => {
      if (!iso) return "\u2014";
      const d = new Date(iso);
      const diff = Math.floor((Date.now() - d) / 864e5);
      if (diff === 0) return this._t("traToday");
      if (diff === 1) return this._t("traYesterday");
      return this._t("traDaysAgo").replace("%d", diff);
    };
    const RES_COLOR = { "4k": "#BF5AF2", "1080p": "#007AFF", "720p": "#34C759", "480p": "#FF9500", "sd": "#FF9500" };
    const mt = m.staleMediaType || "";
    const catItems = [
      ["never_watched", `${this._t("traNeverWatched")} (${nwCnt.toLocaleString()})`],
      ["stale", `${this._t("traStaleContent")} (${stCnt.toLocaleString()})`]
    ];
    const staleSels = [
      { id: "tra-stale-cat", kind: "event", value: cat, neutral: null, items: catItems },
      {
        id: "tra-stale-type",
        kind: "source",
        value: mt,
        neutral: "",
        items: [["", "All types"], ["movie", "Movies"], ["show", "TV Shows"]]
      }
    ];
    if (cat === "stale") {
      staleSels.push({
        id: "tra-stale-months",
        kind: "protocol",
        value: String(m.staleMonths || 3),
        neutral: "3",
        items: [["3", "Unwatched 3+ mo"], ["6", "Unwatched 6+ mo"], ["12", "Unwatched 1+ yr"], ["24", "Unwatched 2+ yr"]]
      });
    }
    const subTabs = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-shrink:0">${this._uiBar("tra-stale-search", m.staleSearch || "", staleSels, [])}</div>`;
    let tableHtml = "";
    if (!items.length) {
      tableHtml = `<div style="text-align:center;color:var(--is-text-muted);padding:20px 0;font-size:12px">${this._t("tlNoData")}</div>`;
    } else if (isMob) {
      const rows = items.map((it) => {
        const res = (it.resolution || "").toLowerCase();
        const rColor = RES_COLOR[res] || "rgba(255,255,255,0.4)";
        return `<div class="tl-mob-card">
          <div class="u-row-8">
            ${this._tlMediaIcon(it.mediaType === "movie" ? "movie" : "episode", 15)}
            <div style="flex:1;min-width:0">
              <div class="tl-mob-name u-truncate">${it.title}${it.year ? ` <span style="opacity:0.5;font-size:10px">(${it.year})</span>` : ""}</div>
              <div class="tl-mob-meta"><span>${it.serverName || ""}</span><span style="color:var(--is-text);font-weight:600">${it.resolution || "\u2014"}</span><span>${fmtDate(it.addedAt)}</span></div>
            </div>
            <span style="font-size:11px;font-weight:700;color:#007AFF;flex-shrink:0;white-space:nowrap">${fmtBytes(it.fileSize)}</span>
          </div>
        </div>`;
      }).join("");
      tableHtml = `<div>${rows}</div>`;
    } else {
      const sortCol = m.staleSort || "fileSize";
      const sortDir = m.staleOrder || "desc";
      const sth = (col, lbl, align) => {
        const active = sortCol === col;
        const arrow = active ? sortDir === "asc" ? " \u2191" : " \u2193" : "";
        return `<th data-tra-stale-sort="${col}" style="cursor:pointer;user-select:none;white-space:nowrap${align ? ";text-align:" + align : ""};color:${active ? "var(--is-text)" : ""}">${lbl}${arrow}</th>`;
      };
      const hasStreaming = false;
      const rows = items.map((it) => {
        const res = (it.resolution || "").toLowerCase();
        const rColor = RES_COLOR[res] || "rgba(255,255,255,0.4)";
        const plays = it.playCount ?? it.watchCount ?? null;
        const lastP = it.lastPlayedAt ? fmtDate(it.lastPlayedAt) : null;
        const streamCell = hasStreaming ? `<td style="font-size:11px;color:var(--is-text-muted);white-space:nowrap">${plays != null ? plays + "\xD7" : ""}${lastP ? `<span style="margin-left:4px;opacity:0.7">${lastP}</span>` : ""}${plays == null && !lastP ? "\u2014" : ""}</td>` : "";
        return `<tr>
          <td style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            <span style="display:flex;align-items:center;gap:4px;min-width:0">
              ${this._tlMediaIcon(it.mediaType === "movie" ? "movie" : "episode", 15)}
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${it.title}${it.year ? ` <span style="opacity:0.5;font-size:10px">(${it.year})</span>` : ""}</span>
            </span></td>
          <td style="font-size:11px;color:var(--is-text-muted);white-space:nowrap">${it.serverName || "\u2014"}</td>
          <td style="font-size:11px;font-weight:600;color:var(--is-text);white-space:nowrap;text-align:right">${fmtBytes(it.fileSize)}</td>
          <td style="font-size:11px;color:var(--is-text-muted);white-space:nowrap">${fmtDate(it.addedAt)}</td>
          <td style="font-size:11px;font-weight:600;color:var(--is-text);white-space:nowrap">${it.resolution || "\u2014"}</td>
          ${streamCell}
        </tr>`;
      }).join("");
      tableHtml = `<div>
        <table class="tl-hist-table" style="table-layout:fixed;width:100%">
          <colgroup>
            <col style="width:40%">
            <col style="width:90px">
            <col style="width:64px">
            <col style="width:72px">
            <col style="width:72px">
            ${hasStreaming ? '<col style="width:90px">' : ""}
          </colgroup>
          <thead><tr>
            <th>${this._t("traTitle")}</th>
            <th>${this._t("traServer")}</th>
            ${sth("fileSize", this._t("traSize"), "right")}
            ${sth("addedAt", this._t("traAdded"))}
            ${sth("resolution", this._t("traResolution"))}
            ${hasStreaming ? sth("playCount", "Plays") : ""}
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    }
    const pagination = this._tlMobPag("tra-stale-page", page, totalP, true);
    if (isMob) return `${subTabs}<div class="tra-stale-results-wrap" style="display:contents">${tableHtml}</div>`;
    return `${subTabs}<div class="tra-stale-results-wrap" style="display:contents">${tableHtml}${pagination}</div>`;
  }
  _traStalePagHtml() {
    const m = this._tracearrModal;
    const page = m.stalePage || 0;
    const pp = m.stalePageSize || 10;
    const totalP = Math.max(1, Math.ceil((m.staleTotal || 0) / pp));
    return this._tlMobPag("tra-stale-page", page, totalP, true) || "";
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Watch tab (library analytics)
  // Partial refresh: only MW data rows (tbody innerHTML replacement)
  _traWatchTopRowsHtml() {
    const m = this._tracearrModal;
    if (!m) return "";
    const isMob = this._isMob;
    const _topTab = m.watchTopTab || "movies";
    const topItems = (_topTab === "movies" ? m.watchTopMovies : m.watchTopShows) || [];
    const fmtH = (h) => {
      if (h >= 24) return `${Math.floor(h / 24)}d ${Math.round(h % 24)}h`;
      return h >= 1 ? `${h.toFixed(1)}h` : `${Math.round(h * 60)}m`;
    };
    if (!topItems.length) {
      if (isMob) return `<div style="padding:16px;text-align:center;color:var(--is-text-muted);font-size:11px">${this._t("tlNoData")}</div>`;
      const ROW_H = "height:40px";
      return `<tr style="${ROW_H}"><td colspan="6" style="text-align:center;color:var(--is-text-muted);font-size:11px">${this._t("tlNoData")}</td></tr>`;
    }
    return topItems.slice(0, 5).map((it, i) => {
      const plays = it.plays ?? it.totalPlays ?? it.playCount ?? it.viewCount ?? it.watchCount ?? it.totalEpisodeViews ?? 0;
      const wh = it.watchHours ?? it.totalWatchHours ?? (it.totalWatchMs ? it.totalWatchMs / 36e5 : 0);
      const views = it.viewers ?? it.uniqueViewers ?? it.viewerCount ?? 1;
      const cr = it.completionRate ?? it.completion ?? it.avgCompletion ?? it.averageCompletion ?? it.episodeCompletionRate ?? it.avgEpisodeCompletion ?? it.avgCompletionRate ?? it.showCompletionRate ?? null;
      const cmplt = cr !== null ? cr > 1 ? Math.round(cr) : Math.round(cr * 100) : null;
      const title = it.title || it.showTitle || it.seriesTitle || "\u2014";
      const year = it.year ? ` (${it.year})` : "";
      if (isMob) {
        const metaParts = [
          plays ? `${plays}\xD7` : null,
          wh > 0 ? fmtH(wh) : null,
          views > 1 ? `${views} viewers` : null,
          cmplt !== null ? `${cmplt}%` : null
        ].filter(Boolean).join("  \xB7  ");
        return `<div class="tl-mob-card" style="display:grid;grid-template-columns:16px 1fr;row-gap:3px;column-gap:6px;align-items:center">
          <span style="font-size:9px;color:var(--is-text-muted);text-align:center;line-height:1">${i + 1}</span>
          <span style="font-size:12px;font-weight:600;display:flex;align-items:center;gap:5px;min-width:0"><span style="display:flex;flex-shrink:0">${this._tlMediaIcon(_topTab === "movies" ? "movie" : "episode", 15)}</span><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}<span style="font-weight:400;opacity:0.5;font-size:10px">${year}</span></span></span>
          <span></span>
          <span class="u-xs-muted">${metaParts}</span>
        </div>`;
      }
      const cmpltCell = cmplt !== null ? `<div style="display:flex;align-items:center;gap:5px;justify-content:flex-end">${this._traWatchPie(cmplt)}<span style="font-size:11px;color:var(--is-text-muted)">${cmplt}%</span></div>` : `<span style="font-size:10px;color:rgba(255,255,255,0.25)">\u2014</span>`;
      const ROW_H = "height:40px";
      return `<tr style="${ROW_H}">
        <td style="width:22px;font-size:10px;color:var(--is-text-muted);text-align:center">${i + 1}</td>
        <td style="font-size:11px;font-weight:600;color:var(--is-text);max-width:140px"><div style="display:flex;align-items:center;gap:5px;overflow:hidden">${this._tlMediaIcon(_topTab === "movies" ? "movie" : "episode", 15)}<span class="u-truncate">${title}${it.year ? ` <span style="color:var(--is-text-muted);font-weight:400">(${it.year})</span>` : ""}</span></div></td>
        <td style="font-size:11px;font-weight:600;color:var(--is-text);text-align:right">${plays}</td>
        <td style="font-size:10px;color:var(--is-text-muted);text-align:right">${wh > 0 ? fmtH(wh) : "\u2014"}</td>
        <td style="font-size:10px;color:var(--is-text-muted);text-align:right">${views}</td>
        <td style="text-align:right">${cmpltCell}</td>
      </tr>`;
    }).join("");
  }
  // ──────────────────────────────────────────────────────────────────────────
  _traBodyWatch() {
    const m = this._tracearrModal;
    const isMob = this._isMob;
    const pat = m.watchPatterns || {};
    const stat = m.watchStatus || {};
    const comp = m.watchCompletion || {};
    const topMovies = m.watchTopMovies || [];
    const topShows = m.watchTopShows || [];
    const fmtHours = (h) => {
      const hh = Math.floor(h);
      const mm = Math.round((h - hh) * 60);
      return hh > 0 ? mm > 0 ? `${hh}h ${mm}m` : `${hh}h` : `${mm}m`;
    };
    const fmtMs = (ms) => fmtHours(ms / 36e5);
    const pct = (a, b) => b > 0 ? Math.round(a / b * 100) : 0;
    const peakTimes = pat.peakTimes || {};
    const hourDist = peakTimes.hourlyDistribution || [];
    const hourMap = new Map(hourDist.map((r) => [r.hour, r.watchCount || 0]));
    const hourVals = Array.from({ length: 24 }, (_, h) => hourMap.get(h) || 0);
    const peakHour = peakTimes.peakHour ?? hourVals.indexOf(Math.max(...hourVals));
    const peakHourLabel = `${String(peakHour).padStart(2, "0")}:00`;
    const peakDayNum = peakTimes.peakDayOfWeek ?? null;
    const peakDay = peakDayNum !== null ? `(${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][peakDayNum] || ""})` : "";
    const seasonal = pat.seasonalTrends || {};
    const monthlyArr = seasonal.monthlyTrends || [];
    const busiestMonth = seasonal.busiestMonth || "";
    const quietestMonth = seasonal.quietestMonth || "";
    const totalWatchMs = monthlyArr.reduce((s, r) => s + (r.totalWatchMs || 0), 0);
    const completedCount = (comp.movie?.summary?.completedCount ?? 0) + (comp.episode?.summary?.completedCount ?? 0);
    const totalMovies = comp.movie?.summary?.totalItems ?? 0;
    const watchedMovies = (comp.movie?.summary?.completedCount ?? 0) + (comp.movie?.summary?.inProgressCount ?? 0);
    const totalShows = comp.episode?.summary?.totalItems ?? 0;
    const watchedShows = (comp.episode?.summary?.completedCount ?? 0) + (comp.episode?.summary?.inProgressCount ?? 0);
    const totalItems = totalMovies + totalShows || (stat.itemCount ?? 0);
    const watchedItems = watchedMovies + watchedShows || (m.watchedTotal ?? 0);
    const watchedPct = pct(watchedItems, totalItems);
    const binge = pat.bingeShows || [];
    m.watchBinge = binge;
    const bingeRatePct = Math.round(pat.summary?.bingeSessionsPct ?? 0);
    const _mdiSvg = (path, sz) => {
      const s = sz || 18;
      return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" style="flex-shrink:0;color:var(--is-text-muted)" fill="currentColor"><path d="${path}"/></svg>`;
    };
    const _mdiEye = "M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,19.5 12,4.5M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z";
    const _mdiClock = "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z";
    const _mdiCheck = "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z";
    const _mdiTrend = "M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z";
    const statCard = (iconSvg, val, sub) => isMob ? `<div class="tl-g-card" style="display:flex;align-items:center;gap:5px;padding:5px 7px">
          ${iconSvg.replace(/width="\d+" height="\d+"/, 'width="13" height="13"')}
          <div>
            <div style="font-size:12px;font-weight:800;color:var(--is-text);line-height:1">${val}</div>
            <div style="font-size:8px;color:var(--is-text-muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sub}</div>
          </div>
        </div>` : `<div class="tl-g-card" style="display:flex;align-items:center;gap:10px;padding:10px 12px">
          ${iconSvg}
          <div>
            <div style="font-size:14px;font-weight:800;color:var(--is-text);line-height:1">${val}</div>
            <div style="font-size:10px;color:var(--is-text-muted);margin-top:2px">${sub}</div>
          </div>
        </div>`;
    const statsRow = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:${isMob ? "4px" : "6px"};margin-bottom:8px">
      ${statCard(_mdiSvg(_mdiEye), watchedItems ? `${watchedItems}/${totalItems}` : totalItems ? `\u2014/${totalItems}` : "\u2014", isMob ? `${watchedPct}%` : `${this._t("traWatchedOf")} (${watchedPct}%)`)}
      ${statCard(_mdiSvg(_mdiClock), totalWatchMs ? fmtMs(totalWatchMs) : "\u2014", isMob ? "Watch Time" : this._t("traWatchTime"))}
      ${statCard(_mdiSvg(_mdiCheck), completedCount || "\u2014", isMob ? "Completed" : this._t("traCompletion"))}
      ${statCard(_mdiSvg(_mdiTrend), hourVals.some((v) => v > 0) ? `${peakHourLabel} ${peakDay}` : "\u2014", isMob ? "Peak Hour" : this._t("traPeakHour"))}
    </div>`;
    const _topTab = m.watchTopTab || "movies";
    const _period = m.watchPeriod || "30d";
    const _periodMap = { "7d": "7d", "30d": "30d", "90d": "90d", "all": "all" };
    const _periodLbl = isMob ? { "7d": "W", "30d": "M", "90d": "3M", "all": "All" } : { "7d": "Week", "30d": "Month", "90d": "Quarter", "all": "All" };
    const _topItems = _topTab === "movies" ? topMovies : topShows;
    const _periodBtns = _traSegHtml(Object.keys(_periodMap).map((p) => [p, _periodLbl[p]]), _period, "data-tra-w-period");
    const _topTabBtns = _traSegHtml([["movies", this._t("traMovies")], ["shows", "TV"]], _topTab, "data-tra-w-top");
    const _CARD_HDR = "min-height:42px;display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:nowrap;flex-shrink:0";
    const ROW_H = "height:40px";
    const mostWatched = isMob ? `<div class="tl-g-card u-col">
          <div style="${_CARD_HDR}">
            <span class="tl-graph-title">${this._t("traMostWatched")}</span>
            ${isMob ? `<div style="margin-left:auto;display:flex;align-items:center;gap:6px;flex-shrink:0">${_topTabBtns}<span class="mt-tb-sep"></span>${_periodBtns}</div>` : `<div class="mt-tb mt-tb--card" style="margin-left:auto;min-height:34px;padding:0 3px;gap:4px;flex-shrink:0">
                   ${_topTabBtns}<span class="mt-tb-sep"></span>${_periodBtns}
                 </div>`}
          </div>
          <div data-tra-watch-top style="display:flex;flex-direction:column;gap:6px">${this._traWatchTopRowsHtml()}</div>
        </div>` : `<div class="tl-g-card" style="height:100%;box-sizing:border-box;display:flex;flex-direction:column">
          <div style="${_CARD_HDR}">
            <span class="tl-graph-title">${this._t("traMostWatched")}</span>
            ${isMob ? `<div style="margin-left:auto;display:flex;align-items:center;gap:6px;flex-shrink:0">${_topTabBtns}<span class="mt-tb-sep"></span>${_periodBtns}</div>` : `<div class="mt-tb mt-tb--card" style="margin-left:auto;min-height:34px;padding:0 3px;gap:4px;flex-shrink:0">
                   ${_topTabBtns}<span class="mt-tb-sep"></span>${_periodBtns}
                 </div>`}
          </div>
          <div style="overflow-x:auto;flex:1">
            <table class="tl-hist-table" style="font-size:11px;width:100%">
              <thead><tr style="${ROW_H}">
                <th style="width:22px">#</th>
                <th>${this._t("traTitle")}</th>
                <th style="text-align:right">${this._t("traPlays")}</th>
                <th style="text-align:right">${this._t("traWatchHours")}</th>
                <th style="text-align:right">${this._t("traViewers")}</th>
                <th style="text-align:right">${this._t("traCompletion")}</th>
              </tr></thead>
              <tbody data-tra-watch-top>${this._traWatchTopRowsHtml()}</tbody>
            </table>
          </div>
        </div>`;
    const scoreTag2 = (score) => {
      const lbl = score >= 80 ? "highly addictive" : score >= 60 ? "addictive" : "bingeable";
      const [bg, txt] = lbl.includes("highly") ? ["rgba(255,59,48,0.18)", "#FF3B30"] : lbl.includes("addict") ? ["rgba(255,149,0,0.18)", "#FF9500"] : ["rgba(52,199,89,0.15)", "#34C759"];
      const dl = lbl.includes("highly") ? this._t("traHighlyAddictive") : lbl.includes("addict") ? this._t("traAddictive") : this._t("traBingeable");
      return `${this._uiBadge(`${dl}`, this._hexToRgbTriple(txt), { small: true })}`;
    };
    const bingeRows = binge.slice(0, 5).map((b) => {
      const show = b.showTitle ?? b.show ?? b.title ?? "\u2014";
      const eps = b.totalEpisodeWatches ?? b.episodes ?? "\u2014";
      const cons = b.consecutiveEpisodes ?? b.consecutive ?? "\u2014";
      const cp = b.consecutivePct ?? null;
      const bS = b.bingeScore ?? b.score ?? "\u2014";
      const maxP = b.maxEpisodesInOneDay ?? b.maxPerDay ?? "\u2014";
      if (isMob) {
        return `<div class="tl-mob-card" style="display:flex;flex-direction:column;gap:3px">
          <div class="u-row-6">
            <span style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;flex:1;min-width:0"><span style="display:flex;flex-shrink:0">${this._tlMediaIcon("episode", 13)}</span><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${show}</span></span>
            ${typeof bS === "number" ? scoreTag2(bS) : ""}
          </div>
          <div style="font-size:10px;color:var(--is-text-muted);display:flex;gap:8px;flex-wrap:wrap">
            <span>${eps} eps</span>
            <span>${cons}${cp !== null ? ` (${Math.round(cp)}%)` : ""} consec</span>
            <span>max ${maxP}/day</span>
          </div>
        </div>`;
      }
      return `<tr style="${ROW_H}">
        <td style="font-size:11px;font-weight:600;color:var(--is-text);max-width:110px"><div style="display:flex;align-items:center;gap:7px;min-width:0">${this._tlMediaIcon("episode", 15)}<span class="u-truncate">${show}</span></div></td>
        <td style="font-size:11px;color:var(--is-text-muted);text-align:center">${eps}</td>
        <td style="font-size:11px;color:var(--is-text-muted);text-align:center">${cons}${cp !== null ? ` <span style="font-size:9px">(${Math.round(cp)}%)</span>` : ""}</td>
        <td style="text-align:center">
          <span style="font-size:12px;font-weight:800;color:var(--is-text)">${bS}</span>
          ${typeof bS === "number" ? scoreTag2(bS) : ""}
        </td>
        <td style="font-size:11px;color:var(--is-text-muted);text-align:center">${maxP}</td>
      </tr>`;
    }).join("") || (isMob ? `<div style="padding:16px;text-align:center;color:var(--is-text-muted);font-size:11px">${this._t("tlNoData")}</div>` : `<tr style="${ROW_H}"><td colspan="5" style="text-align:center;color:var(--is-text-muted);font-size:11px">${this._t("tlNoData")}</td></tr>`);
    const _bingeHdr = `<div style="${_CARD_HDR}">
        <div>
          <span class="tl-graph-title">${this._t("traBingeHighlights")}</span>
          <div style="font-size:10px;color:var(--is-text-muted);margin-top:1px">Shows with the most intensive viewing patterns</div>
        </div>
        ${bingeRatePct > 0 ? `<span style="margin-left:auto;font-size:13px;font-weight:800;color:var(--is-text);flex-shrink:0">${bingeRatePct}% <span style="font-size:10px;color:var(--is-text-muted);font-weight:400">binge sessions</span></span>` : ""}
      </div>`;
    const bingeCard = isMob ? `<div class="tl-g-card u-col">
          ${_bingeHdr}
          <div style="display:flex;flex-direction:column;gap:6px">${bingeRows}</div>
        </div>` : `<div class="tl-g-card" style="height:100%;box-sizing:border-box;display:flex;flex-direction:column">
          ${_bingeHdr}
          <div style="overflow-x:auto;flex:1">
            <table class="tl-hist-table" style="font-size:11px;width:100%">
              <thead><tr style="${ROW_H}">
                <th>Show</th>
                <th style="text-align:center">Eps</th>
                <th style="text-align:center">${this._t("traConsecutive")}</th>
                <th style="text-align:center">${this._t("traBingeScore")}</th>
                <th style="text-align:center">${this._t("traMaxDay")}</th>
              </tr></thead>
              <tbody>${bingeRows}</tbody>
            </table>
          </div>
        </div>`;
    const _wHodTauFmt = (cats, series) => ({ response: { data: { categories: cats, series } } });
    const wHodRaw = _wHodTauFmt(
      Array.from({ length: 24 }, (_, h) => String(h)),
      [{ name: "Plays", data: hourVals }]
    );
    const wHodSvg = this._tlGBarSvg(wHodRaw, { isMob, height: isMob ? 70 : 80, chartId: "tra-whd", xLabel: (_, i) => i % 4 === 0 ? `${String(i).padStart(2, "0")}` : "" });
    const watchDonut = (label, watched, total, color) => {
      const remaining = Math.max(0, total - watched);
      const segs = [
        { label: this._t("traWatchedOf"), value: watched, color },
        { label: "Remaining", value: remaining, color: "rgba(255,255,255,0.12)" }
      ].filter((s) => s.value > 0);
      const ds = isMob ? 72 : 104;
      const pct2 = total ? Math.round(watched / total * 100) : 0;
      const legendItems = [
        { label: this._t("traWatchedOf"), value: watched, color, pct: pct2 },
        { label: "Remaining", value: remaining, color: "rgba(255,255,255,0.25)", pct: 100 - pct2 }
      ].filter((s) => s.value > 0).map(
        (s) => `<div style="display:flex;align-items:center;gap:5px;margin-bottom:4px">
          <span style="width:7px;height:7px;border-radius:2px;background:${s.color};flex-shrink:0"></span>
          <span style="font-size:10px;color:var(--is-text);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.label}</span>
          <span style="font-size:10px;font-weight:700;color:var(--is-text-muted)">${s.pct}%</span>
        </div>`
      ).join("");
      if (!total) return `<div class="tl-g-card" style="flex:1;box-sizing:border-box;display:flex;flex-direction:column"><span class="tl-graph-title">${label}</span><div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--is-text-muted)">No data</div></div>`;
      return `<div class="tl-g-card" style="flex:1;box-sizing:border-box;display:flex;flex-direction:column">
        <div style="margin-bottom:8px;flex-shrink:0"><span class="tl-graph-title">${label}</span></div>
        <div style="flex:1;display:flex;align-items:center;gap:12px">
          ${this._traDonutSvg(segs, ds)}
          <div style="flex:1;min-width:0">${legendItems}</div>
        </div>
      </div>`;
    };
    const moviesDonutCard = watchDonut(this._t("traMovies"), watchedMovies, totalMovies, "#007AFF");
    const showsDonutCard = watchDonut("TV Shows", watchedShows, totalShows, "#BF5AF2");
    const _tipEl = `<div class="tl-g-tip" style="display:none;position:absolute;top:0;left:0;background:var(--is-menu-bg,#18182a);border:1px solid var(--is-btn-bdr);border-radius:7px;padding:7px 10px;font-size:11px;pointer-events:none;z-index:50;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.3)"></div>`;
    const _badge = (txt, color, bg) => `${this._uiBadge(`${txt}`, this._hexToRgbTriple(color), { small: true })}`;
    const peakBadge = hourVals.some((v) => v > 0) ? _badge(`Peak: ${peakHourLabel}`, "var(--is-text)", "rgba(255,255,255,0.08)") : "";
    const viewingHoursCard = `<div class="tl-g-card" style="flex:1;box-sizing:border-box;display:flex;flex-direction:column;position:relative">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-shrink:0">
        <span class="tl-graph-title">${this._t("traViewingHours")}</span>
        ${peakBadge}
      </div>
      <div style="flex:1;position:relative">${wHodSvg}${_tipEl}</div>
    </div>`;
    const mArr = monthlyArr.slice(-12);
    const mN = mArr.length;
    const _mFmt = (cat) => {
      const [y, mo] = (cat || "").split("-");
      if (!y || !mo) return cat;
      return `${mo.padStart(2, "0")}-${y.slice(2)}`;
    };
    const mVals = mArr.map((r) => r.watchCount ?? r.count ?? r.plays ?? 0);
    const mMax = Math.max(1, ...mVals);
    const _MC = "#007AFF";
    const _mEsc = (v) => String(v).replace(/"/g, "&quot;");
    const mSvg = (() => {
      if (mN < 2) return "";
      const VBW = 1e3, SVH = 200, PL = 12, PR = 6, PT = 18, PB = 6;
      const cW = VBW - PL - PR, cH = SVH - PT - PB, baseY = PT + cH;
      const xOf = (i) => PL + i / (mN - 1) * cW;
      const yOf = (v) => PT + (1 - v / mMax) * cH;
      const pts = mVals.map((v, i) => ({ x: xOf(i), y: yOf(v), v, cat: _mFmt(mArr[i]?.month || "") }));
      const defs = `<defs>
        <linearGradient id="tra-mt-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${_MC}" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="${_MC}" stop-opacity="0"/>
        </linearGradient>
        <mask id="tra-mt-mask" maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="${VBW}" height="${SVH}" fill="white"/>
          ${pts.filter((p) => p.v > 0).map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="black"/>`).join("")}
        </mask>
      </defs>`;
      let inner = defs;
      inner += `<path d="${this._tlGSmoothArea(pts, baseY)}" style="fill:url(#tra-mt-g);animation:fade-in 0.8s ease-out both"/>`;
      inner += `<path d="${this._tlGSmoothLine(pts)}" fill="none" stroke="${_MC}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" class="tl-g-anim-line" mask="url(#tra-mt-mask)"/>`;
      pts.forEach((p) => {
        if (!p.v) return;
        inner += `<circle class="tl-g-dot" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" style="fill:transparent;stroke:${_MC};stroke-width:2.5;cursor:pointer" vector-effect="non-scaling-stroke" data-tl-g-dot="${_mEsc(JSON.stringify({ lbl: p.cat, name: "Watches", val: p.v, hex: _MC }))}"/>`;
      });
      const slotW = cW / mN;
      pts.forEach((p, i) => {
        const rx = i === 0 ? PL : p.x - slotW / 2;
        const rw = i === mN - 1 ? VBW - PR - rx : slotW;
        const td = _mEsc(JSON.stringify({ lbl: p.cat, tot: p.v, vals: [{ n: "Watches", v: p.v, fv: null, hex: _MC }] }));
        inner += `<g class="tl-g-lcol" data-tl-g-col="${td}" style="cursor:pointer"><rect class="tl-g-lhlt" x="${rx.toFixed(1)}" y="${PT}" width="${rw.toFixed(1)}" height="${cH}" style="fill:var(--tl-col-hlt);opacity:0"/><rect x="${rx.toFixed(1)}" y="${PT}" width="${rw.toFixed(1)}" height="${cH}" fill="transparent"/></g>`;
      });
      const svgEl = this._tlGSvgEl(inner, isMob ? 70 : 80);
      const xLbls = `<div style="position:relative;height:16px;margin-top:2px">
        <span style="position:absolute;left:0;font-size:9px;color:var(--is-text-muted)">${pts[0].cat}</span>
        <span style="position:absolute;right:0;font-size:9px;color:var(--is-text-muted)">${pts[mN - 1].cat}</span>
      </div>`;
      return this._tlGWrap(svgEl, xLbls, "");
    })();
    const mTags = `<div style="display:flex;gap:4px;flex-wrap:wrap">
      ${busiestMonth ? _badge(`${this._t("traBusiest")}: ${busiestMonth}`, "#34C759", "rgba(52,199,89,0.15)") : ""}
      ${quietestMonth && quietestMonth !== busiestMonth ? _badge(`${this._t("traQuietest")}: ${quietestMonth}`, "var(--is-text)", "rgba(255,255,255,0.08)") : ""}
    </div>`;
    const monthlyCard = `<div class="tl-g-card" style="flex:1;box-sizing:border-box;display:flex;flex-direction:column;position:relative">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;gap:4px;flex-wrap:wrap;flex-shrink:0">
        <span class="tl-graph-title">${this._t("traMonthlyTrends")}</span>
        ${mTags}
      </div>
      ${mN >= 2 ? `<div style="flex:1;position:relative">${mSvg}${_tipEl}</div>` : `<div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--is-text-muted)">No data</div>`}
    </div>`;
    if (isMob) {
      return `${statsRow}
        <div style="display:flex;flex-direction:column;gap:8px">
          ${mostWatched}${bingeCard}${moviesDonutCard}${showsDonutCard}${viewingHoursCard}${monthlyCard}
        </div>`;
    }
    return `${statsRow}
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;align-items:stretch">
        <div style="grid-column:span 2;display:flex;flex-direction:column">${mostWatched}</div>
        <div style="grid-column:span 2;display:flex;flex-direction:column">${bingeCard}</div>
        <div class="u-col">${moviesDonutCard}</div>
        <div class="u-col">${showsDonutCard}</div>
        <div class="u-col">${viewingHoursCard}</div>
        <div class="u-col">${monthlyCard}</div>
      </div>`;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Device Compatibility tab
  // ──────────────────────────────────────────────────────────────────────────
  _traBodyDevices() {
    const m = this._tracearrModal;
    if (!m) return "";
    const isMob = this._isMob;
    const sum = m.devicesData?.summary || {};
    const dh = m.devicesHealth?.data || [];
    const dhot = m.devicesHotspots?.data || [];
    const dmat = m.devicesMatrix || {};
    const dtu = m.devicesUsers?.data || [];
    const PAGE = 8;
    const period = m.devicesPeriod || "month";
    const _pLbl = isMob ? { week: "W", month: "M", year: "Y", all: "All" } : { week: "Week", month: "Month", year: "Year", all: "All" };
    const periodBtns = _traSegHtml(Object.entries(_pLbl), period, "data-tra-dev-period");
    const hdr = isMob ? "" : `<div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:10px">
      ${periodBtns}
    </div>`;
    const _dIco = (path) => `<svg viewBox="0 0 24 24" width="18" height="18" style="flex-shrink:0;color:var(--is-text-muted)" fill="currentColor"><path d="${path}"/></svg>`;
    const _dPlay = "M8,5.14V19.14L19,12.14L8,5.14Z";
    const _dScreen = "M21,16H3V4H21M21,2H3C1.89,2 1,2.89 1,4V16A2,2 0 0,0 3,18H10V20H8V22H16V20H14V18H21A2,2 0 0,0 23,16V4C23,2.89 22.1,2 21,2Z";
    const _dCodec = "M14.6,16.6L19.2,12L14.6,7.4L16,6L22,12L16,18L14.6,16.6M9.4,16.6L4.8,12L9.4,7.4L8,6L2,12L8,18L9.4,16.6Z";
    const _dCheck = "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z";
    const tile = (iconSvg, lbl, val) => isMob ? `<div class="tl-g-card" style="display:flex;align-items:center;gap:5px;padding:5px 7px">
          ${iconSvg.replace('width="18" height="18"', 'width="13" height="13"')}
          <div>
            <div style="font-size:12px;font-weight:800;color:var(--is-text);line-height:1">${val}</div>
            <div style="font-size:8px;color:var(--is-text-muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${lbl}</div>
          </div>
        </div>` : `<div class="tl-g-card" style="display:flex;align-items:center;gap:9px;padding:10px 12px">
          ${iconSvg}
          <div>
            <div style="font-size:14px;font-weight:800;color:var(--is-text);line-height:1">${val}</div>
            <div style="font-size:10px;color:var(--is-text-muted);margin-top:2px">${lbl}</div>
          </div>
        </div>`;
    const totalSess = sum.totalSessions ?? 0;
    const dpRaw = sum.directPlayPct ?? sum.directPlayRate ?? null;
    const dpN_s = dpRaw != null ? Math.round(Number(dpRaw)) : null;
    const dpFmt = dpN_s != null ? `${dpN_s}%` : "\u2014";
    const uDevices = sum.uniqueDevices ?? dh.length;
    const uCodecs = sum.uniqueCodecs ?? 0;
    const statsRow = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:${isMob ? "4px" : "6px"};margin-bottom:8px">
      ${tile(_dIco(_dPlay), isMob ? "Sessions" : "Total Sessions", totalSess)}
      ${tile(_dIco(_dCheck), isMob ? "Direct Play" : "Direct Play Rate", dpFmt)}
      ${tile(_dIco(_dScreen), isMob ? "Devices" : "Unique Devices", uDevices)}
      ${tile(_dIco(_dCodec), isMob ? "Codecs" : "Unique Codecs", uCodecs)}
    </div>`;
    const _pag = (view, page, total) => {
      const tot = Math.ceil(total / PAGE);
      if (tot <= 1) return `<div style="visibility:hidden;display:flex;align-items:center;gap:2px;flex-shrink:0">
        <button class="tl-page-btn" style="padding:2px 5px;font-size:13px">\u2039</button>
        <span style="font-size:10px;white-space:nowrap">1/1</span>
        <button class="tl-page-btn" style="padding:2px 5px;font-size:13px">\u203A</button>
      </div>`;
      const pd = page <= 0 ? "opacity:0.3;pointer-events:none" : "";
      const nd = page >= tot - 1 ? "opacity:0.3;pointer-events:none" : "";
      return `<div style="display:flex;align-items:center;gap:2px;flex-shrink:0">
        <button class="tl-page-btn" data-tra-dev-page="${view}-prev" style="padding:2px 5px;font-size:13px;${pd}">\u2039</button>
        <span style="font-size:10px;color:var(--is-text-muted);white-space:nowrap">${page + 1}/${tot}</span>
        <button class="tl-page-btn" data-tra-dev-page="${view}-next" style="padding:2px 5px;font-size:13px;${nd}">\u203A</button>
      </div>`;
    };
    const _lv = m.devicesLeftView || "health";
    const _hP = m.devHealthPage || 0;
    const _mP = m.devMatrixPage || 0;
    const _dpC = (p) => p >= 80 ? "#34C759" : p >= 50 ? "#FF9500" : "#FF3B30";
    const dhPage = dh.slice(_hP * PAGE, (_hP + 1) * PAGE);
    const healthRows = dhPage.map((d) => {
      const name = d.device || d.name || d.deviceType || "?";
      const sess = d.sessions ?? d.totalSessions ?? d.count ?? 0;
      const pct = Math.round(Number(d.directPlayPct ?? d.directPlayRate ?? d.directPlay ?? 0));
      const col = _dpC(pct);
      return `<div style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <span style="font-size:11px;font-weight:600;color:var(--is-text)">${name}</span>
          <span class="u-xs-muted">${sess} sessions&nbsp;<span style="font-weight:700;color:${col}">${pct}%</span></span>
        </div>
        <div style="height:5px;border-radius:3px;background:rgba(255,255,255,0.08);overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${col};border-radius:3px"></div>
        </div>
      </div>`;
    }).join("") || `<div style="color:var(--is-text-muted);font-size:11px;text-align:center;padding:14px">${this._t("tlNoData")}</div>`;
    const matCodecs = dmat.codecs || [];
    const matData = dmat.devices || [];
    const matDataPage = matData.slice(_mP * PAGE, (_mP + 1) * PAGE);
    const _mc = (p) => p >= 80 ? "rgba(52,199,89,0.18)" : p >= 50 ? "rgba(255,149,0,0.15)" : "rgba(255,59,48,0.15)";
    const _mt = (p) => p >= 80 ? "#34C759" : p >= 50 ? "#FF9500" : "#FF3B30";
    let matInner = `<div style="color:var(--is-text-muted);font-size:11px;text-align:center;padding:12px">${this._t("tlNoData")}</div>`;
    if (matCodecs.length && matDataPage.length) {
      const cW = `${Math.max(12, Math.floor(75 / matCodecs.length))}%`;
      const thCells = matCodecs.map(
        (c) => `<th style="text-align:center;font-size:10px;font-weight:600;color:var(--is-text-muted);padding:5px 8px;width:${cW}">${c}</th>`
      ).join("");
      const tRows = matDataPage.map((d) => {
        const dName = d.device || d.name || "?";
        const dSess = d.sessions ?? d.totalSessions ?? "";
        const dC = d.codecs || {};
        const cells = matCodecs.map((codec) => {
          const cell = dC[codec];
          if (!cell) return `<td style="text-align:center;color:rgba(255,255,255,0.2);font-size:10px;padding:5px 8px">\u2014</td>`;
          const p = Math.round(Number(cell.directPct ?? cell.directPlayRate ?? cell.rate ?? 0));
          const s = cell.sessions ?? cell.count ?? 0;
          return `<td style="text-align:center;background:${_mc(p)};padding:5px 8px">
            <div style="font-size:11px;font-weight:700;color:${_mt(p)}">${p}%</div>
            <div class="u-xxs-muted">${s}</div>
          </td>`;
        }).join("");
        return `<tr><td style="font-size:11px;font-weight:600;color:var(--is-text);padding:5px 8px">
          ${dName}${dSess ? `<div class="u-xxs-muted">${dSess} sessions</div>` : ""}
        </td>${cells}</tr>`;
      }).join("");
      matInner = `<table class="tl-hist-table" style="width:100%">
        <thead><tr>
          <th style="text-align:left;font-size:10px;font-weight:600;color:var(--is-text-muted);padding:5px 8px;width:20%">Device</th>
          ${thCells}
        </tr></thead>
        <tbody>${tRows}</tbody>
      </table>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;align-items:center">
        ${this._uiBadge(`\u226580% Direct`, this._hexToRgbTriple("#34C759"), { small: true })}
        ${this._uiBadge(`50-79%`, this._hexToRgbTriple("#FF9500"), { small: true })}
        ${this._uiBadge(`&lt;50%`, this._hexToRgbTriple("#FF3B30"), { small: true })}
      </div>`;
    }
    const leftCard = `<div class="tl-g-card" style="flex:1;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-shrink:0;gap:6px">
        <span class="tl-graph-title" style="font-size:11px">${_lv === "health" ? "Device Health" : "Compatibility Matrix"}</span>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          ${_traSegHtml([["health", "Health"], ["matrix", "Matrix"]], _lv, "data-tra-dev-left-tab")}
          ${_lv === "health" ? _pag("health", _hP, dh.length) : _pag("matrix", _mP, matData.length)}
        </div>
      </div>
      <div data-tra-dev-left-panel="health" style="flex:1;overflow-y:auto;${_lv === "health" ? "" : "display:none"}">${healthRows}</div>
      <div data-tra-dev-left-panel="matrix" style="flex:1;overflow-y:auto;${_lv === "matrix" ? "" : "display:none"}">${matInner}</div>
    </div>`;
    const _rv = m.devicesRightView || "hotspots";
    const _hoP = m.devHotspotsPage || 0;
    const _uP = m.devUsersPage || 0;
    const dhotPage = dhot.slice(_hoP * PAGE, (_hoP + 1) * PAGE);
    const _noData3 = `<tr><td colspan="3" style="text-align:center;color:var(--is-text-muted);font-size:11px;padding:12px">${this._t("tlNoData")}</td></tr>`;
    const hotRows = dhotPage.map((h) => {
      const dev = h.device || h.deviceType || "?";
      const vid = h.videoCodec || h.codec || "";
      const aud = h.audioCodec || "";
      const cod = [vid, aud].filter(Boolean).join(" + ") || h.codecCombination || "?";
      const tr = h.transcodeCount ?? h.transcodes ?? h.count ?? 0;
      const pct = Math.round(Number(h.pctOfTotalTranscodes ?? h.percentage ?? h.percent ?? 0));
      const pc = pct >= 50 ? "#FF3B30" : "#FF9500";
      const pb = pct >= 50 ? "rgba(255,59,48,0.12)" : "rgba(255,149,0,0.1)";
      return `<tr>
        <td style="padding:5px 0;font-size:11px;color:var(--is-text)">
          <div style="font-weight:600">${dev}</div>
          <div class="u-xs-muted">${cod}</div>
        </td>
        <td style="padding:5px 6px;font-size:11px;font-weight:700;color:var(--is-text);text-align:right">${tr}</td>
        <td style="padding:5px 0 5px 6px;text-align:right">${this._uiBadge(`${pct}%`, this._hexToRgbTriple(pc), { extra: "font-size:10px" })}</td>
      </tr>`;
    }).join("") || _noData3;
    const hotMobCards = dhotPage.map((h) => {
      const dev = h.device || h.deviceType || "?";
      const vid = h.videoCodec || h.codec || "";
      const aud = h.audioCodec || "";
      const cod = [vid, aud].filter(Boolean).join(" + ") || h.codecCombination || "?";
      const tr = h.transcodeCount ?? h.transcodes ?? h.count ?? 0;
      const pct = Math.round(Number(h.pctOfTotalTranscodes ?? h.percentage ?? h.percent ?? 0));
      const pc = pct >= 50 ? "#FF3B30" : "#FF9500";
      const pb = pct >= 50 ? "rgba(255,59,48,0.12)" : "rgba(255,149,0,0.1)";
      return `<div class="tl-mob-card" style="display:grid;grid-template-columns:1fr auto;gap:2px 8px;align-items:center">
        <span style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${dev}</span>
        ${this._uiBadge(`${pct}%`, this._hexToRgbTriple(pc), { extra: "font-size:10px" })}
        <span class="u-xs-muted">${cod}</span>
        <span style="font-size:10px;color:var(--is-text-muted);text-align:right">${tr} transcodes</span>
      </div>`;
    }).join("") || `<div style="color:var(--is-text-muted);font-size:11px;text-align:center;padding:14px">${this._t("tlNoData")}</div>`;
    const dtuPage = dtu.slice(_uP * PAGE, (_uP + 1) * PAGE);
    const tuRows = dtuPage.map((u) => {
      const name = u.identityName || u.username || u.displayName || "?";
      const av = u.avatar || u.avatarUrl || null;
      const sess = u.totalSessions ?? u.sessions ?? 0;
      const dpN = Math.round(Number(u.directPlayPct ?? u.directPlayRate ?? 0));
      const tr = u.transcodeCount ?? u.transcodes ?? 0;
      const pctN = Math.round(Number(u.pctOfTotalTranscodes ?? u.percentage ?? (sess ? tr / sess * 100 : 0)));
      const dc2 = dpN >= 80 ? "#34C759" : dpN >= 50 ? "#FF9500" : "#FF3B30";
      const db2 = dpN >= 80 ? "rgba(52,199,89,0.12)" : dpN >= 50 ? "rgba(255,149,0,0.1)" : "rgba(255,59,48,0.12)";
      const avEl = av ? `<img src="${av}" width="20" height="20" style="border-radius:50%;object-fit:cover;flex-shrink:0">` : `<div style="width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,0.1);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--is-text-muted)">${(name[0] || "?").toUpperCase()}</div>`;
      return `<tr>
        <td style="padding:6px 0;font-size:11px;font-weight:600;color:var(--is-text)">
          <div class="u-row-6">${avEl}<span>${name}</span></div>
        </td>
        <td style="padding:6px 6px;font-size:11px;text-align:right;color:var(--is-text)">${sess}</td>
        <td style="padding:6px 6px;text-align:right">${this._uiBadge(`${dpN}%`, this._hexToRgbTriple(dc2), { extra: "font-size:10px" })}</td>
        <td style="padding:6px 6px;font-size:11px;text-align:right;color:var(--is-text)">${tr}</td>
        <td style="padding:6px 0;text-align:right">${this._uiBadge(`${pctN}%`, this._hexToRgbTriple("#FF3B30"), { extra: "font-size:10px" })}</td>
      </tr>`;
    }).join("");
    const usersMobCards = dtuPage.map((u) => {
      const name = u.identityName || u.username || u.displayName || "?";
      const av = u.avatar || u.avatarUrl || null;
      const sess = u.totalSessions ?? u.sessions ?? 0;
      const dpN = Math.round(Number(u.directPlayPct ?? u.directPlayRate ?? 0));
      const tr = u.transcodeCount ?? u.transcodes ?? 0;
      const pctN = Math.round(Number(u.pctOfTotalTranscodes ?? u.percentage ?? (sess ? tr / sess * 100 : 0)));
      const dc2 = dpN >= 80 ? "#34C759" : dpN >= 50 ? "#FF9500" : "#FF3B30";
      const db2 = dpN >= 80 ? "rgba(52,199,89,0.12)" : dpN >= 50 ? "rgba(255,149,0,0.1)" : "rgba(255,59,48,0.12)";
      const avEl = av ? `<img src="${av}" width="18" height="18" style="border-radius:50%;object-fit:cover;flex-shrink:0">` : `<div style="width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,0.1);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:8px;color:var(--is-text-muted)">${(name[0] || "?").toUpperCase()}</div>`;
      return `<div class="tl-mob-card" style="display:grid;grid-template-columns:1fr auto;gap:2px 8px;align-items:center">
        <div style="display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden">
          ${avEl}
          <span style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</span>
        </div>
        ${this._uiBadge(`${dpN}% direct`, this._hexToRgbTriple(dc2), { extra: "font-size:10px" })}
        <span class="u-xs-muted">${sess} sess \xB7 ${tr} transcodes</span>
        <span style="font-size:10px;color:var(--is-text-muted);text-align:right">${pctN}% total</span>
      </div>`;
    }).join("") || `<div style="color:var(--is-text-muted);font-size:11px;text-align:center;padding:14px">${this._t("tlNoData")}</div>`;
    const usersHtml = tuRows ? `<table class="tl-hist-table" style="width:100%">
          <thead><tr>
            <th style="text-align:left;font-size:10px;color:var(--is-text-muted);padding-bottom:5px">User</th>
            <th style="text-align:right;font-size:10px;color:var(--is-text-muted);padding-bottom:5px;padding-right:6px">Sessions</th>
            <th style="text-align:right;font-size:10px;color:var(--is-text-muted);padding-bottom:5px;padding-right:6px">Direct Play</th>
            <th style="text-align:right;font-size:10px;color:var(--is-text-muted);padding-bottom:5px;padding-right:6px">Transcodes</th>
            <th style="text-align:right;font-size:10px;color:var(--is-text-muted);padding-bottom:5px">% of Total</th>
          </tr></thead>
          <tbody>${tuRows}</tbody>
        </table>` : `<div style="color:var(--is-text-muted);font-size:11px;text-align:center;padding:12px">${this._t("tlNoData")}</div>`;
    const rightCard = `<div class="tl-g-card" style="flex:1;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-shrink:0;gap:6px">
        <span class="tl-graph-title" style="font-size:11px">${_rv === "hotspots" ? "Transcode Hotspots" : "Top Transcoding Users"}</span>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          ${_traSegHtml([["hotspots", "Hotspots"], ["users", "Users"]], _rv, "data-tra-dev-right-tab")}
          ${_rv === "hotspots" ? _pag("hotspots", _hoP, dhot.length) : _pag("users", _uP, dtu.length)}
        </div>
      </div>
      <div data-tra-dev-panel="hotspots" style="flex:1;overflow-y:auto;${_rv === "hotspots" ? "" : "display:none"}">
        <table class="tl-hist-table" style="width:100%">
          <thead><tr>
            <th style="text-align:left;font-size:10px;color:var(--is-text-muted);padding-bottom:5px">Device + Codec</th>
            <th style="text-align:right;font-size:10px;color:var(--is-text-muted);padding-bottom:5px;padding-right:6px">Transcodes</th>
            <th style="text-align:right;font-size:10px;color:var(--is-text-muted);padding-bottom:5px">% of Total</th>
          </tr></thead>
          <tbody>${hotRows}</tbody>
        </table>
      </div>
      <div data-tra-dev-panel="users" style="flex:1;overflow-y:auto;${_rv === "users" ? "" : "display:none"}">${usersHtml}</div>
    </div>`;
    if (isMob) {
      const mobView = m.devMobView || m.devicesLeftView || "health";
      const mobNav = `<div class="tra-dev-bar" style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-shrink:0">
        ${_traSegHtml([["health", "Health"], ["matrix", "Matrix"], ["hotspots", "Hotspots"], ["users", "Users"]], mobView, "data-tra-dev-mob-tab", "flex:1;min-width:0")}
        <span class="mt-tb-sep"></span>
        ${_traSegHtml(Object.entries(_pLbl), period, "data-tra-dev-period", "flex-shrink:0")}
      </div>`;
      const _panelTitle = { health: "Device Health", matrix: "Compatibility Matrix", hotspots: "Transcode Hotspots", users: "Top Transcoding Users" };
      const _panelContent = {
        health: `<div style="display:flex;flex-direction:column;gap:6px">${healthRows}</div>`,
        matrix: matInner,
        hotspots: `<div style="display:flex;flex-direction:column;gap:6px">${hotMobCards}</div>`,
        users: `<div style="display:flex;flex-direction:column;gap:6px">${usersMobCards}</div>`
      };
      const _panelPag = {
        health: _pag("health", _hP, dh.length),
        matrix: _pag("matrix", _mP, matData.length),
        hotspots: _pag("hotspots", _hoP, dhot.length),
        users: _pag("users", _uP, dtu.length)
      };
      const mobPanel = `<div class="tl-g-card u-col">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-shrink:0">
          <span class="tl-graph-title" style="font-size:11px">${_panelTitle[mobView] || ""}</span>
          ${_panelPag[mobView] || ""}
        </div>
        ${_panelContent[mobView] || ""}
      </div>`;
      return `<div class="u-col-fill">${mobNav}${statsRow}${mobPanel}</div>`;
    }
    const twoColRow = `<div style="display:flex;gap:8px;flex:1;min-height:0;align-items:stretch">
      <div style="flex:0 0 calc(50% - 4px);min-width:0;min-height:0;display:flex;flex-direction:column">
        ${leftCard}
      </div>
      <div style="flex:1;min-width:0;min-height:0;display:flex;flex-direction:column">
        ${rightCard}
      </div>
    </div>`;
    return `<div class="u-col-fill">${hdr}${statsRow}${twoColRow}</div>`;
  }
  // ──────────────────────────────────────────────────────────────────────────
  _traBodyBandwidth() {
    const m = this._tracearrModal;
    if (!m) return "";
    const isMob = this._isMob;
    const sum = m.bwSummary || {};
    const _bd = m.bwDaily;
    const daily = Array.isArray(_bd) ? _bd : _bd?.data || _bd?.daily || _bd?.items || [];
    const _bu = m.bwUsers;
    const users = Array.isArray(_bu) ? _bu : _bu?.data || _bu?.users || _bu?.items || [];
    const _fmtGb = (gb) => {
      if (gb == null) return "\u2014";
      const n = Number(gb);
      return n >= 1024 ? `${(n / 1024).toFixed(2)} TB` : `${n.toFixed(1)} GB`;
    };
    const _fmtHrs = (h) => {
      if (h == null) return "\u2014";
      const n = Number(h);
      return n >= 24 ? `${Math.floor(n / 24)}d ${Math.round(n % 24)}h` : `${n.toFixed(1)}h`;
    };
    const _fmtBr = (mbps) => mbps != null ? `${Number(mbps).toFixed(1)} Mbps` : "\u2014";
    const period = m.bwPeriod || "month";
    const _BW_P_LBLS = isMob ? { week: "W", month: "M", year: "Y", all: "All" } : { week: "Week", month: "Month", year: "Year", all: "All" };
    const periodBtns = _traSegHtml(["week", "month", "year", "all"].map((p) => [p, _BW_P_LBLS[p]]), period, "data-tra-bw-period");
    const _ico = (path) => `<svg viewBox="0 0 24 24" width="18" height="18" style="flex-shrink:0;color:var(--is-text-muted)" fill="currentColor"><path d="${path}"/></svg>`;
    const _mdiPlay = "M8,5.14V19.14L19,12.14L8,5.14Z";
    const _mdiDB = "M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z";
    const _mdiWifi = "M1,9L3,11C7.97,6.03 16.03,6.03 21,11L23,9C16.93,2.93 7.08,2.93 1,9M9,17L12,20L15,17C13.35,15.36 10.66,15.36 9,17M5,13L7,15C9.76,12.24 14.24,12.24 17,15L19,13C15.14,9.14 8.87,9.14 5,13Z";
    const _mdiClock = "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z";
    const _mdiPeople = "M16,13C15.71,13 15.38,13.03 15.03,13.08C16.19,13.89 17,15 17,16.5V19H23V16.5C23,14.17 18.33,13 16,13M8,13C5.67,13 1,14.17 1,16.5V19H15V16.5C15,14.17 10.33,13 8,13M8,11A3,3 0 0,0 11,8A3,3 0 0,0 8,5A3,3 0 0,0 5,8A3,3 0 0,0 8,11M16,11A3,3 0 0,0 19,8A3,3 0 0,0 16,5A3,3 0 0,0 13,8A3,3 0 0,0 16,11Z";
    const tile = (iconSvg, lbl, val) => isMob ? `<div class="tl-g-card" style="display:flex;align-items:center;gap:5px;padding:5px 7px">
          ${iconSvg.replace('width="18" height="18"', 'width="13" height="13"')}
          <div>
            <div style="font-size:12px;font-weight:800;color:var(--is-text);line-height:1">${val}</div>
            <div style="font-size:8px;color:var(--is-text-muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${lbl}</div>
          </div>
        </div>` : `<div class="tl-g-card" style="display:flex;align-items:center;gap:9px;padding:10px 12px">
          ${iconSvg}
          <div>
            <div style="font-size:14px;font-weight:800;color:var(--is-text);line-height:1">${val}</div>
            <div style="font-size:10px;color:var(--is-text-muted);margin-top:2px">${lbl}</div>
          </div>
        </div>`;
    const avgBrLbl = sum.peakBitrateMbps != null ? `Avg \xB7 Peak ${_fmtBr(sum.peakBitrateMbps)}` : "Avg Bitrate";
    const statsRow = isMob ? `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:8px">
          ${tile(_ico(_mdiPlay), "Sessions", sum.totalSessions ?? 0)}
          ${tile(_ico(_mdiDB), "Data", _fmtGb(sum.totalGb))}
          ${tile(_ico(_mdiWifi), "Avg Bitrate", _fmtBr(sum.avgBitrateMbps))}
          ${tile(_ico(_mdiPeople), "Users", sum.uniqueUsers ?? 0)}
        </div>` : `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:8px">
          ${tile(_ico(_mdiPlay), "Total Sessions", sum.totalSessions ?? 0)}
          ${tile(_ico(_mdiDB), "Data Transferred", _fmtGb(sum.totalGb))}
          ${tile(_ico(_mdiWifi), avgBrLbl, _fmtBr(sum.avgBitrateMbps))}
          ${tile(_ico(_mdiClock), "Total Watch Time", _fmtHrs(sum.totalHours))}
          ${tile(_ico(_mdiPeople), "Unique Users", sum.uniqueUsers ?? 0)}
        </div>`;
    const chartHtml = (() => {
      const VBW = 1e3, SVH = 200, PL = 6, PR = 6, PT = 18, PB = 6;
      const cW = VBW - PL - PR, cH = SVH - PT - PB, baseY = PT + cH;
      if (!daily.length) {
        return `<svg class="tl-g-svg" viewBox="0 0 ${VBW} ${SVH}" width="100%" height="160" preserveAspectRatio="none">
          <text x="${VBW / 2}" y="${SVH / 2}" text-anchor="middle" dominant-baseline="middle" style="fill:var(--is-text-muted);font-size:22">No data</text>
        </svg>`;
      }
      const maxGb = Math.max(...daily.map((d) => Number(d.totalGb || 0)), 0.01);
      const maxSess = Math.max(...daily.map((d) => Number(d.sessions || 0)), 1);
      const n = daily.length;
      const slotW = cW / n;
      const bwFrac = n <= 7 ? 0.5 : n <= 14 ? 0.55 : Math.min(0.65, Math.max(0.14, 42 / slotW));
      const bw = Math.max(4, slotW * bwFrac);
      const rr = Math.min(bw * 0.38, 10);
      const BAR_HEX = "#34C759";
      const LINE_HEX = "#007AFF";
      const roundTop = (x, y, w, h, r) => {
        r = Math.min(r, h / 2, w / 2);
        if (r < 0.5) return `M${x},${y + h} L${x},${y} L${x + w},${y} L${x + w},${y + h} Z`;
        const f = (v) => v.toFixed(2);
        return `M${f(x)},${f(y + h)} L${f(x)},${f(y + r)} Q${f(x)},${f(y)} ${f(x + r)},${f(y)} L${f(x + w - r)},${f(y)} Q${f(x + w)},${f(y)} ${f(x + w)},${f(y + r)} L${f(x + w)},${f(y + h)} Z`;
      };
      let bars = "", delay = 0;
      daily.forEach((d, i) => {
        const gb = Number(d.totalGb || 0);
        if (!gb) return;
        const h = gb / maxGb * cH;
        const x = PL + i * slotW + (slotW - bw) / 2;
        const y = baseY - h;
        bars += `<path d="${roundTop(x, y, bw, h, rr)}" style="fill:url(#bwbg);animation-delay:${(delay * 0.012).toFixed(2)}s" class="tl-g-anim-bar"/>`;
        delay++;
      });
      const sessCoords = daily.map((d, i) => ({
        x: PL + i * slotW + slotW / 2,
        y: PT + cH - Number(d.sessions || 0) / maxSess * cH
      }));
      let areaD = `M${sessCoords[0].x.toFixed(1)},${baseY}`;
      sessCoords.forEach((p) => {
        areaD += ` L${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      });
      areaD += ` L${sessCoords[sessCoords.length - 1].x.toFixed(1)},${baseY} Z`;
      const sessPts = sessCoords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
      const gbFmt = (v) => v >= 1024 ? `${(v / 1024).toFixed(1)}T` : v < 10 ? `${v.toFixed(1)}` : `${Math.round(v)}`;
      const yTicksL = [0, 0.5, 1].map((f) => ({
        y: (PT + cH - f * cH).toFixed(1),
        lbl: f > 0 ? gbFmt(maxGb * f) : ""
      }));
      const yTicksR = [0, 0.5, 1].map((f) => ({
        y: (PT + cH - f * cH).toFixed(1),
        lbl: f > 0 ? String(Math.round(maxSess * f)) : ""
      }));
      const showEvery = Math.max(1, Math.ceil(n / 8));
      const xLabelPcts = [];
      daily.forEach((d, i) => {
        if (i % showEvery !== 0 && i !== n - 1) return;
        const dt = new Date(d.date || "");
        const lbl = isNaN(dt.getTime()) ? "" : `${dt.getMonth() + 1}/${dt.getDate()}`;
        if (!lbl) return;
        xLabelPcts.push({ pct: ((PL + i * slotW + slotW / 2) / VBW * 100).toFixed(1), lbl, first: i === 0, last: i === n - 1 });
      });
      const xLabelsHtml = xLabelPcts.length ? `<div class="tl-g-x-labels">${xLabelPcts.map((l) => {
        const a = l.first ? "translateX(0)" : l.last ? "translateX(-100%)" : "translateX(-50%)";
        return `<span style="position:absolute;left:${l.pct}%;transform:${a};font-size:10px;color:var(--is-text-muted);white-space:nowrap;line-height:1">${l.lbl}</span>`;
      }).join("")}</div>` : "";
      const _escBw = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
      const hitColsBw = daily.map((d, i) => {
        const gb = Number(d.totalGb || 0);
        const sess = Number(d.sessions || 0);
        const dt = new Date(d.date || "");
        const lbl = isNaN(dt.getTime()) ? d.date || "" : `${dt.getMonth() + 1}/${dt.getDate()}`;
        const td = _escBw(JSON.stringify({
          lbl,
          tot: null,
          vals: [
            { n: "Data", fv: _fmtGb(gb), hex: BAR_HEX },
            { n: "Sessions", fv: String(sess), hex: LINE_HEX },
            { n: "Avg bitrate", fv: _fmtBr(d.avgBitrateMbps || 0), hex: "var(--is-text-muted)" }
          ]
        }));
        const rx = (PL + i * slotW).toFixed(1);
        const rw = slotW.toFixed(1);
        return `<g class="tl-g-lcol" data-tl-g-col="${td}" style="cursor:pointer"><rect class="tl-g-lhlt" x="${rx}" y="${PT}" width="${rw}" height="${cH}" style="fill:rgba(255,255,255,0.08);opacity:0"/><rect x="${rx}" y="${PT}" width="${rw}" height="${cH}" fill="transparent"/></g>`;
      }).join("");
      const svgInner = `
        <defs>
          <linearGradient id="bwbg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="${BAR_HEX}" stop-opacity="0.92"/>
            <stop offset="100%" stop-color="${BAR_HEX}" stop-opacity="0.42"/>
          </linearGradient>
          <linearGradient id="bwag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="${LINE_HEX}" stop-opacity="0.18"/>
            <stop offset="100%" stop-color="${LINE_HEX}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${[0, 0.5, 1].map((f) => `<line x1="${PL}" y1="${(PT + cH - f * cH).toFixed(1)}" x2="${VBW - PR}" y2="${(PT + cH - f * cH).toFixed(1)}" stroke="rgba(255,255,255,${f === 0 ? "0.08" : "0.05"})" stroke-width="1" ${f === 0.5 ? 'stroke-dasharray="4 3"' : ""}/>`).join("")}
        ${bars}
        <path d="${areaD}" fill="url(#bwag)" style="animation:fade-in 0.8s ease-out both"/>
        <polyline points="${sessPts}" fill="none" stroke="${LINE_HEX}" stroke-width="2" vector-effect="non-scaling-stroke" class="tl-g-anim-line"/>
        ${hitColsBw}
      `;
      const SVGH_DISP = 110;
      const mapY = (svgY) => (parseFloat(svgY) / SVH * SVGH_DISP).toFixed(1);
      const PW = 38;
      const yHtmlL = yTicksL.filter((t) => t.lbl).map(
        (t) => `<span style="position:absolute;right:2px;top:${mapY(t.y)}px;transform:translateY(-50%);font-size:9px;line-height:1;color:#34C759;white-space:nowrap">${t.lbl}</span>`
      ).join("");
      const yHtmlR = yTicksR.filter((t) => t.lbl).map(
        (t) => `<span style="position:absolute;left:2px;top:${mapY(t.y)}px;transform:translateY(-50%);font-size:9px;line-height:1;color:rgba(107,170,255,0.85);white-space:nowrap">${t.lbl}</span>`
      ).join("");
      return `<div style="position:relative;padding-left:${PW}px;padding-right:${PW}px">
        <div style="position:absolute;left:0;top:0;width:${PW}px;height:${SVGH_DISP}px;overflow:visible">
          <span style="position:absolute;left:0;top:0;width:${PW}px;height:${SVGH_DISP}px;display:flex;align-items:center;justify-content:center">
            <span style="writing-mode:vertical-rl;transform:rotate(180deg);font-size:9px;color:rgba(52,199,89,0.7);white-space:nowrap">GB</span>
          </span>
          ${yHtmlL}
        </div>
        <div style="position:absolute;right:0;top:0;width:${PW}px;height:${SVGH_DISP}px;overflow:visible">
          <span style="position:absolute;left:0;top:0;width:${PW}px;height:${SVGH_DISP}px;display:flex;align-items:center;justify-content:center">
            <span style="writing-mode:vertical-rl;font-size:9px;color:rgba(107,170,255,0.7);white-space:nowrap">Sessions</span>
          </span>
          ${yHtmlR}
        </div>
        <svg class="tl-g-svg" viewBox="0 0 ${VBW} ${SVH}" width="100%" height="${SVGH_DISP}" preserveAspectRatio="none">${svgInner}</svg>
        ${xLabelsHtml}
      </div>
      <div style="display:flex;gap:12px;justify-content:center;margin-top:6px">
        <div class="u-row-5"><div style="width:10px;height:10px;border-radius:2px;background:${BAR_HEX};opacity:0.7"></div><span class="u-xs-muted">Data (GB)</span></div>
        <div class="u-row-5"><div style="width:12px;height:3px;border-radius:2px;background:${LINE_HEX}"></div><span class="u-xs-muted">Sessions</span></div>
      </div>`;
    })();
    const _tipEl = `<div class="tl-g-tip" style="display:none;position:absolute;top:0;left:0;background:var(--is-menu-bg,#18182a);border:1px solid var(--is-btn-bdr);border-radius:7px;padding:7px 10px;font-size:11px;pointer-events:none;z-index:50;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.3)"></div>`;
    const chartCard = `<div class="tl-g-card" style="margin-bottom:8px;flex-shrink:0;position:relative">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <span class="tl-graph-title" style="font-size:11px">Daily Bandwidth Usage</span>
        ${periodBtns}
      </div>
      ${chartHtml}
      ${_tipEl}
    </div>`;
    const BW_PAGE = isMob ? Math.max(2, Math.floor((window.innerHeight * 0.88 - 500) / 60)) : 5;
    m.bwPageSize = BW_PAGE;
    const bwPage = m.bwUsersPage || 0;
    const bwTotal = users.length;
    const bwPages = Math.max(1, Math.ceil(bwTotal / BW_PAGE));
    const pageUsers = users.slice(bwPage * BW_PAGE, (bwPage + 1) * BW_PAGE);
    const userRows = pageUsers.map((u, i) => {
      const rank = bwPage * BW_PAGE + i + 1;
      const name = u.identityName || u.username || u.displayName || "?";
      const av = u.thumbUrl || u.avatarUrl || u.avatar || null;
      const avEl = av ? `<img src="${av}" width="22" height="22" style="border-radius:50%;object-fit:cover;flex-shrink:0">` : `<div style="width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,0.1);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--is-text-muted)">${(name[0] || "?").toUpperCase()}</div>`;
      return `<tr>
        <td style="padding:6px 8px;font-size:11px;color:var(--is-text-muted);text-align:center;width:28px">${rank}</td>
        <td style="padding:6px 0;font-size:11px;font-weight:600;color:var(--is-text)">
          <div style="display:flex;align-items:center;gap:7px">${avEl}<span>${name}</span></div>
        </td>
        <td style="padding:6px 8px;font-size:11px;text-align:right;color:var(--is-text)">${u.sessions ?? 0}</td>
        <td style="padding:6px 8px;font-size:11px;text-align:right;color:var(--is-text)">${_fmtGb(u.totalGb)}</td>
        <td style="padding:6px 8px;font-size:11px;text-align:right;color:var(--is-text)">${_fmtHrs(u.totalHours)}</td>
        <td style="padding:6px 0;text-align:right">${this._uiBadge(`${_fmtBr(u.avgBitrateMbps)}`, this._hexToRgbTriple("#FF9500"), { extra: "font-size:10px" })}</td>
      </tr>`;
    }).join("") || `<tr><td colspan="6" style="text-align:center;color:var(--is-text-muted);font-size:11px;padding:14px">No data</td></tr>`;
    const userMobCards = pageUsers.map((u, i) => {
      const rank = bwPage * BW_PAGE + i + 1;
      const name = u.identityName || u.username || u.displayName || "?";
      const av = u.thumbUrl || u.avatarUrl || u.avatar || null;
      const avEl = av ? `<img src="${av}" width="18" height="18" style="border-radius:50%;object-fit:cover;flex-shrink:0">` : `<div style="width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,0.1);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:8px;color:var(--is-text-muted)">${(name[0] || "?").toUpperCase()}</div>`;
      const metaParts = [
        `${u.sessions ?? 0} sess`,
        _fmtHrs(u.totalHours) !== "\u2014" ? _fmtHrs(u.totalHours) : null
      ].filter(Boolean).join("  \xB7  ");
      return `<div class="tl-mob-card" style="display:grid;grid-template-columns:16px 1fr auto;gap:2px 6px;align-items:center">
        <span style="font-size:9px;color:var(--is-text-muted);text-align:center;line-height:1">${rank}</span>
        <div style="display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden">${avEl}<span style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</span></div>
        <span style="font-size:11px;font-weight:700;color:var(--is-text)">${_fmtGb(u.totalGb)}</span>
        <span></span>
        <span class="u-xs-muted">${metaParts}</span>
        ${this._uiBadge(`${_fmtBr(u.avgBitrateMbps)}`, this._hexToRgbTriple("#FF9500"), { extra: "font-size:10px" })}
      </div>`;
    }).join("") || `<div style="color:var(--is-text-muted);font-size:11px;text-align:center;padding:14px">No data</div>`;
    const bwPaging = this._tlMobPag("tra-bw-users-page", bwPage, bwPages, true);
    if (isMob) {
      return `<div style="display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;margin:-10px -12px -16px">
        <div style="flex:1;min-height:0;overflow-y:auto;padding:10px 12px 0">
          ${statsRow}${chartCard}
          <div class="tl-g-card" style="display:flex;flex-direction:column;margin-bottom:0">
            <div style="margin-bottom:8px;flex-shrink:0"><span class="tl-graph-title" style="font-size:11px">Top Bandwidth Users</span></div>
            <div style="display:flex;flex-direction:column;gap:6px">${userMobCards}</div>
          </div>
        </div>
        <div style="flex-shrink:0;padding:4px 12px 8px">${bwPaging}</div>
      </div>`;
    }
    const usersCard = `<div class="tl-g-card" style="flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column">
      <div style="margin-bottom:8px;flex-shrink:0">
        <span class="tl-graph-title" style="font-size:11px">Top Bandwidth Users</span>
      </div>
      <div style="flex:1;overflow-y:auto;min-height:0">
        <table class="tl-hist-table" style="width:100%">
          <thead><tr>
            <th style="text-align:center;width:28px">#</th>
            <th style="text-align:left">User</th>
            <th style="text-align:right;padding-right:8px">Sessions</th>
            <th style="text-align:right;padding-right:8px">Data</th>
            <th style="text-align:right;padding-right:8px">Watch Time</th>
            <th style="text-align:right">Avg Bitrate</th>
          </tr></thead>
          <tbody>${userRows}</tbody>
        </table>
      </div>
      ${bwPaging}
    </div>`;
    return `<div class="u-col-fill">${statsRow}${chartCard}${usersCard}</div>`;
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Stats → Users tab
  // ──────────────────────────────────────────────────────────────────────────
  _traBodyStatsUsers() {
    const m = this._tracearrModal;
    if (!m) return "";
    const isMob = this._isMob;
    const isTablet = !isMob && window.matchMedia("(max-width:860px)").matches;
    const users = m.statsUsersData || [];
    const period = m.statsUsersPeriod || "month";
    const _pLbl = isMob ? { week: "W", month: "M", year: "Y", all: "All" } : { week: "Week", month: "Month", year: "Year", all: "All" };
    const periodBtns = _traSegHtml(Object.entries(_pLbl), period, "data-tra-su-period");
    const hdr = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${isMob ? 10 : 12}px">
      <div class="u-row-6">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--is-text-muted)"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>
        <span style="font-size:${isMob ? 11 : 13}px;font-weight:700;color:var(--is-text)">Top 3</span>
      </div>
      ${periodBtns}
    </div>`;
    if (!users.length) return hdr + `<div style="text-align:center;color:var(--is-text-muted);font-size:13px;padding:40px">${this._t("tlNoData")}</div>`;
    const _fmtHr = (h) => {
      if (h == null) return null;
      const n = Number(h);
      if (isNaN(n)) return null;
      const hrs = n > 1e3 ? n / 60 : n;
      return hrs >= 1 ? `${hrs.toFixed(1)}h` : `${Math.round(hrs * 60)}m`;
    };
    const podiumOrder = [users[1], users[0], users[2]].filter(Boolean);
    const medals = ["\u{1F948}", "\u{1F947}", "\u{1F949}"];
    const borders = ["#C0C0C0", "#FFD700", "#CD7F32"];
    const playsColors = ["rgba(200,200,200,0.9)", "#34C759", "#CD7F32"];
    const isGold = [false, true, false];
    const _mkCard = (u, di) => {
      const gold = isGold[di];
      const name = u.identityName || u.displayName || u.username || "?";
      const av = u.thumbUrl || u.avatarUrl || u.avatar || null;
      const plays = u.playCount ?? u.plays ?? u.totalPlays ?? u.sessions ?? 0;
      const hrs = _fmtHr(u.watchTimeHours ?? u.totalDuration ?? u.watchTime ?? u.totalHours ?? null);
      const trust = u.trustScore ?? u.trust ?? null;
      const loves = u.topContent || u.favoriteTitle || u.favoriteSeries || u.favoriteMedia || null;
      const border = borders[di];
      const avSz = gold ? isMob ? 72 : isTablet ? 84 : 96 : isMob ? 52 : isTablet ? 60 : 68;
      const pad = gold ? isMob ? "20px 8px 14px" : isTablet ? "20px 10px 14px" : "24px 14px 16px" : isMob ? "12px 6px" : isTablet ? "12px 8px" : "16px 10px";
      const nameSz = gold ? isMob ? 12 : 14 : isMob ? 11 : 12;
      const avFb = `<div style="width:${avSz}px;height:${avSz}px;border-radius:50%;background:rgba(255,255,255,0.1);border:2px solid ${border};display:flex;align-items:center;justify-content:center;font-size:${Math.round(avSz * 0.3)}px;font-weight:800;color:rgba(255,255,255,0.6)">${name.slice(0, 2).toUpperCase()}</div>`;
      const avEl = av ? `<img src="${av}" width="${avSz}" height="${avSz}" style="border-radius:50%;object-fit:cover;border:2px solid ${border};flex-shrink:0" loading="lazy" onerror="this.style.display='none'">` : avFb;
      const trustBadge = trust != null ? `<div style="display:inline-flex;align-items:center;gap:4px;background:rgba(52,199,89,0.18);border-radius:20px;padding:3px 8px;margin-top:4px">
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="#34C759" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span style="font-size:${isMob ? 9 : 10}px;font-weight:700;color:#34C759">Trust: ${Math.round(trust)}%</span>
          </div>` : "";
      const lovesEl = loves ? `<div style="font-size:${isMob ? 8 : 9}px;color:var(--is-text-muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">Loves: ${loves}</div>` : "";
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:${pad};background:var(--is-row-hover);border-radius:12px;flex:1;box-sizing:border-box;text-align:center;min-width:0">
        <div style="font-size:${gold ? isMob ? 22 : 26 : isMob ? 16 : 20}px;line-height:1">${medals[di]}</div>
        ${avEl}
        <div style="font-size:${nameSz}px;font-weight:700;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%">${name}</div>
        <div style="font-size:${isMob ? 10 : 11}px;color:var(--is-text-muted);display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
          <span style="font-weight:700;color:${playsColors[di]}">${plays} plays</span>
          ${hrs ? `<span>${hrs}</span>` : ""}
        </div>
        ${trustBadge}
        ${lovesEl}
      </div>`;
    };
    const podiumHtml = podiumOrder.map((u, di) => _mkCard(u, di)).join("");
    const podiumRow = `<div style="display:flex;align-items:center;gap:${isMob ? "6px" : "10px"};justify-content:center">${podiumHtml}</div>`;
    const runnersUp = users.slice(3);
    const ruPage = m.statsUsersRunnerPage || 0;
    const ruRowH = isMob ? 52 : 56;
    const ruPP = this._tlCalcPerPage({ hasFilter: false, filterH: 0, rowH: ruRowH, bar: 0 });
    const ruPages = runnersUp.length ? Math.max(1, Math.ceil(runnersUp.length / ruPP)) : 1;
    const ruSlice = runnersUp.slice(ruPage * ruPP, (ruPage + 1) * ruPP);
    const runnersHtml = runnersUp.length ? (() => {
      const rows = ruSlice.map((u, i) => {
        const pos = ruPage * ruPP + i + 4;
        const name = u.identityName || u.displayName || u.username || "?";
        const av = u.thumbUrl || u.avatarUrl || u.avatar || null;
        const plays = u.playCount ?? u.plays ?? u.totalPlays ?? u.sessions ?? 0;
        const hrs = _fmtHr(u.watchTimeHours ?? u.totalDuration ?? u.watchTime ?? u.totalHours ?? null);
        const trust = u.trustScore ?? u.trust ?? null;
        const loves = u.topContent || u.favoriteTitle || u.favoriteSeries || u.favoriteMedia || null;
        const avSz = isMob ? 32 : 38;
        const avEl = `<div style="position:relative;width:${avSz}px;height:${avSz}px;flex-shrink:0">
          <div style="width:${avSz}px;height:${avSz}px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:${Math.round(avSz * 0.32)}px;font-weight:800;color:rgba(255,255,255,0.6)">${name.slice(0, 2).toUpperCase()}</div>
          ${av ? `<img src="${av}" width="${avSz}" height="${avSz}" style="border-radius:50%;object-fit:cover;position:absolute;inset:0" loading="lazy" onerror="this.style.display='none'">` : ""}
        </div>`;
        const trustEl = trust != null ? `<span style="display:inline-flex;align-items:center;gap:3px;font-size:${isMob ? 9 : 10}px;color:#34C759"><svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="#34C759" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>${Math.round(trust)}%</span>` : "";
        const statsEl = [
          `<span style="font-size:${isMob ? 10 : 11}px;font-weight:700;color:var(--is-text)">${plays} plays</span>`,
          hrs ? `<span style="font-size:${isMob ? 10 : 11}px;color:var(--is-text-muted)">${hrs}</span>` : "",
          trustEl
        ].filter(Boolean).join(`<span style="color:var(--is-divider);margin:0 3px">\xB7</span>`);
        const lovesEl = loves ? `<div style="font-size:${isMob ? 9 : 10}px;color:var(--is-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Loves: ${loves}</div>` : "";
        return `<div style="display:flex;align-items:center;gap:${isMob ? "8px" : "12px"};padding:${isMob ? "6px 0" : "8px 0"};border-bottom:1px solid var(--is-divider)">
          <span style="font-size:${isMob ? 11 : 13}px;font-weight:700;color:var(--is-text-muted);min-width:${isMob ? 20 : 24}px;text-align:center">#${pos}</span>
          ${avEl}
          <div style="flex:1;min-width:0">
            <div style="font-size:${isMob ? 11 : 13}px;font-weight:600;color:var(--is-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div>
            ${lovesEl}
          </div>
          <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">${statsEl}</div>
        </div>`;
      }).join("");
      const runnerTitle = `<div style="display:flex;align-items:center;gap:6px;margin:${isMob ? "14px 0 8px" : "18px 0 10px"}">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--is-text-muted)"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span style="font-size:${isMob ? 11 : 13}px;font-weight:700;color:var(--is-text)">Runners Up</span>
      </div>`;
      const ruPag = ruPages > 1 ? this._tlMobPag("tra-su-ru-page", ruPage, ruPages, true) : "";
      return runnerTitle + `<div>${rows}</div>` + ruPag;
    })() : "";
    const content = podiumRow + runnersHtml;
    return hdr + (isMob ? content : `<div style="overflow-y:auto;flex:1;min-height:0">${content}</div>`);
  }
};
var tracearrTableMixin = _TraceaRrTableMethods.prototype;


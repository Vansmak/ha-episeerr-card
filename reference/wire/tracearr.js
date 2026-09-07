
var _WireTraceaRrMethods = class {
  // ──────────────────────────────────────────────────────────────────────────
  // Poster row — delegate clicks to open modal on correct tab
  // ──────────────────────────────────────────────────────────────────────────
  _wireTracearrPosters(right) {
    right.addEventListener("click", (e) => {
      const card = e.target.closest("[data-tra-open]");
      if (!card) return;
      this._openTracearrModal(card.dataset.traOpen);
    });
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Modal outer wiring (close button, overlay click, tab buttons)
  // ──────────────────────────────────────────────────────────────────────────
  _wireTracearrModal(el) {
    const glass = el.querySelector(".popup-glass");
    requestAnimationFrame(() => {
      const nav = glass.querySelector("#tra-nav");
      this._syncNavInd(nav, nav?.querySelector(".mt-nav-btn.is-on"));
      this._syncSubNavInd(nav);
      glass.querySelectorAll(".tra-mnav-row").forEach((row) => this._syncNavInd(row, row.querySelector(".tra-mnav-btn.is-on")));
    });
    el.addEventListener("click", (e) => {
      if (!glass.contains(e.target)) this._closeTracearrModal();
    });
    glass.addEventListener("click", (e) => {
      e.stopPropagation();
      const closeEl = e.target.closest("#tra-close");
      if (closeEl) {
        if (closeEl.dataset.traBack === "1") {
          const live = glass.querySelector("#tra-body");
          const back = live?.querySelector("#tra-rf-cancel") || live?.querySelector("#tra-hist-detail-back");
          if (back) {
            back.click();
            return;
          }
          this._traLoadTab("rules", el);
          return;
        }
        this._closeTracearrModal();
        return;
      }
      const srvBtn = e.target.closest("[data-tra-server]");
      if (srvBtn) {
        const m = this._tracearrModal;
        if (!m) return;
        const sid = srvBtn.dataset.traServer;
        m.selectedServerId = sid;
        this._traSaveSrv(sid);
        m.stalePage = 0;
        m.staleDeduped = null;
        glass.querySelectorAll("[data-tra-server]").forEach((b) => b.classList.toggle("active", b === srvBtn));
        this._traLoadTab("storage", el);
        return;
      }
      const qualSrvBtn = e.target.closest("[data-tra-quality-srv]");
      if (qualSrvBtn) {
        const m = this._tracearrModal;
        if (!m) return;
        m.qualityServerId = qualSrvBtn.dataset.traQualitySrv || null;
        this._traSaveSrv(m.qualityServerId);
        m.qualityData = null;
        m._qualityKey = null;
        m.qualityResolution = null;
        glass.querySelectorAll("[data-tra-quality-srv]").forEach((b) => b.classList.toggle("active", b === qualSrvBtn));
        this._traLoadTab("quality", el);
        return;
      }
      const watchSrvBtn = e.target.closest("[data-tra-watch-srv]");
      if (watchSrvBtn) {
        const m = this._tracearrModal;
        if (!m) return;
        const sid = watchSrvBtn.dataset.traWatchSrv || null;
        m.watchServerId = sid;
        this._traSaveSrv(sid);
        m.watchPatterns = null;
        m.watchStatus = null;
        m.watchCompletion = null;
        m.watchTopMovies = null;
        m.watchTopShows = null;
        m.watchSrvKey = null;
        m.watchSrvPeriodKey = null;
        glass.querySelectorAll("[data-tra-watch-srv]").forEach((b) => b.classList.toggle("active", b === watchSrvBtn));
        this._traLoadTab("watch", el);
        return;
      }
      const devMobTab = e.target.closest("[data-tra-dev-mob-tab]");
      if (devMobTab) {
        const m = this._tracearrModal;
        if (!m) return;
        m.devMobView = devMobTab.dataset.traDevMobTab;
        m.devHealthPage = 0;
        m.devMatrixPage = 0;
        m.devHotspotsPage = 0;
        m.devUsersPage = 0;
        const _b0 = el.querySelector("#tra-body");
        if (_b0) {
          _b0.innerHTML = this._traBodyDevices();
          this._wireTracearrModalBody(_b0);
        }
        return;
      }
      const devRightTab = e.target.closest("[data-tra-dev-right-tab]");
      if (devRightTab) {
        const m = this._tracearrModal;
        if (!m) return;
        m.devicesRightView = devRightTab.dataset.traDevRightTab;
        m.devHotspotsPage = 0;
        m.devUsersPage = 0;
        const _b1 = el.querySelector("#tra-body");
        if (_b1) {
          _b1.innerHTML = this._traBodyDevices();
          this._wireTracearrModalBody(_b1);
        }
        return;
      }
      const devLeftTab = e.target.closest("[data-tra-dev-left-tab]");
      if (devLeftTab) {
        const m = this._tracearrModal;
        if (!m) return;
        m.devicesLeftView = devLeftTab.dataset.traDevLeftTab;
        m.devHealthPage = 0;
        m.devMatrixPage = 0;
        const _b2 = el.querySelector("#tra-body");
        if (_b2) {
          _b2.innerHTML = this._traBodyDevices();
          this._wireTracearrModalBody(_b2);
        }
        return;
      }
      const devPage = e.target.closest("[data-tra-dev-page]");
      if (devPage) {
        const m = this._tracearrModal;
        if (!m) return;
        const [view, dir] = devPage.dataset.traDevPage.split("-");
        const delta = dir === "next" ? 1 : -1;
        const PAGE = 6;
        const lens = { health: (m.devicesHealth?.data || []).length, matrix: (m.devicesMatrix?.devices || []).length, hotspots: (m.devicesHotspots?.data || []).length, users: (m.devicesUsers?.data || []).length };
        const keys = { health: "devHealthPage", matrix: "devMatrixPage", hotspots: "devHotspotsPage", users: "devUsersPage" };
        const key = keys[view];
        if (!key) return;
        const max = Math.max(0, Math.ceil(lens[view] / PAGE) - 1);
        m[key] = Math.max(0, Math.min(max, (m[key] || 0) + delta));
        const _b3 = el.querySelector("#tra-body");
        if (_b3) {
          _b3.innerHTML = this._traBodyDevices();
          this._wireTracearrModalBody(_b3);
        }
        return;
      }
      const devSrvBtn = e.target.closest("[data-tra-dev-srv]");
      if (devSrvBtn) {
        const m = this._tracearrModal;
        if (!m) return;
        m.devicesServerId = devSrvBtn.dataset.traDevSrv || null;
        m.devicesData = null;
        m.devicesHealth = null;
        m.devicesHotspots = null;
        m.devicesMatrix = null;
        m.devicesUsers = null;
        m.devHealthPage = 0;
        m.devMatrixPage = 0;
        m.devHotspotsPage = 0;
        m.devUsersPage = 0;
        this._traSaveSrv(m.devicesServerId);
        glass.querySelectorAll("[data-tra-dev-srv]").forEach((b) => b.classList.toggle("active", b === devSrvBtn));
        this._traLoadTab("devices", el);
        return;
      }
      const bwSrvBtn = e.target.closest("[data-tra-bw-srv]");
      if (bwSrvBtn) {
        const m = this._tracearrModal;
        if (!m) return;
        m.bwServerId = bwSrvBtn.dataset.traBwSrv || null;
        m.bwSummary = null;
        m.bwDaily = null;
        m.bwUsers = null;
        m.bwUsersPage = 0;
        try {
          localStorage.setItem("arr-tra-srv", m.bwServerId);
        } catch (_) {
        }
        glass.querySelectorAll("[data-tra-bw-srv]").forEach((b) => b.classList.toggle("active", b === bwSrvBtn));
        this._traLoadTab("bandwidth", el);
        return;
      }
      const bwPeriodBtn = e.target.closest("[data-tra-bw-period]");
      if (bwPeriodBtn) {
        const m = this._tracearrModal;
        if (!m) return;
        m.bwPeriod = bwPeriodBtn.dataset.traBwPeriod || "month";
        m.bwSummary = null;
        m.bwDaily = null;
        m.bwUsers = null;
        m.bwUsersPage = 0;
        this._traLoadTab("bandwidth", el);
        return;
      }
      const violsSrvBtn = e.target.closest("[data-tra-viols-srv]");
      if (violsSrvBtn) {
        const m = this._tracearrModal;
        if (!m) return;
        const sid = violsSrvBtn.dataset.traViolsSrv || null;
        m.violsServerId = sid;
        m.violsPage = 0;
        this._traSaveSrv(sid);
        glass.querySelectorAll("[data-tra-viols-srv]").forEach((b) => b.classList.toggle("active", b === violsSrvBtn));
        this._traLoadTab("violations", el);
        return;
      }
      const histSrvBtn = e.target.closest("[data-tra-hist-srv]");
      if (histSrvBtn) {
        const m = this._tracearrModal;
        if (!m) return;
        const sid = histSrvBtn.dataset.traHistSrv || null;
        m.histServer = sid;
        m.histPage = 0;
        this._traSaveSrv(sid);
        glass.querySelectorAll("[data-tra-hist-srv]").forEach((b) => b.classList.toggle("active", b === histSrvBtn));
        this._traLoadTab("history", el);
        return;
      }
      const actSrvBtn = e.target.closest("[data-tra-act-srv]");
      if (actSrvBtn) {
        const m = this._tracearrModal;
        if (!m) return;
        const sid = actSrvBtn.dataset.traActSrv || null;
        m.activityServerId = sid;
        m.activityData = null;
        this._traSaveSrv(sid);
        glass.querySelectorAll("[data-tra-act-srv]").forEach((b) => b.classList.toggle("active", b === actSrvBtn));
        this._traLoadTab("activity", el);
        return;
      }
      const suSrvBtn = e.target.closest("[data-tra-su-srv]");
      if (suSrvBtn) {
        const m = this._tracearrModal;
        if (!m) return;
        const sid = suSrvBtn.dataset.traSuSrv || null;
        m.statsUsersServerId = sid;
        m.statsUsersData = null;
        this._traSaveSrv(sid);
        glass.querySelectorAll("[data-tra-su-srv]").forEach((b) => b.classList.toggle("active", b === suSrvBtn));
        this._traLoadTab("statsUsers", el);
        return;
      }
      const usrSrvBtn = e.target.closest("[data-tra-usr-srv]");
      if (usrSrvBtn) {
        const m = this._tracearrModal;
        if (!m) return;
        const sid = usrSrvBtn.dataset.traUsrSrv || null;
        m.usersServerId = sid;
        m.usersPage = 0;
        this._traSaveSrv(sid);
        glass.querySelectorAll("[data-tra-usr-srv]").forEach((b) => b.classList.toggle("active", b === usrSrvBtn));
        this._traLoadTab("users", el);
        return;
      }
      const _TRA_NAV = [
        { id: "map", tab: "map" },
        { id: "history", tab: "history" },
        { id: "stats", sub: [["activity", "Activity"], ["statsUsers", "Users"]] },
        { id: "library", sub: [["quality", "Quality"], ["storage", "Storage"], ["watch", "Watch"]] },
        { id: "performance", sub: [["devices", "Devices"], ["bandwidth", "Bandwidth"]] },
        { id: "users", tab: "users" },
        { id: "rules", tab: "rules" },
        { id: "violations", tab: "violations" }
      ];
      const _SRV_TABS = ["storage", "quality", "history", "activity", "statsUsers", "users", "watch", "devices", "bandwidth", "map", "violations"];
      const _day = this._isDay;
      const _updateMobileNav = () => {
        const panel = glass.querySelector("#tra-mobile-nav");
        if (!panel) return;
        const m = this._tracearrModal;
        const before = [...panel.querySelectorAll(".tra-mnav-row")].map((r) => this._navIndRect(r));
        const wasSub = !!panel.querySelector(".tra-mnav-sub");
        const tmp = document.createElement("div");
        tmp.innerHTML = this._traMobileNavHtml(m.tab, m.navGroup);
        panel.innerHTML = tmp.firstElementChild.innerHTML;
        const rows = [...panel.querySelectorAll(".tra-mnav-row")];
        const hasSub = !!panel.querySelector(".tra-mnav-sub");
        rows.forEach((row, i) => {
          const from = wasSub === hasSub ? before[i] : null;
          this._syncNavInd(row, row.querySelector(".tra-mnav-btn.is-on"), from);
        });
      };
      const _redrawNav = () => {
        const area = glass.querySelector("#tra-nav-area");
        const m = this._tracearrModal;
        if (!area || !m) return null;
        const from = this._navIndRect(glass.querySelector("#tra-nav"));
        const subFrom = this._navIndRect(glass.querySelector("#tra-nav .mt-nav-sub-wrap.is-open"));
        area.innerHTML = this._traNavHtml(m.tab, m.navGroup);
        const nav = glass.querySelector("#tra-nav");
        this._syncNavInd(nav, nav?.querySelector(`.mt-nav-btn[data-tra-nav="${m.navGroup}"]`), from);
        requestAnimationFrame(() => this._syncSubNavInd(nav, subFrom));
        return nav;
      };
      const navBtn = e.target.closest("[data-tra-nav]");
      if (navBtn) {
        const m = this._tracearrModal;
        if (!m) return;
        const groupId = navBtn.dataset.traNav;
        const grp = _TRA_NAV.find((g) => g.id === groupId);
        if (!grp || !grp.tab && !grp.sub) return;
        if (grp.sub?.length) {
          const expanding = m.navGroup !== groupId;
          m.navGroup = expanding ? groupId : null;
          _redrawNav();
          _updateMobileNav();
          if (expanding && !grp.sub.some(([tid]) => tid === m.tab)) {
            m.tab = grp.sub[0][0];
            _redrawNav();
            _updateMobileNav();
            this._traLoadTab(m.tab, el);
          }
        } else if (grp.tab) {
          m.navGroup = groupId;
          m.tab = grp.tab;
          _redrawNav();
          const srvEl = glass.querySelector("#tra-hdr-server");
          if (srvEl && !_SRV_TABS.includes(grp.tab)) srvEl.style.display = "none";
          _updateMobileNav();
          this._traLoadTab(grp.tab, el);
        }
        return;
      }
      const tabBtn = e.target.closest("[data-tra-tab]");
      if (tabBtn) {
        const m = this._tracearrModal;
        if (!m) return;
        const tab = tabBtn.dataset.traTab;
        if (m.tab === tab) return;
        m.tab = tab;
        _redrawNav();
        const srvEl = glass.querySelector("#tra-hdr-server");
        if (srvEl && !_SRV_TABS.includes(tab)) srvEl.style.display = "none";
        _updateMobileNav();
        this._traLoadTab(tab, el);
      }
    });
    const _getBucket = () => window.innerWidth > 600 ? window.innerWidth > 860 ? 2 : 1 : 0;
    let _lastBucket = _getBucket();
    let _resizeTimer = null;
    const _onResize = () => {
      clearTimeout(_resizeTimer);
      _resizeTimer = setTimeout(() => {
        if (!this._tracearrModal || !el.isConnected) {
          window.removeEventListener("resize", _onResize);
          return;
        }
        const bucket = _getBucket();
        if (bucket === _lastBucket) return;
        const crossedMobile = _lastBucket === 0 !== (bucket === 0);
        _lastBucket = bucket;
        if (crossedMobile) {
          const m = this._tracearrModal;
          const tab = m.tab;
          const navGroup = m.navGroup;
          el.remove();
          const wrap2 = document.createElement("div");
          wrap2.innerHTML = this._traModalHtml(tab, navGroup);
          const el2 = wrap2.firstElementChild;
          this.shadowRoot.appendChild(el2);
          this._wireTracearrModal(el2);
          this._traLoadTab(tab, el2);
        } else {
          this._traLoadTab(this._tracearrModal.tab, el);
        }
      }, 150);
    };
    window.addEventListener("resize", _onResize);
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Modal body wiring — called after every innerHTML replace
  // ──────────────────────────────────────────────────────────────────────────
  _wireTracearrModalBody(body) {
    const m = this._tracearrModal;
    if (!m) return;
    requestAnimationFrame(() => {
      body.querySelectorAll(".mt-nav--inline").forEach((nav) => this._syncNavInd(nav, nav.querySelector(".mt-nav-btn.is-on")));
    });
    const _segTo = (btn) => {
      const nav = btn.closest(".mt-nav--inline");
      if (!nav) return;
      const from = this._navIndRect(nav);
      nav.querySelectorAll(".mt-nav-btn").forEach((b) => b.classList.toggle("is-on", b === btn));
      this._syncNavInd(nav, btn, from);
    };
    const modal = () => body.closest("[data-tra-modal]");
    const resolvePage = (val, current, total) => {
      if (val === "first") return 0;
      if (val === "prev") return Math.max(0, current - 1);
      if (val === "next") return Math.min(total - 1, current + 1);
      if (val === "last") return total - 1;
      const n = parseInt(val, 10);
      return isNaN(n) ? current : n;
    };
    if (body.querySelector("#tra-rules-add-menu")) {
      body.addEventListener("click", (e) => {
        if (!e.target.closest("#tra-rules-add-wrap")) {
          const menu = body.querySelector("#tra-rules-add-menu");
          if (menu) menu.style.display = "none";
        }
      }, { once: false, capture: false });
    }
    body.querySelectorAll("[data-tra-rule-new]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const ruleType = btn.dataset.traRuleNew;
        if (ruleType === "classic") {
          body.innerHTML = this._traRuleTemplatePicker();
        } else {
          body.innerHTML = this._traRuleFormHtml(ruleType);
        }
        this._wireTracearrModalBody(body);
      });
    });
    body.querySelectorAll("[data-tra-rule-template]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const templateType = btn.dataset.traRuleTemplate;
        body.innerHTML = this._traRuleFormHtml("classic", null, templateType);
        this._wireTracearrModalBody(body);
      });
    });
    const rfActiveToggle = body.querySelector("#tra-rf-active-toggle");
    if (rfActiveToggle) {
      rfActiveToggle.addEventListener("click", () => {
        const cur = rfActiveToggle.dataset.active === "true";
        const next = !cur;
        rfActiveToggle.dataset.active = String(next);
        rfActiveToggle.style.background = next ? "rgba(0,122,255,0.7)" : "rgba(255,255,255,0.06)";
        rfActiveToggle.style.borderColor = next ? "rgba(0,122,255,0.8)" : "rgba(255,255,255,0.12)";
        const knob = rfActiveToggle.querySelector("span");
        if (knob) {
          knob.style.left = next ? "18px" : "4px";
          knob.style.background = next ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)";
        }
      });
    }
    body.querySelectorAll("[data-tra-rule-edit]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.traRuleEdit;
        const fallback = (this._tracearrModal?.rulesData || []).find((r) => String(r.id) === String(id));
        btn.disabled = true;
        btn.style.opacity = "0.5";
        try {
          const res = await this._traAdminFetch("GET", `v1/rules/${id}`);
          const rule = res?.data || res || fallback;
          if (!rule) return;
          body.innerHTML = this._traRuleFormHtml(rule.type ? "classic" : "custom", rule);
          this._wireTracearrModalBody(body);
        } catch {
          if (!fallback) return;
          body.innerHTML = this._traRuleFormHtml(fallback.type ? "classic" : "custom", fallback);
          this._wireTracearrModalBody(body);
        }
      });
    });
    const rfType = body.querySelector("#tra-rf-type");
    if (rfType) {
      const _updateClassicParams = () => {
        const t = rfType.value;
        const msWrap = body.querySelector("#tra-rf-max-streams-wrap");
        if (msWrap) msWrap.style.display = t === "concurrent_streams" ? "" : "none";
        const rfName = body.querySelector("#tra-rf-name");
        if (rfName && !rfName.value) {
          const LABELS = { concurrent_streams: "Concurrent Streams", geo_restriction: "Geo Restriction", impossible_travel: "Impossible Travel", simultaneous_locations: "Simultaneous Locations", device_velocity: "Device Velocity", account_inactivity: "Account Inactivity" };
          rfName.placeholder = LABELS[t] || t;
        }
      };
      rfType.addEventListener("change", _updateClassicParams);
      _updateClassicParams();
    }
    body.querySelectorAll("[data-tra-rule-toggle]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.traRuleToggle;
        const cur = btn.dataset.active === "true";
        btn.style.opacity = "0.5";
        btn.disabled = true;
        try {
          await this._traAdminFetch("PATCH", `v1/rules/${id}`, { isActive: !cur });
          await this._traLoadTab("rules", modal());
        } catch (e) {
          console.error("[arr-card] Rule toggle error:", e);
          btn.style.opacity = "";
          btn.disabled = false;
        }
      });
    });
    const _rulesRedraw = () => {
      if (!body.querySelector("#tra-rules-list")) return;
      body.innerHTML = this._traBodyRules();
      this._wireTracearrModalBody(body);
    };
    body.querySelectorAll("[data-tra-rule-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tracearrModal) return;
        this._tracearrModal.traRuleDelId = btn.dataset.traRuleDel;
        _rulesRedraw();
      });
    });
    body.querySelector("[data-tra-rule-del-no]")?.addEventListener("click", () => {
      if (!this._tracearrModal) return;
      this._tracearrModal.traRuleDelId = null;
      _rulesRedraw();
    });
    body.querySelector("[data-tra-rule-del-yes]")?.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.traRuleDelYes;
      e.currentTarget.disabled = true;
      try {
        await this._traAdminFetch("DELETE", `v1/rules/${id}`);
        if (this._tracearrModal) this._tracearrModal.traRuleDelId = null;
        await this._traLoadTab("rules", modal());
      } catch (err) {
        console.error("[arr-card] Rule delete error:", err);
        e.currentTarget.disabled = false;
      }
    });
    const rfCancel = body.querySelector("#tra-rf-cancel");
    if (rfCancel) rfCancel.addEventListener("click", () => this._traLoadTab("rules", modal()));
    const rfSave = body.querySelector("#tra-rf-save");
    if (rfSave) {
      rfSave.addEventListener("click", async () => {
        const formEl = body.querySelector("[data-rule-id]") || body.firstElementChild;
        const editId = formEl?.dataset?.ruleId || "";
        const isEdit = !!editId;
        const rfType2 = body.querySelector("#tra-rf-type");
        const rfName = body.querySelector("#tra-rf-name");
        const rfDesc = body.querySelector("#tra-rf-description");
        const rfSev = body.querySelector("#tra-rf-severity");
        const rfActToggle = body.querySelector("#tra-rf-active-toggle");
        const hasCondBuilder = !!body.querySelector("#tra-rf-conds");
        const name = rfName?.value?.trim() || "";
        const description = rfDesc?.value?.trim() || null;
        const severity = rfSev?.value || "warning";
        const isActive = rfActToggle ? rfActToggle.dataset.active !== "false" : true;
        const origInner = rfSave.innerHTML;
        rfSave.disabled = true;
        rfSave.textContent = "\u2026";
        try {
          const groups = [];
          body.querySelectorAll(".tra-cg").forEach((grpEl) => {
            const conds = [];
            grpEl.querySelectorAll(".tra-cr").forEach((rowEl) => {
              const field = rowEl.querySelector(".tra-cond-field")?.value;
              const op = rowEl.querySelector(".tra-cond-op")?.value;
              const val = parseFloat(rowEl.querySelector(".tra-cond-val")?.value) || 0;
              const uDev = rowEl.querySelector(".tra-cond-uniq-dev")?.checked;
              const uIP = rowEl.querySelector(".tra-cond-uniq-ip")?.checked;
              if (field && op) {
                const cond = { field, operator: op, value: val };
                const uDevEl = rowEl.querySelector(".tra-cond-uniq-dev");
                if (uDevEl) cond.params = { uniqueDevices: !!uDev, uniqueIPs: !!uIP };
                conds.push(cond);
              }
            });
            if (conds.length) groups.push({ conditions: conds });
          });
          const actions = [];
          body.querySelectorAll(".tra-act-row").forEach((rowEl) => {
            const type = rowEl.querySelector(".tra-act-type")?.value;
            const msg = rowEl.querySelector(".tra-act-msg")?.value?.trim() || void 0;
            if (type) actions.push(msg ? { type, message: msg } : { type });
          });
          const payload = { name: name || "Rule", description, severity, isActive, conditions: { groups }, actions: { actions } };
          if (isEdit) {
            await this._traAdminFetch("PATCH", `v1/rules/${editId}`, payload);
          } else {
            await this._traAdminFetch("POST", "v1/rules/v2", payload);
          }
          await this._traLoadTab("rules", modal());
        } catch (e) {
          console.error("[arr-card] Rule save error:", e);
          rfSave.disabled = false;
          rfSave.innerHTML = origInner;
        }
      });
    }
    const addAndGroup = body.querySelector("#tra-add-and-group");
    if (addAndGroup) {
      addAndGroup.addEventListener("click", () => {
        const gi = body.querySelectorAll(".tra-cg").length;
        const tmp = document.createElement("div");
        tmp.innerHTML = this._traCondGroupHtml(gi);
        body.querySelector("#tra-rf-conds").appendChild(tmp.firstElementChild);
        this._wireTraCondRow(body);
      });
    }
    const addAction = body.querySelector("#tra-add-action");
    if (addAction) {
      addAction.addEventListener("click", () => {
        const idx = body.querySelectorAll(".tra-act-row").length;
        const tmp = document.createElement("div");
        tmp.innerHTML = this._traActionRowHtml(idx);
        body.querySelector("#tra-rf-actions").appendChild(tmp.firstElementChild);
        this._wireTraCondRow(body);
      });
    }
    this._wireTraCondRow(body);
    this._traRefreshHdrActions(body);
    const dirtyEl = body.querySelector("#tra-rf-dirty");
    if (dirtyEl && !body._traDirtyWired) {
      body._traDirtyWired = true;
      const mark = (e) => {
        if (e.target.closest("#tra-hdr-actions")) return;
        const el = body.querySelector("#tra-rf-dirty");
        if (!el || el.dataset.traDirty === "1") return;
        el.dataset.traDirty = "1";
        this._traRefreshHdrActions(body);
      };
      body.addEventListener("input", mark);
      body.addEventListener("change", mark);
      body.addEventListener("click", (e) => {
        if (e.target.closest("button,select,label")) mark(e);
      });
    }
    const usersSearch = body.querySelector("#tra-users-search");
    if (usersSearch) {
      let t;
      usersSearch.addEventListener("input", () => {
        clearTimeout(t);
        t = setTimeout(() => {
          if (!this._tracearrModal) return;
          this._tracearrModal.usersSearch = usersSearch.value;
          this._tracearrModal.usersPage = 0;
          this._patchResultsWrap(body, "tra-users-results-wrap", () => this._traBodyUsers());
        }, 320);
      });
    }
    body.querySelectorAll("[data-tra-users-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        if (!this._tracearrModal) return;
        const col = th.dataset.traUsersSort;
        if (this._tracearrModal.usersSortCol === col) {
          this._tracearrModal.usersSortDir = this._tracearrModal.usersSortDir === "asc" ? "desc" : "asc";
        } else {
          this._tracearrModal.usersSortCol = col;
          this._tracearrModal.usersSortDir = "asc";
        }
        this._tracearrModal.usersPage = 0;
        this._traLoadTab("users", modal());
      });
    });
    body.querySelectorAll("[data-tra-users-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tracearrModal) return;
        const pp = this._tlCalcPerPage();
        const totalP = Math.max(1, Math.ceil((this._tracearrModal.usersTotal || 0) / pp));
        this._tracearrModal.usersPage = resolvePage(btn.dataset.traUsersPage, this._tracearrModal.usersPage, totalP);
        this._traLoadTab("users", modal());
      });
    });
    const violsSev = body.querySelector("#tra-viols-sev");
    if (violsSev) {
      violsSev.addEventListener("change", () => {
        if (!this._tracearrModal) return;
        this._tracearrModal.violsSeverity = violsSev.value || null;
        this._tracearrModal.violsPage = 0;
        this._traLoadTab("violations", modal());
      });
    }
    const violsStat = body.querySelector("#tra-viols-stat");
    if (violsStat) {
      violsStat.addEventListener("change", () => {
        if (!this._tracearrModal) return;
        this._tracearrModal.violsStatus = violsStat.value || null;
        this._tracearrModal.violsPage = 0;
        this._traLoadTab("violations", modal());
      });
    }
    body.querySelectorAll("[data-tra-viols-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tracearrModal) return;
        const pp = this._tlCalcPerPage({ hasFilter: true });
        const totalP = Math.max(1, Math.ceil((this._tracearrModal.violsTotal || 0) / pp));
        this._tracearrModal.violsPage = resolvePage(btn.dataset.traViolsPage, this._tracearrModal.violsPage, totalP);
        this._traLoadTab("violations", modal());
      });
    });
    const histServer = body.querySelector("#tra-hist-server");
    if (histServer) {
      histServer.addEventListener("change", () => {
        if (!this._tracearrModal) return;
        this._tracearrModal.histServer = histServer.value || null;
        this._tracearrModal.histPage = 0;
        this._tracearrModal.histNeedsRefetch = true;
        this._traLoadTab("history", modal());
      });
    }
    const histUser = body.querySelector("#tra-hist-user");
    if (histUser) {
      histUser.addEventListener("change", () => {
        if (!this._tracearrModal) return;
        this._tracearrModal.histUser = histUser.value || null;
        this._tracearrModal.histPage = 0;
        this._tracearrModal.histNeedsRefetch = true;
        this._traLoadTab("history", modal());
      });
    }
    const histMedia = body.querySelector("#tra-hist-media");
    if (histMedia) {
      histMedia.addEventListener("change", () => {
        if (!this._tracearrModal) return;
        this._tracearrModal.histMedia = histMedia.value || null;
        this._tracearrModal.histPage = 0;
        this._tracearrModal.histNeedsRefetch = true;
        this._traLoadTab("history", modal());
      });
    }
    const histSearch = body.querySelector("#tra-hist-search");
    if (histSearch) {
      let t;
      histSearch.addEventListener("input", () => {
        clearTimeout(t);
        t = setTimeout(() => {
          if (!this._tracearrModal) return;
          this._tracearrModal.histSearch = histSearch.value;
          this._tracearrModal.histPage = 0;
          this._traRefetchHistorySearch(body);
        }, 320);
      });
    }
    body.querySelectorAll("[data-tra-hist-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tracearrModal) return;
        const isMobH = this._isMob;
        const pp = this._tlCalcPerPage({ hasFilter: true, filterH: isMobH ? 120 : 40, rowH: isMobH ? 80 : 44, bar: 0 });
        const totalP = Math.max(1, Math.ceil((this._tracearrModal.histTotal || 0) / pp));
        this._tracearrModal.histPage = resolvePage(btn.dataset.traHistPage, this._tracearrModal.histPage, totalP);
        this._traLoadTab("history", modal());
      });
    });
    body.querySelector("#tra-hist-cols-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!this._tracearrModal) return;
      this._tracearrModal.traHistColsOpen = !this._tracearrModal.traHistColsOpen;
      const menu = body.querySelector("#tra-hist-cols-menu");
      if (menu) menu.style.display = this._tracearrModal.traHistColsOpen ? "block" : "none";
      this._floatMenu(e.currentTarget, menu);
    });
    body.querySelectorAll("[data-tra-hist-col]").forEach((item) => {
      item.addEventListener("click", () => {
        if (!this._tracearrModal) return;
        if (!this._tracearrModal.traHistHiddenCols) this._tracearrModal.traHistHiddenCols = /* @__PURE__ */ new Set();
        const col = item.dataset.traHistCol;
        const hidden = this._tracearrModal.traHistHiddenCols;
        if (hidden.has(col)) hidden.delete(col);
        else hidden.add(col);
        this._tracearrModal.traHistColsOpen = true;
        body.innerHTML = this._traBodyHistory();
        this._wireTracearrModalBody(body);
      });
    });
    body.querySelector("#tra-hist-period")?.addEventListener("change", (e) => {
      if (!this._tracearrModal) return;
      const p = e.target.value;
      this._tracearrModal.histPeriod = p === "all" ? null : p;
      this._tracearrModal.histPage = 0;
      this._traLoadTab("history", modal());
    });
    body.querySelectorAll("[data-tra-hist-row]").forEach((row) => {
      row.addEventListener("click", async (e) => {
        if (e.target.closest("button,select,input,a")) return;
        const m2 = this._tracearrModal;
        if (!m2) return;
        const rowId = row.dataset.traHistRow;
        const item = (m2.histData || []).find((h) => String(h.id) === rowId);
        if (!item) return;
        m2.histDetailItem = { ...item };
        body.innerHTML = this._traBodyHistDetail();
        this._wireTracearrModalBody(body);
        this._traRefreshHdrActions(body);
        const imgEl = body.querySelector("#tra-hist-poster");
        if (imgEl && item.posterUrl) {
          const proxyUrl = `/api/arr_stack/tracearr${item.posterUrl.replace("/api", "")}`;
          const token = this._hass?.connection?.options?.auth?.data?.access_token || "";
          fetch(proxyUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then((r) => r.ok ? r.blob() : null).then((blob) => {
            if (blob && imgEl.isConnected) imgEl.src = URL.createObjectURL(blob);
          }).catch(() => {
            if (imgEl.isConnected) imgEl.style.display = "none";
          });
        }
      });
    });
    const detailBack = body.querySelector("#tra-hist-detail-back");
    if (detailBack) {
      detailBack.addEventListener("click", () => {
        const m2 = this._tracearrModal;
        if (!m2) return;
        m2.histDetailItem = null;
        body.innerHTML = this._traBodyHistory();
        this._wireTracearrModalBody(body);
        this._traRefreshHdrActions(body);
      });
    }
    body.querySelector("#tra-map-period")?.addEventListener("change", (e) => {
      if (!this._tracearrModal) return;
      this._tracearrModal.mapData = null;
      this._tracearrModal.mapPeriod = e.target.value;
      this._traLoadTab("map", modal());
    });
    body.querySelectorAll("[data-tra-map-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const m2 = this._tracearrModal;
        if (!m2) return;
        if (m2.mapView === btn.dataset.traMapView) return;
        m2.mapView = btn.dataset.traMapView;
        this._traMapPlotData(m2);
        const nav = body.querySelector("#tra-map-view-nav");
        if (nav) {
          const from = this._navIndRect(nav);
          nav.querySelectorAll(".mt-nav-btn").forEach((b) => b.classList.toggle("is-on", b.dataset.traMapView === m2.mapView));
          this._syncNavInd(nav, nav.querySelector(".mt-nav-btn.is-on"), from);
        }
      });
    });
    requestAnimationFrame(() => {
      const nav = body.querySelector("#tra-map-view-nav");
      this._syncNavInd(nav, nav?.querySelector(".mt-nav-btn.is-on"));
    });
    const mapUserSel = body.querySelector("#tra-map-user-sel");
    if (mapUserSel) {
      mapUserSel.addEventListener("change", () => {
        if (!this._tracearrModal) return;
        this._tracearrModal.mapUserId = mapUserSel.value || null;
        this._tracearrModal.mapData = null;
        this._traLoadTab("map", modal());
      });
    }
    const mapSrvSel = body.querySelector("#tra-map-srv-sel");
    if (mapSrvSel) {
      mapSrvSel.addEventListener("change", () => {
        if (!this._tracearrModal) return;
        this._tracearrModal.mapServerId = mapSrvSel.value || null;
        this._tracearrModal.mapData = null;
        this._traLoadTab("map", modal());
      });
    }
    modal()?.querySelectorAll("[data-tra-map-srv]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const m2 = this._tracearrModal;
        if (!m2) return;
        const id = btn.dataset.traMapSrv;
        m2.mapServerId = m2.mapServerId === id ? null : id;
        m2.mapData = null;
        this._traLoadTab("map", modal());
      });
    });
    body.querySelectorAll("[data-tra-act-period]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tracearrModal) return;
        this._tracearrModal.activityPeriod = btn.dataset.traActPeriod;
        this._traLoadTab("activity", modal());
      });
    });
    body.querySelectorAll("[data-tra-su-period]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tracearrModal) return;
        this._tracearrModal.statsUsersPeriod = btn.dataset.traSuPeriod;
        this._tracearrModal.statsUsersData = null;
        this._traLoadTab("statsUsers", modal());
      });
    });
    body.querySelectorAll("[data-tra-dev-period]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tracearrModal) return;
        const m2 = this._tracearrModal;
        m2.devicesPeriod = btn.dataset.traDevPeriod;
        m2.devicesData = null;
        m2.devicesHealth = null;
        m2.devicesHotspots = null;
        m2.devicesMatrix = null;
        m2.devicesUsers = null;
        m2.devHealthPage = 0;
        m2.devMatrixPage = 0;
        m2.devHotspotsPage = 0;
        m2.devUsersPage = 0;
        this._traLoadTab("devices", modal());
      });
    });
    body.querySelectorAll("[data-tra-q-codec-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tracearrModal) return;
        this._tracearrModal.qualityCodecTab = btn.dataset.traQCodecTab;
        try {
          localStorage.setItem("arr-tra-q-codec", this._tracearrModal.qualityCodecTab);
        } catch (_) {
        }
        const sec = body.querySelector("[data-tra-q-codecs]");
        if (sec) {
          sec.innerHTML = this._traQualCodecsCard();
          this._wireTracearrModalBody(body);
        }
      });
    });
    body.querySelectorAll("[data-tra-q-period]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tracearrModal) return;
        this._tracearrModal.qualityPeriod = btn.dataset.traQPeriod;
        try {
          localStorage.setItem("arr-tra-q-period", this._tracearrModal.qualityPeriod);
        } catch (_) {
        }
        const sec = body.querySelector("[data-tra-q-evol]");
        if (sec) {
          sec.innerHTML = this._traQualEvolCard();
          this._wireTracearrModalBody(body);
        }
      });
    });
    body.querySelectorAll("[data-tra-q-mt]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!this._tracearrModal) return;
        this._tracearrModal.qualityMediaType = btn.dataset.traQMt || null;
        try {
          localStorage.setItem("arr-tra-q-mt", this._tracearrModal.qualityMediaType ?? "");
        } catch (_) {
        }
        this._tracearrModal.qualityData = null;
        this._tracearrModal._qualityKey = null;
        const sec = body.querySelector("[data-tra-q-evol]");
        if (sec) {
          const m2 = this._tracearrModal;
          const _qSrvId = m2.qualityServerId || null;
          const _qMt = m2.qualityMediaType || null;
          const _tz = encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone);
          const _qQ = ["period=all", `timezone=${_tz}`, _qSrvId && `serverId=${_qSrvId}`, _qMt && `mediaType=${_qMt}`].filter(Boolean).join("&");
          const qr = await this._traLibFetch(`quality?${_qQ}`);
          if (!this._tracearrModal) return;
          m2.qualityData = qr;
          m2._qualityKey = `${_qSrvId}|${_qMt}`;
          sec.innerHTML = this._traQualEvolCard();
          this._wireTracearrModalBody(body);
        }
      });
    });
    body.querySelectorAll("[data-tra-stor-period]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tracearrModal) return;
        this._tracearrModal.storagePeriod = btn.dataset.traStorPeriod;
        try {
          localStorage.setItem("arr-tra-stor-period", this._tracearrModal.storagePeriod);
        } catch (_) {
        }
        body.innerHTML = this._traBodyStorage();
        this._wireTracearrModalBody(body);
      });
    });
    body.querySelector("[data-tra-stor-pred]")?.addEventListener("click", () => {
      if (!this._tracearrModal) return;
      this._tracearrModal.storagePredictions = !this._tracearrModal.storagePredictions;
      try {
        localStorage.setItem("arr-tra-stor-pred", this._tracearrModal.storagePredictions ? "1" : "0");
      } catch (_) {
      }
      body.innerHTML = this._traBodyStorage();
      this._wireTracearrModalBody(body);
    });
    body.querySelectorAll("[data-tra-w-top]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tracearrModal) return;
        this._tracearrModal.watchTopTab = btn.dataset.traWTop;
        _segTo(btn);
        const target = body.querySelector("[data-tra-watch-top]");
        if (target) target.innerHTML = this._traWatchTopRowsHtml();
      });
    });
    body.querySelectorAll("[data-tra-w-period]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const m2 = this._tracearrModal;
        if (!m2) return;
        m2.watchPeriod = btn.dataset.traWPeriod;
        m2.watchTopMovies = null;
        m2.watchTopShows = null;
        m2.watchSrvPeriodKey = null;
        _segTo(btn);
        const target = body.querySelector("[data-tra-watch-top]");
        if (target) target.innerHTML = `<div style="grid-column:1/-1;padding:24px;text-align:center;color:rgba(255,255,255,0.3);font-size:11px">${this._t("loading")}</div>`;
        const _wSrvId = m2.watchServerId || m2.qualityServerId || m2.selectedServerId || null;
        const _wSrvQ = _wSrvId ? `&serverId=${_wSrvId}` : "";
        const [mov, sh] = await Promise.all([
          this._traLibFetch(`top-movies?period=${m2.watchPeriod}&sortBy=plays&sortOrder=desc&page=1&pageSize=5${_wSrvQ}`),
          this._traLibFetch(`top-shows?period=${m2.watchPeriod}&sortBy=plays&sortOrder=desc&page=1&pageSize=5${_wSrvQ}`)
        ]);
        if (!this._tracearrModal) return;
        m2.watchTopMovies = mov?.items || mov || [];
        m2.watchTopShows = sh?.items || sh || [];
        m2.watchSrvPeriodKey = `${_wSrvId}|${m2.watchPeriod}`;
        const t2 = body.querySelector("[data-tra-watch-top]");
        if (t2) t2.innerHTML = this._traWatchTopRowsHtml();
      });
    });
    body.querySelector("#tra-stale-type")?.addEventListener("change", (e) => {
      if (!this._tracearrModal) return;
      this._tracearrModal.staleMediaType = e.target.value || null;
      this._tracearrModal.stalePage = 0;
      this._traRefreshStale(body);
    });
    {
      let _staleTimer = null;
      const _si = body.querySelector("#tra-stale-search");
      if (_si && !_si._traWired) {
        _si._traWired = true;
        _si.addEventListener("input", (e) => {
          if (!this._tracearrModal) return;
          const v = e.target.value || "";
          clearTimeout(_staleTimer);
          _staleTimer = setTimeout(() => {
            if (!this._tracearrModal) return;
            this._tracearrModal.staleSearch = v;
            this._tracearrModal.stalePage = 0;
            this._traRefreshStale(body);
          }, 300);
        });
      }
    }
    body.querySelector("#tra-stale-months")?.addEventListener("change", (e) => {
      if (!this._tracearrModal) return;
      this._tracearrModal.staleMonths = Number(e.target.value) || 3;
      this._tracearrModal.stalePage = 0;
      this._tracearrModal.staleRaw = null;
      this._traRefreshStale(body);
    });
    body.querySelectorAll("[data-tra-stale-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        if (!this._tracearrModal) return;
        const m2 = this._tracearrModal;
        const col = th.dataset.traStaleSort;
        if ((m2.staleSort || "fileSize") === col) {
          m2.staleOrder = m2.staleOrder === "asc" ? "desc" : "asc";
        } else {
          m2.staleSort = col;
          m2.staleOrder = "desc";
        }
        m2.stalePage = 0;
        this._traRefreshStale(body);
      });
    });
    body.querySelector("#tra-stale-cat")?.addEventListener("change", (e) => {
      if (!this._tracearrModal) return;
      this._tracearrModal.staleCategory = e.target.value;
      this._tracearrModal.stalePage = 0;
      this._tracearrModal.staleRaw = null;
      this._traRefreshStale(body);
    });
    body.querySelectorAll("[data-tra-stale-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tracearrModal) return;
        const m2 = this._tracearrModal;
        const pp = m2.stalePageSize || 10;
        const totalP = Math.max(1, Math.ceil(m2.staleTotal / pp));
        m2.stalePage = resolvePage(btn.dataset.traStalePage, m2.stalePage, totalP);
        this._traRefreshStale(body);
      });
    });
    body.querySelectorAll("[data-tra-bw-users-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const m2 = this._tracearrModal;
        if (!m2) return;
        const users = Array.isArray(m2.bwUsers) ? m2.bwUsers : m2.bwUsers?.data || m2.bwUsers?.users || [];
        const pp = m2.bwPageSize || 5;
        const pages = Math.max(1, Math.ceil(users.length / pp));
        m2.bwUsersPage = resolvePage(btn.dataset.traBwUsersPage, m2.bwUsersPage || 0, pages);
        body.innerHTML = this._traBodyBandwidth();
        this._wireTracearrModalBody(body);
      });
    });
    body.querySelectorAll("[data-tra-su-ru-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const m2 = this._tracearrModal;
        if (!m2) return;
        const isMob = this._isMob;
        const ruRowH = isMob ? 52 : 56;
        const ruPP = this._tlCalcPerPage({ hasFilter: false, filterH: 0, rowH: ruRowH, bar: 0 });
        const runners = (m2.statsUsersData || []).slice(3);
        const pages = Math.max(1, Math.ceil(runners.length / ruPP));
        m2.statsUsersRunnerPage = resolvePage(btn.dataset.traSuRuPage, m2.statsUsersRunnerPage || 0, pages);
        body.innerHTML = this._traBodyStatsUsers();
        this._wireTracearrModalBody(body);
      });
    });
    this._wireChartCards(body);
    this._tlGTriggerAnim(body);
    body.querySelectorAll(".donut-wrap").forEach((wrap) => {
      const arcs = wrap.querySelectorAll(".donut-arc");
      const rings = wrap.querySelectorAll(".donut-ring");
      const tt = wrap.querySelector(".donut-tt");
      if (!tt) return;
      arcs.forEach((arc, i) => {
        arc.addEventListener("mouseenter", () => {
          if (rings[i]) rings[i].style.strokeOpacity = "0.22";
          tt.innerHTML = `<div style="font-size:11px;font-weight:700;margin-bottom:2px">${arc.dataset.label}</div><div style="font-size:10px;opacity:0.65">${arc.dataset.value} items (${arc.dataset.pct}%)</div>`;
          tt.style.display = "block";
        });
        arc.addEventListener("mousemove", (e) => {
          const rect = wrap.getBoundingClientRect();
          let x = e.clientX - rect.left + 10;
          let y = e.clientY - rect.top - 38;
          tt.style.left = x + "px";
          tt.style.top = y + "px";
        });
        arc.addEventListener("mouseleave", () => {
          if (rings[i]) rings[i].style.strokeOpacity = "0";
          tt.style.display = "none";
        });
      });
    });
  }
  // ── Rules form helpers ───────────────────────────────────────────────────
  _traCondRowHtml(gi, ci) {
    const FIELDS = [["concurrent_streams", "Concurrent Streams"], ["travel_speed_kmh", "Travel Speed (km/h)"], ["active_session_distance", "Session Distance (km)"], ["unique_ips_window", "Unique IPs in Window"], ["unique_devices_window", "Unique Devices in Window"], ["inactive_days", "Inactive Days"], ["current_pause_duration", "Pause Duration (min)"], ["total_pause_duration", "Total Pause (min)"]];
    const OPS = [["gt", "greater than"], ["gte", "at least"], ["lt", "less than"], ["lte", "at most"], ["eq", "equals"], ["neq", "not equals"]];
    const trash = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
    const _c = (cls, lbl) => `<label class="mt-chk"><input type="checkbox" class="${cls}"><span class="mt-chk-box">${_ICO_CHECK}</span><span class="mt-chk-lbl">${lbl}</span></label>`;
    return `<div class="tra-cr" data-grp="${gi}" data-row="${ci}" style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px;align-items:center">
      ${this._mtFieldSelectRaw('class="tra-cond-field"', FIELDS.map(([v, l]) => `<option value="${v}">${l}</option>`).join(""), FIELDS[0][1], "flex:2;min-width:130px")}
      ${this._mtFieldSelectRaw('class="tra-cond-op"', OPS.map(([v, l]) => `<option value="${v}">${l}</option>`).join(""), OPS[0][1], "flex:1.2;min-width:100px")}
      <input class="tra-cond-val mt-field" type="number" value="2" style="width:76px;flex-shrink:0">
      ${_c("tra-cond-uniq-dev", "Unique devices")}${_c("tra-cond-uniq-ip", "Unique IPs")}
      ${this._mtRoundBtn('class="tra-cond-del"', trash, "Delete", { size: 26, tone: "red" })}
    </div>`;
  }
  _traCondGroupHtml(gi) {
    return `<div class="tra-cg" data-grp="${gi}" style="background:rgba(255,255,255,0.03);border:1px solid var(--is-card-bdr,rgba(255,255,255,0.09));border-radius:16px;padding:12px 14px;margin-bottom:8px">
      <div style="font-size:11px;font-weight:600;color:var(--is-text-label);margin-bottom:10px">Group ${gi + 1} <span style="font-weight:400;font-size:10px;opacity:0.6">(conditions match with OR logic)</span></div>
      <div class="tra-cg-rows">${this._traCondRowHtml(gi, 0)}</div>
      <button class="tra-add-or" data-grp="${gi}" style="font-size:11px;color:rgba(0,122,255,0.8);background:transparent;border:none;cursor:pointer;padding:2px 0;margin-top:2px">+ Add <strong>OR</strong> condition</button>
    </div>`;
  }
  _traActionRowHtml(idx) {
    const ACTIONS = [["log_only", "Log Only"], ["send_notification", "Send Notification"], ["kill_stream", "Kill Stream"], ["adjust_trust_score", "Adjust Trust Score"], ["set_trust_score", "Set Trust Score"], ["reset_trust_score", "Reset Trust Score"], ["message_client", "Message Client"]];
    const trash = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
    return `<div class="tra-act-row" data-idx="${idx}" style="background:rgba(255,255,255,0.03);border:1px solid var(--is-card-bdr,rgba(255,255,255,0.09));border-radius:14px;padding:10px 12px;margin-bottom:6px">
      <div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center">
        ${this._mtFieldSelectRaw('class="tra-act-type"', ACTIONS.map(([v, l]) => `<option value="${v}"${idx === 0 && v === "log_only" ? " selected" : ""}>${l}</option>`).join(""), ACTIONS[0][1], "flex:1;min-width:0")}
        ${this._mtRoundBtn('class="tra-act-del"', trash, "Delete", { size: 26, tone: "red" })}
        <label style="display:flex;align-items:center;gap:6px;flex-basis:100%;min-width:0;font-size:11px;color:var(--is-text-muted);white-space:nowrap;margin-top:6px">
          Log Message: <input class="tra-act-msg mt-field" type="text" placeholder="Optional message" style="flex:1;min-width:0">
        </label>
      </div>
      <div class="tra-act-desc" style="font-size:10px;color:var(--is-text-muted);margin-top:6px">Log the event without taking action</div>
    </div>`;
  }
  _traRefreshHdrActions(body) {
    const modal = body.closest("[data-tra-modal]");
    if (!modal) return;
    const hdr = modal.querySelector("#tra-hdr-actions");
    if (!hdr) return;
    const CHECK = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="20 6 9 17 4 12"/></svg>`;
    const BACK = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="15 18 9 12 15 6"/></svg>`;
    const PLUS = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="display:block"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    const S = 30;
    const hasForm = !!body.querySelector("#tra-rf-save");
    const hasList = !!body.querySelector("#tra-rules-list");
    const hasPicker = !!body.querySelector("[data-tra-rule-template]");
    const hasDetail = !!body.querySelector("#tra-hist-detail");
    const parts = [];
    const dirty = !!body.querySelector('[data-tra-dirty="1"]');
    if (hasForm) parts.push(this._mtRoundBtn("data-tra-hdr-save", CHECK, this._t("mtSave"), { size: S, tone: "blue", active: dirty, disabled: !dirty }));
    if (hasList) parts.push(this._mtRoundBtn("data-tra-hdr-add", PLUS, "Add rule", { size: S, tone: "blue" }));
    hdr.innerHTML = parts.join("");
    const closeBtn = modal.querySelector("#tra-close");
    const isBack = hasForm || hasPicker || hasDetail;
    if (closeBtn) {
      closeBtn.dataset.traBack = isBack ? "1" : "";
      closeBtn.innerHTML = isBack ? BACK : ICONS.close;
      closeBtn.title = isBack ? this._t("mtCancel") : "";
    }
    if (hdr._traWired) return;
    hdr._traWired = true;
    hdr.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const live = modal.querySelector("#tra-body") || body;
      if (b.hasAttribute("data-tra-hdr-save")) {
        live.querySelector("#tra-rf-save")?.click();
      } else if (b.hasAttribute("data-tra-hdr-add")) {
        const menu = live.querySelector("#tra-rules-add-menu");
        if (menu && !this._isMob) {
          menu.style.display = menu.style.display === "none" ? "block" : "none";
          return;
        }
        live.innerHTML = this._traRuleTemplatePicker();
        this._wireTracearrModalBody(live);
        this._traRefreshHdrActions(live);
      }
    });
  }
  _wireTraCondRow(body) {
    const FIELDS_WITH_UNIQUE = /* @__PURE__ */ new Set(["concurrent_streams", "travel_speed_kmh", "active_session_distance", "unique_ips_window", "unique_devices_window"]);
    body.querySelectorAll(".tra-cond-del").forEach((btn) => {
      if (btn._wired) return;
      btn._wired = true;
      btn.addEventListener("click", () => {
        const row = btn.closest(".tra-cr");
        const grpEl = btn.closest(".tra-cg");
        if (!grpEl) return;
        const rows = grpEl.querySelectorAll(".tra-cr");
        if (rows.length > 1) {
          const prev = row.previousElementSibling;
          if (prev?.classList?.contains("tra-or-label")) prev.remove();
          row.remove();
        } else if (body.querySelectorAll(".tra-cg").length > 1) {
          grpEl.remove();
        }
      });
    });
    body.querySelectorAll(".tra-cond-field").forEach((sel) => {
      if (sel._wired) return;
      sel._wired = true;
      sel.addEventListener("change", () => {
        const row = sel.closest(".tra-cr");
        if (!row) return;
        const hasUniq = FIELDS_WITH_UNIQUE.has(sel.value);
        row.querySelectorAll(".tra-cond-uniq-dev, .tra-cond-uniq-ip").forEach((el) => {
          el.closest("label").style.display = hasUniq ? "" : "none";
        });
      });
    });
    body.querySelectorAll(".tra-act-del").forEach((btn) => {
      if (btn._wired) return;
      btn._wired = true;
      btn.addEventListener("click", () => {
        const row = btn.closest(".tra-act-row");
        const container = body.querySelector("#tra-rf-actions");
        if (container && container.querySelectorAll(".tra-act-row").length > 1) row.remove();
      });
    });
    body.querySelectorAll(".tra-act-type").forEach((sel) => {
      if (sel._wired) return;
      sel._wired = true;
      const ACTION_MSG_LABEL = { log_only: "Log Message", send_notification: "Message", kill_stream: "Kill Message", message_client: "Message" };
      const ACTION_DESC = {
        log_only: "Log the event without taking action",
        send_notification: "Send a push notification",
        kill_stream: "Terminate the active stream",
        adjust_trust_score: "Add or subtract from trust score",
        set_trust_score: "Set trust score to a specific value",
        reset_trust_score: "Reset trust score to default",
        message_client: "Send a message to the streaming client"
      };
      sel.addEventListener("change", () => {
        const row = sel.closest(".tra-act-row");
        if (!row) return;
        const aType = sel.value;
        const msgLbl = ACTION_MSG_LABEL[aType];
        const descTxt = ACTION_DESC[aType] || "";
        const topRow = row.firstElementChild;
        let msgWrap = topRow.querySelector("label");
        if (msgLbl) {
          if (!msgWrap) {
            msgWrap = document.createElement("label");
            msgWrap.style.cssText = "display:flex;align-items:center;gap:6px;flex-basis:100%;min-width:0;font-size:11px;color:var(--is-text-muted);white-space:nowrap;margin-top:6px";
            topRow.insertBefore(msgWrap, topRow.lastElementChild);
          }
          msgWrap.innerHTML = `${msgLbl}: <input class="tra-act-msg mt-field" type="text" placeholder="Optional custom message" style="flex:1;min-width:0">`;
          msgWrap.style.display = "";
        } else if (msgWrap) {
          msgWrap.style.display = "none";
        }
        let descEl = row.querySelector(".tra-act-desc");
        if (descTxt) {
          if (!descEl) {
            descEl = document.createElement("div");
            descEl.className = "tra-act-desc";
            descEl.style.cssText = "font-size:10px;color:var(--is-text-muted);margin-top:6px";
            row.appendChild(descEl);
          }
          descEl.textContent = descTxt;
          descEl.style.display = "";
        } else if (descEl) {
          descEl.style.display = "none";
        }
      });
    });
    body.querySelectorAll(".tra-add-or").forEach((btn) => {
      if (btn._wired) return;
      btn._wired = true;
      btn.addEventListener("click", () => {
        const gi = parseInt(btn.dataset.grp, 10);
        const grpEl = body.querySelector(`.tra-cg[data-grp="${gi}"]`);
        if (!grpEl) return;
        const ci = grpEl.querySelectorAll(".tra-cr").length;
        const rows = grpEl.querySelector(".tra-cg-rows");
        const orLbl = document.createElement("div");
        orLbl.className = "tra-or-label";
        orLbl.style.cssText = "font-size:10px;font-weight:700;color:rgba(0,122,255,0.8);margin:2px 0 6px";
        orLbl.textContent = "OR";
        rows.appendChild(orLbl);
        const tmp = document.createElement("div");
        tmp.innerHTML = this._traCondRowHtml(gi, ci);
        rows.appendChild(tmp.firstElementChild);
        this._wireTraCondRow(body);
      });
    });
  }
};
var wireTracearrMixin = _WireTraceaRrMethods.prototype;


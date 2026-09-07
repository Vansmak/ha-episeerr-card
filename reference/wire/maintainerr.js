
var _WireMaintainerrMethods = class {
  // ── Poster clicks → open modal ────────────────────────────────────────────
  _wireMaintainerrPosters(right) {
    right.addEventListener("click", (e) => {
      const card = e.target.closest("[data-mt-open]");
      if (!card) return;
      this._openMaintainerrModal(card.dataset.mtOpen);
    });
  }
  // ── Modal lifecycle ───────────────────────────────────────────────────────
  async _openMaintainerrModal(tab) {
    this._markActivated();
    tab = tab || "rules";
    this._maintainerrModal = {
      tab,
      search: "",
      page: 0,
      filterLib: "all",
      filterStatus: "all",
      // View switches are remembered across sessions; offsets and pages are not
      view: this._mtPref("rules-view", "cards", ["cards", "table"]),
      colView: this._mtPref("col-view", "cards", ["cards", "table"]),
      cal: { weekOffset: 0, monthOffset: 0, view: this._mtPref("cal-view", "week", ["week", "month"]), dayModal: null },
      editor: null,
      execStatus: null,
      runningId: null,
      handlingId: null,
      colSearch: "",
      colSubTab: null
    };
    if (!this._maintainerrLibraries?.length) {
      try {
        const libs = await this._hass.callApi("GET", "arr_stack/maintainerr/media-server/libraries").catch(() => null);
        this._maintainerrLibraries = Array.isArray(libs) ? libs : [];
      } catch (_) {
      }
    }
    this.shadowRoot.querySelector("[data-mt-modal]")?.remove();
    const wrap = document.createElement("div");
    wrap.innerHTML = this._mtModalHtml(tab);
    const el = wrap.firstElementChild;
    this.shadowRoot.appendChild(el);
    this._wireMaintainerrModal(el);
    this._mtLoadTab(tab, el);
  }
  // Remembered UI choices. localStorage can throw in locked-down browsers, and
  // a stale value must never leave the control in a state it cannot render.
  _mtPref(key, dflt, allowed) {
    try {
      const v = localStorage.getItem(`arr-mt-${key}`);
      if (v && (!allowed || allowed.includes(v))) return v;
    } catch (_) {
    }
    return dflt;
  }
  _mtPrefSet(key, value) {
    try {
      localStorage.setItem(`arr-mt-${key}`, value);
    } catch (_) {
    }
  }
  _closeMaintainerrModal() {
    this.shadowRoot.querySelector("[data-mt-modal]")?.remove();
    this._maintainerrModal = null;
    this._mtPopupReturn = null;
  }
  // ── Tab loading ───────────────────────────────────────────────────────────
  _mtLoadTab(tab, modal) {
    const el = modal || this.shadowRoot.querySelector("[data-mt-modal]");
    const body = el?.querySelector("#mt-body");
    if (!body) return;
    const m = this._maintainerrModal;
    if (!m) return;
    m.tab = tab;
    const active = this.shadowRoot?.activeElement;
    const focusedId = active && active.tagName === "INPUT" && body.contains(active) ? active.id : null;
    const caret = focusedId ? active.selectionStart : null;
    this._mtRefreshTabBtns(el);
    if (tab === "overview") body.innerHTML = this._mtOverviewTabHtml();
    else if (tab === "rules") body.innerHTML = this._mtRulesTabHtml();
    else if (tab === "collections") body.innerHTML = this._mtCollectionsTabHtml();
    else if (tab === "calendar") body.innerHTML = this._mtCalendarTabHtml();
    if (focusedId) {
      const inp = body.querySelector(`#${focusedId}`);
      if (inp) {
        inp.focus();
        try {
          inp.setSelectionRange(caret, caret);
        } catch (_) {
        }
      }
    }
    const editing = tab === "rules" && !!m.editor;
    const posterView = !editing && (tab === "overview" || tab === "calendar" || tab === "rules" || tab === "collections");
    body.style.display = editing ? "block" : "";
    body.style.setProperty("overflow-y", posterView ? "hidden" : "auto", "important");
    body.style.paddingBottom = posterView ? "8px" : isMobile() ? "16px" : "20px";
    body.style.paddingTop = posterView ? "8px" : isMobile() ? "12px" : "14px";
    if (posterView) {
      this._mtWireDragHandle(el);
      this._mtMeasureGrid(el);
    }
    if (tab === "overview" && !m.overview) this._mtLoadOverview(el);
    if (tab === "calendar" && !this._mtDelItems) this._mtLoadDelMap(el);
    if (tab === "rules" && !m.editor) this._mtMeasureRules(el);
    if (tab === "collections" && !m.colDetail) this._mtMeasureRules(el, "col");
    m.cal && (m.cal._animSeg = false);
    m._animView = false;
    m._animColView = false;
    el.querySelectorAll(".mt-seg[data-seg-to]").forEach((seg) => {
      if (seg.dataset.seg === seg.dataset.segTo) return;
      requestAnimationFrame(() => {
        seg.dataset.seg = seg.dataset.segTo;
      });
    });
    if (tab === "collections" && m.colDetail && m.colSubTab === "info") {
      if (!m.colDetail.logs) this._mtLoadColLogs(el);
      else this._mtMeasureLogs(el);
    }
  }
  // Measure the gap between the top of the grid and the paging row. Reading the
  // grid wrapper's own clientHeight was unreliable — it reports content height
  // whenever the flex chain above it is not filling — which pinned the view to
  // a single row. Comparing two viewport rects does not care about that.
  _mtMeasureGrid(el) {
    const m = this._maintainerrModal;
    if (!m || this._mtMeasuring) return;
    const grid = el?.querySelector("#mt-poster-grid");
    const body = el?.querySelector("#mt-body");
    if (!grid || !body) return;
    const gridTop = grid.getBoundingClientRect().top;
    const pag = el.querySelector("#mt-pag-wrap");
    const bottom = pag ? pag.getBoundingClientRect().top : body.getBoundingClientRect().bottom;
    const h = Math.round(bottom - gridTop);
    const w = grid.parentElement?.clientWidth || grid.clientWidth;
    if (h <= 0 || !w) return;
    if (m._gridAvailH === h && m._gridW === w) return;
    m._gridAvailH = h;
    m._gridW = w;
    this._mtMeasuring = true;
    try {
      if (m.tab === "overview") this._mtLoadOverview(el);
      else this._mtLoadTab(m.tab, el);
    } finally {
      this._mtMeasuring = false;
    }
  }
  // Geometry of the fill as it stands, so a re-render can start the animation
  // from where the old one actually was rather than from where the previous tab
  // is assumed to be — on the first open that assumption was wrong and the fill
  // jumped instead of sliding.
  // Generic: any .mt-nav with an .mt-nav-ind. Maintainerr and Activity share it.
  _navIndRect(nav) {
    const ind = nav?.querySelector(".mt-nav-ind");
    if (!ind) return null;
    const w = parseFloat(ind.style.width);
    const mt = /translateX\(([-\d.]+)px\)/.exec(ind.style.transform || "");
    if (!Number.isFinite(w) || !mt) return null;
    return { w, x: parseFloat(mt[1]) };
  }
  _syncNavInd(nav, btn, from) {
    const ind = nav?.querySelector(".mt-nav-ind");
    if (!nav || !ind || !btn) return;
    const to = { w: btn.offsetWidth, x: btn.offsetLeft };
    const apply = (r, animate) => {
      ind.style.transition = animate ? "" : "none";
      ind.style.width = `${r.w}px`;
      ind.style.transform = `translateX(${r.x}px)`;
    };
    if (!from || from.w === to.w && from.x === to.x) {
      apply(to, false);
      return;
    }
    apply(from, false);
    requestAnimationFrame(() => requestAnimationFrame(() => apply(to, true)));
  }
  // The open sub-tab track carries a fill of its own, placed the same way.
  _syncSubNavInd(nav, from) {
    const wrap = nav?.querySelector(".mt-nav-sub-wrap.is-open");
    if (!wrap) return;
    this._syncNavInd(wrap, wrap.querySelector(".mt-nav-sub.is-on"), from);
  }
  _mtNavIndRect(el) {
    return this._navIndRect(el?.querySelector("#mt-nav"));
  }
  // Places the sliding fill under the active tab. `from` is the fill's previous
  // geometry; applying it first and only then moving gives the transition a
  // changed value to animate, which a freshly written element never has.
  _mtSyncNavInd(el, from) {
    const nav = el?.querySelector("#mt-nav");
    const subFrom = this._navIndRect(nav?.querySelector(".mt-nav-sub-wrap.is-open"));
    this._syncNavInd(nav, nav?.querySelector(`.mt-nav-btn[data-mt-tab="${this._maintainerrModal?.tab}"]`), from);
    requestAnimationFrame(() => this._syncSubNavInd(nav, subFrom));
  }
  _mtRefreshTabBtns(el) {
    const m = this._maintainerrModal;
    if (!m) return;
    const navEl = el?.querySelector("#mt-nav-area");
    if (navEl) {
      const from = this._mtNavIndRect(el);
      navEl.innerHTML = this._mtNavHtml(m.tab);
      this._mtWireTabBtns(el);
      this._mtSyncNavInd(el, from);
      if (m._animateSub) {
        m._animateSub = false;
        const subEl = navEl.querySelector("[data-mt-sub]");
        if (subEl) {
          subEl.style.maxWidth = "0";
          requestAnimationFrame(() => {
            subEl.style.maxWidth = "420px";
            setTimeout(() => this._mtSyncNavInd(el), 260);
          });
        }
      }
    }
    const statusEl = el?.querySelector("#mt-status");
    if (statusEl) statusEl.innerHTML = this._mtStatusHtml();
    const saveEl = el?.querySelector("#mt-hdr-save");
    if (saveEl) saveEl.innerHTML = this._mtHdrSaveHtml();
    const btnEl = el?.querySelector("#mt-hdr-btn");
    if (btnEl) {
      btnEl.innerHTML = this._mtHdrBtnHtml();
      this._mtWireHdrBtn(el);
    }
  }
  // Any edit inside the rule editor flips the header Save button to active.
  // Only the first change needs a repaint.
  _mtMarkEditorDirty(el, target) {
    const ed = this._maintainerrModal?.editor;
    if (!ed || ed._dirty || !target) return;
    const isEditorField = (target.id || "").startsWith("mt-ed-") || target.hasAttribute?.("data-mt-firstval") || target.hasAttribute?.("data-mt-secondval") || target.hasAttribute?.("data-mt-action") || target.hasAttribute?.("data-mt-val");
    if (!isEditorField) return;
    ed._dirty = true;
    const saveEl = el?.querySelector("#mt-hdr-save");
    if (saveEl) saveEl.innerHTML = this._mtHdrSaveHtml();
  }
  _mtWireHdrBtn(el) {
    el.querySelector("#mt-close")?.addEventListener("click", () => this._closeMaintainerrModal());
    el.querySelector("#mt-hdr-back")?.addEventListener("click", () => {
      const m = this._maintainerrModal;
      if (!m) return;
      if (this._mtPopupReturn && m.colDetail && !m.editor && !m.cal?.dayModal) {
        const r = this._mtPopupReturn;
        this._mtPopupReturn = null;
        this._closeMaintainerrModal();
        this._openPopup(r.type, r.tmdbId, r.tvdbId, r.title);
        return;
      }
      if (m.cal?.dayModal) {
        m.cal.dayModal = null;
        this._mtLoadTab("calendar", el);
      } else if (m.editor) {
        m.editor = null;
        this._mtLoadTab("rules", el);
      } else if (m.colDetail) {
        m.colDetail = null;
        m.colSubTab = null;
        this._mtLoadTab("collections", el);
      }
    });
  }
  _mtWireTabBtns(el) {
    el.querySelectorAll("[data-mt-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const t = btn.dataset.mtTab;
        if (!t || !this._maintainerrModal) return;
        this._mtPopupReturn = null;
        this._maintainerrModal.page = 0;
        this._maintainerrModal.editor = null;
        this._maintainerrModal.colDetail = null;
        this._maintainerrModal.colSubTab = null;
        if (this._maintainerrModal.cal) this._maintainerrModal.cal.dayModal = null;
        this._mtLoadTab(t, el);
      });
    });
    el.querySelectorAll("[data-mt-col-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const t = btn.dataset.mtColTab;
        if (!t || !this._maintainerrModal) return;
        this._maintainerrModal.colSubTab = t;
        this._mtLoadTab("collections", el);
      });
    });
  }
  // Horizontal swipe over a poster grid pages it. Delegated on the glass, which
  // survives every body re-render, and it drives the paging buttons rather than
  // the page state so the disabled-at-the-ends handling stays in one place.
  _mtWireSwipe(glass) {
    if (!this._isMob) return;
    const THRESHOLD = 45;
    let sx = null, sy = null;
    glass.addEventListener("touchstart", (e) => {
      if (!e.target.closest("#mt-poster-grid")) {
        sx = null;
        return;
      }
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    }, { passive: true });
    glass.addEventListener("touchend", (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) < THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const which = dx < 0 ? "next" : "prev";
      const btn = glass.querySelector(
        `[data-mt-ov-page="${which}"],[data-mt-col-d-page="${which}"],[data-mt-col-excl-page="${which}"]`
      );
      if (btn && !btn.disabled) btn.click();
    }, { passive: true });
  }
  // ── Modal wiring ──────────────────────────────────────────────────────────
  _wireMaintainerrModal(el) {
    el.addEventListener("click", (e) => {
      if (e.target === el) this._closeMaintainerrModal();
    });
    this._mtWireTabBtns(el);
    this._mtWireHdrBtn(el);
    requestAnimationFrame(() => this._mtSyncNavInd(el));
    const glass = el.querySelector(".popup-glass");
    if (!glass) return;
    this._mtWireSwipe(glass);
    glass.addEventListener("click", (e) => {
      const m = this._maintainerrModal;
      if (!m) return;
      const pageBtn = e.target.closest("[data-mt-page]");
      if (pageBtn) {
        m.page = this._mtParsePageN(pageBtn.dataset.mtPage, m.page || 0, m.rulesPages || 1);
        this._mtLoadTab(m.tab, el);
        return;
      }
      const runBtn = e.target.closest("[data-mt-run]");
      if (runBtn) {
        this._mtRunRule(parseInt(runBtn.dataset.mtRun), el);
        return;
      }
      if (e.target.closest("[data-mt-run-all]")) {
        this._mtRunAllRules(el);
        return;
      }
      const delBtn = e.target.closest("[data-mt-delete]");
      if (delBtn) {
        m.confirmDelete = parseInt(delBtn.dataset.mtDelete);
        this._mtLoadTab(m.tab, el);
        return;
      }
      const delNow = e.target.closest("[data-mt-delete-now]");
      if (delNow) {
        if (confirm(this._t("mtConfirmDelete"))) this._mtDeleteRule(parseInt(delNow.dataset.mtDeleteNow), el);
        return;
      }
      const delOk = e.target.closest("[data-mt-del-confirm]");
      if (delOk) {
        m.confirmDelete = null;
        this._mtDeleteRule(parseInt(delOk.dataset.mtDelConfirm), el);
        return;
      }
      if (e.target.closest("[data-mt-del-cancel]")) {
        m.confirmDelete = null;
        this._mtLoadTab(m.tab, el);
        return;
      }
      const editBtn = e.target.closest("[data-mt-edit]");
      if (editBtn) {
        this._mtOpenEditor(parseInt(editBtn.dataset.mtEdit), el);
        return;
      }
      if (e.target.closest("[data-mt-new]")) {
        this._mtOpenEditor(null, el);
        return;
      }
      if (e.target.closest("[data-mt-cancel]")) {
        m.editor = null;
        this._mtLoadTab("rules", el);
        return;
      }
      if (e.target.closest("[data-mt-save]")) {
        if (m.editor?._dirty) this._mtSaveRule(el);
        return;
      }
      const edSec = e.target.closest("[data-mt-ed-sec]");
      if (edSec && m.editor) {
        const key = edSec.dataset.mtEdSec;
        this._mtSyncEditorFields(el);
        m.editorSection = m.editorSection === key ? null : key;
        this._mtReRenderEditor(el);
        return;
      }
      if (m.editor && e.target.closest("[data-mt-add-section],[data-mt-add-rule],[data-mt-del-rule],[data-mt-del-section],[data-mt-toggle-sec-op],[data-mt-toggle-op]")) {
        m.editor._dirty = true;
      }
      if (e.target.closest("[data-mt-add-section]")) {
        this._mtAddSection(el);
        return;
      }
      const addRuleBtn = e.target.closest("[data-mt-add-rule]");
      if (addRuleBtn) {
        this._mtAddRuleToSection(parseInt(addRuleBtn.dataset.mtAddRule), el);
        return;
      }
      const delRuleBtn = e.target.closest("[data-mt-del-rule]");
      if (delRuleBtn) {
        this._mtDeleteEditorRule(delRuleBtn.dataset.mtDelRule, el);
        return;
      }
      const delSecBtn = e.target.closest("[data-mt-del-section]");
      if (delSecBtn) {
        this._mtDeleteSection(parseInt(delSecBtn.dataset.mtDelSection), el);
        return;
      }
      const togSecOp = e.target.closest("[data-mt-toggle-sec-op]");
      if (togSecOp) {
        this._mtToggleSectionOp(parseInt(togSecOp.dataset.mtToggleSecOp), el);
        return;
      }
      const togOp = e.target.closest("[data-mt-toggle-op]");
      if (togOp) {
        this._mtToggleRuleOp(togOp.dataset.mtToggleOp, el);
        return;
      }
      const colViewSeg = e.target.closest("[data-mt-col-view-seg]");
      if (colViewSeg) {
        m.colView = m.colView === "table" ? "cards" : "table";
        m.colPage = 0;
        m.colPerPage = null;
        this._mtPrefSet("col-view", m.colView);
        m._animColView = true;
        this._mtLoadTab("collections", el);
        return;
      }
      const colPageBtn = e.target.closest("[data-mt-col-page]");
      if (colPageBtn) {
        m.colPage = this._mtParsePageN(colPageBtn.dataset.mtColPage, m.colPage || 0, m.colPages || 1);
        this._mtLoadTab("collections", el);
        return;
      }
      const viewSeg = e.target.closest("[data-mt-view-seg]");
      if (viewSeg) {
        m.view = m.view === "table" ? "cards" : "table";
        m.page = 0;
        m.rulesPerPage = null;
        this._mtPrefSet("rules-view", m.view);
        m._animView = true;
        this._mtLoadTab(m.tab, el);
        return;
      }
      const calSeg = e.target.closest("[data-mt-cal-seg]");
      if (calSeg && m.cal) {
        m.cal.view = m.cal.view === "month" ? "week" : "month";
        m.cal.dayModal = null;
        m.cal._animSeg = true;
        this._mtPrefSet("cal-view", m.cal.view);
        this._mtLoadTab("calendar", el);
        return;
      }
      const calNav = e.target.closest("[data-mt-cal-nav]");
      if (calNav) {
        const cal = m.cal || (m.cal = { weekOffset: 0, monthOffset: 0, view: "week", dayModal: null });
        const v = calNav.dataset.mtCalNav;
        if (cal.view === "month") {
          if (v === "today") cal.monthOffset = 0;
          else if (v === "prev") cal.monthOffset = (cal.monthOffset || 0) - 1;
          else if (v === "next") cal.monthOffset = (cal.monthOffset || 0) + 1;
        } else {
          if (v === "today") cal.weekOffset = 0;
          else if (v === "prev") cal.weekOffset -= 1;
          else if (v === "next") cal.weekOffset += 1;
          else if (v === "prev-month") cal.weekOffset -= 4;
          else if (v === "next-month") cal.weekOffset += 4;
        }
        this._mtLoadTab("calendar", el);
        return;
      }
      const calDay = e.target.closest("[data-mt-cal-day]");
      if (calDay) {
        const cal = m.cal || (m.cal = {});
        cal.dayModal = calDay.dataset.mtCalDay;
        cal.dayPage = 0;
        this._mtLoadTab("calendar", el);
        return;
      }
      const calDayPage = e.target.closest("[data-mt-cal-day-page]");
      if (calDayPage && m.cal) {
        m.cal.dayPage = this._mtParsePageN(calDayPage.dataset.mtCalDayPage, m.cal.dayPage || 0, m.cal.dayPages || 1);
        this._mtLoadTab("calendar", el);
        return;
      }
      const calCol = e.target.closest("[data-mt-cal-col]");
      if (calCol) {
        m.cal.dayModal = null;
        m.colSubTab = "media";
        this._mtOpenCollectionDetail(parseInt(calCol.dataset.mtCalCol), el);
        return;
      }
      const calItem = e.target.closest("[data-mt-cal-item]");
      if (calItem) {
        const it = (this._mtDelItems || [])[parseInt(calItem.dataset.mtCalItem)];
        if (it && (it.tmdbId || it.tvdbId)) {
          this._mtReturnState = { tab: m.tab, overview: m.overview, colDetail: m.colDetail, colSubTab: m.colSubTab, cal: m.cal };
          this._closeMaintainerrModal();
          this._openPopup(it.popupType, it.tmdbId ? String(it.tmdbId) : null, it.tvdbId ? String(it.tvdbId) : null, it.title);
        }
        return;
      }
      if (e.target.closest("[data-mt-cal-close]") || e.target.matches("[data-mt-cal-backdrop]")) {
        m.cal.dayModal = null;
        this._mtLoadTab("calendar", el);
        return;
      }
      if (e.target.closest("[data-mt-handle-all]")) {
        this._mtHandleAllCollections(el);
        return;
      }
      const handleBtn = e.target.closest("[data-mt-handle]");
      if (handleBtn) {
        this._mtHandleCollection(parseInt(handleBtn.dataset.mtHandle), el);
        return;
      }
      const detailBtn = e.target.closest("[data-mt-col-detail]");
      if (detailBtn) {
        this._mtOpenCollectionDetail(parseInt(detailBtn.dataset.mtColDetail), el);
        return;
      }
      const ovPage = e.target.closest("[data-mt-ov-page]");
      if (ovPage && m.overview) {
        const ov = m.overview;
        const searching = !!(ov.search || "").trim();
        const total = searching ? (ov.searchItems || []).length : ov.totalSize || 0;
        ov.page = this._mtParsePage(ovPage.dataset.mtOvPage, ov.page || 0, total, ov);
        if (searching) this._mtLoadTab("overview", el);
        else this._mtLoadOverview(el);
        return;
      }
      const logPage = e.target.closest("[data-mt-log-page]");
      if (logPage && m.colDetail?.logs) {
        const lg = m.colDetail.logs;
        lg.page = this._mtParsePageN(logPage.dataset.mtLogPage, lg.page || 0, Math.ceil((lg.total || 0) / (lg.perPage || 25)));
        this._mtLoadColLogs(el);
        return;
      }
      const ovAdd = e.target.closest("[data-mt-ov-add]");
      if (ovAdd) {
        this._mtOpenOvDialog("collection", ovAdd.dataset.mtOvAdd, el);
        return;
      }
      const ovExcl = e.target.closest("[data-mt-ov-excl]");
      if (ovExcl) {
        this._mtOpenOvDialog("exclusion", ovExcl.dataset.mtOvExcl, el);
        return;
      }
      if (e.target.closest("[data-mt-ov-dlg-cancel]")) {
        m.overview.dialog = null;
        this._mtLoadTab("overview", el);
        return;
      }
      if (e.target.closest("[data-mt-ov-dlg-submit]")) {
        this._mtSubmitOvDialog(el);
        return;
      }
      if (e.target.closest("[data-mt-ov-dlg-removeall]")) {
        this._mtSubmitOvDialog(el, true);
        return;
      }
      if (e.target.matches("[data-mt-ov-dlg-backdrop]")) {
        m.overview.dialog = null;
        this._mtLoadTab("overview", el);
        return;
      }
      const colDPage = e.target.closest("[data-mt-col-d-page]");
      if (colDPage && m.colDetail) {
        m.colDetail.page = this._mtParsePage(colDPage.dataset.mtColDPage, m.colDetail.page, m.colDetail.items?.length || 0, m.colDetail);
        this._mtLoadTab("collections", el);
        return;
      }
      const unexclBtn = e.target.closest("[data-mt-unexclude]");
      if (unexclBtn && m.colDetail) {
        this._mtUnexcludeItem(parseInt(unexclBtn.dataset.mtUnexclude), el);
        return;
      }
      const exclPageBtn = e.target.closest("[data-mt-col-excl-page]");
      if (exclPageBtn && m.colDetail) {
        m.colDetail.exclPage = this._mtParsePage(exclPageBtn.dataset.mtColExclPage, m.colDetail.exclPage || 0, (m.colDetail.exclusionItems || []).length, m.colDetail);
        this._mtLoadTab("collections", el);
        return;
      }
      const exclBtn = e.target.closest("[data-mt-exclude]");
      if (exclBtn && m.colDetail) {
        m.colDetail.confirmExclude = exclBtn.dataset.mtExclude;
        this._mtLoadTab("collections", el);
        return;
      }
      const exclCancel = e.target.closest("[data-mt-exclude-cancel]");
      if (exclCancel && m.colDetail) {
        m.colDetail.confirmExclude = null;
        this._mtLoadTab("collections", el);
        return;
      }
      const exclConfirm = e.target.closest("[data-mt-exclude-confirm]");
      if (exclConfirm && m.colDetail) {
        this._mtExcludeItem(exclConfirm.dataset.mtExcludeConfirm, el);
        return;
      }
      const ovCard = e.target.closest("[data-mt-popup]");
      if (ovCard) {
        this._mtReturnState = { tab: m.tab, overview: m.overview, colDetail: m.colDetail, colSubTab: m.colSubTab, cal: m.cal };
        this._closeMaintainerrModal();
        this._openPopup(ovCard.dataset.mtPopup, ovCard.dataset.tmdbid || null, ovCard.dataset.tvdbid || null, ovCard.dataset.title || "");
        return;
      }
    });
    glass.addEventListener("input", (e) => {
      const m = this._maintainerrModal;
      if (!m) return;
      this._mtMarkEditorDirty(el, e.target);
      if (e.target.id === "mt-search") {
        clearTimeout(m._searchTimer);
        const v = e.target.value;
        m._searchTimer = setTimeout(() => {
          m.search = v;
          m.page = 0;
          this._mtLoadTab(m.tab, el);
        }, 600);
        return;
      }
      if (e.target.id === "mt-col-search") {
        clearTimeout(m._colSearchTimer);
        const v = e.target.value;
        m._colSearchTimer = setTimeout(() => {
          m.colSearch = v;
          this._mtLoadTab(m.tab, el);
        }, 600);
        return;
      }
      if (e.target.id === "mt-log-search" && m.colDetail?.logs) {
        clearTimeout(m._logSearchTimer);
        const v = e.target.value;
        m._logSearchTimer = setTimeout(() => this._mtLoadColLogs(el, { search: v, page: 0 }), 600);
        return;
      }
      if (e.target.id === "mt-ov-search" && m.overview) {
        clearTimeout(m._ovSearchTimer);
        const v = e.target.value;
        m._ovSearchTimer = setTimeout(() => {
          m.overview.search = v;
          m.overview.page = 0;
          this._mtLoadOverview(el);
        }, 600);
        return;
      }
      if (e.target.id === "mt-col-d-search" && m.colDetail) {
        clearTimeout(m._colDSearchTimer);
        const v = e.target.value;
        m._colDSearchTimer = setTimeout(() => {
          m.colDetail.search = v;
          m.colDetail.page = 0;
          this._mtLoadTab(m.tab, el);
        }, 600);
        return;
      }
      if (e.target.id === "mt-col-excl-search" && m.colDetail) {
        clearTimeout(m._colExclSearchTimer);
        const v = e.target.value;
        m._colExclSearchTimer = setTimeout(() => {
          m.colDetail.exclSearch = v;
          m.colDetail.exclPage = 0;
          this._mtLoadTab(m.tab, el);
        }, 600);
        return;
      }
    });
    glass.addEventListener("change", (e) => {
      const m = this._maintainerrModal;
      if (!m) return;
      this._mtMarkEditorDirty(el, e.target);
      this._tbSyncSelect(e.target);
      if (e.target.id === "mt-log-sort" && m.colDetail?.logs) {
        this._mtLoadColLogs(el, { sort: e.target.value, page: 0 });
        return;
      }
      if (e.target.id === "mt-log-filter" && m.colDetail?.logs) {
        this._mtLoadColLogs(el, { filter: e.target.value, page: 0 });
        return;
      }
      if (e.target.id === "mt-ov-lib" && m.overview) {
        m.overview.libId = e.target.value;
        m.overview.page = 0;
        this._mtLoadOverview(el);
        return;
      }
      if (e.target.id === "mt-ov-sort" && m.overview) {
        m.overview.sort = e.target.value;
        m.overview.page = 0;
        this._mtLoadOverview(el);
        return;
      }
      if (e.target.id === "mt-ov-dlg-action" && m.overview?.dialog) {
        m.overview.dialog.action = e.target.value;
        return;
      }
      if (e.target.id === "mt-ov-dlg-col" && m.overview?.dialog) {
        m.overview.dialog.collectionId = e.target.value;
        return;
      }
      if (e.target.id === "mt-filter-lib") {
        m.filterLib = e.target.value;
        m.page = 0;
        this._mtLoadTab(m.tab, el);
        return;
      }
      if (e.target.id === "mt-filter-status") {
        m.filterStatus = e.target.value;
        m.page = 0;
        this._mtLoadTab(m.tab, el);
        return;
      }
      if (e.target.id === "mt-col-filter-lib") {
        m.colFilterLib = e.target.value;
        this._mtLoadTab(m.tab, el);
        return;
      }
      if (e.target.id === "mt-col-d-sort" && m.colDetail) {
        this._mtRefetchColMedia(e.target.value, el);
        return;
      }
      if (e.target.id === "mt-col-excl-sort" && m.colDetail) {
        this._mtRefetchColExclusions(e.target.value, el);
        return;
      }
      if (m.editor) {
        this._mtSyncEditorFields(el);
        const fvSel = e.target.closest("[data-mt-firstval]");
        if (fvSel) {
          this._mtReRenderEditor(el);
          return;
        }
        const svSel = e.target.closest("[data-mt-secondval]");
        if (svSel) {
          this._mtReRenderEditor(el);
          return;
        }
      }
    });
  }
  // opts: { err } red badge, { spin } leading spinner.
  // duration 0 keeps the badge until the next _mtShowStatus call.
  _mtShowStatus(msg, modal, duration = 4e3, opts = {}) {
    const m = this._maintainerrModal;
    if (!m) return;
    m._statusMsg = msg;
    m._statusErr = !!opts.err;
    m._statusSpin = !!opts.spin;
    m._statusProg = opts.prog ?? null;
    const status = (modal || this.shadowRoot.querySelector("[data-mt-modal]"))?.querySelector("#mt-status");
    if (status) status.innerHTML = this._mtStatusHtml();
    clearTimeout(m._statusTimer);
    if (!duration) return;
    m._statusTimer = setTimeout(() => {
      if (this._maintainerrModal === m) {
        m._statusMsg = null;
        m._statusErr = false;
        m._statusSpin = false;
        m._statusProg = null;
        const s2 = (modal || this.shadowRoot.querySelector("[data-mt-modal]"))?.querySelector("#mt-status");
        if (s2) s2.innerHTML = this._mtStatusHtml();
      }
    }, duration);
  }
  // Maintainerr's execute/handle endpoints only enqueue, so completion has to be
  // polled. Resolves true once `check` reports done, false on timeout or if the
  // modal closed in the meantime.
  async _mtPollUntil(check, interval = 2e3, timeout = 9e5) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      await new Promise((r) => setTimeout(r, interval));
      if (!this._maintainerrModal) return false;
      try {
        if (await check()) return true;
      } catch (_) {
      }
    }
    return false;
  }
  // Same first/prev/next/last vocabulary as _mtParsePage, but for lists whose
  // page count is already known rather than derived from a grid.
  _mtRuleName(id) {
    if (id == null) return "";
    const r = (this._maintainerr?.rules || []).find((x) => x.id === id);
    return r?.name || `#${id}`;
  }
  _mtParsePageN(val, curPage, totalPages) {
    const last = Math.max(0, totalPages - 1);
    if (val === "first") return 0;
    if (val === "last") return last;
    if (val === "prev") return Math.max(0, curPage - 1);
    if (val === "next") return Math.min(last, curPage + 1);
    const n = parseInt(val);
    return Number.isFinite(n) ? Math.max(0, Math.min(last, n)) : curPage;
  }
  _mtParsePage(val, curPage, totalItems, cd) {
    const { perPage } = this._mtGridCalc(cd, 90);
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
    if (val === "first") return 0;
    if (val === "prev") return Math.max(0, curPage - 1);
    if (val === "next") return Math.min(totalPages - 1, curPage + 1);
    if (val === "last") return totalPages - 1;
    return parseInt(val) || 0;
  }
  _mtWireDragHandle(el) {
    const handle = el.querySelector("#mt-drag-handle");
    const track = el.querySelector("#mt-drag-track");
    const thumb = el.querySelector("#mt-drag-thumb");
    if (!handle || !track) return;
    const MIN = 3, MAX = 12, INSET = 7;
    let startX = 0, startCols = 0;
    const m = this._maintainerrModal;
    const cd = m?.tab === "overview" ? m.overview : m?.colDetail;
    if (!cd) return;
    const _thumbPx = (cols, tW) => Math.round((cols - MIN) / (MAX - MIN) * (tW - INSET * 2)) + INSET;
    const _updateUI = (cols) => {
      const tW = track.getBoundingClientRect().width || 120;
      const px = _thumbPx(cols, tW);
      if (thumb) thumb.style.left = px + "px";
      const fill = track.firstElementChild;
      if (fill) {
        fill.style.left = "0";
        fill.style.width = px + "px";
      }
      const grid = el.querySelector("#mt-poster-grid");
      if (grid) grid.style.gridTemplateColumns = `repeat(${cols},1fr)`;
    };
    const _colsFromDx = (dx) => {
      const tW = track.getBoundingClientRect().width || 120;
      const eff = tW - INSET * 2;
      const startPx = _thumbPx(startCols, tW) - INSET;
      const newFrac = Math.max(0, Math.min(1, (startPx + dx) / eff));
      return Math.max(MIN, Math.min(MAX, MIN + Math.round(newFrac * (MAX - MIN))));
    };
    handle.addEventListener("pointerdown", (e) => {
      startX = e.clientX;
      startCols = cd._mtCols || 7;
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    handle.addEventListener("pointermove", (e) => {
      if (!handle.hasPointerCapture(e.pointerId)) return;
      _updateUI(_colsFromDx(e.clientX - startX));
    });
    handle.addEventListener("pointerup", (e) => {
      if (!handle.hasPointerCapture(e.pointerId)) return;
      const newCols = _colsFromDx(e.clientX - startX);
      cd._mtCols = newCols;
      try {
        localStorage.setItem("arr-mt-cols", String(newCols));
      } catch (_) {
      }
      if (m.tab === "overview") this._mtLoadOverview(el);
      else this._mtLoadTab(m.tab, el);
    });
  }
  // ──────────────────────────────────────────────────────────────────────────
  // CRUD operations
  // ──────────────────────────────────────────────────────────────────────────
  async _mtRunRule(id, modal) {
    const m = this._maintainerrModal;
    if (!m || !id) return;
    const rule = (this._maintainerr?.rules || []).find((r) => r.id === id);
    const ruleName = rule?.name || `#${id}`;
    m.runningId = id;
    this._mtLoadTab(m.tab, modal);
    try {
      await this._hass.callApi("POST", `arr_stack/maintainerr/rules/${id}/execute`);
      this._mtShowStatus(`${this._t("mtProcessing")}: ${ruleName}`, modal, 0, { prog: true });
      await this._mtPollUntil(async () => {
        const s = await this._hass.callApi("GET", "arr_stack/maintainerr/rules/execute/status");
        return s?.executingRuleGroupId !== id && !(s?.pendingRuleGroupIds || []).includes(id);
      });
      this._mtShowStatus(`${this._t("mtFinishedExec")} '${ruleName}'`, modal);
    } catch (e) {
      console.warn("[arr-card] Maintainerr run rule:", e);
      this._mtShowStatus(`${this._t("mtRunFailed")}: ${e.message || e}`, modal, 8e3, { err: true });
    }
    m.runningId = null;
    await this._fetchMaintainerr();
    if (this._maintainerrModal) this._mtLoadTab(m.tab, modal);
  }
  async _mtRunAllRules(modal) {
    const m = this._maintainerrModal;
    if (!m) return;
    try {
      await this._hass.callApi("POST", "arr_stack/maintainerr/rules/execute");
      m.execStatus = "running";
      this._mtShowStatus(this._t("mtRunning"), modal, 0, { spin: true, prog: true });
      this._mtLoadTab(m.tab, modal);
      let total = 0;
      await this._mtPollUntil(async () => {
        const s = await this._hass.callApi("GET", "arr_stack/maintainerr/rules/execute/status");
        const pending = (s?.pendingRuleGroupIds || []).length;
        const running = s?.executingRuleGroupId != null ? 1 : 0;
        total = Math.max(total, pending + running);
        const done = Math.max(0, total - pending - running);
        const name = this._mtRuleName(s?.executingRuleGroupId);
        this._mtShowStatus(
          name ? `${this._t("mtProcessing")}: ${name}` : this._t("mtRunning"),
          modal,
          0,
          { spin: !name, prog: total > 1 ? { done, total } : true }
        );
        return !s?.processingQueue && !pending;
      }, 1200);
      if (!this._maintainerrModal) return;
      m.execStatus = null;
      this._mtShowStatus(this._t("mtFinishedExecAll"), modal);
      await this._fetchMaintainerr();
      if (this._maintainerrModal) this._mtLoadTab(m.tab, modal);
    } catch (e) {
      console.warn("[arr-card] Maintainerr run all:", e);
      m.execStatus = null;
      this._mtShowStatus(`${this._t("mtRunFailed")}: ${e.message || e}`, modal, 8e3, { err: true });
      this._mtLoadTab(m.tab, modal);
    }
  }
  async _mtDeleteRule(id, modal) {
    try {
      await this._hass.callApi("DELETE", `arr_stack/maintainerr/rules/${id}`);
      await this._fetchMaintainerr();
      if (this._maintainerrModal) this._mtLoadTab("rules", modal);
    } catch (e) {
      console.warn("[arr-card] Maintainerr delete:", e);
    }
  }
  async _mtHandleCollection(id, modal) {
    const m = this._maintainerrModal;
    if (!m) return;
    const col = (this._maintainerr?.collections || []).find((c) => c.id === id);
    const colName = col?.title || col?.name || `#${id}`;
    m.handlingId = id;
    this._mtLoadTab(m.tab, modal);
    try {
      await this._hass.callApi("POST", `arr_stack/maintainerr/collections/${id}/handle`);
      this._mtShowStatus(`${this._t("mtFinishedHandle")} '${colName}'`, modal);
    } catch (e) {
      console.warn("[arr-card] Maintainerr handle:", e);
    }
    m.handlingId = null;
    await this._fetchMaintainerr();
    if (this._maintainerrModal) this._mtLoadTab(m.tab, modal);
  }
  async _mtHandleAllCollections(modal) {
    const m = this._maintainerrModal;
    if (!m) return;
    try {
      await this._hass.callApi("POST", "arr_stack/maintainerr/collections/handle");
      m.execStatus = "running";
      this._mtShowStatus(this._t("mtRunning"), modal, 0, { spin: true });
      this._mtLoadTab(m.tab, modal);
      await this._mtPollUntil(async () => {
        const s = await this._hass.callApi("GET", `arr_stack/maintainerr/tasks/${encodeURIComponent("Collection Handler")}/status`);
        return s?.running === false;
      }, 2500);
      if (!this._maintainerrModal) return;
      m.execStatus = null;
      this._mtShowStatus(this._t("mtFinishedHandleAll"), modal);
      await this._fetchMaintainerr();
      if (this._maintainerrModal) this._mtLoadTab(m.tab, modal);
    } catch (e) {
      console.warn("[arr-card] Maintainerr handle all:", e);
      m.execStatus = null;
      this._mtShowStatus(`${this._t("mtRunFailed")}: ${e.message || e}`, modal, 8e3, { err: true });
      this._mtLoadTab(m.tab, modal);
    }
  }
  async _mtRefetchColMedia(sortVal, modal) {
    const m = this._maintainerrModal;
    if (!m?.colDetail) return;
    const cd = m.colDetail;
    cd.sort = sortVal;
    cd.page = 0;
    const [sortKey, sortOrder] = sortVal.split("-");
    const body = modal?.querySelector("#mt-body");
    if (body) body.innerHTML = `<div class="is-loading"><span>${this._t("loading")}</span></div>`;
    try {
      const data = await this._hass.callApi("GET", `arr_stack/maintainerr/collections/media/${cd.id}/content/1?sort=${sortKey}&sortOrder=${sortOrder || "asc"}&size=500`);
      cd.items = Array.isArray(data) ? data : data?.items || data?.data || [];
    } catch (e) {
      console.warn("[arr-card] Maintainerr refetch media:", e);
    }
    this._mtLoadTab("collections", modal);
  }
  async _mtRefetchColExclusions(sortVal, modal) {
    const m = this._maintainerrModal;
    if (!m?.colDetail) return;
    const cd = m.colDetail;
    cd.exclSort = sortVal;
    cd.exclPage = 0;
    const [sortKey, sortOrder] = sortVal.split("-");
    const body = modal?.querySelector("#mt-body");
    if (body) body.innerHTML = `<div class="is-loading"><span>${this._t("loading")}</span></div>`;
    try {
      const exclResp = await this._hass.callApi("GET", `arr_stack/maintainerr/collections/exclusions/${cd.id}/content/1?sort=${sortKey}&sortOrder=${sortOrder || "desc"}&size=500`);
      const exclArr = exclResp?.items || (Array.isArray(exclResp) ? exclResp : []);
      const tmdbPosterMap = /* @__PURE__ */ new Map();
      (this._radarr || []).forEach((m2) => {
        if (m2.tmdbId) {
          const p = (m2.images || []).find((i) => i.coverType === "poster");
          if (p?.remoteUrl) tmdbPosterMap.set(String(m2.tmdbId), p.remoteUrl);
        }
      });
      cd.exclusionItems = exclArr.map((e) => {
        const md = e.mediaData || {};
        const tmdbArr = md.providerIds?.tmdb || [];
        const tmdbId = tmdbArr[0] || null;
        return {
          id: e.id,
          mediaServerId: e.mediaServerId,
          title: md.title || `ID ${e.mediaServerId || "?"}`,
          type: e.type || md.type || "movie",
          tmdbId,
          image_path: tmdbId && tmdbPosterMap.has(String(tmdbId)) ? tmdbPosterMap.get(String(tmdbId)) : ""
        };
      });
    } catch (e) {
      console.warn("[arr-card] Maintainerr refetch exclusions:", e);
    }
    this._mtLoadTab("collections", modal);
  }
  // Collection list responses carry no media, so Overview pulls each
  // collection's content and merges it into one deletion-ordered list.
  // Overview browses the media server library directly. The list endpoint pages
  // server-side; search returns everything at once and is paged in the renderer.
  async _mtLoadOverview(modal) {
    const m = this._maintainerrModal;
    if (!m) return;
    if (!m.overview) m.overview = { libId: null, page: 0, sort: "title-asc", search: "", items: [], totalSize: 0 };
    const ov = m.overview;
    if (!this._maintainerrLibraries?.length) {
      try {
        const libs = await this._hass.callApi("GET", "arr_stack/maintainerr/media-server/libraries").catch(() => null);
        this._maintainerrLibraries = Array.isArray(libs) ? libs : [];
      } catch (_) {
      }
    }
    if (!ov.libId) ov.libId = this._maintainerrLibraries?.[0]?.id ?? null;
    if (!ov.libId) {
      ov.loading = false;
      return;
    }
    const lib = (this._maintainerrLibraries || []).find((l) => String(l.id) === String(ov.libId));
    const [sortKey, sortOrder] = (ov.sort || "title-asc").split("-");
    const { perPage } = this._mtGridCalc(ov, 90);
    const q = (ov.search || "").trim();
    ov.loading = true;
    if (m.tab === "overview") this._mtLoadTab("overview", modal);
    try {
      if (q) {
        const typeQ = lib?.type ? `?type=${encodeURIComponent(lib.type)}` : "";
        const data = await this._hass.callApi("GET", `arr_stack/maintainerr/media-server/library/${ov.libId}/content/search/${encodeURIComponent(q)}${typeQ}`);
        ov.searchItems = Array.isArray(data) ? data : [];
        ov.items = [];
        ov.totalSize = ov.searchItems.length;
      } else {
        const params = new URLSearchParams({
          page: String((ov.page || 0) + 1),
          limit: String(perPage),
          sort: sortKey,
          sortOrder: sortOrder || "asc"
        });
        if (lib?.type) params.set("type", lib.type);
        const data = await this._hass.callApi("GET", `arr_stack/maintainerr/media-server/library/${ov.libId}/content?${params}`);
        ov.items = data?.items || [];
        ov.totalSize = data?.totalSize ?? ov.items.length;
        ov.searchItems = null;
      }
    } catch (e) {
      console.warn("[arr-card] Maintainerr overview:", e);
      ov.items = [];
      ov.searchItems = null;
      ov.totalSize = 0;
    }
    if (!this._maintainerrModal) return;
    ov.loading = false;
    if (m.tab === "overview") this._mtLoadTab("overview", modal);
    this._mtLoadDelMap(modal);
    this._mtResolvePosters(ov.searchItems || ov.items, modal);
  }
  // Deletion dates live on the collection membership rows, not on library items,
  // so build one mediaServerId -> daysLeft map from every collection's contents.
  // Refreshed with every poll, not cached on first open: the Maintainerr
  // category card previews the next deletions, so this has to stay current
  // whether or not the modal was ever opened.
  async _mtLoadDelMap(modal) {
    if (this._mtDelLoading) return;
    const cols = this._maintainerr?.collections || [];
    if (!cols.length) {
      this._mtDelMap = /* @__PURE__ */ new Map();
      this._mtDelItems = [];
      return;
    }
    const map = /* @__PURE__ */ new Map();
    const ext = /* @__PURE__ */ new Map();
    const memb = /* @__PURE__ */ new Map();
    const items = [];
    this._mtDelLoading = true;
    try {
      const results = await Promise.all(cols.map(
        (c) => this._hass.callApi("GET", `arr_stack/maintainerr/collections/media/${c.id}/content/1?size=1000`).catch(() => null)
      ));
      results.forEach((data, i) => {
        const c = cols[i];
        const arr = Array.isArray(data) ? data : data?.items || data?.data || [];
        arr.forEach((row) => {
          const due = this._mtDueMs(row.addDate, c.deleteAfterDays);
          if (due == null || !row.mediaServerId) return;
          const put = (key, entry) => {
            if (!key) return;
            const prev = map.get(String(key));
            if (!prev || entry.due < prev.due) map.set(String(key), entry);
          };
          put(row.mediaServerId, { due, colTitle: c.title });
          const _md = row.mediaData;
          const _isMovie = (_md?.type || c.type) === "movie";
          const _season = _md?.type === "season" ? _md.index : null;
          const extKeys = _isMovie ? row.tmdbId ? [`mv:${row.tmdbId}`] : [] : [
            ...row.tvdbId ? [`tv:tvdb:${row.tvdbId}`] : [],
            ...row.tmdbId ? [`tv:tmdb:${row.tmdbId}`] : []
          ];
          const _day = (ms) => Math.floor(ms / 864e5);
          for (const k of extKeys) {
            let set = memb.get(k);
            if (!set) {
              set = /* @__PURE__ */ new Set();
              memb.set(k, set);
            }
            set.add(String(c.id));
          }
          for (const k of extKeys) {
            const prev = ext.get(k);
            if (!prev || _day(due) < _day(prev.due)) {
              ext.set(k, { due, seasons: _season != null ? [_season] : [], colId: c.id, colTitle: c.title });
            } else if (_day(due) === _day(prev.due)) {
              prev.due = Math.min(prev.due, due);
              if (_season != null && !prev.seasons.includes(_season)) prev.seasons.push(_season);
            }
          }
          const md = row.mediaData;
          const isSeason = md?.type === "season";
          const base = isSeason ? md.parentTitle || md.title : md?.title || `#${row.mediaServerId}`;
          items.push({
            due,
            addDate: row.addDate,
            title: isSeason && md.index != null ? `${base} \u2014 ${this._t("mtSeason")} ${md.index}` : base,
            typeLabel: { movie: "Movie", show: "Show", season: "Season", episode: "Episode" }[md?.type] || (c.type || "\u2014"),
            colId: c.id,
            colTitle: c.title || `#${c.id}`,
            // Enough to open the media detail popup straight from the calendar
            tmdbId: row.tmdbId ?? null,
            tvdbId: row.tvdbId ?? null,
            popupType: (md?.type || c.type) === "movie" ? "movie" : "tv",
            // Kept so the calendar can render the same poster card as elsewhere
            raw: row,
            mediaType: md?.type || c.type || "movie",
            seasonIndex: isSeason ? md.index : null
          });
          if (isSeason && md.parentId != null) {
            const key = String(md.parentId);
            const prev = map.get(key);
            const day = (ms) => Math.floor(ms / 864e5);
            if (!prev || !prev.seasons || day(due) < day(prev.due)) {
              map.set(key, { due, colTitle: c.title, seasons: [md.index] });
            } else if (day(due) === day(prev.due)) {
              prev.due = Math.min(prev.due, due);
              prev.seasons.push(md.index);
            }
          }
        });
      });
    } catch (e) {
      console.warn("[arr-card] Maintainerr deletion map:", e);
    } finally {
      this._mtDelLoading = false;
    }
    this._mtDelMap = map;
    this._mtDelExt = ext;
    this._mtColMemb = memb;
    this._mtDelItems = items;
    const tab = this._maintainerrModal?.tab;
    if (modal && (tab === "overview" || tab === "calendar")) this._mtLoadTab(tab, modal);
  }
  // Fill in artwork the *arr libraries could not supply. Maintainerr answers one
  // item at a time, so results are cached and the grid is repainted once.
  async _mtResolvePosters(items, modal) {
    if (!this._mtPosterCache) this._mtPosterCache = /* @__PURE__ */ new Map();
    const cache = this._mtPosterCache;
    const pending = [];
    for (const item of items || []) {
      if (this._mtPosterFor(item)) continue;
      const key = this._mtPosterKey(item);
      if (!key || cache.has(key)) continue;
      cache.set(key, "");
      pending.push({ item, key });
    }
    if (!pending.length) return;
    let changed = false;
    for (let i = 0; i < pending.length; i += 8) {
      if (!this._maintainerrModal) return;
      await Promise.all(pending.slice(i, i + 8).map(async ({ item, key }) => {
        const [type, prov, id] = key.split(":");
        try {
          const res = await this._hass.callApi("GET", `arr_stack/maintainerr/metadata/image/${type}?${prov}Id=${encodeURIComponent(id)}`);
          if (res?.url) {
            cache.set(key, res.url);
            changed = true;
          }
        } catch (_) {
        }
      }));
    }
    if (changed && this._maintainerrModal?.tab === "overview") this._mtLoadTab("overview", modal);
  }
  // Fit the rule list to the space above its pinned footer so it pages rather
  // than scrolls. Card and row heights come from rendered elements, not guesses.
  _mtMeasureRules(el, which = "rules") {
    const m = this._maintainerrModal;
    if (!m || m.editor || this._mtMeasuring) return;
    const key = which === "col" ? "colPerPage" : "rulesPerPage";
    const wrap = el?.querySelector("#mt-rules-wrap");
    if (!wrap) return;
    const foot = el.querySelector("#mt-rules-foot");
    const top = wrap.getBoundingClientRect().top;
    const bottom = foot ? foot.getBoundingClientRect().top : wrap.getBoundingClientRect().bottom;
    const avail = bottom - top;
    if (avail <= 0) return;
    let fit;
    const grid = wrap.querySelector("#mt-rules-grid");
    if (grid) {
      const card = grid.firstElementChild;
      if (!card) return;
      const GAP = 10, MINW = 280;
      const cols = Math.max(1, Math.floor((wrap.clientWidth + GAP) / (MINW + GAP)));
      const rows = Math.max(1, Math.floor((avail + GAP + 1) / (card.offsetHeight + GAP)));
      fit = cols * rows;
    } else {
      const row = wrap.querySelector("tbody tr") || wrap.firstElementChild?.firstElementChild;
      if (!row?.offsetHeight) return;
      const head = wrap.querySelector("thead");
      fit = Math.max(1, Math.floor((avail - (head?.offsetHeight || 0) + 1) / row.offsetHeight));
    }
    if (!Number.isFinite(fit) || fit === m[key]) return;
    this._mtMeasuring = true;
    try {
      m[key] = fit;
      this._mtLoadTab(which === "col" ? "collections" : "rules", el);
    } finally {
      this._mtMeasuring = false;
    }
  }
  // Fit the log table to the space between the toolbar and the paging row so it
  // pages instead of scrolling. Row height comes from a rendered row rather
  // than a guess, since it follows the shared table styling.
  _mtMeasureLogs(el) {
    const m = this._maintainerrModal;
    const lg = m?.colDetail?.logs;
    if (!lg || lg.loading || this._mtMeasuring) return;
    const wrap = el?.querySelector("#mt-log-wrap");
    const row = wrap?.querySelector("tbody tr, .mt-log-row");
    const head = wrap?.querySelector("thead");
    if (!wrap || !row) return;
    const pag = el.querySelector("#mt-log-pag");
    const bottom = pag ? pag.getBoundingClientRect().top : wrap.getBoundingClientRect().bottom;
    const avail = bottom - wrap.getBoundingClientRect().top - (head?.offsetHeight || 0);
    const rowH = row.offsetHeight;
    if (rowH <= 0 || avail <= 0) return;
    const fit = Math.max(1, Math.floor((avail + 1) / rowH));
    if (fit === lg.perPage) return;
    this._mtMeasuring = true;
    try {
      this._mtLoadColLogs(el, { perPage: fit, page: 0 });
    } finally {
      this._mtMeasuring = false;
    }
  }
  // Collection log feed — server-side paging, search, sort and type filter
  async _mtLoadColLogs(modal, patch = {}) {
    const m = this._maintainerrModal;
    const cd = m?.colDetail;
    if (!cd) return;
    const lg = cd.logs || (cd.logs = { items: [], total: 0, page: 0, search: "", sort: "DESC", filter: "" });
    Object.assign(lg, patch);
    lg.loading = true;
    if (m.colSubTab === "info") this._mtLoadTab("collections", modal);
    const PAGE = lg.perPage || 25;
    const params = new URLSearchParams({ size: String(PAGE), sort: lg.sort || "DESC" });
    if (lg.search) params.set("search", lg.search);
    if (lg.filter !== "" && lg.filter != null) params.set("filter", String(lg.filter));
    try {
      const data = await this._hass.callApi("GET", `arr_stack/maintainerr/collections/logs/${cd.id}/content/${(lg.page || 0) + 1}?${params}`);
      lg.items = data?.items || [];
      lg.total = data?.totalSize ?? lg.items.length;
    } catch (e) {
      console.warn("[arr-card] Maintainerr collection logs:", e);
      lg.items = [];
      lg.total = 0;
    }
    if (!this._maintainerrModal) return;
    lg.loading = false;
    if (m.colSubTab === "info") this._mtLoadTab("collections", modal);
  }
  async _mtLoadArrServers(modal) {
    if (this._maintainerrArrServers) return;
    this._maintainerrArrServers = { radarr: [], sonarr: [] };
    try {
      const [radarrSrv, sonarrSrv] = await Promise.all([
        this._hass.callApi("GET", "arr_stack/maintainerr/settings/radarr").catch(() => null),
        this._hass.callApi("GET", "arr_stack/maintainerr/settings/sonarr").catch(() => null)
      ]);
      this._maintainerrArrServers = {
        radarr: Array.isArray(radarrSrv) ? radarrSrv : radarrSrv ? [radarrSrv] : [],
        sonarr: Array.isArray(sonarrSrv) ? sonarrSrv : sonarrSrv ? [sonarrSrv] : []
      };
      if (this._maintainerrModal?.overview?.dialog) this._mtLoadTab("overview", modal);
    } catch (_) {
    }
  }
  _mtOpenOvDialog(kind, itemId, modal) {
    const m = this._maintainerrModal;
    const ov = m?.overview;
    if (!ov) return;
    const pool = ov.searchItems || ov.items || [];
    const item = pool.find((i) => String(i.id) === String(itemId));
    if (!item) return;
    const cols = this._mtCollectionsForLib(ov.libId);
    if (!this._maintainerrArrServers) this._mtLoadArrServers(modal);
    ov.dialog = {
      kind,
      item,
      action: "0",
      // Exclusions default to "All collections"; collection moves need a target
      collectionId: kind === "exclusion" ? "" : cols[0]?.id ?? "",
      busy: false
    };
    this._mtLoadTab("overview", modal);
  }
  async _mtSubmitOvDialog(modal, removeAll = false) {
    const m = this._maintainerrModal;
    const ov = m?.overview;
    const dlg = ov?.dialog;
    if (!dlg || dlg.busy) return;
    const item = dlg.item;
    const context = { id: String(item.id), type: item.type };
    const colId = dlg.collectionId === "" || dlg.collectionId == null ? null : parseInt(dlg.collectionId);
    dlg.busy = true;
    this._mtLoadTab("overview", modal);
    try {
      if (removeAll) {
        await this._hass.callApi("DELETE", `arr_stack/maintainerr/collections/media?mediaId=${encodeURIComponent(item.id)}`);
      } else if (dlg.kind === "exclusion") {
        const body = { mediaId: String(item.id), context, action: parseInt(dlg.action) };
        if (colId != null) body.collectionId = colId;
        const res = await this._hass.callApi("POST", "arr_stack/maintainerr/rules/exclusion", body);
        if (res && res.code === 0) throw new Error(res.result || "failed");
      } else {
        const body = { action: parseInt(dlg.action), mediaId: String(item.id), context };
        if (colId != null) body.collectionId = colId;
        await this._hass.callApi("POST", "arr_stack/maintainerr/collections/media/add", body);
      }
      ov.dialog = null;
      this._mtShowStatus(this._t("mtDone"), modal);
      this._mtDelMap = null;
      await this._fetchMaintainerr();
      this._mtLoadDelMap(modal);
      if (this._maintainerrModal) this._mtLoadTab("overview", modal);
    } catch (e) {
      console.warn("[arr-card] Maintainerr overview action:", e);
      if (!this._maintainerrModal) return;
      dlg.busy = false;
      this._mtShowStatus(`${this._t("mtRunFailed")}: ${e.message || e}`, modal, 8e3, { err: true });
      this._mtLoadTab("overview", modal);
    }
  }
  async _mtOpenCollectionDetail(id, modal) {
    const m = this._maintainerrModal;
    if (!m) return;
    const body = modal?.querySelector("#mt-body");
    if (!body) return;
    body.innerHTML = `<div class="is-loading"><span>${this._t("loading")}</span></div>`;
    try {
      const col = (this._maintainerr?.collections || []).find((c) => c.id === id);
      const rules = this._maintainerr?.rules || [];
      const rule = col ? this._mtFindRuleForCol(col, rules) : null;
      const sortKey = "deleteSoonest";
      const sortOrder = "asc";
      const data = await this._hass.callApi("GET", `arr_stack/maintainerr/collections/media/${id}/content/1?sort=${sortKey}&sortOrder=${sortOrder}&size=500`);
      const items = Array.isArray(data) ? data : data?.items || data?.data || [];
      let excludedIds = /* @__PURE__ */ new Set();
      let exclusionItems = [];
      try {
        const exclResp = await this._hass.callApi("GET", `arr_stack/maintainerr/collections/exclusions/${id}/content/1?size=500`);
        const exclArr = exclResp?.items || (Array.isArray(exclResp) ? exclResp : []);
        exclusionItems = exclArr.map((e) => {
          const md = e.mediaData || {};
          const tmdbArr = md.providerIds?.tmdb || [];
          return {
            id: e.id,
            mediaServerId: e.mediaServerId,
            title: md.title || `ID ${e.mediaServerId || "?"}`,
            type: e.type || md.type || "movie",
            tmdbId: tmdbArr[0] || null,
            year: md.year || null,
            image_path: ""
          };
        });
        const tmdbPosterMap = /* @__PURE__ */ new Map();
        (this._radarr || []).forEach((m2) => {
          if (m2.tmdbId) {
            const p = (m2.images || []).find((i) => i.coverType === "poster");
            if (p?.remoteUrl) tmdbPosterMap.set(String(m2.tmdbId), p.remoteUrl);
          }
        });
        exclusionItems.forEach((ei) => {
          if (ei.tmdbId && tmdbPosterMap.has(String(ei.tmdbId))) {
            ei.image_path = tmdbPosterMap.get(String(ei.tmdbId));
          }
        });
        exclArr.forEach((e) => {
          if (e.mediaServerId) excludedIds.add(String(e.mediaServerId));
        });
      } catch (_) {
      }
      m.colDetail = {
        id,
        ruleGroupId: rule?.id || col?.ruleGroupId || col?.ruleGroup?.id || null,
        title: col?.title || col?.name || "\u2014",
        items,
        excludedIds,
        exclusionItems,
        deleteAfterDays: col?.deleteAfterDays ?? rule?.collection?.deleteAfterDays ?? null,
        mediaType: rule?.dataType || "movie",
        search: "",
        sort: "deleteSoonest-asc",
        exclSort: "excluded-desc",
        page: 0,
        exclPage: 0,
        _cols: 0,
        confirmExclude: null
      };
      m.colSubTab = "media";
      m._animateSub = true;
      this._mtLoadTab("collections", modal);
    } catch (e) {
      body.innerHTML = `<div class="u-empty-dim">Error: ${e.message || e}</div>`;
    }
  }
  async _mtExcludeItem(mediaServerId, modal) {
    const m = this._maintainerrModal;
    if (!m?.colDetail) return;
    const cd = m.colDetail;
    try {
      await this._hass.callApi("POST", "arr_stack/maintainerr/rules/exclusion", {
        mediaId: parseInt(mediaServerId),
        mediaServerId: String(mediaServerId),
        ruleGroupId: cd.ruleGroupId
      });
      if (!cd.excludedIds) cd.excludedIds = /* @__PURE__ */ new Set();
      cd.excludedIds.add(String(mediaServerId));
      cd.confirmExclude = null;
      this._mtShowStatus(`Excluded`, modal);
      this._mtLoadTab("collections", modal);
    } catch (e) {
      console.warn("[arr-card] Maintainerr exclude:", e);
      cd.confirmExclude = null;
      this._mtLoadTab("collections", modal);
    }
  }
  async _mtUnexcludeItem(exclId, modal) {
    const m = this._maintainerrModal;
    if (!m?.colDetail) return;
    const cd = m.colDetail;
    try {
      await this._hass.callApi("DELETE", `arr_stack/maintainerr/rules/exclusion/${exclId}`);
      cd.exclusionItems = (cd.exclusionItems || []).filter((e) => e.id !== exclId);
      const removed = cd.exclusionItems.find((e) => e.id === exclId);
      if (removed?.mediaServerId) cd.excludedIds?.delete?.(String(removed.mediaServerId));
      this._mtShowStatus(this._t("mtUnexcluded"), modal);
      this._mtLoadTab("collections", modal);
    } catch (e) {
      console.warn("[arr-card] Maintainerr unexclude:", e);
    }
  }
  // ──────────────────────────────────────────────────────────────────────────
  // Rule editor
  // ──────────────────────────────────────────────────────────────────────────
  async _mtOpenEditor(ruleId, modal) {
    const m = this._maintainerrModal;
    if (!m) return;
    if (!this._maintainerrConstants) {
      const body = modal?.querySelector("#mt-body");
      if (body) body.innerHTML = `<div class="is-loading"><span>${this._t("loading")}</span></div>`;
      try {
        const [constants, libraries, radarrSrv, sonarrSrv] = await Promise.all([
          this._hass.callApi("GET", "arr_stack/maintainerr/rules/constants").catch(() => null),
          this._hass.callApi("GET", "arr_stack/maintainerr/media-server/libraries").catch(() => null),
          this._hass.callApi("GET", "arr_stack/maintainerr/settings/radarr").catch(() => null),
          this._hass.callApi("GET", "arr_stack/maintainerr/settings/sonarr").catch(() => null)
        ]);
        this._maintainerrConstants = constants || {};
        this._maintainerrLibraries = Array.isArray(libraries) ? libraries : [];
        this._maintainerrArrServers = {
          radarr: Array.isArray(radarrSrv) ? radarrSrv : radarrSrv ? [radarrSrv] : [],
          sonarr: Array.isArray(sonarrSrv) ? sonarrSrv : sonarrSrv ? [sonarrSrv] : []
        };
      } catch (e) {
        console.warn("[arr-card] Maintainerr constants:", e);
      }
    }
    if (ruleId != null) {
      const rule = (this._maintainerr?.rules || []).find((r) => r.id === ruleId);
      if (rule) {
        const col = rule.collection || {};
        m.editor = {
          id: rule.id,
          name: rule.name || "",
          description: rule.description || "",
          libraryId: rule.libraryId,
          mediaType: rule.dataType || col.type || "movie",
          arrAction: col.arrAction ?? 0,
          arrServerId: col.radarrSettingsId || col.sonarrSettingsId || null,
          deleteAfterDays: col.deleteAfterDays ?? 30,
          isActive: !!rule.isActive,
          useRules: rule.useRules !== false,
          // Options from collection
          listExclusions: !!col.listExclusions,
          forceSeerr: !!col.forceSeerr,
          visibleOnRecommended: col.visibleOnRecommended !== false,
          visibleOnHome: col.visibleOnHome !== false,
          overlayEnabled: !!col.overlayEnabled,
          manualCollection: !!col.manualCollection,
          tagInArr: !!col.tagInArr,
          keepLogsForMonths: col.keepLogsForMonths ?? 6,
          sortTitle: col.sortTitle || "",
          mediaServerSort: col.mediaServerSort || "",
          manualCollectionName: col.manualCollectionName || "",
          tautulliWatchedPercentOverride: col.tautulliWatchedPercentOverride ?? null,
          ruleHandlerCronSchedule: rule.ruleHandlerCronSchedule || "",
          // Parse flat rules → sections
          sections: this._mtParseRuleSections(rule.rules || [])
        };
      }
    } else {
      m.editor = {
        id: null,
        name: "",
        description: "",
        libraryId: null,
        mediaType: "movie",
        arrAction: 0,
        arrServerId: null,
        deleteAfterDays: 30,
        isActive: true,
        useRules: true,
        listExclusions: false,
        forceSeerr: false,
        visibleOnRecommended: true,
        visibleOnHome: true,
        overlayEnabled: false,
        manualCollection: false,
        tagInArr: false,
        keepLogsForMonths: 6,
        sortTitle: "",
        mediaServerSort: "",
        manualCollectionName: "",
        tautulliWatchedPercentOverride: null,
        ruleHandlerCronSchedule: "",
        // Start with one empty section holding one blank rule, like Maintainerr
        sections: [{ operator: 0, rules: [this._mtBlankRule()] }]
      };
    }
    m.editorSection = "general";
    this._mtReRenderEditor(modal);
  }
  _mtReRenderEditor(modal) {
    const root = modal || this.shadowRoot.querySelector("[data-mt-modal]");
    const body = root?.querySelector("#mt-body");
    if (body) {
      body.style.display = "block";
      body.style.overflowY = "auto";
      body.style.paddingBottom = isMobile() ? "16px" : "20px";
      body.innerHTML = this._mtRuleEditorHtml();
      body.style.setProperty("overflow-y", "auto", "important");
    }
    this._mtRefreshTabBtns(root);
  }
  _mtSyncEditorFields(modal) {
    const m = this._maintainerrModal;
    if (!m?.editor) return;
    const ed = m.editor;
    const body = (modal || this.shadowRoot.querySelector("[data-mt-modal]"))?.querySelector("#mt-body");
    if (!body) return;
    const val = (id) => body.querySelector(id)?.value ?? null;
    const has = (id) => !!body.querySelector(id);
    const str = (id, cur) => has(id) ? val(id) ?? cur : cur;
    const chk = (id, cur) => has(id) ? body.querySelector(id).checked : cur;
    const num = (id, cur, dflt = 0) => {
      if (!has(id)) return cur;
      const n = parseInt(val(id));
      return Number.isFinite(n) ? n : dflt;
    };
    ed.name = str("#mt-ed-name", ed.name);
    ed.description = str("#mt-ed-desc", ed.description);
    ed.libraryId = has("#mt-ed-lib") ? val("#mt-ed-lib") || ed.libraryId : ed.libraryId;
    ed.mediaType = has("#mt-ed-media") ? val("#mt-ed-media") || ed.mediaType : ed.mediaType;
    ed.arrServerId = has("#mt-ed-arr-srv") ? val("#mt-ed-arr-srv") || null : ed.arrServerId;
    ed.arrAction = num("#mt-ed-arr-action", ed.arrAction);
    ed.deleteAfterDays = num("#mt-ed-del-days", ed.deleteAfterDays, 30);
    ed.isActive = chk("#mt-ed-active", ed.isActive);
    ed.useRules = chk("#mt-ed-use-rules", ed.useRules);
    ed.listExclusions = chk("#mt-ed-list-exclusions", ed.listExclusions);
    ed.forceSeerr = chk("#mt-ed-force-seerr", ed.forceSeerr);
    ed.visibleOnRecommended = chk("#mt-ed-vis-recommended", ed.visibleOnRecommended);
    ed.visibleOnHome = chk("#mt-ed-vis-home", ed.visibleOnHome);
    ed.manualCollection = chk("#mt-ed-manual-col", ed.manualCollection);
    ed.manualCollectionName = str("#mt-ed-manual-col-name", ed.manualCollectionName);
    ed.tagInArr = chk("#mt-ed-tag-arr", ed.tagInArr);
    ed.keepLogsForMonths = num("#mt-ed-keep-logs", ed.keepLogsForMonths, 6);
    ed.sortTitle = str("#mt-ed-sort-title", ed.sortTitle);
    ed.mediaServerSort = str("#mt-ed-col-sort", ed.mediaServerSort);
    if (has("#mt-ed-tautulli-pct")) {
      const tPct = val("#mt-ed-tautulli-pct");
      ed.tautulliWatchedPercentOverride = tPct !== "" && tPct != null ? parseInt(tPct) : null;
    }
    ed.ruleHandlerCronSchedule = str("#mt-ed-cron", ed.ruleHandlerCronSchedule);
    (ed.sections || []).forEach((sec, si) => {
      (sec.rules || []).forEach((r, ri) => {
        const key = `${si}-${ri}`;
        const fv = body.querySelector(`[data-mt-firstval="${key}"]`);
        const sv = body.querySelector(`[data-mt-secondval="${key}"]`);
        const action = body.querySelector(`[data-mt-action="${key}"]`);
        const valEl = body.querySelector(`[data-mt-val="${key}"]`);
        if (fv && fv.value) {
          const [a, p] = fv.value.split("-");
          r.firstVal = [parseInt(a), parseInt(p)];
        } else if (fv) {
          r.firstVal = ["", ""];
        }
        if (sv && sv.value.startsWith("custom-")) {
          r.customValType = parseInt(sv.value.slice(7));
          r.lastVal = null;
        } else if (sv && sv.value) {
          const [a, p] = sv.value.split("-");
          r.lastVal = [parseInt(a), parseInt(p)];
          r.customValType = null;
          r.customVal = "";
        } else if (sv) {
          r.lastVal = null;
          r.customValType = null;
        }
        if (action) r.action = action.value === "" ? null : parseInt(action.value);
        if (valEl) r.customVal = valEl.value;
      });
    });
  }
  // action stays null until picked so the dropdown shows its placeholder
  _mtBlankRule() {
    return { firstVal: ["", ""], lastVal: null, action: null, customVal: "", customValType: null, operator: 0 };
  }
  _mtAddSection(modal) {
    const m = this._maintainerrModal;
    if (!m?.editor) return;
    this._mtSyncEditorFields(modal);
    m.editor.sections.push({ operator: 0, rules: [this._mtBlankRule()] });
    this._mtReRenderEditor(modal);
  }
  _mtAddRuleToSection(si, modal) {
    const m = this._maintainerrModal;
    if (!m?.editor) return;
    this._mtSyncEditorFields(modal);
    const sec = m.editor.sections[si];
    if (sec) sec.rules.push(this._mtBlankRule());
    this._mtReRenderEditor(modal);
  }
  _mtDeleteEditorRule(key, modal) {
    const m = this._maintainerrModal;
    if (!m?.editor) return;
    this._mtSyncEditorFields(modal);
    const [si, ri] = key.split("-").map(Number);
    const sec = m.editor.sections[si];
    if (sec?.rules) sec.rules.splice(ri, 1);
    this._mtReRenderEditor(modal);
  }
  _mtDeleteSection(si, modal) {
    const m = this._maintainerrModal;
    if (!m?.editor) return;
    this._mtSyncEditorFields(modal);
    m.editor.sections.splice(si, 1);
    this._mtReRenderEditor(modal);
  }
  _mtToggleSectionOp(si, modal) {
    const m = this._maintainerrModal;
    if (!m?.editor) return;
    this._mtSyncEditorFields(modal);
    const sec = m.editor.sections[si];
    if (sec) sec.operator = sec.operator === 1 ? 0 : 1;
    this._mtReRenderEditor(modal);
  }
  _mtToggleRuleOp(key, modal) {
    const m = this._maintainerrModal;
    if (!m?.editor) return;
    this._mtSyncEditorFields(modal);
    const [si, ri] = key.split("-").map(Number);
    const rule = m.editor.sections?.[si]?.rules?.[ri];
    if (rule) rule.operator = rule.operator === 1 ? 0 : 1;
    this._mtReRenderEditor(modal);
  }
  async _mtSaveRule(modal) {
    const m = this._maintainerrModal;
    if (!m?.editor) return;
    this._mtSyncEditorFields(modal);
    const ed = m.editor;
    const flatRules = [];
    (ed.sections || []).forEach((sec, si) => {
      const filled = (sec.rules || []).filter((r) => r.firstVal?.[0] !== "" && r.firstVal?.[0] != null && r.action != null);
      filled.forEach((r, ri) => {
        let operator = null;
        if (flatRules.length > 0) operator = (ri === 0 ? sec.operator : r.operator) ?? 0;
        const rule = {
          firstVal: [Number(r.firstVal[0]), Number(r.firstVal[1])],
          action: parseInt(r.action) || 0,
          section: si,
          operator
        };
        if (r.customValType != null && !r.lastVal) {
          const cvType = Number(r.customValType);
          let cvVal = String(r.customVal ?? "");
          if (cvType === 3) cvVal = cvVal === "true" || cvVal === "1" ? "1" : "0";
          rule.customVal = { ruleTypeId: cvType, value: cvVal };
        }
        if (r.lastVal) rule.lastVal = [Number(r.lastVal[0]), Number(r.lastVal[1])];
        flatRules.push(rule);
      });
    });
    const origCol = ed.id ? (this._maintainerr?.rules || []).find((r) => r.id === ed.id)?.collection || {} : {};
    const payload = {
      name: ed.name,
      description: ed.description,
      libraryId: ed.libraryId ? String(ed.libraryId) : null,
      isActive: ed.isActive,
      useRules: ed.useRules,
      dataType: ed.mediaType,
      ruleHandlerCronSchedule: ed.ruleHandlerCronSchedule || null,
      arrAction: parseInt(ed.arrAction) || 0,
      listExclusions: !!ed.listExclusions,
      forceSeerr: !!ed.forceSeerr,
      tagInArr: !!ed.tagInArr,
      tautulliWatchedPercentOverride: ed.tautulliWatchedPercentOverride ?? null,
      radarrSettingsId: null,
      sonarrSettingsId: null,
      radarrQualityProfileId: origCol.radarrQualityProfileId ?? null,
      sonarrQualityProfileId: origCol.sonarrQualityProfileId ?? null,
      rules: flatRules,
      collection: {
        deleteAfterDays: parseInt(ed.deleteAfterDays) || null,
        visibleOnRecommended: !!ed.visibleOnRecommended,
        visibleOnHome: !!ed.visibleOnHome,
        overlayEnabled: !!(ed.overlayEnabled ?? origCol.overlayEnabled),
        overlayTemplateId: origCol.overlayTemplateId ?? null,
        manualCollection: !!ed.manualCollection,
        manualCollectionName: ed.manualCollectionName ?? origCol.manualCollectionName ?? "",
        keepLogsForMonths: parseInt(ed.keepLogsForMonths) || 6,
        sortTitle: ed.sortTitle || null,
        mediaServerSort: ed.mediaServerSort || null
      }
    };
    if (ed.arrServerId) {
      if (ed.mediaType === "movie") payload.radarrSettingsId = parseInt(ed.arrServerId);
      else payload.sonarrSettingsId = parseInt(ed.arrServerId);
    }
    try {
      let res;
      if (ed.id) {
        payload.id = ed.id;
        res = await this._hass.callApi("PUT", "arr_stack/maintainerr/rules", payload);
      } else {
        res = await this._hass.callApi("POST", "arr_stack/maintainerr/rules", payload);
      }
      if (res && res.code === 0) {
        this._mtShowStatus(`Save failed: ${res.result || "unknown error"}`, modal, 8e3, { err: true });
        return;
      }
      m.editor = null;
      await this._fetchMaintainerr();
      if (this._maintainerrModal) this._mtLoadTab("rules", modal);
    } catch (e) {
      console.warn("[arr-card] Maintainerr save:", e);
      this._mtShowStatus(`Save failed: ${e.message || e}`, modal, 8e3, { err: true });
    }
  }
};
var wireMaintainerrMixin = _WireMaintainerrMethods.prototype;



var _WireTautulliMethods = class {
  _wireTautulliPosters(right) {
    right.addEventListener("click", (e) => {
      const card = e.target.closest("[data-tl-open]");
      if (!card) return;
      this._openTautulliModal(card.dataset.tlOpen);
    });
  }
  _wireTautulliModal(el) {
    el.querySelector("#tl-close")?.addEventListener("click", () => {
      const back = el.querySelector("[data-tl-md-back-lib],[data-tl-md-back-user],[data-tl-ud-back],[data-tl-ld-back]");
      if (back) {
        back.click();
        return;
      }
      this._closeTautulliModal();
    });
    el.addEventListener("click", (e) => {
      if (e.target === el) this._closeTautulliModal();
    });
    el.querySelector("#tl-nav-area")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tl-tab]");
      if (!btn || !this._tautulliModal) return;
      const t = btn.dataset.tlTab;
      if (!t || t === this._tautulliModal.tab) return;
      const from = this._navIndRect(el.querySelector("#tl-nav"));
      const m = this._tautulliModal;
      m.userDetailId = null;
      m.libDetailId = null;
      m.mediaDetailKey = null;
      m.tab = t;
      el.querySelector("#tl-nav-area").innerHTML = this._tlNavHtml(t);
      const nav = el.querySelector("#tl-nav");
      this._syncNavInd(nav, nav?.querySelector(`.mt-nav-btn[data-tl-tab="${t}"]`), from);
      this._markActivated();
      const subEl = el.querySelector("#tl-hdr-sub");
      if (subEl) subEl.textContent = this._isMob ? "" : this._tlTabSubtitle(t);
      this._tlLoadTab(t, el);
    });
    requestAnimationFrame(() => {
      const nav = el.querySelector("#tl-nav");
      this._syncNavInd(nav, nav?.querySelector(".mt-nav-btn.is-on"));
    });
  }
  _wireTautulliModalBody(body) {
    const _q = (sel) => {
      const el = body.querySelector(sel);
      if (!el || el._tlWired) return null;
      el._tlWired = true;
      return el;
    };
    const _qa = (sel) => [...body.querySelectorAll(sel)].filter((el) => {
      if (el._tlWired) return false;
      el._tlWired = true;
      return true;
    });
    {
      const modalEl = body.closest("[data-tl-modal]");
      const closeBtn = modalEl?.querySelector("#tl-close");
      if (closeBtn) {
        const isBack = !!body.querySelector("[data-tl-md-back-lib],[data-tl-md-back-user],[data-tl-ud-back],[data-tl-ld-back]");
        closeBtn.innerHTML = isBack ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>` : ICONS.close;
      }
    }
    requestAnimationFrame(() => {
      body.querySelectorAll(".mt-nav--inline").forEach((nav) => this._syncNavInd(nav, nav.querySelector(".mt-nav-btn.is-on")));
    });
    if (!body._tlSelSync) {
      body._tlSelSync = true;
      body.addEventListener("change", (e) => this._tbSyncSelect(e.target));
    }
    _q("#tl-ip-report-toggle")?.addEventListener("click", async () => {
      if (!this._tautulliModal) return;
      this._tautulliModal.ipReportOpen = !this._tautulliModal.ipReportOpen;
      const m = this._tautulliModal;
      const r2 = await this._tlApiFetch("get_users_table", `length=50&start=${(m.usersPage || 0) * 50}&order_column=${m.usersSortCol || "plays"}&order_dir=${m.usersSortDir || "desc"}`).catch(() => null);
      body.innerHTML = this._tlBodyUsers(r2?.response?.data?.data);
      this._wireTautulliModalBody(body);
    });
    _q("#tl-ack-btn")?.addEventListener("click", async () => {
      await this._ackTautulliSharing();
      const r = await this._hass.callApi("GET", "arr_stack/tautulli/get_users_table?length=50&start=0&order_column=plays&order_dir=desc").catch(() => null);
      body.innerHTML = this._tlBodyUsers(r?.response?.data?.data);
      this._wireTautulliModalBody(body);
    });
    {
      let _histSearchTimer = null;
      _q("#tl-hist-search")?.addEventListener("input", (e) => {
        if (!this._tautulliModal) return;
        this._tautulliModal.histSearch = e.target.value || "";
        this._tautulliModal.histPage = 0;
        clearTimeout(_histSearchTimer);
        _histSearchTimer = setTimeout(async () => {
          const inp0 = body.querySelector("#tl-hist-search");
          const sel0 = inp0?.selectionStart ?? null;
          await this._tlRefetchHistory(body);
          const inp = body.querySelector("#tl-hist-search");
          if (inp && sel0 !== null) {
            inp.focus();
            inp.setSelectionRange(sel0, sel0);
          }
        }, 400);
      });
    }
    _q("#tl-hist-user-sel")?.addEventListener("change", async (e) => {
      if (!this._tautulliModal) return;
      this._tautulliModal.histUser = e.target.value || null;
      this._tautulliModal.histPage = 0;
      await this._tlRefetchHistory(body);
    });
    _q("#tl-hist-media")?.addEventListener("change", async (e) => {
      if (!this._tautulliModal) return;
      this._tautulliModal.histMedia = e.target.value || null;
      this._tautulliModal.histPage = 0;
      await this._tlRefetchHistory(body);
    });
    _q("#tl-hist-play")?.addEventListener("change", async (e) => {
      if (!this._tautulliModal) return;
      this._tautulliModal.histPlayback = e.target.value || null;
      this._tautulliModal.histPage = 0;
      await this._tlRefetchHistory(body);
    });
    _q("#tl-hist-perpage")?.addEventListener("change", async (e) => {
      if (!this._tautulliModal) return;
      this._tautulliModal.histPerPage = parseInt(e.target.value) || 25;
      this._tautulliModal.histPage = 0;
      await this._tlRefetchHistory(body);
    });
    _q("#tl-hist-cols-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!this._tautulliModal) return;
      this._tautulliModal.histColsOpen = !this._tautulliModal.histColsOpen;
      const menu = body.querySelector("#tl-hist-cols-menu");
      if (menu) menu.style.display = this._tautulliModal.histColsOpen ? "block" : "none";
      this._floatMenu(e.currentTarget, menu);
    });
    _qa("[data-tl-hist-col]").forEach((item) => {
      item.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        const hidden = this._tlHidden("histHiddenCols", ["ip", "paused", "stopped"]);
        const col = item.dataset.tlHistCol;
        if (hidden.has(col)) hidden.delete(col);
        else hidden.add(col);
        this._tlSaveColPrefs();
        this._tautulliModal.histColsOpen = true;
        body.innerHTML = this._tlBodyHistory();
        this._wireTautulliModalBody(body);
      });
    });
    _q("#tl-hist-mob-cols-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!this._tautulliModal) return;
      this._tautulliModal.histMobColsOpen = !this._tautulliModal.histMobColsOpen;
      const menu = body.querySelector("#tl-hist-mob-cols-menu");
      if (menu) menu.style.display = this._tautulliModal.histMobColsOpen ? "block" : "none";
      this._floatMenu(e.currentTarget, menu);
    });
    _qa("[data-tl-hist-mob-col]").forEach((item) => {
      item.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        const hidden = this._tlHidden("histMobHiddenCols", ["ip", "platform", "product", "player", "paused", "stopped"]);
        const col = item.dataset.tlHistMobCol;
        if (hidden.has(col)) hidden.delete(col);
        else hidden.add(col);
        this._tlSaveColPrefs();
        this._tautulliModal.histMobColsOpen = true;
        body.innerHTML = this._tlBodyHistory();
        this._wireTautulliModalBody(body);
      });
    });
    _qa("[data-tl-hpage]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!this._tautulliModal) return;
        const m = this._tautulliModal;
        const totalPages = Math.max(1, Math.ceil(m.histTotal / (m.histPerPage || 25)));
        const val = btn.dataset.tlHpage;
        let p = m.histPage || 0;
        if (val === "first") p = 0;
        else if (val === "prev") p = Math.max(0, p - 1);
        else if (val === "next") p = Math.min(totalPages - 1, p + 1);
        else if (val === "last") p = totalPages - 1;
        else p = parseInt(val);
        if (p === m.histPage) return;
        m.histPage = p;
        await this._tlRefetchHistory(body);
      });
    });
    const _histRedraw = () => {
      this._patchResultsWrap(body, "tl-hist-results-wrap", () => this._tlBodyHistory());
      this._wireTautulliModalBody(body);
    };
    _qa("[data-tl-hist-delete]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        this._tautulliModal.histDelId = String(btn.dataset.tlHistDelete);
        _histRedraw();
      });
    });
    _qa("[data-tl-hist-delete-no]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        this._tautulliModal.histDelId = null;
        _histRedraw();
      });
    });
    _qa("[data-tl-hist-delete-yes]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!this._tautulliModal) return;
        btn.disabled = true;
        await this._tlApiFetch("delete_history", `row_id=${btn.dataset.tlHistDeleteYes}`);
        if (this._tautulliModal) this._tautulliModal.histDelId = null;
        await this._tlRefetchHistory(body);
      });
    });
    _qa("[data-tl-ud-open]").forEach((row) => {
      row.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        if (!this._tautulliModal) return;
        this._tlOpenUserDetail(row.dataset.tlUdOpen, row.dataset.tlUdName, row.dataset.tlUdThumb, body);
      });
    });
    _q("[data-tl-ud-back]")?.addEventListener("click", () => {
      if (!this._tautulliModal) return;
      this._tautulliModal.userDetailId = null;
      body.style.overflowY = "";
      body.innerHTML = this._tlBodyUsers(this._tautulliModal.usersData, this._tautulliModal.usersTotal);
      this._wireTautulliModalBody(body);
    });
    _qa("[data-tl-ud-tab]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!this._tautulliModal) return;
        const tab = btn.dataset.tlUdTab;
        this._tautulliModal.userDetailTab = tab;
        if (tab === "history" && !this._tautulliModal.userDetailHistData?.length) {
          body.innerHTML = this._tlBodyUserDetail();
          this._wireTautulliModalBody(body);
          await this._tlRefetchUdHistory(body);
          return;
        }
        if (tab === "ips" && !this._tautulliModal.userDetailIpsData?.length) {
          body.innerHTML = this._tlBodyUserDetail();
          this._wireTautulliModalBody(body);
          const ips = await this._tlFetchUserIps(this._tautulliModal.userDetailId);
          if (!this._tautulliModal) return;
          this._tautulliModal.userDetailIpsData = ips;
        }
        body.innerHTML = this._tlBodyUserDetail();
        this._wireTautulliModalBody(body);
        if (tab === "profile") this._tlLoadUdThumbs(body);
      });
    });
    {
      const recScroll = body.querySelector("#tl-ud-rec-scroll");
      if (recScroll) {
        const prevBtn = body.querySelector(".tl-ud-rec-prev");
        const nextBtn = body.querySelector(".tl-ud-rec-next");
        const pages = recScroll.querySelectorAll(":scope > div");
        let curPage = 0;
        const goTo = (idx) => {
          curPage = Math.max(0, Math.min(pages.length - 1, idx));
          const pageW = recScroll.offsetWidth || recScroll.scrollWidth / pages.length;
          recScroll.scrollTo({ left: curPage * pageW, behavior: "smooth" });
          if (prevBtn) prevBtn.disabled = curPage === 0;
          if (nextBtn) nextBtn.disabled = curPage >= pages.length - 1;
        };
        if (prevBtn) prevBtn.addEventListener("click", () => goTo(curPage - 1));
        if (nextBtn) nextBtn.addEventListener("click", () => goTo(curPage + 1));
        if (nextBtn && pages.length <= 1) nextBtn.disabled = true;
      }
    }
    {
      let _udHistSearchTimer = null;
      _q("#tl-ud-hist-search")?.addEventListener("input", (e) => {
        if (!this._tautulliModal) return;
        this._tautulliModal.userDetailHistSearch = e.target.value || "";
        this._tautulliModal.userDetailHistPage = 0;
        clearTimeout(_udHistSearchTimer);
        _udHistSearchTimer = setTimeout(async () => {
          const inp0 = body.querySelector("#tl-ud-hist-search");
          const sel0 = inp0?.selectionStart ?? null;
          await this._tlRefetchUdHistory(body);
          const inp = body.querySelector("#tl-ud-hist-search");
          if (inp && sel0 !== null) {
            inp.focus();
            inp.setSelectionRange(sel0, sel0);
          }
        }, 400);
      });
    }
    _q("#tl-ud-hist-media")?.addEventListener("change", async (e) => {
      if (!this._tautulliModal) return;
      this._tautulliModal.userDetailHistMedia = e.target.value || null;
      this._tautulliModal.userDetailHistPage = 0;
      await this._tlRefetchUdHistory(body);
    });
    _q("#tl-ud-hist-play")?.addEventListener("change", async (e) => {
      if (!this._tautulliModal) return;
      this._tautulliModal.userDetailHistPlayback = e.target.value || null;
      this._tautulliModal.userDetailHistPage = 0;
      await this._tlRefetchUdHistory(body);
    });
    _q("#tl-ud-hist-cols-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!this._tautulliModal) return;
      this._tautulliModal.userDetailHistColsOpen = !this._tautulliModal.userDetailHistColsOpen;
      const menu = body.querySelector("#tl-ud-hist-cols-menu");
      if (menu) menu.style.display = this._tautulliModal.userDetailHistColsOpen ? "block" : "none";
      this._floatMenu(e.currentTarget, menu);
    });
    _qa("[data-tl-ud-hist-col]").forEach((item) => {
      item.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        const hidden = this._tlHidden("userDetailHistHiddenCols", ["ip", "paused", "stopped"]);
        const col = item.dataset.tlUdHistCol;
        if (hidden.has(col)) hidden.delete(col);
        else hidden.add(col);
        this._tlSaveColPrefs();
        this._tautulliModal.userDetailHistColsOpen = true;
        body.innerHTML = this._tlBodyUserDetail();
        this._wireTautulliModalBody(body);
      });
    });
    _q("#tl-ud-hist-mob-cols-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!this._tautulliModal) return;
      this._tautulliModal.userDetailHistMobColsOpen = !this._tautulliModal.userDetailHistMobColsOpen;
      const menu = body.querySelector("#tl-ud-hist-mob-cols-menu");
      if (menu) menu.style.display = this._tautulliModal.userDetailHistMobColsOpen ? "block" : "none";
      this._floatMenu(e.currentTarget, menu);
    });
    _qa("[data-tl-ud-hist-mob-col]").forEach((item) => {
      item.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        const hidden = this._tlHidden("userDetailHistMobHiddenCols", ["ip", "platform", "product", "player", "paused", "stopped"]);
        const col = item.dataset.tlUdHistMobCol;
        if (hidden.has(col)) hidden.delete(col);
        else hidden.add(col);
        this._tlSaveColPrefs();
        this._tautulliModal.userDetailHistMobColsOpen = true;
        body.innerHTML = this._tlBodyUserDetail();
        this._wireTautulliModalBody(body);
      });
    });
    _qa(".tl-ud-hist-row").forEach((row) => {
      row.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        if (!this._tautulliModal) return;
        const rid = row.dataset.tlUdHistRow;
        const m = this._tautulliModal;
        m.userDetailHistExpandedRow = m.userDetailHistExpandedRow === rid ? null : rid;
        body.innerHTML = this._tlBodyUserDetail();
        this._wireTautulliModalBody(body);
      });
    });
    _qa("[data-tl-ud-hist-delete]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        const rid = btn.dataset.tlUdHistDelete;
        this._confirmInline(btn, async () => {
          await this._tlApiFetch("delete_history", `row_id=${rid}`);
          await this._tlRefetchUdHistory(body);
        }, "Delete this entry?");
      });
    });
    _qa("[data-tl-ud-hpage]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!this._tautulliModal) return;
        const m = this._tautulliModal;
        const totalPages = Math.max(1, Math.ceil(m.userDetailHistTotal / this._tlCalcPerPage({ hasFilter: true })));
        const val = btn.dataset.tlUdHpage;
        let p = m.userDetailHistPage || 0;
        if (val === "first") p = 0;
        else if (val === "prev") p = Math.max(0, p - 1);
        else if (val === "next") p = Math.min(totalPages - 1, p + 1);
        else if (val === "last") p = totalPages - 1;
        else p = parseInt(val);
        if (p === m.userDetailHistPage) return;
        m.userDetailHistPage = p;
        await this._tlRefetchUdHistory(body);
      });
    });
    _qa("[data-tl-ud-ip-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        const col = th.dataset.tlUdIpSort;
        const m = this._tautulliModal;
        if (m.userDetailIpsSortCol === col) {
          m.userDetailIpsSortDir = m.userDetailIpsSortDir === "asc" ? "desc" : "asc";
        } else {
          m.userDetailIpsSortCol = col;
          m.userDetailIpsSortDir = "desc";
        }
        m.userDetailIpsPage = 0;
        body.innerHTML = this._tlBodyUserDetail();
        this._wireTautulliModalBody(body);
      });
    });
    _qa("[data-tl-ud-ippage]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        const m = this._tautulliModal;
        const totalPages = Math.max(1, Math.ceil((m.userDetailIpsData || []).length / this._tlCalcPerPage()));
        const val = btn.dataset.tlUdIppage;
        let p = m.userDetailIpsPage || 0;
        if (val === "first") p = 0;
        else if (val === "prev") p = Math.max(0, p - 1);
        else if (val === "next") p = Math.min(totalPages - 1, p + 1);
        else if (val === "last") p = totalPages - 1;
        else p = parseInt(val);
        if (p === m.userDetailIpsPage) return;
        m.userDetailIpsPage = p;
        body.innerHTML = this._tlBodyUserDetail();
        this._wireTautulliModalBody(body);
      });
    });
    _qa("[data-tl-ld-open]").forEach((row) => {
      row.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        if (!this._tautulliModal) return;
        this._tlOpenLibDetail(row.dataset.tlLdOpen, row.dataset.tlLdName, body);
      });
    });
    _q("[data-tl-ld-back]")?.addEventListener("click", () => {
      if (!this._tautulliModal) return;
      this._tautulliModal.libDetailId = null;
      body.style.overflowY = "";
      body.innerHTML = this._tlBodyLibraries(this._tautulliModal.libsData, this._tautulliModal.libsTotal);
      this._wireTautulliModalBody(body);
    });
    _qa("[data-tl-ld-tab]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!this._tautulliModal) return;
        const m = this._tautulliModal;
        const tab = btn.dataset.tlLdTab;
        m.libDetailTab = tab;
        if (tab === "history" && !m.libDetailHistData?.length) {
          body.innerHTML = this._tlBodyLibDetail();
          this._wireTautulliModalBody(body);
          await this._tlRefetchLdHistory(body);
          return;
        }
        if (tab === "media" && !m.libDetailMediaData?.length) {
          body.innerHTML = this._tlBodyLibDetail();
          this._wireTautulliModalBody(body);
          await this._tlRefetchLdMedia(body);
          return;
        }
        body.innerHTML = this._tlBodyLibDetail();
        this._wireTautulliModalBody(body);
        if (tab === "profile") this._tlLoadUdThumbs(body);
      });
    });
    {
      const recScroll = body.querySelector("#tl-ld-rec-scroll");
      if (recScroll) {
        const prevBtn = body.querySelector(".tl-ld-rec-prev");
        const nextBtn = body.querySelector(".tl-ld-rec-next");
        const pages = recScroll.querySelectorAll(":scope > div");
        let curPage = 0;
        const goTo = (idx) => {
          curPage = Math.max(0, Math.min(pages.length - 1, idx));
          const pageW = recScroll.offsetWidth || recScroll.scrollWidth / pages.length;
          recScroll.scrollTo({ left: curPage * pageW, behavior: "smooth" });
          if (prevBtn) prevBtn.disabled = curPage === 0;
          if (nextBtn) nextBtn.disabled = curPage >= pages.length - 1;
        };
        if (prevBtn) prevBtn.addEventListener("click", () => goTo(curPage - 1));
        if (nextBtn) nextBtn.addEventListener("click", () => goTo(curPage + 1));
        if (nextBtn && pages.length <= 1) nextBtn.disabled = true;
      }
    }
    _q("#tl-ld-hist-media")?.addEventListener("change", async (e) => {
      if (!this._tautulliModal) return;
      this._tautulliModal.libDetailHistMedia = e.target.value || null;
      this._tautulliModal.libDetailHistPage = 0;
      await this._tlRefetchLdHistory(body);
    });
    _q("#tl-ld-hist-play")?.addEventListener("change", async (e) => {
      if (!this._tautulliModal) return;
      this._tautulliModal.libDetailHistPlayback = e.target.value || null;
      this._tautulliModal.libDetailHistPage = 0;
      await this._tlRefetchLdHistory(body);
    });
    {
      let _ldHistSearchTimer = null;
      _q("#tl-ld-hist-search")?.addEventListener("input", (e) => {
        if (!this._tautulliModal) return;
        this._tautulliModal.libDetailHistSearch = e.target.value || "";
        this._tautulliModal.libDetailHistPage = 0;
        clearTimeout(_ldHistSearchTimer);
        _ldHistSearchTimer = setTimeout(() => this._tlRefetchLdHistory(body), 400);
      });
    }
    _qa("[data-tl-ld-hist-col]").forEach((item) => {
      item.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        const col = item.dataset.tlLdHistCol;
        const s = this._tautulliModal.libDetailHistHiddenCols;
        s.has(col) ? s.delete(col) : s.add(col);
        this._tlSaveColPrefs();
        body.innerHTML = this._tlBodyLibDetail();
        this._wireTautulliModalBody(body);
      });
    });
    _qa("[data-tl-ld-hist-mob-col]").forEach((item) => {
      item.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        const col = item.dataset.tlLdHistMobCol;
        const s = this._tautulliModal.libDetailHistMobHiddenCols;
        s.has(col) ? s.delete(col) : s.add(col);
        this._tlSaveColPrefs();
        body.innerHTML = this._tlBodyLibDetail();
        this._wireTautulliModalBody(body);
      });
    });
    _q("[data-tl-ld-hist-cols-btn]")?.addEventListener("click", () => {
      if (!this._tautulliModal) return;
      this._tautulliModal.libDetailHistColsOpen = !this._tautulliModal.libDetailHistColsOpen;
      body.innerHTML = this._tlBodyLibDetail();
      this._wireTautulliModalBody(body);
    });
    _q("[data-tl-ld-hist-mob-cols-btn]")?.addEventListener("click", () => {
      if (!this._tautulliModal) return;
      this._tautulliModal.libDetailHistMobColsOpen = !this._tautulliModal.libDetailHistMobColsOpen;
      body.innerHTML = this._tlBodyLibDetail();
      this._wireTautulliModalBody(body);
    });
    _qa("[data-tl-ld-hist-row]").forEach((row) => {
      row.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        if (!this._tautulliModal) return;
        const rid = row.dataset.tlLdHistRow;
        this._tautulliModal.libDetailHistExpandedRow = this._tautulliModal.libDetailHistExpandedRow === rid ? null : rid;
        body.innerHTML = this._tlBodyLibDetail();
        this._wireTautulliModalBody(body);
      });
    });
    _qa("[data-tl-ld-hist-delete]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        const rid = btn.dataset.tlLdHistDelete;
        if (!rid) return;
        this._confirmInline(btn, async () => {
          await this._tlApiFetch("delete_history", `row_id=${rid}`);
          await this._tlRefetchLdHistory(body);
        }, "Delete this entry?");
      });
    });
    _qa("[data-tl-ld-hpage]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const m = this._tautulliModal;
        if (!m) return;
        const val = btn.dataset.tlLdHpage;
        const perPage = this._tlCalcPerPage({ hasFilter: true });
        const totalPages = Math.max(1, Math.ceil(m.libDetailHistTotal / perPage));
        let p = m.libDetailHistPage || 0;
        if (val === "first") p = 0;
        else if (val === "prev") p = Math.max(0, p - 1);
        else if (val === "next") p = Math.min(totalPages - 1, p + 1);
        else if (val === "last") p = totalPages - 1;
        else p = parseInt(val);
        if (p === m.libDetailHistPage) return;
        m.libDetailHistPage = p;
        await this._tlRefetchLdHistory(body);
      });
    });
    {
      let _ldMediaSearchTimer = null;
      _q("#tl-ld-media-search")?.addEventListener("input", (e) => {
        if (!this._tautulliModal) return;
        this._tautulliModal.libDetailMediaSearch = e.target.value || "";
        this._tautulliModal.libDetailMediaPage = 0;
        clearTimeout(_ldMediaSearchTimer);
        _ldMediaSearchTimer = setTimeout(() => this._tlRefetchLdMedia(body), 400);
      });
    }
    _qa("[data-tl-ld-media-sort]").forEach((th) => {
      th.addEventListener("click", async () => {
        if (!this._tautulliModal) return;
        this._tautulliModal.libDetailMediaSort = th.dataset.tlLdMediaSort;
        this._tautulliModal.libDetailMediaDir = th.dataset.tlLdMediaDir;
        this._tautulliModal.libDetailMediaPage = 0;
        await this._tlRefetchLdMedia(body);
      });
    });
    _qa("[data-tl-ld-mpage]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const m = this._tautulliModal;
        if (!m) return;
        const val = btn.dataset.tlLdMpage;
        const totalPages = Math.max(1, Math.ceil(m.libDetailMediaTotal / 25));
        let p = m.libDetailMediaPage || 0;
        if (val === "first") p = 0;
        else if (val === "prev") p = Math.max(0, p - 1);
        else if (val === "next") p = Math.min(totalPages - 1, p + 1);
        else if (val === "last") p = totalPages - 1;
        else p = parseInt(val);
        if (p === m.libDetailMediaPage) return;
        m.libDetailMediaPage = p;
        await this._tlRefetchLdMedia(body);
      });
    });
    _qa("[data-tl-md-open]").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        if (!this._tautulliModal) return;
        const { tlMdOpen: key, tlMdTitle: title, tlMdThumb: thumb, tlMdPrev: prev } = el.dataset;
        this._tlOpenMediaDetail(key, title, thumb, prev, body);
      });
    });
    _q("[data-tl-md-back-lib]")?.addEventListener("click", () => {
      if (!this._tautulliModal) return;
      this._tautulliModal.mediaDetailKey = null;
      body.innerHTML = this._tlBodyLibDetail();
      this._wireTautulliModalBody(body);
      this._tlLoadUdThumbs(body);
    });
    _q("[data-tl-md-back-user]")?.addEventListener("click", () => {
      if (!this._tautulliModal) return;
      this._tautulliModal.mediaDetailKey = null;
      body.innerHTML = this._tlBodyUserDetail();
      this._wireTautulliModalBody(body);
      this._tlLoadUdThumbs(body);
    });
    _qa("[data-tl-md-tab]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!this._tautulliModal) return;
        const m = this._tautulliModal;
        const tab = btn.dataset.tlMdTab;
        m.mediaDetailTab = tab;
        if (tab === "history" && !m.mediaDetailHistData?.length) {
          body.innerHTML = this._tlBodyMediaDetail();
          this._wireTautulliModalBody(body);
          await this._tlRefetchMdHistory(body);
          return;
        }
        body.innerHTML = this._tlBodyMediaDetail();
        this._wireTautulliModalBody(body);
        if (tab === "info") this._tlLoadUdThumbs(body);
      });
    });
    _qa("[data-tl-md-hpage]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const m = this._tautulliModal;
        if (!m) return;
        const val = btn.dataset.tlMdHpage;
        const perPage = this._tlCalcPerPage({ hasFilter: false });
        const totalPages = Math.max(1, Math.ceil(m.mediaDetailHistTotal / perPage));
        let p = m.mediaDetailHistPage || 0;
        if (val === "first") p = 0;
        else if (val === "prev") p = Math.max(0, p - 1);
        else if (val === "next") p = Math.min(totalPages - 1, p + 1);
        else if (val === "last") p = totalPages - 1;
        else p = parseInt(val);
        if (p === m.mediaDetailHistPage) return;
        m.mediaDetailHistPage = p;
        await this._tlRefetchMdHistory(body);
      });
    });
    this._wireGraphControls(body);
    _q("#tl-libs-search")?.addEventListener("input", (e) => {
      if (!this._tautulliModal) return;
      this._tautulliModal.libsSearch = e.target.value || "";
      this._tautulliModal.libsPage = 0;
      this._patchResultsWrap(body, "tl-libs-results-wrap", () => this._tlBodyLibraries(this._tautulliModal.libsData, this._tautulliModal.libsTotal));
      this._wireTautulliModalBody(body);
    });
    _q("#tl-libs-perpage")?.addEventListener("change", async (e) => {
      if (!this._tautulliModal) return;
      this._tautulliModal.libsPerPage = parseInt(e.target.value);
      this._tautulliModal.libsPage = 0;
      await this._tlRefetchLibraries(body);
    });
    _qa("[data-tl-lib-sort]").forEach((th) => {
      th.addEventListener("click", async () => {
        if (!this._tautulliModal) return;
        const col = th.dataset.tlLibSort;
        if (this._tautulliModal.libsSortCol === col) {
          this._tautulliModal.libsSortDir = this._tautulliModal.libsSortDir === "asc" ? "desc" : "asc";
        } else {
          this._tautulliModal.libsSortCol = col;
          this._tautulliModal.libsSortDir = "desc";
        }
        this._tautulliModal.libsPage = 0;
        await this._tlRefetchLibraries(body);
      });
    });
    _qa("[data-tl-lpage]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!this._tautulliModal) return;
        const m = this._tautulliModal;
        const totalPages = Math.max(1, Math.ceil(m.libsTotal / m.libsPerPage));
        const val = btn.dataset.tlLpage;
        let p = m.libsPage;
        if (val === "first") p = 0;
        else if (val === "prev") p = Math.max(0, p - 1);
        else if (val === "next") p = Math.min(totalPages - 1, p + 1);
        else if (val === "last") p = totalPages - 1;
        else p = parseInt(val);
        if (p === m.libsPage) return;
        m.libsPage = p;
        await this._tlRefetchLibraries(body);
      });
    });
    _q("#tl-libs-edit-btn")?.addEventListener("click", () => {
      if (!this._tautulliModal) return;
      this._tautulliModal.libsEditMode = !this._tautulliModal.libsEditMode;
      body.innerHTML = this._tlBodyLibraries(this._tautulliModal.libsData, this._tautulliModal.libsTotal);
      this._wireTautulliModalBody(body);
    });
    _q("#tl-libs-cols-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!this._tautulliModal) return;
      this._tautulliModal.libsColsOpen = !this._tautulliModal.libsColsOpen;
      const menu = body.querySelector("#tl-libs-cols-menu");
      if (menu) menu.style.display = this._tautulliModal.libsColsOpen ? "block" : "none";
      this._floatMenu(e.currentTarget, menu);
    });
    _qa("[data-tl-lib-col]").forEach((item) => {
      item.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        const hidden = this._tlHidden("libsHiddenCols", ["type"]);
        const col = item.dataset.tlLibCol;
        if (hidden.has(col)) hidden.delete(col);
        else hidden.add(col);
        this._tlSaveColPrefs();
        this._tautulliModal.libsColsOpen = true;
        body.innerHTML = this._tlBodyLibraries(this._tautulliModal.libsData, this._tautulliModal.libsTotal);
        this._wireTautulliModalBody(body);
      });
    });
    _q("#tl-libs-mob-cols-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!this._tautulliModal) return;
      this._tautulliModal.libsMobColsOpen = !this._tautulliModal.libsMobColsOpen;
      const menu = body.querySelector("#tl-libs-mob-cols-menu");
      if (menu) menu.style.display = this._tautulliModal.libsMobColsOpen ? "block" : "none";
      this._floatMenu(e.currentTarget, menu);
    });
    _qa("[data-tl-lib-mob-col]").forEach((item) => {
      item.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        const hidden = this._tlHidden("libsMobHiddenCols", ["type", "parents", "children", "lastStream"]);
        const col = item.dataset.tlLibMobCol;
        if (hidden.has(col)) hidden.delete(col);
        else hidden.add(col);
        this._tlSaveColPrefs();
        this._tautulliModal.libsMobColsOpen = true;
        body.innerHTML = this._tlBodyLibraries(this._tautulliModal.libsData, this._tautulliModal.libsTotal);
        this._wireTautulliModalBody(body);
      });
    });
    _qa("[data-tl-lib-delete]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        const sid = btn.dataset.tlLibDelete;
        if (!sid) return;
        this._confirmInline(btn, async () => {
          await this._tlApiFetch("delete_library", `section_id=${sid}`);
          await this._tlRefetchLibraries(body);
        }, "Remove library from Tautulli?");
      });
    });
    _qa("[data-tl-lib-purge]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        const sid = btn.dataset.tlLibPurge;
        if (!sid) return;
        this._confirmInline(btn, async () => {
          const srv = await this._tlApiFetch("get_servers_info");
          const machineId = srv?.response?.data?.[0]?.machine_identifier || "";
          await this._tlApiFetch(
            "delete_all_library_history",
            `section_id=${sid}${machineId ? `&server_id=${machineId}` : ""}`
          );
          await this._tlRefetchLibraries(body);
        }, "Erase all history for this library?");
      });
    });
    _q("#tl-users-search")?.addEventListener("input", (e) => {
      if (!this._tautulliModal) return;
      this._tautulliModal.usersSearch = e.target.value || "";
      this._tautulliModal.usersPage = 0;
      this._patchResultsWrap(body, "tl-users-results-wrap", () => this._tlBodyUsers(this._tautulliModal.usersData, this._tautulliModal.usersTotal));
      this._wireTautulliModalBody(body);
    });
    _q("#tl-users-perpage")?.addEventListener("change", async (e) => {
      if (!this._tautulliModal) return;
      this._tautulliModal.usersPerPage = parseInt(e.target.value);
      this._tautulliModal.usersPage = 0;
      await this._tlRefetchUsers(body);
    });
    _qa("[data-tl-sort]").forEach((th) => {
      th.addEventListener("click", async () => {
        if (!this._tautulliModal) return;
        const col = th.dataset.tlSort;
        if (this._tautulliModal.usersSortCol === col) {
          this._tautulliModal.usersSortDir = this._tautulliModal.usersSortDir === "asc" ? "desc" : "asc";
        } else {
          this._tautulliModal.usersSortCol = col;
          this._tautulliModal.usersSortDir = "desc";
        }
        this._tautulliModal.usersPage = 0;
        await this._tlRefetchUsers(body);
      });
    });
    _qa("[data-tl-upage]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!this._tautulliModal) return;
        const m = this._tautulliModal;
        const totalPages = Math.max(1, Math.ceil(m.usersTotal / m.usersPerPage));
        const val = btn.dataset.tlUpage;
        let p = m.usersPage;
        if (val === "first") p = 0;
        else if (val === "prev") p = Math.max(0, p - 1);
        else if (val === "next") p = Math.min(totalPages - 1, p + 1);
        else if (val === "last") p = totalPages - 1;
        else p = parseInt(val);
        if (p === m.usersPage) return;
        m.usersPage = p;
        await this._tlRefetchUsers(body);
      });
    });
    _q("#tl-users-edit-btn")?.addEventListener("click", () => {
      if (!this._tautulliModal) return;
      this._tautulliModal.usersEditMode = !this._tautulliModal.usersEditMode;
      body.innerHTML = this._tlBodyUsers(this._tautulliModal.usersData, this._tautulliModal.usersTotal);
      this._wireTautulliModalBody(body);
    });
    _q("#tl-users-cols-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!this._tautulliModal) return;
      this._tautulliModal.usersColsOpen = !this._tautulliModal.usersColsOpen;
      const menu = body.querySelector("#tl-users-cols-menu");
      if (menu) menu.style.display = this._tautulliModal.usersColsOpen ? "block" : "none";
      this._floatMenu(e.currentTarget, menu);
    });
    _qa("[data-tl-col]").forEach((item) => {
      item.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        const hidden = this._tlHidden("usersHiddenCols", ["username", "fullname", "email"]);
        const col = item.dataset.tlCol;
        if (hidden.has(col)) hidden.delete(col);
        else hidden.add(col);
        this._tlSaveColPrefs();
        this._tautulliModal.usersColsOpen = true;
        body.innerHTML = this._tlBodyUsers(this._tautulliModal.usersData, this._tautulliModal.usersTotal);
        this._wireTautulliModalBody(body);
      });
    });
    _q("#tl-users-mob-cols-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!this._tautulliModal) return;
      this._tautulliModal.usersMobColsOpen = !this._tautulliModal.usersMobColsOpen;
      const menu = body.querySelector("#tl-users-mob-cols-menu");
      if (menu) menu.style.display = this._tautulliModal.usersMobColsOpen ? "block" : "none";
      this._floatMenu(e.currentTarget, menu);
    });
    _qa("[data-tl-usr-mob-col]").forEach((item) => {
      item.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        const hidden = this._tlHidden("usersMobHiddenCols", ["lastPlayed", "platform", "player", "ip", "username", "email"]);
        const col = item.dataset.tlUsrMobCol;
        if (hidden.has(col)) hidden.delete(col);
        else hidden.add(col);
        this._tlSaveColPrefs();
        this._tautulliModal.usersMobColsOpen = true;
        body.innerHTML = this._tlBodyUsers(this._tautulliModal.usersData, this._tautulliModal.usersTotal);
        this._wireTautulliModalBody(body);
      });
    });
    _qa("[data-tl-delete]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        const uid = btn.dataset.tlDelete;
        if (!uid) return;
        this._confirmInline(btn, async () => {
          await this._tlApiFetch("delete_user", `user_id=${uid}`);
          await this._tlRefetchUsers(body);
        }, "Remove user from Tautulli?");
      });
    });
    _qa("[data-tl-purge]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!this._tautulliModal) return;
        const uid = btn.dataset.tlPurge;
        if (!uid) return;
        this._confirmInline(btn, async () => {
          await this._tlApiFetch("delete_all_user_history", `user_id=${uid}`);
          await this._tlRefetchUsers(body);
        }, "Erase all history for this user?");
      });
    });
    _qa("[data-tl-toggle-hist]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!this._tautulliModal) return;
        const uid = btn.dataset.tlToggleHist;
        const cur = parseInt(btn.dataset.tlKh || "1");
        btn.style.opacity = "0.5";
        btn.disabled = true;
        await this._tlApiFetch("edit_user", `user_id=${uid}&keep_history=${cur ? 0 : 1}`);
        await this._tlRefetchUsers(body);
      });
    });
    _qa("[data-tl-toggle-guest]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!this._tautulliModal) return;
        const uid = btn.dataset.tlToggleGuest;
        const cur = parseInt(btn.dataset.tlAg || "0");
        btn.style.opacity = "0.5";
        btn.disabled = true;
        await this._tlApiFetch("edit_user", `user_id=${uid}&allow_guest=${cur ? 0 : 1}`);
        await this._tlRefetchUsers(body);
      });
    });
  }
  // ── User detail helpers ───────────────────────────────────────────────────
  async _tlOpenUserDetail(userId, name, thumb, body) {
    if (!this._tautulliModal) return;
    const m = this._tautulliModal;
    m.userDetailId = userId;
    m.userDetailName = name;
    m.userDetailThumb = thumb;
    m.userDetailTab = "profile";
    m.userDetailProfile = null;
    m.userDetailHistData = [];
    m.userDetailHistTotal = 0;
    m.userDetailHistPage = 0;
    m.userDetailHistMedia = null;
    m.userDetailHistPlayback = null;
    m.userDetailHistSearch = "";
    m.userDetailHistExpandedRow = null;
    m.userDetailIpsData = [];
    m.userDetailIpsPage = 0;
    body.style.overflowY = "hidden";
    body.innerHTML = this._tlBodyUserDetail();
    this._wireTautulliModalBody(body);
    const profile = await this._tlFetchUserProfile(userId);
    if (!this._tautulliModal || this._tautulliModal.userDetailId !== userId) return;
    m.userDetailProfile = profile;
    body.innerHTML = this._tlBodyUserDetail();
    this._wireTautulliModalBody(body);
    this._tlLoadUdThumbs(body);
  }
  async _tlLoadUdThumbs(body) {
    const token = this._hass?.auth?.data?.access_token;
    if (!token) return;
    const imgs = body.querySelectorAll("img[data-tl-plex-path]");
    if (!imgs.length) return;
    for (const img of imgs) {
      const path = img.dataset.tlPlexPath;
      if (!path) continue;
      try {
        const r = await fetch(
          `/api/arr_stack/tautulli/pms_image_proxy?img=${encodeURIComponent(path)}&width=220&height=330&opacity=100&background=282828&blur=0&fallback=poster`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!r.ok) continue;
        const blob = await r.blob();
        if (!blob.type.startsWith("image/")) continue;
        if (!img.isConnected) continue;
        img.src = URL.createObjectURL(blob);
        img.removeAttribute("data-tl-plex-path");
      } catch {
      }
    }
  }
  async _tlRefetchUdHistory(body) {
    const m = this._tautulliModal;
    if (!m || !m.userDetailId) return;
    const resultsWrap = body.querySelector(".tl-ud-hist-results-wrap");
    if (resultsWrap) {
      resultsWrap.innerHTML = `<div class="u-empty-lg">${this._t("loading")}</div>`;
    } else {
      m.userDetailHistLoading = true;
      body.innerHTML = this._tlBodyUserDetail();
      this._wireTautulliModalBody(body);
    }
    const data = await this._tlFetchHistory(
      m.userDetailHistPage,
      m.userDetailId,
      m.userDetailHistMedia,
      m.userDetailHistPlayback,
      this._tlCalcPerPage({ hasFilter: true }),
      m.userDetailHistSearch
    );
    if (!this._tautulliModal) return;
    m.userDetailHistLoading = false;
    m.userDetailHistData = data.data || [];
    m.userDetailHistTotal = data.recordsFiltered || 0;
    this._patchResultsWrap(body, "tl-ud-hist-results-wrap", () => this._tlBodyUserDetail());
    this._wireTautulliModalBody(body);
  }
  // ── Library detail helpers ───────────────────────────────────────────────
  async _tlOpenLibDetail(sectionId, name, body) {
    if (!this._tautulliModal) return;
    const m = this._tautulliModal;
    m.libDetailId = sectionId;
    m.libDetailName = name;
    m.libDetailTab = "profile";
    m.libDetailProfile = null;
    m.libDetailHistData = [];
    m.libDetailHistTotal = 0;
    m.libDetailHistPage = 0;
    m.libDetailHistMedia = null;
    m.libDetailHistPlayback = null;
    m.libDetailHistSearch = "";
    m.libDetailHistExpandedRow = null;
    m.libDetailMediaData = [];
    m.libDetailMediaTotal = 0;
    m.libDetailMediaPage = 0;
    m.libDetailMediaSearch = "";
    m.libDetailMediaSort = "added_at";
    m.libDetailMediaDir = "desc";
    body.style.overflowY = "hidden";
    body.innerHTML = this._tlBodyLibDetail();
    this._wireTautulliModalBody(body);
    const profile = await this._tlFetchLibProfile(sectionId);
    if (!this._tautulliModal || this._tautulliModal.libDetailId !== sectionId) return;
    m.libDetailProfile = profile;
    body.innerHTML = this._tlBodyLibDetail();
    this._wireTautulliModalBody(body);
    this._tlLoadUdThumbs(body);
  }
  async _tlRefetchLdHistory(body) {
    const m = this._tautulliModal;
    if (!m || !m.libDetailId) return;
    const resultsWrap = body.querySelector(".tl-ld-hist-results-wrap");
    if (resultsWrap) {
      resultsWrap.innerHTML = `<div class="u-empty-lg">${this._t("loading")}</div>`;
    } else {
      m.libDetailHistLoading = true;
      body.innerHTML = this._tlBodyLibDetail();
      this._wireTautulliModalBody(body);
    }
    const perPage = this._tlCalcPerPage({ hasFilter: true });
    const data = await this._tlFetchLibHistory(
      m.libDetailId,
      m.libDetailHistPage,
      m.libDetailHistMedia,
      m.libDetailHistPlayback,
      m.libDetailHistSearch,
      perPage
    );
    if (!this._tautulliModal) return;
    m.libDetailHistLoading = false;
    m.libDetailHistData = data.data || [];
    m.libDetailHistTotal = data.recordsFiltered || 0;
    this._patchResultsWrap(body, "tl-ld-hist-results-wrap", () => this._tlBodyLibDetail());
    this._wireTautulliModalBody(body);
  }
  async _tlRefetchLdMedia(body) {
    const m = this._tautulliModal;
    if (!m || !m.libDetailId) return;
    const resultsWrap = body.querySelector(".tl-ld-media-results-wrap");
    if (resultsWrap) {
      resultsWrap.innerHTML = `<div class="u-empty-lg">${this._t("loading")}</div>`;
    } else {
      body.innerHTML = this._tlBodyLibDetail();
      this._wireTautulliModalBody(body);
    }
    const data = await this._tlFetchLibMedia(
      m.libDetailId,
      m.libDetailMediaPage,
      m.libDetailMediaSort,
      m.libDetailMediaDir,
      m.libDetailMediaSearch,
      25
    );
    if (!this._tautulliModal) return;
    m.libDetailMediaData = data.data || [];
    m.libDetailMediaTotal = data.recordsTotal || 0;
    this._patchResultsWrap(body, "tl-ld-media-results-wrap", () => this._tlBodyLibDetail());
    this._wireTautulliModalBody(body);
  }
  // ── Media item detail helpers ────────────────────────────────────────────
  async _tlOpenMediaDetail(ratingKey, title, thumb, prev, body) {
    if (!this._tautulliModal) return;
    const m = this._tautulliModal;
    m.mediaDetailKey = ratingKey;
    m.mediaDetailTitle = title;
    m.mediaDetailThumb = thumb;
    m.mediaDetailTab = "info";
    m.mediaDetailData = null;
    m.mediaDetailHistData = [];
    m.mediaDetailHistTotal = 0;
    m.mediaDetailHistPage = 0;
    m.mediaDetailPrev = prev || "lib";
    body.style.overflowY = "hidden";
    body.innerHTML = this._tlBodyMediaDetail();
    this._wireTautulliModalBody(body);
    const data = await this._tlFetchMediaDetail(ratingKey);
    if (!this._tautulliModal || this._tautulliModal.mediaDetailKey !== ratingKey) return;
    m.mediaDetailData = data;
    body.innerHTML = this._tlBodyMediaDetail();
    this._wireTautulliModalBody(body);
    this._tlLoadUdThumbs(body);
  }
  async _tlRefetchMdHistory(body) {
    const m = this._tautulliModal;
    if (!m || !m.mediaDetailKey) return;
    const perPage = this._tlCalcPerPage({ hasFilter: false });
    const data = await this._tlFetchMediaHistory(m.mediaDetailKey, m.mediaDetailHistPage, perPage);
    if (!this._tautulliModal) return;
    m.mediaDetailHistData = data.data || [];
    m.mediaDetailHistTotal = data.recordsFiltered || 0;
    body.innerHTML = this._tlBodyMediaDetail();
    this._wireTautulliModalBody(body);
  }
  // ── Graph controls wiring ─────────────────────────────────────────────────
  // Called after body render when graphs tab is active.
  // Also called from _wireTautulliModalBody for all tabs (no-ops if no els).
  _wireGraphControls(body) {
    const _q = (sel) => {
      const el = body.querySelector(sel);
      if (!el || el._tlWired) return null;
      el._tlWired = true;
      return el;
    };
    const _qa = (sel) => [...body.querySelectorAll(sel)].filter((el) => {
      if (el._tlWired) return false;
      el._tlWired = true;
      return true;
    });
    if (!body) return;
    requestAnimationFrame(() => {
      for (const id of ["#tl-g-sub-nav", "#tl-g-metric-nav"]) {
        const nav = body.querySelector(id);
        this._syncNavInd(nav, nav?.querySelector(".mt-nav-btn.is-on"));
      }
    });
    _qa("[data-tl-graph-sub]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const m = this._tautulliModal;
        if (!m) return;
        const newSub = btn.dataset.tlGraphSub;
        if (newSub === m.graphsSub) return;
        m.graphsSub = newSub;
        m.graphsData = null;
        if (newSub === "totals") {
          if (m.graphsRange > 60) m.graphsRange = 12;
        } else {
          if (m.graphsRange <= 60 && m.graphsSub === "totals") m.graphsRange = 30;
        }
        await this._tlRefetchGraphs(body);
      });
    });
    _qa("[data-tl-g-metric]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const m = this._tautulliModal;
        if (!m) return;
        const v = btn.dataset.tlGMetric;
        if (v === m.graphsMetric) return;
        m.graphsMetric = v;
        m.graphsData = null;
        await this._tlRefetchGraphs(body);
      });
    });
    {
      let _gRangeTimer = null;
      const doRangeRefetch = async (inputEl) => {
        const m = this._tautulliModal;
        if (!m) return;
        const v = Math.max(1, parseInt(inputEl.value) || 1);
        m.graphsRange = v;
        m.graphsData = null;
        await this._tlRefetchGraphs(body);
      };
      const rangeEl = body.querySelector("#tl-g-range");
      if (rangeEl) {
        rangeEl.addEventListener("input", (e) => {
          clearTimeout(_gRangeTimer);
          _gRangeTimer = setTimeout(() => doRangeRefetch(e.target), 700);
        });
        rangeEl.addEventListener("change", (e) => {
          clearTimeout(_gRangeTimer);
          doRangeRefetch(e.target);
        });
      }
    }
    _q("#tl-g-dd-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const m = this._tautulliModal;
      if (!m) return;
      m.graphsDdOpen = !m.graphsDdOpen;
      const panel = body.querySelector("#tl-g-dd-panel");
      if (panel) panel.style.display = m.graphsDdOpen ? "block" : "none";
    });
    if (!body._tlGDdClose) {
      body._tlGDdClose = true;
      body.addEventListener("click", (e) => {
        const m = this._tautulliModal;
        if (!m || !m.graphsDdOpen) return;
        if (!e.target.closest("#tl-g-dd-wrap")) {
          m.graphsDdOpen = false;
          const panel = body.querySelector("#tl-g-dd-panel");
          if (panel) panel.style.display = "none";
        }
      });
    }
    _q("#tl-g-dd-all")?.addEventListener("click", async (e) => {
      e.stopPropagation();
      const m = this._tautulliModal;
      if (!m) return;
      m.graphsSelectedUsers = null;
      m.graphsData = null;
      await this._tlRefetchGraphs(body);
    });
    _q("#tl-g-dd-none")?.addEventListener("click", async (e) => {
      e.stopPropagation();
      const m = this._tautulliModal;
      if (!m) return;
      m.graphsSelectedUsers = /* @__PURE__ */ new Set();
      m.graphsData = null;
      await this._tlRefetchGraphs(body);
    });
    _qa("[data-tl-g-uid]").forEach((item) => {
      item.addEventListener("click", async (e) => {
        e.stopPropagation();
        const m = this._tautulliModal;
        if (!m) return;
        const uid = item.dataset.tlGUid;
        const sel = m.graphsSelectedUsers;
        if (sel && sel.size === 1 && sel.has(uid)) {
          m.graphsSelectedUsers = null;
        } else {
          m.graphsSelectedUsers = /* @__PURE__ */ new Set([uid]);
        }
        m.graphsData = null;
        m.graphsDdOpen = true;
        await this._tlRefetchGraphs(body);
        const panel = body.querySelector("#tl-g-dd-panel");
        if (panel) panel.style.display = "block";
      });
    });
    this._wireChartCards(body);
  }
  // ── Shared chart tooltip + SVG-fix wiring — used by Tautulli AND Tracearr ─
  _wireChartCards(body) {
    const _q = (sel) => {
      const el = body.querySelector(sel);
      if (!el || el._tlWired) return null;
      el._tlWired = true;
      return el;
    };
    const _qa = (sel) => [...body.querySelectorAll(sel)].filter((el) => {
      if (el._tlWired) return false;
      el._tlWired = true;
      return true;
    });
    if (!body) return;
    const _tlGVBW = 1e3;
    const _tlGRoundedTopJS = (x, y, w, h, rx, ry) => {
      rx = Math.min(rx, w / 2);
      ry = Math.min(ry, h / 2);
      if (rx < 0.5 || ry < 0.5) return `M${x},${y + h} L${x},${y} L${x + w},${y} L${x + w},${y + h} Z`;
      const f = (n) => n.toFixed(2);
      return `M${f(x)},${f(y + h)} L${f(x)},${f(y + ry)} Q${f(x)},${f(y)} ${f(x + rx)},${f(y)} L${f(x + w - rx)},${f(y)} Q${f(x + w)},${f(y)} ${f(x + w)},${f(y + ry)} L${f(x + w)},${f(y + h)} Z`;
    };
    const fixSvgDots = (svg) => {
      const rect = svg.getBoundingClientRect();
      const svgW = rect.width, svgH = rect.height;
      if (!svgW || !svgH) return;
      const ryFactor = svgW / (5 * svgH);
      svg.querySelectorAll("circle").forEach((c) => {
        const r = parseFloat(c.getAttribute("r")) || 0;
        const el = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        el.setAttribute("cx", c.getAttribute("cx") || "0");
        el.setAttribute("cy", c.getAttribute("cy") || "0");
        el.setAttribute("rx", String(r));
        el.setAttribute("ry", String(r * ryFactor));
        el.setAttribute("data-tl-dot-r", String(r));
        const fill = c.getAttribute("fill");
        if (fill) el.setAttribute("fill", fill);
        const styl = c.getAttribute("style");
        if (styl) el.setAttribute("style", styl);
        c.parentNode.replaceChild(el, c);
      });
      svg.querySelectorAll("ellipse[data-tl-dot-r]").forEach((el) => {
        const r = parseFloat(el.getAttribute("data-tl-dot-r")) || 0;
        el.setAttribute("ry", String(r * ryFactor));
      });
      svg.querySelectorAll("path[data-tl-rr]").forEach((p) => {
        const rr = parseFloat(p.getAttribute("data-tl-rr")) || 0;
        const bx = parseFloat(p.getAttribute("data-tl-bx")) || 0;
        const by = parseFloat(p.getAttribute("data-tl-by")) || 0;
        const bw = parseFloat(p.getAttribute("data-tl-bw")) || 0;
        const bh = parseFloat(p.getAttribute("data-tl-bh")) || 0;
        p.setAttribute("d", _tlGRoundedTopJS(bx, by, bw, bh, rr, rr * ryFactor));
      });
    };
    requestAnimationFrame(() => {
      _qa(".tl-g-svg").forEach((svg) => {
        fixSvgDots(svg);
        if (typeof ResizeObserver !== "undefined") {
          const ro = new ResizeObserver(() => fixSvgDots(svg));
          ro.observe(svg);
        }
      });
    });
    _qa(".tl-g-card").forEach((card) => {
      let activeCol = null;
      const tipEl = card.querySelector(".tl-g-tip");
      if (!tipEl) return;
      const showColTip = (colData, eClientX, eClientY) => {
        if (!colData.vals || !colData.vals.length) return;
        const lbl = colData.lbl || "";
        const rows = colData.vals.map((v) => {
          const disp = v.fv != null ? v.fv : v.v;
          return `<div style="display:flex;align-items:center;gap:6px;padding:1px 0">
            <span style="width:6px;height:6px;border-radius:1px;background:${v.hex || "var(--is-text-muted)"};flex-shrink:0"></span>
            <span style="color:var(--is-text-muted)">${v.n}</span>
            <span style="font-weight:600;color:var(--is-text);margin-left:auto;padding-left:10px">${disp}</span>
          </div>`;
        }).join("");
        const totDisp = colData.ftot != null ? colData.ftot : colData.tot;
        const totRow = totDisp != null ? `<div style="display:flex;justify-content:space-between;border-top:1px solid var(--is-divider);margin-top:4px;padding-top:4px">
               <span style="color:var(--is-text-muted);font-weight:600">Total</span>
               <span style="font-weight:700;color:var(--is-text)">${totDisp}</span>
             </div>` : "";
        tipEl.innerHTML = `<div style="font-size:10px;color:var(--is-text-muted);margin-bottom:4px">${lbl}</div>${rows}${totRow}`;
        const cardRect = tipEl.parentElement.getBoundingClientRect();
        const clickX = eClientX - cardRect.left;
        let tipTop = eClientY - cardRect.top - 8;
        tipEl.style.display = "block";
        tipEl.style.left = "0";
        tipEl.style.top = "0";
        const tipW = tipEl.offsetWidth, tipH = tipEl.offsetHeight, contW = cardRect.width;
        let tipLeft = clickX + 12;
        if (tipLeft + tipW > contW - 4) tipLeft = clickX - tipW - 12;
        tipLeft = Math.max(4, tipLeft);
        tipTop = Math.max(4, tipTop - tipH);
        tipEl.style.left = tipLeft + "px";
        tipEl.style.top = tipTop + "px";
      };
      const clearHighlights = () => card.querySelectorAll(".tl-g-lhlt").forEach((r) => r.style.opacity = "0");
      const hideTip = () => {
        tipEl.style.display = "none";
        activeCol = null;
        clearHighlights();
      };
      card.addEventListener("click", (e) => {
        const lcol = e.target.closest(".tl-g-lcol");
        if (lcol) {
          if (lcol === activeCol) {
            hideTip();
            return;
          }
          clearHighlights();
          activeCol = lcol;
          const hlt = lcol.querySelector(".tl-g-lhlt");
          if (hlt) hlt.style.opacity = "1";
          let colData2;
          try {
            colData2 = JSON.parse(lcol.dataset.tlGCol);
          } catch {
            return;
          }
          showColTip(colData2, e.clientX, e.clientY);
          return;
        }
        const col = e.target.closest(".tl-g-col");
        if (!col || !col.dataset.tlGCol) {
          hideTip();
          return;
        }
        if (col === activeCol) {
          hideTip();
          return;
        }
        clearHighlights();
        activeCol = col;
        let colData;
        try {
          colData = JSON.parse(col.dataset.tlGCol);
        } catch {
          return;
        }
        showColTip(colData, e.clientX, e.clientY);
      });
    });
  }
};
var wireTautulliMixin = _WireTautulliMethods.prototype;


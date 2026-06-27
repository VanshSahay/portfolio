/*
 *  Tabs + margin notes.
 */

/* ─── Tab switching ────────────────────────── */
(function () {
  var tabs = document.querySelectorAll(".tab");
  var panels = document.querySelectorAll(".tab-panel");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = this.getAttribute("data-tab");
      var panelId = "panel-" + target;

      tabs.forEach(function (t) { t.classList.remove("active"); });
      panels.forEach(function (p) {
        p.classList.remove("active");
        p.style.display = "none";
      });

      this.classList.add("active");
      var panel = document.getElementById(panelId);
      if (panel) {
        panel.classList.add("active");
        panel.style.display = "block";
      }
    });
  });
})();

/* ─── Margin notes ─────────────────────────── */
(function () {
  var noteEl = document.getElementById("margin-note");
  var annotatedEls = document.querySelectorAll(".annotated");

  if (!noteEl || !annotatedEls.length) return;

  function hasMarginRoom() {
    return window.innerWidth > 900;
  }

  var activeEl = null;
  var hideTimer = null;

  function showNote(el) {
    if (activeEl === el) return;
    hideNote();

    var noteText = el.getAttribute("data-note");
    if (!noteText || !hasMarginRoom()) return;

    noteEl.textContent = noteText;
    noteEl.classList.add("visible");

    var elRect = el.getBoundingClientRect();
    var noteHeight = noteEl.getBoundingClientRect().height;
    var idealTop = elRect.top + elRect.height / 2 - noteHeight / 2;

    var pad = 16;
    var clampedTop = Math.max(pad, Math.min(idealTop, window.innerHeight - noteHeight - pad));

    noteEl.style.top = clampedTop + "px";

    el.classList.add("active");
    activeEl = el;
  }

  function hideNote() {
    if (hideTimer) clearTimeout(hideTimer);
    noteEl.classList.remove("visible");
    if (activeEl) {
      activeEl.classList.remove("active");
      activeEl = null;
    }
  }

  annotatedEls.forEach(function (el) {
    el.addEventListener("mouseenter", function () {
      if (hideTimer) clearTimeout(hideTimer);
      showNote(el);
    });

    el.addEventListener("mouseleave", function () {
      hideTimer = setTimeout(hideNote, 150);
    });

    el.addEventListener("click", function (e) {
      if (activeEl === el) {
        hideNote();
        e.preventDefault();
        return;
      }
      showNote(el);
      e.preventDefault();
    });
  });

  noteEl.addEventListener("mouseenter", function () {
    if (hideTimer) clearTimeout(hideTimer);
  });

  noteEl.addEventListener("mouseleave", function () {
    hideNote();
  });

  window.addEventListener("scroll", function () {
    if (activeEl) hideNote();
  }, { passive: true });

  window.addEventListener("resize", function () {
    if (!hasMarginRoom() && activeEl) hideNote();
  });
})();

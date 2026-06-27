/*
 *  Writing panel: loads manifest from GitHub, renders articles via marked.js.
 *  Supports deep links: vanshs.eth.limo/#/writing/hello-world
 *  Prefetches on hover, caches responses.
 */

(function () {
  var listEl = document.getElementById("writing-list");
  var articleEl = document.getElementById("writing-article");
  var contentEl = document.getElementById("article-content");
  var backBtn = document.getElementById("writing-back");

  if (!listEl || !articleEl || !contentEl || !backBtn) return;

  var GITHUB_RAW = "https://raw.githubusercontent.com/VanshSahay/portfolio/main/writing";
  var articles = [];
  var currentSlug = null;
  var cache = {};
  var prefetching = {};

  // Load manifest, then check for deep link
  fetch(GITHUB_RAW + "/manifest.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      articles = data;
      renderList();
      checkDeepLink();
    })
    .catch(function () {
      listEl.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;">No articles yet.</p>';
    });

  function checkDeepLink() {
    var match = window.location.hash.match(/^#\/writing\/(.+)/);
    if (match) {
      var slug = match[1];
      if (articles.some(function (a) { return a.slug === slug; })) {
        // Switch to writing tab
        switchToWritingTab();
        loadArticle(slug);
      }
    }
  }

  // Listen for hash changes (back/forward browser buttons)
  window.addEventListener("hashchange", function () {
    var match = window.location.hash.match(/^#\/writing\/(.+)/);
    if (match) {
      var slug = match[1];
      if (articles.some(function (a) { return a.slug === slug; })) {
        switchToWritingTab();
        loadArticle(slug);
      }
    } else if (window.location.hash === "" && currentSlug) {
      // Back to list
      showList();
    }
  });

  function switchToWritingTab() {
    var tabs = document.querySelectorAll(".tab");
    var panels = document.querySelectorAll(".tab-panel");
    tabs.forEach(function (t) { t.classList.remove("active"); });
    panels.forEach(function (p) {
      p.classList.remove("active");
      p.style.display = "none";
    });
    var writingTab = document.querySelector('.tab[data-tab="writing"]');
    var writingPanel = document.getElementById("panel-writing");
    if (writingTab) writingTab.classList.add("active");
    if (writingPanel) {
      writingPanel.classList.add("active");
      writingPanel.style.display = "block";
    }
  }

  function renderList() {
    if (!articles.length) {
      listEl.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;">No articles yet.</p>';
      return;
    }

    listEl.innerHTML = "";
    articles.forEach(function (a) {
      var div = document.createElement("div");
      div.className = "writing-item";
      div.innerHTML =
        '<span class="writing-title">' + escapeHtml(a.title) + '</span>' +
        '<span class="writing-date">' + escapeHtml(a.date) + '</span>' +
        '<span class="writing-desc">' + escapeHtml(a.description) + '</span>';

      div.addEventListener("click", function () { loadArticle(a.slug); });
      div.addEventListener("mouseenter", function () { prefetch(a.slug); });
      div.addEventListener("touchstart", function () { prefetch(a.slug); }, { passive: true });

      listEl.appendChild(div);
    });
  }

  function prefetch(slug) {
    if (cache[slug] || prefetching[slug]) return;

    prefetching[slug] = fetch(GITHUB_RAW + "/" + slug + ".md")
      .then(function (r) {
        if (!r.ok) throw new Error("Not found");
        return r.text();
      })
      .then(function (md) {
        cache[slug] = marked.parse(md);
        delete prefetching[slug];
      })
      .catch(function () {
        delete prefetching[slug];
      });
  }

  function loadArticle(slug) {
    if (currentSlug === slug && listEl.style.display === "none") return;

    // Update URL hash for sharing
    window.location.hash = "#/writing/" + slug;

    listEl.style.display = "none";
    articleEl.style.display = "block";
    contentEl.innerHTML = '<p style="color:var(--muted);">Loading…</p>';

    if (cache[slug]) {
      contentEl.innerHTML = cache[slug];
      currentSlug = slug;
      return;
    }

    if (prefetching[slug]) {
      prefetching[slug].then(function () {
        if (cache[slug]) {
          contentEl.innerHTML = cache[slug];
          currentSlug = slug;
        }
      });
      return;
    }

    fetch(GITHUB_RAW + "/" + slug + ".md")
      .then(function (r) {
        if (!r.ok) throw new Error("Not found");
        return r.text();
      })
      .then(function (md) {
        var html = marked.parse(md);
        cache[slug] = html;
        contentEl.innerHTML = html;
        currentSlug = slug;
      })
      .catch(function () {
        contentEl.innerHTML = '<p style="color:var(--muted);">Couldn&rsquo;t load this article.</p>';
      });
  }

  function showList() {
    currentSlug = null;
    articleEl.style.display = "none";
    listEl.style.display = "";
    contentEl.innerHTML = "";
  }

  backBtn.addEventListener("click", function () {
    window.location.hash = "";
    showList();
  });

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();

/*
 *  Writing panel: loads manifest from GitHub, renders articles via marked.js.
 *  Prefetches on hover, caches responses. Instant after first load.
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
  var cache = {};       // slug → rendered HTML
  var prefetching = {};  // slug → pending fetch promise

  // Load manifest
  fetch(GITHUB_RAW + "/manifest.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      articles = data;
      renderList();
    })
    .catch(function () {
      listEl.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;">No articles yet.</p>';
    });

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

      // Click → show article
      div.addEventListener("click", function () { loadArticle(a.slug); });

      // Hover → prefetch
      div.addEventListener("mouseenter", function () { prefetch(a.slug); });
      div.addEventListener("touchstart", function () { prefetch(a.slug); }, { passive: true });

      listEl.appendChild(div);
    });
  }

  // Prefetch on hover so click feels instant
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
    if (currentSlug === slug) return;

    // Show loading state
    listEl.style.display = "none";
    articleEl.style.display = "block";
    contentEl.innerHTML = '<p style="color:var(--muted);">Loading…</p>';

    // Already cached? Instant.
    if (cache[slug]) {
      contentEl.innerHTML = cache[slug];
      currentSlug = slug;
      return;
    }

    // Already prefetching? Wait for it.
    if (prefetching[slug]) {
      prefetching[slug].then(function () {
        if (cache[slug]) {
          contentEl.innerHTML = cache[slug];
          currentSlug = slug;
        }
      });
      return;
    }

    // Cold load
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

  backBtn.addEventListener("click", function () {
    currentSlug = null;
    articleEl.style.display = "none";
    listEl.style.display = "";
    contentEl.innerHTML = "";
  });

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();

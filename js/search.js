/**
 * Search — Client-side full-text search for Hexo
 * Generates a JSON index of all posts at build time.
 */

(function () {
  'use strict';

  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  let searchIndex = [];
  let loaded = false;

  function loadSearchIndex() {
    if (loaded) return Promise.resolve(searchIndex);
    return fetch('/search.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Search index not found');
        return res.json();
      })
      .then(function (data) {
        searchIndex = data;
        loaded = true;
        return searchIndex;
      })
      .catch(function () {
        searchIndex = [];
        loaded = true;
        return [];
      });
  }

  function highlightText(text, query) {
    if (!query || !text) return text;
    var escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var regex = new RegExp('(' + escaped + ')', 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  function renderResults(results, query) {
    if (!searchResults) return;

    if (results.length === 0) {
      searchResults.innerHTML =
        '<div class="search__hint">没有找到匹配的文章。</div>';
      return;
    }

    var html = '<div class="search__results-list">';
    results.forEach(function (post) {
      var title = highlightText(post.title, query);
      var excerpt = '';

      if (post.content) {
        var idx = post.content.toLowerCase().indexOf(query.toLowerCase());
        if (idx > -1) {
          var start = Math.max(0, idx - 50);
          var end = Math.min(post.content.length, idx + query.length + 80);
          excerpt =
            (start > 0 ? '...' : '') +
            highlightText(post.content.slice(start, end), query) +
            (end < post.content.length ? '...' : '');
        }
      }

      html +=
        '<div class="search__result-item">' +
        '<a href="' +
        post.url +
        '">' +
        '<div class="search__result-title">' +
        title +
        '</div>' +
        (excerpt
          ? '<div class="search__result-excerpt">' + excerpt + '</div>'
          : '') +
        '<div class="search__result-meta">' +
        (post.date || '') +
        ' · ' +
        (post.categories && post.categories.length
          ? post.categories.join(', ')
          : '未分类') +
        '</div>' +
        '</a>' +
        '</div>';
    });
    html += '</div>';
    searchResults.innerHTML = html;
  }

  function performSearch(query) {
    query = query.trim().toLowerCase();
    if (!query) {
      searchResults.innerHTML =
        '<div class="search__hint">输入关键词开始搜索...</div>';
      return;
    }

    loadSearchIndex().then(function (index) {
      var results = index.filter(function (post) {
        var searchable =
          (post.title || '') +
          ' ' +
          (post.content || '') +
          ' ' +
          (post.tags || []).join(' ') +
          ' ' +
          (post.categories || []).join(' ');
        return searchable.toLowerCase().indexOf(query) > -1;
      });

      if (results.length > 0) {
        // Sort by relevance: title match > recent date
        results.sort(function (a, b) {
          var aTitle = (a.title || '').toLowerCase().indexOf(query) > -1 ? 1 : 0;
          var bTitle = (b.title || '').toLowerCase().indexOf(query) > -1 ? 1 : 0;
          if (aTitle !== bTitle) return bTitle - aTitle;
          return new Date(b.date) - new Date(a.date);
        });
      }

      renderResults(results, query);
    });
  }

  // Init
  if (searchInput && searchResults) {
    // Preload index in background
    loadSearchIndex();

    var debounceTimer;
    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        performSearch(searchInput.value);
      }, 200);
    });
  }
})();

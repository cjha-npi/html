// head_script.js
; (function () {
  'use strict';

  // —————————————————————————————————————————————
  // NAV TREE TWEAKS: ARROWS + PRUNE
  // —————————————————————————————————————————————

  let pruned = false;

  // 1) Swap ►/▼ for ●/○ everywhere
  function replaceArrows() {
    document.querySelectorAll('#side-nav span.arrow, span.arrow').forEach(span => {
      const t = span.textContent.trim();
      if (t === '►') span.textContent = '\u25CF\uFE0F';
      else if (t === '▼') span.textContent = '\u25CB\uFE0F';
    });
  }

  // 2) Prune the root LI under whichever tree container exists
  function pruneNav() {
    const sideNav = document.getElementById('side-nav');
    if (!sideNav) return false;

    // support both Doxygen-Awesome IDs
    const tree = sideNav.querySelector('#nav-tree-contents, #nav-tree');
    if (!tree) return false;

    const ul = tree.querySelector('ul');
    if (!ul || !ul.firstElementChild) return false;

    const firstLi = ul.firstElementChild;
    const nested = firstLi.querySelector('ul');
    if (nested) {
      Array.from(nested.children).forEach(li => {
        li.style.marginLeft = '-16px';
        ul.appendChild(li);
      });
    }
    firstLi.remove();
    return true;
  }

  // 3) Wire up a MutationObserver against #side-nav
  function initNavTweaks() {
    const sideNav = document.getElementById('side-nav');
    if (!sideNav) return;

    // run immediately (in case tree is already there)
    replaceArrows();
    pruned = pruneNav();

    // then observe for any new insertions/changes
    const mo = new MutationObserver(() => {
      replaceArrows();
      if (!pruned) {
        pruned = pruneNav();
      }
    });
    mo.observe(sideNav, { childList: true, subtree: true });
  }


  // —————————————————————————————————————————————
  // SEARCH BAR TWEAK
  // —————————————————————————————————————————————

  function initSearchPlaceholder(attempt = 0) {

    // Wait for the contents to load so that search bar can be tweaked
    const field = document.getElementById('MSearchField');
    if (!field || !window.searchBox || !window.indexSectionNames || !window.indexSectionLabels) {
      if (attempt < 20) {
        return setTimeout(() => initSearchPlaceholder(attempt + 1), 50); // retry in 50 ms
      } else {
        console.warn('Giving up initSearchPlaceholder() after 20 tries');
        return;
      }
    }

    // Update the search bar by adding what is being searched to the placeholder
    function updatePlaceholder() {
      const idx = searchBox.searchIndex;
      const label = indexSectionLabels[idx] || 'All';
      const ph = `Search ${label}`;
      document.getElementById('MSearchField').setAttribute('placeholder', ph);
    }

    // run once right away to pick up whatever the default is
    updatePlaceholder();

    // patch the “you clicked an item” hook
    if (typeof searchBox.OnSelectItem === 'function') {
      const orig = searchBox.OnSelectItem;
      searchBox.OnSelectItem = function (id) {
        const ret = orig.call(this, id);
        updatePlaceholder();
        return ret;
      };
    }

    window.addEventListener('resize', updatePlaceholder);
  }

  // —————————————————————————————————————————————
  // AUTO-RELOAD
  // —————————————————————————————————————————————
  const GIT_BRANCH = 'main'; // branch on GitGub
  const POLL_INTERVAL = 5 * 60_000; // poll every 5 minutes
  const RELOAD_DELAY = 5 * 60_000; // reload 5 minutes after detect
  const SHA_STORAGE_KEY = 'autoReloadLastSha'; // localStorage key to remember last‐seen SHA

  function detectGitHubContext() {
    console.log('[AUTO-RELOAD] [Detecting GitGub Context] - Start');
    const { hostname, pathname } = window.location;
    if (!hostname.endsWith('.github.io')) {
      console.log('[AUTO-RELOAD] [Detecting GitGub Context] - Not Hosted On GitHub');
      return {};
    }
    // Remove leading/trailing slashes, split path
    const parts = pathname.replace(/^\/|\/$/g, '').split('/');
    const user = hostname.replace('.github.io', '');
    // project‐page: first segment is repo name; user‐page: repo === user
    const repo = parts[0] || user;
    console.log('[AUTO-RELOAD] [Detecting GitGub Context] - Hosted On GitHub: ', user, '[User]', repo, '[Repo]');
    return { user, repo, isPages: true };
  }

  async function fetchLatestSha(user, repo, branch) {
    console.log('[AUTO-RELOAD] [Fetch Latest SHA] - Start');
    const url = `https://api.github.com/repos/${user}/${repo}/commits/${branch}`;
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!resp.ok) {
      console.warn('[AUTO-RELOAD] [Fetch Latest SHA] - GitHub API returned HTTP ${resp.status}');
      throw new Error(`GitHub API returned HTTP ${resp.status}`);
    }
    const data = await resp.json();
    console.log('[AUTO-RELOAD] [Fetch Latest SHA] - End');
    return data.sha;
  }

  function bustCssCache() {
    console.log('[AUTO-RELOAD] [Bust CSS Cache] - Start');
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      try {
        const u = new URL(link.href);
        u.searchParams.set('_t', Date.now());
        link.href = u.toString();
      } catch (_) {
        // ignore invalid URLs
      }
    });
  }

  (async function initAutoReload() {
    const ctx = detectGitHubContext();
    if (!ctx.isPages) {
      // Not on a GitHub Pages domain → do nothing
      return;
    }
    const { user, repo } = ctx;

    // 1) Read last‐seen SHA (if any) from localStorage
    let lastSha = localStorage.getItem(SHA_STORAGE_KEY) || null;
    let currentSha;

    // 2) Fetch the GitHub Pages branch’s current SHA
    try {
      currentSha = await fetchLatestSha(user, repo, GIT_BRANCH);
    } catch (err) {
      console.warn('[AUTO-RELOAD] initial SHA fetch failed:', err);
      return;
    }

    // 3) If we had a previous SHA and it’s different, we missed an update
    if (lastSha && lastSha !== currentSha) {
      console.log('[AUTO-RELOAD] missed update detected; scheduling reload…');
      setTimeout(() => {
        bustCssCache();
        location.reload();
      }, RELOAD_DELAY);
    }

    // 4) Store the newly fetched SHA for next session
    localStorage.setItem(SHA_STORAGE_KEY, currentSha);

    // 5) Poll periodically for *future* new commits
    setInterval(async () => {
      try {
        const sha = await fetchLatestSha(user, repo, GIT_BRANCH);
        if (sha !== currentSha) {
          console.log('[AUTO-RELOAD] new deploy detected; scheduling reload…');
          setTimeout(() => {
            bustCssCache();
            location.reload();
          }, RELOAD_DELAY);
          currentSha = sha;
          localStorage.setItem(SHA_STORAGE_KEY, sha);
        }
      } catch (err) {
        console.error('[AUTO-RELOAD] polling error:', err);
      }
    }, POLL_INTERVAL);
  })();


  // —————————————————————————————————————————————
  // BOOTSTRAP WHEN DOM IS READY
  // —————————————————————————————————————————————
  function onReady() {
    initNavTweaks();
    initSearchPlaceholder();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

})();
// head_script.js
; (function () {
  'use strict';

  // —————————————————————————————————————————————
  // Debounce
  // —————————————————————————————————————————————
  /* Debouncing is a simple way to “coalesce” a rapid burst of events into a single call after things have settled down. */

  function debounce(fn, ms) {
    let t;                      // holds the pending timeout ID
    return (...args) => {      // returns a wrapped version of `fn`
      clearTimeout(t);          // cancel any previous scheduled call
      t = setTimeout(() =>      // schedule a new one
        fn(...args),            // —that actually calls `fn` with the latest args—
        ms                      // —after `ms` milliseconds have elapsed
      );
    };
  }

  // —————————————————————————————————————————————
  // NAV TREE TWEAKS: ARROWS + PRUNE
  // —————————————————————————————————————————————

  let pruned = false;

  // 1) Swap ►/▼ for ●/○ everywhere
  function replaceArrows() {
    const sideNav = document.getElementById('side-nav');
    sideNav.querySelectorAll('span.arrow').forEach(span => {
      const t = span.textContent.trim();
      if (t === '►') span.textContent = '\u25CF\uFE0F';
      else if (t === '▼') span.textContent = '\u25CB\uFE0F';
    });
  }

  // 2) Prune the root LI under whichever tree container exists
  function pruneNav() {
    const sideNav = document.getElementById('side-nav');
    if (!sideNav)
      return false;

    // support both Doxygen-Awesome IDs
    const tree = sideNav.querySelector('#nav-tree-contents, #nav-tree');
    if (!tree)
      return false;

    const ul = tree.querySelector('ul');
    if (!ul || !ul.firstElementChild)
      return false;

    const firstLi = ul.firstElementChild;
    const nested = firstLi.querySelector('ul');
    if (nested) {
      Array.from(nested.children).forEach(li => {
        //li.style.marginLeft = '-16px';
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
      if (pruned) {
        mo.disconnect();
        replaceArrows();
        mo.observe(sideNav, { childList: true, subtree: true });
      }
      else {
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

    window.addEventListener('resize', debounce(updatePlaceholder, 200));
  }

  // —————————————————————————————————————————————
  // AUTO-RELOAD
  // —————————————————————————————————————————————
  const GIT_BRANCH = 'main'; // branch on GitGub
  const POLL_INTERVAL = 2 * 60_000; // poll every 5 minutes
  const RELOAD_DELAY = 5 * 60_000; // reload 5 minutes after detect
  const SHA_STORAGE_KEY = 'AutoReload_SHAStorageKey'; // localStorage key to remember last‐seen SHA

  let lastSha = localStorage.getItem(SHA_STORAGE_KEY);

  async function fetchLatestSha(user, repo, branch) {
    const url = `https://api.github.com/repos/${user}/${repo}/commits/${branch}`;
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!resp.ok) {
      console.warn(`[AUTO-RELOAD] [Fetch Latest SHA] - GitHub API returned HTTP ${resp.status}`);
      throw new Error(`GitHub API returned HTTP ${resp.status}`);
    }
    const data = await resp.json();
    return data.sha;
  }

  function reloadAndStore(newSha) {
    console.log('[Reload] Prv:', lastSha, 'New:', newSha);
    // 1) Find every <link rel="stylesheet"> on the page
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      try {
        // 2) Parse its href into a URL object
        const u = new URL(link.href);
        // 3) Add or replace the “_t” query-parameter with the current timestamp
        u.searchParams.set('_t', Date.now());
        // 4) Write that back to the link’s href, e.g. “style.css?_t=1623456789012”
        link.href = u.toString();
      } catch (_) {
        // 5) If the href wasn’t a valid URL, just skip it
      }
    });
    location.reload();
    lastSha = newSha;
    localStorage.setItem(SHA_STORAGE_KEY, newSha);
  }


  (async function initAutoReload() {
    console.log('[Auto-Reload] ---- Init ----');

    const { hostname, pathname } = window.location;
    if (!hostname.endsWith('.github.io')){
      console.log('[Auto-Reload] Not hosted on GitHub. Returning...');
      return;
    }

    const parts = pathname.replace(/^\/|\/$/g, '').split('/');
    const user = hostname.replace('.github.io', '');
    // project‐page: first segment is repo name; user‐page: repo === user
    const repo = parts[0] || user;

    let newSha;

    // 2) Fetch the GitHub Pages branch’s current SHA
    try {
      newSha = await fetchLatestSha(user, repo, GIT_BRANCH);
    } catch (err) {
      console.warn('[AUTO-RELOAD] initial SHA fetch failed:', err);
      return;
    }

    if(lastSha && lastSha !== newSha){
      console.log('[AUTO-RELOAD] missed update detected; scheduling reload…');
      setTimeout(() => {
        reloadAndStore(newSha);
      }, RELOAD_DELAY);
    }

    setInterval(async () => {
      try {
        const newSha = await fetchLatestSha(user, repo, GIT_BRANCH);
        if (lastSha !== newSha) {
          console.log('[AUTO-RELOAD] new deploy detected; scheduling reload…');
          setTimeout(() => {
            reloadAndStore(newSha);
          }, RELOAD_DELAY);
        }
        else{
          console.log('[AUTO-RELOAD] No new deployment');
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

})();  // ← this () invokes the outer IIFE
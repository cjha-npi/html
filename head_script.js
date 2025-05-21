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
  // TEXT RESIZER: only page & code, + RESET
  // —————————————————————————————————————————————

  const DEFAULT_SCALE = 1;
  let scale = parseFloat(localStorage.getItem('doxyTextScale')) || DEFAULT_SCALE;

  function applyScale() {
    const contents = document.querySelector('.contents');
    if (!contents) return;
    contents.style.setProperty('--doxy-scale', scale);
    localStorage.setItem('doxyTextScale', scale);
  }

  function resetScale() {
    scale = DEFAULT_SCALE;
    applyScale();
  }

  function initTextResizer() {
    if (document.getElementById('text-resizer')) return;

    const c = document.createElement('div');
    c.id = 'text-resizer';
    const btnD = document.createElement('button');
    const btnR = document.createElement('button');
    const btnI = document.createElement('button');
    btnD.className = 'resize-btn dec'; btnD.textContent = '\u2796\uFE0E';
    btnR.className = 'resize-btn def'; btnR.textContent = 'Default';
    btnI.className = 'resize-btn inc'; btnI.textContent = '\u2795\uFE0E';

    btnD.setAttribute('data-tooltip', 'Decrease text size');
    btnR.setAttribute('data-tooltip', 'Default Text size');
    btnI.setAttribute('data-tooltip', 'Increase text size');

    btnD.addEventListener('click', () => { scale = Math.max(0.5, +(scale - 0.05).toFixed(2)); applyScale(); });
    btnI.addEventListener('click', () => { scale = Math.min(2, +(scale + 0.05).toFixed(2)); applyScale(); });
    btnR.addEventListener('click', resetScale);

    c.append(btnD, btnR, btnI);
    document.body.appendChild(c);
    applyScale();
  }

  // ————————————————————————————— UPDATE OFFSETS —————————————————————————————
  function updateOffsets() {
    // 1) nav-path height as before
    const nav = document.getElementById('nav-path') || document.getElementById('navpath');
    const navH = nav ? nav.getBoundingClientRect().height : 0;

    // 2) measure the vertical scrollbar width of the doc-content pane
    const dc = document.getElementById('doc-content');
    const sbW = dc ? (dc.offsetWidth - dc.clientWidth) : 0;   // total minus inner = scrollbar
    const sbH = dc ? (dc.offsetHeight - dc.clientHeight) : 0;

    document.documentElement.style.setProperty('--btn-v-offset', navH + sbH + 5 + 'px');
    document.documentElement.style.setProperty('--btn-h-offset', sbW + 5 + 'px');
  }

  function setupOffsetListeners() {
    // initial
    updateOffsets();

    // on window resize
    window.addEventListener('resize', updateOffsets);

    // **new**: watch #doc-content for size changes
    const dc = document.getElementById('doc-content');
    if (dc && window.ResizeObserver) {
      new ResizeObserver(updateOffsets).observe(dc);
    }
  }


  // —————————————————————————————————————————————
  // BOOTSTRAP WHEN DOM IS READY
  // —————————————————————————————————————————————
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initNavTweaks();
      initTextResizer();
      setupOffsetListeners();
    });
  } else {
    initNavTweaks();
    initTextResizer();
    setupOffsetListeners();
  }

})();



/*

// Replace the expand/collapse icons in navigation tree
(function () {
  // 1) Our replacement logic
  function replaceArrows() {
    document
      .querySelectorAll('#side-nav #nav-tree-contents span.arrow')
      .forEach(span => {
        const t = span.textContent.trim();
        if (t === '►') span.textContent = '\u25CF\uFE0F'; //\u2795\uFE0E for bold +; \u2B9E for modern arrow but does not work by default on Android
        else if (t === '▼') span.textContent = '\u25CB\uFE0F'; //\u2796\uFE0E for bold - \u2B9F for modern arrow but does not work by default on Android
      });
  }

  // 2) Once the DOM is ready, kick things off
  function onReady() {
    const tree = document.getElementById('nav-tree-contents');
    if (!tree) return;

    // 3) Replace any arrows already inserted
    replaceArrows();

    // 4) Observe for ANY future arrow insertions/changes
    const mo = new MutationObserver(replaceArrows);
    mo.observe(tree, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();


// custom.js
(function () {
  // your base sizes (match what Doxygen Awesome defines by default)
  const baseSizes = {
    '--page-font-size': 15.6,
    '--navigation-font-size': 14.4,
    '--toc-font-size': 13.4,
    '--code-font-size': 14.0,
    '--title-font-size': 22.0
  };

  // read or default the scale
  let scale = parseFloat(localStorage.getItem('doxyTextScale')) || 1;

  // apply all CSS vars using current scale
  function applyScale() {
    const root = document.documentElement;
    for (const [prop, base] of Object.entries(baseSizes)) {
      root.style.setProperty(prop, (base * scale).toFixed(1) + 'px');
    }
    localStorage.setItem('doxyTextScale', scale);
  }

  // build and insert controls after <body> exists
  function initTextResizer() {
    const container = document.createElement('div');
    container.id = 'text-resizer';
    const btnDec = document.createElement('button');
    const btnInc = document.createElement('button');
    btnDec.textContent = 'A –';
    btnInc.textContent = 'A +';
    [btnDec, btnInc].forEach(btn => {
      btn.style.cssText = `
        border: 1px solid #888; background: none;
        padding: 0.25rem 0.5rem; font-size: 1rem; cursor: pointer;
      `;
      btn.addEventListener('mouseenter', () => btn.style.background = 'rgba(0,0,0,0.1)');
      btn.addEventListener('mouseleave', () => btn.style.background = 'none');
    });
    container.appendChild(btnDec);
    container.appendChild(btnInc);
    document.getElementsByTagName('body')[0].appendChild(container);

    // hook up the buttons
    btnInc.addEventListener('click', () => {
      scale = Math.min(2, +(scale + 0.1).toFixed(2));
      applyScale();
    });
    btnDec.addEventListener('click', () => {
      scale = Math.max(0.5, +(scale - 0.1).toFixed(2));
      applyScale();
    });

    // initial apply
    applyScale();
  }

  // wait for body
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTextResizer);
  } else {
    initTextResizer();
  }
})();




/*

// Remove the top Item in Navigation Tree in the Sidebar
document.addEventListener("DOMContentLoaded", function () {
  let tries = 0; // to cancel after a fixed number of tries
  let interval = setInterval(function () {
    tries++;
    const sideTreeUL = document.querySelector("#side-nav #nav-tree-contents > ul");
    if (!sideTreeUL) {
      if (tries >= 10)
        clearInterval(interval);
      return;
    }

    const rootLi = sideTreeUL.querySelector("li:first-child");
    if (!rootLi) {
      clearInterval(interval);
      return;
    }

    const nested = rootLi.querySelector("ul");
    if (nested) {
      Array.from(nested.children).forEach(li => {
        sideTreeUL.appendChild(li);
        li.style.setProperty("margin-left", "-16px", "important");
      });
    }

    rootLi.remove();
    clearInterval(interval);
  }, 100);
});

*/
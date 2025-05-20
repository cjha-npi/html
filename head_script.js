


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
(function() {
  // your base sizes (match what Doxygen Awesome defines by default)
  const baseSizes = {
    '--page-font-size':       15.6,
    '--navigation-font-size': 14.4,
    '--toc-font-size':        13.4,
    '--code-font-size':       14.0,
    '--title-font-size':      22.0
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
    container.style.cssText = `
      position: fixed; bottom: 1rem; right: 1rem;
      background: rgba(255,255,255,0.8); border-radius: 4px;
      padding: 0.5rem; z-index: 1000; display: flex; gap: 0.5rem;
    `;
    const btnDec = document.createElement('button');
    const btnInc = document.createElement('button');
    btnDec.textContent = 'A –';
    btnInc.textContent = 'A +';
    [btnDec, btnInc].forEach(btn => {
      btn.style.cssText = `
        border: 1px solid #888; background: none;
        padding: 0.25rem 0.5rem; font-size: 1rem; cursor: pointer;
      `;
      btn.addEventListener('mouseenter', ()=> btn.style.background='rgba(0,0,0,0.1)');
      btn.addEventListener('mouseleave', ()=> btn.style.background='none');
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
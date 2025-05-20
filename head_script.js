// Replace the expand/collapse icons in navigation tree
(function () {
  // 1) Our replacement logic
  function replaceArrows() {
    document
      .querySelectorAll('#side-nav #nav-tree-contents span.arrow')
      .forEach(span => {
        const t = span.textContent.trim();
        if (t === '►') span.textContent = '\u2B9E'; // \u2795\uFE0E
        else if (t === '▼') span.textContent = '\u2B9F'; // \u2796\uFE0E
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
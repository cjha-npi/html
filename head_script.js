(function() {
  // 1) Our replacement logic
  function replaceArrows() {
    document
      .querySelectorAll('#side-nav #nav-tree-contents span.arrow')
      .forEach(span => {
        const t = span.textContent.trim();
        if (t === '►') span.textContent = '\u2795\uFE0E'; //\u2B9E
        else if (t === '▼') span.textContent = '\u2796\uFE0E'; //\u2B9F
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

// hide-nav.js
document.addEventListener("DOMContentLoaded", function() {
  console.log("[hide-nav] DOM fully loaded");

  // 1) Remove top tabs & breadcrumb
  var tabs = document.querySelector(".nav-page-tabs");
  if (tabs) {
    console.log("[hide-nav] Removing .nav-page-tabs");
    tabs.remove();
  } else {
    console.log("[hide-nav] .nav-page-tabs not found");
  }
  var bc = document.getElementById("navpath");
  if (bc) {
    console.log("[hide-nav] Removing #navpath");
    bc.remove();
  } else {
    console.log("[hide-nav] #navpath not found");
  }

  // 2) Try pruning the tree (in case it’s built async)
  let tries = 0;
  let interval = setInterval(function() {
    tries++;
    console.log(`[hide-nav] Prune attempt ${tries}`);

    var sideTreeUL = document.querySelector("#side-nav #nav-tree-contents > ul");
    if (!sideTreeUL) {
      console.log("[hide-nav] Sidebar <ul> not yet present");
      if (tries >= 10) {
        console.log("[hide-nav] Giving up after 10 tries");
        clearInterval(interval);
      }
      return;
    }
    console.log("[hide-nav] Found sidebar <ul>");

    // 3) Find & remove the root <li>
    var rootLi = sideTreeUL.querySelector("li:first-child");
    if (!rootLi) {
      console.log("[hide-nav] No <li> inside sidebar <ul>");
      clearInterval(interval);
      return;
    }
    console.log("[hide-nav] Found root <li>");

    // 4) If it has nested children, lift them out
    var nested = rootLi.querySelector("ul");
    if (nested) {
      console.log(`[hide-nav] Lifting up ${nested.children.length} items`);
      Array.from(nested.children).forEach(function(li) {
        // move it up
        sideTreeUL.appendChild(li);
        console.log("[hide-nav]  moved:", li);

        // 5) shift it left 16px
        li.style.setProperty("margin-left", "-16px", "important");
        console.log("[hide-nav]  shifted left 16px:", li);
      });
    } else {
      console.log("[hide-nav] No nested <ul> under root <li>");
    }

    // 6) Remove the now-empty root container
    console.log("[hide-nav] Removing root <li>");
    rootLi.remove();
    console.log("[hide-nav] Sidebar root removed");

    clearInterval(interval);
  }, 100);
});

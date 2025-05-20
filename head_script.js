; (function ($) {
  'use strict';

  // ─── Constants ───────────────────────────────────
  const MIN_W = 25;
  const GUTTER_W = 100;

  // ─── 1) Compute your doc-root (where index.html lives) ─────────────
  // Doxygen always emits a “Main Page” link in #nav-path pointing at index.html
  const DOC_ROOT = (() => {
    const mainLink = document.querySelector('#nav-path a[href$="index.html"]');
    if (mainLink && mainLink.href) {
      // mainLink.href is already absolute; strip off “index.html”
      return mainLink.href.replace(/index\.html$/, '');
    }
    // fallback: if that fails, base it on wherever this script lives
    const me = document.currentScript ||
               Array.from(document.getElementsByTagName('script'))
                    .find(s => s.src && s.src.match(/head_script\.js$/));
    if (me && me.src) {
      return me.src.slice(0, me.src.lastIndexOf('/') + 1);
    }
    // ultimate fallback: root of current origin
    return window.location.origin + '/';
  })();

  // ─── Storage‐key constants ───────────────────────────────────
  const STORAGE_KEYS = {
    primaryWidth: 'wPrimary',
    membersWidth: 'wMembers'
  };

  // ─── Helpers ────────────────────────────────────────────────
  function loadNumber(key, fallback) {
    const v = sessionStorage.getItem(key);
    return v !== null ? parseInt(v, 10) : fallback;
  }

  function save(key, value) {
    sessionStorage.setItem(key, String(value));
  }

  function setPrimaryWidth(w) {
    if (w !== wPrimary) {
      wPrimary = w;
      save(STORAGE_KEYS.primaryWidth, w);
    }
  }
  function setMembersWidth(w) {
    if (w !== wMembers) {
      wMembers = w;
      save(STORAGE_KEYS.membersWidth, w);
    }
  }

  // ─── 2. State with defaults ───────────────────────
  let wPrimary = loadNumber(STORAGE_KEYS.primaryWidth, 250);
  let wMembers = loadNumber(STORAGE_KEYS.membersWidth, 250);
  let vMembers = true; // visibility of members sidebar

  function applyLayout() {

    console.log('--Apply Layout --');

    const $top = $('#top');
    const $btm = $('#nav-path');
    const $doc = $('#doc-content');
    const $pri = $('#nav-primary');
    const $priRes = $('#nav-primary-resizer');
    const $mem = $('#nav-members');
    const $memRes = $('#nav-members-resizer');
    if (!$top.length || !$btm.length || !$doc.length || !$pri.length || !$priRes.length || !$mem.length || !$memRes.length) return;

    const wWin = window.innerWidth;
    if (wWin < 768) {
      $pri.hide();
      $priRes.hide();
      $mem.hide();
      $memRes.hide();
      $doc.css({ 'margin-left': 0 + 'px' });
    }
    else {

      const maxTotal = wWin - GUTTER_W;
      if (vMembers) {
        const total = wPrimary + wMembers;
        if (total > maxTotal) {
          // 1) compute proportional sizes
          const ratio = wPrimary / total;
          let newPri = Math.floor(maxTotal * ratio);
          let newMem = maxTotal - newPri;

          // 2) enforce a 25px minimum on either one
          if (newPri < MIN_W) {
            newPri = MIN_W;
            newMem = maxTotal - newPri;
          }
          if (newMem < MIN_W) {
            newMem = MIN_W;
            newPri = maxTotal - newMem;
          }

          setPrimaryWidth(newPri);
          setMembersWidth(newMem);
        }
      } else {
        if (wPrimary > maxTotal) {
          setPrimaryWidth(maxTotal);
        }
      }

      const pxTop = $top.outerHeight();
      const pxBtm = window.innerHeight - $btm.offset().top;

      $pri.css({ top: pxTop + 'px', bottom: pxBtm + 'px', width: wPrimary + 'px' }).show();
      $priRes.css({ top: pxTop + 'px', bottom: pxBtm + 'px', left: (wPrimary - 2) + 'px' }).show();

      if (vMembers) {
        $mem.css({ top: pxTop + 'px', bottom: pxBtm + 'px', left: wPrimary + 'px', width: wMembers + 'px' }).show();
        $memRes.css({ top: pxTop + 'px', bottom: pxBtm + 'px', left: (wPrimary + wMembers - 2) + 'px' }).show();
        $doc.css({ 'margin-left': (wPrimary + wMembers) + 'px' });
      }
      else {
        $mem.hide();
        $memRes.hide();
        $doc.css({ 'margin-left': wPrimary + 'px' });
      }
    }
  }

  // Single-resizer factory; can be called with no args to wire both
  function makeResizer(resizerId, getW) {

    // no args? wire both and return
    if (!resizerId) {
      makeResizer('nav-primary-resizer', () => wPrimary);
      makeResizer('nav-members-resizer', () => wMembers);
      return;
    }

    const maxTotal = () => window.innerWidth - GUTTER_W;
    const resizer = document.getElementById(resizerId);
    let startX = 0, startW = 0, raf = null;

    resizer.addEventListener('pointerdown', e => {
      e.preventDefault();
      resizer.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startW = getW();
      document.body.style.cursor = 'ew-resize';

      function onMove(ev) {
        ev.preventDefault();
        if (raf) return;
        raf = requestAnimationFrame(() => {
          let newW = startW + (ev.clientX - startX);
          if (resizerId === 'nav-members-resizer') {
            if (newW < MIN_W) {
              const over = MIN_W - newW;
              const mem = MIN_W;
              const priNew = Math.max(MIN_W, wPrimary - over);
              if (mem != wMembers || priNew != wPrimary) {
                setPrimaryWidth(priNew);
                setMembersWidth(mem);
                applyLayout();
                startX = ev.clientX;
                startW = mem;
              }
            }
            else {
              if (newW > (maxTotal() - wPrimary))
                newW = maxTotal() - wPrimary;
              if (newW != wMembers) {
                setMembersWidth(newW);
                applyLayout();
              }
            }
          }
          else {
            if (vMembers) {
              newW = Math.max(MIN_W, Math.min(maxTotal() - MIN_W, newW));
              if (newW != wPrimary) {
                if (newW < wPrimary)
                  setMembersWidth(wMembers + (wPrimary - newW));
                else {
                  if (newW + wMembers > maxTotal()) {
                    setMembersWidth(maxTotal() - newW);
                  }
                  else if (wMembers > MIN_W) {
                    const mem = Math.max(MIN_W, wMembers - (newW - wPrimary));
                    if (mem != wMembers)
                      setMembersWidth(mem);
                  }
                }
                setPrimaryWidth(newW);
                applyLayout();
              }
            }
            else {
              newW = Math.max(MIN_W, Math.min(maxTotal(), newW));
              if (newW != wPrimary) {
                setPrimaryWidth(newW);
                applyLayout();
              }
            }
          }
          raf = null;
        });
      }

      function onUp(ev) {
        ev.preventDefault();
        document.body.style.cursor = '';
        resizer.releasePointerCapture(e.pointerId);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      }

      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp, { passive: false });
    }, { passive: false });
  }


  // ─── Nav-tree loader ──────────────────────────────────────────
  function loadScript(relUrl) {
    const fullUrl = new URL(relUrl, DOC_ROOT).href;
    console.log('[nav-loader] injecting script:', fullUrl);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src   = fullUrl;
      s.async = true;
      s.onload  = () => { console.log('[nav-loader] loaded script:', fullUrl); resolve(); };
      s.onerror = err => { console.error('[nav-loader] failed to load script:', fullUrl, err); reject(err); };
      document.head.appendChild(s);
    });
  }

  function loadChildren(tree) {
    const promises = [];
    tree.forEach(node => {
      const childData = node[2];
      if (typeof childData === 'string') {
        const chunkName = childData;
        const url       = chunkName + '.js';
        console.log('[nav-loader] scheduling load of chunk:', url);

        const p = loadScript(url)
          .then(() => {
            let arr = window[chunkName];
            if (!Array.isArray(arr)) {
              const base = chunkName.slice(chunkName.lastIndexOf('/') + 1);
              arr = window[base];
            }
            if (!Array.isArray(arr)) {
              console.warn(`[nav-loader] missing children for ${chunkName}`, arr);
              arr = [];
            }
            node[2] = arr;
            return loadChildren(arr);
          })
          .catch(() => {
            node[2] = [];
          });

        promises.push(p);
      }
      else if (Array.isArray(childData)) {
        promises.push(loadChildren(childData));
      }
    });
    return Promise.all(promises);
  }

  function buildTree(tree, $ul) {
    tree.forEach(node => {
      const title = node[0],
            href  = node[1],
            kids  = node[2];

      const $li = $('<li>');
      const abs = new URL(href, DOC_ROOT).href;
      const $link = $('<a>').attr('href', abs).text(title);

      if (Array.isArray(kids) && kids.length) {
        // mark that this <li> has children, start collapsed
        $li.addClass('has-children collapsed');

        // create the little toggle icon
        const $toggle = $('<span class="toggle"></span>')
          .on('click', e => {
            e.preventDefault();
            e.stopPropagation();
            $li
              .toggleClass('expanded collapsed');
          });

        // assemble: [toggle] [link] [sub-list]
        $li.append($toggle).append($link);

        const $sub = $('<ul>');
        buildTree(kids, $sub);
        $li.append($sub);
      }
      else {
        // leaf node—just the link
        $li.append($link);
      }

      $ul.append($li);
    });
  }

  // ─── Load or cache nav-tree on window.load ──────────────────────
  $(window).on('load', function () {
    setTimeout(applyLayout, 50);
    // clear cache on hard reload
    const navEntries = performance.getEntriesByType('navigation');
    const navType = navEntries[0] && navEntries[0].type;
    if (navType === 'reload') {
      sessionStorage.removeItem('myNavTreeHTML');
      console.log('[nav-loader] cleared nav-tree cache due to hard reload');
    }

    const container = $('#nav-primary');
    const cached = sessionStorage.getItem('myNavTreeHTML');
    if (cached) {
      container.empty().append(cached);
      console.log('[nav-loader] nav-tree injected from cache');
      return;
    }

    console.log('[nav-loader] no cache, loading NAVTREE');
    const raw = Array.isArray(window.NAVTREE) && window.NAVTREE[0] && window.NAVTREE[0][2]
              ? window.NAVTREE[0][2]
              : window.NAVTREE;
    if (!Array.isArray(raw)) {
      console.error('[nav-loader] NAVTREE not found');
      return;
    }
    loadChildren(raw).then(() => {
      const $my = $('<ul id="my-nav-tree">');
      buildTree(raw, $my);
      $('#nav-primary').empty().append($my);
      console.log('[nav-loader] nav-tree injected from root:', DOC_ROOT);
    });
  });

  // ─── Initialize layout/resizers and toggle on document ready ─────
  $(function () { applyLayout(); makeResizer(); });
  $(window).on('resize', () => setTimeout(applyLayout, 50));
  $(document).on('contextmenu', '#nav-primary', function (e) { e.preventDefault(); vMembers = !vMembers; applyLayout(); });

})(jQuery);
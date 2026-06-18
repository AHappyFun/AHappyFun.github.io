/**
 * Magazine Theme — Main JS
 */

(function () {
  'use strict';

  /* --- Dark Mode Toggle --- */
  const themeToggle = document.getElementById('themeToggle');
  const storedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme');
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  // Init theme
  if (storedTheme) {
    setTheme(storedTheme);
  } else if (prefersDark) {
    setTheme('dark');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const current = getCurrentTheme();
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  /* --- Mobile Menu Toggle --- */
  const menuToggle = document.getElementById('menuToggle');
  const headerNav = document.getElementById('headerNav');

  if (menuToggle && headerNav) {
    menuToggle.addEventListener('click', function () {
      headerNav.classList.toggle('is-open');
    });

    headerNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        headerNav.classList.remove('is-open');
      });
    });
  }

  /* --- Smooth scroll for anchor links --- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* --- Image lazy loading --- */
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('article img:not([loading])').forEach(function (img) {
      img.setAttribute('loading', 'lazy');
    });
  }

  /* --- Copy code button --- */
  function addCopyBtn(container, getCode) {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = '复制';
    copyBtn.setAttribute('aria-label', '复制代码');
    container.style.position = 'relative';
    container.appendChild(copyBtn);

    copyBtn.addEventListener('click', function () {
      const text = getCode();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          copyBtn.textContent = '已复制!';
          setTimeout(function () { copyBtn.textContent = '复制'; }, 2000);
        });
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        copyBtn.textContent = '已复制!';
        setTimeout(function () { copyBtn.textContent = '复制'; }, 2000);
      }
    });
  }

  document.querySelectorAll('.post__content pre').forEach(function (pre) {
    if (pre.closest('.code')) return; // already inside figure.highlight
    addCopyBtn(pre, function () { return pre.textContent || ''; });
  });

  document.querySelectorAll('.post__content figure.highlight').forEach(function (fig) {
    addCopyBtn(fig, function () {
      var codePre = fig.querySelector('.code pre');
      return codePre ? codePre.textContent || '' : '';
    });
  });

  /* --- Post table of contents --- */
  (function initPostToc() {
    var toc = document.getElementById('postToc');
    var tocNav = document.getElementById('postTocNav');
    var tocToggle = document.getElementById('postTocToggle');
    var headings = Array.prototype.slice.call(
      document.querySelectorAll('.post__content h2, .post__content h3')
    );

    // Very short posts do not need a table of contents.
    if (!toc || !tocNav || !tocToggle || headings.length < 2) return;

    var usedIds = Object.create(null);
    var links = [];

    headings.forEach(function (heading, index) {
      var baseId = heading.id || heading.textContent.trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u3400-\u9fff-]/g, '') || 'section-' + (index + 1);
      var id = baseId;
      var suffix = 2;

      while (usedIds[id] || (document.getElementById(id) && document.getElementById(id) !== heading)) {
        id = baseId + '-' + suffix;
        suffix += 1;
      }

      usedIds[id] = true;
      heading.id = id;

      var link = document.createElement('a');
      link.className = 'post-toc__link post-toc__link--' + heading.tagName.toLowerCase();
      link.href = '#' + encodeURIComponent(id);
      link.textContent = heading.textContent.trim();
      link.addEventListener('click', function (event) {
        event.preventDefault();
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + encodeURIComponent(id));
      });

      tocNav.appendChild(link);
      links.push(link);
    });

    toc.hidden = false;

    if (window.matchMedia('(max-width: 768px)').matches) {
      tocToggle.setAttribute('aria-expanded', 'false');
      toc.classList.add('is-collapsed');
    }

    tocToggle.addEventListener('click', function () {
      var expanded = tocToggle.getAttribute('aria-expanded') === 'true';
      tocToggle.setAttribute('aria-expanded', String(!expanded));
      toc.classList.toggle('is-collapsed', expanded);
    });

    var ticking = false;
    function updateActiveHeading() {
      var activeIndex = 0;
      headings.forEach(function (heading, index) {
        if (heading.getBoundingClientRect().top <= 120) activeIndex = index;
      });

      links.forEach(function (link, index) {
        var isActive = index === activeIndex;
        link.classList.toggle('is-active', isActive);
        if (isActive) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateActiveHeading);
        ticking = true;
      }
    }, { passive: true });

    updateActiveHeading();
  })();

  /* --- 🐱 Cat vs Mouse --- */
  (function initGame() {
    var container = document.createElement('div');
    container.className = 'cat-container';
    container.innerHTML = [
      // Tunnel
      '<div class="tunnel" id="tunnelEl">',
      '<svg viewBox="0 0 80 50" fill="none" class="tunnel-svg">',
      '<rect x="0" y="12" width="80" height="38" rx="4" fill="var(--tunnel-body)" stroke="var(--tunnel-border)" stroke-width="2"/>',
      '<path d="M6 12 Q40 -4 74 12" stroke="var(--tunnel-border)" stroke-width="3" fill="var(--tunnel-arch)"/>',
      '<rect x="6" y="12" width="68" height="34" rx="2" fill="var(--tunnel-inside)"/>',
      '<line x1="18" y1="12" x2="18" y2="46" stroke="var(--tunnel-body)" stroke-width="1.5" opacity="0.5"/>',
      '<line x1="34" y1="12" x2="34" y2="46" stroke="var(--tunnel-body)" stroke-width="1.5" opacity="0.5"/>',
      '<line x1="50" y1="12" x2="50" y2="46" stroke="var(--tunnel-body)" stroke-width="1.5" opacity="0.5"/>',
      '<line x1="66" y1="12" x2="66" y2="46" stroke="var(--tunnel-body)" stroke-width="1.5" opacity="0.5"/>',
      '</svg></div>',
      // Mouse
      '<div class="mouse-body" id="mouseBody">',
      '<svg viewBox="0 0 40 32" fill="none" class="mouse-svg">',
      '<ellipse cx="20" cy="24" rx="12" ry="8" fill="var(--mouse-body)"/>',
      '<circle cx="14" cy="12" r="8" fill="var(--mouse-body)"/>',
      '<circle cx="26" cy="12" r="8" fill="var(--mouse-body)"/>',
      '<circle cx="14" cy="10" r="6" fill="var(--mouse-ear)"/>',
      '<circle cx="26" cy="10" r="6" fill="var(--mouse-ear)"/>',
      '<circle cx="18" cy="22" r="2.5" fill="var(--mouse-eye)"/>',
      '<circle cx="26" cy="22" r="2.5" fill="var(--mouse-eye)"/>',
      '<circle cx="18.5" cy="21" r="0.8" fill="var(--mouse-shine)"/>',
      '<circle cx="26.5" cy="21" r="0.8" fill="var(--mouse-shine)"/>',
      '<circle cx="22" cy="25" r="1.5" fill="var(--mouse-nose)"/>',
      '<path d="M4 28 Q-6 34 -2 22" stroke="var(--mouse-tail)" stroke-width="2" fill="none" stroke-linecap="round"/>',
      '</svg></div>',
      // Cat
      '<div class="cat-body" id="catBody">',
      '<svg viewBox="0 0 80 70" fill="none" class="cat-svg">',
      '<path d="M18 42 Q0 38 4 22" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" fill="none"/>',
      '<ellipse cx="42" cy="44" rx="18" ry="16" fill="currentColor"/>',
      '<rect x="28" y="54" width="8" height="8" rx="3" fill="currentColor" opacity="0.85"/>',
      '<rect x="48" y="54" width="8" height="8" rx="3" fill="currentColor"/>',
      '<ellipse cx="32" cy="62" rx="5" ry="3" fill="currentColor" opacity="0.7"/>',
      '<ellipse cx="52" cy="62" rx="5" ry="3" fill="currentColor" opacity="0.7"/>',
      '<circle cx="54" cy="24" r="15" fill="currentColor"/>',
      '<polygon points="44,14 38,0 50,8" fill="currentColor"/>',
      '<polygon points="64,14 70,0 58,8" fill="currentColor"/>',
      '<polygon points="45,13 40,3 49,9" fill="var(--cat-ear)"/>',
      '<polygon points="63,13 68,3 59,9" fill="var(--cat-ear)"/>',
      '<ellipse cx="48" cy="23" rx="3" ry="3.5" fill="var(--cat-eye)"/>',
      '<ellipse cx="60" cy="23" rx="3" ry="3.5" fill="var(--cat-eye)"/>',
      '<circle cx="49.5" cy="21.5" r="1.2" fill="var(--cat-shine)"/>',
      '<circle cx="61.5" cy="21.5" r="1.2" fill="var(--cat-shine)"/>',
      '<ellipse cx="54" cy="29" rx="2.2" ry="1.5" fill="var(--cat-nose)"/>',
      '<path d="M51.5 30.5 Q54 33.5 56.5 30.5" stroke="var(--cat-mouth)" stroke-width="1.2" fill="none" stroke-linecap="round"/>',
      '<line x1="32" y1="25" x2="43" y2="28" stroke="var(--cat-whisker)" stroke-width="0.8" stroke-linecap="round"/>',
      '<line x1="31" y1="30" x2="43" y2="29" stroke="var(--cat-whisker)" stroke-width="0.8" stroke-linecap="round"/>',
      '<line x1="76" y1="25" x2="65" y2="28" stroke="var(--cat-whisker)" stroke-width="0.8" stroke-linecap="round"/>',
      '<line x1="77" y1="30" x2="65" y2="29" stroke="var(--cat-whisker)" stroke-width="0.8" stroke-linecap="round"/>',
      '</svg></div>'
    ].join('');
    document.body.appendChild(container);

    // Win label above cat
    var winLabel = document.createElement('div');
    winLabel.className = 'cat-win-label';
    winLabel.textContent = 'Win! 🎉';
    document.body.appendChild(winLabel);

    var catEl = container.querySelector('.cat-body');
    var mouseEl = container.querySelector('.mouse-body');
    var tunnelEl = container.querySelector('.tunnel');
    var W, H;
    // Cat state
    var cx, cy, cvx, cvy;
    // Mouse state
    var mx, my, mvx, mvy;
    var gravity = 0.3;
    var bounce = 0.5;
    var airFriction = 0.993;  // air drag to prevent speed buildup
    var catSize = 42;
    var mouseSize = 22;
    var catFacing = 1;

    // Round cooldown: prevents velocity carry-over between rounds
    var roundCooldown = 0;

    // Tunnel position (bottom center, static)
    var tunnelW = 100;
    var tunnelH = 28;
    var tunnelX, tunnelY;
    var mouseHidden = false;
    var hideTimer = 0;
    var won = false;
    var running = true;

    function dist(ax, ay, bx, by) {
      var dx = ax - bx, dy = ay - by;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function resetPositions() {
      W = window.innerWidth;
      H = window.innerHeight;
      tunnelX = (W - tunnelW) / 2 + 10;
      tunnelY = H - tunnelH - 4;
      tunnelEl.style.left = (tunnelX - 10) + 'px';
      tunnelEl.style.top = tunnelY + 'px';

      // Cat on the right side, not too far
      cx = W * 0.55 + Math.random() * W * 0.12;
      cy = H * 0.08;
      cvx = -(1 + Math.random() * 2); // bias left toward mouse
      cvy = -(1 + Math.random() * 1);

      // Mouse on the ground, center-left, close to cat
      mx = W * 0.35 + Math.random() * W * 0.12;
      my = H - mouseSize;
      mvx = (Math.random() - 0.5) * 1.5;
      mvy = 0;
      mouseHidden = false;
      hideTimer = 0;
      won = false;
      roundCooldown = 30; // pause chase forces for ~30 frames after reset
      winLabel.classList.remove('show');
    }

    function setColors() {
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      catEl.style.setProperty('color', dark ? '#fb923c' : '#f97316');
      catEl.style.setProperty('--cat-ear', dark ? '#fdba74' : '#fed7aa');
      catEl.style.setProperty('--cat-eye', dark ? '#fff' : '#1c1917');
      catEl.style.setProperty('--cat-shine', '#fff');
      catEl.style.setProperty('--cat-nose', dark ? '#fca5a5' : '#f43f5e');
      catEl.style.setProperty('--cat-mouth', dark ? '#fca5a5' : '#be123c');
      catEl.style.setProperty('--cat-whisker', dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)');
      mouseEl.style.setProperty('--mouse-body', dark ? '#9ca3af' : '#6b7280');
      mouseEl.style.setProperty('--mouse-ear', dark ? '#d1d5db' : '#e5e7eb');
      mouseEl.style.setProperty('--mouse-eye', '#1c1917');
      mouseEl.style.setProperty('--mouse-shine', '#fff');
      mouseEl.style.setProperty('--mouse-nose', '#f472b6');
      mouseEl.style.setProperty('--mouse-tail', dark ? '#9ca3af' : '#6b7280');
      tunnelEl.style.setProperty('--tunnel-body', dark ? '#334155' : '#e2e8f0');
      tunnelEl.style.setProperty('--tunnel-border', dark ? '#475569' : '#cbd5e1');
      tunnelEl.style.setProperty('--tunnel-arch', dark ? '#475569' : '#cbd5e1');
      tunnelEl.style.setProperty('--tunnel-inside', dark ? '#1e293b' : '#f1f5f9');
    }

    resetPositions();
    setColors();
    if (themeToggle) themeToggle.addEventListener('click', setColors);

    function showWin() {
      won = true;
      winLabel.classList.add('show');
      // Position above cat
      winLabel.style.left = (cx - 10) + 'px';
      winLabel.style.top = (cy - 22) + 'px';
      setTimeout(function () {
        winLabel.classList.remove('show');
        resetPositions();
      }, 1200);
    }

    function inTunnel(px, py) {
      return px > tunnelX - 5 && px < tunnelX + tunnelW + 5 &&
             py > tunnelY - 5 && py < tunnelY + tunnelH + 5;
    }

    function animateGame() {
      if (!running) return;

      // Decrement cooldown each frame
      if (roundCooldown > 0) roundCooldown--;

      var d = dist(cx, cy, mx, my);

      // --- Cat physics (slower, persistent) ---
      var chaseStr = 0.008;
      if (roundCooldown === 0 && d > 20 && !won && !mouseHidden) {
        if (mx > cx + 3) cvx += chaseStr;
        else if (mx < cx - 3) cvx -= chaseStr;
      }

      cvy += gravity;
      cvx *= airFriction;
      cvx = Math.min(Math.max(cvx, -6), 6);
      cx += cvx;
      cy += cvy;

      // Cat floor - frequent short hops, not big leaps
      if (cy >= H - catSize) {
        cy = H - catSize;
        cvy = -cvy * 0.45;
        cvx *= 0.95;
        if (!mouseHidden && d < 400 && (Math.abs(cvx) < 0.8 || Math.random() < 0.01)) {
          var dir = mx > cx ? 1 : -1;
          cvx += dir * (0.3 + Math.random() * 0.4);
          cvy = -(3 + Math.random() * 1.5);
        }
      }
      if (cy < 0) { cy = 0; cvy = 0; }
      if (cx > W - catSize) { cx = W - catSize; cvx = -Math.abs(cvx) * 0.3; }
      if (cx < 0) { cx = 0; cvx = Math.abs(cvx) * 0.3; }

      // --- Mouse AI (fast, agile, avoids walls) ---
      if (!mouseHidden) {
        var distToLeftW = mx;
        var distToRightW = W - mouseSize - mx;

        // Flee from cat - stronger when cat is close
        if (roundCooldown === 0 && d < 350) {
          var fleeStr = 1.0 / (d / 60 + 0.3);
          if (mx < cx) mvx -= fleeStr;
          else mvx += fleeStr;
        }

        // Wall avoidance - don't get cornered!
        var wallBias = 0;
        if (distToLeftW < 60) wallBias = (60 - distToLeftW) / 60 * 2.5;
        if (distToRightW < 60) wallBias = -(60 - distToRightW) / 60 * 2.5;
        mvx += wallBias;

        // Wander noise
        mvx += (Math.random() - 0.5) * 0.15;

        // Mouse is fast!
        mvx *= 0.91;
        mvx = Math.min(Math.max(mvx, -7), 7);

        mvy += gravity;
        mx += mvx;
        my += mvy;

        // Mouse floor - quick, bouncy
        if (my >= H - mouseSize) {
          my = H - mouseSize;
          mvy = -mvy * 0.25;
          mvx *= 0.94;
          // Agile jumps when cat is near
          if (d < 130 && Math.random() < 0.04) {
            mvy = -(5 + Math.random() * 4);
            var dir = mx > cx ? 1 : -1;
            mvx += dir * 3;
          }
          // Random tiny hops even when safe
          if (d > 200 && Math.random() < 0.005) {
            mvy = -(2 + Math.random() * 2);
          }
        }
        // Mouse walls - quick reverse to avoid corner trap!
        var wallReact = 15;
        if (mx < wallReact) { mx = wallReact; mvx = Math.abs(mvx) * 0.8 + 2; }
        if (mx > W - mouseSize - wallReact) { mx = W - mouseSize - wallReact; mvx = -Math.abs(mvx) * 0.8 - 2; }

        // Tunnel entry
        if (inTunnel(mx, my)) {
          mouseHidden = true;
          hideTimer = 100;
          mouseEl.style.opacity = '0.3';
        }
      } else {
        // Hidden in tunnel
        hideTimer--;
        if (hideTimer <= 0) {
          mouseHidden = false;
          mouseEl.style.opacity = '1';
          var side = Math.random() > 0.5 ? 1 : -1;
          mx = tunnelX + tunnelW / 2 + side * 50;
          my = H - mouseSize - 20;
          mvx = side * 3;
          mvy = -3;
        }
      }

      // --- Catch check ---
      if (!won && !mouseHidden && d < 18) {
        showWin();
      }

      // --- Render ---
      if (Math.abs(cvx) > 0.2) catFacing = cvx > 0 ? 1 : -1;
      catEl.style.transform = 'scaleX(' + catFacing + ') rotate(' + Math.min(Math.max(cvy * 1.2, -15), 15) + 'deg)';
      catEl.style.left = cx + 'px';
      catEl.style.top = cy + 'px';

      if (!mouseHidden) {
        var mfacing = Math.abs(mvx) > 0.1 ? (mvx > 0 ? 1 : -1) : (mx < cx ? -1 : 1);
        mouseEl.style.transform = 'scaleX(' + mfacing + ')';
        mouseEl.style.left = mx + 'px';
        mouseEl.style.top = my + 'px';
      }

      requestAnimationFrame(animateGame);
    }

    setTimeout(function () { animateGame(); }, 800);

    window.addEventListener('resize', function () {
      W = window.innerWidth;
      H = window.innerHeight;
      tunnelX = (W - tunnelW) / 2 + 10;
      tunnelY = H - tunnelH - 4;
      tunnelEl.style.left = (tunnelX - 10) + 'px';
      tunnelEl.style.top = tunnelY + 'px';
      cx = Math.min(cx, W - catSize);
      cy = Math.min(cy, H - catSize);
      mx = Math.min(mx, W - mouseSize);
      my = Math.min(my, H - mouseSize);
    });

    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) animateGame();
    });
  })();

})();

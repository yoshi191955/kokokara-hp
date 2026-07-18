/* 学生団体ココカラ 公式サイト v3 ─ 共通スクリプト */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- ヘッダー: スクロールで背景 ---- */
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- フルスクリーンメニュー ---- */
  var menuBtn = document.querySelector(".menu-btn");
  var overlay = document.getElementById("menu");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (menuBtn) menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (menuBtn && overlay) {
    menuBtn.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("menu-open"));
    });
    overlay.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ---- リビール演出 ---- */
  var targets = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add("in"); });
  }

  /* ---- 現在の年 ---- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  /* ---- モーダル（活動内容の詳細ポップアップ） ---- */
  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal(m) {
    m.classList.remove("open");
    if (!document.querySelector(".modal.open")) document.body.style.overflow = "";
  }
  document.querySelectorAll("[data-modal-open]").forEach(function (t) {
    t.addEventListener("click", function () { openModal(t.getAttribute("data-modal-open")); });
    t.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(t.getAttribute("data-modal-open")); }
    });
  });
  document.querySelectorAll(".modal").forEach(function (m) {
    m.addEventListener("click", function (e) {
      if (e.target === m || (e.target.closest && e.target.closest("[data-modal-close]"))) closeModal(m);
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") document.querySelectorAll(".modal.open").forEach(closeModal);
  });

  /* ---- フッターの大型ワードマークを親幅にフィット（はみ出し防止） ---- */
  function fitFooterWord() {
    var el = document.querySelector(".footer-word");
    if (!el) return;
    var parent = el.parentElement;
    var cs = window.getComputedStyle(parent);
    var avail = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (!(avail > 0)) return;
    el.style.fontSize = "100px";
    var w = el.scrollWidth;
    if (w > 0) el.style.fontSize = Math.floor(100 * avail / w) + "px";
  }
  fitFooterWord();
  window.addEventListener("load", fitFooterWord);
  var fwT;
  window.addEventListener("resize", function () { clearTimeout(fwT); fwT = setTimeout(fitFooterWord, 150); });

  /* ---- サイトデータ（イベント／メンバー数／協賛企業数）の読み込み ----
     ENDPOINT が空なら events.json（イベントのみ）を読む。
     GAS の公開URL(/exec)を ENDPOINT に入れると
     {members, sponsors, events:[...]} をまとめて取得し、
     ステートメント欄の数値（活動メンバー・協賛企業）も自動反映する。
     開催日を過ぎたイベントは自動で表示から外れる。
     イベントに "square"（1:1画像パス）があればそれを正方形で表示する。 */
  (function () {
    var box = document.querySelector("[data-event-preview]");
    var ENDPOINT = ""; // ← ここに GAS の /exec URL を入れると全て動的化
    var LIMIT = box ? parseInt(box.getAttribute("data-limit") || "2", 10) : 2;
    function esc(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
    function setStat(key, val) {
      if (val === null || val === undefined || val === "") return;
      var el = document.querySelector('[data-stat="' + key + '"]');
      if (el) el.textContent = String(val);
    }
    function renderEvents(list) {
      if (!box || !Array.isArray(list)) return;
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var up = list
        .filter(function (e) { var d = new Date(e.date); return !isNaN(d) && d >= today; })
        .sort(function (a, b) { return new Date(a.date) - new Date(b.date); })
        .slice(0, LIMIT);
      if (!up.length) {
        box.classList.add("is-empty");
        box.innerHTML = '<p class="event-empty">次回イベントは近日公開予定です。お楽しみに！</p>';
        return;
      }
      box.innerHTML = up.map(function (e, i) {
        var img = e.square || e.poster;            // square(1:1)があれば優先
        var sq = e.square ? " is-square" : "";       // 1:1表示用クラス
        return '<a href="' + esc(e.url || "events.html") + '" class="reveal d' + (i + 1) + ' in' + sq + '">' +
               '<img src="' + esc(img) + '" alt="' + esc(e.title || "イベントポスター") + '" loading="lazy" /></a>';
      }).join("");
    }
    fetch(ENDPOINT || "events.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var events = Array.isArray(data) ? data : (data && data.events) || [];
        renderEvents(events);
        if (data && !Array.isArray(data)) {
          setStat("members", data.members);
          setStat("sponsors", data.sponsors);
        }
      })
      .catch(function () { /* 取得失敗時はHTMLの静的フォールバックを維持 */ });
  })();

  /* =====================================================
     ヒーロー: 色水を混ぜるマーブリング
     非圧縮の速度場で色玉を流し、乗算合成で重ねて混色させる。
     背面の明るさを実測して KOKOKARA の文字色を自動反転する。
     ===================================================== */
  var canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var ptrX = 0, ptrY = 0, smX = 0, smY = 0, pullAmt = 0, pullOn = false;
  var tFlow = 0, fvx = 0, fvy = 0, warming = false, frame = 0;
  var vortices = [], waves = [], drops = [], sprites = [];

  var INKS = [
    "rgba(0,168,196,A)",
    "rgba(11,124,147,A)",
    "rgba(20,200,170,A)",
    "rgba(44,132,216,A)",
    "rgba(104,72,224,A)"
  ];

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function makeSprites() {
    sprites = INKS.map(function (tpl) {
      var c = document.createElement("canvas"), S = 128;
      c.width = S; c.height = S;
      var g = c.getContext("2d");
      var gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      gr.addColorStop(0, tpl.replace("A", "0.26"));
      gr.addColorStop(0.40, tpl.replace("A", "0.13"));
      gr.addColorStop(0.75, tpl.replace("A", "0.04"));
      gr.addColorStop(1, tpl.replace("A", "0"));
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
      return c;
    });
  }

  function paintWhite() {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);
  }

  function resize() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintWhite();
    if (!pullOn) { ptrX = W * 0.5; ptrY = H * 0.5; smX = ptrX; smY = ptrY; }
  }

  function spawn(d) {
    d.x = Math.random() * W; d.y = Math.random() * H;
    d.r = rnd(46, 132);
    d.life = rnd(220, 700);
    d.s = (Math.random() * INKS.length) | 0;
    return d;
  }

  function build() {
    var base = Math.min(W, H);
    vortices = [
      { x: W * 0.10, y: H * 0.32, s: base * 0.36, a:  1.00, dx: rnd(-.06,.06), dy: rnd(-.05,.05) },
      { x: W * 0.30, y: H * 0.66, s: base * 0.36, a: -1.00, dx: rnd(-.06,.06), dy: rnd(-.05,.05) },
      { x: W * 0.50, y: H * 0.28, s: base * 0.36, a:  1.00, dx: rnd(-.06,.06), dy: rnd(-.05,.05) },
      { x: W * 0.70, y: H * 0.66, s: base * 0.36, a: -1.00, dx: rnd(-.06,.06), dy: rnd(-.05,.05) },
      { x: W * 0.90, y: H * 0.34, s: base * 0.36, a:  1.00, dx: rnd(-.06,.06), dy: rnd(-.05,.05) }
    ];
    waves = [];
    for (var w = 0; w < 3; w++) {
      waves.push({
        ax: rnd(0.5, 1.5) * Math.PI / base,
        ay: rnd(0.5, 1.5) * Math.PI / base,
        amp: base * rnd(0.05, 0.10),
        sp: rnd(0.0015, 0.0040),
        ph: rnd(0, Math.PI * 2)
      });
    }
    drops.length = 0;
    var n = W < 760 ? 90 : 210;
    for (var i = 0; i < n; i++) drops.push(spawn({}));
  }

  function field(x, y) {
    var vx = 0, vy = 0, i;
    for (i = 0; i < waves.length; i++) {
      var wv = waves[i];
      var c = Math.cos(wv.ax * x + wv.ay * y + wv.ph + tFlow * wv.sp);
      vx += wv.amp * wv.ay * c;
      vy -= wv.amp * wv.ax * c;
    }
    for (i = 0; i < vortices.length; i++) {
      var vo = vortices[i];
      var rx = x - vo.x, ry = y - vo.y;
      var e = Math.exp(-(rx * rx + ry * ry) / (2 * vo.s * vo.s));
      var k = vo.a * 1.9 * e / vo.s;
      vx += -ry * k; vy += rx * k;
    }
    if (pullAmt > 0.002) {
      var dx = smX - x, dy = smY - y;
      var d = Math.sqrt(dx * dx + dy * dy) + 1;
      var u = d / (Math.min(W, H) * 0.38);
      var g = 3.2 * pullAmt / (1 + u * u * u);
      var nx = dx / d, ny = dy / d;
      vx += nx * g - ny * g * 0.95;
      vy += ny * g + nx * g * 0.95;
    }
    fvx = vx; fvy = vy;
  }

  /* ---- 背面の明るさを見て文字色を反転 ---- */
  var wordmark = document.querySelector(".hero-wordmark");
  var tagline = document.querySelector(".hero-tagline");
  var probe = document.createElement("canvas");
  probe.width = 24; probe.height = 8;
  var pctx = probe.getContext("2d", { willReadFrequently: true });

  function luminanceBehind(el) {
    var cr = canvas.getBoundingClientRect(), er = el.getBoundingClientRect();
    var sx = (er.left - cr.left) * dpr, sy = (er.top - cr.top) * dpr;
    var sw = er.width * dpr, sh = er.height * dpr;
    if (sw < 2 || sh < 2) return -1;
    sx = Math.max(0, Math.min(sx, canvas.width - 2));
    sy = Math.max(0, Math.min(sy, canvas.height - 2));
    sw = Math.min(sw, canvas.width - sx);
    sh = Math.min(sh, canvas.height - sy);
    try {
      pctx.clearRect(0, 0, 24, 8);
      pctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, 24, 8);
      var d = pctx.getImageData(0, 0, 24, 8).data, sum = 0, n = 0;
      for (var i = 0; i < d.length; i += 4) {
        var a = d[i + 3] / 255;
        var r = d[i] * a + 255 * (1 - a);
        var g = d[i + 1] * a + 255 * (1 - a);
        var b = d[i + 2] * a + 255 * (1 - a);
        sum += 0.2126 * r + 0.7152 * g + 0.0722 * b; n++;
      }
      return n ? sum / n / 255 : -1;
    } catch (err) { return -1; }
  }

  function adapt(el) {
    if (!el) return;
    var L = luminanceBehind(el);
    if (L < 0) return;
    var dark = el.classList.contains("on-dark");
    if (!dark && L < 0.46) el.classList.add("on-dark");
    else if (dark && L > 0.58) el.classList.remove("on-dark");
  }

  function step() {
    tFlow += 1; frame += 1;
    for (var v = 0; v < vortices.length; v++) {
      var vo = vortices[v];
      vo.x += vo.dx; vo.y += vo.dy;
      if (vo.x < -W * 0.15 || vo.x > W * 1.15) vo.dx *= -1;
      if (vo.y < -H * 0.15 || vo.y > H * 1.15) vo.dy *= -1;
    }
    smX += (ptrX - smX) * 0.12;
    smY += (ptrY - smY) * 0.12;
    pullAmt += ((pullOn ? 1 : 0) - pullAmt) * 0.045;

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(255,255,255,0.030)";
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = "multiply";
    for (var i = 0; i < drops.length; i++) {
      var p = drops[i];
      field(p.x, p.y);
      p.x += fvx; p.y += fvy;
      p.life--;
      if (p.life < 0 || p.x < -p.r || p.x > W + p.r || p.y < -p.r || p.y > H + p.r) { spawn(p); continue; }
      ctx.drawImage(sprites[p.s], p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    ctx.globalCompositeOperation = "source-over";

    if (!warming && frame % 6 === 0) { adapt(wordmark); adapt(tagline); }
  }

  var raf = null, running = false;
  function loop() { step(); raf = requestAnimationFrame(loop); }

  /* ---- カーソル / 指に吸い寄せられる流れ ---- */
  function grabAt(clientX, clientY) {
    if (reduce) return;
    var r = canvas.getBoundingClientRect();
    ptrX = clientX - r.left; ptrY = clientY - r.top;
    if (!pullOn) { smX = ptrX; smY = ptrY; }
    pullOn = true;
  }
  function release() { pullOn = false; }

  var heroEl = (canvas.closest && canvas.closest(".hero")) || canvas.parentElement;
  if (heroEl) {
    heroEl.addEventListener("pointermove", function (e) { grabAt(e.clientX, e.clientY); }, { passive: true });
    heroEl.addEventListener("pointerdown", function (e) { grabAt(e.clientX, e.clientY); }, { passive: true });
    heroEl.addEventListener("pointerleave", release, { passive: true });
    heroEl.addEventListener("touchmove", function (e) {
      var t = e.touches && e.touches[0];
      if (t) grabAt(t.clientX, t.clientY);
    }, { passive: true });
    heroEl.addEventListener("touchend", release, { passive: true });
    heroEl.addEventListener("touchcancel", release, { passive: true });
    window.addEventListener("blur", release);
  }

  function start() {
    resize(); makeSprites(); build();
    warming = true;
    for (var k = 0; k < 240; k++) step();
    warming = false;
    adapt(wordmark); adapt(tagline);
    if (reduce) return;
    if (!running) { running = true; raf = requestAnimationFrame(loop); }
  }

  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (raf) cancelAnimationFrame(raf);
      raf = null; running = false; start();
    }, 200);
  });

  if ("IntersectionObserver" in window && !reduce) {
    var vio = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting) { if (!running) { running = true; raf = requestAnimationFrame(loop); } }
        else { if (raf) { cancelAnimationFrame(raf); raf = null; running = false; } }
      });
    }, { threshold: 0 });
    vio.observe(canvas);
  }

  start();
})();

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

  /* ---- MBTIキャラ画像の有無を判定して画像モードへ切替 ----
     assets/mbti/ に1枚でも画像があれば .has-art を付けて画像表示に切り替える。
     画像が無い間はタイプ名のテキスト表示のまま（表示は壊れない）。 */
  (function () {
    var stage = document.querySelector(".mbti-stage");
    if (!stage) return;
    var first = stage.querySelector(".mbti-chip");
    if (!first) return;
    var m = /url\(['"]?([^'")]+)['"]?\)/.exec(first.getAttribute("style") || "");
    if (!m) return;
    var probe = new Image();
    probe.onload = function () { stage.classList.add("has-art"); };
    probe.onerror = function () { /* 未設置ならテキスト表示のまま */ };
    probe.src = m[1];
  })();

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
     ヒーロー: 粒子の軌跡（尾を引く「オタマジャクシ」）
     流体の速度場に沿って細い線を描き、キャンバスをゆっくり
     消していくことで尾になる。色は数色を混在させる。
     ===================================================== */
  var canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var ptrX = 0, ptrY = 0, smX = 0, smY = 0, pullAmt = 0, pullOn = false;
  var tFlow = 0, fvx = 0, fvy = 0, warming = false, frame = 0;
  var vortices = [], waves = [], groups = [], pvx = 0, pvy = 0;

  /* 数色を混在させる。白地に映える中明度の寒色でまとめる */
  var INKS = [
    { c: "rgba(23,184,206,",  w: 1.5 },
    { c: "rgba(18,165,160,",  w: 1.3 },
    { c: "rgba(61,143,214,",  w: 1.4 },
    { c: "rgba(35,181,127,",  w: 1.3 },
    { c: "rgba(108,127,224,", w: 1.2 },
    { c: "rgba(22,194,179,",  w: 1.6 }
  ];

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!pullOn) { ptrX = W * 0.5; ptrY = H * 0.5; smX = ptrX; smY = ptrY; }
  }

  function spawn(p) {
    p.x = Math.random() * W; p.y = Math.random() * H;
    p.px = p.x; p.py = p.y;
    p.life = rnd(160, 620);
    p.a = rnd(0.30, 0.72);
    return p;
  }

  function build() {
    var base = Math.min(W, H);
    /* 渦は毎回ランダムに作る。位置・大きさ・強さ・回転方向を振りつつ、
       横方向は列ごとに1つ置いて画面のどこかが止まらないようにする。 */
    var cnt = 5 + ((Math.random() * 3) | 0);          /* 5〜7個 */
    var signs = [];
    for (var q = 0; q < cnt; q++) signs.push(q % 2 ? -1 : 1);
    for (var q2 = signs.length - 1; q2 > 0; q2--) {   /* 並びをシャッフル */
      var r2 = (Math.random() * (q2 + 1)) | 0, tmp = signs[q2];
      signs[q2] = signs[r2]; signs[r2] = tmp;
    }
    vortices = [];
    for (var vi = 0; vi < cnt; vi++) {
      vortices.push({
        x: W * (vi + rnd(0.12, 0.88)) / cnt,
        y: H * rnd(0.12, 0.88),
        s: base * rnd(0.22, 0.46),
        a: signs[vi] * rnd(0.62, 1.38),
        dx: rnd(-.10, .10), dy: rnd(-.08, .08)
      });
    }
    waves = [];
    var wc = 2 + ((Math.random() * 3) | 0);           /* うねりも2〜4本 */
    for (var w = 0; w < wc; w++) {
      waves.push({
        ax: rnd(0.5, 1.5) * Math.PI / base,
        ay: rnd(0.5, 1.5) * Math.PI / base,
        amp: base * rnd(0.05, 0.10),
        sp: rnd(0.0015, 0.0040),
        ph: rnd(0, Math.PI * 2)
      });
    }
    var total = W < 760 ? 620 : 1500;
    groups = [];
    for (var g = 0; g < INKS.length; g++) {
      var arr = [];
      for (var i = 0; i < Math.round(total / INKS.length); i++) arr.push(spawn({}));
      groups.push(arr);
    }
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
      var rr = Math.min(W, H) * 0.22;
      var q = (dx * dx + dy * dy) / (rr * rr);
      if (q < 1) {
        /* カーソルへ吸い込みつつ旋回。中心に達した粒子は再生成するので溜まらない */
        var kk = 1 - q, infl = pullAmt * kk * kk;
        var d = Math.sqrt(dx * dx + dy * dy) + 1;
        var nx = dx / d, ny = dy / d;
        vx += nx * 3.4 * infl - ny * 2.6 * infl + pvx * 0.40 * infl;
        vy += ny * 3.4 * infl + nx * 2.6 * infl + pvy * 0.40 * infl;
      }
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
    if (!dark && L < 0.30) el.classList.add("on-dark");
    else if (dark && L > 0.44) el.classList.remove("on-dark");
  }

  function step() {
    tFlow += 1; frame += 1;
    for (var v = 0; v < vortices.length; v++) {
      var vo = vortices[v];
      vo.x += vo.dx; vo.y += vo.dy;
      if (vo.x < -W * 0.15 || vo.x > W * 1.15) vo.dx *= -1;
      if (vo.y < -H * 0.15 || vo.y > H * 1.15) vo.dy *= -1;
    }
    var nvx = ptrX - smX, nvy = ptrY - smY;
    smX += nvx * 0.12; smY += nvy * 0.12;
    var sp = Math.sqrt(nvx * nvx + nvy * nvy), cap = 26;
    if (sp > cap) { nvx = nvx / sp * cap; nvy = nvy / sp * cap; }
    pvx += (nvx - pvx) * 0.22; pvy += (nvy - pvy) * 0.22;
    pullAmt += ((pullOn ? 1 : 0) - pullAmt) * 0.090;

    /* 少しずつ消していくことで軌跡が尾になる */
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.040)";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
    ctx.lineCap = "round";

    for (var g = 0; g < groups.length; g++) {
      var arr = groups[g], ink = INKS[g];
      ctx.strokeStyle = ink.c + "0.62)";
      ctx.lineWidth = ink.w;
      ctx.beginPath();
      for (var i = 0; i < arr.length; i++) {
        var p = arr[i];
        field(p.x, p.y);
        p.x += fvx; p.y += fvy;
        p.life--;
        if (p.life < 0 || p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H + 40) { spawn(p); continue; }
        if (pullAmt > 0.35) {
          var sdx = smX - p.x, sdy = smY - p.y;
          if (sdx * sdx + sdy * sdy < 400) { spawn(p); continue; }  /* 飲み込まれた */
        }
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        p.px = p.x; p.py = p.y;
      }
      ctx.stroke();
    }

    if (!warming && frame % 6 === 0) { adapt(wordmark); adapt(tagline); }
  }

  var raf = null, running = false;
  function loop() { step(); raf = requestAnimationFrame(loop); }

  /* ---- カーソル / 指 ---- */
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
    resize(); build();
    warming = true;
    for (var k = 0; k < 200; k++) step();
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

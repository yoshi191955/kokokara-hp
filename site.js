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

  /* =====================================================
     ヒーロー: ジェネラティブな渦（フローフィールド）
     モノクロの紙面に、オレンジ〜アンバーの帯だけが渦を巻く。
     ===================================================== */
  var canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, cx = 0, cy = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 渦の中心は右寄り（大型ワードマークと重ねる）。キャンバスは透明のまま。
    cx = W * (W < 760 ? 0.5 : 0.63);
    cy = H * (W < 760 ? 0.36 : 0.40);
    ctx.clearRect(0, 0, W, H);
  }

  // 帯（ストランド）
  var strands = [];
  function build() {
    strands.length = 0;
    var base = Math.min(W, H);
    var count = W < 760 ? 170 : 260;
    for (var i = 0; i < count; i++) {
      var t = i / count;
      // ほとんどをオレンジ〜琥珀に、一部だけコーラル寄りにして深みを出す
      var hue = 12 + t * 26 + (Math.random() * 10 - 5);
      if (Math.random() < 0.12) hue = 6 + Math.random() * 6;   // コーラルの差し
      strands.push({
        r: base * (0.045 + Math.pow(t, 0.82) * 0.55),  // 半径の広がり
        a: Math.random() * Math.PI * 2,                // 初期角度
        spin: 0.0016 + (1 - t) * 0.0046,               // 内側ほど速い
        wob: 0.10 + Math.random() * 0.22,              // 揺らぎ量
        wf: 0.6 + Math.random() * 1.7,                 // 揺らぎ周波数
        hue: hue,
        light: 50 + Math.random() * 8,
        alpha: 0.40 + (1 - t) * 0.30,
        px: 0, py: 0, seeded: false
      });
    }
  }

  var tGlobal = 0;
  // 1フレーム分の描画（rAFは張らない）
  function step() {
    tGlobal += 1;
    // 残像: 透明を保ったままトレイルを少しずつ消す
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.045)";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
    ctx.lineCap = "round";

    for (var i = 0; i < strands.length; i++) {
      var s = strands[i];
      s.a += s.spin;
      var wob = 1 + Math.sin(s.a * s.wf + tGlobal * 0.006) * s.wob;
      var rr = s.r * wob;
      var x = cx + Math.cos(s.a) * rr;
      var y = cy + Math.sin(s.a) * rr * 0.92;
      if (!s.seeded) { s.px = x; s.py = y; s.seeded = true; }
      ctx.beginPath();
      ctx.moveTo(s.px, s.py);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "hsla(" + s.hue + ",96%," + s.light + "%," + s.alpha + ")";
      ctx.lineWidth = 1.3;
      ctx.stroke();
      s.px = x; s.py = y;
    }
  }

  var raf = null, running = false;
  function loop() { step(); raf = requestAnimationFrame(loop); }

  function start() {
    resize(); build();
    if (reduce) { staticDraw(); return; }
    // 先に数十フレーム分進めて、最初から渦が出来ている状態に
    for (var k = 0; k < 120; k++) step();
    if (!running) { running = true; raf = requestAnimationFrame(loop); }
  }

  function staticDraw() {
    // モーション無効時: 一枚の静止した渦
    ctx.globalCompositeOperation = "source-over"; ctx.lineCap = "round";
    for (var i = 0; i < strands.length; i++) {
      var s = strands[i]; var steps = 220;
      ctx.beginPath();
      for (var j = 0; j < steps; j++) {
        var a = s.a + j * 0.045;
        var rr = s.r * (1 + Math.sin(a * s.wf) * s.wob);
        var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.92;
        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "hsla(" + s.hue + ",95%," + s.light + "%," + (s.alpha * 0.5) + ")";
      ctx.lineWidth = 1.1; ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (raf) cancelAnimationFrame(raf);
      raf = null; running = false; start();
    }, 200);
  });

  // 画面外では停止して負荷を抑える
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

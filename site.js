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

  /* ---- 開催予定イベントのポスター（データ駆動・開催日フィルタ） ----
     データ元は既定で events.json。将来 GAS の公開URLを ENDPOINT に入れれば
     そのまま切り替えできる。開催日を過ぎたものは自動で表示から外れる。 */
  (function () {
    var box = document.querySelector("[data-event-preview]");
    if (!box) return;
    var ENDPOINT = "";
    var LIMIT = parseInt(box.getAttribute("data-limit") || "2", 10);
    function esc(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
    fetch(ENDPOINT || "events.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (list) {
        if (!Array.isArray(list)) return;
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
          return '<a href="' + esc(e.url || "events.html") + '" class="reveal d' + (i + 1) + ' in">' +
                 '<img src="' + esc(e.poster) + '" alt="' + esc(e.title || "イベントポスター") + '" loading="lazy" /></a>';
        }).join("");
      })
      .catch(function () { /* 取得失敗時はHTMLの静的フォールバックを維持 */ });
  })();

  /* =====================================================
     ヒーロー: ジェネラティブな渦（フローフィールド）
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
    cx = W * (W < 760 ? 0.5 : 0.63);
    cy = H * (W < 760 ? 0.36 : 0.40);
    ctx.clearRect(0, 0, W, H);
  }

  var strands = [];
  function build() {
    strands.length = 0;
    var base = Math.min(W, H);
    var count = W < 760 ? 170 : 260;
    for (var i = 0; i < count; i++) {
      var t = i / count;
      var hue = 12 + t * 26 + (Math.random() * 10 - 5);
      if (Math.random() < 0.12) hue = 6 + Math.random() * 6;
      strands.push({
        r: base * (0.045 + Math.pow(t, 0.82) * 0.55),
        a: Math.random() * Math.PI * 2,
        spin: 0.0016 + (1 - t) * 0.0046,
        wob: 0.10 + Math.random() * 0.22,
        wf: 0.6 + Math.random() * 1.7,
        hue: hue,
        light: 50 + Math.random() * 8,
        alpha: 0.40 + (1 - t) * 0.30,
        px: 0, py: 0, seeded: false
      });
    }
  }

  var tGlobal = 0;
  function step() {
    tGlobal += 1;
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
    for (var k = 0; k < 120; k++) step();
    if (!running) { running = true; raf = requestAnimationFrame(loop); }
  }

  function staticDraw() {
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

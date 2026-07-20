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

  /* ---- メニュー内の「前のページに戻る」 ---- */
  var backBtn = document.querySelector(".menu-back");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      setMenu(false);
      /* 履歴があれば戻る。無い場合（直接開かれた等）はトップへ */
      if (window.history.length > 1) window.history.back();
      else window.location.href = "index.html";
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

  /* ---- 数字が0からカウントアップして増える ---- */
  var statsShown = false;
  function countUp(el, target, dur) {
    if (reduce) { el.textContent = String(target); return; }
    var from = parseInt(el.textContent, 10);
    if (isNaN(from)) from = 0;
    var t0 = null;
    function tick(now) {
      if (t0 === null) t0 = now;
      var t = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - t, 3);            /* 最後にゆっくり止まる */
      el.textContent = String(Math.round(from + (target - from) * e));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function runStats() {
    document.querySelectorAll("[data-stat]").forEach(function (el) {
      var tv = parseInt(el.getAttribute("data-target") || el.textContent, 10);
      if (isNaN(tv)) return;
      el.setAttribute("data-target", tv);
      el.textContent = "0";
      countUp(el, tv, 1500);
    });
  }
  (function () {
    var box = document.querySelector(".stats");
    if (!box) return;
    if (!("IntersectionObserver" in window)) { statsShown = true; runStats(); return; }
    var io2 = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting && !statsShown) { statsShown = true; runStats(); io2.disconnect(); }
      });
    }, { threshold: 0.35 });
    io2.observe(box);
  })();

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
      if (!el) return;
      var tv = parseInt(val, 10);
      if (isNaN(tv)) { el.textContent = String(val); return; }
      el.setAttribute("data-target", tv);
      if (statsShown) countUp(el, tv, 900); else el.textContent = "0";
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
     ヒーロー: 光の帯（CSSアニメーション）
     描画はGPUに任せ、JSはカーソルのわずかな視差だけを担当する。
     ===================================================== */
  (function () {
    var aura = document.querySelector(".hero-aura");
    var heroEl = document.querySelector(".hero");
    if (!aura || !heroEl || reduce) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, ticking = false;
    function apply() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      aura.style.transform = "translate3d(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px,0)";
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) requestAnimationFrame(apply);
      else ticking = false;
    }
    heroEl.addEventListener("pointermove", function (e) {
      var r = heroEl.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 46;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 30;
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
    heroEl.addEventListener("pointerleave", function () {
      tx = 0; ty = 0;
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
  })();
})();

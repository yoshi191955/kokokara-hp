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
      a.addEventListener("click", function () {
        var href = a.getAttribute("href") || "";
        var cur = location.pathname.split("/").pop() || "index.html";
        /* 別ページへ遷移するリンクは閉じない（遷移するまでメニューを保持）。
           同じページ・ページ内アンカーのときだけ閉じる。 */
        if (href === "" || href.charAt(0) === "#" || href === cur) setMenu(false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ---- メニュー内の「前のページに戻る」 ---- */
  var backBtn = document.querySelector(".menu-back");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      /* メニューはオーバーレイなので「前のページ」＝開く直前に見ていた今のページ。
         履歴を遡るとホーム等へ飛ぶため、メニューを閉じて元のページに戻す。 */
      setMenu(false);
    });
  }

  /* ---- リビール演出 ---- */
  var targets = document.querySelectorAll(".reveal, .cta-copy, .cta-clark");
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

  /* ---- 協賛CTA：スライドイン完了後に静止画→動画へ切替 ---- */
  var clark = document.querySelector(".cta-clark");
  if (clark) {
    var clarkVideo = clark.querySelector(".cta-clark-video");
    if (clarkVideo && !reduce && "IntersectionObserver" in window) {
      var clarkSwapped = false;
      var swapToVideo = function () {
        if (clarkSwapped) return;
        clarkSwapped = true;
        clark.classList.add("play");
        var p = clarkVideo.play();
        if (p && p.catch) { p.catch(function () {}); }
      };
      clark.addEventListener("transitionend", function (ev) {
        if (ev.target === clark && ev.propertyName === "transform" && clark.classList.contains("in")) {
          swapToVideo();
        }
      });
      /* 保険：万一transitionendが来なくてもinから1.6s後に切替 */
      var clarkFallbackIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            clarkFallbackIO.unobserve(e.target);
            setTimeout(swapToVideo, 1600);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      clarkFallbackIO.observe(clark);
    }
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

  /* ---- 背景動画を確実に再生（autoplayブロック対策） ---- */
  (function () {
    var vids = document.querySelectorAll("video[autoplay]");
    if (!vids.length) return;
    vids.forEach(function (v) {
      v.muted = true; v.defaultMuted = true; v.setAttribute("muted", "");
      function tryPlay() { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      tryPlay();
      v.addEventListener("canplay", tryPlay, { once: true });
      v.addEventListener("loadeddata", tryPlay, { once: true });
    });
    /* 一部ブラウザは最初のユーザー操作まで待つため、その時点でも再生を試みる */
    var kick = function () {
      vids.forEach(function (v) { if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } });
    };
    document.addEventListener("pointerdown", kick, { once: true });
    document.addEventListener("touchstart", kick, { once: true });
    document.addEventListener("scroll", kick, { once: true, passive: true });
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

  /* ---- フッター背景：薄い四角が下から上へ ---- */
  (function () {
    var box = document.querySelector(".footer-fall");
    if (!box) return;
    var rand = function (a, b) { return a + Math.random() * (b - a); };
    var pick = function (a) { return a[(Math.random() * a.length) | 0]; };
    var N = window.innerWidth < 760 ? 12 : 22;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < N; i++) {
      var depth = Math.pow(Math.random(), 1.4);
      var size = Math.round(rand(10, 20) + depth * 34);
      var hue = rand(150, 260), sat = rand(66, 92), lit = rand(58, 74);  /* カラフルで鮮やか（緑〜青〜紫） */
      var outline = Math.random() < 0.4;
      var op = +(0.22 + depth * 0.30).toFixed(2);                        /* 濃紺の上で発色しつつKOKOKARAを邪魔しない */
      var dur = +(rand(20, 32) - depth * 9).toFixed(1);
      var radius = pick([2, 4, 8, 12, size / 2 | 0]);
      var rot = Math.round(rand(-90, 90)), amp = Math.round(rand(4, 12));
      var swayDur = +(rand(3.5, 7)).toFixed(1);
      var chip = document.createElement("span");
      chip.className = "foot-chip";
      chip.style.cssText =
        "left:" + rand(-2, 98).toFixed(2) + "%;width:" + size + "px;height:" + size + "px;" +
        "animation-duration:" + dur + "s;animation-delay:" + (-rand(0, dur)).toFixed(2) + "s;--op:" + op + ";";
      var inner = document.createElement("i");
      var col = "hsl(" + hue.toFixed(0) + "," + sat.toFixed(0) + "%," + lit.toFixed(0) + "%)";
      inner.style.cssText =
        "border-radius:" + radius + "px;" +
        (outline ? "background:transparent;border:2px solid " + col + ";box-sizing:border-box;" : "background:" + col + ";") +
        "animation-duration:" + swayDur + "s;animation-delay:" + (-rand(0, swayDur)).toFixed(2) + "s;--amp:" + amp + "px;--rot:" + rot + "deg;";
      chip.appendChild(inner);
      if (reduce) {
        chip.style.top = rand(4, 84).toFixed(1) + "%";
        chip.style.transform = "translateY(0)"; chip.style.opacity = op;
      }
      chip.dataset.depth = depth.toFixed(3);
      frag.appendChild(chip);
    }
    box.appendChild(frag);

    /* フッターの四角にもカーソル連動の視差を効かせる */
    if (!reduce) {
      var footer = box.closest(".site-footer") || box.parentElement;
      var fchips = [].slice.call(box.querySelectorAll(".foot-chip"));
      fchips.forEach(function (ch) {
        var d = parseFloat(ch.dataset.depth || "0.5");
        ch.__k = 20 + d * 60; ch.__tilt = 5 + d * 12;
        var mv = document.createElement("b"); mv.className = "foot-move";
        while (ch.firstChild) mv.appendChild(ch.firstChild);
        ch.appendChild(mv); ch.__mv = mv;
      });
      var ftx = 0, fty = 0, fcx = 0, fcy = 0, fticking = false;
      function fapply() {
        fcx += (ftx - fcx) * 0.09; fcy += (fty - fcy) * 0.09;
        for (var i = 0; i < fchips.length; i++) {
          var ch = fchips[i];
          ch.__mv.style.setProperty("--px", (fcx * ch.__k).toFixed(2) + "px");
          ch.__mv.style.setProperty("--py", (fcy * ch.__k).toFixed(2) + "px");
          ch.__mv.style.setProperty("--pr", (fcx * ch.__tilt).toFixed(2) + "deg");
        }
        if (Math.abs(ftx - fcx) > 0.001 || Math.abs(fty - fcy) > 0.001) requestAnimationFrame(fapply);
        else fticking = false;
      }
      footer.addEventListener("pointermove", function (e) {
        var r = footer.getBoundingClientRect();
        ftx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        fty = ((e.clientY - r.top) / r.height - 0.5) * 2;
        if (!fticking) { fticking = true; requestAnimationFrame(fapply); }
      }, { passive: true });
      footer.addEventListener("pointerleave", function () {
        ftx = 0; fty = 0;
        if (!fticking) { fticking = true; requestAnimationFrame(fapply); }
      }, { passive: true });
    }
  })();

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
  /* =====================================================
     ヒーロー: 色とりどりの四角が上から降ってくる
     生成は初回のみ。落下・横揺れ・回転はCSSアニメーション（GPU合成）で回すため、
     JSの毎フレーム処理は発生しない。奥行きで速度と濃さを変え視差を出す。
     ===================================================== */
  (function () {
    var aura = document.querySelector(".hero-aura");
    if (!aura) return;
    var rand = function (a, b) { return a + Math.random() * (b - a); };
    var pick = function (arr) { return arr[(Math.random() * arr.length) | 0]; };
    var N = window.innerWidth < 760 ? 26 : 46;
    var frag = document.createDocumentFragment();

    for (var i = 0; i < N; i++) {
      /* 奥行き 0=遠(小さく遅く薄い) 〜 1=近(大きく速く濃い) */
      var depth = Math.pow(Math.random(), 1.4);
      var size = Math.round(rand(12, 26) + depth * 46);          /* 12〜72px */
      var hue = rand(158, 220);                                   /* 緑〜青 */
      var sat = rand(52, 74), lit = rand(52, 64);
      var outline = Math.random() < 0.28;                          /* 3割は枠だけ */
      var op = +(0.16 + depth * 0.26).toFixed(2);                 /* 近いほど濃い */
      var dur = +(rand(22, 34) - depth * 12).toFixed(1);          /* 近いほど速い */
      var delay = -rand(0, dur).toFixed(2);
      var radius = pick([2, 4, 8, 14, 22, size / 2 | 0]);
      var rot = Math.round(rand(-120, 120));
      var amp = Math.round(rand(4, 16));
      var swayDur = +(rand(3.5, 7.5)).toFixed(1);

      var chip = document.createElement("span");
      chip.className = "fall-chip";
      var mover = document.createElement("b");
      mover.className = "fall-move";
      chip.style.cssText =
        "left:" + rand(-2, 98).toFixed(2) + "%;" +
        "width:" + size + "px;height:" + size + "px;" +
        "animation-duration:" + dur + "s;animation-delay:" + delay + "s;" +
        "--op:" + op + ";";
      chip.dataset.depth = depth.toFixed(3);
      var inner = document.createElement("i");
      var col = "hsl(" + hue.toFixed(0) + "," + sat.toFixed(0) + "%," + lit.toFixed(0) + "%)";
      inner.style.cssText =
        "border-radius:" + radius + "px;" +
        (outline
          ? "background:transparent;border:" + (depth > 0.6 ? 3 : 2) + "px solid " + col + ";box-sizing:border-box;"
          : "background:" + col + ";") +
        "animation-duration:" + swayDur + "s;animation-delay:" + (-rand(0, swayDur)).toFixed(2) + "s;" +
        "--amp:" + amp + "px;--rot:" + rot + "deg;";
      mover.appendChild(inner);
      chip.appendChild(mover);

      if (reduce) {
        /* 動きを止める設定では、画面内に静止配置して見せる */
        chip.style.top = rand(2, 88).toFixed(1) + "%";
        chip.style.transform = "translateY(0)";
        chip.style.opacity = op;
        inner.style.transform = "rotate(" + (rot / 2 | 0) + "deg)";
      }
      frag.appendChild(chip);
    }
    aura.appendChild(frag);
  })();

  (function () {
    var aura = document.querySelector(".hero-aura");
    var heroEl = document.querySelector(".hero");
    if (!aura || !heroEl || reduce) return;
    var chips = [].slice.call(aura.querySelectorAll(".fall-chip"));
    /* 各chipに奥行き係数を持たせる。手前(depth大)ほど大きく動き、
       奥は控えめ。カーソルから離れた向きへ押しやり、傾きも加える。 */
    chips.forEach(function (ch) {
      var d = parseFloat(ch.dataset.depth || "0.5");
      ch.__k = 26 + d * 74;                 /* 移動量 26〜100px */
      ch.__tilt = 6 + d * 12;               /* 傾き 6〜18deg */
      ch.__mv = ch.querySelector(".fall-move");
    });
    var tx = 0, ty = 0, cx = 0, cy = 0, ticking = false;
    function apply() {
      cx += (tx - cx) * 0.09;
      cy += (ty - cy) * 0.09;
      for (var i = 0; i < chips.length; i++) {
        var ch = chips[i];
        ch.__mv.style.setProperty("--px", (cx * ch.__k).toFixed(2) + "px");
        ch.__mv.style.setProperty("--py", (cy * ch.__k).toFixed(2) + "px");
        ch.__mv.style.setProperty("--pr", (cx * ch.__tilt).toFixed(2) + "deg");
      }
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) requestAnimationFrame(apply);
      else ticking = false;
    }
    heroEl.addEventListener("pointermove", function (e) {
      var r = heroEl.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;   /* -1〜1 */
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
    heroEl.addEventListener("pointerleave", function () {
      tx = 0; ty = 0;
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
  })();
})();

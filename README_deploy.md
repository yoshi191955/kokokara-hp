# 学生団体ココカラ 公式サイト v3（OASIZ風リニューアル）｜デプロイ手順

このフォルダをそのまま公開すれば、サイトが表示されます。
外部依存は Google Fonts（Archivo / Zen Kaku Gothic New / Noto Sans JP）のCDNのみで、それ以外は自己完結しています。

## デザインについて
参考サイト「OASIZ」の世界観をベースに、ココカラのブランド色（オレンジ）を"唯一の差し色"として再構築しています。
- オフホワイトの紙面 × 極太モノクロのタイポグラフィ
- ヒーローの渦は Canvas によるジェネラティブ・アニメーション（オレンジ〜琥珀）。`prefers-reduced-motion` にも対応。
- 各セクションはスクロールでふわっと表示されます。

## フォルダ構成
```
ココカラHP/
├── index.html          … トップページ
├── events.html         … イベント（募集中）
├── events-past.html    … イベント（開催済）
├── sponsors.html       … 協賛企業一覧
├── style.css           … 共通スタイル
├── site.js             … 共通スクリプト（ヒーロー演出・リビール・メニュー）
└── assets/
    ├── logo.png
    ├── event_20260710_pizza.jpg
    └── event_20260724_takoyaki.jpg
```

## 公開方法（ドラッグ&ドロップ・最も簡単）
1. ブラウザで https://app.netlify.com を開き、ログインします（無料アカウントでOK）。
2. 「Sites」を開き、「Drag and drop your site output folder here」のエリアに、
   **このフォルダを丸ごと**ドラッグ&ドロップします。
3. 数秒〜数十秒で `https://〇〇〇.netlify.app` の公開URLが発行されます。

## サイトを更新するとき
1. 対象サイトの「Deploys」タブを開き、更新後のフォルダを再度ドラッグ&ドロップします。
2. 同じURLで内容が更新されます。

## メモ
- 公式LINE（`https://line.me/R/ti/p/@113crihp`）と参加申込フォーム（Googleフォーム）は、
  すでに全ページに実URLを埋め込み済みです。差し替えが必要な場合は各HTML内のリンクを編集してください。
- 独自ドメインは Netlify の「Domain settings」から追加できます。
- 画像を追加する場合は `assets/` に置き、各HTMLの `<img src="assets/...">` を参照してください。

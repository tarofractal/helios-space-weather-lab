# HELIOS — Space Weather Lab

**Live demo:** https://helios-space-weather-lab-taro.tarofractal.chatgpt.site/?view=overview

An interactive space-weather platform connecting public observations, CME propagation models, historical event replay, and research notes.

**GitHub公開の手順:** [GITHUB_SETUP.md](GITHUB_SETUP.md)

The live demo is hosted with ChatGPT Sites. This repository is a source snapshot; pushing changes here does not automatically update that deployment. The application uses server API routes, Cloudflare Workers/D1, and ChatGPT sign-in for saved notes. GitHub Pages cannot run the full application unchanged. A separate production deployment must configure its own database and trusted authentication; the local preview's mock identity is for local development only.

The original hosted project ID is intentionally omitted from `.openai/hosting.json`. No production database records, local environment files, credentials, or original Git history are included. Third-party source and dataset attributions are retained below.


宇宙天気の実観測、CME伝播モデル、論文の判断根拠、研究ノートをつなぐWebプラットフォーム。

## 実装した機能

- NOAA RTSW新形式の太陽風・GSM磁場、Kp、GOES X線・≥10 MeV陽子。
- NASA DONKIのCME・フレア一覧、イベント選択と時刻操作、回転可能な3Dコーン模式図。
- 等速とDrag-Based Modelの解析解・到着時刻計算・パラメータ感度分析。
- 2024年5月8〜13日の太陽風・磁場・Kp・Dst・X線・陽子の実観測再生。
- Fujita et al. (2026) Appendix Cの条件式5個。仮想入力に加え、実際の過去フレアのX線積分を入力できる。
- NOAA OVATIONの地球儀、地点の太陽高度、Open-Meteo雲量、模擬大圏ルート。
- アカウントごとの研究ノート。作成、更新、削除、Markdown出力。
- データ来歴、欠測、時刻基準、モデル検算の画面。

## 科学的な意味

観測グラフは取得した実データです。3D CMEはDONKIの解析値を入力したDBM計算で、磁気流体シミュレーションを新たに実行しているわけではありません。コーンは方位・緯度・半角から描き、天体の大きさは表示上誇張しています。地球方向判定は静的な角度による近似です。

論文画面は公開条件式の操作実験です。完全版Wide Learning、全特徴量、全重みは接続していません。確率出力は行いません。SOHOの論文入力をNOAAの瞬時値で代用しません。実測X線から計算した場合も論文全体の前処理再現とは区別しています。

OVATION値に雲・昼光を足して独自の観測確率には換算しません。模擬ルートは飛行運用向けの航路最適化ではありません。

## 起動・検証

Node.js 22以降とpnpmを使用します。

```sh
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

サイトのホスティング設定は `.openai/hosting.json`、サーバーはCloudflare Workers互換、データベースはD1です。独自に起動する場合はD1のローカルマイグレーションを適用してください。公開されたサイトの利用に、NASAのAPIキーを入力する必要はありません。

## データの更新

画面を開いている間は約1分ごとに取得します。データ製品ごとに短時間キャッシュを持ち、失敗時は最後に取得できた実データを使います。保存データと遅延は画面に表示します。画面を閉じた間の無人定期収集は設定していません。

```sh
python3 scripts/data/collect.py
node scripts/data/prepare.mjs
```

collect.pyは最新の公開製品とDONKIカタログを取得します。prepare.mjsは同じTypeScriptパーサーでスナップショットを生成し、data/archiveの正規化済み履歴を再生データへ組み込みます。すべての出典・処理記録は public/data/ 以下にあります。

## 時刻とデータ品質

- 計算はUTC、km、km/s、秒。表示だけUTC/JST/ETに切り替えられます。
- RTSWではactive/sourceを扱い、GSMのBzを選択します。
- OMNI履歴はバウショック到達時刻へシフト済み。L1の伝播時間を再加算しません。
- Kpは3時間区間、Dstは1時間平均です。
- X線履歴はNOAA NCEIのGOES-16再処理science版。品質フラグと欠測を保持します。
- 陽子履歴はNOAA primary GOES / NASA CLEAR archive。元CSVに個々の衛星IDはありません。
- nullを0で埋めず、長い観測ギャップの線を接続しません。
- X線積分は隣接する有効な観測間を台形積分し、カバーが不足する区間は未取得にします。

## 検証

科学計算とパーサーのテストは tests/science.test.mjs。既知ケースの到達時間52.30830956 h、到達速度619.66815679 km/s、抗力方程式の数値微分、極限、緯度を含む方向判定、UTC、エネルギーチャンネル、欠測を検証します。

tests/notes.integration.mjs はNode.jsのSQLiteエンジンで同じスキーマとAPIハンドラーを実行し、未認証書込みの拒否、Origin検査、所有者別の作成・取得・更新・削除を検証できます。テストで作成したノートだけを最後に削除します。

## 出典

- NOAA SWPC: https://www.spaceweather.gov/
- NASA DONKI: https://ccmc.gsfc.nasa.gov/DONKI/
- NASA SPDF / OMNI: https://omniweb.gsfc.nasa.gov/
- GFZ Potsdam Kp (CC BY 4.0): https://kp.gfz.de/
- WDC Kyoto: https://wdc.kugi.kyoto-u.ac.jp/
- NOAA NCEI GOES: https://www.ncei.noaa.gov/products/space-weather
- NASA CLEAR: https://ccmc.gsfc.nasa.gov/swxcoe/clear/benchmark.php
- NASA SDO: https://sdo.gsfc.nasa.gov/
- Natural Earth geography (public domain): https://www.naturalearthdata.com/
- Weather data by Open-Meteo: https://open-meteo.com/
- Fujita et al. (2026): https://doi.org/10.1029/2025SW004635
- Dumbović et al. (2021): https://doi.org/10.3389/fspas.2021.639986

## 正式モデル接続に必要なもの

富士通チームと、利用できるWide Learning実行環境・推論インターフェース、必要特徴量、前処理、モデルの版・重み、公開可能な結果の範囲を確認します。現時点の画面と計算は、公開データだけで動作します。

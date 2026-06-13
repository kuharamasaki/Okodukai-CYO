# Okodukai CYO

子ども向けのお小遣い台帳システムです。SOSUKE / EMMA を切り替えて、収入・支出・月末残高確認・用途別分析・ほしいものリスト・背景選択を別々に管理できます。

## 使い方

`index.html` をブラウザで開くとローカルで動きます。データはブラウザの `localStorage` に保存されます。

家庭内で別PCをメイン入力PCにする場合は、そのPCで `start-okodukai.bat` をダブルクリックします。サーバーが起動し、ブラウザで `http://localhost:8787` が自動で開きます。

```powershell
start-okodukai.bat
```

この場合、データはそのPCの OneDrive 上にある `data/okodukai-state.json` に保存されます。別PCで同じフォルダを使う場合も、同時入力は避けてください。

## GitHub 初期登録

このフォルダで Git が使える環境から次を実行します。

```powershell
git init
git add .
git commit -m "Initial okodukai ledger app"
gh repo create Okodukai-CYO --private --source . --remote origin --push
```

GitHub CLI を使わない場合は GitHub で空のリポジトリを作成し、表示される `git remote add origin ...` と `git push -u origin main` を実行します。

## 主な機能

- 収入と支出をひとつの収支一覧で登録
- 収入は青、支出はオレンジで色分け
- 登録済み内容の呼び出し
- 月ごとの収支とシステム残高の確認
- 財布残高との一致確認
- 一致済みなら翌月のお小遣いをもらえる状態として表示
- 用途の自動分類と手動変更
- 月 / 半年 / 一年の支出分析グラフ
- 一度入力した内容の登録とプルダウン呼び出し
- ほしいものリストと必要金額の表示
- SOSUKE / EMMA ごとの背景選択
- JSON エクスポート

## 将来の拡張メモ

- スマホアクセス用の表示最適化
- 月次締め後の編集ロック
- お小遣い支給ルールの自動化

# バージョンログ

このプロジェクトに対するすべての重要な変更は、このファイルに記録されます。

## [v3.0.6] - 2025-08-02

## [v3.0.5] - 2025-07-22

### ✨ 新機能
- feat(e2e): Playwrightの設定と初期テストを追加 ([#675](https://github.com/mineadmin/mineadmin/pull/675)) ([a0694fd](https://github.com/mineadmin/mineadmin/commit/a0694fd84da20ae758bebdc744af5188d4b3ae4d))
- feat(workflow): pushおよびpull_requestイベントのパス設定を更新 ([#668](https://github.com/mineadmin/mineadmin/pull/668)) ([2ff8c5f](https://github.com/mineadmin/mineadmin/commit/2ff8c5fb957cd2cf252f6eb33b852b3f030bb80a))
- feat(app-store): プラグインのダウンロードとインストールに関するヒントメッセージを追加 ([#667](https://github.com/mineadmin/mineadmin/pull/667)) ([14617f5](https://github.com/mineadmin/mineadmin/commit/14617f5b600691141e8b688fb4741d9ba35050fc))
- feat(dialog): フルスクリーン操作体験を最適化し、フルスクリーン状態を制御可能にし、フルスクリーンボタンのホットゾーンを拡大 ([#660](https://github.com/mineadmin/mineadmin/pull/660)) ([ba5816a](https://github.com/mineadmin/mineadmin/commit/ba5816a2d5f210f4a771d7ab960f42aa1ea65998))
- feat(boring-cyborg): ファイルパス設定を更新し、複数のモジュールの権限設定を追加 ([#659](https://github.com/mineadmin/mineadmin/pull/659)) ([a8fb2b5](https://github.com/mineadmin/mineadmin/commit/a8fb2b5ad117f5d3755011e7b43b2ed42dafac75))

### 🐛 バグ修正
- fix(boring-cyborg): Logstashサービスパスの大文字小文字の誤りを修正 ([#665](https://github.com/mineadmin/mineadmin/pull/665)) ([6375e2c](https://github.com/mineadmin/mineadmin/commit/6375e2ce247fc040cb5d5c0b1088c5acc0de4c3b))
- fix(handleResize): レスポンシブ時にaddEventListenerイベントエラーが発生し、メニューが異常に閉じる問題を修正 ([#662](https://github.com/mineadmin/mineadmin/pull/662)) ([6882046](https://github.com/mineadmin/mineadmin/commit/6882046d84eec0350d0b889d4cbb9ab73e8cc5f1))

## [v3.0.4] - 2025-07-10

### ✨ 新機能
- feat(user): ユーザーサービスをキャッシュで強化し、メニューフィルタリングロジックをリファクタリング ([#655](https://github.com/mineadmin/mineadmin/pull/655)) ([dc501ca](https://github.com/mineadmin/mineadmin/commit/dc501ca91c84293169e51631a25e5f02e7a57192))

### 🐛 バグ修正
- fix(issue-template): バグレポートテンプレートのcomposerコマンドをプロジェクト名に合わせて修正 ([#658](https://github.com/mineadmin/mineadmin/pull/658)) ([c57753e](https://github.com/mineadmin/mineadmin/commit/c57753e3f547683dc3e14836c3563a51ba4edaee))
- fix: .env.exampleのAPP_URLフォーマットを修正し、.gitignoreにstorage/uploadsを含めるように更新 ([#648](https://github.com/mineadmin/mineadmin/pull/648)) ([012853e](https://github.com/mineadmin/mineadmin/commit/012853e71ae2da8ac3905c715dc9412365f925e0))

### 📚 ドキュメント
- docs(README): 英語のmdの記述誤りを修正し、QQグループリンクをクリック可能な形式に更新 ([#654](https://github.com/mineadmin/mineadmin/pull/654)) ([4139090](https://github.com/mineadmin/mineadmin/commit/4139090a67245cc3321da875a2956dd720c255b2))

### ♻️ コードリファクタリング
- refactor(repository): リストインターフェースメソッドをリファクタリング ([#651](https://github.com/mineadmin/mineadmin/pull/651)) ([4261b4b](https://github.com/mineadmin/mineadmin/commit/4261b4b06bf1e09af9e33979f46da7d436148095))

### 🔧 その他
- chore(workbench): クイックエントリルート表示ロジックを最適化 ([#643](https://github.com/mineadmin/mineadmin/pull/643)) ([805b92d](https://github.com/mineadmin/mineadmin/commit/805b92dc48b1f0182f47c640b8730b5582ef4143))
- ci(swoole): テストマトリックスでswoole 6.xバージョンのカバレッジを拡張 ([#652](https://github.com/mineadmin/mineadmin/pull/652)) ([95e5788](https://github.com/mineadmin/mineadmin/commit/95e578866e79d2d09fcaeacefdb93a3fb2796c50))

## [v3.0.3] - 2025-06-13

### 🐛 バグ修正
- fix: MINE_ACCESS_TOKENチェック状態のヒントメッセージを追加 ([#646](https://github.com/mineadmin/mineadmin/pull/646)) ([c60a937](https://github.com/mineadmin/mineadmin/commit/c60a9374c8c20ff3e0622b3e12dac5da602033e1))

### ♻️ コードリファクタリング
- refactor: PassportServiceの依存を削除し、UserControllerのログインメソッドを更新して簡素化 ([#647](https://github.com/mineadmin/mineadmin/pull/647)) ([86e883e](https://github.com/mineadmin/mineadmin/commit/86e883ea629459dfb5eac158e172da8084ca07b4))

## [v3.0.2] - 2025-05-29

### 🐛 バグ修正
- fix: 最新eleバージョンのel-link APIに適応 ([f194d8f](https://github.com/mineadmin/mineadmin/commit/f194d8f2c3cf7b61da23c48142deedd7b10ad3dd))
- fix: Swowパッケージ参照のバグを修正 ([66e0fb6](https://github.com/mineadmin/mineadmin/commit/66e0fb6f225a81df22a488b2ed7cca08ea448d4f))

### 📚 ドキュメント
- docs(README): コントリビューターグラフリンクを更新 ([#626](https://github.com/mineadmin/mineadmin/pull/626)) ([d9bf462](https://github.com/mineadmin/mineadmin/commit/d9bf46280101bacc64edc4d0670c2f1469d079bf))

## [v3.0.1] - 2025-01-08

### ✨ 新機能
- feat(plugin): フロントエンドプラグインにloginBeforeフックを追加し、ログインリクエスト前の送信ログインデータを処理可能に ([040a1f6](https://github.com/mineadmin/mineadmin/commit/040a1f6b75a72a1bd8e38d1e472639426ce7425c))
- feat(app-store): プラグイン詳細ページで最新バージョン、互換バージョン、デモリンクを表示する機能をサポート ([#601](https://github.com/mineadmin/mineadmin/pull/601)) ([1edebfc](https://github.com/mineadmin/mineadmin/commit/1edebfc5c789dbb7cfd0476010c3a619172ac33d))
- feat: Vueをリモートでロードしてレンダリングする機能を追加 ([559fe56](https://github.com/mineadmin/mineadmin/commit/559fe5624d1be42b9f4da292262d7d727d332121))
- feat(ma-dict-picker): チェックボックス、ラジオ、セレクトコンポーネントのdisabled属性レンダリングをサポート ([#599](https://github.com/mineadmin/mineadmin/pull/599)) ([2cfef12](https://github.com/mineadmin/mineadmin/commit/2cfef1257fb4d300bac601487f946b9672ed8fd9))
- feat: ポートとプロセスを高速で終了するファイルを追加 ([991c0b3](https://github.com/mineadmin/mineadmin/commit/991c0b3eb3f4bddfd5502af28f0d267afa6b51ae))
- feat(result): アカウント無効化関連のエラーハンドリングと国際化サポートを追加 ([#593](https://github.com/mineadmin/mineadmin/pull/593)) ([7f24cb4](https://github.com/mineadmin/mineadmin/commit/7f24cb46524edc522ecdfca2bd01fb2e5f6d90e1))
- feat(download): Base64ファイルのダウンロード機能を追加 ([#592](https://github.com/mineadmin/mineadmin/pull/592)) ([2aa7003](https://github.com/mineadmin/mineadmin/commit/2aa7003d374d0c75626c0084cd391556e1537664))
- feat:(component) 新しいma-select-tableコンポーネントを追加 ([#587](https://github.com/mineadmin/mineadmin/pull/587)) ([e7586e7](https://github.com/mineadmin/mineadmin/commit/e7586e73a7f403bd724938da001d1bf8e30d2d2b))
- feat: フロントエンド言語監視の初期化を初回に行う ([#585](https://github.com/mineadmin/mineadmin/pull/585)) ([d831aef](https://github.com/mineadmin/mineadmin/commit/d831aef2860425c982bb61287ba588b1b997d1da))
- feat(user): UserRequestにパスワード検証ルールを追加 ([#580](https://github.com/mineadmin/mineadmin/pull/580)) ([c814e19](https://github.com/mineadmin/mineadmin/commit/c814e19a0f67419fef61fbd3a817ffd1552f2a90))
- feat: リクエスト動的ルールマッチングクラスActionRulesTraitを追加 ([#579](https://github.com/mineadmin/mineadmin/pull/579)) ([af439bb](https://github.com/mineadmin/mineadmin/commit/af439bb781483b6a9c3a288e266bd54a0cc10488))
- feat: mineadmin/searchを1.0.31バージョンにアップグレード ([67701e8](https://github.com/mineadmin/mineadmin/commit/67701e8257eaaac885764a9dc22199d7fa8fc633))
- feat(download): ファイルダウンロード処理を最適化 ([#574](https://github.com/mineadmin/mineadmin/pull/574)) ([bbbb130](https://github.com/mineadmin/mineadmin/commit/bbbb130135fc97d9e83066ed6a82b82be1a48dea))
- feat: ユーザー権限処理を強化し、アカウント状態チェックを追加 ([#573](https://github.com/mineadmin/mineadmin/pull/573)) ([aa508ba](https://github.com/mineadmin/mineadmin/commit/aa508ba7aaa25bdb6cfc2bbbc976caf7b84e154e))
- feat: 'ツールバー設定'構成情報を追加し、ユーザーデータテーブルに保存 ([#571](https://github.com/mineadmin/mineadmin/pull/571)) ([1625566](https://github.com/mineadmin/mineadmin/commit/1625566a55ca3c1cf4273320f4fab8330f544f27))
- feat:(ma-col-card) 新しいカードリストコンポーネントを追加 ([bd54161](https://github.com/mineadmin/mineadmin/commit/bd54161aae8436990233c390c5713f09f3abb192))
- feat: ma-formを1.0.25に更新 ([#534](https://github.com/mineadmin/mineadmin/pull/534)) ([7e6c18a](https://github.com/mineadmin/mineadmin/commit/7e6c18a2b52710e5832fa9992d07f544f1fec83e))

### 🐛 バグ修正
- fix(login): ユーザーログイン後に言語マークが設定されず、デフォルトで英語になるバグを修正 ([eb4615b](https://github.com/mineadmin/mineadmin/commit/eb4615b4745fbdef168cd5a9783ee3bb60e6d814))
- fix(icons): アイコン生成コマンドで`inquirer`ライブラリが不足しているエラーを修正 ([1123bf4](https://github.com/mineadmin/mineadmin/commit/1123bf45a9984dc517393509b0882426fbbb6cbe))
- fix(ma-select-table): 単一行/複数行選択状態判定エラーを修正し、選択判定の安全性を強化 ([#610](https://github.com/mineadmin/mineadmin/pull/610)) ([8e5436f](https://github.com/mineadmin/mineadmin/commit/8e5436f8d69273aa7cf5f7dbb00feebb244defcf))
- fix(menu-form): メニュー管理ページのレンダリング中に再帰更新問題を修正 ([#605](https://github.com/mineadmin/mineadmin/pull/605)) ([58c6873](https://github.com/mineadmin/mineadmin/commit/58c6873bf04d8fa811bc156644885ded6cb525b4))
- fix(MaDictSelect): el-option-groupグループオプションレンダリング、混合オプションをサポート ([#604](https://github.com/mineadmin/mineadmin/pull/604)) ([8288988](https://github.com/mineadmin/mineadmin/commit/8288988c51ee529f8171f6d47c44425ddd14574e))
- fix: mineadmin/searchのstyle.cssを復元 ([e26abba](https://github.com/mineadmin/mineadmin/commit/e26abba6658967937d1b2c6e129905d30c686525))
- fix: ma-dict-selectコンポーネントを復元 ([805a6ab](https://github.com/mineadmin/mineadmin/commit/805a6ab7b94eb834fd18e72948c88c1b0d6ab716))
- fix: ma-formがchildren設定項目をサポートした後、コンポーネントのデフォルトスロットパラメータが失われ、render関数内のjsx構文の子コンポーネントがレンダリングされない問題を修正し、ma-searchがma-formの一部の問題と互換性を持つように修正 ([6f09d93](https://github.com/mineadmin/mineadmin/commit/6f09d939721edbba750b545cf668efe61f62f549))
- fix: README-en.md ([daa15a3](https://github.com/mineadmin/mineadmin/commit/daa15a33e23c6d600821fd36ef639227ca3d6e9c))
- fix(menu): 子メニューがすべて非表示の場合に親メニューがクリックできない問題を修正 ([#595](https://github.com/mineadmin/mineadmin/pull/595)) ([0644922](https://github.com/mineadmin/mineadmin/commit/064492263501646210a2537c9ca4c24ba148259a))
- fix: キャッシュ取得ロジックエラーがデフォルト値を返さない問題 ([#589](https://github.com/mineadmin/mineadmin/pull/589)) ([198f8f1](https://github.com/mineadmin/mineadmin/commit/198f8f15c603edf681986518248186a476e5526d))
- fix: ActionRulesTraitにPHPStan無視ディレクティブを追加 ([719a755](https://
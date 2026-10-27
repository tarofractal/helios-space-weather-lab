# HELIOSをGitHubに公開する手順

このZIPは、2026年10月27日に公開サイトのソースから書き出したコピーです。
ZIPを展開すると `helios-space-weather-lab` フォルダができます。
元サイトのGit履歴やリモート接続情報は含まれていません。

## 1. ソースコードをGitHubへ載せる

1. ZIPをダウンロードして展開します。
2. https://desktop.github.com/ からGitHub Desktopをインストールし、自分のGitHubアカウントでサインインします。
3. GitHub Desktopで **File → Add Local Repository…** を選びます。
4. **Choose…** で、展開した `helios-space-weather-lab` フォルダを指定します。`package.json` と `README.md` が入っているフォルダです。
5. Gitリポジトリではないという表示が出たら、**create a repository** のリンクをクリックします。名前は `helios-space-weather-lab`、保存先は選択済みの場所を使い、作成されるフォルダのパスが既存フォルダと一致していることを確認します。
6. READMEの自動作成はオフ、Git ignoreは **None**、Licenseは **None** のまま **Create Repository** を押します。既存のREADMEと.gitignoreを使います。
7. Changesに未コミットのファイルが残っていれば、Summaryに `Initial release of HELIOS` と入力して **Commit to main** を押します。作成時に初回コミットができている場合、この操作は不要です。
8. 上部の **Publish repository** をクリックします。
9. Nameを `helios-space-weather-lab`、Descriptionを下記の文章にします。
10. 一般公開するため **Keep this code private** のチェックを外し、個人アカウントで **Publish Repository** を押します。
11. **Repository → View on GitHub** で公開結果を確認します。

Description（コピー用）:

> Interactive space-weather platform with real observations, CME propagation models, and historical event replay.

リポジトリのURLは `https://github.com/自分のユーザー名/helios-space-weather-lab` です。

## 2. GitHubから実際のサイトにアクセスできるようにする

GitHubのリポジトリ右側 **About** の歯車を押し、Websiteに以下を登録します。

https://helios-space-weather-lab-taro.tarofractal.chatgpt.site/?view=overview

READMEにも同じデモURLを入れています。GitHubにコードがあるだけではサイトのホスティング先は変わりません。

## 3. GitHub Pagesを設定しない理由

このアプリには `app/api/` のサーバー処理、Cloudflare D1の研究ノート保存、ChatGPT経由の認証があります。GitHub Pagesは静的ファイル用のため、現状のアプリをそのまま全機能付きで動かすことはできません。

今回の構成は「ソースコードはGitHub」「動くデモは現在のSites」です。Pages設定は不要です。

将来Cloudflare Workersなどへ独立配備する場合は、D1の作成とマイグレーション、配備設定、認証の再構築が必要です。外部公開した環境で利用者が送った `oai-authenticated-user-id` ヘッダーをそのまま信用してはいけません。現在の認証はSitesの管理された入口を前提とします。

## 4. 今後の更新

このGitHubリポジトリと、現在のSitesの配備は自動同期しません。

自分のPCでこのフォルダを編集した場合、GitHub Desktopで変更を確認し、Summary → Commit to main → Push originの順でGitHubを更新します。

現在のSitesで編集した場合は、変更後のソースを改めて反映する必要があります。GitHub側とSites側を同時に別々に編集しないよう、変更の元を一つに決めて管理します。

## 公式手順

- GitHub Desktopで既存プロジェクトを公開: https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop
- ローカルリポジトリを追加: https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-a-repository-from-your-local-computer-to-github-desktop
- GitHub Pagesの制約: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

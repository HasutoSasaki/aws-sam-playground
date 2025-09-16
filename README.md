# AWS SAM Playground

AWS SAM (Serverless Application Model) を使用したサーバーレスアプリケーションの開発・学習用プロジェクトです。

## 📋 概要

このプロジェクトは、TypeScriptで記述されたLambda関数とAPI Gatewayを組み合わせたシンプルなサーバーレスアプリケーションのサンプルです。AWS SAMを使用したローカル開発からデプロイまでの一連の流れを学習できます。

## 🚀 クイックスタート

### 前提条件

- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- [Node.js 22](https://nodejs.org/en/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [AWS CLI](https://aws.amazon.com/cli/) (設定済み)

### セットアップ

1. プロジェクトをクローン
   ```bash
   git clone <repository-url>
   cd aws-sam-playground
   ```

2. プロジェクトディレクトリに移動
   ```bash
   cd sam-playground
   ```

3. ビルドとデプロイ
   ```bash
   sam build
   sam deploy --guided
   ```

### ローカル開発

ローカルでAPIサーバーを起動：
```bash
sam local start-api
```

別ターミナルでテスト：
```bash
curl http://localhost:3000/hello
```

## 📁 プロジェクト構造

```
aws-sam-playground/
├── sam-playground/           # SAMアプリケーション
│   ├── hello-world/         # Lambda関数 (TypeScript)
│   │   ├── app.ts          # メインハンドラー
│   │   ├── package.json    # 依存関係
│   │   └── tests/          # ユニットテスト
│   ├── events/             # テストイベント
│   ├── template.yaml       # SAMテンプレート
│   └── samconfig.toml      # SAM設定
├── SAM_DEVELOPMENT_GUIDE.md # 詳細な開発ガイド
└── README.md               # このファイル
```

## 📚 ドキュメント

詳細な開発手順については、[SAM開発ガイド](./SAM_DEVELOPMENT_GUIDE.md) をご覧ください。

## 🛠️ 主要コマンド

| コマンド | 説明 |
|---------|------|
| `sam build` | アプリケーションのビルド |
| `sam local start-api` | ローカルAPIサーバー起動 |
| `sam local invoke HelloWorldFunction --event events/event.json` | 関数の単体テスト |
| `sam deploy` | AWSへのデプロイ |
| `sam logs -n HelloWorldFunction --tail` | ログの監視 |
| `sam delete` | リソースの削除 |

## 🧪 テスト

```bash
cd sam-playground/hello-world
npm install
npm run test
```

## 🔧 開発のヒント

- **ローカル開発**: `sam local start-api` でローカル環境でAPIをテスト
- **ログ監視**: `sam logs` コマンドでCloudWatch Logsを確認
- **デバッグ**: IDE のデバッガーやX-Rayトレーシングを活用
- **環境分離**: `samconfig.toml` で環境別設定を管理

## 📖 学習リソース

- [AWS SAM 公式ドキュメント](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/)
- [AWS Lambda 開発者ガイド](https://docs.aws.amazon.com/lambda/latest/dg/)
- [サーバーレスアプリケーションリポジトリ](https://aws.amazon.com/serverless/serverlessrepo/)

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。
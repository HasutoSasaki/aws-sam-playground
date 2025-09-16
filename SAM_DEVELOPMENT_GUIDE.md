# AWS SAM 開発ガイド

このドキュメントは AWS SAM (Serverless Application Model) を使用したサーバーレスアプリケーションの開発手順を説明します。

## 前提条件

以下のツールがインストールされている必要があります：

- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- [Node.js 22](https://nodejs.org/en/) (npm を含む)
- [Docker Desktop](https://hub.docker.com/search/?type=edition&offering=community)
- [AWS CLI](https://aws.amazon.com/cli/)

## プロジェクト構造

```
sam-playground/
├── hello-world/          # Lambda 関数のソースコード (TypeScript)
│   ├── app.ts           # メインの Lambda ハンドラー
│   ├── package.json     # Node.js の依存関係
│   └── tests/          # ユニットテスト
├── events/              # テスト用のイベントファイル
│   └── event.json      # API Gateway のテストイベント
├── template.yaml        # SAM テンプレート（AWS リソース定義）
└── samconfig.toml      # SAM の設定ファイル
```

## 開発フロー

### 1. 初期セットアップ

新しい環境で初回セットアップを行う場合：

```bash
cd sam-playground
sam build
sam deploy --guided
```

`sam deploy --guided` では以下の項目を設定します：
- **Stack Name**: CloudFormation スタック名
- **AWS Region**: デプロイ先リージョン
- **Confirm changes before deploy**: デプロイ前の変更確認
- **Allow SAM CLI IAM role creation**: IAM ロール作成の許可
- **Save arguments to samconfig.toml**: 設定の保存

### 2. ローカル開発

#### ビルド

```bash
sam build
```

TypeScript のコンパイルと依存関係の解決を行います。

#### ローカルでの関数テスト

単一の関数をテストイベントで実行：

```bash
sam local invoke HelloWorldFunction --event events/event.json
```

#### API Gateway の起動

ローカルでAPIサーバーを起動（ポート3000）：

```bash
sam local start-api
```

別ターミナルでテスト：

```bash
curl http://localhost:3000/hello
```

#### ログの監視

デプロイ済みの関数のログをリアルタイムで監視：

```bash
sam logs -n HelloWorldFunction --stack-name sam-playground --tail
```

### 3. テスト

#### ユニットテスト実行

```bash
cd hello-world
npm install
npm run test
```

#### 統合テスト

API Gateway + Lambda の統合テスト：

```bash
# ローカルAPIを起動
sam local start-api

# 別ターミナルでテスト実行
curl -i http://localhost:3000/hello
```

### 4. デプロイ

#### 開発環境へのデプロイ

設定済みの場合は簡単にデプロイ可能：

```bash
sam build
sam deploy
```

#### ステージング/プロダクション環境

環境別の設定ファイルを使用：

```bash
sam deploy --config-env staging
sam deploy --config-env production
```

### 5. 新機能の追加

#### 新しい Lambda 関数の追加

1. `template.yaml` に新しいリソースを追加：

```yaml
Resources:
  NewFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: new-function/
      Handler: app.lambdaHandler
      Runtime: nodejs22.x
      Events:
        Api:
          Type: Api
          Properties:
            Path: /new-endpoint
            Method: get
```

2. 対応するディレクトリとコードを作成
3. ビルドとテストを実行

#### 環境変数の設定

```yaml
Resources:
  HelloWorldFunction:
    Type: AWS::Serverless::Function
    Properties:
      Environment:
        Variables:
          ENV_VAR_NAME: value
```

#### 依存関係の追加

```bash
cd hello-world
npm install --save new-dependency
```

### 6. デバッグ

#### CloudWatch Logs

```bash
sam logs -n HelloWorldFunction --stack-name sam-playground
```

#### X-Ray トレーシング

`template.yaml` に追加：

```yaml
Globals:
  Function:
    Tracing: Active
```

### 7. クリーンアップ

開発環境のリソースを削除：

```bash
sam delete --stack-name sam-playground
```

## ベストプラクティス

### セキュリティ

- IAM ロールは最小権限の原則に従う
- 機密情報は AWS Systems Manager Parameter Store や AWS Secrets Manager を使用
- API Gateway で認証・認可を適切に設定

### パフォーマンス

- Lambda 関数のコールドスタート対策
- 適切なメモリサイズの設定
- 不要な依存関係の除去

### 監視

- CloudWatch メトリクスの活用
- アラームの設定
- X-Ray によるトレーシング

### コスト最適化

- 不要なリソースの定期的な削除
- Lambda 関数のタイムアウト設定の最適化
- API Gateway の使用量監視

## トラブルシューティング

### よくある問題

1. **ビルドエラー**: 依存関係の確認とNode.jsバージョンの確認
2. **デプロイエラー**: IAM権限とCloudFormationスタックの状態確認
3. **ローカル実行エラー**: Dockerの起動状態確認

### デバッグ手順

1. `sam build` でビルドエラーの確認
2. `sam local invoke` でローカル実行テスト
3. CloudWatch Logs でエラーログの確認
4. AWS CloudFormation コンソールでスタック状態の確認

## 参考リンク

- [AWS SAM 開発者ガイド](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/)
- [SAM CLI コマンドリファレンス](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html)
- [AWS Serverless Application Repository](https://aws.amazon.com/serverless/serverlessrepo/)
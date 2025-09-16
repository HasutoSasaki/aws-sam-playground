# AWS SAM 開発ガイド - Todo API

このドキュメントは AWS SAM (Serverless Application Model) を使用したTodo管理APIの開発手順を説明します。

## 前提条件

以下のツールがインストールされている必要があります：

- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- [Node.js 22](https://nodejs.org/en/) (npm を含む)
- [Docker Desktop](https://hub.docker.com/search/?type=edition&offering=community)
- [AWS CLI](https://aws.amazon.com/cli/)

## プロジェクト構造

```
sam-playground/
├── sam/                     # SAMプロジェクトディレクトリ
│   ├── todo-api/
│   │   ├── shared/          # 共通ライブラリ（Lambda Layer）
│   │   │   ├── package.json # DSQL/PostgreSQL依存関係
│   │   │   └── index.js     # データベース接続クライアント
│   │   └── functions/       # Lambda関数群
│   │       ├── get-todos/   # GET /todos
│   │       ├── create-todo/ # POST /todos
│   │       ├── update-todo/ # PUT /todos/{id}
│   │       └── delete-todo/ # DELETE /todos/{id}
│   ├── events/              # テスト用のイベントファイル
│   ├── template.yml         # SAM テンプレート（環境切り替え対応）
│   ├── docker-compose.yml   # ローカル開発用PostgreSQL
│   ├── init-db.sql         # 初期データ投入
│   └── samconfig.toml      # SAM の設定ファイル
└── README_TODO_API.md      # Todo API使用手順
```

## 開発フロー

### 1. 初期セットアップ

#### ローカル開発環境

```bash
cd sam-playground/sam

# PostgreSQL起動（ローカルDB）
docker-compose up -d

# 接続確認
docker-compose exec postgres psql -U admin -d todoapp -c "SELECT * FROM todos;"
```

#### AWS環境初回セットアップ

```bash
cd sam-playground/sam

# 開発環境デプロイ
sam build --parameter-overrides Environment=dev
sam deploy --parameter-overrides Environment=dev --guided

# 本番環境デプロイ（Aurora DSQL作成）
sam build --parameter-overrides Environment=prod  
sam deploy --parameter-overrides Environment=prod --guided
```

**環境パラメータ**：
- `Environment=local`: ローカル開発（PostgreSQL使用、Aurora DSQL作成なし）
- `Environment=dev`: 開発環境（Aurora DSQL作成）
- `Environment=prod`: 本番環境（Aurora DSQL作成）

### 2. ローカル開発

#### ビルド

```bash
cd sam-playground/sam

# ローカル環境用ビルド
sam build --parameter-overrides Environment=local
```

共通ライブラリ（Layer）と各Lambda関数をビルドします。

#### ローカルでの関数テスト

単一の関数をテストイベントで実行：

```bash
# Todo一覧取得テスト
sam local invoke GetTodosFunction --parameter-overrides Environment=local

# Todo作成テスト（イベントファイル使用）
sam local invoke CreateTodoFunction --event events/create-todo.json --parameter-overrides Environment=local
```

#### API Gateway の起動

ローカルでAPIサーバーを起動（ポート3000）：

```bash
# 重要：PostgreSQLが起動していることを確認
docker-compose ps

# API起動
sam local start-api --parameter-overrides Environment=local
```

#### 完全なTodo API検証

別ターミナルでCRUD操作をテスト：

```bash
# 1. Todo一覧取得
curl http://localhost:3000/todos

# 2. Todo作成
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "SAMローカルテスト",
    "description": "ローカル環境での検証",
    "status": "pending"
  }'

# 3. ステータスフィルタ
curl "http://localhost:3000/todos?status=pending&limit=10"

# 4. Todo更新（IDは作成時のレスポンスから取得）
curl -X PUT http://localhost:3000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'

# 5. Todo削除
curl -X DELETE http://localhost:3000/todos/1
```

#### ログの監視

デプロイ済みの関数のログをリアルタイムで監視：

```bash
sam logs -n GetTodosFunction --stack-name <your-stack-name> --tail
sam logs -n CreateTodoFunction --stack-name <your-stack-name> --tail
```

### 3. テスト

#### データベース接続テスト

```bash
# PostgreSQL接続確認
docker-compose exec postgres psql -U admin -d todoapp -c "\dt"

# 初期データ確認
docker-compose exec postgres psql -U admin -d todoapp -c "SELECT * FROM todos;"
```

#### Lambda Layer ビルドテスト

```bash
# 共通ライブラリのビルド確認
sam build --parameter-overrides Environment=local

# ビルド結果確認
ls -la .aws-sam/build/DBClientLayer/
```

#### 統合テスト完全フロー

```bash
# 1. 環境準備
docker-compose up -d
sam build --parameter-overrides Environment=local

# 2. API起動
sam local start-api --parameter-overrides Environment=local

# 3. 全APIエンドポイントテスト（別ターミナル）
# GET /todos
curl -v http://localhost:3000/todos

# POST /todos 
curl -v -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "統合テスト", "status": "pending"}'

# PUT /todos/{id}
curl -v -X PUT http://localhost:3000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'

# DELETE /todos/{id}
curl -v -X DELETE http://localhost:3000/todos/1
```

#### エラーケーステスト

```bash
# 不正なJSONテスト
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"invalid": json}'

# 存在しないIDテスト
curl -X GET http://localhost:3000/todos/999

# バリデーションエラーテスト
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "", "status": "invalid"}'
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
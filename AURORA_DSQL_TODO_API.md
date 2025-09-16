# Aurora DSQL Todo API

Aurora DSQLを使用したサーバーレスTodo管理APIです。

## 🏗️ アーキテクチャ

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Gateway   │───▶│  Lambda Functions │───▶│  Aurora DSQL    │
│                 │    │  - GET /todos     │    │    Cluster      │
│   REST API      │    │  - POST /todos    │    │                 │
│   CORS enabled  │    │  - PUT /todos/{id}│    │ PostgreSQL-     │
│                 │    │  - DELETE /todos  │    │ compatible DB   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📁 プロジェクト構造

```
todo-api/
├── shared/
│   ├── package.json          # DSQLクライアント依存関係
│   └── dsql-client.js        # 共通DSQLクライアントライブラリ
├── functions/
│   ├── get-todos/
│   │   └── index.js         # GET /todos (一覧取得)
│   ├── create-todo/
│   │   └── index.js         # POST /todos (作成)
│   ├── update-todo/
│   │   └── index.js         # PUT /todos/{id} (更新)
│   └── delete-todo/
│       └── index.js         # DELETE /todos/{id} (削除)
└── todo-template.yaml        # SAMテンプレート
```

## 🚀 デプロイ手順

### 前提条件

- AWS CLI設定済み
- SAM CLI インストール済み
- Node.js 22 インストール済み
- Aurora DSQLが利用可能なリージョン（us-east-1など）

### 1. デプロイ実行

```bash
cd /Users/sasakihasuto/develop/aws-sam-playground

# SAMテンプレートを使用してビルド
sam build -t todo-template.yaml

# ガイド付きデプロイ
sam deploy -t todo-template.yaml --guided
```

### 2. デプロイ時の設定

```
Stack Name: todo-api-stack
AWS Region: us-east-1  # Aurora DSQLが利用可能なリージョン
Parameter ClusterName: my-todo-cluster
Confirm changes before deploy: Y
Allow SAM CLI IAM role creation: Y
Save parameters to samconfig.toml: Y
```

### 3. デプロイ確認

デプロイ完了後、出力される情報を確認：

```bash
# API Gateway エンドポイント
TodoApi = https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/Prod/

# Aurora DSQL クラスター情報
DSQLClusterEndpoint = https://xxxxxxxxxx.dsql.us-east-1.on.aws:443
```

## 📋 API エンドポイント

### GET /todos
Todo一覧を取得

**クエリパラメータ:**
- `status`: フィルタ条件 (`pending`, `in_progress`, `completed`)
- `limit`: 取得件数上限 (デフォルト: 50)
- `offset`: オフセット (デフォルト: 0)

**レスポンス例:**
```json
{
  "todos": [
    {
      "id": 1,
      "title": "サンプルタスク",
      "description": "説明文",
      "status": "pending",
      "created_at": "2023-12-01T00:00:00.000Z",
      "updated_at": "2023-12-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### POST /todos
新しいTodoを作成

**リクエストボディ:**
```json
{
  "title": "新しいタスク",
  "description": "詳細説明（任意）",
  "status": "pending"
}
```

### PUT /todos/{id}
既存のTodoを更新

**リクエストボディ:**
```json
{
  "title": "更新されたタスク",
  "description": "更新された説明",
  "status": "completed"
}
```

### DELETE /todos/{id}
Todoを削除

**レスポンス:**
```json
{
  "message": "Todo deleted successfully",
  "deletedTodo": { /* 削除されたTodoの情報 */ }
}
```

## 🧪 テスト方法

### 1. ローカルテスト（※Aurora DSQLは実際のクラスターが必要）

```bash
# ビルド
sam build -t todo-template.yaml

# ローカルAPI起動は、Aurora DSQLクラスターが存在する場合のみ可能
# sam local start-api -t todo-template.yaml
```

### 2. デプロイ済みAPIのテスト

```bash
# API Gatewayエンドポイントを環境変数に設定
export API_ENDPOINT="https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/Prod"

# Todo作成
curl -X POST $API_ENDPOINT/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "テストタスク",
    "description": "Aurora DSQLのテスト",
    "status": "pending"
  }'

# Todo一覧取得
curl -X GET $API_ENDPOINT/todos

# 特定ステータスでフィルタ
curl -X GET "$API_ENDPOINT/todos?status=pending&limit=10"

# Todo更新（IDは作成時のレスポンスから取得）
curl -X PUT $API_ENDPOINT/todos/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'

# Todo削除
curl -X DELETE $API_ENDPOINT/todos/1
```

## 🗄️ データベーススキーマ

```sql
CREATE TABLE todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_created_at ON todos(created_at);
```

## 🔧 主な機能

### Aurora DSQLクライアント
- **自動認証**: IAM認証トークンの自動生成
- **接続プール**: 効率的なデータベース接続管理
- **エラーハンドリング**: 詳細なログとエラー処理
- **スキーマ初期化**: 自動的なテーブル作成

### Lambda関数
- **バリデーション**: 入力データの検証
- **CORS対応**: フロントエンドからのアクセス対応
- **ページネーション**: 大量データの効率的な取得
- **トランザクション**: データ整合性の保証

## 💡 運用のヒント

### モニタリング
- CloudWatch Logsでエラーログを確認
- X-Rayトレーシングで性能分析
- API Gatewayメトリクスで使用状況監視

### スケーリング
- Aurora DSQLは自動スケーリング
- Lambda関数も自動スケーリング
- 追加の設定不要

### セキュリティ
- IAMロールベースの認証
- VPC設定は不要（Aurora DSQLはマネージド）
- API Gatewayレベルでの認証も追加可能

## 🧹 クリーンアップ

リソースを削除する場合：

```bash
sam delete --stack-name todo-api-stack
```

**注意**: Aurora DSQLクラスターは別途削除が必要な場合があります。

## 📚 参考リンク

- [Aurora DSQL Documentation](https://docs.aws.amazon.com/aurora-dsql/)
- [AWS SAM Developer Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/)
- [Lambda Node.js Runtime](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)
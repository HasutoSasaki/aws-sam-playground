# ローカル開発ガイド - Aurora DSQL Todo API

Aurora DSQLは完全にローカルで動作させることはできませんが、PostgreSQLを使って同等の開発環境を構築できます。

## 🚫 Aurora DSQLの制限

- **クラウド専用サービス**: ローカル版やDockerイメージは存在しない
- **AWS認証必須**: IAMロールとクラスターエンドポイントが必要
- **オフライン動作不可**: インターネット接続とAWSリソースが必須

## ✅ ローカル開発の解決策

### 1. PostgreSQL + Docker Compose

Aurora DSQLはPostgreSQL互換なので、ローカルではPostgreSQLを使用します。

### 2. セットアップ手順

```bash
# Docker Composeでローカル環境起動
cd /Users/sasakihasuto/develop/aws-sam-playground
docker-compose up -d

# PostgreSQL接続確認
docker-compose exec postgres psql -U admin -d todoapp -c "\dt"
```

### 3. Lambda関数の修正（環境切り替え対応）

各Lambda関数で環境を切り替えられるようにします：

```javascript
// 環境に応じてクライアントを切り替え
const { getDBClient } = require('/opt/local-client');

exports.handler = async (event) => {
  const dbClient = getDBClient(); // 自動で環境判定
  
  // 既存のロジックはそのまま使用可能
  await dbClient.initializeSchema();
  const result = await dbClient.query('SELECT * FROM todos');
  // ...
};
```

### 4. ローカル実行

```bash
# 環境変数設定
export IS_LOCAL=true
export LOCAL_DB_HOST=localhost
export LOCAL_DB_PORT=5432
export LOCAL_DB_NAME=todoapp
export LOCAL_DB_USER=admin
export LOCAL_DB_PASSWORD=password

# SAM Localで起動
sam build -t todo-template.yaml
sam local start-api -t todo-template.yaml
```

### 5. テスト実行

```bash
# ローカルAPIテスト
curl -X GET http://localhost:3000/todos

curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "ローカルテスト", "status": "pending"}'
```

## 🔄 開発フロー

### 1. **ローカル開発**
- Docker Compose でPostgreSQL起動
- SAM Localでローカル実行・テスト
- 高速な開発サイクル

### 2. **統合テスト**
- Aurora DSQLクラスターにデプロイ
- 実環境での動作確認
- パフォーマンステスト

### 3. **本番デプロイ**
- Aurora DSQLでの本番運用
- マルチリージョン構成
- 運用監視

## 📝 設定ファイル例

### docker-compose.yml
```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: todoapp
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
```

### samconfig.toml (ローカル用)
```toml
[local]
stack_name = "todo-api-local"
s3_bucket = ""
s3_prefix = ""
region = "us-east-1"
capabilities = "CAPABILITY_IAM"
parameter_overrides = "Environment=local"
```

## 🛠️ 便利なコマンド

```bash
# PostgreSQL起動
docker-compose up -d

# ログ確認
docker-compose logs -f postgres

# データベース直接接続
docker-compose exec postgres psql -U admin -d todoapp

# 環境停止
docker-compose down

# データ含めて削除
docker-compose down -v
```

## ⚡ 開発効率化

### Hot Reload
SAM Localはコード変更を自動検知してリロードします。

### データベースGUI
pgAdminやTablePlusでGUIアクセス可能：
- Host: localhost
- Port: 5432  
- Database: todoapp
- User: admin
- Password: password

### テストデータ
init-db.sqlでサンプルデータを自動投入済み。

## 🚀 本番移行

ローカルで開発完了後：

1. `IS_LOCAL=false` に設定
2. Aurora DSQLクラスター作成
3. SAMテンプレートでデプロイ
4. 同じコードがそのまま動作

この方法で、Aurora DSQLの特徴を活かしつつ効率的なローカル開発が可能です！
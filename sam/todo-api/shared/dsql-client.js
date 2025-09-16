const { Client } = require('pg');
const { DSQLSigner } = require('@aws-sdk/dsql-signer');

class DSQLClient {
  constructor() {
    this.client = null;
    this.signer = new DSQLSigner({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  async connect() {
    if (this.client && !this.client.connectionParameters.ending) {
      return this.client;
    }

    const endpoint = process.env.DSQL_CLUSTER_ENDPOINT;
    if (!endpoint) {
      throw new Error('DSQL_CLUSTER_ENDPOINT environment variable is required');
    }

    try {
      // Generate authentication token
      const token = await this.signer.getDbConnectAdminAuthToken({
        endpoint: endpoint,
        region: process.env.AWS_REGION || 'us-east-1'
      });

      // Create PostgreSQL client with DSQL configuration
      this.client = new Client({
        host: endpoint.replace('https://', '').replace(':443', ''),
        port: 5432,
        database: 'postgres',
        user: 'admin',
        password: token,
        ssl: {
          rejectUnauthorized: true
        },
        connectionTimeoutMillis: 30000,
        query_timeout: 30000
      });

      await this.client.connect();
      console.log('Connected to Aurora DSQL');
      return this.client;
    } catch (error) {
      console.error('Failed to connect to Aurora DSQL:', error);
      throw error;
    }
  }

  async query(text, params = []) {
    try {
      const client = await this.connect();
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      console.error('Query failed:', error);
      throw error;
    }
  }

  async transaction(callback) {
    const client = await this.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.end();
        console.log('Disconnected from Aurora DSQL');
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
      this.client = null;
    }
  }

  async initializeSchema() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
      CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
    `;

    try {
      await this.query(createTableQuery);
      console.log('Database schema initialized successfully');
    } catch (error) {
      console.error('Failed to initialize schema:', error);
      throw error;
    }
  }
}

// Singleton instance
let dsqlClient = null;

function getDSQLClient() {
  if (!dsqlClient) {
    dsqlClient = new DSQLClient();
  }
  return dsqlClient;
}

module.exports = {
  DSQLClient,
  getDSQLClient
};
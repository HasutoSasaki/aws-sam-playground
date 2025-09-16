const { getDBClient } = require('/opt/index');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Environment variables:', {
      IS_LOCAL: process.env.IS_LOCAL,
      AWS_SAM_LOCAL: process.env.AWS_SAM_LOCAL,
      DSQL_CLUSTER_ENDPOINT: process.env.DSQL_CLUSTER_ENDPOINT ? 'Set' : 'Not set'
    });
    
    const dbClient = getDBClient();
    
    // Initialize schema if needed (idempotent operation)
    await dbClient.initializeSchema();
    
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const status = queryParams.status;
    const limit = parseInt(queryParams.limit) || 50;
    const offset = parseInt(queryParams.offset) || 0;

    // Build query
    let query = 'SELECT * FROM todos';
    let params = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    // Execute query
    const result = await dbClient.query(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM todos';
    let countParams = [];
    
    if (status) {
      countQuery += ' WHERE status = $1';
      countParams.push(status);
    }
    
    const countResult = await dbClient.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    const response = {
      todos: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
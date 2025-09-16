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
      AWS_SAM_LOCAL: process.env.AWS_SAM_LOCAL
    });
    
    const dbClient = getDBClient();
    
    // Initialize schema if needed (idempotent operation)
    await dbClient.initializeSchema();
    
    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid JSON in request body',
          message: parseError.message 
        })
      };
    }

    // Validate required fields
    const { title, description, status = 'pending' } = body;
    
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Validation error',
          message: 'Title is required and must be a non-empty string' 
        })
      };
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Validation error',
          message: `Status must be one of: ${validStatuses.join(', ')}` 
        })
      };
    }

    // Insert new todo
    const query = `
      INSERT INTO todos (title, description, status)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const params = [
      title.trim(),
      description || null,
      status
    ];

    const result = await dbClient.query(query, params);
    const newTodo = result.rows[0];

    console.log('Created todo:', newTodo);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Todo created successfully',
        todo: newTodo
      })
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
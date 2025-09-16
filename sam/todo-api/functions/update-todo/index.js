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
    
    const dbClient = getDBClient();
    
    // Get todo ID from path parameters
    const todoId = event.pathParameters?.id;
    if (!todoId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing todo ID',
          message: 'Todo ID is required in the path' 
        })
      };
    }

    // Validate ID is a number
    const id = parseInt(todoId);
    if (isNaN(id) || id <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid todo ID',
          message: 'Todo ID must be a positive integer' 
        })
      };
    }

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

    const { title, description, status } = body;

    // Validate that at least one field is provided
    if (!title && description === undefined && !status) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Validation error',
          message: 'At least one field (title, description, status) must be provided' 
        })
      };
    }

    // Validate status if provided
    if (status) {
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
    }

    // Validate title if provided
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Validation error',
          message: 'Title must be a non-empty string' 
        })
      };
    }

    // Check if todo exists
    const checkQuery = 'SELECT id FROM todos WHERE id = $1';
    const checkResult = await dbClient.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Todo not found',
          message: `Todo with ID ${id} does not exist` 
        })
      };
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCounter = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCounter++}`);
      params.push(title.trim());
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCounter++}`);
      params.push(description);
    }

    if (status !== undefined) {
      updates.push(`status = $${paramCounter++}`);
      params.push(status);
    }

    // Always update the updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add the ID parameter for WHERE clause
    params.push(id);

    const updateQuery = `
      UPDATE todos 
      SET ${updates.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await dbClient.query(updateQuery, params);
    const updatedTodo = result.rows[0];

    console.log('Updated todo:', updatedTodo);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Todo updated successfully',
        todo: updatedTodo
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
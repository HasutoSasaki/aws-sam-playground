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

    // Check if todo exists and get its details before deletion
    const selectQuery = 'SELECT * FROM todos WHERE id = $1';
    const selectResult = await dbClient.query(selectQuery, [id]);
    
    if (selectResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Todo not found',
          message: `Todo with ID ${id} does not exist` 
        })
      };
    }

    const todoToDelete = selectResult.rows[0];

    // Delete the todo
    const deleteQuery = 'DELETE FROM todos WHERE id = $1';
    await dbClient.query(deleteQuery, [id]);

    console.log('Deleted todo:', todoToDelete);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Todo deleted successfully',
        deletedTodo: todoToDelete
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
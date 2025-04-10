/**
 * MCP Database Integration 
 * 
 * This file provides a wrapper around the MCP database functionality
 * for the Reddit Agent application.
 */

// Note: In a real Cursor implementation, the actual mcp__query function 
// would be available directly from the environment. This is a stub for 
// compatibility with the development environment.

/**
 * Execute a SQL query against the MCP database
 * @param {string} sql - SQL query to execute
 * @returns {Promise<Array>} - Query results
 */
async function mcp__query(sql) {
  // This function would normally be provided by the Cursor environment
  // For local development and testing, we'll log the query
  console.log(`[MCP] Executing query: ${sql}`);
  
  // In the actual implementation, Cursor/MCP would execute this query
  // and return the results
  
  // This is a mock implementation for development
  if (typeof global.mcp__query === 'function') {
    return global.mcp__query(sql);
  }
  
  // Return an empty array as a fallback
  console.log('[MCP] Returning mock empty result (MCP not available)');
  return [];
}

/**
 * Initialize the database schema for the Reddit Agent
 * Creates tables for subreddits, posts, and comments if they don't exist
 * @returns {Promise<boolean>} - Success status
 */
async function initDatabaseSchema() {
  try {
    // Create subreddits table
    await mcp__query(`
      CREATE TABLE IF NOT EXISTS subreddits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT,
        subscribers INTEGER,
        created_utc INTEGER,
        over18 INTEGER,
        url TEXT,
        icon_img TEXT,
        last_updated INTEGER
      )
    `);
    
    // Create posts table
    await mcp__query(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        subreddit_id TEXT NOT NULL,
        title TEXT NOT NULL,
        author TEXT,
        created_utc INTEGER,
        score INTEGER,
        upvote_ratio REAL,
        num_comments INTEGER,
        permalink TEXT,
        url TEXT,
        is_self INTEGER,
        selftext TEXT,
        last_updated INTEGER,
        FOREIGN KEY (subreddit_id) REFERENCES subreddits(id)
      )
    `);
    
    // Create comments table
    await mcp__query(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        parent_id TEXT NOT NULL,
        author TEXT,
        body TEXT,
        created_utc INTEGER,
        score INTEGER,
        permalink TEXT,
        last_updated INTEGER,
        FOREIGN KEY (post_id) REFERENCES posts(id)
      )
    `);
    
    console.log('[MCP] Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('[MCP] Error initializing database schema:', error);
    return false;
  }
}

/**
 * Get subreddits from the database
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of results to return
 * @param {number} options.offset - Number of results to skip
 * @returns {Promise<Array>} - Array of subreddits
 */
async function getSubreddits({ limit = 10, offset = 0 } = {}) {
  try {
    const results = await mcp__query(`
      SELECT * FROM subreddits
      ORDER BY subscribers DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
    
    return results;
  } catch (error) {
    console.error('[MCP] Error fetching subreddits:', error);
    return [];
  }
}

/**
 * Get posts from a specific subreddit
 * @param {string} subredditId - ID of the subreddit
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of results to return
 * @param {number} options.offset - Number of results to skip
 * @param {string} options.sortBy - Field to sort by (created_utc, score, num_comments)
 * @param {string} options.sortOrder - Sort order (ASC, DESC)
 * @returns {Promise<Array>} - Array of posts
 */
async function getSubredditPosts(subredditId, { limit = 25, offset = 0, sortBy = 'created_utc', sortOrder = 'DESC' } = {}) {
  try {
    // Validate sort parameters to prevent SQL injection
    const validSortFields = ['created_utc', 'score', 'num_comments', 'title'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (!validSortFields.includes(sortBy)) {
      sortBy = 'created_utc';
    }
    
    if (!validSortOrders.includes(sortOrder)) {
      sortOrder = 'DESC';
    }
    
    const results = await mcp__query(`
      SELECT * FROM posts
      WHERE subreddit_id = '${subredditId.replace(/'/g, "''")}'
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ${limit} OFFSET ${offset}
    `);
    
    return results;
  } catch (error) {
    console.error(`[MCP] Error fetching posts for subreddit ${subredditId}:`, error);
    return [];
  }
}

/**
 * Get comments for a specific post
 * @param {string} postId - ID of the post
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of results to return
 * @param {number} options.offset - Number of results to skip
 * @returns {Promise<Array>} - Array of comments
 */
async function getPostComments(postId, { limit = 100, offset = 0 } = {}) {
  try {
    const results = await mcp__query(`
      SELECT * FROM comments
      WHERE post_id = '${postId.replace(/'/g, "''")}'
      ORDER BY score DESC, created_utc DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
    
    return results;
  } catch (error) {
    console.error(`[MCP] Error fetching comments for post ${postId}:`, error);
    return [];
  }
}

/**
 * Search for posts matching a query
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {string} options.subredditId - Optional subreddit ID to limit search to
 * @param {number} options.limit - Maximum number of results to return
 * @param {number} options.offset - Number of results to skip
 * @returns {Promise<Array>} - Array of matching posts
 */
async function searchPosts(query, { subredditId = null, limit = 25, offset = 0 } = {}) {
  try {
    // Clean the search query to prevent SQL injection
    const safeQuery = query.replace(/'/g, "''");
    
    let sql = `
      SELECT * FROM posts
      WHERE (title LIKE '%${safeQuery}%' OR selftext LIKE '%${safeQuery}%')
    `;
    
    if (subredditId) {
      sql += ` AND subreddit_id = '${subredditId.replace(/'/g, "''")}'`;
    }
    
    sql += `
      ORDER BY score DESC, created_utc DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const results = await mcp__query(sql);
    
    return results;
  } catch (error) {
    console.error(`[MCP] Error searching posts for "${query}":`, error);
    return [];
  }
}

module.exports = {
  mcp__query,
  initDatabaseSchema,
  getSubreddits,
  getSubredditPosts,
  getPostComments,
  searchPosts
}; 
/**
 * MCP Database Integration 
 * 
 * This file provides a wrapper around the MCP database functionality
 * for the Reddit Agent application.
 */

const { Pool } = require('pg');
const dbConfig = require('./db');

// Create a connection pool
const pool = new Pool(dbConfig);

// Test the database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Successfully connected to the database');
    release();
  }
});

/**
 * Execute a SQL query using the MCP database connection
 * @param {string} sql - The SQL query to execute
 * @param {Array} params - Query parameters (optional)
 * @returns {Promise} - Resolves with query results
 */
async function mcp__query(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Initialize the database schema
 */
async function initDatabaseSchema() {
  const createTables = `
    CREATE TABLE IF NOT EXISTS subreddits (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      subreddit_id INTEGER REFERENCES subreddits(id),
      title TEXT NOT NULL,
      content TEXT,
      url TEXT,
      author VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES posts(id),
      content TEXT NOT NULL,
      author VARCHAR(255),
      parent_id INTEGER REFERENCES comments(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await mcp__query(createTables);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  }
}

/**
 * Get all subreddits
 * @returns {Promise<Array>} List of subreddits
 */
async function getSubreddits() {
  return await mcp__query('SELECT * FROM subreddits ORDER BY name');
}

/**
 * Get posts from a specific subreddit
 * @param {string} subredditName - Name of the subreddit
 * @param {number} limit - Maximum number of posts to return
 * @param {number} offset - Number of posts to skip
 * @returns {Promise<Array>} List of posts
 */
async function getSubredditPosts(subredditName, limit = 10, offset = 0) {
  const query = `
    SELECT p.* FROM posts p
    JOIN subreddits s ON p.subreddit_id = s.id
    WHERE s.name = $1
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  return await mcp__query(query, [subredditName, limit, offset]);
}

/**
 * Get comments for a specific post
 * @param {number} postId - ID of the post
 * @param {number} limit - Maximum number of comments to return
 * @param {number} offset - Number of comments to skip
 * @returns {Promise<Array>} List of comments
 */
async function getPostComments(postId, limit = 50, offset = 0) {
  const query = `
    SELECT * FROM comments
    WHERE post_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;
  return await mcp__query(query, [postId, limit, offset]);
}

/**
 * Search for posts matching a query
 * @param {string} searchQuery - Search query
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<Array>} List of matching posts
 */
async function searchPosts(searchQuery, limit = 10) {
  const query = `
    SELECT p.*, s.name as subreddit_name
    FROM posts p
    JOIN subreddits s ON p.subreddit_id = s.id
    WHERE to_tsvector('english', p.title || ' ' || COALESCE(p.content, '')) @@ plainto_tsquery('english', $1)
    ORDER BY p.created_at DESC
    LIMIT $2
  `;
  return await mcp__query(query, [searchQuery, limit]);
}

// Clean up database connections when the application exits
process.on('exit', () => {
  pool.end();
});

module.exports = {
  mcp__query,
  initDatabaseSchema,
  getSubreddits,
  getSubredditPosts,
  getPostComments,
  searchPosts
}; 
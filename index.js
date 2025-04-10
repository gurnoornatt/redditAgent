/**
 * Reddit Agent - Main Application
 * 
 * This is the main entry point for the Reddit Agent application.
 * It handles initialization of the database and provides functions to
 * fetch and store data from Reddit.
 */

const { mcp__query, initDatabaseSchema, getSubreddits, getSubredditPosts, getPostComments, searchPosts } = require('./mcp');
const { fetchAndStoreSubreddit, fetchAndStorePosts, fetchAndStoreComments } = require('./reddit-api');

/**
 * Initialize the application
 * - Creates database tables if they don't exist
 * @returns {Promise<void>}
 */
async function initializeApp() {
  try {
    await initDatabaseSchema();
    console.log('[App] Database schema initialized successfully');
  } catch (error) {
    console.error('[App] Error initializing database schema:', error.message);
    throw error;
  }
}

/**
 * Add a subreddit to track
 * @param {string} subredditName - Name of the subreddit to add
 * @returns {Promise<Object>} - Subreddit data
 */
async function addSubreddit(subredditName) {
  try {
    return await fetchAndStoreSubreddit(subredditName);
  } catch (error) {
    console.error(`[App] Error adding subreddit ${subredditName}:`, error.message);
    throw error;
  }
}

/**
 * Fetch and store the latest posts from a subreddit
 * @param {string} subredditId - ID of the subreddit to fetch posts from
 * @param {Object} options - Options for fetching posts
 * @returns {Promise<Array>} - Array of post data
 */
async function updateSubredditPosts(subredditId, options = {}) {
  try {
    return await fetchAndStorePosts(subredditId, options);
  } catch (error) {
    console.error(`[App] Error updating posts for subreddit ${subredditId}:`, error.message);
    throw error;
  }
}

/**
 * Fetch and store comments for a post
 * @param {string} postId - ID of the post to fetch comments for
 * @param {Object} options - Options for fetching comments
 * @returns {Promise<Array>} - Array of comment data
 */
async function updatePostComments(postId, options = {}) {
  try {
    return await fetchAndStoreComments(postId, options);
  } catch (error) {
    console.error(`[App] Error updating comments for post ${postId}:`, error.message);
    throw error;
  }
}

/**
 * Update all tracked subreddits with the latest posts
 * @param {Object} options - Options for fetching posts
 * @returns {Promise<Object>} - Summary of updates
 */
async function updateAllSubreddits(options = {}) {
  try {
    const subreddits = await getSubreddits();
    
    if (!subreddits || subreddits.length === 0) {
      console.log('[App] No subreddits found to update');
      return { subredditsUpdated: 0, postsFound: 0 };
    }
    
    console.log(`[App] Updating ${subreddits.length} subreddits...`);
    
    let totalPosts = 0;
    
    for (const subreddit of subreddits) {
      const posts = await updateSubredditPosts(subreddit.id, options);
      totalPosts += posts.length;
      console.log(`[App] Updated ${posts.length} posts for r/${subreddit.name}`);
    }
    
    return { 
      subredditsUpdated: subreddits.length,
      postsFound: totalPosts
    };
  } catch (error) {
    console.error('[App] Error updating all subreddits:', error.message);
    throw error;
  }
}

/**
 * Example usage function that demonstrates how to use the Reddit Agent
 */
async function exampleUsage() {
  try {
    // Initialize the app
    await initializeApp();
    
    // Add subreddits to track
    console.log('\n--- Adding Subreddits ---');
    await addSubreddit('programming');
    await addSubreddit('javascript');
    
    // Get all tracked subreddits
    console.log('\n--- Tracked Subreddits ---');
    const subreddits = await getSubreddits();
    subreddits.forEach(sub => {
      console.log(`- r/${sub.name} (${sub.subscribers.toLocaleString()} subscribers)`);
    });
    
    // Update posts from all subreddits
    console.log('\n--- Updating Subreddit Posts ---');
    const updateResult = await updateAllSubreddits({ limit: 10, sort: 'hot' });
    console.log(`Updated ${updateResult.postsFound} posts from ${updateResult.subredditsUpdated} subreddits`);
    
    // Get posts from a specific subreddit
    console.log('\n--- Posts from r/programming ---');
    const programmingId = subreddits.find(s => s.name === 'programming').id;
    const posts = await getSubredditPosts(programmingId, { limit: 5 });
    posts.forEach((post, i) => {
      console.log(`${i+1}. ${post.title} (${post.score} points, ${post.num_comments} comments)`);
    });
    
    // Get comments for the first post
    if (posts.length > 0) {
      console.log('\n--- Updating Comments for First Post ---');
      const firstPost = posts[0];
      await updatePostComments(firstPost.id);
      
      console.log('\n--- Comments for First Post ---');
      const comments = await getPostComments(firstPost.id, { limit: 5 });
      comments.forEach((comment, i) => {
        console.log(`${i+1}. ${comment.author}: ${comment.body.substring(0, 100)}${comment.body.length > 100 ? '...' : ''}`);
      });
    }
    
    // Search for posts containing a keyword
    console.log('\n--- Searching for Posts ---');
    const searchResults = await searchPosts('javascript', { limit: 5 });
    searchResults.forEach((post, i) => {
      console.log(`${i+1}. ${post.title} (from r/${post.subreddit_name})`);
    });
    
  } catch (error) {
    console.error('[Example] Error running example:', error.message);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}

// Export public API
module.exports = {
  initializeApp,
  addSubreddit,
  updateSubredditPosts,
  updatePostComments,
  updateAllSubreddits,
  // Re-export database functions
  getSubreddits,
  getSubredditPosts,
  getPostComments,
  searchPosts
}; 
/**
 * Reddit API Integration
 * 
 * This module handles fetching data from the Reddit API and storing it in the database.
 */

const axios = require('axios');
const { mcp__query } = require('./mcp');

// Constants
const USER_AGENT = 'Mozilla/5.0 (compatible; RedditAgent/1.0; +https://www.redditagent.com)';
const API_BASE_URL = 'https://www.reddit.com';

/**
 * Create an API client for Reddit
 * @returns {Object} - Axios instance configured for Reddit API
 */
function createApiClient() {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'User-Agent': USER_AGENT
    },
    timeout: 10000
  });
}

/**
 * Fetch information about a subreddit and store it in the database
 * @param {string} subredditName - Name of the subreddit to fetch (without 'r/')
 * @returns {Promise<Object>} - Subreddit data
 */
async function fetchAndStoreSubreddit(subredditName) {
  if (!subredditName) {
    throw new Error('Subreddit name is required');
  }
  
  // Remove 'r/' prefix if included
  const cleanSubredditName = subredditName.replace(/^r\//, '');
  
  try {
    const apiClient = createApiClient();
    const response = await apiClient.get(`/r/${cleanSubredditName}/about.json`);
    
    const subredditData = response.data.data;
    
    // Prepare data for database
    const subreddit = {
      id: subredditData.name, // This is in the format 't5_xxxxxx'
      name: cleanSubredditName,
      display_name: subredditData.display_name,
      description: subredditData.description,
      subscribers: subredditData.subscribers,
      created_utc: subredditData.created_utc,
      over18: subredditData.over18 ? 1 : 0,
      url: subredditData.url,
      icon_img: subredditData.icon_img,
      last_updated: Math.floor(Date.now() / 1000)
    };
    
    // Insert or update in database
    await mcp__query(`
      INSERT OR REPLACE INTO subreddits 
      (id, name, display_name, description, subscribers, created_utc, over18, url, icon_img, last_updated)
      VALUES (
        '${subreddit.id}',
        '${subreddit.name.replace(/'/g, "''")}',
        '${subreddit.display_name.replace(/'/g, "''")}',
        '${(subreddit.description || '').replace(/'/g, "''")}',
        ${subreddit.subscribers},
        ${subreddit.created_utc},
        ${subreddit.over18},
        '${subreddit.url.replace(/'/g, "''")}',
        '${(subreddit.icon_img || '').replace(/'/g, "''")}',
        ${subreddit.last_updated}
      )
    `);
    
    console.log(`[Reddit API] Subreddit ${cleanSubredditName} fetched and stored`);
    
    return subreddit;
  } catch (error) {
    console.error(`[Reddit API] Error fetching subreddit ${cleanSubredditName}:`, error.message);
    throw error;
  }
}

/**
 * Fetch recent posts from a subreddit and store them in the database
 * @param {string} subredditId - ID of the subreddit (t5_xxxxxx format)
 * @param {Object} options - Options for fetching posts
 * @param {string} options.sort - Sort method ('new', 'hot', 'top', 'rising')
 * @param {string} options.timeframe - Timeframe for 'top' sort ('hour', 'day', 'week', 'month', 'year', 'all')
 * @param {number} options.limit - Maximum number of posts to fetch (max 100)
 * @returns {Promise<Array>} - Array of post data
 */
async function fetchAndStorePosts(subredditId, { sort = 'hot', timeframe = 'day', limit = 25 } = {}) {
  if (!subredditId) {
    throw new Error('Subreddit ID is required');
  }
  
  // Validate parameters
  const validSorts = ['hot', 'new', 'top', 'rising'];
  if (!validSorts.includes(sort)) {
    throw new Error(`Invalid sort parameter: ${sort}. Valid options are: ${validSorts.join(', ')}`);
  }
  
  const validTimeframes = ['hour', 'day', 'week', 'month', 'year', 'all'];
  if (sort === 'top' && !validTimeframes.includes(timeframe)) {
    throw new Error(`Invalid timeframe parameter: ${timeframe}. Valid options are: ${validTimeframes.join(', ')}`);
  }
  
  if (limit < 1 || limit > 100) {
    throw new Error('Limit must be between 1 and 100');
  }
  
  try {
    // Get subreddit name from ID
    const subredditResult = await mcp__query(`
      SELECT name FROM subreddits WHERE id = '${subredditId}'
    `);
    
    if (!subredditResult || subredditResult.length === 0) {
      throw new Error(`Subreddit with ID ${subredditId} not found in database`);
    }
    
    const subredditName = subredditResult[0].name;
    const apiClient = createApiClient();
    
    let endpoint = `/r/${subredditName}/${sort}.json?limit=${limit}`;
    if (sort === 'top') {
      endpoint += `&t=${timeframe}`;
    }
    
    const response = await apiClient.get(endpoint);
    const posts = response.data.data.children.map(child => child.data);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    // Process each post and store in database
    const processedPosts = [];
    for (const postData of posts) {
      const post = {
        id: postData.name, // This is in the format 't3_xxxxxx'
        subreddit_id: subredditId,
        title: postData.title,
        author: postData.author,
        created_utc: postData.created_utc,
        score: postData.score,
        upvote_ratio: postData.upvote_ratio,
        num_comments: postData.num_comments,
        permalink: postData.permalink,
        url: postData.url,
        is_self: postData.is_self ? 1 : 0,
        selftext: postData.selftext,
        last_updated: currentTimestamp
      };
      
      processedPosts.push(post);
      
      // Insert or update in database
      await mcp__query(`
        INSERT OR REPLACE INTO posts 
        (id, subreddit_id, title, author, created_utc, score, upvote_ratio, num_comments, permalink, url, is_self, selftext, last_updated)
        VALUES (
          '${post.id}',
          '${post.subreddit_id}',
          '${post.title.replace(/'/g, "''")}',
          '${(post.author || '[deleted]').replace(/'/g, "''")}',
          ${post.created_utc},
          ${post.score},
          ${post.upvote_ratio},
          ${post.num_comments},
          '${post.permalink.replace(/'/g, "''")}',
          '${post.url.replace(/'/g, "''")}',
          ${post.is_self},
          '${(post.selftext || '').replace(/'/g, "''")}',
          ${post.last_updated}
        )
      `);
    }
    
    console.log(`[Reddit API] ${processedPosts.length} posts fetched and stored for r/${subredditName}`);
    
    return processedPosts;
  } catch (error) {
    console.error(`[Reddit API] Error fetching posts for subreddit ${subredditId}:`, error.message);
    throw error;
  }
}

/**
 * Fetch comments for a post and store them in the database
 * @param {string} postId - ID of the post (t3_xxxxxx format)
 * @param {Object} options - Options for fetching comments
 * @param {string} options.sort - Sort method ('confidence', 'top', 'new', 'controversial', 'old', 'random', 'qa')
 * @returns {Promise<Array>} - Array of comment data
 */
async function fetchAndStoreComments(postId, { sort = 'confidence' } = {}) {
  if (!postId) {
    throw new Error('Post ID is required');
  }
  
  // Validate parameters
  const validSorts = ['confidence', 'top', 'new', 'controversial', 'old', 'random', 'qa'];
  if (!validSorts.includes(sort)) {
    throw new Error(`Invalid sort parameter: ${sort}. Valid options are: ${validSorts.join(', ')}`);
  }
  
  try {
    // Get post info from database
    const postResult = await mcp__query(`
      SELECT posts.id, subreddits.name AS subreddit_name 
      FROM posts 
      JOIN subreddits ON posts.subreddit_id = subreddits.id
      WHERE posts.id = '${postId}'
    `);
    
    if (!postResult || postResult.length === 0) {
      throw new Error(`Post with ID ${postId} not found in database`);
    }
    
    const postInfo = postResult[0];
    const apiClient = createApiClient();
    
    // Extract the post ID without the 't3_' prefix
    const postIdShort = postId.replace('t3_', '');
    
    // Reddit API endpoint for comments
    const endpoint = `/r/${postInfo.subreddit_name}/comments/${postIdShort}.json?sort=${sort}`;
    
    const response = await apiClient.get(endpoint);
    const commentData = response.data[1].data.children;
    
    // Process comments recursively
    const allComments = [];
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    /**
     * Process a comment and its replies
     * @param {Object} comment - Comment data from API
     * @param {string} parent - Parent ID for this comment
     */
    function processComment(comment, parent) {
      if (comment.kind !== 't1') return; // Skip if not a comment
      
      const data = comment.data;
      
      // Skip deleted comments
      if (data.author === '[deleted]' && data.body === '[deleted]') return;
      
      const commentObj = {
        id: data.name, // This is in the format 't1_xxxxxx'
        post_id: postId,
        parent_id: parent,
        author: data.author,
        body: data.body,
        created_utc: data.created_utc,
        score: data.score,
        permalink: data.permalink,
        last_updated: currentTimestamp
      };
      
      allComments.push(commentObj);
      
      // Process replies recursively
      if (data.replies && data.replies.data && data.replies.data.children) {
        data.replies.data.children.forEach(reply => {
          processComment(reply, data.name);
        });
      }
    }
    
    // Process all top-level comments
    commentData.forEach(comment => {
      processComment(comment, postId);
    });
    
    // Store all comments in database
    for (const comment of allComments) {
      await mcp__query(`
        INSERT OR REPLACE INTO comments 
        (id, post_id, parent_id, author, body, created_utc, score, permalink, last_updated)
        VALUES (
          '${comment.id}',
          '${comment.post_id}',
          '${comment.parent_id}',
          '${(comment.author || '[deleted]').replace(/'/g, "''")}',
          '${comment.body.replace(/'/g, "''")}',
          ${comment.created_utc},
          ${comment.score},
          '${(comment.permalink || '').replace(/'/g, "''")}',
          ${comment.last_updated}
        )
      `);
    }
    
    console.log(`[Reddit API] ${allComments.length} comments fetched and stored for post ${postId}`);
    
    return allComments;
  } catch (error) {
    console.error(`[Reddit API] Error fetching comments for post ${postId}:`, error.message);
    throw error;
  }
}

module.exports = {
  fetchAndStoreSubreddit,
  fetchAndStorePosts,
  fetchAndStoreComments
}; 
# Reddit Insight

Reddit Insight is an AI-powered content analysis tool that helps content creators discover trending topics, pain points, and content opportunities by analyzing Reddit conversations. The application scrapes Reddit data, performs natural language processing to identify user pain points, and generates content ideas for platforms like TikTok and Instagram.

## Features

- **Reddit Data Collection**: Scrape Reddit subreddits to gather post and comment data
- **Pain Point Extraction**: Automatically identify user problems and needs from text
- **Content Idea Generation**: Generate creative content ideas for TikTok and Instagram
- **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS

## System Requirements

- Node.js 18.0.0 or later
- Python 3.8 or later
- npm or yarn

## Project Structure

The project consists of two main parts:

- **Frontend**: Next.js application with React 19 and Tailwind CSS
- **Backend**: Flask API with Reddit scraping and NLP functionality

## Setup and Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/redditagent.git
cd redditagent
```

### 2. Set up environment variables

Copy the example environment variables file and update it with your credentials:

```bash
cp .env.example .env
```

Edit the `.env` file to add your:
- Secure API token
- Firecrawl API key (if using)
- Supabase credentials (if using)

### 3. Install frontend dependencies

```bash
npm install
```

### 4. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

## Running the Application

### 1. Start the backend server

From the project root:

```bash
cd backend
python app.py
```

This will start the Flask server on http://localhost:5000.

### 2. Start the frontend development server

In a new terminal, from the project root:

```bash
npm run dev
```

This will start the Next.js development server on http://localhost:3000.

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Click "Launch App" to access the agent interface
3. Enter a subreddit name (e.g., "productivity", "ADHD", "marketing")
4. Click "Analyze" to process the subreddit and generate content ideas
5. View the results in the different tabs:
   - **Insights**: Summary of the analysis
   - **Pain Points**: Extracted user problems and needs
   - **Content Ideas**: Generated content ideas for TikTok and Instagram

## API Documentation

The backend exposes several API endpoints:

- `GET /api/health`: Check if the API is running
- `POST /api/generate-content`: Generate content ideas from a subreddit
- `GET /api/subreddit-info`: Get information about a subreddit
- `GET /api/pain-points`: Get pain points from a subreddit

All API requests (except health check) require authentication with a Bearer token.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# Reddit Agent MCP Integration

This project integrates the Reddit agent with Cursor's MCP (Model Control Panel) database, allowing you to store and retrieve data from Reddit.

## Overview

The MCP integration module provides a convenient interface for interacting with the database to store and retrieve:
- Subreddit information
- Reddit posts
- Post comments

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- Access to Cursor's MCP functionality

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```

## Using the MCP Integration

The `mcp-integration.js` module exports several functions for interacting with the database:

### Saving Data

```javascript
const mcp = require('./mcp-integration');

// Save a subreddit
const subreddit = {
  name: 'programming',
  description: 'Computer Programming',
  subscribers: 4582000
};
const savedSubreddit = await mcp.saveSubreddit(subreddit);

// Save a post
const post = {
  id: 't3_abcdefg',
  subreddit_id: savedSubreddit.id,
  title: 'Understanding async/await in JavaScript',
  url: 'https://reddit.com/r/programming/comments/abcdefg',
  author: 'js_developer',
  score: 1250,
  upvote_ratio: 0.95,
  num_comments: 73,
  created_utc: 1630000000,
  selftext: 'Post content...',
  is_self: true,
  is_video: false
};
const savedPost = await mcp.savePost(post);

// Save a comment
const comment = {
  id: 't1_xyz123',
  post_id: savedPost.id,
  parent_id: null, // null for top-level comments
  author: 'helpful_programmer',
  body: 'Comment content...',
  score: 245,
  created_utc: 1630001000
};
await mcp.saveComment(comment);
```

### Retrieving Data

```javascript
// Get posts from a subreddit
const posts = await mcp.getPostsBySubreddit('programming', 10); // Get up to 10 posts

// Get comments for a post
const comments = await mcp.getCommentsForPost(savedPost.id, 20); // Get up to 20 comments
```

## Database Schema

The MCP integration uses the following tables:

### Subreddits Table
```sql
CREATE TABLE IF NOT EXISTS subreddits (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subscribers INTEGER
)
```

### Posts Table
```sql
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY,
  reddit_id TEXT NOT NULL,
  subreddit_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  author TEXT,
  score INTEGER,
  upvote_ratio REAL,
  num_comments INTEGER,
  created_utc INTEGER,
  selftext TEXT,
  is_self BOOLEAN,
  is_video BOOLEAN,
  FOREIGN KEY (subreddit_id) REFERENCES subreddits (id)
)
```

### Comments Table
```sql
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY,
  reddit_id TEXT NOT NULL,
  post_id INTEGER NOT NULL,
  parent_id INTEGER,
  author TEXT,
  body TEXT,
  score INTEGER,
  created_utc INTEGER,
  FOREIGN KEY (post_id) REFERENCES posts (id),
  FOREIGN KEY (parent_id) REFERENCES comments (id)
)
```

## Example Usage

See the provided `mcp-usage-example.js` file for a complete demonstration of how to use the MCP integration.

To run the example:
```
node mcp-usage-example.js
```

## Error Handling

All functions in the MCP integration module return promises that can throw errors. It's recommended to use try/catch blocks when calling these functions:

```javascript
try {
  const posts = await mcp.getPostsBySubreddit('programming');
  console.log(`Found ${posts.rows.length} posts`);
} catch (error) {
  console.error('Error retrieving posts:', error);
}
```

## License

MIT

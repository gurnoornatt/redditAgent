
-- Drop tables if they exist
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS subreddits;

-- Create subreddits table
CREATE TABLE subreddits (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  subscribers INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create posts table
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  reddit_id VARCHAR(50) UNIQUE NOT NULL,
  subreddit_id INTEGER REFERENCES subreddits(id),
  title TEXT NOT NULL,
  url TEXT,
  author VARCHAR(255),
  score INTEGER DEFAULT 0,
  upvote_ratio FLOAT,
  num_comments INTEGER DEFAULT 0,
  created_utc BIGINT,
  content TEXT,
  is_self BOOLEAN,
  is_video BOOLEAN,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create comments table
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  reddit_id VARCHAR(50) UNIQUE NOT NULL,
  post_id INTEGER REFERENCES posts(id),
  parent_id VARCHAR(50),
  author VARCHAR(255),
  body TEXT,
  score INTEGER DEFAULT 0,
  created_utc BIGINT,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX idx_posts_reddit_id ON posts(reddit_id);
CREATE INDEX idx_posts_subreddit_id ON posts(subreddit_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_reddit_id ON comments(reddit_id);
      
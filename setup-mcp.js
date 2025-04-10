#!/usr/bin/env node

/**
 * Script to set up Firecrawl MCP integration for Cursor
 * 
 * This script helps set up the Firecrawl MCP server configuration for Cursor.
 * It creates the necessary configuration file in the appropriate location.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execSync } = require('child_process');
const { exec } = require('child_process');

// Configuration
const API_KEY = process.env.FIRECRAWL_API_KEY || 'fc-5ba1db1bbf1d4bb39337b5e41d46cbb4';

// Determine the correct configuration path for Cursor based on OS
let configPath;
if (process.platform === 'darwin') {
  // macOS
  configPath = path.join(os.homedir(), 'Library', 'Application Support', 'Cursor', 'mcp_config.json');
} else if (process.platform === 'win32') {
  // Windows
  configPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Cursor', 'mcp_config.json');
} else {
  // Linux
  configPath = path.join(os.homedir(), '.config', 'Cursor', 'mcp_config.json');
}

// Create the Cursor configuration directory if it doesn't exist
const configDir = path.dirname(configPath);
if (!fs.existsSync(configDir)) {
  console.log(`Creating Cursor configuration directory at: ${configDir}`);
  fs.mkdirSync(configDir, { recursive: true });
}

// Check if the configuration file already exists
let existingConfig = {};
if (fs.existsSync(configPath)) {
  try {
    existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('Found existing Cursor MCP configuration.');
  } catch (error) {
    console.warn(`Error reading existing configuration: ${error.message}`);
    console.log('Creating a new configuration file.');
  }
}

// MCP configuration for Firecrawl
const mcpConfig = {
  "mcpServers": {
    ...(existingConfig.mcpServers || {}),
    "firecrawl-mcp": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": API_KEY,
        "FIRECRAWL_RETRY_MAX_ATTEMPTS": "5",
        "FIRECRAWL_RETRY_INITIAL_DELAY": "2000",
        "FIRECRAWL_RETRY_MAX_DELAY": "30000",
        "FIRECRAWL_RETRY_BACKOFF_FACTOR": "3"
      }
    }
  }
};

// Write the configuration file
try {
  fs.writeFileSync(configPath, JSON.stringify(mcpConfig, null, 2), 'utf8');
  console.log(`Successfully created Firecrawl MCP configuration at: ${configPath}`);
  
  // Diagnostic information
  console.log('\n✅ Firecrawl MCP Configuration Setup Complete');
  console.log('\nConfiguration Details:');
  console.log(`- API Key: ${API_KEY.slice(0, 4)}...${API_KEY.slice(-4)}`);
  console.log(`- Config Path: ${configPath}`);
  console.log('\nNext Steps:');
  console.log('1. Restart Cursor to apply the configuration');
  console.log('2. Start your backend server: cd backend && python app.py');
  console.log('3. Start your frontend server: npm run dev');
  console.log('\nTo verify the MCP server works, try running:');
  console.log('  env FIRECRAWL_API_KEY=' + API_KEY + ' npx -y firecrawl-mcp --help');
  
} catch (error) {
  console.error(`Error creating configuration: ${error.message}`);
  console.log('\nManual Setup Instructions:');
  console.log('1. Open Cursor Settings');
  console.log('2. Go to Features > MCP Servers');
  console.log('3. Click "+ Add new global MCP server"');
  console.log('4. Copy and paste the following configuration:');
  console.log(JSON.stringify(mcpConfig, null, 2));
}

// Try to detect Cursor installation
try {
  const cursorPath = execSync('which cursor').toString().trim();
  if (cursorPath) {
    console.log(`\nCursor detected at: ${cursorPath}`);
    console.log('Please restart Cursor to apply the configuration.');
  }
} catch (error) {
  // Cursor command not found or other error
  console.log(`\nCursor not detected in PATH. Please ensure Cursor is installed.`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}Setting up Cursor MCP integration...${colors.reset}`);

// Function to check if Cursor is installed
function checkCursorInstallation() {
  return new Promise((resolve) => {
    exec('which cursor', (error, stdout) => {
      if (error || !stdout) {
        console.log(`${colors.yellow}Cursor CLI not found. Please ensure Cursor is installed.${colors.reset}`);
        console.log(`${colors.yellow}You can download Cursor from: https://cursor.sh${colors.reset}`);
        resolve(false);
      } else {
        console.log(`${colors.green}Cursor found at: ${stdout.trim()}${colors.reset}`);
        resolve(true);
      }
    });
  });
}

// Function to set up the MCP database schema
function setupDatabaseSchema() {
  return new Promise((resolve) => {
    console.log(`${colors.blue}Setting up database schema for Cursor MCP...${colors.reset}`);
    
    const schemaPath = path.join(__dirname, 'backend', 'db', 'schema.sql');
    
    // Check if schema file exists
    if (!fs.existsSync(schemaPath)) {
      console.log(`${colors.red}Schema file not found at: ${schemaPath}${colors.reset}`);
      console.log(`${colors.yellow}Creating a basic schema file...${colors.reset}`);
      
      // Create directories if they don't exist
      const dbDir = path.join(__dirname, 'backend', 'db');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      // Basic schema with tables for posts and comments
      const basicSchema = `
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
      `;
      
      fs.writeFileSync(schemaPath, basicSchema);
      console.log(`${colors.green}Created schema file at: ${schemaPath}${colors.reset}`);
    } else {
      console.log(`${colors.green}Found existing schema file at: ${schemaPath}${colors.reset}`);
    }
    
    resolve(true);
  });
}

// Main function to run the setup
async function main() {
  try {
    const cursorInstalled = await checkCursorInstallation();
    
    if (!cursorInstalled) {
      console.log(`${colors.yellow}You can still use the application, but some features may be limited.${colors.reset}`);
    }
    
    await setupDatabaseSchema();
    
    console.log(`${colors.green}MCP integration setup completed successfully!${colors.reset}`);
    console.log(`${colors.blue}You can now use the full features of the application with Cursor MCP.${colors.reset}`);
    console.log(`${colors.blue}Make sure Cursor is running when you start the application.${colors.reset}`);
    
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error(`${colors.red}Error during setup:${colors.reset}`, error);
    rl.close();
    process.exit(1);
  }
}

main(); 
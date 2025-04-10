import json
import os
import requests
import logging
import time
from typing import Dict, Any, List

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.DEBUG,  # Change to DEBUG level
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
)
logger = logging.getLogger(__name__)

# The MCP function will be available in the global namespace when running in Cursor
mcp__firecrawl_scrape = globals().get('mcp__firecrawl_scrape')
if not mcp__firecrawl_scrape:
    logger.error("MCP function not found in global namespace")
    raise ImportError("MCP Firecrawl integration is required. Please ensure you're running in Cursor with MCP enabled.")
else:
    logger.info("Successfully found mcp__firecrawl_scrape in global namespace")

class FirecrawlScraper:
    def __init__(self, api_key=None):
        """Initialize the Firecrawl scraper with API key."""
        self.api_key = api_key or os.environ.get("FIRECRAWL_API_KEY")
        if not self.api_key:
            raise ValueError("Firecrawl API key is required. Please set FIRECRAWL_API_KEY environment variable.")
        logger.info("FirecrawlScraper initialized with API key")

    def scrape_subreddit(self, subreddit, max_pages=2, cache=True):
        """
        Scrape a subreddit using Firecrawl MCP.
        
        Args:
            subreddit: Name of the subreddit to scrape
            max_pages: Maximum number of pages to scrape
            cache: Whether to use cached data if available
        """
        cache_file = f"backend/data_{subreddit}.json"
        
        # Remove 'r/' prefix if present
        clean_subreddit = subreddit.replace('r/', '').strip()
        logger.debug(f"Scraping subreddit: r/{clean_subreddit}")
        
        # Check cache first if enabled
        if cache and os.path.exists(cache_file):
            logger.info(f"Found cache file for r/{clean_subreddit}")
            try:
                with open(cache_file, "r") as f:
                    cached_data = json.load(f)
                    logger.debug(f"Cache data loaded successfully: {len(cached_data.get('posts', []))} posts found")
                    return cached_data
            except Exception as e:
                logger.warning(f"Cache read failed for r/{clean_subreddit}: {str(e)}")
        
        # Prepare the Reddit URL
        url = f"https://www.reddit.com/r/{clean_subreddit}/hot/"
        logger.info(f"Fetching data from {url}")
        
        try:
            # Get the MCP function from the global namespace
            mcp_scrape = globals().get('mcp__firecrawl_scrape')
            if not mcp_scrape:
                raise ImportError("MCP function not available. Please run in Cursor with MCP enabled.")
            
            # Use the MCP function
            logger.debug("Calling mcp__firecrawl_scrape with parameters:")
            logger.debug(f"URL: {url}")
            logger.debug("Formats: ['markdown']")
            logger.debug("onlyMainContent: True")
            logger.debug("waitFor: 3000")
            
            reddit_data = mcp_scrape(
                url=url,
                formats=["markdown"],
                onlyMainContent=True,
                waitFor=3000,
                timeout=30000
            )
            
            logger.debug(f"Raw Firecrawl response: {json.dumps(reddit_data, indent=2)}")
            
            # Transform the data to our expected format
            processed_data = self.process_firecrawl_response(reddit_data, clean_subreddit)
            
            # Save to cache if enabled
            if cache and processed_data:
                os.makedirs(os.path.dirname(cache_file), exist_ok=True)
                with open(cache_file, "w") as f:
                    json.dump(processed_data, f, indent=2)
                logger.info(f"Cached data for r/{clean_subreddit}")
                
            return processed_data
            
        except Exception as e:
            logger.error(f"Error scraping r/{clean_subreddit}: {str(e)}", exc_info=True)
            raise  # Re-raise the exception instead of returning mock data

    def process_firecrawl_response(self, raw_data, subreddit):
        """Process the raw response from Firecrawl into our expected format."""
        logger.debug(f"Processing Firecrawl response for r/{subreddit}")
        
        processed_data = {
            "posts": [],
            "metadata": {
                "subreddit": subreddit,
                "pages_scraped": 1,
                "total_posts": 0
            }
        }
        
        try:
            if not raw_data:
                logger.error("Received empty response from Firecrawl")
                raise ValueError("Empty response from Firecrawl")
                
            if "content" not in raw_data or not raw_data["content"]:
                logger.error("No content field in Firecrawl response")
                raise ValueError("No content in Firecrawl response")
                
            # Extract the content from the Firecrawl response
            markdown_content = raw_data["content"][0].get("text", "")
            if not markdown_content:
                logger.error("No text content in Firecrawl response")
                raise ValueError("No text content in Firecrawl response")
                
            logger.debug(f"Raw markdown content length: {len(markdown_content)}")
            logger.debug(f"First 500 characters of content: {markdown_content[:500]}")
            
            # Parse the Markdown content to extract posts
            processed_data["posts"] = self.extract_posts_from_markdown(markdown_content, subreddit)
            processed_data["metadata"]["total_posts"] = len(processed_data["posts"])
            
            logger.info(f"Successfully processed {len(processed_data['posts'])} posts from r/{subreddit}")
            return processed_data
            
        except Exception as e:
            logger.error(f"Error processing Firecrawl response: {str(e)}", exc_info=True)
            raise

    def extract_posts_from_markdown(self, markdown_content, subreddit):
        """Extract posts from the Markdown content."""
        logger.debug(f"Extracting posts from markdown for r/{subreddit}")
        posts = []
        
        if not markdown_content or len(markdown_content.strip()) == 0:
            logger.error("Empty markdown content")
            raise ValueError("Empty markdown content")
            
        # Split the content into sections that might represent posts
        sections = markdown_content.split("\n## ")
        logger.debug(f"Found {len(sections)} potential post sections")
        
        for section_idx, section in enumerate(sections):
            try:
                # Skip empty sections
                if not section.strip():
                    continue
                    
                # The first section might not start with ##, handle it separately
                if section_idx == 0 and not section.startswith("## "):
                    title = "Main Content"
                    content = section
                else:
                    # Extract title and content
                    lines = section.split("\n")
                    title = lines[0].strip().replace("## ", "")
                    content = "\n".join(lines[1:]).strip()
                
                logger.debug(f"Processing post {section_idx + 1}: {title[:50]}...")
                
                # Create a post object
                post = {
                    "id": f"post_{section_idx}",
                    "title": title,
                    "content": content,
                    "url": f"https://www.reddit.com/r/{subreddit}/comments/{section_idx}",
                    "score": 100 - (section_idx * 10),
                    "comments": []
                }
                
                # Try to extract comments
                comment_blocks = content.split("\n### ")
                if len(comment_blocks) > 1:
                    post["content"] = comment_blocks[0].strip()
                    logger.debug(f"Found {len(comment_blocks) - 1} comments for post {section_idx + 1}")
                    
                    for comment_idx, comment_block in enumerate(comment_blocks[1:]):
                        comment_lines = comment_block.split("\n")
                        comment_title = comment_lines[0].strip()
                        comment_content = "\n".join(comment_lines[1:]).strip()
                        
                        comment = {
                            "id": f"comment_{section_idx}_{comment_idx}",
                            "content": f"{comment_title}: {comment_content}",
                            "score": 50 - (comment_idx * 5)
                        }
                        
                        post["comments"].append(comment)
                
                posts.append(post)
                
            except Exception as e:
                logger.error(f"Error processing section {section_idx}: {str(e)}", exc_info=True)
                continue
        
        logger.info(f"Successfully extracted {len(posts)} posts with {sum(len(p['comments']) for p in posts)} total comments")
        return posts

if __name__ == "__main__":
    # Basic test to see if the scraper is working
    scraper = FirecrawlScraper()
    for sub in ["autismparenting", "ADHDparenting", "dyslexia"]:
        logger.info(f"Testing scraper with r/{sub}")
        try:
            data = scraper.scrape_subreddit(sub)
            logger.info(f"Successfully scraped r/{sub}: {len(data.get('posts', []))} posts found")
        except Exception as e:
            logger.error(f"Failed to scrape r/{sub}: {str(e)}", exc_info=True) 
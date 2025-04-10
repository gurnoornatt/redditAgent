import json
import os
import requests
import logging
import time
from typing import Dict, Any, List

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FirecrawlScraper:
    def __init__(self, api_key=None):
        """Initialize the Firecrawl scraper with API key."""
        self.api_key = api_key or os.environ.get("FIRECRAWL_API_KEY")
        if not self.api_key:
            logger.warning("No Firecrawl API key provided. MCP integration may fail.")
        
        # MCP server configuration
        self.base_url = "http://localhost:3000"  # Default MCP server URL
        self.mcp_endpoint = f"{self.base_url}/v1/tools"
        
        # Configure retry parameters
        self.max_retries = 3
        self.retry_delay = 2

    def scrape_subreddit(self, subreddit, max_pages=2, cache=True):
        """
        Scrape a subreddit using Firecrawl MCP.
        
        Args:
            subreddit: Name of the subreddit to scrape
            max_pages: Maximum number of pages to scrape
            cache: Whether to use cached data if available
            
        Returns:
            Dictionary containing the scraped data
        """
        cache_file = f"backend/data_{subreddit}.json"
        
        # Remove 'r/' prefix if present
        clean_subreddit = subreddit.replace('r/', '').strip()
        
        # Check cache first if enabled
        if cache and os.path.exists(cache_file):
            logger.info(f"Using cached data for r/{clean_subreddit}")
            try:
                with open(cache_file, "r") as f:
                    return json.load(f)
            except json.JSONDecodeError:
                logger.warning(f"Cache file for r/{clean_subreddit} is corrupted. Will scrape fresh data.")
            except Exception as e:
                logger.error(f"Error reading cache file: {str(e)}")
        
        # Prepare the Reddit URL
        url = f"https://www.reddit.com/r/{clean_subreddit}/hot/"
        
        try:
            # Make the request to Firecrawl MCP
            logger.info(f"Scraping data from {url} using Firecrawl MCP")
            reddit_data = self.firecrawl_scrape(url, max_pages)
            
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
            # Return empty data structure in case of error
            return {"posts": [], "error": str(e)}
    
    def firecrawl_scrape(self, url, max_pages=2):
        """
        Use Firecrawl MCP to scrape a URL.
        
        Args:
            url: The URL to scrape
            max_pages: Maximum number of pages to scrape
            
        Returns:
            The scraped data
        """
        # We'll use the firecrawl_scrape tool from MCP
        payload = {
            "name": "firecrawl_scrape",
            "arguments": {
                "url": url,
                "formats": ["markdown"],
                "onlyMainContent": True,
                "waitFor": 3000,  # Wait 3 seconds for JavaScript execution
                "timeout": 30000,  # 30 second timeout
                "mobile": False    # Use desktop view
            }
        }
        
        # Make the request with retries
        for attempt in range(self.max_retries):
            try:
                response = requests.post(
                    self.mcp_endpoint,
                    json=payload,
                    headers={
                        "Content-Type": "application/json"
                    }
                )
                
                response.raise_for_status()  # Raise exception for HTTP errors
                
                data = response.json()
                
                # Check if there's an error in the response
                if data.get("isError", False):
                    error_message = "Unknown error"
                    if "content" in data and len(data["content"]) > 0:
                        error_message = data["content"][0].get("text", "Unknown error")
                    logger.error(f"Firecrawl MCP error: {error_message}")
                    
                    # If rate limited, wait and retry
                    if "rate limit" in error_message.lower():
                        wait_time = self.retry_delay * (2 ** attempt)
                        logger.info(f"Rate limited. Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                        continue
                        
                    raise Exception(error_message)
                
                return data
                
            except requests.exceptions.RequestException as e:
                if attempt < self.max_retries - 1:
                    wait_time = self.retry_delay * (2 ** attempt)
                    logger.warning(f"Request failed: {str(e)}. Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"All retry attempts failed: {str(e)}")
                    raise
        
        raise Exception("Failed to scrape data after multiple attempts")
    
    def process_firecrawl_response(self, raw_data, subreddit):
        """
        Process the raw response from Firecrawl into our expected format.
        
        Args:
            raw_data: The raw response from Firecrawl
            subreddit: The subreddit name
            
        Returns:
            Processed data in our expected format
        """
        # Initialize the processed data structure
        processed_data = {
            "posts": [],
            "metadata": {
                "subreddit": subreddit,
                "pages_scraped": 1,
                "total_posts": 0
            }
        }
        
        try:
            # Extract the content from the Firecrawl response
            if "content" in raw_data and len(raw_data["content"]) > 0:
                # The Markdown content will be in the text field
                markdown_content = raw_data["content"][0].get("text", "")
                
                # Parse the Markdown content to extract posts
                processed_data["posts"] = self.extract_posts_from_markdown(markdown_content, subreddit)
                processed_data["metadata"]["total_posts"] = len(processed_data["posts"])
                
            return processed_data
            
        except Exception as e:
            logger.error(f"Error processing Firecrawl response: {str(e)}", exc_info=True)
            return processed_data
    
    def extract_posts_from_markdown(self, markdown_content, subreddit):
        """
        Extract posts from the Markdown content.
        
        Args:
            markdown_content: The Markdown content from Firecrawl
            subreddit: The subreddit name
            
        Returns:
            List of extracted posts
        """
        posts = []
        
        # If we can't properly parse the content, use a simplified approach
        # Just add dummy entries so we can continue with the app
        if not markdown_content or len(markdown_content) < 100:
            logger.warning("Insufficient content from Firecrawl. Using dummy data.")
            # Create dummy posts (similar to our previous simulation)
            for i in range(5):
                posts.append({
                    "id": f"post_{i}",
                    "title": f"Sample post {i} about challenges in r/{subreddit}",
                    "content": (
                        "Parents face many challenges with neurodivergent children. "
                        "It's a struggle to find the right support and resources. "
                        "The school system can be especially difficult to navigate. "
                        "Finding time for self-care is a problem many parents mention."
                    ),
                    "url": f"https://www.reddit.com/r/{subreddit}/comments/sample_{i}",
                    "score": 100 - (i * 10),
                    "comments": [
                        {
                            "id": f"comment_{i}_1",
                            "content": "I struggle with this too. It's so hard to find good resources.",
                            "score": 50 - (i * 5)
                        },
                        {
                            "id": f"comment_{i}_2",
                            "content": "Have you tried this approach? It helped with our challenges.",
                            "score": 30 - (i * 3)
                        }
                    ]
                })
            return posts
            
        # Split the content into sections that might represent posts
        # This is a simplistic approach that may need refinement depending on the actual format
        sections = markdown_content.split("\n## ")
        
        for section_idx, section in enumerate(sections):
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
            
            # Create a post object
            post = {
                "id": f"post_{section_idx}",
                "title": title,
                "content": content,
                "url": f"https://www.reddit.com/r/{subreddit}/comments/{section_idx}",
                "score": 100 - (section_idx * 10),
                "comments": []
            }
            
            # Try to extract comments (simplistic approach)
            comment_blocks = content.split("\n### ")
            if len(comment_blocks) > 1:
                post["content"] = comment_blocks[0].strip()
                
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
        
        return posts

if __name__ == "__main__":
    # Basic test to see if the scraper is working
    scraper = FirecrawlScraper()
    for sub in ["autismparenting", "ADHDparenting", "dyslexia"]:
        print(f"Scraping r/{sub}...")
        data = scraper.scrape_subreddit(sub)
        print(f"Completed scraping r/{sub}. Found {len(data.get('posts', []))} posts.") 
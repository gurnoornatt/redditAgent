import json
import os
import requests  # Import requests
import logging
import time
from typing import Dict, Any, List
import re # Import re for markdown parsing fallback

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
)
logger = logging.getLogger(__name__)

# Reddit base URL
REDDIT_API_BASE = "https://www.reddit.com"
# Custom User-Agent
USER_AGENT = "RedditInsightApp/1.0 (by /u/YourRedditUsername)" # Replace with a descriptive user agent

class RedditScraper: # Renamed class to reflect its function
    def __init__(self):
        """Initialize the Reddit scraper with a requests session."""
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})
        logger.info("RedditScraper initialized with session")

    def _make_request(self, url: str) -> Dict[str, Any]:
        """Helper function to make requests to Reddit API."""
        try:
            logger.debug(f"Making request to: {url}")
            response = self.session.get(url, timeout=15) # Increased timeout
            response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
            
            # Handle potential rate limiting - basic delay
            if 'x-ratelimit-remaining' in response.headers and float(response.headers['x-ratelimit-remaining']) < 5:
                delay = float(response.headers.get('x-ratelimit-reset', 60)) / float(response.headers.get('x-ratelimit-used', 1))
                logger.warning(f"Approaching rate limit. Sleeping for {delay:.2f} seconds.")
                time.sleep(delay)
                
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed for {url}: {e}")
            raise  # Re-raise the exception

    def _fetch_comments(self, subreddit: str, post_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch top comments for a specific post."""
        comments_url = f"{REDDIT_API_BASE}/r/{subreddit}/comments/{post_id}.json?limit={limit}&sort=top"
        try:
            data = self._make_request(comments_url)
            if isinstance(data, list) and len(data) > 1 and 'data' in data[1] and 'children' in data[1]['data']:
                comments_data = data[1]['data']['children']
                comments = []
                for item in comments_data:
                    if item['kind'] == 't1': # t1 indicates a comment
                        comment = item['data']
                        comments.append({
                            "id": comment.get("id", f"comment_{post_id}_{len(comments)}"),
                            "content": comment.get("body", ""),
                            "score": comment.get("score", 0),
                            "author": comment.get("author", "[deleted]"),
                            "created_utc": comment.get("created_utc", 0),
                        })
                return comments
            else:
                logger.warning(f"Unexpected comment data structure for post {post_id}")
                return []
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch comments for post {post_id}: {e}")
            return [] # Return empty list on error

    def process_reddit_response(self, raw_data: Dict[str, Any], subreddit: str) -> Dict[str, Any]:
        """Process the raw JSON response from Reddit's API."""
        logger.debug(f"Processing Reddit API response for r/{subreddit}")
        processed_data = {
            "posts": [],
            "metadata": {
                "subreddit": subreddit,
                "total_posts": 0
            }
        }

        if not raw_data or 'data' not in raw_data or 'children' not in raw_data['data']:
            logger.error("Invalid or empty data structure received from Reddit API")
            return processed_data # Return empty structure

        posts_data = raw_data['data']['children']
        processed_data["metadata"]["total_posts"] = len(posts_data)

        for item in posts_data:
            if item['kind'] == 't3': # t3 indicates a post
                post_data = item['data']
                post_id = post_data.get("id")
                
                # Fetch comments if the post has any
                comments = []
                if post_id and post_data.get("num_comments", 0) > 0:
                    comments = self._fetch_comments(subreddit, post_id)
                    time.sleep(1) # Add a small delay between requests to respect rate limits

                post = {
                    "id": post_id or f"post_{subreddit}_{len(processed_data['posts'])}",
                    "title": post_data.get("title", ""),
                    "content": post_data.get("selftext", ""),
                    "url": f"{REDDIT_API_BASE}{post_data.get('permalink', '')}",
                    "score": post_data.get("score", 0),
                    "author": post_data.get("author", "[deleted]"),
                    "num_comments": post_data.get("num_comments", 0),
                    "created_utc": post_data.get("created_utc", 0),
                    "comments": comments
                }
                processed_data["posts"].append(post)
            else:
                logger.warning(f"Skipping non-post item kind: {item.get('kind')}")

        logger.info(f"Successfully processed {len(processed_data['posts'])} posts from r/{subreddit}")
        return processed_data


    def scrape_subreddit(self, subreddit: str, max_pages=1, cache=True):
        """
        Scrape a subreddit using Reddit's JSON API.

        Args:
            subreddit: Name of the subreddit to scrape
            max_pages: (Currently ignored, fetches one page of 'hot')
            cache: Whether to use cached data if available
        """
        cache_file = f"backend/data_{subreddit}.json"

        # Remove 'r/' prefix if present and ensure lowercase
        clean_subreddit = subreddit.replace('r/', '').strip().lower()
        logger.debug(f"Scraping subreddit: r/{clean_subreddit}")

        # Check cache first if enabled
        if cache and os.path.exists(cache_file):
            logger.info(f"Found cache file for r/{clean_subreddit}")
            try:
                with open(cache_file, "r") as f:
                    cached_data = json.load(f)
                    logger.debug(f"Cache data loaded: {len(cached_data.get('posts', []))} posts found")
                    return cached_data
            except json.JSONDecodeError as e:
                logger.warning(f"Cache read failed for r/{clean_subreddit} (invalid JSON): {str(e)}. Re-fetching.")
            except Exception as e:
                logger.warning(f"Cache read failed for r/{clean_subreddit}: {str(e)}. Re-fetching.")

        # Prepare the Reddit JSON API URL for 'hot' posts
        url = f"{REDDIT_API_BASE}/r/{clean_subreddit}/hot.json?limit=25" # Fetch 25 posts
        logger.info(f"Fetching data from {url} using Reddit API")

        try:
            reddit_data = self._make_request(url)
            logger.debug(f"Raw Reddit API response received (keys: {list(reddit_data.keys())})")

            # Transform the data to our expected format
            processed_data = self.process_reddit_response(reddit_data, clean_subreddit)

            # Save to cache if enabled and data is valid
            if cache and processed_data and processed_data.get("posts"):
                os.makedirs(os.path.dirname(cache_file), exist_ok=True)
                try:
                    with open(cache_file, "w") as f:
                        json.dump(processed_data, f, indent=2)
                    logger.info(f"Cached data for r/{clean_subreddit}")
                except Exception as e:
                     logger.error(f"Failed to write cache file {cache_file}: {e}")

            return processed_data

        except requests.exceptions.HTTPError as e:
             logger.error(f"HTTP error scraping r/{clean_subreddit}: {e.response.status_code} - {e.response.text}")
             # Handle specific cases like private or banned subreddits
             if e.response.status_code in [403, 404]:
                 raise ValueError(f"Subreddit r/{clean_subreddit} not accessible (status code: {e.response.status_code}). It might be private, banned, or non-existent.") from e
             raise # Re-raise other HTTP errors
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error scraping r/{clean_subreddit}: {str(e)}", exc_info=True)
            raise # Re-raise network errors
        except Exception as e:
            logger.error(f"Unexpected error scraping r/{clean_subreddit}: {str(e)}", exc_info=True)
            raise


if __name__ == "__main__":
    # Basic test to see if the scraper can be initialized and run
    logger.info("Running basic Reddit scraper test...")
    try:
        # Use the correct class name
        scraper = RedditScraper()
        test_subreddit = "python" # Use a common subreddit for testing
        logger.info(f"Attempting to scrape r/{test_subreddit} using Reddit API...")
        # Disable cache for this specific test run to ensure fresh data
        data = scraper.scrape_subreddit(test_subreddit, cache=False)

        if data and data.get("posts"):
            logger.info(f"Successfully scraped r/{test_subreddit} via Reddit API: {len(data['posts'])} posts found.")
            # Log details of the first post and its comments if available
            if data['posts']:
                first_post = data['posts'][0]
                logger.info(f"First post title: {first_post.get('title')}")
                logger.info(f"Number of comments fetched for first post: {len(first_post.get('comments', []))}")
                if first_post.get('comments'):
                     logger.debug(f"First comment (sample): {first_post['comments'][0].get('content', '')[:100]}...")
        else:
            logger.warning(f"Scraping r/{test_subreddit} via Reddit API did not return expected data structure.")
            logger.debug(f"Full response data: {json.dumps(data, indent=2)}")

    except ValueError as ve:
         logger.error(f"ValueError during test (e.g., subreddit access issue): {ve}")
    except Exception as e:
        logger.error(f"Failed to run scraper test: {str(e)}", exc_info=True) 
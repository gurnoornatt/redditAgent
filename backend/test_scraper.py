import unittest
from scraper import FirecrawlScraper

class TestFirecrawlScraper(unittest.TestCase):
    def setUp(self):
        self.scraper = FirecrawlScraper()

    def test_scrape_subreddit(self):
        # Test with a real subreddit
        result = self.scraper.scrape_subreddit("test")
        
        # Check the structure of the response
        self.assertIsInstance(result, dict)
        self.assertIn("posts", result)
        self.assertIn("metadata", result)
        
        # Check metadata
        self.assertEqual(result["metadata"]["subreddit"], "test")
        self.assertIsInstance(result["metadata"]["total_posts"], int)
        
        # Check posts
        self.assertIsInstance(result["posts"], list)
        if result["posts"]:  # If we got any posts
            first_post = result["posts"][0]
            self.assertIn("id", first_post)
            self.assertIn("title", first_post)
            self.assertIn("content", first_post)
            self.assertIn("comments", first_post)

    def test_process_firecrawl_response(self):
        # Test with sample data
        sample_data = {
            "content": [{
                "text": "## Test Post\nThis is test content\n### Comment\nThis is a comment"
            }]
        }
        
        result = self.scraper.process_firecrawl_response(sample_data, "test")
        
        # Check the structure
        self.assertIn("posts", result)
        self.assertIn("metadata", result)
        self.assertEqual(result["metadata"]["subreddit"], "test")
        
        # Check the processed post
        posts = result["posts"]
        self.assertEqual(len(posts), 1)
        self.assertEqual(posts[0]["title"], "Test Post")
        self.assertIn("This is test content", posts[0]["content"])
        
        # Check comments
        comments = posts[0]["comments"]
        self.assertEqual(len(comments), 1)
        self.assertIn("This is a comment", comments[0]["content"])

    def test_extract_posts_from_markdown(self):
        # Test with empty content
        empty_posts = self.scraper.extract_posts_from_markdown("", "test")
        self.assertEqual(len(empty_posts), 5)  # Should return 5 dummy posts
        
        # Test with valid markdown
        markdown = """## First Post
Content for first post
### Comment 1
First comment
### Comment 2
Second comment

## Second Post
Content for second post
### Comment 3
Third comment"""
        
        posts = self.scraper.extract_posts_from_markdown(markdown, "test")
        self.assertEqual(len(posts), 2)
        self.assertEqual(posts[0]["title"], "First Post")
        self.assertEqual(len(posts[0]["comments"]), 2)
        self.assertEqual(posts[1]["title"], "Second Post")
        self.assertEqual(len(posts[1]["comments"]), 1)

if __name__ == '__main__':
    unittest.main() 
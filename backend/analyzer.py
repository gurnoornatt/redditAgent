import json
import logging
import os
import re
import openai
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configure OpenAI API
openai.api_key = os.environ.get("OPENAI_API_KEY")

# In a real implementation, you would use spaCy for NLP processing
# For demo purposes, we'll use regex-based extraction to avoid dependencies
# import spacy
# nlp = spacy.load("en_core_web_sm")

class RedditAnalyzer:
    def __init__(self):
        """Initialize the Reddit content analyzer."""
        self.pain_point_keywords = [
            'challenge', 'problem', 'struggle', 'difficult', 
            'hard', 'issue', 'trouble', 'worry', 'concerned',
            'frustrating', 'overwhelmed', 'anxious', 'tired',
            'exhausted', 'help', 'advice', 'suggestion', 'tips'
        ]
        
        # Regex patterns for pain point detection
        self.pain_point_patterns = [
            r'(?i)(?:struggle|struggling) with\s+([^.!?]+)[.!?]',
            r'(?i)(?:difficult|hard) to\s+([^.!?]+)[.!?]',
            r'(?i)(?:problem|issue|challenge) (?:with|is|in)\s+([^.!?]+)[.!?]',
            r'(?i)(?:need|looking for) (?:help|advice|guidance)\s+([^.!?]+)[.!?]',
            r'(?i)(?:how (?:do|can) (?:I|you|we))\s+([^.!?]+)[.!?]',
            r'(?i)(?:any tips for)\s+([^.!?]+)[.!?]'
        ]
        
        # Check if OpenAI API key is available
        if not openai.api_key:
            logger.warning("OpenAI API key not found. Will use template-based content generation.")
    
    def extract_pain_points(self, text: str) -> List[str]:
        """
        Extract pain points from a given text.
        
        Args:
            text: The text to analyze
            
        Returns:
            List of pain point sentences
        """
        if not text:
            return []
            
        # Split text into sentences (basic implementation)
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        pain_points = []
        
        # Method 1: Keyword-based extraction
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in self.pain_point_keywords):
                pain_points.append(sentence.strip())
        
        # Method 2: Pattern-based extraction
        for pattern in self.pain_point_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                pain_points.append(match.strip())
        
        # Remove duplicates while preserving order
        unique_pain_points = []
        for point in pain_points:
            if point not in unique_pain_points and len(point) > 10:  # Minimum length filter
                unique_pain_points.append(point)
        
        return unique_pain_points
    
    def process_subreddit_data(self, data: Dict[str, Any]) -> List[str]:
        """
        Process subreddit data to extract pain points.
        
        Args:
            data: Dictionary containing posts and comments
            
        Returns:
            List of extracted pain points
        """
        if not data or 'posts' not in data:
            logger.warning("Invalid data format for pain point extraction")
            return []
            
        all_pain_points = []
        
        # Process each post
        for post in data['posts']:
            # Extract from post title
            if 'title' in post:
                title_points = self.extract_pain_points(post['title'])
                all_pain_points.extend(title_points)
            
            # Extract from post content
            if 'content' in post:
                content_points = self.extract_pain_points(post['content'])
                all_pain_points.extend(content_points)
            
            # Extract from comments
            if 'comments' in post:
                for comment in post['comments']:
                    if 'content' in comment:
                        comment_points = self.extract_pain_points(comment['content'])
                        all_pain_points.extend(comment_points)
        
        # Remove duplicates while preserving order
        unique_pain_points = []
        for point in all_pain_points:
            if point not in unique_pain_points:
                unique_pain_points.append(point)
        
        return unique_pain_points
    
    def generate_content_ideas(self, subreddit: str, pain_points: List[str], platform: str = "all") -> Dict[str, List[str]]:
        """
        Generate content ideas based on extracted pain points.
        
        Args:
            subreddit: The subreddit name
            pain_points: List of extracted pain points
            platform: Target platform (tiktok, instagram, or all)
            
        Returns:
            Dictionary with content ideas by platform
        """
        # Check if we have pain points and OpenAI API key
        if pain_points and openai.api_key:
            try:
                return self.generate_content_ideas_with_openai(subreddit, pain_points, platform)
            except Exception as e:
                logger.error(f"Error generating content ideas with OpenAI: {str(e)}")
                logger.info("Falling back to template-based generation")
                return self.generate_content_ideas_with_templates(subreddit, pain_points, platform)
        else:
            return self.generate_content_ideas_with_templates(subreddit, pain_points, platform)
    
    def generate_content_ideas_with_openai(self, subreddit: str, pain_points: List[str], platform: str = "all") -> Dict[str, List[str]]:
        """
        Generate content ideas using OpenAI API.
        
        Args:
            subreddit: The subreddit name
            pain_points: List of extracted pain points
            platform: Target platform (tiktok, instagram, or all)
            
        Returns:
            Dictionary with content ideas by platform
        """
        # Limit pain points to avoid token limits
        selected_pain_points = pain_points[:5]
        
        # Prepare the prompt for TikTok
        tiktok_prompt = f"""
        You are a creative social media content strategist for TikTok.
        
        Based on the following pain points identified in the r/{subreddit} subreddit:
        {', '.join(f'- {point}' for point in selected_pain_points)}
        
        Create 3 engaging TikTok video ideas that would resonate with this audience.
        Each idea should be specific, actionable, and structured in a way that works for TikTok's short format.
        
        Format each idea as a one-sentence hook followed by a brief description of the video concept.
        Do not include hashtags or emojis.
        """
        
        # Prepare the prompt for Instagram
        instagram_prompt = f"""
        You are a creative social media content strategist for Instagram.
        
        Based on the following pain points identified in the r/{subreddit} subreddit:
        {', '.join(f'- {point}' for point in selected_pain_points)}
        
        Create 3 engaging Instagram content ideas that would resonate with this audience.
        Consider both feed posts and reels. Ideas should be specific, actionable, and visually compelling.
        
        Format each idea as a one-sentence hook followed by a brief description of the content concept.
        Do not include hashtags or emojis.
        """
        
        # Generate content ideas for TikTok
        tiktok_response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a creative social media content strategist specialized in TikTok."},
                {"role": "user", "content": tiktok_prompt}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        # Generate content ideas for Instagram
        instagram_response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a creative social media content strategist specialized in Instagram."},
                {"role": "user", "content": instagram_prompt}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        # Extract and clean the responses
        tiktok_ideas = self.parse_openai_response(tiktok_response.choices[0].message.content)
        instagram_ideas = self.parse_openai_response(instagram_response.choices[0].message.content)
        
        return {
            "tiktok": tiktok_ideas,
            "instagram": instagram_ideas
        }
    
    def parse_openai_response(self, response_text: str) -> List[str]:
        """
        Parse the OpenAI response into a list of content ideas.
        
        Args:
            response_text: The raw text response from OpenAI
            
        Returns:
            List of content ideas
        """
        ideas = []
        
        # Split by lines and look for numbered items
        lines = response_text.strip().split('\n')
        current_idea = ""
        
        for line in lines:
            # Check if this is a new numbered item
            if re.match(r'^\d+[\.\)]\s', line) or re.match(r'^-\s', line):
                # If we have a current idea, add it to the list
                if current_idea:
                    ideas.append(current_idea.strip())
                
                # Start a new idea
                current_idea = line.split('.', 1)[-1].split(')', 1)[-1].strip()
            elif current_idea:  # continuation of current idea
                current_idea += " " + line.strip()
        
        # Add the last idea if any
        if current_idea:
            ideas.append(current_idea.strip())
        
        # If we couldn't parse the ideas correctly, split by double newlines
        if not ideas:
            parts = response_text.split('\n\n')
            ideas = [part.strip() for part in parts if part.strip()]
        
        # Ensure we have at least one idea
        if not ideas:
            ideas = [response_text.strip()]
        
        return ideas
    
    def generate_content_ideas_with_templates(self, subreddit: str, pain_points: List[str], platform: str = "all") -> Dict[str, List[str]]:
        """
        Generate content ideas using templates (fallback method).
        
        Args:
            subreddit: The subreddit name
            pain_points: List of extracted pain points
            platform: Target platform (tiktok, instagram, or all)
            
        Returns:
            Dictionary with content ideas by platform
        """
        if not pain_points:
            logger.warning(f"No pain points found for r/{subreddit}")
            return {
                "tiktok": [
                    "Day in the life: Create a 'day in the life' video showing coping strategies for parents of neurodivergent children.",
                    "Quick tip video: Share a practical tip that helped parents overcome a common challenge in the special needs community.",
                    "Expert interview: Film a quick Q&A with a specialist about the most common questions in the community."
                ],
                "instagram": [
                    "Resource roundup: Create a carousel post with 5 helpful resources for the special needs community.",
                    "Before/after journey: Share a transformation story showing progress in a particular challenge area.",
                    "Community spotlight: Feature stories from your community with permission, highlighting creative solutions."
                ]
            }
        
        # Templates for TikTok
        tiktok_templates = [
            "Short video idea: Create a video addressing '{point}' with a surprising solution at the end.",
            "Hook concept: Start with 'Did you know?' and then address '{point}' with a quick practical hack.",
            "Personal story: Share your 30-second story of overcoming '{point}' with actionable takeaways.",
            "Comparison video: Do a side-by-side showing the wrong vs. right way to handle '{point}'.",
            "POV concept: Create a POV video showing the daily struggle with '{point}' and a moment of victory."
        ]
        
        # Templates for Instagram
        instagram_templates = [
            "Carousel idea: Create a slideshow with 5 evidence-based strategies to address '{point}'.",
            "Infographic concept: Share a visually appealing breakdown of the science behind '{point}'.",
            "Before/after post: Show a transformation journey related to overcoming '{point}'.",
            "Tutorial reel: Demonstrate a 3-step process viewers can follow to overcome '{point}'.",
            "Quote series: Share powerful statements that resonate with people experiencing '{point}'."
        ]
        
        # Generate ideas using templates and pain points
        tiktok_ideas = []
        instagram_ideas = []
        
        # Use at most 3 pain points to avoid overwhelming users
        for i, point in enumerate(pain_points[:3]):
            tiktok_template = tiktok_templates[i % len(tiktok_templates)]
            instagram_template = instagram_templates[i % len(instagram_templates)]
            
            tiktok_ideas.append(tiktok_template.format(point=point))
            instagram_ideas.append(instagram_template.format(point=point))
        
        return {
            "tiktok": tiktok_ideas,
            "instagram": instagram_ideas
        }

if __name__ == "__main__":
    # Basic test to see if the analyzer is working
    analyzer = RedditAnalyzer()
    
    # Test with a sample file (if available)
    test_file = "backend/data_autismparenting.json"
    
    if os.path.exists(test_file):
        with open(test_file, "r") as f:
            data = json.load(f)
            
        pain_points = analyzer.process_subreddit_data(data)
        print(f"Found {len(pain_points)} pain points:")
        for i, point in enumerate(pain_points[:5], 1):
            print(f"{i}. {point}")
            
        ideas = analyzer.generate_content_ideas("autismparenting", pain_points)
        print("\nTikTok Ideas:")
        for idea in ideas["tiktok"]:
            print(f"- {idea}")
            
        print("\nInstagram Ideas:")
        for idea in ideas["instagram"]:
            print(f"- {idea}")
    else:
        # Test with a sample text
        text = (
            "Parents face many challenges with neurodivergent children. "
            "It's a struggle to find the right support and resources. "
            "The school system can be especially difficult to navigate. "
            "Finding time for self-care is a problem many parents mention."
        )
        
        pain_points = analyzer.extract_pain_points(text)
        print(f"Found {len(pain_points)} pain points in sample text:")
        for i, point in enumerate(pain_points, 1):
            print(f"{i}. {point}")
            
        ideas = analyzer.generate_content_ideas("sample", pain_points)
        print("\nTikTok Ideas:")
        for idea in ideas["tiktok"]:
            print(f"- {idea}")
            
        print("\nInstagram Ideas:")
        for idea in ideas["instagram"]:
            print(f"- {idea}") 
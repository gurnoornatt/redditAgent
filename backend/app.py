import os
import logging
import json
from flask import Flask, request, jsonify, abort
from functools import wraps
from flask_cors import CORS

# Import our modules
from scraper import RedditScraper
from analyzer import RedditAnalyzer

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Set secure token from environment variable or use default for development
SECURE_TOKEN = os.environ.get("API_SECURE_TOKEN", "default-dev-token-change-in-production")

def require_auth(f):
    """Decorator to require authentication via Bearer token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        
        # Extract the token from the Bearer header
        if auth_header.startswith("Bearer "):
            token = auth_header.split("Bearer ")[1].strip()
            if token == SECURE_TOKEN:
                return f(*args, **kwargs)
        
        # If we get here, authentication failed
        logger.warning("Authentication failed for API request")
        return jsonify({"error": "Unauthorized access"}), 401
    return decorated

@app.route("/api/health", methods=["GET"])
def health_check():
    """Endpoint to check if the API is running."""
    return jsonify({"status": "ok", "message": "API is running"})

@app.route("/api/generate-content", methods=["POST"])
@require_auth
def generate_content():
    """
    Generate content ideas based on subreddit analysis.
    
    Expects JSON payload with:
    {
        "subreddit": "subreddit_name",
        "max_pages": 2,  # optional
        "platform": "all"  # optional (all, tiktok, instagram)
    }
    """
    try:
        data = request.json
        if not data or 'subreddit' not in data:
            return jsonify({"error": "Invalid request. Missing 'subreddit' parameter."}), 400
            
        subreddit = data['subreddit']
        max_pages = data.get('max_pages', 2)
        platform = data.get('platform', 'all')
        
        logger.info(f"Generating content ideas for r/{subreddit} (max_pages={max_pages}, platform={platform})")
        
        # Initialize our services
        scraper = RedditScraper()
        analyzer = RedditAnalyzer()
        
        # Step 1: Scrape the subreddit (with caching)
        reddit_data = scraper.scrape_subreddit(subreddit, max_pages=max_pages)
        
        # Step 2: Extract pain points
        pain_points = analyzer.process_subreddit_data(reddit_data)
        
        # Step 3: Generate content ideas
        content_ideas = analyzer.generate_content_ideas(subreddit, pain_points, platform)
        
        # Step 4: Return the results
        response = {
            "subreddit": subreddit,
            "pain_points": pain_points[:5],  # Return only top 5 pain points
            "content_ideas": content_ideas,
            "metadata": {
                "total_pain_points": len(pain_points),
                "platform": platform
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error generating content: {str(e)}", exc_info=True)
        return jsonify({"error": f"Error processing request: {str(e)}"}), 500

@app.route("/api/subreddit-info", methods=["GET"])
@require_auth
def subreddit_info():
    """
    Get information about a subreddit.
    
    Expects query parameter:
    ?subreddit=subreddit_name
    """
    try:
        subreddit = request.args.get('subreddit')
        if not subreddit:
            return jsonify({"error": "Missing 'subreddit' parameter"}), 400
            
        # Initialize our services
        scraper = RedditScraper()
        
        # Get basic subreddit information
        data = scraper.scrape_subreddit(subreddit, max_pages=1)
        
        if 'error' in data and not data.get('posts'):
            return jsonify({"error": f"Error retrieving subreddit information: {data['error']}"}), 404
        
        response = {
            "subreddit": subreddit,
            "post_count": len(data.get('posts', [])),
            "metadata": data.get('metadata', {})
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error getting subreddit info: {str(e)}", exc_info=True)
        return jsonify({"error": f"Error processing request: {str(e)}"}), 500

@app.route("/api/pain-points", methods=["GET"])
@require_auth
def get_pain_points():
    """
    Get pain points from a subreddit.
    
    Expects query parameter:
    ?subreddit=subreddit_name
    """
    try:
        subreddit = request.args.get('subreddit')
        if not subreddit:
            return jsonify({"error": "Missing 'subreddit' parameter"}), 400
            
        # Initialize our services
        scraper = RedditScraper()
        analyzer = RedditAnalyzer()
        
        # Get subreddit data
        data = scraper.scrape_subreddit(subreddit, max_pages=2)
        
        # Extract pain points
        pain_points = analyzer.process_subreddit_data(data)
        
        response = {
            "subreddit": subreddit,
            "pain_points": pain_points,
            "count": len(pain_points)
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error getting pain points: {str(e)}", exc_info=True)
        return jsonify({"error": f"Error processing request: {str(e)}"}), 500

if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 5001))
    
    # Print startup message
    logger.info(f"Starting Reddit Insight API on port {port}")
    logger.info(f"API secure token is {'configured' if SECURE_TOKEN != 'default-dev-token-change-in-production' else 'using default (INSECURE)'}")
    
    # Run the Flask app
    app.run(host="0.0.0.0", port=port, debug=True) 
/**
 * API client for communicating with the Reddit Insight backend
 */

// Base URL for the API, defaulting to localhost for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

// Secure token for API authentication
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || 'default-dev-token-change-in-production';

// Type definitions
export interface ContentIdea {
  subreddit: string;
  pain_points: string[];
  content_ideas: {
    tiktok: string[];
    instagram: string[];
  };
  metadata: {
    total_pain_points: number;
    platform: string;
  };
}

export interface ApiError {
  error: string;
}

/**
 * Generate content ideas from a subreddit
 * 
 * @param subreddit - The subreddit to analyze
 * @param maxPages - Maximum number of pages to scrape (optional)
 * @param platform - Target platform (all, tiktok, instagram) (optional)
 * @returns Promise with content ideas
 */
export async function generateContentIdeas(
  subreddit: string,
  maxPages: number = 2,
  platform: string = 'all'
): Promise<ContentIdea> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({
        subreddit,
        max_pages: maxPages,
        platform
      })
    });

    if (!response.ok) {
      const errorData = await response.json() as ApiError;
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return await response.json() as ContentIdea;
  } catch (error) {
    console.error('Error generating content ideas:', error);
    throw error;
  }
}

/**
 * Get information about a subreddit
 * 
 * @param subreddit - The subreddit to get information about
 * @returns Promise with subreddit information
 */
export async function getSubredditInfo(subreddit: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/subreddit-info?subreddit=${encodeURIComponent(subreddit)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json() as ApiError;
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting subreddit info:', error);
    throw error;
  }
}

/**
 * Get pain points from a subreddit
 * 
 * @param subreddit - The subreddit to get pain points from
 * @returns Promise with pain points
 */
export async function getPainPoints(subreddit: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/pain-points?subreddit=${encodeURIComponent(subreddit)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json() as ApiError;
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting pain points:', error);
    throw error;
  }
}

/**
 * Check if the API is healthy
 * 
 * @returns Promise indicating API health
 */
export async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET'
    });

    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
} 
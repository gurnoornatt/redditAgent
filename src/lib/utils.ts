import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combine class names with tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a subreddit name to ensure it starts with "r/"
 */
export function formatSubreddit(subreddit: string): string {
  if (!subreddit) return "";
  
  // Remove any "r/" prefix
  const cleanSubreddit = subreddit.replace(/^r\//, "").trim();
  
  // Return with proper prefix
  return cleanSubreddit ? `r/${cleanSubreddit}` : "";
}

/**
 * Extract subreddit name from a string (removes "r/" prefix)
 */
export function extractSubredditName(subreddit: string): string {
  if (!subreddit) return "";
  
  // Remove any "r/" prefix
  return subreddit.replace(/^r\//, "").trim();
}

/**
 * Validate a subreddit name
 */
export function isValidSubredditName(subreddit: string): boolean {
  if (!subreddit) return false;
  
  // Remove any "r/" prefix
  const cleanSubreddit = subreddit.replace(/^r\//, "").trim();
  
  // Basic subreddit name validation
  // Subreddit names must be between 3 and 21 characters, consisting of letters, numbers, or underscores
  const subredditRegex = /^[a-zA-Z0-9_]{3,21}$/;
  return subredditRegex.test(cleanSubreddit);
}

/**
 * Truncate a string to a certain length
 */
export function truncateString(str: string, maxLength: number = 100): string {
  if (!str || str.length <= maxLength) return str;
  
  return str.substring(0, maxLength) + "...";
}

/**
 * Format a date string
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric', 
      year: 'numeric',
    }).format(date);
  } catch (error) {
    return dateString;
  }
}

/**
 * Get a random item from an array
 */
export function getRandomItem<T>(array: T[]): T | undefined {
  if (!array || array.length === 0) return undefined;
  
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

/**
 * Delay for a specified number of milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

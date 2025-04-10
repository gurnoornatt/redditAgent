"""
MCP Integration Module

This module provides access to MCP (Model Control Panel) functions
for the Reddit Agent application.
"""

import os
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def mcp__firecrawl_scrape(url: str, formats: list = None, onlyMainContent: bool = True, waitFor: int = 3000, timeout: int = 30000) -> Dict[str, Any]:
    """
    Scrape a webpage using Firecrawl MCP.
    
    Args:
        url: The URL to scrape
        formats: Content formats to extract (default: ['markdown'])
        onlyMainContent: Extract only main content (default: True)
        waitFor: Time to wait for dynamic content (default: 3000ms)
        timeout: Maximum time to wait (default: 30000ms)
    
    Returns:
        Dict containing the scraped content
    """
    logger.debug(f"Scraping URL: {url}")
    logger.debug(f"Parameters: formats={formats}, onlyMainContent={onlyMainContent}, waitFor={waitFor}, timeout={timeout}")
    
    # Ensure we have the API key
    api_key = os.environ.get("FIRECRAWL_API_KEY")
    if not api_key:
        raise ValueError("FIRECRAWL_API_KEY environment variable is required")
    
    # Import the MCP function from the global scope
    try:
        from __main__ import mcp__firecrawl_scrape as mcp_scrape
        return mcp_scrape(
            url=url,
            formats=formats or ["markdown"],
            onlyMainContent=onlyMainContent,
            waitFor=waitFor,
            timeout=timeout
        )
    except ImportError:
        logger.error("Failed to import mcp__firecrawl_scrape from __main__")
        raise ImportError("MCP Firecrawl integration is required. Please ensure you're running in Cursor with MCP enabled.") 
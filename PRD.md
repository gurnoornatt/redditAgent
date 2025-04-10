# Product Requirements Document: Reddit Insight

## 1. Product Overview

Reddit Insight is an AI-powered content analysis tool that helps content creators discover trending topics, pain points, and content opportunities by analyzing Reddit conversations. The application scrapes Reddit data, performs natural language processing to identify user pain points, and generates content ideas for platforms like TikTok and Instagram.

### 1.1 Vision & Goals

- Create an intuitive tool that helps content creators identify trending topics on Reddit
- Enable users to discover pain points and problems discussed in specific subreddits
- Generate creative short-form content ideas based on Reddit discussions
- Provide a seamless experience between data collection, analysis, and idea generation

### 1.2 Target Users

- Content creators focused on short-form video content (TikTok, Instagram Reels)
- Marketers looking for content ideas in specific niches
- Businesses seeking to understand customer pain points in their domain
- Researchers analyzing community discussions on specific topics

## 2. System Architecture

### 2.1 High-Level Components

1. **Frontend (Next.js + React)**
   - User interface for entering subreddits and viewing results
   - Integration with backend API
   - Modern, responsive design

2. **Backend (Python + Flask)**
   - RESTful API endpoints for client communication
   - Authentication and authorization
   - Data processing and storage

3. **Data Collection Module (Firecrawl MCP)**
   - Reddit scraping functionality
   - Data extraction and storage

4. **Analysis Module (SpaCy NLP)**
   - Natural language processing for pain point extraction
   - Content idea generation based on analysis

### 2.2 Data Flow

1. User enters a subreddit name in the frontend
2. Request is sent to the backend API with proper authentication
3. Backend triggers data collection from Reddit via Firecrawl MCP
4. Collected data is processed using NLP to extract pain points
5. Content ideas are generated based on identified pain points
6. Results are returned to the frontend for display

## 3. Functional Requirements

### 3.1 User Interface

- **REQ-UI-01**: Landing page with product description and call-to-action
- **REQ-UI-02**: Agent page with subreddit input form
- **REQ-UI-03**: Results display section showing generated content ideas
- **REQ-UI-04**: Loading state for when processing is occurring
- **REQ-UI-05**: Error handling for invalid inputs or API failures

### 3.2 Authentication & Security

- **REQ-SEC-01**: Secure token-based authentication for API requests
- **REQ-SEC-02**: Environment variable management for sensitive credentials
- **REQ-SEC-03**: API rate limiting to prevent abuse
- **REQ-SEC-04**: Proper error handling and logging

### 3.3 Data Collection

- **REQ-DATA-01**: Ability to scrape specified subreddits using Firecrawl MCP
- **REQ-DATA-02**: Support for configurable scraping depth (number of pages)
- **REQ-DATA-03**: Data caching to reduce redundant scraping
- **REQ-DATA-04**: Proper error handling for failed scraping attempts

### 3.4 Data Analysis

- **REQ-ANALYSIS-01**: NLP processing to identify pain points in Reddit posts
- **REQ-ANALYSIS-02**: Keyword-based filtering for relevant sentences
- **REQ-ANALYSIS-03**: Content idea generation based on identified pain points
- **REQ-ANALYSIS-04**: Support for different content formats (TikTok, Instagram)

### 3.5 API Endpoints

- **REQ-API-01**: `/api/generate-content` POST endpoint for content generation
- **REQ-API-02**: Proper request validation and error handling
- **REQ-API-03**: Consistent response format for all API endpoints
- **REQ-API-04**: CORS configuration for frontend access

## 4. Technical Requirements

### 4.1 Frontend Technologies

- **REQ-TECH-01**: Next.js 15+ framework
- **REQ-TECH-02**: React 19+ for UI components
- **REQ-TECH-03**: Tailwind CSS for styling
- **REQ-TECH-04**: Shadcn UI components for consistent design
- **REQ-TECH-05**: State management for tracking request status

### 4.2 Backend Technologies

- **REQ-TECH-06**: Python 3.8+ runtime
- **REQ-TECH-07**: Flask web framework for API
- **REQ-TECH-08**: SpaCy for natural language processing
- **REQ-TECH-09**: Firecrawl MCP integration for Reddit scraping
- **REQ-TECH-10**: JSON for data interchange

### 4.3 Deployment & Infrastructure

- **REQ-INFRA-01**: Local development environment setup
- **REQ-INFRA-02**: Proper environment variable management
- **REQ-INFRA-03**: Supabase for database storage (optional for future)

## 5. Implementation Details

### 5.1 Backend Implementation

#### 5.1.1 File Structure
```
/backend
  /scraper.py     # Reddit data collection using Firecrawl
  /analyzer.py    # NLP processing and pain point extraction
  /app.py         # Flask API endpoints and server setup
```

#### 5.1.2 Key Components

- **Scraper Module**: Handles Reddit data collection using Firecrawl MCP
- **Analyzer Module**: Processes text data using SpaCy to extract pain points
- **API Module**: Exposes endpoints for frontend communication

#### 5.1.3 Authentication Flow

1. Frontend includes secure token in Authorization header
2. Backend validates token against configured value
3. Request is processed only if authentication is successful

### 5.2 Frontend Implementation

#### 5.2.1 File Structure
```
/src
  /app
    /page.tsx        # Landing page
    /agent/page.tsx  # Agent interface page
    /globals.css     # Global styles
    /layout.tsx      # Layout wrapper
  /components        # Reusable UI components
  /lib               # Utility functions
```

#### 5.2.2 Key Components

- **Landing Page**: Describes product features and benefits
- **Agent Page**: Interface for entering subreddit and viewing results
- **UI Components**: Buttons, cards, inputs, and other reusable elements

#### 5.2.3 API Integration

- Fetch API for communication with backend
- Proper error handling and loading states
- Authentication header inclusion

## 6. Quality Assurance

### 6.1 Testing Requirements

- **REQ-QA-01**: Unit tests for backend functionality
- **REQ-QA-02**: API integration tests
- **REQ-QA-03**: Frontend component tests
- **REQ-QA-04**: End-to-end workflow tests

### 6.2 Performance Requirements

- **REQ-PERF-01**: API response time under 5 seconds for normal requests
- **REQ-PERF-02**: Frontend loading states for longer operations
- **REQ-PERF-03**: Proper error handling for timeouts

## 7. Development Guidelines

### 7.1 Code Standards

- Follow consistent naming conventions
- Keep files under 300 lines of code
- Write thorough comments and documentation
- Use type annotations where applicable

### 7.2 Version Control

- Use Git for version control
- Never commit .env files or sensitive credentials
- Keep commits focused on specific changes

### 7.3 Environment Setup

- Use .env files for local environment variables
- Ensure all dependencies are properly documented
- Set up proper error logging

## 8. Implementation Timeline

### 8.1 Phase 1: Backend Setup
- Set up Flask application structure
- Implement Firecrawl MCP integration
- Create basic API endpoints

### 8.2 Phase 2: Frontend Development
- Create landing page
- Implement agent interface
- Set up API communication

### 8.3 Phase 3: Integration & Testing
- Connect frontend and backend
- Test full workflow
- Fix bugs and improve UX

## 9. Future Enhancements

- Support for multiple subreddit analysis
- Advanced filtering options
- User accounts and saved results
- Additional content platforms
- Enhanced NLP for better pain point extraction 
#!/bin/bash

# Reddit Insight Setup Script

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print step headers
print_step() {
  echo -e "\n${BLUE}==== $1 ====${NC}"
}

# Function to print success messages
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print warnings
print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print errors
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Welcome message
echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}     Reddit Insight Setup Script      ${NC}"
echo -e "${BLUE}=======================================${NC}"
echo
echo "This script will set up your Reddit Insight application."
echo

# Check for .env file
print_step "Checking Environment Variables"
if [ ! -f ".env" ]; then
  print_warning "No .env file found."
  if [ -f ".env.example" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    print_success "Created .env file. Please update it with your actual credentials."
    echo "Edit the .env file before continuing."
    read -p "Press Enter when ready to continue..."
  else
    print_error "No .env.example file found. Please create a .env file manually."
    exit 1
  fi
else
  print_success "Found .env file."
fi

# Check for Python
print_step "Checking Python"
if command -v python3 &>/dev/null; then
  PYTHON_CMD=python3
elif command -v python &>/dev/null; then
  PYTHON_CMD=python
else
  print_error "Python not found. Please install Python 3.8 or higher."
  exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d" " -f2)
echo "Using Python $PYTHON_VERSION"
if [[ $(echo "$PYTHON_VERSION 3.8" | awk '{print ($1 < $2)}') -eq 1 ]]; then
  print_error "Python 3.8 or higher is required. You have $PYTHON_VERSION."
  exit 1
fi

# Check for Node.js
print_step "Checking Node.js"
if command -v node &>/dev/null; then
  NODE_VERSION=$(node --version | cut -d"v" -f2)
  echo "Using Node.js $NODE_VERSION"
  if [[ $(echo "$NODE_VERSION 18.0.0" | awk '{print ($1 < $2)}') -eq 1 ]]; then
    print_warning "Node.js 18.0.0 or higher is recommended. You have $NODE_VERSION."
  else
    print_success "Node.js version is sufficient."
  fi
else
  print_error "Node.js not found. Please install Node.js 18.0.0 or higher."
  exit 1
fi

# Install Python dependencies
print_step "Installing Python Dependencies"
if [ -d "backend" ]; then
  cd backend
  $PYTHON_CMD -m pip install -r requirements.txt
  if [ $? -eq 0 ]; then
    print_success "Python dependencies installed successfully."
  else
    print_error "Failed to install Python dependencies."
  fi
  cd ..
else
  print_error "Backend directory not found. Make sure you're in the project root directory."
  exit 1
fi

# Install Node.js dependencies
print_step "Installing Node.js Dependencies"
if [ -f "package.json" ]; then
  npm install
  if [ $? -eq 0 ]; then
    print_success "Node.js dependencies installed successfully."
  else
    print_error "Failed to install Node.js dependencies."
  fi
else
  print_error "package.json not found. Make sure you're in the project root directory."
  exit 1
fi

# Set up Cursor MCP
print_step "Setting Up Cursor MCP"
if command -v node &>/dev/null; then
  echo "Running Cursor MCP setup script..."
  node setup-mcp.js
  if [ $? -eq 0 ]; then
    print_success "Cursor MCP setup completed."
  else
    print_warning "Cursor MCP setup may have encountered issues. Please check the output above."
  fi
else
  print_error "Node.js not found. Cannot run Cursor MCP setup script."
fi

# Final instructions
print_step "Setup Complete"
echo -e "${GREEN}Reddit Insight setup has been completed!${NC}"
echo
echo "To start the application:"
echo "1. In one terminal window, run:"
echo "   cd backend && $PYTHON_CMD app.py"
echo
echo "2. In another terminal window, run:"
echo "   npm run dev"
echo
echo "3. Access the application at: http://localhost:3000"
echo
echo -e "${YELLOW}Important:${NC} Make sure Cursor is running and has been restarted after the MCP setup."
echo "This ensures the Firecrawl MCP integration is properly configured."
echo
echo -e "${BLUE}Happy analyzing!${NC}" 
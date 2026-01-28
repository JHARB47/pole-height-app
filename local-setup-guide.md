# Local Development Environment Setup

## 1. Node.js Version Management

# Install Node.js 22.12.0 (matches production)

nvm install 22.12.0
nvm use 22.12.0
nvm alias default 22.12.0

# Verify installation

node --version # Should show v22.12.0
npm --version

## 2. Clone and Setup Repository

git clone https://github.com/JHARB47/pole-height-app.git
cd pole-height-app

# Install dependencies

npm ci

## 3. Environment Configuration

# Copy environment template

cp .env.example .env

# Edit .env file with your local settings

# - DATABASE_URL: Your local PostgreSQL connection

# - JWT secrets: Generate using openssl rand -hex 64

# - VITE_SENTRY_DSN: Leave empty for local development

## 4. Database Setup (Local PostgreSQL)

# Option A: Install PostgreSQL locally

brew install postgresql
brew services start postgresql
createdb poleplan_dev

# Option B: Use Docker

docker run --name postgres-dev -e POSTGRES_PASSWORD=password -d -p 5432:5432 postgres:15

# Run database migrations

npm run db:generate
npm run db:migrate

## 5. Development Commands

# Start development server

npm run dev

# Start with backend

npm run dev:full

# Run tests

npm test

# Build for production

npm run build

## 6. Netlify CLI (for local testing)

npm install -g netlify-cli
netlify login
netlify link # Link to your Netlify site

# Test Netlify functions locally

npm run dev:netlify

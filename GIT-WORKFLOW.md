# Git Workflow and Deployment Guide

This document outlines the workflow for making changes to the Pole Plan Wizard application, how to manage branches, and how to deploy changes to production.

## Branch Structure

The repository follows a standard trunk-based development workflow:

- `main`: The primary branch containing stable, production-ready code.
- Feature branches: Created for specific features, bug fixes, or improvements.

## Development Workflow

### 1. Starting a New Feature or Fix

1. Always start from an up-to-date `main` branch:
   ```bash
   git checkout main
   git pull origin main
   ```

2. Create a new branch with a descriptive name:
   ```bash
   git checkout -b feature/my-new-feature
   # or
   git checkout -b fix/issue-description
   # or
   git checkout -b chore/maintenance-task
   ```

### 2. Making Changes

1. Make your changes to the codebase.
2. Run tests regularly to ensure your changes don't break existing functionality:
   ```bash
   npm test
   ```
3. Use the VS Code test explorer or run specific tests as needed.
4. Check that the build completes successfully:
   ```bash
   npm run build
   ```

### 3. Committing Changes

1. Stage your changes:
   ```bash
   git add .
   ```

2. Commit with a descriptive message following conventional commits format:
   ```bash
   git commit -m "feat: add new calculation feature"
   # or
   git commit -m "fix: resolve issue with geospatial imports"
   # or
   git commit -m "chore: update dependencies"
   ```

### 4. Creating a Pull Request

1. Push your branch to GitHub:
   ```bash
   git push -u origin feature/my-new-feature
   ```

2. Create a pull request via the GitHub interface.
3. The PR will automatically trigger CI checks to run tests and verify the build.
4. A Netlify deploy preview will be created to preview your changes.

### 5. Reviewing and Merging

1. Address any feedback from code reviews.
2. Make sure all CI checks pass.
3. Once approved, merge the PR into `main` using the GitHub interface.
4. GitHub Actions will automatically deploy the changes to Netlify production.

## Optional Dependencies and Dynamic Imports

This application uses dynamic imports for certain optional dependencies to keep the core bundle small. These include:

- `tokml`: For KML exports
- `@mapbox/shp-write`: For Shapefile exports
- `shpjs`: For Shapefile imports

When working with these features:

1. Always use `try/catch` blocks around dynamic imports to handle cases where the import fails.
2. Provide fallback functionality where possible (e.g., fall back to GeoJSON if KML export fails).
3. Keep these dependencies listed in `vite.config.js` under the `external` and `optimizeDeps.exclude` sections.

## Deployment Pipeline

The application is automatically deployed through GitHub Actions to Netlify:

1. Push to `main` or merge a PR to trigger the deployment workflow.
2. The workflow:
   - Checks out the code
   - Installs dependencies
   - Runs linters and tests
   - Builds the application
   - Deploys to Netlify

## Troubleshooting

### Build Issues with Dynamic Imports

If you encounter build issues with dynamic imports:

1. Ensure the dependency is properly externalized in `vite.config.js`
2. Verify that your dynamic import is wrapped in a try/catch block
3. Check that the dependency is properly installed in package.json
4. Make sure the dependency is excluded from optimizeDeps in vite.config.js

### Test Failures

If tests fail:

1. Run the specific failing test with `npm test -- -t "test name"`
2. Check for environment-specific issues
3. Verify that all dependencies are installed
4. Look for recent changes that might affect the test

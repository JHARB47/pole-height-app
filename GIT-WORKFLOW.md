# Git Workflow and Development Guidelines

## Overview

This document establishes standardized procedures for branch management, pull request workflows, and build verification to ensure robust communication between branches and maintain system integrity across all features.

## Branch Structure

### Main Branch (main)

- **Purpose**: Production-ready, stable code
- **Protection**: Protected with required PR reviews and CI checks
- **Deployment**: Auto-deploys to production via Netlify

### Feature Branches

- **Naming**: `feature/descriptive-name`, `fix/issue-description`, or `chore/maintenance-task`
- **Source**: Branch from `main`
- **Lifecycle**: Short-lived, deleted after merge
- **Target**: Merge back to `main` via pull request

## Development Workflow

### 1. Starting New Work

```bash
# Ensure you're on main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes...
git add .
git commit -m "feat: descriptive commit message"
git push -u origin feature/your-feature-name
```

### 2. Preparing for PR

Before creating a pull request, ensure all checks pass locally:

```bash
# Install dependencies
npm ci

# Run full verification pipeline
npm ci && npm run lint && npm run lint:css && npm test && npm run build

# Individual checks for debugging
npm test          # Run test suite (should pass all 57+ tests)
npm run lint      # ESLint checks
npm run lint:css  # Stylelint checks
npm run build     # Vite production build
npm run dev       # Development server verification
```

### 3. Pull Request Process

1. **Create PR** using the GitHub template (automatically loaded)
2. **Target Branch**: `main`
3. **Fill Template**: Complete all sections of the PR template
4. **CI Checks**: Ensure all GitHub Actions pass
5. **Deploy Preview**: Test on Netlify preview URL
6. **Address Feedback**: Make requested changes
7. **Merge**: Use "Squash and merge" for clean history

## Build System Verification

### Local Verification Commands

```bash
# Full verification pipeline
npm ci && npm run lint && npm run lint:css && npm test && npm run build

# Test specific functionality
npm test -- calculations        # Test calculations engine
npm test -- exporters          # Test export functionality
npm test -- geodata           # Test geospatial features
```

### CI Pipeline Checks

1. **Dependencies**: `npm ci` installs exact versions
2. **Linting**: ESLint and Stylelint checks
3. **Testing**: Complete test suite execution (57+ tests)
4. **Build**: Vite production build verification
5. **PWA**: Service worker generation validation

## Feature Area Guidelines

### Web View/UI Components

- **Location**: `src/components/`
- **Testing**: Include component tests for interactive elements
- **Styling**: Use Tailwind CSS classes consistently
- **State**: Use Zustand store for global state management
- **Verification**: Test in both dev mode and production build

### Calculations Engine

- **Location**: `src/utils/calculations.js`
- **Testing**: Comprehensive unit tests required for all mathematical functions
- **Validation**: Self-test functionality must pass
- **Performance**: Consider memoization for computationally heavy operations
- **Reliability**: Maintain numerical precision for engineering calculations

### Data Handling and Storage

- **Location**: `src/utils/store.js`, various utils
- **State Management**: Use Zustand for global state
- **Persistence**: LocalStorage for user data and application state
- **Validation**: Input sanitization and type checking
- **Backup**: Export/import functionality for data portability

### Import/Export Functionality

- **Location**: `src/utils/exporters.js`, `src/utils/importers.js`
- **Dependencies**: Optional GIS libraries (tokml, shpjs, @mapbox/shp-write)
- **Error Handling**: Graceful degradation when libraries unavailable
- **Formats**: KML, KMZ, Shapefile, GeoJSON, CSV, PDF
- **Testing**: Mock dynamic imports in test environment

### Geospatial Features

- **Location**: `src/utils/geodata.js`
- **Dynamic Imports**: All GIS libraries must use dynamic imports
- **Fallbacks**: Provide alternatives when optional dependencies missing
- **Coordinate Systems**: Handle different projection systems properly
- **Validation**: Verify geospatial data integrity

### PDF Generation and Permits

- **Location**: `src/utils/permits.js`, `src/utils/pdfFormFiller.js`
- **Templates**: Maintain PDF form templates in proper format
- **Field Mapping**: Ensure field names match PDF form structure
- **Validation**: Verify PDF generation across different browsers

## Dependency Management

### Core Dependencies

- React, Vite, Zustand, Tailwind CSS, PDF-lib
- Always included in bundle, essential for application functionality

### Optional Dependency Management

- `tokml`: KML/KMZ export functionality
- `shpjs`: Shapefile import functionality
- `@mapbox/shp-write`: Shapefile export functionality
- Dynamically imported when needed, graceful degradation when unavailable

### Vite Configuration

```javascript
// External dependencies for optional libraries
external: (id) => optionalDeps.includes(id),

// Function-based manual chunks for Vite compatibility
manualChunks: (id) => {
  if (id.includes('node_modules')) {
    return 'vendor';
  }
  if (id.includes('src/utils')) {
    return 'utils';
  }
}
```

## Error Handling Standards

### Optional Dependencies

```javascript
try {
  const { tokml } = await import('tokml');
  return tokml(geojsonData);
} catch (error) {
  console.warn('KML export unavailable:', error.message);
  throw new Error('KML export requires additional dependencies. Please install tokml.');
}
```

### User-Facing Errors

- Clear, actionable error messages
- Fallback functionality when possible
- Proper error boundaries in React components
- Detailed logging for debugging purposes

## Testing Requirements

### Test Coverage Areas

1. **Calculations**: All mathematical functions and edge cases
2. **Data Validation**: Input/output validation and sanitization
3. **Export Functions**: Format generation and error handling
4. **Import Functions**: File parsing and validation
5. **Component Behavior**: UI interactions and state changes
6. **Error Scenarios**: Graceful failure handling

### Test Execution

```bash
# Run all tests with coverage
npm test

# Run specific test suites
npm test -- calculations
npm test -- exporters
npm test -- geodata

# Watch mode during development
npm test -- --watch

# Verbose output for debugging
npm test -- --verbose
```

### Test Environment

- **Mock Imports**: Use dynamic import mocking for optional dependencies
- **Environment Variables**: Test with different configuration scenarios
- **Error Conditions**: Test failure modes and recovery paths

## Deployment and Release Process

### Continuous Deployment

1. **Push to main**: Triggers automatic deployment
2. **GitHub Actions**: Runs full CI pipeline
3. **Netlify Deploy**: Automatic deployment on success
4. **Preview Deploys**: Generated for all PRs

### Version Management

- Update version in `package.json` for major releases
- Update `DEPLOYMENT.md` with change summaries
- Use semantic versioning (major.minor.patch)

### Deployment Verification

1. **Staging**: Verify on Netlify deploy preview
2. **Production**: Monitor after main branch deployment
3. **PWA**: Verify service worker updates correctly
4. **Rollback**: Use Netlify deployment history if needed

## Troubleshooting Common Issues

### Build Failures

1. **External Module Errors**:
   - Check vite.config.js external configuration
   - Verify function-based manualChunks setup
   - Ensure optional dependencies use dynamic imports

2. **Import Errors**:
   - Verify dynamic imports for optional dependencies
   - Check that static imports aren't used for external modules
   - Validate import paths and module names

3. **Test Failures**:
   - Run tests locally before pushing
   - Check for environment-specific issues
   - Verify mock implementations for dynamic imports

### CI/CD Issues

1. **Node Version**: Ensure consistency between local and CI environments
2. **Cache Issues**: Clear npm cache if dependency installation fails
3. **Timeout Issues**: Optimize test performance or increase timeout values
4. **Memory Issues**: Monitor build memory usage for large projects

### Branch Communication Problems

1. **Sync Issues**: Regularly pull from main branch
2. **Merge Conflicts**: Resolve locally before pushing to remote
3. **CI Failures**: Check GitHub Actions logs for specific error details
4. **Deploy Failures**: Verify Netlify configuration and build settings

## Best Practices

### Commit Messages

Use conventional commit format:

- `feat: add new feature or enhancement`
- `fix: resolve bug or issue`
- `docs: update documentation`
- `test: add or modify tests`
- `refactor: improve code structure without changing functionality`
- `chore: maintenance tasks, dependency updates`

### Code Quality

- Follow ESLint and Stylelint rules consistently
- Write meaningful variable and function names
- Add comments for complex algorithms and business logic
- Keep functions small, focused, and testable
- Use TypeScript-style JSDoc comments for better intellisense

### Documentation

- Update README.md for new features or setup changes
- Document complex algorithms and calculations
- Maintain accurate dependency lists
- Update this workflow guide as processes evolve
- Include inline comments for non-obvious code sections

### Security and Performance

- Validate all user inputs
- Sanitize data before processing
- Use secure coding practices
- Monitor bundle size and performance
- Implement proper error boundaries

## Support and Questions

For questions about this workflow or issues with the build system:

1. **GitHub Issues**: Check existing issues for similar problems
2. **CI/CD Logs**: Review GitHub Actions logs for detailed error information
3. **Local Testing**: Use provided verification commands to reproduce issues
4. **Documentation**: Refer to component-specific documentation in code comments
5. **New Issues**: Create detailed issue reports with reproduction steps and environment details

## Quick Reference

### Essential Commands

```bash
# Full verification before PR
npm ci && npm run lint && npm run lint:css && npm test && npm run build

# Development workflow
npm run dev          # Start development server
npm test -- --watch # Run tests in watch mode
npm run build        # Production build
npm run preview      # Preview production build locally

# Debugging
npm test -- --verbose           # Detailed test output
npm run build -- --debug        # Verbose build output
npm audit                       # Security vulnerability check
```

### File Locations

- **Components**: `src/components/`
- **Utilities**: `src/utils/`
- **Tests**: `*.test.js` files throughout codebase
- **Configuration**: Root level config files
- **Documentation**: `README.md`, `DEPLOYMENT.md`, this file

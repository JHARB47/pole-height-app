# Pole Height Calculator

A comprehensive web application for calculating NESC-compliant pole attachment heights for utility engineering workflows.

## 🚀 Features

- **NESC Compliance**: Automatic validation against National Electrical Safety Code standards
- **Advanced Calculations**: Sag calculations, clearance validation, and cost estimation
- **Geospatial Import**: Support for KML/KMZ/Shapefile data import with configurable mapping
- **Format Preferences**: Choose between verbose (15ft 6in) and tick mark (15' 6") formatting
- **Comprehensive Help**: Built-in help system with detailed documentation and examples
- **Professional Reports**: Export calculations to CSV with print-optimized layouts
- **State Persistence**: User preferences and data saved locally between sessions

## 🛠 Technology Stack

- **Frontend**: React 18 + Vite 4.5.14
- **Styling**: TailwindCSS with responsive design and print optimization
- **State Management**: Zustand with localStorage persistence
- **Testing**: Vitest with comprehensive test coverage
- **Geospatial**: shpjs, @tmcw/togeojson for file import
- **Icons**: Lucide React icon library

## 🏗 Build Configuration

### For Netlify Deployment

The application is optimized for Netlify deployment with the following configuration:

#### Build Settings
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18+

#### Key Files
- `netlify.toml` - Netlify deployment configuration
- `vite.config.js` - Optimized Vite build with code splitting
- `package.json` - Dependencies and build scripts

### Code Splitting

The build automatically splits code into optimized chunks:
- **geospatial**: Geospatial libraries (shpjs, togeojson, jszip) - ~300KB
- **vendor**: React core libraries (react, react-dom, zustand) - ~144KB  
- **icons**: Lucide React icons - minimal
- **main**: Application code - ~84KB

## 📦 Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🌍 Deployment to Netlify

### Automatic Deployment (Recommended)

1. Connect your GitHub repository to Netlify
2. Netlify will automatically detect the build settings from `netlify.toml`
3. Deploy will run `npm run build` and publish the `dist` folder

### Manual Deployment

```bash
# Build the application
npm run build

# Deploy the dist folder to Netlify
# (Use Netlify CLI or drag-and-drop deployment)
```

### Environment Variables

Copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
```

Available environment variables:
- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Version number
- `VITE_DEBUG_MODE` - Enable debug features
- `VITE_ENABLE_*` - Feature flags

## 📋 Configuration

### Netlify Features Enabled

- **SPA Routing**: All routes redirect to `index.html` for client-side routing
- **Security Headers**: X-Frame-Options, CSP, and other security headers
- **Static Asset Caching**: Optimized caching for `/assets/*` files
- **File Upload Support**: CSP configured for geospatial file imports

### Vite Configuration Highlights

- **Buffer Polyfill**: Included for browser compatibility with geospatial libraries
- **Code Splitting**: Automatic chunking for optimal loading performance
- **Build Optimization**: Target ES2015 with CommonJS support
- **Development Server**: Hot reload with network access enabled

## 🧪 Testing

Comprehensive test suite covering:
- Calculation engine accuracy
- Format parsing and conversion
- Integration testing
- Reliability testing with edge cases

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📚 Usage

### Quick Start
1. Enter basic pole and span information
2. Configure existing utilities and proposed attachments
3. Review calculated clearances and NESC compliance
4. Export results or generate reports

### Advanced Features
- **Batch Processing**: Import multiple spans from CSV/Shapefile
- **Custom Clearances**: Override default NESC requirements
- **Make-Ready Analysis**: Calculate costs for existing utility modifications
- **Professional Reports**: Export with company branding and detailed calculations

### File Import Support
- **KML/KMZ**: Google Earth files with configurable attribute mapping
- **Shapefiles**: Industry-standard GIS format (.shp, .dbf, .shx)
- **CSV**: Structured data with customizable column mapping

## 🔧 Troubleshooting

### Common Build Issues

**Buffer/Node.js Module Errors**:
- The vite.config.js includes polyfills for browser compatibility
- Geospatial libraries require Node.js modules that are automatically handled

**Large Bundle Warnings**:
- Code splitting is configured to keep chunks under 600KB
- Geospatial features are in a separate chunk for optional loading

**Netlify Deployment Issues**:
- Ensure Node.js version is 18+ in build settings
- Check that `netlify.toml` is in the repository root
- Verify build command is set to `npm run build`

### Development Issues

**Dev Server Won't Start**:
- Check if ports 5173-5176 are available
- Use `npm run dev -- --host` to bind to all interfaces

**Tests Failing**:
- Run `npm install` to ensure all dependencies are current
- Check that test files haven't been modified

## 📝 License

This project is proprietary software for utility engineering applications.

## 🤝 Contributing

1. Follow existing code style and patterns
2. Add tests for new features
3. Update documentation for API changes
4. Ensure build passes before submitting

## 📞 Support

For technical support or feature requests, please contact the development team.

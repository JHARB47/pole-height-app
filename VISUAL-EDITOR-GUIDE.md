# PolePlan Pro Visual Editor Integration

## Overview
PolePlan Pro now includes Netlify Visual Editor for content management of marketing pages while preserving the sophisticated calculation engine functionality. This hybrid approach allows content editors to manage marketing content without affecting the core application.

## Architecture

### Content Areas Managed by Visual Editor
- **Landing Page**: Hero sections, feature lists, call-to-action blocks
- **Site Configuration**: Global settings, navigation, branding colors
- **Marketing Pages**: Rich text content, promotional sections

### Application Areas (Protected from Visual Editor)
- **Pole Calculation Engine**: Interactive forms and calculations
- **Import/Export Tools**: CSV, KML, Shapefile processing
- **Geospatial Features**: Mapping and coordinate systems
- **Advanced UI**: Complex state management and user interactions

## Files and Configuration

### Visual Editor Configuration
- **`visual-editor.config.js`**: Content models and field definitions
- **`content/site.json`**: Global site configuration (title, navigation, colors)
- **`content/pages/home.json`**: Landing page sections and content

### Content Models
1. **Site Model**: Global configuration (siteTitle, logo, primaryColor, navigation)
2. **Page Model**: Marketing pages with sections array
3. **Section Models**:
   - HeroSection: Title, subtitle, background image, CTA button
   - RichTextSection: Markdown content areas
   - FeatureSection: Feature grids with titles and descriptions
   - CtaSection: Call-to-action blocks with buttons

## Development Workflow

### Starting Visual Editor Development
```bash
# Start both the application and Visual Editor
npm run dev:visual-editor
```
This command runs:
- Vite dev server on port 5173 (or next available)
- Netlify dev server on port 8888 with Functions support
- Static server for dist files on port 3999

### Access Points
- **Application**: http://localhost:5173/ (main PolePlan Pro app)
- **Visual Editor**: http://localhost:8888/ (content editing interface)
- **Static Preview**: http://localhost:3999/ (built version preview)

### Content Editing Workflow
1. Start dev servers with `npm run dev:visual-editor`
2. Access Visual Editor at http://localhost:8888/
3. Edit content through the visual interface
4. Changes auto-save to content JSON files
5. Application hot-reloads with new content

## Content Structure

### Site Configuration (`content/site.json`)
```json
{
  "siteTitle": "PolePlan Pro",
  "logo": "/assets/logo.png",
  "primaryColor": "#3b82f6",
  "secondaryColor": "#ef4444",
  "navigation": [
    { "label": "Home", "url": "/" },
    { "label": "Calculator", "url": "/calculator" }
  ]
}
```

### Page Content (`content/pages/home.json`)
```json
{
  "title": "PolePlan Pro - NESC Compliant Pole Calculations",
  "slug": "home",
  "seoDescription": "Professional pole attachment calculations with geospatial export",
  "sections": [
    {
      "type": "HeroSection",
      "title": "Professional Pole Planning Made Simple",
      "subtitle": "NESC-compliant calculations with geospatial export",
      "ctaLabel": "Start Calculating",
      "ctaUrl": "/calculator"
    }
  ]
}
```

## Best Practices

### Content Editing
- Use Hero sections for landing page headers
- Rich Text sections for detailed content (supports Markdown)
- Feature sections for capability lists
- CTA sections for conversion points

### Separation of Concerns
- **Visual Editor**: Marketing content, site configuration
- **Application**: Interactive tools, calculations, data processing
- **Build Process**: Combines content with application at build time

### Performance Considerations
- Content JSON files are small and cacheable
- Visual Editor runs separately from main application
- No impact on application bundle size or performance

## Deployment Integration

### Netlify Visual Editor Setup
1. Deploy application with content files
2. Enable Visual Editor in Netlify dashboard
3. Configure content source as Git repository
4. Set preview URL to deployed application

### Content Publishing
- Content changes commit to Git automatically
- Deploys trigger on content updates
- Application rebuilds with new content
- No downtime for content updates

## Troubleshooting

### Common Issues
- **Port Conflicts**: Visual Editor uses multiple ports; ensure they're available
- **Content Sync**: Changes in Visual Editor auto-save to local files
- **Build Integration**: Content files included in build process automatically

### Development Tips
- Use `npm run dev:visual-editor` for full content editing workflow
- Regular `npm run dev` for application-only development
- Visual Editor requires content files to exist before first launch

## Benefits of This Approach

### For Content Editors
- Visual interface for content management
- No need to edit JSON files directly
- Real-time preview of changes
- Structured content with validation

### For Developers
- Application complexity unchanged
- No CMS integration required in app code
- Content and application can be developed independently
- Maintains application performance and flexibility

This hybrid approach provides the best of both worlds: powerful content management for marketing materials while preserving the sophisticated engineering application that makes PolePlan Pro unique.
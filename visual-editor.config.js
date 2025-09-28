// Visual Editor Configuration for PolePlan Pro Content Management
export default {
  stackbitVersion: '~0.6.0',
  
  // Content source configuration
  contentSources: [
    {
      type: 'git',
      rootPath: './',
      contentDirs: ['content'],
      
      // Content models for Visual Editor
      models: [
        // Site-wide configuration
        {
          name: 'Site',
          type: 'data',
          file: 'content/site.json',
          fields: [
            { name: 'siteTitle', type: 'string', required: true, label: 'Site Title' },
            { name: 'logo', type: 'string', label: 'Logo Path' },
            { name: 'primaryColor', type: 'string', label: 'Primary Brand Color' },
            { name: 'secondaryColor', type: 'string', label: 'Secondary Brand Color' },
            {
              name: 'navigation',
              type: 'list',
              label: 'Navigation Items',
              items: {
                type: 'object',
                fields: [
                  { name: 'label', type: 'string', required: true, label: 'Nav Label' },
                  { name: 'url', type: 'string', required: true, label: 'Nav URL' }
                ]
              }
            }
          ]
        },
        
        // Page model for marketing pages
        {
          name: 'Page',
          type: 'page',
          urlPath: '/{slug}',
          filePath: 'content/pages/{slug}.json',
          fields: [
            { name: 'title', type: 'string', required: true, label: 'Page Title' },
            { name: 'slug', type: 'string', required: true, label: 'URL Slug' },
            { name: 'body', type: 'text', label: 'Body Content' },
            { name: 'seoDescription', type: 'string', label: 'SEO Description' },
            {
              name: 'sections',
              type: 'list',
              label: 'Page Sections',
              items: {
                type: 'model',
                models: ['HeroSection', 'RichTextSection', 'FeatureSection', 'CtaSection']
              }
            }
          ]
        },
        
        // Section models for page building
        {
          name: 'HeroSection',
          type: 'object',
          label: 'Hero Section',
          fields: [
            { name: 'type', type: 'string', const: 'HeroSection', hidden: true },
            { name: 'title', type: 'string', required: true, label: 'Hero Title' },
            { name: 'subtitle', type: 'string', label: 'Hero Subtitle' },
            { name: 'backgroundImage', type: 'string', label: 'Background Image URL' },
            { name: 'ctaLabel', type: 'string', label: 'Button Text' },
            { name: 'ctaUrl', type: 'string', label: 'Button URL' }
          ]
        },
        
        {
          name: 'RichTextSection',
          type: 'object',
          label: 'Rich Text Section',
          fields: [
            { name: 'type', type: 'string', const: 'RichTextSection', hidden: true },
            { name: 'content', type: 'markdown', required: true, label: 'Markdown Content' }
          ]
        },
        
        {
          name: 'FeatureSection',
          type: 'object',
          label: 'Feature Grid Section',
          fields: [
            { name: 'type', type: 'string', const: 'FeatureSection', hidden: true },
            { name: 'heading', type: 'string', required: true, label: 'Section Heading' },
            {
              name: 'features',
              type: 'list',
              label: 'Feature Items',
              items: {
                type: 'object',
                fields: [
                  { name: 'title', type: 'string', required: true, label: 'Feature Title' },
                  { name: 'text', type: 'text', required: true, label: 'Feature Description' }
                ]
              }
            }
          ]
        },
        
        {
          name: 'CtaSection',
          type: 'object',
          label: 'Call to Action Section',
          fields: [
            { name: 'type', type: 'string', const: 'CtaSection', hidden: true },
            { name: 'text', type: 'string', required: true, label: 'CTA Text' },
            { name: 'buttonLabel', type: 'string', label: 'Button Label' },
            { name: 'buttonUrl', type: 'string', label: 'Button URL' }
          ]
        }
      ]
    }
  ],

  // Development preview configuration
  previewUrl: 'http://localhost:5173',
  
  // Content file patterns
  contentFilesGlob: 'content/**/*.json',
  
  // Exclude main application from editing
  excludePages: ['/app/**', '/calculator/**']
};
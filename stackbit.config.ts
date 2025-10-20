import { defineStackbitConfig } from '@stackbit/types';

export default defineStackbitConfig({
  stackbitVersion: '~0.6.0',
  ssgName: 'custom',
  nodeVersion: '22.20.0',
  contentSources: [
    {
      type: 'git',
      rootPath: 'content',
      contentDirs: ['pages'],
      models: [
        {
          name: 'Page',
          type: 'page',
          urlPath: '/{slug}',
          filePath: 'pages/{slug}.json',
          fields: [
            { name: 'title', type: 'string', required: true },
            { name: 'slug', type: 'slug', required: true },
            { name: 'body', type: 'markdown', required: false },
            { name: 'seoDescription', type: 'string', required: false },
            {
              name: 'sections',
              type: 'list',
              of: [
                {
                  name: 'HeroSection',
                  type: 'object',
                  fields: [
                    { name: 'type', type: 'string', const: 'HeroSection' },
                    { name: 'title', type: 'string', required: true },
                    { name: 'subtitle', type: 'string', required: false },
                    { name: 'backgroundImage', type: 'image', required: false },
                    { name: 'ctaLabel', type: 'string', required: false },
                    { name: 'ctaUrl', type: 'string', required: false }
                  ]
                },
                {
                  name: 'RichTextSection',
                  type: 'object',
                  fields: [
                    { name: 'type', type: 'string', const: 'RichTextSection' },
                    { name: 'content', type: 'markdown', required: true }
                  ]
                },
                {
                  name: 'FeatureSection',
                  type: 'object',
                  fields: [
                    { name: 'type', type: 'string', const: 'FeatureSection' },
                    { name: 'heading', type: 'string', required: true },
                    {
                      name: 'features',
                      type: 'list',
                      of: {
                        name: 'FeatureItem',
                        type: 'object',
                        fields: [
                          { name: 'type', type: 'string', const: 'FeatureItem' },
                          { name: 'title', type: 'string', required: true },
                          { name: 'text', type: 'text', required: true }
                        ]
                      }
                    }
                  ]
                },
                {
                  name: 'CtaSection',
                  type: 'object',
                  fields: [
                    { name: 'type', type: 'string', const: 'CtaSection' },
                    { name: 'text', type: 'text', required: true },
                    { name: 'buttonLabel', type: 'string', required: true },
                    { name: 'buttonUrl', type: 'string', required: true }
                  ]
                }
              ]
            }
          ]
        },
        {
          name: 'SiteConfig',
          type: 'config',
          filePath: 'site.json',
          fields: [
            { name: 'siteTitle', type: 'string', required: true },
            { name: 'logo', type: 'image', required: false },
            { name: 'primaryColor', type: 'color', required: false },
            { name: 'secondaryColor', type: 'color', required: false },
            {
              name: 'navigation',
              type: 'list',
              of: {
                type: 'object',
                fields: [
                  { name: 'label', type: 'string', required: true },
                  { name: 'url', type: 'string', required: true }
                ]
              }
            }
          ]
        }
      ]
    }
  ]
});
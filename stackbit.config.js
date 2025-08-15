import { defineStackbitConfig } from '@stackbit/types';
import { GitContentSource } from '@stackbit/cms-git';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineStackbitConfig({
  siteName: 'Pole Plan Wizard',
  contentSources: [
    new GitContentSource({
      rootPath: __dirname,
      contentDirs: ['content'],
      models: [
        {
          name: 'Page',
          type: 'page',
          urlPath: '/{slug}',
          filePath: 'content/pages/{slug}.json',
          fields: [
            { name: 'slug', type: 'string', required: true },
            { name: 'title', type: 'string', required: true }
          ]
        }
      ]
    })
  ],
  siteMap: ({ documents, models }) => {
    const pageModelNames = new Set(models.filter(m => m.type === 'page').map(m => m.name));
    return documents
      .filter(d => pageModelNames.has(d.modelName))
      .map((document) => {
        const data = document.data || {};
        let slug = data.slug;
        if (!slug && document.filePath) {
          const m = document.filePath.match(/content\/pages\/(.+)\.json$/);
          if (m) slug = m[1];
        }
        if (!slug) return null;
        const isHome = slug === 'home' || slug === 'index';
        return {
          stableId: document.id,
          urlPath: isHome ? '/' : `/${slug}`,
          document,
          isHomePage: isHome,
        };
      })
      .filter(Boolean);
  }
});

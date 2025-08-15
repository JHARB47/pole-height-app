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
            { name: 'title', type: 'string', required: true }
          ]
        }
      ]
    })
  ]
});

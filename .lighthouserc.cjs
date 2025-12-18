// @ts-nocheck
/**
 * Lighthouse CI configuration for PolePlan Pro
 * Focuses on PWA compliance and stores reports locally.
 * @type {import('@lhci/cli').Config}
 */
module.exports = {
  ci: {
    collect: {
      url: ['http://127.0.0.1:4173/'],
      numberOfRuns: 1,
      startServerCommand: 'npx --yes http-server dist -p 4173 --silent',
      startServerReadyPattern: 'Available on',
      settings: {
        onlyCategories: ['pwa'],
      },
    },
    assert: {
      assertions: {
        'categories:pwa': ['error', { minScore: 1 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};

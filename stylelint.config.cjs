/* Optional: JS Stylelint config for editors that prefer JS config files */
module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-tailwindcss'
  ],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'apply', 'variants', 'responsive', 'screen', 'layer']
      }
    ],
    // Allow vendor prefixes for cross-browser compatibility (Safari, iOS, older browsers)
    'property-no-vendor-prefix': null,
    'value-no-vendor-prefix': null,
    // Keep traditional media query syntax for broader browser support
    'media-feature-range-notation': null
  }
};

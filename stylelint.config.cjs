/* Optional: JS Stylelint config for editors that prefer JS config files */
module.exports = {
  extends: ["stylelint-config-standard", "stylelint-config-tailwindcss"],
  rules: {
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "tailwind",
          "apply",
          "variants",
          "responsive",
          "screen",
          "layer",
        ],
      },
    ],
    // Allow vendor prefixes for cross-browser compatibility (Safari, iOS, older browsers)
    "property-no-vendor-prefix": null,
    "value-no-vendor-prefix": null,
    // Keep traditional media query syntax for broader browser support
    "media-feature-range-notation": null,
    // Disable strict class pattern to allow BEM naming with __ (element) and -- (modifier)
    "selector-class-pattern": null,
    // Allow rgba() color notation (widely supported)
    "color-function-notation": null,
    "color-function-alias-notation": null,
    "alpha-value-notation": null,
    // Allow keyword case flexibility (system fonts, color spaces, etc.)
    "value-keyword-case": null,
    // Allow any hex length (#fff or #ffffff)
    "color-hex-length": null,
    // Relax some strict rules for existing code
    "rule-empty-line-before": null,
    "custom-property-empty-line-before": null,
    "no-descending-specificity": null,
    "property-no-deprecated": null,
    // Allow longhand properties (not requiring shorthand)
    "declaration-block-no-redundant-longhand-properties": null,
  },
};

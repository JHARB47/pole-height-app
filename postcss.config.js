import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// Delegate to CJS config to avoid ESM/CJS duplication
export default require('./postcss.config.cjs');

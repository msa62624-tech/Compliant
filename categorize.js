const pkg = require('/home/runner/work/Compliant/Compliant/package.json');
const deps = Object.keys(pkg.dependencies).sort();

// Packages that MUST be external
const nestjsPackages = deps.filter(d => d.startsWith('@nestjs/'));
const prismaPackages = deps.filter(d => d.includes('prisma'));
const coreUtils = ['reflect-metadata', 'rxjs', 'class-transformer', 'class-validator', 'serverless-http'];

// NestJS peer dependencies and their transitive deps
const nestjsPeerDeps = [
  'axios', 'follow-redirects', 'form-data', 'mime-types', 'mime-db', 'asynckit', 'combined-stream', 'proxy-from-env',
  'bullmq', 'cron-parser', 'msgpackr', 'node-abort-controller', 'uuid', 'semver',
  'cron', 'luxon', '@types/luxon',
  'dotenv', 'dotenv-expand',
  'ioredis', '@ioredis/commands', 'cluster-key-slot', 'debug', 'denque', 'lodash.defaults', 'lodash.isarguments', 'redis-errors', 'redis-parser', 'standard-as-callback', 'ms',
  'jsonwebtoken', 'jws', 'jwa', 'buffer-equal-constant-time', 'ecdsa-sig-formatter', 'lodash.includes', 'lodash.isboolean', 'lodash.isinteger', 'lodash.isnumber', 'lodash.isplainobject', 'lodash.isstring', 'lodash.once',
  'lodash',
  'passport', 'passport-strategy', 'pause', 'utils-merge',
  'fast-safe-stringify', 'file-type', 'iterare', 'load-esm', 'path-to-regexp', 'tslib', 'uid', '@nuxt/opencollective'
];

// Winston and ALL its dependencies
const winstonPackages = [
  'winston', 'nest-winston',
  'logform', 'fecha', '@types/triple-beam',
  'triple-beam',
  'winston-transport',
  '@colors/colors',
  '@dabh/diagnostics', '@so-ric/colorspace', 'color', 'color-convert', 'color-name', 'color-string', 'text-hex', 'enabled', 'kuler',
  'async',
  'is-stream',
  'one-time', 'fn.name',
  'readable-stream', 'inherits', 'string_decoder', 'util-deprecate', 'safe-buffer', 'buffer', 'events', 'process', 'abort-controller', 'event-target-shim', 'base64-js', 'ieee754', 'es-set-tostringtag', 'hasown',
  'safe-stable-stringify',
  'stack-trace'
];

// Backend packages that should be BUNDLED
const bundledPackages = [
  '@anthropic-ai/sdk', '@sendgrid/mail', 'aws-sdk', 'bcrypt', 'cookie-parser', 
  'handlebars', 'isomorphic-dompurify', 'multer', 'nodemailer', 'openai', 
  'passport-jwt', 'pdf-parse', 'pdfkit'
];

const externalPackages = [
  ...nestjsPackages,
  ...prismaPackages,
  ...coreUtils,
  ...nestjsPeerDeps,
  ...winstonPackages
];

const uniqueExternal = [...new Set(externalPackages)].sort();

console.log(`Total dependencies: ${deps.length}`);
console.log(`Total EXTERNAL packages: ${uniqueExternal.length}`);
console.log(`Total BUNDLED packages: ${bundledPackages.length}`);

// Write to files
const fs = require('fs');
fs.writeFileSync('/tmp/external_packages.txt', uniqueExternal.join('\n'));
fs.writeFileSync('/tmp/bundled_packages.txt', bundledPackages.join('\n'));

console.log('\n✅ External packages written to /tmp/external_packages.txt');
console.log('✅ Bundled packages written to /tmp/bundled_packages.txt');

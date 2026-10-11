// Vercel function entry: serves the NestJS app bundled by `npm run build:vercel`.
const server = require('../dist/server.js');

module.exports = server.default;

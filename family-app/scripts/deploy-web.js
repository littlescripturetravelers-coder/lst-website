/* global __dirname */
// Builds the NestWork web app and puts it online on Vercel's free plan:  npm run deploy:web
// First time only: run  npx vercel login  and sign in. Run this again after every app update (next to eas update).
// The site goes up from web-build/nestwork, so the Vercel project is named "nestwork" (address nestwork.vercel.app, or a close one if that's taken).
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const site = path.join(root, 'web-build', 'nestwork');

execSync('node scripts/build-web.js', { cwd: root, stdio: 'inherit' });

// Fresh copy of the built app, keeping .vercel (which project this folder belongs to) between runs.
fs.mkdirSync(site, { recursive: true });
for (const f of fs.readdirSync(site)) if (f !== '.vercel') fs.rmSync(path.join(site, f), { recursive: true, force: true });
fs.cpSync(path.join(root, 'dist'), site, { recursive: true });

execSync('npx vercel@latest deploy --prod --yes', { cwd: site, stdio: 'inherit' });
console.log('\nNestWork is online. The "Aliased" line above is your address: open it in Safari on the iPhone, then Share, Add to Home Screen.');

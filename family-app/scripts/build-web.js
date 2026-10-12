/* global __dirname */
// Builds the NestWork web app (Safari, Add to Home Screen) into dist/. Works on Windows and Mac:  npm run build:web
// It uses the same public Supabase address and key as the phone app (from eas.json), so it signs in to the same family data.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const eas = JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8'));
const findEnv = o => { if (!o || typeof o !== 'object') return null; if (o.env) return o.env; for (const v of Object.values(o)) { const r = findEnv(v); if (r) return r; } return null; };
const env = { ...process.env, ...findEnv(eas) };
if (!env.EXPO_PUBLIC_SUPABASE_URL) throw new Error('No EXPO_PUBLIC_SUPABASE_URL in eas.json');
execSync('npx expo export --platform web --clear', { cwd: root, env, stdio: 'inherit' });
console.log('\nWeb app built in dist/. Upload that folder to host it.');

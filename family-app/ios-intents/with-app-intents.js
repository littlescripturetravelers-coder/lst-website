/* global __dirname */
// Expo config plugin: copies LewisFamilyIntents.swift into the iOS target and exposes Supabase URL/anon key to Swift via Info.plist.
const { withXcodeProject, withInfoPlist } = require('@expo/config-plugins');
const fs = require('fs'); const path = require('path');
module.exports = function withAppIntents(config) {
  config = withInfoPlist(config, c => { c.modResults.LFSupabaseURL = process.env.EXPO_PUBLIC_SUPABASE_URL; c.modResults.LFSupabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY; return c; });
  return withXcodeProject(config, c => {
    const proj = c.modResults; const name = c.modRequest.projectName;
    const dest = path.join(c.modRequest.platformProjectRoot, name, 'LewisFamilyIntents.swift');
    fs.copyFileSync(path.join(__dirname, 'LewisFamilyIntents.swift'), dest);
    const group = proj.pbxGroupByName(name);
    if (!proj.hasFile(name + '/LewisFamilyIntents.swift')) proj.addSourceFile(name + '/LewisFamilyIntents.swift', null, group && proj.findPBXGroupKey({ name }));
    return c;
  });
};

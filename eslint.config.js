const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  ...expoConfig,
  prettierConfig,
  {
    ignores: [
      'dist/*',
      'node_modules/*',
      '.expo/*',
      '.ds-sync/*',
      'ds-bundle/*',
      // Deno runtime (Supabase Edge Functions) — different globals/imports
      // (Deno.*, esm.sh URL specifiers) than the RN app. _shared/kyc.ts is
      // deliberately isomorphic and IS linted/typechecked normally.
      'supabase/functions/kyc-start/*',
      'supabase/functions/kyc-webhook/*',
    ],
  },
];

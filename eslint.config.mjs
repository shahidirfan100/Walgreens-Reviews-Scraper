import prettier from 'eslint-config-prettier';

import apify from '@apify/eslint-config/js.js';

const config = [
    ...apify,
    prettier,
    {
        ignores: ['**/dist', 'check_*.mjs'],
    },
    {
        files: ['eslint.config.mjs'],
        rules: {
            'import-x/no-default-export': 'off',
        },
    },
];

export default config;

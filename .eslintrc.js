module.exports = {
    root: true,
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-native/all',
        // 'plugin:sonarjs/recommended' 
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'react', 'react-native'], // 'sonarjs'
    env: {
        'react-native/react-native': true,
    },
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
    },
    rules: {
        'react-native/no-inline-styles': 'off',
        'react-native/no-color-literals': 'off',
        'react-native/sort-styles': 'off',
        // 'sonarjs/cognitive-complexity': ['warn', 15],
        '@typescript-eslint/no-explicit-any': 'warn',
        'react/react-in-jsx-scope': 'off',
    },
    overrides: [
        {
            files: ['*.js', '*.cjs'],
            env: {
                node: true,
            },
            rules: {
                '@typescript-eslint/no-require-imports': 'off',
                '@typescript-eslint/no-var-requires': 'off',
            },
        },
    ],
    settings: {
        react: {
            version: 'detect',
        },
    },
};

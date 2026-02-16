import noClsxConditionalArgs from './eslint-rules/no-clsx-conditional-args.js';

export default [
  {
    plugins: {
      local: {
        rules: {
          'no-clsx-conditional-args': noClsxConditionalArgs,
        },
      },
    },
    rules: {
      'local/no-clsx-conditional-args': 'error',
    },
  },
];

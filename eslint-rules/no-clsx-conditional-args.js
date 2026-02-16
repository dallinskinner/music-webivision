/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce clsx object syntax for conditional classes',
    },
    messages: {
      useObjectSyntax: 'Use clsx object syntax for conditional classes.',
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'clsx') {
          return;
        }

        for (const arg of node.arguments) {
          if (
            (arg.type === 'LogicalExpression' && arg.operator === '&&') ||
            arg.type === 'ConditionalExpression'
          ) {
            context.report({ node: arg, messageId: 'useObjectSyntax' });
          }
        }
      },
    };
  },
};

/**
 * Wrap every <table> in <div class="overflow-table"> so wide tables
 * scroll horizontally on mobile instead of breaking the viewport.
 */
import { visit } from 'unist-util-visit';

export function rehypeWrapTables() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (
        node.tagName !== 'table' ||
        !parent ||
        index === undefined ||
        (parent.type === 'element' &&
          parent.properties?.className?.includes?.('overflow-table'))
      ) {
        return;
      }
      const wrapper = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['overflow-table'] },
        children: [node],
      };
      parent.children[index] = wrapper;
    });
  };
}

import { visit } from 'unist-util-visit';

/**
 * Set frontmatter.hasMath = true when the markdown AST contains
 * a math node (inlineMath or math, produced by remark-math).
 *
 * Used by PageLayout to conditionally include the KaTeX stylesheet.
 */
export function remarkHasMath() {
  return (tree, { data }) => {
    let hasMath = false;
    visit(tree, (node) => {
      if (node.type === 'math' || node.type === 'inlineMath') {
        hasMath = true;
        return false;
      }
    });
    data.astro.frontmatter.hasMath = hasMath;
  };
}

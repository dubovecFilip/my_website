import { visit } from 'unist-util-visit';

/**
 * When a paragraph contains a single image (the normal case for
 * `![alt](url)` written on its own line in markdown), replace the
 * paragraph with a <figure><img><figcaption>alt</figcaption></figure>
 * so the alt text renders as a real, styled caption automatically.
 * Paragraphs mixing an image with other text are left untouched.
 */
export default function rehypeImageCaptions() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'p' || !parent || index === undefined) return;

      const children = node.children.filter(
        (child) => !(child.type === 'text' && child.value.trim() === ''),
      );
      if (children.length !== 1) return;

      const img = children[0];
      if (img.type !== 'element' || img.tagName !== 'img') return;

      const alt = typeof img.properties?.alt === 'string' ? img.properties.alt : '';

      const figureChildren = [img];
      if (alt.trim()) {
        figureChildren.push({
          type: 'element',
          tagName: 'figcaption',
          properties: {},
          children: [{ type: 'text', value: alt }],
        });
      }

      const figure = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['article-figure'] },
        children: figureChildren,
      };

      parent.children[index] = figure;
    });
  };
}

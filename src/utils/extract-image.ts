/**
 * Returns the URL of the first `![alt](url)` image found in a markdown
 * article body, or undefined if the article has no images. Used on the
 * homepage to give grid cards a real cover photo when one exists, falling
 * back to a generated gradient thumb otherwise.
 */
export function extractFirstImage(body: string | undefined): string | undefined {
  if (!body) return undefined;
  const match = body.match(/!\[[^\]]*\]\(([^)\s]+)/);
  return match?.[1];
}

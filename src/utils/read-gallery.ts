import fs from "node:fs";
import path from "node:path";

/**
 * Collects every image the site ships: the standalone drops in
 * `public/images/gallery/` and every picture uploaded with an article under
 * `public/images/articles/<id>/`. Anything added to either place shows up in
 * the gallery without a second step.
 */
const PUBLIC_DIR = path.join(process.cwd(), "public");
const GALLERY_DIR = path.join(PUBLIC_DIR, "images/gallery");
const ARTICLES_DIR = path.join(PUBLIC_DIR, "images/articles");
const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

export interface GalleryPhoto {
  src: string;
  file: string;
  /** Set when the image came from an article folder. */
  articleId?: string;
}

function imagesIn(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => IMAGE_EXT.test(file))
    .sort((a, b) => a.localeCompare(b));
}

export function readGalleryPhotos(): GalleryPhoto[] {
  const standalone: GalleryPhoto[] = imagesIn(GALLERY_DIR).map((file) => ({
    src: `/images/gallery/${file}`,
    file,
  }));

  const fromArticles: GalleryPhoto[] = [];
  if (fs.existsSync(ARTICLES_DIR)) {
    const folders = fs
      .readdirSync(ARTICLES_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const articleId of folders) {
      for (const file of imagesIn(path.join(ARTICLES_DIR, articleId))) {
        fromArticles.push({
          src: `/images/articles/${articleId}/${file}`,
          file,
          articleId,
        });
      }
    }
  }

  return [...standalone, ...fromArticles];
}

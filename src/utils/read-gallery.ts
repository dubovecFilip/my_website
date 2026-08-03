import fs from "node:fs";
import path from "node:path";

/**
 * Reads photos straight out of `public/images/gallery/` at build time.
 * There's no content-collection entry per photo; just drop a file in that
 * folder and it shows up. Newest file (by name, then mtime as a tiebreaker)
 * first.
 */
const GALLERY_DIR = path.join(process.cwd(), "public/images/gallery");
const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

export interface GalleryPhoto {
  src: string;
  file: string;
}

export function readGalleryPhotos(): GalleryPhoto[] {
  if (!fs.existsSync(GALLERY_DIR)) return [];

  return fs
    .readdirSync(GALLERY_DIR)
    .filter((file) => IMAGE_EXT.test(file))
    .sort((a, b) => {
      const statA = fs.statSync(path.join(GALLERY_DIR, a)).mtimeMs;
      const statB = fs.statSync(path.join(GALLERY_DIR, b)).mtimeMs;
      return statB - statA;
    })
    .map((file) => ({ src: `/images/gallery/${file}`, file }));
}

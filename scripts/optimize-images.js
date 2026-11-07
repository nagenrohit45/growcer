import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
const root = "src/assets/images";
async function visit(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const source = path.join(directory, entry.name);
    if (entry.isDirectory()) await visit(source);
    else if (/\.(png|jpe?g)$/i.test(entry.name)) {
      const destination = source.replace(/\.(png|jpe?g)$/i, ".webp");
      await sharp(source)
        .rotate()
        .resize({
          width: entry.name === "hero.png" ? 1200 : 640,
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toFile(destination);
    }
  }
}
await visit(root);
console.log("Optimized image variants created. Original assets preserved.");

// Cloudflare Pages uploads files under any "node_modules"-named path but
// won't actually serve them (falls through to the SPA HTML fallback with a
// 200, so it looks like the file exists but comes back as text/html) -
// that's exactly where Expo's static web export puts vendored fonts/images
// (assets/node_modules/@expo/vector-icons/...), which broke every icon font
// and a couple of nav-chrome images in production.
//
// Fix: move dist/assets/node_modules -> dist/assets/vendor after export, and
// rewrite the same string in every emitted JS/HTML file that references it.
import { readdirSync, renameSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIST = new URL("../dist/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const OLD_SEGMENT = "assets/node_modules";
const NEW_SEGMENT = "assets/vendor";

const oldDir = join(DIST, "assets", "node_modules");
const newDir = join(DIST, "assets", "vendor");

if (existsSync(oldDir)) {
  renameSync(oldDir, newDir);
  console.log(`Moved ${oldDir} -> ${newDir}`);
} else {
  console.log(`No ${oldDir} found, nothing to move.`);
}

function walk(dir, exts, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, exts, out);
    else if (exts.some((ext) => entry.name.endsWith(ext))) out.push(full);
  }
  return out;
}

let filesChanged = 0;
for (const file of walk(DIST, [".js", ".html"])) {
  const content = readFileSync(file, "utf8");
  if (content.includes(OLD_SEGMENT)) {
    writeFileSync(file, content.split(OLD_SEGMENT).join(NEW_SEGMENT));
    filesChanged++;
  }
}
console.log(`Rewrote "${OLD_SEGMENT}" -> "${NEW_SEGMENT}" in ${filesChanged} file(s).`);

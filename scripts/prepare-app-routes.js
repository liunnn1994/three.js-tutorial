import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outputDir = join(process.cwd(), "dist");
const htmlFiles = [];

function collectHtmlFiles(directory) {
  for (const entry of readdirSync(directory)) {
    const filePath = join(directory, entry);
    if (statSync(filePath).isDirectory()) {
      collectHtmlFiles(filePath);
    } else if (entry.endsWith(".html")) {
      htmlFiles.push(filePath);
    }
  }
}

collectHtmlFiles(outputDir);

// Case-sensitive index of every file under dist. Used instead of existsSync,
// which is case-insensitive on Windows and would let mistyped routes through
// that then 404 on Android's case-sensitive asset server.
const distFiles = new Set();
function collectDistFiles(directory, prefix = "") {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      collectDistFiles(join(directory, entry.name), relative);
    } else {
      distFiles.add(relative);
    }
  }
}
collectDistFiles(outputDir);

let rewrittenLinks = 0;
const unresolvedRoutes = new Set();
for (const htmlFile of htmlFiles) {
  const source = readFileSync(htmlFile, "utf8");
  const output = source.replace(
    /href=(['"])(\/[^'"?#]*)([?#][^'"]*)?\1/g,
    (match, quote, originalPath, suffix = "") => {
      if (
        originalPath === "/" ||
        originalPath.startsWith("//") ||
        originalPath.endsWith(".html")
      ) {
        return match;
      }

      const relative = originalPath.replace(/\/$/, "").slice(1);
      if (distFiles.has(`${relative}.html`)) {
        rewrittenLinks += 1;
        return `href=${quote}${relative}.html${suffix}${quote}`;
      }

      // Any other file that exists in dist (whatever its extension) is a
      // static asset rather than a page route, so it is emitted as-is.
      if (distFiles.has(relative)) return match;

      unresolvedRoutes.add(originalPath);
      return match;
    },
  );

  if (output !== source) writeFileSync(htmlFile, output);
}

console.log(`Rewrote ${rewrittenLinks} app route links to explicit .html files`);

if (unresolvedRoutes.size > 0) {
  throw new Error(
    `Unresolved internal app routes:\n${[...unresolvedRoutes].sort().map((route) => `  ${route}`).join("\n")}`,
  );
}

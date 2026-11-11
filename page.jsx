import path from "node:path";
import { readFile } from "node:fs/promises";
import SiteEnhancements from "./site-enhancements";

export default async function HomePage() {
  const source = await readFile(path.join(process.cwd(), "index.html"), "utf8");
  const body = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];

  if (!body) {
    throw new Error("AUDIRA page markup could not be loaded from index.html.");
  }

  const markup = body
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<div class="page-loader" aria-hidden="true">[\s\S]*?<\/div>/i, "");
  return <SiteEnhancements markup={markup} />;
}

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const violations: string[] = [];
const ignoredDirectories = new Set(["node_modules", ".next", ".git", "coverage", "playwright-report", "test-results", ".techpath-patch-backups"]);

async function walk(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory)) {
    if (ignoredDirectories.has(entry)) continue;
    const absolute = path.join(directory, entry);
    const details = await stat(absolute);
    if (details.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

function relative(file: string) {
  return path.relative(ROOT, file).replaceAll(path.sep, "/");
}

function add(file: string, rule: string) {
  violations.push(`${relative(file)}: ${rule}`);
}

async function main() {
  const files = await walk(ROOT);
  for (const file of files) {
    const name = relative(file);
    const base = path.basename(file);
    // Local/deploy secret files are expected on disk and gitignored; flag only unexpected env files.
    if (/^\.env($|\.)/.test(base) && base !== ".env.example") {
      if (base === ".env" || base.endsWith(".local")) continue;
      add(file, "environment secret file must not be committed");
      continue;
    }
    if (!/\.(ts|tsx|js|jsx|json|ya?ml|md)$/.test(file)) continue;
    const source = await readFile(file, "utf8");
    const runtime = name.startsWith("src/") && !name.startsWith("src/scripts/") && !name.startsWith("src/tests/");
    if (runtime && /Math\.random\s*\(/.test(source)) add(file, "Math.random is forbidden for production logic");
    if (runtime && /getPublicUrl\s*\(/.test(source)) add(file, "public storage URLs are forbidden for sensitive files");
    if (runtime && /console\.log\s*\(/.test(source)) add(file, "use the structured logger instead of console.log");
    if (name.startsWith("src/components/") && /from\s+["']@\/lib\/db["']/.test(source)) {
      add(file, "UI components must not access the database directly");
    }
    if (name.startsWith("src/components/") && /SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|SESSION_SECRET/.test(source)) {
      add(file, "server secrets must not be referenced by client/UI components");
    }
    if (runtime && /(admin123|changeme123|password123)/i.test(source)) add(file, "known default password detected");
  }

  const packageJson = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8")) as { scripts?: Record<string, string> };
  if (packageJson.scripts?.["db:push"]) violations.push("package.json: db:push is forbidden in the shared production workflow");

  const workflow = await readFile(path.join(ROOT, ".github/workflows/quality.yml"), "utf8").catch(() => "");
  for (const required of ["quality:gate", "typecheck", "test:unit", "db:smoke", "build"]) {
    if (!workflow.includes(required)) violations.push(`.github/workflows/quality.yml: missing ${required}`);
  }

  if (violations.length) {
    console.error(`Quality gate failed with ${violations.length} violation(s):\n${violations.map((item) => `- ${item}`).join("\n")}`);
    process.exitCode = 1;
    return;
  }
  console.info("Quality gate passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { PublisherPlugin, LocalGitPublisherConfig } from "@/lib/cms/publisher/types";

const execFileAsync = promisify(execFile);

function ensureRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Publisher payload must be a JSON object.");
  }
  return value as Record<string, unknown>;
}

function normalizeBody(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeFrontmatter(payload: Record<string, unknown>) {
  const frontmatter: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (key === "body") continue;
    frontmatter[key] = value;
  }
  return frontmatter;
}

function frontmatterToYaml(frontmatter: Record<string, unknown>) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(frontmatter)) {
    lines.push(`${key}: ${JSON.stringify(value)}`);
  }
  lines.push("---");
  return `${lines.join("\n")}\n`;
}

async function maybeCommit(config: LocalGitPublisherConfig, filePath: string, slug: string) {
  if (!config.commit?.enabled) return;
  const messageTemplate = config.commit.messageTemplate ?? "chore(cms): publish {slug}";
  const message = messageTemplate.replace("{slug}", slug);
  await execFileAsync("git", ["add", "-A", filePath], { cwd: config.repoPath });
  await execFileAsync("git", ["commit", "-m", message], { cwd: config.repoPath });
}

export class LocalGitPublisherPlugin implements PublisherPlugin {
  readonly provider = "local_git" as const;
  private readonly config: LocalGitPublisherConfig;

  constructor(config: LocalGitPublisherConfig) {
    this.config = config;
  }

  async publish(input: Parameters<PublisherPlugin["publish"]>[0]) {
    const payload = ensureRecord(input.delta.nextTargetPayload);
    const postsDir = this.config.postsDir ?? "content";
    const extension = this.config.extension ?? "mdx";
    const previous = (input.previousTargetSnapshot?.data ?? {}) as Record<string, unknown>;
    const slug = String(payload.slug ?? previous.slug ?? input.post.slug);
    const outputPath = path.join(this.config.repoPath, postsDir, `${slug}.${extension}`);

    if (input.post.deletedAt) {
      await fs.rm(outputPath, { force: true });
      await maybeCommit(this.config, outputPath, slug);
      return {
        outputRef: outputPath,
        outputPayload: payload,
      };
    }

    const frontmatter = normalizeFrontmatter(payload);
    const body = normalizeBody(payload.body);
    const fileContents = `${frontmatterToYaml(frontmatter)}\n${body}\n`;

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, fileContents, "utf8");
    await maybeCommit(this.config, outputPath, slug);

    return {
      outputRef: outputPath,
      outputPayload: payload,
    };
  }
}

import type { PublisherPlugin } from "@/lib/cms/publisher/types";

interface GitHubPublisherConfig {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
  postsDir?: string;
  extension?: "md" | "mdx";
  commitMessageTemplate?: string;
}

function assertConfig(config: unknown): GitHubPublisherConfig {
  if (!config || typeof config !== "object") {
    throw new Error("GitHub publisher config must be an object.");
  }

  const parsed = config as Record<string, unknown>;
  const token = String(parsed.token ?? "");
  const owner = String(parsed.owner ?? "");
  const repo = String(parsed.repo ?? "");

  if (!token || !owner || !repo) {
    throw new Error("GitHub publisher requires token, owner, and repo.");
  }

  return {
    token,
    owner,
    repo,
    branch: typeof parsed.branch === "string" ? parsed.branch : "main",
    postsDir: typeof parsed.postsDir === "string" ? parsed.postsDir : "content",
    extension: parsed.extension === "md" ? "md" : "mdx",
    commitMessageTemplate:
      typeof parsed.commitMessageTemplate === "string"
        ? parsed.commitMessageTemplate
        : "chore(cms): publish {slug}",
  };
}

function toFrontmatter(payload: Record<string, unknown>) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(payload)) {
    if (key === "body") continue;
    lines.push(`${key}: ${JSON.stringify(value)}`);
  }
  lines.push("---");
  return lines.join("\n");
}

async function getExistingSha(config: GitHubPublisherConfig, path: string) {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(path)}?ref=${config.branch}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed reading GitHub content (${res.status})`);
  }

  const data = (await res.json()) as { sha?: string };
  return data.sha ?? null;
}

export class GitHubPublisherPlugin implements PublisherPlugin {
  readonly provider = "github" as const;
  private readonly config: GitHubPublisherConfig;

  constructor(config: unknown) {
    this.config = assertConfig(config);
  }

  async publish(input: Parameters<PublisherPlugin["publish"]>[0]) {
    const payload = input.delta.nextTargetPayload;
    const previous = (input.previousTargetSnapshot?.data ?? {}) as Record<string, unknown>;
    const slug = String(payload.slug ?? previous.slug ?? input.post.slug);
    const relativePath = `${this.config.postsDir}/${slug}.${this.config.extension}`;
    const sha = await getExistingSha(this.config, relativePath);
    if (input.post.deletedAt) {
      if (!sha) {
        return {
          outputRef: relativePath,
          outputPayload: payload,
        };
      }

      const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(relativePath)}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: this.config.commitMessageTemplate?.replace("{slug}", slug),
          sha,
          branch: this.config.branch,
        }),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`GitHub delete failed (${res.status}): ${detail}`);
      }

      const data = (await res.json()) as {
        commit?: { sha?: string };
      };
      return {
        outputRef: data.commit?.sha ?? relativePath,
        outputPayload: payload,
      };
    }

    const body = typeof payload.body === "string" ? payload.body : "";
    const file = `${toFrontmatter(payload)}\n\n${body}\n`;
    const content = Buffer.from(file).toString("base64");

    const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${encodeURIComponent(relativePath)}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: this.config.commitMessageTemplate?.replace("{slug}", slug),
        content,
        sha,
        branch: this.config.branch,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`GitHub publish failed (${res.status}): ${detail}`);
    }

    const data = (await res.json()) as {
      content?: { path?: string };
      commit?: { sha?: string };
    };

    return {
      outputRef: data.commit?.sha ?? relativePath,
      outputPayload: payload,
    };
  }
}

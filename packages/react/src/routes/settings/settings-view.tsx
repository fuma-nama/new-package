"use client";

import { useState, useTransition } from "react";
import { createTargetResponseSchema, type CmsTargetDto } from "@/lib/cms/validation";
import { PublisherTargetForm } from "@/components/publisher-target-form";
import { Card } from "@/components/ui/card";

type TargetProvider = "github" | "local_git";
type MembershipRole = "admin" | "editor" | "viewer" | null;

type DashboardTarget = CmsTargetDto & {
  provider: TargetProvider;
  active: boolean;
  config: unknown;
};

interface SettingsViewProps {
  workspace: {
    name: string;
    slug: string;
  };
  user: {
    email: string | null;
    id: string;
  };
  membershipRole: MembershipRole;
  initialTargets: DashboardTarget[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toText(value: unknown, fallback = "-") {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function renderTargetSummary(target: DashboardTarget) {
  const config = isRecord(target.config) ? target.config : {};

  if (target.provider === "github") {
    const owner = toText(config.owner);
    const repo = toText(config.repo);
    const branch = toText(config.branch, "main");
    const postsDir = toText(config.postsDir, "content");
    const extension = toText(config.extension, "mdx");
    const hasToken = typeof config.token === "string" && config.token.length > 0;

    return (
      <div className="mt-2 space-y-1 text-[11px] text-fe-muted-foreground">
        <p>
          Repo:{" "}
          <span className="text-fe-foreground">
            {owner}/{repo}
          </span>
        </p>
        <p>
          Branch: <span className="text-fe-foreground">{branch}</span>
        </p>
        <p>
          Path: <span className="text-fe-foreground">{postsDir}</span> | Ext:{" "}
          <span className="text-fe-foreground">{extension}</span>
        </p>
        <p>
          Token:{" "}
          <span className={hasToken ? "text-fe-success" : "text-fe-warning"}>
            {hasToken ? "configured" : "missing"}
          </span>
        </p>
      </div>
    );
  }

  const repoPath = toText(config.repoPath);
  const postsDir = toText(config.postsDir, "content");
  const extension = toText(config.extension, "mdx");
  const commit = isRecord(config.commit) ? config.commit : {};
  const commitEnabled = Boolean(commit.enabled);
  const commitMessageTemplate = toText(commit.messageTemplate, "chore(cms): publish {slug}");

  return (
    <div className="mt-2 space-y-1 text-[11px] text-fe-muted-foreground">
      <p>
        Repo path: <span className="text-fe-foreground">{repoPath}</span>
      </p>
      <p>
        Path: <span className="text-fe-foreground">{postsDir}</span> | Ext:{" "}
        <span className="text-fe-foreground">{extension}</span>
      </p>
      <p>
        Commit:{" "}
        <span className={commitEnabled ? "text-fe-success" : "text-fe-muted-foreground"}>
          {commitEnabled ? "enabled" : "disabled"}
        </span>
      </p>
      {commitEnabled ? (
        <p>
          Message: <span className="text-fe-foreground">{commitMessageTemplate}</span>
        </p>
      ) : null}
    </div>
  );
}

export function SettingsView(props: SettingsViewProps) {
  const [targets, setTargets] = useState(props.initialTargets);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [isCreatingTarget, startCreateTarget] = useTransition();
  const canManageTargets = props.membershipRole === "admin";

  async function handleCreateTarget(formData: FormData) {
    if (!canManageTargets) return;
    setTargetError(null);

    startCreateTarget(async () => {
      const provider = String(formData.get("provider") ?? "local_git") as TargetProvider;
      const name = String(formData.get("name") ?? "").trim();

      let config: Record<string, unknown>;
      if (provider === "github") {
        const token = String(formData.get("token") ?? "").trim();
        const owner = String(formData.get("owner") ?? "").trim();
        const repo = String(formData.get("repo") ?? "").trim();
        if (!name || !token || !owner || !repo) {
          setTargetError("Name, token, owner, and repo are required.");
          return;
        }

        config = {
          token,
          owner,
          repo,
          branch: String(formData.get("branch") ?? "main").trim() || "main",
          postsDir: String(formData.get("postsDir") ?? "content").trim() || "content",
          extension: String(formData.get("extension") ?? "mdx").trim() === "md" ? "md" : "mdx",
          commitMessageTemplate: String(
            formData.get("commitMessageTemplate") ?? "chore(cms): publish {slug}",
          ).trim(),
        };
      } else {
        const repoPath = String(formData.get("repoPath") ?? "").trim();
        if (!name || !repoPath) {
          setTargetError("Name and repository path are required.");
          return;
        }

        config = {
          repoPath,
          postsDir: String(formData.get("postsDir") ?? "content").trim() || "content",
          extension: String(formData.get("extension") ?? "mdx").trim() === "md" ? "md" : "mdx",
          commit: {
            enabled: formData.get("commitEnabled") === "on",
            messageTemplate:
              String(
                formData.get("commitMessageTemplate") ?? "chore(cms): publish {slug}",
              ).trim() || "chore(cms): publish {slug}",
          },
        };
      }

      const response = await fetch("/api/cms/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, name, config, active: true }),
      });

      const raw = (await response.json().catch(() => null)) as unknown;
      const parsed = createTargetResponseSchema.safeParse(raw);
      if (!response.ok || !parsed.success || !parsed.data.target) {
        setTargetError(
          parsed.success
            ? (parsed.data.error ?? "Could not create target.")
            : "Could not create target.",
        );
        return;
      }
      const target = parsed.data.target;

      setTargets((current) => [
        {
          id: target.id,
          name: target.name,
          provider: target.provider,
          active: target.active ?? true,
          config: target.config ?? {},
        },
        ...current,
      ]);
    });
  }

  return (
    <section className="space-y-8">
      <section className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-fe-foreground">Settings</h2>
          <p className="mt-1 text-sm text-fe-muted-foreground">
            Workspace: {props.workspace.name} ({props.workspace.slug}) - Role:{" "}
            {props.membershipRole ?? "none"}
          </p>
        </div>
        <div className="text-right text-xs text-fe-muted-foreground">
          <p>{props.user.email ?? props.user.id}</p>
          <p className="mt-0.5">Publisher configuration</p>
        </div>
      </section>

      <section>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-fe-foreground">Publisher Targets</h3>
          <p className="mt-1 text-xs text-fe-muted-foreground">
            Where published deltas are exported.
          </p>
          <PublisherTargetForm
            onSubmit={handleCreateTarget}
            disabled={!canManageTargets || isCreatingTarget}
          />
          {targetError ? <p className="mt-2 text-xs text-fe-destructive">{targetError}</p> : null}
          {!canManageTargets ? (
            <p className="mt-2 text-xs text-fe-muted-foreground">
              Only admins can add or modify publisher targets.
            </p>
          ) : null}

          <div className="mt-4 space-y-2">
            {targets.map((target) => (
              <article
                key={target.id}
                className="rounded-fe border border-fe-border bg-fe-muted p-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-fe-foreground">{target.name}</p>
                    <p className="mt-0.5 text-[11px] text-fe-muted-foreground">{target.provider}</p>
                  </div>
                  <span className="rounded-full border border-fe-border bg-fe-secondary px-2 py-0.5 text-[11px] text-fe-muted-foreground">
                    {target.active ? "active" : "inactive"}
                  </span>
                </div>
                {renderTargetSummary(target)}
              </article>
            ))}
            {targets.length === 0 ? (
              <p className="rounded-fe border border-dashed border-fe-border p-3 text-xs text-fe-muted-foreground">
                No targets configured yet.
              </p>
            ) : null}
          </div>
        </Card>
      </section>
    </section>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishResponseSchema } from "@/lib/cms/validation";
import { cn } from "@/lib/cn";
import {
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button, buttonVariants } from "@/components/ui/button";

type PublishStatus = "idle" | "running" | "success" | "error";

interface TargetInfo {
  id: string;
  name: string;
  provider: "github" | "local_git";
}

interface StatusEntry {
  status: PublishStatus;
  message?: string;
  outputRef?: string;
}

interface PublishPopoverProps {
  postId: string;
  targets: TargetInfo[];
  canPublish: boolean;
  onSuccess?: () => void;
}

function statusStyles(status: PublishStatus) {
  if (status === "success") return "border-fe-success/60 bg-fe-success/10 text-fe-success";
  if (status === "error")
    return "border-fe-destructive/60 bg-fe-destructive/10 text-fe-destructive";
  if (status === "running") return "border-fe-info/60 bg-fe-info/10 text-fe-info";
  return "border-fe-border bg-fe-secondary text-fe-muted-foreground";
}

function statusLabel(status: PublishStatus) {
  if (status === "running") return "Publishing";
  if (status === "success") return "Published";
  if (status === "error") return "Failed";
  return "Idle";
}

export function PublishPopover({ postId, targets, canPublish, onSuccess }: PublishPopoverProps) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, StatusEntry>>({});
  const [isPending, startTransition] = useTransition();

  const runningCount = useMemo(
    () => Object.values(statuses).filter((entry) => entry.status === "running").length,
    [statuses],
  );

  const updateStatus = (targetId: string, entry: StatusEntry) => {
    setStatuses((current) => ({
      ...current,
      [targetId]: entry,
    }));
  };

  async function publishTarget(targetId: string) {
    updateStatus(targetId, { status: "running" });

    startTransition(async () => {
      try {
        const response = await fetch("/api/cms/publish", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ postId, targetId }),
        });

        const raw = (await response.json().catch(() => null)) as unknown;
        const parsed = publishResponseSchema.safeParse(raw);
        const payload = parsed.success ? parsed.data : null;

        if (!response.ok) {
          updateStatus(targetId, {
            status: "error",
            message: payload?.error ?? "Request failed",
          });
          return;
        }

        updateStatus(targetId, {
          status: "success",
          message: "Synced",
          outputRef: payload?.outputRef,
        });
        onSuccess?.();
      } catch (error) {
        updateStatus(targetId, {
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  }

  const publishAll = () => {
    if (targets.length === 0) return;
    for (const target of targets) {
      publishTarget(target.id);
    }
  };

  if (targets.length === 0) {
    return (
      <Button type="button" onClick={() => router.push("/cms/settings")} variant="primary">
        Publish
      </Button>
    );
  }

  return (
    <PopoverRoot modal={false}>
      <PopoverTrigger disabled={!canPublish} className={cn(buttonVariants({ variant: "primary" }))}>
        Publish
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner align="end" sideOffset={8}>
          <PopoverContent size="md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-fe-foreground">Publish Post</p>
                <p className="mt-0.5 text-xs text-fe-muted-foreground">
                  Run each publisher and inspect individual outcomes.
                </p>
              </div>
              <PopoverClose className="rounded-fe border border-fe-border px-2 py-1 text-[11px] text-fe-muted-foreground hover:bg-fe-accent">
                Close
              </PopoverClose>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 rounded-fe border border-fe-border bg-fe-muted p-2">
              <p className="text-xs text-fe-muted-foreground">
                {!canPublish
                  ? "You only have viewer permission."
                  : runningCount > 0
                    ? `${runningCount} publisher(s) running`
                    : "No active jobs"}
              </p>
              <button
                onClick={publishAll}
                disabled={targets.length === 0 || isPending || !canPublish}
                className="rounded-fe border border-fe-border bg-fe-secondary px-2 py-1 text-xs text-fe-secondary-foreground hover:bg-fe-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                Publish all
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {targets.map((target) => {
                const entry = statuses[target.id] ?? { status: "idle" as const };
                const isRunning = entry.status === "running";

                return (
                  <article
                    key={target.id}
                    className="rounded-fe border border-fe-border bg-fe-muted p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-fe-foreground">{target.name}</p>
                        <p className="text-[11px] text-fe-muted-foreground">{target.provider}</p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[11px]",
                          statusStyles(entry.status),
                        )}
                      >
                        {isRunning ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="size-2 animate-pulse rounded-full bg-current" />
                            {statusLabel(entry.status)}
                          </span>
                        ) : (
                          statusLabel(entry.status)
                        )}
                      </span>
                    </div>

                    {entry.message ? (
                      <p className="mt-2 text-[11px] text-fe-muted-foreground">{entry.message}</p>
                    ) : null}
                    {entry.outputRef ? (
                      <p className="mt-1 truncate text-[11px] text-fe-muted-foreground">
                        ref: {entry.outputRef}
                      </p>
                    ) : null}

                    <div className="mt-2">
                      <button
                        onClick={() => void publishTarget(target.id)}
                        disabled={isRunning || !canPublish}
                        className="rounded-fe border border-fe-border bg-fe-secondary px-2 py-1 text-[11px] text-fe-secondary-foreground hover:bg-fe-accent disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isRunning ? "Publishing..." : "Publish target"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </PopoverContent>
        </PopoverPositioner>
      </PopoverPortal>
    </PopoverRoot>
  );
}

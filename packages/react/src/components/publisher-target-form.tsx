"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "@base-ui/react/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectIcon,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";

type Provider = "local_git" | "github";

interface PublisherTargetFormProps {
  onSubmit: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
}

interface FormSelectProps {
  name: string;
  value: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

function FormSelect({ name, value, disabled, onValueChange, options }: FormSelectProps) {
  return (
    <Select
      name={name}
      value={value}
      onValueChange={(next) => onValueChange(String(next ?? ""))}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue />
        <SelectIcon className="text-xs text-fe-muted-foreground">▾</SelectIcon>
      </SelectTrigger>
      <SelectContent>
        <SelectList className="max-h-64 overflow-auto">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <SelectItemText>{option.label}</SelectItemText>
            </SelectItem>
          ))}
        </SelectList>
      </SelectContent>
    </Select>
  );
}

export function PublisherTargetForm({ onSubmit, disabled }: PublisherTargetFormProps) {
  const [provider, setProvider] = useState<Provider>("local_git");
  const [localGitExtension, setLocalGitExtension] = useState<"mdx" | "md">("mdx");
  const [githubExtension, setGithubExtension] = useState<"mdx" | "md">("mdx");
  const [commitEnabled, setCommitEnabled] = useState(false);

  const providerHint = useMemo(() => {
    if (provider === "github") {
      return "Publish directly to a GitHub repository through the GitHub API.";
    }
    return "Publish files into a local git repository path on this machine.";
  }, [provider]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
      <div className="grid gap-1">
        <label className="text-xs text-fe-muted-foreground">Target Name</label>
        <Input name="name" required placeholder="e.g. Main blog publisher" disabled={disabled} />
      </div>

      <div className="grid gap-1">
        <label className="text-xs text-fe-muted-foreground">Provider</label>
        <FormSelect
          name="provider"
          value={provider}
          onValueChange={(value) => setProvider(value as Provider)}
          disabled={disabled}
          options={[
            { value: "local_git", label: "Local Git" },
            { value: "github", label: "GitHub" },
          ]}
        />
        <p className="text-[11px] text-fe-muted-foreground">{providerHint}</p>
      </div>

      {provider === "local_git" ? (
        <div className="grid gap-3 rounded-fe border border-fe-border bg-fe-muted p-3">
          <p className="text-xs font-medium text-fe-foreground">Local Git Configuration</p>
          <div className="grid gap-1">
            <label className="text-xs text-fe-muted-foreground">Repository Path</label>
            <Input
              name="repoPath"
              required
              placeholder="/Users/you/dev/blog-repo"
              disabled={disabled}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-xs text-fe-muted-foreground">Posts Directory</label>
              <Input name="postsDir" defaultValue="content" disabled={disabled} />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-fe-muted-foreground">File Extension</label>
              <FormSelect
                name="extension"
                value={localGitExtension}
                onValueChange={(value) => setLocalGitExtension(value === "md" ? "md" : "mdx")}
                disabled={disabled}
                options={[
                  { value: "mdx", label: "mdx" },
                  { value: "md", label: "md" },
                ]}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-fe-muted-foreground">
            <Checkbox.Root
              name="commitEnabled"
              checked={commitEnabled}
              onCheckedChange={setCommitEnabled}
              disabled={disabled}
              className="grid size-4 place-items-center rounded-[4px] border border-fe-border bg-fe-input text-[11px] text-fe-foreground transition-colors data-checked:border-fe-ring data-checked:bg-fe-accent disabled:opacity-60"
            >
              <Checkbox.Indicator>✓</Checkbox.Indicator>
            </Checkbox.Root>
            Create a git commit after writing files
          </label>

          <div className="grid gap-1">
            <label className="text-xs text-fe-muted-foreground">Commit Message Template</label>
            <Input
              name="commitMessageTemplate"
              defaultValue="chore(cms): publish {slug}"
              disabled={disabled}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 rounded-fe border border-fe-border bg-fe-muted p-3">
          <p className="text-xs font-medium text-fe-foreground">GitHub Configuration</p>
          <div className="grid gap-1">
            <label className="text-xs text-fe-muted-foreground">GitHub Token</label>
            <Input
              name="token"
              type="password"
              required
              placeholder="ghp_xxx..."
              disabled={disabled}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-xs text-fe-muted-foreground">Owner</label>
              <Input name="owner" required placeholder="org-or-user" disabled={disabled} />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-fe-muted-foreground">Repository</label>
              <Input name="repo" required placeholder="blog-content" disabled={disabled} />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-1">
              <label className="text-xs text-fe-muted-foreground">Branch</label>
              <Input name="branch" defaultValue="main" disabled={disabled} />
            </div>
            <div className="grid gap-1 sm:col-span-2">
              <label className="text-xs text-fe-muted-foreground">Posts Directory</label>
              <Input name="postsDir" defaultValue="content" disabled={disabled} />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-xs text-fe-muted-foreground">File Extension</label>
              <FormSelect
                name="extension"
                value={githubExtension}
                onValueChange={(value) => setGithubExtension(value === "md" ? "md" : "mdx")}
                disabled={disabled}
                options={[
                  { value: "mdx", label: "mdx" },
                  { value: "md", label: "md" },
                ]}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-fe-muted-foreground">Commit Message Template</label>
              <Input
                name="commitMessageTemplate"
                defaultValue="chore(cms): publish {slug}"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      )}

      <Button type="submit" disabled={disabled} className="w-fit px-3 py-2 text-sm">
        Add target
      </Button>
    </form>
  );
}

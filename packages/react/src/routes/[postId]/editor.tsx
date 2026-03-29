"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import { WebSocketStatus, type onStatusParameters } from "@hocuspocus/provider";
import * as Y from "yjs";
import { PublishPopover } from "@/components/publish-popover";
import { useCollab } from "@/routes/collab-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";

interface EditorProps {
  postId: string;
  canPublish: boolean;
  targets: Array<{
    id: string;
    name: string;
    provider: "github" | "local_git";
  }>;
  initial: {
    slug: string;
    title: string;
    description: string;
    body: string;
    status: "draft" | "published" | "archived";
  };
}

export function Editor(props: EditorProps) {
  const collab = useCollab();
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");
  const bodyDoc = useMemo(() => new Y.Doc(), []);
  const metaDoc = useMemo(() => new Y.Doc(), []);
  const metaMap = useMemo(() => metaDoc.getMap<string>("meta"), [metaDoc]);
  const [meta, setMeta] = useState({
    slug: props.initial.slug,
    title: props.initial.title,
    description: props.initial.description,
  });

  useEffect(() => {
    const provider = collab.createPostProvider(props.postId, "body", bodyDoc);
    const metaProvider = collab.createPostProvider(props.postId, "meta", metaDoc);
    setConnectionStatus("connecting");

    const onStatus = ({ status }: onStatusParameters) => {
      if (status === WebSocketStatus.Connected) {
        setConnectionStatus("connected");
        return;
      }
      if (status === WebSocketStatus.Connecting) {
        setConnectionStatus("connecting");
        return;
      }
      setConnectionStatus("disconnected");
    };
    const onAuthFailed = () => setConnectionStatus("error");
    const onDisconnect = () => setConnectionStatus("disconnected");
    provider.on("status", onStatus);
    provider.on("authenticationFailed", onAuthFailed);
    provider.on("disconnect", onDisconnect);

    if (!metaMap.has("slug")) metaMap.set("slug", props.initial.slug);
    if (!metaMap.has("title")) metaMap.set("title", props.initial.title);
    if (!metaMap.has("description")) metaMap.set("description", props.initial.description);

    const onMetaChange = () => {
      setMeta({
        slug: metaMap.get("slug") ?? "",
        title: metaMap.get("title") ?? "",
        description: metaMap.get("description") ?? "",
      });
    };

    onMetaChange();
    metaMap.observe(onMetaChange);

    return () => {
      metaMap.unobserve(onMetaChange);
      provider.off("status", onStatus);
      provider.off("authenticationFailed", onAuthFailed);
      provider.off("disconnect", onDisconnect);
      provider.destroy();
      metaProvider.destroy();
    };
  }, [
    collab,
    props.initial.description,
    props.initial.slug,
    props.initial.title,
    props.postId,
    bodyDoc,
    metaDoc,
    metaMap,
  ]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Collaboration.configure({ document: bodyDoc })],
    content: props.initial.body,
  });

  const updateMeta = useCallback(
    (field: "slug" | "title" | "description", value: string) => metaMap.set(field, value),
    [metaMap],
  );

  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
  const toggleCode = useCallback(() => editor?.chain().focus().toggleCode().run(), [editor]);
  const toggleHeading = useCallback(
    () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    [editor],
  );
  const toggleBulletList = useCallback(
    () => editor?.chain().focus().toggleBulletList().run(),
    [editor],
  );
  const toggleOrderedList = useCallback(
    () => editor?.chain().focus().toggleOrderedList().run(),
    [editor],
  );

  return (
    <>
      <section className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <aside className="flex flex-col gap-3">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-fe-foreground">Properties</h3>
            <p className="mt-1 text-xs text-fe-muted-foreground">
              Realtime fields powered by Y.js map.
            </p>

            <div className="mt-4 grid gap-3">
              <div className="grid gap-1">
                <label className="text-xs text-fe-muted-foreground">Title</label>
                <Input
                  value={meta.title}
                  onChange={(event) => updateMeta("title", event.target.value)}
                  placeholder="Untitled post"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs text-fe-muted-foreground">Slug</label>
                <Input
                  value={meta.slug}
                  onChange={(event) => updateMeta("slug", event.target.value)}
                  placeholder="post-slug"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs text-fe-muted-foreground">Description</label>
                <Textarea
                  value={meta.description}
                  onChange={(event) => updateMeta("description", event.target.value)}
                  rows={4}
                  placeholder="Summary shown in lists and metadata"
                />
              </div>

              <PublishPopover
                postId={props.postId}
                canPublish={props.canPublish}
                targets={props.targets}
              />
            </div>
          </Card>
        </aside>

        <div className="flex flex-col gap-3">
          <Card>
            <div className="flex flex-wrap items-center gap-2 border-b border-fe-border px-3 py-2">
              <Button onClick={toggleBold}>Bold</Button>
              <Button onClick={toggleItalic}>Italic</Button>
              <Button onClick={toggleCode}>Code</Button>
              <Button onClick={toggleHeading}>H2</Button>
              <Button onClick={toggleBulletList}>Bullet</Button>
              <Button onClick={toggleOrderedList}>Ordered</Button>
            </div>

            <div className="p-4">
              <EditorContent
                editor={editor}
                className="prose prose-sm prose-invert max-w-none min-h-[420px] rounded-fe border border-fe-border bg-fe-input px-4 py-3"
              />
            </div>
          </Card>
        </div>
      </section>
      <div className="sticky bottom-0 mt-auto -mx-(--viewport-padding) flex items-center gap-2 border-t border-fe-border bg-fe-card px-(--viewport-padding) py-2 text-xs text-fe-card-foreground">
        <p className="font-medium text-fe-foreground">Status</p>
        <code
          className={
            connectionStatus === "connected"
              ? "text-fe-success"
              : connectionStatus === "connecting"
                ? "text-fe-info"
                : connectionStatus === "error"
                  ? "text-fe-destructive"
                  : "text-fe-warning"
          }
        >
          {connectionStatus}
        </code>
      </div>
    </>
  );
}

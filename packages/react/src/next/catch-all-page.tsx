import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import CmsLayout from "../routes/layout";
import CmsDashboardPage from "../routes/page";
import CmsSettingsPage from "../routes/settings/page";
import CmsPostEditorPage from "../routes/[postId]/page";

type CatchAllParams = {
  slug?: string[];
};

function getSlugPath(input: CatchAllParams["slug"]) {
  if (!input) return [];
  return input.filter((segment) => segment.length > 0);
}

export async function CmsCatchAllPage({ params }: { params: Promise<CatchAllParams> }) {
  const { slug } = await params;
  const path = getSlugPath(slug);

  let content: ReactNode;
  if (path.length === 0) {
    content = await CmsDashboardPage();
  } else if (path.length === 1 && path[0] === "settings") {
    content = await CmsSettingsPage();
  } else if (path.length === 2 && path[0] === "posts" && path[1]) {
    content = await CmsPostEditorPage({
      params: Promise.resolve({ postId: path[1] }),
    });
  } else {
    notFound();
  }

  return CmsLayout({ children: content });
}

export default CmsCatchAllPage;

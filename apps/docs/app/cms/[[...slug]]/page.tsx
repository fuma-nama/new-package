import { CmsCatchAllPage } from "@fuma-editor/react/next";
import { cmsOptions } from "@/lib/editor";

export default function Page({ params }: PageProps<"/cms/[[...slug]]">) {
  return CmsCatchAllPage({ params, options: cmsOptions });
}

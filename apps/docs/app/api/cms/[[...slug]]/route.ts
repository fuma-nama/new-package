import { cmsCatchAllApiRoute } from "@fuma-editor/react/next";
import { cmsOptions } from "@/lib/editor";

export const { GET, HEAD, POST, PATCH, DELETE } = cmsCatchAllApiRoute(cmsOptions);

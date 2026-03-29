import type { CmsAppOptions } from "@fuma-editor/react";
import { BetterAuthProvider } from "@fuma-editor/react/providers/better-auth";

export const cmsOptions: CmsAppOptions = {
  authProvider: new BetterAuthProvider(),
};

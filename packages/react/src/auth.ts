export interface AppAuthSession {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
  } | null;
}

export type CmsAuthFunction = () => Promise<AppAuthSession | null>;

let authImpl: CmsAuthFunction | null = null;

export function configureCmsAuth(auth: CmsAuthFunction) {
  authImpl = auth;
}

export async function getConfiguredAuthSession(): Promise<AppAuthSession | null> {
  if (!authImpl) {
    return null;
  }
  return authImpl();
}

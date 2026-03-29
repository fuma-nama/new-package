import { createHmac, timingSafeEqual } from "node:crypto";

interface CollabTokenPayload {
  userId: string;
  workspaceId: string;
  role: "admin" | "editor" | "viewer";
  exp: number;
}

function getSecret() {
  const secret = process.env.CMS_COLLAB_SECRET;
  if (!secret) {
    throw new Error("CMS_COLLAB_SECRET is required.");
  }
  return secret;
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createCollabToken(input: {
  userId: string;
  workspaceId: string;
  role: "admin" | "editor" | "viewer";
  ttlSeconds?: number;
}) {
  const payload: CollabTokenPayload = {
    userId: input.userId,
    workspaceId: input.workspaceId,
    role: input.role,
    exp: Math.floor(Date.now() / 1000) + (input.ttlSeconds ?? 60 * 60),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload, getSecret());
  return `${encodedPayload}.${signature}`;
}

export function verifyCollabToken(token: string): CollabTokenPayload {
  const [encodedPayload, encodedSig] = token.split(".");
  if (!encodedPayload || !encodedSig) {
    throw new Error("Invalid collab token format.");
  }

  const secret = getSecret();
  const expected = sign(encodedPayload, secret);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(encodedSig);
  if (expectedBuffer.length !== actualBuffer.length) {
    throw new Error("Invalid collab token signature.");
  }
  const ok = timingSafeEqual(expectedBuffer, actualBuffer);
  if (!ok) {
    throw new Error("Invalid collab token signature.");
  }

  const payload = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8"),
  ) as CollabTokenPayload;
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Collab token expired.");
  }

  return payload;
}

import { NextResponse } from "next/server";
import type { CmsAppOptions } from "@/index";
import * as postsRoute from "../routes/api/posts/route";
import * as postRoute from "../routes/api/posts/[postId]/route";
import * as publishRoute from "../routes/api/publish/route";
import * as targetsRoute from "../routes/api/targets/route";
import * as realtimeDocRoute from "../routes/api/[docName]/route";

type CatchAllParams = {
  slug?: string[];
};

type RouteContext = {
  params: Promise<CatchAllParams>;
};

type RouteHandler = (request: Request, context: RouteContext) => Promise<Response>;

export type CmsCatchAllApiRouteHandlers = {
  GET: RouteHandler;
  HEAD: RouteHandler;
  POST: RouteHandler;
  PATCH: RouteHandler;
  DELETE: RouteHandler;
};

function methodNotAllowed() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

async function getPathSegments(context: RouteContext) {
  const { slug } = await context.params;
  return (slug ?? []).filter((segment) => segment.length > 0);
}

async function handle(request: Request, context: RouteContext, options: CmsAppOptions) {
  const path = await getPathSegments(context);
  const [first, second] = path;

  if (first === "posts" && !second) {
    if (request.method === "GET" || request.method === "HEAD") return postsRoute.GET(options);
    if (request.method === "POST") return postsRoute.POST(request, options);
    return methodNotAllowed();
  }

  if (first === "posts" && second) {
    const postContext = { params: Promise.resolve({ postId: second }) };
    if (request.method === "GET" || request.method === "HEAD")
      return postRoute.GET(request, postContext, options);
    if (request.method === "PATCH") return postRoute.PATCH(request, postContext, options);
    if (request.method === "DELETE") return postRoute.DELETE(request, postContext, options);
    return methodNotAllowed();
  }

  if (first === "targets" && path.length === 1) {
    if (request.method === "GET" || request.method === "HEAD") return targetsRoute.GET(options);
    if (request.method === "POST") return targetsRoute.POST(request, options);
    return methodNotAllowed();
  }

  if (first === "publish" && path.length === 1) {
    if (request.method === "POST") return publishRoute.POST(request, options);
    return methodNotAllowed();
  }

  if (first && path.length === 1 && (request.method === "GET" || request.method === "HEAD")) {
    return realtimeDocRoute.GET(request, { params: Promise.resolve({ docName: first }) }, options);
  }

  return notFound();
}

export function cmsCatchAllApiRoute(options: CmsAppOptions): CmsCatchAllApiRouteHandlers {
  return {
    async GET(request: Request, context: RouteContext) {
      return handle(request, context, options);
    },
    async HEAD(request: Request, context: RouteContext) {
      const response = await handle(new Request(request, { method: "GET" }), context, options);
      return new Response(null, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    },
    async POST(request: Request, context: RouteContext) {
      return handle(request, context, options);
    },
    async PATCH(request: Request, context: RouteContext) {
      return handle(request, context, options);
    },
    async DELETE(request: Request, context: RouteContext) {
      return handle(request, context, options);
    },
  };
}

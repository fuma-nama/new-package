import { NextResponse } from "next/server";
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

async function handle(request: Request, context: RouteContext) {
  const path = await getPathSegments(context);
  const [first, second] = path;

  if (first === "posts" && !second) {
    if (request.method === "GET") return postsRoute.GET();
    if (request.method === "POST") return postsRoute.POST(request);
    return methodNotAllowed();
  }

  if (first === "posts" && second) {
    const postContext = { params: Promise.resolve({ postId: second }) };
    if (request.method === "GET") return postRoute.GET(request, postContext);
    if (request.method === "PATCH") return postRoute.PATCH(request, postContext);
    if (request.method === "DELETE") return postRoute.DELETE(request, postContext);
    return methodNotAllowed();
  }

  if (first === "targets" && path.length === 1) {
    if (request.method === "GET") return targetsRoute.GET();
    if (request.method === "POST") return targetsRoute.POST(request);
    return methodNotAllowed();
  }

  if (first === "publish" && path.length === 1) {
    if (request.method === "POST") return publishRoute.POST(request);
    return methodNotAllowed();
  }

  if (first && path.length === 1 && request.method === "GET") {
    return realtimeDocRoute.GET(request, { params: Promise.resolve({ docName: first }) });
  }

  return notFound();
}

export async function GET(request: Request, context: RouteContext) {
  return handle(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return handle(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handle(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return handle(request, context);
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { CmsAuthError } from "@/lib/cms/auth/types";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonOkWithSchema<TSchema extends z.ZodTypeAny>(
  _schema: TSchema,
  data: z.input<TSchema>,
  status = 200,
) {
  return NextResponse.json(data, { status });
}

export function jsonError(error: unknown) {
  if (error instanceof CmsAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: "Unknown error" }, { status: 500 });
}

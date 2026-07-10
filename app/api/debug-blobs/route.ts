import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { list } from "@vercel/blob";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    let cursor: string | undefined;
    const blobs: { pathname: string; url: string }[] = [];
    do {
      const result = await list({ cursor, limit: 200 });
      cursor = result.cursor;
      for (const b of result.blobs) {
        blobs.push({ pathname: b.pathname, url: b.url });
      }
    } while (cursor);

    return NextResponse.json({
      total: blobs.length,
      blobs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

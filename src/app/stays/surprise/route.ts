// GET /stays/surprise: sends the visitor to a random stay. Behind the header's "surprise me" button.
//
// The pick happens on the server for every request, so it must never be cached; the redirect is
// temporary (307) so browsers do not remember one answer either. This fixed path takes priority over
// /stays/[slug], and no stay can be called "surprise" because every stay's address ends in its number
// or is one of the three hand-written ones.

import { NextResponse } from "next/server";
import { repository } from "@/catalogue/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const total = await repository.count();
  const page = await repository.search({ page: 1 + Math.floor(Math.random() * Math.ceil(total / 12)) });
  const stay = page.items[Math.floor(Math.random() * page.items.length)];
  const target = stay ? `/stays/${stay.slug}` : "/stays";
  return NextResponse.redirect(new URL(target, request.url), { status: 307, headers: { "Cache-Control": "no-store" } });
}

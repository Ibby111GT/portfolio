import { NextResponse, type NextRequest } from "next/server";

/**
 * Hermes tailored-resume contract: /?ref=<id> must keep working and keep its
 * URL. The homepage itself is fully static (so crawlers and no-JS visitors
 * get complete HTML); requests carrying a ref are rewritten — not redirected,
 * the address bar is untouched — to the dynamic /tailored route.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.searchParams.has("ref")) {
    const url = request.nextUrl.clone();
    url.pathname = "/tailored";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};

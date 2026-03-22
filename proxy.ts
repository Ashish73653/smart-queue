import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isPublicCustomerRoute(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/book" ||
    pathname === "/queue" ||
    pathname === "/track"
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminSession = request.cookies.get("admin_session")?.value;

  if (!adminSession) {
    return NextResponse.next();
  }

  if (isPublicCustomerRoute(pathname)) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin/dashboard";
    adminUrl.search = "";
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/book", "/queue", "/track"],
};

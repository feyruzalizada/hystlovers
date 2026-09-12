import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, locales } from "@/lib/i18n";

const LOCALE_COOKIE = "storefront_locale";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, first] = pathname.split("/");

  if (isLocale(first)) {
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, first, { maxAge: 60 * 60 * 24 * 365, path: "/" });
    return response;
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const preferred =
    cookieLocale && isLocale(cookieLocale)
      ? cookieLocale
      : (request.headers
          .get("accept-language")
          ?.split(",")
          .map((part) => part.split(";")[0].trim().slice(0, 2))
          .find((code) => locales.includes(code as never)) ?? defaultLocale);

  const url = request.nextUrl.clone();
  url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|storage|favicon.ico|.*\..*).*)"],
};

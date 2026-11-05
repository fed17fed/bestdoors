import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 "proxy" (was middleware): redirects "/" to "/en" or "/uk"
// using the NEXT_LOCALE cookie or the browser language.
export default createMiddleware(routing);

export const config = {
  // Skip API, the admin panel (English only), Next internals and files with an extension.
  matcher: "/((?!api|admin|_next|_vercel|.*\\..*).*)",
};

import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

// Fails fast with a clear message at build/boot time, rather than a cryptic
// "createCsrfMiddleware is not a function" 500 on every single request. This
// exact failure has happened before after a TanStack Start version bump —
// see git history around Aug 2026 for the fix (pin @tanstack/react-router,
// @tanstack/react-start, and @tanstack/router-plugin to matching, current
// patch versions; an old patch combination broke this named export
// specifically inside Vercel's Nitro-bundled serverless function, even
// though it worked in local dev).
if (typeof createCsrfMiddleware !== "function") {
  throw new Error(
    "@tanstack/react-start's createCsrfMiddleware did not resolve as a function. " +
      "This usually means a version mismatch between @tanstack/react-router, " +
      "@tanstack/react-start, and @tanstack/router-plugin — check they're all on " +
      "current, mutually compatible versions (npm view <pkg> version) and reinstall.",
  );
}

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));

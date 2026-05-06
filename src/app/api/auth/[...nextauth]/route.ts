import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";

function isSessionDecryptionError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("decryption") ||
    message.includes("JWTSessionError") ||
    (err as { code?: string })?.code === "ERR_JWE_DECRYPTION_FAILED"
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    // Await params for Next.js 15+ compatibility (even if not used)
    await context.params;
    return await handlers.GET(request);
  } catch (err) {
    if (isSessionDecryptionError(err)) {
      return NextResponse.json({ user: null, expires: null });
    }
    // For browser navigations (e.g. /api/auth/error), don't return a JSON 500.
    // Redirect to login so the user isn't stuck on a server error page.
    console.error("[NextAuth] GET error:", err);
    const url = new URL(request.url);
    return NextResponse.redirect(new URL("/login?error=auth", url.origin));
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    // Await params for Next.js 15+ compatibility (even if not used)
    await context.params;
    return await handlers.POST(request);
  } catch (err) {
    // Avoid JSON 500 responses that break NextAuth's redirect/error flow.
    console.error("[NextAuth] POST error:", err);
    const url = new URL(request.url);
    return NextResponse.redirect(new URL("/login?error=auth", url.origin));
  }
}

/**
 * Reliable JWT reader for Next.js 16 App Router route handlers.
 *
 * `getServerSession(authOptions)` and `getToken({ req })` from next-auth v4
 * both struggle in Next.js 16 route handlers because they expect either a
 * Node.js `IncomingMessage` or a request with a `.cookies` map — the Web API
 * `Request` object provides neither in the form they expect.
 *
 * This utility uses `cookies()` from `next/headers` (the native Next.js API)
 * to read the JWT cookie and then decodes it with next-auth's own `decode`.
 * It works identically in server components AND route handlers.
 */
import { cookies } from 'next/headers';
import { decode } from 'next-auth/jwt';
import type { JWT } from 'next-auth/jwt';

export async function getAuthToken(): Promise<JWT | null> {
  const cookieStore = await cookies();
  // Dev uses `next-auth.session-token`; production behind HTTPS uses the
  // `__Secure-` prefix.
  const tokenValue =
    cookieStore.get('next-auth.session-token')?.value ??
    cookieStore.get('__Secure-next-auth.session-token')?.value;

  if (!tokenValue) return null;

  try {
    return await decode({
      token: tokenValue,
      secret: process.env.NEXTAUTH_SECRET!,
    });
  } catch {
    return null;
  }
}

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseKey, supabaseUrl } from './lib/supabase/env';
import { isAdmin } from './lib/supabase/server';

// Refreshes the sign-in on every request and sends anyone who is not the admin
// to the sign-in page. The database checks the admin role again on every query.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = isAdmin(data?.claims);
  const onLogin = request.nextUrl.pathname === '/login';

  if (!signedIn && !onLogin) return redirect(request, response, '/login');
  if (signedIn && onLogin) return redirect(request, response, '/');
  return response;
}

// A redirect that keeps any refreshed sign-in cookies and no-cache headers.
function redirect(request: NextRequest, response: NextResponse, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  const next = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => next.cookies.set(cookie));
  response.headers.forEach((value, key) => {
    if (['cache-control', 'expires', 'pragma'].includes(key)) next.headers.set(key, value);
  });
  return next;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

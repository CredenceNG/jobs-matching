/**
 * POST /api/auth/logout
 *
 * Log out current user by clearing session
 */

import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  return clearSessionCookie(response);
}

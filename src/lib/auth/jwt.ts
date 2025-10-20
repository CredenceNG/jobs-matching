/**
 * JWT Authentication Utilities
 * Simple stub for admin authentication
 */

import { NextRequest } from 'next/server'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  isAdmin?: boolean
}

/**
 * Verify JWT token from request
 */
export async function verifyJWT(request: NextRequest): Promise<JWTPayload | null> {
  // Simple stub - always return null (no auth)
  // TODO: Implement proper JWT verification
  return null
}

/**
 * Check if user is admin
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  // Simple stub - always return false
  // TODO: Implement proper admin check
  return false
}

/**
 * Get user from JWT token
 */
export async function getUserFromToken(request: NextRequest): Promise<JWTPayload | null> {
  const payload = await verifyJWT(request)
  return payload
}

/**
 * Verify authentication (alias for verifyJWT)
 * Can accept either a NextRequest or a token string
 */
export async function verifyAuth(requestOrToken: NextRequest | string): Promise<JWTPayload | null> {
  if (typeof requestOrToken === 'string') {
    // Token string passed directly - stub implementation
    // TODO: Implement actual JWT verification from token string
    return null
  }
  return verifyJWT(requestOrToken)
}

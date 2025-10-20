/**
 * POST /api/auth/signup
 *
 * Register a new user
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and token record in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          fullName,
          password: hashedPassword,
          lastLogin: new Date(),
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          isAdmin: true,
        },
      });

      // Create token balance record
      await tx.userToken.create({
        data: {
          userId: newUser.id,
          balance: 0,
          lifetimeEarned: 0,
          lifetimePurchased: 0,
          lifetimeSpent: 0,
        },
      });

      return newUser;
    });

    // Create session token
    const token = await createSession({
      id: user.id,
      email: user.email,
      fullName: user.fullName || undefined,
      isAdmin: user.isAdmin,
    });

    // Set session cookie and return user data
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isAdmin: user.isAdmin,
      },
    });

    return setSessionCookie(response, token);
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}

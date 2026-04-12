export const dynamic = 'force-dynamic';
// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createToken, setAuthCookie } from '@/lib/jwt';

const MOCK_USERS = [
  {
    id: '1',
    email: 'test@example.com',
    password: 'password123', // In production, use hashed passwords
    name: 'Test User'
  }
];

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    // Find user
    const user = MOCK_USERS.find(u => u.email === email);
    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Sign JWT
    const token = await createToken({ userId: user.id });

    // Prepare response
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      },
      { status: 200 }
    );

    // Set secure cookie
   setAuthCookie(token);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}


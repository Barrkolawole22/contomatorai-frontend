export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const registerSchema = z.object({
  email: z.string().email({ message: "Please provide a valid email address" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
  confirmPassword: z.string(),
  name: z.string()
    .min(2, { message: "Name must be between 2 and 50 characters" })
    .max(50)
    .regex(/^[A-Za-z\s]+$/, { message: "Name can only contain letters and spaces" }),
}).strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password confirmation does not match password",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = registerSchema.parse(body);

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ success: false, message: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      // JSON parse error
      return NextResponse.json({
        success: false,
        message: "Invalid JSON payload",
        errors: [{ message: error.message }]
      }, { status: 400 });
    }
    if (error instanceof ZodError) {
      // Map Zod errors to your detailed format
      const errors = error.errors.map(e => ({
        field: e.path[0] || 'unknown',
        message: e.message,
        value: 'received' in e ? (e as any).received : undefined,
      }));

      // Also create a details object for quick lookups like in your test
      const details = errors.reduce((acc, err) => {
        acc[err.field] = err.message;
        return acc;
      }, {} as Record<string, string>);

      return NextResponse.json({
        success: false,
        message: "Validation failed",
        errors,
        details,
      }, { status: 400 });
    }

    // Generic fallback error with proper type checking
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      message: errorMessage,
    }, { status: 500 });
  }
}


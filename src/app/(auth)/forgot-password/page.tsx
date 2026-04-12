// src/app/(auth)/forgot-password/page.tsx
"use client"; // Needed if you use <ForgotPasswordForm /> here directly

import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-md mx-auto mt-10">
      <ForgotPasswordForm />
    </div>
  );
}


// @ts-nocheck
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default function ForgotPasswordForm({ className, ...props }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Unable to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={cn('mx-auto max-w-md', className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <img
              src="https://arqzwjymkdkhhvlvzhap.supabase.co/storage/v1/object/public/Images/OrangeWhite%20AGNT%20Logo.png"
              alt="AGNTMKT"
              className="mx-auto mb-4 h-12 w-auto object-contain"
            />
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We sent a password reset link to <span className="font-medium text-foreground">{email}</span>. If you don&apos;t
              see it, be sure to check your spam or promotions folder.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('mx-auto max-w-md', className)} {...props}>
      <Card>
        <CardHeader className="space-y-2 text-center">
          <img
            src="https://arqzwjymkdkhhvlvzhap.supabase.co/storage/v1/object/public/Images/OrangeWhite%20AGNT%20Logo.png"
            alt="AGNTMKT"
            className="mx-auto mb-4 h-12 w-auto object-contain"
          />
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>Enter the email associated with your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Sending...
                </span>
              ) : (
                'Send reset link'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

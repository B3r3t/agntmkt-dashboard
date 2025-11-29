// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function UpdatePasswordForm({ className, ...props }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccess(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select(`
      is_agntmkt_team,
      corporate_accounts (slug)
    `)
          .eq('auth_user_id', user.id)
          .single();

        setTimeout(() => {
          if (profile?.is_agntmkt_team) {
            navigate('/admin');
          } else {
            const corporateAccounts = profile?.corporate_accounts as { slug: string }[] | null;
            const orgSlug = corporateAccounts?.[0]?.slug;
            if (orgSlug) {
              navigate(`/org/${orgSlug}/dashboard`);
            } else {
              navigate('/auth/pending-access');
            }
          }
        }, 1500);
      } else {
        setTimeout(() => {
          navigate('/auth/login');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to update password');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <svg
                className="h-8 w-8 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl">Password Updated!</CardTitle>
            <CardDescription>
              Your password has been successfully changed. Redirecting you to the dashboard...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Spinner className="h-6 w-6 text-muted-foreground" />
          </CardContent>
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
          <CardTitle className="text-2xl">Update your password</CardTitle>
          <CardDescription>Choose a new password to secure your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleUpdatePassword}>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter a new password"
                autoComplete="new-password"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm your new password"
                autoComplete="new-password"
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
                  Updating...
                </span>
              ) : (
                'Update password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

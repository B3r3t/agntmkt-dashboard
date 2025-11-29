// @ts-nocheck
import React, { FormEvent, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

export default function AccountSettings({ className, ...props }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [emailMessage, setEmailMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    setPasswordStatus('saving');
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordStatus('error');
      setPasswordMessage('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus('error');
      setPasswordMessage('Password must be at least 6 characters.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordStatus('error');
      setPasswordMessage(error.message);
      return;
    }

    setPasswordStatus('success');
    setPasswordMessage('Password changed successfully.');
    setNewPassword('');
    setConfirmPassword('');
    
    setTimeout(() => {
      setPasswordStatus('idle');
      setPasswordMessage(null);
    }, 3000);
  };

  const handleChangeEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    setEmailStatus('saving');
    setEmailMessage(null);

    if (!newEmail || !newEmail.includes('@')) {
      setEmailStatus('error');
      setEmailMessage('Please enter a valid email address.');
      return;
    }

    if (newEmail === user?.email) {
      setEmailStatus('error');
      setEmailMessage('New email must be different from current email.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) {
      setEmailStatus('error');
      setEmailMessage(error.message);
      return;
    }

    setEmailStatus('success');
    setEmailMessage('Confirmation email sent! Please check both your current and new email addresses to confirm the change.');
    setNewEmail('');
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Spinner className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)} {...props}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
            <CardDescription>Manage your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-xs text-muted-foreground">{user?.id}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account overview</CardTitle>
            <CardDescription>Review the security of your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last sign-in</span>
              <span className="font-medium">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email confirmed</span>
              <span className="font-medium">{user?.email_confirmed_at ? 'Yes' : 'Pending'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleChangePassword}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  disabled={passwordStatus === 'saving'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  disabled={passwordStatus === 'saving'}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Password must be at least 6 characters long.
            </p>
            {passwordMessage && (
              <div
                className={cn(
                  'rounded-md p-3 text-sm',
                  passwordStatus === 'error' 
                    ? 'bg-destructive/10 text-destructive' 
                    : 'bg-emerald-500/10 text-emerald-600'
                )}
              >
                {passwordMessage}
              </div>
            )}
            <Button type="submit" disabled={passwordStatus === 'saving' || !newPassword || !confirmPassword}>
              {passwordStatus === 'saving' ? (
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

      <Card>
        <CardHeader>
          <CardTitle>Change email address</CardTitle>
          <CardDescription>
            Update the email address associated with your account. You&apos;ll need to confirm the change via email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleChangeEmail}>
            <div className="space-y-2">
              <Label htmlFor="currentEmail">Current email</Label>
              <Input
                id="currentEmail"
                type="email"
                value={user.email ?? ''}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">New email address</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="Enter new email address"
                autoComplete="email"
                disabled={emailStatus === 'saving'}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A confirmation email will be sent to both your current and new email addresses.
            </p>
            {emailMessage && (
              <div
                className={cn(
                  'rounded-md p-3 text-sm',
                  emailStatus === 'error' 
                    ? 'bg-destructive/10 text-destructive' 
                    : 'bg-emerald-500/10 text-emerald-600'
                )}
              >
                {emailMessage}
              </div>
            )}
            <Button type="submit" disabled={emailStatus === 'saving' || !newEmail}>
              {emailStatus === 'saving' ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Sending...
                </span>
              ) : (
                'Change email'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

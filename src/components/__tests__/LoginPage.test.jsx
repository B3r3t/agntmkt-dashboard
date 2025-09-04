import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../lib/supabase';
import LoginPage from '../LoginPage';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({}),
      signUp: vi.fn().mockResolvedValue({})
    }
  }
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LoginPage', () => {
  it('renders the login form', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText(/email address/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/password/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy();
  });

  it('submits sign in form', async () => {
    render(<LoginPage />);
    fireEvent.input(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.input(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });
  });

  it('toggles to sign up and submits', async () => {
    render(<LoginPage />);
    fireEvent.click(
      screen.getByRole('button', { name: /don't have an account\? sign up/i })
    );
    fireEvent.input(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'new@example.com' }
    });
    fireEvent.input(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password'
      });
    });
  });
});

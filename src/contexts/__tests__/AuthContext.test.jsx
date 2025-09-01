import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { mockSupabaseClient } from '../../__mocks__/supabase';

// Mock the supabase module
jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

// Test component to access AuthContext
const TestComponent = () => {
  const {
    user,
    userProfile,
    loading,
    authError,
    signIn,
    signUp,
    signOut,
    getUserProfile,
    updateUserProfile,
    clearAuthError,
  } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="userProfile">{userProfile ? JSON.stringify(userProfile) : 'null'}</div>
      <div data-testid="authError">{authError}</div>
      <button onClick={() => signIn('test@example.com', 'password')}>Sign In</button>
      <button onClick={() => signUp('test@example.com', 'password')}>Sign Up</button>
      <button onClick={signOut}>Sign Out</button>
      <button onClick={() => getUserProfile('user-id')}>Get Profile</button>
      <button onClick={() => updateUserProfile('user-id', { name: 'Test' })}>Update Profile</button>
      <button onClick={clearAuthError}>Clear Error</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: null } });
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  describe('Provider initialization', () => {
    it('should provide initial loading state', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('true');
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });

    it('should initialize with session if user is already logged in', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { user: mockUser };
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-123', first_name: 'Test', last_name: 'User' },
          error: null,
        }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      });
    });

    it('should handle session initialization errors', async () => {
      mockSupabaseClient.auth.getSession.mockRejectedValue(new Error('Session error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Session error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within AuthProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('signIn', () => {
    it('should successfully sign in user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-123', first_name: 'Test' },
          error: null,
        }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      act(() => {
        screen.getByText('Sign In').click();
      });

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password',
        });
      });
    });

    it('should handle sign in errors', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      act(() => {
        screen.getByText('Sign In').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('authError')).toHaveTextContent('Invalid credentials');
      });
    });

    it('should handle network connection errors', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
        new Error('Failed to fetch')
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      act(() => {
        screen.getByText('Sign In').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('authError')).toHaveTextContent(
          'Cannot connect to authentication service. Your Supabase project may be paused or inactive.'
        );
      });
    });
  });

  describe('signUp', () => {
    it('should successfully sign up user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      act(() => {
        screen.getByText('Sign Up').click();
      });

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password',
          options: {
            data: {
              first_name: '',
              last_name: '',
              role: 'sales_rep',
            },
          },
        });
      });
    });

    it('should handle sign up errors', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Email already exists' },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      act(() => {
        screen.getByText('Sign Up').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('authError')).toHaveTextContent('Email already exists');
      });
    });
  });

  describe('signOut', () => {
    it('should successfully sign out user', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      act(() => {
        screen.getByText('Sign Out').click();
      });

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      });
    });

    it('should handle sign out errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      act(() => {
        screen.getByText('Sign Out').click();
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Sign out error:', expect.any(Object));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('getUserProfile', () => {
    it('should fetch user profile successfully', async () => {
      const mockProfile = { id: 'user-123', first_name: 'Test', last_name: 'User' };
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      act(() => {
        screen.getByText('Get Profile').click();
      });

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
      });
    });

    it('should return null for invalid userId', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Test the getUserProfile function directly
      const { result } = require('@testing-library/react-hooks').renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const profile = await result.current.getUserProfile(null);
      expect(profile).toBeNull();
    });
  });

  describe('clearAuthError', () => {
    it('should clear authentication error', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      act(() => {
        screen.getByText('Clear Error').click();
      });

      expect(screen.getByTestId('authError')).toHaveTextContent('');
    });
  });

  describe('auth state changes', () => {
    it('should handle auth state changes via subscription', async () => {
      let authStateChangeCallback;
      
      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateChangeCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-123', first_name: 'Test' },
          error: null,
        }),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { user: mockUser };

      act(() => {
        authStateChangeCallback('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      });
    });

    it('should handle sign out via auth state change', async () => {
      let authStateChangeCallback;
      
      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateChangeCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      act(() => {
        authStateChangeCallback('SIGNED_OUT', null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
        expect(screen.getByTestId('userProfile')).toHaveTextContent('null');
      });
    });
  });
});
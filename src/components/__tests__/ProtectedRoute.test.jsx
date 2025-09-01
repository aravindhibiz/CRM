import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: jest.fn(),
}));

// Mock navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to, replace }) => {
    mockNavigate(to, replace);
    return <div data-testid="navigate">Navigating to {to}</div>;
  },
}));

const ProtectedContent = () => (
  <div data-testid="protected-content">This is protected content</div>
);

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        <Route path="/dashboard" element={component} />
      </Routes>
    </BrowserRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Authentication States', () => {
    it('should show loading state when authentication is loading', () => {
      useAuth.mockReturnValue({
        user: null,
        loading: true,
      });

      renderWithRouter(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      // Should not render children when loading
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      // Should not navigate when loading
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });

    it('should redirect to login when user is not authenticated', () => {
      useAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      renderWithRouter(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      // Should show navigate component (mocked Navigate)
      expect(screen.getByTestId('navigate')).toBeInTheDocument();
      expect(screen.getByTestId('navigate')).toHaveTextContent('Navigating to /login');
      expect(mockNavigate).toHaveBeenCalledWith('/login', true);
      
      // Should not render protected content
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render protected content when user is authenticated', () => {
      useAuth.mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com' },
        loading: false,
      });

      renderWithRouter(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      // Should render protected content
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByTestId('protected-content')).toHaveTextContent('This is protected content');
      
      // Should not navigate
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Authentication State Changes', () => {
    it('should handle transition from loading to unauthenticated', () => {
      const { rerender } = render(
        <BrowserRouter>
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </BrowserRouter>
      );

      // Initially loading
      useAuth.mockReturnValue({
        user: null,
        loading: true,
      });

      rerender(
        <BrowserRouter>
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </BrowserRouter>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

      // Change to not loading and no user
      useAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      rerender(
        <BrowserRouter>
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </BrowserRouter>
      );

      expect(screen.getByTestId('navigate')).toBeInTheDocument();
    });

    it('should handle transition from loading to authenticated', () => {
      const { rerender } = render(
        <BrowserRouter>
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </BrowserRouter>
      );

      // Initially loading
      useAuth.mockReturnValue({
        user: null,
        loading: true,
      });

      rerender(
        <BrowserRouter>
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </BrowserRouter>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

      // Change to not loading with user
      useAuth.mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com' },
        loading: false,
      });

      rerender(
        <BrowserRouter>
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </BrowserRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle authentication logout', () => {
      const { rerender } = render(
        <BrowserRouter>
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </BrowserRouter>
      );

      // Initially authenticated
      useAuth.mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com' },
        loading: false,
      });

      rerender(
        <BrowserRouter>
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </BrowserRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();

      // User logs out
      useAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      rerender(
        <BrowserRouter>
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </BrowserRouter>
      );

      expect(screen.getByTestId('navigate')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Children Rendering', () => {
    it('should render multiple children when authenticated', () => {
      useAuth.mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com' },
        loading: false,
      });

      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('should render complex nested children when authenticated', () => {
      useAuth.mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com' },
        loading: false,
      });

      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="parent">
            <div data-testid="nested-child">Nested Content</div>
            <button data-testid="nested-button">Click me</button>
          </div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('parent')).toBeInTheDocument();
      expect(screen.getByTestId('nested-child')).toBeInTheDocument();
      expect(screen.getByTestId('nested-button')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user when loading is false', () => {
      useAuth.mockReturnValue({
        user: undefined,
        loading: false,
      });

      renderWithRouter(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('navigate')).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/login', true);
    });

    it('should handle null user when loading is false', () => {
      useAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      renderWithRouter(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('navigate')).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/login', true);
    });

    it('should handle empty user object when loading is false', () => {
      useAuth.mockReturnValue({
        user: {},
        loading: false,
      });

      renderWithRouter(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      // Empty object should be truthy, so should render protected content
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should handle loading state as true with defined user', () => {
      useAuth.mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com' },
        loading: true,
      });

      renderWithRouter(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      // Should still show loading (not render children) even if user exists
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Parameters', () => {
    it('should use replace parameter correctly', () => {
      useAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      renderWithRouter(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      // The Navigate component should be called with replace=true
      expect(mockNavigate).toHaveBeenCalledWith('/login', true);
    });
  });
});
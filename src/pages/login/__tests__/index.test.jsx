import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../index';
import { useAuth } from '../../../contexts/AuthContext';

// Mock the AuthContext
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock AppIcon component
jest.mock('components/AppIcon', () => {
  return function MockIcon({ name, size, className }) {
    return <div data-testid={`icon-${name}`} className={className}>Icon-{name}</div>;
  };
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  const mockSignIn = jest.fn();
  const mockClearAuthError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    useAuth.mockReturnValue({
      signIn: mockSignIn,
      authError: '',
      clearAuthError: mockClearAuthError,
    });
  });

  describe('Component Rendering', () => {
    it('should render login form with all elements', () => {
      renderLogin();

      // Check header elements
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your SalesFlow account')).toBeInTheDocument();

      // Check demo buttons
      expect(screen.getByText('Demo as Admin')).toBeInTheDocument();
      expect(screen.getByText('Demo as Sales Rep')).toBeInTheDocument();

      // Check form fields
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Remember me')).toBeInTheDocument();

      // Check submit button
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

      // Check footer
      expect(screen.getByText(/© 2025 SalesFlow Pro/)).toBeInTheDocument();
    });

    it('should render icons correctly', () => {
      renderLogin();

      expect(screen.getByTestId('icon-BarChart3')).toBeInTheDocument();
      expect(screen.getByTestId('icon-Mail')).toBeInTheDocument();
      expect(screen.getByTestId('icon-Lock')).toBeInTheDocument();
      expect(screen.getByTestId('icon-LogIn')).toBeInTheDocument();
    });

    it('should have proper form accessibility attributes', () => {
      renderLogin();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(emailInput).toHaveAttribute('required');

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
      expect(passwordInput).toHaveAttribute('required');
    });
  });

  describe('Form Interactions', () => {
    it('should update email and password fields', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });

    it('should handle form submission with valid credentials', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ user: { id: 'user-123' }, error: null });

      renderLogin();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(mockClearAuthError).toHaveBeenCalled();
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/sales-dashboard');
      });
    });

    it('should handle form submission with keyboard enter', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ user: { id: 'user-123' }, error: null });

      renderLogin();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.keyboard('{Enter}');

      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/sales-dashboard');
      });
    });

    it('should not navigate on failed login', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ user: null, error: { message: 'Invalid credentials' } });

      renderLogin();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during form submission', async () => {
      const user = userEvent.setup();
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderLogin();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Demo as Admin').closest('button')).toBeDisabled();
      expect(screen.getByText('Demo as Sales Rep').closest('button')).toBeDisabled();
    });

    it('should disable demo buttons during loading', async () => {
      const user = userEvent.setup();
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderLogin();

      const demoAdminButton = screen.getByText('Demo as Admin');
      await user.click(demoAdminButton);

      expect(demoAdminButton.closest('button')).toBeDisabled();
      expect(screen.getByText('Demo as Sales Rep').closest('button')).toBeDisabled();
    });
  });

  describe('Demo Login Functionality', () => {
    it('should handle demo admin login', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ user: { id: 'admin-123' }, error: null });

      renderLogin();

      const demoAdminButton = screen.getByText('Demo as Admin');
      await user.click(demoAdminButton);

      expect(mockClearAuthError).toHaveBeenCalled();
      expect(mockSignIn).toHaveBeenCalledWith('admin@salesflow.com', 'password123');
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/sales-dashboard');
      });

      // Check that form fields were populated
      expect(screen.getByLabelText('Email address')).toHaveValue('admin@salesflow.com');
      expect(screen.getByLabelText('Password')).toHaveValue('password123');
    });

    it('should handle demo sales rep login', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ user: { id: 'sales-123' }, error: null });

      renderLogin();

      const demoSalesButton = screen.getByText('Demo as Sales Rep');
      await user.click(demoSalesButton);

      expect(mockClearAuthError).toHaveBeenCalled();
      expect(mockSignIn).toHaveBeenCalledWith('john.smith@salesflow.com', 'password123');
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/sales-dashboard');
      });

      // Check that form fields were populated
      expect(screen.getByLabelText('Email address')).toHaveValue('john.smith@salesflow.com');
      expect(screen.getByLabelText('Password')).toHaveValue('password123');
    });

    it('should handle demo login failure', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ user: null, error: { message: 'Demo login failed' } });

      renderLogin();

      const demoAdminButton = screen.getByText('Demo as Admin');
      await user.click(demoAdminButton);

      expect(mockSignIn).toHaveBeenCalledWith('admin@salesflow.com', 'password123');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display authentication errors', () => {
      useAuth.mockReturnValue({
        signIn: mockSignIn,
        authError: 'Invalid email or password',
        clearAuthError: mockClearAuthError,
      });

      renderLogin();

      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      expect(screen.getByTestId('icon-AlertCircle')).toBeInTheDocument();
    });

    it('should allow copying error message', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        signIn: mockSignIn,
        authError: 'Connection timeout error',
        clearAuthError: mockClearAuthError,
      });

      renderLogin();

      const copyButton = screen.getByText('Copy error message');
      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Connection timeout error');
    });

    it('should allow dismissing error message', async () => {
      const user = userEvent.setup();
      useAuth.mockReturnValue({
        signIn: mockSignIn,
        authError: 'Some error occurred',
        clearAuthError: mockClearAuthError,
      });

      renderLogin();

      const dismissButton = screen.getByTestId('icon-X');
      await user.click(dismissButton);

      expect(mockClearAuthError).toHaveBeenCalled();
    });

    it('should clear errors before login attempt', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ user: { id: 'user-123' }, error: null });

      renderLogin();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(mockClearAuthError).toHaveBeenCalled();
    });
  });

  describe('Remember Me Checkbox', () => {
    it('should render remember me checkbox', () => {
      renderLogin();

      const checkbox = screen.getByLabelText('Remember me');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });

    it('should toggle remember me checkbox', async () => {
      const user = userEvent.setup();
      renderLogin();

      const checkbox = screen.getByLabelText('Remember me');
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Links and Navigation', () => {
    it('should render forgot password link', () => {
      renderLogin();

      const forgotPasswordLink = screen.getByText('Forgot your password?');
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute('href', '#');
    });

    it('should render contact administrator link', () => {
      renderLogin();

      const contactAdminLink = screen.getByText('Contact your administrator');
      expect(contactAdminLink).toBeInTheDocument();
      expect(contactAdminLink).toHaveAttribute('href', '#');
    });
  });

  describe('Form Validation', () => {
    it('should require email and password fields', () => {
      renderLogin();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');

      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should handle empty form submission', async () => {
      const user = userEvent.setup();
      renderLogin();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Browser validation should prevent submission
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderLogin();

      // Check form has proper structure
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();

      // Check buttons have proper roles
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      const demoButtons = screen.getAllByRole('button');
      expect(submitButton).toBeInTheDocument();
      expect(demoButtons).toHaveLength(5); // 2 demo buttons + submit button + 2 error buttons (if error present)
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const rememberCheckbox = screen.getByLabelText('Remember me');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Tab through form elements
      await user.tab();
      expect(screen.getByText('Demo as Admin')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Demo as Sales Rep')).toHaveFocus();

      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(rememberCheckbox).toHaveFocus();

      await user.tab(); // Skip forgot password link
      await user.tab();
      expect(submitButton).toHaveFocus();
    });
  });
});
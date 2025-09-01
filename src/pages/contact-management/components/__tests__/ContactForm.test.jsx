import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from '../ContactForm';
import { useAuth } from '../../../../contexts/AuthContext';
import contactsService from '../../../../services/contactsService';
import companiesService from '../../../../services/companiesService';

// Mock the dependencies
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../../services/contactsService');
jest.mock('../../../../services/companiesService');

jest.mock('../../../../components/AppIcon', () => {
  return function MockIcon({ name, size, className }) {
    return <span data-testid={`icon-${name}`} className={className}>Icon-{name}</span>;
  };
});

describe('ContactForm Component', () => {
  const mockUser = { id: 'user-123', email: 'user@test.com' };
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  
  const mockCompanies = [
    { id: '1', name: 'Company A', website: 'companya.com' },
    { id: '2', name: 'Company B', website: 'companyb.com' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    useAuth.mockReturnValue({
      user: mockUser,
    });

    companiesService.getAllCompanies.mockResolvedValue(mockCompanies);
    contactsService.createContact.mockResolvedValue({ id: 'new-contact-123' });
    contactsService.updateContact.mockResolvedValue({ id: 'updated-contact-123' });
  });

  describe('Form Initialization', () => {
    it('should render form fields correctly', async () => {
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Wait for companies to load
      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone')).toBeInTheDocument();
      expect(screen.getByLabelText('Position')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });

    it('should load companies on mount', async () => {
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(companiesService.getAllCompanies).toHaveBeenCalled();
      });
    });

    it('should populate form when editing existing contact', async () => {
      const existingContact = {
        id: 'contact-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        position: 'Manager',
        company_id: '1',
        status: 'customer',
        lead_source: 'referral',
        notes: 'Test notes',
        tags: ['vip', 'priority'],
        linkedin_url: 'https://linkedin.com/in/johndoe',
        twitter_url: 'https://twitter.com/johndoe',
        owner_id: 'user-123'
      };

      render(
        <ContactForm 
          contact={existingContact}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('123-456-7890')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Manager')).toBeInTheDocument();
      });
    });

    it('should set default owner_id to current user', async () => {
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      });

      // Submit form to verify owner_id is set
      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: /save contact/i });

      await userEvent.type(firstNameInput, 'Test');
      await userEvent.type(lastNameInput, 'User');
      await userEvent.type(emailInput, 'test@example.com');
      
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(contactsService.createContact).toHaveBeenCalledWith(
          expect.objectContaining({
            owner_id: 'user-123'
          })
        );
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /save contact/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('first name is required')).toBeInTheDocument();
        expect(screen.getByText('last name is required')).toBeInTheDocument();
        expect(screen.getByText('email is required')).toBeInTheDocument();
      });

      expect(contactsService.createContact).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: /save contact/i });

      await userEvent.type(firstNameInput, 'Test');
      await userEvent.type(lastNameInput, 'User');
      await userEvent.type(emailInput, 'invalid-email');
      
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });

      expect(contactsService.createContact).not.toHaveBeenCalled();
    });

    it('should clear field errors when user starts typing', async () => {
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      });

      // Trigger validation errors
      const submitButton = screen.getByRole('button', { name: /save contact/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('first name is required')).toBeInTheDocument();
      });

      // Start typing in first name field
      const firstNameInput = screen.getByLabelText('First Name');
      await userEvent.type(firstNameInput, 'John');

      // Error should be cleared
      expect(screen.queryByText('first name is required')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should create new contact with valid data', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email');
      const phoneInput = screen.getByLabelText('Phone');
      const positionInput = screen.getByLabelText('Position');
      const submitButton = screen.getByRole('button', { name: /save contact/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'john.doe@example.com');
      await user.type(phoneInput, '123-456-7890');
      await user.type(positionInput, 'Manager');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(contactsService.createContact).toHaveBeenCalledWith({
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          phone: '123-456-7890',
          mobile: '',
          position: 'Manager',
          department: '',
          company_id: '',
          companyName: '',
          status: 'prospect',
          lead_source: 'website',
          notes: '',
          tags: [],
          linkedin_url: '',
          twitter_url: '',
          owner_id: 'user-123'
        });
      });

      expect(mockOnSubmit).toHaveBeenCalledWith({ id: 'new-contact-123' });
    });

    it('should update existing contact', async () => {
      const existingContact = {
        id: 'contact-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        position: 'Manager',
        company_id: '1',
        status: 'customer',
        owner_id: 'user-123'
      };

      const user = userEvent.setup();
      render(
        <ContactForm 
          contact={existingContact}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByDisplayValue('John');
      const submitButton = screen.getByRole('button', { name: /save contact/i });

      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(contactsService.updateContact).toHaveBeenCalledWith(
          'contact-123',
          expect.objectContaining({
            first_name: 'Jane'
          })
        );
      });

      expect(mockOnSubmit).toHaveBeenCalledWith({ id: 'updated-contact-123' });
    });

    it('should handle submission errors', async () => {
      const error = new Error('Server error');
      contactsService.createContact.mockRejectedValue(error);

      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: /save contact/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'john.doe@example.com');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Tag Management', () => {
    it('should add new tags', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      });

      const tagInput = screen.getByPlaceholderText('Add tag...');
      const addButton = screen.getByRole('button', { name: /add/i });

      await user.type(tagInput, 'VIP');
      fireEvent.click(addButton);

      expect(screen.getByText('VIP')).toBeInTheDocument();
      expect(tagInput.value).toBe('');
    });

    it('should remove tags', async () => {
      const existingContact = {
        id: 'contact-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        tags: ['VIP', 'Priority']
      };

      const user = userEvent.setup();
      render(
        <ContactForm 
          contact={existingContact}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('VIP')).toBeInTheDocument();
        expect(screen.getByText('Priority')).toBeInTheDocument();
      });

      const removeButton = screen.getAllByTestId('icon-X')[0];
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('VIP')).not.toBeInTheDocument();
        expect(screen.getByText('Priority')).toBeInTheDocument();
      });
    });

    it('should not add duplicate tags', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      });

      const tagInput = screen.getByPlaceholderText('Add tag...');
      const addButton = screen.getByRole('button', { name: /add/i });

      // Add tag first time
      await user.type(tagInput, 'VIP');
      fireEvent.click(addButton);

      // Try to add same tag again
      await user.type(tagInput, 'VIP');
      fireEvent.click(addButton);

      // Should only have one VIP tag
      const vipTags = screen.getAllByText('VIP');
      expect(vipTags).toHaveLength(1);
    });

    it('should not add empty tags', async () => {
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add/i });
      fireEvent.click(addButton);

      // Should not add any empty tags
      expect(screen.queryByText('')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during form submission', async () => {
      // Make the API call hang to test loading state
      contactsService.createContact.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: /save contact/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'john.doe@example.com');

      fireEvent.click(submitButton);

      // Check loading state
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should disable form during loading', async () => {
      contactsService.createContact.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: /save contact/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'john.doe@example.com');

      fireEvent.click(submitButton);

      // Form should be disabled during loading
      expect(firstNameInput).toBeDisabled();
      expect(lastNameInput).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Company Selection', () => {
    it('should load and display company options', async () => {
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(companiesService.getAllCompanies).toHaveBeenCalled();
      });

      const companySelect = screen.getByLabelText('Company');
      fireEvent.click(companySelect);

      await waitFor(() => {
        expect(screen.getByText('Company A')).toBeInTheDocument();
        expect(screen.getByText('Company B')).toBeInTheDocument();
      });
    });

    it('should handle company loading errors', async () => {
      companiesService.getAllCompanies.mockRejectedValue(new Error('Failed to load companies'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load companies. Please try refreshing the page.')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels and form structure', async () => {
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      });

      // Check that all form fields have proper labels
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone')).toBeInTheDocument();
      expect(screen.getByLabelText('Position')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');

      // Tab to first field
      await user.tab();
      expect(firstNameInput).toHaveFocus();

      // Tab to next field
      await user.tab();
      expect(lastNameInput).toHaveFocus();
    });
  });
});
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';

// Mock AppIcon component
jest.mock('../../AppIcon', () => {
  return function MockIcon({ name, size, className }) {
    return (
      <span 
        data-testid={`icon-${name}`} 
        data-size={size}
        className={className}
      >
        Icon-{name}
      </span>
    );
  };
});

// Mock cn utility
jest.mock('../../../utils/cn', () => ({
  cn: (...args) => args.filter(Boolean).join(' '),
}));

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('should render button with children', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Click me');
    });

    it('should render as button element by default', () => {
      render(<Button>Test</Button>);
      
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should apply default classes', () => {
      render(<Button>Test</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef();
      render(<Button ref={ref}>Test</Button>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Variants', () => {
    it('should apply default variant', () => {
      render(<Button>Default</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should apply destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });

    it('should apply outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'border-input');
    });

    it('should apply secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('should apply ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('should apply link variant', () => {
      render(<Button variant="link">Link</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary', 'underline-offset-4');
    });

    it('should apply success variant', () => {
      render(<Button variant="success">Success</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-success', 'text-success-foreground');
    });

    it('should apply warning variant', () => {
      render(<Button variant="warning">Warning</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-warning', 'text-warning-foreground');
    });

    it('should apply danger variant', () => {
      render(<Button variant="danger">Danger</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-error', 'text-error-foreground');
    });
  });

  describe('Sizes', () => {
    it('should apply default size', () => {
      render(<Button>Default Size</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'px-4', 'py-2');
    });

    it('should apply xs size', () => {
      render(<Button size="xs">Extra Small</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8', 'px-2', 'text-xs');
    });

    it('should apply sm size', () => {
      render(<Button size="sm">Small</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9', 'px-3');
    });

    it('should apply lg size', () => {
      render(<Button size="lg">Large</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'px-8');
    });

    it('should apply xl size', () => {
      render(<Button size="xl">Extra Large</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12', 'px-10', 'text-base');
    });

    it('should apply icon size', () => {
      render(<Button size="icon">Icon</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'w-10');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading=true', () => {
      render(<Button loading={true}>Loading Button</Button>);
      
      const button = screen.getByRole('button');
      const spinner = button.querySelector('.animate-spin');
      
      expect(spinner).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('should disable button when loading', () => {
      render(<Button loading={true}>Loading Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not show spinner when loading=false', () => {
      render(<Button loading={false}>Normal Button</Button>);
      
      const button = screen.getByRole('button');
      const spinner = button.querySelector('.animate-spin');
      
      expect(spinner).not.toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  describe('Icons', () => {
    it('should render icon on the left by default', () => {
      render(<Button iconName="Plus">Add Item</Button>);
      
      const icon = screen.getByTestId('icon-Plus');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('mr-2');
    });

    it('should render icon on the right when specified', () => {
      render(<Button iconName="ChevronRight" iconPosition="right">Next</Button>);
      
      const icon = screen.getByTestId('icon-ChevronRight');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('ml-2');
    });

    it('should render icon without margin when no children', () => {
      render(<Button iconName="Search" />);
      
      const icon = screen.getByTestId('icon-Search');
      expect(icon).toBeInTheDocument();
      expect(icon).not.toHaveClass('mr-2', 'ml-2');
    });

    it('should use correct icon size based on button size', () => {
      render(<Button iconName="Plus" size="xs">Small Button</Button>);
      
      const icon = screen.getByTestId('icon-Plus');
      expect(icon).toHaveAttribute('data-size', '12');
    });

    it('should use correct icon size for different button sizes', () => {
      const { rerender } = render(<Button iconName="Plus" size="sm">Button</Button>);
      expect(screen.getByTestId('icon-Plus')).toHaveAttribute('data-size', '14');

      rerender(<Button iconName="Plus" size="default">Button</Button>);
      expect(screen.getByTestId('icon-Plus')).toHaveAttribute('data-size', '16');

      rerender(<Button iconName="Plus" size="lg">Button</Button>);
      expect(screen.getByTestId('icon-Plus')).toHaveAttribute('data-size', '18');

      rerender(<Button iconName="Plus" size="xl">Button</Button>);
      expect(screen.getByTestId('icon-Plus')).toHaveAttribute('data-size', '20');
    });

    it('should use custom icon size when provided', () => {
      render(<Button iconName="Plus" iconSize={24}>Custom Size</Button>);
      
      const icon = screen.getByTestId('icon-Plus');
      expect(icon).toHaveAttribute('data-size', '24');
    });

    it('should not render icon when iconName is not provided', () => {
      render(<Button>No Icon</Button>);
      
      const button = screen.getByRole('button');
      expect(button.querySelector('[data-testid^="icon-"]')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled=true', () => {
      render(<Button disabled={true}>Disabled Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('should be disabled when loading=true', () => {
      render(<Button loading={true}>Loading Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when both disabled and loading are true', () => {
      render(<Button disabled={true} loading={true}>Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Full Width', () => {
    it('should apply full width class when fullWidth=true', () => {
      render(<Button fullWidth={true}>Full Width</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    it('should not apply full width class when fullWidth=false', () => {
      render(<Button fullWidth={false}>Normal Width</Button>);
      
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('w-full');
    });
  });

  describe('Custom Classes', () => {
    it('should apply custom className', () => {
      render(<Button className="custom-class">Custom Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should merge custom className with default classes', () => {
      render(<Button className="bg-red-500">Custom Background</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-500', 'inline-flex', 'items-center');
    });
  });

  describe('AsChild Prop', () => {
    it('should render as Slot when asChild=true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });
  });

  describe('Event Handlers', () => {
    it('should handle click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click Me</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger click when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} disabled={true}>Disabled</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not trigger click when loading', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} loading={true}>Loading</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle keyboard events', async () => {
      const handleKeyDown = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onKeyDown={handleKeyDown}>Keyboard Button</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper button role', () => {
      render(<Button>Accessible Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should support focus-visible styles', () => {
      render(<Button>Focusable Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:outline-none');
    });

    it('should support aria attributes', () => {
      render(
        <Button aria-label="Close dialog" aria-describedby="tooltip">
          ×
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Close dialog');
      expect(button).toHaveAttribute('aria-describedby', 'tooltip');
    });

    it('should be keyboard navigable', () => {
      render(<Button>Keyboard Navigation</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Complex Combinations', () => {
    it('should handle multiple props correctly', () => {
      render(
        <Button
          variant="destructive"
          size="lg"
          iconName="Trash"
          iconPosition="right"
          fullWidth={true}
          className="my-4"
        >
          Delete All
        </Button>
      );
      
      const button = screen.getByRole('button');
      const icon = screen.getByTestId('icon-Trash');
      
      expect(button).toHaveClass('bg-destructive', 'h-11', 'w-full', 'my-4');
      expect(icon).toHaveClass('ml-2');
      expect(icon).toHaveAttribute('data-size', '18');
    });

    it('should handle loading state with icon', () => {
      render(
        <Button loading={true} iconName="Save">
          Saving...
        </Button>
      );
      
      const button = screen.getByRole('button');
      const spinner = button.querySelector('.animate-spin');
      const icon = screen.getByTestId('icon-Save');
      
      expect(spinner).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('should handle edge case with empty children and icon', () => {
      render(<Button iconName="Plus" />);
      
      const button = screen.getByRole('button');
      const icon = screen.getByTestId('icon-Plus');
      
      expect(button).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
      expect(icon).not.toHaveClass('mr-2', 'ml-2');
    });
  });

  describe('Props Forwarding', () => {
    it('should forward HTML button attributes', () => {
      render(
        <Button 
          type="submit" 
          name="submitBtn"
          value="submit"
          data-testid="custom-button"
        >
          Submit
        </Button>
      );
      
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'submitBtn');
      expect(button).toHaveAttribute('value', 'submit');
    });

    it('should forward event handlers', () => {
      const handlers = {
        onMouseEnter: jest.fn(),
        onMouseLeave: jest.fn(),
        onFocus: jest.fn(),
        onBlur: jest.fn(),
      };
      
      render(<Button {...handlers}>Interactive Button</Button>);
      
      const button = screen.getByRole('button');
      
      fireEvent.mouseEnter(button);
      expect(handlers.onMouseEnter).toHaveBeenCalled();
      
      fireEvent.mouseLeave(button);
      expect(handlers.onMouseLeave).toHaveBeenCalled();
      
      fireEvent.focus(button);
      expect(handlers.onFocus).toHaveBeenCalled();
      
      fireEvent.blur(button);
      expect(handlers.onBlur).toHaveBeenCalled();
    });
  });
});
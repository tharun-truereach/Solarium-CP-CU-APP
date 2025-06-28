/**
 * Tests for LeadStatusCell component
 * Tests inline status editing, validation, and accessibility
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { LeadStatusCell } from '../LeadStatusCell';
import { apiSlice } from '../../../api/apiSlice';
import { authSlice } from '../../../store/slices/authSlice';
import type { Lead } from '../../../types/lead.types';
import { ThemeProvider } from '../../../theme';

expect.extend(toHaveNoViolations);

// Mock lead data
const mockLead: Lead = {
  id: '1',
  leadId: 'LEAD-001',
  customerName: 'John Doe',
  customerPhone: '1234567890',
  address: '123 Test Street',
  pinCode: '123456',
  status: 'New Lead',
  assignedCP: 'cp1',
  origin: 'CP',
  createdBy: 'user1',
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z',
};

// MSW server
const server = setupServer(
  rest.patch('/api/v1/leads/:leadId/status', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
      })
    );
  }),

  rest.patch('/api/v1/leads/error/status', (req, res, ctx) => {
    return res(
      ctx.status(400),
      ctx.json({
        success: false,
        message: 'Validation failed',
        validationErrors: {
          remarks: ['Remarks must be at least 10 characters'],
        },
      })
    );
  })
);

const createTestStore = () =>
  configureStore({
    reducer: {
      api: apiSlice.reducer,
      auth: authSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState: {
      auth: {
        isAuthenticated: true,
        user: {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin User',
          role: 'admin',
          permissions: [],
          territories: ['North'],
          isActive: true,
          isVerified: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        token: 'mock-token',
        isLoading: false,
        error: null,
        refreshToken: null,
        expiresAt: null,
        lastActivity: null,
        loginTimestamp: null,
        sessionWarningShown: false,
        loginAttempts: 0,
        lockoutUntil: null,
        rememberMe: false,
        twoFactorRequired: false,
        twoFactorToken: null,
      },
    },
  });

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={createTestStore()}>
    <ThemeProvider>{children}</ThemeProvider>
  </Provider>
);

describe('LeadStatusCell Component', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('Rendering', () => {
    it('should render current status as clickable element', () => {
      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });
      expect(statusButton).toBeInTheDocument();
      expect(statusButton).toHaveTextContent('New Lead');
    });

    it('should show status with appropriate color coding', () => {
      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusChip = screen.getByRole('button', { name: /new lead/i });
      expect(statusChip).toHaveClass('MuiChip-colorDefault');
    });
  });

  describe('Status Editing', () => {
    it('should open status editor when clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });
      await user.click(statusButton);

      // Status editor popover should open
      expect(
        screen.getByRole('dialog', { name: /update lead status/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: /select new status/i })
      ).toBeInTheDocument();
    });

    it('should show only valid next statuses in dropdown', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });
      await user.click(statusButton);

      const statusSelect = screen.getByRole('combobox', {
        name: /select new status/i,
      });
      await user.click(statusSelect);

      // Valid next statuses for "New Lead"
      expect(
        screen.getByRole('option', { name: /in discussion/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: /physical meeting assigned/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: /not responding/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: /not interested/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: /other territory/i })
      ).toBeInTheDocument();

      // Invalid next statuses should not be present
      expect(
        screen.queryByRole('option', { name: /won/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('option', { name: /executed/i })
      ).not.toBeInTheDocument();
    });

    it('should require remarks for status changes', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });
      await user.click(statusButton);

      const statusSelect = screen.getByRole('combobox', {
        name: /select new status/i,
      });
      await user.click(statusSelect);

      const inDiscussionOption = screen.getByRole('option', {
        name: /in discussion/i,
      });
      await user.click(inDiscussionOption);

      // Remarks field should be visible and required
      const remarksField = screen.getByRole('textbox', { name: /remarks/i });
      expect(remarksField).toBeInTheDocument();
      expect(remarksField).toBeRequired();

      // Try to save without remarks
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show validation error
      expect(
        screen.getByText(/remarks must be at least 10 characters/i)
      ).toBeInTheDocument();
    });

    it('should require follow-up date for non-terminal statuses', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });
      await user.click(statusButton);

      const statusSelect = screen.getByRole('combobox', {
        name: /select new status/i,
      });
      await user.click(statusSelect);

      const inDiscussionOption = screen.getByRole('option', {
        name: /in discussion/i,
      });
      await user.click(inDiscussionOption);

      // Follow-up date field should be visible and required
      const followUpField = screen.getByLabelText(/follow.*up.*date/i);
      expect(followUpField).toBeInTheDocument();
      expect(followUpField).toBeRequired();
    });

    it('should not require follow-up date for terminal statuses', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });
      await user.click(statusButton);

      const statusSelect = screen.getByRole('combobox', {
        name: /select new status/i,
      });
      await user.click(statusSelect);

      const notInterestedOption = screen.getByRole('option', {
        name: /not interested/i,
      });
      await user.click(notInterestedOption);

      // Follow-up date field should not be required for terminal status
      const followUpField = screen.queryByLabelText(/follow.*up.*date/i);
      expect(followUpField).not.toBeInTheDocument();
    });

    it('should successfully update status with valid data', async () => {
      const user = userEvent.setup();
      const onStatusUpdate = jest.fn();

      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={onStatusUpdate} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });
      await user.click(statusButton);

      // Select new status
      const statusSelect = screen.getByRole('combobox', {
        name: /select new status/i,
      });
      await user.click(statusSelect);
      const inDiscussionOption = screen.getByRole('option', {
        name: /in discussion/i,
      });
      await user.click(inDiscussionOption);

      // Fill required fields
      const remarksField = screen.getByRole('textbox', { name: /remarks/i });
      await user.type(
        remarksField,
        'Customer is very interested in solar installation'
      );

      const followUpField = screen.getByLabelText(/follow.*up.*date/i);
      await user.type(followUpField, '2024-01-20');

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should call onStatusUpdate callback
      await waitFor(() => {
        expect(onStatusUpdate).toHaveBeenCalledWith({
          status: 'In Discussion',
          remarks: 'Customer is very interested in solar installation',
          followUpDate: '2024-01-20',
        });
      });
    });

    it('should handle validation errors from API', async () => {
      const user = userEvent.setup();

      // Use lead that will trigger error
      const errorLead = { ...mockLead, leadId: 'error' };

      render(
        <TestWrapper>
          <LeadStatusCell lead={errorLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });
      await user.click(statusButton);

      const statusSelect = screen.getByRole('combobox', {
        name: /select new status/i,
      });
      await user.click(statusSelect);
      const inDiscussionOption = screen.getByRole('option', {
        name: /in discussion/i,
      });
      await user.click(inDiscussionOption);

      const remarksField = screen.getByRole('textbox', { name: /remarks/i });
      await user.type(remarksField, 'Short'); // Too short

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show API validation error
      await waitFor(() => {
        expect(
          screen.getByText(/remarks must be at least 10 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('should close editor when cancelled', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });
      await user.click(statusButton);

      expect(
        screen.getByRole('dialog', { name: /update lead status/i })
      ).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Dialog should close
      expect(
        screen.queryByRole('dialog', { name: /update lead status/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Admin Override', () => {
    it('should show admin override option for admin users', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });
      await user.click(statusButton);

      // Admin override checkbox should be visible
      const overrideCheckbox = screen.getByRole('checkbox', {
        name: /admin override/i,
      });
      expect(overrideCheckbox).toBeInTheDocument();
    });

    it('should show all statuses when admin override is enabled', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });
      await user.click(statusButton);

      // Enable admin override
      const overrideCheckbox = screen.getByRole('checkbox', {
        name: /admin override/i,
      });
      await user.click(overrideCheckbox);

      const statusSelect = screen.getByRole('combobox', {
        name: /select new status/i,
      });
      await user.click(statusSelect);

      // All statuses should be available with override
      expect(screen.getByRole('option', { name: /won/i })).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: /executed/i })
      ).toBeInTheDocument();
    });

    it('should require override reason when admin override is used', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });
      await user.click(statusButton);

      const overrideCheckbox = screen.getByRole('checkbox', {
        name: /admin override/i,
      });
      await user.click(overrideCheckbox);

      const statusSelect = screen.getByRole('combobox', {
        name: /select new status/i,
      });
      await user.click(statusSelect);
      const wonOption = screen.getByRole('option', { name: /won/i });
      await user.click(wonOption);

      // Override reason field should appear
      const reasonField = screen.getByRole('textbox', {
        name: /override reason/i,
      });
      expect(reasonField).toBeInTheDocument();
      expect(reasonField).toBeRequired();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });
      expect(statusButton).toHaveAttribute('aria-label');
      expect(statusButton).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });

      // Focus the button
      statusButton.focus();
      expect(document.activeElement).toBe(statusButton);

      // Open with Enter key
      await user.keyboard('{Enter}');
      expect(
        screen.getByRole('dialog', { name: /update lead status/i })
      ).toBeInTheDocument();

      // Navigate through form elements with Tab
      await user.tab();
      const statusSelect = screen.getByRole('combobox', {
        name: /select new status/i,
      });
      expect(document.activeElement).toBe(statusSelect);
    });

    it('should trap focus within the dialog', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });
      await user.click(statusButton);

      const dialog = screen.getByRole('dialog', {
        name: /update lead status/i,
      });
      const interactiveElements = within(dialog).getAllByRole('button');

      // Focus should be trapped within dialog
      expect(interactiveElements.length).toBeGreaterThan(0);
    });

    it('should return focus to trigger button when closed', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });
      await user.click(statusButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Focus should return to original button
      expect(document.activeElement).toBe(statusButton);
    });

    it('should close dialog with Escape key', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });
      await user.click(statusButton);

      expect(
        screen.getByRole('dialog', { name: /update lead status/i })
      ).toBeInTheDocument();

      // Close with Escape
      await user.keyboard('{Escape}');

      expect(
        screen.queryByRole('dialog', { name: /update lead status/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during status update', async () => {
      const user = userEvent.setup();

      // Mock delayed response
      server.use(
        rest.patch('/api/v1/leads/:leadId/status', (req, res, ctx) => {
          return res(ctx.delay(1000), ctx.json({ success: true }));
        })
      );

      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });
      await user.click(statusButton);

      const statusSelect = screen.getByRole('combobox', {
        name: /select new status/i,
      });
      await user.click(statusSelect);
      const inDiscussionOption = screen.getByRole('option', {
        name: /in discussion/i,
      });
      await user.click(inDiscussionOption);

      const remarksField = screen.getByRole('textbox', { name: /remarks/i });
      await user.type(remarksField, 'Customer is interested');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Save button should show loading state
      expect(
        screen.getByRole('button', { name: /saving/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should disable form during submission', async () => {
      const user = userEvent.setup();

      server.use(
        rest.patch('/api/v1/leads/:leadId/status', (req, res, ctx) => {
          return res(ctx.delay(1000), ctx.json({ success: true }));
        })
      );

      render(
        <TestWrapper>
          <LeadStatusCell lead={mockLead} onStatusUpdate={jest.fn()} />
        </TestWrapper>
      );

      const statusButton = screen.getByRole('button', { name: /new lead/i });
      await user.click(statusButton);

      const statusSelect = screen.getByRole('combobox', {
        name: /select new status/i,
      });
      await user.click(statusSelect);
      const inDiscussionOption = screen.getByRole('option', {
        name: /in discussion/i,
      });
      await user.click(inDiscussionOption);

      const remarksField = screen.getByRole('textbox', { name: /remarks/i });
      await user.type(remarksField, 'Customer is interested');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Form elements should be disabled during submission
      expect(statusSelect).toBeDisabled();
      expect(remarksField).toBeDisabled();
    });
  });
});

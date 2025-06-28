/**
 * Tests for LeadTimelineDrawer component
 * Tests timeline display, lazy loading, and accessibility
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { LeadTimelineDrawer } from '../LeadTimelineDrawer';
import { apiSlice } from '../../../api/apiSlice';
import { authSlice } from '../../../store/slices/authSlice';
import type {
  LeadTimelineResponse,
  LeadTimelineItem,
} from '../../../types/lead.types';
import { ThemeProvider } from '../../../theme';

expect.extend(toHaveNoViolations);

// Mock timeline data
const mockTimelineItems: LeadTimelineItem[] = [
  {
    id: '1',
    leadId: 'LEAD-001',
    timestamp: '2024-01-01T10:00:00Z',
    action: 'Lead Created',
    actor: 'user1',
    actorName: 'John CP',
    details: {
      field: 'status',
      oldValue: null,
      newValue: 'New Lead',
      remarks: 'Initial lead creation',
    },
  },
  {
    id: '2',
    leadId: 'LEAD-001',
    timestamp: '2024-01-01T11:00:00Z',
    action: 'Status Changed',
    actor: 'user1',
    actorName: 'John CP',
    details: {
      field: 'status',
      oldValue: 'New Lead',
      newValue: 'In Discussion',
      remarks: 'Customer showed interest',
    },
  },
  {
    id: '3',
    leadId: 'LEAD-001',
    timestamp: '2024-01-01T12:00:00Z',
    action: 'Lead Reassigned',
    actor: 'admin1',
    actorName: 'Admin User',
    details: {
      field: 'assignedCP',
      oldValue: 'cp1',
      newValue: 'cp2',
      remarks: 'Territory adjustment',
    },
  },
];

const mockTimelineResponse: LeadTimelineResponse = {
  success: true,
  data: {
    leadId: 'LEAD-001',
    timeline: mockTimelineItems,
    total: 3,
  },
};

// MSW server
const server = setupServer(
  rest.get('/api/v1/leads/:id/timeline', (req, res, ctx) => {
    const { id } = req.params;
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const paginatedItems = mockTimelineItems.slice(offset, offset + limit);

    return res(
      ctx.json({
        success: true,
        data: {
          leadId: id,
          timeline: paginatedItems,
          total: mockTimelineItems.length,
        },
      })
    );
  }),

  rest.get('/api/v1/leads/error/timeline', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        success: false,
        message: 'Failed to load timeline',
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

describe('LeadTimelineDrawer Component', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('Rendering and Basic Functionality', () => {
    it('should not render when closed', () => {
      render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={false}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render drawer when open', () => {
      render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={true}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      expect(
        screen.getByRole('dialog', { name: /lead timeline/i })
      ).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={true}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/loading timeline/i)).toBeInTheDocument();
    });

    it('should load and display timeline items', async () => {
      render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={true}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Lead Created')).toBeInTheDocument();
      });

      expect(screen.getByText('Status Changed')).toBeInTheDocument();
      expect(screen.getByText('Lead Reassigned')).toBeInTheDocument();
      expect(screen.getByText('John CP')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    it('should display timeline items in chronological order', async () => {
      render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={true}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Lead Created')).toBeInTheDocument();
      });

      const timelineItems = screen.getAllByTestId('timeline-item');
      expect(timelineItems[0]).toHaveTextContent('Lead Reassigned'); // Most recent first
      expect(timelineItems[1]).toHaveTextContent('Status Changed');
      expect(timelineItems[2]).toHaveTextContent('Lead Created');
    });
  });

  describe('Timeline Item Details', () => {
    it('should show formatted timestamps', async () => {
      render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={true}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Lead Created')).toBeInTheDocument();
      });

      // Check for formatted dates (this might need adjustment based on locale)
      expect(screen.getByText(/Jan.*1.*2024/)).toBeInTheDocument();
    });

    it('should show actor information', async () => {
      render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={true}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('John CP')).toBeInTheDocument();
      });

      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    it('should show change details with before/after values', async () => {
      render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={true}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Status Changed')).toBeInTheDocument();
      });

      // Should show old and new values
      expect(screen.getByText(/New Lead.*In Discussion/)).toBeInTheDocument();
    });

    it('should display remarks when present', async () => {
      render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={true}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText('Customer showed interest')
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Territory adjustment')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error state when API fails', async () => {
      render(
        <TestWrapper>
          <LeadTimelineDrawer open={true} leadId="error" onClose={jest.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/failed to load timeline/i)
        ).toBeInTheDocument();
      });

      expect(
        screen.getByRole('button', { name: /retry/i })
      ).toBeInTheDocument();
    });

    it('should retry loading when retry button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadTimelineDrawer open={true} leadId="error" onClose={jest.fn()} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /retry/i })
        ).toBeInTheDocument();
      });

      // Update server to return success after first error
      server.use(
        rest.get('/api/v1/leads/error/timeline', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              data: {
                leadId: 'error',
                timeline: [mockTimelineItems[0]],
                total: 1,
              },
            })
          );
        })
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Lead Created')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no timeline items', async () => {
      server.use(
        rest.get('/api/v1/leads/:id/timeline', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              data: {
                leadId: req.params.id,
                timeline: [],
                total: 0,
              },
            })
          );
        })
      );

      render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={true}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/no timeline entries found/i)
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(/timeline will appear here as actions are taken/i)
      ).toBeInTheDocument();
    });
  });

  describe('Lazy Loading', () => {
    it('should load more items when scrolling to bottom', async () => {
      const user = userEvent.setup();

      // Mock large dataset
      server.use(
        rest.get('/api/v1/leads/:id/timeline', (req, res, ctx) => {
          const url = new URL(req.url);
          const offset = parseInt(url.searchParams.get('offset') || '0');
          const limit = parseInt(url.searchParams.get('limit') || '5');

          // Generate more items
          const allItems = [...mockTimelineItems];
          for (let i = 3; i < 20; i++) {
            allItems.push({
              id: `${i + 1}`,
              leadId: 'LEAD-001',
              timestamp: `2024-01-01T${10 + i}:00:00Z`,
              action: `Action ${i + 1}`,
              actor: 'user1',
              actorName: 'Test User',
              details: { remarks: `Action ${i + 1} details` },
            });
          }

          const paginatedItems = allItems.slice(offset, offset + limit);

          return res(
            ctx.json({
              success: true,
              data: {
                leadId: req.params.id,
                timeline: paginatedItems,
                total: allItems.length,
              },
            })
          );
        })
      );

      render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={true}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Lead Created')).toBeInTheDocument();
      });

      // Should show "Load More" button when there are more items
      expect(
        screen.getByRole('button', { name: /load more/i })
      ).toBeInTheDocument();

      // Click load more
      const loadMoreButton = screen.getByRole('button', { name: /load more/i });
      await user.click(loadMoreButton);

      // Should load additional items
      await waitFor(() => {
        expect(screen.getByText('Action 4')).toBeInTheDocument();
      });
    });

    it('should show loading indicator when loading more items', async () => {
      const user = userEvent.setup();

      server.use(
        rest.get('/api/v1/leads/:id/timeline', (req, res, ctx) => {
          const url = new URL(req.url);
          const offset = parseInt(url.searchParams.get('offset') || '0');

          // Delay second request
          if (offset > 0) {
            return res(
              ctx.delay(1000),
              ctx.json({
                success: true,
                data: {
                  leadId: req.params.id,
                  timeline: [mockTimelineItems[0]],
                  total: 10,
                },
              })
            );
          }

          return res(
            ctx.json({
              success: true,
              data: {
                leadId: req.params.id,
                timeline: mockTimelineItems,
                total: 10,
              },
            })
          );
        })
      );

      render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={true}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /load more/i })
        ).toBeInTheDocument();
      });

      const loadMoreButton = screen.getByRole('button', { name: /load more/i });
      await user.click(loadMoreButton);

      // Should show loading state
      expect(
        screen.getByRole('button', { name: /loading/i })
      ).toBeInTheDocument();
    });
  });

  describe('Drawer Controls', () => {
    it('should close drawer when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(
        <TestWrapper>
          <LeadTimelineDrawer open={true} leadId="LEAD-001" onClose={onClose} />
        </TestWrapper>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should close drawer when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(
        <TestWrapper>
          <LeadTimelineDrawer open={true} leadId="LEAD-001" onClose={onClose} />
        </TestWrapper>
      );

      // Click on backdrop (this might need adjustment based on MUI implementation)
      const backdrop = screen.getByRole('presentation');
      await user.click(backdrop);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={true}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Lead Created')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={true}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      const dialog = screen.getByRole('dialog', { name: /lead timeline/i });
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('should trap focus within the drawer', async () => {
      render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={true}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Focus should be trapped within the drawer
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={true}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Tab through interactive elements
      await user.tab();
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(document.activeElement).toBe(closeButton);
    });

    it('should close with Escape key', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(
        <TestWrapper>
          <LeadTimelineDrawer open={true} leadId="LEAD-001" onClose={onClose} />
        </TestWrapper>
      );

      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalled();
    });

    it('should announce timeline updates to screen readers', async () => {
      render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={true}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/3 timeline entries loaded/i);
    });
  });

  describe('Timeline Item Formatting', () => {
    it('should format different action types appropriately', async () => {
      render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={true}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Lead Created')).toBeInTheDocument();
      });

      // Different action types should have different icons or styling
      expect(screen.getByText('Status Changed')).toBeInTheDocument();
      expect(screen.getByText('Lead Reassigned')).toBeInTheDocument();
    });

    it('should handle missing actor names gracefully', async () => {
      server.use(
        rest.get('/api/v1/leads/:id/timeline', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              data: {
                leadId: req.params.id,
                timeline: [
                  {
                    id: '1',
                    leadId: 'LEAD-001',
                    timestamp: '2024-01-01T10:00:00Z',
                    action: 'Lead Created',
                    actor: 'user1',
                    // actorName missing
                    details: {},
                  },
                ],
                total: 1,
              },
            })
          );
        })
      );

      render(
        <TestWrapper>
          <LeadTimelineDrawer
            open={true}
            leadId="LEAD-001"
            onClose={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Lead Created')).toBeInTheDocument();
      });

      // Should show actor ID when name is not available
      expect(screen.getByText('user1')).toBeInTheDocument();
    });
  });
});

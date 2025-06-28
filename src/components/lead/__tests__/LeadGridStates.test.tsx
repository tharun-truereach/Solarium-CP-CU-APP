/**
 * Tests for LeadGridStates components (Empty, Error, Loading states)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadGridStates } from '../LeadGridStates';

describe('LeadGridStates', () => {
  describe('Empty State', () => {
    it('should render empty state without filters', () => {
      render(<LeadGridStates.Empty hasFilters={false} />);

      expect(screen.getByText(/no leads found/i)).toBeInTheDocument();
      expect(
        screen.getByText(/get started by creating your first lead/i)
      ).toBeInTheDocument();
    });

    it('should render empty state with filters', () => {
      const onClearFilters = jest.fn();

      render(
        <LeadGridStates.Empty
          hasFilters={true}
          onClearFilters={onClearFilters}
        />
      );

      expect(screen.getByText(/no matching leads/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /clear filters/i })
      ).toBeInTheDocument();
    });

    it('should call clear filters callback', async () => {
      const user = userEvent.setup();
      const onClearFilters = jest.fn();

      render(
        <LeadGridStates.Empty
          hasFilters={true}
          onClearFilters={onClearFilters}
        />
      );

      const clearButton = screen.getByRole('button', {
        name: /clear filters/i,
      });
      await user.click(clearButton);

      expect(onClearFilters).toHaveBeenCalled();
    });
  });

  describe('Error State', () => {
    it('should render error state with retry', () => {
      const error = { message: 'Network error' };
      const onRetry = jest.fn();

      render(<LeadGridStates.Error error={error} onRetry={onRetry} />);

      expect(screen.getByText(/failed to load leads/i)).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /retry/i })
      ).toBeInTheDocument();
    });

    it('should call retry callback', async () => {
      const user = userEvent.setup();
      const error = { message: 'Network error' };
      const onRetry = jest.fn();

      render(<LeadGridStates.Error error={error} onRetry={onRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalled();
    });
  });
});

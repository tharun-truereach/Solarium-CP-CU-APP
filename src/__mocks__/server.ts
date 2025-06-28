import { setupServer } from 'msw/node';
import { rest } from 'msw';

export const server = setupServer(
  // Default handlers for common endpoints
  rest.get('/api/v1/leads', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          limit: 25,
          offset: 0,
        },
      })
    );
  })
);

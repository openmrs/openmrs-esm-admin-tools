import { rest } from 'msw';

export const handlers = [
  rest.post('/sample-handler', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 'f79e82e8-c34a-4dc7-a49e-9fadc0979fda',
      }),
    );
  }),
];

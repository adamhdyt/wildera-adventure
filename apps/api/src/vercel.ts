/**
 * Vercel entry point. Vercel runs the app as a serverless function, so instead
 * of listening on a port we initialise Nest once per instance and hand each
 * request to the underlying Express app.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from './app';

type RequestHandler = (req: IncomingMessage, res: ServerResponse) => void;

let server: Promise<RequestHandler> | undefined;

function bootstrap(): Promise<RequestHandler> {
  return (async () => {
    const app = await createApp();
    await app.init();
    return app.getHttpAdapter().getInstance() as RequestHandler;
  })();
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  server ??= bootstrap().catch((error: unknown) => {
    server = undefined; // retry on the next request instead of caching a failure
    throw error;
  });
  (await server)(req, res);
}

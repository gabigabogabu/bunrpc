import { serve, Server } from "bun";
import { nanoid } from "nanoid";
import get from "lodash/get";

import index from "./index.html";

const exposedFunctions = Object.freeze({
  health: () => 'ok',
  greetings: {
    hello: ({ name }: { name: string }) => `Hello ${name}`,
    goodbye: ({ name }: { name: string }) => `Goodbye ${name}`,
  }
})

// export this to frontend
export type ExposedFunctions = typeof exposedFunctions;

export enum ERROR_CODES {
  FUNCTION_NOT_FOUND = 'FUNCTION_NOT_FOUND',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const withLog = (handler: (req: Request, server: Server) => Promise<Response> | Response) =>
  async (req: Request, server: Server): Promise<Response> => {
    const start = performance.now();
    const url = new URL(req.url);
    const logBase = `${new Date().toISOString()} ${req.headers.get('x-trace-id') || nanoid()} ${req.method} ${url.pathname}${url.search} ${req.headers.get('content-length') || 0}b`;
    
    console.log(logBase);
    try {
      const res = await handler(req, server);
      console.log(`${logBase} ${res.status} ${Math.round(performance.now() - start)}ms ${res.headers.get('content-length') || 0}b`);
      return res;
    } catch (error) {
      console.error(`${logBase} ERROR ${Math.round(performance.now() - start)}ms ${error}`);
      console.dir({error}, { depth: null });
      throw error;
    }
  };

const server = serve({
  development: process.env.NODE_ENV !== "production",
  routes: {
    "/rpc/*": {
      OPTIONS: withLog((req, server) => new Response(null, { status: 200, headers: corsHeaders })),
      POST: withLog(async (req, server) => {
        const functionName = new URL(req.url).pathname.replace('/rpc/', '').replaceAll('/', '.');
        const fn = get(exposedFunctions, functionName);
        if (!fn)
          return new Response(ERROR_CODES.FUNCTION_NOT_FOUND, { status: 404, headers: corsHeaders });

        const body = await req.json();
        const result = await fn(body);
        return new Response(result, { status: 200, headers: corsHeaders });
      })
    },
    "/ping": async (req, server) => {
      return new Response('pong', { status: 200, headers: corsHeaders });
    },
    // Serve index.html for all unmatched routes.
    "/*": index,
  },
});

console.log(`🚀 Server running at ${server.url}`);

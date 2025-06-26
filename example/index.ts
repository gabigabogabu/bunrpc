import { serve } from "bun";
import { createBunRpcHandler } from "..";

const exposedFunctions = Object.freeze({
  health: () => ({result:'ok', httpCode: 200}),
  greetings: {
    hello: ({ name }: { name: string }) => ({result: `Hello ${name}`}),
    goodbye: ({ name }: { name: string }) => ({result: `Goodbye ${name}`}),
  },
  error: () => { throw new Error('test') }
})

// export this to frontend
export type ExposedFunctions = typeof exposedFunctions;

const server = serve({
  routes: {
    '/rpc': {POST: createBunRpcHandler(exposedFunctions)},
  },
});

console.log(`🚀 Server running at ${server.url}`);

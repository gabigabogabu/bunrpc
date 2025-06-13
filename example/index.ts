import { serve } from "bun";
import { createBunRpcHandler } from "..";

const exposedFunctions = Object.freeze({
  health: () => 'ok',
  greetings: {
    hello: ({ name }: { name: string }) => `Hello ${name}`,
    goodbye: ({ name }: { name: string }) => `Goodbye ${name}`,
  },
  error: () => { throw new Error('test') }
})

// export this to frontend
export type ExposedFunctions = typeof exposedFunctions;

const server = serve({
  routes: {
    "/rpc/*": {POST: createBunRpcHandler(exposedFunctions, '/rpc')},
  },
});

console.log(`🚀 Server running at ${server.url}`);

# bunrpc

simple server

```ts
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
```

simple client:
```ts
import { createBunRpcClient } from "..";
import { type ExposedFunctions } from "./index";

const client = createBunRpcClient<ExposedFunctions>('http://localhost:3000/rpc');

const result = await client.greetings.hello({name: 'John'});
console.log(result);

const result2 = await client.greetings.goodbye({name: 'John'});
console.log(result2);
```

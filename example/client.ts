import { createBunRpcClient } from "..";
import { type ExposedFunctions } from "./index";

const client = createBunRpcClient<ExposedFunctions>('http://localhost:3000/rpc');

const result = await client.greetings.hello({name: 'John'});
console.log(result);

const result2 = await client.greetings.goodbye({name: 'John'});
console.log(result2);
import { useState, useEffect } from "react";
import { createBunRpcClient } from "./bunRpcClient";
import "./index.css";
import type { ExposedFunctions } from "./index";

export function App() {
  const [greeting, setGreeting] = useState<string>('Loading...');
  const client = createBunRpcClient<ExposedFunctions>('/rpc');

  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const result = await client.greetings.hello({name: 'John'});
        setGreeting(result);
      } catch (error) {
        console.error('Failed to fetch greeting:', error);
        setGreeting(`Error loading greeting: ${error}`);
      }
    };

    fetchGreeting();
  }, []);

  return (
    <div className="app">
      <h1>Bun RPC</h1>
      <p>{greeting}</p>
    </div>
  );
}

export default App;

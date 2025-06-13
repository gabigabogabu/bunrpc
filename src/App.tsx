import "./index.css";
import { useState, useEffect } from "react";
import type { ExposedFunctions } from "./index";

// Type to convert server functions to client RPC functions
type ClientRPC<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>>
    : T[K] extends object
    ? ClientRPC<T[K]>
    : T[K];
};

function createBRpcClient<T extends ExposedFunctions>(url: string): ClientRPC<T> {
  const makeRequest = async (endpoint: string, body: any): Promise<any> => {
    try {
      const response = await fetch(`${url}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) 
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      return await response.text();
    } catch (error) {
      console.error('RPC call failed:', error);
      throw error;
    }
  };

  const createProxy = (path: string[]): any => {
    return new Proxy(() => {}, {
      get: (target, prop) => {
        if (typeof prop === 'string') {
          // Continue building the path
          return createProxy([...path, prop]);
        }
        return target[prop as keyof typeof target];
      },
      apply: (target, thisArg, args) => {
        // This is called when the function is invoked
        const endpoint = '/' + path.join('/');
        const body = args[0] || {};
        return makeRequest(endpoint, body);
      }
    });
  };

  return new Proxy({} as ClientRPC<T>, {
    get: (target, prop) => {
      return createProxy([prop as string]);
    }
  });
}

export function App() {
  const [greeting, setGreeting] = useState<string>('Loading...');
  const client = createBRpcClient<ExposedFunctions>('/rpc');

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
      <h1>{greeting}</h1>
    </div>
  );
}

export default App;

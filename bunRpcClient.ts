import { type ServerFunctions } from "./common";

// Type to convert server functions to client RPC functions
type ClientRPC<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>>
    : T[K] extends object
    ? ClientRPC<T[K]>
    : T[K];
};

export function createBunRpcClient<T extends ServerFunctions>(url: string): ClientRPC<T> {
  const makeRequest = async (body: any): Promise<any> => {
    try {
      const response = await fetch(`${url}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });
      if (!response.ok)
        throw new Error(`Request failed: ${JSON.stringify(await response.json())}`);
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
        const body = {
          fn: path.join('.'),
          args: args[0] || {},
        };
        return makeRequest(body);
      }
    });
  };

  return new Proxy({} as ClientRPC<T>, {
    get: (target, prop) => {
      return createProxy([prop as string]);
    }
  });
}
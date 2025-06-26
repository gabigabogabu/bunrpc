import { type Server } from "bun";
import { type ServerFunctions, RpcError } from "./common";
import { z } from "zod";
import get from 'lodash/get';

const errorResponse = (error: unknown) => {
  if (error instanceof RpcError || error instanceof Error) {
    return new Response(JSON.stringify({
      name: error.name,
      message: error.message,
      cause: error.cause,
    }), { 
      status: error instanceof RpcError ? error.httpCode : 500,
    });
  }
  return new Response(JSON.stringify({
    name: 'FUNCTION_ERROR',
    message: 'Unknown error',
    cause: error,
  }), { status: 500 });
}

const createBunRpcHandler = (funcs: ServerFunctions): (req: Request, server: Server) => Promise<Response> => {
  const functionNames = Object.keys(funcs);
  if (functionNames.length === 0)
    throw new Error('No functions to expose');

  const bodySchema = z.object({
    fn: z.string().min(1),
    args: z.record(z.any()),
  });

  return async (req: Request, server: Server): Promise<Response> => {
    const body = await req.json();
    console.log('incoming request', {body});
    const validated = bodySchema.safeParse(body);
    if (!validated.success) {
      return new Response(JSON.stringify({
        name: validated.error.name,
        message: validated.error.message,
        cause: {
          issues: validated.error.issues, 
          cause: validated.error.cause
        },
      }), { status: 400 });
    }

    const { fn, args } = validated.data;
    const func = get(funcs, fn);
    if (!func || typeof func !== 'function')
      return new Response(JSON.stringify({
        name: 'FUNCTION_NOT_FOUND',
        message: `Function not found: ${fn}`,
      }), { status: 404 });

    try {
      const {result, httpCode} = await func(args);
      return new Response(JSON.stringify(result), { status: httpCode || 200 });
    } catch (error) {
      return errorResponse(error);
    }
  }
};

export { createBunRpcHandler };
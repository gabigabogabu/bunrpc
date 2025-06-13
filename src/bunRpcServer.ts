import { Server } from "bun";
import { ExposedFunctions } from "./common";

const get = (obj: any, path: string) => path.split('.').reduce((acc, part) => acc && acc[part], obj);

const createBunRpcHandler = (exposedFunctions: ExposedFunctions, parentPath: string = ''): (req: Request, server: Server) => Promise<Response> => {
  return async (req: Request, server: Server): Promise<Response> => {
    let cleanedPath = '';
    if (parentPath) {
      if (parentPath.startsWith('/')) parentPath = parentPath.slice(1);
      if (parentPath.endsWith('/')) parentPath = parentPath.slice(0, -1);
      cleanedPath = new URL(req.url).pathname.replace(`/${parentPath}/`, '');
    }
    const fName = cleanedPath.replace(/^\//, '').replaceAll('/', '.');
    const fn = get(exposedFunctions, fName);
    if (!fn)
      return new Response(`Function not found: ${fName}`, { status: 404 });

    const body = await req.json();
    const result = await fn(body);
    return new Response(result, { status: 200 });
  }
}

export { createBunRpcHandler };
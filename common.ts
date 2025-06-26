export type ServerFunction = (...args: any[]) => {
  result: any;
  httpCode?: number;
};

export type ServerFunctions = {
  [key: string]: ServerFunctions | ServerFunction;
}

export class RpcError extends Error {
  constructor(message: string, name: string, public httpCode: number, cause?: unknown) {
    super(message);
    this.name = name;
    this.cause = cause;
  }
}
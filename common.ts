export type ExposedFunctions = {
  [key: string]: ExposedFunctions | ((...args: any[]) => any);
}
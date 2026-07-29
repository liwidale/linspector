interface ChromeLike {
  runtime?: { getURL?: (path: string) => string };
}

export const assetUrl = (path: string): string => {
  const runtime = (globalThis as unknown as { chrome?: ChromeLike }).chrome?.runtime;
  return runtime?.getURL?.(path) ?? path;
};

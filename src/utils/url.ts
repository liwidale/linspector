export const hostOf = (url: string, base: string = location.href): string => {
  try {
    return new URL(url, base).host || location.host;
  } catch {
    return location.host;
  }
};

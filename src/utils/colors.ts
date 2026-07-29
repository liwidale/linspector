export const methodColor = (method: string): string => {
  switch (method.toUpperCase()) {
    case 'GET':
      return '#34c759';
    case 'POST':
      return '#0a84ff';
    case 'PUT':
      return '#ff9f0a';
    case 'PATCH':
      return '#bf5af2';
    case 'DELETE':
      return '#ff453a';
    case 'HEAD':
      return '#64d2ff';
    case 'OPTIONS':
      return '#98989d';
    default:
      return '#8e8e93';
  }
};

export const statusColor = (status: number): string => {
  if (status === 0) return '#ff453a';
  if (status < 200) return '#98989d';
  if (status < 300) return '#34c759';
  if (status < 400) return '#ff9f0a';
  return '#ff453a';
};

export const withAlpha = (hex: string, alpha: string): string => `${hex}${alpha}`;

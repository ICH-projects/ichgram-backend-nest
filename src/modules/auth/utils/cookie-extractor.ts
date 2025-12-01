const accessTokenName: string = 'accessToken';
const refreshTokenName: string = 'refreshToken';

export const accessTokenExtractor = (req: any): string | null => {
  if (req && req.cookies && req.cookies[accessTokenName]) {
    return req.cookies[accessTokenName];
  }
  return null;
};

export const refreshTokenExtractor = (req: any): string | null => {
  if (req && req.cookies && req.cookies[refreshTokenName]) {
    return req.cookies[refreshTokenName];
  }
  return null;
};

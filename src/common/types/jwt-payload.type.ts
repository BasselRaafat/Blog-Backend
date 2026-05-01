export type JwtPayload = {
  sub: string;
  email: string;
  tokenType: 'access' | 'refresh';
};

import * as jwt from 'jsonwebtoken';

const TOKEN_SECRET = process.env.TOKEN_SECRET!;

export function verifyAccessToken(token: string) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, TOKEN_SECRET, (err: any, user: any) => {
      if (err) return reject(err);
      resolve(user);
    });
  });
}

export function generateAccessToken(username: string) {
  return jwt.sign({ username }, TOKEN_SECRET, { expiresIn: '1 days' });
}

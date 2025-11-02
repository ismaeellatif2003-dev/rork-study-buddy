import jwt, { SignOptions } from 'jsonwebtoken';

export class JWTService {
  private secret: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'fallback-secret-key';
  }

  generateToken(payload: any, expiresIn: string | number = '7d'): string {
    return jwt.sign(payload, this.secret, { expiresIn } as SignOptions);
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.secret);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      console.error('JWT verification failed:', {
        error: errorMessage,
        tokenLength: token?.length,
        hasSecret: !!this.secret,
        secretLength: this.secret?.length
      });
      throw new Error(`Invalid token: ${errorMessage}`);
    }
  }

  decodeToken(token: string): any {
    return jwt.decode(token);
  }
}

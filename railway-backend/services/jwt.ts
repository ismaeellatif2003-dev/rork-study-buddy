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

  /**
   * Verify token with grace period for expired tokens (useful for sync operations)
   * Allows tokens expired within the grace period (default 30 days)
   */
  verifyTokenWithGracePeriod(token: string, gracePeriodDays: number = 30): { decoded: any; isExpired: boolean } {
    try {
      // First try normal verification
      const decoded = jwt.verify(token, this.secret);
      return { decoded, isExpired: false };
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      
      // If token is expired, try to decode and check grace period
      if (errorMessage.includes('expired')) {
        try {
          const decoded = jwt.decode(token) as any;
          if (decoded && decoded.exp) {
            const expirationTime = decoded.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            const gracePeriodMs = gracePeriodDays * 24 * 60 * 60 * 1000;
            const expiredBy = now - expirationTime;
            
            // Check if expired within grace period
            if (expiredBy > 0 && expiredBy <= gracePeriodMs) {
              console.log('⚠️ Token expired but within grace period:', {
                expiredByDays: Math.floor(expiredBy / (24 * 60 * 60 * 1000)),
                gracePeriodDays,
                userId: decoded.userId
              });
              return { decoded, isExpired: true };
            }
          }
        } catch (decodeError) {
          console.error('Failed to decode expired token:', decodeError);
        }
      }
      
      // If we get here, token is invalid or too expired
      throw new Error(`Invalid token: ${errorMessage}`);
    }
  }
}

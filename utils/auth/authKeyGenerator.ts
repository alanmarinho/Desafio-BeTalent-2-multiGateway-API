import crypto from 'crypto';

export function keyGenerator() {
  return crypto.randomBytes(32).toString('hex');
}

import { timingSafeEqual } from 'node:crypto';
import { isInsecureAdminEnabled } from './session';

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function getClientIp(headers: Record<string, string | string[] | undefined>): string {
  const forwarded = headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return 'unknown';
}

export function isLoginRateLimited(ip: string): boolean {
  const entry = loginAttempts.get(ip);
  if (!entry) {
    return false;
  }

  if (entry.lockedUntil > Date.now()) {
    return true;
  }

  if (entry.lockedUntil <= Date.now() && entry.count >= MAX_ATTEMPTS) {
    loginAttempts.delete(ip);
  }

  return false;
}

export function recordFailedLogin(ip: string): void {
  const entry = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  entry.count += 1;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
  }

  loginAttempts.set(ip, entry);
}

export function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

export function validateAdminCredentials(username: string, password: string): boolean {
  const configuredUsername = process.env.ADMIN_USERNAME;
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredUsername || !configuredPassword) {
    return false;
  }

  if (isInsecureAdminEnabled()) {
    if (username === 'admin' && password === 'admin') {
      return configuredUsername === 'admin' && configuredPassword === 'admin';
    }
  }

  return safeCompare(username, configuredUsername) && safeCompare(password, configuredPassword);
}

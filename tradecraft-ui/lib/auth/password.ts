export function isValidEmail(value: string): boolean {
  return /^\S+@\S+\.\S+$/.test(value);
}

export type PasswordScore = 0 | 1 | 2 | 3 | 4;

export function scorePassword(password: string): PasswordScore {
  if (!password) return 0;
  let s = 0;
  if (password.length >= 8) s += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s += 1;
  if (/\d/.test(password)) s += 1;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 14) s += 1;
  return Math.max(s, 1) as PasswordScore;
}

export const passwordScoreLabels = [
  "Use 8+ characters",
  "Weak",
  "Fair",
  "Good",
  "Strong",
] as const;

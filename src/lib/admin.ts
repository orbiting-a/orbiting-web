// Returns the hard-coded admin user ID from env
export function getAdminUserId(): string | null {
  return process.env.NEXT_PUBLIC_ADMIN_USER_ID || null;
}

export function isAdmin(userId: string | undefined | null): boolean {
  if (!userId) return false;
  return userId === getAdminUserId();
}

/** Admin path to return to after login; anything else falls back to the dashboard. */
export function safeAdminRedirect(value: string | null | undefined): string {
  if (!value || !value.startsWith('/admin/') || value.startsWith('//') || value.includes('\\')) return '/admin/dashboard';
  return value;
}

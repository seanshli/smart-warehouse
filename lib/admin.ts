export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  const allowlist = (process.env.ADMIN_EMAILS || 'demo@smartwarehouse.com,seanshlitw@gmail.com')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return allowlist.includes(email.toLowerCase())
}



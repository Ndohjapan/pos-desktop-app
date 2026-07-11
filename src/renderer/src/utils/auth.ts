// The local server's protect middleware expects the admin id as the bearer token
export function getAdminToken(): string {
  return localStorage.getItem('pos-admin-token') ?? ''
}

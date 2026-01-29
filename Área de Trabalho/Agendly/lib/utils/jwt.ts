import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production'
const JWT_EXPIRES_IN = '7d'

export interface ClientJWTPayload {
  customerId: string
  customerAccountId: string
  email: string
}

/**
 * Gera um token JWT para autenticação de cliente
 */
export function generateClientToken(payload: ClientJWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * Verifica e decodifica um token JWT de cliente
 */
export function verifyClientToken(token: string): ClientJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as ClientJWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Salva token JWT em cookie
 */
export async function setClientAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('client_auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })
}

/**
 * Remove token JWT do cookie
 */
export async function removeClientAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('client_auth_token')
}

/**
 * Busca token JWT do cookie
 */
export async function getClientAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('client_auth_token')
  return cookie?.value || null
}

/**
 * Busca dados do cliente autenticado
 */
export async function getAuthenticatedClient(): Promise<ClientJWTPayload | null> {
  const token = await getClientAuthToken()
  if (!token) return null
  
  return verifyClientToken(token)
}

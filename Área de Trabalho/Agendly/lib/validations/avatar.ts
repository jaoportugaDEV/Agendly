// Validação de upload de avatar
// Arquivo: lib/validations/avatar.ts

export const MAX_AVATAR_SIZE = 1 * 1024 * 1024 // 1MB
export const ACCEPTED_AVATAR_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]

export interface AvatarValidationResult {
  valid: boolean
  error?: string
}

/**
 * Valida um arquivo de imagem para avatar
 * @param file - Arquivo a ser validado
 * @returns Objeto com resultado da validação
 */
export function validateAvatarFile(file: File): AvatarValidationResult {
  // Validar tipo de arquivo
  if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato inválido. Use JPEG, PNG ou WebP.'
    }
  }

  // Validar tamanho do arquivo
  if (file.size > MAX_AVATAR_SIZE) {
    const sizeMB = (MAX_AVATAR_SIZE / (1024 * 1024)).toFixed(0)
    return {
      valid: false,
      error: `Imagem muito grande. Máximo ${sizeMB}MB.`
    }
  }

  // Validar que o arquivo não está vazio
  if (file.size === 0) {
    return {
      valid: false,
      error: 'Arquivo vazio ou corrompido.'
    }
  }

  return { valid: true }
}

/**
 * Gera um nome de arquivo único para avatar
 * @param originalName - Nome original do arquivo
 * @returns Nome único com timestamp
 */
export function generateAvatarFileName(originalName: string): string {
  const fileExt = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}.${fileExt}`
}

/**
 * Extrai as iniciais de um nome para fallback do avatar
 * @param name - Nome completo
 * @returns Iniciais (máximo 2 caracteres)
 */
export function getAvatarInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return 'U'
  }

  const words = name.trim().split(/\s+/)
  
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }

  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

import { Metadata } from 'next'
import { LoginForm } from '@/components/forms/login-form'

export const metadata: Metadata = {
  title: 'Login - Agendly',
  description: 'Entre na sua conta',
}

export default function LoginPage() {
  return <LoginForm />
}

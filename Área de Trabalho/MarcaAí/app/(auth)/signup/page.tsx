import { Metadata } from 'next'
import { SignupForm } from '@/components/forms/signup-form'

export const metadata: Metadata = {
  title: 'Criar Conta - Agendly',
  description: 'Crie sua conta gratuitamente',
}

export default function SignupPage() {
  return <SignupForm />
}

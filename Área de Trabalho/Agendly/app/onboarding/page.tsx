import { Metadata } from 'next'
import { OnboardingWizard } from '@/components/forms/onboarding-wizard'

export const metadata: Metadata = {
  title: 'Configuração Inicial - Agendly',
  description: 'Configure sua empresa',
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-2xl">
        <OnboardingWizard />
      </div>
    </div>
  )
}

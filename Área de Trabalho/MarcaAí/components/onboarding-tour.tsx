"use client"

import { useEffect, useState } from "react"
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride"
import { useTheme } from "next-themes"

interface OnboardingTourProps {
  steps: Step[]
  tourKey: string
  run?: boolean
}

export function OnboardingTour({ steps, tourKey, run = true }: OnboardingTourProps) {
  const { theme } = useTheme()
  const [runTour, setRunTour] = useState(false)

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(`tour-${tourKey}`)
    if (!hasSeenTour && run) {
      setRunTour(true)
    }
  }, [tourKey, run])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      setRunTour(false)
      localStorage.setItem(`tour-${tourKey}`, 'true')
    }
  }

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular',
      }}
      styles={{
        options: {
          primaryColor: theme === 'dark' ? '#60a5fa' : '#3b82f6',
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          textColor: theme === 'dark' ? '#f9fafb' : '#111827',
          arrowColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          zIndex: 10000,
        },
      }}
    />
  )
}

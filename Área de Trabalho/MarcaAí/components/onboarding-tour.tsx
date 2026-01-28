"use client"

import { useEffect, useState } from "react"
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride"

interface OnboardingTourProps {
  steps: Step[]
  tourKey: string
  run?: boolean
}

export function OnboardingTour({ steps, tourKey, run = true }: OnboardingTourProps) {
  const [runTour, setRunTour] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
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

  // Só renderiza no cliente para evitar erro de hidratação
  if (!isMounted) {
    return null
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
          primaryColor: '#3b82f6',
          backgroundColor: '#ffffff',
          textColor: '#111827',
          arrowColor: '#ffffff',
          zIndex: 10000,
        },
      }}
    />
  )
}

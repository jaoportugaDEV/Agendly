'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DownloadReceiptButtonProps {
  appointment: any
}

export function DownloadReceiptButton({ appointment }: DownloadReceiptButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    
    try {
      // Criar conteúdo do comprovante em formato simples
      const content = `
===========================================
        COMPROVANTE DE AGENDAMENTO
===========================================

Empresa: ${appointment.business?.name || 'N/A'}
Endereço: ${appointment.business?.address || 'N/A'}
${appointment.business?.city ? `Cidade: ${appointment.business.city}` : ''}
Telefone: ${appointment.business?.phone || 'N/A'}

-------------------------------------------
DADOS DO AGENDAMENTO
-------------------------------------------

ID: ${appointment.id}
Status: ${appointment.status === 'confirmed' ? 'Confirmado' : 
          appointment.status === 'completed' ? 'Concluído' : 
          appointment.status === 'cancelled' ? 'Cancelado' : 'Pendente'}

Serviço: ${appointment.service?.name || 'N/A'}
Duração: ${appointment.service?.duration_minutes || 0} minutos

Data: ${format(new Date(appointment.start_time), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
Horário: ${format(new Date(appointment.start_time), "HH:mm", { locale: ptBR })}

Profissional: ${appointment.staff?.full_name || 'N/A'}

Preço: ${new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: appointment.currency,
}).format(appointment.price)}

${appointment.notes ? `Observações: ${appointment.notes}` : ''}

-------------------------------------------

Emitido em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}

===========================================
      `

      // Criar blob e download
      const blob = new Blob([content], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `comprovante-${appointment.id.slice(0, 8)}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao gerar comprovante:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleDownload} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Baixar Comprovante
        </>
      )}
    </Button>
  )
}

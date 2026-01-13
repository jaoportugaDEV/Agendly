export default function AgendaPage({
  params,
}: {
  params: { businessId: string }
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Agenda</h1>
      <p className="text-muted-foreground">
        Calendário de agendamentos será implementado aqui
      </p>
    </div>
  )
}

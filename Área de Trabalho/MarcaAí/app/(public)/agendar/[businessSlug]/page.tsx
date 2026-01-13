export default function PublicBookingPage({
  params,
}: {
  params: { businessSlug: string }
}) {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Agendar Horário</h1>
      <p className="text-muted-foreground">
        Página pública de agendamento para: {params.businessSlug}
      </p>
    </div>
  )
}

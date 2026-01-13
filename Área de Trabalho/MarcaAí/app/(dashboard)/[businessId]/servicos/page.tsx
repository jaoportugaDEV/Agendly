export default function ServicosPage({
  params,
}: {
  params: { businessId: string }
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Serviços</h1>
      <p className="text-muted-foreground">
        Gestão de serviços será implementada aqui
      </p>
    </div>
  )
}

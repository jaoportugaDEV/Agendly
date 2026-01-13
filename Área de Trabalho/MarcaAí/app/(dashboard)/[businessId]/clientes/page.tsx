export default function ClientesPage({
  params,
}: {
  params: { businessId: string }
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Clientes</h1>
      <p className="text-muted-foreground">
        Lista e gestão de clientes será implementada aqui
      </p>
    </div>
  )
}

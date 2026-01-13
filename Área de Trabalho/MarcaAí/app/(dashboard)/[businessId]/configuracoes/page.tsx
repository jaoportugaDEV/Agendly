export default function ConfiguracoesPage({
  params,
}: {
  params: { businessId: string }
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Configurações</h1>
      <p className="text-muted-foreground">
        Configurações da empresa serão implementadas aqui
      </p>
    </div>
  )
}

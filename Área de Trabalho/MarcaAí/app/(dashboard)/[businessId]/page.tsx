export default function BusinessDashboardPage({
  params,
}: {
  params: { businessId: string }
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-muted-foreground">
        Business ID: {params.businessId}
      </p>
    </div>
  )
}

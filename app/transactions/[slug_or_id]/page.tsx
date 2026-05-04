export default async function TransactionPage({
  params,
}: {
  params: Promise<{ slug_or_id: string }>
}) {
  const { slug_or_id } = await params

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <p className="text-muted-foreground">Transaction: {slug_or_id}</p>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'
import { getUserBusinesses } from '@/lib/actions/business'

export default async function DashboardRedirectPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const businesses = await getUserBusinesses()

  if (businesses.length === 0) {
    redirect('/onboarding')
  }

  // Redirect to first business dashboard
  redirect(`/${businesses[0].id}`)
}

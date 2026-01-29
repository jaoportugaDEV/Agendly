import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Stripe webhook handler will be implemented here
  return NextResponse.json({ received: true })
}

import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/databaseService';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    await updateOrderStatus(
      params.id,
      body.status,
      body.courierName,
      body.trackingNumber,
      body.trackingUrl
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update order' },
      { status: 500 }
    );
  }
}

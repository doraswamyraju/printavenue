import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, insertOrder } from '@/lib/databaseService';
import { Order } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const orders = await getAllOrders();
    return NextResponse.json({ orders });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `PA-${body.year || 2027}-${randomSuffix}`;

    const newOrder: Order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      customerName: body.customerName,
      customerEmail: body.customerEmail || '',
      customerPhone: body.customerPhone,
      shippingAddress: body.shippingAddress,
      productId: body.productId,
      productTitle: body.productTitle,
      year: body.year,
      quantity: body.quantity,
      unitPrice: body.unitPrice,
      totalAmount: body.totalAmount,
      status: 'Order Placed',
      statusHistory: [
        {
          status: 'Order Placed',
          timestamp: new Date().toISOString(),
          note: 'Order placed by customer via live customizer.',
        },
      ],
      sheets: body.sheets || [],
    };

    await insertOrder(newOrder);

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}

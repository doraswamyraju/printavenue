import { NextRequest, NextResponse } from 'next/server';
import {
  getAllProducts,
  deleteProductById,
  saveProduct,
  toggleProductPublishStatus,
} from '@/lib/databaseService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role'); // e.g. 'superadmin'

    let products = await getAllProducts();

    // If requester is not superadmin, hide draft products
    if (role !== 'superadmin') {
      products = products.filter((p) => p.status !== 'draft');
    }

    return NextResponse.json({ products });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === 'toggleStatus' && body.id && body.status) {
      await toggleProductPublishStatus(body.id, body.status);
      return NextResponse.json({ success: true });
    }

    if (body.product) {
      await saveProduct(body.product);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save product' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
    }
    await deleteProductById(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete product' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { addTemplateToSheet, deleteTemplateFromSheet } from '@/lib/databaseService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { productId, sheetId, template } = await req.json();
    if (!productId || !sheetId || !template) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await addTemplateToSheet(productId, sheetId, template);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save template' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const sheetId = searchParams.get('sheetId');
    const templateId = searchParams.get('templateId');

    if (!productId || !sheetId || !templateId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await deleteTemplateFromSheet(productId, sheetId, templateId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete template' },
      { status: 500 }
    );
  }
}


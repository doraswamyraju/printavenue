import { NextRequest, NextResponse } from 'next/server';
import { addTemplateToSheet } from '@/lib/databaseService';

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


import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

const MAX_SIZE   = 2 * 1024 * 1024;
const ALLOWED    = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string')
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    if (!ALLOWED.includes(file.type))
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP, GIF allowed.' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_SIZE)
      return NextResponse.json({ error: 'File must be under 2 MB.' }, { status: 400 });

    const base64 = Buffer.from(bytes).toString('base64');
    const url = `data:${file.type};base64,${base64}`;

    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}

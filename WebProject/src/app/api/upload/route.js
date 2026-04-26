import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
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

    const ext      = file.type.split('/')[1].replace('jpeg', 'jpg');
    const filename = `${currentUser.id}_${Date.now()}.${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(bytes));

    return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}

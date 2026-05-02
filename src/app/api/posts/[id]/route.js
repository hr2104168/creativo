import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { deletePost } from '@/lib/repository/postRepository';

export async function DELETE(request, { params }) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const deleted = await deletePost(id, currentUser.id);
    if (!deleted)
      return NextResponse.json({ error: 'Not found or forbidden.' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

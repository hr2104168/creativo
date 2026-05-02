import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { toggleReaction } from '@/lib/repository/postRepository';

export async function POST(request, { params }) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type } = await request.json();
    if (!['inspire', 'appreciate'].includes(type))
      return NextResponse.json({ error: 'Invalid reaction type.' }, { status: 400 });

    const { id } = await params;
    await toggleReaction(id, currentUser.id, type);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

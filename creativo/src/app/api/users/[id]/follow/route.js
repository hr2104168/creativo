import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { followUser, unfollowUser } from '@/lib/repository/userRepository';

export async function POST(request, { params }) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (currentUser.id === id)
      return NextResponse.json({ error: 'Cannot follow yourself.' }, { status: 400 });

    await followUser(currentUser.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await unfollowUser(currentUser.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

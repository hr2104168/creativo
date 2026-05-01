import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { toggleBookmark } from '@/lib/repository/postRepository';

export async function POST(request, { params }) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const result = await toggleBookmark(id, currentUser.id);

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

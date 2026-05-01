import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { addComment } from '@/lib/repository/postRepository';

export async function POST(request, { params }) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { text } = await request.json();
    if (!text?.trim())
      return NextResponse.json({ error: 'Comment cannot be empty.' }, { status: 400 });
    if (text.length > 300)
      return NextResponse.json({ error: 'Max 300 characters.' }, { status: 400 });

    const { id } = await params;
    const comment = await addComment({ postId: id, authorId: currentUser.id, text });
    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

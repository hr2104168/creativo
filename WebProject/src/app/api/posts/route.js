import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getFeedPosts, getExplorePosts, createPost } from '@/lib/repository/postRepository';

export async function GET(request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tab      = searchParams.get('tab') || 'explore';
    const category = searchParams.get('category') || 'all';
    const page     = parseInt(searchParams.get('page') || '1', 10);

    const posts = tab === 'feed'
      ? await getFeedPosts({ userId: currentUser.id, category, page })
      : await getExplorePosts({ category, page });

    return NextResponse.json({ posts });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { content, category } = await request.json();
    if (!content?.trim())
      return NextResponse.json({ error: 'Content is required.' }, { status: 400 });
    if (content.length > 200)
      return NextResponse.json({ error: 'Max 200 characters.' }, { status: 400 });

    const post = await createPost({ authorId: currentUser.id, content, category });
    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

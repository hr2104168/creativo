import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getFollowers, getFollowing } from '@/lib/repository/userRepository';

export async function GET(request, { params }) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const listType = request.nextUrl.searchParams.get('type');

    if (listType !== 'followers' && listType !== 'following') {
      return NextResponse.json({ error: 'Choose followers or following.' }, { status: 400 });
    }

    const users = listType === 'followers'
      ? await getFollowers(id)
      : await getFollowing(id);

    return NextResponse.json({ users });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

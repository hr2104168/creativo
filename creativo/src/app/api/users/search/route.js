import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { isFollowing, searchUsers } from '@/lib/repository/userRepository';

export async function GET(request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const q = new URL(request.url).searchParams.get('q') || '';
    if (!q.trim()) return NextResponse.json({ users: [] });

    const users = await searchUsers(q.trim());
    const withFollow = await Promise.all(
      users
        .filter(u => u.id !== currentUser.id)
        .map(async u => ({
          ...u,
          isFollowing: await isFollowing(currentUser.id, u.id),
        }))
    );
    return NextResponse.json({ users: withFollow });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

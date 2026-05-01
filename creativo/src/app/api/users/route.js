import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getAllUsersExcept, isFollowing } from '@/lib/repository/userRepository';

export async function GET() {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const users = await getAllUsersExcept(currentUser.id);
    const withFollow = await Promise.all(
      users.map(async u => ({
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

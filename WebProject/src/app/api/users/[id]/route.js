import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getUserById, updateUser } from '@/lib/repository/userRepository';
import { getPostsByUser } from '@/lib/repository/postRepository';

export async function GET(request, { params }) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [user, posts] = await Promise.all([
      getUserById(params.id),
      getPostsByUser(params.id),
    ]);
    if (!user)
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    return NextResponse.json({ user, posts });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser || currentUser.id !== params.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { username, bio, profilePicture } = await request.json();
    if (username && username.length < 3)
      return NextResponse.json({ error: 'Username too short.' }, { status: 400 });

    const updated = await updateUser(params.id, {
      ...(username && { username }),
      ...(bio !== undefined && { bio }),
      ...(profilePicture !== undefined && { profilePicture }),
    });
    return NextResponse.json({ user: updated });
  } catch (err) {
    if (err.code === 'P2002')
      return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });
    console.error(err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

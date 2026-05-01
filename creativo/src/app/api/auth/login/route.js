import { NextResponse } from 'next/server';
import { verifyCredentials } from '@/lib/repository/userRepository';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password)
      return NextResponse.json({ error: 'All fields required.' }, { status: 400 });

    const user = await verifyCredentials(email, password);
    if (!user)
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });

    cookies().set('creativo_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

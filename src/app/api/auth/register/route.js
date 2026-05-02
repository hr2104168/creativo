import { NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/repository/userRepository';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password)
      return NextResponse.json({ error: 'All fields required.' }, { status: 400 });
    if (username.length < 3)
      return NextResponse.json({ error: 'Username must be at least 3 characters.' }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });

    const existing = await getUserByEmail(email);
    if (existing)
      return NextResponse.json({ error: 'Email already in use.' }, { status: 409 });

    const taken = await prisma.user.findUnique({ where: { username } });
    if (taken)
      return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });

    const user = await createUser({ username, email, password });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

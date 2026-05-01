import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getPlatformStats } from '@/lib/repository/statsRepository';

export async function GET() {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const stats = await getPlatformStats();
    return NextResponse.json({ user: currentUser, stats });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

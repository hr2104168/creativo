import { cookies } from 'next/headers';
import { getUserById } from './repository/userRepository';

export async function getSessionUser() {
  const id = cookies().get('creativo_session')?.value;
  if (!id) return null;
  return getUserById(id);
}

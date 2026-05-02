import { cookies } from 'next/headers'
import { getUserById } from './repository/userRepository'

export async function getSessionUser() {
  const cookieStore = await cookies()
  const id = cookieStore.get('creativo_session')?.value

  if (!id) return null

  return getUserById(id)
}
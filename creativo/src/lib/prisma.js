import { PrismaClient } from '@prisma/client'

const globalForPrisma = global

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

cat > src/lib/prisma.js << 'EOF'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma


cat > src/lib/session.js << 'EOF'
import { cookies } from 'next/headers';
import { getUserById } from './repository/userRepository';

export async function getSessionUser() {
  const id = cookies().get('creativo_session')?.value;
  if (!id) return null;
  return getUserById(id);
}

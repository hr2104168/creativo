import prisma from '../prisma';
import bcrypt from 'bcryptjs';

export async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true, username: true, bio: true,
      profilePicture: true, createdAt: true,
      _count: {
        select: { posts: true, followers: true, following: true },
      },
    },
  });
}

export async function getUserByEmail(email) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function searchUsers(query) {
  return prisma.user.findMany({
    where: { username: { contains: query } },
    select: {
      id: true,
      username: true,
      profilePicture: true,
      _count: { select: { posts: true, followers: true } },
    },
    take: 10,
    orderBy: { username: 'asc' },
  });
}

export async function getAllUsersExcept(currentUserId) {
  return prisma.user.findMany({
    where: { id: { not: currentUserId } },
    select: {
      id: true, username: true, profilePicture: true,
      _count: { select: { posts: true, followers: true } },
    },
    orderBy: { username: 'asc' },
    take: 6,
  });
}

export async function getFollowers(userId) {
  const follows = await prisma.follow.findMany({
    where: { followingId: userId },
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
          bio: true,
          _count: { select: { posts: true, followers: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return follows.map(follow => follow.follower);
}

export async function getFollowing(userId) {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
          bio: true,
          _count: { select: { posts: true, followers: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return follows.map(follow => follow.following);
}

export async function isFollowing(followerId, followingId) {
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return follow !== null;
}

export async function createUser({ username, email, password }) {
  const hashed = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: { username, email: email.toLowerCase(), password: hashed },
    select: { id: true, username: true, email: true, createdAt: true },
  });
}

export async function updateUser(id, data) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true, username: true, bio: true,
      profilePicture: true, createdAt: true,
    },
  });
}

export async function followUser(followerId, followingId) {
  try {
    return await prisma.follow.create({ data: { followerId, followingId } });
  } catch { return null; }
}

export async function unfollowUser(followerId, followingId) {
  try {
    return await prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });
  } catch { return null; }
}

export async function verifyCredentials(email, password) {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;
  const { password: _, ...safeUser } = user;
  return safeUser;
}

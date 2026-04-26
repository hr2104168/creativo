import prisma from '../prisma';

const POST_SELECT = {
  id: true, content: true, category: true, createdAt: true,
  author: { select: { id: true, username: true, profilePicture: true } },
  reactions: { select: { id: true, type: true, userId: true } },
  _count: { select: { comments: true } },
};

export async function getPostById(id) {
  return prisma.post.findUnique({
    where: { id },
    select: {
      ...POST_SELECT,
      comments: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true, text: true, createdAt: true,
          author: { select: { id: true, username: true, profilePicture: true } },
        },
      },
    },
  });
}

export async function getFeedPosts({ userId, category, page = 1 }) {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const ids = [userId, ...follows.map(f => f.followingId)];
  return prisma.post.findMany({
    where: {
      authorId: { in: ids },
      ...(category && category !== 'all' ? { category } : {}),
    },
    select: POST_SELECT,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * 20,
    take: 20,
  });
}

export async function getExplorePosts({ category, page = 1 }) {
  return prisma.post.findMany({
    where: category && category !== 'all' ? { category } : {},
    select: POST_SELECT,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * 20,
    take: 20,
  });
}

export async function getPostsByUser(userId) {
  return prisma.post.findMany({
    where: { authorId: userId },
    select: POST_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

export async function createPost({ authorId, content, category }) {
  return prisma.post.create({
    data: { authorId, content: content.trim(), category },
    select: POST_SELECT,
  });
}

export async function deletePost(postId, userId) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.authorId !== userId) return null;
  return prisma.post.delete({ where: { id: postId } });
}

export async function toggleReaction(postId, userId, type) {
  const existing = await prisma.reaction.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (!existing)
    return prisma.reaction.create({ data: { userId, postId, type } });
  if (existing.type === type)
    return prisma.reaction.delete({ where: { id: existing.id } });
  return prisma.reaction.update({ where: { id: existing.id }, data: { type } });
}

export async function addComment({ postId, authorId, text }) {
  return prisma.comment.create({
    data: { postId, authorId, text: text.trim() },
    select: {
      id: true, text: true, createdAt: true,
      author: { select: { id: true, username: true, profilePicture: true } },
    },
  });
}

export async function deleteComment(commentId, userId) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.authorId !== userId) return null;
  return prisma.comment.delete({ where: { id: commentId } });
}

import prisma from '../prisma';

function roundOne(value) {
  return Math.round(value * 10) / 10;
}

export async function getPlatformStats() {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const [
    totalUsers,
    totalPosts,
    totalComments,
    totalFollows,
    totalReactions,
    totalBookmarks,
    categoryRows,
    activeRows,
    topFollowedUser,
    mostCommentedPost,
    mostBookmarkedPost,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.follow.count(),
    prisma.reaction.count(),
    prisma.bookmark.count(),
    prisma.post.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    }),
    prisma.post.groupBy({
      by: ['authorId'],
      where: { createdAt: { gte: threeMonthsAgo } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    }),
    prisma.user.findFirst({
      orderBy: { followers: { _count: 'desc' } },
      select: {
        username: true,
        _count: { select: { followers: true } },
      },
    }),
    prisma.post.findFirst({
      orderBy: { comments: { _count: 'desc' } },
      select: {
        content: true,
        author: { select: { username: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.post.findFirst({
      orderBy: { bookmarks: { _count: 'desc' } },
      select: {
        content: true,
        author: { select: { username: true } },
        _count: { select: { bookmarks: true } },
      },
    }),
  ]);

  const activeUser = activeRows[0]
    ? await prisma.user.findUnique({
        where: { id: activeRows[0].authorId },
        select: { username: true },
      })
    : null;

  const averageFollowers = totalUsers === 0 ? 0 : totalFollows / totalUsers;
  const averagePosts = totalUsers === 0 ? 0 : totalPosts / totalUsers;
  const topCategory = categoryRows[0];

  return [
    {
      title: 'Total users',
      value: totalUsers,
      detail: 'registered accounts',
    },
    {
      title: 'Total messages',
      value: totalPosts,
      detail: 'creative posts shared',
    },
    {
      title: 'Average followers',
      value: roundOne(averageFollowers),
      detail: 'followers per user',
    },
    {
      title: 'Average messages',
      value: roundOne(averagePosts),
      detail: 'posts per user',
    },
    {
      title: 'Most active user',
      value: activeUser ? `@${activeUser.username}` : 'No posts',
      detail: activeRows[0] ? `${activeRows[0]._count.id} posts in the last 3 months` : 'no recent activity',
    },
    {
      title: 'Top category',
      value: topCategory ? topCategory.category : 'None',
      detail: topCategory ? `${topCategory._count.id} posts` : 'no categories yet',
    },
    {
      title: 'Most commented',
      value: mostCommentedPost ? `${mostCommentedPost._count.comments} comments` : 'None',
      detail: mostCommentedPost ? `@${mostCommentedPost.author.username}: ${mostCommentedPost.content}` : 'no comments yet',
    },
    {
      title: 'Most bookmarked',
      value: mostBookmarkedPost ? `${mostBookmarkedPost._count.bookmarks} saves` : 'None',
      detail: mostBookmarkedPost ? `@${mostBookmarkedPost.author.username}: ${mostBookmarkedPost.content}` : 'no bookmarks yet',
    },
    {
      title: 'Total reactions',
      value: totalReactions,
      detail: 'hearts and stars',
    },
    {
      title: 'Total bookmarks',
      value: totalBookmarks,
      detail: 'saved posts',
    },
    {
      title: 'Total comments',
      value: totalComments,
      detail: 'discussion replies',
    },
  ];
}

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const USERS = [
  { username: 'luna_writes',    email: 'luna@creativo.app',    password: 'Luna1234!',   bio: 'Poet at heart. Words are my world.' },
  { username: 'ink_and_soul',   email: 'ink@creativo.app',     password: 'Ink12345!',   bio: 'Short stories, big emotions.' },
  { username: 'art_by_reem',    email: 'reem@creativo.app',    password: 'Reem1234!',   bio: 'Visual thinker. Art concept enthusiast.' },
  { username: 'daily_spark',    email: 'spark@creativo.app',   password: 'Spark123!',   bio: 'One prompt a day keeps the block away.' },
  { username: 'noor_creates',   email: 'noor@creativo.app',    password: 'Noor1234!',   bio: 'Motivation and mindful creativity.' },
  { username: 'verse_voyager',  email: 'verse@creativo.app',   password: 'Verse123!',   bio: 'Exploring poetry from every culture.' },
  { username: 'quiet_canvas',   email: 'canvas@creativo.app',  password: 'Canvas12!',   bio: 'Art ideas that speak in silence.' },
  { username: 'the_storytell',  email: 'story@creativo.app',   password: 'Story123!',   bio: 'Every stranger has a story.' },
];

const POSTS = [
  { authorIndex: 0, category: 'poetry',     content: 'The moon does not apologize for its light. Neither should you for your brilliance.' },
  { authorIndex: 0, category: 'poetry',     content: 'Rain writes on the window what the heart cannot say.' },
  { authorIndex: 1, category: 'story',      content: 'She opened the letter. It was from herself, ten years ago, and it said: you were right to leave.' },
  { authorIndex: 1, category: 'story',      content: 'The old lighthouse keeper had not spoken to anyone in forty years. Tonight, the sea spoke back.' },
  { authorIndex: 2, category: 'artidea',    content: 'Idea: paint a portrait using only the colors of one emotion. What color is nostalgia to you?' },
  { authorIndex: 2, category: 'artidea',    content: 'Concept: a mural made entirely of found objects collected from one city block.' },
  { authorIndex: 3, category: 'prompt',     content: 'Write about a door you were afraid to open. What was on the other side?' },
  { authorIndex: 3, category: 'prompt',     content: 'Describe your childhood bedroom from memory. What did the air smell like?' },
  { authorIndex: 4, category: 'motivation', content: 'You do not have to be great to start. You have to start to become great.' },
  { authorIndex: 4, category: 'motivation', content: 'Progress is messy. That is how you know it is real.' },
  { authorIndex: 5, category: 'poetry',     content: 'Between the word and the silence, there is a universe only the poet inhabits.' },
  { authorIndex: 6, category: 'artidea',    content: 'What if you sculpted your most vivid dream using only clay and your hands?' },
  { authorIndex: 7, category: 'story',      content: 'The map was old. The road was not. She drove anyway.' },
  { authorIndex: 0, category: 'poetry',     content: 'Stars do not compete. They simply burn.' },
  { authorIndex: 1, category: 'story',      content: 'He kept a jar of sand from every beach he visited. The jar was almost full. He was not ready for that.' },
  { authorIndex: 3, category: 'prompt',     content: 'If your city were a person, what would they whisper to you at 3 AM?' },
  { authorIndex: 4, category: 'motivation', content: 'Rest is not giving up. Rest is gathering strength.' },
  { authorIndex: 5, category: 'poetry',     content: 'Even the moon has phases. Give yourself permission to do the same.' },
  { authorIndex: 6, category: 'artidea',    content: 'Create something that can only be seen in the dark. What story does shadow tell?' },
  { authorIndex: 7, category: 'story',      content: 'The recipe card was written in her grandmother\'s handwriting. That was the last ingredient.' },
];

const COMMENTS_POOL = [
  'This moved me deeply.',
  'Absolutely beautiful.',
  'I needed to read this today.',
  'Shared this with my whole circle.',
  'This is exactly what I was feeling but could not express.',
  'You have such a gift.',
  'More please!',
  'The imagery here is stunning.',
  'I read this three times.',
  'This prompt unlocked something in me.',
];

function randomItems(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log('🌱 Starting seed...');

  await prisma.reaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  console.log('  ✓ Cleared existing data');

  const createdUsers = [];
  for (const u of USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.create({
      data: {
        username:  u.username,
        email:     u.email,
        password:  hashed,
        bio:       u.bio,
        createdAt: daysAgo(Math.floor(Math.random() * 120) + 30),
      },
    });
    createdUsers.push(user);
  }
  console.log(`  ✓ Created ${createdUsers.length} users`);

  const followPairs = [
    [0,1],[0,2],[0,4],[1,0],[1,3],[1,5],
    [2,0],[2,6],[3,0],[3,1],[3,4],[4,0],
    [4,1],[4,2],[5,0],[5,3],[6,2],[6,7],
    [7,0],[7,1],[7,5],
  ];
  for (const [fi, gi] of followPairs) {
    await prisma.follow.create({
      data: {
        followerId:  createdUsers[fi].id,
        followingId: createdUsers[gi].id,
        createdAt:   daysAgo(Math.floor(Math.random() * 90)),
      },
    });
  }
  console.log(`  ✓ Created ${followPairs.length} follows`);

  const createdPosts = [];
  for (const p of POSTS) {
    const post = await prisma.post.create({
      data: {
        content:   p.content,
        category:  p.category,
        authorId:  createdUsers[p.authorIndex].id,
        createdAt: daysAgo(Math.floor(Math.random() * 80)),
      },
    });
    createdPosts.push(post);
  }
  console.log(`  ✓ Created ${createdPosts.length} posts`);

  const reactionTypes = ['inspire', 'appreciate'];
  let reactionCount = 0;
  for (const post of createdPosts) {
    const reactors = randomItems(createdUsers, Math.floor(Math.random() * 5) + 1);
    for (const user of reactors) {
      if (user.id === post.authorId) continue;
      try {
        await prisma.reaction.create({
          data: {
            type:      reactionTypes[Math.floor(Math.random() * 2)],
            userId:    user.id,
            postId:    post.id,
            createdAt: daysAgo(Math.floor(Math.random() * 70)),
          },
        });
        reactionCount++;
      } catch {}
    }
  }
  console.log(`  ✓ Created ${reactionCount} reactions`);

  let commentCount = 0;
  for (const post of createdPosts) {
    const commenters = randomItems(createdUsers, Math.floor(Math.random() * 4) + 1);
    for (const user of commenters) {
      await prisma.comment.create({
        data: {
          text:      COMMENTS_POOL[Math.floor(Math.random() * COMMENTS_POOL.length)],
          authorId:  user.id,
          postId:    post.id,
          createdAt: daysAgo(Math.floor(Math.random() * 60)),
        },
      });
      commentCount++;
    }
  }
  console.log(`  ✓ Created ${commentCount} comments`);
  console.log(' Seed complete!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

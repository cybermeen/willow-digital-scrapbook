// seed.js
require('dotenv').config();
const db = require('./db/db');

const prompts = [
  { text: 'What made you smile genuinely today?', category: 'gratitude' },
  { text: 'What is one thing you wish had gone differently?', category: 'growth' },
  { text: 'If today were a movie, what would the title be?', category: 'fun' },
  { text: 'Who did you connect with today, and how did it feel?', category: 'general' },
  { text: 'What is one small win you can celebrate today?', category: 'gratitude' },
  { text: 'What song perfectly describes your mood right now?', category: 'fun' },
  { text: 'What did you learn about yourself today?', category: 'growth' },
  { text: 'What are you most looking forward to tomorrow?', category: 'general' },
  { text: 'Describe today in exactly three words.', category: 'fun' },
  { text: 'What is one thing you are grateful for that you usually overlook?', category: 'gratitude' },
  { text: 'What challenged you today, and how did you respond?', category: 'growth' },
  { text: 'If you could add one extra hour to today, how would you use it?', category: 'fun' },
  { text: 'When did today feel most peaceful?', category: 'short' },
  { text: 'What question did today make you ask yourself?', category: 'reflective' },
  { text: 'If today had a color, what would it be?', category: 'creative' },
];

const assets = [
  { name: 'Golden Star',    file: 'assets/stickers/star.png',       category: 'reward', reward: false },
  { name: 'Red Heart',      file: 'assets/stickers/heart.png',      category: 'reward', reward: false },
  { name: 'Rainbow',        file: 'assets/stickers/rainbow.png',    category: 'reward', reward: false },
  { name: 'Sun',            file: 'assets/stickers/sun.png',        category: 'reward', reward: false },
  { name: 'Moon',           file: 'assets/stickers/moon.png',       category: 'reward', reward: false },
  { name: 'Fire',           file: 'assets/stickers/fire.png',       category: 'reward', reward: false },
  { name: 'Confetti Crown', file: 'assets/stickers/crown.png',      category: 'reward', reward: true  },
  { name: 'Trophy',         file: 'assets/stickers/trophy.png',     category: 'reward', reward: true  },
];

async function seed() {
  console.log('Seeding database...');

  for (const p of prompts) {
    await db.query(
      `INSERT INTO reflective_prompts (prompt_text, category) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [p.text, p.category]
    );
  }
  console.log(`Inserted ${prompts.length} prompts.`);

  for (const a of assets) {
    await db.query(
      `INSERT INTO art_assets (name, file_path, is_achievement_reward) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [a.name, a.file, a.reward]
    );
  }
  console.log(`Inserted ${assets.length} art assets.`);

  console.log('Seed complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

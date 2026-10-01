const { db } = require('../lib/firebase');
const fs = require('fs');
const path = require('path');

async function migrateCollection(collectionName, jsonPath, getId) {
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const items = JSON.parse(raw);
  const batch = db.batch();
  let count = 0;

  for (const item of items) {
    const id = getId(item);
    const ref = db.collection(collectionName).doc(id);
    batch.set(ref, item);
    count++;
  }

  await batch.commit();
  console.log(`Migrated ${count} documents to ${collectionName}`);
}

async function main() {
  // Migrate users
  await migrateCollection('users', path.join(__dirname, '..', 'data', 'users.json'), u => u.id);

  // Migrate posts
  await migrateCollection('posts', path.join(__dirname, '..', 'data', 'posts.json'), p => p.id);

  // Migrate places (specialties are nested, so handle separately)
  const placesRaw = fs.readFileSync(path.join(__dirname, '..', 'data', 'places.json'), 'utf8');
  const placesData = JSON.parse(placesRaw);
  for (const [key, specialty] of Object.entries(placesData.specialties)) {
    await db.collection('places').doc(key).set({
      ...specialty,
      places: placesData.places[key] || []
    });
  }
  console.log('Migrated places');

  // Migrate articles
  const articlesRaw = fs.readFileSync(path.join(__dirname, '..', 'public', 'data', 'articles.json'), 'utf8');
  const articles = JSON.parse(articlesRaw);
  for (const article of articles) {
    await db.collection('articles').doc(article.id).set(article);
  }
  console.log('Migrated articles');

  console.log('All done!');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Disease = require('../models/Disease');
const Fertilizer = require('../models/Fertilizer');
const CropCalendar = require('../models/CropCalendar');

const diseasesData = require('./diseases');
const fertilizersData = require('./fertilizers');
const cropCalendarData = require('./cropCalendar');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Disease.deleteMany({}),
      Fertilizer.deleteMany({}),
      CropCalendar.deleteMany({})
    ]);
    console.log('Cleared existing seed data');

    // Seed diseases
    const diseases = await Disease.insertMany(diseasesData);
    console.log(`Seeded ${diseases.length} diseases`);

    // Seed fertilizers
    const fertilizers = await Fertilizer.insertMany(fertilizersData);
    console.log(`Seeded ${fertilizers.length} fertilizers`);

    // Seed crop calendar
    const calendars = await CropCalendar.insertMany(cropCalendarData);
    console.log(`Seeded ${calendars.length} crop calendar entries`);

    console.log('\n✓ Seed completed successfully!');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

seed();

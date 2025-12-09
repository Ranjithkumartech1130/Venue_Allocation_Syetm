const JsonDB = require('./utils/jsonDb');
const path = require('path');
const fs = require('fs');

console.log('Seeding Local JSON Database...');

// Ensure data dir
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Clear Venues file
const Venue = new JsonDB('venues');
const venuesFile = path.join(__dirname, 'data', 'venues.json');
fs.writeFileSync(venuesFile, JSON.stringify([]));

const venues = [
    {
        name: 'Main Auditorium',
        capacity: 500,
        description: 'Large auditorium with modern audio-visual equipment, perfect for conferences and seminars.',
        image: '/images/venue1.png',
        features: ['Projector', 'Sound System', 'AC']
    },
    {
        name: 'Seminar Hall B',
        capacity: 100,
        description: 'Spacious seminar hall with comfortable seating and presentation equipment.',
        image: '/images/venue2.png',
        features: ['Whiteboard', 'Projector', 'Mic']
    },
    {
        name: 'Computer Lab 1',
        capacity: 40,
        description: 'Fully equipped computer lab with high-speed internet.',
        image: '/images/venue3.png',
        features: ['40 PCs', 'Internet', 'Projector']
    }
];

venues.forEach(v => Venue.create(v));

console.log('Venues seeded successfully!');
process.exit();

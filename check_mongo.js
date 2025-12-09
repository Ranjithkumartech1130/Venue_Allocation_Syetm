const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/venue_allocation', { serverSelectionTimeoutMS: 2000 })
    .then(() => {
        console.log('MongoDB is RUNNING and CONNECTED');
        process.exit(0);
    })
    .catch(err => {
        console.error('MongoDB Connection FAILED:', err.message);
        process.exit(1);
    });

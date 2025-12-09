const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    description: { type: String },
    image: { type: String }, // URL to image
    facilities: {
        ac: { type: Boolean, default: false },
        mic: { type: Boolean, default: false },
        projector: { type: Boolean, default: false }
    }
});

module.exports = mongoose.model('Venue', venueSchema);

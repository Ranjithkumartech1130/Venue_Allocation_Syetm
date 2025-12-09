const JsonDB = require('../utils/jsonDb');
const Venue = new JsonDB('venues');

exports.getVenues = async (req, res) => {
    try {
        const venues = Venue.find();
        res.json(venues);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching venues' });
    }
};

exports.createVenue = async (req, res) => {
    try {
        const venue = Venue.create(req.body);
        res.status(201).json(venue);
    } catch (error) {
        res.status(500).json({ message: 'Error creating venue' });
    }
};

exports.deleteVenue = async (req, res) => {
    try {
        Venue.delete(req.params.id);
        res.json({ message: 'Venue deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting venue' });
    }
};

exports.updateVenue = async (req, res) => {
    try {
        const venue = Venue.update(req.params.id, req.body);
        res.json(venue);
    } catch (error) {
        res.status(500).json({ message: 'Error updating venue' });
    }
}

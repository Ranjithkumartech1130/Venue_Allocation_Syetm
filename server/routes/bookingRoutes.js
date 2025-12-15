const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/authMiddleware');
const upload = require('../config/multerConfig');

router.post('/', verifyToken, upload.single('reasoningFile'), bookingController.createBooking);
router.get('/', verifyToken, bookingController.getBookings);
router.delete('/:id', verifyToken, bookingController.deleteBooking);
router.get('/venue/:venueId', verifyToken, bookingController.getVenueBookings);

// Verification route
router.get('/download', bookingController.downloadBookings);
router.get('/verify/:id', bookingController.verifyBooking);
router.get('/reject/:id', bookingController.rejectBooking);
router.post('/reject/:id', bookingController.processRejection);

module.exports = router;

const express = require('express');
const upload = require('../middleware/multer');
const { submitContact, submitFeedback } = require('../controllers/contactController');

const router = express.Router();

// General contact form ("Send us a message").
router.post('/', submitContact);

// Support feedback form — accepts up to 5 image attachments.
router.post('/feedback', upload.array('attachments', 5), submitFeedback);

module.exports = router;

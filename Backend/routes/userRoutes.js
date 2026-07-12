const express = require('express');
const { updateAvatar, removeAvatar, updatePhone } = require('../controllers/userController');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const phoneAuthValidator = require('../validators/phoneAuthValidator');
const upload = require('../middleware/multer');

const router = express.Router();

// All /users routes are user-authenticated.
router.use(isAuthenticatedUser);

// Avatar upload — multipart field name MUST be "avatar".
router
  .route('/me/avatar')
  .post(upload.single('avatar'), updateAvatar)
  .delete(removeAvatar);

// Phone number change — Phone OTP verified (carries the proof token).
router.patch('/me/phone', validate(phoneAuthValidator.updatePhone), updatePhone);

module.exports = router;

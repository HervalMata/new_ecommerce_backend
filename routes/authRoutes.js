const authController = require('../controllers/authController')
const {authMiddleware} = require("../middlewares/authMiddleware");
const router = require('express').Router()

router.post('/admin-login', authController.admin_login)
router.get('/get-user/:userId', authMiddleware, authController.getUser)
router.post('/seller-register',  authController.seller_register)
router.post('/seller-login', authController.seller_login)
router.post('/profile-image-upload', authMiddleware, authController.profile_image_upload)
router.post('/profile-info-add', authMiddleware, authController.profile_info_add)

module.exports = router

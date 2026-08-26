const homeController = require("../../controllers/home/homeController");
const router = require("express").Router();

router.get('/get-categories', homeController.get_categories)

module.exports = router

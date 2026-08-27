const homeController = require("../../controllers/home/homeController");
const router = require("express").Router();

router.get('/get-categories', homeController.get_categories)
router.get('/get-products', homeController.get_Products)
router.get('/price-range-latest-product', homeController.price_range_product)

module.exports = router

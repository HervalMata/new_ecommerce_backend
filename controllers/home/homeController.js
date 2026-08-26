const categoryModel = require("../../models/categoryModel");
const {responseReturn} = require("../../utils/response");

class HomeController {
    get_categories = async (req, res) => {
        try {
            const categories = await categoryModel.find({})
            responseReturn(res, 200, { categories })
        } catch (error) {
            responseReturn(res, 404, { message: "Categories not found" })
        }
    }
}

module.exports = new HomeController();

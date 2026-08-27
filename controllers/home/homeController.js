const categoryModel = require("../../models/categoryModel");
const productModel = require("../../models/productModel");
const {responseReturn} = require("../../utils/response");

class HomeController {
    formateProduct = (products) => {
        const productArray = [];
        let i = 0
        while (i < products.length) {
            let tmp = []
            let j = i
            while (j < i + 3) {
                if (products[j]) {
                    tmp.push(products[j]);
                }
                j++
            }
            productArray.push([...tmp]);
            i = j
        }
        return productArray;
    }

    get_categories = async (req, res) => {
        try {
            const categories = await categoryModel.find({})
            responseReturn(res, 200, { categories })
        } catch (error) {
            responseReturn(res, 404, { message: "Categories not found" })
        }
    }

    get_Products = async (req, res) => {
        try {
            const products = await productModel.find({}).limit(12).sort({createdAt: -1})
            const allProducts = await productModel.find({}).limit(9).sort({createdAt: -1})
            const latest_product = this.formateProduct(allProducts)
            const allProducts2 = await productModel.find({}).limit(9).sort({rating: -1})
            const topRated_product = this.formateProduct(allProducts2)
            const allProducts3 = await productModel.find({}).limit(9).sort({discount: -1})
            const discount_product = this.formateProduct(allProducts3)

            responseReturn(res, 200, {
                products,
                latest_product,
                topRated_product,
                discount_product,
            })
        } catch (error) {
            responseReturn(res, 404, { message: "Product not found" })
        }
    }
}

module.exports = new HomeController();

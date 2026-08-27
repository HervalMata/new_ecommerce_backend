const categoryModel = require("../../models/categoryModel");
const productModel = require("../../models/productModel");
const {responseReturn} = require("../../utils/response");
const queryProducts = require("../../utils/queryProducts");

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

    price_range_product = async (req, res) => {
        try {
            const priceRange = {
                low: 0,
                high: 0,
            }

            const products = await productModel.find({}).limit(0).sort({createdAt: -1})
            const latest_product = this.formateProduct(products)
            const getForPrice = await productModel.find({}).sort({ 'price': -1 })

            if (getForPrice.length > 0) {
                priceRange.high = Number(getForPrice[getForPrice.length - 1].price)
                priceRange.low = getForPrice[0].price
            }

            responseReturn(res, 200, {
                latest_product,
                priceRange,
            })
        } catch (error) {
            responseReturn(res, 404, { message: "Product price range not found" })
        }
    }

    query_products = async (req, res) => {
        const perPage = 12
        res.query.perPage = perPage

        try {
            const products = await productModel.find({}).sort({createdAt: -1})
            const totalProduct = new queryProducts(products, res.query).ratingQuery().priceQuery().sortByPrice()
                .countProducts()
            const result = new queryProducts(products, res.query)
                .categoryQuery().ratingQuery().priceQuery().sortByPrice().skip().limit().getProducts()

            responseReturn(res, 200, {
                products: result,
                totalProduct,
                perPage,
            })
        } catch (error) {
            responseReturn(res, 404, { message: "Products not found" })
        }
    }
}

module.exports = new HomeController();

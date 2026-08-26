const formidable = require('formidable');
const productModel = require('../../models/productModel');
const {v2: cloudinary} = require("cloudinary");
const {responseReturn} = require("../../utils/response");

class ProductController {

    add_product = async (req, res) => {
        const id = req.id;
        const form = formidable({ multiples: true })

        form.parse(req, async (err, fields, files) => {
            let { name, category, description, stock, price, discount, shopName, brand } = fields;
            const { images } = files;
            name = name.trim();
            const slug = name.split(' ').join('-');

            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
                secure: true
            })

            try {
                let allImageUrl = []
                for (let i = 0; i < images.length; i++) {
                    const result = await cloudinary.uploader.upload(images[i].filepath, { folder: 'products' })
                    allImageUrl = [...allImageUrl, result?.url]
                }
                await productModel.create({
                    sellerId: id,
                    name,
                    slug,
                    shopName,
                    category: category.trim(),
                    description: description.trim(),
                    stock: parseInt(stock),
                    price: parseInt(price),
                    discount: parseInt(discount),
                    images: allImageUrl,
                    brand: brand.trim()
                })

                responseReturn(res, 201, { message: 'Product Added Successfully' })
            } catch (error) {
                responseReturn(res, 500, { error: 'Internal Server Error' })
            }
        })
    }

    products_get = async (req, res) => {
        const id = req.id;
        const { page, searchValue, perPage } = req.query;

        try {
            let skipPage = 0
            if (perPage && page) {
                skipPage = parseInt(perPage, 10) * (parseInt(page, 10) - 1);
            }
            if (searchValue && page && perPage) {
                const products = await productModel.find({
                    $text: { $search: searchValue }
                }).skip(skipPage).limit(perPage).sort({ createdAt: -1 })
                const totalProduct = await productModel.find({
                    $text: { $search: searchValue }
                }).countDocuments()
                responseReturn(res, 200, {products: products, totalProduct: totalProduct})
            } else if (searchValue === '' && page && perPage) {
                const products = await productModel.find({})
                    .skip(skipPage).limit(perPage).sort({ createdAt: -1 })
                const totalProduct = await productModel.find({})
                    .countDocuments()
                responseReturn(res, 200, {products: products, totalProduct: totalProduct})
            } else {
                const products = await productModel.find({}).sort({ createdAt: -1 })
                const totalProduct = await productModel.find({})
                    .countDocuments()
                responseReturn(res, 200, {products: products, totalProduct: totalProduct})
            }
        } catch (error) {
            responseReturn(res, 500, { error: 'Internal Server Error' })
        }
    }

    product_get = async (req, res) => {
        const { productId }= req.params;

        try {
            const product = await productModel.findById(productId)
            responseReturn(res, 200, {product: product})
        } catch (error) {
            responseReturn(res, 500, { error: 'Internal Server Error' })
        }
    }

    product_update = async (req, res) => {
        let { name, description, stock, price, discount, brand, productId } = req.body
        name = name.trim();
        const slug = name.split(' ').join('-');

        try {
            await productModel.findByIdAndUpdate(productId, {
                name, description, stock, price, discount, brand, slug
            })
            const product = await productModel.findById(productId)
            responseReturn(res, 201, { product, message: 'Product Updated Successfully' })
        } catch (error) {
            responseReturn(res, 500, { error: 'Internal Server Error' })
        }
    }

    product_image_update = async (req, res) => {
        const form = formidable({ multiples: true })

        form.parse(req, async (err, fields, files) => {
            const { oldImage, productId } = fields
            const [ newImage ] = files.newImage ?? []

            if (err) {
                responseReturn(res, 400, { err: err.message  })
            } else {
                try {
                    cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                        api_key: process.env.CLOUDINARY_API_KEY,
                        api_secret: process.env.CLOUDINARY_API_SECRET,
                        secure: true
                    })

                    const result = await cloudinary.uploader.upload(newImage.filepath, { folder: 'products' })

                    if (result) {
                        let {images} = await productModel.findById(productId)
                        const index = images.findIndex(img => img === oldImage)
                        images[index] = result?.url
                        await productModel.findByIdAndUpdate(productId, {images})
                        const product = await productModel.findById(productId)
                        responseReturn(res, 201, { product, message: 'Product Image Updated Successfully' })
                    } else {
                        responseReturn(res, 404, { error: 'Image Upload Failed' })
                    }
                } catch (error) {
                    responseReturn(res, 500, { error: 'Internal Server Error' })
                }
            }
        })
    }
}

module.exports = new ProductController();

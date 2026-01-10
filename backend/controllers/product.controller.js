import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import ClaimWarranty from "../models/claimwarranty.model.js";

export const getAllProducts = async (req, res) => {
	try {
		const products = await Product.find({}); // find all products
		res.json({ products });
	} catch (error) {
		console.log("Error in getAllProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getFeaturedProducts = async (req, res) => {
	try {
		let featuredProducts = await redis.get("featured_products");
		if (featuredProducts) {
			return res.json(JSON.parse(featuredProducts));
		}

		// if not in redis, fetch from mongodb
		// .lean() is gonna return a plain javascript object instead of a mongodb document
		// which is good for performance
		featuredProducts = await Product.find({ isFeatured: true }).lean();

		if (!featuredProducts) {
			return res.status(404).json({ message: "No featured products found" });
		}

		// store in redis for future quick access

		await redis.set("featured_products", JSON.stringify(featuredProducts));

		res.json(featuredProducts);
	} catch (error) {
		console.log("Error in getFeaturedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createProduct = async (req, res) => {
	try {
		const { name, description, price, salePrice, image, category, quantity, closeOut } = req.body;
		let cloudinaryResponse = null;
		console.log(req.body);
		if (image) {
			cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
		}

		const product = await Product.create({
			name,
			description,
			price,
			salePrice,
			image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
			category,
			quantity,
			closeOut
		});

		res.status(201).json(product);
	} catch (error) {
		console.log("Error in createProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);

		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		if (product.image) {
			const publicId = product.image.split("/").pop().split(".")[0];
			try {
				await cloudinary.uploader.destroy(`products/${publicId}`);
				console.log("deleted image from cloduinary");
			} catch (error) {
				console.log("error deleting image from cloduinary", error);
			}
		}

		await Product.findByIdAndDelete(req.params.id);

		res.json({ message: "Product deleted successfully" });
	} catch (error) {
		console.log("Error in deleteProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getRecommendedProducts = async (req, res) => {
	try {
		const products = await Product.aggregate([
			{
				$sample: { size: 4 },
			},
			{
				$project: {
					_id: 1,
					name: 1,
					description: 1,
					image: 1,
					price: 1,
					salePrice: 1
				},
			},
		]);

		res.json(products);
	} catch (error) {
		console.log("Error in getRecommendedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductsByCategory = async (req, res) => {
	const { category } = req.params;
	try {
		const generalProducts = await Product.find({ category });
		const products = generalProducts.filter((product) => !product.closeOut);
		res.json({ success: true, products });
	} catch (error) {
		console.log("Error in getProductsByCategory controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const toggleFeaturedProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (product) {
			product.isFeatured = !product.isFeatured;
			const updatedProduct = await product.save();
			await updateFeaturedProductsCache();
			res.json(updatedProduct);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in toggleFeaturedProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

async function updateFeaturedProductsCache() {
	try {
		// The lean() method  is used to return plain JavaScript objects instead of full Mongoose documents. This can significantly improve performance

		const featuredProducts = await Product.find({ isFeatured: true }).lean();
		await redis.set("featured_products", JSON.stringify(featuredProducts));
	} catch (error) {
		console.log("error in update cache function");
	}
}

export const editProductDetails = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, description, price, salePrice, category, image, quantity } = req.body;

		const product = await Product.findById(id);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		// Update fields if provided
		if (name !== undefined) product.name = name;
		if (description !== undefined) product.description = description;
		if (price !== undefined) product.price = price;
		if (category !== undefined) product.category = category;
		if (image !== undefined) product.image = image;
		if (salePrice !== undefined) product.salePrice = salePrice;
		if (quantity !== undefined) product.quantity = quantity;

		const updatedProduct = await product.save();

		// Optionally update featured products cache if isFeatured or other relevant fields changed
		await updateFeaturedProductsCache();

		res.json(updatedProduct);
	} catch (error) {
		console.log("Error in editProductDetails controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const claimWarranty = async (req, res) => {
	try {
		const { productName, reason, photo, address, phone } = req.body;
		if (!productName || !reason || !photo || !address || !phone) {
			return res.status(400).json({ message: "All fields are required" });
		}

		// Upload photo to Cloudinary
		const cloudinaryResponse = await cloudinary.uploader.upload(photo, { folder: "warranty_claims" });
		const imageUrl = cloudinaryResponse.secure_url;
		await ClaimWarranty.create({
			user: req.user._id,
			productName,
			reason,
			address,
			phone,
			imageUrl
		});

		// Here you would typically save the warranty claim to your database
		// For demonstration, we'll just return the data
		res.status(201).json({
			success: true,
		});
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const searchProduct = async (req, res) => {
	try {
		const { name } = req.query;
		if (!name) {
			return res.status(400).json({ message: "Query parameter is required" });
		}

		const products = await Product.find({
			name: { $regex: name, $options: "i" } // case-insensitive search
		});

		if (products.length === 0) {
			return res.status(404).json({ message: "No products found" });
		}

		res.json({ products });
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getPdpPage = async (req, res) => {
	try {
		const { name } = req.params;
		const product = await Product.findOne({ name }).lean();
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		return res.status(200).json({
			success: true,
			product: product
		});
	} catch (error) {
		console.log("Error in getPdpPage controller", error.message);
		return res.status(500).json({ message: "Server error", error: error.message });
	}
}

export const updateProductQuantity = async (req, res) => {
	try {
		const { id, quantity } = req.body;
		console.log(id, quantity);

		if (quantity < 0) {
			return res.status(400).json({ message: "Quantity cannot be negative" });
		}

		const product = await Product.findById(id).select("quantity");
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		if (product.quantity < quantity) {
			return res.status(400).json({
				success: false,
				messsage: "this is the last piece of this product, you cannot update the quantity to more than 1",
			});
		}
		return res.status(200).json({
			success: true,
			message: "Product quantity updated successfully",
		})
	} catch (error) {
		res.status(500).json({ success: false, message: "Server error", error: error.message });
	}
}


export const warrantyClaimsDashboard = async (req, res) => {

	try {
		const claims = await ClaimWarranty.find({}).populate("user", "name email").lean();
		if (!claims) {
			return res.status(404).json({ message: "No warranty claims found" });
		}
		console.log(claims);
		res.json(claims);
	} catch (error) {
		console.log("Error in WarrantyClaimsDashboard controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
}

export const updateWarrantyClaimStatus = async (req, res) => {
	try {
		const { status } = req.body;
		const { id } = req.params;

		if (!status || !["pending", "approved", "rejected"].includes(status)) {
			return res.status(400).json({ message: "Invalid status" });
		}
		const claim = await ClaimWarranty.updateOne(id, { status });
		if (claim.modifiedCount === 0) {
			return res.status(404).json({ message: "Claim not found or status already set to this value" });
		};

		return res.status(200).json({
			success: true,
			message: "Warranty claim status updated successfully",
		});
	} catch (error) {
		console.log("Error in updateWarrantyClaimStatus controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
}

export const fetchClearanceSaleProducts = async (req, res) => {
	try {
		const products = await Product.find({ closeOut: true }).lean();
		if (!products || products.length === 0) {
			return res.status(404).json({ message: "No clearance sale products found" });
		}
		res.status(200).json({ products });
	} catch (error) {
		console.log("Error in fetchClearanceSaleProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
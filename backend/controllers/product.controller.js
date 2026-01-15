import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import prisma from "../lib/prisma.js";

export const getAllProducts = async (req, res) => {
	try {
		const products = await prisma.product.findMany({});
		res.json({ products });
	} catch (error) {
		console.log("Error in getAllProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getFeaturedProducts = async (req, res) => {
	try {
		const useCache = process.env.NODE_ENV === "production";
		if (useCache) {
			try {
				const cachedProducts = await redis.get("featured_products");
				if (cachedProducts) {
					return res.json(JSON.parse(cachedProducts));
				}
			} catch (error) {
				console.log("Redis cache error in getFeaturedProducts", error.message);
			}
		}

		// if not in redis, fetch from postgres
		const featuredProducts = await prisma.product.findMany({
			where: { isFeatured: true }
		});

		if (!featuredProducts) {
			return res.status(404).json({ message: "No featured products found" });
		}

		// store in redis for future quick access
		if (useCache) {
			try {
				await redis.set("featured_products", JSON.stringify(featuredProducts), "EX", 300);
			} catch (error) {
				console.log("Redis set cache error in getFeaturedProducts", error.message);
			}
		}

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

		if (image) {
			cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
		}

		const product = await prisma.product.create({
			data: {
				name,
				description,
				price: parseFloat(price),
				salePrice: parseFloat(salePrice),
				image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
				category,
				quantity: parseInt(quantity) || 0,
				closeOut: closeOut || false
			}
		});

		res.status(201).json(product);
	} catch (error) {
		console.log("Error in createProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteProduct = async (req, res) => {
	try {
		const product = await prisma.product.findUnique({ where: { id: req.params.id } });

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

		await prisma.product.delete({ where: { id: req.params.id } });

		res.json({ message: "Product deleted successfully" });
	} catch (error) {
		console.log("Error in deleteProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getRecommendedProducts = async (req, res) => {
	try {
		// Prisma doesn't have native random sample, using raw query for PostgreSQL
		const products = await prisma.$queryRaw`
			SELECT id, name, description, image, price, "salePrice" 
			FROM products 
			ORDER BY RANDOM() 
			LIMIT 4
		`;

		res.json(products);
	} catch (error) {
		console.log("Error in getRecommendedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductsByCategory = async (req, res) => {
	const { category } = req.params;
	try {
		const generalProducts = await prisma.product.findMany({ where: { category } });
		const products = generalProducts.filter((product) => !product.closeOut);
		res.json({ success: true, products });
	} catch (error) {
		console.log("Error in getProductsByCategory controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const toggleFeaturedProduct = async (req, res) => {
	try {
		const product = await prisma.product.findUnique({ where: { id: req.params.id } });
		if (product) {
			const updatedProduct = await prisma.product.update({
				where: { id: req.params.id },
				data: { isFeatured: !product.isFeatured }
			});
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
		const featuredProducts = await prisma.product.findMany({ where: { isFeatured: true } });
		try {
			await redis.set("featured_products", JSON.stringify(featuredProducts));
		} catch (redisError) {
			console.log("Redis cache update error:", redisError.message);
		}
	} catch (error) {
		console.log("error in update cache function:", error.message);
	}
}

export const editProductDetails = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, description, price, salePrice, category, image, quantity } = req.body;

		// Prisma update ignores undefined fields in 'data' object if not using a specific type, 
		// but standard practice is to build the object.
		const updateData = {};
		if (name !== undefined) updateData.name = name;
		if (description !== undefined) updateData.description = description;
		if (price !== undefined) updateData.price = parseFloat(price);
		if (salePrice !== undefined) updateData.salePrice = parseFloat(salePrice);
		if (category !== undefined) updateData.category = category;
		if (image !== undefined) updateData.image = image;
		if (quantity !== undefined) updateData.quantity = parseInt(quantity);

		const updatedProduct = await prisma.product.update({
			where: { id },
			data: updateData
		});

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

		await prisma.warrantyClaim.create({
			data: {
				userId: req.user.id,
				productName,
				reason,
				address,
				phone,
				imageUrl
			}
		});

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

		const products = await prisma.product.findMany({
			where: {
				name: { contains: name, mode: "insensitive" } // case-insensitive search
			}
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
		const product = await prisma.product.findFirst({ where: { name } });
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

		const product = await prisma.product.findUnique({
			where: { id },
			select: { quantity: true }
		});

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
		const claims = await prisma.warrantyClaim.findMany({
			include: { user: { select: { name: true, email: true } } }
		});
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
		const { id } = req.params; // Expecting claimId as parameter name in route is '/:claimId' but controller used id from params, looking at route file it was /:claimId. Wait, let me check product.route.js

		// Route: router.put("/warranty/claim/:claimId", ... updateWarrantyClaimStatus);
		// Controller was utilizing `req.params`, but destructured likely inside or used proper name.
		// Original code: `const { id } = req.params;` but route param is claimId. This might have been a bug or I misread.
		// In the route file: `router.put("/warranty/claim/:claimId", protectRoute, adminRoute, updateWarrantyClaimStatus);`
		// In the original controller: 
		// `const { id } = req.params;` -> This would be undefined if param is claimId. 
		// Let's assume the user wants it fixed or I should use `req.params.claimId`.
		const claimId = req.params.claimId || req.params.id; // Fallback

		if (!status || !["pending", "approved", "rejected"].includes(status)) {
			return res.status(400).json({ message: "Invalid status" });
		}

		// Prisma update throws if not found? No, it throws RecordNotFound.
		try {
			await prisma.warrantyClaim.update({
				where: { id: claimId },
				data: { status }
			});
		} catch (e) {
			return res.status(404).json({ message: "Claim not found" });
		}

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
		const products = await prisma.product.findMany({ where: { closeOut: true } });
		if (!products || products.length === 0) {
			return res.status(404).json({ message: "No clearance sale products found" });
		}
		res.status(200).json({ products });
	} catch (error) {
		console.log("Error in fetchClearanceSaleProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

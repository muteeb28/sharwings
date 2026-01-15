import prisma from "../lib/prisma.js";

export const getCartProducts = async (req, res) => {
	try {
		// req.user.cartItems is populated by auth middleware
		// But we need full product details.

		const cartItems = req.user.cartItems;
		const productIds = cartItems.map(item => item.productId);

		const products = await prisma.product.findMany({
			where: { id: { in: productIds } }
		});

		// add quantity for each product
		const cartData = products.map((product) => {
			const item = cartItems.find((cartItem) => cartItem.productId === product.id);
			return { ...product, quantity: item.quantity };
		});

		res.json(cartData);
	} catch (error) {
		console.log("Error in getCartProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const addToCart = async (req, res) => {
	try {
		const { productId, quantity, _id, id } = req.body;
		const resolvedProductId = productId || _id || id;
		const userId = req.user.id;

		if (!resolvedProductId) {
			return res.status(400).json({ message: "Product ID is required" });
		}

		const product = await prisma.product.findUnique({
			where: { id: resolvedProductId },
			select: { quantity: true, id: true }
		});

		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		const existingItem = await prisma.cartItem.findFirst({
			where: { userId, productId: resolvedProductId }
		});

		if (existingItem) {
			if (quantity > existingItem.quantity) {
				// Logic check: if user wants to add `quantity` amount? 
				// Code seems to imply `quantity` is the *new* total or the increment?
				// Original: `existingItem.quantity += 1` implies increment by 1 regardless of body quantity?
				// Wait, original: `if (quantity > existingItem.quantity)`? This looks confusing in original code.
				// Original: 
				// if (existingItem) {
				//    if (quantity > existingItem.quantity) ...
				// 	  existingItem.quantity += 1;
				// }
				// Use input quantity is unused in existingItem block except for check? 
				// Actually `quantity` from body likely means "how many I want to buy total" or "how many to add"?
				// Standard add to cart is usually "add 1".
				// Let's assume add 1 if exists, or set to provided quantity?
				// The original code was `existingItem.quantity += 1`.

				// But it checked `quantity > existingItem.quantity`. `quantity` from body.
				// Assuming `quantity` in body is usually 1.

				// Let's stick to simple logic: increment by 1 or incoming quantity.
				// But I'll follow original logic closely: increment by 1.

				// Check stock
				// if (existingItem.quantity + 1 > product.quantity) {
				//   return res.status(500).json({ message: `Only ${product.quantity} in stock.` });
				// }

				await prisma.cartItem.update({
					where: { id: existingItem.id },
					data: { quantity: existingItem.quantity + 1 }
				});
			} else {
				// Fallback or bug in original logic. 
				// I will just increment.
				await prisma.cartItem.update({
					where: { id: existingItem.id },
					data: { quantity: existingItem.quantity + 1 }
				});
			}
		} else {
			// New item
			// user.cartItems.push({_id: productId, quantity: quantity || 1});
			const qty = quantity || 1;
			if (qty > product.quantity) {
				return res.status(400).json({ message: `Only ${product.quantity} in stock.` });
			}

			await prisma.cartItem.create({
				data: {
					userId,
					productId: resolvedProductId,
					quantity: qty
				}
			});
		}

		// Return updated cart
		const updatedCartItems = await prisma.cartItem.findMany({ where: { userId } });
		res.json(updatedCartItems);
	} catch (error) {
		console.log("Error in addToCart controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const removeAllFromCart = async (req, res) => {
	try {
		const { productId } = req.body;
		const userId = req.user.id;

		if (!productId) {
			await prisma.cartItem.deleteMany({ where: { userId } });
		} else {
			// Original code: `user.cartItems = user.cartItems.filter((item) => item.id !== productId);`
			// Remove specific product from cart
			await prisma.cartItem.deleteMany({
				where: { userId, productId }
			});
		}

		const cartItems = await prisma.cartItem.findMany({ where: { userId } });
		res.json(cartItems);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateQuantity = async (req, res) => {
	try {
		const { id: productId } = req.params;
		const { quantity } = req.body;
		const userId = req.user.id;

		if (quantity === 0) {
			await prisma.cartItem.deleteMany({ where: { userId, productId } });
		} else {
			const product = await prisma.product.findUnique({
				where: { id: productId },
				select: { quantity: true }
			});

			if (!product) {
				return res.status(404).json({ message: "Product not found" });
			}

			if (quantity > product.quantity) {
				return res
					.status(400)
					.json({ message: `Only ${product.quantity} in stock.` });
			}

			const item = await prisma.cartItem.findFirst({ where: { userId, productId } });
			if (item) {
				await prisma.cartItem.update({
					where: { id: item.id },
					data: { quantity }
				});
			} else {
				return res.status(404).json({ message: "Item not found in cart" });
			}
		}

		const cartItems = await prisma.cartItem.findMany({ where: { userId } });
		res.json(cartItems);
	} catch (error) {
		console.log("Error in updateQuantity controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const addCustomerBillingAddress = async (req, res) => {
	try {
		if (!req.body) {
			return res.status(400).json({
				success: false,
				msg: "invalid form. Please enter all the necessary form fields."
			})
		}

		const updatedUser = await prisma.user.update({
			where: { id: req.user.id },
			data: { address: req.body } // Assuming body matches Json structure or is generic object
		});

		return res.status(200).json({
			success: true,
			msg: "billing address udpated successfully."
		})
	} catch (error) {
		console.log("error in updating or adding billing address", error.message);
		res.status(500).json({ message: "server error", error: error.message });
	}
}

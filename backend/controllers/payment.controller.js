import { stripe } from "../lib/stripe.js";
import razorpay from "../lib/razorpay.js";
import crypto from "crypto";
import EmailHelper from "../helpers/emailHelper.js";
import { orderSuccessTemplate } from "../templates/orders.js";
import prisma from "../lib/prisma.js";

const resolveProductPrice = (product) => {
	const price = Number(product?.salePrice ?? product?.price);
	return Number.isFinite(price) ? price : null;
};

const ensureHttpsUrl = (value) => {
	if (typeof value !== "string") return null;
	if (value.startsWith("http://")) {
		return value.replace(/^http:\/\//i, "https://");
	}
	return value;
};

export const createCheckoutSession = async (req, res) => {
	try {
		// req.body.products matches { id, quantity, price, image, name }
		const { products, couponCode } = req.body;

		if (!Array.isArray(products) || products.length === 0) {
			return res.status(400).json({ error: "Invalid or empty products array" });
		}

		let totalAmount = 0;

		const lineItems = products.map((product) => {
			const amount = Math.round(product.price * 100); // stripe wants u to send in the format of cents
			totalAmount += amount * product.quantity;
			const imageUrl = ensureHttpsUrl(product.image);

			return {
				price_data: {
					currency: "usd",
					product_data: {
						name: product.name,
						images: imageUrl ? [imageUrl] : [],
					},
					unit_amount: amount,
				},
				quantity: product.quantity || 1,
			};
		});

		let coupon = null;
		if (couponCode) {
			coupon = await prisma.coupon.findFirst({
				where: { code: couponCode, userId: req.user.id, isActive: true }
			});
			if (coupon) {
				totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
			}
		}

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: lineItems,
			mode: "payment",
			success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
			discounts: coupon
				? [
					{
						coupon: await createStripeCoupon(coupon.discountPercentage),
					},
				]
				: [],
			metadata: {
				userId: req.user.id.toString(),
				couponCode: couponCode || "",
				products: JSON.stringify(
					products.map((p) => ({
						id: p._id, // Frontend uses _id or id? assuming _id from Mongoose days, check usage
						// Wait, previous code used p._id. Product table now uses id. Frontend logic might expect _id.
						// But here we are just storing it in metadata to retrieve later.
						// So we store whatever frontend sent.
						id: p._id || p.id,
						quantity: p.quantity,
						price: p.price,
					}))
				),
			},
		});

		if (totalAmount >= 20000) {
			await createNewCoupon(req.user.id);
		}
		res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
	} catch (error) {
		console.error("Error processing checkout:", error);
		res.status(500).json({ message: "Error processing checkout", error: error.message });
	}
};

export const checkoutSuccess = async (req, res) => {
	try {
		const { sessionId } = req.body;
		const session = await stripe.checkout.sessions.retrieve(sessionId);

		if (session.payment_status === "paid") {
			if (session.metadata.couponCode) {
				await prisma.coupon.updateMany({ // updateMany because where uses non-unique combined
					where: {
						code: session.metadata.couponCode,
						userId: session.metadata.userId
					},
					data: { isActive: false }
				});
			}

			// create a new Order
			const products = JSON.parse(session.metadata.products);

			// Prisma create with nested writes
			const newOrder = await prisma.order.create({
				data: {
					userId: session.metadata.userId,
					totalAmount: session.amount_total / 100,
					// stripeSessionId: sessionId, // Not in schema? I should add it or ignore.
					// Prior schema didn't have it explicitly in previous check? 
					// Let's check schema.prisma... I didn't add stripeSessionId, only razorpay.
					// I will ignore for now or add if I can.
					status: "pending",
					orderItems: {
						create: products.map(product => ({
							productId: product.id,
							quantity: product.quantity,
							price: product.price
						}))
					}
				}
			});

			res.status(200).json({
				success: true,
				message: "Payment successful, order created, and coupon deactivated if used.",
				orderId: newOrder.id,
			});
		}
	} catch (error) {
		console.error("Error processing successful checkout:", error);
		res.status(500).json({ message: "Error processing successful checkout", error: error.message });
	}
};

export const razorpaySuccess = async (req, res) => {
	try {
		console.log("Razorpay success request body:", req.body);
		const { paymentId, orderId, signature } = req.body;

		const generatedSignature = crypto
			.createHmac("sha256", process.env.RAZORPAY_TOKEN_SECRET)
			.update(orderId + "|" + paymentId)
			.digest("hex");

		if (generatedSignature !== signature) {
			return res.status(400).json({ success: false, message: "Invalid signature" });
		}

		const razorpayOrder = await razorpay.orders.fetch(orderId);
		const notes = razorpayOrder.notes;
		const userId = notes.userId;
		const couponCode = notes.couponCode;
		const products = JSON.parse(notes.products);

		if (couponCode) {
			await prisma.coupon.updateMany({
				where: { code: couponCode, userId },
				data: { isActive: false }
			});
		}

		const newOrder = await prisma.order.create({
			data: {
				userId: userId,
				totalAmount: razorpayOrder.amount / 100,
				razorpayOrderId: orderId,
				razorpayPaymentId: paymentId,
				mode: "online",
				address: req.user.address, // Requires req.user to be populated (auth middleware)
				status: "processing", // or default pending
				orderItems: {
					create: products.map(product => ({
						productId: product.id,
						quantity: product.quantity,
						price: product.price // Using price or salePrice? Original code used notes.products which stored salePrice as price.
					}))
				}
			},
			include: { user: true } // to get name for email
		});

		// updating product quantities
		for (const product of products) {
			await prisma.product.update({
				where: { id: product.id },
				data: { quantity: { decrement: product.quantity } }
			});
		}

		res.status(200).json({
			success: true,
			message: "Payment successful, order created, and coupon deactivated if used.",
			orderId: newOrder.id,
		});
	} catch (error) {
		console.error("Error processing Razorpay success:", error);
		res.status(500).json({ message: "Error processing Razorpay success", error: error.message });
	}
};

async function createStripeCoupon(discountPercentage) {
	const coupon = await stripe.coupons.create({
		percent_off: discountPercentage,
		duration: "once",
	});

	return coupon.id;
}

async function createNewCoupon(userId) {
	// Delete existing coupons for this user (logic from original code)
	await prisma.coupon.deleteMany({ where: { userId } });

	const newCoupon = await prisma.coupon.create({
		data: {
			code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
			discountPercentage: 10,
			expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
			userId: userId
		}
	});

	return newCoupon;
}

export const createCheckoutSessionRazorpay = async (req, res) => {
	try {
		const { products } = req.body;

		if (!Array.isArray(products) || products.length === 0) {
			return res.status(400).json({ error: "Invalid or empty products array" });
		}

		// Checking req.user.address. As address is Json, accessing it might require cast or check.
		// req.user from Prisma has generic Json object.
		if (!req.user.address || !req.user.address.name) {
			return res.status(400).json({ error: "User address is required for checkout" });
		}

		const invalidProduct = products.find((product) => {
			const unitPrice = resolveProductPrice(product);
			const quantity = Number(product?.quantity ?? 1);
			return !unitPrice || unitPrice <= 0 || !Number.isFinite(quantity) || quantity < 1;
		});
		if (invalidProduct) {
			return res
				.status(400)
				.json({ error: `Invalid product price or quantity for ${invalidProduct.name || "item"}` });
		}

		let totalAmount = 0;

		const items = products.map((product) => {
			const unitPrice = resolveProductPrice(product);
			const quantity = Number(product?.quantity ?? 1);
			const amount = Math.round(unitPrice * 100);
			totalAmount += amount * quantity;
			const imageUrl = ensureHttpsUrl(product.image);

			return {
				name: product.name,
				image: imageUrl || undefined,
				quantity,
				price: amount,
			};
		});

		const order = await razorpay.orders.create({
			amount: totalAmount,
			currency: "INR",
			receipt: `receipt_${Date.now()}`,
			notes: {
				userId: req.user.id.toString(),
				products: JSON.stringify(
					products.map((p) => ({
						id: p._id || p.id,
						quantity: Number(p?.quantity ?? 1),
						price: resolveProductPrice(p),
					}))
				),
			},
		});

		const productName = products.map(p => p.name).join(", ");

		// Empty cart
		await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });

		const html = EmailHelper.renderTemplate(orderSuccessTemplate, {
			name: req.user?.name,
			orderId: order.id,
			orderItems: productName,
			totalAmount: totalAmount,
			address: req.user?.address,
			paymentMode: "Online Payment"
		});

		try {
			const emailHelper = new EmailHelper();
			await emailHelper.sendEmail({
				to: process.env.NODEMAILER_REVCIEVER,
				subject: "new order recieved",
				text: "you have recieved a new order",
				html: html,
			});
		} catch (emailError) {
			console.log("Email send failed:", emailError.message);
		}
		res.status(200).json({
			id: order.id,
			totalAmount: totalAmount / 100,
			keyId: process.env.RAZORPAY_KEY_ID || null,
		});
	} catch (error) {
		console.error("Error processing checkout:", error);
		res.status(500).json({ message: "Error processing checkout", error: error.message });
	}
};


export const placeOrderWithCashOnDelivery = async (req, res) => {
	try {
		const { products } = req.body;

		if (!Array.isArray(products) || products.length === 0) {
			return res.status(400).json({ error: "Invalid or empty products array" });
		}

		if (!req.user.address || !req.user.address.name) {
			return res.status(400).json({ error: "User address is required for checkout" });
		}

		const invalidProduct = products.find((product) => {
			const unitPrice = resolveProductPrice(product);
			const quantity = Number(product?.quantity ?? 1);
			return !unitPrice || unitPrice <= 0 || !Number.isFinite(quantity) || quantity < 1;
		});
		if (invalidProduct) {
			return res
				.status(400)
				.json({ error: `Invalid product price or quantity for ${invalidProduct.name || "item"}` });
		}

		const totalAmount = products.reduce((sum, product) => {
			const unitPrice = resolveProductPrice(product);
			const quantity = Number(product?.quantity ?? 1);
			return sum + unitPrice * quantity;
		}, 0);

		// Create Order and OrderItems
		const newOrder = await prisma.order.create({
			data: {
				userId: req.user.id,
				totalAmount: totalAmount,
				mode: "cod",
				address: req.user.address,
				orderItems: {
					create: products.map(product => ({
						productId: product._id || product.id,
						quantity: Number(product?.quantity ?? 1),
						price: resolveProductPrice(product) // using salePrice as price
					}))
				}
			}
		});

		const productName = products.map(p => p.name).join(", ");
		const html = EmailHelper.renderTemplate(orderSuccessTemplate, {
			name: req.user?.name,
			orderId: newOrder.id,
			orderItems: productName,
			totalAmount: totalAmount,
			address: req.user?.address,
			paymentMode: "Cash on Delivery"
		});

		try {
			const emailHelper = new EmailHelper();
			await emailHelper.sendEmail({
				to: process.env.NODEMAILER_REVCIEVER,
				subject: "new order recieved",
				text: "you have recieved a new order",
				html: html,
			});
		} catch (emailError) {
			console.log("Email send failed:", emailError.message);
		}

		await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
		res.status(200).json({ success: true, message: "Order placed successfully with Cash on Delivery" });
	} catch (error) {
		console.error("Error processing checkout:", error);
		res.status(500).json({ message: "Error processing checkout", error: error.message });
	}
};

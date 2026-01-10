import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import orders from "./routes/order.route.js";

import { connectDB } from "./lib/db.js";

dotenv.config();

// Connect to DB immediately
connectDB();

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
	console.error('Uncaught Exception:', error);
});

const app = express();
const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();

const corsOptions = {
	origin: process.env.CLIENT_URL,
	methods: ['GET', 'POST', 'PUT', 'DELETE'],
	credentials: true
};
app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" })); // allows you to parse the body of the request
app.use(cookieParser());

app.get("/api/health", (req, res) => {
	res.status(200).json({ message: "Server is running", env: process.env.NODE_ENV });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orders)
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

if (process.env.VERCEL) {
	// connectDB already called at top
} else {
	app.listen(PORT, () => {
		console.log("Server is running on http://localhost:" + PORT);
	});
}

export default app;

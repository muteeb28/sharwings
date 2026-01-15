import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import orders from "./routes/order.route.js";

// Connect to DB handled by Prisma Client automatically
// import { connectDB } from "./lib/db.js";
// connectDB();
import prisma from "./lib/prisma.js";

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

// Debug and Health routes at the very top
app.get("/api/health", (req, res) => {
	res.status(200).json({ status: "ok", message: "Server is running", env: process.env.NODE_ENV });
});

app.get("/api/env-check", async (req, res) => {
	let dbStatus = "unknown";
	try {
		await prisma.$queryRaw`SELECT 1`;
		dbStatus = "connected";
	} catch (error) {
		dbStatus = "disconnected";
		console.error("Prisma connection error:", error);
		var dbError = error.message;
	}

	res.status(200).json({
		mongo_uri_set: false, // Legacy
		redis_url_set: !!process.env.UPSTASH_REDIS_URL,
		node_env: process.env.NODE_ENV,
		vercel: !!process.env.VERCEL,
		db_connection_status: dbStatus,
		db_error: dbError,
		database_url_set: !!process.env.DATABASE_URL
	});
});

app.get("/api/debug", (req, res) => {
	res.status(200).json({
		message: "API debug endpoint reached",
		vercel: !!process.env.VERCEL,
		node_env: process.env.NODE_ENV,
		timestamp: new Date().toISOString()
	});
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orders)
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

const clientDistPath = path.join(__dirname, "frontend", "dist");
const clientIndexPath = path.join(clientDistPath, "index.html");

if (process.env.NODE_ENV === "production" && fs.existsSync(clientIndexPath)) {
	app.use(express.static(clientDistPath));

	app.get("*", (req, res) => {
		res.sendFile(clientIndexPath);
	});
} else {
	app.get("/", (req, res) => {
		res.status(200).json({ message: "API server is running" });
	});

	if (process.env.NODE_ENV === "production") {
		console.warn("Frontend build not found. Run the frontend build to serve it from the backend.");
	}
}

if (process.env.VERCEL) {
	// connectDB already called at top
} else {
	app.listen(PORT, () => {
		console.log("Server is running on http://localhost:" + PORT);
	});
}

export default app;

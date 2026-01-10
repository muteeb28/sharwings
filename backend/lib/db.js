import mongoose from "mongoose";

export const connectDB = async () => {
	try {
		const uri = process.env.MONGO_URI;
		if (!uri) {
			console.error("MONGO_URI is not defined in environment variables");
			return;
		}
		// Masked URI for safe logging: mongodb+srv://user:***@cluster.abc.mongodb.net
		const maskedUri = uri.replace(/\/\/(.*):(.*)@/, "//***:***@");
		console.log(`Attempting to connect to MongoDB: ${maskedUri}`);

		const conn = await mongoose.connect(uri);
		console.log(`MongoDB connected: ${conn.connection.host}`);
	} catch (error) {
		console.error("Error connecting to MONGODB:", error.message);
	}
};
//can you see

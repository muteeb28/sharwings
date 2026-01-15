import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

const missingMessage =
    "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env.";

let razorpay;

if (keyId && keySecret) {
    razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
} else {
    // Lazy failure to avoid crashing the server on startup.
    razorpay = {
        orders: {
            create: () => {
                throw new Error(missingMessage);
            },
            fetch: () => {
                throw new Error(missingMessage);
            },
        },
    };
}

export default razorpay;

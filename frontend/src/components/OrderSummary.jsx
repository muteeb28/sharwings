import { motion } from "framer-motion";
import { useState } from "react";
import { useCartStore } from "../stores/useCartStore";
import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";
import toast from "react-hot-toast";
import { LoaderOne } from "./ui/loader";

const loadRazorpayScript = () =>
	new Promise((resolve, reject) => {
		if (window.Razorpay) {
			resolve(true);
			return;
		}

		const existingScript = document.getElementById("razorpay-checkout-js");
		if (existingScript) {
			existingScript.addEventListener("load", () => resolve(true));
			existingScript.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
			return;
		}

		const script = document.createElement("script");
		script.id = "razorpay-checkout-js";
		script.src = "https://checkout.razorpay.com/v1/checkout.js";
		script.async = true;
		script.onload = () => resolve(true);
		script.onerror = () => reject(new Error("Failed to load Razorpay"));
		document.body.appendChild(script);
	});

const OrderSummary = ({ paymentMode }) => {
	const { total, subtotal, coupon, isCouponApplied, cart } = useCartStore();
	const savings = subtotal - total;
	const formattedSubtotal = subtotal.toFixed(2);
	const formattedTotal = total.toFixed(2);
	const formattedSavings = savings.toFixed(2);
	const { user } = useUserStore();
	const [isProcessing, setIsProcessing] = useState(false);

	const handlePayment2 = async () => {
		try {
			if (isProcessing) return;
			if (!user) {
				toast.error("Please log in to continue.");
				return;
			}
			if (!user.address || !user.address.name) {
				toast.error("Please add a delivery address before checkout.");
				return;
			}
			if (!cart || cart.length === 0) {
				toast.error("Your cart is empty.");
				return;
			}

			setIsProcessing(true);
			let res = null;
			if (paymentMode === "cod") {
				res = await axios.post("/payments/cash-on-delivery", {
					products: cart,
					couponCode: coupon ? coupon.code : null,
				});
				alert("Order placed successfully with Cash on Delivery");
				window.location.href = "/orders";
				return;
			}
			else {
				try {
					await loadRazorpayScript();
				} catch (loadError) {
					toast.error(loadError.message || "Failed to load Razorpay");
					return;
				}
				res = await axios.post("/payments/create-checkout-session-razorpay", {
					products: cart,
					couponCode: coupon ? coupon.code : null,
				});
			}
	
			const { id, totalAmount, keyId } = res.data || {};
			const razorpayKey =
				keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

			if (!razorpayKey) {
				toast.error("Razorpay key is not configured.");
				return;
			}
	
			// Razorpay options
			const options = {
				key: razorpayKey,
				amount: totalAmount * 100, // Amount in paise
				currency: "INR",
				name: "Sharwings",
				description: "Purchase Description",
				order_id: id,
				handler: function (response) {
					window.location.href = `/purchase-success?payment_id=${response.razorpay_payment_id}&order_id=${response.razorpay_order_id}&token=${response.razorpay_signature}`;
				},
				prefill: {
					name: user?.name,
					email: user?.email,
				},
				theme: {
					color: "#3399cc",
				},
			};
	
			// Initialize Razorpay
			const razorpay = new window.Razorpay(options);
			razorpay.open();
	
			razorpay.on("payment.failed", function (response) {
				console.error("Payment failed:", response.error);
				alert("Payment failed. Please try again.");
			});
		} catch (error) {
			toast.error(
				error.response?.data?.error ||
					error.response?.data?.message ||
					"Error initiating payment"
			);
			console.error("Error initiating Razorpay payment:", error);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<motion.div
			className='space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
		>
			<p className='text-xl font-semibold text-emerald-400'>Order summary</p>

			<div className='space-y-4'>
				<div className='space-y-2'>
					<dl className='flex items-center justify-between gap-4'>
						<dt className='text-base font-normal text-gray-300'>Original price</dt>
						<dd className='text-base font-medium text-white'>₹{formattedSubtotal}</dd>
					</dl>

					{savings > 0 && (
						<dl className='flex items-center justify-between gap-4'>
							<dt className='text-base font-normal text-gray-300'>Savings</dt>
							<dd className='text-base font-medium text-emerald-400'>-₹{formattedSavings}</dd>
						</dl>
					)}

					{coupon && isCouponApplied && (
						<dl className='flex items-center justify-between gap-4'>
							<dt className='text-base font-normal text-gray-300'>Coupon ({coupon.code})</dt>
							<dd className='text-base font-medium text-emerald-400'>-{coupon.discountPercentage}%</dd>
						</dl>
					)}
					<dl className='flex items-center justify-between gap-4 border-t border-gray-600 pt-2'>
						<dt className='text-base font-bold text-white'>Total</dt>
						<dd className='text-base font-bold text-emerald-400'>₹{formattedTotal}</dd>
					</dl>
				</div>

				<motion.button
					className='flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-70'
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={handlePayment2}
					disabled={isProcessing}
				>
					{isProcessing ? (
						<div className="flex items-center gap-2">
							<LoaderOne />
							<span>Processing...</span>
						</div>
					) : (
						"Proceed to Checkout"
					)}
				</motion.button>

				<div className='flex items-center justify-center gap-2'>
					<span className='text-sm font-normal text-gray-400'>or</span>
					<Link
						to='/'
						className='inline-flex items-center gap-2 text-sm font-medium text-emerald-400 underline hover:text-emerald-300 hover:no-underline'
					>
						Continue Shopping
						<MoveRight size={16} />
					</Link>
				</div>
			</div>
		</motion.div>
	);
};
export default OrderSummary;

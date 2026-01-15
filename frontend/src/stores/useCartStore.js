import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
	cart: [],
	coupon: null,
	total: 0,
	subtotal: 0,
	isCouponApplied: false,
	loading: false,

	getMyCoupon: async () => {
		try {
			const response = await axios.get("/coupons");
			set({ coupon: response.data });
		} catch (error) {
			console.error("Error fetching coupon:", error);
		}
	},
	applyCoupon: async (code) => {
		try {
			const response = await axios.post("/coupons/validate", { code });
			set({ coupon: response.data, isCouponApplied: true });
			get().calculateTotals();
			toast.success("Coupon applied successfully");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to apply coupon");
		}
	},
	removeCoupon: () => {
		set({ coupon: null, isCouponApplied: false });
		get().calculateTotals();
		toast.success("Coupon removed");
	},

	getCartItems: async () => {
		try {
			set({ loading: true });
			const res = await axios.get("/cart");
			set({ cart: res.data });
			get().calculateTotals();
		} catch (error) {
			set({ cart: [] });
			toast.error(error?.response?.data?.message || "An error occurred");
		} finally {
			set({ loading: false });
		}
	},
	clearCart: async () => {
		set({ cart: [], coupon: null, total: 0, subtotal: 0 });
	},
	addToCart: async (product) => {
		try {
			await axios.post("/cart", { productId: product._id, quantity: product.quantity });
			toast.success("Product added to cart");

			set((prevState) => {
				const existingItem = prevState.cart.find((item) => item._id === product._id);
				const newCart = existingItem
					? prevState.cart.map((item) =>
							item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
					  )
					: [...prevState.cart, { ...product, quantity: 1 }];
				return { cart: newCart };
			});
			get().calculateTotals();
		} catch (error) {
			console.error("Error adding to cart:", error.response);
			toast.error(error.response?.data?.message || "An error occurred");
		}
	},
	removeFromCart: async (productId) => {
		await axios.delete(`/cart`, { data: { productId } });
		set((prevState) => ({ cart: prevState.cart.filter((item) => item._id !== productId) }));
		get().calculateTotals();
	},
	updateQuantity: async (productId, quantity) => {
		const previousCart = get().cart.map((item) => ({ ...item }));
		if (quantity === 0) {
			set((prevState) => ({
				cart: prevState.cart.filter((item) => item._id !== productId),
			}));
			get().calculateTotals();
			try {
				await axios.delete(`/cart`, { data: { productId } });
			} catch (error) {
				set({ cart: previousCart });
				get().calculateTotals();
				toast.error(error.response?.data?.message || "Failed to update cart");
			}
			return;
		}
		try {
			set((prevState) => ({
				cart: prevState.cart.map((item) =>
					item._id === productId ? { ...item, quantity } : item
				),
			}));
			get().calculateTotals();
			await axios.put(`/cart/${productId}`, { quantity });
		} catch (error) {
			const message = error.response?.data?.message || "Failed to update cart";
			set({ cart: previousCart });
			get().calculateTotals();
			toast.error(message);
		}
	},
	calculateTotals: () => {
		const { cart } = get();
		const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
		const discount = cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
		let total = discount;

		set({ subtotal, total });
	},
}));

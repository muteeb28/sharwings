import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

const getProductId = (product) => product?._id ?? product?.id;

const updateListItem = (list, updated) =>
	list.map((product) =>
		getProductId(product) === getProductId(updated) ? { ...product, ...updated } : product
	);

const removeListItem = (list, productId) =>
	list.filter((product) => getProductId(product) !== productId);

export const useProductStore = create((set) => ({
	featuredProducts: [],
	categoryProducts: [],
	allProducts: [],
	clearanceProducts: [],
	loading: false,
	loadingFeatured: false,
	loadingCategory: false,
	loadingAll: false,
	loadingClearance: false,
	error: null,

	setAllProducts: (allProducts) => set({ allProducts }),
	setCategoryProducts: (categoryProducts) => set({ categoryProducts }),
	setFeaturedProducts: (featuredProducts) => set({ featuredProducts }),
	setClearanceProducts: (clearanceProducts) => set({ clearanceProducts }),

	createProduct: async (productData) => {
		set({ loading: true });
		try {
			const res = await axios.post("/products", productData);
			set((prevState) => ({
				allProducts: [...prevState.allProducts, res.data],
				loading: false,
			}));
		} catch (error) {
			toast.error(error.response?.data?.error || "Failed to create product");
			set({ loading: false });
		}
	},

	fetchAllProducts: async () => {
		set({ loadingAll: true });
		try {
			const response = await axios.get("/products");
			set({ allProducts: response.data?.products || [], loadingAll: false, error: null });
		} catch (error) {
			set({ error: "Failed to fetch products", loadingAll: false, allProducts: [] });
			toast.error(error.response?.data?.error || "Failed to fetch products");
		}
	},

	fetchProductsByCategory: async (category) => {
		set({ loadingCategory: true, categoryProducts: [] });
		try {
			const response = await axios.get(`/products/category/${category}`);
			const products = response.data?.products;
			if (Array.isArray(products)) {
				set({ categoryProducts: products, loadingCategory: false, error: null });
				return;
			}
			set({
				categoryProducts: [],
				loadingCategory: false,
				error: "Unexpected response format",
			});
		} catch (error) {
			set({ error: "Failed to fetch products", loadingCategory: false, categoryProducts: [] });
			toast.error(error.response?.data?.error || "Failed to fetch products");
		}
	},

	deleteProduct: async (productId) => {
		set({ loading: true });
		try {
			await axios.delete(`/products/${productId}`);
			set((prevState) => ({
				allProducts: removeListItem(prevState.allProducts, productId),
				categoryProducts: removeListItem(prevState.categoryProducts, productId),
				clearanceProducts: removeListItem(prevState.clearanceProducts, productId),
				featuredProducts: removeListItem(prevState.featuredProducts, productId),
				loading: false,
			}));
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.error || "Failed to delete product");
		}
	},

	toggleFeaturedProduct: async (productId) => {
		set({ loading: true });
		try {
			const response = await axios.patch(`/products/${productId}`);
			const updated = response.data;
			const updatedId = getProductId(updated);

			set((prevState) => {
				const updatedAll = updateListItem(prevState.allProducts, updated);
				const updatedCategory = updateListItem(prevState.categoryProducts, updated);
				const updatedClearance = updateListItem(prevState.clearanceProducts, updated);

				let updatedFeatured = updateListItem(prevState.featuredProducts, updated);
				const featuredExists = updatedFeatured.some(
					(product) => getProductId(product) === updatedId
				);

				if (updated.isFeatured) {
					updatedFeatured = featuredExists ? updatedFeatured : [updated, ...updatedFeatured];
				} else if (featuredExists) {
					updatedFeatured = updatedFeatured.filter(
						(product) => getProductId(product) !== updatedId
					);
				}

				return {
					allProducts: updatedAll,
					categoryProducts: updatedCategory,
					clearanceProducts: updatedClearance,
					featuredProducts: updatedFeatured,
					loading: false,
				};
			});
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.error || "Failed to update product");
		}
	},

	fetchFeaturedProducts: async () => {
		set({ loadingFeatured: true });
		try {
			const response = await axios.get("/products/featured");
			const data = response.data;
			if (Array.isArray(data)) {
				set({ featuredProducts: data, loadingFeatured: false, error: null });
			} else {
				console.warn("Expected an array but got:", data);
				set({
					featuredProducts: [],
					error: "Unexpected response format",
					loadingFeatured: false,
				});
			}
		} catch (error) {
			set({ error: "Failed to fetch products", loadingFeatured: false });
			console.log("Error fetching featured products:", error);
		}
	},

	editProductDetails: async (productId, updatedData) => {
		set({ loading: true });
		try {
			const response = await axios.post(`/products/id/${productId}`, updatedData);
			const updated = response.data;
			set((prevState) => ({
				allProducts: updateListItem(prevState.allProducts, updated),
				categoryProducts: updateListItem(prevState.categoryProducts, updated),
				clearanceProducts: updateListItem(prevState.clearanceProducts, updated),
				featuredProducts: updateListItem(prevState.featuredProducts, updated),
				loading: false,
			}));
			toast.success("Product updated successfully");
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.error || "Failed to update product");
		}
	},

	fetchClearanceSaleProducts: async () => {
		set({ loadingClearance: true });
		try {
			const response = await axios.get("/products/clearance-sale");
			set({
				clearanceProducts: response?.data?.products || [],
				loadingClearance: false,
				error: null,
			});
		} catch (error) {
			set({
				error: "Failed to fetch clearance sale products",
				loadingClearance: false,
				clearanceProducts: [],
			});
		}
	},
}));

import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

const AUTH_HINT_KEY = "authHint";

const setAuthHint = (value) => {
	try {
		if (value) {
			localStorage.setItem(AUTH_HINT_KEY, "1");
		} else {
			localStorage.removeItem(AUTH_HINT_KEY);
		}
	} catch {
		// Ignore storage failures (private mode, blocked storage, etc.).
	}
};

const hasAuthHint = () => {
	try {
		return localStorage.getItem(AUTH_HINT_KEY) === "1";
	} catch {
		return false;
	}
};

export const useUserStore = create((set, get) => ({
	user: null,
	loading: false,
	checkingAuth: true,

	signup: async ({ name, email, password, confirmPassword }) => {
		set({ loading: true });

		if (password !== confirmPassword) {
			set({ loading: false });
			return toast.error("Passwords do not match");
		}

		try {
			const res = await axios.post("/auth/signup", { name, email, password });
			setAuthHint(true);
			set({ user: res.data, loading: false });
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "An error occurred");
		}
	},
	login: async (email, password) => {
		set({ loading: true });

		try {
			const res = await axios.post("/auth/login", { email, password });

			setAuthHint(true);
			set({ user: res.data, loading: false });
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "An error occurred");
		}
	},

	logout: async () => {
		try {
			await axios.post("/auth/logout");
			setAuthHint(false);
			set({ user: null });
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred during logout");
		}
	},

	checkAuth: async () => {
		if (!hasAuthHint()) {
			set({ checkingAuth: false, user: null });
			return;
		}
		set({ checkingAuth: true });
		try {
			const response = await axios.get("/auth/profile");
			setAuthHint(true);
			set({ user: response.data, checkingAuth: false });
		} catch (error) {
			const status = error.response?.status;
			if (status === 401) {
				setAuthHint(false);
			} else if (status) {
				console.log(error.message);
			}
			set({ checkingAuth: false, user: null });
		}
	},

	refreshToken: async () => {
		// Prevent multiple simultaneous refresh attempts
		if (get().checkingAuth) return;

		set({ checkingAuth: true });
		try {
			const response = await axios.post("/auth/refresh-token");
			setAuthHint(true);
			set({ checkingAuth: false });
			return response.data;
		} catch (error) {
			setAuthHint(false);
			set({ user: null, checkingAuth: false });
			throw error;
		}
	},

	addBillingAddress: async (form) => {
		set({ loading: true });
		try {
			const res = await axios.post("/cart/billing-address", form);
			set((state) => ({
				user: { ...state.user, address: form },
				loading: false,
			}));
			toast.success("address updated successfully!")
			return;
		} catch (error) {
			set({ loading: false });
			toast.error(error?.response?.data?.message || 'some unexpected error occured. Try again later!')
			return;
		}
	},
}));

// TODO: Implement the axios interceptors for refreshing access token

// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// If a refresh is already in progress, wait for it to complete
				if (refreshPromise) {
					await refreshPromise;
					return axios(originalRequest);
				}

				// Start a new refresh process
				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;

				return axios(originalRequest);
			} catch (refreshError) {
				// If refresh fails, redirect to login or handle as needed
				useUserStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	}
);

import axios from "axios";

const normalizeIds = (value, seen = new WeakSet()) => {
	if (!value || typeof value !== "object") {
		return value;
	}

	if (seen.has(value)) {
		return value;
	}
	seen.add(value);

	if (Array.isArray(value)) {
		value.forEach((item) => normalizeIds(item, seen));
		return value;
	}

	if (value.id !== undefined && value._id === undefined) {
		value._id = value.id;
	}

	Object.keys(value).forEach((key) => normalizeIds(value[key], seen));
	return value;
};

const axiosInstance = axios.create({
	baseURL: import.meta.VITE_BACKEND_URL,
	withCredentials: true, // send cookies to the server
});

axiosInstance.interceptors.response.use(
	(response) => {
		normalizeIds(response.data);
		return response;
	},
	(error) => Promise.reject(error)
);

export default axiosInstance;

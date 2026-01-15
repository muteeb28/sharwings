const CLOUDINARY_HOST = "res.cloudinary.com";

const isCloudinaryUrl = (url) => {
	if (!url || typeof url !== "string") return false;
	if (url.startsWith("data:") || url.startsWith("blob:")) return false;
	try {
		const parsed = new URL(url);
		return parsed.hostname.includes(CLOUDINARY_HOST) && url.includes("/upload/");
	} catch {
		return false;
	}
};

export const getOptimizedImageUrl = (url, options = {}) => {
	if (!isCloudinaryUrl(url)) return url;

	const { width, height, quality = "auto", format = "auto", crop = "limit" } = options;
	const [prefix, rest] = url.split("/upload/");
	if (!rest) return url;

	const transforms = [];
	if (format) transforms.push(`f_${format}`);
	if (quality) transforms.push(`q_${quality}`);
	transforms.push(`c_${crop}`);
	if (width) transforms.push(`w_${width}`);
	if (height) transforms.push(`h_${height}`);

	return `${prefix}/upload/${transforms.join(",")}/${rest}`;
};

export const getOptimizedSrcSet = (url, widths = [320, 480, 640, 960]) => {
	if (!isCloudinaryUrl(url)) return undefined;
	return widths
		.map((width) => `${getOptimizedImageUrl(url, { width })} ${width}w`)
		.join(", ");
};

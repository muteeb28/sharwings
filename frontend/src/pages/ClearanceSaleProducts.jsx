import { useEffect } from "react";
import { useProductStore } from "../stores/useProductStore";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard";

export const ClearanceSaleProducts = () => {
	const { fetchClearanceSaleProducts, clearanceProducts, loadingClearance } = useProductStore();

	useEffect(() => {
		fetchClearanceSaleProducts();
	}, []);
	return (
		<div className='min-h-screen'>
			<div className='relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
				<motion.div
					className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.2 }}
				>
					{loadingClearance ? (
						<div className='col-span-full text-center text-3xl font-semibold text-gray-300'>
							Loading products...
						</div>
					) : clearanceProducts?.length === 0 ? (
						<div className="col-span-full">
							<div className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 rounded-xl shadow-lg p-8 flex flex-col items-center justify-center">
							<h2 className="text-3xl font-bold text-white mb-2">
								No products found!
							</h2>
							<p className="text-lg text-white mb-4">
								You need to <span className="font-semibold underline">login</span> to see exclusive clearance deals.
							</p>
							<ul className="text-white text-base mb-6 space-y-2">
								<li>✨ Unlock special discounts only for members</li>
								<li>🚚 Get free shipping on your first order</li>
								<li>🎁 Early access to flash sales & new arrivals</li>
								<li>💬 Priority support for all your queries</li>
							</ul>
							<a
								href="/signup"
								className="bg-white text-emerald-600 font-bold px-6 py-2 rounded-full shadow hover:bg-emerald-100 transition"
							>
								Sign Up Now
							</a>
							</div>
						</div>
					) : (
						clearanceProducts?.map((product) => (
							<ProductCard key={product._id} product={product} />
						))
					)}
				</motion.div>
			</div>
		</div>
	);
};

import { motion } from "framer-motion";
import { Trash, Star, EllipsisVertical } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { getOptimizedImageUrl } from "../lib/imageUtils";
import { useState } from "react";
import EditProductModal from "../components/EditProductForm";

const ProductsList = () => {
	const { deleteProduct, toggleFeaturedProduct, allProducts, editProductDetails } = useProductStore();
	const [openMenuId, setOpenMenuId] = useState(null);


    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState(null);

    const openEditModal = (product) => {
        setEditProduct(product);
        setIsModalOpen(true);
        setOpenMenuId(null);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditProduct(null);
    };

    const handleSave = async (updatedProduct) => {
		try {
			console.log(updatedProduct)
			await editProductDetails(updatedProduct.id, updatedProduct);
		} catch {
			console.log("error creating a product");
		}
        closeModal();
    };

	return (
		<motion.div
			className='bg-gray-800 shadow-lg rounded-lg overflow-x-scroll max-w-7xl mx-auto'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.8 }}
		>
			<table className='divide-y divide-gray-700'>
				<thead className='bg-gray-700'>
					<tr>
						<th
							scope='col'
							className='px-6 py-3 w-2/3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
						>
							Product
						</th>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
						>
							Price
						</th>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
						>
							Sale Price
						</th>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
						>
							Quantity
						</th>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
						>
							Category
						</th>

						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
						>
							Featured
						</th>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
						>
							Actions
						</th>
					</tr>
				</thead>

				<tbody className='bg-gray-800 divide-y divide-gray-700'>
					{allProducts?.map((product) => (
						<tr key={product._id} className='hover:bg-gray-700'>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='flex items-center'>
									<div className='flex-shrink-0 h-10 w-10'>
										<img
											className='h-10 w-10 rounded-full object-cover'
											src={getOptimizedImageUrl(product.image, { width: 80 })}
											alt={product.name}
											loading="lazy"
											decoding="async"
										/>
									</div>
									<div className='ml-4'>
										<div className='text-sm font-medium text-white max-w-xl text-wrap'>{product.name}</div>
									</div>
								</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='text-sm text-gray-300'>₹{product.price.toFixed(2)}</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='text-sm text-gray-300'>₹{product.salePrice?.toFixed(2)}</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='text-sm text-gray-300'>{product.quantity} Units</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='text-sm text-gray-300'>{product.category}</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<button
									onClick={() => toggleFeaturedProduct(product._id)}
									className={`p-1 rounded-full ${product.isFeatured ? "bg-yellow-400 text-gray-900" : "bg-gray-600 text-gray-300"
										} hover:bg-yellow-500 transition-colors duration-200`}
								>
									<Star className='h-5 w-5' />
								</button>
							</td>
							<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
								<button
									onClick={() => deleteProduct(product._id)}
									className='text-red-400 hover:text-red-300'
								>
									<Trash className='h-5 w-5' />
								</button>
								<div
									onMouseEnter={() => setOpenMenuId(product._id)}
									onMouseLeave={() => setOpenMenuId(null)}
									className="inline-block relative"
								>
									<button
										data-pid={product._id}
										className='text-red-400 hover:text-red-300 relative'
										style={{ position: "relative" }}
									>
										<EllipsisVertical className='h-5 w-5' color="#ffffff" />
									</button>
									{openMenuId === product._id && (
										<div
											className="absolute right-0 -top-[1px] mt-2 w-40 bg-gray-900 border border-gray-700 rounded shadow-lg z-50"
											style={{ zIndex: 9999 }}
										>
											<ul>
												<li onClick={() => openEditModal(product)}className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-white">
													edit product
												</li>
											</ul>
										</div>
									)}
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>

           <EditProductModal
                isOpen={isModalOpen}
                product={editProduct}
                onClose={closeModal}
                onSave={handleSave}
            />
		</motion.div>
	);
};
export default ProductsList;

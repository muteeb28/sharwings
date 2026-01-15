import toast from "react-hot-toast";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { motion } from "framer-motion";
import { useState } from "react";
import { getOptimizedImageUrl, getOptimizedSrcSet } from "../lib/imageUtils";

const ProductCard = ({ product }) => {
  const { user } = useUserStore();
  const { addToCart } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please login to add products to cart", { id: "login" });
      return;
    }
    addToCart({ ...product, quantity });
  };

  const handleDecrement = () => {
    setQuantity((q) => (q > 1 ? q - 1 : 1));
  };

  const handleIncrement = () => {
    setQuantity((q) => q + 1);
  };

  const imageUrl = getOptimizedImageUrl(product.image, { width: 640 });
  const imageSrcSet = getOptimizedSrcSet(product.image, [320, 480, 640, 800]);
  const priceValue = Number(product.price);
  const saleValue = Number(product.salePrice);
  const savings =
    Number.isFinite(priceValue) && Number.isFinite(saleValue)
      ? Math.max(0, priceValue - saleValue)
      : null;

  return (
    <motion.div
      whileHover={{
        scale: 1.03,
        boxShadow: "0 8px 32px 0 rgba(16,185,129,0.18)",
        y: -4,
      }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="flex w-full flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 shadow-lg hover:border-emerald-500 transition-all duration-200"
    >
      <a
        href={`/${product.name}`}
        className="relative mx-3 mt-3 flex h-56 overflow-hidden rounded-xl bg-gray-900"
      >
        <img
          className="object-contain w-full h-full transition-transform duration-300 hover:scale-105"
          src={imageUrl}
          srcSet={imageSrcSet}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          alt={product.name}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black bg-opacity-20" />
      </a>

      <div className="flex flex-col flex-1 justify-between px-5 py-5">
        <h5 className="text-lg font-semibold tracking-tight text-white mb-2 line-clamp-2">
          {product.name}
        </h5>
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-emerald-400">
              ₹{product.salePrice}
            </span>
            {product.price && (
              <span className="text-gray-400 line-through text-base ml-1">
                ₹{product.price}
              </span>
            )}
          </div>
          {product.salePrice && product.price && savings !== null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/90 text-emerald-900 font-bold text-xs shadow animate-pulse mt-1 w-fit">
              <svg width="16" height="16" fill="none" viewBox="0 0 20 20">
                <path
                  d="M10 1l2.39 4.84L18 7.27l-3.91 3.81L14.78 17 10 14.27 5.22 17l.69-5.92L2 7.27l5.61-.43L10 1z"
                  fill="#fbbf24"
                />
              </svg>
              Save ₹{savings.toFixed(2)}!
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-auto">
          {/* Quantity Selector */}
          <div className="flex items-center border border-gray-700 rounded-md bg-gray-800">
            <button
              className="p-1 px-2 text-gray-300 hover:text-emerald-400"
              onClick={handleDecrement}
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span className="px-2 w-6 text-center text-white select-none">
              {quantity}
            </span>
            <button
              className="p-1 px-2 text-gray-300 hover:text-emerald-400"
              onClick={handleIncrement}
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>
          <motion.button
            whileHover={{
              scale: 1.08,
              backgroundColor: "rgb(16,185,129)",
              boxShadow: "0 4px 16px 0 rgba(16,185,129,0.18)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 w-full mt-auto"
            onClick={handleAddToCart}
          >
            <ShoppingCart size={22} className="mr-2" />
            Add to cart
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
export default ProductCard;

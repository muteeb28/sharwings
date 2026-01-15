import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShoppingCart, Tag } from "lucide-react";
import axiosInstance from "../lib/axios";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import { toast } from "react-hot-toast";
import { getOptimizedImageUrl, getOptimizedSrcSet } from "../lib/imageUtils";

export default function Pdp() {
  const { name } = useParams();
  const { addToCart } = useCartStore();
  const { user } = useUserStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
    const handleAddToCart = () => {
        if (!user) {
            toast.error("Please login to add products to cart", { id: "login" });
            return;
        } else {
            // add to cart
            product.quantity = 1;
            addToCart(product);
        }
    };

  useEffect(() => {
    // Fetch product details by id
    async function fetchProduct() {
      try {
        setLoading(true);
        setLoadError("");
        const res = await axiosInstance.get(`/products/${name}`);
        setProduct(res.data.product);
      } catch (error) {
        setProduct(null);
        setLoadError(error.response?.data?.message || "Failed to load product.");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [name]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-600 text-xl">
        Loading product...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-600 text-xl">
        {loadError}
      </div>
    );
  }

  const imageUrl = getOptimizedImageUrl(product.image || "/placeholder.png", { width: 800 });
  const imageSrcSet = getOptimizedSrcSet(product.image || "/placeholder.png", [480, 640, 800, 960]);

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-emerald-50 via-white to-emerald-100 py-10 px-4 flex flex-col md:flex-row gap-10 md:gap-16 items-start justify-center">
      {/* Image Section (Sticky) */}
      <div className="w-full md:w-[40%] flex justify-center items-start">
        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-center w-full max-w-md md:sticky md:top-28">
          <img
            src={imageUrl}
            srcSet={imageSrcSet}
            sizes="(min-width: 1024px) 40vw, 100vw"
            alt={product.name}
            className="rounded-lg max-h-[400px] object-contain w-full"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
      {/* Details Section (Scrollable) */}
      <div
        className="w-full md:w-[50%] flex flex-col gap-6 bg-white rounded-2xl shadow-xl p-8 border border-emerald-100"
        style={{
          maxHeight: "calc(100vh - 100px)",
          overflowY: "auto",
        }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-emerald-700 mb-2">{product.name}</h1>
        <div className="flex items-center gap-3 mb-2">
          <Tag className="text-emerald-500" size={20} />
          <span className="text-base font-medium text-gray-600">{product.category}</span>
        </div>
        <div className="flex items-end gap-4 mb-2">
          <span className="text-3xl font-bold text-gray-900">
            ₹{product.salePrice ?? product.price}
          </span>
          {product.salePrice && product.salePrice < product.price && (
            <>
              <span className="text-xl line-through text-gray-400">
                ₹{product.price}
              </span>
              <span className="ml-2 px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs font-semibold">
                {Math.round(
                  ((product.price - product.salePrice) / product.price) * 100
                )}
                % OFF
              </span>
            </>
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Description</h2>
          <p className="text-gray-700 text-base">{product.description}</p>
        </div>
        <button
          className="mt-6 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-lg shadow transition text-lg"
          onClick={handleAddToCart}
        >
          <ShoppingCart size={24} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}

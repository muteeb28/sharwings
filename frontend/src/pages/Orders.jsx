// ...existing code...
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "../lib/axios";
import { motion } from "framer-motion";
import { ChevronRight, Calendar } from "lucide-react";
import { getOptimizedImageUrl } from "../lib/imageUtils";
import ReturnModal from "../components/OrderReturnForm";
import OrderReturnProgressBar from "../components/OrderReturnProgressBar";
import OrderStatus from "../components/OrderStatus";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [showReturn, setShowReturn] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const setModal = (e) => {
    setSelectedOrder(e?.target?.dataset?.orderid || null);
    setShowReturn((prev) => !prev);
  };

  useEffect(() => {
    const getOrderHistory = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/orders/history");
        if (res.data.success) {
          setOrders(res.data.orders);
        } else {
          setOrders([]);
        }
      } catch {
        toast.error("Failed to fetch order history. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    getOrderHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading orders…</div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-white py-10 px-4 md:px-12 lg:px-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-emerald-700">My Orders</h1>
          <div className="flex items-center text-sm text-gray-500 gap-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-white border p-8 flex flex-col items-center text-center gap-4">
            <h2 className="text-2xl font-semibold text-gray-800">No orders yet</h2>
            <p className="text-gray-500 max-w-xl">
              Your order history will appear here. Start shopping to place your first order — exclusive offers and fast delivery await.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-full shadow hover:bg-emerald-700 transition"
            >
              Shop Now <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-b from-white to-gray-50 border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="p-5 md:p-6 lg:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-500">Order ID</div>
                          <div className="font-semibold text-gray-800 break-all">{order._id}</div>
                          <div className="text-sm text-gray-400 mt-1">Placed on {order.createdAt?.split("T")[0]}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="hidden md:block">
                            <OrderStatus status={order.status} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          {order.products.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-4 bg-white/30 p-3 rounded-lg">
                              <img
                                src={getOptimizedImageUrl(item.product?.image, { width: 240 })}
                                alt={item.product?.name}
                                className="w-20 h-20 rounded-md object-cover flex-shrink-0"
                                loading="lazy"
                                decoding="async"
                              />
                              <div className="flex-1">
                                <div className="text-gray-800 font-semibold">{item.product?.name}</div>
                                <div className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</div>
                                <div className="text-emerald-600 font-bold mt-2">₹{item.price}</div>
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                <button
                                  data-orderid={order._id}
                                  onClick={setModal}
                                  className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                                >
                                  Return
                                </button>
                                <button className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition">
                                  Help
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <aside className="bg-white/40 rounded-lg p-4 flex flex-col justify-between h-full">
                          <div>
                            <div className="text-sm text-gray-500">Shipping to</div>
                            {order.address ? (
                              <div className="text-gray-800 mt-1 text-sm">
                                {order.address.name}
                                <div className="mt-1 text-gray-500 text-sm">
                                  {order.address.street}, {order.address.city}, {order.address.state} - {order.address.zip}
                                </div>
                                <div className="mt-1 text-gray-500 text-sm">{order.address.phone}</div>
                              </div>
                            ) : (
                              <div className="text-sm text-red-600 font-semibold mt-1">No address provided</div>
                            )}

                            <div className="mt-4 text-sm text-gray-500">Payment</div>
                            <div className="mt-1 text-gray-800 font-medium">{order.paymentMode || "N/A"}</div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-500">Order Total</div>
                              <div className="text-lg font-bold text-gray-900">₹{order.totalAmount}</div>
                            </div>
                            <div className="mt-3 text-xs text-gray-400">Track your order in the Orders section.</div>
                          </div>
                        </aside>
                      </div>
                    </div>

                    {/* small screen status and action */}
                    <div className="mt-4 lg:hidden">
                      <OrderStatus status={order.status} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ReturnModal open={showReturn} onClose={setModal} selectedOrder={selectedOrder} />
    </div>
  );
}
// ...existing code...

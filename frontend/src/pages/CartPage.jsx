import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import CartItem from "../components/CartItem";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import OrderSummary from "../components/OrderSummary";
import CartPageSkeleton from "../components/CartPageSkeleton";
import { Pencil } from "lucide-react";
import { useState } from "react";
import AddAddressModal from "../components/AddAddressModal";
import { useUserStore } from "../stores/useUserStore";

const CartPage = () => {
  const { cart, loading } = useCartStore();
  const { user, addBillingAddress } = useUserStore();
  const [showModal, setShowModal] = useState(false);
  const [loader,setLoader] = useState(false);
  const [paymentMode, setPaymentMode] = useState("");
  const [form, setForm] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoader(true);
    await addBillingAddress(form);
    setShowModal(false);
    setLoader(false);
  };

  return (
    <div className="py-8 md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        {loading ? (
          <motion.div
            className="mx-auto w-full flex-none lg:max-w-2xl xl:max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <CartPageSkeleton />
          </motion.div>
        ) : (
          <div className="mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8">
            <motion.div
              className="mx-auto w-full flex-none lg:max-w-2xl xl:max-w-4xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {cart?.length === 0 ? (
                <EmptyCartUI />
              ) : (
                <div className="space-y-6">
                  <>
                    {/* Address Container */}
                    <div className="mb-6 flex items-center justify-between w-full mx-auto bg-white dark:bg-gray-900 rounded-lg shadow p-4 border border-emerald-200">
                      <div>
                        {user?.address ? (
                          <div>
                            <div className="text-lg font-semibold text-emerald-700">
                              Delivery Address
                            </div>
                            <div className="text-gray-800 dark:text-gray-200 mt-1">
                              {user?.address?.name}, {user?.address?.street}, {user?.address.city},{" "}
                              {user?.address?.state} - {user?.address?.zip}
                              <br />
                              {user?.address?.phone}
                            </div>
                          </div>
                        ) : (
                          <div className="text-red-600 font-semibold">
                            Please add address
                          </div>
                        )}
                      </div>
                      <button
                        className={`ml-4 p-2 rounded-full transition ${
                          user?.address
                            ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-700"
                            : "bg-red-100 hover:bg-red-200 text-red-600"
                        }`}
                        onClick={()=>setShowModal(true)}
                      >
                        <Pencil size={20} />
                      </button>
                    </div>
                                {/* Payment Mode */}
                    <div className="mb-6 w-full mx-auto bg-white dark:bg-gray-900 rounded-lg shadow p-4 border border-emerald-200 flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="cod"
                        name="paymentMode"
                        checked={paymentMode === "cod"}
                        onChange={() => setPaymentMode(paymentMode === "cod" ? "" : "cod")}
                        className="accent-emerald-600 w-5 h-5"
                      />
                        <label htmlFor="cod" className="text-emerald-700 font-semibold text-base cursor-pointer">
                          Cash on Delivery (COD)
                        </label>
                      </div>
                      <div className="ml-8 text-gray-500 text-sm">
                        <span className="font-medium text-emerald-600">Info:</span> Pay with cash when your order is delivered to your doorstep. No advance payment required.
                      </div>
                    </div>
                    {cart?.map((item) => (
                      <CartItem key={item._id} item={item} />
                    ))}
                  </>
                </div>
              )}
              {cart?.length > 0 && <PeopleAlsoBought />}
            </motion.div>

            {cart?.length > 0 && (
              <motion.div
                className="mx-auto mt-6 max-w-4xl flex-1 space-y-6 lg:mt-0 lg:w-full"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <OrderSummary paymentMode={paymentMode} />
                {/* <GiftCouponCard /> */}
              </motion.div>
            )}
          </div>
        )}
      </div>
        <AddAddressModal showModal={showModal} setShowModal={setShowModal} form={form} handleChange={handleChange} handleSave={handleSave} loading={loader} />
    </div>
  );
};
export default CartPage;

const EmptyCartUI = () => (
  <motion.div
    className="flex flex-col items-center justify-center space-y-4 py-16"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <ShoppingCart className="h-24 w-24 text-gray-300" />
    <h3 className="text-2xl font-semibold ">Your cart is empty</h3>
    <p className="text-gray-400">
      Looks like you {"haven't"} added anything to your cart yet.
    </p>
    <Link
      className="mt-4 rounded-md bg-emerald-500 px-6 py-2 text-white transition-colors hover:bg-emerald-600"
      to="/"
    >
      Start Shopping
    </Link>
  </motion.div>
);

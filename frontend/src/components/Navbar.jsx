import { ShoppingCart, UserPlus, LogIn, LogOut, Lock, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { getOptimizedImageUrl } from "../lib/imageUtils";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useState, useRef } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AccountsDropDown from "./AccountsDropDown";
import axiosInstance from "../lib/axios";

const Navbar = () => {
  const { user, logout } = useUserStore();
  const isAdmin = user?.role === "admin";
  const { cart } = useCartStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef();

    // Debounced search (simple version)
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value.trim().length === 0) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    try {
      // Replace with your actual API endpoint
      const res = await axiosInstance.get(`/products/search?name=${encodeURIComponent(value)}`);
      setResults(res.data.products || []);
      setShowDropdown(true);
    } catch {
      setResults([]);
      setShowDropdown(false);
    }
  };

  // Hide dropdown when clicking outside
  const handleBlur = (e) => {
    setTimeout(() => setShowDropdown(false), 120);
  };

  const handleToggle = () => setMobileOpen((prev) => !prev);
  const handleClose = () => setMobileOpen(false);

  return (
<header className="fixed top-0 left-0 w-full bg-gray-900 bg-opacity-90 backdrop-blur-md shadow-lg z-40 transition-all duration-300 border-b border-emerald-800">
  <div className="container mx-auto px-4 py-3">
    {/* Desktop (lg and up): original layout */}
    <div className="hidden lg:flex flex-wrap justify-between items-center">
      <Link
        to="/"
        className="text-2xl font-bold text-emerald-400 items-center space-x-2 flex"
      >
        Sharwings
      </Link>
      {/* Search Bar */}
      <div className="relative flex-1 mx-4 max-w-lg">
        <div className="flex items-center bg-gray-800 rounded-lg px-3 py-2 shadow focus-within:ring-2 ring-emerald-400">
          <Search className="text-emerald-400 mr-2" size={20} />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={handleSearch}
            onFocus={() => setShowDropdown(true)}
            onBlur={handleBlur}
            placeholder="Search products..."
            className="bg-transparent outline-none text-white w-full placeholder-gray-400"
          />
        </div>
        {/* Dropdown Results */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 right-0 mt-2 bg-gray-900 border border-emerald-700 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto"
            >
              {search && results.length === 0 ? (
                <div className="px-4 py-3 text-gray-400">
                  No products found.
                </div>
              ) : (
                <ul>
                  {results.map((product) => (
                    <li key={product._id}>
                      <Link
                        to={`/${product.name}`}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-emerald-900 transition text-white"
                        onClick={() => {
                          setShowDropdown(false);
                          setSearch("");
                        }}
                      >
                        {product.image ? (
                          <img
                            src={getOptimizedImageUrl(product.image, { width: 80 })}
                            alt={product.name}
                            className="w-8 h-8 rounded object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <Search size={28} className="text-emerald-400" />
                        )}
                        <span className="font-medium">{product.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <nav className="flex flex-wrap items-center gap-4">
        <Link
          to={"/"}
          className="text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out"
        >
          Home
        </Link>
        <Link
          to={"/aboutus"}
          className="text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out"
        >
          About us
        </Link>
        {user && (
          <Link
            to={"/cart"}
            className="relative group text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out"
          >
            <ShoppingCart
              className="inline-block mr-1 group-hover:text-emerald-400"
              size={20}
            />
            <span className="hidden sm:inline">Cart</span>
            {cart?.length > 0 && (
              <span
                className="absolute -top-2 -left-2 bg-emerald-500 text-white rounded-full px-2 py-0.5 text-xs group-hover:bg-emerald-400 transition duration-300 ease-in-out"
              >
                {cart?.length}
              </span>
            )}
          </Link>
        )}
        {isAdmin && (
          <Link
            className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded-md font-medium transition duration-300 ease-in-out flex items-center"
            to={"/secret-dashboard"}
          >
            <Lock className="inline-block mr-1" size={18} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        )}

        {user ? (
          <AccountsDropDown />
        ) : (
          <>
            <Link
              to={"/signup"}
              className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out"
            >
              <UserPlus className="mr-2" size={18} />
              Sign Up
            </Link>
            <Link
              to={"/login"}
              className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out"
            >
              <LogIn className="mr-2" size={18} />
              Login
            </Link>
          </>
        )}
      </nav>
    </div>
    {/* Mobile (below lg): hamburger | Sharwings | cart, then search full width */}
    <div className="flex flex-col gap-2 lg:hidden">
      <div className="flex items-center justify-between w-full">
        <button
          className="text-emerald-400 focus:outline-none"
          onClick={handleToggle}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
        <Link
          to="/"
          className="text-xl font-bold text-emerald-400 flex-1 text-center"
          style={{ letterSpacing: "1px" }}
        >
          Sharwings
        </Link>
        <Link
          to={"/cart"}
          onClick={handleClose}
          className="relative group text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out"
        >
          <ShoppingCart size={26} />
          {cart?.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full px-2 py-0.5 text-xs group-hover:bg-emerald-400 transition duration-300 ease-in-out">
              {cart?.length}
            </span>
          )}
        </Link>
      </div>
      {/* Search Bar Full Width */}
      <div className="relative w-full mt-2">
        <div className="flex items-center bg-gray-800 rounded-lg px-3 py-2 shadow focus-within:ring-2 ring-emerald-400">
          <Search className="text-emerald-400 mr-2" size={20} />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={handleSearch}
            onFocus={() => setShowDropdown(true)}
            onBlur={handleBlur}
            placeholder="Search products..."
            className="bg-transparent outline-none text-white w-full placeholder-gray-400"
          />
        </div>
        {/* Dropdown Results */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 right-0 mt-2 bg-gray-900 border border-emerald-700 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto"
            >
              {search && results.length === 0 ? (
                <div className="px-4 py-3 text-gray-400">
                  No products found.
                </div>
              ) : (
                <ul>
                  {results.map((product) => (
                    <li key={product._id}>
                      <Link
                        to={`/${product.name}`}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-emerald-900 transition text-white"
                        onClick={() => {
                          setShowDropdown(false);
                          setSearch("");
                        }}
                      >
                        {product.image ? (
                          <img
                            src={getOptimizedImageUrl(product.image, { width: 80 })}
                            alt={product.name}
                            className="w-8 h-8 rounded object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <Search size={28} className="text-emerald-400" />
                        )}
                        <span className="font-medium">{product.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    {/* Mobile Nav */}
    <AnimatePresence>
      {mobileOpen && (
        <motion.nav
          key="mobile-nav"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.25 }}
          className="sm:hidden mt-4 flex flex-col gap-3 bg-gray-900 bg-opacity-95 rounded-lg p-4 shadow-lg border border-emerald-800"
        >
            <Link
              to={"/"}
              onClick={handleClose}
              className="text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out"
            >
              Home
            </Link>
              <Link
              to={"/aboutus"}
              onClick={handleClose}
              className="text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out"
            >
              About us
            </Link>
            <Link
              to={"/warrantyclaim"}
              onClick={handleClose}
              className="text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out"
            >
              Claim warranty
            </Link>
            <Link
              to={"/orders"}
              onClick={handleClose}
              className="text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out"
            >
             Order history
            </Link>
            {isAdmin && (
              <Link
                className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded-md font-medium transition duration-300 ease-in-out flex items-center"
                to={"/secret-dashboard"}
                onClick={handleClose}
              >
                <Lock className="inline-block mr-1" size={18} />
                Dashboard
              </Link>
            )}
            {user ? (
              <button
                className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out"
                onClick={() => {
                  logout();
                  handleClose();
                }}
              >
                <LogOut size={18} />
                <span className="ml-2">Log Out</span>
              </button>
            ) : (
              <>
                <Link
                  to={"/signup"}
                  onClick={handleClose}
                  className="bg-emerald-600 w-fit hover:bg-emerald-700 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out"
                >
                  <UserPlus className="mr-2" size={18} />
                  Sign Up
                </Link>
                <Link
                  to={"/login"}
                  onClick={handleClose}
                  className="bg-gray-700 w-1/3 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out"
                >
                  <LogIn className="mr-2" size={18} />
                  Login
                </Link>
              </>
            )}
        </motion.nav>
      )}
    </AnimatePresence>
  </div>
</header>
  );
};
export default Navbar;

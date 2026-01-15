import { Navigate, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import CategoryPage from "./pages/CategoryPage";
import AboutUs from "./pages/AboutUs";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Toaster } from "react-hot-toast";
import { useUserStore } from "./stores/useUserStore";
import { useEffect, useRef } from "react";
import LoadingSpinner from "./components/LoadingSpinner";
import CartPage from "./pages/CartPage";
import { useCartStore } from "./stores/useCartStore";
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage";
import PurchaseCancelPage from "./pages/PurchaseCancelPage";
import ReturnPolicy from "./pages/ReturnPolicy";
import UseScrollRestoration from "./components/UseScrollRestoration";
import Orders from "./pages/Orders";
import ClaimWarrantyForm from "./pages/ClaimWarrantyForm";
import Pdp from "./pages/Pdp";
import { ClearanceSaleProducts } from "./pages/ClearanceSaleProducts";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";
import Career from "./pages/Career";

function App() {
	const { user, checkAuth, checkingAuth } = useUserStore();
	const { getCartItems } = useCartStore();
	const hasCheckedAuth = useRef(false);
	useEffect(() => {
		if (hasCheckedAuth.current) return;
		hasCheckedAuth.current = true;
		checkAuth();
	}, [checkAuth]);

	useEffect(() => {
		if (!user) return;

		getCartItems();
	}, [getCartItems, user]);

	if (checkingAuth) return <LoadingSpinner />;

	return (
		<div className='min-h-screen bg-gray-900 text-white relative overflow-hidden'>
			{/* Background gradient */}
			<div className='absolute inset-0 overflow-hidden'>
				<div className='absolute inset-0'>
					<div className='absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.3)_0%,rgba(10,80,60,0.2)_45%,rgba(0,0,0,0.1)_100%)]' />
				</div>
			</div>

			<div className='relative z-50 pt-20'>
				<Navbar />
				<Routes>
					<Route path='/' element={<HomePage />} />
					<Route path='/signup' element={!user ? <SignUpPage /> : <Navigate to='/' />} />
					<Route path='/login' element={!user ? <LoginPage /> : <Navigate to='/' />} />
					<Route path='/aboutus' element={<AboutUs />} />
					<Route path="/return-policy" element={<ReturnPolicy />} />
					<Route path="/orders" element={user ? <Orders /> : <Navigate to='/login' />} />
					<Route path="/warrantyclaim" element={user ? <ClaimWarrantyForm /> : <Navigate to='/login' />} />
					<Route path="/:name" element={<Pdp />} />
					<Route
						path='/secret-dashboard'
						element={user?.role === "admin" ? <AdminPage /> : <Navigate to='/login' />}
					/>
					<Route path='/category/:category' element={<CategoryPage />} />
					<Route path='/cart' element={user ? <CartPage /> : <Navigate to='/login' />} />
					<Route
						path='/purchase-success'
						element={user ? <PurchaseSuccessPage /> : <Navigate to='/login' />}
					/>
					<Route path='/purchase-cancel' element={user ? <PurchaseCancelPage /> : <Navigate to='/login' />} />
					<Route path="/clearance-sale" element={<ClearanceSaleProducts />} />
					<Route path='/privacy' element={<PrivacyPolicy />} />
					<Route path='/terms' element={<TermsOfService />} />
					<Route path='/contact' element={<Contact />} />
					<Route path='/careers' element={<Career />} />
					<Route path='*' element={<Navigate to='/' />} />
				</Routes>
				<Footer />
			</div>
			<Toaster />
			<UseScrollRestoration />
		</div>
	);
}

export default App;

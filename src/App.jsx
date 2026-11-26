import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import ScrollToTop from './components/ScrollToTop'
import { RequireAdmin, RequireAuth } from './components/RouteGuards'
import Home from './pages/Home'
import ShopAll from './pages/ShopAll'
import NewArrivals from './pages/NewArrivals'
import Bestsellers from './pages/Bestsellers'
import Sale from './pages/Sale'
import ProductPage from './pages/ProductPage'
import About from './pages/About'
import SearchPage from './pages/SearchPage'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import SignIn from './pages/auth/SignIn'
import SignUp from './pages/auth/SignUp'
import AccountPage from './pages/account/AccountPage'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminProductForm from './pages/admin/AdminProductForm'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOrderDetail from './pages/admin/AdminOrderDetail'
import AdminInventory from './pages/admin/AdminInventory'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminExpenses from './pages/admin/AdminExpenses'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<ShopAll />} />
          <Route path="/new" element={<NewArrivals />} />
          <Route path="/bestsellers" element={<Bestsellers />} />
          <Route path="/sale" element={<Sale />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <AccountPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id/edit" element={<AdminProductForm />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="expenses" element={<AdminExpenses />} />
          </Route>
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}

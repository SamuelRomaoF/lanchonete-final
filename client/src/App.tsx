import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import AdminRoute from "./components/AdminRoute.js";
import Footer from "./components/Footer.js";
import Navbar from "./components/Navbar.js";
import { Toaster } from "./components/ui/toaster.js";
import { TooltipProvider } from "./components/ui/tooltip.js";
import { AuthProvider } from "./context/AuthContext.js";
import { CartProvider } from "./context/CartContext.js";
import { OrderQueueProvider } from "./context/OrderQueueContext.js";
import { ThemeProvider } from "./context/ThemeContext.js";
import { queryClient } from "./lib/queryClient.js";
import AdminLogin from "./pages/admin/AdminLogin.js";
import CategoryManagement from "./pages/admin/CategoryManagement.js";
import Dashboard from "./pages/admin/Dashboard.js";
import EmailSettings from "./pages/admin/EmailSettings.js";
import AdminOrderHistory from "./pages/admin/OrderHistory.js";
import OrdersList from "./pages/admin/OrdersList.js";
import ProductManagement from "./pages/admin/ProductManagement.js";
import WhatsAppOrders from "./pages/admin/WhatsAppOrders.js";
import Checkout from "./pages/Checkout.js";
import Home from "./pages/Home.js";
import NotFound from "./pages/not-found.js";
import OrderHistory from "./pages/OrderHistory.js";
import ProductsList from "./pages/ProductsList.js";

function Router() {
  return (
    <Switch>
      {/* Páginas de cliente */}
      <Route path="/" component={Home} />
      <Route path="/produtos" component={ProductsList} />
      <Route path="/produtos/:categoria" component={ProductsList} />
      <Route path="/pedidos" component={OrderHistory} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/carrinho" component={Checkout} />
      
      {/* Página de login administrativa */}
      <Route path="/admin/login" component={AdminLogin} />
      
      {/* Páginas de admin - usando AdminRoute para proteção */}
      <Route path="/admin">
        <AdminRoute component={Dashboard} />
      </Route>
      <Route path="/admin/produtos">
        <AdminRoute component={ProductManagement} />
      </Route>
      <Route path="/admin/categorias">
        <AdminRoute component={CategoryManagement} />
      </Route>
      <Route path="/admin/pedidos">
        <AdminRoute component={OrdersList} />
      </Route>
      <Route path="/admin/pedidos/historico">
        <AdminRoute component={AdminOrderHistory} />
      </Route>
      <Route path="/admin/whatsapp">
        <AdminRoute component={WhatsAppOrders} />
      </Route>
      <Route path="/admin/email">
        <AdminRoute component={EmailSettings} />
      </Route>
      
      {/* Fallback para 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <OrderQueueProvider>
              <TooltipProvider>
                <Toaster />
                
                <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-200">
                  <Navbar />
                  <main className="flex-1">
                    <Router />
                  </main>
                  <Footer />
                </div>
                
              </TooltipProvider>
            </OrderQueueProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

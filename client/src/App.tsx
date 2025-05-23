import AdminRoute from "@/components/AdminRoute";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { OrderQueueProvider } from "@/context/OrderQueueContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AdminLogin from "@/pages/admin/AdminLogin";
import CategoryManagement from "@/pages/admin/CategoryManagement";
import Dashboard from "@/pages/admin/Dashboard";
import EmailSettings from "@/pages/admin/EmailSettings";
import AdminOrderHistory from "@/pages/admin/OrderHistory";
import OrdersList from "@/pages/admin/OrdersList";
import ProductManagement from "@/pages/admin/ProductManagement";
import WhatsAppOrders from "@/pages/admin/WhatsAppOrders";
import Checkout from "@/pages/Checkout";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import OrderHistory from "@/pages/OrderHistory";
import ProductsList from "@/pages/ProductsList";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";

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

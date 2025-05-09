import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import ProductsList from "@/pages/ProductsList";
import OrderHistory from "@/pages/OrderHistory";
import Dashboard from "@/pages/admin/Dashboard";
import ProductManagement from "@/pages/admin/ProductManagement";
import OrdersList from "@/pages/admin/OrdersList";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

function Router() {
  return (
    <Switch>
      {/* Páginas de cliente */}
      <Route path="/" component={Home} />
      <Route path="/produtos" component={ProductsList} />
      <Route path="/produtos/:categoria" component={ProductsList} />
      <Route path="/pedidos" component={OrderHistory} />
      
      {/* Páginas de admin */}
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/produtos" component={ProductManagement} />
      <Route path="/admin/pedidos" component={OrdersList} />
      
      {/* Fallback para 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                <Router />
              </main>
              <Footer />
            </div>
            
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

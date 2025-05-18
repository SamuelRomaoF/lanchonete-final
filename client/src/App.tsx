import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { OrderQueueProvider } from "@/context/OrderQueueContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Home from "@/pages/Home";
import OrderHistory from "@/pages/OrderHistory";
import ProductsList from "@/pages/ProductsList";
import CategoryManagement from "@/pages/admin/CategoryManagement";
import Dashboard from "@/pages/admin/Dashboard";
import EmailSettings from "@/pages/admin/EmailSettings";
import OrdersList from "@/pages/admin/OrdersList";
import ProductManagement from "@/pages/admin/ProductManagement";
import WhatsAppOrders from "@/pages/admin/WhatsAppOrders";
import NotFound from "@/pages/not-found";
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
      
      {/* Páginas de admin */}
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/produtos" component={ProductManagement} />
      <Route path="/admin/categorias" component={CategoryManagement} />
      <Route path="/admin/pedidos" component={OrdersList} />
      <Route path="/admin/whatsapp" component={WhatsAppOrders} />
      <Route path="/admin/email" component={EmailSettings} />
      
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
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import { Category, Product } from "@shared/schema";

const Home = () => {
  // Buscar categorias
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Buscar produtos em destaque
  const {
    data: featuredProducts,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery<Product[]>({
    queryKey: ['/api/products/featured'],
  });

  // Buscar produtos em promoção
  const {
    data: promotionProducts,
    isLoading: promotionsLoading,
    error: promotionsError,
  } = useQuery<Product[]>({
    queryKey: ['/api/products/promotions'],
  });

  if (categoriesError || productsError || promotionsError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Erro ao carregar dados</h2>
        <p>Não foi possível carregar as informações. Por favor, tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-neutral-dark text-white py-16 md:py-24">
        <div className="absolute inset-0 bg-black bg-opacity-60 z-10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1561758033-d89a9ad46330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')" }}
        ></div>
        
        <div className="container mx-auto px-4 relative z-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Lanches deliciosos, entrega rápida!</h1>
            <p className="text-lg mb-8 opacity-90">
              Os melhores hambúrgueres, pizzas e lanches da cidade, direto na sua casa. Peça agora e receba em até 40 minutos!
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Link href="/produtos">
                <Button size="lg" className="bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-lg">
                  Fazer Pedido Agora
                </Button>
              </Link>
              <Link href="/produtos">
                <Button size="lg" variant="outline" className="bg-white hover:bg-neutral-lightest text-neutral-dark font-medium py-3 px-6 rounded-lg">
                  Ver Cardápio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Categorias</h2>
          
          {categoriesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md h-56 animate-pulse">
                  <div className="w-full h-36 bg-gray-200"></div>
                  <div className="p-4 text-center">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories && categories.map((category) => (
                <CategoryCard 
                  key={category.id} 
                  id={category.id} 
                  name={category.name} 
                  imageUrl={category.imageUrl || "https://images.unsplash.com/photo-1586190848861-99aa4a171e90"} 
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-12 bg-neutral-lightest">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2 text-center">Mais Populares</h2>
          <p className="text-center text-neutral mb-8">Os lanches favoritos dos nossos clientes</p>
          
          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md h-96 animate-pulse">
                  <div className="w-full h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts && featuredProducts.map((product) => (
                <ProductCard 
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  description={product.description || ""}
                  price={product.price}
                  oldPrice={product.oldPrice}
                  imageUrl={product.imageUrl || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd"}
                  isFeatured={product.isFeatured}
                  isPromotion={product.isPromotion}
                />
              ))}
            </div>
          )}
          
          <div className="text-center mt-8">
            <Link href="/produtos">
              <Button variant="outline" className="bg-white hover:bg-neutral-lightest text-primary font-medium py-3 px-6 rounded-lg border border-primary">
                Ver Cardápio Completo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Offers Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Ofertas Especiais</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl overflow-hidden shadow-lg">
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold mb-2">Terça de Pizza</h3>
                <p className="mb-4 opacity-90">Toda terça-feira, compre uma pizza grande e ganhe uma pequena grátis!</p>
                <Link href="/produtos">
                  <Button variant="secondary" className="bg-white hover:bg-neutral-lightest text-primary font-medium py-2 px-4 rounded-lg">
                    Pedir Agora
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-secondary to-secondary-dark text-white rounded-xl overflow-hidden shadow-lg">
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold mb-2">Combo Estudante</h3>
                <p className="mb-4 opacity-90">Hambúrguer, batata e refrigerante por apenas R$ 25,90 com carteirinha!</p>
                <Link href="/produtos">
                  <Button variant="secondary" className="bg-white hover:bg-neutral-lightest text-secondary font-medium py-2 px-4 rounded-lg">
                    Pedir Agora
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 bg-neutral-lightest">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2 text-center">Como Funciona</h2>
          <p className="text-center text-neutral mb-8">Peça seu lanche em apenas 3 passos</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold mb-2">Escolha seu lanche</h3>
              <p className="text-neutral">Navegue pelo nosso cardápio e escolha as opções que mais te agradam.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold mb-2">Realize o pagamento</h3>
              <p className="text-neutral">Pague com PIX ou cartão de crédito de forma rápida e segura.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold mb-2">Receba em casa</h3>
              <p className="text-neutral">Acompanhe seu pedido e receba em até 40 minutos na sua porta.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2 text-center">O Que Nossos Clientes Dizem</h2>
          <p className="text-center text-neutral mb-8">Avaliações de quem já experimentou nossos lanches</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center mb-4">
                <div className="text-accent">
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                </div>
              </div>
              <p className="text-neutral mb-4">"Os melhores hambúrgueres que já comi! Ingredientes frescos e um sabor incrível. A entrega foi rápida e o lanche chegou quentinho."</p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-neutral-light flex items-center justify-center mr-3">
                  <span className="font-medium text-neutral-dark">MR</span>
                </div>
                <div>
                  <h4 className="font-medium">Marcos R.</h4>
                  <p className="text-xs text-neutral">Cliente desde 2021</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center mb-4">
                <div className="text-accent">
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-half-fill"></i>
                </div>
              </div>
              <p className="text-neutral mb-4">"A pizza de calabresa é a melhor da cidade! Massa no ponto certo e recheio generoso. Sempre peço pelo app e nunca me decepcionei."</p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-neutral-light flex items-center justify-center mr-3">
                  <span className="font-medium text-neutral-dark">CS</span>
                </div>
                <div>
                  <h4 className="font-medium">Carla S.</h4>
                  <p className="text-xs text-neutral">Cliente desde 2022</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center mb-4">
                <div className="text-accent">
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                </div>
              </div>
              <p className="text-neutral mb-4">"Atendimento nota 10! O combo família é perfeito para reuniões em casa. Os lanches são de ótima qualidade e o preço é justo."</p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-neutral-light flex items-center justify-center mr-3">
                  <span className="font-medium text-neutral-dark">PL</span>
                </div>
                <div>
                  <h4 className="font-medium">Pedro L.</h4>
                  <p className="text-xs text-neutral">Cliente desde 2020</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

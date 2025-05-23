import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Category, Product } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

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

  // Filtrar apenas produtos disponíveis
  const availableFeaturedProducts = featuredProducts?.filter(product => product.available === true);
  const availablePromotionProducts = promotionProducts?.filter(product => product.available === true);

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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Cantinho do Sabor - Seu lugar de comida boa!</h1>
            <p className="text-lg mb-8 opacity-90">
              Os melhores lanches com sabor caseiro para você. Faça uma pausa e venha experimentar nossas delícias!
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Link href="/produtos">
                <Button size="lg" className="bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-lg">
                  Ver Cardápio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center text-foreground">Categorias</h2>
          
          {categoriesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card text-card-foreground rounded-xl overflow-hidden shadow-md h-24 animate-pulse flex items-center justify-center">
                  <div className="p-4 text-center">
                    <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories && categories.map((category) => (
                <CategoryCard 
                  key={category.id} 
                  id={String(category.id)} 
                  name={category.name} 
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-12 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2 text-center text-foreground">Mais Populares</h2>
          <p className="text-center text-muted-foreground mb-8">Os favoritos dos nossos clientes</p>
          
          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl overflow-hidden shadow-md h-96 animate-pulse">
                  <div className="w-full h-48 bg-muted"></div>
                  <div className="p-4">
                    <div className="h-5 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-muted rounded w-1/4"></div>
                      <div className="h-10 bg-muted rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableFeaturedProducts && availableFeaturedProducts.length > 0 ? (
                availableFeaturedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      ...product,
                      description: product.description || '',
                      imageUrl: product.imageUrl || '',
                      available: true,
                      categoryId: String(product.categoryId)
                    }}
                  />
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <p className="text-muted-foreground">Nenhum produto em destaque disponível no momento</p>
                </div>
              )}
            </div>
          )}
          
          <div className="text-center mt-8">
            <Link href="/produtos">
              <Button variant="outline" className="bg-card text-primary font-medium py-3 px-6 rounded-lg border border-primary">
                Ver Cardápio Completo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Offers Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center text-foreground">Ofertas Especiais</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl overflow-hidden shadow-lg">
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold mb-2">Combo da Manhã</h3>
                <p className="mb-4 opacity-90">Café + pão na chapa por apenas R$8,90 até as 10h da manhã!</p>
                <Link href="/produtos">
                  <Button variant="secondary" className="bg-white dark:bg-gray-200 hover:bg-neutral-lightest text-primary font-medium py-2 px-4 rounded-lg">
                    Ver Detalhes
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-secondary to-secondary-dark text-white rounded-xl overflow-hidden shadow-lg">
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold mb-2">Combo Estudante</h3>
                <p className="mb-4 opacity-90">Hambúrguer, batata e refrigerante por apenas R$ 25,90 com carteirinha!</p>
                <Link href="/produtos">
                  <Button variant="secondary" className="bg-white dark:bg-gray-200 hover:bg-neutral-lightest text-secondary font-medium py-2 px-4 rounded-lg">
                    Ver Detalhes
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2 text-center text-foreground">Como Funciona</h2>
          <p className="text-center text-muted-foreground mb-8">Veja nosso cardápio online e faça seu pedido</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold mb-2 text-foreground">Consulte o cardápio online</h3>
              <p className="text-muted-foreground">Navegue pelo nosso cardápio no site e descubra todas as opções disponíveis.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold mb-2 text-foreground">Faça seu pedido e pague online</h3>
              <p className="text-muted-foreground">Selecione seus produtos, finalize o pedido e pague via PIX com toda segurança.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold mb-2 text-foreground">Retire seu pedido</h3>
              <p className="text-muted-foreground">Assim que o pagamento for confirmado, você será chamado para retirar seu pedido no balcão.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Promotion Products Section (se existir na página) */}
      {availablePromotionProducts && availablePromotionProducts.length > 0 && (
        <section className="py-12 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-2 text-center text-foreground">Promoções</h2>
            <p className="text-center text-muted-foreground mb-8">Aproveite os melhores preços</p>
            
            {promotionsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-card rounded-xl overflow-hidden shadow-md h-96 animate-pulse">
                    <div className="w-full h-48 bg-muted"></div>
                    <div className="p-4">
                      <div className="h-5 bg-muted rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-muted rounded w-full mb-2"></div>
                      <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-6 bg-muted rounded w-1/4"></div>
                        <div className="h-10 bg-muted rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availablePromotionProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      ...product,
                      description: product.description || '',
                      imageUrl: product.imageUrl || '',
                      available: true,
                      categoryId: String(product.categoryId)
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;

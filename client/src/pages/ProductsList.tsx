import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";
import { Product, Category } from "@shared/schema";

const ProductsList = () => {
  const { categoria } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Buscar categorias
  const {
    data: categories,
    isLoading: categoriesLoading,
  } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Buscar produtos (todos ou por categoria)
  const {
    data: products,
    isLoading: productsLoading,
  } = useQuery<Product[]>({
    queryKey: categoria 
      ? ['/api/products', { categoryId: parseInt(categoria) }] 
      : ['/api/products'],
  });
  
  // Filtrar produtos por busca
  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Função para determinar a categoria ativa
  const getActiveCategory = () => {
    if (!categoria) return "all";
    return categoria;
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Nosso Cardápio</h1>
      
      {/* Barra de pesquisa */}
      <div className="mb-8">
        <div className="relative max-w-md mx-auto">
          <Input
            type="text"
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          <i className="ri-search-line absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral"></i>
        </div>
      </div>
      
      {/* Abas de categorias */}
      {categoriesLoading ? (
        <div className="flex justify-center mb-8">
          <Skeleton className="h-10 w-3/4 rounded-lg" />
        </div>
      ) : (
        <Tabs defaultValue={getActiveCategory()} className="mb-8">
          <TabsList className="flex justify-center flex-wrap">
            <TabsTrigger value="all" className="px-4 py-2">
              Todos
            </TabsTrigger>
            {categories?.map((category) => (
              <TabsTrigger 
                key={category.id} 
                value={category.id.toString()}
                className="px-4 py-2"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productsLoading ? (
                Array(6).fill(0).map((_, index) => (
                  <div key={index} className="bg-white rounded-xl overflow-hidden shadow-md">
                    <Skeleton className="w-full h-48" />
                    <div className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-10 w-24 rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredProducts && filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
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
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <i className="ri-shopping-basket-line text-4xl text-muted-foreground mb-2"></i>
                  <p className="text-muted-foreground">Nenhum produto encontrado</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {categories?.map((category) => (
            <TabsContent key={category.id} value={category.id.toString()} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsLoading ? (
                  Array(3).fill(0).map((_, index) => (
                    <div key={index} className="bg-white rounded-xl overflow-hidden shadow-md">
                      <Skeleton className="w-full h-48" />
                      <div className="p-4">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-4" />
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-10 w-24 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  filteredProducts
                    ?.filter(product => product.categoryId === category.id)
                    .map((product) => (
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
                    ))
                )}
                
                {filteredProducts?.filter(product => product.categoryId === category.id).length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <i className="ri-shopping-basket-line text-4xl text-muted-foreground mb-2"></i>
                    <p className="text-muted-foreground">Nenhum produto encontrado nesta categoria</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default ProductsList;

import { useState, useEffect } from 'react';
import { getPopularProducts } from '../../services/api';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { ShoppingCart, AlertCircle } from 'lucide-react';

export default function PopularItems() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchPopularProducts() {
      try {
        setLoading(true);
        const data = await getPopularProducts();
        setProducts(data);
        setError(null);
      } catch (err) {
        setError('Falha ao carregar os produtos populares. Tente novamente mais tarde.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPopularProducts();
  }, []);

  if (loading) {
    return (
      <section className="section-container">
        <h2 className="section-title">Mais Populares</h2>
        <p className="text-center text-gray-500 mb-8">Os favoritos dos nossos clientes</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="product-card animate-pulse">
              <div className="h-48 bg-gray-300 dark:bg-gray-700"></div>
              <div className="p-4 space-y-2">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section-container">
        <h2 className="section-title">Mais Populares</h2>
        <p className="text-center text-gray-500 mb-8">Os favoritos dos nossos clientes</p>
        <div className="flex items-center justify-center p-6 border border-red-300 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-500">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-container">
      <h2 className="section-title">Mais Populares</h2>
      <p className="text-center text-gray-500 mb-8">Os favoritos dos nossos clientes</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="product-card">
              {product.image_url && (
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-500 dark:text-gray-300 mb-4">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">R$ {product.price.toFixed(2)}</span>
                  <button 
                    onClick={() => addToCart(product)} 
                    className="btn-primary flex items-center"
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">Nenhum produto em destaque disponível no momento.</p>
        )}
      </div>
    </section>
  );
}
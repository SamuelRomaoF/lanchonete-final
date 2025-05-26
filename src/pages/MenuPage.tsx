import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCategories, getProducts } from '../services/api';
import { Category, Product } from '../types';
import ProductCard from '../components/ui/ProductCard';
import { Search, AlertCircle, ShoppingBag } from 'lucide-react';

export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('categoria') || 'todos';
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [categoriesData, productsData] = await Promise.all([
          getCategories(),
          getProducts(categoryParam !== 'todos' ? categoryParam : undefined)
        ]);
        
        setCategories(categoriesData);
        setProducts(productsData);
        setError(null);
      } catch (err) {
        setError('Falha ao carregar os dados. Tente novamente mais tarde.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [categoryParam]);
  
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleCategoryChange = (category: string) => {
    setSearchParams({ categoria: category });
  };
  
  return (
    <div className="section-container">
      <h1 className="text-3xl font-bold text-center mb-8">Nosso Cardápio</h1>
      
      <div className="max-w-xl mx-auto mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pr-10"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>
      
      <div className="mb-8 overflow-x-auto">
        <div className="flex space-x-2 p-2 min-w-max">
          <button
            onClick={() => handleCategoryChange('todos')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              categoryParam === 'todos'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Todos
          </button>
          
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.slug)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                categoryParam === category.slug
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
      ) : error ? (
        <div className="flex items-center justify-center p-6 border border-red-300 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-500">{error}</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <ShoppingBag className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium mb-2">Nenhum produto encontrado</h3>
          <p className="text-gray-500 text-center max-w-md">
            Não encontramos produtos que correspondam à sua busca. Tente outros termos ou categorias.
          </p>
        </div>
      )}
    </div>
  );
}
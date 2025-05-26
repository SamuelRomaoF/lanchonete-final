import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../../services/api';
import { Category } from '../../types';
import { AlertCircle } from 'lucide-react';

export default function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const data = await getCategories();
        setCategories(data);
        setError(null);
      } catch (err) {
        setError('Falha ao carregar as categorias. Tente novamente mais tarde.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="section-container">
        <h2 className="section-title">Categorias</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="category-card h-24 animate-pulse flex items-center justify-center">
              <div className="w-32 h-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section-container">
        <h2 className="section-title">Categorias</h2>
        <div className="flex items-center justify-center p-6 border border-red-300 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-500">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-container">
      <h2 className="section-title">Categorias</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {categories.length > 0 ? (
          categories.map((category) => (
            <Link 
              key={category.id} 
              to={`/cardapio?categoria=${category.slug}`}
              className="category-card h-24 flex items-center justify-center"
            >
              <h3 className="text-xl font-medium">{category.name}</h3>
            </Link>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">Nenhuma categoria disponível no momento.</p>
        )}
      </div>
    </section>
  );
}
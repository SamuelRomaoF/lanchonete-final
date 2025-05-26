import { useState, useEffect } from 'react';
import { getSpecialOffers } from '../../services/api';
import { Product } from '../../types';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SpecialOffers() {
  const [offers, setOffers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSpecialOffers() {
      try {
        setLoading(true);
        const data = await getSpecialOffers();
        setOffers(data);
        setError(null);
      } catch (err) {
        setError('Falha ao carregar as ofertas especiais. Tente novamente mais tarde.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSpecialOffers();
  }, []);

  if (loading) {
    return (
      <section className="section-container">
        <h2 className="section-title">Ofertas Especiais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg overflow-hidden" style={{ backgroundColor: i % 2 === 0 ? '#D35400' : '#C2703D' }}>
              <div className="p-6 space-y-2">
                <div className="h-6 bg-white/30 rounded w-1/2"></div>
                <div className="h-4 bg-white/30 rounded w-3/4"></div>
                <div className="h-8 bg-white/30 rounded w-1/4 mt-4"></div>
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
        <h2 className="section-title">Ofertas Especiais</h2>
        <div className="flex items-center justify-center p-6 border border-red-300 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-500">{error}</p>
        </div>
      </section>
    );
  }

  if (offers.length === 0) {
    return null;
  }

  return (
    <section className="section-container">
      <h2 className="section-title">Ofertas Especiais</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg overflow-hidden bg-orange-600 text-white">
          <div className="p-6">
            <h3 className="text-2xl font-bold mb-2">Combo da Manhã</h3>
            <p className="mb-4">Café + pão na chapa por apenas R$8,90 até as 10h da manhã!</p>
            <Link to="/cardapio" className="inline-block px-4 py-2 bg-white text-orange-600 rounded-md font-medium hover:bg-orange-100 transition-colors">
              Ver Detalhes
            </Link>
          </div>
        </div>
        <div className="rounded-lg overflow-hidden bg-orange-400 text-white">
          <div className="p-6">
            <h3 className="text-2xl font-bold mb-2">Combo Estudante</h3>
            <p className="mb-4">Hambúrguer, batata e refrigerante por apenas R$ 25,90 com carteirinha!</p>
            <Link to="/cardapio" className="inline-block px-4 py-2 bg-white text-orange-400 rounded-md font-medium hover:bg-orange-100 transition-colors">
              Ver Detalhes
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
import Hero from '../components/ui/Hero';
import CategorySection from '../components/ui/CategorySection';
import PopularItems from '../components/ui/PopularItems';
import SpecialOffers from '../components/ui/SpecialOffers';
import HowItWorks from '../components/ui/HowItWorks';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div>
      <Hero />
      <CategorySection />
      <PopularItems />
      <SpecialOffers />
      
      <div className="section-container flex justify-center">
        <Link to="/cardapio" className="btn-primary">
          Ver Cardápio Completo
        </Link>
      </div>

      <HowItWorks />
    </div>
  );
}
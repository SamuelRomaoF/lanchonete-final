import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="hero-section py-28 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Cantinho do Sabor - Seu lugar de comida boa!
          </h1>
          <p className="text-xl mb-8">
            Os melhores lanches com sabor caseiro para você. Faça uma pausa e venha experimentar nossas delícias!
          </p>
          <Link to="/cardapio" className="btn-primary inline-block">
            Ver Cardápio
          </Link>
        </div>
      </div>
    </section>
  );
}
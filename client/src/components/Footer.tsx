import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <i className="ri-restaurant-2-fill text-3xl text-primary"></i>
              <span className="text-xl font-bold text-white font-poppins">FastLanche Faculdade</span>
            </div>
            <p className="text-neutral-300 mb-4">
              Lanches deliciosos e atendimento de qualidade para os estudantes e funcionários da faculdade!
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-neutral-300 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <i className="ri-instagram-line text-xl"></i>
              </a>
              <a 
                href="#" 
                className="text-neutral-300 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <i className="ri-facebook-circle-line text-xl"></i>
              </a>
              <a 
                href="#" 
                className="text-neutral-300 hover:text-white transition-colors"
                aria-label="WhatsApp"
              >
                <i className="ri-whatsapp-line text-xl"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-neutral-300 hover:text-white transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/produtos" className="text-neutral-300 hover:text-white transition-colors">
                  Cardápio
                </Link>
              </li>
              <li>
                <Link href="/produtos" className="text-neutral-300 hover:text-white transition-colors">
                  Promoções
                </Link>
              </li>
              <li>
                <Link href="/" className="text-neutral-300 hover:text-white transition-colors">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href="/" className="text-neutral-300 hover:text-white transition-colors">
                  Contato
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Horário de Funcionamento</h3>
            <ul className="space-y-2 text-neutral-300">
              <li className="flex justify-between">
                <span>Segunda a Sexta</span>
                <span>7h às 22h</span>
              </li>
              <li className="flex justify-between">
                <span>Sábado</span>
                <span>8h às 14h</span>
              </li>
              <li className="flex justify-between">
                <span>Domingo</span>
                <span>Fechado</span>
              </li>
              <li className="flex justify-between">
                <span>Período de Férias</span>
                <span>Horários Especiais</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Contato</h3>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <i className="ri-map-pin-line text-neutral-300 mt-1"></i>
                <span className="text-neutral-300">
                  Campus Universitário - Bloco C, Próximo à Biblioteca
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="ri-phone-line text-neutral-300"></i>
                <span className="text-neutral-300">(11) 98765-4321</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="ri-mail-line text-neutral-300"></i>
                <span className="text-neutral-300">lanchonete@faculdade.edu.br</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-700 pt-6 mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-neutral-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} FastLanche. Todos os direitos reservados.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-400 hover:text-white text-sm transition-colors">
                Termos de Uso
              </a>
              <a href="#" className="text-neutral-400 hover:text-white text-sm transition-colors">
                Política de Privacidade
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

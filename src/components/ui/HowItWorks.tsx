export default function HowItWorks() {
  return (
    <section className="section-container">
      <h2 className="section-title">Como Funciona</h2>
      <p className="text-center text-gray-500 mb-12">Veja nosso cardápio online e faça seu pedido</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
            1
          </div>
          <h3 className="text-xl font-semibold mb-2">Consulte o cardápio online</h3>
          <p className="text-gray-500">
            Navegue pelo nosso cardápio no site e descubra todas as opções disponíveis.
          </p>
        </div>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
            2
          </div>
          <h3 className="text-xl font-semibold mb-2">Faça seu pedido e pague online</h3>
          <p className="text-gray-500">
            Selecione seus produtos, finalize o pedido e pague via PIX com toda segurança.
          </p>
        </div>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
            3
          </div>
          <h3 className="text-xl font-semibold mb-2">Retire seu pedido</h3>
          <p className="text-gray-500">
            Assim que o pagamento for confirmado, você será chamado para retirar seu pedido no balcão.
          </p>
        </div>
      </div>
    </section>
  );
}
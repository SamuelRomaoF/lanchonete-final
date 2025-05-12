import emailService from './email-service';

async function testEmail() {
  console.log('Iniciando teste de e-mail...');
  
  // Um pedido de teste
  const testOrder = {
    id: "test-" + Date.now(),
    ticket: "TESTE",
    status: "recebido",
    items: [
      { id: 1, name: "Item de teste 1", quantity: 2, price: 10.5 },
      { id: 2, name: "Item de teste 2", quantity: 1, price: 15.0 }
    ],
    total: 36.0,
    createdAt: new Date(),
    customerName: "Cliente Teste",
    customerPhone: "(00) 00000-0000"
  };
  
  try {
    // Verificar conexão
    console.log('Verificando conexão com servidor SMTP...');
    const connected = await emailService.testConnection();
    console.log('Conexão com servidor SMTP:', connected ? 'OK' : 'FALHOU');
    
    if (!connected) {
      console.log('Não foi possível conectar ao servidor SMTP.');
      return;
    }
    
    // Verificar destinatários
    const recipients = emailService.getEstablishmentEmails();
    console.log('Destinatários configurados:', recipients);
    
    if (recipients.length === 0) {
      console.log('Nenhum destinatário configurado. Adicionando e-mail de teste...');
      emailService.addEstablishmentEmail('ofc.samuelromao@gmail.com');
      console.log('E-mail adicionado. Destinatários:', emailService.getEstablishmentEmails());
    }
    
    // Enviar e-mail de teste
    console.log('Enviando e-mail de teste...');
    const sent = await emailService.sendNewOrderNotification(testOrder);
    
    console.log('Resultado do envio:', sent ? 'SUCESSO' : 'FALHA');
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

testEmail().catch(console.error); 
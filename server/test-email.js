const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Iniciando teste de e-mail...');
  
  // Configurar transportador com suas credenciais
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'ofc.samuelromao@gmail.com',
      pass: 'pxzc czml gqpa nrnm'
    }
  });
  
  // Verificar conexão
  try {
    console.log('Verificando conexão com servidor SMTP...');
    const connected = await transporter.verify();
    console.log('Conexão com servidor SMTP: OK');
    
    // Enviar email de teste
    console.log('Enviando e-mail de teste...');
    const info = await transporter.sendMail({
      from: 'Sistema de Pedidos <ofc.samuelromao@gmail.com>',
      to: 'ofc.samuelromao@gmail.com',
      subject: 'Teste de Conexão - FaleComigo',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #e63946;">Teste de Email</h2>
          <p>Este é um email de teste para verificar a configuração do sistema de notificações.</p>
          <p>Se você recebeu este email, a configuração foi bem-sucedida!</p>
          <p>Data e hora do teste: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      `
    });
    
    console.log('Email enviado com sucesso!');
    console.log('ID da mensagem:', info.messageId);
    
    return true;
  } catch (error) {
    console.error('Erro durante o teste:', error);
    return false;
  }
}

// Executar o teste
testEmail()
  .then(result => {
    if (result) {
      console.log('Teste concluído com sucesso!');
    } else {
      console.log('Teste falhou.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Erro não tratado:', err);
    process.exit(1);
  }); 
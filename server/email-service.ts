import nodemailer from 'nodemailer';

// Configurações de e-mail
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

// Objeto para armazenar e-mails de destinatários
interface EmailRecipients {
  establishmentEmails: string[];
}

class EmailService {
  private transporter!: nodemailer.Transporter;
  private config: EmailConfig;
  private recipients: EmailRecipients = {
    establishmentEmails: ['ofc.samuelromao@gmail.com']
  };
  // Registro de IDs de pedidos para os quais já enviamos e-mails
  private sentEmailIds: Set<string> = new Set();
  
  constructor() {
    // Configurações do Gmail SMTP
    this.config = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'ofc.samuelromao@gmail.com', // Email do usuário
        pass: 'pxzc czml gqpa nrnm' // Senha de aplicativo gerada
      },
      from: 'Sistema de Pedidos <ofc.samuelromao@gmail.com>' // Email do usuário
    };
    
    // Carregar destinatários salvos
    this.loadRecipients();
    
    // Inicializar o transporter
    this.initTransporter();
  }
  
  // Inicializa o transporter do nodemailer
  private initTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.auth.user,
        pass: this.config.auth.pass
      }
    });
  }
  
  // Carregar configurações de e-mail de algum arquivo ou banco de dados
  private loadRecipients() {
    try {
      // Aqui você pode carregar de um arquivo ou banco de dados
      // Por enquanto vamos usar um valor padrão
      const savedRecipients = process.env.ESTABLISHMENT_EMAILS;
      
      if (savedRecipients) {
        this.recipients.establishmentEmails = savedRecipients.split(',');
      }
    } catch (error) {
      console.error('Erro ao carregar destinatários de e-mail:', error);
    }
  }
  
  // Salvar configurações
  private saveRecipients() {
    try {
      // Aqui você pode salvar em um arquivo ou banco de dados
      // Por enquanto, apenas simulamos o salvamento
      console.log('Destinatários salvos:', this.recipients);
    } catch (error) {
      console.error('Erro ao salvar destinatários de e-mail:', error);
    }
  }
  
  // Adicionar e-mail do estabelecimento
  public addEstablishmentEmail(email: string) {
    if (!this.recipients.establishmentEmails.includes(email)) {
      this.recipients.establishmentEmails.push(email);
      this.saveRecipients();
      return true;
    }
    return false;
  }
  
  // Remover e-mail do estabelecimento
  public removeEstablishmentEmail(email: string) {
    const initialLength = this.recipients.establishmentEmails.length;
    this.recipients.establishmentEmails = this.recipients.establishmentEmails.filter(e => e !== email);
    
    if (this.recipients.establishmentEmails.length !== initialLength) {
      this.saveRecipients();
      return true;
    }
    return false;
  }
  
  // Listar e-mails do estabelecimento
  public getEstablishmentEmails() {
    return this.recipients.establishmentEmails;
  }
  
  // Enviar e-mail de notificação de novo pedido
  public async sendNewOrderNotification(orderData: any) {
    console.log('Iniciando envio de e-mail para notificação de pedido');
    console.log('Destinatários configurados:', this.recipients.establishmentEmails);
    
    if (this.recipients.establishmentEmails.length === 0) {
      console.warn('Nenhum e-mail de estabelecimento configurado para receber notificações');
      return false;
    }
    
    try {
      // Verificar se já enviamos um e-mail para este pedido
      if (orderData.id && this.sentEmailIds.has(orderData.id)) {
        console.log(`E-mail para pedido ${orderData.id} já foi enviado anteriormente. Ignorando.`);
        return true; // Retorna true para não causar erros no fluxo
      }
      
      // Primeiro testar se a conexão está funcionando
      console.log('Testando conexão com o servidor SMTP...');
      const connectionTest = await this.testConnection();
      if (!connectionTest) {
        console.error('Erro na conexão com servidor de e-mail. Não será possível enviar notificação.');
        return false;
      }
      
      console.log('Conexão SMTP OK. Preparando e-mail...');
      
      // Formatar os itens do pedido para o e-mail
      const itemsList = orderData.items.map((item: any) => 
        `${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`
      ).join('<br>');
      
      // Formatar hora do pedido
      const orderTime = new Date(orderData.createdAt).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Formatar data do pedido
      const orderDate = new Date(orderData.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      // Criar tabela de itens
      const itemsTable = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background-color: #8B4513; color: white;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Item</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Qtd</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Preço</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderData.items.map((item: any) => `
              <tr style="background-color: #fff;">
                <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">R$ ${item.price.toFixed(2)}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">R$ ${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr style="background-color: #f9f9f9;">
              <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd; font-weight: bold;">Total</td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd; font-weight: bold;">R$ ${orderData.total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      `;
      
      // Configurações do e-mail
      const mailOptions = {
        from: this.config.from,
        to: this.recipients.establishmentEmails.join(','),
        subject: `Novo Pedido Recebido - Senha ${orderData.ticket} 🔔`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="background-color: #8B4513; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Cantinho do Sabor</h1>
              <p style="margin: 5px 0 0 0;">Novo Pedido Recebido!</p>
            </div>
            
            <div style="background-color: #f8f4e5; border: 1px solid #e6d9c0; border-top: none; border-radius: 0 0 8px 8px; padding: 20px;">
              <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ddd; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">
                      <strong style="color: #8B4513;">Senha:</strong>
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
                      <span style="font-size: 18px; font-weight: bold; color: #d9534f;">${orderData.ticket}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">
                      <strong style="color: #8B4513;">Data:</strong>
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
                      ${orderDate}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">
                      <strong style="color: #8B4513;">Hora:</strong>
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
                      ${orderTime}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">
                      <strong style="color: #8B4513;">Cliente:</strong>
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
                      ${orderData.customerName || 'Não informado'}
                    </td>
                  </tr>
                  ${orderData.customerPhone ? `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">
                      <strong style="color: #8B4513;">Telefone:</strong>
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
                      ${orderData.customerPhone}
                    </td>
                  </tr>
                  ` : ''}
                </table>
            </div>
            
              <h3 style="color: #8B4513; border-bottom: 2px solid #8B4513; padding-bottom: 8px;">Itens do Pedido</h3>
              ${itemsTable}
              
              <div style="margin-top: 30px; text-align: center;">
              <a href="http://localhost:3002/admin/pedidos" 
                  style="display: inline-block; background-color: #8B4513; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Gerenciar Pedido
              </a>
              </div>
            </div>
            
            <div style="margin-top: 20px; text-align: center; color: #777; font-size: 12px;">
              <p>Este e-mail foi enviado automaticamente pelo sistema de pedidos do Cantinho do Sabor.</p>
              <p>&copy; 2024 Cantinho do Sabor. Todos os direitos reservados.</p>
            </div>
          </div>
        `
      };
      
      console.log('Configurações de e-mail:', JSON.stringify({
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      }, null, 2));
      
      try {
        // Enviar o e-mail
        console.log('Enviando e-mail...');
        const info = await this.transporter.sendMail(mailOptions);
        console.log('E-mail de notificação enviado:', info.messageId);
        
        // Marcar este ID como já notificado para evitar duplicatas
        if (orderData.id) {
          this.sentEmailIds.add(orderData.id);
          console.log(`ID ${orderData.id} adicionado à lista de e-mails enviados`);
        }
        
        // Para Ethereal Email, mostrar a URL onde o e-mail pode ser visualizado
        const emailUrl = nodemailer.getTestMessageUrl(info);
        console.log('URL para visualizar o e-mail: ', emailUrl);
        
        return true;
      } catch (error) {
        console.error('Erro ao enviar e-mail de notificação:', error);
        return false;
      }
    } catch (error) {
      console.error('Erro inesperado no serviço de e-mail:', error);
      return false;
    }
  }
  
  // Método para testar a conexão com o servidor de e-mail
  public async testConnection() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Erro na conexão com servidor de e-mail:', error);
      return false;
    }
  }
  
  // Atualizar configurações de e-mail
  public updateConfig(newConfig: Partial<EmailConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.initTransporter();
  }
  
  // Expõe o transporter para uso direto
  public getTransporter() {
    return this.transporter;
  }
  
  // Expõe a configuração (sem a senha)
  public getConfig() {
    return {
      ...this.config,
      auth: {
        user: this.config.auth.user,
        pass: '********' // Ocultando a senha
      }
    };
  }
  
  // Limpar registro de e-mails enviados (útil para testes ou após certo período)
  public clearSentEmails() {
    const count = this.sentEmailIds.size;
    this.sentEmailIds.clear();
    console.log(`Limpeza de registro de ${count} e-mails enviados realizada`);
  }
}

// Exportar uma instância única do serviço
const emailService = new EmailService();
export default emailService; 
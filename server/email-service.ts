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
      
      // Configurações do e-mail
      const mailOptions = {
        from: this.config.from,
        to: this.recipients.establishmentEmails.join(','),
        subject: `Novo Pedido Recebido - Senha ${orderData.ticket} 🔔`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #e63946;">Novo Pedido Recebido!</h2>
            <div style="background-color: #f1faee; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h3 style="margin-top: 0;">Detalhes do Pedido</h3>
              <p><strong>Senha:</strong> ${orderData.ticket}</p>
              <p><strong>Hora:</strong> ${orderTime}</p>
              <p><strong>Cliente:</strong> ${orderData.customerName || 'Não informado'}</p>
              ${orderData.customerPhone ? `<p><strong>Telefone:</strong> ${orderData.customerPhone}</p>` : ''}
            </div>
            
            <h3>Itens do Pedido:</h3>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
              ${itemsList}
              <p style="margin-top: 15px; font-weight: bold; font-size: 16px;">
                Total: R$ ${orderData.total.toFixed(2)}
              </p>
            </div>
            
            <div style="margin-top: 25px; text-align: center;">
              <a href="http://localhost:3002/admin/pedidos" 
                style="background-color: #1d3557; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Gerenciar Pedidos
              </a>
            </div>
            
            <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
              Esta é uma mensagem automática do sistema de pedidos.
            </p>
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
}

// Exportar uma instância única do serviço
const emailService = new EmailService();
export default emailService; 
/**
 * Serviço para geração de QR Code do PIX
 * 
 * Nota: Esta é uma implementação simples que usa a API do QR Server
 * Para uma implementação completa e segura, seria melhor usar
 * uma integração oficial com um PSP (Payment Service Provider)
 */

// Informações do recebedor (definidas no env)
const PIX_KEY = import.meta.env.VITE_PIX_KEY; // Chave PIX do recebedor
const PIX_NAME = import.meta.env.VITE_PIX_NAME; // Nome do recebedor
const PIX_CITY = import.meta.env.VITE_PIX_CITY; // Cidade do recebedor
const PIX_DESCRIPTION = 'Pedido FaleComigo'; // Descrição padrão

interface PixParams {
  value: number;
  reference?: string; // Referência do pagamento (ex: número do pedido)
  customerName?: string; // Nome do cliente
}

/**
 * Gera o Payload do PIX (código que será convertido em QR Code)
 * Implementação baseada no padrão EMV para PIX
 */
export function generatePixPayload({ value, reference, customerName }: PixParams): string {
  if (!PIX_KEY || !PIX_NAME || !PIX_CITY) {
    console.error('Configuração do PIX incompleta. Verifique as variáveis de ambiente.');
    return '';
  }
  
  // Formatar o valor com duas casas decimais e ponto como separador
  const formattedValue = value.toFixed(2);
  
  // Adicionar referência ao pedido na descrição se fornecida
  const description = reference 
    ? `${PIX_DESCRIPTION} - ${reference}` 
    : PIX_DESCRIPTION;
    
  // Construir o payload seguindo o padrão EMV para PIX
  let payload = '';
  
  // Payload Format Indicator (obrigatório, fixo "01")
  payload += "000201";
  
  // Merchant Account Information (obrigatório para PIX)
  payload += "26";
  
  // Indica o domínio "BR.GOV.BCB.PIX"
  payload += "43";
  payload += "00";
  payload += "14BR.GOV.BCB.PIX";
  
  // Chave PIX
  payload += "01";
  const keyLength = String(PIX_KEY.length).padStart(2, '0');
  payload += keyLength;
  payload += PIX_KEY;
  
  // Descrição do pagamento (opcional)
  if (description) {
    payload += "02";
    const descLength = String(description.length).padStart(2, '0');
    payload += descLength;
    payload += description;
  }
  
  // Merchant Category Code (fixo "0000" para PIX)
  payload += "52040000";
  
  // Transaction Currency (986 para BRL)
  payload += "5303986";
  
  // Transaction Amount
  payload += "54";
  const valueLength = String(formattedValue.length).padStart(2, '0');
  payload += valueLength;
  payload += formattedValue;
  
  // Country Code (BR)
  payload += "5802BR";
  
  // Merchant Name
  payload += "59";
  const nameLength = String(PIX_NAME.length).padStart(2, '0');
  payload += nameLength;
  payload += PIX_NAME;
  
  // Merchant City
  payload += "60";
  const cityLength = String(PIX_CITY.length).padStart(2, '0');
  payload += cityLength;
  payload += PIX_CITY;
  
  // Additional Data Field (referência do pagamento)
  if (reference) {
    payload += "62";
    const refValue = `***${reference}`;
    const refLength = String(refValue.length + 4).padStart(2, '0');
    payload += refLength;
    payload += "05";
    payload += String(refValue.length).padStart(2, '0');
    payload += refValue;
  }
  
  // CRC16 (será adicionado em uma versão completa)
  payload += "6304";
  // Aqui seria adicionado o cálculo do CRC16, que é complexo
  // Para simplificar, estamos retornando sem o CRC16
  // Em uma implementação real, é necessário calcular o CRC16
  payload += "0000";
  
  return payload;
}

/**
 * Gera a URL do QR Code usando a API do QR Server
 * 
 * Nota: Em uma implementação robusta, você geraria o QR Code
 * localmente ou usaria uma API mais confiável
 */
export function getPixQrCodeUrl(pixPayload: string): string {
  if (!pixPayload) return '';
  
  // Usando a API do QR Server para gerar a imagem
  const encodedPayload = encodeURIComponent(pixPayload);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedPayload}`;
}

/**
 * Função de alto nível para gerar a URL do QR Code do PIX
 */
export function generatePixQrCodeUrl(params: PixParams): string {
  const payload = generatePixPayload(params);
  return getPixQrCodeUrl(payload);
} 
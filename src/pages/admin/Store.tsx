import { useState, useEffect } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { Save, Clock, Calendar, DollarSign } from 'lucide-react';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';

interface StoreSettings {
  id: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  opening_hours: string;
  delivery_fee: number;
  min_order_value: number;
  is_open: boolean;
  logo_url: string;
  banner_url: string;
  social_media: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
}

interface BusinessHours {
  dayOfWeek: string;
  open: string;
  close: string;
}

export default function Store() {
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
  // Business hours state
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([
    { dayOfWeek: 'Segunda-feira', open: '08:00', close: '18:00' },
    { dayOfWeek: 'Terça-feira', open: '08:00', close: '18:00' },
    { dayOfWeek: 'Quarta-feira', open: '08:00', close: '18:00' },
    { dayOfWeek: 'Quinta-feira', open: '08:00', close: '18:00' },
    { dayOfWeek: 'Sexta-feira', open: '08:00', close: '18:00' },
    { dayOfWeek: 'Sábado', open: '08:00', close: '14:00' },
    { dayOfWeek: 'Domingo', open: '', close: '' }
  ]);
  
  useEffect(() => {
    fetchStoreSettings();
  }, []);
  
  async function fetchStoreSettings() {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .single();
        
      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "No rows found" - not an error for us
        throw error;
      }
      
      if (data) {
        setName(data.name || '');
        setDescription(data.description || '');
        setAddress(data.address || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setDeliveryFee(data.delivery_fee?.toString() || '');
        setMinOrderValue(data.min_order_value?.toString() || '');
        setIsOpen(data.is_open);
        
        // Parse social media
        if (data.social_media) {
          setInstagram(data.social_media.instagram || '');
          setFacebook(data.social_media.facebook || '');
          setWhatsapp(data.social_media.whatsapp || '');
        }
        
        // Parse business hours
        if (data.opening_hours) {
          try {
            const parsedHours = JSON.parse(data.opening_hours);
            if (Array.isArray(parsedHours)) {
              setBusinessHours(parsedHours);
            }
          } catch (e) {
            console.error('Error parsing business hours:', e);
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao buscar configurações da loja:', error);
      setError('Falha ao carregar configurações da loja. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }
  
  function updateBusinessHour(index: number, field: 'open' | 'close', value: string) {
    const updated = [...businessHours];
    updated[index] = { ...updated[index], [field]: value };
    setBusinessHours(updated);
  }
  
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const storeData = {
        name,
        description,
        address,
        phone,
        email,
        opening_hours: JSON.stringify(businessHours),
        delivery_fee: parseFloat(deliveryFee || '0'),
        min_order_value: parseFloat(minOrderValue || '0'),
        is_open: isOpen,
        social_media: {
          instagram,
          facebook,
          whatsapp
        }
      };
      
      // Check if we need to insert or update
      const { data: existingData } = await supabase
        .from('store_settings')
        .select('id')
        .single();
      
      let error;
      
      if (existingData) {
        // Update
        const { error: updateError } = await supabase
          .from('store_settings')
          .update(storeData)
          .eq('id', existingData.id);
          
        error = updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('store_settings')
          .insert([storeData]);
          
        error = insertError;
      }
      
      if (error) throw error;
      
      setSuccess('Configurações da loja salvas com sucesso!');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('Erro ao salvar configurações da loja:', error);
      setError('Falha ao salvar configurações da loja. Por favor, tente novamente.');
    } finally {
      setSaving(false);
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Configurações da Loja</h1>
      </div>
      
      {error && (
        <div className="bg-red-900 text-red-200 p-3 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-900 text-green-200 p-3 rounded">
          {success}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-[#e67e22] border-r-2 border-b-2 border-transparent"></div>
          <p className="mt-2 text-gray-400">Carregando configurações...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* General Information */}
          <div className="bg-[#2a211c] p-4 rounded-lg border border-[#5a443c]">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <DollarSign className="mr-2 text-[#e67e22]" />
              Informações Gerais
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block mb-1 text-sm">Nome da Loja</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 bg-[#46342e] border border-[#5a443c] rounded focus:outline-none focus:border-[#e67e22]"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block mb-1 text-sm">Telefone</label>
                  <input
                    type="text"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 bg-[#46342e] border border-[#5a443c] rounded focus:outline-none focus:border-[#e67e22]"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block mb-1 text-sm">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 bg-[#46342e] border border-[#5a443c] rounded focus:outline-none focus:border-[#e67e22]"
                />
              </div>
              
              <div>
                <label htmlFor="address" className="block mb-1 text-sm">Endereço</label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 bg-[#46342e] border border-[#5a443c] rounded focus:outline-none focus:border-[#e67e22]"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block mb-1 text-sm">Descrição</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 bg-[#46342e] border border-[#5a443c] rounded focus:outline-none focus:border-[#e67e22]"
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          {/* Business Hours */}
          <div className="bg-[#2a211c] p-4 rounded-lg border border-[#5a443c]">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="mr-2 text-[#e67e22]" />
              Horário de Funcionamento
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Dia da Semana</span>
                <div className="flex gap-4">
                  <span className="text-sm text-gray-400 w-24 text-center">Abertura</span>
                  <span className="text-sm text-gray-400 w-24 text-center">Fechamento</span>
                </div>
              </div>
              
              {businessHours.map((day, index) => (
                <div key={day.dayOfWeek} className="flex items-center justify-between">
                  <span>{day.dayOfWeek}</span>
                  <div className="flex gap-4">
                    <input
                      type="time"
                      value={day.open}
                      onChange={(e) => updateBusinessHour(index, 'open', e.target.value)}
                      className="w-24 p-1 bg-[#46342e] border border-[#5a443c] rounded focus:outline-none focus:border-[#e67e22]"
                    />
                    <input
                      type="time"
                      value={day.close}
                      onChange={(e) => updateBusinessHour(index, 'close', e.target.value)}
                      className="w-24 p-1 bg-[#46342e] border border-[#5a443c] rounded focus:outline-none focus:border-[#e67e22]"
                    />
                  </div>
                </div>
              ))}
              
              <div className="mt-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isOpen}
                    onChange={(e) => setIsOpen(e.target.checked)}
                    className="rounded bg-[#46342e] border-[#5a443c]"
                  />
                  <span>Loja aberta para pedidos</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Delivery Settings */}
          <div className="bg-[#2a211c] p-4 rounded-lg border border-[#5a443c]">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar className="mr-2 text-[#e67e22]" />
              Configurações de Entrega
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deliveryFee" className="block mb-1 text-sm">Taxa de Entrega (R$)</label>
                <input
                  type="number"
                  id="deliveryFee"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  className="w-full p-2 bg-[#46342e] border border-[#5a443c] rounded focus:outline-none focus:border-[#e67e22]"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="minOrderValue" className="block mb-1 text-sm">Valor Mínimo do Pedido (R$)</label>
                <input
                  type="number"
                  id="minOrderValue"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                  className="w-full p-2 bg-[#46342e] border border-[#5a443c] rounded focus:outline-none focus:border-[#e67e22]"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>
          
          {/* Social Media */}
          <div className="bg-[#2a211c] p-4 rounded-lg border border-[#5a443c]">
            <h2 className="text-lg font-semibold mb-4">Redes Sociais</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="instagram" className="block mb-1 text-sm">Instagram</label>
                <input
                  type="text"
                  id="instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full p-2 bg-[#46342e] border border-[#5a443c] rounded focus:outline-none focus:border-[#e67e22]"
                  placeholder="@seuinstagram"
                />
              </div>
              
              <div>
                <label htmlFor="facebook" className="block mb-1 text-sm">Facebook</label>
                <input
                  type="text"
                  id="facebook"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full p-2 bg-[#46342e] border border-[#5a443c] rounded focus:outline-none focus:border-[#e67e22]"
                  placeholder="facebook.com/suapagina"
                />
              </div>
              
              <div>
                <label htmlFor="whatsapp" className="block mb-1 text-sm">WhatsApp</label>
                <input
                  type="text"
                  id="whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full p-2 bg-[#46342e] border border-[#5a443c] rounded focus:outline-none focus:border-[#e67e22]"
                  placeholder="+55 (11) 99999-9999"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-[#e67e22] hover:bg-[#d35400] text-white rounded transition-colors"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-r-transparent rounded-full"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Salvar Configurações</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 
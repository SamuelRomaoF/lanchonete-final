import { useState } from 'react';
import { ExternalLinkIcon, SettingsIcon } from 'lucide-react';

export default function Store() {
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Cantinho do Sabor',
    storeDescription: 'Lanches frescos e saborosos para alimentar seu corpo e mente durante a jornada acadêmica.',
    storeAddress: 'Universidade Anhanguera de Osasco - Próximo ao Auditório',
    storePhone: '(11) 99999-9999',
    storeEmail: 'contato@cantinhodobsabor.com',
    workingHours: {
      weekdays: '7h às 22h',
      saturday: '8h às 14h',
      sunday: 'Fechado'
    },
    socialMedia: {
      instagram: '@cantinhodobsabor',
      facebook: 'facebook.com/cantinhodobsabor'
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Configurações da Loja</h1>
        <a 
          href="/loja" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#46342e] hover:bg-[#5a443c] text-white px-3 py-1.5 rounded transition-colors"
        >
          <ExternalLinkIcon size={16} />
          Visualizar Loja
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <SettingsIcon className="text-[#e67e22]" />
              <h2 className="text-lg font-semibold">Informações Gerais</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="storeName" className="block mb-1 font-medium">
                  Nome da Loja
                </label>
                <input
                  id="storeName"
                  type="text"
                  className="input"
                  value={storeSettings.storeName}
                  onChange={(e) => setStoreSettings({...storeSettings, storeName: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="storeDescription" className="block mb-1 font-medium">
                  Descrição
                </label>
                <textarea
                  id="storeDescription"
                  rows={3}
                  className="textarea"
                  value={storeSettings.storeDescription}
                  onChange={(e) => setStoreSettings({...storeSettings, storeDescription: e.target.value})}
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="storeEmail" className="block mb-1 font-medium">
                    Email
                  </label>
                  <input
                    id="storeEmail"
                    type="email"
                    className="input"
                    value={storeSettings.storeEmail}
                    onChange={(e) => setStoreSettings({...storeSettings, storeEmail: e.target.value})}
                  />
                </div>
                <div>
                  <label htmlFor="storePhone" className="block mb-1 font-medium">
                    Telefone
                  </label>
                  <input
                    id="storePhone"
                    type="text"
                    className="input"
                    value={storeSettings.storePhone}
                    onChange={(e) => setStoreSettings({...storeSettings, storePhone: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#e67e22]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="text-lg font-semibold">Localização</h2>
            </div>
            <div>
              <label htmlFor="storeAddress" className="block mb-1 font-medium">
                Endereço
              </label>
              <input
                id="storeAddress"
                type="text"
                className="input"
                value={storeSettings.storeAddress}
                onChange={(e) => setStoreSettings({...storeSettings, storeAddress: e.target.value})}
              />
            </div>
            <div className="mt-4 aspect-video bg-[#2a211c] rounded-lg flex items-center justify-center">
              <p className="text-gray-400">Mapa indisponível</p>
            </div>
          </div>

          {/* Working Hours */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#e67e22]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-semibold">Horário de Funcionamento</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="weekdays" className="block mb-1 font-medium">
                  Segunda a Sexta
                </label>
                <input
                  id="weekdays"
                  type="text"
                  className="input"
                  value={storeSettings.workingHours.weekdays}
                  onChange={(e) => setStoreSettings({
                    ...storeSettings, 
                    workingHours: {
                      ...storeSettings.workingHours,
                      weekdays: e.target.value
                    }
                  })}
                />
              </div>
              <div>
                <label htmlFor="saturday" className="block mb-1 font-medium">
                  Sábado
                </label>
                <input
                  id="saturday"
                  type="text"
                  className="input"
                  value={storeSettings.workingHours.saturday}
                  onChange={(e) => setStoreSettings({
                    ...storeSettings, 
                    workingHours: {
                      ...storeSettings.workingHours,
                      saturday: e.target.value
                    }
                  })}
                />
              </div>
              <div>
                <label htmlFor="sunday" className="block mb-1 font-medium">
                  Domingo
                </label>
                <input
                  id="sunday"
                  type="text"
                  className="input"
                  value={storeSettings.workingHours.sunday}
                  onChange={(e) => setStoreSettings({
                    ...storeSettings, 
                    workingHours: {
                      ...storeSettings.workingHours,
                      sunday: e.target.value
                    }
                  })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Social Media */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#e67e22]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              <h2 className="text-lg font-semibold">Redes Sociais</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="instagram" className="block mb-1 font-medium">
                  Instagram
                </label>
                <input
                  id="instagram"
                  type="text"
                  className="input"
                  value={storeSettings.socialMedia.instagram}
                  onChange={(e) => setStoreSettings({
                    ...storeSettings, 
                    socialMedia: {
                      ...storeSettings.socialMedia,
                      instagram: e.target.value
                    }
                  })}
                />
              </div>
              <div>
                <label htmlFor="facebook" className="block mb-1 font-medium">
                  Facebook
                </label>
                <input
                  id="facebook"
                  type="text"
                  className="input"
                  value={storeSettings.socialMedia.facebook}
                  onChange={(e) => setStoreSettings({
                    ...storeSettings, 
                    socialMedia: {
                      ...storeSettings.socialMedia,
                      facebook: e.target.value
                    }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Save Settings */}
          <div className="card">
            <button className="btn-primary w-full">
              Salvar Configurações
            </button>
            <p className="text-xs text-center text-gray-400 mt-2">
              Todas as alterações serão aplicadas imediatamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
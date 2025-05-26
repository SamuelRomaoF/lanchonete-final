import { useState, useEffect } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { PlusIcon, Pencil, Trash2, XIcon, ImageIcon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: number;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
}

export default function Products() {
  const { supabase } = useSupabase();
  const { theme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para o modal de confirmação de exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [productNameToDelete, setProductNameToDelete] = useState<string>('');
  
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  
  // Classes condicionais baseadas no tema
  const cardBg = theme === 'dark' ? 'bg-[#2a211c]' : 'bg-white';
  const cardBorder = theme === 'dark' ? 'border-[#5a443c]' : 'border-gray-200';
  const inputBg = theme === 'dark' ? 'bg-[#46342e]' : 'bg-gray-50';
  const inputBorder = theme === 'dark' ? 'border-[#5a443c]' : 'border-gray-300';
  const hoverBg = theme === 'dark' ? 'hover:bg-[#46342e]' : 'hover:bg-gray-100';
  const tableBorderColor = theme === 'dark' ? 'border-[#5a443c]' : 'border-gray-200';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedTextColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const headerColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const modalBg = theme === 'dark' ? 'bg-[#2a211c]' : 'bg-white';
  const modalOverlayBg = 'bg-black bg-opacity-50';
  
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);
  
  async function fetchProducts() {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
        
      if (error) {
        throw error;
      }
      
      setProducts(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar produtos:', error);
      setError('Falha ao carregar produtos. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }
  
  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
        
      if (error) {
        throw error;
      }
      
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  }
  
  function handleEdit(product: Product) {
    if (!product) return;
    
    setCurrentProduct(product);
    setName(product.name || '');
    setDescription(product.description || '');
    setPrice(product.price ? String(product.price) : '0');
    setCategoryId(product.category_id ? String(product.category_id) : '');
    setImageUrl(product.image_url || '');
    setImagePreview(product.image_url || '');
    setIsEditing(true);
  }
  
  function handleCancel() {
    setCurrentProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setCategoryId('');
    setImage(null);
    setImageUrl('');
    setImagePreview('');
    setIsEditing(false);
  }
  
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
  
  async function uploadImage(file: File) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `products/${fileName}`;
      
      // Primeiro, verifique se o bucket existe
      const { data: buckets } = await supabase.storage.listBuckets();
      const imagesBucket = buckets?.find(b => b.name === 'images');
      
      // Se o bucket não existir, crie-o
      if (!imagesBucket) {
        const { error: createError } = await supabase.storage.createBucket('images', {
          public: true
        });
        if (createError) throw createError;
      }
      
      // Agora faça o upload
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw error;
    }
  }
  
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Upload image first if exists
      let newImageUrl = '';
      if (image) {
        try {
          // Validar tamanho do arquivo (máximo 2MB)
          if (image.size > 2 * 1024 * 1024) {
            throw new Error('A imagem deve ter no máximo 2MB');
          }

          // Validar tipo do arquivo
          if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(image.type)) {
            throw new Error('Formato de imagem não suportado. Use JPG, PNG, GIF ou WEBP');
          }

          // Gere um nome único para o arquivo
          const fileExt = image.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
          const filePath = `products/${fileName}`;
          
          // Faça o upload
          const { error: uploadError, data } = await supabase.storage
            .from('images')
            .upload(filePath, image, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (uploadError) throw uploadError;
          
          // Obtenha a URL pública
          const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);
            
          if (!urlData?.publicUrl) {
            throw new Error('Erro ao obter URL da imagem');
          }
            
          newImageUrl = urlData.publicUrl;
        } catch (uploadError: any) {
          console.error('Erro ao fazer upload da imagem:', uploadError);
          setError(`Erro ao fazer upload da imagem: ${uploadError.message || 'Erro desconhecido'}`);
          setLoading(false);
          return;
        }
      }
      
      const productData = {
        name,
        description,
        price: parseFloat(price),
        category_id: parseInt(categoryId),
        image_url: newImageUrl || imageUrl // Usa a nova URL se existir, senão mantém a atual
      };
      
      if (currentProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', currentProduct.id);
          
        if (error) throw error;
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert([productData]);
          
        if (error) throw error;
      }
      
      // Reset form and refetch products
      handleCancel();
      await fetchProducts();
      
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      setError(`Falha ao salvar produto: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  }
  
  // Função para abrir o modal de confirmação de exclusão
  function confirmDelete(id: number, productName: string) {
    setProductToDelete(id);
    setProductNameToDelete(productName);
    setDeleteModalOpen(true);
  }
  
  // Função para cancelar a exclusão
  function cancelDelete() {
    setDeleteModalOpen(false);
    setProductToDelete(null);
    setProductNameToDelete('');
  }
  
  // Função para realizar a exclusão após confirmação
  async function handleDelete() {
    if (!productToDelete) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete);
        
      if (error) throw error;
      
      // Atualizar estado local em vez de refazer a consulta completa
      setProducts(products.filter(product => product.id !== productToDelete));
      
      // Fechar o modal após excluir
      setDeleteModalOpen(false);
      setProductToDelete(null);
      setProductNameToDelete('');
    } catch (error: any) {
      console.error('Erro ao excluir produto:', error);
      setError('Falha ao excluir produto. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }
  
  function formatPrice(price: number) {
    return `R$ ${price.toFixed(2)}`;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${headerColor}`}>Gerenciar Produtos</h1>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-[#e67e22] hover:bg-[#d35400] text-white px-3 py-1.5 rounded transition-colors"
          >
            <PlusIcon size={16} />
            Novo Produto
          </button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-900 text-red-200 p-3 rounded">
          {error}
        </div>
      )}
      
      {/* Form */}
      {isEditing && (
        <div className={`${cardBg} p-4 rounded-lg border ${cardBorder}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg font-semibold ${headerColor}`}>
              {currentProduct ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <button 
              onClick={handleCancel}
              className={`p-1 ${hoverBg} rounded-full transition-colors`}
            >
              <XIcon size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className={`block mb-1 text-sm ${textColor}`}>Nome</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full p-2 ${inputBg} border ${inputBorder} rounded focus:outline-none focus:border-[#e67e22]`}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="price" className={`block mb-1 text-sm ${textColor}`}>Preço</label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={`w-full p-2 ${inputBg} border ${inputBorder} rounded focus:outline-none focus:border-[#e67e22]`}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="category" className={`block mb-1 text-sm ${textColor}`}>Categoria</label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={`w-full p-2 ${inputBg} border ${inputBorder} rounded focus:outline-none focus:border-[#e67e22]`}
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className={`block mb-1 text-sm ${textColor}`}>Descrição</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full p-2 ${inputBg} border ${inputBorder} rounded focus:outline-none focus:border-[#e67e22]`}
                rows={3}
              />
            </div>
            
            <div>
              <label htmlFor="image" className={`block mb-1 text-sm ${textColor}`}>Imagem</label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <label 
                    htmlFor="image" 
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed ${inputBorder} rounded-lg cursor-pointer ${inputBg} ${hoverBg} transition-colors`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="mb-3" />
                      <p className={`mb-2 text-sm ${mutedTextColor}`}>
                        <span className="font-semibold">Clique para fazer upload</span> ou arraste uma imagem
                      </p>
                      <p className={`text-xs ${mutedTextColor}`}>PNG, JPG, WEBP (Máx. 2MB)</p>
                    </div>
                    <input 
                      id="image" 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                
                {imagePreview && (
                  <div className="flex-shrink-0">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className={`w-32 h-32 object-cover rounded-lg border ${inputBorder}`} 
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className={`px-4 py-2 mr-2 ${inputBg} ${hoverBg} rounded transition-colors`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#e67e22] hover:bg-[#d35400] text-white rounded transition-colors"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Products List */}
      <div className={`${cardBg} rounded-lg border ${cardBorder} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${tableBorderColor}`}>
                <th className={`py-3 px-4 text-left ${headerColor}`}>Produto</th>
                <th className={`py-3 px-4 text-left ${headerColor}`}>Categoria</th>
                <th className={`py-3 px-4 text-right ${headerColor}`}>Preço</th>
                <th className={`py-3 px-4 text-right ${headerColor}`}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && !products.length ? (
                <tr>
                  <td colSpan={4} className={`py-8 text-center ${mutedTextColor}`}>
                    Carregando produtos...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`py-8 text-center ${mutedTextColor}`}>
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className={`border-b ${tableBorderColor}`}>
                    <td className={`py-3 px-4 ${textColor}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex-shrink-0">
                          {product.image_url && (
                            <img 
                              src={product.image_url} 
                              alt={product.name} 
                              className="w-full h-full object-cover rounded"
                            />
                          )}
                        </div>
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td className={`py-3 px-4 ${textColor}`}>
                      {categories.find(c => c.id === product.category_id)?.name || ''}
                    </td>
                    <td className={`py-3 px-4 text-right ${textColor}`}>{formatPrice(product.price)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className={`p-1 ${hoverBg} rounded transition-colors`}
                        >
                          <Pencil size={16} className={textColor} />
                        </button>
                        <button
                          onClick={() => confirmDelete(product.id, product.name)}
                          className={`p-1 ${hoverBg} rounded transition-colors text-red-500`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal de Confirmação de Exclusão */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={cancelDelete}></div>
          <div className={`${modalBg} p-6 rounded-lg shadow-lg max-w-md w-full z-10`}>
            <h3 className={`text-lg font-semibold mb-4 ${headerColor}`}>Deseja apagar esse produto?</h3>
            <p className={`mb-6 ${textColor}`}>
              Você está prestes a excluir o produto "{productNameToDelete}". Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className={`px-4 py-2 ${inputBg} ${hoverBg} rounded transition-colors`}
              >
                Não
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Sim, apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useSupabase } from '../lib/supabase-provider';
import { PlusIcon, RefreshCwIcon, PencilIcon, TrashIcon, XIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category_id: number;
  category_name?: string;
}

export default function Products() {
  const { supabase } = useSupabase();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  
  // Form states
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('0');
  const [productCategoryId, setProductCategoryId] = useState<number | null>(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [supabase]);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
        
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Erro ao carregar categorias');
    }
  }

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories (name)
        `)
        .order('name');
        
      if (productsError) throw productsError;
      
      const formattedProducts = products?.map(product => ({
        ...product,
        category_name: product.categories?.name || 'Sem categoria'
      }));
      
      setProducts(formattedProducts || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setProductName('');
    setProductDescription('');
    setProductPrice('0');
    setProductCategoryId(null);
    setModalMode('add');
    setIsModalOpen(true);
  }

  function openEditModal(product: Product) {
    setProductName(product.name);
    setProductDescription(product.description || '');
    setProductPrice(product.price.toString());
    setProductCategoryId(product.category_id);
    setCurrentProduct(product);
    setModalMode('edit');
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setCurrentProduct(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!productName.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }
    
    if (!productCategoryId) {
      toast.error('Categoria é obrigatória');
      return;
    }
    
    const price = parseFloat(productPrice);
    if (isNaN(price) || price < 0) {
      toast.error('Preço inválido');
      return;
    }
    
    try {
      const productData = {
        name: productName,
        description: productDescription || null,
        price,
        category_id: productCategoryId,
      };
      
      if (modalMode === 'add') {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
          
        if (error) throw error;
        toast.success('Produto adicionado com sucesso');
      } else if (modalMode === 'edit' && currentProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', currentProduct.id);
          
        if (error) throw error;
        toast.success('Produto atualizado com sucesso');
      }
      
      closeModal();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Erro ao salvar produto');
    }
  }

  async function handleDelete(id: number) {
    try {
      // First check if the product exists in any orders
      const { count, error: countError } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', id);
        
      if (countError) throw countError;
      
      if (count && count > 0) {
        toast.error(`Não é possível excluir. Este produto está vinculado a ${count} pedidos.`);
        setDeleteConfirmId(null);
        return;
      }
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Produto excluído com sucesso');
      fetchProducts();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao excluir produto');
    }
  }

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.category_name && product.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <button 
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon size={18} />
          Novo Produto
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar produtos..."
          className="input pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCwIcon size={24} className="animate-spin text-[#e67e22]" />
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="bg-[#46342e] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#5a443c]">
                  <th className="py-3 px-4 text-left font-medium">Nome</th>
                  <th className="py-3 px-4 text-left font-medium">Categoria</th>
                  <th className="py-3 px-4 text-left font-medium">Descrição</th>
                  <th className="py-3 px-4 text-right font-medium">Preço</th>
                  <th className="py-3 px-4 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id} className="border-t border-[#5a443c] hover:bg-[#5a443c] transition-colors">
                    <td className="py-3 px-4">{product.name}</td>
                    <td className="py-3 px-4">{product.category_name}</td>
                    <td className="py-3 px-4">{product.description || '-'}</td>
                    <td className="py-3 px-4 text-right">R$ {product.price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      {deleteConfirmId === product.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm text-red-300">Confirmar?</span>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-1 rounded bg-red-600 hover:bg-red-700 transition-colors"
                          >
                            <TrashIcon size={16} />
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-1 rounded bg-gray-600 hover:bg-gray-700 transition-colors"
                          >
                            <XIcon size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(product)}
                            className="p-1 rounded bg-[#e67e22] hover:bg-[#d35400] transition-colors"
                            title="Editar"
                          >
                            <PencilIcon size={16} />
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmId(product.id)}
                            className="p-1 rounded bg-red-600 hover:bg-red-700 transition-colors"
                            title="Excluir"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 card">
          <h3 className="text-xl font-semibold mb-2">Nenhum produto cadastrado</h3>
          <p className="text-gray-400 mb-6">Comece adicionando seu primeiro produto ao catálogo</p>
          <button onClick={openAddModal} className="btn-primary">
            Adicionar Produto
          </button>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#46342e] rounded-lg w-full max-w-md overflow-hidden animate-fade-in-scale">
            <div className="flex justify-between items-center p-4 border-b border-[#5a443c]">
              <h2 className="text-lg font-semibold">
                {modalMode === 'add' ? 'Adicionar Produto' : 'Editar Produto'}
              </h2>
              <button onClick={closeModal} className="p-1 rounded-full hover:bg-[#5a443c]">
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-4">
                <label htmlFor="productName" className="block mb-1 font-medium">
                  Nome<span className="text-red-500">*</span>
                </label>
                <input
                  id="productName"
                  type="text"
                  className="input"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="productCategory" className="block mb-1 font-medium">
                  Categoria<span className="text-red-500">*</span>
                </label>
                <select
                  id="productCategory"
                  className="select"
                  value={productCategoryId || ''}
                  onChange={(e) => setProductCategoryId(parseInt(e.target.value))}
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="productDescription" className="block mb-1 font-medium">
                  Descrição
                </label>
                <textarea
                  id="productDescription"
                  className="textarea"
                  rows={3}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                ></textarea>
              </div>
              
              <div className="mb-6">
                <label htmlFor="productPrice" className="block mb-1 font-medium">
                  Preço<span className="text-red-500">*</span>
                </label>
                <input
                  id="productPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded bg-[#5a443c] hover:bg-[#6a544c] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
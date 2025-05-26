import { useState, useEffect } from 'react';
import { useSupabase } from '../lib/supabase-provider';
import { PlusIcon, RefreshCwIcon, PencilIcon, TrashIcon, XIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  description: string | null;
}

export default function Categories() {
  const { supabase } = useSupabase();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  
  // Form states
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [supabase]);

  async function fetchCategories() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      if (error) {
        throw error;
      }
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setCategoryName('');
    setCategoryDescription('');
    setModalMode('add');
    setIsModalOpen(true);
  }

  function openEditModal(category: Category) {
    setCategoryName(category.name);
    setCategoryDescription(category.description || '');
    setCurrentCategory(category);
    setModalMode('edit');
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setCurrentCategory(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }
    
    try {
      if (modalMode === 'add') {
        const { error } = await supabase
          .from('categories')
          .insert([
            { 
              name: categoryName, 
              description: categoryDescription || null 
            }
          ]);
          
        if (error) throw error;
        toast.success('Categoria adicionada com sucesso');
      } else if (modalMode === 'edit' && currentCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ 
            name: categoryName, 
            description: categoryDescription || null 
          })
          .eq('id', currentCategory.id);
          
        if (error) throw error;
        toast.success('Categoria atualizada com sucesso');
      }
      
      closeModal();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Erro ao salvar categoria');
    }
  }

  async function handleDelete(id: number) {
    try {
      // Check if there are products using this category
      const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);
        
      if (countError) throw countError;
      
      if (count && count > 0) {
        toast.error(`Não é possível excluir. Esta categoria possui ${count} produtos vinculados.`);
        setDeleteConfirmId(null);
        return;
      }
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Categoria excluída com sucesso');
      fetchCategories();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erro ao excluir categoria');
    }
  }

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Gerenciamento de Categorias</h1>
        <button 
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon size={18} />
          Nova Categoria
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar categorias..."
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
      ) : filteredCategories.length > 0 ? (
        <div className="bg-[#46342e] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#5a443c]">
                  <th className="py-3 px-4 text-left font-medium">Nome</th>
                  <th className="py-3 px-4 text-left font-medium">Descrição</th>
                  <th className="py-3 px-4 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map(category => (
                  <tr key={category.id} className="border-t border-[#5a443c] hover:bg-[#5a443c] transition-colors">
                    <td className="py-3 px-4">{category.name}</td>
                    <td className="py-3 px-4">{category.description || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      {deleteConfirmId === category.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm text-red-300">Confirmar?</span>
                          <button 
                            onClick={() => handleDelete(category.id)}
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
                            onClick={() => openEditModal(category)}
                            className="p-1 rounded bg-[#e67e22] hover:bg-[#d35400] transition-colors"
                            title="Editar"
                          >
                            <PencilIcon size={16} />
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmId(category.id)}
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
          <h3 className="text-xl font-semibold mb-2">Nenhuma categoria encontrada</h3>
          <p className="text-gray-400 mb-6">Você ainda não cadastrou nenhuma categoria</p>
          <button onClick={openAddModal} className="btn-primary">
            Adicionar Categoria
          </button>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#46342e] rounded-lg w-full max-w-md overflow-hidden animate-fade-in-scale">
            <div className="flex justify-between items-center p-4 border-b border-[#5a443c]">
              <h2 className="text-lg font-semibold">
                {modalMode === 'add' ? 'Adicionar Categoria' : 'Editar Categoria'}
              </h2>
              <button onClick={closeModal} className="p-1 rounded-full hover:bg-[#5a443c]">
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-4">
                <label htmlFor="categoryName" className="block mb-1 font-medium">
                  Nome da categoria<span className="text-red-500">*</span>
                </label>
                <input
                  id="categoryName"
                  type="text"
                  className="input"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="categoryDescription" className="block mb-1 font-medium">
                  Descrição (opcional)
                </label>
                <textarea
                  id="categoryDescription"
                  className="textarea"
                  rows={4}
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                ></textarea>
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
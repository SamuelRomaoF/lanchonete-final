import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createCategory, deleteCategory, getCategories, updateCategory } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";

// Esquema para o formulário de categoria
const categoryFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional()
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

const CategoryManagement = () => {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Verificar se o usuário é administrador
  if (user && user.type !== "admin") {
    navigate("/");
    return null;
  }
  
  // Buscar categorias
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
    enabled: !!user && user.type === "admin",
  });
  
  // Formulário para adicionar/editar categoria
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: ""
    },
  });
  
  // Mutation para criar categoria
  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormValues) => {
      return createCategory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Categoria criada",
        description: "Categoria criada com sucesso",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Erro ao criar categoria:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation para atualizar categoria
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: CategoryFormValues }) => {
      return updateCategory(id.toString(), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Categoria atualizada",
        description: "Categoria atualizada com sucesso",
      });
      setIsEditDialogOpen(false);
      setCurrentCategory(null);
    },
    onError: (error) => {
      console.error("Erro ao atualizar categoria:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar categoria. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation para excluir categoria
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number | string) => {
      console.log("Excluindo categoria com ID:", id);
      // Usar a função direta do Supabase
      return deleteCategory(id.toString());
    },
    onSuccess: () => {
      // Forçar recarregamento imediato de categorias
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      // Aguardar um momento e forçar nova atualização para garantir
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
      }, 1000);
      
      toast({
        title: "Categoria excluída",
        description: "Categoria excluída com sucesso",
      });
      setIsDeleteDialogOpen(false);
      setCurrentCategory(null);
    },
    onError: (error: any) => {
      console.error("Erro ao excluir categoria:", error);
      
      // Mostrar mensagem específica se vier do servidor
      const errorMessage = error.message || "Erro ao excluir categoria. Tente novamente.";
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Mesmo com erro, forçar atualização da lista para confirmar estado atual
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      setIsDeleteDialogOpen(false);
      setCurrentCategory(null);
    },
  });
  
  // Filtragem de categorias
  const filteredCategories = categories?.filter((category) => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Funções de gerenciamento de categorias
  const handleCreateCategory = (data: CategoryFormValues) => {
    createCategoryMutation.mutate({ name: data.name, description: data.description });
  };
  
  const handleEditCategory = (data: CategoryFormValues) => {
    if (currentCategory) {
      updateCategoryMutation.mutate({ id: currentCategory.id, data });
    }
  };
  
  const handleDeleteCategory = () => {
    if (currentCategory) {
      // Mostrar mensagem de processamento
      toast({
        title: "Processando",
        description: "Excluindo categoria...",
      });
      
      // Executar a mutação
      deleteCategoryMutation.mutate(currentCategory.id);
    }
  };
  
  // Funções para abrir modais
  const openCreateDialog = () => {
    form.reset({
      name: "",
      description: ""
    });
    setIsCreateDialogOpen(true);
  };
  
  const openEditDialog = (category: Category) => {
    form.reset({
      name: category.name,
      description: category.description || ""
    });
    setCurrentCategory(category);
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (category: Category) => {
    setCurrentCategory(category);
    setIsDeleteDialogOpen(true);
  };
  
  // Atualizar valores do formulário quando editar uma categoria
  useEffect(() => {
    if (currentCategory && isEditDialogOpen) {
      form.reset({
        name: currentCategory.name,
        description: currentCategory.description || ""
      });
      setCurrentCategory(currentCategory);
      setIsEditDialogOpen(true);
    }
  }, [currentCategory, isEditDialogOpen, form]);
  
  if (!user || user.type !== "admin") {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
        <p>Esta área é restrita a administradores.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
        <h1 className="text-2xl font-bold">Gerenciamento de Categorias</h1>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['categories'] })}
            variant="outline"
            className="ml-3"
            title="Atualizar lista"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
          </Button>
        </div>
        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary-dark">
          <Plus className="mr-2 h-4 w-4" /> Nova Categoria
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>
      
      {categoriesLoading ? (
        <div className="text-center py-8">
          <div className="spinner h-8 w-8 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p>Carregando categorias...</p>
        </div>
      ) : filteredCategories && filteredCategories.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <div>
                        {category.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => openEditDialog(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => openDeleteDialog(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 bg-neutral-lightest rounded-lg">
          <h3 className="text-lg font-medium mb-2">Nenhuma categoria encontrada</h3>
          <p className="text-neutral mb-6">
            {searchTerm ? "Não encontramos categorias com esse termo de busca" : "Você ainda não cadastrou nenhuma categoria"}
          </p>
          <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary-dark">
            Adicionar Categoria
          </Button>
        </div>
      )}
      
      {/* Dialog para criar categoria */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Categoria</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para adicionar uma nova categoria ao cardápio
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateCategory)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da categoria*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createCategoryMutation.isPending}>
                  {createCategoryMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para editar categoria */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Edite os campos abaixo para atualizar a categoria
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditCategory)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da categoria*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateCategoryMutation.isPending}>
                  {updateCategoryMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para excluir categoria */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Excluir Categoria</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium">{currentCategory?.name}</p>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryManagement;
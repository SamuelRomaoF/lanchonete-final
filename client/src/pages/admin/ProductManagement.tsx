import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category, Product } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";

// Esquema para o formulário de produto
const productFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, "Preço deve ser maior que zero"),
  oldPrice: z.coerce.number().optional(),
  imageUrl: z.string().optional(),
  categoryId: z.coerce.number({
    required_error: "Categoria é obrigatória",
  }),
  isFeatured: z.boolean().default(false),
  isPromotion: z.boolean().default(false),
  available: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const ProductManagement = () => {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Verificar se o usuário é administrador
  useEffect(() => {
    if (user && user.type !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Buscar categorias
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    enabled: !!user && user.type === "admin",
  });
  
  // Buscar produtos
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    enabled: !!user && user.type === "admin",
  });
  
  // Formulário para adicionar/editar produto
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      oldPrice: undefined,
      imageUrl: "",
      categoryId: undefined,
      isFeatured: false,
      isPromotion: false,
      available: true,
    },
  });
  
  // Atualizar valores do formulário quando editar um produto
  useEffect(() => {
    if (currentProduct && isEditDialogOpen) {
      form.reset({
        name: currentProduct.name,
        description: currentProduct.description || "",
        price: currentProduct.price,
        oldPrice: currentProduct.oldPrice || undefined,
        imageUrl: currentProduct.imageUrl || "",
        categoryId: currentProduct.categoryId || undefined,
        isFeatured: currentProduct.isFeatured || false,
        isPromotion: currentProduct.isPromotion || false,
        available: currentProduct.available !== false,
      });
    }
  }, [currentProduct, isEditDialogOpen, form]);
  
  // Mutation para criar produto
  const createProductMutation = useMutation({
    mutationFn: (data: ProductFormValues) => {
      return apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Produto criado",
        description: "Produto criado com sucesso",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Erro ao criar produto:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation para atualizar produto
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductFormValues }) => {
      return apiRequest("PUT", `/api/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Produto atualizado",
        description: "Produto atualizado com sucesso",
      });
      setIsEditDialogOpen(false);
      setCurrentProduct(null);
    },
    onError: (error) => {
      console.error("Erro ao atualizar produto:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation para excluir produto
  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => {
      // Garante que o ID é tratado corretamente, mesmo quando for 0
      console.log('Tentando excluir produto com ID:', id, typeof id);
      
      // Adicionar parâmetros para evitar cache
      const timestamp = new Date().getTime();
      const noCache = `?_nocache=${timestamp}`;
      
      return apiRequest("DELETE", `/api/products/${id}${noCache}`, {
        forceDelete: true, // Parâmetro adicional para forçar exclusão
        _timestamp: timestamp // Parâmetro adicional para evitar cache
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/promotions'] });
      toast({
        title: "Produto excluído",
        description: "Produto excluído com sucesso",
      });
      setIsDeleteDialogOpen(false);
      setCurrentProduct(null);
    },
    onError: (error) => {
      console.error("Erro ao excluir produto:", error);
      // Mesmo com erro, forçar atualização da interface
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Erro",
        description: "Erro ao excluir produto. A página será atualizada mesmo assim.",
        variant: "destructive",
      });
      // Fechar o modal de exclusão mesmo em caso de erro
      setIsDeleteDialogOpen(false);
      setCurrentProduct(null);
    },
  });
  
  // Mutation para alternar disponibilidade do produto
  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, available }: { id: number; available: boolean }) => {
      return apiRequest("PATCH", `/api/products/${id}/availability`, { available });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/promotions'] });
      
      toast({
        title: data.product.available ? "Produto ativado" : "Produto desativado",
        description: data.message,
      });
    },
    onError: (error) => {
      console.error("Erro ao alternar disponibilidade do produto:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar disponibilidade do produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  // Filtragem de produtos
  const filteredProducts = products?.filter((product) => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Funções de gerenciamento de produtos
  const handleCreateProduct = (data: ProductFormValues) => {
    createProductMutation.mutate(data);
  };
  
  const handleEditProduct = (data: ProductFormValues) => {
    if (currentProduct) {
      updateProductMutation.mutate({ id: currentProduct.id, data });
    }
  };
  
  const handleDeleteProduct = () => {
    if (currentProduct) {
      console.log(`Iniciando exclusão do produto: ${currentProduct.name} (ID: ${currentProduct.id})`);
      
      // Pré-invalidar os dados para forçar recarregamento imediato
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      // Iniciar a exclusão
      deleteProductMutation.mutate(currentProduct.id);
      
      // Fechar o modal de confirmação imediatamente para melhor experiência
      setIsDeleteDialogOpen(false);
      
      // Mostrar toast informando que a operação está em andamento
      toast({
        title: "Excluindo produto",
        description: "O produto está sendo excluído...",
      });
    }
  };
  
  // Função para alternar disponibilidade
  const handleToggleAvailability = (product: Product) => {
    toggleAvailabilityMutation.mutate({
      id: product.id,
      available: !product.available
    });
  };
  
  // Funções para abrir modais
  const openCreateDialog = () => {
    form.reset({
      name: "",
      description: "",
      price: 0,
      oldPrice: undefined,
      imageUrl: "",
      categoryId: undefined,
      isFeatured: false,
      isPromotion: false,
      available: true,
    });
    setIsCreateDialogOpen(true);
  };
  
  const openEditDialog = (product: Product) => {
    setCurrentProduct(product);
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (product: Product) => {
    setCurrentProduct(product);
    setIsDeleteDialogOpen(true);
  };
  
  // Ajuda a encontrar o nome da categoria
  const getCategoryName = (categoryId?: number) => {
    if (!categoryId || !categories) return "Sem categoria";
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "Desconhecida";
  };
  
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
        <h1 className="text-2xl font-bold">Gerenciamento de Produtos</h1>
        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary-dark">
          <Plus className="mr-2 h-4 w-4" /> Novo Produto
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>
      
      {productsLoading ? (
        <div className="text-center py-8">
          <div className="spinner h-8 w-8 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p>Carregando produtos...</p>
        </div>
      ) : filteredProducts && filteredProducts.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      {product.imageUrl && (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                      <div>
                        {product.name}
                        <div className="flex space-x-1 mt-1">
                          {product.isFeatured && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                              Destaque
                            </Badge>
                          )}
                          {product.isPromotion && (
                            <Badge variant="outline" className="text-xs bg-accent/10 text-accent-foreground border-accent/20">
                              Promoção
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                  <TableCell>
                    <div>
                      {formatCurrency(product.price)}
                      {product.oldPrice && (
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          {formatCurrency(product.oldPrice)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={product.available} 
                        onCheckedChange={() => handleToggleAvailability(product)}
                      />
                      <Badge variant={product.available ? "default" : "secondary"} className={product.available ? "bg-green-500" : "bg-gray-500"}>
                        {product.available ? "Disponível" : "Indisponível"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => openEditDialog(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => openDeleteDialog(product)}
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
          <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
          <p className="text-neutral mb-6">
            {searchTerm ? "Não encontramos produtos com esse termo de busca" : "Você ainda não cadastrou nenhum produto"}
          </p>
          <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary-dark">
            Adicionar Produto
          </Button>
        </div>
      )}
      
      {/* Dialog para criar produto */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Produto</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para adicionar um novo produto ao cardápio
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateProduct)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do produto*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria*</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="oldPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço antigo (promoção)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Opcional" 
                          {...field} 
                          value={field.value || ""} 
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da imagem</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>
                      URL da imagem do produto (recomendado: 800x500px)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Destacado</FormLabel>
                        <FormDescription>
                          Mostrar na página inicial
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isPromotion"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Promoção</FormLabel>
                        <FormDescription>
                          Produto em promoção
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="available"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Disponível</FormLabel>
                        <FormDescription>
                          Produto disponível para venda
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-primary-dark"
                  disabled={createProductMutation.isPending}
                >
                  {createProductMutation.isPending ? "Salvando..." : "Salvar Produto"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para editar produto */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Atualize as informações do produto
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditProduct)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do produto*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria*</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="oldPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço antigo (promoção)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Opcional" 
                          {...field} 
                          value={field.value || ""} 
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da imagem</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>
                      URL da imagem do produto (recomendado: 800x500px)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Destacado</FormLabel>
                        <FormDescription>
                          Mostrar na página inicial
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isPromotion"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Promoção</FormLabel>
                        <FormDescription>
                          Produto em promoção
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="available"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Disponível</FormLabel>
                        <FormDescription>
                          Produto disponível para venda
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-primary-dark"
                  disabled={updateProductMutation.isPending}
                >
                  {updateProductMutation.isPending ? "Salvando..." : "Atualizar Produto"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para confirmar exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o produto "{currentProduct?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProduct}
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? "Excluindo..." : "Excluir Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;

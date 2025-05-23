import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
    createProduct,
    deleteProduct,
    getCategories,
    getProducts,
    updateProduct
} from "@/lib/api";
import { deleteProductImage, initializeStorage, uploadProductImage } from "@/lib/storage";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category, Product } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image, Loader2, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
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
  categoryId: z.string({
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
  
  // Estado para controle de upload de imagem
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Inicializar storage do Supabase
  useEffect(() => {
    initializeStorage().catch(console.error);
  }, []);
  
  // Verificar se o usuário é administrador
  useEffect(() => {
    if (user && user.type !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Buscar categorias
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
    enabled: !!user && user.type === "admin",
  });
  
  // Buscar produtos
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: getProducts,
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
      categoryId: "",
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
        categoryId: currentProduct.categoryId || "",
        isFeatured: currentProduct.isFeatured || false,
        isPromotion: currentProduct.isPromotion || false,
        available: currentProduct.available !== false,
      });
      
      // Atualizar preview de imagem ao editar
      if (currentProduct.imageUrl) {
        setPreviewUrl(currentProduct.imageUrl);
      } else {
        setPreviewUrl(null);
      }
    }
  }, [currentProduct, isEditDialogOpen, form]);
  
  // Processar upload de imagem e retornar URL
  const handleImageUpload = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const imageUrl = await uploadProductImage(file);
      setIsUploading(false);
      return imageUrl;
    } catch (error) {
      setIsUploading(false);
      throw error;
    }
  };
  
  // Lidar com seleção de arquivo de imagem
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Verificar tamanho do arquivo (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 2MB",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione uma imagem válida",
        variant: "destructive",
      });
      return;
    }
    
    // Salvar arquivo selecionado
    setSelectedImage(file);
    
    // Criar URL para preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    return () => URL.revokeObjectURL(objectUrl);
  };
  
  // Mutation para criar produto
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      // Se tiver uma imagem selecionada, fazer upload
      if (selectedImage) {
        const imageUrl = await handleImageUpload(selectedImage);
        data.imageUrl = imageUrl;
      }
      
      return createProduct({
        ...data,
        categoryId: data.categoryId,
        description: data.description || ''
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Produto criado",
        description: "Produto criado com sucesso",
      });
      setIsCreateDialogOpen(false);
      form.reset();
      setSelectedImage(null);
      setPreviewUrl(null);
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
    mutationFn: async ({ id, data }: { id: string; data: ProductFormValues }) => {
      // Se tiver uma imagem selecionada, fazer upload
      if (selectedImage) {
        // Se já existia uma imagem, remover do storage
        if (currentProduct?.imageUrl && currentProduct.imageUrl !== data.imageUrl) {
          try {
            await deleteProductImage(currentProduct.imageUrl);
          } catch (error) {
            console.error("Erro ao excluir imagem anterior:", error);
          }
        }
        
        const imageUrl = await handleImageUpload(selectedImage);
        data.imageUrl = imageUrl;
      }
      
      return updateProduct(id, {
        ...data,
        categoryId: data.categoryId,
        description: data.description || ''
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Produto atualizado",
        description: "Produto atualizado com sucesso",
      });
      setIsEditDialogOpen(false);
      setCurrentProduct(null);
      setSelectedImage(null);
      setPreviewUrl(null);
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
    mutationFn: async (id: number | string) => {
      // Se o produto tem imagem, remover do storage
      if (currentProduct?.imageUrl) {
        try {
          await deleteProductImage(currentProduct.imageUrl);
        } catch (error) {
          console.error("Erro ao excluir imagem do produto:", error);
        }
      }
      
      return deleteProduct(id.toString());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Produto excluído",
        description: "Produto excluído com sucesso",
      });
      setIsDeleteDialogOpen(false);
      setCurrentProduct(null);
    },
    onError: (error) => {
      console.error("Erro ao excluir produto:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir produto. Tente novamente.",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
      setCurrentProduct(null);
    },
  });
  
  // Mutation para alternar disponibilidade do produto
  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) => {
      return updateProduct(id, { available });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Produto atualizado",
        description: "Disponibilidade atualizada com sucesso",
      });
    },
    onError: (error) => {
      console.error("Erro ao atualizar disponibilidade:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar disponibilidade. Tente novamente.",
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
      updateProductMutation.mutate({ id: currentProduct.id.toString(), data });
    }
  };
  
  const handleDeleteProduct = () => {
    if (currentProduct) {
      deleteProductMutation.mutate(currentProduct.id);
    }
  };
  
  // Função para alternar disponibilidade
  const handleToggleAvailability = (product: Product) => {
    toggleAvailabilityMutation.mutate({
      id: product.id.toString(),
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
      categoryId: "",
      isFeatured: false,
      isPromotion: false,
      available: true,
    });
    setSelectedImage(null);
    setPreviewUrl(null);
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
  
  const getCategoryName = (categoryId?: string | number) => {
    if (!categoryId || !categories) return "Sem categoria";
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Categoria não encontrada";
  };
  
  // Renderizar o formulário de produto (usado tanto para criar quanto para editar)
  const renderProductForm = (
    onSubmit: (data: ProductFormValues) => void,
    isSubmitting: boolean
  ) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome*</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do produto" {...field} />
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
                  <FormLabel>Descrição</FormLabel>
                      <FormControl>
                    <Textarea
                      placeholder="Descrição do produto"
                      className="min-h-[120px]"
                      {...field}
                      value={field.value || ""}
                    />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
          </div>
                
          <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria*</FormLabel>
                  <FormControl>
                      <Select 
                      value={field.value?.toString() || ""}
                      onValueChange={field.onChange}
                      >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
            <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço*</FormLabel>
                      <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                        onFocus={(e) => {
                          if (field.value === 0) {
                            e.target.value = '';
                          }
                        }}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Se o campo estiver vazio, define o valor como 0
                          field.onChange(value === '' ? '' : parseFloat(value));
                        }}
                      />
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
                    <FormLabel>Preço Antigo</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                        min="0"
                        placeholder="0,00"
                          {...field} 
                          value={field.value || ""} 
                          onFocus={(e) => {
                            if (field.value === 0) {
                              e.target.value = '';
                              field.onChange('');
                            }
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? '' : parseFloat(value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
          </div>
              </div>
              
        {/* Upload de imagem */}
        <div className="space-y-4">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
              <FormItem className="flex flex-col space-y-3">
                <FormLabel>Imagem do Produto</FormLabel>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Preview da imagem */}
                  <div className="relative w-32 h-32 rounded-md overflow-hidden border">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Botão de upload */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-input rounded-md shadow-sm text-sm font-medium bg-background hover:bg-accent hover:text-accent-foreground"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? "Carregando..." : "Escolher Imagem"}
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleFileChange}
                          disabled={isUploading}
                        />
                      </label>
                      {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
                    </div>
                    <FormDescription>
                      JPG, PNG ou GIF. Tamanho máx. 2MB
                    </FormDescription>
                  </div>
                </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
        </div>
              
        {/* Switches de configurações */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
            name="available"
                  render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md shadow-sm">
                <div>
                  <FormLabel>Disponível</FormLabel>
                  <FormDescription>Produto disponível para venda</FormDescription>
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
            name="isFeatured"
                  render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md shadow-sm">
                <div>
                  <FormLabel>Destaque</FormLabel>
                  <FormDescription>Exibir na página inicial</FormDescription>
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
              <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md shadow-sm">
                <div>
                  <FormLabel>Promoção</FormLabel>
                  <FormDescription>Marcar como produto em promoção</FormDescription>
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
                  type="submit"
            disabled={isSubmitting || isUploading}
            className="w-full sm:w-auto"
                >
            {isSubmitting || isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Salvando...
              </>
            ) : (
              "Salvar Produto"
            )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
  );

  return (
    <div className="container mx-auto py-8 space-y-8 px-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
              </div>
              
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
              placeholder="Buscar produtos..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
          {productsLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
          ) : !products || products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 space-y-4 py-10">
              <div className="text-muted-foreground text-center">
                <p className="text-lg mb-2">Nenhum produto cadastrado</p>
                <p className="text-sm mb-6">Comece adicionando seu primeiro produto ao catálogo</p>
                      </div>
              <Button onClick={openCreateDialog} className="px-6">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Imagem</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts?.map((product) => (
                    <TableRow key={product.id.toString()}>
                      <TableCell>
                        <Avatar className="w-12 h-12">
                          {product.imageUrl ? (
                            <AvatarImage src={product.imageUrl} alt={product.name} />
                          ) : null}
                          <AvatarFallback className="bg-muted">
                            {product.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                      <TableCell>
                        {formatCurrency(product.price)}
                        {product.oldPrice && (
                          <span className="ml-2 text-muted-foreground line-through text-xs">
                            {formatCurrency(product.oldPrice)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.available ? (
                            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                              Disponível
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
                              Indisponível
                            </Badge>
                          )}
                          {product.isFeatured && (
                            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                              Destaque
                            </Badge>
                          )}
                          {product.isPromotion && (
                            <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                              Promoção
                            </Badge>
                          )}
                      </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <div className="flex items-center justify-center border rounded-md w-8 h-8">
                        <Switch
                              checked={product.available}
                              className="scale-75"
                              onCheckedChange={() => handleToggleAvailability(product)}
                />
              </div>
                <Button 
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(product)}
                >
                            <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
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
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar produto */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Produto</DialogTitle>
            <DialogDescription>
              Adicione um novo produto ao catálogo
            </DialogDescription>
          </DialogHeader>

          {renderProductForm(
            handleCreateProduct,
            createProductMutation.isPending
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para editar produto */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Atualize as informações do produto
            </DialogDescription>
          </DialogHeader>

          {currentProduct &&
            renderProductForm(
              handleEditProduct,
              updateProductMutation.isPending
            )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog para confirmar exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Produto</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O produto será permanentemente
              removido do sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2">
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
              {deleteProductMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir Produto"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;

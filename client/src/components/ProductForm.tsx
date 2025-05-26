import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createProduct, getCategories } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Product } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  price: z.number().min(0, "Preço deve ser maior que zero"),
  old_price: z.number().min(0, "Preço antigo deve ser maior que zero").optional(),
  category_id: z.string().min(1, "Selecione uma categoria"),
  available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_promotion: z.boolean().default(false),
  image_url: z.string().url("URL inválida").optional(),
});

type FormData = z.infer<typeof formSchema>;

const defaultProduct: Omit<Product, 'id'> = {
  name: '',
  description: '',
  price: 0,
  old_price: 0,
  category_id: '',
  available: true,
  is_featured: false,
  is_promotion: false,
  image_url: ''
};

export default function ProductForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultProduct,
  });

  // Buscar categorias
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  async function onSubmit(data: FormData) {
    try {
      // Converter para camelCase antes de enviar
      const productData = {
        name: data.name,
        description: data.description || '',
        price: data.price,
        oldPrice: data.old_price,
        imageUrl: data.image_url || '',
        categoryId: data.category_id,
        isFeatured: data.is_featured,
        isPromotion: data.is_promotion,
        available: data.available
      };

      await createProduct(productData);
      
      toast({
        title: "Produto criado",
        description: "O produto foi criado com sucesso!",
      });

      // Limpar formulário
      form.reset(defaultProduct);
      
      // Atualizar lista de produtos
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o produto. Tente novamente.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Produto</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
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
                    <FormLabel>Preço</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="old_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Antigo</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Imagem</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2">
              <FormField
                control={form.control}
                name="available"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Disponível</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Em Destaque</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_promotion"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Em Promoção</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full">
              Criar Produto
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 
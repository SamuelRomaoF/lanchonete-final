import fs from 'fs';
import path from 'path';
import { Category, Product } from '../shared/schema';

// Definir caminhos para armazenamento
const dataDir = path.resolve(process.cwd(), 'server', 'data');
const CATEGORIES_FILE = path.resolve(dataDir, 'categories.json');
const PRODUCTS_FILE = path.resolve(dataDir, 'products.json');

// Cria o diretório de dados se não existir
function ensureDataDirectory() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Diretório de dados criado em: ${dataDir}`);
  }
}

// --------- Funções para Categorias ---------

// Carregar categorias do arquivo
export function loadCategories(): Category[] {
  ensureDataDirectory();
  
  try {
    if (fs.existsSync(CATEGORIES_FILE)) {
      console.log(`Carregando categorias do arquivo: ${CATEGORIES_FILE}`);
      const data = fs.readFileSync(CATEGORIES_FILE, 'utf-8');
      return JSON.parse(data);
    } 
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  }
  
  // Retorna categorias padrão se o arquivo não existir
  const defaultCategories: Category[] = [
    { id: 1, name: 'Hambúrgueres', description: 'Hambúrgueres artesanais', imageUrl: '' },
    { id: 2, name: 'Lanches', description: 'Lanches diversos', imageUrl: '' },
    { id: 3, name: 'Bebidas', description: 'Refrigerantes e sucos', imageUrl: '' }
  ];
  
  // Salvar categorias padrão em arquivo
  saveCategories(defaultCategories);
  
  return defaultCategories;
}

// Salvar categorias no arquivo
export function saveCategories(categories: Category[]): void {
  try {
    ensureDataDirectory();
    
    console.log(`Salvando ${categories.length} categorias no arquivo: ${CATEGORIES_FILE}`);
    
    // Formatar os dados como JSON
    const jsonData = JSON.stringify(categories, null, 2);
    
    fs.writeFileSync(CATEGORIES_FILE, jsonData);
    
    console.log('Categorias salvas com sucesso');
  } catch (error) {
    console.error('Erro ao salvar categorias:', error);
  }
}

// Criar categoria
export function createCategory(category: Omit<Category, 'id'>): Category {
  const categories = loadCategories();
  
  // Gerar novo ID (maior ID existente + 1)
  const newId = categories.length > 0 
    ? Math.max(...categories.map(c => c.id)) + 1 
    : 1;
  
  // Criar nova categoria
  const newCategory: Category = { ...category, id: newId };
  
  // Adicionar à lista e salvar
  categories.push(newCategory);
  saveCategories(categories);
  
  return newCategory;
}

// Atualizar categoria
export function updateCategory(id: number, data: Partial<Category>): Category | null {
  const categories = loadCategories();
  const index = categories.findIndex(c => c.id === id);
  
  if (index === -1) return null;
  
  // Atualizar categoria
  categories[index] = { ...categories[index], ...data };
  saveCategories(categories);
  
  return categories[index];
}

// Excluir categoria
export function deleteCategory(id: number): boolean {
  const categories = loadCategories();
  const initialLength = categories.length;
  
  const filteredCategories = categories.filter(c => c.id !== id);
  
  if (filteredCategories.length < initialLength) {
    saveCategories(filteredCategories);
    return true;
  }
  
  return false;
}

// --------- Funções para Produtos ---------

// Carregar produtos do arquivo
export function loadProducts(): Product[] {
  ensureDataDirectory();
  
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      console.log(`Carregando produtos do arquivo: ${PRODUCTS_FILE}`);
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
  }
  
  // Retorna produtos padrão se o arquivo não existir
  const defaultProducts: Product[] = [
    {
      id: 1,
      name: 'X-Tudo',
      description: 'Pão, hambúrguer, queijo, presunto, bacon, ovo, alface, tomate, milho, batata palha',
      price: 18.90,
      categoryId: 1,
      imageUrl: '',
      available: true,
      isFeatured: true,
      isPromotion: false,
      createdAt: new Date()
    },
    {
      id: 2,
      name: 'Coca-Cola',
      description: 'Refrigerante 350ml',
      price: 5.90,
      categoryId: 3,
      imageUrl: '',
      available: true,
      isFeatured: false,
      isPromotion: false,
      createdAt: new Date()
    }
  ];
  
  // Salvar produtos padrão em arquivo
  saveProducts(defaultProducts);
  
  return defaultProducts;
}

// Salvar produtos no arquivo
export function saveProducts(products: Product[]): void {
  try {
    ensureDataDirectory();
    
    console.log(`Salvando ${products.length} produtos no arquivo: ${PRODUCTS_FILE}`);
    
    // Formatar os dados como JSON
    const jsonData = JSON.stringify(products, null, 2);
    
    fs.writeFileSync(PRODUCTS_FILE, jsonData);
    
    console.log('Produtos salvos com sucesso');
  } catch (error) {
    console.error('Erro ao salvar produtos:', error);
  }
}

// Criar produto
export function createProduct(product: Omit<Product, 'id'>): Product {
  const products = loadProducts();
  
  // Gerar novo ID (maior ID existente + 1)
  const newId = products.length > 0 
    ? Math.max(...products.map(p => p.id)) + 1 
    : 1;
  
  // Criar novo produto
  const newProduct: Product = { ...product, id: newId };
  
  // Adicionar à lista e salvar
  products.push(newProduct);
  saveProducts(products);
  
  return newProduct;
}

// Atualizar produto
export function updateProduct(id: number, data: Partial<Product>): Product | null {
  const products = loadProducts();
  const index = products.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  // Atualizar produto
  products[index] = { ...products[index], ...data };
  saveProducts(products);
  
  return products[index];
}

// Excluir produto
export function deleteProduct(id: number): boolean {
  const products = loadProducts();
  const initialLength = products.length;
  
  const filteredProducts = products.filter(p => p.id !== id);
  
  if (filteredProducts.length < initialLength) {
    saveProducts(filteredProducts);
    return true;
  }
  
  return false;
}

// Funções adicionais

// Obter produtos por categoria
export function getProductsByCategory(categoryId: number): Product[] {
  const products = loadProducts();
  return products.filter(p => p.categoryId === categoryId);
}

// Obter produtos em destaque
export function getFeaturedProducts(): Product[] {
  const products = loadProducts();
  return products.filter(p => p.isFeatured);
} 
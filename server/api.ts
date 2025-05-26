import cors from 'cors';
import express from 'express';
import { supabase } from './lib/supabase';

const router = express.Router();

// Configurar CORS
router.use(cors());

// Listar categorias
router.get('/categories', async (req, res) => {
  try {
    console.log('Buscando categorias...');
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      throw error;
    }

    console.log('Categorias encontradas:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('Erro ao processar requisição de categorias:', error);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

// Criar categoria
router.post('/categories', async (req, res) => {
  try {
    const { name } = req.body;
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// Atualizar categoria
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const { data, error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

// Excluir categoria
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    res.status(500).json({ error: 'Erro ao excluir categoria' });
  }
});

// Produtos em destaque
router.get('/products/featured', async (req, res) => {
  try {
    console.log('Buscando produtos em destaque...');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .order('name');

    if (error) {
      console.error('Erro ao buscar produtos em destaque:', error);
      throw error;
    }

    console.log('Produtos em destaque encontrados:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('Erro ao buscar produtos em destaque:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos em destaque' });
  }
});

// Produtos em promoção
router.get('/products/promotions', async (req, res) => {
  try {
    console.log('Buscando produtos em promoção...');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_promotion', true)
      .order('name');

    if (error) {
      console.error('Erro ao buscar produtos em promoção:', error);
      throw error;
    }

    console.log('Produtos em promoção encontrados:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('Erro ao buscar produtos em promoção:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos em promoção' });
  }
});

// Produtos por categoria
router.get('/products/category/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Buscando produtos da categoria ${id}...`);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', id)
      .order('name');

    if (error) {
      console.error(`Erro ao buscar produtos da categoria ${id}:`, error);
      throw error;
    }

    console.log(`Produtos encontrados na categoria ${id}:`, data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('Erro ao buscar produtos da categoria:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos da categoria' });
  }
});

// Verificar reset da fila
router.get('/queue/check-reset', async (req, res) => {
  try {
    const today = new Date().toDateString();
    const lastResetDate = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'last_queue_reset')
      .single();

    const shouldReset = !lastResetDate.data || lastResetDate.data.value !== today;

    if (shouldReset) {
      await supabase
        .from('system_settings')
        .upsert({ key: 'last_queue_reset', value: today });
    }

    res.json({ reset: shouldReset });
  } catch (error) {
    console.error('Erro ao verificar reset da fila:', error);
    res.status(500).json({ error: 'Erro ao verificar reset da fila' });
  }
});

// Sincronizar fila
router.post('/queue/sync', async (req, res) => {
  try {
    const { orders } = req.body;
    
    // Salvar os pedidos no Supabase
    if (orders && Array.isArray(orders)) {
      const { error } = await supabase
        .from('orders')
        .upsert(orders.map(order => ({
          ...order,
          updated_at: new Date().toISOString()
        })));

      if (error) throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao sincronizar fila:', error);
    res.status(500).json({ error: 'Erro ao sincronizar fila' });
  }
});

// Obter fila
router.get('/queue', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ orders: data || [] });
  } catch (error) {
    console.error('Erro ao obter fila:', error);
    res.status(500).json({ error: 'Erro ao obter fila' });
  }
});

// Limpar fila
router.post('/queue/clear', async (req, res) => {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString());

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao limpar fila:', error);
    res.status(500).json({ error: 'Erro ao limpar fila' });
  }
});

export default router; 
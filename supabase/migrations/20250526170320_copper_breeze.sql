/*
  # Initial schema setup
  
  1. New Tables
    - categories (id, name, slug, created_at)
    - products (id, name, description, price, image_url, category_id, is_popular, is_special_offer, created_at)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for anonymous read access
  
  3. Sample Data
    - Insert basic categories
    - Insert sample products
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  category_id uuid REFERENCES categories(id),
  is_popular boolean DEFAULT false,
  is_special_offer boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous read access (with safety checks)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'Allow anonymous read access for categories'
  ) THEN
    CREATE POLICY "Allow anonymous read access for categories"
      ON categories
      FOR SELECT
      TO anon
      USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Allow anonymous read access for products'
  ) THEN
    CREATE POLICY "Allow anonymous read access for products"
      ON products
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- Insert sample categories
INSERT INTO categories (name, slug) VALUES
  ('Lanches', 'lanches'),
  ('Bebidas', 'bebidas'),
  ('Porções', 'porcoes'),
  ('Sobremesas', 'sobremesas')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, category_id, is_popular, is_special_offer, image_url) VALUES
  ('X-Burger', 'Hambúrguer artesanal, queijo, alface, tomate e maionese especial', 18.90, (SELECT id FROM categories WHERE slug = 'lanches'), true, false, 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg'),
  ('X-Bacon', 'Hambúrguer artesanal, queijo, bacon crocante, alface, tomate e maionese especial', 22.90, (SELECT id FROM categories WHERE slug = 'lanches'), true, false, 'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg'),
  ('Batata Frita', 'Porção de batata frita crocante', 12.90, (SELECT id FROM categories WHERE slug = 'porcoes'), false, false, 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg'),
  ('Refrigerante Lata', 'Lata 350ml', 5.90, (SELECT id FROM categories WHERE slug = 'bebidas'), false, false, 'https://images.pexels.com/photos/2983100/pexels-photo-2983100.jpeg'),
  ('Milk Shake', 'Milk shake cremoso de chocolate, morango ou baunilha', 15.90, (SELECT id FROM categories WHERE slug = 'bebidas'), false, false, 'https://images.pexels.com/photos/3727250/pexels-photo-3727250.jpeg'),
  ('Combo Manhã', 'Café + pão na chapa', 8.90, (SELECT id FROM categories WHERE slug = 'lanches'), false, true, 'https://images.pexels.com/photos/5871434/pexels-photo-5871434.jpeg'),
  ('Combo Estudante', 'Hambúrguer + batata + refrigerante', 25.90, (SELECT id FROM categories WHERE slug = 'lanches'), false, true, 'https://images.pexels.com/photos/2983098/pexels-photo-2983098.jpeg'),
  ('Açaí', 'Tigela de açaí com granola, banana e leite condensado', 18.90, (SELECT id FROM categories WHERE slug = 'sobremesas'), true, false, 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg');
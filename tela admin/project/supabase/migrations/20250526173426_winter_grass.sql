/*
  # Create products table

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text, optional)
      - `price` (numeric, not null)
      - `old_price` (numeric, optional)
      - `image_url` (text, optional)
      - `category_id` (uuid, foreign key to categories.id)
      - `is_available` (boolean, defaults to true)
      - `is_featured` (boolean, defaults to false)
      - `is_promotion` (boolean, defaults to false)
      - `created_at` (timestamp with time zone)

  2. Foreign Keys
    - Link products to categories

  3. Security
    - Enable RLS on `products` table
    - Add policy for authenticated users to perform all operations
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  old_price numeric,
  image_url text,
  category_id uuid NOT NULL REFERENCES categories(id),
  is_available boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  is_promotion boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_id_idx ON products(category_id);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
  ON products
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
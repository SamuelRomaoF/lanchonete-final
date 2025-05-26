/*
  # Create orders and order_items tables

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `customer_name` (text, not null)
      - `customer_email` (text, optional)
      - `status` (text, defaults to 'pending')
      - `total` (numeric, not null)
      - `created_at` (timestamp with time zone)

    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders.id)
      - `product_id` (uuid, foreign key to products.id)
      - `quantity` (integer, not null)
      - `price` (numeric, not null)

  2. Foreign Keys
    - Link order_items to orders and products

  3. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to perform all operations
*/

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text,
  status text NOT NULL DEFAULT 'pending',
  total numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL,
  price numeric NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON order_items(product_id);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Allow all operations on orders for authenticated users"
  ON orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on order_items for authenticated users"
  ON order_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
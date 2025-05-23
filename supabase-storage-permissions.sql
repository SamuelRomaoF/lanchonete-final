-- Conceder permissões para usuários autenticados criarem buckets
CREATE POLICY "Permitir usuários autenticados gerenciar buckets" ON storage.buckets
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Criar o bucket product-images (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Conceder permissões para usuários autenticados fazerem upload/download/delete de arquivos
CREATE POLICY "Permitir usuários autenticados upload de arquivos" ON storage.objects
  FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Permitir usuários autenticados gerenciar seus arquivos" ON storage.objects
  FOR ALL 
  TO authenticated 
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

-- Permitir acesso anônimo para download (leitura) de arquivos
CREATE POLICY "Permitir acesso público para leitura de arquivos" ON storage.objects
  FOR SELECT 
  TO anon 
  USING (bucket_id = 'product-images');

-- Configurar o objeto de armazenamento para herdar políticas do bucket
UPDATE storage.buckets SET public = true WHERE id = 'product-images'; 
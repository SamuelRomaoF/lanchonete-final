import { useSupabase } from './supabase-provider';

export const useSupabaseStorage = () => {
  const { supabase } = useSupabase();
  
  const uploadImage = async (file: File, bucket: string, folder: string): Promise<string | null> => {
    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;
      
      // Upload file
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };
  
  const deleteImage = async (url: string, bucket: string): Promise<boolean> => {
    try {
      // Extract file path from URL
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/');
      const filePath = pathSegments.slice(pathSegments.indexOf(bucket) + 1).join('/');
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  };
  
  return {
    uploadImage,
    deleteImage
  };
};
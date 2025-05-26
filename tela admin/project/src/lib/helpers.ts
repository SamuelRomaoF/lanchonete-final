import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Format currency
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Format date
export const formatDate = (dateString: string, formatStr: string = 'dd/MM/yyyy'): string => {
  return format(new Date(dateString), formatStr, { locale: ptBR });
};

// Format relative time
export const formatRelativeTime = (dateString: string): string => {
  return formatDistanceToNow(new Date(dateString), { 
    addSuffix: true,
    locale: ptBR 
  });
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Check if file is an image
export const isImageFile = (file: File): boolean => {
  return ['image/jpeg', 'image/png', 'image/gif'].includes(file.type);
};

// Validate file size
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

// Generate random ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  type: 'cliente' | 'admin';
}

interface UseUserHookResult {
  profile: UserProfile | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useUser(): UseUserHookResult {
  const { user } = useAuth();
  
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery<UserProfile>({
    queryKey: user ? ['/api/users', user.id] : null,
    enabled: !!user,
  });
  
  return {
    profile: profile || null,
    isLoading,
    error,
    refetch,
  };
}

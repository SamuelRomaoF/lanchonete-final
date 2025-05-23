import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface UseUserHookResult {
  profile: UserProfile | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useUser(): UseUserHookResult {
  const { user } = useAuth();
  
  const query = useQuery<UserProfile>({
    queryKey: user ? ['/api/auth/me'] : [],
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  return {
    profile: query.data || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

import { useQuery } from '@tanstack/react-query'
import { getAdminMe } from '../api/admin'
import type { AdminUserDetail } from '../types'

export function useAdminMe() {
  return useQuery<AdminUserDetail>({
    queryKey: ['adminMe'],
    queryFn: getAdminMe,
    staleTime: 5 * 60 * 1000,
  })
}

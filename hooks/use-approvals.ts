import { useQuery } from "@tanstack/react-query";
import { dbGetApprovals, type ApiApproval } from "@/services/approvals.service";

export function useApprovals(projectId?: string) {
  return useQuery<ApiApproval[]>({
    queryKey: ["approvals", projectId],
    queryFn: async () => {
      const result = await dbGetApprovals(projectId!);
      if (result.error) throw new Error(result.error);
      return result.data ?? [];
    },
    enabled: !!projectId,
  });
}

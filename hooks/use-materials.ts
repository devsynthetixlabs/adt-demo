import { useQuery } from "@tanstack/react-query";
import { dbGetMaterials, type ApiMaterial } from "@/services/materials.service";

export function useMaterials(projectId?: string) {
  return useQuery<ApiMaterial[]>({
    queryKey: ["materials", projectId],
    queryFn: async () => {
      const result = await dbGetMaterials(projectId!);
      if (result.error) throw new Error(result.error);
      return result.data ?? [];
    },
    enabled: !!projectId,
  });
}

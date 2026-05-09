import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbFetchProjects, dbCreateProject } from "@/services/project.service";
import type { ProjectFields } from "@/services/project.service";

export function useProjects(orgId?: string) {
  return useQuery({
    queryKey: ["projects"],
    queryFn: dbFetchProjects,
    enabled: !!orgId,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { fields: ProjectFields; orgId: string; userId: string }) =>
      dbCreateProject(params.fields, params.orgId, params.userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

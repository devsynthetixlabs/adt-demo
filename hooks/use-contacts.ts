import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadProjectContacts, saveProjectContacts } from "@/services/project-contacts.service";

interface AssigneeProfile {
  color: string;
  phone: string;
  email: string;
  role: string;
  designation: string;
  visibility: string[];
  loginStatus?: "invited" | "active" | "pending";
}

export function useContacts(projectId?: string) {
  return useQuery({
    queryKey: ["contacts", projectId],
    queryFn: () => loadProjectContacts(projectId!),
    enabled: !!projectId,
  });
}

export function useSaveContacts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      projectId: string;
      profiles: Record<string, AssigneeProfile>;
    }) => saveProjectContacts(params.projectId, params.profiles),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["contacts", variables.projectId] });
    },
  });
}

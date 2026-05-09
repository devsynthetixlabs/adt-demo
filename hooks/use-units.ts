import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbFetchUnitsWithRooms, dbCreateUnit, dbCreateRoom } from "@/services/project.service";

export function useUnits(projectId?: string) {
  return useQuery({
    queryKey: ["units", projectId],
    queryFn: () => dbFetchUnitsWithRooms(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { projectId: string; name: string }) =>
      dbCreateUnit(params.projectId, params.name),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["units", variables.projectId] });
    },
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { projectId: string; unitName: string; roomName: string }) =>
      dbCreateRoom(params.projectId, params.unitName, params.roomName),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["units", variables.projectId] });
    },
  });
}

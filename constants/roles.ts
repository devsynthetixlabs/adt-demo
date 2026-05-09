// DB check constraint values for organization_members.role and invitations.role
export const TEAM_ROLES = [
  { value: "architect",      label: "Architect"       },
  { value: "site_supervisor", label: "Site Supervisor" },
  { value: "contractor",     label: "Contractor"      },
  { value: "mep_consultant", label: "MEP Consultant"  },
  { value: "vendor",         label: "Vendor"          },
] as const;

export type TeamRoleValue = typeof TEAM_ROLES[number]["value"];

export function roleLabel(value: string): string {
  return TEAM_ROLES.find((r) => r.value === value)?.label ?? value;
}

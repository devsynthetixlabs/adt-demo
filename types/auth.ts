export type AuthMode = "signup" | "signin";

export type AuthMethod = "email" | "phone";

export type Role = "owner" | "architect" | "contractor";

export const ROLE_OPTIONS: { key: Role; name: string; desc: string }[] = [
  {
    key: "owner",
    name: "Owner",
    desc: "I run the firm & will create the workspace.",
  },
  {
    key: "architect",
    name: "Architect / ID",
    desc: "I plan projects & manage the team.",
  },
  {
    key: "contractor",
    name: "Contractor",
    desc: "I run trades on site & join by invite.",
  },
];

export interface TabItem<T extends string = string> {
  key: T;
  label: string;
}

export interface BaseProps {
  className?: string;
}

export interface ButtonVariantProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export interface InputVariantProps {
  variant?: "default" | "outlined";
  prefix?: string;
  suffix?: React.ReactNode;
  error?: string;
}

export interface LabelProps {
  required?: boolean;
  hint?: string;
}

export interface PasswordStrengthLevel {
  level: number;
  label: string;
  color: string;
}

export interface RoleOption {
  key: string;
  name: string;
  desc: string;
}

export interface OAuthConfig {
  provider: "google";
  label: string;
}

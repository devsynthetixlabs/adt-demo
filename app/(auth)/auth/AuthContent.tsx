"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  PasswordStrength,
  Tabs,
  Divider,
} from "@/components/Elements";
import {
  AuthMode,
  AuthMethod,
  Role,
  TabItem,
  ROLE_OPTIONS,
} from "@/types";
import { signupUser, signinUser, sendPhoneOTP, verifyPhoneOTP } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

const authModeTabs: TabItem<AuthMode>[] = [
  { key: "signup", label: "Create account" },
  { key: "signin", label: "Sign in" },
];

const signupAuthTabs: TabItem<AuthMethod>[] = [
  { key: "email", label: "Email & password" },
  { key: "phone", label: "Phone OTP" },
];

const signinAuthTabs: TabItem<AuthMethod>[] = [
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone OTP" },
];

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");

  useEffect(() => {
    const param = searchParams.get("mode");
    if (param === "signup") setMode("signup");
    setError("");
    setSuccessMessage("");
  }, [searchParams]);

  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [role, setRole] = useState<Role>("owner");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [firmName, setFirmName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    const result = await signupUser({
      fullName,
      email,
      password,
      phone: authMethod === "phone" ? phone : undefined,
      role,
      firmName: role === "contractor" ? undefined : firmName,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Signup failed.");
      return;
    }
    setFullName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setFirmName("");
    setSuccessMessage("Account created successfully. Please log in to continue.");
    setMode("signin");
  }

  async function onSignin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signinUser(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Sign in failed.");
      return;
    }
    const redirect = searchParams.get("redirect");
    router.push(redirect || "/dashboard");
  }

  return (
    <div className="min-h-screen lg:min-h-0 lg:h-screen flex flex-col lg:flex-row">
      {/* LEFT: BRAND PANEL (desktop only, fixed height) */}
      <aside className="hidden lg:flex relative h-full basis-[51%] bg-gradient-to-b from-[#2C2420] via-[#3a302b] to-[#4a3e37] text-white p-12 flex-col justify-between overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(900px 600px at 110% 10%, rgba(232,96,28,0.18), transparent 60%), radial-gradient(700px 500px at -10% 100%, rgba(232,96,28,0.10), transparent 60%)",
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <div className="font-serif text-2xl font-semibold tracking-[0.08em] text-orange">
            ANANTAM<span className="text-white font-light"> · SITE</span>
          </div>
          <a
            href="#"
            className="text-sm text-white/62 hover:text-white transition-colors tracking-[0.04em]"
            onClick={(e) => e.preventDefault()}
          >
            ← anantam.com
          </a>
        </div>

        <div className="relative z-10 max-w-[460px] my-10 lg:my-0">
          <div className="text-[0.7rem] tracking-[0.18em] uppercase text-orange-light mb-5">
            Site management, on the ground.
          </div>
          <h1 className="font-serif font-normal text-[clamp(2rem,3.4vw,3rem)] leading-[1.1] tracking-[-0.005em] mb-5">
            Run every site like
            <br />
            your <em className="not-italic font-light text-orange-light">best one.</em>
          </h1>
          <p className="text-[0.95rem] text-white/72 leading-[1.6] max-w-[38ch]">
            Built for architecture practices, real-estate developers, and the
            contractors. The app keeps task sheets, drawings, snags, and
            approvals in one place, from the studio to the slab.
          </p>

          <ul className="mt-8 grid gap-[0.85rem] list-none">
            {[
              {
                text: (
                  <>
                    <strong>Task sheets per unit, per room.</strong> Assign
                    trades, set dates, push WhatsApp reminders without leaving
                    the app.
                  </>
                ),
              },
              {
                text: (
                  <>
                    <strong>Snag lists, material schedule & approvals</strong>{" "}
                    tracked alongside drawings — so nothing falls between the
                    studio and the site.
                  </>
                ),
              },
              {
                text: (
                  <>
                    <strong>Roles that respect reality.</strong> Architects plan,
                    contractors update, clients sign off — all from the same
                    source of truth.
                  </>
                ),
              },
            ].map((item, i) => (
              <li
                key={i}
                className="flex gap-3 items-start text-[0.86rem] text-white/85"
              >
                <span className="w-[22px] h-[22px] flex-shrink-0 rounded-full border border-orange/45 text-orange-light grid place-items-center text-[0.7rem] mt-[1px]">
                  ✦
                </span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex gap-9 flex-wrap pt-8 border-t border-white/[0.08]">
          <div>
            <div className="font-serif text-[1.7rem] font-semibold text-orange-light leading-[1]">
              30 days
            </div>
            <div className="text-[0.7rem] tracking-[0.08em] uppercase text-white/55 mt-1">
              Free, no card required
            </div>
          </div>
          <div>
            <div className="font-serif text-[1.7rem] font-semibold text-orange-light leading-[1]">
              ∞
            </div>
            <div className="text-[0.7rem] tracking-[0.08em] uppercase text-white/55 mt-1">
              Projects & trades
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT: FORM PANEL */}
      <main className="flex flex-col bg-offwhite flex-1 min-h-screen lg:min-h-0 lg:h-screen overflow-y-auto">
        <div className="flex justify-end px-6 sm:px-10 pt-8 text-[0.82rem] text-ink-soft">
          <span>
            {mode === "signup"
              ? "Already have an account?"
              : "Don't have an account?"}
          </span>
          <button
            type="button"
            className="text-orange font-medium ml-1 hover:underline touch-manipulation"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          >
            {mode === "signup" ? "Sign in" : "Create account"}
          </button>
        </div>

        <div className="flex-1 px-6 sm:px-10 pb-12">
          <div className="w-full max-w-[460px] mx-auto pt-10">
            <Tabs
              tabs={authModeTabs}
              value={mode}
              onChange={setMode}
              variant="pill"
            />

            <div className="mt-10">
              {error && (
                <div className="mb-6 p-3 bg-[#FDECEA] border border-[#F5C6CB] rounded-lg text-[0.82rem] text-[#721C24]">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="mb-6 p-3 bg-[#E8F5EE] border border-[#A0CEB5] rounded-lg text-[0.82rem] text-[#2A6045]">
                  ✓ {successMessage}
                </div>
              )}

              {/* ════════ SIGN UP VIEW ════════ */}
              {mode === "signup" && (
                <section>
                  <TrialBadge />

                  <h2 className="font-serif text-[2.1rem] font-medium leading-[1.15] text-ink tracking-[-0.005em] mb-2">
                    Get your studio
                    <br />
                    set up in minutes.
                  </h2>
                  <p className="text-[0.88rem] text-ink-soft mb-8 leading-[1.6]">
                    For architects, designers, and contractors running residential
                    and commercial sites.
                  </p>

                  <OAuthButtons
                    onPhoneClick={() => setAuthMethod("phone")}
                  />

                  <Divider text="or with your work email" />

                  <Tabs tabs={signupAuthTabs} value={authMethod} onChange={setAuthMethod} />

                  {authMethod === "email" && (
                    <SignupEmailForm
                      fullName={fullName}
                      onFullNameChange={setFullName}
                      email={email}
                      onEmailChange={setEmail}
                      password={password}
                      onPasswordChange={setPassword}
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                      role={role}
                      onRoleChange={setRole}
                      firmName={firmName}
                      onFirmNameChange={setFirmName}
                      onSubmit={onSignup}
                      loading={loading}
                    />
                  )}

                  {authMethod === "phone" && (
                    <SignupPhoneForm
                      fullName={fullName}
                      onFullNameChange={setFullName}
                      phone={phone}
                      onPhoneChange={setPhone}
                      role={role}
                      onRoleChange={setRole}
                      firmName={firmName}
                      onFirmNameChange={setFirmName}
                      setError={setError}
                    />
                  )}
                </section>
              )}

              {/* ════════ SIGN IN VIEW ════════ */}
              {mode === "signin" && (
                <section>
                  <h2 className="font-serif text-[2.1rem] font-medium leading-[1.15] text-ink tracking-[-0.005em] mb-2">
                    Welcome back.
                  </h2>
                  <p className="text-[0.88rem] text-ink-soft mb-8 leading-[1.6]">
                    Sign in to your workspace.
                  </p>

                  <OAuthButtons
                    onPhoneClick={() => setAuthMethod("phone")}
                  />

                  <Divider text="or" />

                  <Tabs tabs={signinAuthTabs} value={authMethod} onChange={setAuthMethod} />

                  {authMethod === "email" && (
                    <SigninEmailForm
                      email={email}
                      onEmailChange={setEmail}
                      password={password}
                      onPasswordChange={setPassword}
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                      onSubmit={onSignin}
                      loading={loading}
                    />
                  )}

                  {authMethod === "phone" && (
                    <SigninPhoneForm
                      phone={phone}
                      onPhoneChange={setPhone}
                      setError={setError}
                    />
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── Trial Badge ─── */
function TrialBadge() {
  return (
    <div className="inline-flex items-center gap-[0.45rem] bg-orange-xpale text-orange-dark border border-orange-pale px-[0.7rem] py-[0.3rem] rounded-full text-[0.72rem] font-medium tracking-[0.02em] mb-6">
      <span className="w-[6px] h-[6px] bg-orange rounded-full" />
      30-day free trial · No card required
    </div>
  );
}

/* ─── Signup Email Form ─── */
function SignupEmailForm({
  fullName,
  onFullNameChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  showPassword,
  onTogglePassword,
  role,
  onRoleChange,
  firmName,
  onFirmNameChange,
  onSubmit,
  loading,
}: {
  fullName: string;
  onFullNameChange: (v: string) => void;
  email: string;
  onEmailChange: (v: string) => void;
  password: string;
  onPasswordChange: (v: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  role: Role;
  onRoleChange: (v: Role) => void;
  firmName: string;
  onFirmNameChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-6">
      <Label>Full name</Label>
      <Input
        type="text"
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => onFullNameChange(e.target.value)}
        className="mb-6"
        required
      />

      <Label>Work email</Label>
      <Input
        type="email"
        placeholder="you@studio.com"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        className="mb-6"
        required
      />

      <Label>Password</Label>
      <Input
        type={showPassword ? "text" : "password"}
        placeholder="Min. 8 characters"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        suffix={
          <button
            type="button"
            className="bg-transparent border-none text-muted cursor-pointer py-1 px-2 text-[0.78rem] font-medium hover:text-orange"
            onClick={onTogglePassword}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        }
        className="mb-2"
        required
      />
      <PasswordStrength password={password} />
      <div className="h-6" />

      <Label className="mb-2">I'm joining as</Label>
      <RoleSelector value={role} onChange={onRoleChange} />
      <div className="h-6" />

      {(role === "owner" || role === "architect") && (
        <>
          <Label>Firm / company name</Label>
          <Input
            type="text"
            placeholder="Anantam Designs"
            value={firmName}
            onChange={(e) => onFirmNameChange(e.target.value)}
            className="mb-6"
          />
        </>
      )}

      {role === "contractor" && (
        <>
          <Label hint="(optional — you can join later from your inbox)">
            Invite code
          </Label>
          <Input
            type="text"
            placeholder="ANTM-XXXX-XXXX"
            className="mb-6"
          />
        </>
      )}

      <Button variant="primary" size="lg" fullWidth type="submit" disabled={loading}>
        {loading
          ? "Creating account..."
          : role === "owner"
          ? "Create workspace & start trial"
          : role === "architect"
          ? "Create account & start trial"
          : "Create account & continue"}
      </Button>

      <p className="mt-6 text-[0.72rem] text-muted text-center leading-[1.6]">
        By creating an account you agree to our{" "}
        <a
          href="#"
          className="text-ink-soft underline underline-offset-2 hover:text-orange"
          onClick={(e) => e.preventDefault()}
        >
          Terms
        </a>{" "}
        and{" "}
        <a
          href="#"
          className="text-ink-soft underline underline-offset-2 hover:text-orange"
          onClick={(e) => e.preventDefault()}
        >
          Privacy policy
        </a>
        .
      </p>
    </form>
  );
}

/* ─── Signup Phone Form ─── */
function SignupPhoneForm({
  fullName,
  onFullNameChange,
  phone,
  onPhoneChange,
  role,
  onRoleChange,
  firmName,
  onFirmNameChange,
  setError,
}: {
  fullName: string;
  onFullNameChange: (v: string) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
  role: Role;
  onRoleChange: (v: Role) => void;
  firmName: string;
  onFirmNameChange: (v: string) => void;
  setError: (v: string) => void;
}) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLocalLoading(true);
    const result = await sendPhoneOTP(phone);
    setLocalLoading(false);
    if (!result.success) {
      setError(result.error || "Failed to send OTP.");
      return;
    }
    setStep("otp");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLocalLoading(true);
    const result = await verifyPhoneOTP(phone, otp, { fullName, role, firmName: role === "contractor" ? undefined : firmName });
    setLocalLoading(false);
    if (!result.success) {
      setError(result.error || "Invalid code.");
      return;
    }
    window.location.href = "/dashboard";
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleVerify} className="mt-6">
        <div className="mb-6 p-3 bg-[#E8F5EE] border border-[#A0CEB5] rounded-lg text-[0.82rem] text-[#2A6045]">
          ✓ OTP sent to +91 {phone}
        </div>
        <Label>6-digit verification code</Label>
        <Input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="mb-6"
          required
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="flex-1 bg-[#F7F5F2] text-[#5C4F48] border-[1.5px] border-[#E2DAD1] rounded-lg py-3 text-[0.85rem] font-medium cursor-pointer transition-all hover:bg-[#EEE9E3]"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={localLoading}
            className="flex-1 bg-[#E8601C] text-white rounded-lg py-3 text-[0.85rem] font-medium cursor-pointer transition-all hover:bg-[#C04E12] disabled:opacity-50"
          >
            {localLoading ? "Verifying..." : "Verify & Create Account"}
          </button>
        </div>
        <p className="mt-6 text-[0.72rem] text-muted text-center leading-[1.6]">
          Didn't receive the code?{" "}
          <button
            type="button"
            onClick={handleSendOTP}
            className="text-orange hover:underline cursor-pointer"
          >
            Resend
          </button>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendOTP} className="mt-6">
      <Label>Full name</Label>
      <Input
        type="text"
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => onFullNameChange(e.target.value)}
        className="mb-6"
        required
      />

      <Label>Mobile number</Label>
      <Input
        type="tel"
        inputMode="numeric"
        maxLength={10}
        placeholder="98765 43210"
        prefix="+91"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        className="mb-6"
        required
      />

      <Label className="mb-2">I'm joining as</Label>
      <RoleSelector value={role} onChange={onRoleChange} />
      <div className="h-6" />

      {(role === "owner" || role === "architect") && (
        <>
          <Label>Firm / company name</Label>
          <Input
            type="text"
            placeholder="Anantam Designs"
            value={firmName}
            onChange={(e) => onFirmNameChange(e.target.value)}
            className="mb-6"
          />
        </>
      )}

      {role === "contractor" && (
        <>
          <Label hint="(optional — you can join later from your inbox)">
            Invite code
          </Label>
          <Input
            type="text"
            placeholder="ANTM-XXXX-XXXX"
            className="mb-6"
          />
        </>
      )}

      <button
        type="submit"
        disabled={localLoading}
        className="w-full bg-[#E8601C] text-white border-none rounded-lg py-3 text-[0.85rem] font-medium cursor-pointer transition-all hover:bg-[#C04E12] disabled:opacity-50"
      >
        {localLoading ? "Sending OTP..." : "Continue with Phone"}
      </button>

      <p className="mt-6 text-[0.72rem] text-muted text-center leading-[1.6]">
        We'll text a 6-digit code to verify your number. Standard SMS rates may
        apply. By creating an account you agree to our{" "}
        <a
          href="#"
          className="text-ink-soft underline underline-offset-2 hover:text-orange"
          onClick={(e) => e.preventDefault()}
        >
          Terms
        </a>{" "}
        and{" "}
        <a
          href="#"
          className="text-ink-soft underline underline-offset-2 hover:text-orange"
          onClick={(e) => e.preventDefault()}
        >
          Privacy policy
        </a>
        .
      </p>
    </form>
  );
}

/* ─── Signin Email Form ─── */
function SigninEmailForm({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  showPassword,
  onTogglePassword,
  onSubmit,
  loading,
}: {
  email: string;
  onEmailChange: (v: string) => void;
  password: string;
  onPasswordChange: (v: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-6">
      <Label>Work email</Label>
      <Input
        type="email"
        placeholder="you@studio.com"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        className="mb-6"
        required
      />

      <Label>Password</Label>
      <Input
        type={showPassword ? "text" : "password"}
        placeholder="••••••••"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        suffix={
          <button
            type="button"
            className="bg-transparent border-none text-muted cursor-pointer py-1 px-2 text-[0.78rem] font-medium hover:text-orange"
            onClick={onTogglePassword}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        }
        className="mb-6"
        required
      />

      <div className="text-right -mt-4 mb-6 text-[0.78rem]">
        <a
          href="#"
          className="text-orange no-underline cursor-pointer hover:underline"
          onClick={(e) => e.preventDefault()}
        >
          Forgot password?
        </a>
      </div>

      <Button variant="primary" size="lg" fullWidth type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

/* ─── Signin Phone Form ─── */
function SigninPhoneForm({
  phone,
  onPhoneChange,
  setError,
}: {
  phone: string;
  onPhoneChange: (v: string) => void;
  setError: (v: string) => void;
}) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLocalLoading(true);
    const result = await sendPhoneOTP(phone);
    setLocalLoading(false);
    if (!result.success) {
      setError(result.error || "Failed to send OTP.");
      return;
    }
    setStep("otp");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLocalLoading(true);
    const result = await verifyPhoneOTP(phone, otp);
    setLocalLoading(false);
    if (!result.success) {
      setError(result.error || "Invalid code.");
      return;
    }
    window.location.href = "/dashboard";
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleVerify} className="mt-6">
        <div className="mb-6 p-3 bg-[#E8F5EE] border border-[#A0CEB5] rounded-lg text-[0.82rem] text-[#2A6045]">
          ✓ OTP sent to +91 {phone}
        </div>
        <Label>6-digit verification code</Label>
        <Input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="mb-6"
          required
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="flex-1 bg-[#F7F5F2] text-[#5C4F48] border-[1.5px] border-[#E2DAD1] rounded-lg py-3 text-[0.85rem] font-medium cursor-pointer transition-all hover:bg-[#EEE9E3]"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={localLoading}
            className="flex-1 bg-[#E8601C] text-white rounded-lg py-3 text-[0.85rem] font-medium cursor-pointer transition-all hover:bg-[#C04E12] disabled:opacity-50"
          >
            {localLoading ? "Signing in..." : "Verify & Sign In"}
          </button>
        </div>
        <p className="mt-6 text-[0.72rem] text-muted text-center leading-[1.6]">
          Didn't receive the code?{" "}
          <button
            type="button"
            onClick={handleSendOTP}
            className="text-orange hover:underline cursor-pointer"
          >
            Resend
          </button>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendOTP} className="mt-6">
      <Label>Mobile number</Label>
      <Input
        type="tel"
        inputMode="numeric"
        maxLength={10}
        placeholder="98765 43210"
        prefix="+91"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        className="mb-6"
        required
      />
      <button
        type="submit"
        disabled={localLoading}
        className="w-full bg-[#E8601C] text-white border-none rounded-lg py-3 text-[0.85rem] font-medium cursor-pointer transition-all hover:bg-[#C04E12] disabled:opacity-50"
      >
        {localLoading ? "Sending OTP..." : "Send OTP"}
      </button>
    </form>
  );
}

/* ─── OAuth Buttons ─── */
function OAuthButtons({
  onPhoneClick,
}: {
  onPhoneClick: () => void;
}) {
  // TODO: Re-enable Google OAuth after fixing profile trigger
  return (
    <div className="grid grid-cols-2 gap-[0.6rem] mb-6">
      <button
        type="button"
        disabled
        className="flex items-center justify-center gap-[0.55rem] py-3 bg-white border-[1.5px] border-offwhite-dark rounded-lg text-[0.85rem] font-medium text-ink/40 cursor-not-allowed"
      >
        <GoogleIcon />
        Continue with Google
      </button>
      <button
        type="button"
        onClick={onPhoneClick}
        className="flex items-center justify-center gap-[0.55rem] py-3 bg-white border-[1.5px] border-offwhite-dark rounded-lg text-[0.85rem] font-medium text-ink transition-all touch-manipulation active:scale-[0.98]"
      >
        <PhoneIcon />
        Phone OTP
      </button>
    </div>
  );
}

/* ─── Role Selector ─── */
function RoleSelector({
  value,
  onChange,
}: {
  value: Role;
  onChange: (role: Role) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {ROLE_OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          className={`relative border-[1.5px] rounded-[10px] p-4 text-left transition-all ${
            value === option.key
              ? "border-orange bg-orange-xpale shadow-[0_0_0_3px_rgba(232,96,28,0.08)]"
              : "border-offwhite-dark bg-white hover:border-orange-light"
          }`}
          onClick={() => onChange(option.key as Role)}
        >
          {value === option.key && (
            <span className="absolute top-2 right-[10px] w-[18px] h-[18px] bg-orange text-white rounded-full grid place-items-center text-[0.7rem] font-bold">
              ✓
            </span>
          )}
          <div className="font-serif text-[1.1rem] font-semibold text-ink mb-[0.15rem]">
            {option.name}
          </div>
          <div className="text-[0.74rem] text-ink-soft leading-[1.4]">
            {option.desc}
          </div>
        </button>
      ))}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Role,
  TabItem,
  ROLE_OPTIONS,
} from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/authProvider/provider";

const authModeTabs: TabItem<AuthMode>[] = [
  { key: "signup", label: "Create account" },
  { key: "signin", label: "Sign in" },
];

/* ─── Schemas ─── */

const signupSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Enter a valid email address"),
    countryCode: z.string(),
    phone: z
      .string()
      .min(10, "Enter a valid phone number")
      .max(10, "Enter a valid phone number")
      .regex(/^\d+$/, "Phone must be digits only"),
    dob: z.string().min(1, "Date of birth is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["owner", "architect", "contractor"]),
    firmName: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (d) => {
      if (d.role === "owner") return !!d.firmName?.trim();
      return true;
    },
    { message: "Firm name is required for owners", path: ["firmName"] }
  );

const signinSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const passwordSetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// invite and reset both just need a new password
const inviteSchema = passwordSetSchema;

const inviteProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .regex(/^\d{10}$/, "Enter a valid 10-digit number")
    .or(z.literal(""))
    .optional(),
});

type SignupValues = z.infer<typeof signupSchema>;
type SigninValues = z.infer<typeof signinSchema>;
type ForgotValues = z.infer<typeof forgotSchema>;
type PasswordSetValues = z.infer<typeof passwordSetSchema>;
type InviteValues = PasswordSetValues;
type InviteProfileValues = z.infer<typeof inviteProfileSchema>;

/* ─── Main form component ─── */

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signUpUser, signInUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [serverError, setServerError] = useState("");
  const [signupDone, setSignupDone] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isInviteMode, setIsInviteMode] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteProfileStep, setInviteProfileStep] = useState(false);
  const [inviteProfileRole, setInviteProfileRole] = useState("");
  const [inviteDone, setInviteDone] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotDone, setForgotDone] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const isOverrideMode = isInviteMode || isForgotMode || isResetMode;

  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "invite") {
      setIsInviteMode(true);
      setInviteEmail(searchParams.get("email") || "");
      return;
    }
    if (type === "reset") {
      setIsResetMode(true);
      return;
    }
    const param = searchParams.get("mode");
    if (param === "signup") setMode("signup");
    setServerError("");
  }, [searchParams]);

  // Handle implicit-flow invite links: Supabase puts tokens in the URL hash
  // instead of a ?code= query param, so the server-side callback can't read them.
  // We detect them here client-side, establish the session, then provision the
  // org membership via the API before showing the password-setup view.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const hashType = params.get("type");

    if (!accessToken || hashType !== "invite") return;

    // Wipe the tokens from the URL immediately so they're not visible or bookmarked
    window.history.replaceState(null, "", "/auth");

    (async () => {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || "",
      });

      if (error || !data.user) {
        setServerError("Failed to process invitation. Please contact your admin.");
        return;
      }

      // Pass the access token explicitly so the provision API can authenticate
      // even if the session cookies haven't propagated yet after setSession().
      const token = data.session?.access_token;
      await fetch("/api/v1/invitations/provision", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setIsInviteMode(true);
      setInviteEmail(data.user.email || "");
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Signup form ── */
  const signup = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "+91",
      phone: "",
      dob: "",
      password: "",
      confirmPassword: "",
      role: "owner",
      firmName: "",
    },
  });

  const signupRole = signup.watch("role");
  const signupPassword = signup.watch("password");

  async function onSignup(values: SignupValues) {
    setServerError("");
    const fullName = `${values.firstName} ${values.lastName}`.trim();
    const result = await signUpUser({
      firstName: values.firstName,
      lastName: values.lastName,
      fullName,
      email: values.email,
      password: values.password,
      phone: `${values.countryCode}${values.phone}`,
      dob: values.dob,
      role: values.role,
      firmName: values.role === "contractor" ? undefined : values.firmName,
    });
    if (!result.success) {
      setServerError(result.error || "Signup failed.");
      return;
    }
    setSignupEmail(values.email);
    setSignupDone(true);
  }

  /* ── Signin form ── */
  const signin = useForm<SigninValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSignin(values: SigninValues) {
    setServerError("");
    const result = await signInUser(values.email, values.password);
    if (!result.success) {
      if (result.error?.includes("confirm your email")) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(values.email)}`);
        return;
      }
      setServerError(result.error || "Sign in failed.");
      return;
    }
    const redirect = searchParams.get("redirect");
    router.push(redirect || "/dashboard");
  }

  /* ── Invite form (set password after invite) ── */
  const inviteForm = useForm<PasswordSetValues>({
    resolver: zodResolver(passwordSetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const invitePassword = inviteForm.watch("password");

  /* ── Invite profile form (complete profile after password) ── */
  const inviteProfileForm = useForm<InviteProfileValues>({
    resolver: zodResolver(inviteProfileSchema),
    defaultValues: { firstName: "", lastName: "", phone: "" },
  });

  async function onSetInvitePassword(values: PasswordSetValues) {
    setServerError("");
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setServerError(error.message);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const meta = user?.user_metadata ?? {};
    const firstName = (meta.first_name as string) || (meta.full_name as string || "").split(/\s+/)[0] || "";
    const lastName = (meta.last_name as string) || (meta.full_name as string || "").split(/\s+/).slice(1).join(" ") || "";
    inviteProfileForm.reset({ firstName, lastName, phone: "" });
    setInviteProfileRole((user?.user_metadata?.org_role as string) || "");
    setInviteProfileStep(true);
  }

  async function onSaveInviteProfile(values: InviteProfileValues) {
    setServerError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setInviteDone(true); return; }
    const fullName = `${values.firstName} ${values.lastName}`.trim();
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name: values.firstName,
      last_name: values.lastName,
      full_name: fullName,
      phone: values.phone || null,
      role: inviteProfileRole || null,
    });
    if (error) { setServerError(error.message); return; }
    setInviteDone(true);
  }

  /* ── Forgot password form ── */
  const forgotForm = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onForgotPassword(values: ForgotValues) {
    setServerError("");
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback?type=reset`,
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    setForgotDone(true);
  }

  /* ── Reset password form ── */
  const resetForm = useForm<PasswordSetValues>({
    resolver: zodResolver(passwordSetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const resetPassword = resetForm.watch("password");

  async function onResetPassword(values: PasswordSetValues) {
    setServerError("");
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setServerError(error.message);
      return;
    }
    setResetDone(true);
  }

  function switchMode(next: AuthMode) {
    setMode(next);
    setServerError("");
    setSignupDone(false);
    setSignupEmail("");
    signup.clearErrors();
    signin.clearErrors();
  }

  return (
    <div className="min-h-screen lg:min-h-0 lg:h-screen flex flex-col lg:flex-row">
      {/* LEFT: BRAND PANEL */}
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
        {!isOverrideMode && (
          <div className="flex justify-end px-6 sm:px-10 pt-8 text-[0.82rem] text-ink-soft">
            <span>
              {mode === "signup"
                ? "Already have an account?"
                : "Don't have an account?"}
            </span>
            <button
              type="button"
              className="text-orange font-medium ml-1 hover:underline touch-manipulation"
              onClick={() => switchMode(mode === "signup" ? "signin" : "signup")}
            >
              {mode === "signup" ? "Sign in" : "Create account"}
            </button>
          </div>
        )}
        {isOverrideMode && <div className="pt-8" />}

        <div className="flex-1 px-6 sm:px-10 pb-12">
          <div className="w-full max-w-[460px] mx-auto pt-10">
            {!isOverrideMode && (
              <Tabs
                tabs={authModeTabs}
                value={mode}
                onChange={(m) => switchMode(m)}
                variant="pill"
              />
            )}

            <div className={isOverrideMode ? "mt-0" : "mt-10"}>
              {serverError && (
                <div className="mb-6 p-3 bg-[#FDECEA] border border-[#F5C6CB] rounded-lg text-[0.82rem] text-[#721C24]">
                  {serverError}
                </div>
              )}

              {/* ════════ INVITE: SET PASSWORD ════════ */}
              {isInviteMode && !inviteProfileStep && !inviteDone && (
                <section>
                  <div className="inline-flex items-center gap-[0.45rem] bg-orange-xpale text-orange-dark border border-orange-pale px-[0.7rem] py-[0.3rem] rounded-full text-[0.72rem] font-medium tracking-[0.02em] mb-6">
                    <span className="w-[6px] h-[6px] bg-orange rounded-full" />
                    You&apos;ve been invited
                  </div>

                  <h2 className="font-serif text-[2.1rem] font-medium leading-[1.15] text-ink tracking-[-0.005em] mb-2">
                    Set your password
                    <br />
                    to get started.
                  </h2>
                  <p className="text-[0.88rem] text-ink-soft mb-8 leading-[1.6]">
                    Your account is ready. Set a password so you can sign in anytime.
                  </p>

                  {inviteEmail && (
                    <div className="mb-6">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        readOnly
                        className="w-full bg-offwhite-dark cursor-default select-all"
                      />
                    </div>
                  )}

                  <form onSubmit={inviteForm.handleSubmit(onSetInvitePassword)}>
                    <Label>New password</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      suffix={
                        <button
                          type="button"
                          className="bg-transparent border-none text-muted cursor-pointer py-1 px-2 text-[0.78rem] font-medium hover:text-orange"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      }
                      className="mb-2 w-full"
                      error={inviteForm.formState.errors.password?.message}
                      {...inviteForm.register("password")}
                    />
                    <PasswordStrength password={invitePassword} />
                    <div className="h-6" />

                    <Label>Confirm password</Label>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      suffix={
                        <button
                          type="button"
                          className="bg-transparent border-none text-muted cursor-pointer py-1 px-2 text-[0.78rem] font-medium hover:text-orange"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                      }
                      className="mb-6 w-full"
                      error={inviteForm.formState.errors.confirmPassword?.message}
                      {...inviteForm.register("confirmPassword")}
                    />

                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      type="submit"
                      disabled={inviteForm.formState.isSubmitting}
                    >
                      {inviteForm.formState.isSubmitting
                        ? "Setting password..."
                        : "Set password & continue →"}
                    </Button>
                  </form>

                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="mt-4 w-full py-2 text-[0.82rem] text-ink-soft hover:text-ink text-center transition-colors"
                  >
                    Skip for now — go to dashboard
                  </button>
                </section>
              )}

              {/* ════════ INVITE: COMPLETE PROFILE ════════ */}
              {isInviteMode && inviteProfileStep && !inviteDone && (
                <section>
                  <div className="inline-flex items-center gap-[0.45rem] bg-orange-xpale text-orange-dark border border-orange-pale px-[0.7rem] py-[0.3rem] rounded-full text-[0.72rem] font-medium tracking-[0.02em] mb-6">
                    <span className="w-[6px] h-[6px] bg-orange rounded-full" />
                    One more step
                  </div>

                  <h2 className="font-serif text-[2.1rem] font-medium leading-[1.15] text-ink tracking-[-0.005em] mb-2">
                    Complete your
                    <br />
                    profile.
                  </h2>
                  <p className="text-[0.88rem] text-ink-soft mb-8 leading-[1.6]">
                    Help your team know who you are. You can update this anytime from settings.
                  </p>

                  <form onSubmit={inviteProfileForm.handleSubmit(onSaveInviteProfile)}>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <Label>First name</Label>
                        <Input
                          type="text"
                          placeholder="John"
                          error={inviteProfileForm.formState.errors.firstName?.message}
                          {...inviteProfileForm.register("firstName")}
                        />
                      </div>
                      <div>
                        <Label>Last name</Label>
                        <Input
                          type="text"
                          placeholder="Doe"
                          error={inviteProfileForm.formState.errors.lastName?.message}
                          {...inviteProfileForm.register("lastName")}
                        />
                      </div>
                    </div>

                    <Label>Phone number <span className="text-muted font-normal">(optional)</span></Label>
                    <div className="flex gap-2 mb-8 items-start">
                      <div className="relative self-start">
                        <span className="w-[100px] pl-3 pr-7 py-[0.72rem] inline-flex items-center bg-white border-[1.5px] border-offwhite-dark rounded-lg text-[0.88rem] text-ink-soft">
                          🇮🇳 +91
                        </span>
                      </div>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="98765 43210"
                        className="flex-1"
                        error={inviteProfileForm.formState.errors.phone?.message}
                        {...inviteProfileForm.register("phone", {
                          onChange: (e) => {
                            e.target.value = e.target.value.replace(/\D/g, "");
                          },
                        })}
                      />
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      type="submit"
                      disabled={inviteProfileForm.formState.isSubmitting}
                    >
                      {inviteProfileForm.formState.isSubmitting ? "Saving..." : "Save & go to dashboard →"}
                    </Button>
                  </form>

                  <button
                    type="button"
                    onClick={() => setInviteDone(true)}
                    className="mt-4 w-full py-2 text-[0.82rem] text-ink-soft hover:text-ink text-center transition-colors"
                  >
                    Skip for now
                  </button>
                </section>
              )}

              {/* ════════ INVITE: SUCCESS ════════ */}
              {isInviteMode && inviteDone && (
                <section className="pt-4">
                  <div className="w-[48px] h-[48px] rounded-full bg-orange-xpale border border-orange-pale flex items-center justify-center mb-6">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h2 className="font-serif text-[2.1rem] font-medium leading-[1.15] text-ink tracking-[-0.005em] mb-3">
                    You&apos;re all set.
                  </h2>
                  <p className="text-[0.88rem] text-ink-soft leading-[1.6] mb-8">
                    Your password has been saved. You can now sign in anytime with your email and password.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="w-full py-3 bg-[#E8601C] text-white rounded-lg text-[0.85rem] font-medium transition-all hover:bg-[#C04E12] touch-manipulation"
                  >
                    Go to dashboard →
                  </button>
                </section>
              )}

              {/* ════════ FORGOT PASSWORD ════════ */}
              {isForgotMode && !forgotDone && (
                <section>
                  <button
                    type="button"
                    onClick={() => { setIsForgotMode(false); setServerError(""); }}
                    className="flex items-center gap-1 text-[0.8rem] text-ink-soft hover:text-ink mb-6 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    Back to sign in
                  </button>

                  <h2 className="font-serif text-[2.1rem] font-medium leading-[1.15] text-ink tracking-[-0.005em] mb-2">
                    Forgot your
                    <br />
                    password?
                  </h2>
                  <p className="text-[0.88rem] text-ink-soft mb-8 leading-[1.6]">
                    Enter your email and we&apos;ll send you a reset link.
                  </p>

                  <form onSubmit={forgotForm.handleSubmit(onForgotPassword)}>
                    <Label>Work email</Label>
                    <Input
                      type="email"
                      placeholder="you@studio.com"
                      className="mb-6 w-full"
                      error={forgotForm.formState.errors.email?.message}
                      {...forgotForm.register("email")}
                    />
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      type="submit"
                      disabled={forgotForm.formState.isSubmitting}
                    >
                      {forgotForm.formState.isSubmitting ? "Sending..." : "Send reset link"}
                    </Button>
                  </form>
                </section>
              )}

              {/* ════════ FORGOT: EMAIL SENT ════════ */}
              {isForgotMode && forgotDone && (
                <section className="pt-4">
                  <div className="w-[48px] h-[48px] rounded-full bg-orange-xpale border border-orange-pale flex items-center justify-center mb-6">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <h2 className="font-serif text-[2.1rem] font-medium leading-[1.15] text-ink tracking-[-0.005em] mb-3">
                    Check your inbox.
                  </h2>
                  <p className="text-[0.88rem] text-ink-soft leading-[1.6] mb-8">
                    If an account exists for that email, we&apos;ve sent a password reset link. It expires in 1 hour.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setIsForgotMode(false); setForgotDone(false); forgotForm.reset(); setServerError(""); }}
                    className="w-full py-3 bg-[#E8601C] text-white rounded-lg text-[0.85rem] font-medium transition-all hover:bg-[#C04E12] touch-manipulation"
                  >
                    Back to sign in
                  </button>
                </section>
              )}

              {/* ════════ RESET PASSWORD ════════ */}
              {isResetMode && !resetDone && (
                <section>
                  <div className="inline-flex items-center gap-[0.45rem] bg-orange-xpale text-orange-dark border border-orange-pale px-[0.7rem] py-[0.3rem] rounded-full text-[0.72rem] font-medium tracking-[0.02em] mb-6">
                    <span className="w-[6px] h-[6px] bg-orange rounded-full" />
                    Reset your password
                  </div>

                  <h2 className="font-serif text-[2.1rem] font-medium leading-[1.15] text-ink tracking-[-0.005em] mb-2">
                    Set a new
                    <br />
                    password.
                  </h2>
                  <p className="text-[0.88rem] text-ink-soft mb-8 leading-[1.6]">
                    Choose a strong password for your account.
                  </p>

                  <form onSubmit={resetForm.handleSubmit(onResetPassword)}>
                    <Label>New password</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      suffix={
                        <button
                          type="button"
                          className="bg-transparent border-none text-muted cursor-pointer py-1 px-2 text-[0.78rem] font-medium hover:text-orange"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      }
                      className="mb-2 w-full"
                      error={resetForm.formState.errors.password?.message}
                      {...resetForm.register("password")}
                    />
                    <PasswordStrength password={resetPassword} />
                    <div className="h-6" />

                    <Label>Confirm password</Label>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      suffix={
                        <button
                          type="button"
                          className="bg-transparent border-none text-muted cursor-pointer py-1 px-2 text-[0.78rem] font-medium hover:text-orange"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                      }
                      className="mb-6 w-full"
                      error={resetForm.formState.errors.confirmPassword?.message}
                      {...resetForm.register("confirmPassword")}
                    />

                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      type="submit"
                      disabled={resetForm.formState.isSubmitting}
                    >
                      {resetForm.formState.isSubmitting ? "Saving..." : "Save new password →"}
                    </Button>
                  </form>
                </section>
              )}

              {/* ════════ RESET: SUCCESS ════════ */}
              {isResetMode && resetDone && (
                <section className="pt-4">
                  <div className="w-[48px] h-[48px] rounded-full bg-orange-xpale border border-orange-pale flex items-center justify-center mb-6">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h2 className="font-serif text-[2.1rem] font-medium leading-[1.15] text-ink tracking-[-0.005em] mb-3">
                    Password updated.
                  </h2>
                  <p className="text-[0.88rem] text-ink-soft leading-[1.6] mb-8">
                    Your new password is saved. You&apos;re signed in and ready to go.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="w-full py-3 bg-[#E8601C] text-white rounded-lg text-[0.85rem] font-medium transition-all hover:bg-[#C04E12] touch-manipulation"
                  >
                    Go to dashboard →
                  </button>
                </section>
              )}

              {/* ════════ SIGN UP VIEW ════════ */}
              {!isOverrideMode && mode === "signup" && !signupDone && (
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

                  <OAuthButtons mode={mode} />

                  <Divider text="or with your work email" />

                  <form onSubmit={signup.handleSubmit(onSignup)} className="mt-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <Label>First name</Label>
                        <Input
                          type="text"
                          placeholder="John"
                          error={signup.formState.errors.firstName?.message}
                          {...signup.register("firstName")}
                        />
                      </div>
                      <div>
                        <Label>Last name</Label>
                        <Input
                          type="text"
                          placeholder="Doe"
                          error={signup.formState.errors.lastName?.message}
                          {...signup.register("lastName")}
                        />
                      </div>
                    </div>

                    <Label>Work email</Label>
                    <Input
                      type="email"
                      placeholder="you@studio.com"
                      className="mb-6 w-full"
                      error={signup.formState.errors.email?.message}
                      {...signup.register("email")}
                    />

                    <Label>Phone number</Label>
                    <div className="flex gap-2 mb-6 items-start">
                      <div className="relative self-start">
                        <select
                          {...signup.register("countryCode")}
                          className="w-[100px] pl-3 pr-7 py-[0.72rem] appearance-none bg-white border-[1.5px] border-offwhite-dark rounded-lg text-[0.88rem] text-ink focus:outline-none focus:border-orange transition-colors"
                        >
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+61">🇦🇺 +61</option>
                        </select>
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-soft text-[0.6rem]">▾</span>
                      </div>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="98765 43210"
                        className="flex-1"
                        error={signup.formState.errors.phone?.message}
                        {...signup.register("phone", {
                          onChange: (e) => {
                            e.target.value = e.target.value.replace(/\D/g, "");
                          },
                        })}
                      />
                    </div>


                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      className="mb-6 w-full"
                      error={signup.formState.errors.dob?.message}
                      {...signup.register("dob")}
                    />

                    <Label>Password</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      suffix={
                        <button
                          type="button"
                          className="bg-transparent border-none text-muted cursor-pointer py-1 px-2 text-[0.78rem] font-medium hover:text-orange"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      }
                      className="mb-2 w-full"
                      error={signup.formState.errors.password?.message}
                      {...signup.register("password")}
                    />
                    <PasswordStrength password={signupPassword} />
                    <div className="h-6" />

                    <Label>Confirm Password</Label>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      suffix={
                        <button
                          type="button"
                          className="bg-transparent border-none text-muted cursor-pointer py-1 px-2 text-[0.78rem] font-medium hover:text-orange"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                      }
                      className="mb-6 w-full"
                      error={signup.formState.errors.confirmPassword?.message}
                      {...signup.register("confirmPassword")}
                    />

                    <Label className="mb-2">I'm joining as</Label>
                    <Controller
                      control={signup.control}
                      name="role"
                      render={({ field }) => (
                        <RoleSelector
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    <div className="h-6" />

                    {(signupRole === "owner" || signupRole === "architect") && (
                      <>
                        <Label>Firm / company name</Label>
                        <Input
                          type="text"
                          placeholder="Anantam Designs"
                          className="mb-6 w-full"
                          error={signup.formState.errors.firmName?.message}
                          {...signup.register("firmName")}
                        />
                      </>
                    )}

                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      type="submit"
                      disabled={signup.formState.isSubmitting}
                    >
                      {signup.formState.isSubmitting
                        ? "Creating account..."
                        : signupRole === "owner"
                          ? "Create workspace & start trial"
                          : signupRole === "architect"
                            ? "Create account & start trial"
                            : "Create account & continue"}
                    </Button>

                    <p className="mt-6 text-[0.72rem] text-muted text-center leading-[1.6]">
                      By creating an account you agree to our{" "}
                      <a href="#" className="text-ink-soft underline underline-offset-2 hover:text-orange" onClick={(e) => e.preventDefault()}>
                        Terms
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-ink-soft underline underline-offset-2 hover:text-orange" onClick={(e) => e.preventDefault()}>
                        Privacy policy
                      </a>
                      .
                    </p>
                  </form>
                </section>
              )}

              {/* ════════ SIGNUP CONFIRMATION ════════ */}
              {!isOverrideMode && mode === "signup" && signupDone && (
                <section className="pt-4">
                  <div className="w-[48px] h-[48px] rounded-full bg-orange-xpale border border-orange-pale flex items-center justify-center mb-6">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <h2 className="font-serif text-[2.1rem] font-medium leading-[1.15] text-ink tracking-[-0.005em] mb-3">
                    Check your inbox.
                  </h2>
                  <p className="text-[0.88rem] text-ink-soft leading-[1.6] mb-2">
                    We sent a verification link to
                  </p>
                  <p className="text-[0.88rem] font-medium text-ink mb-6 break-all">
                    {signupEmail}
                  </p>
                  <p className="text-[0.82rem] text-ink-soft leading-[1.6] mb-8">
                    Click the link in the email to activate your account. Once confirmed, come back here and sign in.
                  </p>
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="w-full py-3 bg-[#E8601C] text-white rounded-lg text-[0.85rem] font-medium transition-all hover:bg-[#C04E12] touch-manipulation"
                  >
                    Go to sign in →
                  </button>
                  <p className="mt-4 text-[0.78rem] text-muted text-center">
                    Wrong email?{" "}
                    <button
                      type="button"
                      className="text-orange hover:underline"
                      onClick={() => { setSignupDone(false); setSignupEmail(""); signup.reset(); }}
                    >
                      Start over
                    </button>
                  </p>
                </section>
              )}

              {/* ════════ SIGN IN VIEW ════════ */}
              {!isOverrideMode && mode === "signin" && (
                <section>
                  <h2 className="font-serif text-[2.1rem] font-medium leading-[1.15] text-ink tracking-[-0.005em] mb-2">
                    Welcome back.
                  </h2>
                  <p className="text-[0.88rem] text-ink-soft mb-8 leading-[1.6]">
                    Sign in to your workspace.
                  </p>

                  <OAuthButtons mode={mode} />

                  <Divider text="or" />

                  <form onSubmit={signin.handleSubmit(onSignin)} className="mt-6">
                    <Label>Work email</Label>
                    <Input
                      type="email"
                      placeholder="you@studio.com"
                      className="mb-6 w-full"
                      error={signin.formState.errors.email?.message}
                      {...signin.register("email")}
                    />

                    <Label>Password</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      suffix={
                        <button
                          type="button"
                          className="bg-transparent border-none text-muted cursor-pointer py-1 px-2 text-[0.78rem] font-medium hover:text-orange"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      }
                      className="mb-2 w-full"
                      error={signin.formState.errors.password?.message}
                      {...signin.register("password")}
                    />
                    <div className="text-right mt-2 mb-6 text-[0.78rem]">
                      <button
                        type="button"
                        className="text-orange cursor-pointer hover:underline bg-transparent border-none p-0"
                        onClick={() => { setIsForgotMode(true); setServerError(""); }}
                      >
                        Forgot password?
                      </button>
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      type="submit"
                      disabled={signin.formState.isSubmitting}
                    >
                      {signin.formState.isSubmitting ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>
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

/* ─── OAuth Buttons ─── */
function OAuthButtons({ mode }: { mode: AuthMode }) {
  async function handleGoogleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?mode=${mode}`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) alert("Google sign-in failed: " + error.message);
  }

  return (
    <div className="grid grid-cols-1 gap-[0.6rem] mb-6">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex items-center justify-center gap-[0.55rem] py-3 bg-white border-[1.5px] border-offwhite-dark rounded-lg text-[0.85rem] font-medium text-ink transition-all touch-manipulation active:scale-[0.98]"
      >
        <GoogleIcon />
        Continue with Google
      </button>
    </div>
  );
}

/* ─── Role Selector ─── */
function RoleSelector({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-8">
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

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}

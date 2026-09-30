"use client";

import Link from "next/link";
import { useActionState, useRef, useState, type KeyboardEvent } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, registerAction } from "@/app/actions/auth";
import { FormMessage, PasswordField, SubmitButton, TextField, FieldError } from "@/components/ui/Form";
import { Icon } from "@/components/ui/Icon";
import { NIGERIAN_STATES } from "@/lib/constants";
import type { OAuthProvider } from "@/lib/auth/oauth";
import type { ActionState } from "@/lib/validation";

type Mode = "login" | "register";

export function AuthForms({
  initialMode,
  initialRole,
  next,
  notice,
  providers = [],
}: {
  initialMode: Mode;
  initialRole: "BUYER" | "SELLER";
  next?: string;
  notice?: { tone: "success" | "info" | "error"; text: string };
  providers?: OAuthProvider[];
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const tabRefs = useRef<Record<Mode, HTMLButtonElement | null>>({ login: null, register: null });

  function select(m: Mode) {
    setMode(m);
    const url = new URL(window.location.href);
    url.searchParams.set("mode", m);
    window.history.replaceState(null, "", url);
  }

  function onTabKey(e: KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const m: Mode = mode === "login" ? "register" : "login";
      select(m);
      tabRefs.current[m]?.focus();
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: "clamp(1.8rem, 3.4vw, 2.4rem)" }}>
        {mode === "login" ? "Welcome back" : "Join AgriTrade"}
      </h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        {mode === "login"
          ? "Sign in to manage your inquiries, listings and saved products."
          : "Create a free account to buy wholesale or sell your produce to retailers."}
      </p>

      <div className="tabs" role="tablist" aria-label="Sign in or register" data-active={mode}>
        <span className="tab-indicator" aria-hidden="true" />
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            ref={(el) => { tabRefs.current[m] = el; }}
            type="button"
            role="tab"
            id={`tab-${m}`}
            aria-selected={mode === m}
            aria-controls={`panel-${m}`}
            tabIndex={mode === m ? 0 : -1}
            className="tab"
            onClick={() => select(m)}
            onKeyDown={onTabKey}
          >
            {m === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      {notice && (
        <div className={`alert alert-${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"} style={{ marginBottom: 18 }}>
          <Icon name={notice.tone === "success" ? "check" : notice.tone === "error" ? "alert" : "info"} />
          <p>{notice.text}</p>
        </div>
      )}

      <div role="tabpanel" id="panel-login" aria-labelledby="tab-login" hidden={mode !== "login"}>
        <LoginForm next={next} providers={providers} />
        <p className="small muted" style={{ marginTop: 20, textAlign: "center" }}>
          New to AgriTrade?{" "}
          <button type="button" className="btn-link" onClick={() => select("register")} style={linkBtn}>
            Create an account
          </button>
        </p>
      </div>
      <div role="tabpanel" id="panel-register" aria-labelledby="tab-register" hidden={mode !== "register"}>
        <RegisterForm initialRole={initialRole} providers={providers} />
        <p className="small muted" style={{ marginTop: 20, textAlign: "center" }}>
          Already have an account?{" "}
          <button type="button" onClick={() => select("login")} style={linkBtn}>
            Sign in
          </button>
        </p>
      </div>

      <div className="or-divider">or</div>
      <Link href="/marketplace" className="btn btn-secondary btn-block">
        <Icon name="basket" /> Browse the marketplace as a guest
      </Link>
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  background: "none",
  border: 0,
  padding: 0,
  color: "var(--green-700)",
  font: "inherit",
  fontWeight: 700,
  textDecoration: "underline",
  textUnderlineOffset: 3,
  cursor: "pointer",
};

function LoginForm({ next, providers }: { next?: string; providers: OAuthProvider[] }) {
  const [state, action] = useActionState<ActionState, FormData>(loginAction, {});
  const v = state.values ?? {};
  return (
    <form action={action} noValidate className="stack" style={{ ["--stack" as string]: "16px" }}>
      <FormMessage state={state} />
      {next && <input type="hidden" name="next" value={next} />}
      <TextField
        name="email"
        label="Email address"
        type="email"
        autoComplete="email"
        inputMode="email"
        state={state}
        defaultValue={(v.email as string) ?? ""}
      />
      <PasswordField name="password" label="Password" autoComplete="current-password" state={state} />
      <div className="row-between small">
        <span />
        <Link href="/forgot-password">Forgot your password?</Link>
      </div>
      <SubmitButton className="btn btn-block" pendingLabel="Signing in…">
        Sign in <Icon name="arrowRight" size={16} />
      </SubmitButton>
      {providers.length > 0 && (
        <>
          <div className="or-divider" style={{ margin: "6px 0 0" }}>or sign in with</div>
          <div className="social-row">
            {providers.map((p) => (
              <a
                key={p}
                className="btn btn-secondary btn-social"
                href={`/api/auth/oauth/${p}${next ? `?next=${encodeURIComponent(next)}` : ""}`}
              >
                <ProviderLogo provider={p} /> {PROVIDER_NAMES[p]}
              </a>
            ))}
          </div>
        </>
      )}
    </form>
  );
}

function RegisterForm({ initialRole, providers }: { initialRole: "BUYER" | "SELLER"; providers: OAuthProvider[] }) {
  const [state, action] = useActionState<ActionState, FormData>(registerAction, {});
  const v = state.values ?? {};
  const [role, setRole] = useState<"BUYER" | "SELLER">((v.role as "BUYER" | "SELLER") ?? initialRole);
  const isSeller = role === "SELLER";

  return (
    <form action={action} noValidate className="stack" style={{ ["--stack" as string]: "16px" }}>
      <FormMessage state={state} />
      <fieldset>
        <legend className="label" style={{ marginBottom: 10 }}>How will you use AgriTrade?</legend>
        <div className="role-cards">
          <RoleCard
            value="BUYER"
            checked={role === "BUYER"}
            onChange={() => setRole("BUYER")}
            icon="basket"
            title="I'm buying"
            text="Retailers, supermarkets, restaurants and caterers sourcing stock."
            points={["Compare wholesale offers", "Message sellers directly"]}
          />
          <RoleCard
            value="SELLER"
            checked={role === "SELLER"}
            onChange={() => setRole("SELLER")}
            icon="store"
            title="I'm selling"
            text="Farms, aggregators and wholesalers with produce in bulk."
            points={["List products & prices", "Answer buyer inquiries"]}
            earth
          />
        </div>
        <FieldError id="f-role-err" errors={state.fieldErrors?.role} />
      </fieldset>

      <div className="field-row">
        <TextField name="name" label="Full name" autoComplete="name" state={state} defaultValue={(v.name as string) ?? ""} />
        <TextField
          name="phone"
          label="Phone"
          type="tel"
          autoComplete="tel"
          optional
          state={state}
          placeholder="+234 …"
          defaultValue={(v.phone as string) ?? ""}
        />
      </div>
      <TextField name="email" label="Email address" type="email" autoComplete="email" state={state} defaultValue={(v.email as string) ?? ""} />

      <TextField
        key={role}
        name="businessName"
        label={isSeller ? "Business or farm name" : "Shop or business name"}
        optional={!isSeller}
        autoComplete="organization"
        state={state}
        defaultValue={(v.businessName as string) ?? ""}
        hint={isSeller ? "Buyers will see this on your listings." : undefined}
      />

      {isSeller && (
        <div className="seller-extra">
          <div className="field-row">
            <TextField name="city" label="City" autoComplete="address-level2" state={state} defaultValue={(v.city as string) ?? ""} />
            <div className="field">
              <label className="label" htmlFor="f-state">State</label>
              <select
                id="f-state"
                name="state"
                className="select"
                required
                defaultValue={(v.state as string) ?? ""}
                aria-invalid={state.fieldErrors?.state ? true : undefined}
                aria-describedby={state.fieldErrors?.state ? "f-state-err" : undefined}
              >
                <option value="" disabled>Choose a state</option>
                {NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <FieldError id="f-state-err" errors={state.fieldErrors?.state} />
            </div>
          </div>
          <div className="alert alert-info" style={{ marginTop: 16 }}>
            <Icon name="shield" />
            <p>New seller accounts are reviewed by our team. You can prepare listings right away; they go live once approved.</p>
          </div>
        </div>
      )}

      <PasswordField
        name="password"
        label="Password"
        autoComplete="new-password"
        state={state}
        showStrength
        hint="At least 8 characters, with a letter and a number."
      />
      <PasswordField name="confirmPassword" label="Confirm password" autoComplete="new-password" state={state} />

      <div className="field">
        <label className="checkbox">
          <input
            type="checkbox"
            name="terms"
            required
            aria-invalid={state.fieldErrors?.terms ? true : undefined}
            aria-describedby={state.fieldErrors?.terms ? "f-terms-err" : undefined}
          />
          <span>I agree to trade honestly and accept the AgriTrade terms of use and privacy policy.</span>
        </label>
        <FieldError id="f-terms-err" errors={state.fieldErrors?.terms} />
      </div>

      <SubmitButton className={`btn btn-block ${isSeller ? "btn-earth" : ""}`} pendingLabel="Creating your account…">
        {isSeller ? "Create seller account" : "Create buyer account"} <Icon name="arrowRight" size={16} />
      </SubmitButton>
      {providers.length > 0 && (
        <>
          <div className="or-divider" style={{ margin: "6px 0 0" }}>or sign up with</div>
          <div className="social-row">
            {providers.map((p) => <SocialSignupButton key={p} provider={p} />)}
          </div>
          <p className="small muted" style={{ margin: 0, textAlign: "center" }}>
            We&apos;ll use your name and email from {providers.map((p) => PROVIDER_NAMES[p]).join(" or ")}, so you
            won&apos;t need a password.{isSeller ? " Fill in your business details above first." : ""}
          </p>
        </>
      )}
    </form>
  );
}

function RoleCard(props: {
  value: "BUYER" | "SELLER";
  checked: boolean;
  onChange: () => void;
  icon: "basket" | "store";
  title: string;
  text: string;
  points: string[];
  earth?: boolean;
}) {
  const id = `role-${props.value.toLowerCase()}`;
  return (
    <label className={`role-card ${props.earth ? "earth" : ""}`} htmlFor={id}>
      <input
        type="radio"
        id={id}
        name="role"
        value={props.value}
        checked={props.checked}
        onChange={props.onChange}
        aria-describedby={`${id}-desc`}
      />
      <span className="inner">
        <span className="icon"><Icon name={props.icon} size={22} /></span>
        <strong>{props.title}</strong>
        <span id={`${id}-desc`} className="desc">{props.text}</span>
        <ul>{props.points.map((p) => <li key={p}>{p}</li>)}</ul>
      </span>
      <span className="check" aria-hidden="true"><Icon name="check" size={14} /></span>
    </label>
  );
}

const PROVIDER_NAMES: Record<OAuthProvider, string> = { google: "Google", facebook: "Facebook" };

/** Submits the sign-up form (role, seller details, terms) with `provider` set, which starts the provider sign-in. */
function SocialSignupButton({ provider }: { provider: OAuthProvider }) {
  const { pending, data } = useFormStatus();
  const busy = pending && data?.get("provider") === provider;
  return (
    <button
      type="submit"
      name="provider"
      value={provider}
      className="btn btn-secondary btn-social"
      disabled={pending}
      aria-disabled={pending}
    >
      <ProviderLogo provider={provider} /> {busy ? "Redirecting…" : PROVIDER_NAMES[provider]}
    </button>
  );
}

function ProviderLogo({ provider }: { provider: OAuthProvider }) {
  if (provider === "google") {
    return (
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />
      <path fill="#fff" d="m16.7 15.5.5-3.5h-3.4V9.8c0-1 .5-1.9 2-1.9h1.5v-3s-1.4-.2-2.7-.2c-2.8 0-4.5 1.7-4.5 4.7V12h-3v3.5h3v8.4a12 12 0 0 0 3.7 0v-8.4h2.9z" />
    </svg>
  );
}

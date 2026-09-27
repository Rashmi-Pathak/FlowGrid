'use client'
import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { SignUp } from '@/app/actions/AuthActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { AtSign, Mail, Lock, CheckCircle2, Loader2, Workflow, ArrowRight } from 'lucide-react'
import { useAuth } from '@/app/context/ContextApiProvider'

import { passwordSchema, usernameSchema } from '@/lib/validation/schemas'

const registerSchema = z.object({
  username: usernameSchema,
  email: z.string().email('Please enter a valid email'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

const RegisterPage = () => {
  const router = useRouter()
  const { user, loading: isCheckingAuth } = useAuth()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  useEffect(() => {
    if (!isCheckingAuth && user) {
      router.replace('/workspaces')
    }
  }, [user, isCheckingAuth, router])

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await SignUp(data.email, data.password, data.username)

      if (result?.error) {
        setError('root', { message: result.error })
        toast.error(result.error)
      } else if (result?.success) {
        toast.success('Account created! Please check your email to confirm your account.')
        router.push('/login')
      }
    } catch {
      const errorMessage = 'Something went wrong. Please try again.'
      setError('root', { message: errorMessage })
      toast.error(errorMessage)
    }
  }


  if (isCheckingAuth) {
    return (
      <div className="landing-page flex justify-center items-center min-h-screen" style={{ background: 'var(--lp-bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--lp-violet)]" />
          <p className="text-[var(--lp-ink-dim)] font-medium tracking-wide">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthShell
      eyebrow="Create your workspace"
      title={<>Get your team <em className="not-italic text-[var(--lp-violet)]">in sync</em> from day one.</>}
      subtitle="Set up a workspace, invite your team, and turn scattered tasks and chats into one calm, real-time board everyone can follow."
      steps={["Create a free account", "Spin up your first workspace", "Invite your team by email"]}
    >
      <div className="mb-8">
        <h2 className="text-[26px] font-semibold tracking-tight text-[var(--lp-ink)]">Create account</h2>
        <p className="text-[14px] text-[var(--lp-ink-dim)] mt-2">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--lp-violet)] font-semibold hover:underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Field label="Username" htmlFor="username" error={errors.username?.message}>
          <AtSign className="auth-field-icon" />
          <Input
            id="username"
            {...register('username')}
            placeholder="yourname"
            type="text"
            className="auth-input"
            aria-invalid={!!errors.username}
          />
        </Field>

        <Field label="Email address" htmlFor="email" error={errors.email?.message}>
          <Mail className="auth-field-icon" />
          <Input
            id="email"
            {...register('email')}
            placeholder="you@example.com"
            type="email"
            className="auth-input"
            aria-invalid={!!errors.email}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <Lock className="auth-field-icon" />
            <Input
              id="password"
              {...register('password')}
              placeholder="••••••••"
              type="password"
              className="auth-input"
              aria-invalid={!!errors.password}
            />
          </Field>

          <Field label="Confirm" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <CheckCircle2 className="auth-field-icon" />
            <Input
              id="confirmPassword"
              {...register('confirmPassword')}
              placeholder="••••••••"
              type="password"
              className="auth-input"
              aria-invalid={!!errors.confirmPassword}
            />
          </Field>
        </div>

        {errors.root && (
          <div className="p-3 rounded-lg border border-[var(--lp-red)]/30 bg-[var(--lp-red)]/10">
            <p className="text-[var(--lp-red)] text-xs font-medium text-center">{errors.root.message}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl text-[15px] font-semibold bg-[var(--lp-violet)] text-white hover:bg-[#9d90f8] hover:shadow-[0_10px_30px_-8px_rgba(139,124,246,0.6)] transition-all border-0"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </form>


    </AuthShell>
  )
}

/* ---------- Shared auth layout + field primitives ---------- */

function AuthShell({
  eyebrow,
  title,
  subtitle,
  steps,
  children,
}: {
  eyebrow: string
  title: React.ReactNode
  subtitle: string
  steps?: string[]
  children: React.ReactNode
}) {
  return (
    <div className="landing-page min-h-screen w-full flex font-sans selection:bg-[var(--lp-accent)] selection:text-[#050607]" style={{ background: 'var(--lp-bg)', color: 'var(--lp-ink)' }}>
      {/* Left brand panel — violet-leaning to feel distinct from sign in */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden border-r border-[var(--lp-border)]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 70% 30%, black 0%, transparent 80%)',
        }} />
        <div className="absolute inset-0 animate-[mesh-drift_22s_ease-in-out_infinite]" style={{
          background: 'radial-gradient(700px 500px at 80% 15%, rgba(139,124,246,0.16), transparent 60%), radial-gradient(700px 600px at 10% 95%, rgba(201,255,61,0.1), transparent 60%)',
        }} />
        <div className="relative z-10 flex flex-col justify-between p-14">
          <Link href="/" className="flex items-center gap-[10px] text-[20px] font-semibold tracking-tight text-[var(--lp-ink)] w-fit">
            <Workflow className="w-[24px] h-[24px] text-[var(--lp-violet)]" />
            <span>Flow<span className="font-bold">grid</span></span>
          </Link>

          <div className="max-w-[440px]">
            <span className="inline-flex items-center gap-2 font-mono text-[11.5px] text-[var(--lp-violet)] tracking-widest uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--lp-violet)] animate-[pulse-ring_2.2s_infinite]" />
              {eyebrow}
            </span>
            <h1 className="font-serif font-normal text-[clamp(2.2rem,3.4vw,3.2rem)] leading-[1.08] tracking-tight text-[var(--lp-ink)] text-balance">
              {title}
            </h1>
            <p className="text-[15.5px] leading-[1.7] text-[var(--lp-ink-dim)] mt-6">{subtitle}</p>

            {steps && (
              <ul className="mt-8 flex flex-col gap-3">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-center gap-3 text-[14px] text-[var(--lp-ink-dim)]">
                    <span className="w-[22px] h-[22px] shrink-0 rounded-full border border-[var(--lp-violet-line)] bg-[var(--lp-violet-dim)] text-[var(--lp-violet)] font-mono text-[11px] flex items-center justify-center">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-3 text-[12.5px] text-[var(--lp-ink-faint)] font-mono">
            <span className="text-[var(--lp-violet)] tracking-widest">★★★★★</span>
            <span>Loved by modern teams</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-5 sm:p-8 relative">
        <div className="absolute inset-0 lg:hidden" style={{
          background: 'radial-gradient(700px 500px at 50% 0%, rgba(139,124,246,0.1), transparent 60%)',
        }} />
        <div className="relative z-10 w-full max-w-[440px]">
          {/* mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-[10px] text-[20px] font-semibold tracking-tight text-[var(--lp-ink)] w-fit mb-10">
            <Workflow className="w-[24px] h-[24px] text-[var(--lp-violet)]" />
            <span>Flow<span className="font-bold">grid</span></span>
          </Link>

          <div className="rounded-[20px] border border-[var(--lp-border)] p-7 sm:p-9 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)]" style={{ background: 'var(--lp-surface)' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="text-[13px] font-semibold text-[var(--lp-ink-dim)]">{label}</Label>
      <div className="relative">{children}</div>
      {error && <p className="text-[var(--lp-red)] text-xs font-medium">{error}</p>}
    </div>
  )
}


export default RegisterPage

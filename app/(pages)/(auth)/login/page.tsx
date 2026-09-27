'use client'
import React, { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { SignIn } from '@/app/actions/AuthActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Mail, Lock, Loader2, Workflow, ArrowRight } from 'lucide-react'
import { useAuth } from '@/app/context/ContextApiProvider'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginPageContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = (() => {
    const next = searchParams.get('next')
    if (!next || !next.startsWith('/') || next.startsWith('//')) return '/workspaces'
    return next
  })()
  const { user, loading: isCheckingAuth, refreshAuth } = useAuth()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (!isCheckingAuth && user) {
      router.replace(nextPath)
    }
  }, [user, isCheckingAuth, router, nextPath])

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await SignIn(data.email, data.password)

      if (result?.error) {
        setError('root', { message: result.error })
        toast.error(result.error)
      } else if (result?.success) {
        // Refresh auth context to immediately update navbar
        await refreshAuth()
        toast.success('Successfully logged in!')
        router.push(nextPath)
        router.refresh()
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
          <Loader2 className="w-8 h-8 animate-spin text-[var(--lp-accent)]" />
          <p className="text-[var(--lp-ink-dim)] font-medium tracking-wide">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title={<>Pick up right where <em className="not-italic text-[var(--lp-accent)]">your team</em> left off.</>}
      subtitle="Your boards, conversations, and notifications are exactly where you left them — synced in real time across the whole team."
    >
      <div className="mb-8">
        <h2 className="text-[26px] font-semibold tracking-tight text-[var(--lp-ink)]">Sign in</h2>
        <p className="text-[14px] text-[var(--lp-ink-dim)] mt-2">
          New to Flowgrid?{' '}
          <Link href="/register" className="text-[var(--lp-accent)] font-semibold hover:underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
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

        <Field
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          aside={
            <Link href="/forgot-password" className="text-xs font-semibold text-[var(--lp-ink-dim)] hover:text-[var(--lp-accent)] transition-colors">
              Forgot password?
            </Link>
          }
        >
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

        {errors.root && (
          <div className="p-3 rounded-lg border border-[var(--lp-red)]/30 bg-[var(--lp-red)]/10">
            <p className="text-[var(--lp-red)] text-xs font-medium text-center">{errors.root.message}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl text-[15px] font-semibold bg-[var(--lp-accent)] text-[#06140a] hover:bg-[#d6ff63] hover:shadow-[0_10px_30px_-8px_rgba(201,255,61,0.5)] transition-all border-0"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
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
  children,
}: {
  eyebrow: string
  title: React.ReactNode
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="landing-page min-h-screen w-full flex font-sans selection:bg-[var(--lp-accent)] selection:text-[#050607]" style={{ background: 'var(--lp-bg)', color: 'var(--lp-ink)' }}>
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden border-r border-[var(--lp-border)]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 30% 30%, black 0%, transparent 80%)',
        }} />
        <div className="absolute inset-0 animate-[mesh-drift_22s_ease-in-out_infinite]" style={{
          background: 'radial-gradient(700px 500px at 20% 20%, rgba(201,255,61,0.12), transparent 60%), radial-gradient(700px 600px at 90% 90%, rgba(139,124,246,0.12), transparent 60%)',
        }} />
        <div className="relative z-10 flex flex-col justify-between p-14">
          <Link href="/" className="flex items-center gap-[10px] text-[20px] font-semibold tracking-tight text-[var(--lp-ink)] w-fit">
            <Workflow className="w-[24px] h-[24px] text-[var(--lp-accent)]" />
            <span>Flow<span className="font-bold">grid</span></span>
          </Link>

          <div className="max-w-[440px]">
            <span className="inline-flex items-center gap-2 font-mono text-[11.5px] text-[var(--lp-accent)] tracking-widest uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--lp-accent)] animate-[pulse-ring_2.2s_infinite]" />
              {eyebrow}
            </span>
            <h1 className="font-serif font-normal text-[clamp(2.2rem,3.4vw,3.2rem)] leading-[1.08] tracking-tight text-[var(--lp-ink)] text-balance">
              {title}
            </h1>
            <p className="text-[15.5px] leading-[1.7] text-[var(--lp-ink-dim)] mt-6">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3 text-[12.5px] text-[var(--lp-ink-faint)] font-mono">
            <span className="text-[var(--lp-accent)] tracking-widest">★★★★★</span>
            <span>Loved by modern teams</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-5 sm:p-8 relative">
        <div className="absolute inset-0 lg:hidden" style={{
          background: 'radial-gradient(700px 500px at 50% 0%, rgba(201,255,61,0.08), transparent 60%)',
        }} />
        <div className="relative z-10 w-full max-w-[420px]">
          {/* mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-[10px] text-[20px] font-semibold tracking-tight text-[var(--lp-ink)] w-fit mb-10">
            <Workflow className="w-[24px] h-[24px] text-[var(--lp-accent)]" />
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
  aside,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor} className="text-[13px] font-semibold text-[var(--lp-ink-dim)]">{label}</Label>
        {aside}
      </div>
      <div className="relative">{children}</div>
      {error && <p className="text-[var(--lp-red)] text-xs font-medium">{error}</p>}
    </div>
  )
}


export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="landing-page flex justify-center items-center min-h-screen" style={{ background: 'var(--lp-bg)' }}>
        <Loader2 className="w-8 h-8 animate-spin text-[var(--lp-accent)]" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}

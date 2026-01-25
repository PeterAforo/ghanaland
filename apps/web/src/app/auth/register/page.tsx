'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  ShoppingBag,
  Briefcase,
  HardHat,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';

const STEPS = [
  { id: 'role', title: 'Account Type', description: 'Choose your role' },
  { id: 'details', title: 'Your Details', description: 'Personal info' },
  { id: 'credentials', title: 'Credentials', description: 'Email & password' },
  { id: 'review', title: 'Review', description: 'Confirm & submit' },
];

const ACCOUNT_TYPES = [
  {
    id: 'buyer',
    title: 'Buyer',
    description: 'Browse and purchase land',
    icon: ShoppingBag,
  },
  {
    id: 'seller',
    title: 'Seller',
    description: 'List and sell your land',
    icon: Building2,
  },
  {
    id: 'agent',
    title: 'Agent',
    description: 'Manage clients and listings',
    icon: Briefcase,
  },
  {
    id: 'professional',
    title: 'Professional',
    description: 'Offer services (surveyor, lawyer, etc.)',
    icon: HardHat,
  },
];

const registerSchema = z.object({
  accountType: z.enum(['buyer', 'seller', 'agent', 'professional']),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: 'buyer',
    },
  });

  const accountType = watch('accountType');
  const formValues = watch();

  const validateStep = async () => {
    switch (currentStep) {
      case 0:
        return await trigger('accountType');
      case 1:
        return await trigger(['fullName', 'phone']);
      case 2:
        return await trigger(['email', 'password', 'confirmPassword']);
      default:
        return true;
    }
  };

  const nextStep = async () => {
    const isValid = await validateStep();
    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);

    const result = await registerUser({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phone,
    });

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Registration failed');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-bold text-primary">
            Ghana Lands
          </Link>
          <p className="mt-2 text-muted-foreground">
            Create your account to get started
          </p>
        </div>

        {/* Stepper */}
        <Stepper steps={STEPS} currentStep={currentStep} className="mb-8" />

        <Card className="border-border bg-card dark:border-border dark:bg-card">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">
              {STEPS[currentStep].title}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {currentStep === 0 && 'Select how you want to use Ghana Lands'}
              {currentStep === 1 && 'Tell us about yourself'}
              {currentStep === 2 && 'Set up your login credentials'}
              {currentStep === 3 && 'Review your information before submitting'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm dark:bg-destructive/20">
                  {error}
                </div>
              )}

              {/* Step 1: Account Type */}
              {currentStep === 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {ACCOUNT_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = accountType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setValue('accountType', type.id as any)}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/5 dark:border-primary dark:bg-primary/10'
                            : 'border-border hover:border-primary/50 dark:border-border dark:hover:border-primary/50'
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{type.title}</p>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                        {isSelected && (
                          <Check className="ml-auto h-5 w-5 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step 2: Personal Details */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...register('fullName')}
                        placeholder="John Doe"
                        className="pl-10"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-xs text-destructive">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Phone Number <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...register('phone')}
                        placeholder="0241234567"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Credentials */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...register('email')}
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...register('confirmPassword')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3 dark:border-border dark:bg-muted/30">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Account Type</span>
                      <span className="text-sm font-medium text-foreground capitalize">
                        {formValues.accountType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Full Name</span>
                      <span className="text-sm font-medium text-foreground">
                        {formValues.fullName}
                      </span>
                    </div>
                    {formValues.phone && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Phone</span>
                        <span className="text-sm font-medium text-foreground">
                          {formValues.phone}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Email</span>
                      <span className="text-sm font-medium text-foreground">
                        {formValues.email}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    By creating an account, you agree to our{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between">
                {currentStep > 0 ? (
                  <Button type="button" variant="ghost" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < STEPS.length - 1 ? (
                  <Button type="button" variant="primary" onClick={nextStep}>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" variant="primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                )}
              </div>
            </form>

            {/* Login link */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Trust copy */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your data is stored securely and never shared without consent
        </p>
      </div>
    </div>
  );
}

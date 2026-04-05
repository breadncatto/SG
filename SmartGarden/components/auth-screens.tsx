"use client"

import { useState } from "react"
import { Sprout, ArrowLeft, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const API_BASE_URL = "https://mac4tpet6z.ap-southeast-1.awsapprunner.com"

export function WelcomeScreen({ onLogin, onRegister }: any) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8">
      {/* Giữ nguyên icon Sprout ở đây */}
      <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-8">
        <Sprout className="w-12 h-12 text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-2 text-balance text-center">Welcome to Smart Garden</h1>
      <p className="text-muted-foreground text-center mb-12 text-pretty">Manage your water pumps and monitor agricultural sensors with ease</p>
      <div className="w-full space-y-3">
        <Button onClick={onLogin} className="w-full py-6 rounded-2xl bg-primary text-primary-foreground text-lg font-medium">Login</Button>
        <Button onClick={onRegister} variant="outline" className="w-full py-6 rounded-2xl text-lg font-medium border-2">Register</Button>
      </div>
    </div>
  )
}

export function LoginScreen({ form, setForm, onBack, onLoginSuccess, onSwitchToRegister }: any) {
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({})
  const [touched, setTouched] = useState<{ username?: boolean; password?: boolean }>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const validateField = (field: string, value: string) => {
    if (!value.trim()) return "This field is required"
    return undefined
  }

  const handleBlur = (field: "username" | "password") => {
    setTouched({ ...touched, [field]: true })
    setErrors({ ...errors, [field]: validateField(field, form[field]) })
  }

  const handleSubmit = async () => {
    const errs = { username: validateField("username", form.username), password: validateField("password", form.password) }
    setErrors(errs); setTouched({ username: true, password: true })
    
    if (!errs.username && !errs.password) {
      setIsLoading(true)
      setServerError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: form.username, password: form.password }) // BE AuthenticationRequest yêu cầu username
        })
        
        if (response.ok) {
          const data = await response.json()
          if(data.token) localStorage.setItem("token", data.token)
          onLoginSuccess(data)
        } else {
          setServerError("Invalid username or password")
        }
      } catch (error) {
        setServerError("Network error. Please check your connection.")
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col px-6 pt-6">
      <button onClick={onBack} className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center hover:shadow-md mb-8"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
      <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
      <p className="text-muted-foreground mb-8">Sign in to continue</p>
      
      {serverError && <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-4 flex gap-3"><AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" /><p className="text-sm text-destructive">{serverError}</p></div>}
      
      <div className="space-y-4 flex-1">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Username</label>
          <Input placeholder="Enter your username" value={form.username} onChange={(e) => { setForm({ ...form, username: e.target.value }); setServerError(null); if (touched.username) setErrors({ ...errors, username: validateField("username", e.target.value) }) }} onBlur={() => handleBlur("username")} className={cn("rounded-xl py-6", touched.username && errors.username && "border-destructive")} disabled={isLoading} />
          {touched.username && errors.username && <p className="text-sm text-destructive mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.username}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Password</label>
          <div className="relative">
            <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); setServerError(null); if (touched.password) setErrors({ ...errors, password: validateField("password", e.target.value) }) }} onBlur={() => handleBlur("password")} className={cn("rounded-xl py-6 pr-10", touched.password && errors.password && "border-destructive")} disabled={isLoading} />
            {form.password.length > 0 && (
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            )}
          </div>
          {touched.password && errors.password && <p className="text-sm text-destructive mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.password}</p>}
        </div>
      </div>
      <div className="pb-8">
        <Button onClick={handleSubmit} disabled={isLoading} className="w-full py-6 rounded-2xl bg-primary text-primary-foreground text-lg font-medium mb-4">
          {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Signing in...</> : "Login"}
        </Button>
        <p className="text-center text-muted-foreground">{"Don't have an account? "} <button onClick={onSwitchToRegister} disabled={isLoading} className="text-primary font-medium">Register</button></p>
      </div>
    </div>
  )
}

export function RegisterScreen({ form, setForm, onBack, onRegisterSuccess, onSwitchToLogin }: any) {
  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateField = (field: string, value: string) => {
    if (!value.trim()) return "This field is required"
    if (field === "email" && !/\S+@\S+\.\S+/.test(value)) return "Invalid email format"
    if (field === "confirmPassword" && value !== form.password) return "Passwords do not match"
    if (field === "password" && value.length < 6) return "Password must be at least 6 characters"
    return undefined
  }

  const handleBlur = (field: string) => { setTouched({ ...touched, [field]: true }); setErrors({ ...errors, [field]: validateField(field, form[field]) }) }

  const handleSubmit = async () => {
    setServerError(null)
    const errs = { 
      fullName: validateField("fullName", form.fullName), 
      email: validateField("email", form.email),
      username: validateField("username", form.username), 
      password: validateField("password", form.password), 
      confirmPassword: validateField("confirmPassword", form.confirmPassword) 
    }
    setErrors(errs); setTouched({ fullName: true, email: true, username: true, password: true, confirmPassword: true })
    
    if (!Object.values(errs).some(Boolean)) {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/api/user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            fullName: form.fullName, 
            email: form.email, 
            userName: form.username, // BE CreateUserRequest yêu cầu trường userName
            password: form.password 
          })
        })
        
        if (response.ok) {
          onRegisterSuccess()
        } else {
          setServerError("Registration failed. Username or email might already exist.")
        }
      } catch (err) {
        setServerError("Network error. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col px-6 pt-6 overflow-y-auto">
      <button onClick={onBack} className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center hover:shadow-md mb-8 flex-shrink-0"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
      <h1 className="text-2xl font-bold text-foreground mb-2">Create account</h1>
      <p className="text-muted-foreground mb-6">Sign up to get started</p>
      
      {serverError && <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-4 flex gap-3"><AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" /><p className="text-sm text-destructive">{serverError}</p></div>}
      
      <div className="space-y-4 flex-1 pb-6">
        {[
          { id: "fullName", label: "Full Name", placeholder: "Enter your full name", type: "text" },
          { id: "email", label: "Email Address", placeholder: "name@example.com", type: "email" },
          { id: "username", label: "Username", placeholder: "Choose a username", type: "text" }
        ].map((field) => (
          <div key={field.id}>
            <label className="text-sm font-medium text-foreground mb-2 block">{field.label}</label>
            <Input type={field.type} placeholder={field.placeholder} value={form[field.id]} onChange={(e) => { setForm({ ...form, [field.id]: e.target.value }); setServerError(null); if (touched[field.id]) setErrors({ ...errors, [field.id]: validateField(field.id, e.target.value) }) }} onBlur={() => handleBlur(field.id)} className={cn("rounded-xl py-6", touched[field.id] && errors[field.id] && "border-destructive")} disabled={isLoading} />
            {touched[field.id] && errors[field.id] && <p className="text-sm text-destructive mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors[field.id]}</p>}
          </div>
        ))}
        
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Password</label>
          <div className="relative">
            <Input type={showPassword ? "text" : "password"} placeholder="Create a password" value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); if (touched.password) setErrors({ ...errors, password: validateField("password", e.target.value) }) }} onBlur={() => handleBlur("password")} className={cn("rounded-xl py-6 pr-10", touched.password && errors.password && "border-destructive")} disabled={isLoading} />
            {form.password.length > 0 && (
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            )}
          </div>
          {touched.password && errors.password && <p className="text-sm text-destructive mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.password}</p>}
        </div>
        
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Confirm Password</label>
          <div className="relative">
            <Input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={form.confirmPassword} onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); if (touched.confirmPassword) setErrors({ ...errors, confirmPassword: validateField("confirmPassword", e.target.value) }) }} onBlur={() => handleBlur("confirmPassword")} className={cn("rounded-xl py-6 pr-10", touched.confirmPassword && errors.confirmPassword && "border-destructive")} disabled={isLoading} />
            {form.confirmPassword.length > 0 && (
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            )}
          </div>
          {touched.confirmPassword && errors.confirmPassword && <p className="text-sm text-destructive mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.confirmPassword}</p>}
        </div>
      </div>
      <div className="pb-8">
        <Button onClick={handleSubmit} disabled={isLoading} className="w-full py-6 rounded-2xl bg-primary text-primary-foreground text-lg font-medium mb-4">
          {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating account...</> : "Sign Up"}
        </Button>
        <p className="text-center text-muted-foreground">Already have an account? <button onClick={onSwitchToLogin} disabled={isLoading} className="text-primary font-medium">Login</button></p>
      </div>
    </div>
  )
}
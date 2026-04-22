import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowRight, Shield, Zap, BarChart3, Globe } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function AuthPage() {
    const { login, signup, continueAsGuest } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("login")

    const [loginData, setLoginData] = useState({ email: "", password: "" })
    const [signupData, setSignupData] = useState({ name: "", email: "", password: "" })

    const handleLogin = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await login(loginData.email, loginData.password)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSignup = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await signup(signupData.name, signupData.email, signupData.password)
        } finally {
            setIsLoading(false)
        }
    }

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    }

    return (
        <div className="min-h-screen flex w-full bg-background overflow-hidden">
            {/* Left Side - Premium Hero Section */}
            <div className="hidden lg:flex w-[45%] relative items-center justify-center overflow-hidden mesh-gradient">
                {/* Animated Background Elements */}
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
                
                <div className="relative z-10 p-12 text-white max-w-xl">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="space-y-8"
                    >
                        <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <Zap className="text-primary-foreground w-7 h-7" />
                            </div>
                            <span className="text-3xl font-bold tracking-tighter">Schedra.</span>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <h1 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight">
                                Predict the future. <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                                    Deliver with precision.
                                </span>
                            </h1>
                            <p className="text-zinc-400 text-xl leading-relaxed max-w-md">
                                Empower your teams with AI-driven insights that transform uncertainty into strategic advantages.
                            </p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6 pt-4">
                            <div className="glass-dark p-6 rounded-2xl border border-white/5 space-y-2">
                                <BarChart3 className="w-8 h-8 text-blue-400 mb-2" />
                                <div className="text-3xl font-bold">98.4%</div>
                                <div className="text-sm text-zinc-400 font-medium">Forecast Accuracy</div>
                            </div>
                            <div className="glass-dark p-6 rounded-2xl border border-white/5 space-y-2">
                                <Shield className="w-8 h-8 text-emerald-400 mb-2" />
                                <div className="text-3xl font-bold">Zero</div>
                                <div className="text-sm text-zinc-400 font-medium">Risk Blindspots</div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex items-center gap-4 text-zinc-500 text-sm">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                                    </div>
                                ))}
                            </div>
                            <span>Joined by 10k+ project managers globally</span>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Glassy Overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none"></div>
            </div>

            {/* Right Side - Interactive Form Section */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[440px] space-y-8 relative z-10"
                >
                    <div className="text-center space-y-2">
                        <motion.div
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome Back</h2>
                            <p className="text-muted-foreground">The future of your projects starts here.</p>
                        </motion.div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-xl h-12 mb-8">
                            <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">
                                Sign In
                            </TabsTrigger>
                            <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">
                                Create Account
                            </TabsTrigger>
                        </TabsList>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: activeTab === "login" ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: activeTab === "login" ? 20 : -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <TabsContent value="login" className="mt-0 outline-none">
                                    <form onSubmit={handleLogin} className="space-y-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-semibold">Business Email</Label>
                                            <div className="relative group">
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="name@company.com"
                                                    required
                                                    className="h-12 bg-muted/30 border-transparent focus:border-primary/50 focus:ring-primary/20 transition-all pl-4 group-hover:bg-muted/50"
                                                    value={loginData.email}
                                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="password" title="Password" className="text-sm font-semibold">Password</Label>
                                                <a href="#" className="text-xs text-primary hover:underline font-medium">Forgot password?</a>
                                            </div>
                                            <Input
                                                id="password"
                                                type="password"
                                                required
                                                className="h-12 bg-muted/30 border-transparent focus:border-primary/50 focus:ring-primary/20 transition-all pl-4"
                                                value={loginData.password}
                                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                            />
                                        </div>
                                        <Button className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]" type="submit" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign In to Dashboard"}
                                        </Button>
                                    </form>
                                </TabsContent>

                                <TabsContent value="signup" className="mt-0 outline-none">
                                    <form onSubmit={handleSignup} className="space-y-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
                                            <Input
                                                id="name"
                                                placeholder="John Doe"
                                                required
                                                className="h-12 bg-muted/30 border-transparent focus:border-primary/50 focus:ring-primary/20 transition-all pl-4"
                                                value={signupData.name}
                                                onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-email" className="text-sm font-semibold">Business Email</Label>
                                            <Input
                                                id="signup-email"
                                                type="email"
                                                placeholder="name@company.com"
                                                required
                                                className="h-12 bg-muted/30 border-transparent focus:border-primary/50 focus:ring-primary/20 transition-all pl-4"
                                                value={signupData.email}
                                                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-password" name="signup-password" className="text-sm font-semibold">Password</Label>
                                            <Input
                                                id="signup-password"
                                                type="password"
                                                required
                                                className="h-12 bg-muted/30 border-transparent focus:border-primary/50 focus:ring-primary/20 transition-all pl-4"
                                                value={signupData.password}
                                                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                            />
                                        </div>
                                        <Button className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]" type="submit" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Create Your Account"}
                                        </Button>
                                    </form>
                                </TabsContent>
                            </motion.div>
                        </AnimatePresence>
                    </Tabs>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-muted" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-4 text-muted-foreground font-medium">Experience Schedra First</span>
                        </div>
                    </div>

                    <Button 
                        variant="outline" 
                        className="w-full h-12 border-2 hover:bg-muted/50 transition-all group font-semibold" 
                        onClick={continueAsGuest}
                    >
                        Continue as Guest 
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>

                    <p className="text-center text-xs text-muted-foreground px-8 leading-relaxed">
                        By continuing, you agree to our <a href="#" className="underline hover:text-primary">Terms of Service</a> and <a href="#" className="underline hover:text-primary">Privacy Policy</a>
                    </p>
                </motion.div>
            </div>
            
            {/* Subtle background globes for the entire page */}
            <div className="fixed top-[20%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed bottom-[-10%] left-[30%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
        </div>
    )
}

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, Users, Target, BarChart3 } from "lucide-react";
import { login } from "@/app/actions/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("admin");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const logUser = await login(email, password);
    if (
      logUser.status === 400 ||
      logUser.status === 401 ||
      logUser.status === 500
    ) {
      toast.error(logUser.message);
    } else {
      toast.success(logUser.message);
      router.push("/");
    }
    setIsLoading(false);
  };

  const features = [
    {
      icon: TrendingUp,
      title: "Pipeline Management",
      desc: "Visual Kanban boards",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      desc: "Role-based access control",
    },
    { icon: Target, title: "Deal Tracking", desc: "Never miss an opportunity" },
    { icon: BarChart3, title: "Analytics", desc: "Data-driven insights" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <motion.div
        className="hidden lg:flex lg:w-1/2 bg-sidebar p-12 flex-col justify-between"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-sidebar-foreground">
              SalesPro CRM
            </span>
          </div>

          <h1 className="text-4xl font-bold text-sidebar-foreground mb-6">
            Manage your sales pipeline with confidence
          </h1>
          <p className="text-lg text-sidebar-foreground/70 mb-12">
            Close more deals, track every interaction, and grow your revenue
            with our intuitive CRM platform.
          </p>

          <div className="grid grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-sidebar-accent/50 rounded-xl p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <feature.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-sidebar-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-sidebar-foreground/60">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-sidebar-foreground/50 text-sm">
          © 2024 SalesPro CRM. All rights reserved.
        </p>
      </motion.div>

      {/* Right side - Login Form */}
      <motion.div
        className="w-full lg:w-1/2 flex items-center justify-center p-8"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">SalesPro CRM</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
              />
            </div>

            {/* <div className="space-y-2">
              <Label>Sign in as</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    role === "admin"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium">Admin</div>
                  <div className="text-xs text-muted-foreground">
                    Full access
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    role === "user"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium">User</div>
                  <div className="text-xs text-muted-foreground">
                    Limited access
                  </div>
                </button>
              </div>
            </div> */}

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Demo mode: Click sign in to access the dashboard
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

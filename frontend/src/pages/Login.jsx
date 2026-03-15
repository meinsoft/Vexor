import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail ?? "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-vexor-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-[420px]"
      >
        <Card className="rounded-2xl border-vexor-border bg-vexor-card p-4 shadow-vexor">
          <CardHeader className="space-y-4 pb-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-vexor">
              <Shield className="h-8 w-8 text-[#080808]" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black tracking-[0.22em] text-white">VEXOR</CardTitle>
              <CardDescription className="text-base text-vexor-muted">Protect your inbox</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Signing In..." : "Sign In"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-vexor-muted">
              Need an account?{" "}
              <Link className="font-medium text-white hover:text-[#EEEEEE]" to="/register">
                Register
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

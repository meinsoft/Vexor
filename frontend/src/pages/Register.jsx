import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", company: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await register(form.email, form.password, form.company);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail ?? "Unable to create account.");
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
              <Input type="email" placeholder="Email" value={form.email} onChange={handleChange("email")} required />
              <Input type="password" placeholder="Password" value={form.password} onChange={handleChange("password")} required />
              <Input type="text" placeholder="Company (optional)" value={form.company} onChange={handleChange("company")} />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-vexor-muted">
              Already have an account?{" "}
              <Link className="font-medium text-white hover:text-[#EEEEEE]" to="/login">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

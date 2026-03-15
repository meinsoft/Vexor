import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Current user and organization settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-vexor-muted">Email</p>
            <p className="mt-1 font-medium">{user?.email ?? "--"}</p>
          </div>
          <div>
            <p className="text-sm text-vexor-muted">Company</p>
            <p className="mt-1 font-medium">{user?.company ?? "Not set"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform</CardTitle>
          <CardDescription>Frontend foundation placeholder for future preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-vexor-muted">
            Add notification settings, API environment switching, and extension connection controls here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

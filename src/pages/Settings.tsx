import { useState } from "react";
import { useMe } from "@/hooks/useAuth";
import { getUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle, Lock } from "lucide-react";

export default function Settings() {
  const cached = getUser();
  const { data: user } = useMe();
  const display = user ?? cached;

  // Delete account state
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  const handlePasswordChange = async () => {
    setPwError("");
    setPwSuccess("");

    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords don't match");
      return;
    }

    setPwLoading(true);
    try {
      await api.put("/v1/me/password", {
        currentPassword,
        newPassword,
      });
      setPwSuccess("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const apiErr = err as { message?: string; status?: number } | undefined;
      if (apiErr?.status === 404) {
        setPwError("Feature coming soon");
      } else if (apiErr?.status === 401) {
        setPwError("Current password is incorrect");
      } else {
        setPwError(apiErr?.message ?? "Something went wrong. Please try again.");
      }
    } finally {
      setPwLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      await api.delete("/v1/me", { confirmation: "DELETE" });
      localStorage.clear();
      setConfirmation("");
      setOpen(false);
      document.body.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0a0a;color:white;font-family:sans-serif;font-size:1.125rem;">Account deleted. Goodbye.</div>';
      setTimeout(() => {
        window.location.href = "https://versera.dev";
      }, 2000);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Something went wrong. Please try again.";
      setError(message);
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      {/* Profile */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Profile</h2>
        <Card>
          <CardContent className="flex items-center gap-5 p-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary">
              {display?.avatar ?? "?"}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate text-base font-medium">
                {display?.name ?? "—"}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {display?.email ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                To update your profile contact hello@versera.dev
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Security — Change password */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Security</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4" />
              Change password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm new password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </div>

            {pwError && (
              <p className="text-sm text-destructive">{pwError}</p>
            )}
            {pwSuccess && (
              <p className="text-sm text-emerald-500">{pwSuccess}</p>
            )}

            <Button
              onClick={handlePasswordChange}
              disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}
            >
              {pwLoading ? "Updating..." : "Update password"}
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Danger zone */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Danger zone</h2>
        <Card className="border-l-[3px] border-l-destructive">
          <CardHeader>
            <CardTitle className="text-base">Delete your account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all data — prompts, versions,
              API keys, and billing history. This cannot be undone.
            </p>
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => {
                setOpen(true);
                setConfirmation("");
                setError("");
              }}
            >
              Delete account
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Confirmation modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[440px] rounded-xl p-8">
          <DialogHeader className="items-center space-y-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <DialogTitle className="text-xl">
              Delete your account?
            </DialogTitle>
            <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
              This will permanently delete:
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>All prompts and version history</li>
                <li>All API keys</li>
                <li>Your billing history</li>
                <li>Your account</li>
              </ul>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Type DELETE to confirm:
              </label>
              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="DELETE"
                className="font-mono"
                autoComplete="off"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              variant="destructive"
              className="w-full"
              disabled={confirmation !== "DELETE" || deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting..." : "Delete my account"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

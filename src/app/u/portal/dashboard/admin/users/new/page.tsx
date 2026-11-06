"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Eye, EyeOff, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAlert } from "@/context/alert-context";
import { useToast } from "@/hooks/use-toast";
import { API_ORIGIN } from "@/lib/api-url";
import { managedColleges, useApplicationSettings } from "@/lib/application-settings";

type Role = "faculty" | "oa" | "admin";

const PASSWORD_GROUPS = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%*-_+="];
const PASSWORD_CHARACTERS = PASSWORD_GROUPS.join("");
const SUGGESTED_STRENGTH = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[\s\S]+$/;

function generatePassword(minimumLength: number) {
  const length = Math.min(128, Math.max(20, minimumLength));
  const values = new Uint32Array(length * 2);
  window.crypto.getRandomValues(values);
  const characters = PASSWORD_GROUPS.map((group, index) => group[values[index] % group.length]);
  for (let index = characters.length; index < length; index++) {
    characters.push(PASSWORD_CHARACTERS[values[index] % PASSWORD_CHARACTERS.length]);
  }
  for (let index = characters.length - 1; index > 0; index--) {
    const swapWith = values[length + index] % (index + 1);
    [characters[index], characters[swapWith]] = [characters[swapWith], characters[index]];
  }
  return characters.join("");
}

export default function AddSingleUserPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { toast } = useToast();
  const { settings, error: settingsError } = useApplicationSettings();
  const colleges = useMemo(() => (settings ? managedColleges(settings, true) : {}), [settings]);
  const [role, setRole] = useState<Role>("faculty");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [createdName, setCreatedName] = useState("");
  const passwordInitialized = useRef(false);
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const departments = college ? colleges[college] || {} : {};
  const minimumPasswordLength = settings?.passwordMinLength || 12;
  const passwordPattern = new RegExp(`^[\\s\\S]{${minimumPasswordLength},128}$`);
  const passwordValid = passwordPattern.test(password);
  const passwordSuggestedStrong = passwordValid && SUGGESTED_STRENGTH.test(password);

  useEffect(() => {
    if (!settings || passwordInitialized.current) return;
    passwordInitialized.current = true;
    setPassword(generatePassword(settings.passwordMinLength));
  }, [settings]);

  function useSuggestedPassword() {
    try {
      setPassword(generatePassword(minimumPasswordLength));
      setShowPassword(false);
    } catch {
      showAlert("Password generator unavailable", "Enter an initial password manually.");
    }
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password);
      toast({ title: "Password copied", description: "Share it securely with the new user." });
    } catch {
      showAlert("Could not copy password", "Use the show button and copy the password manually.");
    }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordValid) {
      showAlert("Invalid initial password", `Use ${minimumPasswordLength} to 128 characters.`);
      return;
    }
    if (!college || (role === "faculty" && !department)) {
      showAlert("Incomplete form", "Choose a college. Faculty accounts also require a department.");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      showAlert("Authentication error", "Please sign in again.");
      return;
    }
    setSaving(true);
    try {
      const body = new FormData();
      Object.entries({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        college,
        department,
        designation: designation.trim(),
        phone: phone.trim(),
      }).forEach(([key, value]) => body.append(key, value));
      const response = await fetch(`${API_ORIGIN}/api/v1/users`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Could not create the account.");
      setCreatedName(name.trim());
    } catch (error) {
      showAlert("Could not add user", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Button variant="ghost" asChild className="-ml-3">
        <Link href="/u/portal/dashboard/admin/users">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to users
        </Link>
      </Button>
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          <UserPlus className="h-7 w-7" />
          Add a single user
        </h1>
        <p className="mt-2 text-muted-foreground">
          Create one account and assign it to an active college and department.
        </p>
      </div>
      {settingsError && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {settingsError}
        </p>
      )}
      {createdName ? (
        <section className="space-y-5 rounded-xl border bg-card p-6 shadow-sm sm:p-8" role="status">
          <div>
            <h2 className="text-xl font-semibold">Account created for {createdName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Copy the initial password now and share it securely. It will not be shown again after you leave this page.
            </p>
          </div>
          <div className="max-w-lg space-y-2">
            <Label htmlFor="created-user-password">Initial password</Label>
            <div className="flex gap-2">
              <Input
                id="created-user-password"
                type={showPassword ? "text" : "password"}
                value={password}
                readOnly
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide initial password" : "Show initial password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button type="button" variant="outline" onClick={copyPassword}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => {
              setPassword("");
              router.push("/u/portal/dashboard/admin/users");
            }}
          >
            Done
          </Button>
        </section>
      ) : (
        <form onSubmit={createUser} className="space-y-8 rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Account details</h2>
              <p className="text-sm text-muted-foreground">The email address will be used for sign in.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-user-name">Full name</Label>
                <Input
                  id="new-user-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={200}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-email">Email</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-password">Initial password</Label>
                <div className="flex gap-2">
                  <Input
                    id="new-user-password"
                    type={showPassword ? "text" : "password"}
                    minLength={minimumPasswordLength}
                    maxLength={128}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="new-password"
                    aria-describedby="new-user-password-help"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide initial password" : "Show initial password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={useSuggestedPassword}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate another
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={copyPassword} disabled={!password}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
                <p id="new-user-password-help" className="text-xs text-muted-foreground">
                  {minimumPasswordLength} to 128 characters required. A strong password is suggested automatically; you
                  can edit it or generate another.
                </p>
                {password && (
                  <p
                    className={`text-xs ${passwordValid ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}`}
                  >
                    {passwordValid
                      ? passwordSuggestedStrong
                        ? "Meets the password rule and suggested strength."
                        : "Meets the password rule. Uppercase, lowercase, a number, and a symbol are recommended."
                      : `Needs at least ${minimumPasswordLength} characters.`}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-role">Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                  <SelectTrigger id="new-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="oa">Office Assistant</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
          <section className="space-y-4 border-t pt-6">
            <div>
              <h2 className="text-lg font-semibold">Institution assignment</h2>
              <p className="text-sm text-muted-foreground">
                Faculty require a department. Other roles may be assigned one.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-user-college">College</Label>
                <Select
                  value={college}
                  onValueChange={(value) => {
                    setCollege(value);
                    setDepartment("");
                  }}
                >
                  <SelectTrigger id="new-user-college">
                    <SelectValue placeholder="Select a college" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(colleges).map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-department">
                  Department {role === "faculty" ? "(required)" : "(optional)"}
                </Label>
                <Select value={department} onValueChange={setDepartment} disabled={!college}>
                  <SelectTrigger id="new-user-department">
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(departments).map(([group, names]) => (
                      <SelectGroup key={group}>
                        <SelectLabel>{group}</SelectLabel>
                        {names.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-designation">Designation (optional)</Label>
                <Input
                  id="new-user-designation"
                  value={designation}
                  onChange={(event) => setDesignation(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-phone">Phone (optional)</Label>
                <Input
                  id="new-user-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                />
              </div>
            </div>
          </section>
          <div className="flex flex-wrap items-center gap-3 border-t pt-6">
            <Button type="submit" disabled={saving || !settings || !Object.keys(colleges).length || !passwordValid}>
              {saving ? "Creating user..." : "Create user"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/u/portal/dashboard/admin/users">Cancel</Link>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

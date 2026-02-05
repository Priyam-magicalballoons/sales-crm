"use client";

import React, { useEffect, useState } from "react";
import {
  UserIcon,
  Bell,
  Shield,
  Palette,
  Globe,
  Mail,
  Save,
  Users,
  Building2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
// import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/helpers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changePassword,
  createUser,
  getAllUsers,
  updateUserProfile,
} from "@/app/actions/users";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { User } from "@/types/crm";
import AddUserModal from "@/components/crm/AddUserModal";

const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const data = await getCurrentUser();
      setName(data?.name ?? "");
      setEmail(data?.email ?? "");
      return data;
    },
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const router = useRouter();

  const { data: USERS = [] } = useQuery({
    queryKey: ["users"],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const res = (await getAllUsers()) as {
        status: number;
        message?: string;
        users: User[];
      };

      if (res.status === 401) {
        router.push("/login");
      } else if (res.status !== 200) {
        toast.message(res.message);
      } else {
        return res.users;
      }
    },
  });

  const updateUserData = useMutation({
    mutationFn: async () => {
      return await updateUserProfile(name, email, currentUser?.id!);
    },
    onMutate: async () => {
      const previousData = queryClient.getQueryData<any>(["current-user"]);

      queryClient.setQueryData<any>(["current-user"], (old: any) =>
        old ? { ...old, name, email } : old,
      );

      return { previousData };
    },

    onError: (_err, _vars, context) => {
      // Rollback on failure
      if (context?.previousData) {
        queryClient.setQueryData(["current-user"], context.previousData);
      }
    },

    onSuccess: (updatedUser) => {
      // Ensure cache is in sync with server
      toast.success("User updated");
      queryClient.setQueryData(["current-user"], { name, email });
    },
  });

  const updatePassword = useMutation({
    mutationFn: async () => {
      if (!currentPassword || !newPassword || !confirmPassword) {
        return toast.error("All fields are mandatory");
      }
      if (newPassword !== confirmPassword) {
        return toast.error(
          "New password and confirm password should be matching",
        );
      }
      if (currentPassword === newPassword) {
        return toast.error("Current password and new password cannot be same.");
      }
      const data = await changePassword(
        currentPassword,
        newPassword,
        currentUser?.id!,
      );

      if (data.status === 200) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }

      toast.message(data.message);
    },
  });

  // const currentUser = await getCurrentUser();

  const isAdmin = currentUser?.role === "ADMIN";

  const handleSaveProfile = () => {
    if (!name || !email) {
      return toast.error("kindly fill all the fields");
    }
    if (name === currentUser?.name && email === currentUser.email) {
      return toast.error("Kindly make any changes in data to update");
    }
    updateUserData.mutate();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 ">
          <TabsTrigger value="profile" className="gap-2 cursor-pointer">
            <UserIcon className="w-4 h-4" />
            Profile
          </TabsTrigger>
          {/* {isAdmin && ( */}
          <TabsTrigger value="security" className="gap-2 cursor-pointer">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          {/* )} */}
          {isAdmin && (
            <TabsTrigger value="team" className="gap-2">
              <Users className="w-4 h-4" />
              Team
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl  font-bold">
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {currentUser?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={currentUser?.role || ""}
                    disabled
                    className="capitalize"
                  />
                </div>
                {/* <div className="space-y-2">
                  <Label>User ID</Label>
                  <Input value={currentUser?.id || ""} disabled />
                </div> */}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        {/* <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Deal Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when deals move through the pipeline
                    </p>
                  </div>
                  <Switch
                    checked={dealUpdates}
                    onCheckedChange={setDealUpdates}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a weekly summary of your sales performance
                    </p>
                  </div>
                  <Switch
                    checked={weeklyReports}
                    onCheckedChange={setWeeklyReports}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Mentions</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone mentions you
                    </p>
                  </div>
                  <Switch
                    checked={mentionNotifications}
                    onCheckedChange={setMentionNotifications}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* Preferences Tab */}
        {/* <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>
                Customize how the application looks and behaves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Language
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Theme
                  </Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Currency Display</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="gbp">GBP (£)</SelectItem>
                    <SelectItem value="jpy">JPY (¥)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSavePreferences} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* Team Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      Manage your team and their permissions
                    </CardDescription>
                  </div>
                  <Button
                    className="gap-2"
                    onClick={() => setIsAddUserModalOpen(true)}
                  >
                    <Users className="w-4 h-4" />
                    Invite Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {USERS.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {member.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              member.role === "ADMIN" ? "default" : "secondary"
                            }
                          >
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-stage-won border-stage-won"
                          >
                            Active
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <AddUserModal
              open={isAddUserModalOpen}
              onOpenChange={setIsAddUserModalOpen}
            />
          </TabsContent>
        )}

        {/* Security Tab (Admin only) */}
        {/* {isAdmin && ( */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div></div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => updatePassword.mutate()}
                >
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Currently disabled. Enable to secure your account.
                    </p>
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions that affect your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/10">
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* )} */}
      </Tabs>
    </div>
  );
};

export default Settings;

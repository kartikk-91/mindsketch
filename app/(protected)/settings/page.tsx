"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const [isUpdating, setIsUpdating] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#20C5A8]" />
      </div>
    );
  }

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U";

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      await user?.update({
        firstName,
        lastName,
      });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = () => {
    clerk.signOut({ redirectUrl: "/sign-in" });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#181C31]">Account Settings</h1>
        <p className="text-[#696969] mt-1">Manage your account information</p>
      </div>

      <Card className="border-[#EEEEEE] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#181C31]">
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
              <AvatarFallback className="bg-[#20C5A8] text-white text-xl font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-[#181C31]">{user?.fullName || "User"}</p>
              <p className="text-sm text-[#696969]">
                {user?.emailAddresses?.[0]?.emailAddress}
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-[#181C31]">
                First Name
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="border-[#EEEEEE] focus:border-[#20C5A8]"
                placeholder="Enter your first name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-[#181C31]">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="border-[#EEEEEE] focus:border-[#20C5A8]"
                placeholder="Enter your last name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#181C31]">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999AA1]" />
                <Input
                  id="email"
                  value={user?.emailAddresses?.[0]?.emailAddress || ""}
                  disabled
                  className="pl-10 border-[#EEEEEE] bg-[#FBFBFB]"
                />
              </div>
              <p className="text-xs text-[#999AA1]">
                Email cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isUpdating}
              className="bg-[#20C5A8] hover:bg-[#18A090] text-white"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-[#EEEEEE] shadow-sm mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#181C31]">
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

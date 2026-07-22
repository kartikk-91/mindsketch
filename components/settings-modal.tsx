"use client";

import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const DEFAULT_AVATARS = [
  "/avatars/aurora.svg",
  "/avatars/coral.svg",
  "/avatars/lilac.svg",
  "/avatars/sun.svg",
  "/avatars/ocean.svg",
];

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const { user, isLoaded } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (open && isLoaded) {
      setFirstName(user?.firstName || "");
      setLastName(user?.lastName || "");
      setSelectedAvatar(null);
    }
  }, [isLoaded, open, user?.firstName, user?.lastName]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      await user?.update({
        firstName,
        lastName,
      });
      if (selectedAvatar) {
        const image = new Image();
        image.src = selectedAvatar;
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("Unable to prepare the selected avatar."));
        });
        const canvas = document.createElement("canvas");
        canvas.width = 192;
        canvas.height = 192;
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Unable to prepare the selected avatar.")), "image/png"));
        const file = new File([png], "profile-picture.png", { type: "image/png" });
        await user?.setProfileImage({ file });
      }
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };
  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] overflow-hidden rounded-[28px] border-[#E9EAE7] bg-white p-0 shadow-2xl shadow-[#181C31]/10">
        <DialogHeader className="border-b border-[#EEF0EC] bg-[#F7FAF2] px-7 pb-6 pt-7 text-left">
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-[#181C31]">Account settings</DialogTitle>
          <p className="mt-2 text-sm text-[#73757E]">Keep your profile details up to date.</p>
        </DialogHeader>
        <div className="space-y-6 px-7 py-7">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
              <AvatarFallback className="bg-[#20C5A8] text-white text-lg font-semibold">
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

          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#181C31]">Profile picture</Label>
            <div className="flex gap-2">
              {DEFAULT_AVATARS.map((imageUrl, index) => <button key={imageUrl} type="button" disabled={isUpdating} onClick={() => setSelectedAvatar(imageUrl)} className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#20C5A8] focus:ring-offset-2" aria-label={`Choose default avatar ${index + 1}`}><Avatar className={`h-10 w-10 border-2 ${selectedAvatar === imageUrl ? "border-[#20C5A8]" : "border-transparent"}`}><AvatarImage src={imageUrl} alt="" /><AvatarFallback>{index + 1}</AvatarFallback></Avatar></button>)}
            </div>
            <p className="text-xs text-[#999AA1]">Choose a picture, then click Save changes to apply it.</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="flex w-full gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-[#181C31]">
                  First name
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
                  Last name
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="border-[#EEEEEE] focus:border-[#20C5A8]"
                  placeholder="Enter your last name"
                />
              </div>
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
              className="w-full rounded-full bg-[#181C31] font-semibold text-white shadow-md shadow-[#181C31]/15 hover:bg-[#30364F]"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </form>

          {/* <div className="pt-4 border-t border-[#EEEEEE]">
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full rounded-full border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div> */}
        </div>
      </DialogContent>
    </Dialog>
  );
};

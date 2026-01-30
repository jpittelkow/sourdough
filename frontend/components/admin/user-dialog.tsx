"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
  is_admin: z.boolean(),
  skip_verification: z.boolean().optional(),
});

type UserForm = z.infer<typeof userSchema>;

interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
}

interface UserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserDialog({ user, open, onOpenChange, onSuccess }: UserDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      is_admin: false,
      skip_verification: false,
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        password: "",
        is_admin: user.is_admin,
      });
    } else {
      reset({
        name: "",
        email: "",
        password: "",
        is_admin: false,
        skip_verification: false,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UserForm) => {
    setIsSaving(true);
    try {
      if (isEditing) {
        const updateData: any = {
          name: data.name,
          email: data.email,
          is_admin: data.is_admin,
        };
        if (data.password) {
          updateData.password = data.password;
        }
        await api.put(`/users/${user.id}`, updateData);
        toast.success("User updated successfully");
      } else {
        if (!data.password) {
          toast.error("Password is required for new users");
          setIsSaving(false);
          return;
        }
        await api.post("/users", {
          name: data.name,
          email: data.email,
          password: data.password,
          is_admin: data.is_admin,
          skip_verification: data.skip_verification ?? false,
        });
        toast.success("User created successfully");
      }
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${isEditing ? "update" : "create"} user`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Create User"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update user information and permissions."
              : "Create a new user account."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {isEditing && "(leave blank to keep current)"}
              </Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder={isEditing ? "Enter new password" : "Enter password"}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Admin</Label>
                <p className="text-sm text-muted-foreground">
                  Grant administrator privileges
                </p>
              </div>
              <Switch
                checked={watch("is_admin")}
                onCheckedChange={(checked) => setValue("is_admin", checked)}
              />
            </div>

            {!isEditing && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Skip email verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Create user as already verified (no verification email sent)
                  </p>
                </div>
                <Switch
                  checked={watch("skip_verification") ?? false}
                  onCheckedChange={(checked) => setValue("skip_verification", checked)}
                />
              </div>
            )}

            {!isEditing && !(watch("skip_verification") ?? false) && (
              <p className="text-sm text-muted-foreground">
                A verification email will be sent to the user if email is configured.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

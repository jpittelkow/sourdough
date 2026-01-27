"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Shield, ShieldOff, Key, Trash2, Edit } from "lucide-react";
import { UserDialog } from "./user-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  is_admin: boolean;
  email_verified_at: string | null;
  created_at: string;
}

interface UserTableProps {
  users: User[];
  onUserUpdated: () => void;
}

export function UserTable({ users, onUserUpdated }: UserTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setUserToResetPassword(user);
    setPasswordDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const { api } = await import("@/lib/api");
      await api.delete(`/users/${userToDelete.id}`);
      const { toast } = await import("sonner");
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      onUserUpdated();
    } catch (error: any) {
      const { toast } = await import("sonner");
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const confirmResetPassword = async () => {
    if (!userToResetPassword || !newPassword) return;

    setIsResetting(true);
    try {
      const { api } = await import("@/lib/api");
      await api.post(`/users/${userToResetPassword.id}/reset-password`, {
        password: newPassword,
      });
      const { toast } = await import("sonner");
      toast.success("Password reset successfully");
      setPasswordDialogOpen(false);
      setUserToResetPassword(null);
      setNewPassword("");
    } catch (error: any) {
      const { toast } = await import("sonner");
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleAdmin = async (user: User) => {
    try {
      const { api } = await import("@/lib/api");
      await api.post(`/users/${user.id}/toggle-admin`);
      const { toast } = await import("sonner");
      toast.success("Admin status updated");
      onUserUpdated();
    } catch (error: any) {
      const { toast } = await import("sonner");
      toast.error(error.response?.data?.message || "Failed to update admin status");
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{user.name}</div>
                    {user.is_admin && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {user.email_verified_at ? (
                  <Badge variant="default" className="bg-green-500">
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary">Unverified</Badge>
                )}
              </TableCell>
              <TableCell>
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleEdit(user)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                      <Key className="mr-2 h-4 w-4" />
                      Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleToggleAdmin(user)}>
                      {user.is_admin ? (
                        <>
                          <ShieldOff className="mr-2 h-4 w-4" />
                          Remove Admin
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Make Admin
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(user)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <UserDialog
        user={editingUser}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={onUserUpdated}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter a new password for {userToResetPassword?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmResetPassword} disabled={!newPassword || isResetting}>
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

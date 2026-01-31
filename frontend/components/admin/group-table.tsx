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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Shield,
  Check,
} from "lucide-react";
import { GroupDialog } from "./group-dialog";
import { MemberManager } from "./member-manager";
import { PermissionMatrix } from "./permission-matrix";

export interface Group {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  is_default: boolean;
  members_count?: number;
  created_at: string;
  updated_at: string;
}

interface GroupTableProps {
  groups: Group[];
  onGroupsUpdated: () => void;
}

export function GroupTable({ groups, onGroupsUpdated }: GroupTableProps) {
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [memberManagerGroup, setMemberManagerGroup] = useState<Group | null>(null);
  const [permissionMatrixGroup, setPermissionMatrixGroup] = useState<Group | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  };

  const handleDelete = (group: Group) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;
    try {
      const { api } = await import("@/lib/api");
      await api.delete(`/groups/${groupToDelete.id}`);
      const { toast } = await import("sonner");
      toast.success("Group deleted successfully");
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
      onGroupsUpdated();
    } catch (error: unknown) {
      const { toast } = await import("sonner");
      const err = error as Error & { response?: { data?: { message?: string } } };
      toast.error(err.message || err.response?.data?.message || "Failed to delete group");
    }
  };

  const handleSuccess = () => {
    onGroupsUpdated();
    setGroupDialogOpen(false);
    setEditingGroup(null);
  };

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead>Members</TableHead>
              <TableHead className="hidden md:table-cell">Default</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{group.name}</span>
                    {group.is_system && (
                      <Badge variant="secondary" className="text-xs">
                        System
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden max-w-[200px] truncate md:table-cell text-muted-foreground">
                  {group.description || "—"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-primary"
                    onClick={() => setMemberManagerGroup(group)}
                  >
                    {group.members_count ?? 0} member{(group.members_count ?? 0) !== 1 ? "s" : ""}
                  </Button>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {group.is_default ? (
                    <Check className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 min-h-11 min-w-11"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(group)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setMemberManagerGroup(group)}>
                        <Users className="mr-2 h-4 w-4" />
                        Manage Members
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPermissionMatrixGroup(group)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Manage Permissions
                      </DropdownMenuItem>
                      {!group.is_system && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(group)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <GroupDialog
        group={editingGroup}
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        onSuccess={handleSuccess}
      />

      {memberManagerGroup && (
        <MemberManager
          group={memberManagerGroup}
          open={!!memberManagerGroup}
          onOpenChange={(open) => !open && setMemberManagerGroup(null)}
          onSuccess={onGroupsUpdated}
        />
      )}

      {permissionMatrixGroup && (
        <PermissionMatrix
          group={permissionMatrixGroup}
          open={!!permissionMatrixGroup}
          onOpenChange={(open) => !open && setPermissionMatrixGroup(null)}
          onSuccess={onGroupsUpdated}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {groupToDelete?.name}? This action cannot be undone.
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
    </>
  );
}

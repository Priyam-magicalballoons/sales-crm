"use client";

import React, { useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@/types/crm";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "@/app/actions/users";

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ open, onOpenChange }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const router = useRouter();
  const queryClient = useQueryClient();

  const addUser = useMutation({
    mutationFn: async () => {
      const res = await createUser(name, email, role);

      if (res.status === 401) throw new Error("UNAUTHORIZED");
      if (res.status !== 201) throw new Error(res.message);

      return res;
    },

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["users"] });

      const previousData = queryClient.getQueryData<User[]>(["users"]);

      const tempId = "temp-" + Date.now();
      queryClient.setQueryData<User[]>(["users"], (old = []) => {
        return [...old, { name, email, role, id: tempId }];
      });
      onOpenChange(false);
      return { previousData, tempId };
    },

    onError: (err: any, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["users"], context.previousData);
      }

      if (err.message === "UNAUTHORIZED") {
        toast.error("Please login again");
        router.push("/login");
        return;
      }

      toast.error(err.message);
    },

    onSuccess: (data: any, _vars, context) => {
      toast.success(data.message);
      queryClient.setQueryData<User[]>(["users"], (old = []) =>
        old.map((u) => (u.id === context?.tempId ? data.user : u)),
      );
      handleClose();
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      addUser.mutate();
    } catch (error) {
      toast.error("Failed to add user. Please try again.");
    }
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setRole("USER");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add New User
          </DialogTitle>
          <DialogDescription>
            Create a new team member account. They will receive an invitation
            email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">Full Name *</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">Email Address *</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-role">Role *</Label>
            <Select
              value={role}
              onValueChange={(value: "ADMIN" | "USER") => setRole(value)}
            >
              <SelectTrigger id="user-role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Admins can manage all clients and team settings. Users can only
              manage their assigned clients.
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={addUser.isPending}>
              {addUser.isPending ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;

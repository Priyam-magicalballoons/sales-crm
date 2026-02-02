import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { useClients, MOCK_USERS } from "@/context/ClientContext";
// import { useAuth } from "@/context/AuthContext";
import { Client, Stage, STAGES } from "@/types/crm";
import { Loader2 } from "lucide-react";
import { createClient } from "@/app/actions/client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ open, onClose }) => {
  // const { addClient } = useClients();
  // const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    dealValue: "",
    stage: "lead" as Stage,
    notes: "",
    createdAt: new Date(Date.now()),
  });

  class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }

  // ERROR HERE
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new ApiError("Network error", res.status);
      }

      const data = await res.json();

      // console.log(data);
      if (data.status !== 200) {
        throw new ApiError(data.message || "Something went wrong", data.status);
      }

      return data.message;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["clients"] });
      const previousClients = queryClient.getQueryData<any[]>(["clients"]);

      queryClient.setQueryData<any[]>(["clients"], (old = []) => [
        ...old,
        formData,
      ]);

      return { previousClients };
    },

    onError: (err: any, _title, context) => {
      if (err?.status === 401) {
        toast.error(err.message);
        router.push("/login");
      } else {
        toast.error(err.message ?? "Failed to add client");
      }
      onClose();
      // queryClient.setQueryData(["clients"], context?.previousClients);
    },

    // 3️⃣ After success or error, refetch
    onSuccess: (message) => {
      toast.success(message);
      onClose();
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsLoading(true);

  //   console.log("inside");

  //   mutation.mutate();

  //   if (mutation.isSuccess) {
  //     setIsLoading(false);
  //   }

  //   // await new Promise((resolve) => setTimeout(resolve, 500));

  //   // const assignedUser = MOCK_USERS.find(
  //   //   (u) => u.id === formData.assignedUserId,
  //   // );

  //   // addClient({
  //   //   name: formData.name,
  //   //   company: formData.company,
  //   //   email: formData.email,
  //   //   phone: formData.phone,
  //   //   dealValue: formData.dealValue,
  //   //   stage: formData.stage,
  //   //   assignedUserId: formData.assignedUserId,
  //   //   assignedUserName: assignedUser?.name || "Unassigned",
  //   //   notes: formData.notes,
  //   // });

  //   // setFormData({
  //   //   name: "",
  //   //   company: "",
  //   //   email: "",
  //   //   phone: "",
  //   //   dealValue: "",
  //   //   stage: "lead",
  //   //   assignedUserId: user?.id || "",
  //   //   notes: "",
  //   // });
  //   setIsLoading(false);
  //   onClose();
  // };

  const formatPhone = (value: string) => {
    // remove all non-digits
    const digits = value.replace(/\D/g, "").slice(0, 10);

    const len = digits.length;
    if (len < 4) return digits;
    if (len < 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4 mt-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="John Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, company: e.target.value }))
                }
                placeholder="Acme Inc."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="john@acme.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                inputMode="numeric"
                value={formData.phone}
                onChange={(e) => {
                  let formatedPhone = formatPhone(e.target.value);
                  setFormData((prev) => ({ ...prev, phone: formatedPhone }));
                }}
                placeholder="555 012 1234"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dealValue">Deal Value ($)</Label>
              <Input
                id="dealValue"
                type="number"
                value={formData.dealValue}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dealValue: e.target.value,
                  }))
                }
                placeholder="50000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Select
                value={formData.stage}
                onValueChange={(value: Stage) =>
                  setFormData((prev) => ({ ...prev, stage: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="assignedUser">Assigned To</Label>
            <Select
              value={formData.assignedUserId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, assignedUserId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_USERS.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> */}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Add any relevant notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="cursor-pointer"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Client"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientModal;

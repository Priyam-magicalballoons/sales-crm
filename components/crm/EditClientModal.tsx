import React, { useState, useEffect } from "react";
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
import { Client, Stage, STAGES } from "@/types/crm";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { client } from "@/db/schema";

interface EditClientModalProps {
  client: Client;
  open: boolean;
  onClose: () => void;
}

const EditClientModal: React.FC<EditClientModalProps> = ({
  client,
  open,
  onClose,
}) => {
  // const { updateClient } = useClients();
  // const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone,
    deal_value: client.deal_value,
    stage: client.stage,
    assignedUserId: client.creator_name,
    notes: client.notes,
  });

  useEffect(() => {
    setFormData({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      deal_value: client.deal_value,
      stage: client.stage,
      assignedUserId: client.creator_name,
      notes: client.notes,
    });
  }, [client]);
  const queryClient = useQueryClient();
  const updateClient = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/client", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: client.id, ...formData }),
      });
      const data = await res.json();
      toast.message(data.message);
    },

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["clients"] });
      const previousClients = queryClient.getQueryData<any[]>(["clients"]);

      queryClient.setQueryData<any[]>(["clients"], (old = []) =>
        old?.map((prev) =>
          prev.id === client.id ? { ...prev, ...formData } : prev,
        ),
      );

      return { previousClients };
    },

    onError: (err, title, context) => {
      queryClient.setQueryData<any[]>(["clients"], context?.previousClients);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setIsLoading(true);

    // const assignedUser = MOCK_USERS.find(
    //   (u) => u.id === formData.assignedUserId,
    // );

    // updateClient(client.id, {
    //   name: formData.name,
    //   company: formData.company,
    //   email: formData.email,
    //   phone: formData.phone,
    //   deal_value: formData.deal_value || 0,
    //   stage: formData.stage,
    //   assignedUserId: formData.assignedUserId,
    //   assignedUserName: assignedUser?.name || "Unassigned",
    //   notes: formData.notes,
    // });

    // setIsLoading(false);

    updateClient.mutate();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Client Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Company *</Label>
              <Input
                id="edit-company"
                value={formData.company}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, company: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-deal_value">Deal Value ($)</Label>
              <Input
                id="edit-deal_value"
                type="number"
                value={formData.deal_value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    deal_value: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stage">Stage</Label>
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

          <div className="space-y-2">
            <Label htmlFor="edit-assignedUser">Assigned To</Label>
            <Select
              value={formData.assignedUserId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, assignedUserId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              {/* <SelectContent>
                {USERS.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </SelectItem>
                ))}
              </SelectContent> */}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClientModal;

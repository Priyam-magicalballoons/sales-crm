import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// import { useClients } from "@/context/ClientContext";
import { Client } from "@/types/crm";
import {
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

interface DeleteClientDialogProps {
  client: Client;
  open: boolean;
  onClose: () => void;
}

const DeleteClientDialog: React.FC<DeleteClientDialogProps> = ({
  client,
  open,
  onClose,
}) => {
  // const { deleteClient } = useClients();

  const queryClient = useQueryClient();

  const deleteClient = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/client", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientId: client.id }),
      });

      const data = await res.json();
      toast.success(data.message);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["clients"] });
      const previousClients = queryClient.getQueryData<any[]>(["clients"]);

      queryClient.setQueryData<any[]>(["clients"], (old) =>
        old?.filter((prev) => prev.id !== client.id),
      );

      return { previousClients };
    },
    onError: (error, title, context) => {
      queryClient.setQueryData<any[]>(["clients"], context?.previousClients);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });

  const handleDelete = () => {
    // deleteClient(client.id);
    deleteClient.mutate();
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Client</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{client.name}</strong> from{" "}
            {client.company}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteClientDialog;

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Client } from "@/types/crm";
import {
  Building2,
  DollarSign,
  User,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  IndianRupeeIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import ClientDetailsModal from "./ClientDetailsModal";
import EditClientModal from "./EditClientModal";
import DeleteClientDialog from "./DeleteClientDialog";

interface ClientCardProps {
  client: Client;
  isDragging?: boolean;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, isDragging }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: client.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`client-card ${isDragging || isSortableDragging ? "dragging" : ""} `}
        whileHover={{ scale: 1.02 }}
        layout
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-card-foreground truncate">
              {client.name}
            </h4>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-0.5">
              <Building2 className="w-3.5 h-3.5" />
              <span className="truncate">{client.company}</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 -mr-2 -mt-1"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowDetails(true)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowEdit(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDelete(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm">
              <IndianRupeeIcon className="w-4 h-4 text-green-600" />
              <span className="font-medium">
                {formatCurrency(client.deal_value!)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <User className="w-3.5 h-3.5" />
            <span>{client.creator_name}</span>
          </div>
        </div>

        {client.notes && (
          <p className="mt-3 text-xs text-muted-foreground line-clamp-2 border-t border-border pt-3">
            {client.notes}
          </p>
        )}
      </motion.div>

      <ClientDetailsModal
        client={client}
        open={showDetails}
        onClose={() => setShowDetails(false)}
      />

      <EditClientModal
        client={client}
        open={showEdit}
        onClose={() => setShowEdit(false)}
      />

      <DeleteClientDialog
        client={client}
        open={showDelete}
        onClose={() => setShowDelete(false)}
      />
    </>
  );
};

export default ClientCard;

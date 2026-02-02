import React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Client, STAGES } from "@/types/crm";
import {
  Building2,
  Mail,
  Phone,
  DollarSign,
  User,
  Calendar,
  FileText,
  IndianRupeeIcon,
} from "lucide-react";

interface ClientDetailsModalProps {
  client: Client;
  open: boolean;
  onClose: () => void;
}

const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  client,
  open,
  onClose,
}) => {
  const stage = STAGES.find((s) => s.id === client.stage);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {client.name}
            {stage && (
              <span className={`stage-badge ${stage.color}`}>
                {stage.label}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Company Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Company Information
            </h4>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span>{client.company}</span>
              </div>
              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={`mailto:${client.email}`}
                    className="text-primary hover:underline"
                  >
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Deal Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Deal Information
            </h4>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <IndianRupeeIcon className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-lg">
                  {formatCurrency(client.deal_value)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>Assigned to {client.creator_name}</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Timeline
            </h4>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  Created:{" "}
                  {format(new Date(client.createdAt ?? ""), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  Updated:{" "}
                  {client.updatedAt
                    ? format(new Date(client.updatedAt ?? ""), "MMM d, yyyy")
                    : format(new Date(client.createdAt ?? ""), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Notes
              </h4>
              <div className="flex gap-3">
                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm">{client.notes}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDetailsModal;

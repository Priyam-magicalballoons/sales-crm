import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Client, StageConfig } from "@/types/crm";
import ClientCard from "./ClientCard";

interface KanbanColumnProps {
  stage: StageConfig;
  clients: Client[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ stage, clients }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  const totalValue = clients.reduce((sum, c) => sum + Number(c.deal_value), 0);

  return (
    <div
      ref={setNodeRef}
      className={`pipeline-column w-72 transition-colors ${
        isOver ? "bg-primary/5 ring-2 ring-primary/20" : ""
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className={`stage-badge text-white ${stage.color}`}>
            {stage.label}
          </span>
          <span className="text-sm text-muted-foreground font-medium">
            {clients.length}
          </span>
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          ${totalValue.toLocaleString()}
        </span>
      </div>

      {/* Cards */}
      <SortableContext
        items={clients.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 flex-1">
          {clients.map((client, index) => (
            <ClientCard key={`${client.id}${index}`} client={client} />
          ))}
        </div>
      </SortableContext>

      {/* Empty state */}
      {clients.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm py-12">
          No deals in this stage
        </div>
      )}
    </div>
  );
};

export default KanbanColumn;

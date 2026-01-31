"use client";

import React, { useState, useMemo, useEffect, useLayoutEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  MeasuringStrategy,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Client, Stage, STAGES } from "@/types/crm";
import KanbanColumn from "./KanbanColumn";
import ClientCard from "./ClientCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClients, updateClientStage } from "@/app/actions/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Loader from "../Loader";
import ErrorCard from "../ErrorCard";

const KanbanBoard: React.FC = () => {
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }

  const queryClient = useQueryClient();

  /* ---------------- Sensors ---------------- */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  /* ---------------- Query ---------------- */
  const {
    data: clients = [],
    isPending,
    isError,
    error,
  } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/client");

      if (!res.ok) {
        throw new Error("Failed to fetch clients");
      }

      const data = await res.json();

      if (data.status === 401) {
        throw new ApiError(data.message, 401);
      }

      if (data.status !== 200) {
        throw new ApiError(data.message, data.status);
      }
      return data.data;
    },
    retry: false,
  });

  useEffect(() => {
    if (!isError || !error) return;

    const err = error as any;

    if (err.status === 401) {
      toast.error(err.message);
      router.push("/login");
    } else {
      toast.error(err.message ?? "Something went wrong");
    }
  }, [isError, error, router, clients]);

  /* ---------------- Mutation (Optimistic) ---------------- */
  const stageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: Stage }) => {
      const res = await fetch("/api/client", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, stage }),
      });
      if (!res.ok) {
        throw new ApiError("Network error", res.status);
      }

      const data = await res.json();

      if (data.status !== 200) {
        throw new ApiError(data.message || "Something went wrong", data.status);
      }

      return data.message;
    },

    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ["clients"] });

      const previousClients = queryClient.getQueryData<Client[]>(["clients"]);

      queryClient.setQueryData<Client[]>(["clients"], (old = []) =>
        old.map((client) => (client.id === id ? { ...client, stage } : client)),
      );

      return { previousClients };
    },

    onError: (err: any, _vars, context) => {
      if (err?.status === 401) {
        toast.error(err.message);
        router.push("/login");
      } else {
        toast.error(err.message);
      }
      if (context?.previousClients) {
        queryClient.setQueryData(["clients"], context.previousClients);
      }
    },

    onSuccess: (message) => {
      toast.success(message);
    },
  });

  /* ---------------- Filtering ---------------- */

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;

    const query = searchQuery.toLowerCase();

    return clients?.filter((client) => {
      return (
        client.name?.toLowerCase().includes(query) ||
        client.company?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query)
      );
    });
  }, [clients, searchQuery]);

  /* ---------------- Group by Stage ---------------- */
  const clientsByStage = useMemo(() => {
    const grouped: Record<string, Client[]> = {};

    STAGES.forEach((stage) => {
      grouped[stage.id] = filteredClients.filter((c) => c.stage === stage.id);
    });

    return grouped;
  }, [filteredClients]);

  /* ---------------- Drag Handlers ---------------- */
  const handleDragStart = (event: DragStartEvent) => {
    const client = clients.find((c) => c.id === event.active.id);
    setActiveClient(client || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveClient(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeClientData = clients.find((c) => c.id === activeId);

    if (!activeClientData) return;

    // Dropped on a column
    if (STAGES.some((s) => s.id === overId)) {
      if (activeClientData.stage !== overId) {
        stageMutation.mutate({
          id: activeId,
          stage: overId as Stage,
        });
      }
      return;
    }

    // Dropped on another card
    const overClientData = clients.find((c) => c.id === overId);

    if (!overClientData) return;

    if (activeClientData.stage !== overClientData.stage) {
      stageMutation.mutate({
        id: activeId,
        stage: overClientData.stage as Stage,
      });
    }
  };

  /* ---------------- Stats ---------------- */
  const totalDealValue = useMemo(() => {
    return clients
      .filter((c) => c.stage !== "lost")
      .reduce((sum, c) => sum + Number(c.deal_value ?? 0), 0);
  }, [clients]);

  const wonValue = useMemo(() => {
    return clients
      .filter((c) => c.stage === "won")
      .reduce((sum, c) => sum + Number(c.deal_value ?? 0), 0);
  }, [clients]);

  /* ---------------- Render ---------------- */
  if (isPending) {
    return <Loader loadingText="Loading Clients..." />;
  }
  if (error) {
    return <ErrorCard errorMessage="Error in fetching clients" />;
  }

  // if (stageMutation?.data && stageMutation?.data?.status !== 200) {
  //   console.log(stageMutation?.data?.status);
  //   if (stageMutation?.data?.status === 401) {
  //     toast.error("Session Timed Out");
  //     router.push("/login");
  //   }
  //   return (
  //     <div>
  //       <p>{stageMutation?.data?.message}</p>
  //       <p>{stageMutation?.data?.status}</p>
  //     </div>
  //   );
  // }

  return (
    <div className="h-full flex flex-col">
      {/* Stats */}
      <motion.div
        className="grid grid-cols-4 gap-4 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Stat label="Total Deals" value={clients.length} />
        <Stat
          label="Pipeline Value"
          value={`₹${totalDealValue.toLocaleString()}`}
        />
        <Stat
          label="Won Revenue"
          value={`₹${wonValue.toLocaleString()}`}
          className="text-stage-won"
        />
        <Stat
          label="Win Rate"
          value={`${
            clients.length
              ? Math.round(
                  (clients.filter((c) => c.stage === "won").length /
                    clients.length) *
                    100,
                )
              : 0
          }%`}
        />
      </motion.div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search pipeline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
      >
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 h-full min-w-max pb-4">
            {STAGES.map((stage, index) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <KanbanColumn
                  stage={stage}
                  clients={clientsByStage[stage.id] || []}
                />
              </motion.div>
            ))}
          </div>
        </div>

        <DragOverlay
          dropAnimation={{
            duration: 0,
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: "1",
                },
              },
            }),
          }}
        >
          {activeClient && (
            <div className="opacity-90 rotate-3">
              <ClientCard client={activeClient} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

/* ---------------- Small Stat Component ---------------- */
const Stat = ({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <div className="bg-card rounded-xl p-4 border border-border">
    <div className="text-sm text-muted-foreground mb-1">{label}</div>
    <div className={`text-2xl font-bold ${className}`}>{value}</div>
  </div>
);

export default KanbanBoard;

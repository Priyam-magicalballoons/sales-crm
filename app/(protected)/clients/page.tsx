"use client";

import React, { useState, useMemo } from "react";
// import { useClients } from "@/context/ClientContext";
// import { useAuth, USERS } from "@/context/AuthContext";
import { Client, STAGES, User } from "@/types/crm";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Building2,
  Mail,
  Phone,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddClientModal from "@/components/crm/AddClientModal";
import ClientDetailsModal from "@/components/crm/ClientDetailsModal";
import EditClientModal from "@/components/crm/EditClientModal";
import DeleteClientDialog from "@/components/crm/DeleteClientDialog";
import { useExport } from "@/hooks/useExport";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getAllUsers } from "@/app/actions/users";
import Loader from "@/components/Loader";
import {
  MonthYearFilter,
  MonthYearSelection,
  matchesMonthYearFilter,
} from "@/components/MonthYearFilter";

type SortField = "name" | "company" | "deal_value" | "stage" | "updatedAt";
type SortDirection = "asc" | "desc";
interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

const Clients: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [monthYearFilter, setMonthYearFilter] = useState<MonthYearSelection>({
    month: null,
    year: new Date().getFullYear(),
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "updatedAt",
    direction: "desc",
  });

  const router = useRouter();

  const { data: USERS = [] } = useQuery({
    queryKey: ["users"],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const res = (await getAllUsers()) as {
        status: number;
        message?: string;
        users: User[];
      };

      if (res.status === 401) {
        router.push("/login");
      } else if (res.status !== 200) {
        toast.message(res.message);
      } else {
        return res.users;
      }
    },
  });

  const {
    data: clients = [],
    isPending,
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
        toast.error(data.message);
        router.push("/login");
      }

      if (data.status !== 200) {
        toast.error(data.message);
      }
      return Array.isArray(data.data) ? data.data : [];
    },
  });

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };
  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1" />
    );
  };
  const filteredAndSortedClients = useMemo(() => {
    let result = clients.filter((client) => {
      const matchesSearch =
        client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage =
        stageFilter === "all" || client.stage === stageFilter;
      const matchesAssignee =
        assigneeFilter === "all" || client.userId === assigneeFilter;
      const matchesMonthYear = matchesMonthYearFilter(
        new Date(client.updatedAt ?? client.createdAt),
        monthYearFilter,
      );

      return (
        matchesSearch && matchesStage && matchesAssignee && matchesMonthYear
      );
    });
    // Sort the results
    result.sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;

      switch (sortConfig.field) {
        case "name":
          return direction * a.name!.localeCompare(b.name!);
        case "deal_value":
          return direction * (a.deal_value - b.deal_value);
        case "stage":
          const stageOrder = STAGES.map((s) => s.id);
          return (
            direction *
            (stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage))
          );
        case "updatedAt":
          return (
            direction *
            (new Date(a.updatedAt ?? a.createdAt).getTime() -
              new Date(b.updatedAt ?? a.createdAt).getTime())
          );
        default:
          return 0;
      }
    });
    return result;
  }, [
    clients,
    searchQuery,
    stageFilter,
    assigneeFilter,
    monthYearFilter,
    sortConfig,
  ]);

  const getStageConfig = (stage: string) => {
    return STAGES.find((s) => s.id === stage) || STAGES[0];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  const handleView = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsEditOpen(true);
  };

  const handleDelete = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteOpen(true);
  };

  const { exportClientsToCSV, exportClientsToPDF } = useExport();

  const handleExportCSV = () => {
    exportClientsToCSV(filteredAndSortedClients, "clients-export");
    toast.success("Clients exported to CSV");
  };

  const handleExportPDF = () => {
    exportClientsToPDF(filteredAndSortedClients, "clients-export");
    toast.success("Clients exported to PDF");
  };

  if (isPending) {
    return <Loader loadingText="Loading Clients" />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">
            Manage all your clients in one place
          </p>
        </div>
        <div className="flex gap-2">
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
          {/* <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Client
          </Button> */}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <MonthYearFilter
            value={monthYearFilter}
            onChange={setMonthYearFilter}
          />
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {STAGES.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* {user?.role === "admin" && ( */}
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {USERS?.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* )} */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead
                className="font-semibold cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Client
                  {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead
                className="font-semibold cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort("deal_value")}
              >
                <div className="flex items-center">
                  Deal Value
                  {getSortIcon("deal_value")}
                </div>
              </TableHead>
              <TableHead
                className="font-semibold cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort("stage")}
              >
                <div className="flex items-center">
                  Stage
                  {getSortIcon("stage")}
                </div>
              </TableHead>
              <TableHead className="font-semibold">Assigned To</TableHead>
              <TableHead
                className="font-semibold cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => handleSort("updatedAt")}
              >
                <div className="flex items-center">
                  Last Updated
                  {getSortIcon("updatedAt")}
                </div>
              </TableHead>
              <TableHead className="w-15"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedClients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  No clients found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedClients.map((client) => {
                const stageConfig = getStageConfig(client.stage);
                return (
                  <TableRow
                    key={client.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleView(client)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {client.name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {client.company}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm flex items-center gap-1">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          {client.email}
                        </div>
                        <div className="text-sm flex items-center gap-1">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          {client.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary">
                        {formatCurrency(client.deal_value)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${stageConfig.color} text-white`}
                      >
                        {stageConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{client.creator_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {client.updatedAt && formatDate(client.updatedAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(client);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(client);
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(client);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredAndSortedClients.length} of {clients.length} clients
        </span>
        <span>
          Total Pipeline:{" "}
          {formatCurrency(
            filteredAndSortedClients.reduce((sum, c) => sum + c.deal_value, 0),
          )}
        </span>
      </div>

      {/* Modals */}
      <AddClientModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {selectedClient && (
        <>
          <ClientDetailsModal
            client={selectedClient}
            open={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
          />
          <EditClientModal
            client={selectedClient}
            open={isEditOpen}
            onClose={() => setIsEditOpen(false)}
          />
          <DeleteClientDialog
            client={selectedClient}
            open={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
          />
        </>
      )}
    </div>
  );
};

export default Clients;

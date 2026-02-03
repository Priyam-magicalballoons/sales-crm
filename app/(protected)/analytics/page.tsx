"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
// import { useClients } from "@/context/ClientContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Client, STAGES, Stage, User } from "@/types/crm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  IndianRupeeIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useExport } from "@/hooks/useExport";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import ErrorCard from "@/components/ErrorCard";
import { getAllUsers } from "@/app/actions/users";

const STAGE_COLORS: Record<Stage, string> = {
  lead: "#3b4a5a",
  contacted: "#3b82f6",
  qualified: "#8b5cf6",
  proposal: "#f97316",
  negotiation: "#eab308",
  won: "#22c55e",
  lost: "#ef4444",
};

const Analytics: React.FC = () => {
  // const { clients } = useClients();
  const router = useRouter();
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
        toast.error(data.message);
        router.push("/login");
      }

      if (data.status !== 200) {
        toast.error(data.message);
      }
      return Array.isArray(data.data) ? data.data : [];
    },
  });

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

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalDeals = clients.length;
    const wonDeals = clients.filter((c) => c.stage === "won");
    const lostDeals = clients.filter((c) => c.stage === "lost");
    const activeDeals = clients.filter(
      (c) => !["won", "lost"].includes(c.stage),
    );

    const totalRevenue = wonDeals.reduce((sum, c) => sum + c.deal_value, 0);
    const pipelineValue = activeDeals.reduce((sum, c) => sum + c.deal_value, 0);
    const avgDealSize =
      totalDeals > 0
        ? clients.reduce((sum, c) => sum + c.deal_value, 0) / totalDeals
        : 0;
    const winRate =
      wonDeals.length + lostDeals.length > 0
        ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100
        : 0;

    return {
      totalDeals,
      totalRevenue,
      pipelineValue,
      avgDealSize,
      winRate,
      wonCount: wonDeals.length,
      lostCount: lostDeals.length,
      activeCount: activeDeals.length,
    };
  }, [clients]);

  // Stage distribution data for pie chart
  const stageDistribution = useMemo(() => {
    return STAGES.map((stage) => ({
      name: stage.label,
      value: clients.filter((c) => c.stage === stage.id).length,
      color: STAGE_COLORS[stage.id],
    })).filter((item) => item.value > 0);
  }, [clients]);

  const { exportAnalyticsToCSV, exportAnalyticsToPDF } = useExport();

  const stageDistributionExport = useMemo(() => {
    return STAGES.map((stage) => ({
      name: stage.label,
      value: clients.filter((c) => c.stage === stage.id).length,
      fill: STAGE_COLORS[stage.id],
    })).filter((item) => item.value > 0);
  }, [clients]);

  const handleExportCSV = () => {
    exportAnalyticsToCSV(
      {
        metrics,
        teamPerformance,
        stageDistribution: stageDistributionExport,
      },
      "analytics-export",
    );
    toast.success("Analytics exported to CSV");
  };

  const handleExportPDF = () => {
    exportAnalyticsToPDF(
      {
        metrics,
        teamPerformance,
        stageDistribution: stageDistributionExport,
      },
      "analytics-export",
    );
    toast.success("Analytics exported to PDF");
  };

  // Conversion funnel data
  const conversionFunnel = useMemo(() => {
    const stageOrder: Stage[] = [
      "lead",
      "contacted",
      "qualified",
      "proposal",
      "negotiation",
      "won",
    ];
    let total = clients.length;

    return stageOrder.map((stageId, index) => {
      const stageConfig = STAGES.find((s) => s.id === stageId)!;
      const count = clients.filter((c) => {
        const stageIndex = stageOrder.indexOf(c.stage as Stage);
        return stageIndex >= index && c.stage !== "lost";
      }).length;
      const rate = total > 0 ? (count / total) * 100 : 0;

      return {
        stage: stageConfig.label,
        count,
        rate: Math.round(rate),
        fill: STAGE_COLORS[stageId],
      };
    });
  }, [clients]);

  // Revenue by stage
  const revenueByStage = useMemo(() => {
    return STAGES.map((stage) => ({
      stage: stage.label,
      value: clients
        .filter((c) => c.stage === stage.id)
        .reduce((sum, c) => sum + c.deal_value, 0),
      fill: STAGE_COLORS[stage.id],
    }));
  }, [clients]);

  // Team performance data
  const teamPerformance = useMemo(() => {
    const userMap = new Map<
      string,
      { name: string; deals: number; value: number; won: number }
    >();

    clients.forEach((client) => {
      const existing = userMap.get(client.userId!) || {
        name: USERS?.find((prev) => prev.id === client.userId)?.name ?? "",
        deals: 0,
        value: 0,
        won: 0,
      };

      existing.deals += 1;
      existing.value += client.deal_value;
      if (client.stage === "won") existing.won += 1;

      userMap.set(client.userId!, existing);
    });

    return Array.from(userMap.values()).map((user) => ({
      ...user,
      winRate: user.deals > 0 ? Math.round((user.won / user.deals) * 100) : 0,
    }));
  }, [clients, USERS]);

  // Mock monthly trend data
  const monthlyTrend = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sept",
      "Oct",
      "Nov",
      "Dec",
    ];

    return months.map((month, index) => ({
      month,
      deals: clients.filter(
        (c) => new Date(c.createdAt as Date).getMonth() === index,
      ).length,
      revenue: Math.floor(Math.random() * 50000) + 20000 + index * 10000,
      won: clients.filter(
        (c) =>
          new Date(c.createdAt as Date).getMonth() === index &&
          c.stage === "won",
      ).length,
    }));
  }, [clients]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(metrics.totalRevenue),
      icon: IndianRupeeIcon,
      trend: "+12%",
      trendUp: true,
      description: "From closed deals",
    },
    {
      title: "Pipeline Value",
      value: formatCurrency(metrics.pipelineValue),
      icon: Target,
      trend: "+8%",
      trendUp: true,
      description: "Active opportunities",
    },
    {
      title: "Win Rate",
      value: `${metrics.winRate.toFixed(1)}%`,
      icon: TrendingUp,
      trend: "+5%",
      trendUp: true,
      description: `${metrics.wonCount} won / ${metrics.wonCount + metrics.lostCount} closed`,
    },
    {
      title: "Avg Deal Size",
      value: formatCurrency(metrics.avgDealSize),
      icon: BarChart3,
      trend: "-2%",
      trendUp: false,
      description: "Per opportunity",
    },
  ];

  if (isPending) {
    return <Loader loadingText="Loading Clients..." />;
  }
  if (isError) {
    return <ErrorCard errorMessage={error.message ?? "Something went wrong"} />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your sales performance and trends
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Report
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      stat.trendUp ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {stat.trendUp ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {stat.trend}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deal Trends</CardTitle>
              <CardDescription>
                Monthly deals and revenue over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-75">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend}>
                    <defs>
                      <linearGradient
                        id="colorDeals"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(217, 91%, 60%)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(217, 91%, 60%)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(173, 58%, 39%)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(173, 58%, 39%)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(214, 32%, 91%)"
                    />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(215, 16%, 47%)"
                      fontSize={12}
                    />
                    <YAxis stroke="hsl(215, 16%, 47%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(214, 32%, 91%)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="deals"
                      stroke="hsl(217, 91%, 60%)"
                      fillOpacity={1}
                      fill="url(#colorDeals)"
                      name="Deals"
                    />
                    <Area
                      type="monotone"
                      dataKey="won"
                      stroke="hsl(173, 58%, 39%)"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      name="Won Deals"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stage Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pipeline Distribution</CardTitle>
              <CardDescription>Deals by current stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-75">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stageDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {stageDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(214, 32%, 91%)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversion Funnel</CardTitle>
              <CardDescription>Stage-by-stage conversion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-75">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionFunnel} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(214, 32%, 91%)"
                    />
                    <XAxis
                      type="number"
                      stroke="hsl(215, 16%, 47%)"
                      fontSize={12}
                    />
                    <YAxis
                      type="category"
                      dataKey="stage"
                      stroke="hsl(215, 16%, 47%)"
                      fontSize={12}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(214, 32%, 91%)",
                        borderRadius: "8px",
                      }}
                      formatter={(
                        value: number | undefined,
                        name: string | undefined,
                      ) => [
                        name === "count" ? `${value} deals` : `${value}%`,
                        name === "count" ? "Deals" : "Conversion Rate",
                      ]}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {conversionFunnel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue by Stage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue by Stage</CardTitle>
              <CardDescription>
                Deal value distribution across pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-75">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByStage}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(214, 32%, 91%)"
                    />
                    <XAxis
                      dataKey="stage"
                      stroke="hsl(215, 16%, 47%)"
                      fontSize={11}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      stroke="hsl(215, 16%, 47%)"
                      fontSize={12}
                      tickFormatter={(value) =>
                        `$${(value / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(214, 32%, 91%)",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number | undefined) => [
                        formatCurrency(value!),
                        "Revenue",
                      ]}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {revenueByStage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Team Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Performance
            </CardTitle>
            <CardDescription>
              Sales rep metrics and performance comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                      Deals
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                      Won
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                      Win Rate
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Total Value
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teamPerformance.map((member, index) => (
                    <motion.tr
                      key={member.name + index}
                      className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-foreground">
                            {member.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-foreground">
                        {member.deals}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                          {member.won}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`font-medium ${
                            member.winRate >= 50
                              ? "text-green-600"
                              : member.winRate >= 25
                                ? "text-yellow-600"
                                : "text-red-500"
                          }`}
                        >
                          {member.winRate}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-foreground">
                        {formatCurrency(member.value)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-full max-w-37.5">
                          <div className="h-2 rounded-full bg-secondary overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-primary"
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(member.winRate * 2, 100)}%`,
                              }}
                              transition={{
                                delay: 1 + index * 0.1,
                                duration: 0.5,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Analytics;

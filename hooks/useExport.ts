import { Client, STAGES } from "@/types/crm";
import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (date: string | Date) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
};

export const useExport = () => {
  const exportClientsToCSV = (clients: Client[], filename = "clients") => {
    // console.log(clients);
    const headers = [
      "Name",
      "Company",
      "Email",
      "Phone",
      "Deal Value",
      "Stage",
      "Assigned To",
      "Created",
      "Updated",
    ];

    const rows = clients.map((client) => {
      const stageConfig = STAGES.find((s) => s.id === client.stage);
      return [
        client.name,
        client.company,
        client.email,
        client.phone,
        client.deal_value.toString(),
        stageConfig?.label || client.stage,
        client.creator_name,
        formatDate(client.createdAt),
        client.updatedAt ? formatDate(client.updatedAt) : "",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    downloadFile(csvContent, `${filename}.csv`, "text/csv");
  };

  const exportClientsToPDF = (clients: Client[], filename = "clients") => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(51, 65, 85);
    doc.text("Client Report", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on ${formatDate(new Date())}`, 14, 28);
    doc.text(`Total Clients: ${clients.length}`, 14, 34);

    // Table data
    const tableData = clients.map((client) => {
      const stageConfig = STAGES.find((s) => s.id === client.stage);
      return [
        client.name,
        client.company,
        formatCurrency(client.deal_value),
        stageConfig?.label || client.stage,
        client.creator_name || "",
      ];
    });

    autoTable(doc, {
      head: [["Name", "Company", "Deal Value", "Stage", "Assigned To"]],
      body: tableData as RowInput[],
      startY: 42,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    doc.save(`${filename}.pdf`);
  };

  const exportAnalyticsToCSV = (
    data: {
      metrics: {
        totalDeals: number;
        totalRevenue: number;
        pipelineValue: number;
        avgDealSize: number;
        winRate: number;
        wonCount: number;
        lostCount: number;
        activeCount: number;
      };
      teamPerformance: Array<{
        name: string;
        deals: number;
        value: number;
        won: number;
        winRate: number;
      }>;
      stageDistribution: Array<{
        name: string;
        value: number;
        fill: string;
      }>;
    },
    filename = "analytics",
  ) => {
    const sections: string[] = [];

    // KPI Summary
    sections.push("KPI SUMMARY");
    sections.push("Metric,Value");
    sections.push(`Total Deals,${data.metrics.totalDeals}`);
    sections.push(`Won Deals,${data.metrics.wonCount}`);
    sections.push(`Lost Deals,${data.metrics.lostCount}`);
    sections.push(`Active Deals,${data.metrics.activeCount}`);
    sections.push(`Total Revenue,${data.metrics.totalRevenue}`);
    sections.push(`Pipeline Value,${data.metrics.pipelineValue}`);
    sections.push(`Average Deal Size,${data.metrics.avgDealSize.toFixed(0)}`);
    sections.push(`Win Rate,${data.metrics.winRate.toFixed(1)}%`);
    sections.push("");

    // Stage Distribution
    sections.push("STAGE DISTRIBUTION");
    sections.push("Stage,Count");
    data.stageDistribution.forEach((stage) => {
      sections.push(`${stage.name},${stage.value}`);
    });
    sections.push("");

    // Team Performance
    sections.push("TEAM PERFORMANCE");
    sections.push("Name,Deals,Value,Won,Win Rate");
    data.teamPerformance.forEach((member) => {
      sections.push(
        `${member.name},${member.deals},${member.value},${member.won},${member.winRate}%`,
      );
    });

    downloadFile(sections.join("\n"), `${filename}.csv`, "text/csv");
  };

  const exportAnalyticsToPDF = (
    data: {
      metrics: {
        totalDeals: number;
        totalRevenue: number;
        pipelineValue: number;
        avgDealSize: number;
        winRate: number;
        wonCount: number;
        lostCount: number;
        activeCount: number;
      };
      teamPerformance: Array<{
        name: string;
        deals: number;
        value: number;
        won: number;
        winRate: number;
      }>;
      stageDistribution: Array<{
        name: string;
        value: number;
        fill: string;
      }>;
    },
    filename = "analytics",
  ) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(51, 65, 85);
    doc.text("Analytics Report", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on ${formatDate(new Date())}`, 14, 28);

    // KPI Summary
    doc.setFontSize(14);
    doc.setTextColor(51, 65, 85);
    doc.text("Key Performance Indicators", 14, 42);

    autoTable(doc, {
      body: [
        ["Total Revenue", formatCurrency(data.metrics.totalRevenue)],
        ["Pipeline Value", formatCurrency(data.metrics.pipelineValue)],
        ["Win Rate", `${data.metrics.winRate.toFixed(1)}%`],
        ["Average Deal Size", formatCurrency(data.metrics.avgDealSize)],
        ["Total Deals", data.metrics.totalDeals.toString()],
        ["Won Deals", data.metrics.wonCount.toString()],
        ["Lost Deals", data.metrics.lostCount.toString()],
        ["Active Deals", data.metrics.activeCount.toString()],
      ],
      startY: 48,
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { cellWidth: 60 },
      },
      theme: "grid",
    });

    // Stage Distribution
    const afterKPI = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setTextColor(51, 65, 85);
    doc.text("Pipeline Distribution", 14, afterKPI);

    autoTable(doc, {
      head: [["Stage", "Count"]],
      body: data.stageDistribution.map((s) => [s.name, s.value.toString()]),
      startY: afterKPI + 6,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: 255,
        fontStyle: "bold",
      },
    });

    // Team Performance
    const afterStages = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setTextColor(51, 65, 85);
    doc.text("Team Performance", 14, afterStages);

    autoTable(doc, {
      head: [["Name", "Deals", "Value", "Won", "Win Rate"]],
      body: data.teamPerformance.map((m) => [
        m.name,
        m.deals.toString(),
        formatCurrency(m.value),
        m.won.toString(),
        `${m.winRate}%`,
      ]),
      startY: afterStages + 6,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: 255,
        fontStyle: "bold",
      },
    });

    doc.save(`${filename}.pdf`);
  };

  const downloadFile = (
    content: string,
    filename: string,
    mimeType: string,
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    exportClientsToCSV,
    exportClientsToPDF,
    exportAnalyticsToCSV,
    exportAnalyticsToPDF,
  };
};

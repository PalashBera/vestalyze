"use client";

import { useState } from "react";
import { DownloadIcon, MailIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import type { StockTrade } from "@/lib/api/types";
import { buildTradeCsv, tradeCsvFilename, tradeCsvForDownload } from "@/lib/finance/trade-csv";

export function TradeExportActions({ trades }: { trades: StockTrade[] }) {
  const [emailing, setEmailing] = useState(false);
  const disabled = trades.length === 0;

  function download() {
    const csv = buildTradeCsv(trades);
    const url = URL.createObjectURL(tradeCsvForDownload(csv));
    const link = document.createElement("a");
    link.href = url;
    link.download = tradeCsvFilename();
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${trades.length} trades`);
  }

  async function email() {
    setEmailing(true);
    try {
      const result = await api.trades.emailCsv();
      toast.success(`CSV sent to ${result.email}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to email the CSV");
    } finally {
      setEmailing(false);
    }
  }

  return (
    <>
      <Button variant="outline" disabled={disabled} onClick={download}>
        <DownloadIcon data-icon="inline-start" />
        Export CSV
      </Button>
      <Button variant="outline" disabled={disabled || emailing} onClick={() => void email()}>
        {emailing ? <Spinner data-icon="inline-start" /> : <MailIcon data-icon="inline-start" />}
        Email CSV
      </Button>
    </>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PencilIcon, RefreshCwIcon } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Country, CreateInvestmentRequest, Currency, Investment, InvestmentType } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

const typeItems = [
  { label: "Mutual Fund", value: "mutual_fund" },
  { label: "ETF", value: "etf" },
  { label: "Direct Stock", value: "stock" },
];

const countryItems = [
  { label: "India", value: "IN" },
  { label: "United States", value: "US" },
];

const sectorItems = [
  { label: "Banking", value: "Banking" },
  { label: "Technology", value: "Technology" },
  { label: "Energy", value: "Energy" },
  { label: "Consumer", value: "Consumer" },
  { label: "Healthcare", value: "Healthcare" },
  { label: "Financial Services", value: "Financial Services" },
  { label: "Industrials", value: "Industrials" },
  { label: "Uncategorized", value: "Uncategorized" },
];

export function InvestmentFields({
  type,
  country,
  sector,
  defaults,
  lockType = false,
  onTypeChange,
  onCountryChange,
  onSectorChange,
}: {
  type: InvestmentType;
  country: Country;
  sector: string;
  defaults?: {
    name?: string;
    investedAmount?: number;
    units?: number;
    sourceUrl?: string;
    ticker?: string;
  };
  lockType?: boolean;
  onTypeChange: (type: InvestmentType) => void;
  onCountryChange: (country: Country) => void;
  onSectorChange: (sector: string) => void;
}) {
  const needsFundUrl = type === "mutual_fund" || type === "etf";
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <Input
          id="name"
          name="name"
          required
          maxLength={120}
          defaultValue={defaults?.name}
          placeholder="Bandhan Small Cap Fund Direct Growth"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Type</FieldLabel>
          <Select
            items={typeItems}
            value={type}
            disabled={lockType}
            onValueChange={(value) => onTypeChange(value as InvestmentType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {typeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Country</FieldLabel>
          <Select
            items={countryItems}
            value={country}
            disabled={lockType}
            onValueChange={(value) => onCountryChange(value as Country)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {countryItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>
      {needsFundUrl ? (
        <Field>
          <FieldLabel htmlFor="sourceUrl">Fund URL</FieldLabel>
          <Input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            required
            defaultValue={defaults?.sourceUrl}
            placeholder="https://www.indmoney.com/mutual-funds/bandhan-small-cap-fund-direct-growth"
          />
          <FieldDescription>
            Public factsheet used to scrape the stock split from the holdings section.
          </FieldDescription>
        </Field>
      ) : null}
      {type === "stock" && !lockType ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="ticker">Stock code</FieldLabel>
            <Input id="ticker" name="ticker" required maxLength={16} defaultValue={defaults?.ticker} placeholder="HDFCBANK" />
          </Field>
          <Field>
            <FieldLabel>Category</FieldLabel>
            <Select items={sectorItems} value={sector} onValueChange={(value) => onSectorChange(value ?? "Uncategorized")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {sectorItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="investedAmount">Invested</FieldLabel>
          <Input
            id="investedAmount"
            name="investedAmount"
            type="number"
            min="1"
            step="0.01"
            required
            defaultValue={defaults?.investedAmount}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="units">Units</FieldLabel>
          <Input id="units" name="units" type="number" min="0" step="0.001" defaultValue={defaults?.units} />
        </Field>
      </div>
    </FieldGroup>
  );
}

export function payloadFromForm(
  formData: FormData,
  type: InvestmentType,
  country: Country,
  sector: string,
): CreateInvestmentRequest {
  return {
    name: String(formData.get("name") ?? "").trim(),
    type,
    country,
    currency: (country === "IN" ? "INR" : "USD") as Currency,
    investedAmount: Number(formData.get("investedAmount")),
    units: formData.get("units") ? Number(formData.get("units")) : undefined,
    ticker: String(formData.get("ticker") ?? ""),
    sector,
    sourceUrl: String(formData.get("sourceUrl") ?? "").trim() || undefined,
  };
}

export function SyncInvestmentButton({
  investment,
  onSynced,
  labeled = false,
}: {
  investment: Investment;
  onSynced: () => void | Promise<void>;
  labeled?: boolean;
}) {
  const [pending, setPending] = useState(false);
  if (investment.type === "stock") {
    return null;
  }

  async function sync() {
    setPending(true);
    try {
      const result = await api.investments.sync(investment.id);
      toast.success(`Synced ${result.recordsProcessed} holdings`);
      await onSynced();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sync holdings");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" size={labeled ? "default" : "icon-sm"} disabled={pending} onClick={() => void sync()}>
      {pending ? <Spinner data-icon={labeled ? "inline-start" : undefined} /> : <RefreshCwIcon />}
      {labeled ? "Sync holdings" : <span className="sr-only">Sync holdings</span>}
    </Button>
  );
}

export function InvestmentForm({
  onSaved,
  investment,
}: {
  onSaved: () => void;
  investment?: Investment;
}) {
  const editing = Boolean(investment);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [type, setType] = useState<InvestmentType>(investment?.type ?? "mutual_fund");
  const [country, setCountry] = useState<Country>(investment?.country ?? "IN");
  const [sector, setSector] = useState("Uncategorized");

  async function onSubmit(formData: FormData) {
    setPending(true);
    try {
      const payload = payloadFromForm(formData, type, country, sector);
      if (investment) {
        await api.investments.update(investment.id, payload);
        toast.success("Investment updated");
      } else {
        await api.investments.create(payload);
        toast.success(
          payload.sourceUrl
            ? "Investment added. Sync holdings to pull the stock split."
            : "Investment added",
        );
      }
      setOpen(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save investment");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={editing ? "outline" : "default"} size={editing ? "icon-sm" : "default"} />
        }
      >
        {editing ? (
          <>
            <PencilIcon />
            <span className="sr-only">Edit</span>
          </>
        ) : (
          "Add investment"
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit investment" : "Add investment"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update invested amount, units, or the fund URL used for holdings sync."
              : "Track a mutual fund, ETF, or direct stock you already hold."}
          </DialogDescription>
        </DialogHeader>
        <form
          key={`${investment?.id ?? "new"}-${open}`}
          className="flex flex-col gap-5"
          action={(formData) => void onSubmit(formData)}
        >
          <InvestmentFields
            type={type}
            country={country}
            sector={sector}
            lockType={editing}
            defaults={{
              name: investment?.name,
              investedAmount: investment?.investedAmount,
              units: investment?.units,
              sourceUrl: investment?.sourceUrl,
            }}
            onTypeChange={setType}
            onCountryChange={setCountry}
            onSectorChange={setSector}
          />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

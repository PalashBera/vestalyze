"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PencilIcon, RefreshCwIcon } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Country, CreateInvestmentRequest, Investment, InvestmentType } from "@/lib/api/types";
import { typeLabel } from "@/lib/format";
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
];

const countryItems = [
  { label: "India", value: "IN" },
  { label: "United States", value: "US" },
];

export function InvestmentFields({
  type,
  country,
  defaults,
  lockType = false,
  onTypeChange,
  onCountryChange,
}: {
  type: InvestmentType;
  country: Country;
  defaults?: {
    name?: string;
    investedAmount?: number;
    sourceUrl?: string;
    ticker?: string;
  };
  lockType?: boolean;
  onTypeChange: (type: InvestmentType) => void;
  onCountryChange: (country: Country) => void;
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
          {lockType ? (
            <Input value={typeLabel(type)} disabled />
          ) : (
            <Select
              items={typeItems}
              value={type}
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
          )}
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
      <Field>
        <FieldLabel htmlFor="investedAmount">Invested amount</FieldLabel>
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
    </FieldGroup>
  );
}

export function payloadFromForm(
  formData: FormData,
  type: InvestmentType,
  country: Country,
): CreateInvestmentRequest {
  return {
    name: String(formData.get("name") ?? "").trim(),
    type,
    country,
    investedAmount: Number(formData.get("investedAmount")),
    ticker: String(formData.get("ticker") ?? ""),
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

  async function onSubmit(formData: FormData) {
    setPending(true);
    try {
      const payload = payloadFromForm(formData, type, country);
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
              ? "Update the invested amount or the fund URL used for holdings sync."
              : "Track a mutual fund or ETF you already hold."}
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
            lockType={editing}
            defaults={{
              name: investment?.name,
              investedAmount: investment?.investedAmount,
              sourceUrl: investment?.sourceUrl,
            }}
            onTypeChange={setType}
            onCountryChange={setCountry}
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

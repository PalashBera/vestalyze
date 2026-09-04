"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import type { Country, CreateInvestmentRequest, Currency, Fund, InvestmentType, Security } from "@/lib/api/types";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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

export function InvestmentForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [securities, setSecurities] = useState<Security[]>([]);
  const [type, setType] = useState<InvestmentType>("mutual_fund");
  const [country, setCountry] = useState<Country>("IN");
  const [catalogId, setCatalogId] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([api.catalog.funds(), api.catalog.securities()]).then(([fundData, securityData]) => {
      setFunds(fundData.funds);
      setSecurities(securityData.securities);
    });
  }, []);

  const catalogItems =
    type === "stock"
      ? securities
          .filter((item) => item.country === country)
          .map((item) => ({ label: `${item.standardizedName} (${item.ticker})`, value: item.id }))
      : funds
          .filter((item) => item.country === country && item.type === type)
          .map((item) => ({ label: item.name, value: item.id }));

  async function onSubmit(formData: FormData) {
    setPending(true);
    try {
      const payload: CreateInvestmentRequest = {
        name: String(formData.get("name") ?? "").trim(),
        type,
        country,
        currency: (country === "IN" ? "INR" : "USD") as Currency,
        investedAmount: Number(formData.get("investedAmount")),
        currentValue: Number(formData.get("currentValue")),
        units: formData.get("units") ? Number(formData.get("units")) : undefined,
        fundId: type === "stock" ? undefined : catalogId || undefined,
        securityId: type === "stock" ? catalogId || undefined : undefined,
      };
      await api.investments.create(payload);
      toast.success("Investment added");
      setOpen(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add investment");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Add investment</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add investment</DialogTitle>
          <DialogDescription>Track a mutual fund, ETF, or direct stock position.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" action={(formData) => void onSubmit(formData)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input id="name" name="name" required maxLength={120} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Type</FieldLabel>
                <Select items={typeItems} value={type} onValueChange={(value) => setType(value as InvestmentType)}>
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
                <Select items={countryItems} value={country} onValueChange={(value) => setCountry(value as Country)}>
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
            <Field>
              <FieldLabel>Linked security or fund</FieldLabel>
              <Select
                items={[{ label: "None", value: null }, ...catalogItems]}
                value={catalogId}
                onValueChange={(value) => setCatalogId(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={null}>None</SelectItem>
                    {catalogItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="investedAmount">Invested</FieldLabel>
                <Input id="investedAmount" name="investedAmount" type="number" min="1" step="0.01" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="currentValue">Current value</FieldLabel>
                <Input id="currentValue" name="currentValue" type="number" min="0" step="0.01" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="units">Units</FieldLabel>
                <Input id="units" name="units" type="number" min="0" step="0.001" />
              </Field>
            </div>
          </FieldGroup>
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

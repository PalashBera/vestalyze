"use client";

import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSettings } from "@/components/settings-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Currency } from "@/lib/api/types";

const currencyItems = [
  { label: "INR", value: "INR" },
  { label: "USD", value: "USD" },
];

export default function SettingsPage() {
  const { currency, setCurrency, fxRate, user } = useSettings();

  async function onCurrencyChange(value: string | null) {
    if (value !== "INR" && value !== "USD") {
      return;
    }
    await setCurrency(value as Currency);
    toast.success("Display currency updated");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Display currency, theme, and account details. Theme stays on this device; currency is stored with the user."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reporting</CardTitle>
            <CardDescription>Indian amounts stay in INR. US amounts stay in USD. Consolidated views convert using FX.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Display currency</FieldLabel>
                <Select items={currencyItems} value={currency} onValueChange={onCurrencyChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {currencyItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Current FX: 1 USD = {fxRate?.rate ?? "—"} INR as of {fxRate?.asOf ?? "—"}.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Switch between light, dark, and true black.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Theme</p>
            <ThemeToggle />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Signed-in user for this mock session.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <p>{user?.name}</p>
            <p className="text-muted-foreground">{user?.email}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

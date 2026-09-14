"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChangePasswordDialog, DeleteAccountDialog, EditProfileDialog } from "@/components/account-dialogs";
import { PageHeader } from "@/components/page-header";
import { useSettings } from "@/components/settings-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Currency } from "@/lib/api/types";

const currencyItems = [
  { label: "INR", value: "INR" },
  { label: "USD", value: "USD" },
];

export default function SettingsPage() {
  const { currency, setCurrency, fxRate, setFxRate, user, setTradeTargets } = useSettings();
  const [fxInput, setFxInput] = useState("");
  const [profitInput, setProfitInput] = useState("");
  const [lossInput, setLossInput] = useState("");
  const [savingFx, setSavingFx] = useState(false);
  const [savingTargets, setSavingTargets] = useState(false);

  useEffect(() => {
    if (fxRate) {
      setFxInput(String(fxRate.rate));
    }
  }, [fxRate]);

  useEffect(() => {
    setProfitInput(user?.targetProfitPercentage === undefined ? "" : String(user.targetProfitPercentage));
    setLossInput(user?.targetLossPercentage === undefined ? "" : String(user.targetLossPercentage));
  }, [user?.targetProfitPercentage, user?.targetLossPercentage]);

  async function onCurrencyChange(value: string | null) {
    if (value !== "INR" && value !== "USD") {
      return;
    }
    await setCurrency(value as Currency);
    toast.success("Display currency updated");
  }

  async function onSaveFx() {
    const rate = Number(fxInput);
    setSavingFx(true);
    try {
      await setFxRate(rate);
      toast.success("FX rate updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save FX rate");
    } finally {
      setSavingFx(false);
    }
  }

  async function onSaveTargets() {
    const profit = Number(profitInput);
    const loss = Number(lossInput);
    setSavingTargets(true);
    try {
      await setTradeTargets({ targetProfitPercentage: profit, targetLossPercentage: loss });
      toast.success("Profit and loss targets updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save profit and loss targets");
    } finally {
      setSavingTargets(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Display currency, USD/INR rate, analysis targets, and account details."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reporting</CardTitle>
            <CardDescription>
              Indian amounts stay in INR. US amounts stay in USD. Consolidated views convert using your FX rate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Display currency</FieldLabel>
                <Select items={currencyItems} value={currency} onValueChange={onCurrencyChange}>
                  <SelectTrigger className="w-full sm:w-40">
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
              </Field>
              <Field>
                <FieldLabel htmlFor="fxRate">USD / INR rate</FieldLabel>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    id="fxRate"
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    max="500"
                    step="0.01"
                    value={fxInput}
                    onChange={(event) => setFxInput(event.target.value)}
                    className="w-full sm:w-40"
                  />
                  <Button type="button" onClick={() => void onSaveFx()} disabled={savingFx}>
                    {savingFx ? <Spinner data-icon="inline-start" /> : null}
                    Save rate
                  </Button>
                </div>
                <FieldDescription>
                  Used for India vs US totals. Last set {fxRate?.asOf ?? "—"}.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Analysis targets</CardTitle>
            <CardDescription>
              Used on Stock Analysis as a share of each row's target return, not of the buying price alone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="targetProfit">Target profit %</FieldLabel>
                <Input
                  id="targetProfit"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  max="1000"
                  step="0.01"
                  value={profitInput}
                  onChange={(event) => setProfitInput(event.target.value)}
                  className="w-full sm:w-40"
                />
                <FieldDescription>
                  Sell Target = buying price × (1 + this % × the row's target %). A ₹100 buy with a
                  20% target and 80% here is ₹116.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="targetLoss">Target loss %</FieldLabel>
                <Input
                  id="targetLoss"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={lossInput}
                  onChange={(event) => setLossInput(event.target.value)}
                  className="w-full sm:w-40"
                />
                <FieldDescription>
                  Stop Loss = buying price × (1 − this % × the row's target %). A ₹100 buy with a
                  20% target and 80% here is ₹84.
                </FieldDescription>
              </Field>
              <Button type="button" onClick={() => void onSaveTargets()} disabled={savingTargets} className="w-fit">
                {savingTargets ? <Spinner data-icon="inline-start" /> : null}
                Save targets
              </Button>
            </FieldGroup>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your private account. Holdings on this login are visible only to you.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div className="flex flex-col gap-1">
              <p>{user?.name}</p>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <EditProfileDialog />
              <ChangePasswordDialog />
            </div>
            <div className="flex flex-col gap-3 border-t pt-4">
              <p className="text-muted-foreground">
                Delete this account and every holding stored with it. This cannot be undone.
              </p>
              <div>
                <DeleteAccountDialog />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

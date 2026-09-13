"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PencilIcon } from "lucide-react";
import { api } from "@/lib/api/client";
import type { CreateStockAnalysisRequest, StockAnalysis } from "@/lib/api/types";
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
import { Spinner } from "@/components/ui/spinner";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function StockAnalysisForm({
  onSaved,
  entry,
}: {
  onSaved: () => void;
  entry?: StockAnalysis;
}) {
  const editing = Boolean(entry);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  // onSubmit rather than the form `action` prop, so a failed save keeps what
  // the user typed instead of React resetting the form.
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload: CreateStockAnalysisRequest = {
      name: String(formData.get("name") ?? "").trim(),
      symbol: String(formData.get("symbol") ?? "").trim(),
      buyDate: String(formData.get("buyDate") ?? ""),
      buyPrice: Number(formData.get("buyPrice")),
      targetReturnPercentage: Number(formData.get("targetReturnPercentage")),
    };

    setPending(true);
    try {
      if (entry) {
        await api.analysis.update(entry.id, payload);
        toast.success("Analysis updated");
      } else {
        await api.analysis.create(payload);
        toast.success("Analysis added");
      }
      setOpen(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save the analysis");
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
          "Add analysis"
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit analysis" : "Add analysis"}</DialogTitle>
          <DialogDescription>
            Set the return you are aiming for and the target price is worked out for you.
          </DialogDescription>
        </DialogHeader>
        <form key={`${entry?.id ?? "new"}-${open}`} className="flex flex-col gap-5" onSubmit={onSubmit}>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
              <Field>
                <FieldLabel htmlFor="analysis-name">Name</FieldLabel>
                <Input
                  id="analysis-name"
                  name="name"
                  required
                  maxLength={120}
                  defaultValue={entry?.name}
                  placeholder="Infosys"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="analysis-symbol">Symbol</FieldLabel>
                <Input
                  id="analysis-symbol"
                  name="symbol"
                  required
                  maxLength={20}
                  defaultValue={entry?.symbol}
                  placeholder="INFY"
                  className="uppercase"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="analysis-buy-date">Buy date</FieldLabel>
                <Input
                  id="analysis-buy-date"
                  name="buyDate"
                  type="date"
                  required
                  defaultValue={entry?.buyDate ?? today()}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="analysis-buy-price">Buying price</FieldLabel>
                <Input
                  id="analysis-buy-price"
                  name="buyPrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  defaultValue={entry?.buyPrice}
                  placeholder="1480"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="analysis-target">Target return %</FieldLabel>
                <Input
                  id="analysis-target"
                  name="targetReturnPercentage"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  defaultValue={entry?.targetReturnPercentage}
                  placeholder="20"
                />
              </Field>
            </div>
            <FieldDescription>
              Target price is the buying price plus the target return. Amounts are in INR.
            </FieldDescription>
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

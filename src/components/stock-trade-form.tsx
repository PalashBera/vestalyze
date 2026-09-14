"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PencilIcon } from "lucide-react";
import { api } from "@/lib/api/client";
import type { CreateStockTradeRequest, StockTrade } from "@/lib/api/types";
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

export function StockTradeForm({
  onSaved,
  trade,
}: {
  onSaved: () => void;
  trade?: StockTrade;
}) {
  const editing = Boolean(trade);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  // onSubmit rather than the form `action` prop: React resets a form after an
  // action runs, which would wipe what the user typed when saving fails.
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const sellDate = String(formData.get("sellDate") ?? "").trim();
    const sellPrice = String(formData.get("sellPrice") ?? "").trim();

    const payload: CreateStockTradeRequest = {
      name: String(formData.get("name") ?? "").trim(),
      symbol: String(formData.get("symbol") ?? "").trim(),
      buyDate: String(formData.get("buyDate") ?? ""),
      buyPrice: Number(formData.get("buyPrice")),
      quantity: Number(formData.get("quantity")),
      sellDate: sellDate || null,
      sellPrice: sellPrice ? Number(sellPrice) : null,
    };

    setPending(true);
    try {
      if (trade) {
        await api.trades.update(trade.id, payload);
        toast.success("Trade updated");
      } else {
        await api.trades.create(payload);
        toast.success(payload.sellDate ? "Trade added" : "Trade added as open");
      }
      setOpen(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save the trade");
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
          "Add trade"
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit trade" : "Add trade"}</DialogTitle>
          <DialogDescription>
            Name is optional. Leave the sale fields empty while the position is still open.
          </DialogDescription>
        </DialogHeader>
        <form key={`${trade?.id ?? "new"}-${open}`} className="flex flex-col gap-5" onSubmit={onSubmit}>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
              <Field>
                <FieldLabel htmlFor="trade-name">Name <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
                <Input
                  id="trade-name"
                  name="name"
                  maxLength={120}
                  defaultValue={trade?.name}
                  placeholder="HDFC Bank"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="trade-symbol">Symbol</FieldLabel>
                <Input
                  id="trade-symbol"
                  name="symbol"
                  required
                  maxLength={20}
                  defaultValue={trade?.symbol}
                  placeholder="HDFCBANK"
                  className="uppercase"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="trade-buy-date">Buy date</FieldLabel>
                <Input
                  id="trade-buy-date"
                  name="buyDate"
                  type="date"
                  required
                  defaultValue={trade?.buyDate ?? today()}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="trade-buy-price">Buying price</FieldLabel>
                <Input
                  id="trade-buy-price"
                  name="buyPrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  defaultValue={trade?.buyPrice}
                  placeholder="1650"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="trade-quantity">Quantity</FieldLabel>
                <Input
                  id="trade-quantity"
                  name="quantity"
                  type="number"
                  min="0.0001"
                  step="any"
                  required
                  defaultValue={trade?.quantity}
                  placeholder="50"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="trade-sell-date">Sell date</FieldLabel>
                <Input
                  id="trade-sell-date"
                  name="sellDate"
                  type="date"
                  defaultValue={trade?.sellDate ?? ""}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="trade-sell-price">Selling price</FieldLabel>
                <Input
                  id="trade-sell-price"
                  name="sellPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={trade?.sellPrice}
                  placeholder="1890"
                />
              </Field>
            </div>
            <FieldDescription>
              Fill in both sale fields to close the trade, or neither to keep it open. Amounts are in
              INR.
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

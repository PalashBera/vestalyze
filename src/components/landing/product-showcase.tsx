"use client";

import { ExposureTable } from "@/components/exposure-table";
import { AppWindow } from "@/components/landing/section";
import { DesktopTable, RecordList, RecordListItem } from "@/components/record-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { countryLabel, formatPercent, typeLabel } from "@/lib/format";
import { placeholderExposures, placeholderInvestments, placeholderOverlaps } from "@/lib/placeholder/portfolio";

const tabs = [
  { value: "exposure", label: "Exposure", path: "vestalyze.app/exposure" },
  { value: "overlap", label: "Overlap", path: "vestalyze.app/overlap" },
  { value: "holdings", label: "Holdings", path: "vestalyze.app/investments" },
];

export function LandingProductShowcase() {
  return (
    <Tabs defaultValue="exposure" className="gap-4">
      <TabsList variant="line" className="mx-auto">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="cursor-pointer px-3">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="exposure">
        <AppWindow label="vestalyze.app/exposure">
          <p className="mb-3 text-xs text-muted-foreground">
            Company exposure combined across mutual funds and ETFs. Sortable on every column.
          </p>
          <ExposureTable rows={placeholderExposures} disableLinks />
        </AppWindow>
      </TabsContent>

      <TabsContent value="overlap">
        <AppWindow label="vestalyze.app/overlap" bodyClassName="flex flex-col gap-5 p-4 md:p-5">
          {placeholderOverlaps.map((overlap) => (
            <div key={`${overlap.fundAId}-${overlap.fundBId}`} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium">
                  {overlap.fundAName} × {overlap.fundBName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Overlap score {formatPercent(overlap.overlapScore)}
                </p>
              </div>
              <RecordList>
                {overlap.overlappingSecurities.map((item) => (
                  <RecordListItem
                    key={item.securityId}
                    title={item.name}
                    fields={[
                      { label: overlap.fundAName, value: formatPercent(item.allocationA) },
                      { label: overlap.fundBName, value: formatPercent(item.allocationB) },
                    ]}
                  />
                ))}
              </RecordList>
              <DesktopTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right">{overlap.fundAName}</TableHead>
                      <TableHead className="text-right">{overlap.fundBName}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overlap.overlappingSecurities.map((item) => (
                      <TableRow key={item.securityId}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{formatPercent(item.allocationA)}</TableCell>
                        <TableCell className="text-right">{formatPercent(item.allocationB)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DesktopTable>
            </div>
          ))}
        </AppWindow>
      </TabsContent>

      <TabsContent value="holdings">
        <AppWindow label="vestalyze.app/investments">
          <p className="mb-3 text-xs text-muted-foreground">
            Funds and ETFs with invested amount and the last holdings sync.
          </p>
          <RecordList>
            {placeholderInvestments.map((item) => (
              <RecordListItem
                key={item.id}
                title={item.name}
                subtitle={`${typeLabel(item.type)} · ${countryLabel(item.country)}`}
                fields={[
                  { label: "Invested", value: item.invested },
                  { label: "Last sync", value: item.lastSync },
                ]}
              />
            ))}
          </RecordList>
          <DesktopTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Invested</TableHead>
                  <TableHead>Last sync</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placeholderInvestments.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{typeLabel(item.type)}</TableCell>
                    <TableCell>{countryLabel(item.country)}</TableCell>
                    <TableCell className="text-right">{item.invested}</TableCell>
                    <TableCell>{item.lastSync}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DesktopTable>
        </AppWindow>
      </TabsContent>
    </Tabs>
  );
}

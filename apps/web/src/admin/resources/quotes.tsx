"use client";

import { Box, Divider, Link, Typography } from "@mui/material";
import {
  DateField, Datagrid, Edit, FunctionField, List, SaveButton, SearchInput, SelectInput, SimpleForm, TextField,
  Toolbar, useRecordContext,
} from "react-admin";
import { CATEGORY_TYPE_CHOICES } from "./categories";
import { StatusChip, type ChipColour } from "./orders";

export const QUOTE_STATUS_CHOICES = [
  { id: "NEW", name: "New" },
  { id: "IN_PROGRESS", name: "In progress" },
  { id: "SENT", name: "Quote sent" },
  { id: "ACCEPTED", name: "Accepted" },
  { id: "REJECTED", name: "Rejected" },
];
const QUOTE_COLOURS: Record<string, ChipColour> = { NEW: "warning", IN_PROGRESS: "info", SENT: "primary", ACCEPTED: "success", REJECTED: "error" };
const chip = (status: string) => <StatusChip status={status} choices={QUOTE_STATUS_CHOICES} colours={QUOTE_COLOURS} />;

const typeName = (t: string) => CATEGORY_TYPE_CHOICES.find((c) => c.id === t)?.name ?? t;
const size = (r: Record<string, unknown>) =>
  r.widthMm || r.heightMm ? `${r.widthMm ?? "?"} × ${r.heightMm ?? "?"} mm` : "—";

const filters = [
  <SearchInput key="q" source="q" alwaysOn placeholder="Name, email or Eircode" />,
  <SelectInput key="status" source="status" choices={QUOTE_STATUS_CHOICES} alwaysOn emptyText="All statuses" />,
];

export function QuoteList() {
  return (
    <List filters={filters} sort={{ field: "createdAt", order: "DESC" }} perPage={25} exporter={false}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <DateField source="createdAt" label="Date" showTime />
        <TextField source="reference" sortable={false} />
        <TextField source="name" />
        <TextField source="email" />
        <FunctionField label="Door" sortBy="doorType" render={(r) => typeName(r.doorType)} />
        <FunctionField label="Size" render={size} />
        <FunctionField label="Photos" render={(r) => r.photos?.length || "—"} />
        <FunctionField label="Status" sortBy="status" render={(r) => chip(r.status)} />
      </Datagrid>
    </List>
  );
}

function QuoteDetails() {
  const q = useRecordContext();
  if (!q) return null;
  const row = (label: string, value: React.ReactNode) => (
    <Box sx={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 2, py: 0.5 }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography component="div" sx={{ whiteSpace: "pre-wrap" }}>{value || "—"}</Typography>
    </Box>
  );
  return (
    <Box sx={{ width: "100%", maxWidth: 900 }}>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", mb: 2 }}>
        <Typography variant="h5">Quote {q.reference}</Typography>
        {chip(q.status)}
        <Typography color="text.secondary">{new Date(q.createdAt).toLocaleString("en-IE")} · {q.locale?.toUpperCase()}</Typography>
      </Box>
      {row("Name", q.name)}
      {row("Email", <Link href={`mailto:${q.email}?subject=${encodeURIComponent(`Mr.Door quote ${q.reference}`)}`}>{q.email}</Link>)}
      {row("Phone", q.phone ? <Link href={`tel:${q.phone}`}>{q.phone}</Link> : "")}
      {row("Door type", typeName(q.doorType))}
      {row("Size (W × H)", size(q))}
      {row("Eircode", q.eircode)}
      {row("Message", q.message)}
      {q.photos?.length > 0 && (
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 2 }}>
          {q.photos.map((url: string, i: number) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" title={`Open photo ${i + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Photo ${i + 1}`} style={{ width: 160, height: 120, objectFit: "cover", borderRadius: 8, border: "1px solid #e4e0d8" }} />
            </a>
          ))}
        </Box>
      )}
      <Divider sx={{ my: 3 }} />
    </Box>
  );
}

const SaveOnly = () => <Toolbar><SaveButton label="Save status" /></Toolbar>;

export function QuoteEdit() {
  return (
    <Edit mutationMode="pessimistic" title={<FunctionField render={(r) => `Quote ${r.reference}`} />}>
      <SimpleForm toolbar={<SaveOnly />}>
        <QuoteDetails />
        <SelectInput source="status" label="Change status" choices={QUOTE_STATUS_CHOICES} />
      </SimpleForm>
    </Edit>
  );
}

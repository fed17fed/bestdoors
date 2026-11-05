"use client";

import { Box, Chip, Divider, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import {
  DateField, Datagrid, Edit, FunctionField, List, NumberField, SaveButton, SearchInput, SelectInput, SimpleForm,
  TextField, Toolbar, useRecordContext,
} from "react-admin";

const eur = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(n);

export const ORDER_STATUS_CHOICES = [
  { id: "PENDING", name: "Pending (not paid)" },
  { id: "PAID", name: "Paid" },
  { id: "IN_PRODUCTION", name: "In production" },
  { id: "SHIPPED", name: "Shipped" },
  { id: "DELIVERED", name: "Delivered" },
  { id: "CANCELLED", name: "Cancelled" },
];
export type ChipColour = "default" | "warning" | "success" | "info" | "primary" | "error";
const COLOURS: Record<string, ChipColour> = {
  PENDING: "default", PAID: "warning", IN_PRODUCTION: "info", SHIPPED: "primary", DELIVERED: "success", CANCELLED: "error",
};

/** Small coloured status label. Orders use the default colours and names. */
export function StatusChip({ status, choices = ORDER_STATUS_CHOICES, colours = COLOURS }: {
  status: string;
  choices?: { id: string; name: string }[];
  colours?: Record<string, ChipColour>;
}) {
  return <Chip size="small" color={colours[status] ?? "default"} label={choices.find((c) => c.id === status)?.name ?? status} />;
}

const filters = [
  <SearchInput key="q" source="q" alwaysOn placeholder="Email or #number" />,
  <SelectInput key="status" source="status" choices={ORDER_STATUS_CHOICES} alwaysOn emptyText="All statuses" />,
];

export function OrderList() {
  return (
    <List filters={filters} filterDefaultValues={{}} sort={{ field: "createdAt", order: "DESC" }} perPage={25} exporter={false}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <FunctionField label="#" sortBy="number" render={(r) => `#${r.number}`} />
        <DateField source="createdAt" label="Date" showTime />
        <TextField source="email" />
        <FunctionField label="Status" sortBy="status" render={(r) => <StatusChip status={r.status} />} />
        <NumberField source="itemCount" label="Items" sortable={false} />
        <NumberField source="total" options={{ style: "currency", currency: "EUR" }} />
      </Datagrid>
    </List>
  );
}

type Item = { productName: string; options: { group: string; value: string }[]; quantity: number; unitPrice: number };
type Address = { name?: string; line1?: string; line2?: string; city?: string; county?: string; postalCode?: string; country?: string; phone?: string };

function OrderDetails() {
  const o = useRecordContext();
  if (!o) return null;
  const a = (o.shippingAddress ?? {}) as Address;
  return (
    <Box sx={{ width: "100%", maxWidth: 900 }}>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <Typography variant="h5">Order #{o.number}</Typography>
        <StatusChip status={o.status} />
        <Typography color="text.secondary">{new Date(o.createdAt).toLocaleString("en-IE")} · {o.locale?.toUpperCase()}</Typography>
      </Box>
      <Table size="small" sx={{ mt: 2 }}>
        <TableHead>
          <TableRow><TableCell>Door</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Price</TableCell><TableCell align="right">Total</TableCell></TableRow>
        </TableHead>
        <TableBody>
          {(o.items as Item[]).map((i, n) => (
            <TableRow key={n}>
              <TableCell>
                <strong>{i.productName}</strong>
                <Typography variant="body2" color="text.secondary">{i.options.map((x) => `${x.group}: ${x.value}`).join(" · ")}</Typography>
              </TableCell>
              <TableCell align="right">{i.quantity}</TableCell>
              <TableCell align="right">{eur(i.unitPrice)}</TableCell>
              <TableCell align="right">{eur(i.unitPrice * i.quantity)}</TableCell>
            </TableRow>
          ))}
          <TableRow><TableCell colSpan={3} align="right">Of which VAT (23%)</TableCell><TableCell align="right">{eur(o.vatAmount)}</TableCell></TableRow>
          <TableRow><TableCell colSpan={3} align="right">Delivery</TableCell><TableCell align="right">{o.shipping ? eur(o.shipping) : "Free"}</TableCell></TableRow>
          <TableRow><TableCell colSpan={3} align="right"><strong>Total</strong></TableCell><TableCell align="right"><strong>{eur(o.total)}</strong></TableCell></TableRow>
        </TableBody>
      </Table>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mt: 3 }}>
        <Box>
          <Typography variant="subtitle2">Customer</Typography>
          <Typography>{o.email || "—"}</Typography>
          <Typography variant="body2" color="text.secondary">{o.userId ? "Has an account" : "Guest checkout"}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2">Delivery address</Typography>
          {o.shippingAddress ? (
            <Typography sx={{ whiteSpace: "pre-line" }}>
              {[a.name, a.line1, a.line2, [a.city, a.county].filter(Boolean).join(", "), a.postalCode, a.country, a.phone].filter(Boolean).join("\n")}
            </Typography>
          ) : <Typography color="text.secondary">—</Typography>}
        </Box>
      </Box>
      {o.stripeSessionId && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>Stripe session: {o.stripeSessionId}</Typography>
      )}
      <Divider sx={{ my: 3 }} />
    </Box>
  );
}

function StatusInput() {
  const o = useRecordContext();
  // PENDING and PAID come from Stripe only; an unpaid order can only be cancelled.
  const choices = ORDER_STATUS_CHOICES.map((c) => ({
    ...c,
    disabled: c.id === "PENDING" || c.id === "PAID" || (o?.status === "PENDING" && c.id !== "CANCELLED"),
  }));
  return <SelectInput source="status" label="Change status" choices={choices} helperText="Pending and Paid are set by Stripe. No email is sent to the customer yet." />;
}

const SaveOnly = () => <Toolbar><SaveButton label="Save status" /></Toolbar>;

export function OrderEdit() {
  return (
    <Edit mutationMode="pessimistic" title={<FunctionField render={(r) => `Order #${r.number}`} />}>
      <SimpleForm toolbar={<SaveOnly />}>
        <OrderDetails />
        <StatusInput />
      </SimpleForm>
    </Edit>
  );
}

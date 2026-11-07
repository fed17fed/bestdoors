"use client";

import { Alert, Button } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  BooleanField, BooleanInput, Create, Datagrid, DateField, DeleteWithConfirmButton, Edit, FunctionField, List, NumberField,
  NumberInput, SaveButton, SearchInput, SelectInput, SimpleForm, TextField, TextInput, Toolbar, TopToolbar, minValue, maxValue,
  regex, required, useRecordContext,
} from "react-admin";
import { CORE_PAGE_SLUGS, PAGE_SLUG_REGEX, RESERVED_PAGE_SLUGS } from "@bestdoors/shared";
import { PageRichText } from "../RichTextEditor";
import { StatusChip, type ChipColour } from "./orders";

const STATUS_CHOICES = [
  { id: "DRAFT", name: "Draft (hidden)" },
  { id: "PUBLISHED", name: "Published" },
];
const STATUS_COLOURS: Record<string, ChipColour> = { DRAFT: "default", PUBLISHED: "success" };

const slugRule = regex(PAGE_SLUG_REGEX, "Use lowercase letters, numbers and dashes (e.g. about-us)");
const reservedRule = (v?: string) => ((RESERVED_PAGE_SLUGS as readonly string[]).includes(v ?? "") ? "This address is used by the shop. Choose another one" : undefined);

const filters = [<SearchInput key="q" source="q" alwaysOn placeholder="Title or address" />];

/** Link to the page in the shop. Drafts are hidden from visitors, so they open a "not found" page until published. */
function OpenPageButton() {
  const record = useRecordContext();
  if (!record?.slug) return null;
  return (
    <Button size="small" startIcon={<OpenInNewIcon />} href={`/en/${record.slug}`} target="_blank" rel="noopener noreferrer"
      title={record.status === "PUBLISHED" ? "Open the page in the shop" : "This page is a draft: visitors (and this link) see 'not found' until you publish it"}>
      Open page
    </Button>
  );
}

export function PageList() {
  return (
    <List filters={filters} sort={{ field: "sortOrder", order: "ASC" }} perPage={25} exporter={false}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="title" />
        <FunctionField label="Address" sortBy="slug" render={(r) => `/${r.slug}`} />
        <FunctionField label="Status" sortBy="status" render={(r) => <StatusChip status={r.status} choices={STATUS_CHOICES} colours={STATUS_COLOURS} />} />
        <BooleanField source="showInFooter" label="In footer" />
        <NumberField source="sortOrder" label="Order" />
        <DateField source="updatedAt" label="Updated" showTime />
        <OpenPageButton />
      </Datagrid>
    </List>
  );
}

function EditToolbar() {
  const record = useRecordContext();
  const core = !!record?.isCore;
  return (
    <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
      <SaveButton />
      {/* Required pages (privacy, terms) cannot be deleted. Others ask for a confirmation first. */}
      {record && !core && (
        <DeleteWithConfirmButton
          confirmTitle="Delete this page?"
          confirmContent="The page will be removed for good and its address will show 'not found'. This cannot be undone."
          mutationMode="pessimistic"
        />
      )}
    </Toolbar>
  );
}

function PageForm({ create = false }: { create?: boolean }) {
  const record = useRecordContext();
  const core = !!record?.isCore;
  return (
    <SimpleForm toolbar={create ? undefined : <EditToolbar />} defaultValues={create ? { status: "DRAFT", showInFooter: false, sortOrder: 0, content: "", seoTitle: "", seoDescription: "" } : undefined}>
      {core && (
        <Alert severity="info" sx={{ width: "100%", mb: 1 }}>
          This page is required ({CORE_PAGE_SLUGS.join(", ")}): the shop links to it. You can edit the text, but not delete it or change its address.
        </Alert>
      )}
      <TextInput source="title" validate={[required()]} fullWidth helperText="Shown as the main heading of the page." />
      <TextInput source="slug" label="Address (slug)" validate={[required(), slugRule, reservedRule]} disabled={core} fullWidth
        helperText="The page opens at /en/<address>, for example about-us. Changing it breaks old links." />
      <SelectInput source="status" choices={STATUS_CHOICES} validate={required()} helperText="Only published pages are visible in the shop." />
      <BooleanInput source="showInFooter" label="Show a link in the footer" />
      <NumberInput source="sortOrder" label="Order (small numbers first)" validate={[minValue(0), maxValue(10000)]} helperText="Used for the footer links and the page list." />
      <PageRichText source="content" label="Page text" />
      <TextInput source="seoTitle" label="SEO title" fullWidth helperText="For search engines (up to about 60 characters). Empty = the page title." />
      <TextInput source="seoDescription" label="SEO description" multiline minRows={2} fullWidth helperText="Short summary for search results (up to about 160 characters)." />
    </SimpleForm>
  );
}

function EditActions() {
  return (
    <TopToolbar>
      <OpenPageButton />
    </TopToolbar>
  );
}

export function PageCreate() {
  return (
    <Create redirect="edit">
      <PageForm create />
    </Create>
  );
}

export function PageEdit() {
  return (
    <Edit mutationMode="pessimistic" actions={<EditActions />}>
      <PageForm />
    </Edit>
  );
}

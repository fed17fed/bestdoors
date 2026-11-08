"use client";

import { Create, Datagrid, Edit, FunctionField, List, NumberField, NumberInput, SelectInput, TabbedForm, TextField, TextInput, regex, required, useGetList, useRecordContext } from "react-admin";
import { ImageUrlInput } from "../ImageUrlInput";

export const CATEGORY_TYPE_CHOICES = [
  { id: "INTERIOR", name: "Interior" },
  { id: "EXTERIOR", name: "Exterior" },
  { id: "PATIO", name: "Patio" },
  { id: "SLIDING", name: "Sliding" },
  { id: "FRENCH", name: "French" },
];
const slugRule = regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes");

export function CategoryList() {
  return (
    <List pagination={false} sort={{ field: "sortOrder", order: "ASC" }}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="name" label="Name (EN)" sortable={false} />
        <TextField source="slug" sortable={false} />
        <TextField source="type" sortable={false} />
        <FunctionField label="Parent" sortable={false} render={(r) => (r.parentId ? "↳ " : "") + (r.parentName ?? "")} />
        <NumberField source="sortOrder" label="Order" sortable={false} />
        <FunctionField label="Doors" render={(r) => r._count?.products ?? "—"} />
      </Datagrid>
    </List>
  );
}

/** Parent choices: only main categories (max 2 levels), never the category itself. */
function ParentInput() {
  const record = useRecordContext();
  const { data = [] } = useGetList("categories", { pagination: { page: 1, perPage: 100 }, sort: { field: "sortOrder", order: "ASC" } });
  const choices = data.filter((c) => !c.parentId && c.id !== record?.id);
  const hasChildren = !!record?.id && data.some((c) => c.parentId === record.id);
  return (
    <SelectInput
      source="parentId"
      label="Parent category"
      choices={choices}
      optionText="name"
      emptyText="None (main category)"
      parse={(v) => v || null}
      disabled={hasChildren}
      helperText={hasChildren ? "This category has subcategories, so it must stay a main category." : "Choose a main category to make this a subcategory. Max 2 levels."}
    />
  );
}

function CategoryForm({ defaultValues }: { defaultValues?: object }) {
  return (
    <TabbedForm defaultValues={defaultValues}>
      <TabbedForm.Tab label="General">
        <TextInput source="translations.0.name" label="Name (English)" validate={required()} fullWidth />
        <TextInput source="slug" label="URL slug" validate={[required(), slugRule]} helperText="Part of the page address. Changing it breaks old links." fullWidth />
        <ParentInput />
        <SelectInput source="type" choices={CATEGORY_TYPE_CHOICES} validate={required()} helperText="Decides how doors of this category are drawn and grouped." />
        <NumberInput source="sortOrder" label="Order in menus" />
        <ImageUrlInput source="imageUrl" label="Category image URL" />
      </TabbedForm.Tab>
      <TabbedForm.Tab label="English">
        <TextInput source="translations.0.name" label="Name" validate={required()} fullWidth />
        <TextInput source="translations.0.description" label="Description" multiline minRows={4} fullWidth />
      </TabbedForm.Tab>
    </TabbedForm>
  );
}

export function CategoryCreate() {
  return (
    <Create redirect="list">
      <CategoryForm defaultValues={{ sortOrder: 0, parentId: null, imageUrl: "", translations: [{ locale: "en", name: "", description: "" }] }} />
    </Create>
  );
}

export function CategoryEdit() {
  return (
    <Edit mutationMode="pessimistic">
      <CategoryForm />
    </Edit>
  );
}

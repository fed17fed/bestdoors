"use client";

import { Create, Datagrid, Edit, FunctionField, List, NumberField, NumberInput, SelectInput, TabbedForm, TextField, TextInput, regex, required } from "react-admin";
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
        <NumberField source="sortOrder" label="Order" sortable={false} />
        <FunctionField label="Doors" render={(r) => r._count?.products ?? "—"} />
      </Datagrid>
    </List>
  );
}

function CategoryForm({ defaultValues }: { defaultValues?: object }) {
  return (
    <TabbedForm defaultValues={defaultValues}>
      <TabbedForm.Tab label="General">
        <TextInput source="translations.0.name" label="Name (English)" validate={required()} fullWidth />
        <TextInput source="slug" label="URL slug" validate={[required(), slugRule]} helperText="Part of the page address. Changing it breaks old links." fullWidth />
        <SelectInput source="type" choices={CATEGORY_TYPE_CHOICES} validate={required()} helperText="Decides how doors of this category are drawn and grouped." />
        <NumberInput source="sortOrder" label="Order in menus" />
        <ImageUrlInput source="imageUrl" label="Category image URL" />
      </TabbedForm.Tab>
      <TabbedForm.Tab label="English">
        <TextInput source="translations.0.name" label="Name" validate={required()} fullWidth />
        <TextInput source="translations.0.description" label="Description" multiline minRows={4} fullWidth />
      </TabbedForm.Tab>
      <TabbedForm.Tab label="Українська">
        <TextInput source="translations.1.name" label="Назва" helperText="Leave empty to show the English text." fullWidth />
        <TextInput source="translations.1.description" label="Опис" multiline minRows={4} fullWidth />
      </TabbedForm.Tab>
    </TabbedForm>
  );
}

export function CategoryCreate() {
  return (
    <Create redirect="list">
      <CategoryForm defaultValues={{ sortOrder: 0, imageUrl: "", translations: [{ locale: "en", name: "", description: "" }, { locale: "uk", name: "", description: "" }] }} />
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

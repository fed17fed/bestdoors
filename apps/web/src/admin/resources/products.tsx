"use client";

import {
  ArrayInput, BooleanField, BooleanInput, CheckboxGroupInput, Create, Datagrid, Edit, FunctionField, List,
  NumberField, NumberInput, ReferenceArrayInput, ReferenceField, ReferenceInput, SearchInput, SelectInput,
  SimpleFormIterator, TabbedForm, TextField, TextInput, maxValue, minValue, regex, required,
} from "react-admin";
import { ImageUrlInput } from "../ImageUrlInput";

const slugRule = regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes (e.g. dublin-oak-door)");
const filters = [<SearchInput key="q" source="q" alwaysOn placeholder="Name, slug or material" />];

export function ProductList() {
  return (
    <List filters={filters} sort={{ field: "createdAt", order: "DESC" }} perPage={25}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <FunctionField label="Image" render={(r) => r.images?.[0]?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.images[0].url} alt="" style={{ width: 40, height: 52, objectFit: "contain" }} />
        ) : "—"} />
        <TextField source="name" label="Name (EN)" sortable={false} />
        <ReferenceField source="categoryId" reference="categories" link={false} sortable={false}>
          <TextField source="name" />
        </ReferenceField>
        <TextField source="material" />
        <NumberField source="basePrice" label="Price" options={{ style: "currency", currency: "EUR" }} />
        <BooleanField source="published" />
        <BooleanField source="featured" sortable={false} />
      </Datagrid>
    </List>
  );
}

function ProductForm({ defaultValues }: { defaultValues?: object }) {
  return (
    <TabbedForm defaultValues={defaultValues}>
      <TabbedForm.Tab label="General">
        <TextInput source="translations.0.name" label="Name (English)" validate={[required()]} fullWidth />
        <TextInput source="slug" label="URL slug" validate={[required(), slugRule]} helperText="Part of the page address. Changing it breaks old links." fullWidth />
        <ReferenceInput source="categoryId" reference="categories">
          <SelectInput optionText="name" validate={required()} />
        </ReferenceInput>
        <TextInput source="material" validate={required()} helperText="e.g. Composite, Oak, Pine, Aluminium" />
        <NumberInput source="basePrice" label="Base price, € (VAT included)" validate={[required(), minValue(0), maxValue(1_000_000)]} />
        <BooleanInput source="published" helperText="Only published doors are shown in the shop." />
        <BooleanInput source="featured" helperText="Shown on the home page." />
      </TabbedForm.Tab>
      <TabbedForm.Tab label="English">
        <TextInput source="translations.0.name" label="Name" validate={required()} fullWidth />
        <TextInput source="translations.0.description" label="Description" multiline minRows={5} fullWidth />
      </TabbedForm.Tab>
      <TabbedForm.Tab label="Images">
        <ArrayInput source="images" label="Images (the first one is the main image)">
          <SimpleFormIterator inline={false} disableClear>
            <ImageUrlInput source="url" validate={required()} />
            <TextInput source="alt" label="Alt text (for screen readers and SEO)" fullWidth />
          </SimpleFormIterator>
        </ArrayInput>
      </TabbedForm.Tab>
      <TabbedForm.Tab label="Options">
        <ReferenceArrayInput source="optionGroupIds" reference="option-groups">
          <CheckboxGroupInput optionText="name" label="Configurator options for this door" row={false} />
        </ReferenceArrayInput>
      </TabbedForm.Tab>
    </TabbedForm>
  );
}

const defaults = {
  published: false,
  featured: false,
  images: [],
  optionGroupIds: [],
  translations: [{ locale: "en", name: "", description: "" }],
};

export function ProductCreate() {
  return (
    <Create redirect="edit">
      <ProductForm defaultValues={defaults} />
    </Create>
  );
}

export function ProductEdit() {
  return (
    <Edit mutationMode="pessimistic" title={<FunctionField render={(r) => `Product: ${r.name}`} />}>
      <ProductForm />
    </Edit>
  );
}

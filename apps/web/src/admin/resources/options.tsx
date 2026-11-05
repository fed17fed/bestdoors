"use client";

import { Box } from "@mui/material";
import {
  ArrayInput, BooleanInput, Datagrid, Edit, FormDataConsumer, FunctionField, List, NumberField, NumberInput,
  SaveButton, SimpleForm, SimpleFormIterator, TextField, TextInput, Toolbar, regex, required, useRecordContext,
} from "react-admin";

/** Option groups (size, colour, glass, handle, swing) are fixed: the shop pages use their codes. */
export function OptionGroupList() {
  return (
    <List pagination={false} exporter={false}>
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="name" label="Name (EN)" sortable={false} />
        <TextField source="code" sortable={false} />
        <FunctionField label="Values" render={(r) => r.values?.map((v: { label: string }) => v.label).join(", ")} />
        <NumberField source="productCount" label="Doors using it" sortable={false} />
      </Datagrid>
    </List>
  );
}

const codeRule = regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, dashes");
const colourRule = regex(/^(#[0-9a-fA-F]{6})?$/, "Like #1f4d3a, or empty");

function Title() {
  const r = useRecordContext();
  return <span>Options: {r?.name}</span>;
}

export function OptionGroupEdit() {
  return (
    <Edit mutationMode="pessimistic" title={<Title />}>
      {/* No delete: the shop pages need every group. */}
      <SimpleForm toolbar={<Toolbar><SaveButton /></Toolbar>}>
        <TextInput source="code" disabled helperText="Fixed: the shop uses this code." />
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", width: "100%" }}>
          <TextInput source="translations.0.name" label="Name (English)" validate={required()} />
          <TextInput source="translations.1.name" label="Назва (українською)" />
          <NumberInput source="sortOrder" label="Order in the configurator" />
        </Box>
        <ArrayInput source="values" label="Values (shown in this order in the configurator; the extra price is added to the door price)">
          <SimpleFormIterator inline disableClear>
            <TextInput source="code" validate={[required(), codeRule]} helperText={false} sx={{ width: 130, flex: "none" }} />
            <TextInput source="translations.0.label" label="Label (EN)" validate={required()} helperText={false} sx={{ width: 230, flex: "none" }} />
            <TextInput source="translations.1.label" label="Назва (UK)" helperText={false} sx={{ width: 230, flex: "none" }} />
            <NumberInput source="priceDelta" label="Extra price, €" helperText={false} sx={{ width: 130, flex: "none" }} />
            <TextInput source="swatch" label="Colour #hex" validate={colourRule} helperText={false} sx={{ width: 130, flex: "none" }} />
            <FormDataConsumer>
              {({ scopedFormData }) =>
                scopedFormData?.swatch ? (
                  <Box aria-hidden sx={{ width: 28, minWidth: 28, height: 28, flex: "none", mt: 1.5, borderRadius: "50%", border: "1px solid #ccc", bgcolor: scopedFormData.swatch }} />
                ) : null
              }
            </FormDataConsumer>
            <BooleanInput source="isDefault" label="Default" helperText={false} />
          </SimpleFormIterator>
        </ArrayInput>
      </SimpleForm>
    </Edit>
  );
}

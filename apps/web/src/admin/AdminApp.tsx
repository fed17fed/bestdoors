"use client";

import { Admin, Resource, defaultTheme, type RaThemeOptions } from "react-admin";
import DoorFrontIcon from "@mui/icons-material/DoorFront";
import CategoryIcon from "@mui/icons-material/Category";
import TuneIcon from "@mui/icons-material/Tune";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import { authProvider } from "./authProvider";
import { dataProvider } from "./dataProvider";
import { ProductCreate, ProductEdit, ProductList } from "./resources/products";
import { CategoryCreate, CategoryEdit, CategoryList } from "./resources/categories";
import { OptionGroupEdit, OptionGroupList } from "./resources/options";
import { OrderEdit, OrderList } from "./resources/orders";
import { QuoteEdit, QuoteList } from "./resources/quotes";

// Shop colours (see apps/web/src/app/globals.css).
const theme: RaThemeOptions = {
  ...defaultTheme,
  // React Admin paints the top bar with the "secondary" colour.
  palette: { primary: { main: "#1f4d3a" }, secondary: { main: "#163a2b" }, background: { default: "#faf8f4" } },
  typography: { fontFamily: "Manrope, system-ui, sans-serif" },
};

export default function AdminApp() {
  return (
    <Admin
      title="BestDoors admin"
      dataProvider={dataProvider}
      authProvider={authProvider}
      theme={theme}
      requireAuth
      disableTelemetry
    >
      <Resource name="orders" list={OrderList} edit={OrderEdit} icon={ReceiptLongIcon} recordRepresentation={(r) => `#${r.number}`} />
      <Resource name="quotes" list={QuoteList} edit={QuoteEdit} icon={RequestQuoteIcon} recordRepresentation="reference" />
      <Resource name="products" list={ProductList} edit={ProductEdit} create={ProductCreate} icon={DoorFrontIcon} recordRepresentation="name" />
      <Resource name="categories" list={CategoryList} edit={CategoryEdit} create={CategoryCreate} icon={CategoryIcon} recordRepresentation="name" />
      <Resource name="option-groups" options={{ label: "Options" }} list={OptionGroupList} edit={OptionGroupEdit} icon={TuneIcon} recordRepresentation="name" />
    </Admin>
  );
}

"use client";

import { Admin, CustomRoutes, Resource, defaultTheme, type RaThemeOptions } from "react-admin";
import { Route } from "react-router-dom";
import DoorFrontIcon from "@mui/icons-material/DoorFront";
import CategoryIcon from "@mui/icons-material/Category";
import TuneIcon from "@mui/icons-material/Tune";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import ArticleIcon from "@mui/icons-material/Article";
import { authProvider } from "./authProvider";
import { dataProvider } from "./dataProvider";
import { ForgotPasswordPage, LoginPage, ResetPasswordPage } from "./passwordPages";
import { ProductCreate, ProductEdit, ProductList } from "./resources/products";
import { CategoryCreate, CategoryEdit, CategoryList } from "./resources/categories";
import { OptionGroupEdit, OptionGroupList } from "./resources/options";
import { OrderEdit, OrderList } from "./resources/orders";
import { QuoteEdit, QuoteList } from "./resources/quotes";
import { PageCreate, PageEdit, PageList } from "./resources/pages";

// Shop colours (see apps/web/src/app/globals.css).
const theme: RaThemeOptions = {
  ...defaultTheme,
  // React Admin paints the top bar with the "secondary" colour.
  palette: { primary: { main: "#1e4fc2" }, secondary: { main: "#0b2a6f" }, background: { default: "#f6faff" } },
  typography: { fontFamily: "Manrope, system-ui, sans-serif" },
};

export default function AdminApp() {
  return (
    <Admin
      title="Mr.Door admin"
      dataProvider={dataProvider}
      authProvider={authProvider}
      loginPage={LoginPage}
      theme={theme}
      requireAuth
      disableTelemetry
    >
      {/* Open without login ("noLayout" pages are not protected by requireAuth). */}
      <CustomRoutes noLayout>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </CustomRoutes>
      <Resource name="orders" list={OrderList} edit={OrderEdit} icon={ReceiptLongIcon} recordRepresentation={(r) => `#${r.number}`} />
      <Resource name="quotes" list={QuoteList} edit={QuoteEdit} icon={RequestQuoteIcon} recordRepresentation="reference" />
      <Resource name="products" list={ProductList} edit={ProductEdit} create={ProductCreate} icon={DoorFrontIcon} recordRepresentation="name" />
      <Resource name="categories" list={CategoryList} edit={CategoryEdit} create={CategoryCreate} icon={CategoryIcon} recordRepresentation="name" />
      <Resource name="option-groups" options={{ label: "Options" }} list={OptionGroupList} edit={OptionGroupEdit} icon={TuneIcon} recordRepresentation="name" />
      <Resource name="pages" options={{ label: "Pages" }} list={PageList} edit={PageEdit} create={PageCreate} icon={ArticleIcon} recordRepresentation="title" />
    </Admin>
  );
}

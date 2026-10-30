import type { ServerFunctionClient } from "payload";
import config from "@payload-config";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import { Inter } from "next/font/google";
import { importMap } from "./admin/importMap.js";
import "@payloadcms/next/css";
import "./custom.scss";
import "./theme.scss";
import "./nav-icons.scss";

type Args = { children: React.ReactNode };

// The source panel's typeface.
const inter = Inter({ subsets: ["latin", "latin-ext", "cyrillic"], display: "swap" });

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({ ...args, config, importMap });
};

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    <style>{`:root { --font-body: ${inter.style.fontFamily}, ui-sans-serif, system-ui, sans-serif; }`}</style>
    {children}
  </RootLayout>
);

export default Layout;

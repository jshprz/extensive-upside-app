import { LinksFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

export let links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css",
    },
    {
      rel: "preconnect",
      href: "https://cdn.shopify.com/",
    },
    {
      rel: "stylesheet",
      href: "./styles/style.css"
    }
  ];
};

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

import {
  Layout,
  Page,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import customcss from "app/styles/style.css?url";
import { authenticate } from "app/shopify.server";
import AddToCartTextForm from "app/components/settings-page/AddToCartTextForm";
import CustomNoteForm from "app/components/settings-page/CustomNoteForm";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: customcss }];
};

const prisma = new PrismaClient();
  
export const loader: LoaderFunction = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const queryProductsByProductIds = `
    query ($productIds: [ID!]!) {
      nodes(ids: $productIds) {
        ... on Product {
          id
          title
          totalInventory
          media(first: 1) {
            edges {
              node {
                ... on MediaImage {
                  image {
                    url
                    altText
                  }
                }
              }
            }
          }
          metafields(first: 10) {
            edges {
              node {
                namespace
                key
                value
              }
            }
          }
        }
      }
    }
  `;

  try {
    const stagedProductIds = await prisma.stagedProducts.findMany({ select: {productId: true} });
    const queryProductsByProductIdsVariables = {
      productIds: stagedProductIds.map(({ productId }) => productId)
    };
    const productsByProductIdsResponse = await admin.graphql(queryProductsByProductIds, { variables: queryProductsByProductIdsVariables });
    const productsByProductIds = await productsByProductIdsResponse.json();
    
    if (productsByProductIds.data.nodes.includes(null)) {
      productsByProductIds.data.nodes = productsByProductIds.data.nodes.filter((node: null) => node !== null);            
    }

    return json({
      productsByProductIds: productsByProductIds.data,
    });
  } catch (error) {
    console.error("Error fetching products: ", error);
    return json({ error: (error as any).message }, { status: 500 });
  }
}

export default function SettingsPage() {
  return (
    <Page>
      <TitleBar title="Settings" />
      <Layout>
        <Layout.Section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AddToCartTextForm />
            <CustomNoteForm />
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
import {
  Button,
  Card,
  Form,
  FormLayout,
  Layout,
  Page,
  Select,
  TextField,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useCallback, useEffect, useState } from "react";
import { json } from "@remix-run/node";
import type { ActionFunction, ActionFunctionArgs, LinksFunction, LoaderFunction } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { PrismaClient } from "@prisma/client";
import customcss from "app/styles/style.css?url";
import { authenticate } from "app/shopify.server";
import IProductsByProductIds from "app/interfaces/IProductsByProductIds";

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

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();

     const productIds = formData.getAll('productIds') || [];
     const addToCartName = formData.get('add-to-cart-name') || '';

     const metafields = productIds.map((productId) => ({
         key: 'button_add_to_cart_text',
         namespace: 'custom',
         value: addToCartName,
         type: 'single_line_text_field',
         ownerId: productId,
     }));

    const mutation = `
        #graphql
        mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              metafields {
                key
                namespace
                value
                createdAt
                updatedAt
              }
              userErrors {
                field
                message
                code
              }
            }
        }
    `;
    const variables = { metafields };

    try {
        const mutationResponse = await admin.graphql(mutation, { variables });
        const mutationResponseJson = await mutationResponse.json();

        if (mutationResponseJson.data.metafieldsSet.userErrors.length > 0) {
            throw new Error(mutationResponseJson.data.metafieldsSet.userErrors[0].message);
        }
        
        return json({
          metafieldsSet: mutationResponseJson.data.metafieldsSet,
        });
    } catch (error) {
        console.error("Error adding product to cart: ", error);
        return json({ error: (error as any).message }, { status: 500 });
    }
};

interface IUseLoaderData extends IProductsByProductIds {}

interface Metafield {
  key: string;
  namespace: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

interface MetafieldsSetResponse {
  metafieldsSet: {
    metafields: Metafield[];
    userErrors: { field: string[]; message: string; code: string }[];
  };
}

export default function SettingsPage() {
  const shopify = useAppBridge();
  const fetcher = useFetcher<MetafieldsSetResponse>();
  const { productsByProductIds } = useLoaderData<IUseLoaderData>();
  
  const [addToCartName, setAddToCartName] = useState<string>('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [value, setValue] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      formData.set('add-to-cart-name', addToCartName);
      productsByProductIds.nodes.forEach((product) => formData.append('productIds', product.id));
      fetcher.submit(formData, { method: 'post' });
  }, [fetcher, addToCartName]);
  
  useEffect(() => {
      if (fetcher.data && (fetcher.data as { error?: string }).error) {
        setError((fetcher.data as { error?: string }).error);
      } else {
        setError(undefined);
      }
  }, [fetcher.data]);

  useEffect(() => {
    if (fetcher.data && fetcher.data.metafieldsSet.metafields.length > 0) {
      console.info('Metafields updated:', fetcher.data.metafieldsSet.metafields);
      shopify.toast.show(`${fetcher.data.metafieldsSet.metafields.length} product/s add to cart name updated successfully!`);
    }
    if (fetcher.data && fetcher.data.metafieldsSet.userErrors.length > 0) {
      console.error('Metafield creation error:', fetcher.data.metafieldsSet.userErrors[0].message);
      shopify.toast.show(fetcher.data.metafieldsSet.userErrors[0].message, { isError: true });
    }
  }, [fetcher.data]);

  const handleSelectChange = useCallback(
      (value: string) => setSelectedLanguage(value),
      [],
  );

  const options = [
      {label: 'English', value: 'english'},
      {label: 'Spanish', value: 'spanish'},
      {label: 'German', value: 'german'},
  ];

  const handleTabChange = useCallback((selectedIndex: React.SetStateAction<number>) => {
      setSelectedTabIndex(selectedIndex);
  }, []);

  const handleChange = useCallback(
      (newValue: string) => setValue(newValue),
      [],
  );

  const tabs = [
      {
          id: 'all-customers',
          content: 'English',
          accessibilityLabel: 'All customers',
          panelID: 'all-customers-content',
      },
  ];

  return (
    <Page>
      <TitleBar title="Settings" />
      <Layout>
        <Layout.Section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                  <Form onSubmit={handleSubmit}>
                    <FormLayout>
                      <Select
                          label="Languages"
                          options={options}
                          onChange={handleSelectChange}
                          value={selectedLanguage}
                      />
                      <TextField
                        label="Add to Cart Button Text"
                        value={addToCartName}
                        onChange={(value) => setAddToCartName(value)}
                        error={error}
                        autoComplete="off"
                      />
                      <Button variant="primary" submit loading={fetcher.state === 'submitting' || fetcher.state === 'loading'} fullWidth>
                        Save
                      </Button>
                    </FormLayout>
                  </Form>
              </Card>
              <Card>
                  <Form onSubmit={handleSubmit}>
                      <FormLayout>
                          <div className="flex">
                              {tabs.map((tab, index) => (
                                <button
                                  key={tab.id}
                                  onClick={() => setSelectedTabIndex(index)}
                                  className={`tab-button ${selectedTabIndex === index ? "active" : ""}`}
                                >
                                  {tab.content}
                                </button>
                              ))}
                          </div>
                          <div className="p-2">
                              <h1><b>Custom Note</b></h1>
                              <TextField
                                label="Add in a custom note with your pre-order. This will display below the pre-order button on your product page (Support HTML syntax)"
                                value={value}
                                onChange={handleChange}
                                multiline={4}
                                autoComplete="off"
                              />
                          </div>
                          <Button variant="primary" submit loading={fetcher.state === 'submitting'} fullWidth>
                            Save
                          </Button>
                      </FormLayout>
                  </Form>
              </Card>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
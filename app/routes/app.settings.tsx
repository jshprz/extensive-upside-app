import {
    BlockStack,
    Box,
    Button,
    Card,
    Form,
    FormLayout,
    InlineStack,
    Layout,
    LegacyCard,
    Page,
    Select,
    Tabs,
    Text,
    TextField,
  } from "@shopify/polaris";
  import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
  import { useCallback, useEffect, useState } from "react";
  import { json } from "@remix-run/node";
  import type { ActionFunction, LoaderFunction } from "@remix-run/node";
  import { Link, useFetcher, useLoaderData } from "@remix-run/react";
  import { PrismaClient, ShopifyStoreThemeCustomContent } from "@prisma/client";
  
  const prisma = new PrismaClient();
  const store = 'quickstart-3e2e3242';
  const themeId = '137013952605';
  
  export const loader: LoaderFunction = async ({ request }) => {
    try {
      const getThemeCustomContent = await prisma.shopifyStoreThemeCustomContent.findFirst({
        where: {
          store,
          themeId,
          key: 'add_to_cart_button_text',
        }
      });
  
      return json(getThemeCustomContent || { id: '', value: '' });
    } catch (error) {
      console.error("Error Response: ", (error as any).message);
      return json({ error: (error as any).message }, { status: 500 });
    }
  }
  
  export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const addToCartName = formData.get('add-to-cart-name');
    const key = 'add_to_cart_button_text';
  
    if (!addToCartName) {
      return json({ error: 'Add to cart name is required' }, { status: 400 });
    }
  
    try {
      const getThemeCustomContent = await prisma.shopifyStoreThemeCustomContent.findFirst({
        where: {
          store,
          themeId,
          key,
        }
      });
  
      if (getThemeCustomContent && getThemeCustomContent.id) {
        const updatedShopifyStoreThemeCustomContent = await prisma.shopifyStoreThemeCustomContent.update({
          where: {
            id: getThemeCustomContent.id,
          },
          data: {
            value: addToCartName as string,
          }
        });
  
        return json(updatedShopifyStoreThemeCustomContent);
      } else {
        const newShopifyStoreThemeCustomContent = await prisma.shopifyStoreThemeCustomContent.create({
          data: {
            store,
            themeId,
            key,
            value: addToCartName as string,
          }
        });
  
        return json(newShopifyStoreThemeCustomContent);
      }
    } catch (error) {
      console.error("Error Response: ", (error as any).message);
      return json({ error: (error as any).message }, { status: 500 });
    }
  };
  
  export default function SettingsPage() {
    const shopify = useAppBridge();
    const fetcher = useFetcher();
    const data = useLoaderData<ShopifyStoreThemeCustomContent>();
    const [addToCartName, setAddToCartName] = useState<string>(data.value);
    const [error, setError] = useState<string | undefined>(undefined);
  
    const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      formData.set('add-to-cart-name', addToCartName);
      fetcher.submit(formData, { method: 'post' });
    }, [fetcher, addToCartName]);
  
    const createdShopifyStoreThemeCustomContent = fetcher.data as ShopifyStoreThemeCustomContent;
  
    useEffect(() => {
      if (fetcher.data && (fetcher.data as { error?: string }).error) {
        setError((fetcher.data as { error?: string }).error);
      } else {
        setError(undefined);
      }
    }, [fetcher.data]);
  
    useEffect(() => {
      if (createdShopifyStoreThemeCustomContent && createdShopifyStoreThemeCustomContent.id) {
        shopify.toast.show("Add to cart name updated successfully!");
      }
    }, [createdShopifyStoreThemeCustomContent, shopify]);

    const [selectedLanguage, setSelectedLanguage] = useState('today');

    const handleSelectChange = useCallback(
        (value: string) => setSelectedLanguage(value),
        [],
    );

    const options = [
        {label: 'English', value: 'english'},
        {label: 'Spanish', value: 'spanish'},
        {label: 'German', value: 'german'},
    ];

    const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  const handleTabChange = useCallback((selectedIndex: React.SetStateAction<number>) => {
    setSelectedTabIndex(selectedIndex);
  }, []);

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
                    <div className="flex border-b">
                        {tabs.map((tab, index) => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedTabIndex(index)}
                                className={`py-2 px-4 ${
                                    selectedTabIndex === index
                                    ? 'border-b-4 border-[#1aab87] text-[#000000]'
                                    : 'hover:text-gray-800'
                                }`}
                            >
                                {tab.content}
                            </button>
                        ))}
                    </div>
                    <Button variant="primary" submit loading={fetcher.state === 'submitting'} fullWidth>
                      Save
                    </Button>
                  </FormLayout>
                </Form>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }
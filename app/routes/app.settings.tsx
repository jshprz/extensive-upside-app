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
    const createdShopifyStoreThemeCustomContent = fetcher.data as ShopifyStoreThemeCustomContent;
    
    const [addToCartName, setAddToCartName] = useState<string>(data.value);
    const [error, setError] = useState<string | undefined>(undefined);
    const [value, setValue] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  
    const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set('add-to-cart-name', addToCartName);
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
        if (createdShopifyStoreThemeCustomContent && createdShopifyStoreThemeCustomContent.id) {
          shopify.toast.show("Add to cart name updated successfully!");
        }
    }, [createdShopifyStoreThemeCustomContent, shopify]);

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
                        <Button variant="primary" submit loading={fetcher.state === 'submitting'} fullWidth>
                          Save
                        </Button>
                      </FormLayout>
                    </Form>
                </Card>
                <Card>
                    <Form onSubmit={handleSubmit}>
                        <FormLayout>
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
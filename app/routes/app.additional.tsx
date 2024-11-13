import {
  Button,
  Form,
  FormLayout,
  Page,
  TextField,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useCallback, useEffect, useState } from "react";
import { json } from "@remix-run/node";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { useFetcher, useLoaderData, useNavigation } from "@remix-run/react";
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

export default function AdditionalPage() {
  const shopify = useAppBridge();
  const fetcher = useFetcher();
  const data = useLoaderData<ShopifyStoreThemeCustomContent>();
  const [addToCartName, setAddToCartName] = useState<string>(data.value);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleSubmit = useCallback((event: { preventDefault: () => void; currentTarget: HTMLFormElement | undefined; }) => {
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

  return (
    <Page title="Change Add to Cart Button Globally">
      <div className="centered-form">
        <Form onSubmit={handleSubmit}>
          <FormLayout>
            <TextField
              label="Add to cart name: "
              name="add-to-cart-name"
              helpText="This will be the text displayed on the add to cart button in the online store product."
              autoComplete="off"
              loading={fetcher.state === 'loading' || fetcher.state === 'submitting'}
              onChange={setAddToCartName}
              value={addToCartName}
              error={error}
            />
            <Button submit disabled={fetcher.state !== 'idle'}> Submit </Button>
          </FormLayout>
        </Form>
      </div>
    </Page>
  );
}
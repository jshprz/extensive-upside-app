import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "app/shopify.server";
  
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
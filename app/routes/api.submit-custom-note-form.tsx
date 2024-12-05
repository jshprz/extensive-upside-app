import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "app/shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();

    const productIds = formData.getAll('productIds') || [];
    const customNote = formData.get('custom-note') || '';

    const metafields = productIds.map((productId) => ({
        key: 'custom_note',
        namespace: 'custom',
        value: customNote,
        type: 'multi_line_text_field',
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
        console.error("Error creating custom note metafield: ", error);
        return json({ error: (error as any).message }, { status: 500 });
    }
};
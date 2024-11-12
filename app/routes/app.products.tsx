import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Button, Card, DataTable, Divider, Page, TextField, Thumbnail } from "@shopify/polaris";
import { authenticate } from "app/shopify.server";
import { useEffect, useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { admin } = await authenticate.admin(request);

    const query = `
        query {
            products(first: 50) {
                edges {
                    node {
                        id
                        title
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
                    cursor
                }
                pageInfo {
                    hasNextPage
                }
            }
        }
    `;

    try {
        const response = await admin.graphql(query);
        const responseJson = await response.json();

        return responseJson.data;
    } catch (error) {
        console.error("Error fetching products: ", error);
        return json({ error: (error as any).message }, { status: 500 });
    }
}

export const action = async ({ request }: ActionFunctionArgs) => {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();
    const productId = formData.get('productId') || '';
    const addToCartName = formData.get('addToCartName') || '';

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
    const variables = {
        metafields: [
            {
                key: 'button_add_to_cart_text',
                namespace: 'custom',
                value: addToCartName,
                type: 'single_line_text_field',
                ownerId: `gid://shopify/Product/${productId}`,
            }
        ]
    };

    try {
        const mutationResponse = await admin.graphql(mutation, { variables });
        const mutationResponseJson = await mutationResponse.json();

        if (mutationResponseJson.data.metafieldsSet.userErrors.length > 0) {
            throw new Error(mutationResponseJson.data.metafieldsSet.userErrors[0].message);
        }
        console.log("Metafields SetTTY: ", mutationResponseJson.data.metafieldsSet.metafields);
        return json({
            metafields: mutationResponseJson.data.metafieldsSet.metafields,
        });
    } catch (error) {
        console.error("Error adding product to cart: ", error);
        return json({ error: (error as any).message }, { status: 500 });
    }
};

export default function ProductsPage() {
    const shopify = useAppBridge();
    const { products } = useLoaderData<{
        products: {
            edges: {
                node: {
                    id: string;
                    title: string;
                    media: {
                        edges: {
                            node: {
                                image: {
                                    url: string;
                                    altText: string;
                                };
                            };
                        }[];
                    };
                    metafields: {
                        edges: {
                            node: {
                                namespace: string;
                                key: string;
                                value: string;
                            };
                        }[];
                    };
                };
            }[];
        };
    }>();
    const fetcher = useFetcher<typeof action>();

    const [addToCartNameStates, setAddToCartNameStates] = useState<{ [key: string]: string }>({});
    const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
    const [addToCartNameGlobally, setAddToCartNameGlobally] = useState<string>('');
    const [productIdHolder, setProductIdHolder] = useState<string>('');
    const [errorStates, setErrorStates] = useState<{ [key: string]: string }>({});
    const [userInteracted, setUserInteracted] = useState<{ [key: string]: boolean }>({});
    
    const handleSubmitFromList = async (productId: string) => {
        setProductIdHolder(productId);
        fetcher.submit({ productId, addToCartName: addToCartNameStates[productId] || '' }, { method: 'post' });
    }
    useEffect(() => {
        if (fetcher.state === 'submitting' || fetcher.state === 'loading') {
            setLoadingStates((prevState) => ({ ...prevState, [productIdHolder]: true }));
        } else {
            setLoadingStates((prevState) => ({ ...prevState, [productIdHolder]: false }));
        }
    }, [fetcher.state]);

    useEffect(() => {
        if (fetcher.data && 'metafields' in fetcher.data && fetcher.data.metafields.length > 0) {
            shopify.toast.show(`Product ${productIdHolder} metafield updated successfully`);
        }
    }, [fetcher.data, productIdHolder]);

    useEffect(() => {
        if (fetcher.data && 'error' in fetcher.data) {
            if (fetcher.data) {
                setErrorStates((prevState) => ({ ...prevState, [productIdHolder]: 'Error updating metafield' }));
            }
        }
    }, [fetcher.data]);

    const handleInputChange = (value: string, productId: string) => {
        setAddToCartNameStates((prevState) => ({ ...prevState, [productId]: value }));
        setUserInteracted((prevState) => ({ ...prevState, [productId]: true }));
    };

    return (
        <Page title="Products">
            <div className="global-input-container">
                <TextField label="Set Add to Cart Name (Globally)" type="text" value={addToCartNameGlobally} autoComplete="off" onChange={(value) => setAddToCartNameGlobally(value)}/>
                <Button variant="primary">Submit</Button>
            </div>
            <Divider/>
            <Card>
                <DataTable
                    columnContentTypes={[
                        'text',
                        'text',
                        'text',
                        'text'
                    ]}
                    headings={[
                        '',
                        'Product ID',
                        'Product Name',
                        ''
                    ]}
                    rows={
                        products.edges.map(({ node }) => {
                            const productId = node.id.split('/').pop() || '';
                            const metafieldValue = node.metafields.edges.find(({ node }) => node.namespace === 'custom' && node.key === 'button_add_to_cart_text')?.node.value;

                            return [
                                <Thumbnail
                                    source={node.media.edges[0]?.node.image.url || ''}
                                    alt={node.media.edges[0]?.node.image.altText || ''}
                                />,
                                productId,
                                node.title,
                                <>
                                    <TextField
                                        label="Add to Cart Name"
                                        type="text"
                                        value={userInteracted[productId] ? addToCartNameStates[productId] : (addToCartNameStates[productId] || metafieldValue)}
                                        autoComplete="off"
                                        onChange={(value) => handleInputChange(value, productId)}
                                        loading={loadingStates[productId] || false}
                                        error={errorStates[productId] || ''}
                                    />
                                    <Button
                                        variant="primary"
                                        onClick={() => handleSubmitFromList(productId)}
                                    >
                                        Submit
                                    </Button>
                                </>,
                            ]
                        })
                    } 
                />
            </Card>
        </Page>
    );
}
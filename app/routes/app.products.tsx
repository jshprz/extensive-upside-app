import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { Page, useIndexResourceState } from "@shopify/polaris";
import { authenticate } from "app/shopify.server";
import { useEffect, useState } from "react";
import ProductTable1 from "app/components/products-page/product-tables/ProductTable1";
import AddProduct from "app/components/products-page/AddProduct";
import SearchProduct from "app/components/products-page/SearchProduct";
import IProducts from "app/interfaces/IProducts";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { admin } = await authenticate.admin(request);

    const query = `
        query {
            products(first: 100) {
                edges {
                    node {
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
    const formData = await request.formData();
    const selectedProductIds = formData.getAll('selectedProductIds');

    try {
        await prisma.stagedProducts.createMany({
            data: selectedProductIds.map((productId) => ({
                productId: productId as string,
            })),
        });
        return json({ success: true });
    } catch (error) {
        console.error("Error adding products: ", error);
        return json({ error: (error as any).message }, { status: 500 });
    }
};

// export const action = async ({ request }: ActionFunctionArgs) => {
//     const { admin } = await authenticate.admin(request);
//     const formData = await request.formData();
//     const productId = formData.get('productId') || '';
//     const addToCartName = formData.get('addToCartName') || '';

//     const mutation = `
//         #graphql
//         mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
//             metafieldsSet(metafields: $metafields) {
//               metafields {
//                 key
//                 namespace
//                 value
//                 createdAt
//                 updatedAt
//               }
//               userErrors {
//                 field
//                 message
//                 code
//               }
//             }
//         }
//     `;
//     const variables = {
//         metafields: [
//             {
//                 key: 'button_add_to_cart_text',
//                 namespace: 'custom',
//                 value: addToCartName,
//                 type: 'single_line_text_field',
//                 ownerId: `gid://shopify/Product/${productId}`,
//             }
//         ]
//     };

//     try {
//         const mutationResponse = await admin.graphql(mutation, { variables });
//         const mutationResponseJson = await mutationResponse.json();

//         if (mutationResponseJson.data.metafieldsSet.userErrors.length > 0) {
//             throw new Error(mutationResponseJson.data.metafieldsSet.userErrors[0].message);
//         }
        
//         return json({
//             metafields: mutationResponseJson.data.metafieldsSet.metafields,
//         });
//     } catch (error) {
//         console.error("Error adding product to cart: ", error);
//         return json({ error: (error as any).message }, { status: 500 });
//     }
// };

export default function ProductsPage() {
    const shopify = useAppBridge();
    const { products } = useLoaderData<IProducts>();
    const fetcher = useFetcher<typeof action>();

    const [addToCartNameStates, setAddToCartNameStates] = useState<{ [key: string]: string }>({});
    const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
    const [productIdHolder, setProductIdHolder] = useState<string>('');
    const [errorStates, setErrorStates] = useState<{ [key: string]: string }>({});
    const [userInteracted, setUserInteracted] = useState<{ [key: string]: boolean }>({});
    const [addProductsClickLoading, setAddProductsClickLoading] = useState(false);
    
    const handleSubmitFromList = async (productId: string) => {
        setProductIdHolder(productId);
        fetcher.submit({ productId, addToCartName: addToCartNameStates[productId] || '' }, { method: 'post' });
    }
    const handleAddProducts = (selectedProductIds: string[]) => {
        const formData = new FormData();
        selectedProductIds.forEach(id => formData.append('selectedProductIds', id));
        fetcher.submit(formData, { method: 'POST' });
    }

    useEffect(() => {
        if (fetcher.state === 'submitting' || fetcher.state === 'loading') {
            setAddProductsClickLoading(true);
        } else {
            setAddProductsClickLoading(false);
        }
    }, [fetcher.state]);

    // useEffect(() => {
    //     if (fetcher.state === 'submitting' || fetcher.state === 'loading') {
    //         setLoadingStates((prevState) => ({ ...prevState, [productIdHolder]: true }));
    //     } else {
    //         setLoadingStates((prevState) => ({ ...prevState, [productIdHolder]: false }));
    //     }
    // }, [fetcher.state]);

    // useEffect(() => {
    //     if (fetcher.data && 'metafields' in fetcher.data && fetcher.data.metafields.length > 0) {
    //         shopify.toast.show(`Product ${productIdHolder} metafield updated successfully`);
    //     }
    // }, [fetcher.data, productIdHolder]);

    useEffect(() => {
        if (fetcher.data && 'success' in fetcher.data && fetcher.data.success) {
            shopify.toast.show('Selected product/s added successfully!', {
                isError: false
            });
        }
    }, [fetcher.data]);

    useEffect(() => {
        if (fetcher.data && 'error' in fetcher.data && fetcher.data.error) {
            shopify.toast.show(`Error: ${fetcher.data.error}`, {
                isError: true
            })
        }
    }, [fetcher.data]);

    const handleInputChange = (value: string, productId: string) => {
        setAddToCartNameStates((prevState) => ({ ...prevState, [productId]: value }));
        setUserInteracted((prevState) => ({ ...prevState, [productId]: true }));
        setErrorStates((prevState) => ({ ...prevState, [productId]: '' }));
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const toggleModal = () => setIsModalOpen((prev) => !prev);

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(products.edges.map(({ node }) => ({ id: node.id })));
    
    return (
        <Page>
            <TitleBar title="Products">
                <button variant="primary" onClick={toggleModal}>
                    Add Product
                </button>
            </TitleBar>
            <SearchProduct selectedResourcesLength={selectedResources.length} />
            <ProductTable1 
                products={products}
                selectedResources={selectedResources}
                allResourcesSelected={allResourcesSelected}
                handleSelectionChange={handleSelectionChange}
            />
            <AddProduct 
                isOpen={isModalOpen}
                toggleModal={toggleModal}
                products={products}
                onAddProducts={handleAddProducts}
                loading={addProductsClickLoading}
            />
        </Page>
    );
}
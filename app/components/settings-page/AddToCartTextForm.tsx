import {
    Button,
    Card,
    Form,
    FormLayout,
    Select,
    TextField,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useCallback, useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "@remix-run/react";
import IProductsByProductIds from "app/interfaces/IProductsByProductIds";

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

export default function AddToCartTextForm() {
    const shopify = useAppBridge();
    const fetcher = useFetcher<MetafieldsSetResponse>();
    const { productsByProductIds } = useLoaderData<IUseLoaderData>();

    const [addToCartName, setAddToCartName] = useState<string>('');
    const [error, setError] = useState<string | undefined>(undefined);
    const [selectedLanguage, setSelectedLanguage] = useState('English');

    const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set('add-to-cart-name', addToCartName);
        productsByProductIds.nodes.forEach((product) => formData.append('productIds', product.id));
        fetcher.submit(
            formData,
            { method: 'POST', action: '/api/add-to-cart-text' }
        );
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
    
    return (
        <>
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
        </>
    );
}
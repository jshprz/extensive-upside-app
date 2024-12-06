import {
    Card,
    Button,
    TextField,
    Form,
    FormLayout,
} from '@shopify/polaris';
import { useState, useCallback, useEffect } from 'react';
import IProductsByProductIds from "app/interfaces/IProductsByProductIds";
import { useFetcher, useLoaderData } from '@remix-run/react';
import { useAppBridge } from '@shopify/app-bridge-react';

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

export default function StockNotificationForm() {
    const shopify = useAppBridge();
    const fetcher = useFetcher<MetafieldsSetResponse>();
    const { productsByProductIds } = useLoaderData<IUseLoaderData>();
    
    const [stockNotificationText, setStockNotificationText] = useState<string>('');
    const [error, setError] = useState<string | undefined>(undefined);
    
    const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set('stock-notification-text', stockNotificationText);
        productsByProductIds.nodes.forEach((product) => formData.append('productIds', product.id));
        fetcher.submit(
            formData,
            { method: 'POST', action: '/api/submit-stock-notification-form' }
        );
    }, [fetcher, stockNotificationText]);

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
            shopify.toast.show(`${fetcher.data.metafieldsSet.metafields.length} product/s stock notification updated successfully!`);
        }
        if (fetcher.data && fetcher.data.metafieldsSet.userErrors.length > 0) {
            console.error('Metafield creation error:', fetcher.data.metafieldsSet.userErrors[0].message);
            shopify.toast.show(fetcher.data.metafieldsSet.userErrors[0].message, { isError: true });
        }
    }, [fetcher.data]);

    return (
        <Card>
            <Form onSubmit={handleSubmit}>
                <FormLayout>
                    <TextField
                        label="Stock Notification Text"
                        value={stockNotificationText}
                        onChange={(value) => setStockNotificationText(value)}
                        error={error}
                        autoComplete="off"
                    />
                    <Button variant="primary" submit loading={fetcher.state === 'submitting' || fetcher.state === 'loading'} fullWidth>
                        Save
                    </Button>
                </FormLayout>
            </Form>
        </Card>
    );
  }
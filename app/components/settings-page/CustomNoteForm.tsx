import { useFetcher, useLoaderData } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
    Button,
    Card,
    Form,
    FormLayout,
    TextField,
} from "@shopify/polaris";
import IProductsByProductIds from "app/interfaces/IProductsByProductIds";
import { useState, useCallback, useEffect } from "react";

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

export default function CustomNoteForm() {
    const shopify = useAppBridge();
    const fetcher = useFetcher<MetafieldsSetResponse>();
    const { productsByProductIds } = useLoaderData<IUseLoaderData>();
    
    const [customNote, setCustomNote] = useState<string>('');
    const [selectedTabIndex, setSelectedTabIndex] = useState(0);
    const [error, setError] = useState<string | undefined>(undefined);
    const handleChange = useCallback(
      (newValue: string) => setCustomNote(newValue),
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

    const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set('custom-note', customNote);
        productsByProductIds.nodes.forEach((product) => formData.append('productIds', product.id));
        fetcher.submit(
            formData,
            { method: 'POST', action: '/api/submit-custom-note-form' }
        );
    }, [fetcher, customNote]);

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
            shopify.toast.show(`${fetcher.data.metafieldsSet.metafields.length} product/s custom note updated successfully!`);
        }
        if (fetcher.data && fetcher.data.metafieldsSet.userErrors.length > 0) {
            console.error('Metafield creation error:', fetcher.data.metafieldsSet.userErrors[0].message);
            shopify.toast.show(fetcher.data.metafieldsSet.userErrors[0].message, { isError: true });
        }
    }, [fetcher.data]);

    return (
        <>
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
                                value={customNote}
                                onChange={handleChange}
                                error={error}
                                multiline={4}
                                autoComplete="off"
                            />
                        </div>
                        <Button variant="primary" submit loading={fetcher.state === 'submitting' || fetcher.state === 'loading'} fullWidth>
                            Save
                        </Button>
                    </FormLayout>
                </Form>
            </Card>
        </>
    );
}
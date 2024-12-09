import { useFetcher } from "@remix-run/react";
import { Button, Card, Form, FormLayout, Frame, LegacyStack, Modal, TextField } from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";

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

interface SearchProductProps {
    selectedProductIds: string[];
    searchValue: string;
    onSearchChange: (value: string) => void;
}

export default function SearchProduct({ selectedProductIds, searchValue, onSearchChange }: SearchProductProps) {
    const fetcher = useFetcher<MetafieldsSetResponse>();
    
    const [active, setActive] = useState(false);
    const [deleteButtonDisabled, setDeleteButtonDisabled] = useState(true);
    const [enableStockNotificationButtonIsDisabled, setEnableStockNotificationButtonIsDisabled] = useState(false);

    const handleSearchChange = useCallback((newValue: string) => {
        onSearchChange(newValue);
      }, [onSearchChange]);
    const toggleModal = () => setActive((active) => !active);
    const handleEnableStockNotification = useCallback(() => {
        const formData = new FormData();

        if (selectedProductIds.length > 0) {
            selectedProductIds.forEach((productId) => formData.append('productIds', productId));
        }
        formData.set('is-stock-notification-enabled', 'true');
        fetcher.submit(
            formData,
            { method: 'POST', action: '/api/set-product-stock-notification-status' }
        );
    }, [fetcher, selectedProductIds]);

    useEffect(() => {
        if (selectedProductIds.length > 0) {
            setDeleteButtonDisabled(false);
            setEnableStockNotificationButtonIsDisabled(false);
        } else {
            setDeleteButtonDisabled(true);
            setEnableStockNotificationButtonIsDisabled(true);
        }
    }, [selectedProductIds]);

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

    return (
        <>
            <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <LegacyStack spacing="tight" alignment="center">
                            <TextField
                                label="Search"
                                labelHidden
                                value={searchValue}
                                onChange={handleSearchChange}
                                placeholder="Search"
                                autoComplete="off"
                            />
                        </LegacyStack>
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                    }}>
                        <Button
                            variant="secondary"
                            loading={fetcher.state === 'submitting' || fetcher.state === 'loading'} 
                            disabled={enableStockNotificationButtonIsDisabled}
                            onClick={handleEnableStockNotification}
                            submit
                        >
                            Enable Stock Notification
                        </Button>
                        <Button variant="primary" disabled={deleteButtonDisabled} onClick={toggleModal}>
                            Delete
                        </Button>
                    </div>
                </div>
            </Card>
            <div style={{
                position: 'fixed',
            }}>
                <Frame>
                    <Modal
                        open={active}
                        onClose={toggleModal}
                        title="Discard all unsaved changes"
                        primaryAction={{
                          destructive: true,
                          content: 'Discard changes',
                          onAction: toggleModal,
                        }}
                        secondaryActions={[
                          {
                            content: 'Continue editing',
                            onAction: toggleModal,
                          },
                        ]}
                    >
                        <Modal.Section>
                            If you discard changes, you’ll delete any edits you made since you
                            last saved.
                        </Modal.Section>
                    </Modal>
                </Frame>
            </div>
        </>
    );
}
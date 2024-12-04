import { Button, Card, Frame, LegacyStack, Modal, TextField } from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";

interface SearchProductProps {
    selectedResourcesLength: number;
    searchValue: string;
    onSearchChange: (value: string) => void;
}

export default function SearchProduct({ selectedResourcesLength, searchValue, onSearchChange }: SearchProductProps) {
    const [active, setActive] = useState(false);
    const [deleteButtonDisabled, setDeleteButtonDisabled] = useState(true);

    const handleSearchChange = useCallback((newValue: string) => {
        onSearchChange(newValue);
      }, [onSearchChange]);
    const toggleModal = () => setActive((active) => !active);

    useEffect(() => {
        if (selectedResourcesLength > 0) {
            setDeleteButtonDisabled(false);
        } else {
            setDeleteButtonDisabled(true);
        }
    }, [selectedResourcesLength]);

    return (
        <>
            <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                    <Button variant="primary" disabled={deleteButtonDisabled} onClick={toggleModal}>
                        Delete
                    </Button>
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
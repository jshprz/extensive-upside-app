import {
    Button,
    Modal,
    LegacyStack,
    DropZone,
    Checkbox,
    Frame,
} from '@shopify/polaris';
import {useState, useCallback} from 'react';
  
interface AddProductProps {
  isOpen: boolean;
  toggleModal: () => void;
}

export default function AddProduct({ isOpen, toggleModal }: AddProductProps) {
    const [checked, setChecked] = useState(false);
    const handleCheckbox = useCallback((value: boolean) => setChecked(value), []);

    return (
      <div style={{
        position: 'fixed',
      }}>
        <Frame>
            <Modal
                size="large"
                open={isOpen}
                onClose={toggleModal}
                title="Import customers by CSV"
                primaryAction={{
                  content: 'Import customers',
                  onAction: toggleModal,
                }}
                secondaryActions={[
                  {
                    content: 'Cancel',
                    onAction: toggleModal,
                  },
                ]}
            >
                <Modal.Section>
                    <LegacyStack vertical>
                        <DropZone
                            accept=".csv"
                            errorOverlayText="File type must be .csv"
                            type="file"
                            onDrop={() => {}}
                        >
                            <DropZone.FileUpload />
                        </DropZone>
                        <Checkbox
                            checked={checked}
                            label="Overwrite existing customers that have the same email or phone"
                            onChange={handleCheckbox}
                        />
                    </LegacyStack>
                </Modal.Section>
            </Modal>
        </Frame>
      </div>
    );
  }
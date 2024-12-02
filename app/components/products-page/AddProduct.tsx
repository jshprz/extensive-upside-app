import {
    Modal,
    LegacyStack,
    Frame,
    useIndexResourceState,
    TextField,
    Text,
} from '@shopify/polaris';
import {useState, useCallback} from 'react';
import ProductTable2 from './product-tables/ProductTable2';

interface AddProductProps {
  isOpen: boolean;
  toggleModal: () => void;
  products: {
    edges: {
        node: {
            id: string;
            title: string;
            totalInventory: number;
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
}

export default function AddProduct({ isOpen, toggleModal, products }: AddProductProps) {
    const [checked, setChecked] = useState(false);
    const handleCheckbox = useCallback((value: boolean) => setChecked(value), []);
    const [searchValue, setSearchValue] = useState('');

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(products.edges.map(({ node }) => ({ id: node.id })));
    const handleSearchChange = useCallback((newValue: string) => {
      setSearchValue(newValue);
    }, []);
    const handleSearch = useCallback(() => {
      console.log('Searching for:', searchValue);
      // Add your search logic here
    }, [searchValue]);

    return (
      <div style={{
        position: 'fixed',
      }}>
        <Frame>
            <Modal
                size="large"
                open={isOpen}
                onClose={toggleModal}
                title="Add products"
                primaryAction={{
                  content: 'Add products',
                  onAction: toggleModal,
                }}
                secondaryActions={[
                  {
                    content: 'Cancel',
                    onAction: toggleModal,
                  },
                ]}
                footer={
                  <Text variant="bodyMd" as="span">
                    {selectedResources.length} {(selectedResources.length > 1)? 'products' : 'product'} selected
                  </Text>
                }
            >
                <Modal.Section>
                    <LegacyStack vertical>
                      <TextField
                        label="Search"
                        labelHidden
                        value={searchValue}
                        onChange={handleSearchChange}
                        placeholder="Search"
                        autoComplete="off"
                      />
                      <ProductTable2 
                        products={products}
                        selectedResources={selectedResources}
                        allResourcesSelected={allResourcesSelected}
                        handleSelectionChange={handleSelectionChange}
                      />
                    </LegacyStack>
                </Modal.Section>
            </Modal>
        </Frame>
      </div>
    );
  }
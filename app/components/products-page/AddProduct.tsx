import {
  Modal,
  LegacyStack,
  Frame,
  useIndexResourceState,
  TextField,
  Text,
} from '@shopify/polaris';
import { useState, useCallback, useMemo, useEffect } from 'react';
import ProductTable2 from './product-tables/ProductTable2';
import IProducts from 'app/interfaces/IProducts';

interface AddProductProps extends IProducts {
  isOpen: boolean;
  toggleModal: () => void;
  onAddProducts: (selectedProductsIds: string[]) => void;
  loading: boolean;
}

export default function AddProduct({ products, isOpen, toggleModal, onAddProducts, loading }: AddProductProps) {
  const [searchValue, setSearchValue] = useState('');
  const [onAddProductsDisabled, setOnAddProductsDisabled] = useState(false);
  const { selectedResources, allResourcesSelected, handleSelectionChange, clearSelection } =
    useIndexResourceState(products.edges.map(({ node }) => ({ id: node.id })));

  const handleSearchChange = useCallback((newValue: string) => {
    setSearchValue(newValue);
    clearSelection();
  }, [clearSelection]);

  const filteredProducts = useMemo(() => {
    if (!searchValue) return products;
    return {
      edges: products.edges.filter(({ node }) =>
        node.title.toLowerCase().includes(searchValue.toLowerCase())
      ),
    };
  }, [products, searchValue]);

  useEffect(() => {
    if (selectedResources.length > 0) {
      setOnAddProductsDisabled(false);
    } else {
      setOnAddProductsDisabled(true);
    }
  }, [selectedResources]);

  return (
    <div style={{ position: 'fixed' }}>
      <Frame>
        <Modal
          size="large"
          open={isOpen}
          onClose={toggleModal}
          title="Add products"
          primaryAction={{
            content: 'Add products',
            onAction: () => {
              onAddProducts(selectedResources);
              clearSelection();
            },
            loading,
            disabled: onAddProductsDisabled
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: toggleModal,
            },
          ]}
          footer={
            <Text variant="bodyMd" as="span">
              {selectedResources.length} {selectedResources.length > 1 ? 'products' : 'product'} selected
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
                products={filteredProducts}
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
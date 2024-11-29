import {
    IndexTable,
    LegacyCard,
    useIndexResourceState,
    Text,
    Badge,
    Thumbnail,
    Button,
} from '@shopify/polaris';

interface ProductTableProps {
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
}

export default function ProductTable({ products }:  ProductTableProps) {
    const resourceName = {
        singular: 'product',
        plural: 'products',
    };
  
    const {selectedResources, allResourcesSelected, handleSelectionChange} =
    useIndexResourceState(products.edges.map(({ node }) => ({ id: node.id })));
    
    const rowMarkup = products.edges.map(({ node }, index) => {
        const productId = node.id.split('/').pop() || '';

        return (
            <IndexTable.Row
                id={node.id}
                key={node.id}
                selected={selectedResources.includes(node.id)}
                position={index}
            >
                <IndexTable.Cell>
                  <Thumbnail
                    source={node.media.edges[0]?.node.image.url || ''}
                    alt={node.media.edges[0]?.node.image.altText || ''}
                  />,
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                        {productId}
                    </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{node.title}</IndexTable.Cell>
                <IndexTable.Cell>
                    <Button
                        variant="secondary"
                        onClick={() => {}}
                    >
                        Delete
                    </Button>
                </IndexTable.Cell>
            </IndexTable.Row>
        )
    });
  
    return (
      <LegacyCard>
        <IndexTable
          resourceName={resourceName}
          itemCount={products.edges.length}
          selectedItemsCount={
            allResourcesSelected ? 'All' : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          headings={[
            {title: ''},
            {title: 'Product ID'},
            {title: 'Product Name'},
            {title: ''},
          ]}
        >
          {rowMarkup}
        </IndexTable>
      </LegacyCard>
    );
  }
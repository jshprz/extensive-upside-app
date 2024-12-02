import {
    IndexTable,
    LegacyCard,
    Text,
    Thumbnail,
    Button,
} from '@shopify/polaris';

interface ProductTableProps {
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
    selectedResources: string[];
    allResourcesSelected: boolean;
    handleSelectionChange: any;
}

export default function ProductTable1({ 
    products,
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
}:  ProductTableProps) {
    const resourceName = {
        singular: 'product',
        plural: 'products',
    };

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
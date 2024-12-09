import {
    IndexTable,
    LegacyCard,
    Text,
    Thumbnail,
    Badge,
} from '@shopify/polaris';
import IProductsByProductIds from 'app/interfaces/IProductsByProductIds';

interface ProductTableProps extends IProductsByProductIds {
    selectedResources: string[];
    allResourcesSelected: boolean;
    handleSelectionChange: any;
}

export default function ProductTable1({ 
    productsByProductIds,
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
}:  ProductTableProps) {
    const resourceName = {
        singular: 'product',
        plural: 'products',
    };

    const rowMarkup = productsByProductIds.nodes.map((node, index) => {
        const productId = node.id.split('/').pop() || '';
        const productStockNotificationIsEnabled = node.metafields.edges.filter((edge) => {
            return edge.node.key === 'is_stock_notification_enabled' && edge.node.namespace === 'custom';
        });
        const isProductStockNotificationIsEnabled = (
            productStockNotificationIsEnabled.length > 0 &&
            productStockNotificationIsEnabled[0].node.value == 'true'
        );
        
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
                    <Badge tone={isProductStockNotificationIsEnabled ? 'success' : undefined}>
                        {isProductStockNotificationIsEnabled ? 'True' : 'False'}
                    </Badge>
                </IndexTable.Cell>
            </IndexTable.Row>
        )
    });
  
    return (
      <LegacyCard>
        <IndexTable
          resourceName={resourceName}
          itemCount={productsByProductIds.nodes.length}
          selectedItemsCount={
            allResourcesSelected ? 'All' : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          headings={[
            {title: ''},
            {title: 'Product ID'},
            {title: 'Product Name'},
            {title: 'Is Stock Notification Enabled?'},
          ]}
        >
          {rowMarkup}
        </IndexTable>
      </LegacyCard>
    );
  }
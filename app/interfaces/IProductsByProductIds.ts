export default interface IProductsByProductIds {
    productsByProductIds: {
        nodes: {
            id: string;
            title: string;
            totalInventory: number;
            media: {
                edges: {
                    node: {
                        image: {
                            url: string
                            altText: string
                        }
                        
                    }
                }[];
            };
            metafields: {
                edges: {
                    node: {
                        namespace: string;
                        key: string;
                        value: string;
                    }
                }[];
            }
        }[];
    }
}
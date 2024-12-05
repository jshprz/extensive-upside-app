import {
    Button,
    Card,
    Form,
    FormLayout,
    TextField,
} from "@shopify/polaris";
import { useState, useCallback } from "react";

export default function CustomNoteForm() {
    const [value, setValue] = useState('');
    const [selectedTabIndex, setSelectedTabIndex] = useState(0);
    const handleChange = useCallback(
      (newValue: string) => setValue(newValue),
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
    
    return (
        <>
            <Card>
                  <Form onSubmit={() => {}}>
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
                                value={value}
                                onChange={handleChange}
                                multiline={4}
                                autoComplete="off"
                              />
                          </div>
                          <Button variant="primary" submit fullWidth>
                            Save
                          </Button>
                      </FormLayout>
                  </Form>
              </Card>
        </>
    );
}
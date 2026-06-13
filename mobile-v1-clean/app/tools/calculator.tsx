import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { fetchWithAuth } from '../../src/config/api';
import { validateDocumentData } from '../../src/config/documentTemplates';
import { useSteward } from '../../src/context/StewardContext';
import { PageHeader } from '../../src/components/PageHeader';

interface LineItem {
    id: string;
    name: string;
    description: string;
    quantity: string;
    unit: string;
    unit_price: string;
    category: 'labour' | 'materials' | 'travel' | 'other';
}

interface DefaultLineItem {
    name: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    category: 'labour' | 'materials' | 'travel' | 'other';
}

const ARCHETYPE_DEFAULTS: Record<string, DefaultLineItem[]> = {
    tech_digital_services: [
        { name: "Development & Setup", description: "Design, coding, and setup of digital services", quantity: 1, unit: "flat", unit_price: 1500, category: 'labour' },
        { name: "Software License & Tools", description: "Necessary software/hosting fees", quantity: 1, unit: "flat", unit_price: 250, category: 'materials' },
        { name: "Consultation & Discovery", description: "Initial meetings and requirements gathering", quantity: 2, unit: "hrs", unit_price: 350, category: 'labour' }
    ],
    construction_and_trades: [
        { name: "Labour & Site Work", description: "On-site construction and installation labor", quantity: 1, unit: "day", unit_price: 1200, category: 'labour' },
        { name: "Building Materials", description: "Required raw materials for the job", quantity: 1, unit: "lot", unit_price: 2000, category: 'materials' },
        { name: "Transport & Delivery", description: "Travel to site and material transport", quantity: 1, unit: "trip", unit_price: 450, category: 'travel' }
    ],
    beauty_and_hair: [
        { name: "Styling & Service Fee", description: "Hair styling/beauty treatment service fee", quantity: 1, unit: "service", unit_price: 450, category: 'labour' },
        { name: "Hair & Styling Products", description: "Products and extensions used", quantity: 1, unit: "lot", unit_price: 300, category: 'materials' },
        { name: "Call-out & Travel Fee", description: "Travel to customer location", quantity: 1, unit: "trip", unit_price: 150, category: 'travel' }
    ],
    food_and_catering: [
        { name: "Prep & Service Fee", description: "Food preparation and serving labor", quantity: 1, unit: "flat", unit_price: 1000, category: 'labour' },
        { name: "Ingredients & Food Items", description: "Fresh ingredients and supplies", quantity: 20, unit: "head", unit_price: 75, category: 'materials' },
        { name: "Delivery & Setup", description: "Transport and catering setup on site", quantity: 1, unit: "trip", unit_price: 350, category: 'travel' }
    ],
    home_services: [
        { name: "Repair & Labour Fee", description: "Plumbing, electrical, or repair work labor", quantity: 1, unit: "hr", unit_price: 450, category: 'labour' },
        { name: "Parts & Materials", description: "Required spare parts and replacement items", quantity: 1, unit: "lot", unit_price: 500, category: 'materials' },
        { name: "Call-out Fee", description: "Travel and initial diagnostics call-out", quantity: 1, unit: "trip", unit_price: 350, category: 'travel' }
    ],
    transport_and_delivery: [
        { name: "Driver Time & Labour", description: "Professional driving and transport time", quantity: 1, unit: "flat", unit_price: 800, category: 'labour' },
        { name: "Vehicle Use & Fuel", description: "Vehicle usage and fuel expenses", quantity: 1, unit: "lot", unit_price: 1200, category: 'materials' },
        { name: "Tolls & Route Fees", description: "Toll gates and road permits", quantity: 1, unit: "flat", unit_price: 150, category: 'travel' }
    ],
    default: [
        { name: "Labour / Service Fee", description: "Service delivery labor", quantity: 1, unit: "flat", unit_price: 1000, category: 'labour' },
        { name: "Materials / Parts", description: "Associated materials and components", quantity: 1, unit: "lot", unit_price: 500, category: 'materials' },
        { name: "Travel / Call-out", description: "Transport and travel expenses", quantity: 1, unit: "trip", unit_price: 250, category: 'travel' }
    ]
};

const getArchetypeKey = (profile: any): string => {
    const providerType = profile?.provider_type || '';
    const categoryKey = profile?.business_category_key || '';
    const combined = `${providerType} ${categoryKey}`.toLowerCase();
    
    if (combined.includes('tech') || combined.includes('digital') || combined.includes('systems') || combined.includes('creative')) {
        return 'tech_digital_services';
    }
    if (combined.includes('construction') || combined.includes('build') || combined.includes('trade')) {
        return 'construction_and_trades';
    }
    if (combined.includes('beauty') || combined.includes('hair') || combined.includes('wellness') || combined.includes('styling')) {
        return 'beauty_and_hair';
    }
    if (combined.includes('food') || combined.includes('cater')) {
        return 'food_and_catering';
    }
    if (combined.includes('plumb') || combined.includes('electr') || combined.includes('repair') || combined.includes('home') || combined.includes('clean') || combined.includes('mechanic')) {
        return 'home_services';
    }
    if (combined.includes('transport') || combined.includes('deliver') || combined.includes('logistics') || combined.includes('route')) {
        return 'transport_and_delivery';
    }
    
    return 'default';
};

export default function CalculatorScreen() {
    const { leadId, name: initialName, phone: initialPhone, service: initialService } = useLocalSearchParams<{ leadId?: string, name?: string, phone?: string, service?: string }>();
    const router = useRouter();
    const { profile } = useSteward();

    const [name, setName] = useState(initialName || '');
    const [phone, setPhone] = useState(initialPhone || '');
    const [service, setService] = useState(initialService || '');

    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [addVat, setAddVat] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Planning state variables (Quote Workspace Foundation)
    const [expectedLabourHours, setExpectedLabourHours] = useState('');
    const [expectedTravelKm, setExpectedTravelKm] = useState('');
    const [expectedMaterialCost, setExpectedMaterialCost] = useState('');
    const [expectedNotes, setExpectedNotes] = useState('');

    useEffect(() => {
        if (profile && !isInitialized) {
            const archKey = getArchetypeKey(profile);
            const defaults = ARCHETYPE_DEFAULTS[archKey] || ARCHETYPE_DEFAULTS['default'];
            
            const initialItems = defaults.map((item, idx) => ({
                ...item,
                id: `${Date.now()}-${idx}-${Math.random()}`,
                quantity: item.quantity.toString(),
                unit_price: item.unit_price.toString()
            }));
            
            setLineItems(initialItems);
            setIsInitialized(true);
        }
    }, [profile, isInitialized]);

    const getLineTotal = (item: LineItem) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unit_price) || 0;
        return qty * price;
    };

    const subtotal = lineItems.reduce((sum, item) => sum + getLineTotal(item), 0);
    const vat = addVat ? subtotal * 0.15 : 0;
    const total = subtotal + vat;

    const handleAddLineItem = () => {
        const newItem: LineItem = {
            id: `${Date.now()}-${Math.random()}`,
            name: '',
            description: '',
            quantity: '1',
            unit: 'pcs',
            unit_price: '0.00',
            category: 'labour'
        };
        setLineItems([...lineItems, newItem]);
    };

    const handleUpdateLineItem = (id: string, updates: Partial<LineItem>) => {
        setLineItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, ...updates };
            }
            return item;
        }));
    };

    const handleDeleteLineItem = (id: string) => {
        setLineItems(prev => prev.filter(item => item.id !== id));
    };

    const buildQuotePayload = () => {
        let rolledLabour = 0;
        let rolledMaterials = 0;
        let rolledTravel = 0;
        let rolledOther = 0;

        const cleanedLineItems = lineItems.map(item => {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.unit_price) || 0;
            const line_total = qty * price;

            if (item.category === 'labour') rolledLabour += line_total;
            else if (item.category === 'materials') rolledMaterials += line_total;
            else if (item.category === 'travel') rolledTravel += line_total;
            else if (item.category === 'other') rolledOther += line_total;

            return {
                name: item.name || 'Unnamed Item',
                description: item.description || '',
                quantity: qty,
                unit: item.unit || 'pcs',
                unit_price: price,
                category: item.category,
                line_total
            };
        });

        const computedSubtotal = rolledLabour + rolledMaterials + rolledTravel + rolledOther;
        const computedVat = addVat ? computedSubtotal * 0.15 : 0;
        const computedTotal = computedSubtotal + computedVat;

        const planningLabour = parseFloat(expectedLabourHours);
        const planningTravel = parseFloat(expectedTravelKm);
        const planningMaterials = parseFloat(expectedMaterialCost);

        const planningPayload = {
            expected_labour_hours: isNaN(planningLabour) ? null : planningLabour,
            expected_travel_km: isNaN(planningTravel) ? null : planningTravel,
            expected_material_cost: isNaN(planningMaterials) ? null : planningMaterials,
            expected_notes: expectedNotes || null
        };

        return {
            lead_id: leadId || null,
            business_owner_id: profile?.id,
            customer_name: name || 'Unknown',
            customer_phone: phone || 'Unknown',
            service_description: service || '',
            labour: rolledLabour,
            materials: rolledMaterials,
            travel: rolledTravel,
            other: rolledOther,
            line_items: cleanedLineItems,
            subtotal: computedSubtotal,
            vat: computedVat,
            total: computedTotal,
            archetype_key: getArchetypeKey(profile),
            business_line: profile?.business_line || 'General',
            quote_template_version: 'QUOTE_V2',
            structured_terms: {
                planning: planningPayload
            },
            status: 'draft'
        };
    };

    const handleSaveQuote = async () => {
        if (!profile?.id) {
            Alert.alert("Error", "Steward profile not ready. Please reload and try again.");
            return null;
        }

        if (total <= 0) {
            Alert.alert("Quote not ready", "The total amount must be greater than zero.");
            return null;
        }

        if (lineItems.length === 0) {
            Alert.alert("Quote not ready", "Please add at least one line item.");
            return null;
        }

        const payload = buildQuotePayload();

        const missingFields = validateDocumentData("QUOTE_V2", payload);
        if (missingFields.length > 0) {
            Alert.alert("Missing quote details", `Missing required fields: ${missingFields.join(', ')}`);
            return null;
        }

        setIsSubmitting(true);
        try {
            const response = await fetchWithAuth(`/quotes`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (leadId) {
                await fetchWithAuth(`/leads/${leadId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status: 'quoted' })
                });
            }

            return response;
        } catch (error) {
            console.error("Failed to save quote:", error);
            Alert.alert("Error", "Could not save this quote. Please try again.");
            return null;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveAndExit = async () => {
        const saved = await handleSaveQuote();
        if (saved) {
            const successMsg = leadId 
                ? "Quote saved and linked to this lead." 
                : `Quote successfully saved for ${name || 'the customer'}.`;

            Alert.alert("Quote Saved", successMsg, [
                { text: "Back to Leads", onPress: () => router.back() }
            ]);
        }
    };

    const generatePDF = async () => {
        const savedQuote = await handleSaveQuote();
        if (!savedQuote) return;

        const payload = buildQuotePayload();
        const quoteIdFormatted = savedQuote.id ? `IPH-${savedQuote.id.split('-')[0].toUpperCase()}` : 'IPH-DRAFT';
        const businessName = profile?.businessName || profile?.name || 'iPhande Steward';

        const tableRows = payload.line_items.map(item => `
            <tr>
                <td>
                    <div style="font-weight: 600; font-size: 14px;">${item.name}</div>
                    ${item.description ? `<div style="font-size: 11px; color: #6B7280; margin-top: 2px;">${item.description}</div>` : ''}
                </td>
                <td style="text-transform: capitalize; font-size: 13px; color: #4B5563;">${item.category}</td>
                <td style="text-align: right; font-size: 13px;">${item.quantity}</td>
                <td style="font-size: 13px; color: #6B7280;">${item.unit}</td>
                <td style="text-align: right; font-size: 13px;">R ${item.unit_price.toFixed(2)}</td>
                <td style="text-align: right; font-weight: 600; font-size: 13px;">R ${item.line_total.toFixed(2)}</td>
            </tr>
        `).join('');

        const planning = payload.structured_terms?.planning || {};
        const hasPlanning = 
            planning.expected_labour_hours !== null || 
            planning.expected_travel_km !== null || 
            planning.expected_material_cost !== null || 
            planning.expected_notes !== null;

        let planningSectionHtml = '';
        if (hasPlanning) {
            planningSectionHtml = `
                <div style="margin-top: 40px; padding: 20px; background-color: #F9FAFB; border-radius: 12px; border: 1px solid #E5E7EB;">
                    <div style="font-weight: 800; font-size: 16px; margin-bottom: 12px; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">Planning & Scope Summary</div>
                    <ul style="padding-left: 20px; margin: 0; color: #4B5563; font-size: 14px; line-height: 20px;">
                        ${planning.expected_labour_hours !== null ? `<li><strong>Expected Labour:</strong> ${planning.expected_labour_hours} hours</li>` : ''}
                        ${planning.expected_travel_km !== null ? `<li><strong>Expected Travel:</strong> ${planning.expected_travel_km} km</li>` : ''}
                        ${planning.expected_material_cost !== null ? `<li><strong>Expected Material Cost:</strong> R ${Number(planning.expected_material_cost).toFixed(2)}</li>` : ''}
                    </ul>
                    ${planning.expected_notes ? `
                        <div style="margin-top: 12px; font-size: 13px; color: #6B7280; font-style: italic; border-top: 1px solid #E5E7EB; padding-top: 8px;">
                            <strong>Planning Notes:</strong><br/>
                            ${planning.expected_notes}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        const html = `
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #111827; }
                        .header { text-align: center; margin-bottom: 40px; }
                        .kicker { font-size: 14px; color: #6B7280; letter-spacing: 1px; text-transform: uppercase; font-weight: bold; }
                        .title { font-size: 32px; font-weight: 800; margin: 8px 0; }
                        .info-row { margin-bottom: 8px; font-size: 16px; }
                        .table { width: 100%; border-collapse: collapse; margin-top: 30px; }
                        .table th, .table td { padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: left; }
                        .table th { background-color: #F9FAFB; color: #4B5563; font-weight: 700; font-size: 12px; text-transform: uppercase; }
                        .summary-row td { padding: 8px 12px; border: none; }
                        .total-row td { font-weight: 800; font-size: 18px; border-top: 2px solid #111827; padding-top: 12px; }
                        .footer { margin-top: 60px; text-align: center; color: #9CA3AF; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="kicker">${businessName}</div>
                        <div class="title">${quoteIdFormatted}</div>
                        <div style="color: #6B7280;">Date: ${new Date().toLocaleDateString()}</div>
                    </div>
                    <div class="info-row"><strong>Customer:</strong> ${payload.customer_name}</div>
                    <div class="info-row"><strong>Phone:</strong> ${payload.customer_phone}</div>
                    <div class="info-row"><strong>Service:</strong> ${payload.service_description}</div>
                    
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Category</th>
                                <th style="text-align: right;">Qty</th>
                                <th>Unit</th>
                                <th style="text-align: right;">Price</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                            <tr><td colspan="6" style="border-bottom: none; height: 20px;"></td></tr>
                            <tr class="summary-row">
                                <td colspan="4"></td>
                                <td style="font-weight: 600;">Subtotal</td>
                                <td style="text-align: right; font-weight: 600;">R ${payload.subtotal.toFixed(2)}</td>
                            </tr>
                            <tr class="summary-row">
                                <td colspan="4"></td>
                                <td style="color: #4B5563;">VAT (15%)</td>
                                <td style="text-align: right; color: #4B5563;">R ${payload.vat.toFixed(2)}</td>
                            </tr>
                            <tr class="summary-row total-row">
                                <td colspan="4"></td>
                                <td>TOTAL</td>
                                <td style="text-align: right; color: #10B981;">R ${payload.total.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    ${planningSectionHtml}
                    
                    <div class="footer">
                        Generated securely via iPhande Steward Operating System.<br/>
                        Valid for 30 days from date of issue.
                    </div>
                </body>
            </html>
        `;

        try {
            const printResult = await Print.printToFileAsync({ html });
            const uri = printResult?.uri;
            if (!uri) {
                Alert.alert("PDF Unavailable", "PDF preview is not available on this platform. Please test PDF export on Android.");
                return;
            }
            const isSharingAvailable = await Sharing.isAvailableAsync();
            if (isSharingAvailable) {
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            } else {
                Alert.alert("Sharing unavailable", "PDF generated successfully, but sharing is not supported on this device/browser.");
            }
            router.back();
        } catch (error) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', 'Could not generate the PDF.');
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <PageHeader 
                eyebrow="Steward Tools" 
                title="Quote Builder" 
                subtitle="Prepare quick service quotes for customers." 
            />

            <View style={styles.subcontent}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Lead Details</Text>
                    <Text style={styles.formulaHelper}>Formula: Sum of line items + VAT</Text>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Lead Name</Text>
                        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Jane Doe" />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="e.g. 082 123 4567" keyboardType="phone-pad" />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Service Description</Text>
                        <TextInput style={[styles.input, styles.textArea]} value={service} onChangeText={setService} placeholder="Describe the requested service..." multiline />
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Line Items</Text>
                        <TouchableOpacity style={styles.addButtonMini} onPress={handleAddLineItem}>
                            <Text style={styles.addButtonMiniText}>+ Add Item</Text>
                        </TouchableOpacity>
                    </View>

                    {lineItems.length === 0 ? (
                        <Text style={styles.emptyItemsText}>No line items. Add at least one to calculate quote.</Text>
                    ) : (
                        lineItems.map((item, index) => {
                            const lineTotal = getLineTotal(item);
                            return (
                                <View key={item.id} style={[styles.itemCard, index > 0 && styles.itemCardSpacer]}>
                                    <View style={styles.itemHeaderRow}>
                                        <Text style={styles.itemNumberText}>Item #{index + 1}</Text>
                                        <TouchableOpacity onPress={() => handleDeleteLineItem(item.id)}>
                                            <Text style={styles.deleteButtonText}>Remove</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.fieldGroup}>
                                        <Text style={styles.fieldLabel}>Item Name</Text>
                                        <TextInput
                                            style={styles.fieldInput}
                                            value={item.name}
                                            onChangeText={val => handleUpdateLineItem(item.id, { name: val })}
                                            placeholder="e.g. Labour, Materials, etc."
                                        />
                                    </View>

                                    <View style={styles.fieldGroup}>
                                        <Text style={styles.fieldLabel}>Description (Optional)</Text>
                                        <TextInput
                                            style={[styles.fieldInput, { height: 50 }]}
                                            value={item.description}
                                            onChangeText={val => handleUpdateLineItem(item.id, { description: val })}
                                            placeholder="e.g. Specific details"
                                            multiline
                                        />
                                    </View>

                                    <View style={styles.rowFields}>
                                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                                            <Text style={styles.fieldLabel}>Qty</Text>
                                            <TextInput
                                                style={styles.fieldInput}
                                                value={item.quantity}
                                                onChangeText={val => handleUpdateLineItem(item.id, { quantity: val })}
                                                keyboardType="numeric"
                                                placeholder="1"
                                            />
                                        </View>
                                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                                            <Text style={styles.fieldLabel}>Unit</Text>
                                            <TextInput
                                                style={styles.fieldInput}
                                                value={item.unit}
                                                onChangeText={val => handleUpdateLineItem(item.id, { unit: val })}
                                                placeholder="hrs/pcs"
                                            />
                                        </View>
                                        <View style={[styles.fieldGroup, { flex: 2 }]}>
                                            <Text style={styles.fieldLabel}>Price (ZAR)</Text>
                                            <TextInput
                                                style={styles.fieldInput}
                                                value={item.unit_price}
                                                onChangeText={val => handleUpdateLineItem(item.id, { unit_price: val })}
                                                keyboardType="numeric"
                                                placeholder="0.00"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.fieldGroup}>
                                        <Text style={styles.fieldLabel}>Category</Text>
                                        <View style={styles.categoryPillContainer}>
                                            {(['labour', 'materials', 'travel', 'other'] as const).map(cat => (
                                                <TouchableOpacity
                                                    key={cat}
                                                    style={[styles.categoryPill, item.category === cat && styles.categoryPillActive]}
                                                    onPress={() => handleUpdateLineItem(item.id, { category: cat })}
                                                >
                                                    <Text style={[styles.categoryPillText, item.category === cat && styles.categoryPillTextActive]}>
                                                        {cat}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    <View style={styles.itemTotalRow}>
                                        <Text style={styles.itemTotalLabel}>Subtotal:</Text>
                                        <Text style={styles.itemTotalValue}>R {lineTotal.toFixed(2)}</Text>
                                    </View>
                                </View>
                            );
                        })
                    )}

                    <View style={styles.switchRow}>
                        <Text style={[styles.label, { marginBottom: 0 }]}>Include 15% VAT</Text>
                        <Switch value={addVat} onValueChange={setAddVat} />
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Planning & Scope Details</Text>
                    
                    <View style={styles.rowFields}>
                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                            <Text style={styles.fieldLabel}>Labour (Hours)</Text>
                            <TextInput
                                style={styles.fieldInput}
                                value={expectedLabourHours}
                                onChangeText={setExpectedLabourHours}
                                keyboardType="numeric"
                                placeholder="e.g. 12"
                            />
                        </View>
                        
                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                            <Text style={styles.fieldLabel}>Travel (KM)</Text>
                            <TextInput
                                style={styles.fieldInput}
                                value={expectedTravelKm}
                                onChangeText={setExpectedTravelKm}
                                keyboardType="numeric"
                                placeholder="e.g. 35"
                            />
                        </View>
                    </View>
                    
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Expected Material Cost (ZAR)</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={expectedMaterialCost}
                            onChangeText={setExpectedMaterialCost}
                            keyboardType="numeric"
                            placeholder="e.g. 1200"
                        />
                    </View>
                    
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Planning Notes</Text>
                        <TextInput
                            style={[styles.fieldInput, { height: 60 }]}
                            value={expectedNotes}
                            onChangeText={setExpectedNotes}
                            placeholder="e.g. Additional scope detail or planning notes..."
                            multiline
                        />
                    </View>
                </View>

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Quote Summary</Text>
                    <View style={styles.summaryRow}><Text style={styles.summaryText}>Subtotal</Text><Text style={styles.summaryValue}>R {subtotal.toFixed(2)}</Text></View>
                    {addVat && <View style={styles.summaryRow}><Text style={styles.summaryText}>VAT (15%)</Text><Text style={styles.summaryValue}>R {vat.toFixed(2)}</Text></View>}
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}><Text style={styles.totalText}>Total</Text><Text style={styles.totalValue}>R {total.toFixed(2)}</Text></View>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.secondaryButton, (isSubmitting || total <= 0) && styles.buttonDisabled]} onPress={handleSaveAndExit} disabled={isSubmitting || total <= 0}>
                        {isSubmitting ? <ActivityIndicator color="#111827" /> : <Text style={styles.secondaryButtonText}>Save Quote</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.primaryButton, (isSubmitting || total <= 0) && styles.buttonDisabled]} onPress={generatePDF} disabled={isSubmitting || total <= 0}>
                        <Text style={styles.primaryButtonText}>Generate Quote PDF</Text>
                    </TouchableOpacity>
                </View>
            </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    subcontent: { padding: 20, gap: 18, paddingBottom: 100 },
    card: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
    formulaHelper: { fontSize: 13, color: '#6B7280', marginBottom: 16, fontStyle: 'italic' },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
    fieldGroup: { marginBottom: 14 },
    label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
    input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111827' },
    textArea: { minHeight: 90, textAlignVertical: 'top' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    summaryCard: { backgroundColor: '#111827', padding: 20, borderRadius: 18, marginTop: 4 },
    summaryTitle: { fontSize: 16, fontWeight: '700', color: '#9CA3AF', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    summaryText: { fontSize: 16, color: '#D1D5DB' },
    summaryValue: { fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#374151', marginVertical: 12 },
    totalText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
    totalValue: { fontSize: 26, fontWeight: '900', color: '#10B981' },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
    primaryButton: { flex: 1, backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    secondaryButton: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    secondaryButtonText: { color: '#111827', fontSize: 16, fontWeight: '700' },
    buttonDisabled: { opacity: 0.6 },
    
    // New LineItem styles
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    addButtonMini: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    addButtonMiniText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
    emptyItemsText: { color: '#6B7280', textAlign: 'center', marginVertical: 20, fontSize: 14 },
    itemCard: { padding: 14, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    itemCardSpacer: { marginTop: 16 },
    itemHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    itemNumberText: { fontSize: 13, fontWeight: '800', color: '#374151' },
    deleteButtonText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },
    fieldLabel: { fontSize: 12, fontWeight: '700', color: '#4B5563', marginBottom: 4 },
    fieldInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
    rowFields: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    categoryPillContainer: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 },
    categoryPill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: '#E5E7EB', borderWidth: 1, borderColor: '#D1D5DB' },
    categoryPillActive: { backgroundColor: '#111827', borderColor: '#111827' },
    categoryPillText: { fontSize: 11, color: '#4B5563', fontWeight: '700', textTransform: 'capitalize' },
    categoryPillTextActive: { color: '#FFFFFF' },
    itemTotalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8 },
    itemTotalLabel: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
    itemTotalValue: { fontSize: 14, color: '#111827', fontWeight: '800' }
});

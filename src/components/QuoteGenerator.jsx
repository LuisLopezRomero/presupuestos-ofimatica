import React, { useState } from 'react';
import { ArrowLeft, Save, FileText, ChevronRight, Check, Download, RefreshCw, Trash2 } from 'lucide-react';
import QuotePreview from './QuotePreview';
import './QuoteGenerator.css';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '../supabaseClient';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const QuoteGenerator = ({ onBack, editData, session }) => {
    // ... rest of component
    const [budgetData, setBudgetData] = useState(editData || {
        clientName: '',
        clientAddress: '',
        clientCIF: '',
        reference: '',
        margin: 25,
        items: [
            { id: 1, ref: '', description: '', qty: 1, price: 0 }
        ],
        deliveryTime: '1-2 días',
        paymentTerms: 'Transferencia 30 días',
        validity: '30 días'
    });

    const [isExtracting, setIsExtracting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBudgetData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (id, field, value) => {
        setBudgetData(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
        }));
    };

    const addItem = () => {
        setBudgetData(prev => ({
            ...prev,
            items: [...prev.items, { id: Date.now(), ref: '', description: '', qty: 1, price: 0 }]
        }));
    };

    const removeItem = (id) => {
        setBudgetData(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
    };

    const recalculatePrices = () => {
        const marginValue = parseFloat(budgetData.margin) || 0;
        setBudgetData(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item.costPrice) {
                    const newPrice = marginValue === 0 ? item.costPrice : item.costPrice * (1 + marginValue / 100);
                    return { ...item, price: newPrice };
                }
                return item;
            })
        }));
    };

    const fileToGenerativePart = async (file) => {
        const base64EncodedDataPromise = new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });
        return {
            inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
        };
    };

    const handleImagePaste = async (e) => {
        console.log("Paste event detected");
        const clipboardItems = e.clipboardData.items;
        for (let i = 0; i < clipboardItems.length; i++) {
            if (clipboardItems[i].type.indexOf("image") !== -1) {
                const blob = clipboardItems[i].getAsFile();
                setIsExtracting(true);
                
                try {
                    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                    const imagePart = await fileToGenerativePart(blob);
                    
                    const prompt = `Analiza esta imagen y extrae los artículos en JSON:
                    {
                      "items": [
                        { "ref": "VPN/SKU", "description": "Nombre detallado", "qty": 1, "costPrice": 123.45 }
                      ]
                    }`;

                    const result = await model.generateContent([prompt, imagePart]);
                    const response = await result.response;
                    const text = response.text();
                    const jsonString = text.replace(/```json|```/g, "").trim();
                    const extractedData = JSON.parse(jsonString);

                    const marginValue = parseFloat(budgetData.margin) || 0;
                    const newItems = extractedData.items.map(item => ({
                        id: Date.now() + Math.random(),
                        ref: item.ref || 'REF',
                        description: item.description || 'Sin descripción',
                        qty: item.qty || 1,
                        costPrice: item.costPrice || 0,
                        price: marginValue === 0 ? item.costPrice : item.costPrice * (1 + marginValue / 100)
                    }));

                    setBudgetData(prev => ({
                        ...prev,
                        items: [...prev.items.filter(item => item.description !== ''), ...newItems]
                    }));
                } catch (error) {
                    console.error("Error con Gemini:", error);
                    alert("Error al extraer datos con la IA.");
                } finally {
                    setIsExtracting(false);
                }
            }
        }
    };

    const saveQuote = async () => {
        setIsSaving(true);
        try {
            const total = budgetData.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
            const quoteData = {
                client_name: budgetData.clientName || 'Cliente sin nombre',
                client_cif: budgetData.clientCIF,
                client_address: budgetData.clientAddress,
                reference: budgetData.reference,
                margin: parseFloat(budgetData.margin),
                total_amount: total,
                status: 'Sent',
                delivery_time: budgetData.deliveryTime,
                payment_terms: budgetData.paymentTerms,
                validity: budgetData.validity
            };

            let quoteId = budgetData.id;

            if (quoteId) {
                // Actualizar presupuesto existente
                const { error: updateError } = await supabase
                    .from('quotes')
                    .update(quoteData)
                    .eq('id', quoteId);
                if (updateError) throw updateError;

                // Borrar items anteriores para re-insertar los nuevos
                const { error: deleteItemsError } = await supabase
                    .from('quote_items')
                    .delete()
                    .eq('quote_id', quoteId);
                if (deleteItemsError) throw deleteItemsError;
            } else {
                // Insertar nuevo presupuesto
                const { data: quote, error: quoteError } = await supabase
                    .from('quotes')
                    .insert([quoteData])
                    .select()
                    .single();
                if (quoteError) throw quoteError;
                quoteId = quote.id;
            }

            const itemsToInsert = budgetData.items
                .filter(item => item.description.trim() !== '')
                .map(item => ({
                    quote_id: quoteId,
                    reference: item.ref,
                    description: item.description,
                    quantity: item.qty,
                    cost_price: item.cost_price || 0,
                    final_price: item.price
                }));

            const { error: itemsError } = await supabase.from('quote_items').insert(itemsToInsert);
            if (itemsError) throw itemsError;

            return true;
        } catch (error) {
            console.error("Error al guardar en Supabase:", error);
            alert("Error al guardar en la base de datos.");
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrintAndSave = async () => {
        const saved = await saveQuote();
        if (saved) {
            window.print();
            setTimeout(() => onBack(), 1000);
        }
    };

    return (
        <div className="generator-container">
            <header className="generator-header">
                <button className="back-btn" onClick={onBack}>
                    <ArrowLeft size={18} />
                    Volver
                </button>
                <div className="header-actions">
                    <button className="primary-btn" onClick={handlePrintAndSave} disabled={isSaving}>
                        <Save size={18} />
                        {isSaving ? 'Guardando...' : 'Generar PDF'}
                    </button>
                </div>
            </header>

            <div className="generator-layout">
                <aside className="generator-form-panel">
                    <div className="extraction-zone" onPaste={handleImagePaste} tabIndex="0">
                        <div className="extraction-content">
                            <FileText size={24} />
                            <p>Pega una imagen aquí para extraer líneas automáticamente</p>
                            {isExtracting && <div className="loader">Procesando imagen...</div>}
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Datos del Cliente</h3>
                        <div className="input-group">
                            <label>Nombre Fiscal del Cliente</label>
                            <input 
                                name="clientName" 
                                value={budgetData.clientName} 
                                onChange={handleInputChange} 
                                placeholder="P.ej. Cámara de Comercio de Alicante" 
                            />
                        </div>
                        <div className="input-row">
                            <div className="input-group">
                                <label>CIF/NIF</label>
                                <input name="clientCIF" value={budgetData.clientCIF} onChange={handleInputChange} />
                            </div>
                            <div className="input-group">
                                <label>Margen Comercial (%)</label>
                                <div className="input-with-action">
                                    <input 
                                        type="number" 
                                        name="margin" 
                                        value={budgetData.margin} 
                                        onChange={handleInputChange} 
                                    />
                                    <button 
                                        className="action-btn" 
                                        onClick={recalculatePrices}
                                        title="Recalcular precios con este margen"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="section-header">
                            <h3>Líneas de Detalle</h3>
                            <button className="text-btn" onClick={addItem}>+ Añadir Línea</button>
                        </div>
                        {budgetData.items.map((item) => (
                            <div key={item.id} className="item-row">
                                <div className="item-main">
                                    <textarea 
                                        className="desc-input" 
                                        placeholder="Descripción detallada" 
                                        value={item.description} 
                                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                        rows={3}
                                    />
                                    <div className="item-sub">
                                        <input 
                                            placeholder="Ref" 
                                            value={item.ref} 
                                            onChange={(e) => handleItemChange(item.id, 'ref', e.target.value)}
                                        />
                                        <input 
                                            type="number" 
                                            className="qty-input" 
                                            value={item.qty} 
                                            onChange={(e) => handleItemChange(item.id, 'qty', parseInt(e.target.value))}
                                        />
                                        <input 
                                            type="number" 
                                            placeholder="Precio" 
                                            value={item.price} 
                                            onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value))}
                                        />
                                        <button className="delete-btn" onClick={() => removeItem(item.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                <main className="generator-preview-panel">
                    <div className="preview-toolbar">
                        <span>VISTA PREVIA EN VIVO</span>
                    </div>
                    <div className="preview-canvas">
                        <QuotePreview data={budgetData} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default QuoteGenerator;

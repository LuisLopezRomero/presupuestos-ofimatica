import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import QuotePreview from './QuotePreview';
import { CheckCircle, Loader2, AlertCircle, ShoppingBag } from 'lucide-react';
import './PublicQuoteView.css';

const PublicQuoteView = ({ quoteId }) => {
    const [quoteData, setQuoteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [accepted, setAccepted] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);

    useEffect(() => {
        const fetchQuoteDetails = async () => {
            try {
                // Fetch quote
                const { data: quote, error: quoteError } = await supabase
                    .from('quotes')
                    .select('*')
                    .eq('id', quoteId)
                    .single();

                if (quoteError) throw quoteError;

                // Fetch items
                const { data: items, error: itemsError } = await supabase
                    .from('quote_items')
                    .select('*')
                    .eq('quote_id', quoteId);

                if (itemsError) throw itemsError;

                setQuoteData({
                    ...quote,
                    clientName: quote.client_name,
                    clientCIF: quote.client_cif,
                    clientAddress: quote.client_address,
                    reference: quote.reference,
                    margin: quote.margin,
                    deliveryTime: quote.delivery_time,
                    paymentTerms: quote.payment_terms,
                    validity: quote.validity,
                    items: items.map(item => ({
                        id: item.id,
                        ref: item.reference,
                        description: item.description,
                        qty: item.quantity,
                        price: item.final_price
                    }))
                });

                if (quote.status === 'Accepted') {
                    setAccepted(true);
                }
            } catch (err) {
                console.error("Error fetching public quote:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (quoteId) {
            fetchQuoteDetails();
        }
    }, [quoteId]);

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            const { error } = await supabase
                .from('quotes')
                .update({ status: 'Accepted' })
                .eq('id', quoteId);

            if (error) throw error;

            setAccepted(true);
            
            // Notification logic (Placeholder for Edge Function trigger)
            console.log("Notifying Ofimática Digital about acceptance...");
            
        } catch (err) {
            alert("Error al aceptar el presupuesto. Por favor, contacte con Ofimática Digital.");
        } finally {
            setIsAccepting(false);
        }
    };

    if (loading) return (
        <div className="public-view-status">
            <Loader2 className="animate-spin" size={40} />
            <p>Cargando presupuesto...</p>
        </div>
    );

    if (error) return (
        <div className="public-view-status error">
            <AlertCircle size={40} />
            <p>No se pudo encontrar el presupuesto. Es posible que el enlace no sea válido.</p>
        </div>
    );

    return (
        <div className="public-view-container">
            <div className="public-view-header">
                <div className="portal-branding">
                    <ShoppingBag size={24} />
                    <span>Portal de Clientes - Ofimática Digital</span>
                </div>
                {!accepted ? (
                    <button 
                        className="accept-action-btn" 
                        onClick={handleAccept} 
                        disabled={isAccepting}
                    >
                        {isAccepting ? 'Procesando...' : 'Aceptar Presupuesto'}
                    </button>
                ) : (
                    <div className="accepted-badge-big">
                        <CheckCircle size={20} />
                        Presupuesto Aceptado
                    </div>
                )}
            </div>

            <div className="public-view-content">
                {accepted && (
                    <div className="success-banner">
                        <CheckCircle color="#15803d" size={32} />
                        <div>
                            <h3>¡Presupuesto Aceptado!</h3>
                            <p>Hemos recibido tu aceptación. Un agente de Ofimática Digital se pondrá en contacto contigo a la brevedad.</p>
                        </div>
                    </div>
                )}
                
                <div className="document-frame">
                    <QuotePreview data={quoteData} />
                </div>
            </div>
        </div>
    );
};

export default PublicQuoteView;

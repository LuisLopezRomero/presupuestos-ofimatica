import React, { useState, useEffect } from 'react';
import { Plus, LayoutDashboard, FileText, Download, Trash2, Edit3, Settings, HelpCircle, User, Search, Filter, LogOut, Share2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import QuoteGenerator from './QuoteGenerator';
import logo from '../assets/logo.png';
import './Dashboard.css';

const Dashboard = ({ session }) => {
    const [view, setView] = useState('dashboard');
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editQuoteData, setEditQuoteData] = useState(null);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    const fetchQuotes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('quotes')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!error) {
            setQuotes(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (session) {
            fetchQuotes();
        }
    }, [session]);

    const handleDelete = async (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) {
            // Eliminar items primero (o dejar que cascade borre si está configurado)
            const { error: itemsError } = await supabase.from('quote_items').delete().eq('quote_id', id);
            if (itemsError) {
                console.error("Error al borrar items:", itemsError);
            }

            const { error } = await supabase.from('quotes').delete().eq('id', id);
            if (error) {
                alert("Error al eliminar el presupuesto");
            } else {
                fetchQuotes();
            }
        }
    };

    const handleEdit = async (quote) => {
        // Cargar los items del presupuesto
        const { data: items, error } = await supabase
            .from('quote_items')
            .select('*')
            .eq('quote_id', quote.id);
        
        if (error) {
            alert("Error al cargar los artículos del presupuesto");
            return;
        }

        setEditQuoteData({
            id: quote.id,
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
                costPrice: item.cost_price,
                price: item.final_price
            }))
        });
        setView('new-quote');
    };

    if (view === 'new-quote') {
        return <QuoteGenerator 
            onBack={() => {
                setView('dashboard');
                setEditQuoteData(null);
                fetchQuotes();
            }} 
            editData={editQuoteData}
        />;
    }

    const handleShare = (id) => {
        const url = `${window.location.origin}${window.location.pathname}?view=quote&id=${id}`;
        navigator.clipboard.writeText(url);
        alert("Enlace copiado al portapapeles. ¡Envíalo a tu cliente!");
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="dashboard-logo">
                    <img src={logo} alt="Ofimática Digital" />
                </div>
                <div className="search-bar">
                    <Search size={18} />
                    <input type="text" placeholder="Buscar presupuestos..." />
                </div>
                <div className="user-profile">
                    <div className="user-info">
                        <User size={20} />
                        <span>{session?.user?.email}</span>
                    </div>
                    <button className="icon-btn logout" title="Cerrar sesión" onClick={handleSignOut}>
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <main className="dashboard-main">
                <section className="welcome-section">
                    <div>
                        <h1>Tus Presupuestos</h1>
                        <p>Gestiona y crea propuestas comerciales de forma profesional.</p>
                    </div>
                    <button className="primary-btn" onClick={() => setView('new-quote')}>
                        <Plus size={20} />
                        Nuevo Presupuesto
                    </button>
                </section>

                <section className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon"><FileText size={20} /></div>
                        <div className="stat-info">
                            <span className="stat-label">Presupuestos Totales</span>
                            <span className="stat-value">{quotes.length}</span>
                        </div>
                    </div>
                    {/* Más stats dinámicos si fuera necesario */}
                </section>

                <section className="quotes-list-section">
                    <div className="section-header">
                        <h2>Recientes</h2>
                    </div>
                    <div className="quotes-table-container">
                        <table className="quotes-table">
                            <thead>
                                <tr>
                                    <th>Ref / ID</th>
                                    <th>Cliente</th>
                                    <th>Fecha</th>
                                    <th className="text-right">Total</th>
                                    <th>Estado</th>
                                    <th className="text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center">Cargando presupuestos...</td></tr>
                                ) : quotes.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center">No hay presupuestos todavía. ¡Crea el primero!</td></tr>
                                ) : quotes.map(quote => (
                                    <tr key={quote.id}>
                                        <td><strong>{quote.id.slice(0, 8)}</strong></td>
                                        <td>{quote.client_name}</td>
                                        <td>{new Date(quote.created_at).toLocaleDateString()}</td>
                                        <td className="text-right">
                                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(quote.total_amount)}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${quote.status.toLowerCase()}`}>
                                                {quote.status}
                                            </span>
                                        </td>
                                        <td className="text-right actions-cell">
                                            <button className="icon-btn" title="Editar" onClick={() => handleEdit(quote)}><Edit3 size={16} /></button>
                                            <button className="icon-btn" title="Compartir Enlace" onClick={() => handleShare(quote.id)}><Share2 size={16} /></button>
                                            <button className="icon-btn" title="Descargar PDF"><Download size={16} /></button>
                                            <button className="icon-btn delete" title="Eliminar" onClick={() => handleDelete(quote.id)}><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;

import { Plus, LayoutDashboard, FileText, Download, Trash2, Edit3, Settings, HelpCircle, User, Search, Filter, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import QuoteGenerator from './QuoteGenerator';
import './Dashboard.css';

const Dashboard = ({ session }) => {
    const [view, setView] = useState('dashboard');
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    useEffect(() => {
        const fetchQuotes = async () => {
            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (!error) {
                setQuotes(data);
            }
            setLoading(false);
        };

        if (session) {
            fetchQuotes();
        }
    }, [session]);

    const stats = [
        { label: 'Presupuestos Totales', value: '12', icon: <FileText size={20} /> },
        { label: 'Pendientes', value: '4', icon: <Edit3 size={20} /> },
        { label: 'Enviados', value: '8', icon: <Download size={20} /> }
    ];

    if (view === 'new-quote') {
        return <QuoteGenerator onBack={() => setView('dashboard')} />;
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
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
                        <button className="text-btn">Ver todos</button>
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
                                            <button className="icon-btn" title="Editar"><Edit3 size={16} /></button>
                                            <button className="icon-btn" title="Descargar PDF"><Download size={16} /></button>
                                            <button className="icon-btn delete" title="Eliminar"><Trash2 size={16} /></button>
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

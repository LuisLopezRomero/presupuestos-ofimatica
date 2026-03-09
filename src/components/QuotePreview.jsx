import React from 'react';
import './QuotePreview.css';
import logo from '../assets/logo.png';

const QuotePreview = ({ data }) => {
    const subtotal = data.items.reduce((acc, item) => acc + (item.qty * item.price), 0);
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    return (
        <div className="preview-document">
            <header className="preview-header">
                <div className="logo-section">
                    <img src={logo} alt="Ofimática Digital" />
                </div>
                <div className="company-info-text">
                    <h2>Ofimática Digital Soluciones SLU</h2>
                    <p>CIF: B75604488</p>
                    <p>Avd de la Libertad, 19, 03610 Petrer (Alicante)</p>
                    <p>Telf: 966955346</p>
                </div>
            </header>

            <div className="preview-meta">
                <div className="preview-client">
                    <h4>Cliente</h4>
                    <p><strong>{data.clientName || '[Nombre del Cliente]'}</strong></p>
                    <p>{data.clientAddress || '[Dirección]'}</p>
                    <p>{data.clientCIF || '[CIF/NIF]'}</p>
                </div>
                <div className="preview-quote-info">
                    <h4>Presupuesto</h4>
                    <p><strong>Nº:</strong> 2026-XXXX</p>
                    <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-ES')}</p>
                    <p><strong>Ref:</strong> {data.reference || '-'}</p>
                </div>
            </div>

            <table className="preview-table">
                <thead>
                    <tr>
                        <th>Ref.</th>
                        <th>Descripción</th>
                        <th className="text-right">Cant.</th>
                        <th className="text-right">Precio</th>
                        <th className="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {data.items.map((item, index) => (
                        <tr key={index}>
                            <td>{item.ref || '-'}</td>
                            <td>{item.description || '[Descripción]'}</td>
                            <td className="text-right">{item.qty || 0}</td>
                            <td className="text-right">{(Number(item.price) || 0).toFixed(2)} €</td>
                            <td className="text-right">{((Number(item.qty) || 0) * (Number(item.price) || 0)).toFixed(2)} €</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="preview-totals">
                <div className="total-row">
                    <span>Base Imponible:</span>
                    <span>{subtotal.toFixed(2)} €</span>
                </div>
                <div className="total-row">
                    <span>IVA (21%):</span>
                    <span>{iva.toFixed(2)} €</span>
                </div>
                <div className="total-row main-total">
                    <span>TOTAL:</span>
                    <span>{total.toFixed(2)} €</span>
                </div>
            </div>

            <footer className="preview-footer">
                <div className="conditions-section">
                    <h5>Condiciones Generales</h5>
                    <ul>
                        <li>Validez: {data.validity}</li>
                        <li>Forma de Pago: {data.paymentTerms}</li>
                        <li>Plazo de Entrega: {data.deliveryTime}</li>
                    </ul>
                </div>
                <div className="legal-text">
                    Ofimática Digital Soluciones SLU | www.ofimaticadigital.es
                </div>
            </footer>
        </div>
    );
};

export default QuotePreview;

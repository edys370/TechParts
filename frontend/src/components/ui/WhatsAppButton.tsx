import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  productName?: string;
  sku?: string;
  phoneNumber?: string; // Formato internacional sin símbolos, ej: 593999999999
  className?: string;
  variant?: 'floating' | 'inline';
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  productName,
  sku,
  phoneNumber = '593999999999',
  className = '',
  variant = 'inline',
}) => {
  const message = productName
    ? `Hola TechParts, deseo consultar la compatibilidad técnica del producto: ${productName} (SKU: ${sku || 'N/A'})`
    : 'Hola TechParts, deseo consultar la compatibilidad de piezas y componentes para mi PC.';

  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  if (variant === 'floating') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title="Asesoría técnica de compatibilidad por WhatsApp"
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 ${className}`}
      >
        <MessageCircle className="w-5 h-5 fill-current" />
        <span className="hidden sm:inline">¿Dudas de compatibilidad? Escríbenos</span>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/90 hover:bg-emerald-100 transition-colors ${className}`}
    >
      <MessageCircle className="w-3.5 h-3.5" />
      Asesoría WhatsApp
    </a>
  );
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        // Color base
        'bg-white': '#ffffff',
        'primary': '#D5720D',
        'primary-light': '#B45309',
        'bg-login': '#ffffff',
        'bg-body': '#FEFAEC',
        'border-general': '#E2E8F0',

        // Jerarquia de textos (Tipografía)
        'heading': '#111827',
        'subtitulo': '#334155',
        'body': '#374151',
        'muted': '#6b7280',
        'label': '#4b5563',
        'caption': '#1e2939',

        // Boton primario
        'btn-primary': '#D5720D',
        'btn-primary-hover': '#B45309',
        'btn-primary-active': '#92400E',
        'btn-primary-disabled': '#E5E7EB',
        'btn-primary-text': '#ffffff',

        // Boton secundario
        'btn-secondary': '#ffffff',
        'btn-secondary-border': '#D1D5DB',
        'btn-secondary-text': '#374151',
        'btn-secondary-hover': '#F3F4F6',
        'btn-secondary-active': '#E5E7EB',
        'btn-secondary-disabled': '#F9FAFB',
        'btn-secondary-text-disabled': '#9CA3AF',

        // Boton terciario
        'btn-tertiary': 'transparent',
        'btn-tertiary-text': '#D5720D',
        'btn-tertiary-hover': '#FEF3C7',
        'btn-tertiary-active': '#FDE68A',

        // Boton de icono
        'btn-icon': 'transparent',
        'btn-icon-text': '#6b7280',
        'btn-icon-hover': '#1e2939',
        'btn-icon-active': '#E5E7EB',
        'btn-icon-disabled': 'transparent',
        'btn-icon-text-disabled': '#D1D5DB',

        // Boton de filtro "Limpiar filtro"
        'btn-lim-filtro-bg': '#ffffff',
        'btn-lim-filtro-text': '#4a5565',
        'btn-lim-filtro-hover': '#f9fafb',
        'btn-lim-filtro-active': '#d1d5dc',

        // Inputs y formularios
        'input-bg': '#FCFFF9',
        'input-border': '#D1D5DB',
        'input-text': '#6B7280',
        'input-placeholder': '#9CA3AF',
        'input-focus-ring': '#BFDBFE',

        // Estados del Input
        'input-focus-border': '#2563EB',
        'input-error-border': '#EF4444',
        'input-error-text': '#B91C1C',
        'input-error-bg': '#FEF2F2',
        'input-disabled-bg': '#F3F4F6',
        'input-disabled-text': '#9CA3AF',

        // Label del Input
        'label-text': '#374151',
        'label-required': '#EF4444',

        // Tooltips
        'tooltip-bg': '#1F2937',
        'tooltip-text': '#F9FAFB',

        // Esqueleto de carga
        'skeleton-bg': '#E5E7EB',
        'skeleton-shimmer': '#F3F4F6',

        // Estado vacio
        'empty-icon': '#D5720D', // Sobrescribe el anterior #9CA3AF
        'empty-title': '#374151',
        'empty-text': '#6B7280',
        'empty-bg': '#FEFAEC',

        // Iconos
        'icon': '#374151',
        'icon-inverse': '#ffffff',

        // Tablas
        'table-header-bg': '#f9fafb',
        'table-header-text': '#4a5565',
        'table-text': '#364153',
        'table-text-impor': '#101828',
        'table-row': '#ffffff',
        'table-row-alt': '#f9fafb',
        'table-row-hover': '#f3f4f6',
        'table-border': '#e5e7eb',
        'table-boton-bg-hover': '#eff6ff',
        'table-boton-text-hove': '#193cb8',
        'table-footer-bg': '#f9fafb',

        // Sidebar
        'sidebar-bg': '#ffffff',
        'sidebar-text': '#5C5E64',
        'sidebar-hover-bg': '#FEFAEC',
        'sidebar-hover-text': '#D97706',
        'sidebar-active-bg': '#FEFAEC',
        'sidebar-active-text': '#D97706',

        // Encabezado principal
        'header-bg': '#ffffff',
        'header-bg-icon': '#FEFAEC',
        'header-icon': '#D97706',

        // Tarjeta dashoard
        'tarjeta-bg': '#ffffff',
        'tarjeta-valor': '#0F172A',
        'tarjeta-label': '#334155',

        // Chips de estado
        'chip-verde-bg': '#f0fdf4',
        'chip-verde-text': '#166534',
        'chip-azul-bg': '#eff6ff',
        'chip-azul-text': '#1e40af',
        'chip-amarillo-bg': '#fefce8',
        'chip-amarillo-text': '#854d0e',
        'chip-rojo-bg': '#fef2f2',
        'chip-rojo-text': '#991b1b',

        // Modal
        'modal-bg-encabezado-footer': '#F9FAFB',
        'modal-bg-body': '#ffffff',
        'modal-encabezado': '#111827',
        'modal-parrafo': '#6b7280',

        // Tarjeta de historal cambios
        'bg-card-history': '#F9FBFD',
      }
    },
  },
  plugins: [],
};
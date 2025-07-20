/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores personalizados existentes
        primary: '#3B82F6',
        secondary: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
        
        // Nuevos colores para resolver el error 'border-border', 'bg-background', 'text-foreground'
        // Puedes ajustar estos valores hexadecimales a los colores que desees para tu tema.
        border: '#E5E7EB',     // Un gris claro para bordes
        background: '#F9FAFB', // Un gris muy claro para fondos
        foreground: '#1F2937', // Un gris oscuro para texto principal
      }
    },
  },
  plugins: [],
}

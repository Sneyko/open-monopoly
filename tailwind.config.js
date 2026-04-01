/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist: [
    { pattern: /(fill|stroke|bg)-player-(red|blue|green|yellow|purple|orange)/ },
    { pattern: /(fill|stroke|bg)-group-(brown|light-blue|pink|orange|red|yellow|green|dark-blue)/ },
  ],
  theme: {
    extend: {
      colors: {
        player: {
          red: '#E24B4A',
          blue: '#378ADD',
          green: '#639922',
          yellow: '#EF9F27',
          purple: '#7F77DD',
          orange: '#D85A30',
        },
        group: {
          brown: '#8B5E3C',
          'light-blue': '#81D4FA',
          pink: '#F06292',
          orange: '#FF8A65',
          red: '#E53935',
          yellow: '#FDD835',
          green: '#43A047',
          'dark-blue': '#1565C0',
        },
      },
    },
  },
  plugins: [],
}

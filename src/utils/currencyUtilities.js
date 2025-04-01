// // Common currency utility functions for the CRM application

// // List of supported currencies
// export const CURRENCIES = [
//     { code: "AUD", name: "Australian Dollar", symbol: "$" },
//     { code: "USD", name: "US Dollar", symbol: "$" },
//     { code: "EUR", name: "Euro", symbol: "€" },
//     { code: "GBP", name: "British Pound", symbol: "£" },
//     { code: "JPY", name: "Japanese Yen", symbol: "¥" },
//     { code: "CAD", name: "Canadian Dollar", symbol: "$" },
//     { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
//     { code: "INR", name: "Indian Rupee", symbol: "₹" },
//     { code: "NZD", name: "New Zealand Dollar", symbol: "$" }
//   ];
  
//   // Fetch currency exchange rates with AUD as the base
//   export const fetchExchangeRates = async () => {
//     try {
//       const response = await fetch('https://api.exchangerate-api.com/v4/latest/AUD');
      
//       if (!response.ok) {
//         throw new Error('Failed to fetch currency rates');
//       }
      
//       const data = await response.json();
      
//       // Process rates to get conversion TO AUD (inverse of the API rates)
//       const inverseRates = {};
//       Object.entries(data.rates).forEach(([currency, rate]) => {
//         inverseRates[currency] = 1 / rate;
//       });
      
//       // Set AUD to 1 since it's our base currency
//       inverseRates["AUD"] = 1;
      
//       return inverseRates;
//     } catch (error) {
//       console.error('Error fetching exchange rates:', error);
//       return null;
//     }
//   };
  
//   // Convert a value from a source currency to AUD
//   export const convertToAUD = (value, fromCurrency, rates) => {
//     if (!value || !fromCurrency || !rates || !rates[fromCurrency]) {
//       return null;
//     }
    
//     const numericValue = parseFloat(value.toString().replace(/,/g, ''));
//     if (isNaN(numericValue)) {
//       return null;
//     }
    
//     const rate = rates[fromCurrency];
//     return numericValue * rate;
//   };
  
//   // Format a currency value for display
//   export const formatCurrency = (value, currencyCode = 'AUD') => {
//     if (!value) return "—";
    
//     // Handle numeric strings
//     const numericValue = typeof value === 'string' 
//       ? parseFloat(value.replace(/,/g, '')) 
//       : value;
      
//     if (isNaN(numericValue)) return "—";
    
//     // Find currency details
//     const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
    
//     // Define currency formatter
//     const formatter = new Intl.NumberFormat('en-AU', {
//       style: 'currency',
//       currency: currency.code,
//       minimumFractionDigits: 2
//     });
    
//     return formatter.format(numericValue);
//   };
  
//   // Format input for currency field with commas for thousands
//   export const formatCurrencyInput = (value) => {
//     if (!value) return "";
    
//     // Remove non-numeric characters except decimal point
//     let numericValue = value.toString().replace(/[^\d.]/g, '');
    
//     // Ensure only one decimal point
//     const parts = numericValue.split('.');
//     if (parts.length > 2) {
//       numericValue = parts[0] + '.' + parts.slice(1).join('');
//     }
    
//     // Format with commas
//     if (numericValue.includes('.')) {
//       const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
//       return integerPart + '.' + parts[1];
//     } else {
//       return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
//     }
//   };
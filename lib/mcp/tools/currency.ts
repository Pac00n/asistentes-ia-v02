import { z } from "zod";
import axios from "axios";

// Definir el esquema Zod
const currencySchema = z.object({
  amount: z.number().describe("Cantidad a convertir"),
  from: z.string().describe("Código de moneda origen (ej: USD)"),
  to: z.string().describe("Código de moneda destino (ej: EUR)")
});

// Convertir manualmente el esquema a JSON plano compatible con OpenAI
const currencyParameters = {
  type: "object",
  properties: {
    amount: {
      type: "number",
      description: "Cantidad a convertir"
    },
    from: {
      type: "string",
      description: "Código de moneda origen (ej: USD)"
    },
    to: {
      type: "string",
      description: "Código de moneda destino (ej: EUR)"
    }
  },
  required: ["amount", "from", "to"]
};

export const currencyTool = {
  meta: {
    name: "convert_currency",
    description: "Convierte entre diferentes monedas",
    parameters: currencyParameters,
  },
  async run({ amount, from, to }: { amount: number, from: string, to: string }) {
    try {
      // Validar parámetros
      if (!amount || isNaN(amount)) {
        throw new Error("La cantidad debe ser un número válido");
      }
      
      if (!from || !to) {
        throw new Error("Los códigos de moneda origen y destino son obligatorios");
      }
      
      // Normalizar códigos de moneda
      const fromCurrency = from.toUpperCase();
      const toCurrency = to.toUpperCase();
      
      // Usando API gratuita de ExchangeRate-API
      const { data } = await axios.get(`https://open.er-api.com/v6/latest/${fromCurrency}`);
      
      if (!data || !data.rates) {
        throw new Error("No se pudieron obtener las tasas de cambio");
      }
      
      const rate = data.rates[toCurrency];
      if (!rate) {
        throw new Error(`Tasa de conversión no disponible para ${toCurrency}`);
      }
      
      const convertedAmount = amount * rate;
      
      return {
        amount,
        from: fromCurrency,
        to: toCurrency,
        rate,
        result: convertedAmount.toFixed(2),
        timestamp: new Date().toISOString(),
        source: "ExchangeRate-API"
      };
    } catch (error) {
      console.error("Error en convert_currency:", error);
      return { 
        error: "No se pudo realizar la conversión de moneda",
        details: error instanceof Error ? error.message : "Error desconocido"
      };
    }
  },
};

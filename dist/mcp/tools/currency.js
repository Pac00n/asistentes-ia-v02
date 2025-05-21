"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.currencyTool = void 0;
const zod_1 = require("zod");
const axios_1 = __importDefault(require("axios"));
// Definir el esquema Zod
const currencySchema = zod_1.z.object({
    amount: zod_1.z.number().describe("Cantidad a convertir"),
    from: zod_1.z.string().describe("Código de moneda origen (ej: USD)"),
    to: zod_1.z.string().describe("Código de moneda destino (ej: EUR)")
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
exports.currencyTool = {
    meta: {
        name: "convert_currency",
        description: "Convierte entre diferentes monedas",
        parameters: currencyParameters,
    },
    run(_a) {
        return __awaiter(this, arguments, void 0, function* ({ amount, from, to }) {
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
                const { data } = yield axios_1.default.get(`https://open.er-api.com/v6/latest/${fromCurrency}`);
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
            }
            catch (error) {
                console.error("Error en convert_currency:", error);
                return {
                    error: "No se pudo realizar la conversión de moneda",
                    details: error instanceof Error ? error.message : "Error desconocido"
                };
            }
        });
    },
};

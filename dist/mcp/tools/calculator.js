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
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatorTool = void 0;
const zod_1 = require("zod");
const mathjs_1 = require("mathjs");
// Definir el esquema Zod
const calculatorSchema = zod_1.z.object({
    expression: zod_1.z.string().describe("Expresión matemática a calcular")
});
// Convertir manualmente el esquema a JSON plano compatible con OpenAI
const calculatorParameters = {
    type: "object",
    properties: {
        expression: {
            type: "string",
            description: "Expresión matemática a calcular"
        }
    },
    required: ["expression"]
};
exports.calculatorTool = {
    meta: {
        name: "calculate",
        description: "Realiza cálculos matemáticos",
        parameters: calculatorParameters,
    },
    run(_a) {
        return __awaiter(this, arguments, void 0, function* ({ expression }) {
            try {
                // Validar y limpiar la expresión
                if (!expression || typeof expression !== 'string') {
                    throw new Error("La expresión debe ser un texto válido");
                }
                // Eliminar caracteres potencialmente peligrosos
                const sanitizedExpression = expression.replace(/[^-()\d/*+.^%,\s]/g, '');
                if (sanitizedExpression !== expression) {
                    console.warn("La expresión ha sido sanitizada para seguridad");
                }
                // Usar mathjs para evaluación segura de expresiones
                const result = (0, mathjs_1.evaluate)(sanitizedExpression);
                return {
                    expression,
                    sanitized_expression: sanitizedExpression,
                    result: result.toString(),
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                console.error("Error en calculate:", error);
                return {
                    error: "No se pudo realizar el cálculo",
                    details: error instanceof Error ? error.message : "Error desconocido"
                };
            }
        });
    },
};

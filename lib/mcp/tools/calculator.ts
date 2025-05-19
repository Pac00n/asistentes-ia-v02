import { z } from "zod";
import { evaluate } from "mathjs";

// Definir el esquema Zod
const calculatorSchema = z.object({
  expression: z.string().describe("Expresión matemática a calcular")
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

export const calculatorTool = {
  meta: {
    name: "calculate",
    description: "Realiza cálculos matemáticos",
    parameters: calculatorParameters,
  },
  async run({ expression }: { expression: string }) {
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
      const result = evaluate(sanitizedExpression);
      
      return {
        expression,
        sanitized_expression: sanitizedExpression,
        result: result.toString(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error en calculate:", error);
      return { 
        error: "No se pudo realizar el cálculo", 
        details: error instanceof Error ? error.message : "Error desconocido"
      };
    }
  },
};

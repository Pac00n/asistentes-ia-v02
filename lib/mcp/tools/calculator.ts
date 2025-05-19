import { z } from "zod";
import { evaluate } from "mathjs";

export const calculatorTool = {
  meta: {
    name: "calculate",
    description: "Realiza cálculos matemáticos",
    parameters: z.object({
      expression: z.string().describe("Expresión matemática a calcular")
    }).toJSON(),
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

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
exports.registry = void 0;
exports.executeTool = executeTool;
const weather_1 = require("./tools/weather");
const search_1 = require("./tools/search");
const calculator_1 = require("./tools/calculator");
const currency_1 = require("./tools/currency");
const news_1 = require("./tools/news");
const echoTool_1 = require("./tools/echoTool");
// Registro central de herramientas
exports.registry = {
    tools: [
        weather_1.weatherTool,
        search_1.searchTool,
        calculator_1.calculatorTool,
        currency_1.currencyTool,
        news_1.newsTool,
        echoTool_1.echoTool,
    ],
    toolsMeta: [
        weather_1.weatherTool.meta,
        search_1.searchTool.meta,
        calculator_1.calculatorTool.meta,
        currency_1.currencyTool.meta,
        news_1.newsTool.meta,
        echoTool_1.echoTool.meta,
    ],
};
// Función para ejecutar una herramienta por nombre
function executeTool(call) {
    return __awaiter(this, void 0, void 0, function* () {
        const tool = exports.registry.tools.find(t => t.meta.name === call.name);
        if (!tool) {
            return { error: `Herramienta no encontrada: ${call.name}` };
        }
        try {
            return yield tool.run(call.arguments);
        }
        catch (error) {
            console.error(`Error al ejecutar herramienta ${call.name}:`, error);
            return { error: `Error al ejecutar la herramienta: ${error}` };
        }
    });
}

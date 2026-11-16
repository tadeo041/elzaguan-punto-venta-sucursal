import { Injectable } from '@nestjs/common';

export interface BotResponse {
    matched: boolean;
    response: string;
}

interface BotRule {
    patterns: string[];
    buildResponse: (name: string) => string;
}

@Injectable()
export class BotService {
    /**
     * REGLAS DEL BOT
     * El bot revisa de arriba hacia abajo y devuelve la PRIMERA coincidencia.
     * Pon las más específicas arriba, las genéricas abajo.
     */
    private readonly rules: BotRule[] = [
        // 👋 Saludo
        {
            patterns: ['hola', 'buenas', 'buenos dias', 'buenos días', 'buenas tardes', 'buenas noches', 'que tal', 'qué tal', 'saludos'],
            buildResponse: (name) =>
                `¡Hola ${name}! 👋 Bienvenido a El Zaguán. ¿En qué podemos ayudarte hoy?`,
        },

        // 🕐 Horario
        {
            patterns: ['horario', 'a que hora', 'a qué hora', 'abren', 'cierran', 'hora de servicio'],
            buildResponse: (name) =>
                `Hola ${name}, nuestro horario es:\n🕐 Lunes a domingo: 1:00 pm – 11:00 pm\n¡Te esperamos!`,
        },

        // 🍽️ Menú
        {
            patterns: ['menu', 'menú', 'carta', 'platillos', 'que tienen', 'qué tienen'],
            buildResponse: (name) =>
                `Hola ${name}, nuestro menú del día incluye:\n🍲 Sopa de tortilla\n🍗 Pollo en mole\n🍮 Flan napolitano\n\nPrecio: $180\n¿Te gustaría reservar una mesa?`,
        },

        // 📅 Reservaciones
        {
            patterns: ['reserva', 'reservacion', 'reservación', 'apartar', 'apartame', 'mesa para'],
            buildResponse: (name) =>
                `¡Perfecto ${name}! Para hacer una reservación necesitamos:\n📅 Fecha\n🕗 Hora\n👥 Número de personas\n\n¿Me compartes esos datos?`,
        },

        // 📍 Ubicación
        {
            patterns: ['ubicacion', 'ubicación', 'donde estan', 'dónde están', 'direccion', 'dirección', 'como llegar', 'cómo llegar'],
            buildResponse: (name) =>
                `Hola ${name}, estamos ubicados en:\n📍 Av. Principal #123, Col. Centro\n🗺️ https://maps.google.com/?q=El+Zaguan\n\n¡Te esperamos!`,
        },

        // 💰 Precios
        {
            patterns: ['precio', 'cuanto', 'cuánto', 'costo', 'cobran', 'cuanto cuesta'],
            buildResponse: (name) =>
                `Hola ${name}, nuestros precios son:\n• Entradas: $80 – $120\n• Platos fuertes: $150 – $250\n• Postres: $60 – $90\n\n¿Te gustaría conocer el menú completo?`,
        },

        // 🙏 Agradecimiento
        {
            patterns: ['gracias', 'muchas gracias', 'mil gracias'],
            buildResponse: (name) =>
                `¡Con gusto ${name}! 🎉 Te esperamos en El Zaguán. ¡Que tengas un excelente día!`,
        },

        // 👋 Despedida
        {
            patterns: ['adios', 'adiós', 'hasta luego', 'nos vemos', 'bye'],
            buildResponse: (name) =>
                `¡Hasta pronto ${name}! 👋 Gracias por escribirnos a El Zaguán.`,
        },
    ];

    generarRespuesta(texto: string, nombreCliente: string): BotResponse {
        const textoLimpio = this.normalizar(texto);
        const nombre = (nombreCliente || 'amigo').trim();

        for (const rule of this.rules) {
            for (const pattern of rule.patterns) {
                if (textoLimpio.includes(this.normalizar(pattern))) {
                    return {
                        matched: true,
                        response: rule.buildResponse(nombre),
                    };
                }
            }
        }

        return {
            matched: false,
            response: `Hola ${nombre}, gracias por escribirnos a El Zaguán. En un momento un miembro de nuestro equipo te atenderá. 🙌`,
        };
    }

    private normalizar(s: string): string {
        return (s ?? '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }
}
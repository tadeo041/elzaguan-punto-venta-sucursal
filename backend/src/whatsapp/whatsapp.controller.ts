import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    Param,
    Patch,
    UseGuards,
    Res,
    HttpCode,
} from '@nestjs/common';
import type { Response } from 'express';
import { WhatsappService } from './whatsapp.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SendMessageDto } from './dto/send-message.dto';
import { ToggleBotDto } from './dto/toggle-bot.dto';
import { ListConversationsDto } from './dto/list-conversations.dto';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
    constructor(private readonly whatsappService: WhatsappService) {}

    // ============ WEBHOOK (PÚBLICO) ============

    @Get('webhook')
    @ApiOperation({ summary: 'Verificación del webhook de Meta (público)' })
    @ApiQuery({ name: 'hub.mode' })
    @ApiQuery({ name: 'hub.verify_token' })
    @ApiQuery({ name: 'hub.challenge' })
    verificarWebhook(
        @Query('hub.mode') mode: string,
        @Query('hub.verify_token') token: string,
        @Query('hub.challenge') challenge: string,
        @Res() res: Response,
    ) {
        try {
            const result = this.whatsappService.verificarWebhook(mode, token, challenge);
            return res.status(200).send(result);
        } catch {
            return res.status(403).send('Forbidden');
        }
    }

    @Post('webhook')
    @HttpCode(200)
    @ApiOperation({ summary: 'Recibir eventos de Meta (público)' })
    async recibirWebhook(@Body() body: any) {
        console.log('🚨 ¡LLEGÓ UN WEBHOOK DE META!', JSON.stringify(body, null, 2));
        await this.whatsappService.procesarWebhook(body);
        return { received: true };
    }

    // ============ ENDPOINTS PROTEGIDOS ============

    @Get('conversations')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Listar conversaciones con filtros y paginación' })
    listarConversaciones(@Query() dto: ListConversationsDto) {
        return this.whatsappService.listarConversaciones(dto);
    }

    @Get('conversations/:id')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Obtener conversación con sus mensajes' })
    getConversacion(@Param('id') id: string) {
        return this.whatsappService.getConversacionConMensajes(+id);
    }

    @Patch('conversations/:id/bot')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Activar / desactivar bot en una conversación' })
    toggleBot(@Param('id') id: string, @Body() dto: ToggleBotDto) {
        return this.whatsappService.toggleBot(+id, dto.activo);
    }

    @Post('conversations/:id/messages')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Enviar mensaje manual a un cliente' })
    enviarMensaje(@Param('id') id: string, @Body() dto: SendMessageDto) {
        return this.whatsappService.enviarMensajeHumano(+id, dto.texto);
    }
}
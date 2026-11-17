import {
    Controller,
    Get,
    Put,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConfiguracionService } from './configuracion.service';
import { UpdateWhatsappConfigDto } from './dto/update-whatsapp-config.dto';

@ApiTags('configuracion')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('configuracion')
export class ConfiguracionController {
    constructor(private readonly configService: ConfiguracionService) {}

    @Get('whatsapp')
    @ApiOperation({ summary: 'Obtener configuración de WhatsApp' })
    obtenerWhatsapp() {
        return {
            phoneNumberId: this.configService.obtener('WHATSAPP_PHONE_NUMBER_ID') ?? '',
            accessToken: this.enmascararToken(this.configService.obtener('WHATSAPP_ACCESS_TOKEN')),
            verifyToken: this.configService.obtener('WHATSAPP_VERIFY_TOKEN') ?? '',
            apiVersion: this.configService.obtener('WHATSAPP_API_VERSION') ?? 'v25.0',
            wabaId: this.configService.obtener('WHATSAPP_WABA_ID') ?? '',
        };
    }

    @Put('whatsapp')
    @ApiOperation({ summary: 'Actualizar configuración de WhatsApp' })
    async actualizarWhatsapp(@Body() dto: UpdateWhatsappConfigDto) {
        await this.configService.actualizarVarias({
            WHATSAPP_PHONE_NUMBER_ID: dto.phoneNumberId,
            WHATSAPP_ACCESS_TOKEN: dto.accessToken,
            WHATSAPP_VERIFY_TOKEN: dto.verifyToken,
            WHATSAPP_API_VERSION: dto.apiVersion,
            WHATSAPP_WABA_ID: dto.wabaId,
        } as Record<string, string>);
        return { ok: true };
    }

    private enmascararToken(token?: string): string {
        if (!token) return '';
        if (token.length <= 12) return '****';
        return `${token.substring(0, 8)}...${token.substring(token.length - 4)}`;
    }
}
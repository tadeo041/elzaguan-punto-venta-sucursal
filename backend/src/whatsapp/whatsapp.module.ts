import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { BotService } from './bot.service';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Conversation, Message])],
    controllers: [WhatsappController],
    providers: [WhatsappService, BotService],
    exports: [WhatsappService],
})
export class WhatsappModule {}
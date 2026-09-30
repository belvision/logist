// Типы для вебхуков Bitrix24

export interface WebhookData {
  event: string;
  data?: {
    FIELDS?: {
      ID: string;
      TITLE?: string;
      STAGE_ID?: string;
    };
    ITEM?: {
      ID: string;
      TITLE?: string;
    };
  };
  ts?: string;
}

export interface WebhookResponse {
  success: boolean;
  message?: string;
  ticketId?: string;
  messageAdded?: boolean;
  error?: string;
}

export interface SmartProcessComment {
  message: string;
  author: string;
  timestamp: Date;
}

export interface WebhookProcessingResult {
  success: boolean;
  ticketId?: string;
  messageAdded?: boolean;
  error?: string;
}

export interface Bitrix24TimelineComment {
  ID: string;
  COMMENT: string;
  CREATED: string;
  AUTHOR_ID: string;
}

export interface Bitrix24ItemData {
  COMMENTS?: string;
  DESCRIPTION?: string;
}

export type SupportNewStatus = 'Новый ответ' | 'Просмотрен';

import { IMessage } from '@lexus/core/services/src/lib/message-bus/message-bus.interface';

/**
 * Form Event Message
 */
export class FormEventMessage {
  constructor(public form: IMessage) {
  }
}

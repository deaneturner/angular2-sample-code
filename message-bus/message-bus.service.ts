import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';
import { IMessage } from './message-bus.interface';

/**
 *
 * Create the Message and Channel
 *  ---
 *
 *  ````javascript
 * export class NotificationEventMessage {
 *   constructor(public message: INotificationMessage){}
 * }
 * ````
 *
 *   ````javascript
 * static PUBSUB = {
 *   NOTIFICATION: 'pubsub_notification'
 * };
 * ````
 *
 *  Subscribe
 * ---
 *
 *  ````javascript
 * private notifications$: Subscription;
 * private notificationsResult: NotificationsEventMessage;
 * ````
 *
 *  ````javascript
 * this.notifications$ = this.messageBus.of(NotificationsEventMessage).subscribe(message => {
 *   this.notificationsResult = message.message;
 * });
 * ````
 *
 *  Publish
 * ---
 *
 *  ````javascript
 * this.messageBus.publish(new NotificationsEventMessage({
 *   pubsub: MessageBusService.PUBSUB.MESSAGES,
 *   data: notifications
 * }));
 * ````
 *
 */
@Injectable()
export class MessageBusService {

  /**
   * Publish Subscribe
   *
   * @type {{MESSAGES: string; MESSAGES: string}}
   */
  static PUBSUB = {
    FORM: 'pubsub_form',
    NOTIFICATION: 'pubsub_notification'
  };
  private message$: Subject<IMessage>;

  constructor() {
    this.message$ = new Subject<IMessage>();
  }

  /**
   * Publish
   *
   * ````javascript
   * this.messageBus.publish(new NotificationEventMessage({
   *   pubsub: MessageBusService.PUBSUB.MESSAGES,
   *   data: notifications
   * }));
   * ````
   */
  public publish<T>(message: T): void {
    const pubsub = (message.constructor as any).name;
    this.message$.next({pubsub, data: message});
  }

  /**
   * Subscribe
   *
   * ````javascript
   * this.notifications$ = this.messageBus.of(NotificationEventMessage).subscribe(message => {
   *   this.notificationsResult = message.notifications;
   * });
   * ````
   *
   * @param {{new(...args: any[]): T}} messageType
   * @returns {Observable<T>}
   */
  public of<T>(messageType: { new(...args: any[]): T }): Observable<T> {
    const pubsub = (messageType as any).name;
    return this.message$.filter(m => m.pubsub === pubsub).map(m => m.data);
  }
}

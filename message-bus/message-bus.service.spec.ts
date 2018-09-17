import { async, TestBed } from '@angular/core/testing';
import {HttpClientModule} from '@angular/common/http';
import { MessageBusService } from '@lexus/core/services';
import { FormEventMessage } from '@lexus/core/services/src/lib/message-bus/form-event-message';

describe('MessageBusService', () => {

  let service;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MessageBusService,
        HttpClientModule
      ]
    });
    service = TestBed.get(MessageBusService);
  });

  it(
    'should be defined',
    () => expect(service).toBeDefined()
  );

  it ('should support subscription and publication over message pubsub channels', async(() => {
    // subscribe
    service.of(FormEventMessage).subscribe(message => {
      expect(message.form).toEqual({
        pubsub: MessageBusService.PUBSUB.FORM,
        data: {
          test: 'test'
        }
      });
    });
    // publish
    service.publish(new FormEventMessage({
      pubsub: MessageBusService.PUBSUB.FORM,
      data: {
        test: 'test'
      }
    }));
  }));
});

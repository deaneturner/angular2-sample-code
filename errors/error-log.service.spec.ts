import {TestBed} from '@angular/core/testing';
import {HttpClientModule} from '@angular/common/http';
import { ErrorLogService } from '@lexus/core/services';

describe('ErrorLogService', () => {

  let service;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ErrorLogService,
        HttpClientModule
      ]
    });
    service = TestBed.get(ErrorLogService);
  });

  it(
    'should be defined',
    () => expect(service).toBeDefined()
  );
});

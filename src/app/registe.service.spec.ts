import { TestBed } from '@angular/core/testing';

import { RegisteService } from './registe.service';

describe('RegisteService', () => {
  let service: RegisteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegisteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

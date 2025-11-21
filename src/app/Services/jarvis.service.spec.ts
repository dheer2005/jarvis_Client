import { TestBed } from '@angular/core/testing';

import { JarvisService } from './jarvis.service';

describe('JarvisService', () => {
  let service: JarvisService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JarvisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

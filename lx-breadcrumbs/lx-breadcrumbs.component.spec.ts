import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LxBreadcrumbsComponent } from './lx-breadcrumbs.component';

describe('LxBreadcrumbsComponent', () => {
  let component: LxBreadcrumbsComponent;
  let fixture: ComponentFixture<LxBreadcrumbsComponent>;

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [LxBreadcrumbsComponent]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(LxBreadcrumbsComponent);
    component = fixture.componentInstance;
    // fixture.detectChanges();
  });

  it('shoud be defined', () => {
    expect(component).toBeDefined();
  });
});

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LxBreadcrumbsComponent } from './lx-breadcrumbs.component';
import { RouterModule, RouterStateSnapshot } from '@angular/router';
import { MatButtonModule, MatIconModule, MatMenuModule, MatToolbarModule } from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterModule
  ],
  declarations: [LxBreadcrumbsComponent],
  exports: [LxBreadcrumbsComponent]
})
export class LxBreadcrumbsModule {
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  ActivatedRoute, NavigationEnd, NavigationStart, Router
} from '@angular/router';
import { MenuService } from '@lexus/core/services/src/lib/menu/menu.service';
import { compact, map, clone } from 'lodash-es';
import { Subscription } from 'rxjs';
import { MenuItem } from '@lexus/core/shared';

@Component({
  selector: 'lx-breadcrumbs',
  templateUrl: './lx-breadcrumbs.component.html',
  styleUrls: ['./lx-breadcrumbs.component.scss']
})
export class LxBreadcrumbsComponent implements OnInit, OnDestroy {
  public breadcrumbs: any[] = [];

  private routerSubscription$: Subscription;

  constructor(private router: Router,
              private activatedRoute: ActivatedRoute,
              private menuService: MenuService) { // private menuService: MenuService) {
  }

  ngOnInit() {
    this.captureAndBindBreadcrumbs();
  }

  ngOnDestroy() {
    this.routerSubscription$.unsubscribe();
  }

  /**
   * Listen to route events and bind the breadcrumb labels from the menu service.
   */
  private captureAndBindBreadcrumbs(): void {
    this.routerSubscription$ = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.breadcrumbs = [];
      }

      if (event instanceof NavigationEnd) {
        this.breadcrumbs = this.buildBreadcrumbs(this.router.routerState.snapshot.url);
      }
    });
  }

  private buildBreadcrumbs(url: string) {
    let crumbs: MenuItem[] = [];
    let walk = (menu, locUrl) => {
      let menuItems = this.getMenuItems(menu, locUrl);
      menuItems.forEach((menuEntry) => {
        crumbs.push(menuEntry);
        walk(menuEntry.submenu, locUrl);
      });
    };
    this.menuService.items.forEach((menu) => {
      walk(menu, url);
    });
    return crumbs;
  }

  private menuContainsUrl(menu: MenuItem, url) {
    let result = false;
    if (menu.submenu) {
      menu.submenu.forEach((submenu) => {
        if (submenu.route === url) {
          result = true;
        }
      });
    }
    return result;
  }

  private getMenuItems(menu: MenuItem | MenuItem[], url) {
    let uri: string;
    let uris: string[];
    let uriFound = false;
    let uriPos: number;
    let uriSeq: string[];
    let result: any[] = [];
    let walk = (trail: MenuItem[]) => {
      let pickCrumb = (menuItems: MenuItem[]) => {
        if (menuItems instanceof Array) {
          menuItems.filter((subMenu) => {
            uris = url.split('/');
            uris = compact(uris);
            uriFound = subMenu.route === url;
            if (!uriFound) {
              uriPos = uris.length;
              while (!uriFound && (uriPos > 0)) {
                uriSeq = map(uris, clone);
                uri = '/' + uriSeq.splice(0, uriPos).join('/');
                uriPos--;
                if (subMenu.route === uri) {
                  uriFound = true;
                  result.push(subMenu);
                }
              }
            } else {
              result.push(subMenu);
            }
          });
        }
      };
      trail.forEach((menuItem) => {
        pickCrumb([menuItem]);
        if (menuItem.submenu) {
          walk(menuItem.submenu);
        }
      });
    };
    if (menu) {
      if (!(menu instanceof Array)) {
        if (menu.nonRoutable && this.menuContainsUrl(menu, url)) {
          result.push(menu);
        } else {
          menu = [menu];
        }
      }
      if (menu instanceof Array) {
        walk(menu);
      }
    }
    return result;
  }
}

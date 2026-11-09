import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'my-login-app';
  currentYear = new Date().getFullYear();
  navigationOpen = false;
  private authSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  showProfile = false;
  isLoggedIn = false;

  get isLoginPage(): boolean {
    return this.router.url.split(/[?#]/, 1)[0] === '/login';
  }

  get isHomePage(): boolean {
    return this.router.url.split(/[?#]/, 1)[0] === '/home';
  }

  ngOnInit() {
    this.authSubscription = this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }

  toggleNavigation() {
    this.navigationOpen = !this.navigationOpen;
  }

  closeNavigation() {
    this.navigationOpen = false;
  }

  goToProfile() {
    this.closeNavigation();
    const driverId = localStorage.getItem('driverId');

    if (!driverId) {
      alert('Session expired. Please login again.');
      this.router.navigate(['/login']);
      return;
    }

    this.router.navigate(['/profile'], {
      queryParams: { driverId }
    });
  }

  logout() {
    this.closeNavigation();
    localStorage.clear();
    this.isLoggedIn = false;
    this.authService.setLoggedIn(false);
    this.router.navigate(['/login']);
  }
}

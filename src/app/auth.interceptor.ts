import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router,private authService:AuthService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    const token = localStorage.getItem('token');
    const isChatRequest = req.url.includes('127.0.0.1:5000/chat') || req.url.includes('localhost:5000/chat');

    let authReq = req;

    // ✅ Attach token if exists
    if (token && !isChatRequest) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log(error.status)

        // 🔥 FORCE LOGOUT ON 401
        if (!isChatRequest && (error.status === 401 || error.status === 403)) {

          console.warn('Token expired or invalid. Logging out.');
          alert('Session expired. Please login again.')

          // clear session
          localStorage.clear();

          // redirect to login
          this.router.navigate(['/login']);
        }

        return throwError(() => error);
      })
    );
  }
}

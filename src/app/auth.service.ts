import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';


const GOOGLE_PHOTO =
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=240&q=80';
const INSTAGRAM_PHOTO =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // private userUrl = 'https://spring-boot-crud-3qhx.onrender.com/login/login';
  // private userUrl = 'http://localhost:8095/login/login';
  // private userUrl =
  // window.location.hostname === 'localhost'
  //   ? 'http://localhost:8095/vyro/login'
  //   : 'https://api.vyropool.info/vyro/login';
  
  private userUrl = `${environment.apiUrl}/login`;

  
 



  constructor(private http: HttpClient) { }

   private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.loggedInSubject.asObservable()

  login(username: string , password:string):Observable<any>{
    const payload = { username, password };
    
    console.log(this.userUrl);
    return this.http.post<any>(this.userUrl, { username, password }).pipe(
    
      
    );
  }

  
  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server error: ${error.status} - ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }

  setLoggedIn(status: boolean) {
    this.loggedInSubject.next(status);
  }

  
}

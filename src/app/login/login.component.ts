import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ImageLoaderService } from '../image-loader.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  logoUrl: string = '';
  loginError: string = '';
  loading: boolean = false;
  responseClass: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private imageLoader: ImageLoaderService,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.loading = false;
  }

  showPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmitLogin(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;

      this.loading = true;
     

      this.authService.login(email, password).subscribe(
        (response: { success: boolean; username: string; token: string; id: string; email: string; eemergencyEmail: string }) => {
          if (response.success) {
            console.log(response)

            // alert('Login Successful');
            localStorage.setItem('id', response.id);
            localStorage.setItem('driverId', response.id)
            localStorage.setItem('token', response.token);
            localStorage.setItem('email', response.email);
            localStorage.setItem('username', response.username);
            localStorage.setItem('emergencyEmail', response.eemergencyEmail)
            console.log(localStorage.getItem('emergencyEmail'));
            this.authService.setLoggedIn(true);


            console.log(email)
            this.router.navigate(['/home']);
            // this.showSuccessMessage();
          } else {
            this.loginError = 'Login failed. Please check your credentials.';
            console.log(this.loginError);
            this.showMessage(this.loginError, 'alert-danger');
          }
          this.loading = false;
        },
        (error: any) => {
          this.loading = false;
          if (error.status === 401) {
            this.loginError = 'Invalid email or password';
            this.showMessage(this.loginError, 'alert-danger');
          } else if (error.error) {
            this.loginError = error.error;
            this.showMessage(this.loginError, 'alert-danger');
          }
          console.error('Error occurred during login:', error);
        }

      );
    } else {
      console.log('Form is invalid');
      this.loginError = 'Please fill out the form correctly.';
    }
  }




  private showMessage(message: string, cssClass: string): void {
    this.loginError = message;
    this.responseClass = cssClass;

    setTimeout(() => {
      this.loginError = '';
    }, 5000); // Reduced from 40 seconds to 5 seconds
  }


  navigateToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  message = '';






  verifyPhone(): void {

  }

  verifyEmail(): void {


  }

  loginWith(provider: 'google' | 'instagram'): void {

  }

}

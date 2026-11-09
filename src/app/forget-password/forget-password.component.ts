import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.css']
})
export class ForgetPasswordComponent implements OnInit {
  email = '';
  otp = '';
  newPassword = '';
  message = '';
  step = 1;
  showPassword = false;
  loading: boolean = false;
  responseMessage: string | null = null;
  responseClass: string = '';


  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
    // Only loader should show for 2 seconds
    setTimeout(() => {
      this.loading = false;
    }, 20000);
  }

  private showMessage(message: string, cssClass: string): void {
    this.message = message;
    this.responseMessage = message;   // sets the text (e.g. “OTP sent successfully”)
    this.responseClass = cssClass;    // sets the alert color (Bootstrap class)
    setTimeout(() => {
      this.responseMessage = '';
      this.message = '';
    }, 5000);
  }
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  goBackToStep1(): void {
    this.step = 1;
    this.message = '';
    this.otp = '';
  }



  sendOtp(): void {


    if (!this.email) {
      this.showMessage('❌ Please enter a valid email address', 'alert-danger');
      return;
    }
    this.loading = true;
    console.log(this.email)
    this.http.post(`${environment.apiUrl}/send?email=${this.email}`, {}, { responseType: 'text' })
      .subscribe({
        next: (response: string) => {
          console.log(response)
          this.loading = false;

          this.showMessage(response, 'alert-success');
          this.message = response;   // OTP sent successfully...
          this.step = 2;
          // this.showMessage(`✅ OTP sent successfully to ${email}`, 'alert-success');
        },
        error: (error) => {
          console.error('Error sending OTP:', error);
          this.loading = false;
          this.showMessage('❌ Failed to send OTP.', 'alert-danger');
        }
      });
  }

  verifyOtp(): void {


    console.log(this.otp)
    console.log(this.email)

    if (!this.otp) {
      this.showMessage('❌ Please enter the OTP.', 'alert-danger');
      return;
    }

    this.http.post(`${environment.apiUrl}/verify`, null, {
      params: {
        email: this.email,
        otp: this.otp
      },
      responseType: 'text'   // 👈 This line fixes the issue
    })
      .subscribe({
        next: (response: string) => {

          console.log('Verify response:', response);

          if (response.includes('✅ OTP verified successfully')) {
            this.message = response;   // OTP sent successfully...
            this.step = 3;

            this.showMessage(response, 'alert-success');
          } else {
            this.showMessage(response, 'alert-danger');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error verifying OTP:', error);
          this.showMessage('❌ OTP verification failed. Please try again.', 'alert-danger');
          this.loading = false;
        }
      });
  }

  resetPassword() {
    this.loading = true;
    this.message = '';
    this.responseMessage = '';
    this.http.post(`${environment.apiUrl}/reset-password`, {
      email: this.email,
      otp: this.otp,
      newPassword: this.newPassword
    })
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res.success) {
            this.message = res.message;
            this.responseClass = 'alert-success';

            // Redirect after success
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 1500);
          } else {
            this.message = 'Something went wrong. Try again.';
            this.responseClass = 'alert-danger';
          }
        },
        error: () => {
          this.loading = false;
          this.message = 'Failed to reset password. Please try again.';
          this.responseClass = 'alert-danger';
        }
      });
  }
}

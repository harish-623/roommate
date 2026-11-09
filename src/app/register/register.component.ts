import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegisteService } from '../registe.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  userForm: FormGroup;
  responseMessage: string | null = null;
  responseClass: string = '';
  otpSent: boolean = false;
  otpVerified: boolean = false;
  loading: boolean = false;
  message: string = '';

  private baseUrl = `${environment.apiUrl}`;

  showPassword = false;

  constructor(private fb: FormBuilder, private http: HttpClient, private userService: RegisteService, private router: Router) {
    this.userForm = this.fb.group({
      // username: ['', [Validators.required]],
      gender: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phonenumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      age: ['', [Validators.required, Validators.min(18),Validators.max(100)]],
      fullname: ['', [Validators.required]],
      role: ['USER', [Validators.required]],
      otp: ['']   // <-- FIX


    });
  }

  onAgeInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  const digitsOnly = input.value.replace(/\D/g, '');

  this.userForm.get('age')?.setValue(digitsOnly, {
    emitEvent: false
  });
}

  ngOnInit() {
    
  }

  scrollToFirstInvalidControl(): void {
  const firstInvalidControl: HTMLElement | null =
    document.querySelector('.ng-invalid[formControlName]');

  if (firstInvalidControl) {
    firstInvalidControl.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    firstInvalidControl.focus();
  }
}

get submitDisabledReason(): string | null {

  if (this.userForm.invalid) {
    const invalidControls = Object.keys(this.userForm.controls)
      .filter(control => this.userForm.get(control)?.invalid);

    if (invalidControls.includes('fullname')) return 'Please enter your full name';
    if (invalidControls.includes('gender')) return 'Please select your gender';
    if (invalidControls.includes('phonenumber')) return 'Please enter a valid 10-digit phone number';
    if (invalidControls.includes('age')) return 'Please enter a valid age (18+)';
    if (invalidControls.includes('email')) return 'Please enter a valid email address';
    if (invalidControls.includes('password')) return 'Please enter a valid password';
    if (invalidControls.includes('otp')) return 'Please enter OTP';

    return 'Please fill all required fields correctly';
  }

  if (!this.otpVerified) {
    return 'Please verify your email using OTP';
  }

  return null; // ✅ form is ready
}



  onPhoneInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  const digitsOnly = input.value.replace(/\D/g, '');

  // update form control value
  this.userForm.get('phonenumber')?.setValue(digitsOnly, {
    emitEvent: false
  });
}


  private showMessage(message: string, cssClass: string): void {
    this.responseMessage = message;   // sets the text (e.g. “OTP sent successfully”)
    this.responseClass = cssClass;    // sets the alert color (Bootstrap class)
    setTimeout(() => (this.responseMessage = ''), 5000); // clears message after 5 sec
  }

  sendOtp(): void {
    const email = this.userForm.get('email')?.value;

    if (this.userForm.get('email')?.invalid) {
      this.userForm.get('email')?.markAsTouched();
      this.scrollToFirstInvalidControl();
      this.showMessage('Please enter a valid email address', 'alert-danger');
      return;
    }

    this.loading = true;

    this.http
      .post(`${this.baseUrl}/send?email=${email}`, {}, { responseType: 'text' })
      .subscribe({
        next: (response: string) => {
          this.loading = false;
          this.otpSent = true;
          this.showMessage(`${response}`, 'alert-success');
        },
        error: (error) => {
          this.loading = false;

          let errorMessage = 'Something went wrong';
          if (error?.status === 400 && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error?.status === 0) {
            errorMessage = 'Server is unreachable';
          }

          this.showMessage(`${errorMessage}`, 'alert-danger');
        }
      });
  }




  // Show password functionality removed - using HTML5 password field visual feedback only

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  goHome() {
    this.router.navigate(['/login']);
  }

  // verifyOtp(): void {
  //   const email = this.userForm.get('email')?.value;
  //     const otp = this.userForm.get('otp')?.value;
  //     console.log(otp)
  //     console.log(email)

  //     if (!otp) {
  //       this.showMessage('❌ Please enter the OTP.', 'alert-danger');
  //       return;
  //     }
  //     this.loading=true
  //     this.http.post(`${this.baseUrl}/verify`, null, { 
  //       params: { email, otp },
  //       responseType: 'text'   // 👈 This line fixes the issue
  //     })
  //     .subscribe({
  //       next: (response: string) => {

  //         console.log('Verify response:', response);

  //         if (response.includes('✅ OTP verified successfully')) {
  //           this.otpVerified = true;
  //           this.showMessage(response, 'alert-success');
  //         } else {
  //           this.showMessage(response, 'alert-danger');
  //         }
  //         this.loading = false;
  //       },
  //       error: (error) => {
  //         console.error('Error verifying OTP:', error);
  //         this.showMessage('❌ OTP verification failed. Please try again.', 'alert-danger');
  //         this.loading = false;
  //       }
  //     });
  //   }

  verifyOtp(): void {
    const email = this.userForm.get('email')?.value;
    const otp = this.userForm.get('otp')?.value;

    if (!otp) {
      this.userForm.get('otp')?.markAsTouched();
      this.showMessage('Please enter the OTP', 'alert-danger');
      return;
    }

    this.loading = true;

    this.http.post(`${this.baseUrl}/verify`, null, {
      params: { email, otp },
      responseType: 'text'
    })
      .subscribe({
        next: (response: string) => {
          this.loading = false;

          if (response.toLowerCase().includes('verified')) {
            this.otpVerified = true;
            this.showMessage(response, 'alert-success');
          } else {
            this.showMessage(response, 'alert-danger');
          }
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;

          const errorMessage =
            typeof error.error === 'string'
              ? error.error
              : 'Invalid OTP or OTP expired';

          this.showMessage(errorMessage, 'alert-danger');
        }
      });
  }


  onSubmit() {
    // Mark all fields as touched → shows validation errors in UI
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.scrollToFirstInvalidControl();
      return;
    }

    if (!this.otpVerified) {
      this.showMessage('Please verify your email using OTP', 'alert-warning');
      return;
    }

    this.loading = true
    if (this.userForm.valid) {
      this.userService.createUser(this.userForm.value).subscribe(
        (response: any) => {
          this.responseMessage = response;
          this.responseClass = 'alert-success';
          this.loading = false;
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },


        (error) => {
          if (error.error) {
            this.loading = false;
            this.responseMessage = "User Registration Failed" + error.error; // Backend error message: "User registration failed"
          } else {
            this.responseMessage = 'An unexpected error occurred. Please try again.';
            this.loading = false;
          }

          this.responseClass = 'alert-danger';
          this.loading = false;
        }
      );
    }
  }

}

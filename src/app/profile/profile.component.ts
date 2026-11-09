import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {


  user: any = {};
  noResultsMessage: string = '';
  selectedFile: File | null = null;
  userImageUrl: string = '';
  isEditable: boolean = false;
  loading: boolean = true;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
    // private profileService: ProfileService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const username = params['driverId'];
      const driverIdParam = localStorage.getItem("driverId")
      if (username) {
        console.log('Username received:', username);
        this.fetchUserProfile(username);
        // this.loadUserImage();


      } else {
        this.noResultsMessage = 'No username provided.';
      }
    });
  }

  goHome() {
    this.router.navigate(['/home']);
  }



  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      this.uploadImage();
    }
  }

  uploadImage() {

    if (!this.selectedFile) {
      alert('Please select an image first!');
      return;
    }

    const userId = localStorage.getItem('driverId');
    if (!userId) {
      alert("User ID missing — please login again.");
      return;
    }

    this.loading = true;

    const formData = new FormData();
    formData.append('image', this.selectedFile);

    this.http.post(`${environment.apiUrl}/user/${userId}/upload-image`, formData)
      .subscribe({
        next: (res: any) => {
          this.loading = false;


          this.showSuccess("✅ Image uploaded successfully!")

          // this.loadUserImage();  // refresh image from backend
        },
        error: (err) => {
          this.loading = false;
          console.error("❌ Error uploading image:", err);

          if (err.status === 413) {
            // alert("Image size too large. Please upload a smaller image.");
            this.showError("Image size too large. Please upload a smaller image.")
          } else {
            this.showError("Failed to upload image. Try again.");
          }
        }
      });
  }


  showSuccess(message: string) {
    this.toastMessage = message;
    this.toastType = 'success';
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  showError(message: string) {
    this.toastMessage = message;
    this.toastType = 'error';
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }


  // loadUserImage() {
  //   const userId = localStorage.getItem("driverId")



  //   const imgApi = `${environment.apiUrl}/user/${userId}/profile-image-base64`;

  //   this.http.get(imgApi, { responseType: 'text' }).subscribe({
  //     next: (dataUri) => {
  //       if (dataUri && dataUri.startsWith("data")) {
  //         this.user.imageUrl = dataUri;
  //         localStorage.setItem('imageUrl', this.user.imageUrl)  // set base64 image
  //       } else {
  //         this.user.imageUrl = 'assets/default-user.jpg'; // fallback
  //       }
  //     },
  //     error: (err) => {
  //       console.error("Image fetch error:", err);
  //       this.user.imageUrl = 'assets/default-user.jpg';
  //     }
  //   });
  // }




  enableEdit() {
    this.isEditable = true;
  }

  updateUser() {
    const userId = localStorage.getItem('driverId');
    const payload = {
      fullname: this.user.fullname,
      phonenumber: this.user.phonenumber,
      age: this.user.age,
      emergencyContact: this.user.emergencyContact,
      profileImage: this.user.profileImage
    };
    const apiUrl = `${environment.apiUrl}/update/${userId}`;
    this.http.put(apiUrl, payload)
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.showSuccess('Profile updated successfully.');
          this.isEditable = false;
          const username = "";
          this.fetchUserProfile(username);
        },
        error: (err) => {
          console.error("Update failed:", err);
          // alert("Failed to update profile.");
          this.showError("Failed to update profile.")
          this.loading = false;
        }
      });



  }




  fetchUserProfile(id: string): void {
    const apiUrl = `${environment.apiUrl}/profileRetrive?id=${id}`;
    console.log(apiUrl)



    this.http.get<any[]>(apiUrl).subscribe(
      (response) => {
        console.log('API Response:', response);

        if (response && response.length > 0) {
          const data = response[0];
          this.noResultsMessage = '';
          console.log('User profile:', this.user);
          this.user = {
            name: data.username,
            age: data.age,
            phone: data.phonenumber,
            fullname: data.fullname,
            email: data.email,
            emergencyContact: data.emergencyContact,


            // fullname=data.fullname,
            imageUrl: 'assets/default-user.jpg',
            description: 'Passionate traveler and ride enthusiast!',
            ridesBooked: 12,
            ridesTraveled: 9
          };

        } else {
          this.user = null;
          this.noResultsMessage = 'No profile found for this user.';
        }
      },
      (error) => {
        console.error('Error fetching user profile:', error);
        this.noResultsMessage = 'Error fetching user profile.';
      }
    );
  }

}

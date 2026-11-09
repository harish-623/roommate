import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomepageComponent } from './homepage/homepage.component';
import { RegisterComponent } from './register/register.component';

import { ProfileComponent } from './profile/profile.component';
import { ForgetPasswordComponent } from './forget-password/forget-password.component';
import { HelpCenterComponent } from './help-center/help-center.component';
import { TrustSafetyComponent } from './trust-safety/trust-safety.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { AboutComponent } from './about/about.component';
import { SafetyComponent } from './safety/safety.component';
import { SupportChatComponent } from './support-chat/support-chat.component';



const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomepageComponent },
  {path: 'register',component:RegisterComponent},
  {path:'profile',component:ProfileComponent},
  {path:'forgot-password',component:ForgetPasswordComponent},
  {path:'help-center',component:HelpCenterComponent},
  {path:'trust-safety',component:TrustSafetyComponent},
  {path:'contact-us',component:ContactUsComponent},
  {path:'support-chat', component: SupportChatComponent},
  {path:'about',component:AboutComponent},
  {path:'safety',component:SafetyComponent}
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

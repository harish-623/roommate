import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../auth.service';
import { HomepageComponent } from './homepage.component';

describe('HomepageComponent', () => {
  const storageKey = 'roommate-dashboard:test-user';

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('id', 'test-user');
    localStorage.setItem('token', 'test-token');

    await TestBed.configureTestingModule({
      declarations: [HomepageComponent],
      imports: [CommonModule, FormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: { setLoggedIn: jasmine.createSpy('setLoggedIn') } }
      ]
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create and show the household overview', () => {
    const fixture = TestBed.createComponent(HomepageComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('HOUSEHOLD OVERVIEW');
  });

  it('should save expenses and payment status in browser storage', () => {
    const fixture = TestBed.createComponent(HomepageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.draft.description = 'Weekly groceries';
    component.draft.category = 'Groceries';
    component.draft.amount = 1200;
    component.draft.date = component.today;
    component.draft.paidBy = 'roommate-1';
    component.addExpense();

    expect(component.totalForMonth).toBe(1200);
    expect(component.perPerson).toBe(300);
    component.togglePaid('roommate-1');

    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    expect(saved.expenses).toHaveSize(1);
    expect(saved.payments[component.selectedMonth]).toContain('roommate-1');
  });
});

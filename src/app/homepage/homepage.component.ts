import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

interface Roommate {
  id: string;
  name: string;
  email: string;
}

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  paidBy: string;
}

interface HouseholdData {
  roommates: Roommate[];
  expenses: Expense[];
  payments: Record<string, string[]>;
}

interface CategorySummary {
  name: string;
  amount: number;
  percent: number;
  icon: string;
  css: string;
}

interface UserSession {
  id: string;
  email: string;
}

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  readonly categories = ['Rent', 'Groceries', 'Utilities', 'Internet', 'Household', 'Other'];
  readonly categoryIcons: Record<string, string> = {
    Rent: '⌂',
    Groceries: '＋',
    Utilities: 'ϟ',
    Internet: '⌁',
    Household: '▦',
    Other: '•'
  };
  readonly yearOptions = Array.from(
    { length: 5 },
    (_, index) => new Date().getFullYear() - 2 + index
  );

  user: UserSession | null = null;
  data: HouseholdData = this.createDefaultData();
  activeTab: 'overview' | 'history' | 'roommates' = 'overview';
  selectedMonth = this.currentMonth();
  year = new Date().getFullYear();
  showExpenseForm = false;
  busy = false;
  loading = true;
  notice = '';
  noticeType: 'success' | 'error' = 'success';
  draft: Omit<Expense, 'id'> = this.createEmptyDraft();

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const userId = localStorage.getItem('id');
    const token = localStorage.getItem('token');

    if (!userId || !token) {
      this.loading = false;
      this.router.navigate(['/login']);
      return;
    }

    this.user = {
      id: userId,
      email: localStorage.getItem('email') || localStorage.getItem('username') || 'Household member'
    };
    this.loadData();
    this.resetDraft();
    this.loading = false;
  }

  get firstName(): string {
    const name = this.user?.email.split('@')[0] || 'there';
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  get monthLabel(): string {
    const [year, month] = this.selectedMonth.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric'
    });
  }

  get monthExpenses(): Expense[] {
    return this.data.expenses
      .filter(expense => expense.date.startsWith(this.selectedMonth))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  get recentExpenses(): Expense[] {
    return this.monthExpenses.slice(0, 5);
  }

  get totalForMonth(): number {
    return this.monthExpenses.reduce((total, expense) => total + expense.amount, 0);
  }

  get perPerson(): number {
    return this.totalForMonth / this.data.roommates.length;
  }

  get paidRoommateIds(): string[] {
    return this.data.payments[this.selectedMonth] || [];
  }

  get paidCount(): number {
    return this.paidRoommateIds.length;
  }

  get paidTotal(): number {
    return this.perPerson * this.paidCount;
  }

  get pendingTotal(): number {
    return this.perPerson * (this.data.roommates.length - this.paidCount);
  }

  get paidPercent(): number {
    return this.data.roommates.length ? this.paidCount / this.data.roommates.length * 100 : 0;
  }

  get categoryBreakdown(): CategorySummary[] {
    return this.categories
      .map((name, index) => {
        const amount = this.monthExpenses
          .filter(expense => expense.category === name)
          .reduce((total, expense) => total + expense.amount, 0);
        return {
          name,
          amount,
          percent: this.totalForMonth ? amount / this.totalForMonth * 100 : 0,
          icon: this.categoryIcons[name],
          css: `category-${index + 1}`
        };
      })
      .filter(category => category.amount > 0);
  }

  get yearExpenses(): Expense[] {
    return this.data.expenses
      .filter(expense => Number(expense.date.slice(0, 4)) === this.year)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  get yearTotal(): number {
    return this.yearExpenses.reduce((total, expense) => total + expense.amount, 0);
  }

  get monthlyTotals(): { label: string; amount: number; percent: number }[] {
    const maxTotal = Math.max(
      0,
      ...Array.from({ length: 12 }, (_, month) => this.monthTotalForYear(month))
    );

    return Array.from({ length: 12 }, (_, month) => {
      const amount = this.monthTotalForYear(month);
      return {
        label: new Date(this.year, month, 1).toLocaleDateString(undefined, { month: 'short' }),
        amount,
        percent: maxTotal ? amount / maxTotal * 100 : 0
      };
    });
  }

  get today(): string {
    return this.localDateString(new Date());
  }

  refreshView(): void {
    this.year = Number(this.selectedMonth.slice(0, 4));
  }

  focusAdd(): void {
    this.activeTab = 'overview';
    this.showExpenseForm = true;
    window.setTimeout(() => document.getElementById('add-expense')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    }));
  }

  addExpense(): void {
    const description = this.draft.description.trim();
    const amount = Number(this.draft.amount);

    if (!description || !Number.isFinite(amount) || amount <= 0 || !this.draft.date || !this.draft.paidBy) {
      this.showNotice('Enter a description, a valid amount, date, and roommate.', 'error');
      return;
    }

    if (!this.data.roommates.some(roommate => roommate.id === this.draft.paidBy)) {
      this.showNotice('Choose a roommate from this household.', 'error');
      return;
    }

    this.data.expenses.unshift({
      ...this.draft,
      id: this.createId(),
      description,
      amount
    });
    this.saveData('Expense added.');
    this.showExpenseForm = false;
    this.resetDraft();
  }

  togglePaid(roommateId: string): void {
    const paid = new Set(this.paidRoommateIds);
    if (paid.has(roommateId)) {
      paid.delete(roommateId);
    } else {
      paid.add(roommateId);
    }

    this.data.payments[this.selectedMonth] = Array.from(paid);
    this.saveData('Payment status updated.');
  }

  isPaid(roommateId: string): boolean {
    return this.paidRoommateIds.includes(roommateId);
  }

  saveNames(): void {
    if (this.data.roommates.some(roommate => !roommate.name.trim())) {
      this.showNotice('Each roommate needs a name.', 'error');
      return;
    }

    for (const roommate of this.data.roommates) {
      roommate.name = roommate.name.trim();
      roommate.email = roommate.email.trim();
    }
    this.saveData('Roommate details saved.');
  }

  roommateName(roommateId: string): string {
    return this.data.roommates.find(roommate => roommate.id === roommateId)?.name || 'Unknown roommate';
  }

  initials(name: string): string {
    return name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('') || '?';
  }

  avatarClass(roommateId: string): string {
    const index = this.data.roommates.findIndex(roommate => roommate.id === roommateId);
    return `avatar-${Math.max(index, 0) % 4 + 1}`;
  }

  categoryCss(category: string): string {
    const index = this.categories.indexOf(category);
    return `category-${index < 0 ? this.categories.length : index + 1}`;
  }

  exportExcel(): void {
    const rows = [
      ['Description', 'Category', 'Amount', 'Date', 'Paid By'],
      ...this.data.expenses.map(expense => [
        expense.description,
        expense.category,
        String(expense.amount),
        expense.date,
        this.roommateName(expense.paidBy)
      ])
    ];
    const csv = rows.map(row => row.map(value => this.csvCell(value)).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `roommate-expenses-${this.today}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.showNotice('Excel-compatible CSV downloaded.', 'success');
  }

  importExcel(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    file.text().then(text => {
      const imported = this.parseExpenseCsv(text);
      if (!imported.length) {
        this.showNotice('The CSV has no valid expense rows to import.', 'error');
        return;
      }

      this.data.expenses.push(...imported);
      this.saveData(`${imported.length} expense${imported.length === 1 ? '' : 's'} imported.`);
    }).catch(error => {
      console.error('Unable to read expense CSV:', error);
      this.showNotice(
        error instanceof Error ? error.message : 'The selected file could not be read.',
        'error'
      );
    }).finally(() => {
      input.value = '';
    });
  }

  logout(): void {
    for (const key of ['id', 'driverId', 'token', 'username', 'email', 'emergencyEmail']) {
      localStorage.removeItem(key);
    }
    this.authService.setLoggedIn(false);
    this.router.navigate(['/login']);
  }

  showNotice(message: string, type: 'success' | 'error'): void {
    this.notice = message;
    this.noticeType = type;
  }

  private loadData(): void {
    if (!this.user) return;
    const key = this.storageKey(this.user.id);

    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        this.data = this.createDefaultData();
        return;
      }

      const parsed: unknown = JSON.parse(stored);
      if (!this.isHouseholdData(parsed)) {
        throw new Error('Stored household data has an invalid format.');
      }
      this.data = parsed;
    } catch (error) {
      console.error('Unable to load household data:', error);
      this.data = this.createDefaultData();
      this.showNotice('Saved household data could not be read. Changes may replace it.', 'error');
    }
  }

  private saveData(successMessage: string): void {
    if (!this.user) return;
    try {
      localStorage.setItem(this.storageKey(this.user.id), JSON.stringify(this.data));
      this.showNotice(successMessage, 'success');
    } catch (error) {
      console.error('Unable to save household data:', error);
      this.showNotice('Changes are not saved. Browser storage may be unavailable or full.', 'error');
    }
  }

  private storageKey(userId: string): string {
    return `roommate-dashboard:${encodeURIComponent(userId)}`;
  }

  private isHouseholdData(value: unknown): value is HouseholdData {
    if (!value || typeof value !== 'object') return false;
    const data = value as Partial<HouseholdData>;
    return Array.isArray(data.roommates)
      && data.roommates.length === 4
      && data.roommates.every(roommate =>
        typeof roommate?.id === 'string'
        && typeof roommate.name === 'string'
        && typeof roommate.email === 'string'
      )
      && Array.isArray(data.expenses)
      && data.expenses.every(expense =>
        typeof expense?.id === 'string'
        && typeof expense.description === 'string'
        && typeof expense.category === 'string'
        && typeof expense.amount === 'number'
        && Number.isFinite(expense.amount)
        && typeof expense.date === 'string'
        && typeof expense.paidBy === 'string'
      )
      && !!data.payments
      && typeof data.payments === 'object'
      && Object.values(data.payments).every(ids =>
        Array.isArray(ids) && ids.every(id => typeof id === 'string')
      );
  }

  private createDefaultData(): HouseholdData {
    return {
      roommates: [
        { id: 'roommate-1', name: 'Roommate 1', email: '' },
        { id: 'roommate-2', name: 'Roommate 2', email: '' },
        { id: 'roommate-3', name: 'Roommate 3', email: '' },
        { id: 'roommate-4', name: 'Roommate 4', email: '' }
      ],
      expenses: [],
      payments: {}
    };
  }

  private createEmptyDraft(): Omit<Expense, 'id'> {
    return {
      description: '',
      category: this.categories[0],
      amount: 0,
      date: this.localDateString(new Date()),
      paidBy: 'roommate-1'
    };
  }

  private resetDraft(): void {
    this.draft = this.createEmptyDraft();
    this.draft.paidBy = this.data.roommates[0]?.id || '';
  }

  private currentMonth(): string {
    return this.localDateString(new Date()).slice(0, 7);
  }

  private localDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private monthTotalForYear(month: number): number {
    const prefix = `${this.year}-${String(month + 1).padStart(2, '0')}`;
    return this.data.expenses
      .filter(expense => expense.date.startsWith(prefix))
      .reduce((total, expense) => total + expense.amount, 0);
  }

  private createId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private csvCell(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }

  private parseExpenseCsv(text: string): Expense[] {
    const rows = this.parseCsvRows(text.replace(/^\uFEFF/, ''));
    if (rows.length < 2) return [];

    const headers = rows[0].map(header => header.trim().toLowerCase().replace(/[\s_-]+/g, ''));
    const column = (names: string[]) => headers.findIndex(header => names.includes(header));
    const descriptionIndex = column(['description', 'expense']);
    const categoryIndex = column(['category']);
    const amountIndex = column(['amount', 'total']);
    const dateIndex = column(['date']);
    const paidByIndex = column(['paidby', 'roommate', 'member']);

    if ([descriptionIndex, categoryIndex, amountIndex, dateIndex].some(index => index < 0)) {
      throw new Error('CSV must include Description, Category, Amount, and Date columns.');
    }

    const names = new Map(this.data.roommates.map(roommate => [roommate.name.toLowerCase(), roommate.id]));
    return rows.slice(1).flatMap(row => {
      const description = row[descriptionIndex]?.trim();
      const categoryInput = row[categoryIndex]?.trim();
      const amount = Number(row[amountIndex]);
      const date = row[dateIndex]?.trim();
      const paidByName = paidByIndex < 0 ? '' : row[paidByIndex]?.trim().toLowerCase();
      const category = this.categories.find(item => item.toLowerCase() === categoryInput?.toLowerCase());
      const paidBy = names.get(paidByName) || this.data.roommates[0].id;

      if (!description || !category || !Number.isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
        return [];
      }

      return [{
        id: this.createId(),
        description,
        category,
        amount,
        date,
        paidBy
      }];
    });
  }

  private parseCsvRows(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let quoted = false;

    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (character === '"' && quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === ',' && !quoted) {
        row.push(cell);
        cell = '';
      } else if ((character === '\n' || character === '\r') && !quoted) {
        if (character === '\r' && text[index + 1] === '\n') index += 1;
        row.push(cell);
        if (row.some(value => value.trim())) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += character;
      }
    }

    if (quoted) throw new Error('CSV contains an unclosed quoted field.');
    if (cell || row.length) {
      row.push(cell);
      if (row.some(value => value.trim())) rows.push(row);
    }
    return rows;
  }
}

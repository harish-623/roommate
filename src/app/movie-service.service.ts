import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MovieServiceService {
  getMovieByTitle(title: string) {
    throw new Error('Method not implemented.');
  }

  constructor() { }
}

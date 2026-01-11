import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  // Tracks the number of active requests to handle concurrent calls
  private activeRequests = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);

  get isLoading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  // Call when a request starts
  start(): void {
    this.activeRequests++;
    if (this.activeRequests === 1) {
      this.loadingSubject.next(true);
    }
  }

  // Call when a request finishes
  stop(): void {
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }
    if (this.activeRequests === 0) {
      this.loadingSubject.next(false);
    }
  }

  // Optional: force hide (e.g., on navigation cancel)
  reset(): void {
    this.activeRequests = 0;
    this.loadingSubject.next(false);
  }
}


import { Component, OnInit } from '@angular/core';
import { CalendarEvent, CalendarView } from 'angular-calendar';
import { FormGroup, FormControl } from '@angular/forms';
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl()
  });
  selectedRanges: {start: Date, end: Date}[] = [];
  last180Days: Date[] = [];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.range.valueChanges.subscribe(() => this.onDateRangeSelected());

    this.route.queryParams.subscribe(params => {
      if (params['ranges'] && this.selectedRanges?.length == 0) {
        this.selectedRanges = JSON.parse(params['ranges']).map((range: any) => ({
          start: new Date(range.start),
          end: new Date(range.end)
        }));
      }
    });

    // Generate the last 270 days and the next 90 days
    for (let i = -30; i < 210; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      this.last180Days.push(date);
    }
  }

  get minDate(): Date {
    const min = new Date();
    min.setDate(min.getDate() - 180);
    return min;
  }

  get maxDate(): Date{
    return new Date;
  }

  isDateInSelectedRanges(date: Date): boolean {
    return this.selectedRanges.some(range => {
      return date >= range.start && date <= range.end;
    });
  }

  onDateRangeSelected() {
    const startDate = this.range.get('start')?.value;
    const endDate = this.range.get('end')?.value;
    if (startDate && endDate) {
      // Convert local dates to UTC
      const startUTC = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
      const endUTC = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));
      this.selectedRanges = [...this.selectedRanges, {start: startUTC, end: endUTC}];
      this.range.reset();
      this.updateUrl(); // Update the URL when selectedRanges changes
    }
  }

  removeRange(index: number) {
    this.selectedRanges.splice(index, 1);
    this.selectedRanges = [...this.selectedRanges]; // Trigger change detection
    this.updateUrl(); // Update the URL when selectedRanges changes
  }

  updateUrl() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {ranges: JSON.stringify(this.selectedRanges)},
      queryParamsHandling: 'merge'
    });
  }

  dateDifferenceInDays(start: Date, end: Date): number {
    const startDate = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
    const endDate = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const differenceInDays = (endDate.getTime() - startDate.getTime()) / millisecondsPerDay;
    return Math.round(Math.abs(differenceInDays));
  }

  get totalDateDifference(): number {
    return this.selectedRanges.reduce((sum, range) => {
      const startDate = new Date(range.start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(range.end);
      endDate.setHours(0, 0, 0, 0);
      const difference = Math.round(Math.abs((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      return sum + difference;
    }, 0);
  }

  getColorBasedOnMonth(date: Date): string {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - 180);

    if (date < pastDate || date > today) {
      // If the date is 90 days further in the past or 90 days further in the future, return a light gray color
      return `rgb(211, 211, 211)`;
    } else if (this.isDateInSelectedRanges(date)) {
      // If the date is in a selected range, return a shade of red
      return `rgb(255, 0, 0)`;
    } else if(this.isToday(date) || this.is180DaysAgo(date)) {
      return `rgb(255, 255, 0)`
    } else {
      // If the date is not in a selected range and within the last 180 days, return a shade of green
      return `rgb(0, 255, 0)`;
    }
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  is180DaysAgo(date: Date): boolean {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 180);
    return date.getDate() === pastDate.getDate() &&
      date.getMonth() === pastDate.getMonth() &&
      date.getFullYear() === pastDate.getFullYear();
  }
}

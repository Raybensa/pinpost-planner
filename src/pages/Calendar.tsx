
import React from 'react';
import { CalendarView } from '@/components/calendar/CalendarView';

const Calendar = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold">Calendar</h1>
      <p className="text-muted-foreground">
        View and manage your scheduled Pinterest posts in a calendar format
      </p>
      
      <CalendarView />
    </div>
  );
};

export default Calendar;

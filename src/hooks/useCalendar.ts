import { useState } from 'react';
import { subDays, isSameDay, format } from 'date-fns';
import { CustomEvent } from '../App';

export const useCalendar = (
  scores: any[], 
  events: CustomEvent[], 
  addEvent: (event: Omit<CustomEvent, 'user_id' | 'id'>) => Promise<void>,
  deleteEvent: (id: number) => Promise<void>
) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (event: { title: string; type: CustomEvent['type']; color?: string }) => {
    if (selectedDate) {
      await addEvent({ ...event, date: format(selectedDate, 'yyyy-MM-dd') });
      setIsEventModalOpen(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    await deleteEvent(id);
  };

  const calendarDays = Array.from({ length: 30 }).map((_, i) => {
    const date = subDays(new Date(), 15 - i);
    const isToday = isSameDay(date, new Date());
    const hasActivity = scores.some(s => isSameDay(new Date(s.created_at), date));
    const dateString = format(date, 'yyyy-MM-dd');
    const dayEvents = events.filter(e => e.date === dateString);
    const hasEvent = dayEvents.length > 0;
    const eventColor = dayEvents[0]?.color;

    return { date, isToday, hasActivity, hasEvent, eventColor, dayEvents };
  });

  return {
    selectedDate,
    isEventModalOpen,
    setIsEventModalOpen,
    handleDateClick,
    handleSaveEvent,
    handleDeleteEvent,
    calendarDays,
  };
};

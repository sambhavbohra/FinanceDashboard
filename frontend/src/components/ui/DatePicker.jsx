import React from 'react';
import ReactDatePicker from 'react-datepicker';
import { CalendarDays } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

export default function DatePicker({ selected, onChange, label, minDate, maxDate, placeholderText }) {
  return (
    <div className="relative">
      {label && <label className="block text-xs text-muted mb-1.5">{label}</label>}
      <div className="relative">
        <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10" />
        <ReactDatePicker
          selected={selected}
          onChange={onChange}
          minDate={minDate}
          maxDate={maxDate}
          placeholderText={placeholderText || 'Select date'}
          dateFormat="dd MMM yyyy"
          className="w-full bg-secondary border border-white/10 rounded-xl py-3 pl-9 pr-4 text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 cursor-pointer"
          calendarClassName="fintrack-calendar"
          wrapperClassName="w-full"
          showPopperArrow={false}
        />
      </div>

      <style>{`
        .fintrack-calendar {
          background: #1C1C1E !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 16px !important;
          box-shadow: 0 25px 50px rgba(0,0,0,0.5) !important;
          font-family: 'Inter', sans-serif !important;
          padding: 8px !important;
          color: white !important;
        }
        .fintrack-calendar .react-datepicker__header {
          background: transparent !important;
          border-bottom: 1px solid rgba(255,255,255,0.05) !important;
          padding-bottom: 8px !important;
        }
        .fintrack-calendar .react-datepicker__current-month {
          color: white !important;
          font-weight: 600 !important;
          font-size: 14px !important;
        }
        .fintrack-calendar .react-datepicker__day-name {
          color: #9CA3AF !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          font-weight: 500 !important;
        }
        .fintrack-calendar .react-datepicker__day {
          color: #E5E7EB !important;
          border-radius: 10px !important;
          transition: all 0.15s !important;
          font-size: 13px !important;
        }
        .fintrack-calendar .react-datepicker__day:hover {
          background: rgba(226,254,116,0.15) !important;
          color: #E2FE74 !important;
        }
        .fintrack-calendar .react-datepicker__day--selected {
          background: #E2FE74 !important;
          color: #141414 !important;
          font-weight: 700 !important;
        }
        .fintrack-calendar .react-datepicker__day--today {
          font-weight: 700 !important;
          color: #E2FE74 !important;
        }
        .fintrack-calendar .react-datepicker__day--today.react-datepicker__day--selected {
          color: #141414 !important;
        }
        .fintrack-calendar .react-datepicker__day--outside-month {
          color: rgba(255,255,255,0.2) !important;
        }
        .fintrack-calendar .react-datepicker__day--disabled {
          color: rgba(255,255,255,0.15) !important;
          cursor: not-allowed !important;
        }
        .fintrack-calendar .react-datepicker__navigation-icon::before {
          border-color: #9CA3AF !important;
        }
        .fintrack-calendar .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: #E2FE74 !important;
        }
        .fintrack-calendar .react-datepicker__triangle {
          display: none !important;
        }
        .react-datepicker-popper {
          z-index: 100 !important;
        }
      `}</style>
    </div>
  );
}

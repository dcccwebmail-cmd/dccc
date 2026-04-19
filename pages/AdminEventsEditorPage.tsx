import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { useData } from '../contexts/DataContext';
import { Event } from '../types';
import AdminEditModal from '../components/admin/AdminEditModal';
import FormInput from '../components/admin/FormInput';
import RichTextEditor from '../components/admin/RichTextEditor';
import { useToast } from '../contexts/ToastContext';

/**
 * Converts a UTC ISO string (from Firestore) to a 'YYYY-MM-DDTHH:mm' string 
 * formatted for the Bangladesh (Asia/Dhaka) timezone. This is required for 
 * correctly populating the `<input type="datetime-local">` field, which expects 
 * the user's local time.
 * @param utcIsoString The UTC date string from the database.
 * @returns A string formatted for a datetime-local input field in BDT.
 */
const utcToBdtInput = (utcIsoString: string): string => {
    if (!utcIsoString) return '';
    try {
        const date = new Date(utcIsoString);
        // Using Intl.DateTimeFormat is a reliable way to format for a specific timezone.
        // The 'en-CA' locale provides the YYYY-MM-DD format, which is part of what we need.
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Dhaka',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false, // Use 24-hour format
        });
        
        const parts = formatter.formatToParts(date);
        const find = (type: string) => parts.find(p => p.type === type)?.value;
        const year = find('year');
        const month = find('month');
        const day = find('day');
        // The hour can sometimes be '24', which is invalid for inputs; it should be '00'.
        const hour = find('hour') === '24' ? '00' : find('hour');
        const minute = find('minute');
        
        return `${year}-${month}-${day}T${hour}:${minute}`;
    } catch (e) {
        console.error("Error converting UTC to BDT input string:", e);
        return '';
    }
};

/**
 * Converts a 'YYYY-MM-DDTHH:mm' string from a datetime-local input (assumed to be in BDT)
 * back to a standard UTC ISO string for storage in Firestore.
 * @param bdtInputString The date string from the input field.
 * @returns A UTC ISO formatted date string.
 */
const bdtInputToUtc = (bdtInputString: string): string => {
    if (!bdtInputString) return '';
    // Append the BDT timezone offset (+06:00) to the string. This tells the Date constructor
    // how to interpret the time correctly before converting it to the standard UTC ISO format.
    return new Date(`${bdtInputString}:00+06:00`).toISOString();
};

// Generates a user-friendly display date string from start and end UTC ISO dates.
const generateDisplayDate = (startDateIso: string, endDateIso: string): string => {
    if (!startDateIso || !endDateIso) return '';

    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };

    const startDate = new Date(startDateIso);
    const endDate = new Date(endDateIso);
    
    // Use reduce to create an object from the parts array for easier access
    const toPartsObject = (date: Date) => new Intl.DateTimeFormat('en-US', options)
        .formatToParts(date)
        .reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {} as Record<Intl.DateTimeFormatPartTypes, string>);

    const start = toPartsObject(startDate);
    const end = toPartsObject(endDate);

    if (start.year !== end.year) {
        // e.g., "December 30, 2024 - January 2, 2025"
        return `${start.month} ${start.day}, ${start.year} - ${end.month} ${end.day}, ${end.year}`;
    }
    if (start.month !== end.month) {
        // e.g., "November 30 - December 2, 2024"
        return `${start.month} ${start.day} - ${end.month} ${end.day}, ${start.year}`;
    }
    if (start.day !== end.day) {
        // e.g., "October 26-28, 2024"
        return `${start.month} ${start.day}-${end.day}, ${start.year}`;
    }
    // Single day event, e.g., "October 26, 2024"
    return `${start.month} ${start.day}, ${start.year}`;
};


interface AdminEventsEditorPageProps {
  onLogout: () => void;
}

type EventErrors = Partial<Record<keyof Event, string>> & { date_logic?: string };

const AdminEventsEditorPage: React.FC<AdminEventsEditorPageProps> = ({ onLogout }) => {
  const { data, updateData, loading } = useData();
  const [events, setEvents] = useState<Event[]>(data?.events || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [errors, setErrors] = useState<EventErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (data) {
      setEvents(data.events);
    }
  }, [data]);
  
  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingEvent) return;
    const { name, value } = e.target;
    
    if (name === 'start_date' || name === 'end_date') {
        const utcValue = bdtInputToUtc(value);
        setEditingEvent({ ...editingEvent, [name]: utcValue });
    } else {
        setEditingEvent({ ...editingEvent, [name]: value });
    }
  };
  
  const handleDescriptionChange = (value: string) => {
    if (!editingEvent) return;
    setEditingEvent({ ...editingEvent, description: value });
  };


  const openModal = (event: Event | null) => {
    setErrors({});
    setEditingEvent(event ? { ...event } : {
      id: '',
      title: '',
      description: '',
      display_date: '',
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      banner_url: '',
      segments: [],
      status: 'upcoming',
      more_buttons: [],
      stats: { attendees: '0', competitions: 0, days: 1 }
    });
    setIsModalOpen(true);
  };

  const validate = (): boolean => {
    if (!editingEvent) return false;
    const newErrors: EventErrors = {};
    if (!editingEvent.id.trim()) {
      newErrors.id = "ID is required.";
    } else if (!/^[a-z0-9-]+$/.test(editingEvent.id)) {
      newErrors.id = "ID must be lowercase with no spaces (hyphens allowed).";
    }
    if (!editingEvent.title.trim()) newErrors.title = "Title is required.";
    if (!editingEvent.start_date) newErrors.start_date = "Start date is required.";
    if (!editingEvent.venue?.trim()) newErrors.venue = "Venue is required.";

    const startDate = new Date(editingEvent.start_date);
    const endDate = new Date(editingEvent.end_date);

    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      if (endDate < startDate) {
        newErrors.date_logic = "End date cannot be before the start date.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSave = async () => {
    if (!editingEvent || !validate()) return;
    
    // Auto-generate display date and set status
    editingEvent.display_date = generateDisplayDate(editingEvent.start_date, editingEvent.end_date);
    const endDate = new Date(editingEvent.end_date);
    editingEvent.status = endDate < new Date() ? 'past' : 'upcoming';

    const newEvents = events.some(e => e.id === editingEvent.id)
      ? events.map(e => (e.id === editingEvent.id ? editingEvent : e))
      : [...events, editingEvent];
    
    setIsSaving(true);
    await updateData({ events: newEvents });
    setIsSaving(false);
    showToast('Event saved successfully!');
    
    setIsModalOpen(false);
    setEditingEvent(null);
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
        const newEvents = events.filter(e => e.id !== id);
        setIsSaving(true);
        await updateData({ events: newEvents });
        setIsSaving(false);
        showToast('Event deleted.');
    }
  };

  const handleSegmentChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingEvent) return;
    const { name, value } = e.target;
    const newSegments = [...editingEvent.segments];
    const currentSegment = { ...newSegments[index] };

    if (name === 'name') {
        currentSegment.name = value;
    } else {
        currentSegment.winners = { ...currentSegment.winners, [name]: value };
    }
    newSegments[index] = currentSegment;
    setEditingEvent({ ...editingEvent, segments: newSegments });
  };
  
  const addSegment = () => {
    if (!editingEvent) return;
    setEditingEvent({ ...editingEvent, segments: [...editingEvent.segments, { name: '', winners: {} }] });
  };
  
  const removeSegment = (index: number) => {
    if (!editingEvent) return;
    setEditingEvent({ ...editingEvent, segments: editingEvent.segments.filter((_, i) => i !== index) });
  };

  const addButton = () => {
    if (!editingEvent) return;
    setEditingEvent({ ...editingEvent, more_buttons: [...(editingEvent.more_buttons || []), { text: '', link: '' }] });
  };

  const removeButton = (index: number) => {
      if (!editingEvent) return;
      setEditingEvent({ ...editingEvent, more_buttons: editingEvent.more_buttons?.filter((_, i) => i !== index) });
  };

  const handleButtonChange = (index: number, field: 'text' | 'link', value: string) => {
      if (!editingEvent?.more_buttons) return;
      const newButtons = [...editingEvent.more_buttons];
      newButtons[index] = { ...newButtons[index], [field]: value };
      setEditingEvent({ ...editingEvent, more_buttons: newButtons });
  };


  if (loading) {
    return <AdminLayout onLogout={onLogout}><p>Loading events...</p></AdminLayout>;
  }

  return (
    <AdminLayout onLogout={onLogout}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Events</h1>
        <button onClick={() => openModal(null)} className="px-4 py-2 bg-accent text-accent-text font-bold rounded-md hover:bg-accent-hover transition-colors">
          + Add Event
        </button>
      </div>

      <div className="bg-card-bg p-4 rounded-lg border border-border-color">
        <div className="space-y-2">
            {events.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()).map(event => (
              <div key={event.id} className="border border-border-color rounded-md p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex-grow">
                  <h3 className="font-bold">{event.title} <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${event.status === 'upcoming' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{event.status}</span></h3>
                  <p className="text-sm text-text-secondary">{event.display_date}</p>
                </div>
                <div className="flex gap-2 self-end sm:self-auto">
                  <button onClick={() => openModal(event)} className="text-sm bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600">Edit</button>
                  <button onClick={() => handleDelete(event.id)} className="text-sm bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">Delete</button>
                </div>
              </div>
            ))}
        </div>
      </div>
      
      {isSaving && <p className="mt-4 text-center text-text-secondary">Saving changes...</p>}

      <AdminEditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} title={!editingEvent?.title ? 'Add Event' : 'Edit Event'}>
        {editingEvent && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <FormInput label="ID (unique, lowercase, no spaces)" name="id" value={editingEvent.id} onChange={handleModalChange} required error={errors.id} />
            <FormInput label="Title" name="title" value={editingEvent.title} onChange={handleModalChange} required error={errors.title} />
            <RichTextEditor
                label="Description"
                value={editingEvent.description}
                onChange={handleDescriptionChange}
            />
            <FormInput label="Start Date/Time (GMT+6)" name="start_date" type="datetime-local" value={utcToBdtInput(editingEvent.start_date)} onChange={handleModalChange} required error={errors.start_date} />
            <FormInput label="End Date/Time (GMT+6)" name="end_date" type="datetime-local" value={utcToBdtInput(editingEvent.end_date)} onChange={handleModalChange} error={errors.end_date} />
            {errors.date_logic && <p className="-mt-3 text-sm text-red-500">{errors.date_logic}</p>}
            <FormInput label="Banner URL" name="banner_url" value={editingEvent.banner_url} onChange={handleModalChange} />
            <FormInput label="Registration Link" name="registration_link" value={editingEvent.registration_link || ''} onChange={handleModalChange} />
            <FormInput label="Venue" name="venue" value={editingEvent.venue || ''} onChange={handleModalChange} required error={errors.venue}/>
            
             <div className="border-t border-border-color pt-4">
                <h4 className="font-semibold mb-2">More Buttons</h4>
                {editingEvent.more_buttons?.map((button, index) => (
                    <div key={index} className="border-b border-border-color pb-3 mb-3">
                        <div className="flex gap-2 items-center">
                            <input type="text" placeholder="Button Text" value={button.text} onChange={e => handleButtonChange(index, 'text', e.target.value)} className="flex-grow px-2 py-1 bg-background border border-border-color rounded-md"/>
                            <input type="text" placeholder="Button Link/URL" value={button.link} onChange={e => handleButtonChange(index, 'link', e.target.value)} className="flex-grow px-2 py-1 bg-background border border-border-color rounded-md"/>
                            <button type="button" onClick={() => removeButton(index)} className="text-red-500 font-bold">✕</button>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={addButton} className="text-sm text-accent mt-2">+ Add Button</button>
            </div>
            
            <div className="border-t border-border-color pt-4">
              <h4 className="font-semibold mb-2">Segments & Winners</h4>
              {editingEvent.segments.map((seg, i) => (
                <div key={i} className="border-b border-border-color pb-3 mb-3">
                    <div className="flex gap-2 items-center mb-2">
                        <input type="text" placeholder="Segment Name" name="name" value={seg.name} onChange={e => handleSegmentChange(i, e)} className="flex-grow px-2 py-1 bg-background border border-border-color rounded-md"/>
                        <button type="button" onClick={() => removeSegment(i)} className="text-red-500 font-bold">✕</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input type="text" placeholder="Champion" name="champion" value={seg.winners?.champion || ''} onChange={e => handleSegmentChange(i, e)} className="px-2 py-1 bg-background border border-border-color rounded-md text-sm"/>
                        <input type="text" placeholder="Runner-up" name="runner_up" value={seg.winners?.runner_up || ''} onChange={e => handleSegmentChange(i, e)} className="px-2 py-1 bg-background border border-border-color rounded-md text-sm"/>
                        <input type="text" placeholder="2nd Runner-up" name="second_runner_up" value={seg.winners?.second_runner_up || ''} onChange={e => handleSegmentChange(i, e)} className="px-2 py-1 bg-background border border-border-color rounded-md text-sm"/>
                    </div>
                </div>
              ))}
              <button type="button" onClick={addSegment} className="text-sm text-accent mt-2">+ Add Segment</button>
            </div>
          </div>
        )}
      </AdminEditModal>
    </AdminLayout>
  );
};

export default AdminEventsEditorPage;
import { MapPin, CalendarDays, Clock, Wallet, Backpack } from 'lucide-react';
import { formatINR } from '../utils/format';

const fmtDate = (d) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';

const STOP_TYPE_LABEL = {
  activity: 'Activity',
  food: 'Food',
  accommodation: 'Stay',
  transport: 'Transport',
  flight: 'Flight',
};

// Read-only rendering of a trip: used for the public share page and the "Public View" preview tab.
export default function TripReadOnly({ trip }) {
  const budgetTotal = ['transport', 'accommodation', 'activities'].reduce(
    (sum, cat) => sum + (trip.budget?.[cat] || []).reduce((s, i) => s + (i.amount || 0), 0),
    0
  );
  const days = trip.days || [];
  const packing = trip.packingList || [];

  return (
    <article className="bg-white border border-[#d6e7cc] rounded-3xl overflow-hidden shadow-xl">
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-[#152010] to-[#749962]">
        {trip.image && <img src={trip.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">{trip.name}</h1>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-white/85">
            {trip.destination && <span className="flex items-center gap-1.5"><MapPin size={15} /> {trip.destination}</span>}
            {trip.startDate && (
              <span className="flex items-center gap-1.5">
                <CalendarDays size={15} /> {fmtDate(trip.startDate)}{trip.endDate ? ` – ${fmtDate(trip.endDate)}` : ''}
              </span>
            )}
          </div>
          {trip.user?.name && <p className="text-xs text-white/70 mt-2">Planned by {trip.user.name}</p>}
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {trip.description && <p className="text-gray-700 leading-relaxed">{trip.description}</p>}

        <section>
          <h2 className="text-xl font-black text-[#152010] mb-4">Itinerary</h2>
          {days.length === 0 ? (
            <p className="text-gray-500">No days planned yet.</p>
          ) : (
            <div className="space-y-4">
              {days.map((day) => (
                <div key={day._id} className="border border-[#d6e7cc] rounded-2xl p-5 bg-[#f8fcf5]">
                  <h3 className="font-bold text-[#152010]">
                    Day {day.dayNumber}
                    {day.date && <span className="text-gray-500 font-medium ml-2 text-sm">{fmtDate(day.date)}</span>}
                  </h3>
                  {day.stops.length === 0 ? (
                    <p className="text-sm text-gray-400 mt-2">Free day</p>
                  ) : (
                    <ol className="mt-3 space-y-2 border-l-2 border-[#d6e7cc] pl-4">
                      {day.stops.map((stop) => (
                        <li key={stop._id} className="text-sm">
                          <span className="font-semibold text-[#152010]">{stop.title}</span>
                          <span className="text-gray-500">
                            {stop.time && <> · <Clock size={12} className="inline -mt-0.5" /> {stop.time}</>}
                            {stop.type && ` · ${STOP_TYPE_LABEL[stop.type] || stop.type}`}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid sm:grid-cols-2 gap-4">
          <section className="border border-[#d6e7cc] rounded-2xl p-5">
            <h2 className="font-black text-[#152010] flex items-center gap-2"><Wallet size={18} /> Budget</h2>
            <p className="text-3xl font-black text-[#152010] mt-2">{formatINR(budgetTotal)}</p>
            <p className="text-xs text-gray-500 mt-1">Planned across transport, stays and activities</p>
          </section>
          <section className="border border-[#d6e7cc] rounded-2xl p-5">
            <h2 className="font-black text-[#152010] flex items-center gap-2"><Backpack size={18} /> Packing list</h2>
            {packing.length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">Nothing added yet.</p>
            ) : (
              <p className="text-sm text-gray-700 mt-2">{packing.map((p) => p.item).join(', ')}</p>
            )}
          </section>
        </div>
      </div>
    </article>
  );
}

import React, { useState } from 'react';
import { Users, Plus, Trash2, Phone, Star, ShieldCheck, Send, Check } from 'lucide-react';
import { EmergencyContact } from '../types/sos';

interface ContactsDrawerProps {
  contacts: EmergencyContact[];
  onAddContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  onDeleteContact: (id: string) => void;
  onTogglePrimary: (id: string) => void;
}

export const ContactsDrawer: React.FC<ContactsDrawerProps> = ({
  contacts,
  onAddContact,
  onDeleteContact,
  onTogglePrimary,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('Family');
  const [testSent, setTestSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onAddContact({
      name: name.trim(),
      phone: phone.trim(),
      relation: relation.trim(),
      isPrimary: contacts.length === 0,
    });
    setName('');
    setPhone('');
  };

  const handleTestBroadcast = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-rose-400 font-mono mb-1">
            <Users className="h-4 w-4" />
            <span>LOCAL EMERGENCY NETWORK</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Trusted Safety Contacts</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Configure primary recipients for simulated silent emergency alerts and live GPS telemetry links.
          </p>
        </div>

        <button
          onClick={handleTestBroadcast}
          disabled={contacts.length === 0 || testSent}
          className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          {testSent ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Simulated Ping Sent!</span>
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5 text-rose-400" />
              <span>Test Broadcast Dispatch</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Form: Add Contact */}
        <div className="md:col-span-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4 h-fit">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="h-4 w-4 text-rose-400" />
            <span>Add Trusted Contact</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Chen"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 234-5678"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Relationship</label>
              <select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Family">Family / Parent / Sibling</option>
                <option value="Partner">Partner / Spouse</option>
                <option value="Close Friend">Close Friend / Roommate</option>
                <option value="Colleague">Trusted Colleague</option>
                <option value="Advocate">Safety Advocate</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors mt-2"
            >
              Save Contact
            </button>
          </form>
        </div>

        {/* Contacts List */}
        <div className="md:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Configured Contacts ({contacts.length})</span>
            <span className="text-[11px] text-slate-500 normal-case font-mono">Stored in browser local storage</span>
          </div>

          {contacts.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-400">
              No contacts added yet. Add at least 1 trusted person so simulated dispatch alerts have designated recipients.
            </div>
          ) : (
            <div className="space-y-2.5">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onTogglePrimary(contact.id)}
                      title={contact.isPrimary ? 'Primary Recipient' : 'Mark as Primary'}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        contact.isPrimary
                          ? 'border-amber-500/80 bg-amber-950/40 text-amber-400'
                          : 'border-slate-800 bg-slate-950 text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      <Star className="h-4 w-4 fill-current" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{contact.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">· {contact.relation}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 font-mono mt-0.5">
                        <Phone className="h-3 w-3 text-slate-500" />
                        <span>{contact.phone}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteContact(contact.id)}
                    title="Remove Contact"
                    className="p-2 rounded-lg border border-slate-800 hover:border-rose-900 bg-slate-950 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 text-xs transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Simulated SMS Dispatch Template Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 mt-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
              <ShieldCheck className="h-4 w-4 text-rose-400" />
              <span>Simulated SMS Message Format</span>
            </div>
            <p className="text-xs text-slate-400 mb-2 leading-relaxed">
              When an SOS event confirms, Silent SOS formats an SMS payload containing your coordinates, gesture confidence, and a direct Google Maps link:
            </p>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed">
              [SILENT SOS ALERT] Urgent: Signal for Help triggered by user. Current location: Lat 37.7749, Lng -122.4194 (±12m). Live Map: https://maps.google.com/?q=37.7749,-122.4194. Please reach out immediately.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

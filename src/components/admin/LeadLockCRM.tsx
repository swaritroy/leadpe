import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, DollarSign, Globe, Mail, Phone, Lock,
  ToggleLeft, ToggleRight, AlertTriangle, CreditCard
} from "lucide-react";

interface Lead {
  id: number;
  name: string;
  value: string;
  source: string;
  email: string;
  phone: string;
}

const mockLeads: Lead[] = [
  { id: 1, name: "Sarah Mitchell", value: "$1,200", source: "Google Ads", email: "sarah@email.com", phone: "(555) 123-4567" },
  { id: 2, name: "James Cooper", value: "$800", source: "Organic", email: "james@email.com", phone: "(555) 987-6543" },
  { id: 3, name: "Maria Garcia", value: "$2,100", source: "Referral", email: "maria@email.com", phone: "(555) 456-7890" },
  { id: 4, name: "Tom Wilson", value: "$450", source: "Facebook", email: "tom@email.com", phone: "(555) 321-0987" },
  { id: 5, name: "Lisa Chen", value: "$1,800", source: "Google Ads", email: "lisa@email.com", phone: "(555) 654-3210" },
  { id: 6, name: "David Brown", value: "$950", source: "Organic", email: "david@email.com", phone: "(555) 111-2222" },
];

const LeadLockCRM = () => {
  const [subscriptionActive, setSubscriptionActive] = useState(true);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gi-text flex items-center gap-2">
            <Users size={18} className="text-gi-cyan" />
            Lead-Lock CRM
          </h2>
          <p className="text-sm text-gi-text-muted mt-0.5">Lead access controlled by subscription status</p>
        </div>

        {/* Subscription Toggle */}
        <button
          onClick={() => setSubscriptionActive(!subscriptionActive)}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-colors ${
            subscriptionActive
              ? "border-gi-emerald/30 bg-gi-emerald-muted"
              : "border-gi-red/30 bg-gi-red-muted"
          }`}
        >
          <span className={`text-xs font-semibold ${subscriptionActive ? "gi-emerald" : "gi-red"}`}>
            Subscription {subscriptionActive ? "Active" : "Inactive"}
          </span>
          {subscriptionActive ? (
            <ToggleRight size={22} className="gi-emerald" />
          ) : (
            <ToggleLeft size={22} className="gi-red" />
          )}
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Leads", value: "6", icon: Users, accent: "text-gi-indigo" },
          { label: "Pipeline Value", value: "$7,300", icon: DollarSign, accent: "gi-emerald" },
          { label: "Top Source", value: "Google Ads", icon: Globe, accent: "text-gi-cyan" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gi-border bg-gi-surface p-4">
            <stat.icon size={16} className={`${stat.accent} mb-2`} />
            <div className="text-xl font-bold text-gi-text">{stat.value}</div>
            <div className="text-xs text-gi-text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Lead Table with Kill-Switch */}
      <div className="relative rounded-xl border border-gi-border bg-gi-surface overflow-hidden">
        {/* Table */}
        <div className={subscriptionActive ? "" : "select-none"}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gi-border">
                {["Lead Name", "Value", "Source", "Email", "Phone"].map((header) => (
                  <th key={header} className="text-left px-5 py-3 text-xs font-semibold text-gi-text-muted uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockLeads.map((lead, i) => (
                <tr
                  key={lead.id}
                  className="border-b border-gi-border-subtle last:border-0 hover:bg-gi-surface-hover transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium text-gi-text">{lead.name}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold gi-emerald">{lead.value}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gi-indigo-muted text-gi-indigo">
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gi-text-secondary flex items-center gap-1.5">
                      <Mail size={12} /> {lead.email}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gi-text-secondary flex items-center gap-1.5">
                      <Phone size={12} /> {lead.phone}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Kill-Switch Overlay */}
        <AnimatePresence>
          {!subscriptionActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="rounded-2xl border border-gi-red/30 bg-gi-bg/95 p-8 max-w-sm text-center shadow-2xl"
              >
                <div className="w-14 h-14 rounded-full bg-gi-red-muted mx-auto mb-4 flex items-center justify-center">
                  <Lock size={24} className="gi-red" />
                </div>
                <h3 className="text-lg font-bold text-gi-text mb-2">Lead Access Suspended</h3>
                <p className="text-sm text-gi-text-muted mb-6">
                  Pay $49 Maintenance Fee to Unlock your lead data and CRM features.
                </p>
                <button className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gi-emerald text-gi-bg hover:opacity-90 transition-opacity">
                  <CreditCard size={16} /> Pay $49 & Unlock
                </button>
                <button
                  onClick={() => setSubscriptionActive(true)}
                  className="mt-3 text-xs text-gi-text-muted hover:text-gi-text-secondary transition-colors"
                >
                  Re-activate subscription (demo)
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LeadLockCRM;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

const DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

interface DaySchedule {
  id?: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map((_, i) => ({
  day_of_week: i,
  open_time: "08:00",
  close_time: "22:00",
  is_closed: i === 0, // closed Sunday
}));

export default function ScheduledHoursPage() {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (supabase as any)
      .from("operating_hours")
      .select("*")
      .is("shop_id", null)
      .then(({ data }: { data: DaySchedule[] | null }) => {
        if (data && data.length > 0) {
          const merged = DEFAULT_SCHEDULE.map((def) => {
            const existing = data.find((d) => d.day_of_week === def.day_of_week);
            return existing || def;
          });
          setSchedule(merged);
        }
        setLoading(false);
      });
  }, []);

  const update = (day: number, field: keyof DaySchedule, value: any) => {
    setSchedule((prev) =>
      prev.map((s) => (s.day_of_week === day ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = schedule.map((s) => ({
      shop_id: null,
      day_of_week: s.day_of_week,
      open_time: s.open_time,
      close_time: s.close_time,
      is_closed: s.is_closed,
    }));

    const { error } = await (supabase as any)
      .from("operating_hours")
      .upsert(payload, { onConflict: "shop_id,day_of_week" });

    if (error) {
      toast({ title: "Failed to save schedule", variant: "destructive" });
    } else {
      toast({ title: "✅ Schedule saved" });
    }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Operating Hours</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Set platform availability hours for each day of the week
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Schedule
        </button>
      </div>

      <div className="glass rounded-2xl border border-border overflow-hidden divide-y divide-border">
        <div className="px-5 py-3 flex items-center gap-2 border-b border-border bg-secondary/30">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Weekly Schedule</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          schedule.map((day) => (
            <div
              key={day.day_of_week}
              className={`flex flex-wrap items-center gap-4 px-5 py-4 ${day.is_closed ? "opacity-60" : ""}`}
            >
              {/* Day name */}
              <div className="w-24 shrink-0">
                <p className="text-sm font-semibold text-foreground">{DAYS[day.day_of_week]}</p>
              </div>

              {/* Closed toggle */}
              <button
                onClick={() => update(day.day_of_week, "is_closed", !day.is_closed)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  day.is_closed
                    ? "bg-destructive/15 text-destructive border border-destructive/30"
                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {day.is_closed ? "Closed" : "Open"}
              </button>

              {/* Time inputs */}
              {!day.is_closed && (
                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Opens</label>
                    <input
                      type="time"
                      value={day.open_time}
                      onChange={(e) => update(day.day_of_week, "open_time", e.target.value)}
                      className="px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <span className="text-muted-foreground text-sm mt-4">—</span>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Closes</label>
                    <input
                      type="time"
                      value={day.close_time}
                      onChange={(e) => update(day.day_of_week, "close_time", e.target.value)}
                      className="px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

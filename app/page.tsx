"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Users,
  Calendar,
  User,
  CalendarCheck,
  Trash2,
  Flame,
  Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeSlot = string; // "day-hour", e.g. "0-9" = Monday 9am

type Member = {
  id: string;
  name: string;
  color: string;
  availability: TimeSlot[];
};

type Meeting = {
  id: string;
  title: string;
  slot: TimeSlot;
  color: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["週一", "週二", "週三", "週四", "週五"];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const COLORS = [
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-cyan-500",
];
const MEETING_COLORS = [
  { bg: "bg-rose-500", text: "text-rose-500", light: "bg-rose-100 dark:bg-rose-950", border: "border-rose-300 dark:border-rose-800" },
  { bg: "bg-violet-500", text: "text-violet-500", light: "bg-violet-100 dark:bg-violet-950", border: "border-violet-300 dark:border-violet-800" },
  { bg: "bg-amber-500", text: "text-amber-500", light: "bg-amber-100 dark:bg-amber-950", border: "border-amber-300 dark:border-amber-800" },
  { bg: "bg-sky-500", text: "text-sky-500", light: "bg-sky-100 dark:bg-sky-950", border: "border-sky-300 dark:border-sky-800" },
];

const slot = (day: number, hour: number): TimeSlot => `${day}-${hour}`;

// ─── Fake initial data ────────────────────────────────────────────────────────

// 假資料：三人皆有「週三 9–11」共同空閒，方便展示
const INITIAL_MEMBERS: Member[] = [
  {
    id: "me",
    name: "我",
    color: "bg-blue-500",
    availability: [
      slot(0, 9), slot(0, 10), slot(0, 11),          // Mon 9–12
      slot(0, 14), slot(0, 15), slot(0, 16),         // Mon 14–17
      slot(2, 9),  slot(2, 10), slot(2, 11),         // Wed 9–12（共同）
      slot(3, 14), slot(3, 15), slot(3, 16),         // Thu 14–17
      slot(4, 9),  slot(4, 10),                      // Fri 9–11
    ],
  },
  {
    id: "xiao-liang",
    name: "小梁",
    color: "bg-green-500",
    availability: [
      slot(0, 9),  slot(0, 10), slot(0, 11),         // Mon 9–12
      slot(2, 9),  slot(2, 10), slot(2, 11),         // Wed 9–12（共同）
      slot(2, 14), slot(2, 15), slot(2, 16),         // Wed 14–17
      slot(4, 9),  slot(4, 10),                      // Fri 9–11
    ],
  },
  {
    id: "lu-lu",
    name: "盧盧",
    color: "bg-purple-500",
    availability: [
      slot(1, 10), slot(1, 11), slot(1, 12),         // Tue 10–13
      slot(2, 9),  slot(2, 10), slot(2, 11),         // Wed 9–12（共同）
      slot(3, 14), slot(3, 15),                      // Thu 14–16
    ],
  },
];

// ─── Heatmap Grid Component ─────────────────────────────────────────────────

function HeatmapGrid({
  members,
  meetings,
  onSlotClick,
  selectedSlot,
}: {
  members: Member[];
  meetings: Meeting[];
  onSlotClick?: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot | null;
}) {
  const total = members.length;

  function countForSlot(s: TimeSlot): number {
    return members.filter((m) => m.availability.includes(s)).length;
  }

  function meetingForSlot(s: TimeSlot): Meeting | undefined {
    return meetings.find((m) => m.slot === s);
  }

  // Heatmap color: deeper green = more people available
  function heatColor(count: number): string {
    if (count === 0) return "bg-muted border-border";
    const ratio = count / total;
    if (ratio === 1) return "bg-emerald-500 border-emerald-500";
    if (ratio >= 0.75) return "bg-emerald-400 border-emerald-400";
    if (ratio >= 0.5) return "bg-emerald-300 border-emerald-300 dark:bg-emerald-600 dark:border-emerald-600";
    if (ratio >= 0.25) return "bg-emerald-200 border-emerald-200 dark:bg-emerald-700 dark:border-emerald-700";
    return "bg-emerald-100 border-emerald-100 dark:bg-emerald-800 dark:border-emerald-800";
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="w-14" />
            {DAYS.map((d) => (
              <th key={d} className="p-2 text-center font-medium text-sm">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((h) => (
            <tr key={h}>
              <td className="text-right pr-3 text-muted-foreground text-xs py-0.5 whitespace-nowrap">
                {h}:00
              </td>
              {DAYS.map((_, d) => {
                const s = slot(d, h);
                const count = countForSlot(s);
                const meeting = meetingForSlot(s);
                const isSelected = selectedSlot === s;

                let cellClass: string;
                if (meeting) {
                  cellClass = `${meeting.color} border-white/30`;
                } else {
                  cellClass = heatColor(count);
                }

                return (
                  <td key={d} className="p-0.5">
                    <div
                      className={`h-8 rounded border transition-colors relative flex items-center justify-center ${cellClass} ${
                        onSlotClick && count === total && !meeting
                          ? "cursor-pointer ring-offset-1 hover:ring-2 hover:ring-emerald-400"
                          : "cursor-default"
                      } ${isSelected ? "ring-2 ring-primary ring-offset-1" : ""}`}
                      onClick={() => {
                        if (onSlotClick && count === total && !meeting) {
                          onSlotClick(s);
                        }
                      }}
                    >
                      {count > 0 && !meeting && (
                        <span
                          className={`text-xs font-bold ${
                            count / total >= 0.5
                              ? "text-white dark:text-white"
                              : "text-emerald-800 dark:text-emerald-200"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                      {meeting && (
                        <span className="text-[10px] font-bold text-white truncate px-0.5">
                          {meeting.title}
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Member Schedule Grid (with meeting overlay) ─────────────────────────────

type DragState = {
  startDay: number;
  startHourIdx: number;
  curDay: number;
  curHourIdx: number;
  filling: boolean; // true = turning slots ON, false = turning OFF
};

function ScheduleGrid({
  availability,
  meetings,
  onBatchToggle,
  emerald = false,
}: {
  availability: TimeSlot[];
  meetings?: Meeting[];
  onBatchToggle?: (slots: TimeSlot[], fill: boolean) => void;
  emerald?: boolean;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragging = useRef(false);

  function meetingForSlot(s: TimeSlot): Meeting | undefined {
    return meetings?.find((m) => m.slot === s);
  }

  // Commit the selection when mouse is released anywhere
  useEffect(() => {
    function handleMouseUp() {
      if (!dragging.current || !drag) return;
      const d0 = Math.min(drag.startDay, drag.curDay);
      const d1 = Math.max(drag.startDay, drag.curDay);
      const h0 = Math.min(drag.startHourIdx, drag.curHourIdx);
      const h1 = Math.max(drag.startHourIdx, drag.curHourIdx);
      const selected: TimeSlot[] = [];
      for (let d = d0; d <= d1; d++)
        for (let hi = h0; hi <= h1; hi++)
          selected.push(slot(d, HOURS[hi]));
      onBatchToggle?.(selected, drag.filling);
      dragging.current = false;
      setDrag(null);
    }
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [drag, onBatchToggle]);

  function inDragRect(d: number, hi: number): boolean {
    if (!drag) return false;
    const d0 = Math.min(drag.startDay, drag.curDay);
    const d1 = Math.max(drag.startDay, drag.curDay);
    const h0 = Math.min(drag.startHourIdx, drag.curHourIdx);
    const h1 = Math.max(drag.startHourIdx, drag.curHourIdx);
    return d >= d0 && d <= d1 && hi >= h0 && hi <= h1;
  }

  return (
    <div className="overflow-x-auto select-none">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="w-14" />
            {DAYS.map((d) => (
              <th key={d} className="p-2 text-center font-medium text-sm">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((h, hi) => (
            <tr key={h}>
              <td className="text-right pr-3 text-muted-foreground text-xs py-0.5 whitespace-nowrap">
                {h}:00
              </td>
              {DAYS.map((_, d) => {
                const s = slot(d, h);
                const active = availability.includes(s);
                const meeting = meetingForSlot(s);
                const inRect = inDragRect(d, hi);

                let cellClass: string;
                if (meeting) {
                  cellClass = `${meeting.color} border-white/30`;
                } else if (inRect) {
                  // Preview: show what the result will be
                  cellClass = drag!.filling
                    ? "bg-primary/60 border-primary/60"
                    : "bg-muted border-border opacity-40";
                } else if (active) {
                  cellClass = emerald
                    ? "bg-emerald-400 border-emerald-400"
                    : "bg-primary border-primary";
                } else {
                  cellClass = "bg-muted border-border hover:bg-muted/60";
                }

                return (
                  <td key={d} className="p-0.5">
                    <div
                      className={`h-8 rounded border transition-colors relative flex items-center justify-center ${cellClass} ${
                        onBatchToggle && !meeting ? "cursor-pointer" : "cursor-default"
                      }`}
                      onMouseDown={(e) => {
                        if (!onBatchToggle || meeting) return;
                        e.preventDefault();
                        dragging.current = true;
                        setDrag({
                          startDay: d,
                          startHourIdx: hi,
                          curDay: d,
                          curHourIdx: hi,
                          filling: !active,
                        });
                      }}
                      onMouseOver={() => {
                        if (!dragging.current) return;
                        setDrag((prev) =>
                          prev ? { ...prev, curDay: d, curHourIdx: hi } : prev
                        );
                      }}
                    >
                      {meeting && (
                        <span className="text-[10px] font-bold text-white truncate px-0.5">
                          {meeting.title}
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-4 mb-5 text-xs text-muted-foreground">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded ${item.color}`} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function MeetFlow() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState("xiao-liang");

  // Meeting creation state
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const me = members.find((m) => m.id === "me")!;
  const others = members.filter((m) => m.id !== "me");
  const viewing = members.find((m) => m.id === viewId) ?? others[0];

  const commonSlots = DAYS.flatMap((_, d) =>
    HOURS.filter((h) =>
      members.every((m) => m.availability.includes(slot(d, h)))
    ).map((h) => slot(d, h))
  );

  function batchToggleMySlots(slots: TimeSlot[], fill: boolean) {
    setMembers((prev) =>
      prev.map((m) =>
        m.id !== "me"
          ? m
          : {
              ...m,
              availability: fill
                ? [...new Set([...m.availability, ...slots])]
                : m.availability.filter((x) => !slots.includes(x)),
            }
      )
    );
  }

  function clearMySchedule() {
    setMembers((prev) =>
      prev.map((m) =>
        m.id !== "me" ? m : { ...m, availability: [] }
      )
    );
  }

  function addMember() {
    const name = newName.trim();
    if (!name) return;
    const color = COLORS[members.length % COLORS.length];
    const newMember: Member = {
      id: `member-${Date.now()}`,
      name,
      color,
      availability: [],
    };
    setMembers((prev) => [...prev, newMember]);
    setNewName("");
    setOpen(false);
  }

  function createMeeting() {
    if (!meetingTitle.trim() || !selectedSlot) return;
    const colorSet = MEETING_COLORS[meetings.length % MEETING_COLORS.length];
    const newMeeting: Meeting = {
      id: `meeting-${Date.now()}`,
      title: meetingTitle.trim(),
      slot: selectedSlot,
      color: colorSet.bg,
    };
    setMeetings((prev) => [...prev, newMeeting]);

    // Remove this slot from all members' availability (it's now occupied)
    setMembers((prev) =>
      prev.map((m) => ({
        ...m,
        availability: m.availability.filter((s) => s !== selectedSlot),
      }))
    );

    setMeetingTitle("");
    setSelectedSlot(null);
    setMeetingOpen(false);
  }

  function deleteMeeting(meetingId: string) {
    setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <CalendarCheck className="w-5 h-5" />
          <h1 className="text-lg font-semibold tracking-tight">MeetFlow</h1>
          <Badge variant="secondary" className="text-xs font-normal">
            Beta
          </Badge>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Tabs defaultValue="members">
          <TabsList className="mb-8 h-10">
            <TabsTrigger value="members" className="gap-1.5 text-sm">
              <Users className="w-3.5 h-3.5" />
              成員
            </TabsTrigger>
            <TabsTrigger value="my-schedule" className="gap-1.5 text-sm">
              <User className="w-3.5 h-3.5" />
              我的時間表
            </TabsTrigger>
            <TabsTrigger value="view-member" className="gap-1.5 text-sm">
              <Calendar className="w-3.5 h-3.5" />
              查看成員
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="gap-1.5 text-sm">
              <Flame className="w-3.5 h-3.5" />
              熱圖總覽
            </TabsTrigger>
            <TabsTrigger value="meetings" className="gap-1.5 text-sm">
              <Zap className="w-3.5 h-3.5" />
              會議
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Members ── */}
          <TabsContent value="members">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold">成員列表</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  共 {members.length} 位成員
                </p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="w-4 h-4" />
                    加入成員
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xs">
                  <DialogHeader>
                    <DialogTitle>加入新成員</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 mt-2">
                    <Input
                      placeholder="輸入成員名稱"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addMember()}
                      autoFocus
                    />
                    <Button onClick={addMember} disabled={!newName.trim()}>
                      確認加入
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((m) => (
                <Card key={m.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback
                        className={`${m.color} text-white text-sm font-semibold`}
                      >
                        {m.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.availability.length} 個空閒時段
                      </p>
                    </div>
                    {m.id === "me" && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        你
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Tab 2: My Schedule ── */}
          <TabsContent value="my-schedule">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold">我的時間表</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  點擊或拖曳選取矩形範圍來批次切換空閒時段
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={clearMySchedule}
                disabled={me.availability.length === 0}
              >
                <Trash2 className="w-3.5 h-3.5" />
                清空時間表
              </Button>
            </div>
            <Card>
              <CardContent className="pt-6">
                <Legend
                  items={[
                    { color: "bg-primary", label: "空閒" },
                    { color: "bg-muted border border-border", label: "忙碌" },
                    ...(meetings.length > 0
                      ? [{ color: "bg-rose-500", label: "已排會議" }]
                      : []),
                  ]}
                />
                <ScheduleGrid
                  availability={me.availability}
                  meetings={meetings}
                  onBatchToggle={batchToggleMySlots}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 3: View Member ── */}
          <TabsContent value="view-member">
            <div className="mb-5">
              <h2 className="text-base font-semibold">查看成員時間表</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                選擇成員來查看他們的空閒時段
              </p>
            </div>

            {others.length === 0 ? (
              <p className="text-muted-foreground text-sm py-12 text-center">
                尚無其他成員，請先在「成員」頁加入
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-5">
                  {others.map((m) => (
                    <Button
                      key={m.id}
                      variant={viewing?.id === m.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewId(m.id)}
                    >
                      {m.name}
                    </Button>
                  ))}
                </div>

                {viewing && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback
                            className={`${viewing.color} text-white text-xs font-semibold`}
                          >
                            {viewing.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        {viewing.name} 的時間表
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Legend
                        items={[
                          { color: "bg-primary", label: "空閒" },
                          {
                            color: "bg-muted border border-border",
                            label: "忙碌",
                          },
                          ...(meetings.length > 0
                            ? [{ color: "bg-rose-500", label: "已排會議" }]
                            : []),
                        ]}
                      />
                      <ScheduleGrid
                        availability={viewing.availability}
                        meetings={meetings}
                      />
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Tab 4: Heatmap ── */}
          <TabsContent value="heatmap">
            <div className="mb-5">
              <h2 className="text-base font-semibold">空閒熱圖總覽</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                顏色越深代表越多成員有空，數字顯示可出席人數（共 {members.length} 人）
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Legend
                  items={[
                    { color: "bg-emerald-500", label: `${members.length}/${members.length} 全員` },
                    { color: "bg-emerald-300 dark:bg-emerald-600", label: "部分可出席" },
                    { color: "bg-emerald-100 dark:bg-emerald-800", label: "少數可出席" },
                    { color: "bg-muted border border-border", label: "無人有空" },
                  ]}
                />
                <HeatmapGrid members={members} meetings={meetings} />
              </CardContent>
            </Card>

            {/* Common slots summary */}
            {commonSlots.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">
                  全員皆可出席的時段（{commonSlots.length} 個）
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {commonSlots.map((s) => {
                    const [d, h] = s.split("-").map(Number);
                    const hasMeeting = meetings.some((m) => m.slot === s);
                    return (
                      <div
                        key={s}
                        className={`text-sm px-3 py-2 rounded-lg border ${
                          hasMeeting
                            ? "bg-muted border-border text-muted-foreground line-through"
                            : "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200"
                        }`}
                      >
                        {DAYS[d]} {h}:00–{h + 1}:00
                        {hasMeeting && " (已排)"}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Tab 5: Meetings ── */}
          <TabsContent value="meetings">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold">會議管理</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  在全員皆有空的時段上發起會議，會議將顯示在所有成員的時間表上
                </p>
              </div>
              <Dialog open={meetingOpen} onOpenChange={(v) => {
                setMeetingOpen(v);
                if (!v) {
                  setSelectedSlot(null);
                  setMeetingTitle("");
                }
              }}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={commonSlots.filter((s) => !meetings.some((m) => m.slot === s)).length === 0}
                  >
                    <Plus className="w-4 h-4" />
                    發起會議
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>發起新會議</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 mt-2">
                    <Input
                      placeholder="輸入會議名稱"
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                      autoFocus
                    />
                    <div>
                      <p className="text-sm font-medium mb-2">選擇時段（僅顯示全員皆可的時段）</p>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {commonSlots
                          .filter((s) => !meetings.some((m) => m.slot === s))
                          .map((s) => {
                            const [d, h] = s.split("-").map(Number);
                            return (
                              <Button
                                key={s}
                                variant={selectedSlot === s ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedSlot(s)}
                              >
                                {DAYS[d]} {h}:00–{h + 1}:00
                              </Button>
                            );
                          })}
                      </div>
                    </div>
                    <Button
                      onClick={createMeeting}
                      disabled={!meetingTitle.trim() || !selectedSlot}
                    >
                      確認發起
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Heatmap with meeting overlay */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <Legend
                  items={[
                    { color: "bg-emerald-500", label: "全員有空" },
                    { color: "bg-emerald-300 dark:bg-emerald-600", label: "部分有空" },
                    { color: "bg-muted border border-border", label: "無人有空" },
                    ...(meetings.length > 0
                      ? [{ color: "bg-rose-500", label: "已排會議" }]
                      : []),
                  ]}
                />
                <HeatmapGrid
                  members={members}
                  meetings={meetings}
                />
              </CardContent>
            </Card>

            {/* Meeting list */}
            {meetings.length === 0 ? (
              <p className="text-center text-muted-foreground py-10 text-sm">
                尚未發起任何會議，點擊上方按鈕來建立
              </p>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">已排定的會議（{meetings.length} 場）</h3>
                {meetings.map((m) => {
                  const [d, h] = m.slot.split("-").map(Number);
                  const colorSet = MEETING_COLORS.find((c) => c.bg === m.color) ?? MEETING_COLORS[0];
                  return (
                    <Card key={m.id}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${m.color} flex items-center justify-center`}>
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{m.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {DAYS[d]} {h}:00–{h + 1}:00 · 全員參與
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {members.map((mem) => (
                            <Avatar key={mem.id} className="w-6 h-6">
                              <AvatarFallback
                                className={`${mem.color} text-white text-[10px] font-semibold`}
                              >
                                {mem.name[0]}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive shrink-0"
                          onClick={() => deleteMeeting(m.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

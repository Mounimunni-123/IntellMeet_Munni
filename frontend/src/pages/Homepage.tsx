import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createMeeting,
  getMyMeetings,
  joinMeeting,
  getMeetingDetails,
  addActionItem,
  toggleActionItem,
  deleteActionItem,
  updateMeetingSummary,
  type MeetingData,
  type MeetingDetails,
} from "../services/meetingService";
import { getMyBoards, createTask } from "../services/boardService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Video,
  Plus,
  Link2,
  Copy,
  ChevronDown,
  Clock,
  Users,
  Calendar,
  ArrowRight,
  Loader2,
  VideoOff,
  RefreshCw,
  Zap,
  LayoutGrid,
  CheckSquare,
  Trash2,
  Edit3,
  Layers,
  FileText,
  Check,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSocket } from "@/hooks/useSocket";
import { AppNavbar } from "../layouts/AppNavbar";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (days === 0)
    return `Today, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (days === 1)
    return `Yesterday, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const formatDuration = (start: string, end?: string) => {
  if (!end) return null;
  const mins = Math.floor(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000,
  );
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const statusConfig = {
  ongoing: {
    label: "Live",
    class:
      "border-primary/50 text-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.15)] font-bold animate-[pulse_3s_infinite]",
    dot: "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]",
  },
  scheduled: {
    label: "Scheduled",
    class:
      "border-primary/50 text-primary/50 bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.15)] font-bold",
    dot: "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]",
  },
  ended: {
    label: "Ended",
    class: "border-muted text-muted-foreground bg-transparent font-bold",
    dot: "bg-muted",
  },
} as const;

const Homepage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [joinCode, setJoinCode] = useState("");
  const [joiningCode, setJoiningCode] = useState<string | null>(null);
  const [createdMeeting, setCreatedMeeting] = useState<MeetingData | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [roomsExpanded, setRoomsExpanded] = useState(true);
  const joinInputRef = useRef<HTMLInputElement>(null);

  const [selectedMeetingCode, setSelectedMeetingCode] = useState<string | null>(
    null,
  );
  const [actionItemInput, setActionItemInput] = useState("");
  const [actionItemAssignee, setActionItemAssignee] = useState("");
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryInput, setSummaryInput] = useState("");

  const [taskConversionItem, setTaskConversionItem] = useState<{
    text: string;
    assignedTo: string | null;
    itemId: string;
  } | null>(null);

  const [targetBoardId, setTargetBoardId] = useState("");
  const [targetColumnId, setTargetColumnId] = useState("");
  const [targetPriority, setTargetPriority] = useState<
    "low" | "medium" | "high"
  >("medium");

  const { data: boards = [] } = useQuery<any[]>({
    queryKey: ["my-boards"],
    queryFn: getMyBoards,
    enabled: !!user,
  });

  const {
    data: meetingDetails,
    refetch: refetchDetails,
    isLoading: detailsLoading,
  } = useQuery<MeetingDetails>({
    queryKey: ["meeting-details", selectedMeetingCode],
    queryFn: () => getMeetingDetails(selectedMeetingCode!),
    enabled: !!selectedMeetingCode,
  });

  const targetBoard = boards.find((b) => b._id === targetBoardId);
  const targetColumns = targetBoard?.columns || [];

  useEffect(() => {
    if (targetColumns.length > 0) {
      setTargetColumnId(targetColumns[0].id);
    } else {
      setTargetColumnId("");
    }
  }, [targetBoardId, targetColumns]);

  const addActionItemMutation = useMutation({
    mutationFn: ({
      code,
      text,
      assignedTo,
    }: {
      code: string;
      text: string;
      assignedTo?: string | null;
    }) => addActionItem(code, text, assignedTo),
    onSuccess: () => {
      toast.success("Action item added!");
      setActionItemInput("");
      setActionItemAssignee("");
      refetchDetails();
    },
    onError: (e: any) => toast.error(e.message || "Failed to add action item"),
  });

  const toggleActionItemMutation = useMutation({
    mutationFn: ({ code, itemId }: { code: string; itemId: string }) =>
      toggleActionItem(code, itemId),
    onSuccess: () => {
      refetchDetails();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteActionItemMutation = useMutation({
    mutationFn: ({ code, itemId }: { code: string; itemId: string }) =>
      deleteActionItem(code, itemId),
    onSuccess: () => {
      toast.success("Action item removed");
      refetchDetails();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateSummaryMutation = useMutation({
    mutationFn: ({ code, summary }: { code: string; summary: string }) =>
      updateMeetingSummary(code, summary),
    onSuccess: () => {
      toast.success("Summary updated!");
      setEditingSummary(false);
      refetchDetails();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createTaskMutation = useMutation({
    mutationFn: ({ boardId, data }: { boardId: string; data: any }) =>
      createTask(boardId, data),
    onSuccess: () => {
      toast.success("Kanban Task created successfully!");
      if (taskConversionItem && selectedMeetingCode) {
        toggleActionItemMutation.mutate({
          code: selectedMeetingCode,
          itemId: taskConversionItem.itemId,
        });
      }
      setTaskConversionItem(null);
    },
    onError: (e: any) => toast.error(e.message || "Failed to create task"),
  });

  const {
    data: meetings = [],
    isLoading: meetingsLoading,
    isFetching,
    refetch,
  } = useQuery<MeetingData[]>({
    queryKey: ["my-meetings"],
    queryFn: () => getMyMeetings(),
    enabled: !!user,
    staleTime: 60_000,
  });

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      qc.invalidateQueries({ queryKey: ["my-meetings"] });
    };
    socket.on("meetings-updated", handleUpdate);
    return () => {
      socket.off("meetings-updated", handleUpdate);
    };
  }, [socket, qc]);

  const createMutation = useMutation({
    mutationFn: ({ title }: { title: string; instant: boolean }) =>
      createMeeting(title),
    onSuccess: (meeting, { instant }) => {
      qc.invalidateQueries({ queryKey: ["my-meetings"] });
      toast.success("Meeting created successfully");
      if (instant) {
        navigate(`/room/${meeting.meetingCode}`);
      } else {
        setCreatedMeeting(meeting);
        setDialogOpen(true);
      }
    },
    onError: (e: Error) => toast.error(e.message || "Could not create meeting"),
  });

  const handleCreateMeeting = (instant = false) => {
    const title =
      meetingTitle.trim() ||
      (user ? `${user.username}'s Meeting` : "Instant Meeting");
    createMutation.mutate({
      title,
      instant,
    });
  };

  const handleJoinMeeting = async (
    codeOverride?: string | React.MouseEvent,
  ) => {
    let code = (
      typeof codeOverride === "string" ? codeOverride : joinCode
    ).trim();

    if (!code) {
      toast.error("Enter a meeting code or link");
      joinInputRef.current?.focus();
      return;
    }

    if (code.includes("/room/")) {
      try {
        const url = new URL(code);
        const parts = url.pathname.split("/");
        code = parts[parts.length - 1] || code;
      } catch {
        code = code.split("/room/").pop()?.split(/[?#]/)[0] ?? code;
      }
    }

    setJoiningCode(code);
    try {
      await joinMeeting(code);
      navigate(`/room/${code}`);
    } catch (e: any) {
      setJoiningCode(null);
      if (e.activeCode) {
        toast.error(e.message, {
          action: {
            label: "Copy Own Code",
            onClick: () => {
              navigator.clipboard.writeText(e.activeCode);
              toast.success("Code copied!");
            },
          },
        });
      } else {
        toast.error(e.message || "Failed to join meeting");
      }
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const isCreating = createMutation.isPending;
  const activeRooms = meetings.filter((m) => m.status !== "ended");

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      <main className="max-w-5xl mx-auto px-6 pt-12 pb-24 sm:py-12 space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back,{" "}
            <span className="text-muted-foreground">{user.username}</span> 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Start or join a secure video meeting
          </p>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-border bg-card p-6 flex flex-col gap-5 hover:border-primary/30 transition-all shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">
                  Quick Join
                </p>
                <p className="text-xs text-muted-foreground">
                  Paste a code or link instantly
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter code or link..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinMeeting()}
                className="h-11 text-sm bg-background border-border rounded-xl"
              />
              <Button
                onClick={() => handleJoinMeeting()}
                disabled={!joinCode.trim() || !!joiningCode}
                className="h-11 px-5 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm font-bold rounded-xl"
              >
                {joiningCode ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Join <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 flex flex-col gap-5 hover:border-primary/30 transition-all shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">
                  Create Meeting
                </p>
                <p className="text-xs text-muted-foreground">
                  Start a new room instantly
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                placeholder={`Meeting Title (Optional)`}
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="h-10 text-xs bg-background border-border rounded-xl"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleCreateMeeting(true)}
                  disabled={isCreating}
                  className="flex-1 h-11 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-xl"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Video className="w-4 h-4" /> Start Now
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleCreateMeeting(false)}
                  disabled={isCreating}
                  variant="outline"
                  className="flex-1 h-11 text-sm font-bold border-border gap-2 rounded-xl hover:bg-muted"
                >
                  <Link2 className="w-4 h-4" /> Get Link
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <button
            className="w-full flex items-center justify-between"
            onClick={() => setRoomsExpanded((v) => !v)}
          >
            <h2 className="font-semibold text-foreground text-base flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-primary" />
              Meeting Rooms
              <Badge
                variant="outline"
                className="text-xs border-primary/20 text-primary bg-primary/5 font-mono ml-1"
              >
                {activeRooms.length} active
              </Badge>
            </h2>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                roomsExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {roomsExpanded && (
            <>
              {meetingsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...Array(2)].map((_, i) => (
                    <div
                      key={i}
                      className="h-24 rounded-xl bg-muted animate-pulse"
                    />
                  ))}
                </div>
              ) : activeRooms.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border rounded-2xl bg-muted/20">
                  <VideoOff className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    No active rooms
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Create a meeting above to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeRooms.slice(0, 6).map((m) => {
                    const isHost = m.createdBy?._id === user?._id;
                    const cfg =
                      statusConfig[m.status as keyof typeof statusConfig] ??
                      statusConfig.scheduled;
                    return (
                      <div
                        key={m._id}
                        className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 hover:border-primary/20 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {m.title}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              {m.meetingCode}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs py-0 h-5 shrink-0 flex items-center gap-1 ${cfg.class}`}
                          >
                            {m.status === "ongoing" && (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse inline-block`}
                              />
                            )}
                            {cfg.label}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {m.participants.length}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-xs h-5 py-0 ${
                                isHost
                                  ? "text-primary bg-primary/10 border-primary/20"
                                  : "text-muted-foreground bg-muted border-border"
                              }`}
                            >
                              {isHost ? "Host" : "Member"}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleJoinMeeting(m.meetingCode)}
                            disabled={!!joiningCode}
                            className="h-7 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            {joiningCode === m.meetingCode ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : m.status === "ongoing" ? (
                              "Join Live"
                            ) : (
                              "Join"
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground text-base">
              Your Meetings
            </h2>
            <div className="flex items-center gap-3">
              {meetings.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {meetings.length} total
                </span>
              )}
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Refresh meetings"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {meetingsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-14 border border-dashed border-border rounded-2xl bg-muted/20">
              <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
                <VideoOff className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No meetings yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Create one above to get started
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border">
              {[...meetings]
                .sort((a, b) => {
                  const order = { ongoing: 0, scheduled: 1, ended: 2 };
                  return (
                    (order[a.status as keyof typeof order] ?? 3) -
                    (order[b.status as keyof typeof order] ?? 3)
                  );
                })
                .slice(0, 8)
                .map((m) => {
                  const cfg =
                    statusConfig[m.status as keyof typeof statusConfig] ??
                    statusConfig.ended;
                  const isHost = m.createdBy?._id === user?._id;
                  const duration =
                    m.status === "ended"
                      ? formatDuration(m.createdAt, m.endTime)
                      : null;
                  return (
                    <div
                      key={m._id}
                      onClick={() => {
                        setSelectedMeetingCode(m.meetingCode);
                        setSummaryInput(m.summary || "");
                        if (boards.length > 0) {
                          setTargetBoardId(boards[0]._id);
                        }
                      }}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer group/meeting"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <Video className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate group-hover/meeting:text-primary transition-colors">
                            {m.title}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {m.meetingCode}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {m.participants.length}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(m.createdAt)}
                          </span>
                          {duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {duration}
                            </span>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-xs h-5 py-0 border-primary/20 ${
                              isHost
                                ? "text-primary bg-primary/10"
                                : "text-muted-foreground bg-muted border-border"
                            }`}
                          >
                            {isHost ? "Host" : "Member"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs py-0 h-5 flex items-center gap-1 ${cfg.class}`}
                          >
                            {m.status === "ongoing" && (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse inline-block`}
                              />
                            )}
                            {cfg.label}
                          </Badge>
                        </div>

                        {m.recordingUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(m.recordingUrl, "_blank");
                            }}
                            className="h-7 px-3 text-xs border-primary/20 text-primary hover:bg-primary/10 cursor-pointer"
                          >
                            <Video className="w-3 h-3 mr-1" />
                            Recording
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinMeeting(m.meetingCode);
                          }}
                          disabled={m.status === "ended" || !!joiningCode}
                          className={`h-7 px-3 text-xs cursor-pointer ${
                            m.status === "ended"
                              ? "bg-muted text-muted-foreground cursor-not-allowed"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          }`}
                        >
                          {joiningCode === m.meetingCode ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : m.status === "ended" ? (
                            "Ended"
                          ) : m.status === "ongoing" ? (
                            "Join Live"
                          ) : (
                            "Join"
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Meetings", value: meetings.length, icon: Video },
            {
              label: "Participants",
              value: meetings.reduce((s, m) => s + m.participants.length, 0),
              icon: Users,
            },
            {
              label: "This week",
              value: meetings.filter(
                (m) =>
                  Date.now() - new Date(m.createdAt).getTime() < 7 * 86400000,
              ).length,
              icon: Clock,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Link2 className="w-3.5 h-3.5 text-primary" />
              </div>
              Meeting link is ready
            </DialogTitle>
          </DialogHeader>
          {createdMeeting && (
            <div className="space-y-4 pt-1">
              <p className="text-sm text-muted-foreground">
                Share this code with people you want to meet with.
              </p>
              <div className="flex items-center justify-between bg-muted/50 border border-border rounded-xl px-4 py-3">
                <span className="font-mono text-base font-semibold text-foreground tracking-widest">
                  {createdMeeting.meetingCode}
                </span>
                <button
                  onClick={() => copyCode(createdMeeting.meetingCode)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/90 font-medium transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1 border-border text-foreground hover:bg-muted"
                  onClick={() => setDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  onClick={() => {
                    setDialogOpen(false);
                    navigate(`/room/${createdMeeting.meetingCode}`);
                  }}
                >
                  <Video className="w-4 h-4" /> Start now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Post-Meeting Dashboard Dialog */}
      <Dialog
        open={!!selectedMeetingCode}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMeetingCode(null);
            setEditingSummary(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-[24px] p-6 border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg font-bold">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span>Meeting Insights</span>
                <span className="text-xs text-muted-foreground font-normal mt-0.5">
                  Code: {selectedMeetingCode}
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : meetingDetails ? (
            <div className="space-y-6 pt-2">
              {/* Meeting Info Section */}
              <div className="grid grid-cols-2 gap-4 bg-muted/20 border border-border/50 rounded-2xl p-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Title</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {meetingDetails.title}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hosted By</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {meetingDetails.createdBy?.name || "Host"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date & Time</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {new Date(meetingDetails.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Participants</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {meetingDetails.participants.length} users
                  </p>
                </div>
              </div>

              {/* AI Summary Section */}
              <div className="space-y-2.5 border-t border-border/30 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary" /> AI Meeting
                    Summary
                  </h3>
                  {!editingSummary ? (
                    <button
                      onClick={() => {
                        setEditingSummary(true);
                        setSummaryInput(meetingDetails.summary || "");
                      }}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingSummary(false)}
                        className="text-xs text-muted-foreground hover:underline font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() =>
                          updateSummaryMutation.mutate({
                            code: meetingDetails.meetingCode,
                            summary: summaryInput,
                          })
                        }
                        className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                        disabled={updateSummaryMutation.isPending}
                      >
                        {updateSummaryMutation.isPending ? "Saving..." : "Save"}
                      </button>
                    </div>
                  )}
                </div>

                {editingSummary ? (
                  <textarea
                    value={summaryInput}
                    onChange={(e) => setSummaryInput(e.target.value)}
                    placeholder="Provide a summary of the meeting..."
                    rows={4}
                    className="w-full rounded-xl border border-border bg-muted/5 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/10 border border-border/20 rounded-xl px-4 py-3 min-h-[60px] whitespace-pre-wrap">
                    {meetingDetails.summary ||
                      "No summary generated. Click Edit to add one!"}
                  </p>
                )}
              </div>

              {/* Action Items Section */}
              <div className="space-y-3 border-t border-border/30 pt-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-primary" /> Action Items
                </h3>

                {/* List Action Items */}
                <div className="space-y-2">
                  {meetingDetails.actionItems &&
                  meetingDetails.actionItems.length > 0 ? (
                    meetingDetails.actionItems.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between gap-3 bg-muted/10 border border-border/20 rounded-xl px-4 py-3 hover:bg-muted/15 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() =>
                              toggleActionItemMutation.mutate({
                                code: meetingDetails.meetingCode,
                                itemId: item._id,
                              })
                            }
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                              item.completed
                                ? "bg-primary border-primary text-white"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {item.completed && (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <p
                              className={`text-sm text-foreground font-medium truncate ${
                                item.completed
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }`}
                            >
                              {item.text}
                            </p>
                            {item.assignedTo && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Assigned to:{" "}
                                <span className="font-semibold text-foreground">
                                  {item.assignedTo.name}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Convert to Kanban Task button */}
                          <button
                            onClick={() => {
                              setTaskConversionItem({
                                text: item.text,
                                assignedTo: item.assignedTo?._id || null,
                                itemId: item._id,
                              });
                            }}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            title="Convert to Kanban Task"
                          >
                            <Layers className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              deleteActionItemMutation.mutate({
                                code: meetingDetails.meetingCode,
                                itemId: item._id,
                              })
                            }
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                            title="Remove action item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center py-4 bg-muted/5 border border-dashed border-border rounded-xl">
                      No action items captured yet.
                    </p>
                  )}
                </div>

                {/* Add Action Item form */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1.5">
                  <Input
                    placeholder="Capture new action item..."
                    value={actionItemInput}
                    onChange={(e) => setActionItemInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (actionItemInput.trim()) {
                          addActionItemMutation.mutate({
                            code: meetingDetails.meetingCode,
                            text: actionItemInput,
                            assignedTo: actionItemAssignee || null,
                          });
                        }
                      }
                    }}
                    className="flex-1 rounded-xl h-10 border-border bg-muted/5 px-4 placeholder:text-muted-foreground/60 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex gap-2">
                    <select
                      value={actionItemAssignee}
                      onChange={(e) => setActionItemAssignee(e.target.value)}
                      className="rounded-xl border border-border bg-card text-foreground text-xs px-3 h-10 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer min-w-[130px]"
                    >
                      <option value="" className="bg-card text-foreground">
                        Assignee...
                      </option>
                      {meetingDetails.participants.map((p: any) => {
                        const u = p.user;
                        if (!u || typeof u === "string") return null;
                        return (
                          <option
                            key={u._id}
                            value={u._id}
                            className="bg-card text-foreground"
                          >
                            {u.name}
                          </option>
                        );
                      })}
                    </select>
                    <Button
                      onClick={() => {
                        if (actionItemInput.trim()) {
                          addActionItemMutation.mutate({
                            code: meetingDetails.meetingCode,
                            text: actionItemInput,
                            assignedTo: actionItemAssignee || null,
                          });
                        }
                      }}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-10 px-4 font-bold text-xs cursor-pointer gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-10 text-muted-foreground text-sm">
              Failed to load meeting details
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Convert to Kanban Task Dialog */}
      <Dialog
        open={!!taskConversionItem}
        onOpenChange={(open) => {
          if (!open) setTaskConversionItem(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-[24px] p-6 border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg font-bold">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-primary" />
              </div>
              Convert to Kanban Task
            </DialogTitle>
          </DialogHeader>

          {taskConversionItem && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1 bg-muted/20 border border-border/50 rounded-2xl p-4 text-sm">
                <p className="text-xs text-muted-foreground">
                  Action Item Text
                </p>
                <p className="font-semibold text-foreground mt-0.5 leading-snug">
                  {taskConversionItem.text}
                </p>
              </div>

              {boards.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border rounded-xl">
                  <p className="text-xs text-muted-foreground mb-3">
                    You have no Kanban boards yet. Create one first!
                  </p>
                  <Button
                    onClick={() => navigate("/board")}
                    size="sm"
                    className="h-8 rounded-xl font-bold bg-primary text-primary-foreground text-xs"
                  >
                    Go to Boards
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">
                      Select Project Board
                    </label>
                    <select
                      value={targetBoardId}
                      onChange={(e) => setTargetBoardId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card text-foreground px-4 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                      {boards.map((b) => (
                        <option
                          key={b._id}
                          value={b._id}
                          className="bg-card text-foreground"
                        >
                          {b.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">
                        Select Column
                      </label>
                      <select
                        value={targetColumnId}
                        onChange={(e) => setTargetColumnId(e.target.value)}
                        className="w-full rounded-xl border border-border bg-card text-foreground px-4 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                      >
                        {targetColumns.map((col: any) => (
                          <option
                            key={col.id}
                            value={col.id}
                            className="bg-card text-foreground"
                          >
                            {col.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">
                        Priority
                      </label>
                      <select
                        value={targetPriority}
                        onChange={(e) =>
                          setTargetPriority(e.target.value as any)
                        }
                        className="w-full rounded-xl border border-border bg-card text-foreground px-4 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                      >
                        <option value="low" className="bg-card text-foreground">
                          🟢 Low
                        </option>
                        <option
                          value="medium"
                          className="bg-card text-foreground"
                        >
                          🟡 Medium
                        </option>
                        <option
                          value="high"
                          className="bg-card text-foreground"
                        >
                          🔴 High
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-border bg-muted/5 hover:bg-muted/10 text-foreground rounded-full h-11 font-semibold transition-colors"
                      onClick={() => setTaskConversionItem(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        createTaskMutation.mutate({
                          boardId: targetBoardId,
                          data: {
                            title: taskConversionItem.text.trim(),
                            description: `Created from meeting action item.`,
                            priority: targetPriority,
                            column: targetColumnId,
                            assignedTo: taskConversionItem.assignedTo,
                          },
                        });
                      }}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-11 font-bold gap-2 transition-all shadow-md cursor-pointer"
                      disabled={createTaskMutation.isPending}
                    >
                      {createTaskMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" /> Create Task
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Homepage;

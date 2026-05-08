import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, ShieldOff, CheckCircle2, XCircle, Eye, EyeOff, ArrowLeft, Loader2, FileSearch, Search, ChevronLeft, ChevronRight, Clock, UserRound, Mail, Phone, Stethoscope } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { privateClinics } from "@/data/privateClinics";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const PAGE_SIZE = 20;

const REQUIRED_FIELDS: { key: keyof DoctorProfile; label: string }[] = [
  { key: "full_name", label: "Ονοματεπώνυμο" },
  { key: "specialty", label: "Ειδικότητα" },
  { key: "city", label: "Πόλη" },
  { key: "address", label: "Διεύθυνση" },
  { key: "phone", label: "Τηλέφωνο" },
  { key: "email", label: "Email" },
  { key: "bio", label: "Βιογραφικό" },
  { key: "photo_url", label: "Φωτογραφία" },
];

const getCompleteness = (d: DoctorProfile) => {
  const missing = REQUIRED_FIELDS.filter((f) => {
    const v = d[f.key];
    return v === null || v === undefined || String(v).trim() === "";
  });
  const total = REQUIRED_FIELDS.length;
  const filled = total - missing.length;
  const percent = Math.round((filled / total) * 100);
  return { percent, filled, total, missing };
};

const completenessTone = (percent: number) => {
  if (percent === 100) return "text-primary";
  if (percent >= 60) return "text-muted-foreground";
  return "text-destructive";
};

const CompletenessIndicator = ({
  doctor,
  compact = false,
  showMissing = false,
}: {
  doctor: DoctorProfile;
  compact?: boolean;
  showMissing?: boolean;
}) => {
  const { percent, filled, total, missing } = getCompleteness(doctor);
  const tone = completenessTone(percent);
  if (compact) {
    return (
      <div
        className={`${showMissing ? "w-48" : "w-28"} space-y-1`}
        title={missing.length ? `Λείπουν: ${missing.map((m) => m.label).join(", ")}` : "Πλήρες"}
      >
        <div className="flex items-center justify-between text-xs">
          <span className={`font-medium ${tone}`}>{percent}%</span>
          <span className="text-muted-foreground">{filled}/{total}</span>
        </div>
        <Progress value={percent} className="h-1.5" />
        {showMissing && missing.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {missing.map((m) => (
              <Badge
                key={m.key as string}
                variant="destructive"
                className="px-1.5 py-0 text-[10px] font-normal leading-4"
              >
                {m.label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${tone}`}>{percent}% συμπληρωμένο</span>
        <span className="text-xs text-muted-foreground">{filled}/{total} πεδία</span>
      </div>
      <Progress value={percent} className="h-2" />
      {missing.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {missing.map((m) => (
            <Badge key={m.key as string} variant="destructive" className="font-normal">
              Λείπει: {m.label}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-primary">Όλα τα απαιτούμενα πεδία είναι συμπληρωμένα.</p>
      )}
    </div>
  );
};

type DoctorProfile = {
  id: string;
  user_id: string;
  full_name: string;
  specialty: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  bio: string | null;
  photo_url: string | null;
  clinic_id: string | null;
  subscription_tier: string;
  is_published: boolean;
  verified: boolean;
  verified_at: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
};

type ClinicClaim = {
  id: string;
  clinic_id: string;
  user_id: string;
  status: string;
  created_at: string;
  decision_note: string | null;
};

type AuditLogEntry = {
  id: string;
  claim_id: string;
  admin_id: string;
  decision: string;
  note: string | null;
  error_detail: string | null;
  created_at: string;
};

const FALLBACK_ERROR_DETAIL = "Άγνωστο σφάλμα — δεν παρασχέθηκε λεπτομέρεια από τον server.";

// Normalize an arbitrary error message to a safe non-empty string for the
// audit log's error_detail column. Returns the fallback if the message is
// missing, non-string, or only whitespace.
const safeErrorDetail = (raw: unknown): string => {
  if (typeof raw !== "string") return FALLBACK_ERROR_DETAIL;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : FALLBACK_ERROR_DETAIL;
};

const AUDIT_FAILURE_DECISIONS = ["failed_approved", "failed_rejected"] as const;

const auditDecisionLabel = (decision: string) => {
  switch (decision) {
    case "approved":
      return "Έγκριση";
    case "rejected":
      return "Απόρριψη";
    case "failed_approved":
      return "Αποτυχία έγκρισης";
    case "failed_rejected":
      return "Αποτυχία απόρριψης";
    default:
      return decision;
  }
};

// Common timezone options for audit log filtering
const AUDIT_TIMEZONE_OPTIONS = [
  "Europe/Athens",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Australia/Sydney",
];

// Compute the UTC timestamp (ms) for a wall-clock instant in a given IANA timezone.
// `dateStr` = "YYYY-MM-DD", `timeStr` = "HH:mm:ss.SSS"
const wallClockToUtcMs = (dateStr: string, timeStr: string, timeZone: string): number => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hPart, mPart = "0", sPartFull = "0"] = timeStr.split(":");
  const [sPart, msPart = "0"] = sPartFull.split(".");
  const h = Number(hPart);
  const min = Number(mPart);
  const s = Number(sPart);
  const ms = Number(msPart.padEnd(3, "0").slice(0, 3));
  const utcGuess = Date.UTC(y, (m ?? 1) - 1, d ?? 1, h, min, s, ms);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date(utcGuess));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  let hour = get("hour");
  if (hour === 24) hour = 0;
  const asUtcOfTzWall = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    hour,
    get("minute"),
    get("second"),
    ms,
  );
  const offset = asUtcOfTzWall - utcGuess;
  return utcGuess - offset;
};

const claimStatusLabel = (status: string) => {
  switch (status) {
    case "pending":
      return "Σε εκκρεμότητα";
    case "approved":
      return "Εγκεκριμένο";
    case "rejected":
      return "Απορριφθέν";
    default:
      return status;
  }
};

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { session } = useClerk();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [pendingRows, setPendingRows] = useState<DoctorProfile[]>([]);
  const [verifiedRows, setVerifiedRows] = useState<DoctorProfile[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [verifiedTotal, setVerifiedTotal] = useState(0);
  const [pendingPage, setPendingPage] = useState(0);
  const [verifiedPage, setVerifiedPage] = useState(0);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [verifiedLoading, setVerifiedLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [claims, setClaims] = useState<ClinicClaim[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<ClinicClaim | null>(null);
  const [lowCompletenessOnly, setLowCompletenessOnly] = useState(false);
  const [sortByCompleteness, setSortByCompleteness] = useState(true);
  type ClaimStatusFilter = "pending" | "approved" | "all";
  const CLAIM_FILTER_KEY = "admin.claimStatusFilter";
  const [claimStatusFilter, setClaimStatusFilter] = useState<ClaimStatusFilter>(() => {
    if (typeof window === "undefined") return "pending";
    const stored = window.localStorage.getItem(CLAIM_FILTER_KEY);
    return stored === "approved" || stored === "all" || stored === "pending" ? stored : "pending";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CLAIM_FILTER_KEY, claimStatusFilter);
    }
  }, [claimStatusFilter]);

  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditExporting, setAuditExporting] = useState(false);
  const [auditExportProgress, setAuditExportProgress] = useState<{
    rows: number;
    bytes: number;
    estimatedRows: number | null;
    etaSeconds: number | null;
    elapsedMs: number;
  } | null>(null);
  const [auditFailuresOnly, setAuditFailuresOnly] = useState(false);
  const [auditClaimSearchInput, setAuditClaimSearchInput] = useState("");
  const [auditClaimSearch, setAuditClaimSearch] = useState("");
  const [auditDateFrom, setAuditDateFrom] = useState(""); // YYYY-MM-DD
  const [auditDateTo, setAuditDateTo] = useState("");     // YYYY-MM-DD
  const browserTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch (_e) {
      return "UTC";
    }
  }, []);
  const [auditTimezone, setAuditTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Athens";
    } catch (_e) {
      return "Europe/Athens";
    }
  });

  const CSV_BOM_KEY = "admin.csvExportBom";
  const CSV_DELIMITER_KEY = "admin.csvExportDelimiter";
  type CsvDelimiter = "comma" | "semicolon" | "tab";
  const [csvIncludeBom, setCsvIncludeBom] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(CSV_BOM_KEY);
    return stored === null ? true : stored === "true";
  });
  const [csvDelimiter, setCsvDelimiter] = useState<CsvDelimiter>(() => {
    if (typeof window === "undefined") return "comma";
    const stored = window.localStorage.getItem(CSV_DELIMITER_KEY);
    return stored === "semicolon" || stored === "tab" || stored === "comma" ? stored : "comma";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CSV_BOM_KEY, String(csvIncludeBom));
    }
  }, [csvIncludeBom]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CSV_DELIMITER_KEY, csvDelimiter);
    }
  }, [csvDelimiter]);

  const CSV_DATE_FORMAT_KEY = "admin.csvExportDateFormat";
  type CsvDateFormat = "iso_utc" | "excel_local";
  const [csvDateFormat, setCsvDateFormat] = useState<CsvDateFormat>(() => {
    if (typeof window === "undefined") return "iso_utc";
    const stored = window.localStorage.getItem(CSV_DATE_FORMAT_KEY);
    return stored === "excel_local" || stored === "iso_utc" ? stored : "iso_utc";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CSV_DATE_FORMAT_KEY, csvDateFormat);
    }
  }, [csvDateFormat]);
  const auditDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (auditDebounceRef.current) clearTimeout(auditDebounceRef.current);
    auditDebounceRef.current = setTimeout(() => {
      setAuditClaimSearch(auditClaimSearchInput.trim());
    }, 250);
    return () => {
      if (auditDebounceRef.current) clearTimeout(auditDebounceRef.current);
    };
  }, [auditClaimSearchInput]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput.trim());
      setPendingPage(0);
      setVerifiedPage(0);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    (async () => {
      const token = await session?.getToken();
      const res = await fetch(`${BASE}/api/admin/roles/check`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) { setIsAdmin(false); return; }
      const data = await res.json();
      setIsAdmin(data.is_admin === true);
    })();
  }, [user, authLoading, navigate]);

  const loadDoctors = useCallback(
    async (verified: boolean, page: number) => {
      const setRows = verified ? setVerifiedRows : setPendingRows;
      const setTotal = verified ? setVerifiedTotal : setPendingTotal;
      const setLoading = verified ? setVerifiedLoading : setPendingLoading;
      setLoading(true);
      try {
        const token = await session?.getToken();
        const params = new URLSearchParams({
          verified: String(verified),
          limit: String(PAGE_SIZE),
          offset: String(page * PAGE_SIZE),
        });
        if (search) params.set("search", search);
        const res = await fetch(`${BASE}/api/admin/doctors?${params}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { doctors, total } = await res.json();
        setRows(doctors ?? []);
        setTotal(total ?? 0);
      } catch (err: any) {
        toast({
          title: "Σφάλμα φόρτωσης",
          description: `Δεν ήταν δυνατή η φόρτωση των ${verified ? "πιστοποιημένων" : "εκκρεμών"} ιατρών. ${err?.message ?? ""}`,
          variant: "destructive",
        });
        setRows([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [search, session],
  );

  const loadClaims = useCallback(async () => {
    setClaimsLoading(true);
    try {
      const token = await session?.getToken();
      const res = await fetch(`${BASE}/api/admin/claims?status=all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setClaims(await res.json());
    } catch (_e) { setClaims([]); }
    setClaimsLoading(false);
  }, [session]);

  const loadAuditLog = useCallback(async () => {
    setAuditLoading(true);
    try {
      const token = await session?.getToken();
      const res = await fetch(`${BASE}/api/admin/audit-log?limit=500`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAuditEntries(await res.json());
    } catch (err: any) {
      toast({
        title: "Σφάλμα φόρτωσης audit log",
        description: err?.message,
        variant: "destructive",
      });
      setAuditEntries([]);
    }
    setAuditLoading(false);
  }, [session]);

  useEffect(() => {
    if (isAdmin) loadDoctors(true, verifiedPage);
  }, [isAdmin, verifiedPage, loadDoctors]);

  useEffect(() => {
    if (isAdmin) loadClaims();
  }, [isAdmin, loadClaims]);

  useEffect(() => {
    if (isAdmin) loadAuditLog();
  }, [isAdmin, loadAuditLog]);

  const updateDoctor = async (id: string, patch: Partial<DoctorProfile>) => {
    const target =
      pendingRows.find((d) => d.id === id) ||
      verifiedRows.find((d) => d.id === id) ||
      selectedDoctor;
    const doctorName = target?.full_name ?? "ιατρού";
    let actionLabel = "Ενημέρωση";
    if (patch.verified === true) actionLabel = "Πιστοποίηση";
    else if (patch.verified === false) actionLabel = "Ανάκληση πιστοποίησης";
    else if (patch.is_published === true) actionLabel = "Δημοσίευση";
    else if (patch.is_published === false) actionLabel = "Απόκρυψη";

    setBusyId(id);
    let updateError: string | null = null;
    try {
      const token = await session?.getToken();
      const res = await fetch(`${BASE}/api/admin/doctors/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        updateError = err?.error || `HTTP ${res.status}`;
      }
    } catch (err: any) {
      updateError = err?.message ?? "Network error";
    }
    setBusyId(null);
    if (updateError) {
      toast({
        title: `Δεν ήταν δυνατή η ενέργεια: ${actionLabel}`,
        description: `Το προφίλ του ${doctorName} δεν ενημερώθηκε. Δοκιμάστε ξανά σε λίγο. Λεπτομέρειες: ${updateError}`,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: `${actionLabel}: επιτυχής ενημέρωση`,
      description: `Το προφίλ του ${doctorName} ενημερώθηκε με επιτυχία.`,
    });
    if (patch.verified !== undefined) {
      // Row moves between pending/verified tables → refetch both
      loadDoctors(false, pendingPage);
      loadDoctors(true, verifiedPage);
    } else {
      setPendingRows((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
      setVerifiedRows((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    }
    setSelectedDoctor((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  };

  const toggleVerified = (d: DoctorProfile) =>
    updateDoctor(d.id, {
      verified: !d.verified,
      verified_at: !d.verified ? new Date().toISOString() : null,
    });

  const togglePublished = (d: DoctorProfile) =>
    updateDoctor(d.id, { is_published: !d.is_published });

  const refetchClaim = async (id: string, attempt = 0): Promise<void> => {
    try {
      const token = await session?.getToken();
      const res = await fetch(`${BASE}/api/admin/claims?status=all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const all: ClinicClaim[] = await res.json();
      const fresh = all.find((c) => c.id === id) ?? null;
      if (!fresh) {
        setClaims((prev) => prev.filter((c) => c.id !== id));
        setSelectedClaim((prev) => (prev && prev.id === id ? null : prev));
      } else {
        setClaims((prev) => prev.map((c) => (c.id === id ? fresh : c)));
        setSelectedClaim((prev) => (prev && prev.id === id ? fresh : prev));
      }
    } catch (err: any) {
      if (attempt < 1) {
        await new Promise((r) => setTimeout(r, 600));
        return refetchClaim(id, attempt + 1);
      }
      console.warn("Failed to refetch claim after rollback:", err?.message);
    }
  };

  const insertAuditLogWithRetry = async (
    payload: {
      claim_id: string;
      admin_id: string;
      decision: string;
      note: string | null;
      error_detail?: string | null;
    },
    maxAttempts = 3,
  ): Promise<{ ok: boolean; error?: string }> => {
    let lastError: string | undefined;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const token = await session?.getToken();
        const res = await fetch(`${BASE}/api/admin/audit-log`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
        if (res.ok || res.status === 201) return { ok: true };
        const err = await res.json().catch(() => ({}));
        lastError = err?.error || `HTTP ${res.status}`;
      } catch (err: any) {
        lastError = err?.message ?? "Network error";
      }
      console.warn(`Audit log insert failed (attempt ${attempt}/${maxAttempts}) for claim ${payload.claim_id}: ${lastError}`);
      if (attempt < maxAttempts) {
        const delay = 250 * 2 ** (attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    return { ok: false, error: lastError };
  };

  const updateClaim = async (
    id: string,
    status: "approved" | "rejected",
    note?: string,
  ) => {
    if (busyId) return;
    const target = claims.find((c) => c.id === id);
    if (!target || target.status !== "pending") return;

    const prevClaims = claims;
    const prevSelected = selectedClaim;
    const trimmedNote = note?.trim() ? note.trim() : null;
    setClaims((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status, decision_note: trimmedNote } : c)),
    );
    setSelectedClaim((prev) =>
      prev && prev.id === id ? { ...prev, status, decision_note: trimmedNote } : prev,
    );
    setBusyId(id);
    let claimError: string | null = null;
    try {
      const token = await session?.getToken();
      const res = await fetch(`${BASE}/api/admin/claims/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status, decision_note: trimmedNote }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        claimError = err?.error || `HTTP ${res.status}`;
      }
    } catch (err: any) {
      claimError = err?.message ?? "Network error";
    }
    setBusyId(null);
    if (claimError) {
      setClaims(prevClaims);
      setSelectedClaim(prevSelected);
      const actionLabel = status === "approved" ? "Έγκριση" : "Απόρριψη";
      const statusLabel = claimStatusLabel(target.status);
      toast({
        title: `Δεν ήταν δυνατή η ενέργεια: ${actionLabel} αιτήματος`,
        description: `Το αίτημα (κατάσταση: ${statusLabel}) δεν ενημερώθηκε. Λεπτομέρειες: ${claimError}`,
        variant: "destructive",
      });
      if (user?.id) {
        const failureDecision: "failed_approved" | "failed_rejected" =
          status === "approved" ? "failed_approved" : "failed_rejected";
        await insertAuditLogWithRetry({
          claim_id: id,
          admin_id: user.id,
          decision: failureDecision,
          note: trimmedNote,
          error_detail: safeErrorDetail(claimError),
        });
      }
      void refetchClaim(id);
      void loadAuditLog();
      return;
    }
    if (user?.id) {
      await insertAuditLogWithRetry({
        claim_id: id,
        admin_id: user.id,
        decision: status,
        note: trimmedNote,
      });
    }
    toast({
      title: status === "approved" ? "Έγκριση: επιτυχής ενημέρωση" : "Απόρριψη: επιτυχής ενημέρωση",
      description: `Η κατάσταση του αιτήματος ορίστηκε σε «${claimStatusLabel(status)}».`,
    });
    void loadAuditLog();
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Μη εξουσιοδοτημένη πρόσβαση</CardTitle>
            <CardDescription>
              Αυτή η σελίδα είναι διαθέσιμη μόνο σε διαχειριστές.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/">Επιστροφή</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lowFilter = (d: DoctorProfile) => !lowCompletenessOnly || getCompleteness(d).percent < 60;
  const sortFn = (a: DoctorProfile, b: DoctorProfile) =>
    getCompleteness(a).percent - getCompleteness(b).percent;
  const shouldSort = lowCompletenessOnly && sortByCompleteness;
  const applySort = (list: DoctorProfile[]) => (shouldSort ? [...list].sort(sortFn) : list);
  const pendingDoctors = applySort(pendingRows.filter(lowFilter));
  const verifiedDoctors = applySort(verifiedRows.filter(lowFilter));
  const lowCount =
    pendingRows.filter((d) => getCompleteness(d).percent < 60).length +
    verifiedRows.filter((d) => getCompleteness(d).percent < 60).length;
  const pendingClaims = claims.filter((c) => c.status === "pending");
  const approvedClaims = claims.filter((c) => c.status === "approved");
  const decidedClaims = claims.filter((c) => c.status !== "pending");
  const claimCounts = {
    pending: pendingClaims.length,
    approved: approvedClaims.length,
    all: claims.length,
  };
  const auditFailureCount = auditEntries.filter((e) =>
    AUDIT_FAILURE_DECISIONS.includes(e.decision as typeof AUDIT_FAILURE_DECISIONS[number]),
  ).length;
  const auditFromMs = auditDateFrom ? wallClockToUtcMs(auditDateFrom, "00:00:00.000", auditTimezone) : null;
  const auditToMs = auditDateTo ? wallClockToUtcMs(auditDateTo, "23:59:59.999", auditTimezone) : null;
  const filteredAuditEntries = auditEntries.filter((e) => {
    if (auditFailuresOnly && !AUDIT_FAILURE_DECISIONS.includes(e.decision as typeof AUDIT_FAILURE_DECISIONS[number])) {
      return false;
    }
    if (auditClaimSearch && !e.claim_id.toLowerCase().includes(auditClaimSearch.toLowerCase())) {
      return false;
    }
    if (auditFromMs !== null || auditToMs !== null) {
      const ts = new Date(e.created_at).getTime();
      if (auditFromMs !== null && ts < auditFromMs) return false;
      if (auditToMs !== null && ts > auditToMs) return false;
    }
    return true;
  });

  const exportAuditCsv = async () => {
    if (auditExporting) return;
    setAuditExporting(true);
    setAuditExportProgress({
      rows: 0,
      bytes: 0,
      estimatedRows: Math.max(filteredAuditEntries.length, 0) || null,
      etaSeconds: null,
      elapsedMs: 0,
    });
    try {
      const fromIso = auditFromMs !== null ? new Date(auditFromMs).toISOString() : null;
      const toIso = auditToMs !== null ? new Date(auditToMs).toISOString() : null;
      const trimmedClaim = auditClaimSearch.trim();

      const token = await session?.getToken();
      if (!token) throw new Error("Δεν υπάρχει ενεργή συνεδρία.");

      const exportParams = new URLSearchParams({ limit: "5000" });
      if (fromIso) exportParams.set("from_iso", fromIso);
      if (toIso) exportParams.set("to_iso", toIso);
      if (auditFailuresOnly) exportParams.set("failures_only", "true");
      if (trimmedClaim) exportParams.set("claim_id", trimmedClaim);
      const res = await fetch(`${BASE}/api/admin/audit-log?${exportParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        let detail = `${res.status} ${res.statusText}`;
        try { const j = await res.json(); if (j?.error) detail = j.error; } catch (_e) { /* ignore parse errors */ }
        throw new Error(detail);
      }

      const rows: AuditLogEntry[] = await res.json();

      if (rows.length === 0) {
        toast({
          title: "Δεν υπάρχουν δεδομένα προς εξαγωγή",
          description: "Προσαρμόστε τα φίλτρα και δοκιμάστε ξανά.",
          variant: "destructive",
        });
        return;
      }

      const delimChar = csvDelimiter === "semicolon" ? ";" : csvDelimiter === "tab" ? "\t" : ",";
      const escape = (v: unknown) => {
        const s = v == null ? "" : String(v);
        return s.includes(delimChar) || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const cols: (keyof AuditLogEntry)[] = ["created_at", "claim_id", "admin_id", "decision", "note", "error_detail"];
      const header = cols.join(delimChar);
      const dataLines = rows.map((r) => cols.map((c) => escape(r[c])).join(delimChar));
      const bom = csvIncludeBom ? "\uFEFF" : "";
      const csvText = bom + [header, ...dataLines].join("\r\n");

      setAuditExportProgress({ rows: rows.length, bytes: csvText.length, estimatedRows: rows.length, etaSeconds: 0, elapsedMs: 0 });

      const ext = csvDelimiter === "tab" ? "tsv" : "csv";
      const mime = csvDelimiter === "tab" ? "text/tab-separated-values;charset=utf-8;" : "text/csv;charset=utf-8;";
      const blob = new Blob([csvText], { type: mime });
      const dl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const fromLabel = auditDateFrom || "all";
      const toLabel = auditDateTo || "all";
      const tzLabel = auditTimezone.replace(/\//g, "-");
      a.href = dl;
      a.download = `audit-log_${fromLabel}_to_${toLabel}_${tzLabel}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(dl);

      toast({
        title: "Επιτυχής εξαγωγή",
        description: `Εξήχθησαν ${rows.length} εγγραφές.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Άγνωστο σφάλμα";
      toast({ title: "Αποτυχία εξαγωγής", description: message, variant: "destructive" });
    } finally {
      setAuditExporting(false);
      setAuditExportProgress(null);
    }
  };
  const pendingPageCount = Math.max(1, Math.ceil(pendingTotal / PAGE_SIZE));
  const verifiedPageCount = Math.max(1, Math.ceil(verifiedTotal / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" /> Αρχική</Link>
            </Button>
            <h1 className="text-xl font-semibold">Πίνακας Διαχειριστή</h1>
          </div>
          <Badge variant="secondary">Admin</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Εκκρεμή προφίλ" value={pendingTotal} />
          <StatCard label="Πιστοποιημένα" value={verifiedTotal} />
          <StatCard label="Εκκρεμείς διεκδικήσεις" value={pendingClaims.length} />
        </div>

        <Tabs defaultValue="doctors" className="w-full">
          <TabsList>
            <TabsTrigger value="doctors">Ιατρικά προφίλ</TabsTrigger>
            <TabsTrigger value="claims">Διεκδικήσεις κλινικών</TabsTrigger>
            <TabsTrigger value="audit">Audit log</TabsTrigger>
          </TabsList>

          <TabsContent value="doctors" className="space-y-6">
            <div className="space-y-3 rounded-lg border bg-background px-4 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="doctor-search" className="text-sm font-medium">
                  Αναζήτηση ιατρών
                </Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="doctor-search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Όνομα, email, ειδικότητα ή πόλη…"
                    className="pl-9"
                  />
                </div>
                {search && (
                  <p className="text-xs text-muted-foreground">
                    Αποτελέσματα για «{search}» — {pendingTotal} εκκρεμή, {verifiedTotal} πιστοποιημένα.
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <div className="space-y-0.5">
                  <Label htmlFor="low-completeness" className="text-sm font-medium">
                    Μόνο ελλιπή προφίλ (&lt; 60%) στην τρέχουσα σελίδα
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {lowCount} προφίλ κάτω από το όριο πληρότητας στις φορτωμένες σελίδες.
                  </p>
                </div>
                <Switch
                  id="low-completeness"
                  checked={lowCompletenessOnly}
                  onCheckedChange={setLowCompletenessOnly}
                />
              </div>
              {lowCompletenessOnly && (
                <div className="flex items-center justify-between border-t pt-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="sort-completeness" className="text-sm font-medium">
                      Ταξινόμηση κατά πληρότητα (αύξουσα)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Εμφάνιση πρώτα των προφίλ με τη χαμηλότερη πληρότητα.
                    </p>
                  </div>
                  <Switch
                    id="sort-completeness"
                    checked={sortByCompleteness}
                    onCheckedChange={setSortByCompleteness}
                  />
                </div>
              )}
            </div>
            <DoctorsTable
              title="Εκκρεμή για έγκριση"
              description="Νέα προφίλ που δεν έχουν ακόμη πιστοποιηθεί."
              rows={pendingDoctors}
              loading={pendingLoading}
              busyId={busyId}
              onToggleVerified={toggleVerified}
              onTogglePublished={togglePublished}
              onView={setSelectedDoctor}
              showMissing={lowCompletenessOnly}
              page={pendingPage}
              pageCount={pendingPageCount}
              total={pendingTotal}
              onPageChange={setPendingPage}
            />
            <DoctorsTable
              title="Πιστοποιημένα προφίλ"
              description="Προφίλ με ενεργό σήμα Verified."
              rows={verifiedDoctors}
              loading={verifiedLoading}
              busyId={busyId}
              onToggleVerified={toggleVerified}
              onTogglePublished={togglePublished}
              onView={setSelectedDoctor}
              showMissing={lowCompletenessOnly}
              page={verifiedPage}
              pageCount={verifiedPageCount}
              total={verifiedTotal}
              onPageChange={setVerifiedPage}
            />
          </TabsContent>

          <TabsContent value="claims" className="space-y-6">
            <div className="flex flex-col gap-2 rounded-lg border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Φίλτρο κατάστασης</Label>
                <p className="text-xs text-muted-foreground">
                  Η επιλογή αποθηκεύεται για την επόμενη επίσκεψη.
                </p>
              </div>
              <ToggleGroup
                type="single"
                value={claimStatusFilter}
                onValueChange={(v) => {
                  if (v === "pending" || v === "approved" || v === "all") {
                    setClaimStatusFilter(v);
                  }
                }}
                variant="outline"
                size="sm"
                aria-label="Φίλτρο κατάστασης διεκδικήσεων"
              >
                <ToggleGroupItem value="pending">
                  Εκκρεμείς ({claimCounts.pending})
                </ToggleGroupItem>
                <ToggleGroupItem value="approved">
                  Εγκεκριμένες ({claimCounts.approved})
                </ToggleGroupItem>
                <ToggleGroupItem value="all">
                  Όλες ({claimCounts.all})
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {(claimStatusFilter === "pending" || claimStatusFilter === "all") && (
              <ClaimsTable
                title="Εκκρεμείς διεκδικήσεις"
                rows={pendingClaims}
                loading={claimsLoading}
                busyId={busyId}
                onDecide={updateClaim}
                onView={setSelectedClaim}
                showActions
              />
            )}
            {(claimStatusFilter === "approved" || claimStatusFilter === "all") && (
              <ClaimsTable
                title={claimStatusFilter === "approved" ? "Εγκεκριμένες διεκδικήσεις" : "Ιστορικό αποφάσεων"}
                rows={claimStatusFilter === "approved" ? approvedClaims : decidedClaims}
                loading={claimsLoading}
                busyId={busyId}
                onDecide={updateClaim}
                onView={setSelectedClaim}
                showActions={false}
              />
            )}
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <div className="flex flex-col gap-3 rounded-lg border bg-background px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="audit-claim-search" className="text-sm font-medium">
                  Αναζήτηση ανά Claim ID
                </Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="audit-claim-search"
                    value={auditClaimSearchInput}
                    onChange={(e) => setAuditClaimSearchInput(e.target.value)}
                    placeholder="UUID ή τμήμα UUID…"
                    className="pl-9 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 sm:pb-1">
                <Switch
                  id="audit-failures-only"
                  checked={auditFailuresOnly}
                  onCheckedChange={setAuditFailuresOnly}
                />
                <Label htmlFor="audit-failures-only" className="text-sm">
                  Μόνο αποτυχίες ({auditFailureCount})
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadAuditLog()}
                  disabled={auditLoading}
                  className="ml-2"
                >
                  Ανανέωση
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border bg-background px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="grid grid-cols-1 gap-3 flex-1 sm:grid-cols-3 sm:max-w-2xl">
                  <div className="space-y-1.5">
                    <Label htmlFor="audit-date-from" className="text-sm font-medium">
                      Από
                    </Label>
                    <Input
                      id="audit-date-from"
                      type="date"
                      value={auditDateFrom}
                      onChange={(e) => setAuditDateFrom(e.target.value)}
                      max={auditDateTo || undefined}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="audit-date-to" className="text-sm font-medium">
                      Έως
                    </Label>
                    <Input
                      id="audit-date-to"
                      type="date"
                      value={auditDateTo}
                      onChange={(e) => setAuditDateTo(e.target.value)}
                      min={auditDateFrom || undefined}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="audit-timezone" className="text-sm font-medium">
                      Ζώνη ώρας
                    </Label>
                    <Select value={auditTimezone} onValueChange={setAuditTimezone}>
                      <SelectTrigger id="audit-timezone">
                        <SelectValue placeholder="Επιλέξτε ζώνη ώρας" />
                      </SelectTrigger>
                      <SelectContent>
                        {(AUDIT_TIMEZONE_OPTIONS.includes(browserTimezone)
                          ? AUDIT_TIMEZONE_OPTIONS
                          : [browserTimezone, ...AUDIT_TIMEZONE_OPTIONS]
                        ).map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                            {tz === browserTimezone ? " (browser)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-3 sm:pb-1">
                  <div className="space-y-1">
                    <Label htmlFor="csv-delimiter" className="text-xs font-medium text-muted-foreground">
                      Διαχωριστικό CSV
                    </Label>
                    <Select
                      value={csvDelimiter}
                      onValueChange={(v) => setCsvDelimiter(v as typeof csvDelimiter)}
                    >
                      <SelectTrigger id="csv-delimiter" className="h-9 w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comma">Κόμμα , (US/UK Excel)</SelectItem>
                        <SelectItem value="semicolon">Άνω-κάτω τελεία ; (EU Excel)</SelectItem>
                        <SelectItem value="tab">Tab (TSV — auto)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="csv-date-format" className="text-xs font-medium text-muted-foreground">
                      Μορφή ημερομηνίας
                    </Label>
                    <Select
                      value={csvDateFormat}
                      onValueChange={(v) => setCsvDateFormat(v as CsvDateFormat)}
                    >
                      <SelectTrigger id="csv-date-format" className="h-9 w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iso_utc">ISO 8601 UTC (machine)</SelectItem>
                        <SelectItem value="excel_local">
                          Local Excel ({auditTimezone})
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 h-9">
                    <Switch
                      id="csv-bom"
                      checked={csvIncludeBom}
                      onCheckedChange={setCsvIncludeBom}
                    />
                    <Label htmlFor="csv-bom" className="text-sm cursor-pointer">
                      UTF-8 BOM
                    </Label>
                  </div>
                  {(auditDateFrom || auditDateTo) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAuditDateFrom("");
                        setAuditDateTo("");
                      }}
                    >
                      Καθαρισμός
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={exportAuditCsv}
                    disabled={auditExporting}
                  >
                    {auditExporting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Εξαγωγή…
                      </>
                    ) : (
                      `Εξαγωγή ${csvDelimiter === "tab" ? "TSV" : "CSV"} (όλες)`
                    )}
                  </Button>
                </div>
              </div>
              {auditExporting && auditExportProgress && (() => {
                const { rows, bytes, estimatedRows, etaSeconds, elapsedMs } = auditExportProgress;
                const hasEstimate = estimatedRows !== null && estimatedRows > 0;
                // Cap percent at 99 until the stream finishes so users don't
                // see "100%" while we're still writing the blob/download.
                const percent = hasEstimate
                  ? Math.min(99, Math.round((rows / (estimatedRows as number)) * 100))
                  : null;
                const fmtBytes = (n: number) => {
                  if (n < 1024) return `${n} B`;
                  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
                  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
                };
                const fmtEta = (s: number) => {
                  if (s < 1) return "<1δ";
                  if (s < 60) return `~${s}δ`;
                  const m = Math.floor(s / 60);
                  const r = s % 60;
                  return r === 0 ? `~${m}λ` : `~${m}λ ${r}δ`;
                };
                return (
                  <div
                    className="rounded-md border bg-muted/40 p-3 space-y-2"
                    role="status"
                    aria-live="polite"
                    aria-label="Πρόοδος εξαγωγής CSV"
                  >
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden />
                        <span className="font-medium">
                          {rows.toLocaleString("el-GR")}
                          {hasEstimate ? ` / ~${(estimatedRows as number).toLocaleString("el-GR")}` : ""} εγγραφές
                        </span>
                        <span className="text-muted-foreground">· {fmtBytes(bytes)}</span>
                      </div>
                      <div className="text-muted-foreground tabular-nums">
                        {percent !== null && <span className="mr-2">{percent}%</span>}
                        <span>Πέρασαν {(elapsedMs / 1000).toFixed(1)}δ</span>
                        {etaSeconds !== null && (
                          <span className="ml-2">· Απομένουν {fmtEta(etaSeconds)}</span>
                        )}
                      </div>
                    </div>
                    {percent !== null ? (
                      <Progress value={percent} className="h-1.5" />
                    ) : (
                      // Indeterminate-style throbber when we have no estimate.
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full w-1/3 animate-pulse rounded-full bg-primary/70" />
                      </div>
                    )}
                  </div>
                );
              })()}
              <p className="text-xs text-muted-foreground">
                Οι ώρες Από/Έως ερμηνεύονται στη ζώνη <span className="font-medium text-foreground">{auditTimezone}</span> (00:00 – 23:59:59.999) και αντιστοιχούν στις ώρες του πίνακα παρακάτω. Η εξαγωγή τραβά <span className="font-medium text-foreground">όλες</span> τις εγγραφές που ταιριάζουν στα φίλτρα. Επιλέξτε <span className="font-medium text-foreground">;</span> για Excel σε ελληνικά/ευρωπαϊκά locales, <span className="font-medium text-foreground">,</span> για US/UK, ή <span className="font-medium text-foreground">Tab</span> για αυτόματη ανίχνευση. Το <span className="font-medium text-foreground">UTF-8 BOM</span> είναι απαραίτητο για σωστή εμφάνιση ελληνικών στο Excel για Windows.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Audit log αποφάσεων ({filteredAuditEntries.length}{auditEntries.length !== filteredAuditEntries.length ? ` / ${auditEntries.length}` : ""})
                </CardTitle>
                <CardDescription>
                  Εμφανίζονται οι πιο πρόσφατες 500 εγγραφές. Οι αποτυχίες περιλαμβάνουν λόγο σφάλματος.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {auditLoading ? (
                  <div className="p-6 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : filteredAuditEntries.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">
                    Δεν βρέθηκαν εγγραφές για τα τρέχοντα φίλτρα.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ημερομηνία</TableHead>
                        <TableHead>Απόφαση</TableHead>
                        <TableHead>Claim ID</TableHead>
                        <TableHead>Σημείωση</TableHead>
                        <TableHead>Λεπτομέρειες σφάλματος</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAuditEntries.map((entry) => {
                        const isFailure = AUDIT_FAILURE_DECISIONS.includes(
                          entry.decision as typeof AUDIT_FAILURE_DECISIONS[number],
                        );
                        return (
                          <TableRow key={entry.id}>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(entry.created_at).toLocaleString("el-GR", { timeZone: auditTimezone })}
                            </TableCell>
                            <TableCell>
                              <Badge variant={isFailure ? "destructive" : "secondary"}>
                                {auditDecisionLabel(entry.decision)}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{entry.claim_id}</TableCell>
                            <TableCell className="text-sm max-w-[240px] truncate" title={entry.note ?? ""}>
                              {entry.note ?? <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-xs text-destructive max-w-[280px] truncate" title={entry.error_detail ?? ""}>
                              {entry.error_detail ?? <span className="text-muted-foreground">—</span>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <DoctorDetailsSheet
        doctor={selectedDoctor}
        busyId={busyId}
        onOpenChange={(open) => !open && setSelectedDoctor(null)}
        onToggleVerified={toggleVerified}
        onTogglePublished={togglePublished}
      />
      <ClaimDetailsSheet
        claim={selectedClaim}
        busyId={busyId}
        onOpenChange={(open) => !open && setSelectedClaim(null)}
        onDecide={updateClaim}
        allClaims={claims}
      />
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <Card>
    <CardContent className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-semibold mt-1">{value}</p>
    </CardContent>
  </Card>
);

const DoctorsTable = ({
  title,
  description,
  rows,
  loading,
  busyId,
  onToggleVerified,
  onTogglePublished,
  onView,
  showMissing = false,
  page,
  pageCount,
  total,
  onPageChange,
}: {
  title: string;
  description?: string;
  rows: DoctorProfile[];
  loading: boolean;
  busyId: string | null;
  onToggleVerified: (d: DoctorProfile) => void;
  onTogglePublished: (d: DoctorProfile) => void;
  onView: (d: DoctorProfile) => void;
  showMissing?: boolean;
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (next: number) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent>
      {loading && rows.length === 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Όνομα</TableHead>
              <TableHead>Ειδικότητα</TableHead>
              <TableHead>Πόλη</TableHead>
              <TableHead>Πληρότητα</TableHead>
              <TableHead>Πλάνο</TableHead>
              <TableHead>Κατάσταση</TableHead>
              <TableHead className="text-right">Ενέργειες</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`sk-${i}`}>
                <TableCell>
                  <Skeleton className="h-4 w-32 mb-1.5" />
                  <Skeleton className="h-3 w-40" />
                </TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell>
                  <div className="w-28 space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-1.5 w-full" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-28" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Δεν υπάρχουν εγγραφές.</p>
      ) : (
        <div
          className={cn(
            "relative transition-opacity duration-200",
            loading && "opacity-60 pointer-events-none",
          )}
          aria-busy={loading}
        >
          {loading && (
            <div className="absolute right-2 top-2 z-10">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Όνομα</TableHead>
                <TableHead>Ειδικότητα</TableHead>
                <TableHead>Πόλη</TableHead>
                <TableHead>Πληρότητα</TableHead>
                <TableHead>Πλάνο</TableHead>
                <TableHead>Κατάσταση</TableHead>
                <TableHead className="text-right">Ενέργειες</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="font-medium">{d.full_name}</div>
                    <div className="text-xs text-muted-foreground">{d.email ?? "—"}</div>
                  </TableCell>
                  <TableCell>{d.specialty ?? "—"}</TableCell>
                  <TableCell>{d.city ?? "—"}</TableCell>
                  <TableCell>
                    <CompletenessIndicator doctor={d} compact showMissing={showMissing} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.subscription_tier === "free" ? "outline" : "default"}>
                      {d.subscription_tier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {d.verified && <Badge variant="default">Verified</Badge>}
                      {d.is_published ? (
                        <Badge variant="secondary">Published</Badge>
                      ) : (
                        <Badge variant="outline">Hidden</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => onView(d)}>
                        <FileSearch className="h-4 w-4 mr-1" /> Λεπτομέρειες
                      </Button>
                      <Button
                        size="sm"
                        variant={d.verified ? "outline" : "default"}
                        disabled={busyId === d.id}
                        onClick={() => onToggleVerified(d)}
                      >
                        {d.verified ? (
                          <><ShieldOff className="h-4 w-4 mr-1" /> Αφαίρεση</>
                        ) : (
                          <><ShieldCheck className="h-4 w-4 mr-1" /> Πιστοποίηση</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === d.id}
                        onClick={() => onTogglePublished(d)}
                      >
                        {d.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 border-t pt-3 mt-3 text-xs text-muted-foreground min-h-[2.25rem]">
        {loading && rows.length === 0 ? (
          <Skeleton className="h-4 w-48" />
        ) : total > 0 ? (
          <>
            <span>
              Σελίδα {page + 1} από {pageCount} · {total} συνολικά
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 0 || loading}
                onClick={() => onPageChange(Math.max(0, page - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Προηγ.
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page + 1 >= pageCount || loading}
                onClick={() => onPageChange(page + 1)}
              >
                Επόμ. <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </CardContent>
  </Card>
);

const ClaimsTable = ({
  title,
  rows,
  loading,
  busyId,
  onDecide,
  onView,
  showActions,
}: {
  title: string;
  rows: ClinicClaim[];
  loading: boolean;
  busyId: string | null;
  onDecide: (id: string, status: "approved" | "rejected", note?: string) => void;
  onView: (c: ClinicClaim) => void;
  showActions: boolean;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {loading && rows.length === 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Κλινική</TableHead>
              <TableHead>Χρήστης</TableHead>
              <TableHead>Ημερομηνία</TableHead>
              <TableHead>Κατάσταση</TableHead>
              <TableHead className="text-right">Ενέργειες</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={`csk-${i}`}>
                <TableCell>
                  <Skeleton className="h-4 w-40 mb-1.5" />
                  <Skeleton className="h-3 w-24" />
                </TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Δεν υπάρχουν εγγραφές.</p>
      ) : (
        <div
          className={cn(
            "relative transition-opacity duration-200",
            loading && "opacity-60 pointer-events-none",
          )}
          aria-busy={loading}
        >
          {loading && (
            <div className="absolute right-2 top-2 z-10">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Κλινική</TableHead>
              <TableHead>Χρήστης</TableHead>
              <TableHead>Ημερομηνία</TableHead>
              <TableHead>Κατάσταση</TableHead>
              <TableHead className="text-right">Ενέργειες</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => {
              const clinic = privateClinics.find((cl) => String(cl.id) === c.clinic_id);
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium text-sm line-clamp-1">{clinic?.name ?? c.clinic_id}</div>
                    <div className="text-xs text-muted-foreground">{clinic?.regionalUnit ?? "—"}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{c.user_id.slice(0, 8)}…</TableCell>
                  <TableCell>{new Date(c.created_at).toLocaleDateString("el-GR")}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        c.status === "approved"
                          ? "default"
                          : c.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => onView(c)}>
                        <FileSearch className="h-4 w-4 mr-1" /> Λεπτομέρειες
                      </Button>
                      {showActions && (
                        <>
                          <Button
                            size="sm"
                            disabled={busyId === c.id}
                            onClick={() => onDecide(c.id, "approved")}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Έγκριση
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === c.id}
                            onClick={() => onDecide(c.id, "rejected")}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Απόρριψη
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      )}
    </CardContent>
  </Card>
);

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <div className="text-sm">{value || <span className="text-muted-foreground">—</span>}</div>
  </div>
);

const DoctorDetailsSheet = ({
  doctor,
  busyId,
  onOpenChange,
  onToggleVerified,
  onTogglePublished,
}: {
  doctor: DoctorProfile | null;
  busyId: string | null;
  onOpenChange: (open: boolean) => void;
  onToggleVerified: (d: DoctorProfile) => void;
  onTogglePublished: (d: DoctorProfile) => void;
}) => (
  <Sheet open={!!doctor} onOpenChange={onOpenChange}>
    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
      {doctor && (
        <>
          <SheetHeader className="text-left">
            <SheetTitle>{doctor.full_name}</SheetTitle>
            <SheetDescription>
              {doctor.specialty ?? "Χωρίς ειδικότητα"} · {doctor.city ?? "—"}
            </SheetDescription>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {doctor.verified && <Badge>Verified</Badge>}
              <Badge variant={doctor.is_published ? "secondary" : "outline"}>
                {doctor.is_published ? "Published" : "Hidden"}
              </Badge>
              <Badge variant={doctor.subscription_tier === "free" ? "outline" : "default"}>
                {doctor.subscription_tier}
              </Badge>
            </div>
          </SheetHeader>

          <Separator className="my-4" />

          <div className="rounded-md border bg-muted/30 p-3">
            <CompletenessIndicator doctor={doctor} />
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email" value={doctor.email} />
              <Field label="Τηλέφωνο" value={doctor.phone} />
              <Field label="Πόλη" value={doctor.city} />
              <Field label="Διεύθυνση" value={doctor.address} />
              <Field label="Κλινική (id)" value={doctor.clinic_id} />
              <Field
                label="Δημιουργία"
                value={new Date(doctor.created_at).toLocaleDateString("el-GR")}
              />
              <Field
                label="Ολοκλήρωση onboarding"
                value={
                  doctor.onboarding_completed_at
                    ? new Date(doctor.onboarding_completed_at).toLocaleDateString("el-GR")
                    : null
                }
              />
              <Field
                label="Πιστοποίηση"
                value={
                  doctor.verified_at
                    ? new Date(doctor.verified_at).toLocaleDateString("el-GR")
                    : null
                }
              />
            </div>

            <Field label="Βιογραφικό" value={<p className="whitespace-pre-wrap">{doctor.bio}</p>} />

            {doctor.photo_url && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Φωτογραφία</p>
                <img
                  src={doctor.photo_url}
                  alt={doctor.full_name}
                  className="h-32 w-32 rounded-md object-cover border"
                />
              </div>
            )}

            <Field
              label="User ID"
              value={<code className="text-xs">{doctor.user_id}</code>}
            />
          </div>

          <SheetFooter className="mt-6 flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              variant={doctor.verified ? "outline" : "default"}
              disabled={busyId === doctor.id}
              onClick={() => onToggleVerified(doctor)}
            >
              {doctor.verified ? (
                <><ShieldOff className="h-4 w-4 mr-1" /> Αφαίρεση Verified</>
              ) : (
                <><ShieldCheck className="h-4 w-4 mr-1" /> Πιστοποίηση</>
              )}
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              disabled={busyId === doctor.id}
              onClick={() => onTogglePublished(doctor)}
            >
              {doctor.is_published ? (
                <><EyeOff className="h-4 w-4 mr-1" /> Απόκρυψη</>
              ) : (
                <><Eye className="h-4 w-4 mr-1" /> Δημοσίευση</>
              )}
            </Button>
          </SheetFooter>
        </>
      )}
    </SheetContent>
  </Sheet>
);

type DoctorLite = {
  full_name: string;
  specialty: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  verified: boolean;
};

const ClaimDetailsSheet = ({
  claim,
  busyId,
  onOpenChange,
  onDecide,
  allClaims,
}: {
  claim: ClinicClaim | null;
  busyId: string | null;
  onOpenChange: (open: boolean) => void;
  onDecide: (id: string, status: "approved" | "rejected", note?: string) => void;
  allClaims: ClinicClaim[];
}) => {
  const { session: sheetSession } = useClerk();
  const clinic = claim ? privateClinics.find((cl) => String(cl.id) === claim.clinic_id) : null;
  const pending = claim?.status === "pending";

  const [doctor, setDoctor] = useState<DoctorLite | null>(null);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    setNote("");
  }, [claim?.id]);

  useEffect(() => {
    if (!claim) {
      setDoctor(null);
      return;
    }
    let cancelled = false;
    setDoctorLoading(true);
    setDoctor(null);
    sheetSession?.getToken().then((token) => {
      const params = new URLSearchParams({ search: claim.user_id, limit: "1" });
      fetch(`${BASE}/api/admin/doctors?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((r) => r.ok ? r.json() : { doctors: [] })
        .then(({ doctors }) => {
          if (cancelled) return;
          const match = doctors?.find((d: any) => d.user_id === claim.user_id) ?? null;
          setDoctor(match);
          setDoctorLoading(false);
        })
        .catch(() => {
          if (!cancelled) setDoctorLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [claim?.id, claim?.user_id]);

  const timeline = claim
    ? [
        {
          icon: <Clock className="h-3.5 w-3.5" />,
          label: "Υποβολή διεκδίκησης",
          time: new Date(claim.created_at),
          tone: "muted" as const,
        },
        ...(claim.status !== "pending"
          ? [
              {
                icon:
                  claim.status === "approved" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  ),
                label:
                  claim.status === "approved"
                    ? "Εγκρίθηκε από διαχειριστή"
                    : "Απορρίφθηκε από διαχειριστή",
                time: null as Date | null,
                tone: (claim.status === "approved" ? "primary" : "destructive") as
                  | "primary"
                  | "destructive",
              },
            ]
          : []),
      ]
    : [];

  const otherClaimsForUser = claim
    ? allClaims.filter((c) => c.user_id === claim.user_id && c.id !== claim.id).length
    : 0;

  return (
    <Sheet open={!!claim} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {claim && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="line-clamp-2">{clinic?.name ?? "Άγνωστη κλινική"}</SheetTitle>
              <SheetDescription>Διεκδίκηση κλινικής</SheetDescription>
              <div className="pt-2">
                <Badge
                  variant={
                    claim.status === "approved"
                      ? "default"
                      : claim.status === "rejected"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {claim.status}
                </Badge>
              </div>
            </SheetHeader>

            <Separator className="my-4" />

            {/* Doctor info */}
            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <UserRound className="h-3.5 w-3.5" /> Ιατρός που υπέβαλε
              </div>
              {doctorLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ) : doctor ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{doctor.full_name}</span>
                    {doctor.verified && (
                      <Badge variant="default" className="h-4 px-1.5 text-[10px]">
                        Verified
                      </Badge>
                    )}
                  </div>
                  {doctor.specialty && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Stethoscope className="h-3 w-3" /> {doctor.specialty}
                      {doctor.city && <span>· {doctor.city}</span>}
                    </div>
                  )}
                  {doctor.email && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <a href={`mailto:${doctor.email}`} className="hover:underline">
                        {doctor.email}
                      </a>
                    </div>
                  )}
                  {doctor.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <a href={`tel:${doctor.phone}`} className="hover:underline">
                        {doctor.phone}
                      </a>
                    </div>
                  )}
                  {otherClaimsForUser > 0 && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Ο ιατρός έχει {otherClaimsForUser} ακόμη {otherClaimsForUser === 1 ? "διεκδίκηση" : "διεκδικήσεις"}.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Δεν βρέθηκε προφίλ ιατρού για αυτόν τον χρήστη.
                </p>
              )}
            </div>

            <Separator className="my-4" />

            {/* Timeline */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Χρονολόγιο
              </p>
              {doctorLoading ? (
                <ol className="relative space-y-3 border-l border-border pl-4" aria-busy="true">
                  {Array.from({ length: claim.status === "pending" ? 1 : 2 }).map((_, idx) => (
                    <li key={idx} className="relative">
                      <span className="absolute -left-[21px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background">
                        <Skeleton className="h-2 w-2 rounded-full" />
                      </span>
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="mt-1 h-3 w-28" />
                    </li>
                  ))}
                </ol>
              ) : (
                <ol className="relative space-y-3 border-l border-border pl-4">
                  {timeline.map((ev, idx) => (
                    <li key={idx} className="relative">
                      <span
                        className={cn(
                          "absolute -left-[21px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border bg-background",
                          ev.tone === "primary" && "border-primary text-primary",
                          ev.tone === "destructive" && "border-destructive text-destructive",
                          ev.tone === "muted" && "border-border text-muted-foreground",
                        )}
                      >
                        {ev.icon}
                      </span>
                      <div className="text-sm">{ev.label}</div>
                      {ev.time && (
                        <div className="text-xs text-muted-foreground">
                          {ev.time.toLocaleString("el-GR")}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Τύπος" value={clinic?.type} />
                <Field label="Κρεβάτια" value={clinic?.beds} />
                <Field label="Περιφέρεια" value={clinic?.region} />
                <Field label="Π.Ε." value={clinic?.regionalUnit} />
                <Field label="Τηλέφωνο" value={clinic?.phone} />
                <Field
                  label="Υποβολή"
                  value={new Date(claim.created_at).toLocaleString("el-GR")}
                />
              </div>
              <Field label="Διεύθυνση" value={clinic?.address} />
              <Field label="Τμήματα" value={clinic?.departments} />
              <Field label="Clinic ID" value={<code className="text-xs">{claim.clinic_id}</code>} />
              <Field label="User ID" value={<code className="text-xs">{claim.user_id}</code>} />
            </div>

            {pending ? (
              <div className="mt-6 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="claim-decision-note" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Σημείωση απόφασης (προαιρετικό)
                  </Label>
                  <Textarea
                    id="claim-decision-note"
                    placeholder="π.χ. λόγος απόρριψης ή σχόλιο έγκρισης…"
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 500))}
                    maxLength={500}
                    rows={3}
                    disabled={busyId === claim.id}
                  />
                  <p className="text-[11px] text-muted-foreground text-right">{note.length}/500</p>
                </div>
                <SheetFooter className="flex-col gap-2 sm:flex-row">
                  <Button
                    className="flex-1"
                    disabled={busyId === claim.id}
                    onClick={() => onDecide(claim.id, "approved", note)}
                  >
                    {busyId === claim.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                    )}
                    Έγκριση
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    disabled={busyId === claim.id}
                    onClick={() => onDecide(claim.id, "rejected", note)}
                  >
                    {busyId === claim.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-1" />
                    )}
                    Απόρριψη
                  </Button>
                </SheetFooter>
              </div>
            ) : claim.decision_note ? (
              <div className="mt-6 rounded-md border bg-muted/30 p-3 space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Σημείωση διαχειριστή
                </p>
                <p className="text-sm whitespace-pre-wrap">{claim.decision_note}</p>
              </div>
            ) : null}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default AdminDashboard;

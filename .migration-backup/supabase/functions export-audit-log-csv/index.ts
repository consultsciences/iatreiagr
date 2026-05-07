// Edge function: export-audit-log-csv
// Server-side CSV export of clinic_claim_audit_log with date range, decision,
// and claim_id filters. Streams results in pages to handle large exports
// without timing out the client. Admin-only.
//
// Method: POST
// Body (JSON): {
//   from_iso?: string;        // ISO timestamp (UTC) lower bound, inclusive
//   to_iso?: string;          // ISO timestamp (UTC) upper bound, inclusive
//   failures_only?: boolean;  // limit to failed_approved / failed_rejected
//   claim_id?: string;        // full UUID (eq) or partial substring (ilike on text)
//   timezone_label?: string;  // optional, only used for filename
//   bom?: boolean;            // include UTF-8 BOM (default true; needed for Excel on Windows)
//   delimiter?: "comma" | "semicolon" | "tab"; // field separator (default "comma")
// }
// Response: text/csv (UTF-8, optional BOM), Content-Disposition: attachment

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Expose-Headers": "X-Audit-Truncated, X-Audit-Delimiter, X-Audit-Bom, X-Audit-Date-Format, X-Audit-Date-Timezone, Content-Disposition",
};

const FAILURE_DECISIONS = ["failed_approved", "failed_rejected"];
const PAGE = 1000;
const HARD_MAX = 200_000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DELIMITERS = { comma: ",", semicolon: ";", tab: "\t" } as const;
type DelimiterKey = keyof typeof DELIMITERS;

const escapeCsv = (val: unknown, delimiter: string): string => {
  const s = val == null ? "" : String(val);
  // Quote if value contains the delimiter, double quotes, or any newline.
  const needsQuote = s.includes(delimiter) || /["\n\r]/.test(s);
  if (needsQuote) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

// Force-collapse any whitespace that could break Excel rows (CRLF, LF, tabs,
// vertical tabs). Multiple consecutive whitespace chars become a single space.
// Also strips leading "=", "+", "-", "@" to prevent CSV formula injection in Excel.
const toSingleLine = (val: string | null | undefined): string => {
  if (val == null) return "";
  let s = String(val).replace(/[\r\n\t\v\f]+/g, " ").replace(/\s{2,}/g, " ").trim();
  if (/^[=+\-@]/.test(s)) s = "'" + s; // neutralize formula injection
  return s;
};

// Normalize a Postgres/JS timestamp to a stable ISO 8601 string in UTC with
// millisecond precision and trailing "Z". Excel parses this reliably.
const toIsoUtc = (val: string | null | undefined): string => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toISOString();
};

// Format a timestamp as "YYYY-MM-DD HH:mm:ss" in the given IANA timezone with
// an explicit "+HH:MM"/"-HH:MM" offset suffix. Excel parses this format as a
// real datetime in every locale (no ambiguity, no AM/PM, no slashes), and the
// offset removes any doubt about which wall clock the value refers to.
//
// Returns the literal source string if the timezone is invalid or the date
// is unparseable, so we never silently corrupt data.
const toExcelLocal = (val: string | null | undefined, timeZone: string): string => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    // en-CA gives YYYY-MM-DD; combine with HH:mm:ss explicitly.
    const datePart = `${get("year")}-${get("month")}-${get("day")}`;
    // Intl in some runtimes returns "24" for midnight; normalize to "00".
    const hour = get("hour") === "24" ? "00" : get("hour");
    const timePart = `${hour}:${get("minute")}:${get("second")}`;

    // Compute the offset for this instant in this zone by formatting the same
    // moment in UTC and diffing the wall clocks (in minutes). This is reliable
    // across DST boundaries.
    const utcParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const getU = (type: string) => utcParts.find((p) => p.type === type)?.value ?? "";
    const localMs = Date.UTC(
      Number(get("year")),
      Number(get("month")) - 1,
      Number(get("day")),
      Number(hour),
      Number(get("minute")),
      Number(get("second")),
    );
    const utcMs = Date.UTC(
      Number(getU("year")),
      Number(getU("month")) - 1,
      Number(getU("day")),
      Number(getU("hour") === "24" ? "00" : getU("hour")),
      Number(getU("minute")),
      Number(getU("second")),
    );
    const offsetMin = Math.round((localMs - utcMs) / 60000);
    const sign = offsetMin >= 0 ? "+" : "-";
    const abs = Math.abs(offsetMin);
    const offH = String(Math.floor(abs / 60)).padStart(2, "0");
    const offM = String(abs % 60).padStart(2, "0");
    return `${datePart} ${timePart}${sign}${offH}:${offM}`;
  } catch {
    // Invalid timezone — fall back to ISO UTC so we still emit something usable.
    return d.toISOString();
  }
};

const DATE_FORMATS = ["iso_utc", "excel_local"] as const;
type DateFormat = (typeof DATE_FORMATS)[number];

const jsonError = (status: number, message: string, extra?: unknown) =>
  new Response(JSON.stringify({ error: message, ...(extra ? { detail: extra } : {}) }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonError(405, "Method not allowed");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!supabaseUrl || !anonKey) {
    return jsonError(500, "Server misconfigured: missing Supabase env vars");
  }

  // Authenticate caller via the JWT they sent
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return jsonError(401, "Missing bearer token");
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Verify user + admin role
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return jsonError(401, "Unauthenticated");
  }
  const { data: isAdminData, error: roleErr } = await supabase.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (roleErr) {
    return jsonError(500, "Role check failed", roleErr.message);
  }
  if (!isAdminData) {
    return jsonError(403, "Admin role required");
  }

  // Parse + validate body
  let body: Record<string, unknown> = {};
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      body = await req.json();
    }
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  const fromIso = typeof body.from_iso === "string" && body.from_iso ? body.from_iso : null;
  const toIso = typeof body.to_iso === "string" && body.to_iso ? body.to_iso : null;
  const failuresOnly = body.failures_only === true;
  const claimRaw = typeof body.claim_id === "string" ? body.claim_id.trim() : "";
  const tzLabel = typeof body.timezone_label === "string" ? body.timezone_label : "";

  // BOM defaults to true (Excel on Windows needs it for UTF-8 detection).
  // Pass `bom: false` for tools/locales that mishandle the BOM (some Linux
  // CSV parsers, Numbers on macOS in certain locales).
  const includeBom = body.bom !== false;

  // Delimiter selection — Excel in many European locales (DE, FR, ES, IT, GR, ...)
  // uses ";" as the list separator and will refuse to split on "," unless the
  // file is explicitly imported. "tab" produces a TSV which most spreadsheet
  // apps auto-detect regardless of locale.
  const delimiterRaw = typeof body.delimiter === "string" ? body.delimiter.toLowerCase() : "comma";
  if (!Object.prototype.hasOwnProperty.call(DELIMITERS, delimiterRaw)) {
    return jsonError(400, `Invalid delimiter: must be one of ${Object.keys(DELIMITERS).join(", ")}`);
  }
  const delimiterKey = delimiterRaw as DelimiterKey;
  const delimiter = DELIMITERS[delimiterKey];

  // Date format selection.
  //   "iso_utc"     → 2024-01-15T08:30:00.000Z (machine-readable, default)
  //   "excel_local" → 2024-01-15 10:30:00+02:00 in `timezone_label` (Excel-friendly)
  // The local format omits the "T" and uses an explicit offset, which Excel
  // recognizes as a real datetime in every locale and matches what the user
  // sees in the table above the export button.
  const dateFormatRaw = typeof body.date_format === "string" ? body.date_format.toLowerCase() : "iso_utc";
  if (!DATE_FORMATS.includes(dateFormatRaw as DateFormat)) {
    return jsonError(400, `Invalid date_format: must be one of ${DATE_FORMATS.join(", ")}`);
  }
  const dateFormat = dateFormatRaw as DateFormat;
  // Resolve the timezone for "excel_local". If the user didn't send one, fall
  // back to UTC so the offset is unambiguous.
  const dateTimezone = tzLabel || "UTC";
  if (dateFormat === "excel_local") {
    try {
      // Probe the IANA zone — invalid zones throw RangeError here.
      new Intl.DateTimeFormat("en-CA", { timeZone: dateTimezone }).format(new Date());
    } catch {
      return jsonError(400, `Invalid timezone_label for excel_local: ${dateTimezone}`);
    }
  }

  // Validate ISO timestamps
  for (const [name, val] of [["from_iso", fromIso], ["to_iso", toIso]] as const) {
    if (val !== null && Number.isNaN(Date.parse(val))) {
      return jsonError(400, `Invalid ${name}: must be ISO 8601`);
    }
  }
  if (fromIso && toIso && Date.parse(fromIso) > Date.parse(toIso)) {
    return jsonError(400, "from_iso must be <= to_iso");
  }

  const claimIsFullUuid = UUID_RE.test(claimRaw);

  // Stream the CSV directly to the client to avoid buffering the entire result.
  const encoder = new TextEncoder();
  let totalRows = 0;
  let truncated = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Metadata block — comment lines starting with `#` describe the
        // export context (filters used, generation time). Excel/Sheets treat
        // these as a single text cell on each row, which is preferable to
        // mixing extra columns into the data table.
        const metaLines = [
          `# Audit log export`,
          `# Generated at: ${new Date().toISOString()}`,
          `# Generated by (admin user_id): ${userData.user.id}`,
          `# Date range from (UTC): ${fromIso ?? "(none)"}`,
          `# Date range to   (UTC): ${toIso ?? "(none)"}`,
          `# Timezone label: ${tzLabel || "(none)"}`,
          `# Failures only: ${failuresOnly ? "yes" : "no"}`,
          `# Claim ID filter: ${claimRaw ? `${claimRaw}${claimIsFullUuid ? " (exact uuid)" : " (substring match)"}` : "(none)"}`,
          `# Delimiter: ${delimiterKey} (${delimiter === "\t" ? "\\t" : delimiter})`,
          `# BOM: ${includeBom ? "yes" : "no"}`,
          `# Date format: ${dateFormat}${dateFormat === "excel_local" ? ` (zone: ${dateTimezone})` : ""}`,
          `#`,
        ];

        // Excel locale hint: when delimiter is ";" (common in EU locales),
        // emit the optional `sep=;` directive on its very first line. Excel
        // honors it and switches the import separator without user prompts.
        // Only used for "semicolon" — `,` is Excel's default and `\t` is
        // auto-detected as TSV.
        const sepHint = delimiterKey === "semicolon" ? `sep=${delimiter}\r\n` : "";

        // Header label reflects the chosen format so consumers know whether
        // the column is UTC or zoned local time.
        const createdAtHeader =
          dateFormat === "excel_local"
            ? `created_at (${dateTimezone})`
            : "created_at";
        const headers = [
          createdAtHeader,
          "id",
          "claim_id",
          "admin_id",
          "decision",
          "note",
          "error_detail",
        ];
        const bom = includeBom ? "\uFEFF" : "";
        controller.enqueue(
          encoder.encode(
            bom + sepHint + metaLines.join("\r\n") + "\r\n" + headers.join(delimiter) + "\r\n",
          ),
        );

        let from = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          let q = supabase
            .from("clinic_claim_audit_log")
            .select("id, claim_id, admin_id, decision, note, error_detail, created_at")
            .order("created_at", { ascending: false })
            .range(from, from + PAGE - 1);

          if (fromIso) q = q.gte("created_at", fromIso);
          if (toIso) q = q.lte("created_at", toIso);
          if (failuresOnly) q = q.in("decision", FAILURE_DECISIONS);
          if (claimIsFullUuid) q = q.eq("claim_id", claimRaw);

          const { data, error } = await q;
          if (error) {
            // Send a final marker row so the user notices something went wrong
            controller.enqueue(
              encoder.encode(
                `# ERROR: ${escapeCsv(error.message, delimiter)}\r\n`,
              ),
            );
            controller.close();
            return;
          }

          let batch = (data ?? []) as Array<{
            id: string;
            claim_id: string;
            admin_id: string;
            decision: string;
            note: string | null;
            error_detail: string | null;
            created_at: string;
          }>;

          // Partial-uuid client-side filter (uuid columns can't ilike)
          if (claimRaw && !claimIsFullUuid) {
            const needle = claimRaw.toLowerCase();
            batch = batch.filter((e) => e.claim_id.toLowerCase().includes(needle));
          }

          for (const e of batch) {
            const line = [
              dateFormat === "excel_local"
                ? toExcelLocal(e.created_at, dateTimezone)
                : toIsoUtc(e.created_at),
              e.id,                       // uuid — safe as-is
              e.claim_id,                 // uuid — safe as-is
              e.admin_id,                 // uuid — safe as-is
              e.decision,                 // short token — safe as-is
              toSingleLine(e.note),       // collapse newlines so Excel keeps one row
              toSingleLine(e.error_detail),
            ]
              .map((v) => escapeCsv(v, delimiter))
              .join(delimiter);
            controller.enqueue(encoder.encode(line + "\r\n"));
            totalRows++;
          }

          if ((data ?? []).length < PAGE) break;
          from += PAGE;
          if (totalRows >= HARD_MAX) {
            truncated = true;
            controller.enqueue(
              encoder.encode(
                `# NOTE: result truncated at HARD_MAX=${HARD_MAX} rows\r\n`,
              ),
            );
            break;
          }
        }
        controller.close();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        controller.enqueue(encoder.encode(`# ERROR: ${escapeCsv(msg, delimiter)}\r\n`));
        controller.close();
      }
    },
  });

  const fromLabel = fromIso ? fromIso.slice(0, 10) : "all";
  const toLabel = toIso ? toIso.slice(0, 10) : "all";
  const tzPart = tzLabel ? `_${tzLabel.replace(/\//g, "-")}` : "";
  // Use .tsv when tab-delimited so spreadsheet apps auto-detect the format.
  const ext = delimiterKey === "tab" ? "tsv" : "csv";
  const filename = `audit-log_${fromLabel}_to_${toLabel}${tzPart}.${ext}`;
  const mime = delimiterKey === "tab"
    ? "text/tab-separated-values; charset=utf-8"
    : "text/csv; charset=utf-8";

  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Audit-Truncated": String(truncated),
      "X-Audit-Delimiter": delimiterKey,
      "X-Audit-Bom": String(includeBom),
      "X-Audit-Date-Format": dateFormat,
      "X-Audit-Date-Timezone": dateFormat === "excel_local" ? dateTimezone : "UTC",
      "Cache-Control": "no-store",
    },
  });
});

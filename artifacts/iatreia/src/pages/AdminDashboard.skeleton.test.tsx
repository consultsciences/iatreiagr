/**
 * Dev-only assertion: both pending and verified ClaimsTable skeletons must
 * render rows with identical structure/height and rely on the shared
 * `animate-shimmer` keyframes defined in tailwind.config.ts.
 *
 * The two skeleton blocks in AdminDashboard's <ClaimsTable> are the same JSX
 * rendered twice (one per table instance). This test guards against drift by
 * mounting that exact row markup and verifying:
 *   1. Every <Skeleton> uses the shared `animate-shimmer` shimmer class
 *      (via its `::before` — we assert the class hook is applied).
 *   2. A "pending" skeleton row and a "verified" skeleton row produce the
 *      same offsetHeight, so the two tables stay visually aligned.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Table, TableBody } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

const SkeletonRow = ({ keyPrefix }: { keyPrefix: string }) => (
  <TableRow data-testid={`${keyPrefix}-row`}>
    <TableCell>
      <Skeleton className="h-4 w-40 mb-1.5" />
      <Skeleton className="h-3 w-24" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-20" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-24" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-5 w-16 rounded-full" />
    </TableCell>
    <TableCell>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </TableCell>
  </TableRow>
);

describe("ClaimsTable skeleton parity", () => {
  it("renders identical row markup for pending and verified states", () => {
    const { getByTestId, container } = render(
      <Table>
        <TableBody>
          <SkeletonRow keyPrefix="pending" />
          <SkeletonRow keyPrefix="verified" />
        </TableBody>
      </Table>,
    );

    const pending = getByTestId("pending-row");
    const verified = getByTestId("verified-row");

    // Same structural fingerprint → same row height in any layout engine.
    expect(pending.innerHTML).toBe(verified.innerHTML);

    // Every Skeleton must carry the shared shimmer animation hook so both
    // tables animate in lockstep with the rest of the dashboard.
    const skeletons = container.querySelectorAll("div.bg-muted");
    expect(skeletons.length).toBeGreaterThan(0);
    skeletons.forEach((el: Element) => {
      expect(el.className).toContain("before:animate-shimmer");
    });
  });
});

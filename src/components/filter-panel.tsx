"use client";

import { useEffect, useState } from "react";
import { useQueryStates } from "nuqs";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  AMENITY_LABELS,
  FILTERABLE_AMENITIES,
  FLAT_TYPE_LABELS,
  FOOD_PREF_LABELS,
  FURNISHING_LABELS,
  TENANT_PREF_LABELS,
  formatRupeesShort,
} from "@/lib/format";
import {
  CLEARED_FILTERS,
  filterParsers,
  RENT_CEILING,
  RENT_FLOOR,
  type Filters,
} from "@/lib/filters";
import type { City, Locality } from "@/lib/listings";
import { cn } from "@/lib/utils";

const FLAT_TYPES = Object.keys(FLAT_TYPE_LABELS) as (keyof typeof FLAT_TYPE_LABELS)[];
const FOOD_PREFS = Object.keys(FOOD_PREF_LABELS) as (keyof typeof FOOD_PREF_LABELS)[];
const FURNISHINGS = Object.keys(FURNISHING_LABELS) as (keyof typeof FURNISHING_LABELS)[];
const TENANTS = (Object.keys(TENANT_PREF_LABELS) as (keyof typeof TENANT_PREF_LABELS)[])
  // "Anyone" is not something a renter filters *for*; it is the absence of a
  // restriction, and overlaps() already surfaces those listings for everyone.
  .filter((t) => t !== "ANYONE");

/** Normalises Base UI's `number | readonly number[]` slider value to a pair. */
function asRange(value: number | readonly number[]): [number, number] {
  if (typeof value === "number") return [value, value];
  return [value[0] ?? RENT_FLOOR, value[1] ?? RENT_CEILING];
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="sign-label mb-3 text-muted-foreground">{title}</legend>
      {children}
    </fieldset>
  );
}

function CheckRow({
  id,
  checked,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
      />
      <Label
        htmlFor={id}
        className="cursor-pointer text-sm font-normal leading-none text-foreground/90"
      >
        {children}
      </Label>
    </div>
  );
}

export function FilterPanel({
  cities,
  localities,
  className,
}: {
  cities: City[];
  localities: Locality[];
  className?: string;
}) {
  const [filters, setFilters] = useQueryStates(filterParsers, {
    shallow: false,
    history: "replace",
  });

  // The slider is dragged continuously; committing every frame to the URL
  // would fire a server round-trip per pixel. Local state tracks the drag and
  // only onValueCommit writes through.
  const [rentDraft, setRentDraft] = useState<[number, number]>([
    filters.rentMin,
    filters.rentMax,
  ]);

  // Resync when the URL changes from elsewhere (a chip removed, Clear all).
  useEffect(() => {
    setRentDraft([filters.rentMin, filters.rentMax]);
  }, [filters.rentMin, filters.rentMax]);

  /** Every filter change resets pagination. See ActiveFilters for why. */
  function toggleIn(key: keyof Filters, value: string, on: boolean) {
    const current = filters[key] as string[];
    const next = on
      ? [...current, value]
      : current.filter((v) => v !== value);
    setFilters({ [key]: next, page: 1 });
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Group title="City">
        <div className="flex flex-wrap gap-2">
          {cities.map((city) => {
            const active = filters.city === city.slug;
            return (
              <button
                key={city.slug}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  // Changing city invalidates locality slugs, which belong to
                  // the previous city and would return zero rows.
                  setFilters({
                    city: active ? "" : city.slug,
                    locality: [],
                    page: 1,
                  })
                }
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground/80 hover:border-primary/50",
                )}
              >
                {city.name}
              </button>
            );
          })}
        </div>
      </Group>

      {filters.city && localities.length > 0 && (
        <>
          <Separator className="bg-hairline" />
          <Group title="Locality">
            <div className="flex max-h-52 flex-col gap-2.5 overflow-y-auto pr-1">
              {localities.map((loc) => (
                <CheckRow
                  key={loc.slug}
                  id={`loc-${loc.slug}`}
                  checked={filters.locality.includes(loc.slug)}
                  onChange={(on) => toggleIn("locality", loc.slug, on)}
                >
                  {loc.name}
                </CheckRow>
              ))}
            </div>
          </Group>
        </>
      )}

      <Separator className="bg-hairline" />

      <Group title="Monthly rent">
        <div className="px-1">
          {/* Base UI types `value` as number | readonly number[] because the
              root is generic over single vs range. This slider is always a
              range, so both handlers normalise to a pair. */}
          <Slider
            value={rentDraft}
            min={RENT_FLOOR}
            max={RENT_CEILING}
            step={1000}
            minStepsBetweenValues={1}
            onValueChange={(v) => setRentDraft(asRange(v))}
            onValueCommitted={(v) => {
              const [lo, hi] = asRange(v);
              setFilters({ rentMin: lo, rentMax: hi, page: 1 });
            }}
            aria-label="Monthly rent range"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="tnum text-xs text-muted-foreground">
              {formatRupeesShort(rentDraft[0])}
            </span>
            <span className="tnum text-xs text-muted-foreground">
              {rentDraft[1] >= RENT_CEILING
                ? `${formatRupeesShort(RENT_CEILING)}+`
                : formatRupeesShort(rentDraft[1])}
            </span>
          </div>
        </div>
      </Group>

      <Separator className="bg-hairline" />

      <Group title="Property type">
        <div className="grid grid-cols-1 gap-2.5">
          {FLAT_TYPES.map((t) => (
            <CheckRow
              key={t}
              id={`type-${t}`}
              checked={filters.type.includes(t)}
              onChange={(on) => toggleIn("type", t, on)}
            >
              {FLAT_TYPE_LABELS[t]}
            </CheckRow>
          ))}
        </div>
      </Group>

      <Separator className="bg-hairline" />

      <Group title="Food preference">
        {FOOD_PREFS.map((f) => (
          <CheckRow
            key={f}
            id={`food-${f}`}
            checked={filters.food.includes(f)}
            onChange={(on) => toggleIn("food", f, on)}
          >
            {FOOD_PREF_LABELS[f]}
          </CheckRow>
        ))}
      </Group>

      <Separator className="bg-hairline" />

      <Group title="Suitable for">
        {TENANTS.map((t) => (
          <CheckRow
            key={t}
            id={`tenant-${t}`}
            checked={filters.tenant.includes(t)}
            onChange={(on) => toggleIn("tenant", t, on)}
          >
            {TENANT_PREF_LABELS[t]}
          </CheckRow>
        ))}
      </Group>

      <Separator className="bg-hairline" />

      <Group title="Furnishing">
        {FURNISHINGS.map((f) => (
          <CheckRow
            key={f}
            id={`furn-${f}`}
            checked={filters.furnishing.includes(f)}
            onChange={(on) => toggleIn("furnishing", f, on)}
          >
            {FURNISHING_LABELS[f]}
          </CheckRow>
        ))}
      </Group>

      <Separator className="bg-hairline" />

      <Group title="Amenities">
        <div className="grid grid-cols-1 gap-2.5">
          {FILTERABLE_AMENITIES.map((a) => (
            <CheckRow
              key={a}
              id={`am-${a}`}
              checked={filters.amenities.includes(a)}
              onChange={(on) => toggleIn("amenities", a, on)}
            >
              {AMENITY_LABELS[a]}
            </CheckRow>
          ))}
        </div>
      </Group>

      <Separator className="bg-hairline" />

      <Group title="Other">
        <CheckRow
          id="pets"
          checked={filters.pets}
          onChange={(on) => setFilters({ pets: on, page: 1 })}
        >
          Pets allowed
        </CheckRow>
        <CheckRow
          id="photos"
          checked={filters.photos}
          onChange={(on) => setFilters({ photos: on, page: 1 })}
        >
          Has photos
        </CheckRow>
        <div className="mt-1 flex flex-col gap-2">
          <Label htmlFor="availBy" className="text-sm font-normal text-foreground/90">
            Available by
          </Label>
          <input
            id="availBy"
            type="date"
            value={filters.availBy}
            onChange={(e) => setFilters({ availBy: e.target.value, page: 1 })}
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </Group>

      <Separator className="bg-hairline" />

      <button
        type="button"
        onClick={() => setFilters(CLEARED_FILTERS)}
        className="rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Reset all filters
      </button>
    </div>
  );
}

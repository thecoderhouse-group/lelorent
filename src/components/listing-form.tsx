"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, SpinnerGap, WarningCircle } from "@phosphor-icons/react/ssr";

import { PhotoUploader, type StagedPhoto } from "@/components/photo-uploader";
import {
  createDraftListing,
  discardDraft,
  publishListing,
} from "@/app/listaproperty/actions";
import {
  AMENITY_LABELS,
  FLAT_TYPE_LABELS,
  FOOD_PREF_LABELS,
  FURNISHING_LABELS,
  PARKING_LABELS,
  TENANT_PREF_LABELS,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { City } from "@/lib/listings";
import { cn } from "@/lib/utils";

type Locality = { id: number; slug: string; name: string };

/* ----------------------------------------------------------------- chrome -- */

function Section({
  step,
  title,
  hint,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-hairline pt-8 first:border-t-0 first:pt-0">
      <div className="mb-5 flex items-baseline gap-3">
        {/* Numerals are real here: this is a sequence the user works through
            top to bottom, not decoration. */}
        <span className="tnum text-sm text-primary">{String(step).padStart(2, "0")}</span>
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const inputClass =
  "h-11 rounded-md border border-input bg-card px-3 text-sm placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Chips({
  name,
  options,
  values,
  onToggle,
  single,
}: {
  name: string;
  options: [string, string][];
  values: string[];
  onToggle: (value: string) => void;
  single?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" role={single ? "radiogroup" : "group"}>
      {options.map(([value, label]) => {
        const active = values.includes(value);
        return (
          <button
            key={value}
            type="button"
            role={single ? "radio" : "checkbox"}
            aria-checked={active}
            onClick={() => onToggle(value)}
            className={cn(
              "rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground/80 hover:border-primary/50",
            )}
          >
            {label}
          </button>
        );
      })}
      {values.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
    </div>
  );
}

function Toggle({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-input accent-primary"
      />
      {label}
    </label>
  );
}

/* ------------------------------------------------------------------- form -- */

const FLAT_TYPES = Object.entries(FLAT_TYPE_LABELS);
const FOOD_PREFS = Object.entries(FOOD_PREF_LABELS);
const FURNISHINGS = Object.entries(FURNISHING_LABELS);
const PARKINGS = Object.entries(PARKING_LABELS);
const TENANTS = Object.entries(TENANT_PREF_LABELS).filter(([k]) => k !== "ANYONE");
const AMENITIES = Object.entries(AMENITY_LABELS);

type Phase = "idle" | "saving" | "uploading" | "publishing";

export function ListingForm({ cities }: { cities: City[] }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const formRef = useRef<HTMLFormElement>(null);

  const [cityId, setCityId] = useState("");
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [localityId, setLocalityId] = useState("");

  const [flatType, setFlatType] = useState<string[]>([]);
  const [listingKind, setListingKind] = useState<string[]>(["ROOM"]);
  const [furnishing, setFurnishing] = useState<string[]>(["UNFURNISHED"]);
  const [foodPref, setFoodPref] = useState<string[]>(["NO_PREFERENCE"]);
  const [parking, setParking] = useState<string[]>(["NONE"]);
  const [tenants, setTenants] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);

  const [pets, setPets] = useState(false);
  const [smoking, setSmoking] = useState(false);
  const [drinking, setDrinking] = useState(false);
  const [couples, setCouples] = useState(false);
  const [maintIncluded, setMaintIncluded] = useState(false);

  const [photos, setPhotos] = useState<StagedPhoto[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(0);
  const [formValid, setFormValid] = useState(false);

  // Localities depend on the city, and slugs are not interchangeable between
  // cities, so the selection is cleared whenever the city changes.
  useEffect(() => {
    setLocalityId("");
    if (!cityId) {
      setLocalities([]);
      return;
    }

    let cancelled = false;
    const city = cities.find((c) => String(c.id) === cityId);
    if (!city) return;

    supabase
      .rpc("localities_for_city", { p_city_slug: city.slug })
      .then(({ data }) => {
        if (!cancelled) setLocalities((data as Locality[]) ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, [cityId, cities, supabase]);

  const isRoomType =
    flatType[0] === "PRIVATE_ROOM" || flatType[0] === "SHARED_ROOM";

  function pickOne(setter: (v: string[]) => void) {
    return (value: string) => setter([value]);
  }

  function toggleMany(current: string[], setter: (v: string[]) => void) {
    return (value: string) =>
      setter(
        current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    // ---- 1. write the draft, which is what gives us a storage path ----------
    setPhase("saving");
    const draft = await createDraftListing(formData);

    if (!draft.ok) {
      setPhase("idle");
      setError(draft.error);
      if (draft.field) {
        formRef.current
          ?.querySelector<HTMLElement>(`[name="${draft.field}"]`)
          ?.focus();
      }
      return;
    }

    const listingId = draft.listingId;

    // ---- 2. push the bytes straight to storage ------------------------------
    setPhase("uploading");
    setUploaded(0);

    const records: Parameters<typeof publishListing>[1] = [];

    try {
      for (const photo of photos) {
        const base = `listings/${listingId}/${photo.id}`;
        const cardPath = `${base}-card.webp`;
        const fullPath = `${base}-full.webp`;

        for (const [path, blob] of [
          [cardPath, photo.card],
          [fullPath, photo.full],
        ] as const) {
          const { error: upErr } = await supabase.storage
            .from("listing-photos")
            .upload(path, blob, {
              contentType: "image/webp",
              cacheControl: "31536000",
              upsert: true,
            });
          if (upErr) throw new Error(upErr.message);
        }

        records.push({
          cardPath,
          fullPath,
          blurDataUrl: photo.blurDataUrl,
          width: photo.width,
          height: photo.height,
          bytes: photo.full.size,
        });
        setUploaded((n) => n + 1);
      }
    } catch (e) {
      // The draft is invisible to everyone, but leaving it behind would let
      // the nightly sweep delete it later with its orphaned objects. Cleaner
      // to remove it now so a retry starts fresh.
      await discardDraft(listingId);
      setPhase("idle");
      setError(
        e instanceof Error
          ? `Photo upload failed: ${e.message}`
          : "Photo upload failed. Please try again.",
      );
      return;
    }

    // ---- 3. go live ---------------------------------------------------------
    setPhase("publishing");
    const result = await publishListing(listingId, records);

    if (!result.ok) {
      setPhase("idle");
      setError(result.error);
      return;
    }

    router.push(`/viewproperty/${listingId}`);
  }

  // Native `required` checks cover the text/date inputs; the chip pickers and
  // the city/locality state are checked explicitly.
  const canPublish =
    formValid &&
    flatType.length > 0 &&
    listingKind.length > 0 &&
    cityId !== "" &&
    localityId !== "";

  const busy = phase !== "idle";
  const busyLabel =
    phase === "saving"
      ? "Saving details…"
      : phase === "uploading"
        ? `Uploading photo ${Math.min(uploaded + 1, photos.length)} of ${photos.length}…`
        : phase === "publishing"
          ? "Publishing…"
          : "";

  // Initial validity (e.g. browser-restored values) once the form has mounted.
  useEffect(() => {
    if (formRef.current) setFormValid(formRef.current.checkValidity());
  }, [cityId, localityId, localities]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onInput={(e) => setFormValid(e.currentTarget.checkValidity())}
      onChange={(e) => setFormValid(e.currentTarget.checkValidity())}
      className="flex flex-col gap-9"
    >
      {/* ---------------------------------------------------------- basics -- */}
      <Section step={1} title="The basics" hint="What are you listing, and where?">
        <div className="flex flex-col gap-5">
          <Field
            label="Listing title"
            htmlFor="title"
            required
            hint="What a renter would search for. 'Sunlit 2BHK with balcony in Baner'."
          >
            <input
              id="title"
              name="title"
              required
              minLength={10}
              maxLength={120}
              placeholder="Sunlit 2BHK with balcony in Baner"
              className={inputClass}
            />
          </Field>

          <Field label="Property type" htmlFor="flat_type" required>
            <Chips
              name="flat_type"
              options={FLAT_TYPES}
              values={flatType}
              onToggle={pickOne(setFlatType)}
              single
            />
          </Field>

          {/* Only rooms need this asked. For a whole flat or a PG bed the
              category is already implied by the property type, and the
              derive_listing_kind trigger fills it in. Asking anyway would be
              a question with one possible answer. */}
          {isRoomType && (
            <Field
              label="Who is letting this out?"
              htmlFor="listing_kind"
              required
              hint="A tenancy and a flatmate share are different things to answer an ad for."
            >
              <Chips
                name="listing_kind"
                options={[
                  ["ROOM", "I am letting out a room"],
                  ["FLATMATE", "I live here and want a flatmate"],
                ]}
                values={listingKind}
                onToggle={pickOne(setListingKind)}
                single
              />
            </Field>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="City" htmlFor="city_id" required>
              <select
                id="city_id"
                name="city_id"
                required
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className={inputClass}
              >
                <option value="">Select a city</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Locality"
              htmlFor="locality_id"
              required
              hint={!cityId ? "Pick a city first" : undefined}
            >
              <select
                id="locality_id"
                name="locality_id"
                required
                disabled={!cityId || localities.length === 0}
                value={localityId}
                onChange={(e) => setLocalityId(e.target.value)}
                className={cn(inputClass, "disabled:opacity-60")}
              >
                <option value="">
                  {cityId ? "Select a locality" : "Select a city first"}
                </option>
                {localities.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
            <Field
              label="Building or street"
              htmlFor="address_line"
              hint="Never shown publicly. Only you see this."
            >
              <input
                id="address_line"
                name="address_line"
                placeholder="Lane 5, Pallod Farms"
                className={inputClass}
              />
            </Field>
            <Field label="Pincode" htmlFor="pincode">
              <input
                id="pincode"
                name="pincode"
                inputMode="numeric"
                pattern="\d{6}"
                placeholder="411045"
                className={inputClass}
              />
            </Field>
          </div>

          <Field
            label="Description"
            htmlFor="description"
            hint="What makes it worth seeing. Light, commute, the society, the neighbours."
          >
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={2000}
              placeholder="Corner flat on a quiet lane, five minutes from the metro…"
              className="rounded-md border border-input bg-card p-3 text-sm placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
        </div>
      </Section>

      {/* ------------------------------------------------------------ money -- */}
      <Section step={2} title="Rent and deposit" hint="Monthly amounts in rupees.">
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Monthly rent" htmlFor="rent" required>
            <input
              id="rent"
              name="rent"
              type="number"
              required
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="32000"
              className={cn(inputClass, "tnum")}
            />
          </Field>
          <Field label="Security deposit" htmlFor="deposit">
            <input
              id="deposit"
              name="deposit"
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              placeholder="96000"
              className={cn(inputClass, "tnum")}
            />
          </Field>
          {!maintIncluded && (
          <Field label="Maintenance" htmlFor="maintenance">
            <input
              id="maintenance"
              name="maintenance"
              type="number"
              min={0}
              step={100}
              inputMode="numeric"
              placeholder="2500"
              className={cn(inputClass, "tnum")}
            />
          </Field>
          )}
        </div>
        <div className="mt-4">
          <Toggle
            name="maintenance_included"
            label="Maintenance is included in the rent"
            checked={maintIncluded}
            onChange={setMaintIncluded}
          />
        </div>
      </Section>

      {/* -------------------------------------------------------- the place -- */}
      <Section step={3} title="About the place" hint="Everything renters filter on.">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["bedrooms", "Bedrooms"],
              ["bathrooms", "Bathrooms"],
              ["balconies", "Balconies"],
              ["floor_number", "Floor"],
              ["total_floors", "Total floors"],
              ["carpet_area_sqft", "Carpet sqft"],
            ].map(([name, label]) => (
              <Field key={name} label={label} htmlFor={name}>
                <input
                  id={name}
                  name={name}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className={cn(inputClass, "tnum")}
                />
              </Field>
            ))}
          </div>

          <Field label="Furnishing" htmlFor="furnishing">
            <Chips
              name="furnishing"
              options={FURNISHINGS}
              values={furnishing}
              onToggle={pickOne(setFurnishing)}
              single
            />
          </Field>

          <Field label="Parking" htmlFor="parking">
            <Chips
              name="parking"
              options={PARKINGS}
              values={parking}
              onToggle={pickOne(setParking)}
              single
            />
          </Field>
        </div>
      </Section>

      {/* ---------------------------------------------------------- who for -- */}
      <Section
        step={4}
        title="Who it is for"
        hint="Be honest here. Mismatched expectations waste everyone's visit."
      >
        <div className="flex flex-col gap-6">
          <Field label="Food preference" htmlFor="food_pref">
            <Chips
              name="food_pref"
              options={FOOD_PREFS}
              values={foodPref}
              onToggle={pickOne(setFoodPref)}
              single
            />
          </Field>

          <Field
            label="Suitable for"
            htmlFor="tenant_prefs"
            hint="Leave all unticked if anyone is welcome."
          >
            <Chips
              name="tenant_prefs"
              options={TENANTS}
              values={tenants}
              onToggle={toggleMany(tenants, setTenants)}
            />
          </Field>

          <fieldset>
            <legend className="mb-3 text-sm font-medium">House rules</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Toggle name="pets_allowed" label="Pets allowed" checked={pets} onChange={setPets} />
              <Toggle name="smoking_allowed" label="Smoking allowed" checked={smoking} onChange={setSmoking} />
              <Toggle name="drinking_allowed" label="Drinking allowed" checked={drinking} onChange={setDrinking} />
              <Toggle name="couples_allowed" label="Couples welcome" checked={couples} onChange={setCouples} />
            </div>
          </fieldset>
        </div>
      </Section>

      {/* -------------------------------------------------------- amenities -- */}
      <Section step={5} title="Amenities" hint="Tick everything the place actually has.">
        <Chips
          name="amenities"
          options={AMENITIES}
          values={amenities}
          onToggle={toggleMany(amenities, setAmenities)}
        />
      </Section>

      {/* ----------------------------------------------------- availability -- */}
      <Section step={6} title="Availability">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Available from" htmlFor="available_from" required>
            <input
              id="available_from"
              name="available_from"
              type="date"
              required
              defaultValue={today}
              min={today}
              className={inputClass}
            />
          </Field>
          <Field label="Minimum stay (months)" htmlFor="min_stay_months">
            <input
              id="min_stay_months"
              name="min_stay_months"
              type="number"
              min={1}
              max={60}
              inputMode="numeric"
              placeholder="11"
              className={cn(inputClass, "tnum")}
            />
          </Field>
        </div>
      </Section>

      {/* ----------------------------------------------------------- photos -- */}
      <Section
        step={7}
        title="Photos"
        hint="Up to 4. Compressed in your browser before upload, so nothing large leaves your phone."
      >
        <PhotoUploader photos={photos} onChange={setPhotos} />
      </Section>

      {/* ----------------------------------------------------------- submit -- */}
      <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        {error && (
          <p
            role="alert"
            className="mb-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm"
          >
            <WarningCircle size={15} className="mt-0.5 shrink-0 text-destructive" aria-hidden="true" />
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {busy ? busyLabel : "Your listing goes live immediately."}
          </p>

          <button
            type="submit"
            disabled={busy || !canPublish}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:active:translate-y-0"
          >
            {busy ? (
              <>
                <SpinnerGap size={16} className="animate-spin" aria-hidden="true" />
                Publishing
              </>
            ) : (
              <>
                <CheckCircle size={16} weight="fill" aria-hidden="true" />
                Publish listing
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

/**
 * Company and contact details, in one place.
 *
 * Every value marked "verified" below was read off caribouelk.com on
 * 2026-08-19. Values that are `null` were NOT published anywhere on that site
 * — homepage, /pages/contact and /policies/privacy-policy were all checked.
 *
 * They are null rather than invented on purpose. A postal address on a privacy
 * policy is the address a person serves a grievance to and the one a regulator
 * checks; a plausible-looking guess there is worse than an obvious gap. Pages
 * omit any block whose value is null, so nothing false is ever rendered.
 *
 * TODO(owner): fill in `email`, `address` and, if the business is registered,
 * `gstin` / `cin`. India's IT (Intermediary Guidelines) Rules expect a named
 * grievance officer with a contact address for a platform that hosts
 * user-generated listings, which this is.
 */
export const COMPANY = {
  /** verified — the entity named in caribouelk.com's own privacy policy */
  legalName: "CARIBOUELK",
  /** the product this site is */
  brand: "Lelorent",
  /** verified — named as founder on caribouelk.com */
  founder: "Gaurav Singh",

  /** verified — the only phone number published on caribouelk.com */
  phone: "+91 8260956895",
  phoneHref: "tel:+918260956895",
  whatsappUrl: "https://wa.me/918260956895",

  /** verified — handle given for enquiries on caribouelk.com */
  instagram: "@caribouelkofficial",
  instagramUrl: "https://instagram.com/caribouelkofficial",

  email: null as string | null,
  address: null as string | null,
  gstin: null as string | null,
  cin: null as string | null,

  /** Shown on the policy pages. Bump when the text materially changes. */
  lastUpdated: "19 August 2026",
} as const;

/** Jurisdiction used by the terms. Change with the registered office. */
export const GOVERNING_LAW = {
  country: "India",
  courts: "the courts of India",
} as const;

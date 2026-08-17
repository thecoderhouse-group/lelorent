-- =============================================================================
-- seed.sql — development fixtures
--
-- Applied with:  npx supabase db push --include-seed
--
-- Idempotent by design: every row uses a fixed UUID and ON CONFLICT DO NOTHING,
-- because --include-seed re-runs this file on every push.
--
-- NOT production data. The six owner accounts below are fake and cannot be
-- logged into (no auth.identities rows, placeholder password hash). They exist
-- only to satisfy listings.owner_id and to give the UI realistic owner names.
--
-- Coverage is deliberate — the fixture set exercises every filter:
--   * all 10 flat types, all 4 food prefs, all 3 furnishing levels
--   * rents from 6,500 (PG bed) to 92,000 (3BHK Bandra)
--   * pets / smoking / drinking / couples in both states
--   * availability spread across the next 90 days
--   * 3 DRAFT and 2 RENTED rows, which MUST NOT appear in listings_public
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Owner accounts.
--    Inserting into auth.users fires on_auth_user_created (0003), which creates
--    the matching public.profiles row automatically.
-- -----------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000',
  v.id::uuid,
  'authenticated',
  'authenticated',
  v.email,
  '$2a$10$SEEDONLYPLACEHOLDERHASHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', v.full_name),
  '', '', '', ''
from (values
  ('a0000000-0000-4000-8000-000000000001', 'rhea.kapoor@example.com',   'Rhea Kapoor'),
  ('a0000000-0000-4000-8000-000000000002', 'arjun.mehta@example.com',   'Arjun Mehta'),
  ('a0000000-0000-4000-8000-000000000003', 'sneha.iyer@example.com',    'Sneha Iyer'),
  ('a0000000-0000-4000-8000-000000000004', 'vikram.reddy@example.com',  'Vikram Reddy'),
  ('a0000000-0000-4000-8000-000000000005', 'fatima.sheikh@example.com', 'Fatima Sheikh'),
  ('a0000000-0000-4000-8000-000000000006', 'daniel.dsouza@example.com', 'Daniel D''Souza')
) as v(id, email, full_name)
on conflict (id) do nothing;

-- Phone numbers: the trigger only copies full_name and avatar, so set these
-- separately. These are what reveal_contact() returns.
update public.profiles p
   set phone = v.phone
  from (values
  ('a0000000-0000-4000-8000-000000000001', '+919820011001'),
  ('a0000000-0000-4000-8000-000000000002', '+919820011002'),
  ('a0000000-0000-4000-8000-000000000003', '+919820011003'),
  ('a0000000-0000-4000-8000-000000000004', '+919820011004'),
  ('a0000000-0000-4000-8000-000000000005', '+919820011005'),
  ('a0000000-0000-4000-8000-000000000006', '+919820011006')
) as v(id, phone)
 where p.id = v.id::uuid
   and p.phone is distinct from v.phone;

-- -----------------------------------------------------------------------------
-- 2. Listings.
--    city_id / locality_id are resolved from slugs so this does not depend on
--    generated identity values. The listings_before_write trigger fills the
--    denormalized city/locality text and stamps published_at + expires_at.
-- -----------------------------------------------------------------------------
insert into public.listings (
  id, owner_id, status, title, description,
  flat_type, furnishing, rent, deposit, maintenance, maintenance_included,
  food_pref, pets_allowed, smoking_allowed, drinking_allowed, couples_allowed,
  tenant_prefs, bedrooms, bathrooms, balconies, floor_number, total_floors,
  carpet_area_sqft, parking, amenities,
  city_id, locality_id, address_line, pincode, available_from, min_stay_months
)
select
  v.id::uuid,
  v.owner_id::uuid,
  v.status::public.listing_status,
  v.title,
  v.description,
  v.flat_type::public.flat_type,
  v.furnishing::public.furnishing,
  v.rent, v.deposit, v.maintenance, v.maintenance_included,
  v.food_pref::public.food_pref,
  v.pets, v.smoking, v.drinking, v.couples,
  v.tenant_prefs::public.tenant_pref[],
  v.bedrooms, v.bathrooms, v.balconies, v.floor_number, v.total_floors,
  v.carpet_area, v.parking::public.parking_type,
  v.amenities::text[],
  c.id, l.id,
  v.address_line, v.pincode,
  current_date + v.available_in_days,
  v.min_stay
from (values
  -- ---------------------------------------------------------------- PUNE ----
  ('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','PUBLISHED',
   'Sunlit 2BHK with balcony in Baner','Corner flat on a quiet lane, walking distance to Baner Road cafes. Society has a gym and covered parking.',
   '2BHK','SEMI_FURNISHED',32000,96000,2500,false,'NO_PREFERENCE',true,false,true,true,
   '{FAMILY,WORKING_PROFESSIONALS}',2,2,1,4,11,980,'FOUR_WHEELER',
   '{lift,power_backup,gym,security,cctv,water_supply_24x7,modular_kitchen,wardrobe,balcony,visitor_parking}',
   'pune','baner','Lane 5, Pallod Farms','411045',12,11),

  ('b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000002','PUBLISHED',
   'Fully furnished 1BHK near EON IT Park','Ideal for IT professionals. Five minutes to EON, fully furnished including washing machine and fridge.',
   '1BHK','FULLY_FURNISHED',24000,72000,1800,true,'NON_VEG_ALLOWED',false,true,true,false,
   '{WORKING_PROFESSIONALS,BACHELOR_MALE,BACHELOR_FEMALE}',1,1,1,7,14,610,'TWO_WHEELER',
   '{lift,power_backup,wifi,security,cctv,ac,geyser,washing_machine,refrigerator,modular_kitchen,tv,sofa,bed}',
   'pune','kharadi','Zensar Road','411014',5,6),

  ('b0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000003','PUBLISHED',
   'Pure veg 3BHK for families in Aundh','Spacious family home in a vegetarian-only society. Close to Bremen Chowk and good schools.',
   '3BHK','UNFURNISHED',45000,180000,3200,false,'VEG_ONLY',false,false,false,false,
   '{FAMILY}',3,3,2,2,7,1450,'BOTH',
   '{lift,power_backup,security,cctv,water_supply_24x7,gas_pipeline,park,play_area,clubhouse,intercom,servant_room}',
   'pune','aundh','Sanewadi','411007',30,11),

  ('b0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000004','PUBLISHED',
   'Single occupancy PG bed in Hinjewadi','Clean PG with meals included, walking distance to Phase 1. Bed in a twin-sharing room.',
   'PG_BED','FULLY_FURNISHED',9500,19000,0,true,'VEG_ONLY',false,false,false,false,
   '{STUDENTS,WORKING_PROFESSIONALS,BACHELOR_MALE}',1,1,0,3,5,120,'NONE',
   '{wifi,power_backup,security,cctv,geyser,housekeeping,washing_machine,bed,wardrobe}',
   'pune','hinjewadi','Phase 1, Near Wipro Circle','411057',3,3),

  ('b0000000-0000-4000-8000-000000000005','a0000000-0000-4000-8000-000000000005','PUBLISHED',
   'Studio 1RK in Viman Nagar','Compact studio near Phoenix Marketcity. Great for a single working professional.',
   '1RK','SEMI_FURNISHED',15500,46500,1200,false,'NO_PREFERENCE',false,true,true,false,
   '{BACHELOR_MALE,BACHELOR_FEMALE,WORKING_PROFESSIONALS}',1,1,0,1,4,340,'TWO_WHEELER',
   '{lift,power_backup,wifi,security,geyser,wardrobe,bed}',
   'pune','viman-nagar','Clover Park','411014',8,6),

  ('b0000000-0000-4000-8000-000000000006','a0000000-0000-4000-8000-000000000006','PUBLISHED',
   'Pet friendly 2BHK in Koregaon Park','Ground floor with a small private garden. Dogs and cats genuinely welcome.',
   '2BHK','SEMI_FURNISHED',52000,156000,4000,false,'NON_VEG_ALLOWED',true,true,true,true,
   '{FAMILY,WORKING_PROFESSIONALS,ANYONE}',2,2,2,0,5,1150,'FOUR_WHEELER',
   '{power_backup,security,cctv,water_supply_24x7,ac,geyser,modular_kitchen,wardrobe,balcony,park,visitor_parking}',
   'pune','koregaon-park','Lane 7','411001',20,11),

  -- -------------------------------------------------------------- MUMBAI ----
  ('b0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000001','PUBLISHED',
   'Sea facing 3BHK in Bandra West','Premium apartment with an unobstructed sea view from the living room. Twenty-fourth floor.',
   '3BHK','FULLY_FURNISHED',92000,552000,8000,false,'NON_VEG_ALLOWED',true,true,true,true,
   '{FAMILY,WORKING_PROFESSIONALS}',3,3,2,24,32,1680,'FOUR_WHEELER',
   '{lift,power_backup,gym,swimming_pool,security,cctv,water_supply_24x7,ac,geyser,washing_machine,refrigerator,modular_kitchen,wardrobe,tv,sofa,bed,dining_table,balcony,clubhouse,intercom,fire_safety}',
   'mumbai','bandra-west','Carter Road','400050',45,11),

  ('b0000000-0000-4000-8000-000000000008','a0000000-0000-4000-8000-000000000002','PUBLISHED',
   'Shared room for women in Andheri West','Twin sharing in a womens-only flat. Metro is a seven minute walk.',
   'SHARED_ROOM','FULLY_FURNISHED',13500,27000,0,true,'EGGETARIAN',false,false,false,false,
   '{BACHELOR_FEMALE,STUDENTS,WORKING_PROFESSIONALS}',1,2,1,5,8,180,'NONE',
   '{lift,wifi,power_backup,security,cctv,geyser,washing_machine,refrigerator,housekeeping,wardrobe,bed}',
   'mumbai','andheri-west','Lokhandwala Complex','400058',2,3),

  ('b0000000-0000-4000-8000-000000000009','a0000000-0000-4000-8000-000000000003','PUBLISHED',
   'Lake view 2BHK in Powai','Overlooking Powai lake, in a gated township with full amenities.',
   '2BHK','SEMI_FURNISHED',68000,204000,6500,true,'NO_PREFERENCE',false,false,true,true,
   '{FAMILY,WORKING_PROFESSIONALS}',2,2,1,12,22,1080,'FOUR_WHEELER',
   '{lift,power_backup,gym,swimming_pool,security,cctv,water_supply_24x7,gas_pipeline,ac,modular_kitchen,wardrobe,balcony,park,clubhouse,intercom,fire_safety,rain_water_harvesting}',
   'mumbai','powai','Hiranandani Gardens','400076',25,11),

  ('b0000000-0000-4000-8000-000000000010','a0000000-0000-4000-8000-000000000004','PUBLISHED',
   'Budget 1BHK in Malad West','Honest, no-frills flat close to the station. Good for a small family or couple.',
   '1BHK','UNFURNISHED',26000,78000,2000,false,'NO_PREFERENCE',false,true,true,true,
   '{FAMILY,ANYONE}',1,1,1,3,6,520,'TWO_WHEELER',
   '{lift,power_backup,security,water_supply_24x7,balcony}',
   'mumbai','malad-west','Mith Chowky','400064',10,6),

  ('b0000000-0000-4000-8000-000000000011','a0000000-0000-4000-8000-000000000005','PUBLISHED',
   'Private room in a 3BHK, Thane West','One private room in a shared professional flat. Common kitchen and living room.',
   'PRIVATE_ROOM','SEMI_FURNISHED',18000,36000,1500,true,'NON_VEG_ALLOWED',true,true,true,false,
   '{WORKING_PROFESSIONALS,BACHELOR_MALE,BACHELOR_FEMALE}',1,1,1,9,15,260,'TWO_WHEELER',
   '{lift,power_backup,wifi,security,cctv,geyser,washing_machine,refrigerator,wardrobe,bed,balcony}',
   'mumbai','thane-west','Ghodbunder Road','400601',6,4),

  -- ----------------------------------------------------------- BENGALURU ----
  ('b0000000-0000-4000-8000-000000000012','a0000000-0000-4000-8000-000000000006','PUBLISHED',
   'Bright 2BHK in Koramangala 5th Block','Walking distance to Sony Signal. Independent building, no society restrictions.',
   '2BHK','SEMI_FURNISHED',42000,168000,0,false,'NON_VEG_ALLOWED',true,true,true,true,
   '{WORKING_PROFESSIONALS,BACHELOR_MALE,BACHELOR_FEMALE,FAMILY}',2,2,1,2,3,1020,'TWO_WHEELER',
   '{power_backup,security,water_supply_24x7,geyser,modular_kitchen,wardrobe,balcony}',
   'bengaluru','koramangala','5th Block, 80 Feet Road','560034',15,11),

  ('b0000000-0000-4000-8000-000000000013','a0000000-0000-4000-8000-000000000001','PUBLISHED',
   'Fully furnished 1BHK in Indiranagar','Move in with a suitcase. On 12th Main, surrounded by cafes.',
   '1BHK','FULLY_FURNISHED',35000,105000,2500,true,'NON_VEG_ALLOWED',false,true,true,true,
   '{WORKING_PROFESSIONALS,BACHELOR_FEMALE}',1,1,1,3,4,680,'TWO_WHEELER',
   '{lift,power_backup,wifi,security,cctv,ac,geyser,washing_machine,refrigerator,modular_kitchen,wardrobe,tv,sofa,bed,dining_table}',
   'bengaluru','indiranagar','12th Main','560038',7,6),

  ('b0000000-0000-4000-8000-000000000014','a0000000-0000-4000-8000-000000000002','PUBLISHED',
   'Family 3BHK in Whitefield township','Large gated community with school and clubhouse inside. Close to ITPL.',
   '3BHK','UNFURNISHED',48000,192000,4500,false,'VEG_ONLY',false,false,false,false,
   '{FAMILY}',3,3,2,8,18,1520,'BOTH',
   '{lift,power_backup,gym,swimming_pool,security,cctv,water_supply_24x7,gas_pipeline,park,play_area,clubhouse,visitor_parking,intercom,fire_safety,rain_water_harvesting,servant_room,study_room}',
   'bengaluru','whitefield','Whitefield Main Road','560066',35,11),

  ('b0000000-0000-4000-8000-000000000015','a0000000-0000-4000-8000-000000000003','PUBLISHED',
   'Studio 1RK in HSR Layout','Compact and efficient, in a quiet residential lane in Sector 2.',
   '1RK','SEMI_FURNISHED',17000,51000,1000,false,'NO_PREFERENCE',false,true,true,false,
   '{BACHELOR_MALE,BACHELOR_FEMALE,STUDENTS}',1,1,0,2,4,360,'TWO_WHEELER',
   '{power_backup,wifi,security,geyser,wardrobe,bed}',
   'bengaluru','hsr-layout','Sector 2','560102',4,3),

  ('b0000000-0000-4000-8000-000000000016','a0000000-0000-4000-8000-000000000004','PUBLISHED',
   'Independent house in Jayanagar','Old Bangalore charm. Full ground floor of an independent house with a garden.',
   'INDEPENDENT_HOUSE','UNFURNISHED',55000,220000,0,false,'VEG_ONLY',true,false,false,false,
   '{FAMILY}',3,2,1,0,2,1800,'FOUR_WHEELER',
   '{power_backup,security,water_supply_24x7,park,servant_room}',
   'bengaluru','jayanagar','4th Block','560041',50,11),

  ('b0000000-0000-4000-8000-000000000017','a0000000-0000-4000-8000-000000000005','PUBLISHED',
   'PG bed for men in Electronic City','Twin sharing with meals, laundry and housekeeping included.',
   'PG_BED','FULLY_FURNISHED',8500,17000,0,true,'NON_VEG_ALLOWED',false,false,false,false,
   '{BACHELOR_MALE,STUDENTS,WORKING_PROFESSIONALS}',1,1,0,2,4,110,'NONE',
   '{wifi,power_backup,security,cctv,geyser,housekeeping,washing_machine,bed,wardrobe,tv}',
   'bengaluru','electronic-city','Phase 1','560100',1,3),

  -- ----------------------------------------------------------- HYDERABAD ----
  ('b0000000-0000-4000-8000-000000000018','a0000000-0000-4000-8000-000000000006','PUBLISHED',
   'Modern 2BHK in Gachibowli','New building, close to the financial district. Semi furnished with wardrobes and modular kitchen.',
   '2BHK','SEMI_FURNISHED',28000,84000,2200,false,'NO_PREFERENCE',true,true,true,true,
   '{WORKING_PROFESSIONALS,FAMILY,ANYONE}',2,2,2,6,12,1100,'FOUR_WHEELER',
   '{lift,power_backup,gym,security,cctv,water_supply_24x7,modular_kitchen,wardrobe,balcony,visitor_parking,intercom}',
   'hyderabad','gachibowli','Nanakramguda Road','500032',9,6),

  ('b0000000-0000-4000-8000-000000000019','a0000000-0000-4000-8000-000000000001','PUBLISHED',
   'Premium 3BHK in Jubilee Hills','High end finishes, corner unit with three balconies and a private terrace.',
   '3BHK','FULLY_FURNISHED',75000,300000,6000,false,'NON_VEG_ALLOWED',true,true,true,true,
   '{FAMILY,WORKING_PROFESSIONALS}',3,4,3,9,12,2100,'BOTH',
   '{lift,power_backup,gym,swimming_pool,security,cctv,water_supply_24x7,gas_pipeline,ac,geyser,washing_machine,refrigerator,modular_kitchen,wardrobe,tv,sofa,bed,dining_table,balcony,clubhouse,intercom,fire_safety,servant_room,study_room}',
   'hyderabad','jubilee-hills','Road No. 45','500033',40,11),

  ('b0000000-0000-4000-8000-000000000020','a0000000-0000-4000-8000-000000000002','PUBLISHED',
   'Affordable 1BHK in Kukatpally','Practical flat near JNTU, well connected by metro.',
   '1BHK','UNFURNISHED',13000,39000,900,false,'NO_PREFERENCE',false,true,true,true,
   '{FAMILY,BACHELOR_MALE,ANYONE}',1,1,1,4,7,540,'TWO_WHEELER',
   '{lift,power_backup,security,water_supply_24x7,balcony}',
   'hyderabad','kukatpally','KPHB Phase 3','500072',6,6),

  ('b0000000-0000-4000-8000-000000000021','a0000000-0000-4000-8000-000000000003','PUBLISHED',
   'Eggetarian friendly 2BHK in Madhapur','Society allows eggs but not meat. Close to HITEC City metro.',
   '2BHK','SEMI_FURNISHED',31000,93000,2400,false,'EGGETARIAN',false,false,false,false,
   '{FAMILY,WORKING_PROFESSIONALS,STUDENTS}',2,2,1,5,9,995,'TWO_WHEELER',
   '{lift,power_backup,security,cctv,water_supply_24x7,gas_pipeline,modular_kitchen,wardrobe,balcony,intercom}',
   'hyderabad','madhapur','Ayyappa Society','500081',14,11),

  -- --------------------------------------------------------------- DELHI ----
  ('b0000000-0000-4000-8000-000000000022','a0000000-0000-4000-8000-000000000004','PUBLISHED',
   'Builder floor 3BHK in Saket','Full second floor of a builder unit, with a covered car park and lift.',
   '3BHK','SEMI_FURNISHED',58000,174000,3000,false,'NON_VEG_ALLOWED',true,true,true,true,
   '{FAMILY,WORKING_PROFESSIONALS}',3,3,2,2,4,1600,'FOUR_WHEELER',
   '{lift,power_backup,security,cctv,water_supply_24x7,ac,geyser,modular_kitchen,wardrobe,balcony,intercom}',
   'delhi','saket','Press Enclave Road','110017',22,11),

  ('b0000000-0000-4000-8000-000000000023','a0000000-0000-4000-8000-000000000005','PUBLISHED',
   'Barsati studio in Hauz Khas','Rooftop studio with a private terrace, in the middle of Hauz Khas village.',
   '1RK','SEMI_FURNISHED',22000,66000,1500,false,'NON_VEG_ALLOWED',true,true,true,true,
   '{BACHELOR_MALE,BACHELOR_FEMALE,WORKING_PROFESSIONALS}',1,1,1,3,3,420,'TWO_WHEELER',
   '{power_backup,wifi,security,geyser,ac,wardrobe,bed,balcony}',
   'delhi','hauz-khas','Aurobindo Marg','110016',11,6),

  ('b0000000-0000-4000-8000-000000000024','a0000000-0000-4000-8000-000000000006','PUBLISHED',
   'Family 2BHK in Dwarka Sector 12','Co-operative society flat, walking distance to the metro and market.',
   '2BHK','UNFURNISHED',27000,81000,1800,true,'VEG_ONLY',false,false,false,false,
   '{FAMILY}',2,2,2,1,4,900,'FOUR_WHEELER',
   '{lift,power_backup,security,water_supply_24x7,park,play_area,visitor_parking}',
   'delhi','dwarka','Sector 12','110075',18,11),

  ('b0000000-0000-4000-8000-000000000025','a0000000-0000-4000-8000-000000000001','PUBLISHED',
   'Student friendly shared room in Rohini','Budget shared accommodation close to coaching centres.',
   'SHARED_ROOM','SEMI_FURNISHED',6500,13000,0,true,'VEG_ONLY',false,false,false,false,
   '{STUDENTS}',1,1,0,2,4,150,'NONE',
   '{wifi,power_backup,security,geyser,bed,wardrobe}',
   'delhi','rohini','Sector 7','110085',2,3),

  -- ------------------------------------------------------------ GURUGRAM ----
  ('b0000000-0000-4000-8000-000000000026','a0000000-0000-4000-8000-000000000002','PUBLISHED',
   'High floor 3BHK on Golf Course Road','Twenty-first floor with a golf course view. Full township amenities.',
   '3BHK','FULLY_FURNISHED',85000,340000,7500,false,'NON_VEG_ALLOWED',true,true,true,true,
   '{FAMILY,WORKING_PROFESSIONALS}',3,3,2,21,26,1900,'BOTH',
   '{lift,power_backup,gym,swimming_pool,security,cctv,water_supply_24x7,gas_pipeline,ac,geyser,washing_machine,refrigerator,modular_kitchen,wardrobe,tv,sofa,bed,dining_table,balcony,clubhouse,visitor_parking,intercom,fire_safety}',
   'gurugram','golf-course-road','Sector 42','122002',28,11),

  ('b0000000-0000-4000-8000-000000000027','a0000000-0000-4000-8000-000000000003','PUBLISHED',
   'Compact 1BHK in Sector 49','Good value near Sohna Road offices. Suitable for a couple.',
   '1BHK','SEMI_FURNISHED',19000,57000,1600,false,'NO_PREFERENCE',false,true,true,true,
   '{WORKING_PROFESSIONALS,FAMILY,ANYONE}',1,1,1,6,14,600,'TWO_WHEELER',
   '{lift,power_backup,security,cctv,water_supply_24x7,geyser,wardrobe,balcony,visitor_parking}',
   'gurugram','sector-49','Nirvana Country Road','122018',13,6),

  ('b0000000-0000-4000-8000-000000000028','a0000000-0000-4000-8000-000000000004','PUBLISHED',
   'Spacious 4BHK in DLF Phase 3','Large independent floor, suitable for a big family or company lease.',
   '4BHK','UNFURNISHED',72000,288000,5000,false,'NON_VEG_ALLOWED',true,false,true,false,
   '{FAMILY}',4,4,3,1,3,2400,'BOTH',
   '{power_backup,security,cctv,water_supply_24x7,modular_kitchen,balcony,servant_room,study_room,visitor_parking}',
   'gurugram','dlf-phase-3','U Block','122010',60,11),

  -- --- NOT PUBLISHED: these MUST be absent from listings_public --------------
  ('b0000000-0000-4000-8000-000000000029','a0000000-0000-4000-8000-000000000005','DRAFT',
   'Draft listing, still being written','Incomplete draft used to verify that drafts never leak into search.',
   '2BHK','UNFURNISHED',30000,90000,0,false,'NO_PREFERENCE',false,false,false,false,
   '{ANYONE}',2,2,1,3,6,900,'NONE','{}',
   'pune','wakad','Datta Mandir Road','411057',10,6),

  ('b0000000-0000-4000-8000-000000000030','a0000000-0000-4000-8000-000000000006','DRAFT',
   'Another draft','Second draft fixture.',
   '1BHK','UNFURNISHED',20000,60000,0,false,'NO_PREFERENCE',false,false,false,false,
   '{ANYONE}',1,1,0,2,5,500,'NONE','{}',
   'mumbai','chembur','Diamond Garden','400071',10,6),

  ('b0000000-0000-4000-8000-000000000031','a0000000-0000-4000-8000-000000000001','DRAFT',
   'Third draft','Third draft fixture.',
   '1RK','UNFURNISHED',12000,36000,0,false,'NO_PREFERENCE',false,false,false,false,
   '{ANYONE}',1,1,0,1,3,300,'NONE','{}',
   'bengaluru','btm-layout','16th Main','560076',10,6),

  ('b0000000-0000-4000-8000-000000000032','a0000000-0000-4000-8000-000000000002','RENTED',
   'Already rented 2BHK in Kothrud','Rented fixture, used to verify rented listings drop out of search.',
   '2BHK','SEMI_FURNISHED',29000,87000,2000,false,'VEG_ONLY',false,false,false,false,
   '{FAMILY}',2,2,1,3,8,950,'TWO_WHEELER',
   '{lift,power_backup,security,water_supply_24x7}',
   'pune','kothrud','Karve Road','411038',10,11),

  ('b0000000-0000-4000-8000-000000000033','a0000000-0000-4000-8000-000000000003','RENTED',
   'Already rented 1BHK in Marathahalli','Second rented fixture.',
   '1BHK','FULLY_FURNISHED',23000,69000,1500,true,'NON_VEG_ALLOWED',false,true,true,false,
   '{WORKING_PROFESSIONALS}',1,1,1,4,9,580,'TWO_WHEELER',
   '{lift,power_backup,wifi,security,ac,geyser,bed,wardrobe}',
   'bengaluru','marathahalli','Outer Ring Road','560037',10,6)

) as v(
  id, owner_id, status, title, description,
  flat_type, furnishing, rent, deposit, maintenance, maintenance_included,
  food_pref, pets, smoking, drinking, couples,
  tenant_prefs, bedrooms, bathrooms, balconies, floor_number, total_floors,
  carpet_area, parking, amenities,
  city_slug, locality_slug, address_line, pincode, available_in_days, min_stay
)
join public.cities     c on c.slug = v.city_slug
join public.localities l on l.slug = v.locality_slug and l.city_id = c.id
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 3. Flatmate listings (0010_listing_kind.sql).
--    Same shape as above, split into its own statement because these are the
--    only rows that state listing_kind explicitly: every other listing has it
--    derived from flat_type by the listings_derive_kind trigger, and FLATMATE
--    is precisely the value that cannot be derived.
--
--    Posted by people already living in the flat, so the tenant_prefs read as
--    "who I want to share with" rather than "who I will rent to".
-- -----------------------------------------------------------------------------
insert into public.listings (
  id, owner_id, status, title, description,
  flat_type, listing_kind, furnishing, rent, deposit, maintenance, maintenance_included,
  food_pref, pets_allowed, smoking_allowed, drinking_allowed, couples_allowed,
  tenant_prefs, bedrooms, bathrooms, balconies, floor_number, total_floors,
  carpet_area_sqft, parking, amenities,
  city_id, locality_id, address_line, pincode, available_from, min_stay_months
)
select
  v.id::uuid,
  v.owner_id::uuid,
  v.status::public.listing_status,
  v.title,
  v.description,
  v.flat_type::public.flat_type,
  v.listing_kind::public.listing_kind,
  v.furnishing::public.furnishing,
  v.rent, v.deposit, v.maintenance, v.maintenance_included,
  v.food_pref::public.food_pref,
  v.pets, v.smoking, v.drinking, v.couples,
  v.tenant_prefs::public.tenant_pref[],
  v.bedrooms, v.bathrooms, v.balconies, v.floor_number, v.total_floors,
  v.carpet_area, v.parking::public.parking_type,
  v.amenities::text[],
  c.id, l.id,
  v.address_line, v.pincode,
  current_date + v.available_in_days,
  v.min_stay
from (values
  ('b0000000-0000-4000-8000-000000000040','a0000000-0000-4000-8000-000000000003','PUBLISHED',
   'Looking for a third flatmate in Koramangala','Two of us, both working in product, sharing a 3BHK. The spare bedroom is yours, attached bathroom. We cook most nights and split groceries.',
   'PRIVATE_ROOM','FLATMATE','FULLY_FURNISHED',18000,36000,1500,true,'NON_VEG_ALLOWED',false,false,true,false,
   '{WORKING_PROFESSIONALS,BACHELOR_MALE,BACHELOR_FEMALE}',1,1,1,3,5,220,'TWO_WHEELER',
   '{lift,power_backup,wifi,security,ac,geyser,washing_machine,refrigerator,modular_kitchen,wardrobe,bed,balcony}',
   'bengaluru','koramangala','5th Block, 80 Feet Road','560034',7,6),

  ('b0000000-0000-4000-8000-000000000041','a0000000-0000-4000-8000-000000000005','PUBLISHED',
   'Female flatmate wanted in Powai','Sharing a 2BHK with one other woman. Quiet building, ten minutes from Hiranandani. Vegetarian kitchen, no exceptions on that.',
   'PRIVATE_ROOM','FLATMATE','SEMI_FURNISHED',21000,42000,2000,false,'VEG_ONLY',false,false,false,false,
   '{BACHELOR_FEMALE,WORKING_PROFESSIONALS,STUDENTS}',1,1,1,8,14,260,'NONE',
   '{lift,power_backup,wifi,security,cctv,water_supply_24x7,geyser,washing_machine,wardrobe,bed}',
   'mumbai','powai','Central Avenue','400076',14,11),

  ('b0000000-0000-4000-8000-000000000042','a0000000-0000-4000-8000-000000000002','PUBLISHED',
   'Share my 2BHK in Baner, pet friendly','I have a dog, so you need to be fine with that. Big living room, both of us work from home some days so the wifi is genuinely good.',
   'PRIVATE_ROOM','FLATMATE','SEMI_FURNISHED',14000,28000,1200,false,'NON_VEG_ALLOWED',true,true,true,false,
   '{WORKING_PROFESSIONALS,ANYONE}',1,1,1,2,7,240,'TWO_WHEELER',
   '{lift,power_backup,wifi,security,geyser,washing_machine,refrigerator,wardrobe,bed,balcony,park}',
   'pune','baner','Veerbhadra Nagar','411045',3,6),

  ('b0000000-0000-4000-8000-000000000043','a0000000-0000-4000-8000-000000000006','PUBLISHED',
   'Twin sharing with a flatmate in HSR Layout','Sharing my room in a 2BHK, so this is properly budget. Suits someone new to the city who wants company rather than a lease.',
   'SHARED_ROOM','FLATMATE','FULLY_FURNISHED',9000,18000,800,true,'EGGETARIAN',false,false,true,false,
   '{STUDENTS,BACHELOR_MALE,WORKING_PROFESSIONALS}',1,1,0,1,4,150,'NONE',
   '{power_backup,wifi,security,geyser,washing_machine,wardrobe,bed}',
   'bengaluru','hsr-layout','Sector 2, 27th Main','560102',5,3),

  ('b0000000-0000-4000-8000-000000000044','a0000000-0000-4000-8000-000000000001','PUBLISHED',
   'Flatmate for a quiet 3BHK in Gachibowli','Third room going in a flat shared by two of us. Early sleepers, no parties. Walking distance to the tech park.',
   'PRIVATE_ROOM','FLATMATE','SEMI_FURNISHED',13500,27000,1000,false,'NO_PREFERENCE',false,false,false,false,
   '{WORKING_PROFESSIONALS,BACHELOR_MALE}',1,1,1,5,9,230,'TWO_WHEELER',
   '{lift,power_backup,wifi,security,cctv,geyser,modular_kitchen,wardrobe,bed}',
   'hyderabad','gachibowli','Kondapur Road','500032',10,6)

) as v(
  id, owner_id, status, title, description,
  flat_type, listing_kind, furnishing, rent, deposit, maintenance, maintenance_included,
  food_pref, pets, smoking, drinking, couples,
  tenant_prefs, bedrooms, bathrooms, balconies, floor_number, total_floors,
  carpet_area, parking, amenities,
  city_slug, locality_slug, address_line, pincode, available_in_days, min_stay
)
join public.cities     c on c.slug = v.city_slug
join public.localities l on l.slug = v.locality_slug and l.city_id = c.id
on conflict (id) do nothing;

-- =============================================================================
-- 0007_locations.sql — canonical city and locality reference data
--
-- This is a migration, not a seed: it is real production data that the app
-- depends on (URL slugs, filter dropdowns, FK targets), not throwaway test
-- fixtures. supabase/seed.sql holds the fake listings instead.
--
-- Adding a city later is just another migration. Localities can also be
-- extended from the dashboard without a deploy.
-- =============================================================================

insert into public.cities (slug, name, state) values
  ('pune',      'Pune',      'Maharashtra'),
  ('mumbai',    'Mumbai',    'Maharashtra'),
  ('bengaluru', 'Bengaluru', 'Karnataka'),
  ('hyderabad', 'Hyderabad', 'Telangana'),
  ('delhi',     'Delhi',     'Delhi'),
  ('gurugram',  'Gurugram',  'Haryana')
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Localities, resolved against the city slug so this block is re-runnable and
-- does not depend on generated id values.
-- -----------------------------------------------------------------------------
insert into public.localities (city_id, slug, name, pincode)
select c.id, v.slug, v.name, v.pincode
from (values
  -- Pune
  ('pune', 'baner',            'Baner',              '411045'),
  ('pune', 'kharadi',          'Kharadi',            '411014'),
  ('pune', 'hinjewadi',        'Hinjewadi',          '411057'),
  ('pune', 'wakad',            'Wakad',              '411057'),
  ('pune', 'viman-nagar',      'Viman Nagar',        '411014'),
  ('pune', 'koregaon-park',    'Koregaon Park',      '411001'),
  ('pune', 'kothrud',          'Kothrud',            '411038'),
  ('pune', 'hadapsar',         'Hadapsar',           '411028'),
  ('pune', 'aundh',            'Aundh',              '411007'),
  ('pune', 'magarpatta',       'Magarpatta',         '411013'),

  -- Mumbai
  ('mumbai', 'andheri-west',   'Andheri West',       '400058'),
  ('mumbai', 'andheri-east',   'Andheri East',       '400069'),
  ('mumbai', 'bandra-west',    'Bandra West',        '400050'),
  ('mumbai', 'powai',          'Powai',              '400076'),
  ('mumbai', 'goregaon-east',  'Goregaon East',      '400063'),
  ('mumbai', 'malad-west',     'Malad West',         '400064'),
  ('mumbai', 'thane-west',     'Thane West',         '400601'),
  ('mumbai', 'chembur',        'Chembur',            '400071'),
  ('mumbai', 'lower-parel',    'Lower Parel',        '400013'),
  ('mumbai', 'vikhroli',       'Vikhroli',           '400083'),

  -- Bengaluru
  ('bengaluru', 'koramangala',     'Koramangala',      '560034'),
  ('bengaluru', 'indiranagar',     'Indiranagar',      '560038'),
  ('bengaluru', 'whitefield',      'Whitefield',       '560066'),
  ('bengaluru', 'hsr-layout',      'HSR Layout',       '560102'),
  ('bengaluru', 'btm-layout',      'BTM Layout',       '560076'),
  ('bengaluru', 'marathahalli',    'Marathahalli',     '560037'),
  ('bengaluru', 'electronic-city', 'Electronic City',  '560100'),
  ('bengaluru', 'jayanagar',       'Jayanagar',        '560041'),
  ('bengaluru', 'hebbal',          'Hebbal',           '560024'),
  ('bengaluru', 'sarjapur-road',   'Sarjapur Road',    '560035'),

  -- Hyderabad
  ('hyderabad', 'gachibowli',    'Gachibowli',        '500032'),
  ('hyderabad', 'hitec-city',    'HITEC City',        '500081'),
  ('hyderabad', 'madhapur',      'Madhapur',          '500081'),
  ('hyderabad', 'kondapur',      'Kondapur',          '500084'),
  ('hyderabad', 'kukatpally',    'Kukatpally',        '500072'),
  ('hyderabad', 'banjara-hills', 'Banjara Hills',     '500034'),
  ('hyderabad', 'jubilee-hills', 'Jubilee Hills',     '500033'),
  ('hyderabad', 'begumpet',      'Begumpet',          '500016'),

  -- Delhi
  ('delhi', 'saket',           'Saket',              '110017'),
  ('delhi', 'hauz-khas',       'Hauz Khas',          '110016'),
  ('delhi', 'lajpat-nagar',    'Lajpat Nagar',       '110024'),
  ('delhi', 'dwarka',          'Dwarka',             '110075'),
  ('delhi', 'rohini',          'Rohini',             '110085'),
  ('delhi', 'karol-bagh',      'Karol Bagh',         '110005'),
  ('delhi', 'vasant-kunj',     'Vasant Kunj',        '110070'),
  ('delhi', 'mayur-vihar',     'Mayur Vihar',        '110091'),

  -- Gurugram
  ('gurugram', 'sector-49',      'Sector 49',        '122018'),
  ('gurugram', 'sector-56',      'Sector 56',        '122011'),
  ('gurugram', 'dlf-phase-3',    'DLF Phase 3',      '122010'),
  ('gurugram', 'sohna-road',     'Sohna Road',       '122018'),
  ('gurugram', 'golf-course-road','Golf Course Road','122002'),
  ('gurugram', 'new-gurugram',   'New Gurugram',     '122004')
) as v(city_slug, slug, name, pincode)
join public.cities c on c.slug = v.city_slug
on conflict (city_id, slug) do nothing;

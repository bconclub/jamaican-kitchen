-- 0003_full_menu.sql
-- Full menu import from Jamaican_Kitchen_Online_Menu.xlsx:
-- 15 categories, 142 items, 19 modifier groups, 69 options, item->group links.
-- Images intentionally left blank (no guessed stock photos) -- admin uploads real
-- product photos via the Menu page; see 0004_menu_photo_storage.sql for the bucket.
-- Replaces the starter seed from 0001. Idempotent upserts.

begin;

-- ---- Modifier definition tables (menu-level) ----
create table if not exists public.modifier_groups (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  required boolean not null default false,
  min_select int not null default 0,
  max_select int not null default 1,
  multi_different boolean not null default false,
  multi_same boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.modifier_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.modifier_groups(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0,
  sort_order int not null default 0,
  unique (group_id, name)
);
alter table public.menu_items add column if not exists modifier_groups text[] not null default '{}';

alter table public.modifier_groups  enable row level security;
alter table public.modifier_options enable row level security;
drop policy if exists "public read modifier_groups" on public.modifier_groups;
create policy "public read modifier_groups" on public.modifier_groups for select using (true);
drop policy if exists "staff write modifier_groups" on public.modifier_groups;
create policy "staff write modifier_groups" on public.modifier_groups for all
  using (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'manager') or public.has_role(auth.uid(),'staff'))
  with check (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'manager') or public.has_role(auth.uid(),'staff'));
drop policy if exists "public read modifier_options" on public.modifier_options;
create policy "public read modifier_options" on public.modifier_options for select using (true);
drop policy if exists "staff write modifier_options" on public.modifier_options;
create policy "staff write modifier_options" on public.modifier_options for all
  using (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'manager') or public.has_role(auth.uid(),'staff'))
  with check (public.has_role(auth.uid(),'owner') or public.has_role(auth.uid(),'manager') or public.has_role(auth.uid(),'staff'));

-- ---- Seed modifier groups ----
insert into public.modifier_groups (slug,name,required,min_select,max_select,multi_different,multi_same,sort_order) values
  ('d-g-flavor-choice','D&G Flavor Choice',true,1,1,false,false,1),
  ('add-cheese','Add Cheese',false,0,1,false,false,2),
  ('dipping-sauce','Dipping Sauce',false,0,10,false,true,3),
  ('drink-choice','Drink Choice',true,1,1,false,false,4),
  ('extra-sauce','Extra Sauce',false,0,10,false,true,5),
  ('grace-flavor-choice','Grace Flavor Choice',true,1,1,false,false,6),
  ('gravy-option','Gravy Option',false,0,1,false,false,7),
  ('jerk-sauce-choice','Jerk Sauce Choice',true,1,1,false,false,8),
  ('choose-your-sauce','Choose Your Sauce',false,0,2,true,false,9),
  ('ketchup-option','Ketchup Option',false,0,1,false,false,10),
  ('supligen-flavor','Supligen Flavor',true,1,1,false,false,11),
  ('premium-sauce-upgrade','Premium Sauce Upgrade',false,0,1,false,false,12),
  ('sandwich-toppings','Sandwich Toppings',false,0,1,true,false,13),
  ('side-selection','Side Selection',true,1,1,false,false,14),
  ('breakfast-side-selection','Breakfast Side Selection',true,1,1,false,false,15),
  ('add-veg-patty','Add Veg Patty',false,0,10,true,true,16),
  ('wing-flavor','Wing Flavor',false,0,1,false,false,17),
  ('fries-sauce-choice','Fries Sauce Choice',false,0,1,false,false,18),
  ('sandwich-add-ons','Sandwich Add-Ons',false,0,1,false,false,19)
on conflict (slug) do update set
  name=excluded.name, required=excluded.required, min_select=excluded.min_select,
  max_select=excluded.max_select, multi_different=excluded.multi_different,
  multi_same=excluded.multi_same, sort_order=excluded.sort_order;

-- ---- Seed modifier options ----
insert into public.modifier_options (group_id,name,price,sort_order)
  select id,'Kola Champagne',0.0,1 from public.modifier_groups where slug='d-g-flavor-choice'
union all
  select id,'Pineapple Soda',0.0,2 from public.modifier_groups where slug='d-g-flavor-choice'
union all
  select id,'Ginger Beer',0.0,3 from public.modifier_groups where slug='d-g-flavor-choice'
union all
  select id,'Cream Soda',0.0,4 from public.modifier_groups where slug='d-g-flavor-choice'
union all
  select id,'Pineapple Ginger',0.0,5 from public.modifier_groups where slug='d-g-flavor-choice'
union all
  select id,'Cheese',1.0,1 from public.modifier_groups where slug='add-cheese'
union all
  select id,'Oxtail Dipping Sauce (2 oz)',0.99,1 from public.modifier_groups where slug='dipping-sauce'
union all
  select id,'Curry Goat Dipping Sauce (2 oz)',0.99,2 from public.modifier_groups where slug='dipping-sauce'
union all
  select id,'Curry Chicken Dipping Sauce (2 oz)',0.99,3 from public.modifier_groups where slug='dipping-sauce'
union all
  select id,'Jerk Dipping Sauce (2 oz)',0.99,4 from public.modifier_groups where slug='dipping-sauce'
union all
  select id,'Brown stew chicken dipping sauce (2 oz)',0.99,5 from public.modifier_groups where slug='dipping-sauce'
union all
  select id,'Coke',0.0,1 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Diet Coke',0.0,2 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Gatorade Lemon-Lime',0.0,3 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Gatorade Orange',0.0,4 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Gatorade Fruit Punch',0.0,5 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Gatorade Cool',0.0,6 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Sprite',0.0,7 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Snapple Apple',0.0,8 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Snapple fruit punch',0.0,9 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Snapple Kiwi Strawberry',0.0,10 from public.modifier_groups where slug='drink-choice'
union all
  select id,'Side Sauce (2 oz)',0.99,1 from public.modifier_groups where slug='extra-sauce'
union all
  select id,'Pineapple Ginger',0.0,1 from public.modifier_groups where slug='grace-flavor-choice'
union all
  select id,'Island Mango',0.0,2 from public.modifier_groups where slug='grace-flavor-choice'
union all
  select id,'Mango Carrot',0.0,3 from public.modifier_groups where slug='grace-flavor-choice'
union all
  select id,'Reggae Medley',0.0,4 from public.modifier_groups where slug='grace-flavor-choice'
union all
  select id,'Curry Goat Gravy',0.0,1 from public.modifier_groups where slug='gravy-option'
union all
  select id,'Oxtail Gravy',0.0,2 from public.modifier_groups where slug='gravy-option'
union all
  select id,'Stew Chicken Gravy',0.0,3 from public.modifier_groups where slug='gravy-option'
union all
  select id,'Curry Chicken Gravy',0.0,4 from public.modifier_groups where slug='gravy-option'
union all
  select id,'Jerk Sauce',0.0,5 from public.modifier_groups where slug='gravy-option'
union all
  select id,'Pepper Steak Gravy',0.0,6 from public.modifier_groups where slug='gravy-option'
union all
  select id,'Jerk Sauce On It',0.0,1 from public.modifier_groups where slug='jerk-sauce-choice'
union all
  select id,'No Jerk Sauce',0.0,2 from public.modifier_groups where slug='jerk-sauce-choice'
union all
  select id,'Jerk Sauce On The Side',0.0,3 from public.modifier_groups where slug='jerk-sauce-choice'
union all
  select id,'Sweet & Spicy ketchup',0.0,1 from public.modifier_groups where slug='choose-your-sauce'
union all
  select id,'Regular ketchup',0.0,2 from public.modifier_groups where slug='choose-your-sauce'
union all
  select id,'Tartar Sauce',0.0,3 from public.modifier_groups where slug='choose-your-sauce'
union all
  select id,'Chipotle Mayo',0.0,4 from public.modifier_groups where slug='choose-your-sauce'
union all
  select id,'Spicy Ketchup',0.0,1 from public.modifier_groups where slug='ketchup-option'
union all
  select id,'Sweet & Spicy Ketchup',0.0,2 from public.modifier_groups where slug='ketchup-option'
union all
  select id,'Supligen Peanut',0.0,1 from public.modifier_groups where slug='supligen-flavor'
union all
  select id,'Supligen vanilla',0.0,2 from public.modifier_groups where slug='supligen-flavor'
union all
  select id,'Oxtail Sauce (2 oz)',0.99,1 from public.modifier_groups where slug='premium-sauce-upgrade'
union all
  select id,'Curry Goat Sauce (2 oz)',0.99,2 from public.modifier_groups where slug='premium-sauce-upgrade'
union all
  select id,'Curry Chicken Sauce (2 oz)',0.99,3 from public.modifier_groups where slug='premium-sauce-upgrade'
union all
  select id,'Chipotle Mayo',0.0,1 from public.modifier_groups where slug='sandwich-toppings'
union all
  select id,'Coleslaw',0.0,2 from public.modifier_groups where slug='sandwich-toppings'
union all
  select id,'Extra Cheese',1.0,3 from public.modifier_groups where slug='sandwich-toppings'
union all
  select id,'Rice and Peas and cabbage',0.0,1 from public.modifier_groups where slug='side-selection'
union all
  select id,'White Rice and cabbage',0.0,2 from public.modifier_groups where slug='side-selection'
union all
  select id,'White Rice',0.0,3 from public.modifier_groups where slug='side-selection'
union all
  select id,'Rice and peas',0.0,4 from public.modifier_groups where slug='side-selection'
union all
  select id,'Steamed Cabbage only',0.0,5 from public.modifier_groups where slug='side-selection'
union all
  select id,'Festival (3 pieces)',0.0,1 from public.modifier_groups where slug='breakfast-side-selection'
union all
  select id,'White Rice & Cabbage',0.0,2 from public.modifier_groups where slug='breakfast-side-selection'
union all
  select id,'Rice and Peas & Steamed Cabbage',0.0,3 from public.modifier_groups where slug='breakfast-side-selection'
union all
  select id,'White Rice',0.0,4 from public.modifier_groups where slug='breakfast-side-selection'
union all
  select id,'Rice and peas',0.0,5 from public.modifier_groups where slug='breakfast-side-selection'
union all
  select id,'Steamed cabbage only',0.0,6 from public.modifier_groups where slug='breakfast-side-selection'
union all
  select id,'Spinach Patty',3.9,1 from public.modifier_groups where slug='add-veg-patty'
union all
  select id,'Vegetable Patty',3.9,2 from public.modifier_groups where slug='add-veg-patty'
union all
  select id,'BBQ',0.0,1 from public.modifier_groups where slug='wing-flavor'
union all
  select id,'Jerk(spicy)',0.0,2 from public.modifier_groups where slug='wing-flavor'
union all
  select id,'Sweet & Spicy Ketchup',0.0,1 from public.modifier_groups where slug='fries-sauce-choice'
union all
  select id,'Ketchup',0.0,2 from public.modifier_groups where slug='fries-sauce-choice'
union all
  select id,'Chipotle Mayo',0.0,3 from public.modifier_groups where slug='fries-sauce-choice'
union all
  select id,'Plantain (2 pcs)',2.0,1 from public.modifier_groups where slug='sandwich-add-ons'
union all
  select id,'Side of Jerk Sauce',0.99,2 from public.modifier_groups where slug='sandwich-add-ons'
on conflict (group_id,name) do update set price=excluded.price, sort_order=excluded.sort_order;

-- ---- Categories ----
insert into public.menu_categories (slug,name,description,sort_order) values
  ('chicken','Chicken','Authentic Jamaican chicken — jerk, curry, stew & fried',1),
  ('oxtails','Oxtails','Slow-braised, fall-off-the-bone tender',2),
  ('goat-curry','Goat Curry','Traditional Jamaican curry goat',3),
  ('pork','Pork','Smoky, spicy jerk pork',4),
  ('seafood','Seafood','Fresh catches prepared island style',5),
  ('steak','Steak','Tender pepper steak in savory sauce',6),
  ('vegetarian-meals','Vegetarian Meals','Hearty plant-based island plates',7),
  ('patties','Patties','Flaky, golden pastries filled with savory goodness',8),
  ('side-orders','Side Orders','Perfect accompaniments',9),
  ('sandwiches-wraps','Sandwiches & Wraps','Island-style sandwiches on coco bread',10),
  ('breakfast','Breakfast','Jamaican breakfast classics',11),
  ('soups','Soups','Comforting, hearty island soups',12),
  ('drinks','Drinks','Refreshing Caribbean beverages',13),
  ('desserts','Desserts','Sweet island treats',14),
  ('gift-shop','Gift Shop','Take a taste of the island home',15)
on conflict (slug) do update set name=excluded.name, description=excluded.description, sort_order=excluded.sort_order;

-- ---- Menu items (image left blank -- upload real photos via admin) ----
insert into public.menu_items (slug,category_id,name,description,base_price,image,spice_level,sort_order,modifier_groups)
  select 'half-lb-curried-chicken',(select id from public.menu_categories where slug='chicken'),'1/2 lb. Curried Chicken','Tender chicken simmered in rich Jamaican curry with herbs, garlic, and spices—flavorful, hearty, and a true island favorite.',8.99,null,'medium'::public.spice_level,1,array['extra-sauce']::text[]
union all
  select 'half-lb-jerk-chicken',(select id from public.menu_categories where slug='chicken'),'1/2 lb. Jerk Chicken','Tender, smoky chicken marinated in authentic Jamaican spices, then jerked to perfection—bold, fiery, and bursting with island flavor in every bite.',9.59,null,'hot'::public.spice_level,2,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade']::text[]
union all
  select 'half-lb-stew-chicken',(select id from public.menu_categories where slug='chicken'),'1/2 lb. Stew Chicken','Tender chicken pieces slow-simmered in a savory brown gravy with onions, bell peppers, garlic, and thyme—rich, comforting, and packed with deep island flavor.',8.99,null,'mild'::public.spice_level,3,array['extra-sauce']::text[]
union all
  select '1-lb-curried-chicken',(select id from public.menu_categories where slug='chicken'),'1 lb. Curried Chicken','Tender chicken simmered in rich Jamaican curry with herbs, garlic, and spices—flavorful, hearty, and a true island favorite.',13.99,null,'medium'::public.spice_level,4,array['extra-sauce']::text[]
union all
  select '1-lb-jerk-chicken',(select id from public.menu_categories where slug='chicken'),'1 lb. Jerk Chicken','Tender, smoky chicken marinated in authentic Jamaican spices, then jerked to perfection—bold, fiery, and bursting with island flavor in every bite.',14.59,null,'hot'::public.spice_level,5,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade']::text[]
union all
  select '1-lb-stew-chicken',(select id from public.menu_categories where slug='chicken'),'1 lb. Stew Chicken','Tender chicken pieces slow-simmered in a savory brown gravy with onions, bell peppers, garlic, and thyme—rich, comforting, and packed with deep island flavor.',13.99,null,'mild'::public.spice_level,6,array['extra-sauce']::text[]
union all
  select 'boneless-curry-chicken-lg',(select id from public.menu_categories where slug='chicken'),'Boneless Curry Chicken - LG','Tender boneless chicken strips slow-cooked in aromatic curry with herbs and spices, seasoned with our Jamaican blend for a warm, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',15.3,null,'medium'::public.spice_level,7,array['side-selection','extra-sauce']::text[]
union all
  select 'boneless-curry-chicken-med',(select id from public.menu_categories where slug='chicken'),'Boneless Curry Chicken - MED','Tender boneless chicken strips slow-cooked in aromatic curry with herbs and spices, seasoned with our Jamaican blend for a warm, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',12.8,null,'medium'::public.spice_level,8,array['side-selection','extra-sauce']::text[]
union all
  select 'boneless-curry-chicken-sm',(select id from public.menu_categories where slug='chicken'),'Boneless Curry Chicken - SM','Tender boneless chicken strips slow-cooked in aromatic curry with herbs and spices, seasoned with our Jamaican blend for a warm, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',10.8,null,'medium'::public.spice_level,9,array['side-selection','extra-sauce']::text[]
union all
  select 'boneless-honey-bbq-chicken-lg',(select id from public.menu_categories where slug='chicken'),'Boneless Honey BBQ Chicken - LG','Tender boneless chicken strips coated in our sweet and smoky honey BBQ sauce, seasoned with Jamaican herbs and spices for a rich island flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',16.59,null,'mild'::public.spice_level,10,array['side-selection','extra-sauce']::text[]
union all
  select 'boneless-honey-bbq-chicken-med',(select id from public.menu_categories where slug='chicken'),'Boneless Honey BBQ Chicken - MED','Tender boneless chicken strips coated in our sweet and smoky honey BBQ sauce, seasoned with Jamaican herbs and spices for a rich island flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',13.99,null,'mild'::public.spice_level,11,array['side-selection','extra-sauce']::text[]
union all
  select 'boneless-honey-bbq-chicken-sm',(select id from public.menu_categories where slug='chicken'),'Boneless Honey BBQ Chicken - SM','Tender boneless chicken strips coated in our sweet and smoky honey BBQ sauce, seasoned with Jamaican herbs and spices for a rich island flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',11.99,null,'mild'::public.spice_level,12,array['side-selection','extra-sauce']::text[]
union all
  select 'boneless-stew-chicken-lg',(select id from public.menu_categories where slug='chicken'),'Boneless Stew Chicken - LG','Tender boneless chicken strips simmered in rich gravy with onions and peppers, seasoned with our Jamaican blend for a bold, comforting taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',15.3,null,'mild'::public.spice_level,13,array['side-selection','extra-sauce']::text[]
union all
  select 'boneless-stew-chicken-med',(select id from public.menu_categories where slug='chicken'),'Boneless Stew Chicken - MED','Tender boneless chicken strips simmered in rich gravy with onions and peppers, seasoned with our Jamaican blend for a bold, comforting taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',12.8,null,'mild'::public.spice_level,14,array['side-selection','extra-sauce']::text[]
union all
  select 'boneless-stew-chicken-sm',(select id from public.menu_categories where slug='chicken'),'Boneless Stew Chicken - SM','Tender boneless chicken strips simmered in rich gravy with onions and peppers, seasoned with our Jamaican blend for a bold, comforting taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',10.8,null,'mild'::public.spice_level,15,array['side-selection','extra-sauce']::text[]
union all
  select 'curry-chicken-lg',(select id from public.menu_categories where slug='chicken'),'Curry Chicken - LG','Tender chicken slow-cooked in aromatic curry with herbs and spices, seasoned with our Jamaican blend for a warm, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',15.79,null,'medium'::public.spice_level,16,array['side-selection','extra-sauce']::text[]
union all
  select 'curry-chicken-med',(select id from public.menu_categories where slug='chicken'),'Curry Chicken - MED','Tender chicken slow-cooked in aromatic curry with herbs and spices, seasoned with our Jamaican blend for a warm, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',13.49,null,'medium'::public.spice_level,17,array['side-selection','extra-sauce']::text[]
union all
  select 'curry-chicken-sm',(select id from public.menu_categories where slug='chicken'),'Curry Chicken - SM','Tender chicken slow-cooked in aromatic curry with herbs and spices, seasoned with our Jamaican blend for a warm, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',10.99,null,'medium'::public.spice_level,18,array['side-selection','extra-sauce']::text[]
union all
  select 'fried-chicken-12-pieces',(select id from public.menu_categories where slug='chicken'),'Fried Chicken 12 Pieces','Golden, crunchy, and seasoned to the bone—this juicy fried chicken delivers big flavor and island-style comfort in every bite',28.99,null,'mild'::public.spice_level,19,array['ketchup-option','gravy-option']::text[]
union all
  select 'fried-chicken-3-pieces',(select id from public.menu_categories where slug='chicken'),'Fried Chicken 3 Pieces','Golden, crunchy, and seasoned to the bone—this juicy fried chicken delivers big flavor and island-style comfort in every bite',8.99,null,'mild'::public.spice_level,20,array['ketchup-option','gravy-option']::text[]
union all
  select 'fried-chicken-6-pieces',(select id from public.menu_categories where slug='chicken'),'Fried Chicken 6 Pieces','Golden, crunchy, and seasoned to the bone—this juicy fried chicken delivers big flavor and island-style comfort in every bite',15.99,null,'mild'::public.spice_level,21,array['ketchup-option','gravy-option']::text[]
union all
  select 'fried-chicken-lg',(select id from public.menu_categories where slug='chicken'),'Fried Chicken - LG','Crispy, golden fried chicken seasoned with our Jamaican blend, delivering a satisfying crunch and juicy finish in every bite. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',16.59,null,'mild'::public.spice_level,22,array['side-selection','gravy-option']::text[]
union all
  select 'fried-chicken-med',(select id from public.menu_categories where slug='chicken'),'Fried Chicken - MED','Crispy, golden fried chicken seasoned with our Jamaican blend, delivering a satisfying crunch and juicy finish in every bite. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',13.99,null,'mild'::public.spice_level,23,array['side-selection','gravy-option']::text[]
union all
  select 'fried-chicken-sm',(select id from public.menu_categories where slug='chicken'),'Fried Chicken - SM','Crispy, golden fried chicken seasoned with our Jamaican blend, delivering a satisfying crunch and juicy finish in every bite. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',11.99,null,'mild'::public.spice_level,24,array['side-selection','gravy-option']::text[]
union all
  select 'jamaican-wings-lg',(select id from public.menu_categories where slug='chicken'),'Jamaican Wings - LG','A customer favorite—our signature jerk wings, marinated in bold Jamaican spices and oven-roasted for a rich, smoky flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',16.59,null,'hot'::public.spice_level,25,array['side-selection','premium-sauce-upgrade','extra-sauce','wing-flavor']::text[]
union all
  select 'jamaican-wings-med',(select id from public.menu_categories where slug='chicken'),'Jamaican Wings - MED','A customer favorite—our signature jerk wings, marinated in bold Jamaican spices and oven-roasted for a rich, smoky flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',13.99,null,'hot'::public.spice_level,26,array['side-selection','premium-sauce-upgrade','extra-sauce','wing-flavor']::text[]
union all
  select 'jamaican-wings-sm',(select id from public.menu_categories where slug='chicken'),'Jamaican Wings - SM','A customer favorite—our signature jerk wings, marinated in bold Jamaican spices and oven-roasted for a rich, smoky flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',11.99,null,'hot'::public.spice_level,27,array['side-selection','premium-sauce-upgrade','extra-sauce','wing-flavor']::text[]
union all
  select 'jerk-chicken-lg',(select id from public.menu_categories where slug='chicken'),'Jerk Chicken - LG','Our signature jerk chicken is marinated in bold Jamaican spices and slow-roasted for a rich, smoky flavor. Served with a scoop of rice & peas.',16.59,null,'hot'::public.spice_level,28,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade','side-selection']::text[]
union all
  select 'jerk-chicken-med',(select id from public.menu_categories where slug='chicken'),'Jerk Chicken - MED','Our signature jerk chicken is marinated in bold Jamaican spices and slow-roasted for a rich, smoky flavor. Served with a scoop of rice & peas.',13.99,null,'hot'::public.spice_level,29,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade','side-selection']::text[]
union all
  select 'jerk-chicken-sm',(select id from public.menu_categories where slug='chicken'),'Jerk Chicken - SM','Our signature jerk chicken is marinated in bold Jamaican spices and slow-roasted for a rich, smoky flavor. Served with a scoop of rice & peas.',11.99,null,'hot'::public.spice_level,30,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade','side-selection']::text[]
union all
  select 'stew-chicken-lg',(select id from public.menu_categories where slug='chicken'),'Stew Chicken - LG','Tender chicken simmered in rich gravy with onions and peppers, seasoned with our Jamaican blend for a bold, comforting taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',15.79,null,'mild'::public.spice_level,31,array['side-selection','extra-sauce']::text[]
union all
  select 'stew-chicken-med',(select id from public.menu_categories where slug='chicken'),'Stew Chicken - MED','Tender chicken simmered in rich gravy with onions and peppers, seasoned with our Jamaican blend for a bold, comforting taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',13.49,null,'mild'::public.spice_level,32,array['side-selection','extra-sauce']::text[]
union all
  select 'stew-chicken-sm',(select id from public.menu_categories where slug='chicken'),'Stew Chicken - SM','Tender chicken simmered in rich gravy with onions and peppers, seasoned with our Jamaican blend for a bold, comforting taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',10.99,null,'mild'::public.spice_level,33,array['side-selection','extra-sauce']::text[]
union all
  select '3-wings',(select id from public.menu_categories where slug='chicken'),'3 Wings','Smoky, spicy, and perfectly grilled—these jerk-seasoned wings are bold, juicy, and packed with authentic Jamaican flavor in every bite.',7.99,null,'hot'::public.spice_level,34,array['extra-sauce','wing-flavor']::text[]
union all
  select 'wings-12-by-the-dozen',(select id from public.menu_categories where slug='chicken'),'Wings 12 (By the Dozen)','Smoky, spicy, and perfectly grilled—these jerk-seasoned wings are bold, juicy, and packed with authentic Jamaican flavor in every bite.',18.99,null,'hot'::public.spice_level,35,array['extra-sauce','wing-flavor']::text[]
union all
  select 'wings-6',(select id from public.menu_categories where slug='chicken'),'Wings 6','Smoky, spicy, and perfectly grilled—these jerk-seasoned wings are bold, juicy, and packed with authentic Jamaican flavor in every bite.',12.99,null,'hot'::public.spice_level,36,array['extra-sauce','wing-flavor']::text[]
union all
  select 'half-lb-oxtail',(select id from public.menu_categories where slug='oxtails'),'1/2 lb. Oxtail','Fall off the bone slow-braised in a rich, savory gravy, paired with creamy butter beans—heartwarming, comforting, and full of deep island flavor.',12.99,null,'mild'::public.spice_level,1,array['extra-sauce']::text[]
union all
  select '1-lb-oxtail',(select id from public.menu_categories where slug='oxtails'),'1 lb. Oxtail','Fall off the bone slow-braised in a rich, savory gravy, paired with creamy butter beans—heartwarming, comforting, and full of deep island flavor.',19.99,null,'mild'::public.spice_level,2,array['extra-sauce']::text[]
union all
  select 'oxtail-lg',(select id from public.menu_categories where slug='oxtails'),'Oxtail - LG','Slow-braised oxtail simmered in savory gravy with butter beans, seasoned with our Jamaican blend for a deep, bold taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',26.99,null,'mild'::public.spice_level,3,array['side-selection','extra-sauce']::text[]
union all
  select 'oxtail-med',(select id from public.menu_categories where slug='oxtails'),'Oxtail - MED','Slow-braised oxtail simmered in savory gravy with butter beans, seasoned with our Jamaican blend for a deep, bold taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',22.49,null,'mild'::public.spice_level,4,array['side-selection','extra-sauce']::text[]
union all
  select 'half-lb-curry-goat',(select id from public.menu_categories where slug='goat-curry'),'1/2 lb. Curry Goat','Tender, slow-cooked goat simmered in rich Jamaican curry with herbs, garlic, and spices—bold, savory, and full of deep island flavor in every bite.',11.29,null,'medium'::public.spice_level,1,array['extra-sauce']::text[]
union all
  select '1-lb-curry-goat',(select id from public.menu_categories where slug='goat-curry'),'1 lb. Curry Goat','Tender, slow-cooked goat simmered in rich Jamaican curry with herbs, garlic, and spices—bold, savory, and full of deep island flavor in every bite.',16.99,null,'medium'::public.spice_level,2,array['extra-sauce']::text[]
union all
  select 'curry-goat-med',(select id from public.menu_categories where slug='goat-curry'),'Curry Goat - MED','Tender goat slow-cooked in aromatic curry, seasoned with our Jamaican blend for a bold, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',17.99,null,'medium'::public.spice_level,3,array['side-selection','extra-sauce']::text[]
union all
  select 'curry-goat-lg',(select id from public.menu_categories where slug='goat-curry'),'Curry Goat - LG','Tender goat slow-cooked in aromatic curry, seasoned with our Jamaican blend for a bold, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',21.99,null,'medium'::public.spice_level,4,array['side-selection','extra-sauce']::text[]
union all
  select 'half-lb-jerk-pork',(select id from public.menu_categories where slug='pork'),'1/2 lb. Jerk Pork','Tender, juicy pork cubes marinated in authentic jerk seasoning and grilled to smoky perfection—spicy, flavorful, and full of island fire.',9.59,null,'hot'::public.spice_level,1,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade']::text[]
union all
  select '1-lb-jerk-pork',(select id from public.menu_categories where slug='pork'),'1 lb. Jerk Pork','Tender, juicy pork cubes marinated in authentic jerk seasoning and grilled to smoky perfection—spicy, flavorful, and full of island fire.',14.59,null,'hot'::public.spice_level,2,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade']::text[]
union all
  select 'jerk-pork-lg',(select id from public.menu_categories where slug='pork'),'Jerk Pork - LG','A customer favourite—tender, slow-cooked pork marinated in bold Jamaican spices, delivering rich flavour with a signature kick. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',16.59,null,'hot'::public.spice_level,3,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade','side-selection']::text[]
union all
  select 'jerk-pork-med',(select id from public.menu_categories where slug='pork'),'Jerk Pork - MED','A customer favourite—tender, slow-cooked pork marinated in bold Jamaican spices, delivering rich flavour with a signature kick. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',13.99,null,'hot'::public.spice_level,4,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade','side-selection']::text[]
union all
  select 'jerk-pork-sm',(select id from public.menu_categories where slug='pork'),'Jerk Pork - SM','A customer favourite—tender, slow-cooked pork marinated in bold Jamaican spices, delivering rich flavour with a signature kick. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',11.99,null,'hot'::public.spice_level,5,array['jerk-sauce-choice','extra-sauce','premium-sauce-upgrade','side-selection']::text[]
union all
  select 'brown-stew-red-snapper-fish-three-quarter-1lbs',(select id from public.menu_categories where slug='seafood'),'Brown Stew Red Snapper Fish 3/4-1lbs','Whole red snapper simmered in a rich brown stew sauce with onions, peppers, herbs, and Jamaican spices for a bold, savory island flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',25.99,null,'mild'::public.spice_level,1,array['side-selection']::text[]
union all
  select 'escovitch-red-snapper-fish-three-quarter-1-lb',(select id from public.menu_categories where slug='seafood'),'Escovitch Red Snapper Fish 3/4-1 lb','Crispy fried red snapper topped with our signature escovitch blend of tangy pickled onions, carrots, and peppers for a zesty, bold Jamaican flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',25.99,null,'medium'::public.spice_level,2,array['side-selection']::text[]
union all
  select 'steamed-red-snapper-fish-three-quarter-1lbs',(select id from public.menu_categories where slug='seafood'),'Steamed Red Snapper Fish - 3/4-1lbs','Whole red snapper steamed with onions, peppers, pumpkin, carrots, fresh herbs, Jamaican spices, and rich coconut milk for authentic island flavor.',25.99,null,'mild'::public.spice_level,3,array['side-selection']::text[]
union all
  select 'brown-stew-shrimp-lg',(select id from public.menu_categories where slug='seafood'),'Brown Stew Shrimp - LG','Simmered in rich brown stew gravy with onions and peppers, seasoned with our Jamaican blend for a bold, comforting island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',19.99,null,'mild'::public.spice_level,4,array['side-selection']::text[]
union all
  select 'brown-stew-shrimp-med',(select id from public.menu_categories where slug='seafood'),'Brown Stew Shrimp - MED','Simmered in rich brown stew gravy with onions and peppers, seasoned with our Jamaican blend for a bold, comforting island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',16.99,null,'mild'::public.spice_level,5,array['side-selection']::text[]
union all
  select 'brown-stew-shrimp-sm',(select id from public.menu_categories where slug='seafood'),'Brown Stew Shrimp - SM','Simmered in rich brown stew gravy with onions and peppers, seasoned with our Jamaican blend for a bold, comforting island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',12.99,null,'mild'::public.spice_level,6,array['side-selection']::text[]
union all
  select 'curried-shrimp-sm',(select id from public.menu_categories where slug='seafood'),'Curried Shrimp - SM','Simmered in aromatic curry, seasoned with our Jamaican blend for a warm, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',12.99,null,'medium'::public.spice_level,7,array['side-selection']::text[]
union all
  select 'curry-shrimp-lg',(select id from public.menu_categories where slug='seafood'),'Curry Shrimp - LG','Simmered in aromatic curry, seasoned with our Jamaican blend for a warm, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',19.99,null,'medium'::public.spice_level,8,array['side-selection']::text[]
union all
  select 'curry-shrimp-med',(select id from public.menu_categories where slug='seafood'),'Curry Shrimp - MED','Simmered in aromatic curry, seasoned with our Jamaican blend for a warm, savory island taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',16.99,null,'medium'::public.spice_level,9,array['side-selection']::text[]
union all
  select 'jerk-shrimp-lg',(select id from public.menu_categories where slug='seafood'),'Jerk Shrimp - LG','Juicy shrimp seasoned with bold Jamaican jerk spices, cooked to perfection for a rich, smoky flavor with a signature island kick. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',19.99,null,'hot'::public.spice_level,10,array['side-selection']::text[]
union all
  select 'jerk-shrimp-med',(select id from public.menu_categories where slug='seafood'),'Jerk Shrimp - MED','Juicy shrimp seasoned with bold Jamaican jerk spices, cooked to perfection for a rich, smoky flavor with a signature island kick. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',16.99,null,'hot'::public.spice_level,11,array['side-selection']::text[]
union all
  select 'jerk-shrimp-sm',(select id from public.menu_categories where slug='seafood'),'Jerk Shrimp - SM','Juicy shrimp seasoned with bold Jamaican jerk spices, cooked to perfection for a rich, smoky flavor with a signature island kick. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',12.99,null,'hot'::public.spice_level,12,array['side-selection']::text[]
union all
  select 'sweet-chilli-fried-shrimp-lg',(select id from public.menu_categories where slug='seafood'),'Sweet Chilli Fried Shrimp - LG','Crispy fried shrimp tossed in our sweet chili sauce, delivering the perfect balance of sweetness and mild heat. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',19.99,null,'medium'::public.spice_level,13,array['side-selection']::text[]
union all
  select 'sweet-chilli-fried-shrimp-med',(select id from public.menu_categories where slug='seafood'),'Sweet Chilli Fried Shrimp - MED','Crispy fried shrimp tossed in our sweet chili sauce, delivering the perfect balance of sweetness and mild heat. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',16.99,null,'medium'::public.spice_level,14,array['side-selection']::text[]
union all
  select 'sweet-chilli-fried-shrimp-sm',(select id from public.menu_categories where slug='seafood'),'Sweet Chilli Fried Shrimp - SM','Crispy fried shrimp tossed in our sweet chili sauce, delivering the perfect balance of sweetness and mild heat. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices.',12.99,null,'medium'::public.spice_level,15,array['side-selection']::text[]
union all
  select 'half-lb-pepper-steak',(select id from public.menu_categories where slug='steak'),'1/2 lb. Pepper Steak','Tender beef strips with vibrant bell peppers in a savory sauce.',11.29,null,'medium'::public.spice_level,1,'{}'::text[]
union all
  select '1-lb-pepper-steak',(select id from public.menu_categories where slug='steak'),'1 lb. Pepper Steak','Tender beef strips with vibrant bell peppers in a savory sauce.',16.99,null,'medium'::public.spice_level,2,'{}'::text[]
union all
  select 'pepper-steak-lg',(select id from public.menu_categories where slug='steak'),'Pepper Steak - LG','Tender steak strips sautéed with onions and peppers in a savory sauce, seasoned with our Jamaican blend for a bold, satisfying taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',21.99,null,'medium'::public.spice_level,3,array['side-selection']::text[]
union all
  select 'pepper-steak-med',(select id from public.menu_categories where slug='steak'),'Pepper Steak - MED','Tender steak strips sautéed with onions and peppers in a savory sauce, seasoned with our Jamaican blend for a bold, satisfying taste. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',17.99,null,'medium'::public.spice_level,4,array['side-selection']::text[]
union all
  select 'half-lb-curry-chickpeas',(select id from public.menu_categories where slug='vegetarian-meals'),'1/2 lb. Curry Chickpeas','Tender chickpeas simmered in a fragrant curry sauce with herbs and spices—hearty, vegan-friendly, and packed with bold Jamaican flavor.',5.0,null,'medium'::public.spice_level,1,'{}'::text[]
union all
  select '1-lb-curry-chickpeas',(select id from public.menu_categories where slug='vegetarian-meals'),'1 lb. Curry Chickpeas','Tender chickpeas simmered in a fragrant curry sauce with herbs and spices—hearty, vegan-friendly, and packed with bold Jamaican flavor.',8.0,null,'medium'::public.spice_level,2,'{}'::text[]
union all
  select 'curried-chick-peas-lg',(select id from public.menu_categories where slug='vegetarian-meals'),'Curried Chick Peas - LG','Tender chickpeas simmered in coconut curry with pumpkin, carrots, potatoes, butter beans, onions, and peppers for a hearty island classic. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',14.49,null,'medium'::public.spice_level,3,array['side-selection','add-veg-patty']::text[]
union all
  select 'curried-chick-peas-med',(select id from public.menu_categories where slug='vegetarian-meals'),'Curried Chick Peas - MED','Tender chickpeas simmered in coconut curry with pumpkin, carrots, potatoes, butter beans, onions, and peppers for a hearty island classic. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',12.29,null,'medium'::public.spice_level,4,array['side-selection','add-veg-patty']::text[]
union all
  select 'curried-chick-peas-sm',(select id from public.menu_categories where slug='vegetarian-meals'),'Curried Chick Peas - SM','Tender chickpeas simmered in coconut curry with pumpkin, carrots, potatoes, butter beans, onions, and peppers for a hearty island classic. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',10.29,null,'medium'::public.spice_level,5,array['side-selection','add-veg-patty']::text[]
union all
  select 'rice-peas-cabbage-lg',(select id from public.menu_categories where slug='vegetarian-meals'),'Rice & Peas & CABBAGE - LG','Perfectly seasoned rice & peas served with fresh steamed cabbage and carrots, lightly tossed in island herbs and spices for a classic Jamaican side',10.99,null,'mild'::public.spice_level,6,array['add-veg-patty']::text[]
union all
  select 'rice-peas-cabbage-med',(select id from public.menu_categories where slug='vegetarian-meals'),'Rice & Peas & Cabbage - MED','Perfectly seasoned rice & peas served with fresh steamed cabbage and carrots, lightly tossed in island herbs and spices for a classic Jamaican side',8.49,null,'mild'::public.spice_level,7,array['add-veg-patty']::text[]
union all
  select 'rice-peas-cabbage-sm',(select id from public.menu_categories where slug='vegetarian-meals'),'Rice & Peas & CABBAGE - SM','Perfectly seasoned rice & peas served with fresh steamed cabbage and carrots, lightly tossed in island herbs and spices for a classic Jamaican side',6.99,null,'mild'::public.spice_level,8,array['add-veg-patty']::text[]
union all
  select 'rice-peas-lg',(select id from public.menu_categories where slug='vegetarian-meals'),'Rice & Peas - LG','Our signature Jamaican rice & peas, simmered in coconut milk with thyme, Scallion, and traditional island spices for a rich, aromatic flavor.',8.99,null,'mild'::public.spice_level,9,array['add-veg-patty']::text[]
union all
  select 'rice-peas-med',(select id from public.menu_categories where slug='vegetarian-meals'),'Rice & Peas - MED','Our signature Jamaican rice & peas, simmered in coconut milk with thyme, Scallion, and traditional island spices for a rich, aromatic flavor.',6.99,null,'mild'::public.spice_level,10,array['add-veg-patty']::text[]
union all
  select 'rice-peas-sm',(select id from public.menu_categories where slug='vegetarian-meals'),'Rice & Peas - SM','Our signature Jamaican rice & peas, simmered in coconut milk with thyme, Scallion, and traditional island spices for a rich, aromatic flavor.',5.49,null,'mild'::public.spice_level,11,array['add-veg-patty']::text[]
union all
  select 'steamed-cabbage-sm',(select id from public.menu_categories where slug='vegetarian-meals'),'Steamed CABBAGE - SM','Fresh cabbage and carrots lightly steamed and seasoned with island herbs and spices for a simple, flavorful Jamaican side.',5.49,null,'mild'::public.spice_level,12,array['add-veg-patty']::text[]
union all
  select 'steamed-cabbage-lg',(select id from public.menu_categories where slug='vegetarian-meals'),'Steamed CABBAGE - LG','Fresh cabbage and carrots lightly steamed and seasoned with island herbs and spices for a simple, flavorful Jamaican side.',8.99,null,'mild'::public.spice_level,13,array['add-veg-patty']::text[]
union all
  select 'steamed-cabbage-med',(select id from public.menu_categories where slug='vegetarian-meals'),'Steamed CABBAGE - MED','Fresh cabbage and carrots lightly steamed and seasoned with island herbs and spices for a simple, flavorful Jamaican side.',6.99,null,'mild'::public.spice_level,14,array['add-veg-patty']::text[]
union all
  select 'sweet-sour-tofu-lg',(select id from public.menu_categories where slug='vegetarian-meals'),'Sweet + Sour Tofu - LG','Crispy golden tofu tossed in a sweet & sour pineapple glaze with sautéed onions and green peppers for a bold, balanced Jamaican flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',14.49,null,'mild'::public.spice_level,15,array['side-selection','add-veg-patty']::text[]
union all
  select 'sweet-sour-tofu-med',(select id from public.menu_categories where slug='vegetarian-meals'),'Sweet + Sour Tofu - MED','Crispy golden tofu tossed in a sweet & sour pineapple glaze with sautéed onions and green peppers for a bold, balanced Jamaican flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',12.29,null,'mild'::public.spice_level,16,array['side-selection','add-veg-patty']::text[]
union all
  select 'sweet-sour-tofu-sm',(select id from public.menu_categories where slug='vegetarian-meals'),'Sweet + Sour Tofu - SM','Crispy golden tofu tossed in a sweet & sour pineapple glaze with sautéed onions and green peppers for a bold, balanced Jamaican flavor. Served with seasoned rice & peas and fresh steamed cabbage with carrots, lightly tossed in island herbs and spices',10.29,null,'mild'::public.spice_level,17,array['side-selection','add-veg-patty']::text[]
union all
  select 'white-rice-cabbage-lg',(select id from public.menu_categories where slug='vegetarian-meals'),'White Rice & Cabbage - LG','Fluffy white rice served with our lightly steamed cabbage and carrots, seasoned with simple island herbs and spices for a clean, comforting classic.',10.99,null,'mild'::public.spice_level,18,array['add-veg-patty']::text[]
union all
  select 'white-rice-cabbage-med',(select id from public.menu_categories where slug='vegetarian-meals'),'White Rice & CABBAGE - MED','Fluffy white rice served with our lightly steamed cabbage and carrots, seasoned with simple island herbs and spices for a clean, comforting classic.',8.49,null,'mild'::public.spice_level,19,array['add-veg-patty']::text[]
union all
  select 'white-rice-cabbage-sm',(select id from public.menu_categories where slug='vegetarian-meals'),'White Rice & Cabbage - SM','Fluffy white rice served with our lightly steamed cabbage and carrots, seasoned with simple island herbs and spices for a clean, comforting classic.',6.99,null,'mild'::public.spice_level,20,array['add-veg-patty']::text[]
union all
  select 'white-rice-lg',(select id from public.menu_categories where slug='vegetarian-meals'),'White Rice - LG','Perfectly steamed white rice with a light, fluffy texture—simple, satisfying, and the perfect complement to any meal.',8.99,null,'mild'::public.spice_level,21,array['add-veg-patty']::text[]
union all
  select 'white-rice-med',(select id from public.menu_categories where slug='vegetarian-meals'),'White Rice - MED','Perfectly steamed white rice with a light, fluffy texture—simple, satisfying, and the perfect complement to any meal.',6.99,null,'mild'::public.spice_level,22,array['add-veg-patty']::text[]
union all
  select 'white-rice-sm',(select id from public.menu_categories where slug='vegetarian-meals'),'White Rice - SM','Perfectly steamed white rice with a light, fluffy texture—simple, satisfying, and the perfect complement to any meal.',5.49,null,'mild'::public.spice_level,23,array['add-veg-patty']::text[]
union all
  select 'beef-patty-mild',(select id from public.menu_categories where slug='patties'),'Beef Patty Mild','Flaky crust filled with perfectly seasoned ground beef—savory, juicy, and packed with flavor without the heat.',3.9,null,'mild'::public.spice_level,1,array['dipping-sauce']::text[]
union all
  select 'beef-patty-spicy',(select id from public.menu_categories where slug='patties'),'Beef Patty Spicy','Bold and fiery ground beef wrapped in a flaky crust—packed with island spices for a delicious kick in every bite.',3.9,null,'hot'::public.spice_level,2,array['dipping-sauce']::text[]
union all
  select 'cheesy-beef-mild',(select id from public.menu_categories where slug='patties'),'Cheesy Beef Mild','Flaky crust filled with gently seasoned ground beef and melted cheese—smooth, savory, and perfect for those who like rich flavor without the heat.',4.49,null,'mild'::public.spice_level,3,array['dipping-sauce']::text[]
union all
  select 'cheesy-beef-spicy',(select id from public.menu_categories where slug='patties'),'Cheesy Beef Spicy','Flaky crust filled with gently seasoned ground beef and melted cheese—smooth, savory, and perfect for those who like rich flavor without the heat.',4.49,null,'hot'::public.spice_level,4,array['dipping-sauce']::text[]
union all
  select 'chicken-patty',(select id from public.menu_categories where slug='patties'),'Chicken Patty','Tender curry-spiced chicken wrapped in a flaky crust—bold, aromatic, and bursting with rich Jamaican flavor in every bite.',3.9,null,'medium'::public.spice_level,5,array['dipping-sauce','add-cheese']::text[]
union all
  select 'coco-bread',(select id from public.menu_categories where slug='patties'),'Coco Bread','Soft, slightly sweet, and buttery—this delightful Jamaican bread is perfect on its own or wrapped around a patty for the ultimate bite.',2.6,null,'mild'::public.spice_level,6,'{}'::text[]
union all
  select 'coco-bread-n-cheese',(select id from public.menu_categories where slug='patties'),'Coco Bread N Cheese','Warm, fluffy coco bread layered with thick slices of creamy cheese—a soft, savory-sweet combo that melts in your mouth with every bite.',3.69,null,'mild'::public.spice_level,7,'{}'::text[]
union all
  select 'jerk-patty',(select id from public.menu_categories where slug='patties'),'Jerk Patty','Flaky, golden pastry filled with tender chicken seasoned in our signature Jamaican jerk blend—featuring bold spices, smoky heat, and a hint of island sweetness. Baked to perfection for a crisp, buttery crust and a juicy, flavorful center',3.9,null,'hot'::public.spice_level,8,array['dipping-sauce','add-cheese']::text[]
union all
  select 'spinach-patty-vegetarian',(select id from public.menu_categories where slug='patties'),'Spinach Patty - Vegetarian','Flaky crust filled with seasoned spinach and aromatic herbs—savory, wholesome, and bursting with vibrant island flavor in every bite.',3.9,null,'mild'::public.spice_level,9,array['dipping-sauce','add-cheese']::text[]
union all
  select 'veggie-patty',(select id from public.menu_categories where slug='patties'),'Veggie Patty','A flaky crust filled with seasoned vegetables and aromatic herbs—wholesome, savory, and packed with plant-powered island flavor in every bite.',3.9,null,'mild'::public.spice_level,10,array['dipping-sauce','add-cheese']::text[]
union all
  select 'coleslaw',(select id from public.menu_categories where slug='side-orders'),'Coleslaw','Crisp cabbage and carrots tossed in a creamy, tangy dressing—cool, refreshing, and the perfect side to balance bold island flavors.',4.49,null,'mild'::public.spice_level,1,'{}'::text[]
union all
  select 'cup-sauce',(select id from public.menu_categories where slug='side-orders'),'Cup Sauce','A bold, smoky blend of scotch bonnet peppers, herbs, and spices. Perfect for dipping, marinating, or adding heat to any dish.',3.0,null,'hot'::public.spice_level,2,'{}'::text[]
union all
  select 'fries',(select id from public.menu_categories where slug='side-orders'),'Fries','Crispy, golden, and perfectly salted—classic fries that make the perfect sidekick to any meal.',4.49,null,'mild'::public.spice_level,3,array['fries-sauce-choice']::text[]
union all
  select 'jerk-chicken-mac-n-cheese',(select id from public.menu_categories where slug='side-orders'),'Jerk Chicken Mac N Cheese','Creamy, cheesy macaroni with a bold twist—blended with spicy jerk seasoning for a smoky, flavorful kick in every bite.',10.99,null,'hot'::public.spice_level,4,'{}'::text[]
union all
  select 'jk-jerk-sauce',(select id from public.menu_categories where slug='side-orders'),'Jk Jerk Sauce','A bold, smoky blend of scotch bonnet peppers, herbs, and spices. Perfect for dipping, marinating, or adding heat to any dish.',4.0,null,'hot'::public.spice_level,5,'{}'::text[]
union all
  select 'sweet-plantains-3',(select id from public.menu_categories where slug='side-orders'),'Sweet Plantains 3','Ripe plantains sliced and caramelized to golden perfection—soft, sweet, and bursting with rich, tropical flavor in every bite.',2.0,null,'mild'::public.spice_level,6,'{}'::text[]
union all
  select 'sweet-plantains-6',(select id from public.menu_categories where slug='side-orders'),'Sweet Plantains 6','Ripe plantains sliced and caramelized to golden perfection—soft, sweet, and bursting with rich, tropical flavor in every bite.',3.99,null,'mild'::public.spice_level,7,'{}'::text[]
union all
  select 'crispy-chicken-sandwich',(select id from public.menu_categories where slug='sandwiches-wraps'),'Crispy Chicken Sandwich','Crispy, golden-fried chicken served on soft Jamaican coco bread with fresh lettuce, tomato, and creamy mayo for a satisfying, flavorful bite.',10.99,null,'mild'::public.spice_level,1,'{}'::text[]
union all
  select 'extra-cheese',(select id from public.menu_categories where slug='sandwiches-wraps'),'Extra cheese','Rich, bold, and unmistakably Jamaican—this firm, flavorful cheddar-style cheese is perfect with hard dough bread or tucked into a warm patty.',1.0,null,'mild'::public.spice_level,2,'{}'::text[]
union all
  select 'fish-chips',(select id from public.menu_categories where slug='sandwiches-wraps'),'Fish + Chips','crispy, golden-fried fish served with thick-cut fries—hot, hearty, and perfectly seasoned for a satisfying island-style take on a classic favorite.',13.59,null,'mild'::public.spice_level,3,array['choose-your-sauce']::text[]
union all
  select 'fish-sandwich',(select id from public.menu_categories where slug='sandwiches-wraps'),'Fish Sandwich','Crispy fried fish served on soft, buttery coco bread with melted cheese and tangy tartar sauce—simple, rich, and bursting with island comfort.',11.49,null,'mild'::public.spice_level,4,array['sandwich-toppings']::text[]
union all
  select 'jerk-chicken-sandwich',(select id from public.menu_categories where slug='sandwiches-wraps'),'Jerk Chicken Sandwich','Spicy, smoky jerk chicken stacked on soft, buttery coco bread with creamy coleslaw and zesty chipotle mayo—bold, juicy, and packed with island heat and flavor.',10.99,null,'hot'::public.spice_level,5,array['sandwich-toppings','sandwich-add-ons']::text[]
union all
  select 'jerk-pork-sandwich',(select id from public.menu_categories where slug='sandwiches-wraps'),'Jerk Pork Sandwich','Savory minced jerk pork piled high on soft, buttery coco bread with a drizzle of smoky chipotle mayo—spicy, juicy, and bursting with island flavor in every bite.',10.99,null,'hot'::public.spice_level,6,array['sandwich-toppings','sandwich-add-ons']::text[]
union all
  select 'ackee-saltfish-med',(select id from public.menu_categories where slug='breakfast'),'Ackee & Saltfish - MED','Creamy ackee gently sautéed with tender flaked saltfish, onions, peppers, and aromatic herbs—savory, comforting, and Jamaica''s beloved national dish. Served in a medium container.',16.99,null,'mild'::public.spice_level,1,array['breakfast-side-selection']::text[]
union all
  select 'callaloo-salt-fish-med',(select id from public.menu_categories where slug='breakfast'),'Callaloo & Salt Fish - MED','Tender callaloo leaves sautéed with flaky saltfish, garlic, onions, and a hint of thyme—hearty, savory, and brimming with authentic island flavor, served in a medium container for a satisfying portion.',12.99,null,'mild'::public.spice_level,2,array['breakfast-side-selection']::text[]
union all
  select 'carrot-dumpling-3',(select id from public.menu_categories where slug='breakfast'),'Carrot Dumpling 3','Crispy on the outside, soft on the inside—these golden dumplings are made with grated carrot for sweetness in every bite.',4.49,null,'mild'::public.spice_level,3,'{}'::text[]
union all
  select 'festival-3',(select id from public.menu_categories where slug='breakfast'),'Festival 3','Golden, crispy on the outside and soft on the inside—these sweet, doughy Jamaican fried festivals are the perfect companion to jerk meats, fried fish, or just enjoyed on their own. Island comfort in every bite.',4.49,null,'hot'::public.spice_level,4,'{}'::text[]
union all
  select 'porridge-lg',(select id from public.menu_categories where slug='breakfast'),'Porridge - LG','A smooth, creamy Jamaican breakfast porridge made with fine cornmeal, warm spices, and a touch of sweetness. A comforting island favorite served hot.',10.89,null,'mild'::public.spice_level,5,'{}'::text[]
union all
  select 'sm-porridge',(select id from public.menu_categories where slug='breakfast'),'Sm Porridge','A smooth, creamy Jamaican breakfast porridge made with fine cornmeal, warm spices, and a touch of sweetness. A comforting island favorite served hot.',8.0,null,'mild'::public.spice_level,6,'{}'::text[]
union all
  select 'side-callaloo-salt-fish',(select id from public.menu_categories where slug='breakfast'),'Side - Callaloo & Salt Fish','Tender callaloo leaves sautéed with flaky saltfish, garlic, onions, and a hint of thyme—hearty, savory, and brimming with authentic island flavor.',7.0,null,'mild'::public.spice_level,7,'{}'::text[]
union all
  select 'large-soup',(select id from public.menu_categories where slug='soups'),'Large Soup','Simmered with tender chicken, green banana and white yam, hearty vegetables, and soft dumplings—comforting, flavorful, and packed with island goodness.',10.89,null,'mild'::public.spice_level,1,'{}'::text[]
union all
  select 'small-soup',(select id from public.menu_categories where slug='soups'),'Small Soup','Simmered with tender chicken, green banana and white yam, hearty vegetables, and soft dumplings—comforting, flavorful, and packed with island goodness.',8.0,null,'mild'::public.spice_level,2,'{}'::text[]
union all
  select 'bottled-drink',(select id from public.menu_categories where slug='drinks'),'Bottled Drink','Chilled and fizzy favorites straight from the U.S.—including Coke, Sprite, Gatorade, Snapple, and more. Classic, refreshing, and perfect with any meal.',3.2,null,'mild'::public.spice_level,1,array['drink-choice']::text[]
union all
  select 'd-g',(select id from public.menu_categories where slug='drinks'),'D&G','Bursting with bold Caribbean flavor, these classic Jamaican sodas—like Kola Champagne, Pineapple, and Ginger Beer—bring sweet, fizzy refreshment in every sip.',3.6,null,'medium'::public.spice_level,2,array['d-g-flavor-choice']::text[]
union all
  select 'grace-bottled-juice',(select id from public.menu_categories where slug='drinks'),'Grace Bottled Juice','Smooth, refreshing tropical juices—bursting with real fruit flavor in every sip. It''s pure island goodness in a bottle.',3.6,null,'mild'::public.spice_level,3,array['grace-flavor-choice']::text[]
union all
  select 'irish-moss',(select id from public.menu_categories where slug='drinks'),'Irish Moss','A thick, creamy Jamaican drink made with sea moss, milk, spices, and a touch of sweetness—smooth, energizing, and packed with traditional island goodness.',3.6,null,'mild'::public.spice_level,4,'{}'::text[]
union all
  select 'lemonade-16oz',(select id from public.menu_categories where slug='drinks'),'Lemonade 16oz','Refreshing, tangy, cool, crisp and perfectly balanced for a bright island-style thirst quencher.',2.6,null,'mild'::public.spice_level,5,'{}'::text[]
union all
  select 'mango-punch-16oz',(select id from public.menu_categories where slug='drinks'),'Mango Punch 16oz','Vibrant mango bliss—smooth, sweet, and bursting with sunny island flavor in every sip.',3.99,null,'mild'::public.spice_level,6,'{}'::text[]
union all
  select 'sorrel-16oz',(select id from public.menu_categories where slug='drinks'),'Sorrel 16oz','Bright, tangy hibiscus tea steeped with ginger, cinnamon, and cloves—refreshing, vividly colored, and bursting with festive island spice.',4.2,null,'medium'::public.spice_level,7,'{}'::text[]
union all
  select 'sorrel-gallon',(select id from public.menu_categories where slug='drinks'),'Sorrel Gallon','Bright, tangy hibiscus tea steeped with ginger, cinnamon, and cloves—refreshing, vividly colored, and bursting with festive island spice.',30.0,null,'medium'::public.spice_level,8,'{}'::text[]
union all
  select 'supligen',(select id from public.menu_categories where slug='drinks'),'Supligen','Creamy, nutrient-packed malt drink fortified with vitamins and minerals—rich, smooth, and energizing for a wholesome island-style boost.',3.6,null,'mild'::public.spice_level,9,array['supligen-flavor']::text[]
union all
  select 'ting',(select id from public.menu_categories where slug='drinks'),'Ting','Bright, bubbly, and bursting with real Jamaican grapefruit flavor—Ting is a crisp, tangy soda with just the right balance of sweet and citrusy zing. Refreshing and bold, it''s the island''s iconic drink in a bottle.',3.6,null,'mild'::public.spice_level,10,'{}'::text[]
union all
  select 'water',(select id from public.menu_categories where slug='drinks'),'Water','Cool Refreshing Poland Spring Water.',2.0,null,'mild'::public.spice_level,11,'{}'::text[]
union all
  select 'half-cheese',(select id from public.menu_categories where slug='desserts'),'1/2 Cheese','Rich, bold, and unmistakably Jamaican—this firm, flavorful cheddar-style cheese is perfect with hard dough bread or tucked into a warm patty.',16.5,null,'mild'::public.spice_level,1,'{}'::text[]
union all
  select '1-4-cheese',(select id from public.menu_categories where slug='desserts'),'1/4 Cheese','Rich, bold, and unmistakably Jamaican—this firm, flavorful cheddar-style cheese is perfect with hard dough bread or tucked into a warm patty.',10.5,null,'mild'::public.spice_level,2,'{}'::text[]
union all
  select 'bun-cheese',(select id from public.menu_categories where slug='desserts'),'Bun + Cheese','Spiced bun with raisins paired with a slice of cheddar cheese.',4.49,null,'mild'::public.spice_level,3,'{}'::text[]
union all
  select 'carrot-cake',(select id from public.menu_categories where slug='desserts'),'Carrot Cake','Moist and warmly spiced, this classic carrot cake is packed with fresh grated carrots and rich flavor in every bite—simple, sweet, and satisfying.',3.99,null,'mild'::public.spice_level,4,'{}'::text[]
union all
  select 'cheese-slice',(select id from public.menu_categories where slug='desserts'),'Cheese Slice','Rich, bold, and unmistakably Jamaican—this firm, flavorful cheddar-style cheese is perfect with hard dough bread or tucked into a warm patty.',2.49,null,'mild'::public.spice_level,5,'{}'::text[]
union all
  select 'rum-cake',(select id from public.menu_categories where slug='desserts'),'Rum Cake','Moist, buttery sponge soaked in rich Caribbean rum and finished with a glossy caramel glaze—decadent, boozy, and utterly irresistible.',4.29,null,'mild'::public.spice_level,6,'{}'::text[]
union all
  select '100-blue-mountain-coffee-4oz',(select id from public.menu_categories where slug='gift-shop'),'100% Blue Mountain Coffee 4oz','Enjoy a premium 4-oz pack of authentic Blue Mountain coffee — smooth, bold, and perfect for gifting or savoring at home.',14.99,null,'mild'::public.spice_level,1,'{}'::text[]
union all
  select 'cd',(select id from public.menu_categories where slug='gift-shop'),'CD','Founder, Owner, and Operator Phorein expresses his journey through the sweet sounds of reggae music.',10.0,null,'mild'::public.spice_level,2,'{}'::text[]
on conflict (slug) do update set
  category_id=excluded.category_id, name=excluded.name, description=excluded.description,
  base_price=excluded.base_price, spice_level=excluded.spice_level,
  sort_order=excluded.sort_order, modifier_groups=excluded.modifier_groups, available=true;
-- NOTE: image is NOT overwritten on conflict -- re-running this migration must never
-- clobber a photo that's since been uploaded through the admin.

-- Hide legacy starter items/categories not in the new menu (keep rows for order-history FKs).
update public.menu_items set available=false where slug not in ('half-lb-curried-chicken','half-lb-jerk-chicken','half-lb-stew-chicken','1-lb-curried-chicken','1-lb-jerk-chicken','1-lb-stew-chicken','boneless-curry-chicken-lg','boneless-curry-chicken-med','boneless-curry-chicken-sm','boneless-honey-bbq-chicken-lg','boneless-honey-bbq-chicken-med','boneless-honey-bbq-chicken-sm','boneless-stew-chicken-lg','boneless-stew-chicken-med','boneless-stew-chicken-sm','curry-chicken-lg','curry-chicken-med','curry-chicken-sm','fried-chicken-12-pieces','fried-chicken-3-pieces','fried-chicken-6-pieces','fried-chicken-lg','fried-chicken-med','fried-chicken-sm','jamaican-wings-lg','jamaican-wings-med','jamaican-wings-sm','jerk-chicken-lg','jerk-chicken-med','jerk-chicken-sm','stew-chicken-lg','stew-chicken-med','stew-chicken-sm','3-wings','wings-12-by-the-dozen','wings-6','half-lb-oxtail','1-lb-oxtail','oxtail-lg','oxtail-med','half-lb-curry-goat','1-lb-curry-goat','curry-goat-med','curry-goat-lg','half-lb-jerk-pork','1-lb-jerk-pork','jerk-pork-lg','jerk-pork-med','jerk-pork-sm','brown-stew-red-snapper-fish-three-quarter-1lbs','escovitch-red-snapper-fish-three-quarter-1-lb','steamed-red-snapper-fish-three-quarter-1lbs','brown-stew-shrimp-lg','brown-stew-shrimp-med','brown-stew-shrimp-sm','curried-shrimp-sm','curry-shrimp-lg','curry-shrimp-med','jerk-shrimp-lg','jerk-shrimp-med','jerk-shrimp-sm','sweet-chilli-fried-shrimp-lg','sweet-chilli-fried-shrimp-med','sweet-chilli-fried-shrimp-sm','half-lb-pepper-steak','1-lb-pepper-steak','pepper-steak-lg','pepper-steak-med','half-lb-curry-chickpeas','1-lb-curry-chickpeas','curried-chick-peas-lg','curried-chick-peas-med','curried-chick-peas-sm','rice-peas-cabbage-lg','rice-peas-cabbage-med','rice-peas-cabbage-sm','rice-peas-lg','rice-peas-med','rice-peas-sm','steamed-cabbage-sm','steamed-cabbage-lg','steamed-cabbage-med','sweet-sour-tofu-lg','sweet-sour-tofu-med','sweet-sour-tofu-sm','white-rice-cabbage-lg','white-rice-cabbage-med','white-rice-cabbage-sm','white-rice-lg','white-rice-med','white-rice-sm','beef-patty-mild','beef-patty-spicy','cheesy-beef-mild','cheesy-beef-spicy','chicken-patty','coco-bread','coco-bread-n-cheese','jerk-patty','spinach-patty-vegetarian','veggie-patty','coleslaw','cup-sauce','fries','jerk-chicken-mac-n-cheese','jk-jerk-sauce','sweet-plantains-3','sweet-plantains-6','crispy-chicken-sandwich','extra-cheese','fish-chips','fish-sandwich','jerk-chicken-sandwich','jerk-pork-sandwich','ackee-saltfish-med','callaloo-salt-fish-med','carrot-dumpling-3','festival-3','porridge-lg','sm-porridge','side-callaloo-salt-fish','large-soup','small-soup','bottled-drink','d-g','grace-bottled-juice','irish-moss','lemonade-16oz','mango-punch-16oz','sorrel-16oz','sorrel-gallon','supligen','ting','water','half-cheese','1-4-cheese','bun-cheese','carrot-cake','cheese-slice','rum-cake','100-blue-mountain-coffee-4oz','cd');
update public.menu_categories set active=false where slug not in ('chicken','oxtails','goat-curry','pork','seafood','steak','vegetarian-meals','patties','side-orders','sandwiches-wraps','breakfast','soups','drinks','desserts','gift-shop');
update public.menu_categories set active=true where slug in ('chicken','oxtails','goat-curry','pork','seafood','steak','vegetarian-meals','patties','side-orders','sandwiches-wraps','breakfast','soups','drinks','desserts','gift-shop');

commit;
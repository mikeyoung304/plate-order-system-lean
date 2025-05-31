-- Create daily specials system
-- This migration adds support for managing daily specials with meal periods

-- Create daily_specials table
create table public.daily_specials (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text not null,
  meal_period text not null check (meal_period in ('breakfast', 'lunch', 'dinner', 'all_day')),
  price decimal(10,2),
  ingredients text[] default '{}',
  dietary_tags text[] default '{}', -- vegetarian, vegan, gluten-free, etc.
  is_active boolean default true,
  available_date date not null default current_date,
  start_time time,
  end_time time,
  max_orders integer, -- optional limit on number of orders
  current_orders integer default 0,
  image_url text,
  preparation_time_minutes integer default 20,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id) on delete set null
);

-- Add RLS policies
alter table public.daily_specials enable row level security;

-- Allow all authenticated users to read daily specials
create policy "Daily specials are viewable by authenticated users" on public.daily_specials
  for select using (auth.role() = 'authenticated');

-- Allow admins to manage daily specials
create policy "Admins can manage daily specials" on public.daily_specials
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger handle_daily_specials_updated_at
  before update on public.daily_specials
  for each row execute function public.handle_updated_at();

-- Create function to get current specials for a meal period
create or replace function public.get_current_specials(meal_period_filter text default null)
returns table (
  id uuid,
  name text,
  description text,
  meal_period text,
  price decimal(10,2),
  ingredients text[],
  dietary_tags text[],
  image_url text,
  preparation_time_minutes integer,
  is_available boolean,
  orders_remaining integer
) as $$
begin
  return query
  select 
    ds.id,
    ds.name,
    ds.description,
    ds.meal_period,
    ds.price,
    ds.ingredients,
    ds.dietary_tags,
    ds.image_url,
    ds.preparation_time_minutes,
    case 
      when ds.is_active = false then false
      when ds.available_date != current_date then false
      when ds.start_time is not null and current_time < ds.start_time then false
      when ds.end_time is not null and current_time > ds.end_time then false
      when ds.max_orders is not null and ds.current_orders >= ds.max_orders then false
      else true
    end as is_available,
    case 
      when ds.max_orders is null then null
      else greatest(0, ds.max_orders - ds.current_orders)
    end as orders_remaining
  from public.daily_specials ds
  where ds.available_date = current_date
    and ds.is_active = true
    and (meal_period_filter is null or ds.meal_period = meal_period_filter or ds.meal_period = 'all_day')
  order by 
    case ds.meal_period 
      when 'breakfast' then 1
      when 'lunch' then 2
      when 'dinner' then 3
      when 'all_day' then 4
    end,
    ds.name;
end;
$$ language plpgsql security definer;

-- Create function to increment order count
create or replace function public.increment_special_orders(special_id uuid)
returns void as $$
begin
  update public.daily_specials
  set current_orders = current_orders + 1,
      updated_at = timezone('utc'::text, now())
  where id = special_id;
end;
$$ language plpgsql security definer;

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant select on public.daily_specials to anon, authenticated;
grant execute on function public.get_current_specials(text) to anon, authenticated;
grant execute on function public.increment_special_orders(uuid) to authenticated;

-- Insert some sample daily specials
insert into public.daily_specials (name, description, meal_period, price, ingredients, dietary_tags, preparation_time_minutes) values
  ('Farm Fresh Pancakes', 'Fluffy pancakes with fresh berries and maple syrup', 'breakfast', 12.99, array['pancakes', 'berries', 'maple syrup'], array['vegetarian'], 15),
  ('Avocado Toast Deluxe', 'Multigrain toast with smashed avocado, poached egg, and everything seasoning', 'breakfast', 14.99, array['avocado', 'egg', 'multigrain bread'], array['vegetarian'], 10),
  ('Herb-Crusted Salmon', 'Atlantic salmon with herb crust, roasted vegetables, and lemon butter', 'dinner', 26.99, array['salmon', 'herbs', 'vegetables'], array['gluten-free'], 25),
  ('Tuscan Chicken Pasta', 'Grilled chicken with sun-dried tomatoes, spinach, and creamy garlic sauce', 'lunch', 18.99, array['chicken', 'pasta', 'sun-dried tomatoes', 'spinach'], array[], 20),
  ('Quinoa Power Bowl', 'Quinoa with roasted vegetables, chickpeas, and tahini dressing', 'all_day', 16.99, array['quinoa', 'vegetables', 'chickpeas'], array['vegan', 'gluten-free'], 15);

-- Update the orders table to track special orders
alter table public.orders add column special_id uuid references public.daily_specials(id) on delete set null;

-- Create index for better performance
create index idx_daily_specials_date_active on public.daily_specials(available_date, is_active);
create index idx_daily_specials_meal_period on public.daily_specials(meal_period);
create index idx_orders_special_id on public.orders(special_id) where special_id is not null;

-- Add comment
comment on table public.daily_specials is 'Stores daily specials with meal periods, availability, and ordering limits';
insert into services (name, price, duration_minutes, is_active) values
  ('Haircut', 100, 20, true),
  ('Beard Trim', 50, 10, true),
  ('Shave', 60, 10, true),
  ('Hair Wash', 40, 10, true),
  ('Facial', 200, 30, true),
  ('Haircut + Beard Combo', 140, 30, true)
on conflict (name) do update set
  price = excluded.price,
  duration_minutes = excluded.duration_minutes,
  is_active = excluded.is_active;

insert into shop_settings (id, shop_name, contact_number, opening_time, closing_time, is_open, buffer_minutes)
values (gen_random_uuid(), 'Neighborhood Barber', '+91-98765-43210', '09:00', '21:00', true, 5)
on conflict do nothing;

insert into admin_users (email, role)
values ('barber@example.com', 'admin')
on conflict (email) do nothing;

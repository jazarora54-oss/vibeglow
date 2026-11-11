-- VEDAGLOW migration 9b: remove the OLD public copy of the ship-from address.
-- RUN ONLY AFTER: migration-9.sql is run, the new code is live, and Admin -> Settings still shows your ship-from address.
-- It only removes the 8 address keys from the PUBLIC settings row. The private copy stays in private_settings.
update public.site_settings set data = data - 'ship_name' - 'ship_company' - 'ship_street1' - 'ship_street2' - 'ship_city' - 'ship_state' - 'ship_zip' - 'ship_phone'
 where id = 1 and exists (select 1 from public.private_settings where id = 1 and data ? 'ship_street1');
insert into public.schema_migrations (version, note) values ('9b', 'ship-from address removed from public settings') on conflict (version) do nothing;

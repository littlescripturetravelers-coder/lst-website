-- Seeds the Lewis family. Link user_id for Levi and Lindy after they first sign in:
--   update family_members set user_id = '<auth uid>' where slug = 'levi';
with f as (insert into families (surname, anniversary) values ('Lewis', '2019-09-28') returning id)
insert into family_members (family_id, slug, name, full_name, role, sex, birthday, color)
select f.id, x.* from f, (values
  ('levi','Levi','Levi Lewis','dad','m','1986-10-21'::date,'#4F63A0'),
  ('lindy','Lindy','Lindy Frost','mom','f','1983-08-22'::date,'#B5536B'),
  ('mayble','Mayble','Mayble Lynn','daughter','f','2021-04-13'::date,'#D9823A'),
  ('esmay','Esmay','Esmay','daughter','f','2022-11-15'::date,'#2E8C94')) as x(slug,name,full_name,role,sex,birthday,color);
insert into reminder_lists (family_id, name, color, icon, sort)
select id, n, c, i, s from families, (values ('Family','brand','house',0),('Groceries','money','shopping-cart',1),('Date night','marriage','heart',2),('Our girls','girls','flower-2',3),('Home projects','home','hammer',4),('Health','health','stethoscope',5)) v(n,c,i,s)
where surname = 'Lewis';

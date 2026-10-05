create database booking_system;
use booking_system;

create table users (
id int auto_increment primary key,
name varchar(255) not null,
email varchar(255) unique not null,
password_hash int not null,
role enum('customer', 'providor', 'admin') default 'customer',
created_at timestamp default current_timestamp
);
create table resources(
id int auto_increment primary key,
name varchar(255) not null,
owner_id int,
capacity int not null,
duration_minutes int not null,
created_at timestamp default current_timestamp,
foreign key (owner_id) references users(id)
);

create table avaibility(
id int auto_increment primary key,
resource_id int,
day_of_week int not null,
specific_date int,
start_time timestamp not null,
end_time timestamp not null,
foreign key (resource_id) references resources(id)
);

create table bookings(
id int auto_increment primary key,
resource_id int,
user_id int,
start_time timestamp not null,
end_time timestamp not null,
foreign key (resource_id) references resources(id),
foreign key (user_id) references users(id)
);

alter table users modify password_hash varchar(255) not null;
alter table users modify role enum('customer', 'provider', 'admin') default 'customer';
rename table avaibility to availability;
alter table availability modify specific_date date;
alter table availability modify column start_time time not null,
modify end_time time not null;
alter table bookings add column status enum('pending', 'confirmed', 'cancelled');
alter table resources add column description varchar(255) after name;
alter table bookings modify column status enum('pending', 'confirmed', 'cancelled') default 'confirmed';
alter table resources add column is_active boolean default true;
select * from resources;
alter table resources modify column capacity int not null default 1;
ALTER TABLE availability MODIFY COLUMN day_of_week TINYINT NULL DEFAULT 0;
ALTER TABLE bookings
  ADD COLUMN specific_date DATE NOT NULL AFTER user_id,
  MODIFY start_time TIME NOT NULL,
  MODIFY end_time TIME NOT NULL;
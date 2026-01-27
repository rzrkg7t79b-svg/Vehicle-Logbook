-- MasterSIXT Database Backup for Neon
-- Run this in Neon SQL Editor

CREATE TABLE public.app_settings (
    id integer NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);
CREATE SEQUENCE public.app_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.app_settings_id_seq OWNED BY public.app_settings.id;
CREATE TABLE public.comments (
    id integer NOT NULL,
    vehicle_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    user_initials text
);
CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;
CREATE TABLE public.driver_tasks (
    id integer NOT NULL,
    quality_check_id integer NOT NULL,
    license_plate text NOT NULL,
    description text NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    completed_by text,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);
CREATE SEQUENCE public.driver_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.driver_tasks_id_seq OWNED BY public.driver_tasks.id;
CREATE TABLE public.flow_tasks (
    id integer NOT NULL,
    license_plate text NOT NULL,
    is_ev boolean DEFAULT false NOT NULL,
    task_type text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    completed_by text,
    completed_at timestamp without time zone,
    needs_retry boolean DEFAULT false NOT NULL,
    created_by text,
    created_at timestamp without time zone DEFAULT now(),
    need_at timestamp without time zone
);
CREATE SEQUENCE public.flow_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.flow_tasks_id_seq OWNED BY public.flow_tasks.id;
CREATE TABLE public.future_planning (
    id integer NOT NULL,
    date text NOT NULL,
    reservations_total integer NOT NULL,
    reservations_car integer NOT NULL,
    reservations_van integer NOT NULL,
    reservations_tas integer NOT NULL,
    deliveries_tomorrow integer NOT NULL,
    collections_open integer NOT NULL,
    saved_by text,
    saved_at timestamp without time zone DEFAULT now()
);
CREATE SEQUENCE public.future_planning_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.future_planning_id_seq OWNED BY public.future_planning.id;
CREATE TABLE public.kpi_metrics (
    id integer NOT NULL,
    key text NOT NULL,
    value real NOT NULL,
    goal real NOT NULL,
    updated_by text,
    updated_at timestamp without time zone DEFAULT now()
);
CREATE SEQUENCE public.kpi_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.kpi_metrics_id_seq OWNED BY public.kpi_metrics.id;
CREATE TABLE public.module_status (
    id integer NOT NULL,
    module_name text NOT NULL,
    is_done boolean DEFAULT false NOT NULL,
    done_at timestamp without time zone,
    done_by text,
    date text NOT NULL
);
CREATE SEQUENCE public.module_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.module_status_id_seq OWNED BY public.module_status.id;
CREATE TABLE public.quality_checks (
    id integer NOT NULL,
    license_plate text NOT NULL,
    passed boolean NOT NULL,
    comment text,
    checked_by text,
    created_at timestamp without time zone DEFAULT now(),
    is_ev boolean DEFAULT false NOT NULL
);
CREATE SEQUENCE public.quality_checks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.quality_checks_id_seq OWNED BY public.quality_checks.id;
CREATE TABLE public.timedriver_calculations (
    id integer NOT NULL,
    date text NOT NULL,
    rentals integer NOT NULL,
    budget_per_rental real NOT NULL,
    total_budget real NOT NULL,
    drivers_data text NOT NULL,
    calculated_by text,
    calculated_at timestamp without time zone DEFAULT now()
);
CREATE SEQUENCE public.timedriver_calculations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.timedriver_calculations_id_seq OWNED BY public.timedriver_calculations.id;
CREATE TABLE public.todos (
    id integer NOT NULL,
    title text NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    completed_by text,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    assigned_to text[] DEFAULT '{}'::text[] NOT NULL,
    vehicle_id integer,
    is_system_generated boolean DEFAULT false NOT NULL,
    postponed_to_date text,
    postpone_count integer DEFAULT 0 NOT NULL,
    is_recurring boolean DEFAULT true NOT NULL,
    priority integer DEFAULT 0 NOT NULL
);
CREATE SEQUENCE public.todos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.todos_id_seq OWNED BY public.todos.id;
CREATE TABLE public.upgrade_vehicles (
    id integer NOT NULL,
    license_plate text NOT NULL,
    model text NOT NULL,
    reason text NOT NULL,
    is_sold boolean DEFAULT false NOT NULL,
    sold_at timestamp without time zone,
    sold_by text,
    date text NOT NULL,
    created_by text,
    created_at timestamp without time zone DEFAULT now(),
    is_van boolean DEFAULT false NOT NULL
);
CREATE SEQUENCE public.upgrade_vehicles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.upgrade_vehicles_id_seq OWNED BY public.upgrade_vehicles.id;
CREATE TABLE public.users (
    id integer NOT NULL,
    initials text NOT NULL,
    pin text NOT NULL,
    roles text[] DEFAULT '{}'::text[] NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    max_daily_hours real,
    hourly_rate real
);
CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
CREATE TABLE public.vehicle_daily_comments (
    id integer NOT NULL,
    vehicle_id integer NOT NULL,
    date text NOT NULL,
    has_comment boolean DEFAULT false NOT NULL,
    comment_id integer
);
CREATE SEQUENCE public.vehicle_daily_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.vehicle_daily_comments_id_seq OWNED BY public.vehicle_daily_comments.id;
CREATE TABLE public.vehicles (
    id integer NOT NULL,
    license_plate text NOT NULL,
    name text,
    notes text,
    is_ev boolean DEFAULT false NOT NULL,
    countdown_start timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    ready_for_collection boolean DEFAULT false NOT NULL,
    collection_todo_id integer,
    is_past boolean DEFAULT false NOT NULL
);
CREATE SEQUENCE public.vehicles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.vehicles_id_seq OWNED BY public.vehicles.id;
ALTER TABLE ONLY public.app_settings ALTER COLUMN id SET DEFAULT nextval('public.app_settings_id_seq'::regclass);
ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);
ALTER TABLE ONLY public.driver_tasks ALTER COLUMN id SET DEFAULT nextval('public.driver_tasks_id_seq'::regclass);
ALTER TABLE ONLY public.flow_tasks ALTER COLUMN id SET DEFAULT nextval('public.flow_tasks_id_seq'::regclass);
ALTER TABLE ONLY public.future_planning ALTER COLUMN id SET DEFAULT nextval('public.future_planning_id_seq'::regclass);
ALTER TABLE ONLY public.kpi_metrics ALTER COLUMN id SET DEFAULT nextval('public.kpi_metrics_id_seq'::regclass);
ALTER TABLE ONLY public.module_status ALTER COLUMN id SET DEFAULT nextval('public.module_status_id_seq'::regclass);
ALTER TABLE ONLY public.quality_checks ALTER COLUMN id SET DEFAULT nextval('public.quality_checks_id_seq'::regclass);
ALTER TABLE ONLY public.timedriver_calculations ALTER COLUMN id SET DEFAULT nextval('public.timedriver_calculations_id_seq'::regclass);
ALTER TABLE ONLY public.todos ALTER COLUMN id SET DEFAULT nextval('public.todos_id_seq'::regclass);
ALTER TABLE ONLY public.upgrade_vehicles ALTER COLUMN id SET DEFAULT nextval('public.upgrade_vehicles_id_seq'::regclass);
ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);
ALTER TABLE ONLY public.vehicle_daily_comments ALTER COLUMN id SET DEFAULT nextval('public.vehicle_daily_comments_id_seq'::regclass);
ALTER TABLE ONLY public.vehicles ALTER COLUMN id SET DEFAULT nextval('public.vehicles_id_seq'::regclass);
ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_key_unique UNIQUE (key);
ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.driver_tasks
    ADD CONSTRAINT driver_tasks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.flow_tasks
    ADD CONSTRAINT flow_tasks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.future_planning
    ADD CONSTRAINT future_planning_date_unique UNIQUE (date);
ALTER TABLE ONLY public.future_planning
    ADD CONSTRAINT future_planning_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.kpi_metrics
    ADD CONSTRAINT kpi_metrics_key_unique UNIQUE (key);
ALTER TABLE ONLY public.kpi_metrics
    ADD CONSTRAINT kpi_metrics_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.module_status
    ADD CONSTRAINT module_status_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quality_checks
    ADD CONSTRAINT quality_checks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.timedriver_calculations
    ADD CONSTRAINT timedriver_calculations_date_unique UNIQUE (date);
ALTER TABLE ONLY public.timedriver_calculations
    ADD CONSTRAINT timedriver_calculations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.upgrade_vehicles
    ADD CONSTRAINT upgrade_vehicles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pin_unique UNIQUE (pin);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.vehicle_daily_comments
    ADD CONSTRAINT vehicle_daily_comments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_vehicle_id_vehicles_id_fk FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.driver_tasks
    ADD CONSTRAINT driver_tasks_quality_check_id_quality_checks_id_fk FOREIGN KEY (quality_check_id) REFERENCES public.quality_checks(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.vehicle_daily_comments
    ADD CONSTRAINT vehicle_daily_comments_vehicle_id_vehicles_id_fk FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;
\unrestrict jPcGboWfCAePdHRSo9l9rjCkRM4qd51HFmkWzfXNFLEOv2UFqDMkzvNpXuEhXkw

-- DATA
INSERT INTO public.vehicles VALUES (4, 'M-LM4623E', 'Audi A3 Hybrid', '', true, '2026-01-23 00:00:00', '2026-01-24 13:36:01.700295', true, 9, false);
INSERT INTO public.comments VALUES (5, 4, 'Auftrag geschrieben', '2026-01-24 13:36:26.950694', NULL);
INSERT INTO public.comments VALUES (6, 4, 'Hol und Bringservice beautragt', '2026-01-24 13:36:41.177476', NULL);
INSERT INTO public.comments VALUES (7, 4, 'Test comment from BM', '2026-01-24 16:50:20.500158', 'BM');
INSERT INTO public.comments VALUES (8, 4, 'Morgen fertig', '2026-01-24 20:11:25.251083', 'BM');
INSERT INTO public.comments VALUES (9, 4, 'Daily check completed', '2026-01-24 20:14:06.672303', 'BM');
INSERT INTO public.quality_checks VALUES (1, 'M-QC1234', false, 'Scratch on front bumper', 'BM', '2026-01-24 17:25:06.249592', false);
INSERT INTO public.quality_checks VALUES (2, 'M - SP 7467', false, 'Cleaning mirrors', 'BM', '2026-01-24 18:37:58.653566', false);
INSERT INTO public.quality_checks VALUES (3, 'M - SP 7467', true, NULL, 'BM', '2026-01-24 20:14:03.653064', false);
INSERT INTO public.quality_checks VALUES (4, 'M - SP 1234', true, NULL, 'BM', '2026-01-24 20:14:14.425716', false);
INSERT INTO public.quality_checks VALUES (5, 'M - ZB 1111', true, NULL, 'BM', '2026-01-24 20:14:20.921873', false);
INSERT INTO public.quality_checks VALUES (6, 'M - HB 1652', true, NULL, 'BM', '2026-01-24 20:14:39.310193', false);
INSERT INTO public.quality_checks VALUES (7, 'M - JO 3588', true, NULL, 'BM', '2026-01-24 20:15:07.672264', false);
INSERT INTO public.quality_checks VALUES (8, 'M - SP 1234', false, 'Mirrors', 'BM', '2026-01-24 20:16:50.582117', false);
INSERT INTO public.driver_tasks VALUES (2, 2, 'M - SP 7467', 'Cleaning mirrors', true, 'LS', '2026-01-24 18:38:33.042', '2026-01-24 18:37:58.897518');
INSERT INTO public.driver_tasks VALUES (1, 1, 'M-QC1234', 'Scratch on front bumper', true, 'BM', '2026-01-24 20:15:14.121', '2026-01-24 17:25:06.291422');
INSERT INTO public.driver_tasks VALUES (3, 8, 'M - SP 1234', 'Mirrors', true, 'BM', '2026-01-24 20:46:33.919', '2026-01-24 20:16:50.587292');
INSERT INTO public.flow_tasks VALUES (5, 'M - SP 7467', false, 'refuelling', 5, true, 'BM', '2026-01-24 20:10:05.711', false, NULL, '2026-01-24 18:17:03.449673', '2026-01-24 19:16:00');
INSERT INTO public.flow_tasks VALUES (4, 'M - SP 7467', false, 'water', 4, true, 'BM', '2026-01-24 20:10:07.592', false, NULL, '2026-01-24 18:17:03.313119', '2026-01-24 19:16:00');
INSERT INTO public.flow_tasks VALUES (3, 'M - SP 7467', false, 'cleaning', 3, true, 'BM', '2026-01-24 20:10:08.627', false, NULL, '2026-01-24 18:17:03.176328', '2026-01-24 19:16:00');
INSERT INTO public.flow_tasks VALUES (6, 'M - HG 2887', false, 'only CheckIN & Parking', 6, true, 'BM', '2026-01-24 20:10:10.451', false, NULL, '2026-01-24 18:19:44.3118', '2026-01-24 16:19:00');
INSERT INTO public.flow_tasks VALUES (7, 'M - AB 1234', false, 'cleaning', 7, true, 'BM', '2026-01-24 20:46:18.139', false, NULL, '2026-01-24 20:24:11.878263', NULL);
INSERT INTO public.flow_tasks VALUES (8, 'M - XY 9999', false, 'cleaning', 8, true, 'BM', '2026-01-24 20:46:20.753', false, NULL, '2026-01-24 20:26:19.005031', NULL);
INSERT INTO public.flow_tasks VALUES (1, 'M-FL 1234', true, 'delivery', 1, true, 'BM', '2026-01-24 18:03:53.476', false, NULL, '2026-01-24 17:51:11.667598', NULL);
INSERT INTO public.flow_tasks VALUES (2, 'M - HB 3625', false, 'Bodyshop collection', 2, true, 'LS', '2026-01-24 18:04:11.115', false, NULL, '2026-01-24 18:03:40.110846', NULL);
INSERT INTO public.future_planning VALUES (2, '2026-01-25', 20, 10, 8, 2, 3, 2, 'BM', '2026-01-25 14:01:09.615714');
INSERT INTO public.kpi_metrics VALUES (2, 'ses', 80, 92.5, 'BM', '2026-01-25 17:01:47.37');
INSERT INTO public.kpi_metrics VALUES (1, 'irpd', 11, 8, 'BM', '2026-01-25 17:01:51.479');
INSERT INTO public.module_status VALUES (1, 'todo', true, '2026-01-24 17:44:35.682', 'HL', '2026-01-24');
INSERT INTO public.module_status VALUES (2, 'quality', true, '2026-01-24 20:02:41.544', 'BM', '2026-01-24');
INSERT INTO public.module_status VALUES (3, 'timedriver', true, '2026-01-24 20:09:44.108', 'BM', '2026-01-24');
INSERT INTO public.module_status VALUES (4, 'future', true, '2026-01-25 14:01:09.841', NULL, '2026-01-25');
INSERT INTO public.timedriver_calculations VALUES (2, '2026-01-24', 13, 16.39, 213.07, '[{"id":5,"initials":"LS","maxHours":5.5,"hourlyRate":25.5,"assignedHours":5,"assignedMinutes":30,"percent":100},{"id":4,"initials":"LV","maxHours":2,"hourlyRate":27.08,"assignedHours":2,"assignedMinutes":0,"percent":100}]', 'BM', '2026-01-24 20:09:44.104139');
INSERT INTO public.todos VALUES (2, 'Rückgabe Mails versenden', true, 'HL', '2026-01-24 17:44:30.459', '2026-01-24 17:43:51.832065', '{}', NULL, false, NULL, 0, true, 0);
INSERT INTO public.todos VALUES (3, 'TA aufräumen', true, 'LS', '2026-01-24 18:11:44.601', '2026-01-24 18:10:40.2779', '{Driver}', NULL, false, NULL, 0, true, 0);
INSERT INTO public.todos VALUES (4, 'WKS anrufen', true, 'HL', '2026-01-24 18:11:56.836', '2026-01-24 18:10:53.778018', '{Counter}', NULL, false, NULL, 0, true, 0);
INSERT INTO public.todos VALUES (5, 'Küche aufräumen', true, 'BM', '2026-01-24 20:46:04.993', '2026-01-24 20:18:06.183202', '{Counter}', NULL, false, NULL, 0, true, 0);
INSERT INTO public.todos VALUES (9, 'Bodyshop Collection: M-LM4623E', false, NULL, NULL, '2026-01-24 21:04:39.406017', '{Counter}', 4, true, '2026-01-25', 1, true, 0);
INSERT INTO public.todos VALUES (10, 'Test Priority Task R47REy', false, NULL, NULL, '2026-01-25 17:05:08.884014', '{}', NULL, false, NULL, 0, false, 3);
INSERT INTO public.todos VALUES (12, 'Urgent One-Time Task _PQK1U', false, NULL, NULL, '2026-01-25 17:09:16.968934', '{}', NULL, false, NULL, 0, false, 3);
INSERT INTO public.todos VALUES (13, 'Daily Recurring Task eaRgVl', false, NULL, NULL, '2026-01-25 17:09:29.416655', '{}', NULL, false, NULL, 0, true, 2);
INSERT INTO public.todos VALUES (11, 'Test Recurring Task JqMGv3', false, 'HL', '2026-01-25 17:20:09.32', '2026-01-25 17:05:21.99549', '{}', NULL, false, NULL, 0, true, 2);
INSERT INTO public.upgrade_vehicles VALUES (1, 'M - CD 5678', 'Audi A6', 'Premium upgrade for airport pickup', true, '2026-01-25 08:26:18.725', 'BM', '2026-01-25', 'BM', '2026-01-25 08:26:10.019614', false);
INSERT INTO public.upgrade_vehicles VALUES (2, 'M - AB 1234', 'BMW 5 Series', 'Premium upgrade for VIP customer', false, NULL, NULL, '2026-01-25', 'BM', '2026-01-25 12:47:46.286818', false);
INSERT INTO public.upgrade_vehicles VALUES (3, 'M - XY 9999', 'Mercedes Sprinter', 'Large van for group transport', false, NULL, NULL, '2026-01-25', 'BM', '2026-01-25 12:48:12.13742', true);
INSERT INTO public.users VALUES (1, 'BM', '4266', '{Counter,Driver}', true, '2026-01-24 16:45:56.646198', NULL, NULL);
INSERT INTO public.users VALUES (3, 'HL', '2222', '{Counter}', false, '2026-01-24 17:44:13.323627', NULL, NULL);
INSERT INTO public.users VALUES (4, 'LV', '4444', '{Driver}', false, '2026-01-24 19:04:57.354562', 2, NULL);
INSERT INTO public.users VALUES (5, 'LS', '1111', '{Driver}', false, '2026-01-24 19:19:50.034489', 5.5, 25.5);
INSERT INTO public.vehicle_daily_comments VALUES (1, 4, '2026-01-24', true, 9);

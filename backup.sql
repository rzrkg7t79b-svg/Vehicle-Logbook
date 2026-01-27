--
-- PostgreSQL database dump
--


-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.vehicle_daily_comments DROP CONSTRAINT IF EXISTS vehicle_daily_comments_vehicle_id_vehicles_id_fk;
ALTER TABLE IF EXISTS ONLY public.driver_tasks DROP CONSTRAINT IF EXISTS driver_tasks_quality_check_id_quality_checks_id_fk;
ALTER TABLE IF EXISTS ONLY public.comments DROP CONSTRAINT IF EXISTS comments_vehicle_id_vehicles_id_fk;
ALTER TABLE IF EXISTS ONLY public.vehicles DROP CONSTRAINT IF EXISTS vehicles_pkey;
ALTER TABLE IF EXISTS ONLY public.vehicle_daily_comments DROP CONSTRAINT IF EXISTS vehicle_daily_comments_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pin_unique;
ALTER TABLE IF EXISTS ONLY public.upgrade_vehicles DROP CONSTRAINT IF EXISTS upgrade_vehicles_pkey;
ALTER TABLE IF EXISTS ONLY public.todos DROP CONSTRAINT IF EXISTS todos_pkey;
ALTER TABLE IF EXISTS ONLY public.timedriver_calculations DROP CONSTRAINT IF EXISTS timedriver_calculations_pkey;
ALTER TABLE IF EXISTS ONLY public.timedriver_calculations DROP CONSTRAINT IF EXISTS timedriver_calculations_date_unique;
ALTER TABLE IF EXISTS ONLY public.quality_checks DROP CONSTRAINT IF EXISTS quality_checks_pkey;
ALTER TABLE IF EXISTS ONLY public.module_status DROP CONSTRAINT IF EXISTS module_status_pkey;
ALTER TABLE IF EXISTS ONLY public.kpi_metrics DROP CONSTRAINT IF EXISTS kpi_metrics_pkey;
ALTER TABLE IF EXISTS ONLY public.kpi_metrics DROP CONSTRAINT IF EXISTS kpi_metrics_key_unique;
ALTER TABLE IF EXISTS ONLY public.future_planning DROP CONSTRAINT IF EXISTS future_planning_pkey;
ALTER TABLE IF EXISTS ONLY public.future_planning DROP CONSTRAINT IF EXISTS future_planning_date_unique;
ALTER TABLE IF EXISTS ONLY public.flow_tasks DROP CONSTRAINT IF EXISTS flow_tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.driver_tasks DROP CONSTRAINT IF EXISTS driver_tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.comments DROP CONSTRAINT IF EXISTS comments_pkey;
ALTER TABLE IF EXISTS ONLY public.app_settings DROP CONSTRAINT IF EXISTS app_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.app_settings DROP CONSTRAINT IF EXISTS app_settings_key_unique;
ALTER TABLE IF EXISTS public.vehicles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.vehicle_daily_comments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.upgrade_vehicles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.todos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.timedriver_calculations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.quality_checks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.module_status ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kpi_metrics ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.future_planning ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.flow_tasks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.driver_tasks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.comments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.app_settings ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.vehicles_id_seq;
DROP TABLE IF EXISTS public.vehicles;
DROP SEQUENCE IF EXISTS public.vehicle_daily_comments_id_seq;
DROP TABLE IF EXISTS public.vehicle_daily_comments;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.upgrade_vehicles_id_seq;
DROP TABLE IF EXISTS public.upgrade_vehicles;
DROP SEQUENCE IF EXISTS public.todos_id_seq;
DROP TABLE IF EXISTS public.todos;
DROP SEQUENCE IF EXISTS public.timedriver_calculations_id_seq;
DROP TABLE IF EXISTS public.timedriver_calculations;
DROP SEQUENCE IF EXISTS public.quality_checks_id_seq;
DROP TABLE IF EXISTS public.quality_checks;
DROP SEQUENCE IF EXISTS public.module_status_id_seq;
DROP TABLE IF EXISTS public.module_status;
DROP SEQUENCE IF EXISTS public.kpi_metrics_id_seq;
DROP TABLE IF EXISTS public.kpi_metrics;
DROP SEQUENCE IF EXISTS public.future_planning_id_seq;
DROP TABLE IF EXISTS public.future_planning;
DROP SEQUENCE IF EXISTS public.flow_tasks_id_seq;
DROP TABLE IF EXISTS public.flow_tasks;
DROP SEQUENCE IF EXISTS public.driver_tasks_id_seq;
DROP TABLE IF EXISTS public.driver_tasks;
DROP SEQUENCE IF EXISTS public.comments_id_seq;
DROP TABLE IF EXISTS public.comments;
DROP SEQUENCE IF EXISTS public.app_settings_id_seq;
DROP TABLE IF EXISTS public.app_settings;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    id integer NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: app_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.app_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: app_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.app_settings_id_seq OWNED BY public.app_settings.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    vehicle_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    user_initials text
);


--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: driver_tasks; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: driver_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.driver_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: driver_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.driver_tasks_id_seq OWNED BY public.driver_tasks.id;


--
-- Name: flow_tasks; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: flow_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.flow_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: flow_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.flow_tasks_id_seq OWNED BY public.flow_tasks.id;


--
-- Name: future_planning; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: future_planning_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.future_planning_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: future_planning_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.future_planning_id_seq OWNED BY public.future_planning.id;


--
-- Name: kpi_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_metrics (
    id integer NOT NULL,
    key text NOT NULL,
    value real NOT NULL,
    goal real NOT NULL,
    updated_by text,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: kpi_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kpi_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kpi_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kpi_metrics_id_seq OWNED BY public.kpi_metrics.id;


--
-- Name: module_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.module_status (
    id integer NOT NULL,
    module_name text NOT NULL,
    is_done boolean DEFAULT false NOT NULL,
    done_at timestamp without time zone,
    done_by text,
    date text NOT NULL
);


--
-- Name: module_status_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.module_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: module_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.module_status_id_seq OWNED BY public.module_status.id;


--
-- Name: quality_checks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quality_checks (
    id integer NOT NULL,
    license_plate text NOT NULL,
    passed boolean NOT NULL,
    comment text,
    checked_by text,
    created_at timestamp without time zone DEFAULT now(),
    is_ev boolean DEFAULT false NOT NULL
);


--
-- Name: quality_checks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quality_checks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quality_checks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quality_checks_id_seq OWNED BY public.quality_checks.id;


--
-- Name: timedriver_calculations; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: timedriver_calculations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.timedriver_calculations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: timedriver_calculations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.timedriver_calculations_id_seq OWNED BY public.timedriver_calculations.id;


--
-- Name: todos; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: todos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.todos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: todos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.todos_id_seq OWNED BY public.todos.id;


--
-- Name: upgrade_vehicles; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: upgrade_vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.upgrade_vehicles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: upgrade_vehicles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.upgrade_vehicles_id_seq OWNED BY public.upgrade_vehicles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vehicle_daily_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicle_daily_comments (
    id integer NOT NULL,
    vehicle_id integer NOT NULL,
    date text NOT NULL,
    has_comment boolean DEFAULT false NOT NULL,
    comment_id integer
);


--
-- Name: vehicle_daily_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vehicle_daily_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vehicle_daily_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vehicle_daily_comments_id_seq OWNED BY public.vehicle_daily_comments.id;


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vehicles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vehicles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vehicles_id_seq OWNED BY public.vehicles.id;


--
-- Name: app_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings ALTER COLUMN id SET DEFAULT nextval('public.app_settings_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: driver_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_tasks ALTER COLUMN id SET DEFAULT nextval('public.driver_tasks_id_seq'::regclass);


--
-- Name: flow_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flow_tasks ALTER COLUMN id SET DEFAULT nextval('public.flow_tasks_id_seq'::regclass);


--
-- Name: future_planning id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.future_planning ALTER COLUMN id SET DEFAULT nextval('public.future_planning_id_seq'::regclass);


--
-- Name: kpi_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_metrics ALTER COLUMN id SET DEFAULT nextval('public.kpi_metrics_id_seq'::regclass);


--
-- Name: module_status id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_status ALTER COLUMN id SET DEFAULT nextval('public.module_status_id_seq'::regclass);


--
-- Name: quality_checks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quality_checks ALTER COLUMN id SET DEFAULT nextval('public.quality_checks_id_seq'::regclass);


--
-- Name: timedriver_calculations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timedriver_calculations ALTER COLUMN id SET DEFAULT nextval('public.timedriver_calculations_id_seq'::regclass);


--
-- Name: todos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.todos ALTER COLUMN id SET DEFAULT nextval('public.todos_id_seq'::regclass);


--
-- Name: upgrade_vehicles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upgrade_vehicles ALTER COLUMN id SET DEFAULT nextval('public.upgrade_vehicles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vehicle_daily_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_daily_comments ALTER COLUMN id SET DEFAULT nextval('public.vehicle_daily_comments_id_seq'::regclass);


--
-- Name: vehicles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles ALTER COLUMN id SET DEFAULT nextval('public.vehicles_id_seq'::regclass);


--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_settings (id, key, value, updated_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comments (id, vehicle_id, content, created_at, user_initials) FROM stdin;
5	4	Auftrag geschrieben	2026-01-24 13:36:26.950694	\N
6	4	Hol und Bringservice beautragt	2026-01-24 13:36:41.177476	\N
7	4	Test comment from BM	2026-01-24 16:50:20.500158	BM
8	4	Morgen fertig	2026-01-24 20:11:25.251083	BM
9	4	Daily check completed	2026-01-24 20:14:06.672303	BM
\.


--
-- Data for Name: driver_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.driver_tasks (id, quality_check_id, license_plate, description, completed, completed_by, completed_at, created_at) FROM stdin;
2	2	M - SP 7467	Cleaning mirrors	t	LS	2026-01-24 18:38:33.042	2026-01-24 18:37:58.897518
1	1	M-QC1234	Scratch on front bumper	t	BM	2026-01-24 20:15:14.121	2026-01-24 17:25:06.291422
3	8	M - SP 1234	Mirrors	t	BM	2026-01-24 20:46:33.919	2026-01-24 20:16:50.587292
\.


--
-- Data for Name: flow_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.flow_tasks (id, license_plate, is_ev, task_type, priority, completed, completed_by, completed_at, needs_retry, created_by, created_at, need_at) FROM stdin;
5	M - SP 7467	f	refuelling	5	t	BM	2026-01-24 20:10:05.711	f	\N	2026-01-24 18:17:03.449673	2026-01-24 19:16:00
4	M - SP 7467	f	water	4	t	BM	2026-01-24 20:10:07.592	f	\N	2026-01-24 18:17:03.313119	2026-01-24 19:16:00
3	M - SP 7467	f	cleaning	3	t	BM	2026-01-24 20:10:08.627	f	\N	2026-01-24 18:17:03.176328	2026-01-24 19:16:00
6	M - HG 2887	f	only CheckIN & Parking	6	t	BM	2026-01-24 20:10:10.451	f	\N	2026-01-24 18:19:44.3118	2026-01-24 16:19:00
7	M - AB 1234	f	cleaning	7	t	BM	2026-01-24 20:46:18.139	f	\N	2026-01-24 20:24:11.878263	\N
8	M - XY 9999	f	cleaning	8	t	BM	2026-01-24 20:46:20.753	f	\N	2026-01-24 20:26:19.005031	\N
1	M-FL 1234	t	delivery	1	t	BM	2026-01-24 18:03:53.476	f	\N	2026-01-24 17:51:11.667598	\N
2	M - HB 3625	f	Bodyshop collection	2	t	LS	2026-01-24 18:04:11.115	f	\N	2026-01-24 18:03:40.110846	\N
\.


--
-- Data for Name: future_planning; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.future_planning (id, date, reservations_total, reservations_car, reservations_van, reservations_tas, deliveries_tomorrow, collections_open, saved_by, saved_at) FROM stdin;
2	2026-01-25	20	10	8	2	3	2	BM	2026-01-25 14:01:09.615714
\.


--
-- Data for Name: kpi_metrics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kpi_metrics (id, key, value, goal, updated_by, updated_at) FROM stdin;
2	ses	80	92.5	BM	2026-01-25 17:01:47.37
1	irpd	11	8	BM	2026-01-25 17:01:51.479
\.


--
-- Data for Name: module_status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.module_status (id, module_name, is_done, done_at, done_by, date) FROM stdin;
1	todo	t	2026-01-24 17:44:35.682	HL	2026-01-24
2	quality	t	2026-01-24 20:02:41.544	BM	2026-01-24
3	timedriver	t	2026-01-24 20:09:44.108	BM	2026-01-24
4	future	t	2026-01-25 14:01:09.841	\N	2026-01-25
\.


--
-- Data for Name: quality_checks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quality_checks (id, license_plate, passed, comment, checked_by, created_at, is_ev) FROM stdin;
1	M-QC1234	f	Scratch on front bumper	BM	2026-01-24 17:25:06.249592	f
2	M - SP 7467	f	Cleaning mirrors	BM	2026-01-24 18:37:58.653566	f
3	M - SP 7467	t	\N	BM	2026-01-24 20:14:03.653064	f
4	M - SP 1234	t	\N	BM	2026-01-24 20:14:14.425716	f
5	M - ZB 1111	t	\N	BM	2026-01-24 20:14:20.921873	f
6	M - HB 1652	t	\N	BM	2026-01-24 20:14:39.310193	f
7	M - JO 3588	t	\N	BM	2026-01-24 20:15:07.672264	f
8	M - SP 1234	f	Mirrors	BM	2026-01-24 20:16:50.582117	f
\.


--
-- Data for Name: timedriver_calculations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.timedriver_calculations (id, date, rentals, budget_per_rental, total_budget, drivers_data, calculated_by, calculated_at) FROM stdin;
2	2026-01-24	13	16.39	213.07	[{"id":5,"initials":"LS","maxHours":5.5,"hourlyRate":25.5,"assignedHours":5,"assignedMinutes":30,"percent":100},{"id":4,"initials":"LV","maxHours":2,"hourlyRate":27.08,"assignedHours":2,"assignedMinutes":0,"percent":100}]	BM	2026-01-24 20:09:44.104139
\.


--
-- Data for Name: todos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.todos (id, title, completed, completed_by, completed_at, created_at, assigned_to, vehicle_id, is_system_generated, postponed_to_date, postpone_count, is_recurring, priority) FROM stdin;
2	Rückgabe Mails versenden	t	HL	2026-01-24 17:44:30.459	2026-01-24 17:43:51.832065	{}	\N	f	\N	0	t	0
3	TA aufräumen	t	LS	2026-01-24 18:11:44.601	2026-01-24 18:10:40.2779	{Driver}	\N	f	\N	0	t	0
4	WKS anrufen	t	HL	2026-01-24 18:11:56.836	2026-01-24 18:10:53.778018	{Counter}	\N	f	\N	0	t	0
5	Küche aufräumen	t	BM	2026-01-24 20:46:04.993	2026-01-24 20:18:06.183202	{Counter}	\N	f	\N	0	t	0
9	Bodyshop Collection: M-LM4623E	f	\N	\N	2026-01-24 21:04:39.406017	{Counter}	4	t	2026-01-25	1	t	0
10	Test Priority Task R47REy	f	\N	\N	2026-01-25 17:05:08.884014	{}	\N	f	\N	0	f	3
12	Urgent One-Time Task _PQK1U	f	\N	\N	2026-01-25 17:09:16.968934	{}	\N	f	\N	0	f	3
13	Daily Recurring Task eaRgVl	f	\N	\N	2026-01-25 17:09:29.416655	{}	\N	f	\N	0	t	2
11	Test Recurring Task JqMGv3	f	HL	2026-01-25 17:20:09.32	2026-01-25 17:05:21.99549	{}	\N	f	\N	0	t	2
\.


--
-- Data for Name: upgrade_vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.upgrade_vehicles (id, license_plate, model, reason, is_sold, sold_at, sold_by, date, created_by, created_at, is_van) FROM stdin;
1	M - CD 5678	Audi A6	Premium upgrade for airport pickup	t	2026-01-25 08:26:18.725	BM	2026-01-25	BM	2026-01-25 08:26:10.019614	f
2	M - AB 1234	BMW 5 Series	Premium upgrade for VIP customer	f	\N	\N	2026-01-25	BM	2026-01-25 12:47:46.286818	f
3	M - XY 9999	Mercedes Sprinter	Large van for group transport	f	\N	\N	2026-01-25	BM	2026-01-25 12:48:12.13742	t
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, initials, pin, roles, is_admin, created_at, max_daily_hours, hourly_rate) FROM stdin;
1	BM	4266	{Counter,Driver}	t	2026-01-24 16:45:56.646198	\N	\N
3	HL	2222	{Counter}	f	2026-01-24 17:44:13.323627	\N	\N
4	LV	4444	{Driver}	f	2026-01-24 19:04:57.354562	2	\N
5	LS	1111	{Driver}	f	2026-01-24 19:19:50.034489	5.5	25.5
\.


--
-- Data for Name: vehicle_daily_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicle_daily_comments (id, vehicle_id, date, has_comment, comment_id) FROM stdin;
1	4	2026-01-24	t	9
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicles (id, license_plate, name, notes, is_ev, countdown_start, created_at, ready_for_collection, collection_todo_id, is_past) FROM stdin;
4	M-LM4623E	Audi A3 Hybrid		t	2026-01-23 00:00:00	2026-01-24 13:36:01.700295	t	9	f
\.


--
-- Name: app_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.app_settings_id_seq', 1, false);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.comments_id_seq', 9, true);


--
-- Name: driver_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.driver_tasks_id_seq', 3, true);


--
-- Name: flow_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.flow_tasks_id_seq', 8, true);


--
-- Name: future_planning_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.future_planning_id_seq', 2, true);


--
-- Name: kpi_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.kpi_metrics_id_seq', 2, true);


--
-- Name: module_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.module_status_id_seq', 4, true);


--
-- Name: quality_checks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quality_checks_id_seq', 8, true);


--
-- Name: timedriver_calculations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.timedriver_calculations_id_seq', 2, true);


--
-- Name: todos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.todos_id_seq', 13, true);


--
-- Name: upgrade_vehicles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.upgrade_vehicles_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- Name: vehicle_daily_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vehicle_daily_comments_id_seq', 1, true);


--
-- Name: vehicles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vehicles_id_seq', 4, true);


--
-- Name: app_settings app_settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_key_unique UNIQUE (key);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: driver_tasks driver_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_tasks
    ADD CONSTRAINT driver_tasks_pkey PRIMARY KEY (id);


--
-- Name: flow_tasks flow_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flow_tasks
    ADD CONSTRAINT flow_tasks_pkey PRIMARY KEY (id);


--
-- Name: future_planning future_planning_date_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.future_planning
    ADD CONSTRAINT future_planning_date_unique UNIQUE (date);


--
-- Name: future_planning future_planning_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.future_planning
    ADD CONSTRAINT future_planning_pkey PRIMARY KEY (id);


--
-- Name: kpi_metrics kpi_metrics_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_metrics
    ADD CONSTRAINT kpi_metrics_key_unique UNIQUE (key);


--
-- Name: kpi_metrics kpi_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_metrics
    ADD CONSTRAINT kpi_metrics_pkey PRIMARY KEY (id);


--
-- Name: module_status module_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_status
    ADD CONSTRAINT module_status_pkey PRIMARY KEY (id);


--
-- Name: quality_checks quality_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quality_checks
    ADD CONSTRAINT quality_checks_pkey PRIMARY KEY (id);


--
-- Name: timedriver_calculations timedriver_calculations_date_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timedriver_calculations
    ADD CONSTRAINT timedriver_calculations_date_unique UNIQUE (date);


--
-- Name: timedriver_calculations timedriver_calculations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timedriver_calculations
    ADD CONSTRAINT timedriver_calculations_pkey PRIMARY KEY (id);


--
-- Name: todos todos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.todos
    ADD CONSTRAINT todos_pkey PRIMARY KEY (id);


--
-- Name: upgrade_vehicles upgrade_vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upgrade_vehicles
    ADD CONSTRAINT upgrade_vehicles_pkey PRIMARY KEY (id);


--
-- Name: users users_pin_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pin_unique UNIQUE (pin);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vehicle_daily_comments vehicle_daily_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_daily_comments
    ADD CONSTRAINT vehicle_daily_comments_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: comments comments_vehicle_id_vehicles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_vehicle_id_vehicles_id_fk FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- Name: driver_tasks driver_tasks_quality_check_id_quality_checks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_tasks
    ADD CONSTRAINT driver_tasks_quality_check_id_quality_checks_id_fk FOREIGN KEY (quality_check_id) REFERENCES public.quality_checks(id) ON DELETE CASCADE;


--
-- Name: vehicle_daily_comments vehicle_daily_comments_vehicle_id_vehicles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_daily_comments
    ADD CONSTRAINT vehicle_daily_comments_vehicle_id_vehicles_id_fk FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict jmNM3QJfxEVRiRL1DDTDl07SztMXOWFrR0XfR4fg8tX1qGAEyexCdK3T3h6yZjS


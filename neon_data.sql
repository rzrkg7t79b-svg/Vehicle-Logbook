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

--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.vehicles VALUES (4, 'M-LM4623E', 'Audi A3 Hybrid', '', true, '2026-01-23 00:00:00', '2026-01-24 13:36:01.700295', true, 9, false);


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.comments VALUES (5, 4, 'Auftrag geschrieben', '2026-01-24 13:36:26.950694', NULL);
INSERT INTO public.comments VALUES (6, 4, 'Hol und Bringservice beautragt', '2026-01-24 13:36:41.177476', NULL);
INSERT INTO public.comments VALUES (7, 4, 'Test comment from BM', '2026-01-24 16:50:20.500158', 'BM');
INSERT INTO public.comments VALUES (8, 4, 'Morgen fertig', '2026-01-24 20:11:25.251083', 'BM');
INSERT INTO public.comments VALUES (9, 4, 'Daily check completed', '2026-01-24 20:14:06.672303', 'BM');


--
-- Data for Name: quality_checks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.quality_checks VALUES (1, 'M-QC1234', false, 'Scratch on front bumper', 'BM', '2026-01-24 17:25:06.249592', false);
INSERT INTO public.quality_checks VALUES (2, 'M - SP 7467', false, 'Cleaning mirrors', 'BM', '2026-01-24 18:37:58.653566', false);
INSERT INTO public.quality_checks VALUES (3, 'M - SP 7467', true, NULL, 'BM', '2026-01-24 20:14:03.653064', false);
INSERT INTO public.quality_checks VALUES (4, 'M - SP 1234', true, NULL, 'BM', '2026-01-24 20:14:14.425716', false);
INSERT INTO public.quality_checks VALUES (5, 'M - ZB 1111', true, NULL, 'BM', '2026-01-24 20:14:20.921873', false);
INSERT INTO public.quality_checks VALUES (6, 'M - HB 1652', true, NULL, 'BM', '2026-01-24 20:14:39.310193', false);
INSERT INTO public.quality_checks VALUES (7, 'M - JO 3588', true, NULL, 'BM', '2026-01-24 20:15:07.672264', false);
INSERT INTO public.quality_checks VALUES (8, 'M - SP 1234', false, 'Mirrors', 'BM', '2026-01-24 20:16:50.582117', false);


--
-- Data for Name: driver_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.driver_tasks VALUES (2, 2, 'M - SP 7467', 'Cleaning mirrors', true, 'LS', '2026-01-24 18:38:33.042', '2026-01-24 18:37:58.897518');
INSERT INTO public.driver_tasks VALUES (1, 1, 'M-QC1234', 'Scratch on front bumper', true, 'BM', '2026-01-24 20:15:14.121', '2026-01-24 17:25:06.291422');
INSERT INTO public.driver_tasks VALUES (3, 8, 'M - SP 1234', 'Mirrors', true, 'BM', '2026-01-24 20:46:33.919', '2026-01-24 20:16:50.587292');


--
-- Data for Name: flow_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.flow_tasks VALUES (5, 'M - SP 7467', false, 'refuelling', 5, true, 'BM', '2026-01-24 20:10:05.711', false, NULL, '2026-01-24 18:17:03.449673', '2026-01-24 19:16:00');
INSERT INTO public.flow_tasks VALUES (4, 'M - SP 7467', false, 'water', 4, true, 'BM', '2026-01-24 20:10:07.592', false, NULL, '2026-01-24 18:17:03.313119', '2026-01-24 19:16:00');
INSERT INTO public.flow_tasks VALUES (3, 'M - SP 7467', false, 'cleaning', 3, true, 'BM', '2026-01-24 20:10:08.627', false, NULL, '2026-01-24 18:17:03.176328', '2026-01-24 19:16:00');
INSERT INTO public.flow_tasks VALUES (6, 'M - HG 2887', false, 'only CheckIN & Parking', 6, true, 'BM', '2026-01-24 20:10:10.451', false, NULL, '2026-01-24 18:19:44.3118', '2026-01-24 16:19:00');
INSERT INTO public.flow_tasks VALUES (7, 'M - AB 1234', false, 'cleaning', 7, true, 'BM', '2026-01-24 20:46:18.139', false, NULL, '2026-01-24 20:24:11.878263', NULL);
INSERT INTO public.flow_tasks VALUES (8, 'M - XY 9999', false, 'cleaning', 8, true, 'BM', '2026-01-24 20:46:20.753', false, NULL, '2026-01-24 20:26:19.005031', NULL);
INSERT INTO public.flow_tasks VALUES (1, 'M-FL 1234', true, 'delivery', 1, true, 'BM', '2026-01-24 18:03:53.476', false, NULL, '2026-01-24 17:51:11.667598', NULL);
INSERT INTO public.flow_tasks VALUES (2, 'M - HB 3625', false, 'Bodyshop collection', 2, true, 'LS', '2026-01-24 18:04:11.115', false, NULL, '2026-01-24 18:03:40.110846', NULL);


--
-- Data for Name: future_planning; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.future_planning VALUES (2, '2026-01-25', 20, 10, 8, 2, 3, 2, 'BM', '2026-01-25 14:01:09.615714');


--
-- Data for Name: kpi_metrics; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.kpi_metrics VALUES (2, 'ses', 80, 92.5, 'BM', '2026-01-25 17:01:47.37');
INSERT INTO public.kpi_metrics VALUES (1, 'irpd', 11, 8, 'BM', '2026-01-25 17:01:51.479');


--
-- Data for Name: module_status; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.module_status VALUES (1, 'todo', true, '2026-01-24 17:44:35.682', 'HL', '2026-01-24');
INSERT INTO public.module_status VALUES (2, 'quality', true, '2026-01-24 20:02:41.544', 'BM', '2026-01-24');
INSERT INTO public.module_status VALUES (3, 'timedriver', true, '2026-01-24 20:09:44.108', 'BM', '2026-01-24');
INSERT INTO public.module_status VALUES (4, 'future', true, '2026-01-25 14:01:09.841', NULL, '2026-01-25');


--
-- Data for Name: timedriver_calculations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.timedriver_calculations VALUES (2, '2026-01-24', 13, 16.39, 213.07, '[{"id":5,"initials":"LS","maxHours":5.5,"hourlyRate":25.5,"assignedHours":5,"assignedMinutes":30,"percent":100},{"id":4,"initials":"LV","maxHours":2,"hourlyRate":27.08,"assignedHours":2,"assignedMinutes":0,"percent":100}]', 'BM', '2026-01-24 20:09:44.104139');


--
-- Data for Name: todos; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.todos VALUES (2, 'Rückgabe Mails versenden', true, 'HL', '2026-01-24 17:44:30.459', '2026-01-24 17:43:51.832065', '{}', NULL, false, NULL, 0, true, 0);
INSERT INTO public.todos VALUES (3, 'TA aufräumen', true, 'LS', '2026-01-24 18:11:44.601', '2026-01-24 18:10:40.2779', '{Driver}', NULL, false, NULL, 0, true, 0);
INSERT INTO public.todos VALUES (4, 'WKS anrufen', true, 'HL', '2026-01-24 18:11:56.836', '2026-01-24 18:10:53.778018', '{Counter}', NULL, false, NULL, 0, true, 0);
INSERT INTO public.todos VALUES (5, 'Küche aufräumen', true, 'BM', '2026-01-24 20:46:04.993', '2026-01-24 20:18:06.183202', '{Counter}', NULL, false, NULL, 0, true, 0);
INSERT INTO public.todos VALUES (9, 'Bodyshop Collection: M-LM4623E', false, NULL, NULL, '2026-01-24 21:04:39.406017', '{Counter}', 4, true, '2026-01-25', 1, true, 0);
INSERT INTO public.todos VALUES (10, 'Test Priority Task R47REy', false, NULL, NULL, '2026-01-25 17:05:08.884014', '{}', NULL, false, NULL, 0, false, 3);
INSERT INTO public.todos VALUES (12, 'Urgent One-Time Task _PQK1U', false, NULL, NULL, '2026-01-25 17:09:16.968934', '{}', NULL, false, NULL, 0, false, 3);
INSERT INTO public.todos VALUES (13, 'Daily Recurring Task eaRgVl', false, NULL, NULL, '2026-01-25 17:09:29.416655', '{}', NULL, false, NULL, 0, true, 2);
INSERT INTO public.todos VALUES (11, 'Test Recurring Task JqMGv3', false, 'HL', '2026-01-25 17:20:09.32', '2026-01-25 17:05:21.99549', '{}', NULL, false, NULL, 0, true, 2);


--
-- Data for Name: upgrade_vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.upgrade_vehicles VALUES (1, 'M - CD 5678', 'Audi A6', 'Premium upgrade for airport pickup', true, '2026-01-25 08:26:18.725', 'BM', '2026-01-25', 'BM', '2026-01-25 08:26:10.019614', false);
INSERT INTO public.upgrade_vehicles VALUES (2, 'M - AB 1234', 'BMW 5 Series', 'Premium upgrade for VIP customer', false, NULL, NULL, '2026-01-25', 'BM', '2026-01-25 12:47:46.286818', false);
INSERT INTO public.upgrade_vehicles VALUES (3, 'M - XY 9999', 'Mercedes Sprinter', 'Large van for group transport', false, NULL, NULL, '2026-01-25', 'BM', '2026-01-25 12:48:12.13742', true);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES (1, 'BM', '4266', '{Counter,Driver}', true, '2026-01-24 16:45:56.646198', NULL, NULL);
INSERT INTO public.users VALUES (3, 'HL', '2222', '{Counter}', false, '2026-01-24 17:44:13.323627', NULL, NULL);
INSERT INTO public.users VALUES (4, 'LV', '4444', '{Driver}', false, '2026-01-24 19:04:57.354562', 2, NULL);
INSERT INTO public.users VALUES (5, 'LS', '1111', '{Driver}', false, '2026-01-24 19:19:50.034489', 5.5, 25.5);


--
-- Data for Name: vehicle_daily_comments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.vehicle_daily_comments VALUES (1, 4, '2026-01-24', true, 9);


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
-- PostgreSQL database dump complete
--

\unrestrict fhI2bgUg5RaZ3cyv0LTANaXzDfuynPmMHExLAKAXlx0McDCaYdKQCcZSTYU7yls


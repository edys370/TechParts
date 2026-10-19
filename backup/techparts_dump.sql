--
-- PostgreSQL database dump
--

\restrict rVaHvJeW8fHPMh8Y3m02LzUDZoXursGAeO37YeWy3YrLLr7sKHvxHE4HYhjrd5i

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

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

ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS "products_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public.product_variants DROP CONSTRAINT IF EXISTS "product_variants_productId_fkey";
ALTER TABLE IF EXISTS ONLY public.inventory_transactions DROP CONSTRAINT IF EXISTS "inventory_transactions_variantId_fkey";
ALTER TABLE IF EXISTS ONLY public.inventory_transactions DROP CONSTRAINT IF EXISTS "inventory_transactions_productId_fkey";
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.products_sku_key;
DROP INDEX IF EXISTS public.products_sku_idx;
DROP INDEX IF EXISTS public."products_categoryId_idx";
DROP INDEX IF EXISTS public.products_brand_idx;
DROP INDEX IF EXISTS public.product_variants_sku_key;
DROP INDEX IF EXISTS public.product_variants_sku_idx;
DROP INDEX IF EXISTS public."product_variants_productId_idx";
DROP INDEX IF EXISTS public."inventory_transactions_variantId_idx";
DROP INDEX IF EXISTS public.inventory_transactions_type_idx;
DROP INDEX IF EXISTS public."inventory_transactions_productId_idx";
DROP INDEX IF EXISTS public.categories_slug_key;
DROP INDEX IF EXISTS public.categories_name_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.product_variants DROP CONSTRAINT IF EXISTS product_variants_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.products ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.product_variants ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.inventory_transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.categories ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.products_id_seq;
DROP TABLE IF EXISTS public.products;
DROP SEQUENCE IF EXISTS public.product_variants_id_seq;
DROP TABLE IF EXISTS public.product_variants;
DROP SEQUENCE IF EXISTS public.inventory_transactions_id_seq;
DROP TABLE IF EXISTS public.inventory_transactions;
DROP SEQUENCE IF EXISTS public.categories_id_seq;
DROP TABLE IF EXISTS public.categories;
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS pg_trgm;
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: techparts_admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO techparts_admin;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: techparts_admin
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO techparts_admin;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: techparts_admin
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO techparts_admin;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techparts_admin
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: techparts_admin
--

CREATE TABLE public.inventory_transactions (
    id integer NOT NULL,
    "productId" integer NOT NULL,
    "variantId" integer,
    type text NOT NULL,
    quantity integer NOT NULL,
    "previousStock" integer NOT NULL,
    "newStock" integer NOT NULL,
    reason text,
    reference text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.inventory_transactions OWNER TO techparts_admin;

--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: techparts_admin
--

CREATE SEQUENCE public.inventory_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_transactions_id_seq OWNER TO techparts_admin;

--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techparts_admin
--

ALTER SEQUENCE public.inventory_transactions_id_seq OWNED BY public.inventory_transactions.id;


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: techparts_admin
--

CREATE TABLE public.product_variants (
    id integer NOT NULL,
    "productId" integer NOT NULL,
    sku text NOT NULL,
    name text NOT NULL,
    capacity text,
    color text,
    "modelVariant" text,
    price numeric(10,2) NOT NULL,
    "costPrice" numeric(10,2) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    "minStock" integer DEFAULT 3 NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.product_variants OWNER TO techparts_admin;

--
-- Name: product_variants_id_seq; Type: SEQUENCE; Schema: public; Owner: techparts_admin
--

CREATE SEQUENCE public.product_variants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_variants_id_seq OWNER TO techparts_admin;

--
-- Name: product_variants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techparts_admin
--

ALTER SEQUENCE public.product_variants_id_seq OWNED BY public.product_variants.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: techparts_admin
--

CREATE TABLE public.products (
    id integer NOT NULL,
    sku text NOT NULL,
    name text NOT NULL,
    description text,
    brand text NOT NULL,
    model text NOT NULL,
    price numeric(10,2) NOT NULL,
    "costPrice" numeric(10,2) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    "minStock" integer DEFAULT 5 NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "hasVariants" boolean DEFAULT false NOT NULL,
    "categoryId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.products OWNER TO techparts_admin;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: techparts_admin
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO techparts_admin;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techparts_admin
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: techparts_admin
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    role text DEFAULT 'OPERATOR'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO techparts_admin;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: techparts_admin
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO techparts_admin;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: techparts_admin
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: techparts_admin
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: inventory_transactions id; Type: DEFAULT; Schema: public; Owner: techparts_admin
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN id SET DEFAULT nextval('public.inventory_transactions_id_seq'::regclass);


--
-- Name: product_variants id; Type: DEFAULT; Schema: public; Owner: techparts_admin
--

ALTER TABLE ONLY public.product_variants ALTER COLUMN id SET DEFAULT nextval('public.product_variants_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: techparts_admin
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: techparts_admin
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: techparts_admin
--

COPY public.categories (id, name, slug, description, "createdAt", "updatedAt") FROM stdin;
2	Procesadores	procesadores	Componentes y partes de la categoría Procesadores	2026-10-19 17:05:05.099	2026-10-19 17:05:05.099
3	Tarjetas Gráficas	tarjetas-graficas	Componentes y partes de la categoría Tarjetas Gráficas	2026-10-19 17:05:05.104	2026-10-19 17:05:05.104
4	Memorias RAM	memorias-ram	Componentes y partes de la categoría Memorias RAM	2026-10-19 17:05:05.106	2026-10-19 17:05:05.106
5	Placas Base	placas-base	Componentes y partes de la categoría Placas Base	2026-10-19 17:05:05.107	2026-10-19 17:05:05.107
6	Almacenamiento	almacenamiento	Componentes y partes de la categoría Almacenamiento	2026-10-19 17:05:05.11	2026-10-19 17:05:05.11
7	Fuentes de Poder	fuentes-de-poder	Componentes y partes de la categoría Fuentes de Poder	2026-10-19 17:05:05.113	2026-10-19 17:05:05.113
\.


--
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: techparts_admin
--

COPY public.inventory_transactions (id, "productId", "variantId", type, quantity, "previousStock", "newStock", reason, reference, "createdAt") FROM stdin;
1	1	\N	IN	24	0	24	Carga inicial de inventario desde Google Sheets / CSV	MIGRACION-INICIAL-001	2026-10-19 17:05:05.123
2	2	\N	IN	18	0	18	Carga inicial de inventario desde Google Sheets / CSV	MIGRACION-INICIAL-001	2026-10-19 17:05:05.126
3	3	\N	IN	12	0	12	Carga inicial de inventario desde Google Sheets / CSV	MIGRACION-INICIAL-001	2026-10-19 17:05:05.128
4	4	\N	IN	15	0	15	Carga inicial de inventario desde Google Sheets / CSV	MIGRACION-INICIAL-001	2026-10-19 17:05:05.129
5	5	\N	IN	40	0	40	Carga inicial de inventario desde Google Sheets / CSV	MIGRACION-INICIAL-001	2026-10-19 17:05:05.131
6	6	\N	IN	25	0	25	Carga inicial de inventario desde Google Sheets / CSV	MIGRACION-INICIAL-001	2026-10-19 17:05:05.132
7	7	\N	IN	10	0	10	Carga inicial de inventario desde Google Sheets / CSV	MIGRACION-INICIAL-001	2026-10-19 17:05:05.134
8	8	\N	IN	8	0	8	Carga inicial de inventario desde Google Sheets / CSV	MIGRACION-INICIAL-001	2026-10-19 17:05:05.135
9	9	\N	IN	30	0	30	Carga inicial de inventario desde Google Sheets / CSV	MIGRACION-INICIAL-001	2026-10-19 17:05:05.136
10	10	\N	IN	35	0	35	Carga inicial de inventario desde Google Sheets / CSV	MIGRACION-INICIAL-001	2026-10-19 17:05:05.138
11	11	\N	IN	16	0	16	Carga inicial de inventario desde Google Sheets / CSV	MIGRACION-INICIAL-001	2026-10-19 17:05:05.139
12	12	\N	IN	14	0	14	Carga inicial de inventario desde Google Sheets / CSV	MIGRACION-INICIAL-001	2026-10-19 17:05:05.14
13	9	1	IN	15	0	15	Carga inicial de inventario de variante	VAR-INIT-SSD-990P-1TB	2026-10-19 18:15:20.66
14	9	2	IN	15	0	15	Carga inicial de inventario de variante	VAR-INIT-SSD-990P-2TB	2026-10-19 18:15:20.663
15	3	3	IN	7	0	7	Carga inicial de inventario de variante	VAR-INIT-GPU-4070S-STD-BLK	2026-10-19 18:15:20.666
16	3	4	IN	5	0	5	Carga inicial de inventario de variante	VAR-INIT-GPU-4070S-OC-WHT	2026-10-19 18:15:20.668
17	6	5	IN	15	0	15	Carga inicial de inventario de variante	VAR-INIT-RAM-COR-32G-BLK	2026-10-19 18:15:20.67
18	6	6	IN	10	0	10	Carga inicial de inventario de variante	VAR-INIT-RAM-COR-32G-WHT	2026-10-19 18:15:20.672
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: techparts_admin
--

COPY public.product_variants (id, "productId", sku, name, capacity, color, "modelVariant", price, "costPrice", stock, "minStock", status, "createdAt", "updatedAt") FROM stdin;
1	9	SSD-990P-1TB	Samsung 990 PRO 1TB NVMe M.2 PCIe 4.0	1TB	Negro	Standard	109.99	85.00	15	3	ACTIVE	2026-10-19 18:15:20.657	2026-10-19 18:15:20.657
2	9	SSD-990P-2TB	Samsung 990 PRO 2TB NVMe M.2 PCIe 4.0	2TB	Negro	Standard	179.99	140.00	15	3	ACTIVE	2026-10-19 18:15:20.662	2026-10-19 18:15:20.662
3	3	GPU-4070S-STD-BLK	NVIDIA RTX 4070 Super 12GB Standard Edition Negro	12GB	Negro	Standard Edition	599.99	510.00	7	2	ACTIVE	2026-10-19 18:15:20.665	2026-10-19 18:15:20.665
4	3	GPU-4070S-OC-WHT	NVIDIA RTX 4070 Super 12GB OC Edition Blanco	12GB	Blanco	OC White Edition	639.99	535.00	5	2	ACTIVE	2026-10-19 18:15:20.667	2026-10-19 18:15:20.667
5	6	RAM-COR-32G-BLK	Corsair Vengeance RGB 32GB (2x16GB) 6400MHz Negro	32GB	Negro	RGB Dual Channel Black	139.99	105.00	15	4	ACTIVE	2026-10-19 18:15:20.669	2026-10-19 18:15:20.669
6	6	RAM-COR-32G-WHT	Corsair Vengeance RGB 32GB (2x16GB) 6400MHz Blanco	32GB	Blanco	RGB Dual Channel White	144.99	110.00	10	3	ACTIVE	2026-10-19 18:15:20.671	2026-10-19 18:15:20.671
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: techparts_admin
--

COPY public.products (id, sku, name, description, brand, model, price, "costPrice", stock, "minStock", status, "hasVariants", "categoryId", "createdAt", "updatedAt") FROM stdin;
1	CPU-AMD-7800X3D	AMD Ryzen 7 7800X3D 8-Core 16-Thread	Procesador gaming tope de gama con tecnología 3D V-Cache y arquitectura Zen 4.	AMD	Ryzen 7 7800X3D	449.99	380.00	24	5	ACTIVE	f	2	2026-10-19 17:05:05.115	2026-10-19 18:15:20.636
2	CPU-INT-14700K	Intel Core i7-14700K 20-Core	Procesador de 14va generación con 20 núcleos y 28 hilos hasta 5.6 GHz.	Intel	Core i7-14700K	409.99	340.00	18	4	ACTIVE	f	2	2026-10-19 17:05:05.125	2026-10-19 18:15:20.643
4	GPU-AMD-7800XT	AMD Radeon RX 7800 XT 16GB	Tarjeta gráfica con 16GB GDDR6 para gaming 1440p fluido y alto rendimiento.	AMD	RX 7800 XT	499.99	420.00	15	3	ACTIVE	f	3	2026-10-19 17:05:05.128	2026-10-19 18:15:20.645
5	RAM-CRU-32GB-DDR5	Crucial Pro 32GB (2x16GB) DDR5 6000MHz	Kit de memoria RAM dual channel DDR5 de alta velocidad optimizado para Intel XMP y AMD EXPO.	Crucial	Pro DDR5-6000	119.99	92.00	40	8	ACTIVE	f	4	2026-10-19 17:05:05.13	2026-10-19 18:15:20.647
7	MB-ASU-B650P	ASUS TUF Gaming B650-PLUS WiFi	Placa base socket AM5 con PCIe 5.0	ASUS	TUF B650-PLUS	219.99	175.00	10	2	ACTIVE	f	5	2026-10-19 17:05:05.133	2026-10-19 18:15:20.649
8	MB-MSI-Z790P	MSI PRO Z790-A MAX WiFi	Placa base ATX LGA 1700 compatible con procesadores Intel Core 12va a 14va generación.	MSI	PRO Z790-A	239.99	190.00	8	2	ACTIVE	f	5	2026-10-19 17:05:05.134	2026-10-19 18:15:20.651
10	SSD-KNG-KC3000-1TB	Kingston KC3000 1TB PCIe 4.0 NVMe	SSD NVMe M.2 de alto rendimiento para creadores de contenido y entusiastas.	Kingston	KC3000 1TB	94.99	72.00	35	6	ACTIVE	f	6	2026-10-19 17:05:05.137	2026-10-19 18:15:20.653
11	PSU-COR-RM850X	Corsair RM850x 850W 80 Plus Gold Modular	Fuente de alimentación totalmente modular con condensadores 100% japoneses y certificación 80 Plus Gold.	Corsair	RM850x	149.99	115.00	16	4	ACTIVE	f	7	2026-10-19 17:05:05.138	2026-10-19 18:15:20.654
12	PSU-SEA-GX750	Seasonic Focus GX-750 750W 80+ Gold	Fuente de alimentación compacta de 750W con ventilador Fluid Dynamic Bearing silencioso.	Seasonic	Focus GX-750	129.99	98.00	14	3	ACTIVE	f	7	2026-10-19 17:05:05.14	2026-10-19 18:15:20.655
9	SSD-SAM-990P-2TB	Samsung 990 PRO 2TB NVMe M.2 SSD	Unidad de estado sólido PCIe Gen 4.0 con velocidades de lectura de hasta 7450 MB/s.	Samsung	990 PRO 2TB	179.99	140.00	30	5	ACTIVE	t	6	2026-10-19 17:05:05.136	2026-10-19 18:15:20.664
3	GPU-NV-4070S	NVIDIA GeForce RTX 4070 Super 12GB	Tarjeta gráfica con arquitectura Ada Lovelace y soporte DLSS 3.5.	NVIDIA	RTX 4070 Super	599.99	510.00	12	3	ACTIVE	t	3	2026-10-19 17:05:05.127	2026-10-19 18:15:20.668
6	RAM-COR-32GB-RGB	Corsair Vengeance RGB 32GB DDR5 6400MHz	Memoria RAM DDR5 premium con iluminación RGB personalizable por software iCUE.	Corsair	Vengeance RGB DDR5	139.99	105.00	25	6	ACTIVE	t	4	2026-10-19 17:05:05.131	2026-10-19 18:15:20.672
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: techparts_admin
--

COPY public.users (id, email, name, role, "createdAt", "updatedAt") FROM stdin;
1	admin@techparts.com	Administrador Principal	ADMIN	2026-10-19 17:05:05.074	2026-10-19 17:05:05.074
2	operador@techparts.com	Operador de Almacén	OPERATOR	2026-10-19 17:05:05.089	2026-10-19 17:05:05.089
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techparts_admin
--

SELECT pg_catalog.setval('public.categories_id_seq', 10, true);


--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techparts_admin
--

SELECT pg_catalog.setval('public.inventory_transactions_id_seq', 126, true);


--
-- Name: product_variants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techparts_admin
--

SELECT pg_catalog.setval('public.product_variants_id_seq', 9, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techparts_admin
--

SELECT pg_catalog.setval('public.products_id_seq', 33, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: techparts_admin
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: techparts_admin
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: techparts_admin
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: techparts_admin
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: techparts_admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: techparts_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: categories_name_key; Type: INDEX; Schema: public; Owner: techparts_admin
--

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);


--
-- Name: categories_slug_key; Type: INDEX; Schema: public; Owner: techparts_admin
--

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);


--
-- Name: inventory_transactions_productId_idx; Type: INDEX; Schema: public; Owner: techparts_admin
--

CREATE INDEX "inventory_transactions_productId_idx" ON public.inventory_transactions USING btree ("productId");


--
-- Name: inventory_transactions_type_idx; Type: INDEX; Schema: public; Owner: techparts_admin
--

CREATE INDEX inventory_transactions_type_idx ON public.inventory_transactions USING btree (type);


--
-- Name: inventory_transactions_variantId_idx; Type: INDEX; Schema: public; Owner: techparts_admin
--

CREATE INDEX "inventory_transactions_variantId_idx" ON public.inventory_transactions USING btree ("variantId");


--
-- Name: product_variants_productId_idx; Type: INDEX; Schema: public; Owner: techparts_admin
--

CREATE INDEX "product_variants_productId_idx" ON public.product_variants USING btree ("productId");


--
-- Name: product_variants_sku_idx; Type: INDEX; Schema: public; Owner: techparts_admin
--

CREATE INDEX product_variants_sku_idx ON public.product_variants USING btree (sku);


--
-- Name: product_variants_sku_key; Type: INDEX; Schema: public; Owner: techparts_admin
--

CREATE UNIQUE INDEX product_variants_sku_key ON public.product_variants USING btree (sku);


--
-- Name: products_brand_idx; Type: INDEX; Schema: public; Owner: techparts_admin
--

CREATE INDEX products_brand_idx ON public.products USING btree (brand);


--
-- Name: products_categoryId_idx; Type: INDEX; Schema: public; Owner: techparts_admin
--

CREATE INDEX "products_categoryId_idx" ON public.products USING btree ("categoryId");


--
-- Name: products_sku_idx; Type: INDEX; Schema: public; Owner: techparts_admin
--

CREATE INDEX products_sku_idx ON public.products USING btree (sku);


--
-- Name: products_sku_key; Type: INDEX; Schema: public; Owner: techparts_admin
--

CREATE UNIQUE INDEX products_sku_key ON public.products USING btree (sku);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: techparts_admin
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: inventory_transactions inventory_transactions_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techparts_admin
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT "inventory_transactions_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inventory_transactions inventory_transactions_variantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techparts_admin
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT "inventory_transactions_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_variants product_variants_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techparts_admin
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: techparts_admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict rVaHvJeW8fHPMh8Y3m02LzUDZoXursGAeO37YeWy3YrLLr7sKHvxHE4HYhjrd5i


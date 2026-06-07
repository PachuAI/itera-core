# Sistema Gestión Jurídico RER — Información útil rescatada

- **Fuente**: MySQL `sistema_juridico_db` (container `itera-modern-mysql-databases`, UUID `fow0gsgw4cgksogc40ogsg4o`) en VPS `65.108.148.79`.
- **Stack original**: Fork de Rise CRM personalizado para estudio jurídico argentino (`sistgest_*`). Subdominio público: `gestion.rerestudiojuridico.com`.
- **Fecha del extract**: 2026-05-22.
- **Decisión**: el sistema queda decomisionado. Los clientes ya están en iteralex. Este reporte rescata lo que vale la pena tener registrado antes de borrar.
- **Eventos de calendario (570) y tareas (35): descartados** por instrucción del usuario — son audiencias/pericias sueltas viejas, sin valor migrable. (Los 23 events que parecían vinculados a clientes eran demo seed del template Rise CRM, todos `deleted=1`, apuntando a `client_id` 1-15 que no existen.)

## Archivos del backup

```text
backups/rer-mysql-2026-05-22/
├── mysql-all-databases-2026-05-22.sql.gz    # dump COMPLETO de todas las DBs MySQL del container (957 KB) — fuente de verdad
├── sistema_juridico_db-2026-05-22.sql       # dump SOLO de la DB del estudio (652 KB) — listo para re-importar si hace falta
├── clients.tsv                              # 121 personas (leads + clientes) — usado para este reporte
├── notes.tsv                                # 32 notas — usado para este reporte
├── projects.tsv                             # 36 casos abiertos — usado para este reporte
├── users.tsv                                # 4 staff (admin + 3 abogados)
├── events.tsv                               # 570 eventos de calendario — NO usado (descartado)
├── tasks.tsv                                # 35 tareas — NO usado (descartado)
├── lead_status.tsv                          # lookup
├── lead_source.tsv                          # lookup
└── project_status.tsv                       # lookup
```

SHA256:

- `mysql-all-databases-2026-05-22.sql.gz`: `dd369b2b725af29ed5d548d46ff9b797e617db212cc0abcfb56709e1519577cc`
- `sistema_juridico_db-2026-05-22.sql`: `f08e4ba7bbbecec6950428b27af91bfc45d654073088f1f04c9b79606c9d9cc2`

## TL;DR

- **119 personas activas** = **55 leads** (consultas no convertidas) + **64 clientes** (consultas convertidas).
- **36 casos abiertos** con etapas procesales argentinas.
- **32 notas sustantivas** asociadas a clientes/proyectos.
- **4 staff**: 1 admin (ÍTERA Gestión) + 3 abogados (Ezequiel Echeverría, Fernando Ramoa, Matías Julián Rubio).

> **Sobre leads**: en este CRM los leads viven en la misma tabla `sistgest_clients` con `is_lead=1`. Cuando se convierten en cliente, el flag pasa a `0` y `lead_status_id=5` ("Presupuesto aceptado. Cliente nuevo."). Por eso no aparece tabla "leads" separada.

## Staff (4 usuarios)

| id | first_name | last_name | email | job_title | status | last_online |
|---|---|---|---|---|---|---|
| 1 | ÍTERA | Gestión | gulianoditommaso23@gmail.com | Admin | active | 2026-05-22 04:20:08 |
| 13 | Ezequiel | Echeverría | ezequielecheverria@gmail.com | Abogado | active | 2026-04-12 18:48:39 |
| 14 | Fernando | Ramoa | fernandoramoa@gmail.com | Abogado | active | 2026-02-23 22:30:13 |
| 15 | Matías Julián | Rubio | matiasrubio@gmail.com | Abogado | active | 2026-01-12 15:48:01 |

## Pipeline de leads (56) — distribución

**Por estado:**

| lead_status | count |
|---|---|
| Nueva consulta agendada | 45 |
| Presupuesto enviado | 5 |
| Archivado. No pasó a cliente. | 2 |
| Presupuesto aceptado. Cliente nuevo. | 2 |
| Es necesario una 2da consulta | 1 |

**Por fuente:**

| lead_source | count |
|---|---|
| Google | 47 |
| Referido por  alguien | 8 |

**Por abogado dueño:**

| owner | count |
|---|---|
| Ezequiel Echeverría | 36 |
| Fernando Ramoa | 11 |
| Matías Julián Rubio | 8 |

## Clientes (65) — distribución

**Por abogado dueño:**

| owner | count |
|---|---|
| Ezequiel Echeverría | 43 |
| Matías Julián Rubio | 15 |
| Fernando Ramoa | 4 |
| ÍTERA Gestión | 2 |

**Por fuente original (cuando quedó registrada):**

| lead_source | count |
|---|---|
| (sin valor) | 49 |
| Google | 12 |
| Referido por  alguien | 3 |

## Leads — listado completo

56 personas que consultaron pero no se convirtieron en cliente. Ordenado por fecha de consulta.

| created_date | company_name | dni | phone | email | lead_source | lead_status | owner |
|---|---|---|---|---|---|---|---|
| 2025-08-04 22:27:13 | Alexis Pereira |  |  |  | Referido por  alguien | Presupuesto enviado | Ezequiel Echeverría |
| 2025-08-06 12:08:27 | RICHARD IRVIN |  |  |  | Google | Presupuesto enviado | Fernando Ramoa |
| 2025-08-06 21:08:41 | Bonfanti Gustavo |  |  |  | Google | Es necesario una 2da consulta | Ezequiel Echeverría |
| 2025-08-08 22:32:20 | Noelia Chirino |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-08-08 23:08:30 | Ofak Silvia |  |  |  | Google | Nueva consulta agendada | Matías Julián Rubio |
| 2025-08-08 23:53:19 | Paula Duro |  | 2984698814 |  | Referido por  alguien | Presupuesto enviado | Matías Julián Rubio |
| 2025-08-12 20:16:14 | Rosa Graciela CAIMAPO |  | 2984701741 |  | Google | Nueva consulta agendada | Fernando Ramoa |
| 2025-08-12 21:49:15 | FRITZ Camila y LOPEZ Julian |  | 2995966471 |  | Google | Nueva consulta agendada | Fernando Ramoa |
| 2025-08-13 13:25:05 | Juan Pablo Gonzalez |  | 2984400911 |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-08-20 15:09:52 | Daniel Chirino |  |  |  | Google | Presupuesto enviado | Ezequiel Echeverría |
| 2025-08-21 20:37:42 | Adriana Mencetti |  |  |  | Google | Archivado. No pasó a cliente. | Ezequiel Echeverría |
| 2025-08-21 20:52:24 | Adriana |  |  |  | Referido por  alguien | Nueva consulta agendada | Matías Julián Rubio |
| 2025-08-22 14:08:11 | Delia Ζabala |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-08-25 21:49:51 | GENOUD JAVIER Y FERNANDO |  | 2984665111 |  | Google | Nueva consulta agendada | Fernando Ramoa |
| 2025-08-25 23:08:25 | Sebastián Jonathan Paredes |  |  |  | Google | Nueva consulta agendada | Matías Julián Rubio |
| 2025-08-26 21:07:04 | Susana Contreras |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-08-27 12:34:19 | Carolina Tejerina |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-08-27 22:11:31 | Jonathan Suare |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-09-01 22:02:03 | Burgos Angelo |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-09-01 22:13:32 | Sharon Medhi |  |  |  | Google | Nueva consulta agendada | Matías Julián Rubio |
| 2025-09-03 22:00:26 | Karina Alonso |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-09-03 23:24:21 | Eduardo |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-09-04 13:55:55 | Rodrigo Bahamonde |  |  |  | Google | Archivado. No pasó a cliente. | Ezequiel Echeverría |
| 2025-09-04 21:33:54 | Diana Cisneros |  |  |  | Referido por  alguien | Nueva consulta agendada | Matías Julián Rubio |
| 2025-09-09 19:05:16 | Ramon Barrera |  |  |  | Google | Presupuesto aceptado. Cliente nuevo. | Ezequiel Echeverría |
| 2025-09-10 12:56:12 | Rodrigo Pacheco |  |  |  | Google | Presupuesto aceptado. Cliente nuevo. | Ezequiel Echeverría |
| 2025-09-10 20:05:25 | Paola Jara |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-09-24 21:17:16 | Andres Torres |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-10-03 21:22:44 | Pedro Constanzo |  | 298-4637519 |  | Referido por  alguien | Nueva consulta agendada | Fernando Ramoa |
| 2025-10-07 17:46:05 | Kazmer Jose Marcelo |  | 2994620671 |  | Google | Nueva consulta agendada | Fernando Ramoa |
| 2025-10-15 20:28:49 | Laura Yanina Izquierdo |  | 2984757793 |  | Google | Nueva consulta agendada | Fernando Ramoa |
| 2025-10-23 22:13:13 | CABEZAS JUAN |  |  |  | Google | Nueva consulta agendada | Fernando Ramoa |
| 2025-10-27 11:12:09 | Bianchetti Lautar |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-10-27 11:54:55 | Pablo Limonao |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-10-30 22:57:59 | Jeison Julian Salgado Cardenas |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-11-07 20:12:56 | Matias Gioscio | 24941094 | 2984575017 |  | Google | Nueva consulta agendada | Fernando Ramoa |
| 2025-11-12 21:48:08 | German Hernesto Maldonado | 16862670 | 2984349033 |  | Referido por  alguien | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-11-14 22:02:43 | Maria Jesus Alvarez | 27201747 | 1162524484 |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-11-18 22:18:43 | María Eugenia Cerutti |  |  |  | Referido por  alguien | Nueva consulta agendada | Matías Julián Rubio |
| 2025-11-20 22:09:59 | Melani Domingo | 10595516 | 15664664 |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-11-21 13:40:58 | Facundo Soto |  |  |  | Referido por  alguien | Nueva consulta agendada | Matías Julián Rubio |
| 2025-12-03 21:05:25 | Candela Virgina Gazagne | 45208232 | 2984283883 |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-12-03 21:35:55 | Claudia Kisiñovsky | 18218162 | 2984532597 |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-12-04 22:04:50 | Celia Mabel Zurita | 20047555 | 2984930567 |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-12-05 21:52:03 | Federico La rosa |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-12-09 23:07:46 | Leandro Omar Lamborizio | 28706341 | 299554596984 |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-12-10 21:10:39 | Maria Belen Garcia |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-12-15 21:25:35 | Alicia Isabel Diomedi |  |  |  | Google | Presupuesto enviado | Ezequiel Echeverría |
| 2025-12-29 22:14:25 | Fabiana Rebolledo |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2025-12-30 23:41:42 | GARCIA HENRRIQUEZ Carla Rocío |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2026-01-12 20:30:40 | Martin Ezequiel Leiva | 4807491 |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2026-01-14 15:59:34 | Vallejos Mario |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2026-01-19 22:15:16 | FEDERICO PABLO DURAND |  |  |  | Google | Nueva consulta agendada | Fernando Ramoa |
| 2026-01-22 13:27:24 | Layla Yasmine Nasser |  |  |  | Google | Nueva consulta agendada | Ezequiel Echeverría |
| 2026-02-23 20:58:44 | Ajandra Paredes |  |  |  | Google | Nueva consulta agendada | Fernando Ramoa |

## Clientes — listado completo

65 personas que se convirtieron en cliente. Ordenado por fecha de alta.

| created_date | company_name | dni | cuit_cuil | phone | email | city | lead_source | owner |
|---|---|---|---|---|---|---|---|---|
| 2025-08-06 12:07:19 | RICHARD IRVIN |  |  |  |  | Rosario |  | Ezequiel Echeverría |
| 2025-08-06 16:21:44 | Echeverria Adrian Reinaldo |  |  | 2984522184 |  | Villa Regina |  | Ezequiel Echeverría |
| 2025-08-06 20:35:32 | Gustavo Bonfanti |  |  |  |  |  |  | Ezequiel Echeverría |
| 2025-08-08 23:03:11 | Fuentealba Liana Monica |  |  |  |  |  |  | Ezequiel Echeverría |
| 2025-08-08 23:03:37 | Garat Luis Omar |  |  |  |  |  |  | Matías Julián Rubio |
| 2025-08-08 23:04:41 | Acuña Rosa Isabel |  |  |  |  |  |  | Ezequiel Echeverría |
| 2025-08-08 23:04:59 | Alzogaray Gustavo Guillermo |  |  |  |  |  |  | Ezequiel Echeverría |
| 2025-08-08 23:05:13 | Buscemi Patricia Haydee |  |  |  |  |  |  | Matías Julián Rubio |
| 2025-08-08 23:05:28 | Gomez Bello Maria Florencia |  |  |  |  |  |  | Matías Julián Rubio |
| 2025-08-08 23:05:38 | Patricia Bonsanto |  |  |  |  |  |  | Matías Julián Rubio |
| 2025-08-08 23:05:54 | Garcia Maria Beatriz |  |  |  |  |  |  | Matías Julián Rubio |
| 2025-08-08 23:06:22 | Kacem Zulma Fabiana |  |  |  |  |  |  | Matías Julián Rubio |
| 2025-08-08 23:06:36 | Milanesi Nela Yolanda |  |  |  |  |  |  | Matías Julián Rubio |
| 2025-08-08 23:06:55 | Castro Omar |  |  |  |  |  |  | Matías Julián Rubio |
| 2025-08-08 23:07:29 | Aguero Alejandra Noemí |  |  |  |  |  |  | Ezequiel Echeverría |
| 2025-08-08 23:07:49 | Acuña Maria Elizabeth |  |  |  |  |  |  | Matías Julián Rubio |
| 2025-08-08 23:07:59 | Tolosa Carlos |  |  |  |  |  |  | Matías Julián Rubio |
| 2025-08-08 23:09:51 | Levin Clara del Carmen |  |  |  |  |  |  | Matías Julián Rubio |
| 2025-08-10 15:45:07 | Araya Albano Andres |  |  | 2984748213 |  |  |  | Ezequiel Echeverría |
| 2025-08-13 20:15:18 | Fernandez Pelliza Agustin |  |  | 3534018009 |  | Vicuña Mackena |  | Ezequiel Echeverría |
| 2025-08-14 15:18:11 | YANCOVICH JOSE LUIS |  |  | 2984549414 |  |  |  | Ezequiel Echeverría |
| 2025-08-14 15:19:27 | Nicolas Anaya |  |  | 2984376570 |  |  |  | Ezequiel Echeverría |
| 2025-08-14 15:21:29 | Raul San Martin |  |  | 2984143748 |  |  |  | Ezequiel Echeverría |
| 2025-08-18 13:06:31 | Brandani Jorge |  |  | 2994537256 |  |  |  | Ezequiel Echeverría |
| 2025-08-22 15:32:29 | Martín Leyva |  |  |  |  |  |  | Matías Julián Rubio |
| 2025-08-25 22:44:47 | Ailén Pérez |  |  | 29848578142 |  | General Roca |  | Matías Julián Rubio |
| 2025-08-27 20:32:22 | Sanhueza Alicia |  |  | 2994124241 |  |  |  | Ezequiel Echeverría |
| 2025-08-29 00:30:42 | Mendinueta Claudio Angel |  |  | 2984 33-9274 (silvia |  |  |  | Ezequiel Echeverría |
| 2025-08-29 01:04:50 | VICTORIANO JONATHAN CHRISTOFER |  |  |  |  |  |  | Fernando Ramoa |
| 2025-09-01 17:05:58 | REBOLLEDO MIRTHA VERONICA |  |  |  |  |  |  | Ezequiel Echeverría |
| 2025-09-01 17:22:42 | ACUÑA LAGOS MILCA GLORIA |  |  | 2996734147 |  |  |  | Ezequiel Echeverría |
| 2025-09-14 22:17:45 | Alvarez Jessica Daiana |  |  | 2995730987 |  |  |  | Ezequiel Echeverría |
| 2025-09-22 12:46:13 | Bilinski Mariela |  |  |  |  |  |  | Ezequiel Echeverría |
| 2025-09-22 12:46:13 | Bilinski Mariela |  |  |  |  |  |  | Ezequiel Echeverría |
| 2025-09-28 23:19:47 | Mariu Fernando |  |  |  |  |  |  | Ezequiel Echeverría |
| 2025-10-02 12:42:58 | Marcos Alfredo Fábrega |  |  | 2996013090 |  | General Roca |  | Matías Julián Rubio |
| 2025-10-22 21:48:20 | Andres Berra |  |  |  |  |  | Google | Ezequiel Echeverría |
| 2025-10-23 13:50:27 | Catania Fabian |  |  |  |  |  | Google | Ezequiel Echeverría |
| 2025-10-23 23:24:42 | Anibal Rodriguez |  |  |  |  |  |  | Ezequiel Echeverría |
| 2025-10-30 22:38:03 | Jeison Julian Salgado Cardenas |  |  |  |  |  |  | Ezequiel Echeverría |
| 2025-10-31 01:10:45 | Cliente Test |  |  |  |  |  |  | ÍTERA Gestión |
| 2025-10-31 02:27:41 | Cliente Test 2 |  |  |  |  |  |  | ÍTERA Gestión |
| 2025-11-04 15:19:16 | Pedro Aviles |  |  |  |  |  |  | Ezequiel Echeverría |
| 2025-11-10 15:26:25 | Fernando Rossaroli |  |  |  |  |  | Referido por  alguien | Ezequiel Echeverría |
| 2025-11-10 22:45:26 | Emily Alvarado | 95811748 |  | 2944962493 |  | General Roca | Google | Fernando Ramoa |
| 2025-11-18 12:45:57 | Cecive Beatriz |  |  |  |  |  |  | Ezequiel Echeverría |
| 2025-11-18 12:52:52 | Ockier Miriam |  |  | 2984 245323 |  | General Roca |  | Ezequiel Echeverría |
| 2025-11-19 23:05:55 | Morales Agustin | 35355235 |  |  |  | Neuquen | Google | Ezequiel Echeverría |
| 2025-11-20 16:34:29 | VERONESI SABRINA |  |  | 2984 79-0019 |  | VILLA REGINA |  | Ezequiel Echeverría |
| 2025-11-20 16:42:46 | Olivero Natalia |  |  | 2984 35-9710 |  | VIlla Regina |  | Ezequiel Echeverría |
| 2025-11-20 21:24:20 | Diego Jose Salgado | 40707633 |  | 2984413225 |  | General Roca | Google | Ezequiel Echeverría |
| 2025-11-20 21:37:33 | Iñaki Castro | 41232296 |  | 2984746174 |  | General Roca | Google | Ezequiel Echeverría |
| 2025-11-26 10:56:09 | Paula Abril Olivera Oro | 42967946 |  | 2975077342 |  | General Roca | Referido por  alguien | Matías Julián Rubio |
| 2025-11-26 21:09:20 | Angel Pichiñan |  |  | 2984776968 |  |  | Google | Ezequiel Echeverría |
| 2025-11-27 15:56:15 | YAÑEZ CECILIA |  |  |  |  | PLOTTIER |  | Fernando Ramoa |
| 2025-12-03 20:32:32 | Lucas Martin | 28637264 |  | 2996 34-7297 |  |  | Google | Ezequiel Echeverría |
| 2025-12-05 14:15:57 | Scorolli Claudio Alejandro |  |  | 2984901084 |  |  |  | Ezequiel Echeverría |
| 2025-12-09 14:38:31 | Huentemil Luciano |  |  | 2984 76-0936 |  |  |  | Ezequiel Echeverría |
| 2025-12-10 23:28:16 | Mariela Morandi |  |  |  |  |  | Google | Ezequiel Echeverría |
| 2025-12-12 22:23:14 | Monica Garcia |  |  | 2994 55-5319 |  |  | Google | Ezequiel Echeverría |
| 2025-12-13 18:44:34 | ROMAN RAUL MARCELO | -- | -- | +54 9 2984 73-7360 |  | ALLEN | Referido por  alguien | Fernando Ramoa |
| 2025-12-29 13:55:29 | Dario Ezequiel Peralta | 40995223 |  |  |  |  | Google | Ezequiel Echeverría |
| 2026-01-22 13:17:36 | Luis Escobar |  |  |  |  |  | Google | Ezequiel Echeverría |
| 2026-02-02 22:42:34 | Pizarro Adan |  |  |  |  |  |  | Ezequiel Echeverría |

## Casos abiertos (`sistgest_projects`)

36 casos asociados a clientes con su etapa procesal.

| created_date | title | client_name | client_dni | status_name | project_type | start_date | deadline | created_by_user |
|---|---|---|---|---|---|---|---|---|
| 2025-08-06 | Bonfanti s/ prescripcion | Gustavo Bonfanti |  | Etapa Inicial / Demanda | client_project | 2025-08-06 |  | Ezequiel Echeverría |
| 2025-08-08 | Fuentealba Liana Monica c/ ANSES s/ TOPE ART. 9 | Fuentealba Liana Monica |  | Etapa Inicial / Demanda | client_project | 2025-04-06 |  | Ezequiel Echeverría |
| 2025-08-08 | FUENTES FRANCISCO JAVIER C/ GALENO ART S.A. S/ENFERMEDAD PROFESIONAL … | Echeverria Adrian Reinaldo |  | Archivado | client_project | 2025-08-08 |  | Ezequiel Echeverría |
| 2025-08-08 | ALZOGARAY GUSTAVO GUILLERMO C/ ANSES S/ REAJUSTE DE HABERES | Alzogaray Gustavo Guillermo |  | Etapa Inicial / Demanda | client_project | 2025-06-01 |  | Ezequiel Echeverría |
| 2025-08-08 | ALZOGARAY GUSTAVO GUILLERMO C/ ARCA S/ AMPARO GANANCIAS | Alzogaray Gustavo Guillermo |  | Etapa Inicial / Demanda | client_project | 2025-06-01 |  | Ezequiel Echeverría |
| 2025-08-08 | ACUÑA ROSA ISABEL C/ ARCA S/ AMPARO GANANCIAS | Acuña Rosa Isabel |  | Etapa Inicial / Demanda | client_project | 2025-07-01 |  | Ezequiel Echeverría |
| 2025-08-08 | ACUÑA, ROSA ISABEL c/ ADMINISTRACIÓN NACIONAL DE LA SEGURIDAD SOCIAL … | Acuña Rosa Isabel |  | Etapa Inicial / Demanda | client_project | 2025-06-12 |  | Ezequiel Echeverría |
| 2025-08-08 | GARAT, LUIS OMAR C/ AGENCIA DE RECAUDACION Y CONTROL ADUANERO (ARCA-E… | Garat Luis Omar |  | Etapa Inicial / Demanda | client_project | 2025-07-01 |  | Ezequiel Echeverría |
| 2025-08-10 | ARAYA ALBANO ANDRES C CHILINDRON | Araya Albano Andres |  | Etapa Inicial / Demanda | client_project | 2025-08-10 |  | Ezequiel Echeverría |
| 2025-08-13 | Fernández Pelliza Agustín c/ López Raúl Andrés s/ Cumplimiento contra… | Fernandez Pelliza Agustin |  | Etapa Inicial / Demanda | client_project | 2025-06-11 |  | Ezequiel Echeverría |
| 2025-08-13 | Fernández Pelliza Agustín c/ López Raúl Andrés s/ Cumplimiento contra… | Fernandez Pelliza Agustin |  | Etapa Inicial / Demanda | client_project | 2025-06-11 |  | Ezequiel Echeverría |
| 2025-08-18 | ALBORNOZ, YESSICA NATALIA Y/ BRANDANI, JORGE ANTONIO S/ MEDIACIÓN PRE… | Brandani Jorge |  | Etapa Inicial / Demanda | client_project | 2025-08-13 |  | Ezequiel Echeverría |
| 2025-08-27 | SANHUEZA ALICIA DEL CARMEN C/ FEDERACION PATRONAL SEGUROS S. A. U.  S… | Sanhueza Alicia |  | Etapa Inicial / Demanda | client_project | 2025-01-15 |  | Ezequiel Echeverría |
| 2025-08-29 | MENDINUETA, CLAUDIO ANGEL Y/ PIRE RAYEN AUTOMOTORES S.A. Y OTROS S/ M… | Mendinueta Claudio Angel |  | Etapa Inicial / Demanda | client_project | 2025-03-12 |  | Ezequiel Echeverría |
| 2025-08-29 | VICTORIANO JONATHAN CHRISTOFER S/ BENEFICIO DE LITIGAR SIN GASTOS | VICTORIANO JONATHAN CHRISTOFER |  | Etapa Inicial / Demanda | client_project | 2024-12-05 |  | Ezequiel Echeverría |
| 2025-09-01 | REBOLLEDO MIRTHA VERONICA C/ SOL DEL PLATA EMPRESA CONSTRUCTORA S.A. … | REBOLLEDO MIRTHA VERONICA |  | Etapa Inicial / Demanda | client_project | 2025-04-08 |  | Ezequiel Echeverría |
| 2025-09-01 | ACUÑA LAGOS MILCA GLORIA C/ VIVIENDAS ARGENTINAS S.R.L. S/ DESPIDO | ACUÑA LAGOS MILCA GLORIA |  | Etapa Inicial / Demanda | client_project | 2025-06-30 |  | Ezequiel Echeverría |
| 2025-09-14 | ALVAREZ, JESSICA DAIANA C/ LA SEGUNDA ART S.A. S/ ACCIDENTE DE TRABAJO | Alvarez Jessica Daiana |  | Etapa Inicial / Demanda | client_project | 2025-01-01 |  | Ezequiel Echeverría |
| 2025-09-14 | SANHUEZA ALICIA DEL CARMEN C/ LA NACIONAL SRL S/ ORDINARIO (RECLAMO L… | Sanhueza Alicia |  | Etapa Inicial / Demanda | client_project |  |  | Ezequiel Echeverría |
| 2025-09-14 | ALVAREZ JESSICA DAIANA C/ LA NACIONAL SRL S/ ORDINARIO (RECLAMO LEY D… | Alvarez Jessica Daiana |  | Etapa Inicial / Demanda | client_project | 2025-01-01 |  | Ezequiel Echeverría |
| 2025-09-28 | MARIU, FERNANDO CESAR Y/ GESTIONES COMERCIALES FLEX SAS | Mariu Fernando |  | Etapa Inicial / Demanda | client_project | 2025-06-01 |  | Ezequiel Echeverría |
| 2025-10-31 | Causa Test | Cliente Test |  | Etapa Inicial / Demanda | client_project | 2025-10-30 |  | ÍTERA Gestión |
| 2025-10-31 | Causa Test 2 | Cliente Test 2 |  | Etapa Inicial / Demanda | client_project |  |  | ÍTERA Gestión |
| 2025-11-18 | OCKIER GASTON EDGARDO S/ SUCESION AB-INTESTATO | Ockier Miriam |  | Etapa Inicial / Demanda | client_project | 2025-10-23 |  | Ezequiel Echeverría |
| 2025-11-26 | TELLO, ANGELICA ALEJANDRA Y/ OLIVERO, NATALIA SOLEDAD S/ MEDIACIÓN PR… | Olivero Natalia |  | Etapa Inicial / Demanda | client_project | 2025-10-07 |  | Ezequiel Echeverría |
| 2025-11-27 | REY VICTOR ANIBAL S/ SUCESION AB INTESTATO | YAÑEZ CECILIA |  | Etapa Inicial / Demanda | client_project | 2025-11-27 |  | Fernando Ramoa |
| 2025-12-02 | Berra Andres C Klein Raul | Andres Berra |  | Etapa Inicial / Demanda | client_project | 2025-11-11 |  | Ezequiel Echeverría |
| 2025-12-04 | Pichiñan Angel C/ Fundacion mi hogar s/ despido | Angel Pichiñan |  | Etapa Inicial / Demanda | client_project |  |  | Ezequiel Echeverría |
| 2025-12-04 | Petro Rio SA c/ Caverzan y otros s/ Simulacion | VERONESI SABRINA |  | Etapa Inicial / Demanda | client_project |  |  | Ezequiel Echeverría |
| 2025-12-04 | Morales Agustin c/ Fiat | Morales Agustin | 35355235 | Etapa Inicial / Demanda | client_project | 2025-12-04 |  | Ezequiel Echeverría |
| 2025-12-05 | Scorolli Claudio Alejandro c/ Seguridad Ramos | Scorolli Claudio Alejandro |  | Etapa Inicial / Demanda | client_project |  |  | Ezequiel Echeverría |
| 2025-12-05 | Catania C/ Luengo, ambroggio | Catania Fabian |  | Etapa Inicial / Demanda | client_project |  |  | Ezequiel Echeverría |
| 2025-12-09 | Morales Agustin C/ Rey Lucia Belen | Morales Agustin | 35355235 | Etapa Inicial / Demanda | client_project | 2025-11-28 |  | Ezequiel Echeverría |
| 2025-12-09 | Huentemil Oscar Luciano C/ Seguridad Ramos | Huentemil Luciano |  | Etapa Inicial / Demanda | client_project | 2025-10-21 |  | Ezequiel Echeverría |
| 2025-12-13 | MONTIVERO ROBERTO OSCAR C/ MUNIC DE ALLEN, ROMAN, MARIN Y CANDIA S/ C… | ROMAN RAUL MARCELO | -- | Etapa Inicial / Demanda | client_project | 2025-12-13 |  | Fernando Ramoa |
| 2025-12-23 | Martin Lucas C/ La Caja | Lucas Martin | 28637264 | Etapa Inicial / Demanda | client_project |  |  | Ezequiel Echeverría |

## Notas (32) — contenido sustantivo de las consultas

Lo que registraron los abogados sobre cada cliente/caso. Ordenado por fecha.

| created_at | client_name | title | description | created_by_user |
|---|---|---|---|---|
| 2025-10-03 21:46:55 | Pedro Constanzo | EL SEGURO LO ACUSA DE FALSA DECLARACION | El seguro lo llamo el martes 30 de sep. a las 17hs, su seguro es La Mercantil Andina, me llamo el abogado del seguro, y me fue preguntando como pasar… | Fernando Ramoa |
| 2025-10-07 19:08:12 | Kazmer Jose Marcelo | CONSULTA POR DEFRAUDACION A LA ADM PUBLICA | Traumatologo, 14 años, Medicina en corrientes, es de formosa, estudiaste en buenos aires  Hace 8 años que presto servicios para PAMI  Nunca me hicier… | Fernando Ramoa |
| 2025-10-08 22:41:09 | Bonfanti Gustavo | Consulta 08/10 | VW, pagó 30 cuotas y cuando terminó sólo le pagaron el 25% del valor total    Nos pidio presupuesto para una mediacion en la sucesion    Rentas: Nos … | Ezequiel Echeverría |
| 2025-10-15 20:48:15 | Laura Yanina Izquierdo | Consulta por Robo de domicilio y auto | El 10 de octubre concurrio a mi domicilio el Sr. Quilodran.... (ver texto de denuncia)  Me entrego una calcomania de ALARMA (no tengo alarma)  Entrar… | Fernando Ramoa |
| 2025-10-22 21:56:37 | Andres Berra | Consulta | Trabajaba para una persona en Junin, solo para él hace un año y medio.   Le pagaban $800.000 por viaje, y le hacia aproximadamente 4 viajes por mes  … | Ezequiel Echeverría |
| 2025-10-23 22:23:20 | CABEZAS JUAN | mediacion por comunicacion y alimentos | Angeles Torres. Relacion de pareja por 7 meses. Finalizo hace un mes. Fin absoluto. Tiene un hijo en camino. Producto de la separacion, es que tu ex … | Fernando Ramoa |
| 2025-10-23 23:37:37 | Anibal Rodriguez | Primer consulta | La ex mujer le esta pagando una cuota alimentaria del 25% de su sueldo. El tiene 15 recien cumplido  Al momento de hacer el acuerdo no veia a su hijo… | Ezequiel Echeverría |
| 2025-10-27 11:28:58 | Bianchetti Lautar | Consulta 27/10 | A lsa 17:30, tenia una entrevista de laburo a las 18, en Damas Patricia y Evita. El iba sobre Evita, el camion estaba eseprando el semaforo, y cuando… | Ezequiel Echeverría |
| 2025-10-27 12:06:14 | Pablo Limonao | Consulta | Tuvo un accidente el 04/10, cruzó por la evita la intrseccio de damas patricias. Y cruzo en frente de la carniceria una señora corriendo y la chocó. … | Ezequiel Echeverría |
| 2025-10-30 23:02:48 | Jeison Julian Salgado Cardenas | Primer consulta | El compra planes de ahorros,, paga lo que falta, saca el auto y lo revende.  El ahora le compró una Citroën 2011, le dio 7.000.000, le dio un precio … | Ezequiel Echeverría |
| 2025-11-07 20:58:34 | Matias Gioscio | Consulta de causa penal y sumario administrativo docente | Docente de secundario e IUPA. trabajador de la escuela secundaria Nro. ESRN 111. Dicen que hice un ranking de belleza sobre tres alumnas, las tres me… | Fernando Ramoa |
| 2025-11-10 15:44:59 | Fernando Rossaroli | Consulta | Trabajaba con PAMI, el colegio le facturaba los servicios con el Colegio Medico de Cinco Saltos  Al princpio ganaba bien, de a poco les empezaron a p… | Ezequiel Echeverría |
| 2025-11-10 23:33:11 | Emily Alvarado | presunto abuso - calumnias | Yo trabajo en el sanatorio juan xxiii, trabajo en cirugia, tengo un novio que trabaja ahi en enfermeria. convivimos hace un año, hace dos que estamos… | Fernando Ramoa |
| 2025-11-12 22:17:55 | German Hernesto Maldonado | Primer consulta | En la zona de Allen, en la quema de gas cercad e YPF empezó a trabjar con una empresa en 2018, pero con problemas para el pago.   El trabajaba de seg… | Ezequiel Echeverría |
| 2025-11-14 22:37:10 | Maria Jesus Alvarez | Consulta | El empezó a buscar a su papa cuando tenia 15 años como parte de su historia. El construyó un edificio cerca de donde vivia su mamá, y ahi se conocier… | Ezequiel Echeverría |
| 2025-11-19 23:20:06 | Morales Agustin | consulta 19/11/25 | El 14/07 tuvo un accidente con su camioneta comprada por plan de ahorro, se le rompio el aceite mientras viajba con su mujer, embarazada  Estuvo espe… | Ezequiel Echeverría |
| 2025-11-20 21:26:53 | Diego Jose Salgado | Consulta | El trabajaba en calle Jujuy, casi la plata, en una obra particular, con un patron, Gaston Roberto Palacios Salas. Es contratista, tiene varios chicos… | Ezequiel Echeverría |
| 2025-11-20 21:40:45 | Iñaki Castro | Consulta | Trabaja para Loghinet Soluciones, tercerizados de personal, ponene la movildiad para viajar en Neuquen y alla tienen negocios para visitar a lo largo… | Ezequiel Echeverría |
| 2025-11-20 22:16:38 | Melani Domingo | Consulta | Se jubilo en Mayo del 2014  El trabajaba en educacion, tenia un cargo de 40 hora semanales | Ezequiel Echeverría |
| 2025-11-21 16:10:32 | Facundo Soto | Consulta 21/11 | Intento de abuso.  Prohibición de acercamiento.  Tenía dos o tres años.  Mi mamá se tuvo que venir a Roca, él vivía en Neuquén.  Balanz. | Matías Julián Rubio |
| 2025-11-26 10:57:38 | Paula Abril Olivera Oro | Consulta 25/11 | Ingreso noviembre 2023  Empleador: Albornoz, Melina Viviana, DNI 31360058. Cafe 1985.  Diciembre 2023 accidente laboral. Me quisieron dar plata. Hast… | Matías Julián Rubio |
| 2025-12-03 21:02:29 | Lucas Martin | Consulta | Junio o Julio de este año Lo chocaron de atrás sobre Juan B Justo yendo para Plottier, en intersección con Brown. Freno en la esquina y el de atrás n… | Ezequiel Echeverría |
| 2025-12-03 21:34:57 | Candela Virgina Gazagne | consulta | Esta con licencia por un accidente de trabajo, por ligamentos cruzado anterior, mientras bailaba  Se accidentó el 26/06/2025  Ella trabaja como cuerp… | Ezequiel Echeverría |
| 2025-12-03 22:48:21 | Claudia Kisiñovsky | consulta | Tiene una deuda con el banco nación, nunca se atrasó ni nada.   El 27/11/24 su hija tuvo un brote psicótico y se intentó suicidar, las prepagas no le… | Ezequiel Echeverría |
| 2025-12-04 22:22:18 | Celia Mabel Zurita | primer consulta | Alquiló una casa en abril y le han pagado muy poco, pactaron $550.000. Le pagaron por transferencia.  No firmaron ningún contrato ni nada.  En julio/… | Ezequiel Echeverría |
| 2025-12-10 21:24:46 | Maria Belen Garcia | Consulta | La otra profesora se entero que la otra profesora se enteró que la denuncio.   Nunca tuvo trato con la otra profesora. El día ese se pelearon con la … | Ezequiel Echeverría |
| 2025-12-13 18:46:26 | ROMAN RAUL MARCELO | CONTESTAR DEMANDA CONTENCIOSO ADM | RO-01743-C-2025  MONTIVERO C/MUICIPALIDAD DE ALLEN - MARIN - ROMAN S/CONTENCIOSO ADM | Fernando Ramoa |
| 2025-12-29 13:57:34 | Dario Ezequiel Peralta | Consulta | El jueves 8 30 / 9 am estaba yendo al trabajo y tuvo un accidente de transito. Venia por sarmiento y el otro vehiculo iba por Villegas, el tenia el p… | Ezequiel Echeverría |
| 2026-01-12 21:07:28 | Martin Ezequiel Leiva | consulta datos | Lo retiró en octubre de 2024.  El lo tiene prendado, El adelantó 5 millones, pagó 13 cuotas de 1.200.000 aprox, le quedaban 34 cuotas todavia y para … | Ezequiel Echeverría |
| 2026-01-19 22:36:01 | FEDERICO PABLO DURAND | accidente laboral sin seguro | Contrato para trabajar base coat  Se cayo de 4,5 netros y se lastimo  Una persona que se dedica a hacer pinturas, alberto uribe, rio neuquen 935, emp… | Fernando Ramoa |
| 2026-02-02 22:43:14 | Pizarro Adan | Consulta sobre tenencia pornografia infantil | Lo allanaron   La policía buscaba una SIM de teléfonos que el usaba en la carnicería, ese teléfono estaba a su nombre y a veces quedaba en la carnice… | Ezequiel Echeverría |
| 2026-02-23 21:48:09 | Ajandra Paredes | enfermedad y relacion laboral | estoy en la empresa natania hace 11 años  empleada comercial, estoy en la parte de ventas  parte comercial y parte administrativo   hace dos años y d… | Fernando Ramoa |

## Cómo restaurar el backup

```bash
# A. Solo la DB del estudio en un MySQL nuevo
mysql -uroot -p < backups/rer-mysql-2026-05-22/sistema_juridico_db-2026-05-22.sql

# B. Dump completo de todas las DBs MySQL del container original
zcat backups/rer-mysql-2026-05-22/mysql-all-databases-2026-05-22.sql.gz | mysql -uroot -p
```

## Próximos pasos (no ejecutados, requieren tu confirmación)

1. Revisar este reporte. Si falta info, decirme antes de borrar.
2. Confirmar que los clientes/leads relevantes están migrados a iteralex.com.
3. Coolify UI → eliminar **app** `sistema-gestion-juridico-rer` (UUID `as4o8k80kgg8s8gs4c80sww4`).
4. Coolify UI → eliminar **recurso DB** `itera-modern-mysql-databases` (UUID `fow0gsgw4cgksogc40ogsg4o`).
5. Cerrar el subdominio `gestion.rerestudiojuridico.com` en Cloudflare (o redirigir a iteralex).
6. Esto **cierra el hallazgo P0** del audit del VPS (MySQL 3306 público), porque el único container que publica 3306 es ese mismo recurso MySQL.
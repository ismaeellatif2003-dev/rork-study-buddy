2025-11-01T14:35:11.965851889Z [inf]  
2025-11-01T14:35:15.126225049Z [inf]  [35m[Region: asia-southeast1][0m
2025-11-01T14:35:15.129251191Z [inf]  [35m=========================
2025-11-01T14:35:15.129291532Z [inf]  Using Detected Dockerfile
2025-11-01T14:35:15.129295093Z [inf]  =========================
2025-11-01T14:35:15.129298327Z [inf]  [0m
2025-11-01T14:35:15.129312637Z [inf]  context: tw22-nnI7
2025-11-01T14:35:15.314151177Z [inf]  [internal] load build definition from Dockerfile
2025-11-01T14:35:15.314206918Z [inf]  [internal] load build definition from Dockerfile
2025-11-01T14:35:15.314219440Z [inf]  [internal] load build definition from Dockerfile
2025-11-01T14:35:15.327132924Z [inf]  [internal] load build definition from Dockerfile
2025-11-01T14:35:15.331864742Z [inf]  [internal] load metadata for docker.io/library/node:18-alpine
2025-11-01T14:35:15.335436082Z [inf]  [auth] library/node:pull token for registry-1.docker.io
2025-11-01T14:35:15.335474295Z [inf]  [auth] library/node:pull token for registry-1.docker.io
2025-11-01T14:35:16.841181171Z [inf]  [internal] load metadata for docker.io/library/node:18-alpine
2025-11-01T14:35:16.842387169Z [inf]  [internal] load .dockerignore
2025-11-01T14:35:16.842438739Z [inf]  [internal] load .dockerignore
2025-11-01T14:35:16.843447734Z [inf]  [internal] load .dockerignore
2025-11-01T14:35:16.886669169Z [inf]  [internal] load .dockerignore
2025-11-01T14:35:16.891947957Z [inf]  [9/9] RUN npm prune --production
2025-11-01T14:35:16.891987470Z [inf]  [8/9] RUN npx tsc --project tsconfig.json
2025-11-01T14:35:16.891996218Z [inf]  [7/9] COPY . .
2025-11-01T14:35:16.892002865Z [inf]  [6/9] COPY tsconfig.json ./
2025-11-01T14:35:16.892014992Z [inf]  [5/9] RUN npm install --legacy-peer-deps
2025-11-01T14:35:16.892023420Z [inf]  [4/9] COPY package*.json ./
2025-11-01T14:35:16.892030033Z [inf]  [internal] load build context
2025-11-01T14:35:16.892038786Z [inf]  [3/9] RUN apk add --no-cache     python3     py3-pip     ffmpeg     && python3 -m venv /opt/venv     && /opt/venv/bin/pip install yt-dlp     && ln -s /opt/venv/bin/yt-dlp /usr/local/bin/yt-dlp
2025-11-01T14:35:16.892047840Z [inf]  [2/9] WORKDIR /app
2025-11-01T14:35:16.892053851Z [inf]  [1/9] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
2025-11-01T14:35:16.892070649Z [inf]  [internal] load build context
2025-11-01T14:35:16.892076801Z [inf]  [1/9] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
2025-11-01T14:35:16.902960334Z [inf]  [1/9] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
2025-11-01T14:35:16.903495878Z [inf]  [1/9] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
2025-11-01T14:35:16.903515806Z [inf]  [internal] load build context
2025-11-01T14:35:16.903526653Z [inf]  [1/9] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
2025-11-01T14:35:16.906330683Z [inf]  [1/9] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
2025-11-01T14:35:16.942494204Z [inf]  [internal] load build context
2025-11-01T14:35:18.002063670Z [inf]  [1/9] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
2025-11-01T14:35:19.055490842Z [inf]  [2/9] WORKDIR /app
2025-11-01T14:35:19.186645636Z [inf]  [2/9] WORKDIR /app
2025-11-01T14:35:19.189482880Z [inf]  [3/9] RUN apk add --no-cache     python3     py3-pip     ffmpeg     && python3 -m venv /opt/venv     && /opt/venv/bin/pip install yt-dlp     && ln -s /opt/venv/bin/yt-dlp /usr/local/bin/yt-dlp
2025-11-01T14:35:19.286123629Z [inf]  fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/main/x86_64/APKINDEX.tar.gz

2025-11-01T14:35:19.360869093Z [inf]  fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/community/x86_64/APKINDEX.tar.gz

2025-11-01T14:35:19.684374125Z [inf]  (1/128) Installing libSvtAv1Enc (2.2.1-r0)

2025-11-01T14:35:19.750317689Z [inf]  (2/128) Installing aom-libs (3.11.0-r0)

2025-11-01T14:35:19.821551125Z [inf]  (3/128) Installing libxau (1.0.11-r4)

2025-11-01T14:35:19.825538429Z [inf]  (4/128) Installing libmd (1.1.0-r0)

2025-11-01T14:35:19.830092488Z [inf]  (5/128) Installing libbsd (0.12.2-r0)

2025-11-01T14:35:19.833982987Z [inf]  (6/128) Installing libxdmcp (1.1.5-r1)

2025-11-01T14:35:19.837383107Z [inf]  (7/128) Installing libxcb (1.16.1-r0)

2025-11-01T14:35:19.8498052Z [inf]  (8/128) Installing libx11 (1.8.10-r0)

2025-11-01T14:35:19.885206645Z [inf]  (9/128) Installing hwdata-pci (0.393-r0)

2025-11-01T14:35:19.897376915Z [inf]  (10/128) Installing libpciaccess (0.18.1-r0)

2025-11-01T14:35:19.901726281Z [inf]  (11/128) Installing libdrm (2.4.123-r1)

2025-11-01T14:35:19.912747701Z [inf]  (12/128) Installing libxext (1.3.6-r2)

2025-11-01T14:35:19.916424362Z [inf]  (13/128) Installing libxfixes (6.0.1-r4)

2025-11-01T14:35:19.920672215Z [inf]  (14/128) Installing libffi (3.4.7-r0)

2025-11-01T14:35:19.92535588Z [inf]  (15/128) Installing wayland-libs-client (1.23.1-r0)

2025-11-01T14:35:19.932294321Z [inf]  (16/128) Installing libva (2.22.0-r1)

2025-11-01T14:35:19.939693067Z [inf]  (17/128) Installing libvdpau (1.5-r4)

2025-11-01T14:35:19.945291627Z [inf]  (18/128) Installing onevpl-libs (2023.3.1-r2)

2025-11-01T14:35:19.951967588Z [inf]  (19/128) Installing ffmpeg-libavutil (6.1.2-r1)

2025-11-01T14:35:19.965151776Z [inf]  (20/128) Installing libdav1d (1.5.0-r0)

2025-11-01T14:35:19.984116808Z [inf]  (21/128) Installing openexr-libiex (3.3.2-r0)

2025-11-01T14:35:19.990872031Z [inf]  (22/128) Installing openexr-libilmthread (3.3.2-r0)

2025-11-01T14:35:19.99475837Z [inf]  (23/128) Installing imath (3.1.12-r0)

2025-11-01T14:35:20.001136974Z [inf]  (24/128) Installing libdeflate (1.22-r0)

2025-11-01T14:35:20.007636803Z [inf]  (25/128) Installing openexr-libopenexrcore (3.3.2-r0)

2025-11-01T14:35:20.023256149Z [inf]  (26/128) Installing openexr-libopenexr (3.3.2-r0)

2025-11-01T14:35:20.035781506Z [inf]  (27/128) Installing brotli-libs (1.1.0-r2)

2025-11-01T14:35:20.050359336Z [inf]  (28/128) Installing giflib (5.2.2-r1)

2025-11-01T14:35:20.056108436Z [inf]  (29/128) Installing libhwy (1.0.7-r0)

2025-11-01T14:35:20.061869195Z [inf]  (30/128) Installing libjpeg-turbo (3.0.4-r0)

2025-11-01T14:35:20.072516495Z [inf]  (31/128) Installing lcms2 (2.16-r0)

2025-11-01T14:35:20.079969062Z [inf]  (32/128) Installing libpng (1.6.47-r0)

2025-11-01T14:35:20.085869527Z [inf]  (33/128) Installing libjxl (0.10.4-r0)

2025-11-01T14:35:20.126312279Z [inf]  (34/128) Installing lame-libs (3.100-r5)

2025-11-01T14:35:20.131708003Z [inf]  (35/128) Installing opus (1.5.2-r1)

2025-11-01T14:35:20.139922093Z [inf]  (36/128) Installing rav1e-libs (0.7.1-r0)

2025-11-01T14:35:20.165579372Z [inf]  (37/128) Installing libgomp (14.2.0-r4)

2025-11-01T14:35:20.171282377Z [inf]  (38/128) Installing soxr (0.1.3-r7)

2025-11-01T14:35:20.17711354Z [inf]  (39/128) Installing ffmpeg-libswresample (6.1.2-r1)

2025-11-01T14:35:20.181937792Z [inf]  (40/128) Installing libogg (1.3.5-r5)

2025-11-01T14:35:20.185248037Z [inf]  (41/128) Installing libtheora (1.1.1-r18)

2025-11-01T14:35:20.195783934Z [inf]  (42/128) Installing libvorbis (1.3.7-r2)

2025-11-01T14:35:20.204624561Z [inf]  (43/128) Installing libvpx (1.15.0-r0)

2025-11-01T14:35:20.234289508Z [inf]  (44/128) Installing libsharpyuv (1.4.0-r0)

2025-11-01T14:35:20.242706044Z [inf]  (45/128) Installing libwebp (1.4.0-r0)

2025-11-01T14:35:20.252460637Z [inf]  (46/128) Installing libwebpmux (1.4.0-r0)

2025-11-01T14:35:20.256881481Z [inf]  (47/128) Installing x264-libs (0.164.3108-r0)

2025-11-01T14:35:20.27902637Z [inf]  (48/128) Installing numactl (2.0.18-r0)

2025-11-01T14:35:20.28295335Z [inf]  (49/128) Installing x265-libs (3.6-r0)

2025-11-01T14:35:20.369759573Z [inf]  (50/128) Installing xvidcore (1.3.7-r2)

2025-11-01T14:35:20.37739958Z [inf]  (51/128) Installing ffmpeg-libavcodec (6.1.2-r1)

2025-11-01T14:35:20.509240784Z [inf]  (52/128) Installing sdl2 (2.30.9-r0)

2025-11-01T14:35:20.525504837Z [inf]  (53/128) Installing alsa-lib (1.2.12-r0)

2025-11-01T14:35:20.541009227Z [inf]  (54/128) Installing libexpat (2.7.3-r0)

2025-11-01T14:35:20.546734325Z [inf]  (55/128) Installing libbz2 (1.0.8-r6)

2025-11-01T14:35:20.550266879Z [inf]  (56/128) Installing freetype (2.13.3-r0)

2025-11-01T14:35:20.560164355Z [inf]  (57/128) Installing fontconfig (2.15.0-r1)

2025-11-01T14:35:20.570468516Z [inf]  (58/128) Installing fribidi (1.0.16-r0)

2025-11-01T14:35:20.57399439Z [inf]  (59/128) Installing libintl (0.22.5-r0)

2025-11-01T14:35:20.57841563Z [inf]  (60/128) Installing libeconf (0.6.3-r0)

2025-11-01T14:35:20.582084294Z [inf]  (61/128) Installing libblkid (2.40.4-r1)

2025-11-01T14:35:20.587878958Z [inf]  (62/128) Installing libmount (2.40.4-r1)

2025-11-01T14:35:20.594055046Z [inf]  (63/128) Installing pcre2 (10.43-r0)

2025-11-01T14:35:20.604724569Z [inf]  (64/128) Installing glib (2.82.5-r0)

2025-11-01T14:35:20.649460417Z [inf]  (65/128) Installing graphite2 (1.3.14-r6)

2025-11-01T14:35:20.655667579Z [inf]  (66/128) Installing harfbuzz (9.0.0-r1)

2025-11-01T14:35:20.670017561Z [inf]  (67/128) Installing libunibreak (6.1-r0)

2025-11-01T14:35:20.67730031Z [inf]  (68/128) Installing libass (0.17.3-r0)

2025-11-01T14:35:20.70319426Z [inf]  (69/128) Installing libbluray (1.3.4-r1)

2025-11-01T14:35:20.710112493Z [inf]  (70/128) Installing mpg123-libs (1.32.9-r0)

2025-11-01T14:35:20.71756599Z [inf]  (71/128) Installing libopenmpt (0.7.12-r0)

2025-11-01T14:35:20.732555875Z [inf]  (72/128) Installing cjson (1.7.19-r0)

2025-11-01T14:35:20.736076071Z [inf]  (73/128) Installing mbedtls (3.6.5-r0)

2025-11-01T14:35:20.74835069Z [inf]  (74/128) Installing librist (0.2.10-r1)

2025-11-01T14:35:20.752972223Z [inf]  (75/128) Installing libsrt (1.5.3-r0)

2025-11-01T14:35:20.764852897Z [inf]  (76/128) Installing libssh (0.11.1-r0)

2025-11-01T14:35:20.78107956Z [inf]  (77/128) Installing xz-libs (5.6.3-r1)

2025-11-01T14:35:20.787878885Z [inf]  (78/128) Installing libxml2 (2.13.9-r0)

2025-11-01T14:35:20.801109892Z [inf]  (79/128) Installing libsodium (1.0.20-r0)

2025-11-01T14:35:20.806225259Z [inf]  (80/128) Installing libzmq (4.3.5-r2)

2025-11-01T14:35:20.815529778Z [inf]  (81/128) Installing ffmpeg-libavformat (6.1.2-r1)

2025-11-01T14:35:20.8454424Z [inf]  (82/128) Installing serd-libs (0.32.2-r0)

2025-11-01T14:35:20.850954775Z [inf]  (83/128) Installing zix-libs (0.4.2-r0)

2025-11-01T14:35:20.854217928Z [inf]  (84/128) Installing sord-libs (0.16.16-r0)

2025-11-01T14:35:20.857367674Z [inf]  (85/128) Installing sratom (0.6.16-r0)

2025-11-01T14:35:20.860792701Z [inf]  (86/128) Installing lilv-libs (0.24.24-r1)

2025-11-01T14:35:20.871275985Z [inf]  (87/128) Installing libdovi (3.3.1-r0)

2025-11-01T14:35:20.879297005Z [inf]  (88/128) Installing spirv-tools (1.3.296.0-r0)

2025-11-01T14:35:20.917084517Z [inf]  (89/128) Installing glslang-libs (1.3.296.0-r0)

2025-11-01T14:35:20.939042716Z [inf]  (90/128) Installing shaderc (2024.0-r2)

2025-11-01T14:35:20.944217049Z [inf]  (91/128) Installing vulkan-loader (1.3.296.0-r0)

2025-11-01T14:35:20.95172347Z [inf]  (92/128) Installing libplacebo (6.338.2-r3)

2025-11-01T14:35:20.964679355Z [inf]  (93/128) Installing ffmpeg-libpostproc (6.1.2-r1)

2025-11-01T14:35:20.968530645Z [inf]  (94/128) Installing ffmpeg-libswscale (6.1.2-r1)

2025-11-01T14:35:20.979143311Z [inf]  (95/128) Installing vidstab (1.1.1-r0)

2025-11-01T14:35:20.983054698Z [inf]  (96/128) Installing zimg (3.0.5-r2)

2025-11-01T14:35:20.994088156Z [inf]  (97/128) Installing ffmpeg-libavfilter (6.1.2-r1)

2025-11-01T14:35:21.041607071Z [inf]  (98/128) Installing libasyncns (0.8-r4)

2025-11-01T14:35:21.044917857Z [inf]  (99/128) Installing dbus-libs (1.14.10-r4)

2025-11-01T14:35:21.054543469Z [inf]  (100/128) Installing libltdl (2.4.7-r3)

2025-11-01T14:35:21.058507526Z [inf]  (101/128) Installing orc (0.4.40-r1)

2025-11-01T14:35:21.067030985Z [inf]  (102/128) Installing libflac (1.4.3-r1)

2025-11-01T14:35:21.074600661Z [inf]  (103/128) Installing libsndfile (1.2.2-r2)

2025-11-01T14:35:21.09058413Z [inf]  (104/128) Installing speexdsp (1.2.1-r2)

2025-11-01T14:35:21.09536063Z [inf]  (105/128) Installing tdb-libs (1.4.12-r0)

2025-11-01T14:35:21.099859135Z [inf]  (106/128) Installing libpulse (17.0-r4)

2025-11-01T14:35:21.114867895Z [inf]  (107/128) Installing v4l-utils-libs (1.28.1-r1)

2025-11-01T14:35:21.126502212Z [inf]  (108/128) Installing ffmpeg-libavdevice (6.1.2-r1)

2025-11-01T14:35:21.133105484Z [inf]  (109/128) Installing ffmpeg (6.1.2-r1)

2025-11-01T14:35:21.145469825Z [inf]  (110/128) Installing gdbm (1.24-r0)

2025-11-01T14:35:21.166307904Z [inf]  (111/128) Installing mpdecimal (4.0.0-r0)

2025-11-01T14:35:21.175038888Z [inf]  (112/128) Installing ncurses-terminfo-base (6.5_p20241006-r3)

2025-11-01T14:35:21.181384096Z [inf]  (113/128) Installing libncursesw (6.5_p20241006-r3)

2025-11-01T14:35:21.188343064Z [inf]  (114/128) Installing libpanelw (6.5_p20241006-r3)

2025-11-01T14:35:21.191597941Z [inf]  (115/128) Installing readline (8.2.13-r0)

2025-11-01T14:35:21.202301934Z [inf]  (116/128) Installing sqlite-libs (3.48.0-r4)

2025-11-01T14:35:21.224957683Z [inf]  (117/128) Installing python3 (3.12.12-r0)

2025-11-01T14:35:21.408161532Z [inf]  (118/128) Installing python3-pycache-pyc0 (3.12.12-r0)

2025-11-01T14:35:21.513534089Z [inf]  (119/128) Installing pyc (3.12.12-r0)
(120/128) Installing py3-setuptools-pyc (70.3.0-r0)

2025-11-01T14:35:21.559747746Z [inf]  (121/128) Installing py3-pip-pyc (24.3.1-r0)

2025-11-01T14:35:21.632472478Z [inf]  (122/128) Installing py3-parsing (3.1.4-r0)

2025-11-01T14:35:21.639448229Z [inf]  (123/128) Installing py3-parsing-pyc (3.1.4-r0)

2025-11-01T14:35:21.648675349Z [inf]  (124/128) Installing py3-packaging-pyc (24.2-r0)

2025-11-01T14:35:21.659665789Z [inf]  (125/128) Installing python3-pyc (3.12.12-r0)
(126/128) Installing py3-packaging (24.2-r0)

2025-11-01T14:35:21.665929533Z [inf]  (127/128) Installing py3-setuptools (70.3.0-r0)

2025-11-01T14:35:21.706108589Z [inf]  (128/128) Installing py3-pip (24.3.1-r0)

2025-11-01T14:35:21.766764834Z [inf]  Executing busybox-1.37.0-r12.trigger

2025-11-01T14:35:21.772704199Z [inf]  Executing glib-2.82.5-r0.trigger

2025-11-01T14:35:21.778212854Z [inf]  OK: 182 MiB in 145 packages

2025-11-01T14:35:25.50867433Z [inf]  Collecting yt-dlp

2025-11-01T14:35:25.541240376Z [inf]    Downloading yt_dlp-2025.10.22-py3-none-any.whl.metadata (176 kB)

2025-11-01T14:35:25.584852331Z [inf]  Downloading yt_dlp-2025.10.22-py3-none-any.whl (3.2 MB)

2025-11-01T14:35:25.620413921Z [inf]     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 3.2/3.2 MB 96.1 MB/s eta 0:00:00
2025-11-01T14:35:25.620580946Z [inf]  

2025-11-01T14:35:25.65568664Z [inf]  Installing collected packages: yt-dlp

2025-11-01T14:35:28.256571612Z [inf]  Successfully installed yt-dlp-2025.10.22

2025-11-01T14:35:28.330529622Z [inf]  
[notice] A new release of pip is available: 25.0.1 -> 25.3
[notice] To update, run: python3 -m pip install --upgrade pip

2025-11-01T14:35:28.680749361Z [inf]  [3/9] RUN apk add --no-cache     python3     py3-pip     ffmpeg     && python3 -m venv /opt/venv     && /opt/venv/bin/pip install yt-dlp     && ln -s /opt/venv/bin/yt-dlp /usr/local/bin/yt-dlp
2025-11-01T14:35:28.682736699Z [inf]  [4/9] COPY package*.json ./
2025-11-01T14:35:28.738918838Z [inf]  [4/9] COPY package*.json ./
2025-11-01T14:35:28.741365752Z [inf]  [5/9] RUN npm install --legacy-peer-deps
2025-11-01T14:35:30.445774731Z [inf]  npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead

2025-11-01T14:35:31.793131063Z [inf]  
added 145 packages, and audited 146 packages in 3s

2025-11-01T14:35:31.793187082Z [inf]  

2025-11-01T14:35:31.793194251Z [inf]  26 packages are looking for funding

2025-11-01T14:35:31.793197268Z [inf]    run `npm fund` for details

2025-11-01T14:35:31.801622505Z [inf]  
1 high severity vulnerability

To address all issues, run:
  npm audit fix

Run `npm audit` for details.

2025-11-01T14:35:31.803010048Z [inf]  npm notice
npm notice New major version of npm available! 10.8.2 -> 11.6.2
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.6.2
npm notice To update run: npm install -g npm@11.6.2
npm notice

2025-11-01T14:35:31.883493687Z [inf]  [5/9] RUN npm install --legacy-peer-deps
2025-11-01T14:35:31.884673646Z [inf]  [6/9] COPY tsconfig.json ./
2025-11-01T14:35:31.956919489Z [inf]  [6/9] COPY tsconfig.json ./
2025-11-01T14:35:31.958575827Z [inf]  [7/9] COPY . .
2025-11-01T14:35:31.995671950Z [inf]  [7/9] COPY . .
2025-11-01T14:35:31.997696497Z [inf]  [8/9] RUN npx tsc --project tsconfig.json
2025-11-01T14:35:35.811424339Z [inf]  hono.ts(850,40): error TS2307: Cannot find module './services/jwt-service' or its corresponding type declarations.

2025-11-01T14:35:35.811966177Z [inf]  hono.ts(879,44): error TS2339: Property 'title' does not exist on type 'NoteEmbedding'.

2025-11-01T14:35:35.8120586Z [inf]  hono.ts(968,20): error TS2339: Property 'title' does not exist on type 'NoteEmbedding'.

2025-11-01T14:35:35.812072598Z [inf]  hono.ts(969,25): error TS2339: Property 'similarity' does not exist on type 'NoteEmbedding'.
hono.ts(1041,40): error TS2307: Cannot find module './services/jwt-service' or its corresponding type declarations.

2025-11-01T14:35:35.812106486Z [inf]  hono.ts(1870,78): error TS18047: 'note' is possibly 'null'.
hono.ts(1870,95): error TS18047: 'note' is possibly 'null'.

2025-11-01T14:35:35.81212829Z [inf]  hono.ts(1871,85): error TS18047: 'note' is possibly 'null'.

2025-11-01T14:35:35.812300609Z [inf]  hono.ts(1871,102): error TS18047: 'note' is possibly 'null'.

2025-11-01T14:35:35.812313484Z [inf]  hono.ts(1873,13): error TS18047: 'note' is possibly 'null'.

2025-11-01T14:35:35.812350304Z [inf]  hono.ts(1874,77): error TS18047: 'note' is possibly 'null'.

2025-11-01T14:35:35.812360527Z [inf]  hono.ts(1875,87): error TS18047: 'note' is possibly 'null'.

2025-11-01T14:35:35.81257427Z [inf]  services/database.ts(1028,28): error TS7006: Parameter 'row' implicitly has an 'any' type.

2025-11-01T14:35:36.005267326Z [err]  [8/9] RUN npx tsc --project tsconfig.json
2025-11-01T14:35:36.023516930Z [err]  Dockerfile:27
2025-11-01T14:35:36.023562008Z [err]  -------------------
2025-11-01T14:35:36.023566951Z [err]  25 |
2025-11-01T14:35:36.023573528Z [err]  26 |     # Build TypeScript to JavaScript (explicitly specify tsconfig)
2025-11-01T14:35:36.023583014Z [err]  27 | >>> RUN npx tsc --project tsconfig.json
2025-11-01T14:35:36.023588370Z [err]  28 |
2025-11-01T14:35:36.023593868Z [err]  29 |     # Remove dev dependencies to reduce image size
2025-11-01T14:35:36.023598938Z [err]  -------------------
2025-11-01T14:35:36.023604771Z [err]  ERROR: failed to build: failed to solve: process "/bin/sh -c npx tsc --project tsconfig.json" did not complete successfully: exit code: 2# Study Buddy Web - Railway Deployment Guide

## 🚂 Deploying to Railway

### Step 1: Add Web Service to Existing Project

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Open your existing project** (the one with your backend)
3. **Click "New Service"** or the "+" button
4. **Select "GitHub Repo"**
5. **Choose your repository**: `rork-study-buddy`
6. **Set Root Directory**: `study-buddy-web`
7. **Click "Deploy"**

### Step 2: Configure Environment Variables

In your Railway web service, go to **Settings** → **Variables** and add:

```bash
# Google OAuth Configuration
NEXTAUTH_URL=https://your-railway-domain.up.railway.app
NEXTAUTH_SECRET=your_secure_random_string_here

# Google OAuth Credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Backend API Configuration
NEXT_PUBLIC_API_URL=https://rork-study-buddy-production-eeeb.up.railway.app
API_SECRET=your_api_secret_here

# Environment
NODE_ENV=production
```

### Step 3: Get Your Railway URL

After deployment, Railway will provide a URL like:
`https://study-buddy-web-production-xxxx.up.railway.app`

### Step 4: Update Google OAuth Settings

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Navigate to APIs & Services** → **Credentials**
3. **Edit your OAuth 2.0 Client ID**
4. **Add Authorized Redirect URIs**:
   ```
   https://your-railway-domain.up.railway.app/api/auth/callback/google
   ```
5. **Save changes**

### Step 5: Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

Copy the output and use it as your `NEXTAUTH_SECRET`.

### Step 6: Test Deployment

1. **Visit your Railway URL**
2. **Test Google Sign-In**
3. **Verify subscription sync** with your mobile app
4. **Check all features** work correctly

## 🔧 Railway Configuration

The `railway.json` file configures:
- **Builder**: NIXPACKS (auto-detects Next.js)
- **Start Command**: `npm start`
- **Health Check**: Root path `/`
- **Restart Policy**: Automatic restart on failure

## 🌐 Custom Domain (Optional)

To add a custom domain later:

1. **Go to your Railway service**
2. **Settings** → **Domains**
3. **Add custom domain**
4. **Follow DNS instructions**
5. **Update NEXTAUTH_URL** environment variable
6. **Update Google OAuth** redirect URIs

## 📊 Project Structure

Your Railway project will have:
```
Railway Project: "rork-study-buddy"
├── Service 1: Backend
│   └── URL: https://rork-study-buddy-production-eeeb.up.railway.app
└── Service 2: Web App
    └── URL: https://study-buddy-web-production-xxxx.up.railway.app
```

## 🚀 Deployment Features

- ✅ **Automatic deployments** from GitHub
- ✅ **SSL certificates** included
- ✅ **Environment variable management**
- ✅ **Built-in monitoring** and logs
- ✅ **Easy scaling** if needed

## 🔍 Troubleshooting

### Build Issues:
- Check Railway logs for build errors
- Verify all environment variables are set
- Ensure `package.json` scripts are correct

### OAuth Issues:
- Verify redirect URIs match exactly
- Check `NEXTAUTH_URL` matches your Railway domain
- Ensure `NEXTAUTH_SECRET` is set

### API Connection Issues:
- Verify `NEXT_PUBLIC_API_URL` points to your backend
- Check backend is running and accessible
- Test API endpoints manually

## 📱 Mobile App Integration

After deployment:
1. **Update mobile app** with new web URL (if needed)
2. **Test cross-platform sync**
3. **Verify subscription management** works
4. **Test platform-specific cancellation**

## 🎯 Next Steps

1. Deploy to Railway
2. Test all functionality
3. Set up custom domain (optional)
4. Configure monitoring
5. Set up backups (if needed)

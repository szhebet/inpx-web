inpx-web
========
_**Fork от https://github.com/bookpauk/inpx-web 
для внесения изменений в структуру хранения данных в библиотеке.**_

Веб-сервер для поиска по .inpx-коллекции.

Выглядит следующим образом: [https://lib.omnireader.ru](https://lib.omnireader.ru)

От исходной версии отличается тем, что рассчитан на работу с большим количеством книг, размещенных в нескольких архивах с наименованиями вида:
_<префикс>-<ID первой книги в архиве>-<ID последней книги в архиве>.zip_
Если структура хранения данных у вас отличается, то лучше использовать исходный вариант сервера.

_Сервер формирует внутреннюю БД по INPX файлу при первом запуске в каталоге, заданном параметром --data-dir в строке запуска. Структура БД отличается от структуры исходного проекта. При переходе от одной версии сервера на другую формирование БД нужно выполнить повторно. Версия БД будет отличаться только в случае, если при первом старте передан флаг **--multyArchiveStorage=true**_ 


.inpx - индексный файл для импорта\экспорта информации из базы данных сетевых библиотек
в базу каталогизатора [MyHomeLib](https://alex80.github.io/mhl/)
или [freeLib](http://sourceforge.net/projects/freelibdesign)
или [LightLib](https://lightlib.azurewebsites.net)

[Установка](#usage): просто поместить приложение `inpx-web` в папку с .inpx-файлом и файлами библиотеки (zip-архивами) и запустить.

По умолчанию, веб-сервер будет доступен по адресу [http://127.0.0.1:12380](http://127.0.0.1:12380)

OPDS-сервер доступен по адресу [http://127.0.0.1:12380/opds](http://127.0.0.1:12380/opds)

Для указания местоположения .inpx-файла или папки с файлами библиотеки, воспользуйтесь [параметрами командной строки](#cli).
Дополнительные параметры сервера настраиваются в [конфигурационном файле](#config).

## 
* [Возможности программы](#capabilities)
* [Использование](#usage)
    * [Параметры командной строки](#cli)
    * [Конфигурация](#config)
    * [Удаленная библиотека](#remotelib)
    * [Фильтр по авторам и книгам](#filter)
    * [Настройка https с помощью nginx](#https)
* [Сборка релизов](#build)
* [Запуск без сборки релиза](#native_run)
* [Разработка](#development)

<a id="capabilities" />

## Возможности программы
- веб-интерфейс и OPDS-сервер
- поиск по автору, серии, названию и пр.
- скачивание книги, копирование ссылки или открытие в читалке
- возможность указать рабочий каталог при запуске, а также расположение .inpx и файлов библиотеки
- ограничение доступа по паролю
- работа в режиме "удаленная библиотека"
- фильтр авторов и книг при создании поисковой БД для создания своей коллекции "на лету"
- подхват изменений .inpx-файла (периодическая проверка), автоматическое пересоздание поисковой БД
- мощная оптимизация, хорошая скорость поиска
- релизы под Linux, MacOS и Windows

<a id="usage" />

## Использование
Поместите приложение `inpx-web` в папку с .inpx-файлом и файлами библиотеки и запустите.
Там же, при первом запуске, будет создана рабочая директория `.inpx-web`, в которой хранится
конфигурационный файл `config.json`, файлы базы данных, журналы и прочее.

По умолчанию веб-интерфейс будет доступен по адресу [http://127.0.0.1:12380](http://127.0.0.1:12380)

OPDS-сервер доступен по адресу [http://127.0.0.1:12380/opds](http://127.0.0.1:12380/opds)

<a id="cli" />

### Параметры командной строки
Запустите `inpx-web --help`, чтобы увидеть список опций:
```console
Usage: inpx-web [options]

Options:
  --help                      Показать опции командной строки
  --host=<ip>                 Задать имя хоста для веб сервера, по умолчанию: 0.0.0.0
  --port=<port>               Задать порт для веб сервера, по умолчанию: 12380
  --config=<filepath>         Задать файл конфигурации, по умолчанию: <dataDir>/config.json
  --data-dir=<dirpath>        (или --app-dir) Задать рабочую директорию, по умолчанию: <execDir>/.inpx-web
  --lib-dir=<dirpath>         Задать директорию библиотеки (с zip-архивами), по умолчанию: там же, где лежит файл приложения
  --inpx=<filepath>           Задать путь к файлу .inpx, по умолчанию: тот, что найдется в директории библиотеки
  --multyArchiveStorage=true  1 INPX файл источник описывает книги, находящиеся в нескольких архивах (по умолчанию false)
  --shutdownOnIddle=true      Завершать работу приложения, если нет активных клиентов (по умолчанию false)
  --recreate                  Принудительно пересоздать поисковую БД при запуске приложения
  --unsafe-filter             Использовать небезопасный фильтр на свой страх и риск
```

<a id="config" />

### Конфигурация

По умолчанию, при первом запуске в рабочей директории будет создан конфигурационный файл `config.json`.
При необходимости, можно настроить нужный параметр в этом файле вручную. Параметры командной
строки имеют больший приоритет, чем настройки из `config.json`.

```js
{
    // рабочая директория приложения, аналог параметра командной строки --data-dir (или --app-dir)
    // пустая строка: использовать значение по умолчанию - <execDir>/.inpx-web
    // где execDir - директория файла приложения
    "dataDir": "",

    // директория для хранения временных файлов
    // пустая строка: использовать значение по умолчанию - <dataDir>/tmp
    // специальное значение "${OS}" указывается для использования системного каталога:
    // "${OS}" => "<os_temporary_dir>/inpx-web"
    "tempDir": "",

    // директория для хранения логов
    // пустая строка: использовать значение по умолчанию - <dataDir>/logs
    "logDir": "",

    // директория библиотеки (с zip-архивами), аналог параметра командной строки --lib-dir
    // пустая строка: использовать значение по умолчанию - директорию файла приложения (execDir)
    "libDir": "",

    // путь к файлу .inpx, аналог параметра командной строки --inpx
    // пустая строка: использовать значение по умолчанию - inpx-файл, что найдется в директории библиотеки
    "inpx": "",

    // конфигурационный файл для фильтра по авторам и книгам (см. ниже)
    // пустая строка: использовать значение по умолчанию - файл filter.json в директории файла конфигурации
    "inpxFilterFile": "",

    // разрешить(true)/запретить(false) перезаписывать файл конфигурации, если появились новые параметры для настройки
    // файл перезаписывается с сохранением всех предыдущих настроек и с новыми по умолчанию
    // бывает полезно при выходе новых версий приложения
    "allowConfigRewrite": false,

    // разрешить(true)/запретить(false) использовать небезопасный фильтр (см. ниже)
    // аналог параметра командной строки --unsafe-filter
    "allowUnsafeFilter": false,

    // пароль для ограничения доступа к веб-интерфейсу сервера
    // пустое значение - доступ без ограничений
    "accessPassword": "",

    // таймаут автозавершения сессии доступа к веб-интерфейсу (если задан accessPassword),
    // при неактивности в течение указанного времени (в минутах), пароль будет запрошен заново
    // 0 - отключить таймаут, время доступа по паролю не ограничено
    "accessTimeout": 0,

    // включить(true)/выключить(false) возможность расширенного поиска (раздел "</>")
    // расширенный поиск не оптимизирован, поэтому может сильно нагружать сервер
    // чтобы ускорить поиск, увеличьте параметр dbCacheSize
    "extendedSearch": true,

    // содержимое кнопки-ссылки "(читать)", если не задано - кнопка "(читать)" не показывается
    // пример: "https://omnireader.ru/#/reader?url=${DOWNLOAD_LINK}"
    // на место ${DOWNLOAD_LINK} будет подставлена ссылка на скачивание файла книги
    // пример: "https://mydomain.ru/#/reader?url=http://127.0.0.1:8086${DOWNLOAD_URI}"
    // на место ${DOWNLOAD_URI} будут подставлены параметры (без имени хоста) из ссылки на скачивание файла книги
    "bookReadLink": "",

    // включить(true)/выключить(false) журналирование
    "loggingEnabled": true,

    // включить/выключить ежеминутный вывод в лог memUsage и loadAvg
    "logServerStats": false,

    // включить/выключить вывод в лог запросов и времени их выполнения
    "logQueries": false,

    // максимальный размер кеша каждой таблицы в БД, в блоках (требуется примерно 1-10Мб памяти на один блок)
    // если надо кешировать всю БД, можно поставить значение от 1000 и больше
    "dbCacheSize": 5,

    // максимальный размер в байтах директории закешированных файлов в <раб.дир>/public-files
    // чистка каждый час
    "maxFilesDirSize": 1073741824,
    
    // включить(true)/выключить(false) серверное кеширование запросов на диске и в памяти
    "queryCacheEnabled": true,

    // размер кеша запросов в оперативной памяти (количество)
    // 0 - отключить кеширование запросов в оперативной памяти
    "queryCacheMemSize": 50,

    // размер кеша запросов на диске (количество)
    // 0 - отключить кеширование запросов на диске
    "queryCacheDiskSize": 500,

    // периодичность чистки кеша запросов на сервере, в минутах
    // 0 - отключить чистку
    "cacheCleanInterval": 60,

    // периодичность проверки изменений .inpx-файла, в минутах
    // если файл изменился, поисковая БД будет автоматически пересоздана
    // 0 - отключить проверку
    "inpxCheckInterval": 60,

    // включить(true)/выключить(false) режим работы с малым количеством физической памяти на машине
    // при включении этого режима, количество требуемой для создания БД памяти снижается примерно в 1.5-2 раза
    // во столько же раз увеличивается время создания
    "lowMemoryMode": false,

    // включить(true)/выключить(false) полную оптимизацию поисковой БД
    // ускоряет работу поиска, но увеличивает размер БД в 2-3 раза при импорте INPX
    "fullOptimization": false,

    // включить(true)/выключить(false) режим "Удаленная библиотека" (сервер)
    "allowRemoteLib": false,

    // включить(Object)/выключить(false) режим "Удаленная библиотека" (клиент)
    // подробнее см. раздел "Удаленная библиотека" ниже
    "remoteLib": false,

    // настройки веб-сервера
    // парамертр root указывает путь для кореневой страницы inpx-web
    // например для "root": "/library", веб-интерфейс будет доступен по адресу http://127.0.0.1:12380/library
    // root необходим при настройке reverse-proxy и встраивании inpx-web в уже существующий сервер
    "server": {
        "host": "0.0.0.0",
        "port": "12380",
        "root": ""
    },

    // настройки opds-сервера
    // user, password используются для Basic HTTP authentication
    // параметр root задает путь для доступа к opds-серверу
    "opds": {
        "enabled": true,
        "user": "",
        "password": "",
        "root": "/opds"
    },

    // страница для скачивания свежего релиза
    "latestReleaseLink": "https://github.com/bookpauk/inpx-web/releases/latest",

    // api для проверки новой версии, 
    // пустая строка - отключить проверку выхода новых версий
    "checkReleaseLink": "https://api.github.com/repos/bookpauk/inpx-web/releases/latest",

    // настройки по умолчанию для веб-интерфейса
    // устанавливаются при первой загрузке страницы в браузере
    // дальнейшие изменения настроек с помощью веб-интерфейса уже сохраняются в самом браузере
    "uiDefaults": {
        "limit": 20, // результатов на странице
        "downloadAsZip": false, // скачивать книги в виде zip-архива
        "showCounts": true, // показывать количество
        "showRates": true, // показывать оценки
        "showInfo": true, // показывать кнопку (инфо)
        "showGenres": true, // показывать жанры
        "showDates": false, // показывать даты поступления
        "showDeleted": false, // показывать удаленные
        "abCacheEnabled": true, // кешировать запросы
        "langDefault": "", // язык по умолчанию (например "ru,en")
        "showJson": false, // показывать JSON (в расширенном поиске)
        "showNewReleaseAvailable": true // уведомлять о выходе новой версии
    }
}
```

<a id="remotelib" />

### Удаленная библиотека

В случае, когда необходимо физически разнести веб-интерфейс и библиотеку файлов на разные машины,
приложение может работать в режиме клиент-сервер: веб-интерфейс, поисковый движок и поисковая БД на одной машине (клиент),
а библиотека книг и .inpx-файл на другой (сервер).

Для этого необходимо развернуть два приложения, первое из которых будет клиентом для второго.

На сервере правим `config.json`:
```
    "accessPassword": "123456",
    "allowRemoteLib": true,
```

На клиенте:
```
    "remoteLib": {
    	"accessPassword": "123456",
        "url": "ws://server.host:12380"
    },
```

Если сервер работает по протоколу `http://`, то указываем протокол `ws://`, а для `https://` соответственно `wss://`.
Пароль не обязателен, но необходим в случае, если сервер тоже "смотрит" в интернет, для ограничения доступа к его веб-интерфейсу.
При указании `"remoteLib": {...}` настройки командной строки --inpx и --lib-dir игнорируются,
т.к. файлы .inpx-индекса и библиотеки используются удаленно.

<a id="filter" />

### Фильтр по авторам и книгам

При создании поисковой БД, во время загрузки и парсинга .inpx-файла, имеется возможность
отфильтровать авторов и книги, задав определенные критерии. По умолчанию, для этого небходимо создать
в директории конфигурационного файла (там же, где `config.json`) файл `filter.json` следующего вида:
```json
{
  "info": {
    "collection": "Новое название коллекции",
    "version": "1.0.0"
  },
  "filter": "(r) => r.del == 0",
  "includeAuthors": ["Имя автора 1", "Имя автора 2"],
  "excludeAuthors": ["Имя автора"]
}
```
При фильтрации, авторы и их книги из `includeAuthors` будут оставлены, а из `excludeAuthors` исключены.
Использование совместно `includeAuthors` и `excludeAuthors` имеет мало смысла, поэтому для включения
определенных авторов можно использовать только `includeAuthors`:
```json
{
  "info": {
    "collection": "Новое название коллекции"
  },
  "includeAuthors": ["Имя автора 1", "Имя автора 2"]
}
```
Для исключения:
```json
{
  "info": {
    "collection": "Новое название коллекции"
  },
  "excludeAuthors": ["Имя автора 1", "Имя автора 2"]
}
```

Параметр `filter` используется для более гибкой фильтрации по атрибутам записей из .inpx.
Уберем все записи, помеченные как удаленные и исключим "Имя автора 1":
```json
{
  "info": {
    "collection": "Новое название коллекции"
  },
  "filter": "(inpxRec) => inpxRec.del == 0",
  "excludeAuthors": ["Имя автора 1"]
}
```
Использование `filter` небезопасно, т.к. позволяет выполнить произвольный js-код внутри программы,
поэтому запуск приложения в этом случае должен сопровождаться дополнительным параметром командной строки `--unsafe-filter`
или разрешением в конфиге `allowUnsafeFilter`.
Названия атрибутов inpxRec соответствуют названиям в нижнем регистре из структуры structure.info в .inpx-файле.
Файл `filter.json` можно расположить где угодно, что задается параметром `inpxFilterFile` в конфиге.
<a id="https" />

### Настройка https с помощью nginx
Проще всего настроить https с помощью certbot и проксирования в nginx (пример для debian-based linux):

```sh
#ставим nginx
sudo apt install nginx
```
```
#правим конфиг nginx
server {
  listen 80;
  server_name <имя сервера>;
  set $inpx_web http://127.0.0.1:12380;

  client_max_body_size 512m;
  proxy_read_timeout 1h;

  location / {
    proxy_pass $inpx_web;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```
```sh
#загружаем новый конфиг
sudo service nginx reload
```
Далее следовать инструкции установки https://certbot.eff.org/instructions?ws=nginx&os=debianbuster

<a id="build" />

### Сборка релизов
Сборка только в среде Linux.
Необходима версия node.js не ниже 16.

Для сборки linux-arm64 необходимо предварительно установить [QEMU](https://wiki.debian.org/QemuUserEmulation).

```sh
git clone https://github.com/bookpauk/inpx-web
cd inpx-web
npm i
npm run release
```

Результат сборки будет доступен в каталоге `dist/release`

<a id="native_run" />

### Запуск без сборки релиза
Т.к. сборщик pkg поддерживает не все платформы, то не всегда удается собрать релиз.
Однако, можно скачать и запустить inpx-web нативным путем, с помощью nodejs.
Ниже пример для Ubuntu, для других линуксов различия не принципиальны:

```sh
# установка nodejs v16 и выше:
curl -s https://deb.nodesource.com/setup_16.x | sudo bash
sudo apt install nodejs -y
sudo apt install zip

# подготовка
git clone https://github.com/bookpauk/inpx-web
cd inpx-web
npm i
npm run build:client && node build/prepkg.js linux

# удалим файл development-среды, чтобы запускался в production-режиме
rm ./server/config/application_env

# запуск inpx-web, тут же будет создан каталог .inpx-web
node server --app-dir=.inpx-web
```

<a id="development" />

### Разработка
```sh
npm run dev
```

### Для запуска в docker Container 

В каталоге с приложением, собираем контейнер:
```bash
docker build . -t bpk/inpx-web
```

Пример команды запуска после сборки ниже.

!не забыть перед выполнением заменить подстроки с флажками <host-libruArch> 
```bash
docker run \
-v /bookshelf/inpx-web/config:/configDir \
-v <host-libruArch>:/inpxDir \
-v <host-libruArch>:/libDir \
-v <host-libruData>:/dataDir \
-p 12380:12380 \
bpk/inpx-web node server --app-dir=.inpx-web \
--data-dir=/dataDir \
--lib-dir=/libDir \
--multyArchiveStorage=true
--shutdownOnIddle=true
```

### Автозапуск приложения при обращении (только для nix ОС)
Суть манипуляции:
1. создаем контейнер (из собранного заранее образа, см предыдущий пункт)
2. в systemd создается 3 записи:
   - bpk-listen9000.socket - слушатель порта 9000
   - bpk-proxy.service - прокси
   - bpk-container-starter.service - запускает контейнер с приложением
3. как только слушатель видит активность по порту 9000, он активирует 2 сервиса (прокси и запускает контейнер)
4. контейнер запускатеся с флагом --shutdownOnIddle=true, что означает, что он будет остановлен в случае отсутствия пользовательской активности

теперь код:
#### Cоздаем контейнер:
```bash
docker run --name bpk_bookshelf \
-v /bookshelf/inpx-web/config:/configDir \
-v <host-libruArch>:/inpxDir \
-v <host-libruArch>:/libDir \
-v <host-libruData>:/dataDir \
-p 12380:12380 \
-d \
bpk/inpx-web node server --app-dir=.inpx-web \
--data-dir=/dataDir \
--lib-dir=/libDir \
--multyArchiveStorage=true \
--shutdownOnIddle=true
```

#### Cоздаем записи в systemd:
sudo nano /etc/systemd/system/bpk-listen9000.socket

```bash
[Unit]
Description=bookshelf listen to start

[Socket]
ListenStream=9000
Service=bpk-proxy.service

[Install]
WantedBy=sockets.target
```

sudo nano /etc/systemd/system/bpk-proxy.service

```bash
[Unit]
BindsTo=bpk-container-starter.service
After=bpk-listen9000.socket

[Service]
ExecStart=/lib/systemd/systemd-socket-proxyd 127.0.0.1:12380
```

sudo nano /etc/systemd/system/bpk-container-starter.service

```bash
[Unit]
Description=bpk-container-starter service
After=network.target bpk-listen9000.socket
Requires=bpk-listen9000.socket

[Service]
ExecStart=docker start bpk_bookshelf -a

ExecStartPost=/bin/sleep 10
```
#### Запуск
Перезагрузим systemd и включим все
```bash
sudo systemctl daemon-reload
sudo systemctl enable bpk-listen9000.socket
sudo systemctl start bpk-listen9000.socket
```

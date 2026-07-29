<div align="center">

# Скриншоты Linspector

Обзор каждой вкладки и того, что в ней можно делать.

Назад к [README](README.ru.md) · [English](SCREENSHOTS.md)

</div>

---

## Fetch

<div align="center"><img src="screenshots/fetch.png" width="360" alt="Fetch" /></div>

Каждый вызов `fetch()`, который делает страница, сгруппированный по секторам по хосту. Клик по строке раскрывает полный URL, заголовки запроса и ответа, payload и форматированный JSON ответ. У каждого сектора есть Archive All и Clear, а любой запрос можно перенести в History крестиком или отправить сразу в Repeater.

## XHR

<div align="center"><img src="screenshots/xhr.png" width="360" alt="XHR" /></div>

То же живое представление для трафика `XMLHttpRequest`. Секторы, раскрываемые детали, Archive All, Clear и отправка в Repeater, отдельно от fetch, чтобы можно было сосредоточиться на одном транспорте.

## Streams

<div align="center"><img src="screenshots/streams.png" width="360" alt="Streams" /></div>

Соединения WebSocket и Server Sent Events с живым журналом кадров по каждому соединению. Каждый кадр помечен как отправленный, полученный, open, close или error с меткой времени, так что можно следить за realtime каналом в реальном времени.

## History

<div align="center"><img src="screenshots/history.png" width="360" alt="History" /></div>

Запросы, закрытые из вкладок трафика, попадают сюда. Восстановите один обратно в активный список или удалите навсегда. Удобный короткий список запросов, которые реально важны в текущей сессии.

## Intercept

<div align="center"><img src="screenshots/intercept.png" width="360" alt="Intercept" /></div>

Breakpoints. Включите их и задайте шаблон совпадения (подстрока или `/regex/`); подходящие fetch запросы встают на паузу перед отправкой. Отредактируйте URL, заголовки и тело, затем Forward отредактированного запроса, Drop или To Repeater.

## Repeater

<div align="center"><img src="screenshots/repeater.png" width="360" alt="Repeater" /></div>

Редактирование и повторная отправка любого запроса. Меняйте метод, URL, заголовки и тело, подключайте сохранённую сессию, жмите Send и читайте ответ на месте. Один клик экспортирует запрос в cURL, Python или сырой запрос Burp, либо пересылает его на relay Burp или Caido.

## Sessions

<div align="center"><img src="screenshots/sessions.png" width="360" alt="Sessions" /></div>

Пресеты заголовков Authorization или Cookie. Держите несколько личностей рядом, отметьте одну активной и по желанию внедряйте её во весь живой трафик. Смена активной сессии и повтор в Repeater это быстрый путь для проверок IDOR и контроля доступа.

## Scanner

<div align="center"><img src="screenshots/scanner.png" width="360" alt="Scanner" /></div>

Пассивные находки из трафика, отсортированные по уровню важности. Слабости JWT, утёкшие секреты и API ключи, раскрытие stack trace, проблемы CORS и отсутствующие security заголовки, каждая находка с хостом и копируемым фрагментом-доказательством.

## Attack

<div align="center"><img src="screenshots/attack.png" width="360" alt="Attack" /></div>

Наступательные инструменты. Библиотека пейлоадов XSS, SQLi, SSTI и SSRF, которые можно скопировать или вставить в тело Repeater, Response diff для построчного сравнения двух ответов и ручной декодер и аудитор JWT.

## Storage

<div align="center"><img src="screenshots/storage.png" width="360" alt="Storage" /></div>

Инспекция страницы для этого origin. Читайте, редактируйте, добавляйте и удаляйте ключи LocalStorage, смотрите доступные из JavaScript cookie с аудитом Secure, HttpOnly и SameSite для каждой.

## Settings

<div align="center"><img src="screenshots/settings.png" width="360" alt="Settings" /></div>

Настройка поведения: сохранение логов в LocalStorage, автоскролл, переключение пассивного сканера, минимальный статус-код, выбор темы, endpoint пересылки Burp или Caido, исключаемые домены и правила Tamper, которые автоматически заменяют текст в URL, теле или заголовках.

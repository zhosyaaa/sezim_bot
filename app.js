const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');

// Создание экземпляра Express приложения
const app = express();
const port = 3000; // Порт, на котором будет запущен сервер

// Создание экземпляра бота Telegram
const botToken = '7134028377:AAH0UHbDfjYX_bajNKC5VmYhSuJpXBv9OyE'; // Замените на ваш токен доступа
const bot = new Telegraf(botToken);

// Настройка обработчика команды /start
bot.start((ctx) => ctx.reply('Привет! Это бот для связи с веб-сайтом.'));

// Настройка обработчика текстовых сообщений
bot.on('text', (ctx) => {
    // Здесь можно обработать текст сообщения и выполнить необходимые действия
    // Например, отправить запрос на ваш веб-сайт для обработки данных
    ctx.reply('Ваше сообщение принято');
});

// Создание мидлвара для парсинга JSON
app.use(bodyParser.text());

// Маршрут для обработки данных от ноукод-сайта
app.post('/webhook', (req, res) => {
    const dataFromNoCode = req.body; // Получаем данные от ноукод-сайта
    console.log('Получены данные от ноукод-сайта:', dataFromNoCode);
    console.log(req);
    // Далее вы можете обработать данные и отправить нужные уведомления в ваш телеграм-бот
    res.sendStatus(200); // Отправляем ответ на запрос
});

// Запуск Express сервера
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});

const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');

const app = express();
const port = 3000; 

mongoose.connect('mongodb+srv://zhosya:zhosya@cluster0.gkkghab.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

const userDataSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String
});

const UserData = mongoose.model('UserData', userDataSchema);

const botToken = '7134028377:AAH0UHbDfjYX_bajNKC5VmYhSuJpXBv9OyE'; // Замените на ваш токен доступа
const bot = new Telegraf(botToken);

bot.start((ctx) => ctx.reply('Привет! Это бот для связи с веб-сайтом.'));

bot.on('text', (ctx) => {
    ctx.reply('Ваше сообщение принято');
});

app.use(bodyParser.text());

app.post('/webhook',async (req, res) => {
    const dataFromNoCode = req.body; 
    console.log('Получены данные от ноукод-сайта:', dataFromNoCode);
    const [name, email, phone] = dataFromNoCode.split(' / ');
    const newUser = new UserData({
        name: name,
        email: email,
        phone: phone
    });
    try {
        await newUser.save();
        console.log('Данные сохранены в базе данных');
        res.sendStatus(200); 
    } catch (error) {
        console.error('Ошибка при сохранении данных в базе данных:', error);
        res.sendStatus(500); 
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});

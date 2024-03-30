const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');

const app = express();
const port = 3000; 

mongoose.connect('mongodb+srv://zhosya:zhosya@cluster0.gkkghab.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

const userSchema = new mongoose.Schema({
    username: String,
    role:String    
})
const orderData = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    usernameSeller: String,
    usernameBuyer: String
});

const Order = mongoose.model('Order', orderData);
const User = mongoose.model("users", userSchema)

const botToken = '7134028377:AAH0UHbDfjYX_bajNKC5VmYhSuJpXBv9OyE'; // Замените на ваш токен доступа
const bot = new Telegraf(botToken);

bot.start((ctx) => ctx.reply('Привет! Это бот для связи с веб-сайтом.'));
bot.help((ctx) => ctx.reply('Список доступных команд:\n/assignrole <username> <role> - Назначить роль пользователю'));

bot.command('assignrole', async (ctx) => {
    const usernameC = ctx.message.from.username;
    const args = ctx.message.text.split(' ').slice(1);
    const username = args[0];
    const role = args[1];

    console.log(usernameC, username, role)
    try {
        const user = await User.findOne({ username: usernameC });

        console.log(user)
        if (!user) {
            return ctx.reply('У вас нет доступа для выполнения этой команды');
        }
        if (user.role !== 'admin') {
            return ctx.reply('У вас нет доступа для выполнения этой команды');
        }
        let targetUser = new User({
            username: username,
            role: role
        });
        await targetUser.save();
        ctx.reply(`Роль для пользователя ${username} успешно обновлена`);
    } catch (error) {
        console.error('Error assigning role:', error);
        ctx.reply('Ошибка при обновлении роли пользователя');
    }
});

app.use(bodyParser.text());

app.post('/webhook',async (req, res) => {
    const dataFromNoCode = req.body; 
    const [name, email, phone, seller, buyer] = dataFromNoCode.split(' / ');
    const newOrder = new Order({
        name: name,
        email: email,
        phone: phone,
        usernameSeller: seller, 
        usernameBuyer: buyer
    });
    try {
        await newOrder.save();
        console.log('Данные сохранены в базе данных');
        res.sendStatus(200); 
    } catch (error) {
        console.error('Ошибка при сохранении данных в базе данных:', error);
        res.sendStatus(500); 
    }
});
bot.launch();

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});

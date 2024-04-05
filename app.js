const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail', 
    auth: {
      user: 'musabecova05@gmail.com', 
      pass: '' 
    }
  });

  function generateRandomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString(); 
    }

const app = express();
const port = 3000; 
app.use(bodyParser.text());
mongoose.connect('mongodb+srv://zhosya:zhosya@cluster0.gkkghab.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

// ///////////////////////////////////////////
const userSchema = new mongoose.Schema({
    chatid: String,
    role:String,
    name:String   
})
const orderData = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    usernameSeller: String,
    usernameBuyer: String,
    status: String
});
const regSeller = new mongoose.Schema({
    chatId: String,
    name:String
})
const feedbackSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    userId: {
        type: String, 
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// ////////////////////////////////////////////
const Order = mongoose.model('Order', orderData);
const User = mongoose.model("users", userSchema)
const RegSeller = mongoose.model("regSeller", regSeller)
const Feedback = mongoose.model('Feedback', feedbackSchema);

// ///////////////////////////////////////////////////////////
const botToken = '7134028377:AAH0UHbDfjYX_bajNKC5VmYhSuJpXBv9OyE'; // Замените на ваш токен доступа
const bot = new Telegraf(botToken);

bot.start((ctx) => ctx.reply('Привет! Это бот для связи с веб-сайтом.'));
bot.help((ctx) => {
    const helpMessage = `
        Список доступных команд:
        /code <код с почты> - зарегистировать заказ
        /trackorder - Отследить заказ
        /feedback - Оставить отзыв
    `;
    ctx.reply(helpMessage);
});

bot.action(/accept:.*|reject:.*/, async (ctx) => {
    const action = ctx.match[0];
    const requestId = action.split(':')[1];
    const sellerRequest = await RegSeller.findOne({ chatId: requestId });

    if (!sellerRequest) {
        return ctx.reply('Запрос не найден');
    }

    const chatId = sellerRequest.chatId;
    
    if (action.startsWith('accept')) {
        try {
        let newUser = new User({
            chatid: chatId,
            role: 'seller',
            name: sellerRequest.name
        });
        await newUser.save();
        await RegSeller.deleteOne({ chatId: requestId });
        await bot.telegram.sendMessage(chatId, `Ваш запрос на регистрацию магазина "${sellerRequest.name}" принят.`);
        
        ctx.reply(`Запрос от магазина "${sellerRequest.name}" принят`);
    } catch (error) {
        console.error('Error accepting seller request:', error);
        ctx.reply('Ошибка при принятии запроса');
    }
    } else if (action.startsWith('reject')) {
        try {
            await RegSeller.deleteOne({ chatId: requestId });
            await bot.telegram.sendMessage(chatId, `Ваш запрос на регистрацию магазина "${sellerRequest.name}" отклонен.`);
            ctx.reply(`Запрос от магазина "${sellerRequest.name}" отклонен`);
        } catch (error) {
            console.error('Error rejecting seller request:', error);
            ctx.reply('Ошибка при отклонении запроса');
        }
    }
});

bot.command('allorders', async(ctx)=>{
    const chatId = ctx.chat.id
    try {        
        const user = await User.findOne({ chatid: chatId });
        if (!user) {
            return ctx.reply('У вас нет доступа для выполнения этой команды');
        }
        if (user.role != "seller") {
            return ctx.reply('У вас нет доступа для выполнения этой команды');
        }

        const orders = await Order.find({usernameSeller: chatId})
        if (orders.length === 0) {
            return ctx.reply('У вас нет активных заказов');
        }
        let response = "Список всех заказов:\n";
        orders.forEach((order, index) => {
            response += `\nЗаказ ${index + 1}:\n`;
            response += `Имя: ${order.name}\n`;
            response += `Email: ${order.email}\n`;
            response += `Телефон: ${order.phone}\n`;
            response += `---------------------------\n`;
        });
        const replyMarkup = {
            inline_keyboard: [[{ text: 'Изменить статус заказа', callback_data: 'changeStatus' }]]
        };

        ctx.reply(response, { reply_markup: replyMarkup });
    } catch (error) {
        console.error('Error assigning role:', error);
        ctx.reply('Ошибка при обновлении роли пользователя');
    }
})

bot.command("code", async(ctx)=>{
    const args = ctx.message.text.split(' ').slice(1);
    const code = args[0];
    const chatId = ctx.chat.id
    try {
        const order = await Order.findOne({ usernameBuyer: code });
        if (!order) {
            return ctx.reply('Заказ не найден');
        }
        order.usernameBuyer = chatId
        await order.save()
        
        await bot.telegram.sendMessage(order.usernameSeller, `Новый заказ от пользователя ${order.name} (${order.email}). Пожалуйста, обработайте его.`);
        ctx.reply(`Спасибо за ваш заказ, ${order.name}! Мы свяжемся с вами по указанным контактным данным.`);
    } catch (error) {
        console.error('Error assigning role:', error);
        ctx.reply('Ошибка при обновлении роли пользователя');
    }
})
bot.command('regseller', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    const name = args[0];
    const chatId = ctx.chat.id
    console.log(name, chatId)
    try {
        let newSeller = new RegSeller({
            chatId: chatId,
            name: name
        })
        await newSeller.save();

        const user = await User.findOne({ role: "admin" });
        if (!user) {
            return ctx.reply('У вас нет доступа для выполнения этой команды');
        }

        await bot.telegram.sendMessage(
            user.chatid,
            `Запрос на регистрацию магазина ${name}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Принять', callback_data: `accept:${chatId}` }],
                        [{ text: 'Отклонить', callback_data: `reject:${chatId}` }]
                    ]
                }
            }
        );
        
        ctx.reply(`Запрос на регистрацию отправлен`);
    } catch (error) {
        console.error('Error assigning role:', error);
        ctx.reply('Ошибка при обновлении роли пользователя');
    }
});

// //////////////////////////////////////////////////
app.post('/webhook', async (req, res) => {
    const dataFromNoCode = req.body; 
    const [name, email, phone, seller, buyer] = dataFromNoCode.split(' / ');
    const randomCode = generateRandomCode();
    const mailOptions = {
        from: 'musabecova05@gmail.com', 
        to: email, 
        subject: 'Send code', 
        text: `send this code to the bot https://t.me/zhosyaaa_bot : ${randomCode}`
    };
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.error(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
    const sellerid = await User.findOne({name : seller})
    if (!sellerid) {
        return res.send('У вас нет доступа для выполнения этой команды');
    }
    const newOrder = new Order({
        name: name,
        email: email,
        phone: phone,
        usernameSeller: sellerid.chatid, 
        usernameBuyer: randomCode,
        status: "в очереди"
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

function isValidURL(url) {
    return url.startsWith("https://");
}

bot.action('changeStatus', async (ctx) => {
    ctx.reply('Введите номер заказа для изменения статуса:');
    let stage = 0;
    let orderId;
    let newStatus;
    bot.on('text', async (ctx) => {
        if (stage === 0) {
            orderId = parseInt(ctx.message.text);
            const order = await Order.findOne({ usernameSeller: ctx.chat.id }).skip(orderId - 1);

            if (!order) {
                return ctx.reply('Заказ с указанным номером не найден');
            }
            const statusOptions = ['в очереди', 'в процессе','собрано', 'в пути', 'доставлено'];
            const optionsKeyboard = statusOptions.map(status => [{ text: status }]);
            ctx.reply('Выберите новый статус заказа:', {
                reply_markup: {
                    keyboard: optionsKeyboard,
                    one_time_keyboard: true,
                    resize_keyboard: true
                }
            });
            stage = 1;
        } else if (stage === 1) {
            newStatus = ctx.message.text.trim();
            const statusOptions = ['в очереди', 'в процессе', 'собрано', 'в пути', 'доставлено'];
            if (!statusOptions.includes(newStatus)) {
                return ctx.reply('Пожалуйста, выберите статус из предложенных опций.');
            }
            if (newStatus === 'собрано') {
                stage = 2;
            }  else if (newStatus === 'в пути') {
                ctx.reply('Пожалуйста, отправьте ссылку для отслеживания заказа.');
                stage = 3;
            } else {
                const order = await Order.findOne({ usernameSeller: ctx.chat.id }).skip(orderId - 1);
                order.status = newStatus;
                await order.save();
                await bot.telegram.sendMessage(order.usernameBuyer, `Статус вашего заказа №${orderId} изменен на "${newStatus}"`);
                ctx.reply(`Статус заказа №${orderId} успешно изменен на "${newStatus}"`);
                stage = 0;
            }
        }  
        if (stage === 2) {
            ctx.reply('Пожалуйста, отправьте фото собранного заказа.');
            bot.on('photo', async (ctx) => {
                const photo = ctx.message.photo[ctx.message.photo.length - 1];
                console.log("Received photo:", photo);
        
                const order = await Order.findOne({ usernameSeller: ctx.chat.id }).skip(orderId - 1);
                    await bot.telegram.sendPhoto(order.usernameBuyer, photo.file_id, {
                    caption: 'заказ собран, отправлять?',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Лайк', callback_data: 'like' }, { text: 'Дизлайк', callback_data: 'dislike' }]
                        ]
                    }
                });
                order.status = newStatus;
                await order.save();
                ctx.reply('Фото отправлено покупателю. Ожидайте его реакции.');
        
                stage = 0; 
            });
        }
        if (stage === 3) {
            const text = ctx.message.text;
            if (isValidURL(text)) {
                const order = await Order.findOne({ usernameSeller: ctx.chat.id }).skip(orderId - 1);
                order.status = newStatus;
                await order.save();
                await bot.telegram.sendMessage(order.usernameBuyer, `Вы можете отслеживать курьера по ссылке: ${text}`);
                ctx.reply('Ссылка отправлена покупателю.');
                stage = 0;
            } 
        }
    });
});

bot.action('like', async (ctx) => {
    const order = await Order.findOne({ usernameBuyer: ctx.chat.id });
    await bot.telegram.sendMessage(order.usernameSeller, `покупатель подтвердил. можете отправлять заказ`);
    ctx.reply('Спасибо! Ожидайте ссылка для отслеживания заказа 👍');
});

bot.action('dislike', async (ctx) => {
    const order = await Order.findOne({ usernameBuyer: ctx.chat.id });
    await bot.telegram.sendMessage(order.usernameSeller, `свяжитесь с покупателем по номеру ${order.phone} чтобы обсудить правки в заказ`);
    ctx.reply(`Спасибо! с вами скоро свяжутся`);
});

bot.command('trackorder', async (ctx) => {
    const chatId = ctx.chat.id;
    const orders = await Order.find({ usernameBuyer: chatId });

    if (orders.length === 0) {
        return ctx.reply('У вас нет активных заказов.');
    }
    let response = "Ваши активные заказы и их статусы:\n";
    orders.forEach((order) => {
        response += `\nЗаказ №${order._id}: ${order.status}\n`;
    });
    ctx.reply(response);
});
bot.command('feedback', async(ctx)=>{
    ctx.reply('Пожалуйста, введите ваш отзыв:');
    bot.on('text', async (ctx) => {
        const feedback = ctx.message.text;
        
        try {
            const newFeedback = new Feedback({ text: feedback, userId: ctx.from.id });
            await newFeedback.save();
            ctx.reply('Спасибо за ваш отзыв! Мы ценим ваше мнение.');
        } catch (error) {
            console.error('Ошибка при сохранении отзыва:', error);
            ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    });
})
bot.launch();
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});

const express = require('express');
const fs = require("fs");
const cron = require('node-cron');

const Actions_send = require('../mail/sendByEmail');

const mixin = { appName: 'My app' }; //по сути бесполезная тема, но без нее не отображается поле description в логах... 
const pino = require('pino');
const expressPino = require('express-pino-logger');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' || 'error' }, pino.destination({ dest: "./logs/info.log", sync: true }), {
    mixin() {
        return mixin;
    }
});
const expressLogger = expressPino({ logger });

const filePath = 'db/notification.json';
const log_file = './logs/info.log';

exports.create_notify = (req, res) => {
    const lengthBodyObj = Object.keys(req.body).length;

    if (!lengthBodyObj) {
        return res.status(400).send("incorrect data in the header");
    }

    const { name, text } = req.body;
    const notification = {};

    let data = fs.readFileSync(filePath, "utf8");
    const storage = JSON.parse(data);

    if (!storage.length) {
        notification.id = 0;
        notification.create_time = (new Date()).getTime(); //запись времени создания уведомления :: это время в секундах, его удобнее фильтровать, сравнивать и тд. Чтобы представить в человеческом виде нужно какой нибудь переменной присвоить " = new Date(notification.create_time)";
        notification.update_time = (new Date()).getTime(); //запись времени изменения уведомления
        notification.name = req.body.name; //запись названия уведомления
        notification.text = req.body.text;

        storage.push(notification);

        data = JSON.stringify(storage);

        fs.writeFile(filePath, data, (err) => {
            if (err) console.log(err);
        })
    }
    else {
        const notifications = JSON.parse(data);

        notification.create_time = (new Date()).getTime(); //запись времени создания уведомления

        const id = Math.max.apply(Math, notifications.map(function (o) { return o.id; }))

        notification.id = id + 1;

        notifications.push(notification);
        data = JSON.stringify(notifications);
        fs.writeFileSync(filePath, data);
    }

    var today = new Date();
    var year = today.getFullYear();

    if (req.body.type == 1) //One-Time
    {
        cron.schedule(req.body.minute + ' ' + req.body.hour + ' ' + req.body.day + ' ' + req.body.month + ' *', () => {
            Actions_send.send_by_email(notification.id);
        });

        return res.status(200).send('notification was created');
    }
    if (req.body.type == 2) //Daily
    {
        var d = today.getDate();
        var m = today.getMonth();
        var y = today.getFullYear();

        var D = new Date(y, m, d);

        if (typeof req.body.day !== 'undefined') //значит есть день окончания ежедневной рассылки (если undefined то просто каждый день без конца)
        {
            while (true) {
                D.setDate(D.getDate() + 1);
                d = D.getDate();
                m = D.getMonth() + 1;
                y = D.getFullYear();

                cron.schedule(req.body.minute + ' ' + req.body.hour + ' ' + d + ' ' + m + ' *', () => {
                    send(notification.id);
                });

                if (req.body.day == d && req.body.month == m)
                    return res.status(200).send('notification was created');
            }

        }
        else //просто каждый день в одно время
        {
            cron.schedule(req.body.minute + ' ' + req.body.hour + ' ' + '*' + ' ' + '*' + ' *', () => {
                Actions_send.send_by_email(notification.id);
            });

        }

        return res.status(200).send('notification was created');
    }
    if (req.body.type == 3) //Custom
    {
        for (var i = 0; i < req.body.count_of_days; i++) {
            cron.schedule(req.body.minute + ' ' + req.body.hour + ' ' + req.body.day[i] + ' ' + req.body.month[i] + ' *', () => {
                Actions_send.send_by_email(notification.id);

            });
        }

        return res.status(200).send('notification was created');
    }

    return res.status(200).send('notification was created');
}

exports.delete_all_notifications = (req, res) => {

    let data = fs.readFileSync(filePath, "utf8");
    const notifications = JSON.parse(data);

    notifications.splice(0, notifications.length);

    data = JSON.stringify(notifications);
    fs.writeFileSync(filePath, data);

    res.status(200).send("notifications were removed");
}

exports.get_notify_by_id = (req, res) => {
    const id = req.params.id;

    const data = fs.readFileSync(filePath, "utf8");
    const notifications = JSON.parse(data);

    const searchedNotification = notifications.filter((element) => {
        return element.id == id
    });

    if (!searchedNotification.length) {
        logger.info("Notification with ID = ${id} not founded"); ///////////////
        return res.status(404).send(`Notification with ID = ${id} not founded`);
    }

    res.status(200).send(`Notification with ID was received: ${JSON.stringify(searchedNotification)}`);
    logger.info("Notification with ID = ${id} founded and sended with response");//////////////////
}

exports.delete_notify_by_id = (req, res) => {
    const id = req.params.id;

    let data = fs.readFileSync(filePath, "utf8");
    const notifications = JSON.parse(data);

    const index = notifications.findIndex((element) => element.id == id);

    if (index === -1) {
        return res.status(404).send(`Notification with ID = ${id} not founded`);
    }

    const deletedNotification = notifications.splice(index, 1);

    data = JSON.stringify(notifications);
    fs.writeFileSync(filePath, data);

    res.status(200).send(`Notification with ID = ${id} was removed:  ${JSON.stringify(deletedNotification)}`);
}

exports.update_notify = (req, res) => {
    const id = req.params.id;
    const lengthBodyObj = Object.keys(req.body).length;

    if (!lengthBodyObj) {
        return res.status(400).send("incorrect data in the header");
    }

    let data = fs.readFileSync(filePath, "utf8");
    const notifications = JSON.parse(data);

    const text = req.body.text;


    const index = notifications.findIndex((element) => element.id == id);

    if (index === -1) {
        return res.status(404).send(`Notification with id = ${id} not founded`);
    }

    const currentText = notifications[index].text;

    if (currentText === text) {
        return res.status(400).send(`Notification with such data already exists`);
    }

    notifications[index].text = text;
    notification.update_time = (new Date()).getTime(); //запись времени изменения уведомления

    data = JSON.stringify(notifications);
    fs.writeFileSync(filePath, data);

    res.status(200).send(`Notification with id = ${id} was updated`);
}

exports.search_notify = (req, res) => {
    const option = req.query.attr;
    const value = req.query.value;

    let data = fs.readFileSync(filePath, "utf8");
    const notifications = JSON.parse(data);

    const findedNotifications = notifications.find((elememt) => {
        return elememt.text.search(value) !== -1;
    });

    res.status(200).send(findedNotifications);
}

exports.sort_notify = (req, res) => {
    const option = req.query.attr;
    const value = req.query.value;


    let data = fs.readFileSync(filePath, "utf8");
    const notifications = JSON.parse(data);

    const storageText = notifications.map((element) => {
        return element.text
    });

    if (value === 'inc') {
        storageText.sort();
    } else if (value === 'dec') {
        storageText.sort().reverse();
    }


    res.status(200).send(storageText);
}

exports.send = (req, res) => {

    const transporter = nodemailer.createTransport({
        port: 465,
        host: "smtp.gmail.com",
        service: "gmail",
        auth: {
            user: '',
            pass: '',
        },
        secure: true,
    });

    const mailOptions = {
        from: '',
        to: '',
        subject: 'Form send',
        text: "Hello",
        html: 'Content'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            res.status(401).json({ responseText: error }); //если выставить тип ошибки 500 то в логах будет куча ненужной фигни, которая вылезает обычно в консоли из за ошибки исполнения функции, поэтому выбрал 401 - неправильные учетные данные
            logger.info({ description: 'Error sending notification at first try' }, error.message);

            //Пытаемся отправить снова 

            setTimeout(() => {
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        res.status(401).json({ responseText: error }); //если выставить тип ошибки 500 то в логах будет куча ненужной фигни, которая вылезает обычно в консоли из за ошибки исполнения функции, поэтому выбрал 401 - неправильные учетные данные
                        logger.info({ description: 'Error sending notification at second try' }, error.message); //рядом с description можно добавить другие поля (например тип лога)


                        setTimeout(() => {
                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    res.status(401).json({ responseText: error });
                                    logger.info({ description: 'Error sending notification at third try' }, error.message);



                                    setTimeout(() => {
                                        transporter.sendMail(mailOptions, (error, info) => {
                                            if (error) {
                                                res.status(401).json({ responseText: error });
                                                logger.info({ description: 'Error sending notification at fourth try' }, error.message);

                                                //тут нужно отправить что-то администратору  
                                            }
                                            else
                                                res.status(200).json({ responseText: 'Message send!' });
                                        });
                                    }
                                        , 10 * 60 * 1000);


                                }
                                else
                                    res.status(200).json({ responseText: 'Message send!' });
                            });
                        }
                            , 5 * 60 * 1000);


                    }
                    else
                        res.status(200).json({ responseText: 'Message send!' });
                });
            }
                , 60 * 1000);


        }
        else
            res.status(200).json({ responseText: 'Message send!' });
    })

}

exports.send_logs = (req, res) => {
    const logs = {};
	let i = 0;

	fs.readFileSync(log_file).toString().split('\n').forEach(line => {
		try {
			a = JSON.parse(line);
			logs[i.toString()] = JSON.parse(line);
			console.log(line);
			console.log();
		} catch(e) {
			console.log(e);
		}
		
		i++;
	});
    res.status(200).json(logs);
};
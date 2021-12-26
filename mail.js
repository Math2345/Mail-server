const express = require("express");
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require("fs");
const { Router } = require("express");

var cron = require('node-cron');

/////////////////////////////////////////////////////
const mixin = {appName: 'My app'}; //по сути бесполезная тема, но без нее не отображается поле description в логах... 
const pino = require('pino'); ///
const expressPino = require('express-pino-logger'); ///
const logger = pino({level: process.env.LOG_LEVEL || 'info' || 'error'}, pino.destination({dest : "./logs/info.log", sync: true}),{ mixin() {
       return mixin;
}});///
const expressLogger = expressPino({logger});///
/////////////////////////////////////////////////////////

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressLogger);////////////////////////////////////////////////
const route = express.Router();

const port = process.env.PORT || 3000;
const filePath = 'db/notification.json';
const log_file = 'logs/info.log';


app.use('/api', route);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});



function send(id)
{
	const data = fs.readFile(filePath, "utf8");
    const notifications = JSON.parse(data);
	
	const searchedNotification = notifications.filter( (element) => {
        return element.id == id
    });
	
	if (!searchedNotification.length) 
	{
		return;
	}
	else
	{
		const transporter = nodemailer.createTransport({
			port: 465,
			host: "smtp.gmail.com",
			service : "gmail",
			auth: {
				user: '',
				pass: '',
			},
			secure: true,
		});


	  
		const mailOptions = {
			from: '',
			to: searchedNotification.to,
			subject: 'Form send',
			text: searchedNotification.text,
			html: 'Content'
		};
	  
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) 
			{
				//res.status(401).json({ responseText: error }); //если выставить тип ошибки 500 то в логах будет куча ненужной фигни, которая вылезает обычно в консоли из за ошибки исполнения функции, поэтому выбрал 401 - неправильные учетные данные
				logger.info({description : 'Error sending notification at first try'}, error.message);
				
				//Пытаемся отправить снова 
				
				setTimeout(() => 
					{
						transporter.sendMail(mailOptions, (error, info) => 
						{
							if (error) 
							{
								//res.status(401).json({ responseText: error }); //если выставить тип ошибки 500 то в логах будет куча ненужной фигни, которая вылезает обычно в консоли из за ошибки исполнения функции, поэтому выбрал 401 - неправильные учетные данные
								logger.info({description : 'Error sending notification at second try'}, error.message);
								
								
								setTimeout(() => 
									{
										transporter.sendMail(mailOptions, (error, info) => 
										{
											if (error) 
											{
												//res.status(401).json({ responseText: error }); //если выставить тип ошибки 500 то в логах будет куча ненужной фигни, которая вылезает обычно в консоли из за ошибки исполнения функции, поэтому выбрал 401 - неправильные учетные данные
												logger.info({description : 'Error sending notification at third try'}, error.message);
												
												///////////////////////////////////////////////////////
												setTimeout(() => 
													{
														transporter.sendMail(mailOptions, (error, info) => 
														{
															if (error) 
															{
																//res.status(401).json({ responseText: error }); //если выставить тип ошибки 500 то в логах будет куча ненужной фигни, которая вылезает обычно в консоли из за ошибки исполнения функции, поэтому выбрал 401 - неправильные учетные данные
																logger.info({description : 'Error sending notification at fourth try'}, error.message);
																
																
															}
															else
																res.status(200).json({ responseText: 'Message send!' });
														});
													}
												, 10 * 60 * 1000);
												////////////////////////////////////////////////////////
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
		});
			
	}
}

// cоздание уведомления
route.post('/notifications', (req, res) => {
    const lengthBodyObj = Object.keys(req.body).length;

    if (!lengthBodyObj) {
        return res.status(400).send("некоректные данные в заголовке");
    }
	
    const text = req.body.text;
    const notification = {text: text };

    let data = fs.readFileSync(filePath, "utf8");
    const storage = JSON.parse(data);
	
    if (!storage.length) 
	{
        notification.id = 0;
		notification.create_time = (new Date()).getTime(); //запись времени создания уведомления :: это время в секундах, его удобнее фильтровать, сравнивать и тд. Чтобы представить в человеческом виде нужно какой нибудь переменной присвоить " = new Date(notification.create_time)";
		notification.update_time = (new Date()).getTime(); //запись времени изменения уведомления
		notification.name = req.body.name; //запись названия уведомления

        storage.push(notification);

        data = JSON.stringify(storage);

        fs.writeFile(filePath, data, (err) => {
            if (err) console.log(err);
        })
    } 
	else 
	{
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
	//console.log(today.toLocaleDateString());
	if(req.body.type == 1) //One-Time
	{
		//console.log(req.body.day + "/" + req.body.month + "/" + year);
		
		console.log(req.body.minute + ' ' + req.body.hour + ' ' + req.body.day + ' ' + req.body.month + ' *');
		cron.schedule(req.body.minute + ' ' + req.body.hour + ' ' + req.body.day + ' ' + req.body.month + ' *', () => {
			send(notification.id);
			console.log(req.body.minute + ' ' + req.body.hour + ' ' + req.body.day + ' ' + req.body.month + ' *');
		});
		
		return res.status(200).send('уведомление создано');
	}
	if(req.body.type == 2) //Daily
	{
		var d = today.getDate();
		var m = today.getMonth();
		var y = today.getFullYear();
		
		var D = new Date(y,m,d);
		
		if(typeof req.body.day !== 'undefined') //значит есть день окончания ежедневной рассылки (если undefined то просто каждый день без конца)
		{
			while(true)
			{
				D.setDate(D.getDate() + 1);
				d = D.getDate();
				m = D.getMonth() + 1;
				y = D.getFullYear();
					
					
				console.log(req.body.minute + ' ' + req.body.hour + ' ' + d + ' ' + m + ' *');
				cron.schedule(req.body.minute + ' ' + req.body.hour + ' ' + d + ' ' + m + ' *', () => {
					send(notification.id);
					console.log(req.body.minute + ' ' + req.body.hour + ' ' + d + ' ' + m + ' *');
				});
				//console.log(d + '/' + m +'/' + y);
				
				if(req.body.day == d && req.body.month == m)
					return res.status(200).send('уведомление создано');
			}
			
		}
		else //просто каждый день в одно время
		{
			console.log(req.body.minute + ' ' + req.body.hour + ' ' + '*' + ' ' + '*' + ' *');
			cron.schedule(req.body.minute + ' ' + req.body.hour + ' ' + '*' + ' ' + '*' + ' *', () => {
				send(notification.id);
				console.log(req.body.minute + ' ' + req.body.hour + ' ' + '*' + ' ' + '*' + ' *');
			});
				
		}
		
		return res.status(200).send('уведомление создано');
		
	}
	if(req.body.type == 3) //Custom
	{
		for (var i = 0; i < req.body.count_of_days; i++)
		{
			console.log(req.body.minute + ' ' + req.body.hour + ' ' + req.body.day[i] + ' ' + req.body.month[i] + ' *');
			cron.schedule(req.body.minute + ' ' + req.body.hour + ' ' + req.body.day[i] + ' ' + req.body.month[i] + ' *', () => {
					send(notification.id);
					console.log(req.body.minute + ' ' + req.body.hour + ' ' + req.body.day[i] + ' ' + req.body.month[i] + ' *');
				});
			
			//console.log(req.body.day[i] + "." + req.body.month[i] + "." + year);
		}
		
		return res.status(200).send('уведомление создано');
	}

    return res.status(200).send('уведомление создано');
});

//массовое удаление уведомлений
route.delete('/notifications', (req, res) => {

    let data = fs.readFileSync(filePath, "utf8");
    const notifications = JSON.parse(data);

    notifications.splice(0, notifications.length);

    data = JSON.stringify(notifications);
    fs.writeFileSync(filePath, data);

    res.status(200).send("уведомления удалены");
});

// получение уведомления по id
route.get('/notifications/:id', (req, res) => {
    const id = req.params.id;
	
    const data = fs.readFileSync(filePath, "utf8");
    const notifications = JSON.parse(data);

    const searchedNotification = notifications.filter( (element) => {
        return element.id == id
    });

    if (!searchedNotification.length) 
	{
		logger.info("Notification with ID = ${id} not founded"); ///////////////
		return res.status(404).send(`уведомление c id = ${id} не найдено`);
	}

    res.status(200).send(`уведомление c id = ${id} получено: ${JSON.stringify(searchedNotification)}`);
	logger.info("Notification with ID = ${id} founded and sended with response");//////////////////
});

//удаление уведомления по id
route.delete('/notifications/:id', (req, res) => {
    const id = req.params.id;

    let data = fs.readFileSync(filePath, "utf8");
    const notifications = JSON.parse(data);

    const index = notifications.findIndex( (element) => element.id == id );

    if (index === -1) {
        return res.status(404).send(`уведомление c id = ${id} не найдено`);
    }

    const deletedNotification = notifications.splice(index, 1);

    data = JSON.stringify(notifications);
    fs.writeFileSync(filePath, data);

    res.status(200).send(`уведомление c id = ${id} удалено:  ${JSON.stringify(deletedNotification)}`);
})


// обновления уведомления по id
route.patch('/notifications/:id', (req, res) => {
    const id = req.params.id;
    const lengthBodyObj = Object.keys(req.body).length;

    if (!lengthBodyObj) {
        return res.status(400).send("некоректные данные в заголовке");
    }

    let data = fs.readFileSync(filePath, "utf8");
    const notifications = JSON.parse(data);

    const text = req.body.text;
	

    const index = notifications.findIndex( (element) => element.id == id );

    if (index === -1) {
        return res.status(404).send(`уведомление c id = ${id} не найдено`);
    }
	
    const  currentText = notifications[index].text;
	

    if (currentText === text) {
        return res.status(400).send(`уведомление c такими данные уже существует`);
    }
   
    notifications[index].text = text;
	notification.update_time = (new Date()).getTime(); //запись времени изменения уведомления

    console.log(currentText);

    data = JSON.stringify(notifications);
    fs.writeFileSync(filePath, data);

    res.status(200).send(`уведомление c id = ${id} обновлено`);
})


// поиск уведомлений по тексту
route.get('/search', (req, res) => {

    const option = req.query.attr;
    const value = req.query.value;

    let data = fs.readFileSync(filePath, "utf8");
    const notifications = JSON.parse(data);

    const findedNotifications = notifications.find((elememt) => {
       return  elememt.text.search(value) !== -1;
    });

    res.status(200).send(findedNotifications);
})

//cортитировка по названию(по убыванию и возрастанию) 
route.get('/sorting', (req, res) => {
    const option = req.query.attr;
    const value = req.query.value;

   
    let data = fs.readFileSync(filePath, "utf8");
    const notifications = JSON.parse(data);

    const storageText = notifications.map( (element) => {
        return element.text
    });

    if (value === 'inc') {
        storageText.sort();
    } else if (value ==='dec') {
        storageText.sort().reverse();
    }


    res.status(200).send(storageText);
});

// моментальная отправка уведомлений на почту
route.post('/send', (req, res) => {
	const transporter = nodemailer.createTransport({
        port: 465,
        host: "smtp.gmail.com",
		service : "gmail",
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
		if (error) 
		{
			res.status(401).json({ responseText: error }); //если выставить тип ошибки 500 то в логах будет куча ненужной фигни, которая вылезает обычно в консоли из за ошибки исполнения функции, поэтому выбрал 401 - неправильные учетные данные
			logger.info({description : 'Error sending notification at first try'}, error.message);
			
			//Пытаемся отправить снова 
			
			setTimeout(() => 
				{
					transporter.sendMail(mailOptions, (error, info) => 
					{
						if (error) 
						{
							res.status(401).json({ responseText: error }); //если выставить тип ошибки 500 то в логах будет куча ненужной фигни, которая вылезает обычно в консоли из за ошибки исполнения функции, поэтому выбрал 401 - неправильные учетные данные
							logger.info({description : 'Error sending notification at second try'}, error.message); //рядом с description можно добавить другие поля (например тип лога)
							
							
							setTimeout(() => 
								{
									transporter.sendMail(mailOptions, (error, info) => 
									{
										if (error) 
										{
											res.status(401).json({ responseText: error }); 
											logger.info({description : 'Error sending notification at third try'}, error.message);
											
											
											
											setTimeout(() => 
												{
													transporter.sendMail(mailOptions, (error, info) => 
													{
														if (error) 
														{
															res.status(401).json({ responseText: error }); 
															logger.info({description : 'Error sending notification at fourth try'}, error.message); 
															
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
	});
});



//отправка логов в формате json
route.get('/logs', (req, res) => 
{
    var logs = {};
	var i = 0;
	fs.readFileSync(log_file).toString().split('\n').forEach(line => {
		try {
			a = JSON.parse(line);
			logs[i.toString()] = JSON.parse(line);
			console.log(line);
			console.log();
		} catch(e) {
			
		}
		
		i++;
	});
    res.status(200).json(logs);
});







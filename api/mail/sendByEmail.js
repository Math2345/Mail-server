const express = require("express");
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require("fs");


exports.send_by_email = function send(id) {
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
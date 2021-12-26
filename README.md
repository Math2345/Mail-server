# Mail server

Mail server sends notification by e-mail. The service represents open RESTful API, without interface.

The API implements the following endpoints:
* creating notifications
* removing all notifications
* removing notification by id
* getting notification by id
* updating notification
* searching notification by name
* sorting by name of increase or decrease
* instant mail of notifications

Notification is attributes:
* title
* text
* recipient
* date of creation
* update date

There are 3 types of notification sending:
* One-time
* Daily
* Custom


If an error occurs when sending a notification, you must resend after 1 minute, 5 minutes and 10 minutes.



## Installation
```
   npm run server
```

## Use Libs
* NODEMAILER is a module for Node.js applications to allow easy as cake email sending
* NODE-CRON is simple module for scheduling tasks
* PINO is a relatively popular Node.js logging library 


## Testing 
 To test the server, I used the program Postman. 

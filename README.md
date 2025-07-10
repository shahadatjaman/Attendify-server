# ZKTimey Server – Biometric Attendance Backend

This is the backend service for **ZKTimey**, a biometric attendance management system. Built with **NestJS**, it handles user authentication, attendance logging, shift scheduling, and real-time communication with **ZKTeco biometric devices** using a custom TCP/IP utility.

## 🚀 Features

- ✅ User & admin authentication (JWT-based)
- 📅 Attendance log management
- 🧑‍💼 Department & employee management
- ⏰ Shift & schedule logic
- 🔄 Real-time log sync from ZKTeco biometric devices
- 📡 TCP/IP socket integration using [`zkteco-terminal`](https://www.npmjs.com/package/zkteco-terminal)
- 🌐 REST API for client-side dashboard
- 📁 MongoDB with Mongoose ODM
- ⚙ Configurable `.env` support

## 🧪 Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB, Mongoose
- **Socket**: TCP/IP (ZKTeco protocol)
- **Cache**: Redis (optional)
- **Auth**: JWT + Refresh Tokens

## 📦 Installation

```bash
# Clone the repository
$ git clone https://github.com/shahadatjaman/Attendify-server.git
$ cd Attendify-server

# Install dependencies
$ npm install

# Create a .env file with the following variables
CLOUDINARY_NAME=CLOUDINARY_NAME
CLOUDINARY_API_KEY=CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=CLOUDINARY_API_SECRET
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_username
MAIL_PASS=your_mailtrap_password
FROM_EMAIL=no-reply@example.com
JWT_SECRET=JWT_SECRET

```

## 🖥 Run the Server

```bash
# Start in dev mode
$ npm run start:dev

# Or build and run in production
$ npm run build
$ npm run start:prod
```

## 🧠 ZKTeco Device Integration

The backend integrates with biometric devices using the [zkteco-terminal](https://www.npmjs.com/package/zkteco-terminal) package. The device IP and port are read from the frontend UI and used to establish a socket connection for log syncing.

## 🛠 API Overview

- `POST /auth/login` – login endpoint
- `GET /users` – list users
- `GET /departments` – list departments
- `GET /logs/today` – get latest attendance logs
- `GET /shifts` – list shifts
- `POST /users/auth/` – create user
- `POST /departments/` – create department
- `POST /logs` – create new log
- `POST /devices` – connect device (IP and PORT must forward from router)

> Full API docs coming soon (or use Postman collection).

## 🔗 Related Projects

- **Client Dashboard**: [zkteco-time-pro](https://github.com/shahadatjaman/zkteco-time-pro)
- **ZKTeco Package**: [zkteco-terminal](https://www.npmjs.com/package/zkteco-terminal)

## 🙌 Author

Built with ❤️ by [Shahadat Jaman](https://shahadatjaman.vercel.app)

## 🛡 License

[MIT](./LICENSE)

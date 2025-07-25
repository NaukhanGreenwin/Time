# Capital Fire and Security - Employee Sign-In App

A mobile-responsive web application that allows Capital Fire and Security employees to sign in using their mobile devices. The app captures GPS location, timestamps, and automatically emails this information to head office.

## Features

- Mobile-first responsive design
- GPS location capture using browser geolocation API
- Automatic email notifications to head office
- Cross-browser compatibility (iOS Safari, Android Chrome)
- Progressive Web App (PWA) capabilities
- Secure data handling and transmission

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Configure your email settings in `.env` file

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to `http://localhost:3000`

## Configuration

Edit the `.env` file with your email settings:

- `SMTP_HOST`: Your email provider's SMTP server
- `SMTP_USER`: Your email address
- `SMTP_PASS`: Your email password or app-specific password
- `HEAD_OFFICE_EMAIL`: Email address to receive sign-in notifications

## Production Deployment

1. Set environment variables on your server
2. Build the application: `npm run build`
3. Start the production server: `npm start`

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Rate limiting

## Browser Support

- iOS Safari 12+
- Android Chrome 70+
- Modern desktop browsers

## License

© 2024 Capital Fire and Security. All rights reserved.
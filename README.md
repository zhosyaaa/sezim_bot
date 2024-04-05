# Telegram Bot for SEZIM startup

## Features

- **Order Management**: Users can register orders through the bot, and sellers can track and manage them.
- **Seller Registration**: Sellers can request registration through the bot, which admins can accept or reject.
- **Feedback Collection**: Users can leave feedback via the bot.
- **Status Updates**: Sellers can update the status of orders and communicate with buyers.

## Installation

1. Clone this repository to your local machine.
2. Install dependencies using `npm install`.
3. Set up environment variables:
   - `BOT_TOKEN`: Your Telegram bot token.
   - `MONGO_URI`: MongoDB connection URI.
   - `GMAIL_USER`: Your Gmail email address for sending emails.
   - `GMAIL_PASS`: Your Gmail password.
4. Run the application using `npm start`.

## Usage

1. Start the bot by running the application.
2. Interact with the bot through Telegram commands and inline keyboards:
   - `/code <code>`: Register a new order.
   - `/trackorder`: Track the status of your orders.
   - `/feedback`: Leave feedback.
   - `/regseller <name>`: Request registration as a seller.
   - `/allorders`: View all orders (seller only).
3. Admins can manage seller registration requests through inline keyboard actions.

## Contributing

Contributions are welcome! Feel free to open issues or pull requests for feature requests, bug fixes, or improvements.
